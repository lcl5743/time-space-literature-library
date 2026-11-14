// Explicit collection command (npm run deadlines:collect); never runs during build or tests.
// Reads the venues declared in data/deadline-scope.json from the community-maintained ccfddl/ccf-deadlines
// repository at one pinned commit and rewrites data/deadlines.json. Any failure leaves the previous snapshot untouched.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {manifest} from './update-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));

// Minimal YAML reader for the block mappings, block sequences and one-line scalars used by the source files.
export function parseYaml(source){
 const lines=[];
 for(const raw of source.split(/\r?\n/)){
  let quote='',cut=raw.length;
  for(let k=0;k<raw.length;k++){const c=raw[k];if(quote){if(c===quote)quote=''}else if(c==="'"||c==='"')quote=c;else if(c==='#'&&(k===0||/\s/.test(raw[k-1]))){cut=k;break}}
  const text=raw.slice(0,cut).replace(/\s+$/,'');if(!text.trim()||text.trim()==='---')continue;
  if(/\t/.test(text.match(/^\s*/)[0]))throw new Error('Tabs in indentation are not supported');
  lines.push({indent:text.match(/^ */)[0].length,text:text.trim()});
 }
 let i=0;const isItem=t=>t==='-'||t.startsWith('- '),pair=/^([^\s'":][^:]*?)\s*:(?:\s+(.*))?$/;
 const scalar=s=>{s=s.trim();if(/^[|>]/.test(s)||/^[\[{&*!]/.test(s))throw new Error('Unsupported YAML value: '+s);if(/^'.*'$/.test(s))return s.slice(1,-1).replaceAll("''","'");if(/^".*"$/.test(s))return JSON.parse(s);if(/^-?\d+$/.test(s))return Number(s);if(s==='true'||s==='false')return s==='true';if(s==='null'||s==='~')return null;return s};
 const block=indent=>isItem(lines[i].text)?sequence(indent):mapping(indent);
 function sequence(indent){const out=[];
  while(i<lines.length&&lines[i].indent===indent&&isItem(lines[i].text)){
   const rest=lines[i].text.slice(1).trimStart();
   if(!rest){i++;out.push(i<lines.length&&lines[i].indent>indent?block(lines[i].indent):null);continue}
   const inner=indent+lines[i].text.length-rest.length;
   if(pair.test(rest)){lines[i]={indent:inner,text:rest};out.push(mapping(inner))}else{i++;out.push(scalar(rest))}
  }
  return out}
 function mapping(indent){const out={};
  while(i<lines.length&&lines[i].indent===indent&&!isItem(lines[i].text)){
   const m=pair.exec(lines[i].text);if(!m)throw new Error('Unsupported YAML line: '+lines[i].text);i++;
   if(m[2]!==undefined&&m[2]!=='')out[m[1]]=scalar(m[2]);
   else if(i<lines.length&&(lines[i].indent>indent||(lines[i].indent===indent&&isItem(lines[i].text))))out[m[1]]=block(lines[i].indent);
   else out[m[1]]=null;
  }
  return out}
 const value=lines.length?block(lines[0].indent):null;if(i<lines.length)throw new Error('Unsupported YAML structure near: '+lines[i].text);return value;
}

const ZONES={PT:'America/Los_Angeles',PST:'America/Los_Angeles',PDT:'America/Los_Angeles',ET:'America/New_York',EST:'America/New_York',EDT:'America/New_York',CET:'Europe/Paris',CEST:'Europe/Paris',BST:'Europe/London',GMT:'UTC'};
function zoneOffset(zone,instant){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(instant)).map(p=>[p.type,p.value]));
 return Date.UTC(+parts.year,parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second)-instant;
}
// A deadline is published as wall-clock time in a named zone; this returns the same instant in UTC, or null when it cannot be resolved.
export function toUTC(local,timezone){
 const m=/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(local||'')),tz=String(timezone||'').trim();if(!m||!tz)return null;
 const wall=Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6]);if(Number.isNaN(wall))return null;
 let instant=null;const fixed=/^(?:UTC|GMT)([+-])(\d{1,2})(?::?(\d{2}))?$/i.exec(tz);
 if(/^AoE$/i.test(tz))instant=wall+12*36e5;
 else if(/^(?:UTC|GMT)$/i.test(tz))instant=wall;
 else if(fixed)instant=wall-(fixed[1]==='-'?-1:1)*((+fixed[2])*36e5+(+(fixed[3]||0))*6e4);
 else if(ZONES[tz.toUpperCase()]){const zone=ZONES[tz.toUpperCase()];instant=wall-zoneOffset(zone,wall);instant=wall-zoneOffset(zone,instant)}
 return instant===null?null:new Date(instant).toISOString().replace('.000Z','Z');
}

const KINDS=[['abstract','abstract_deadline'],['paper','deadline'],['rebuttal','rebuttal_deadline'],['decision','decision_deadline']];
export function normalizeVenue(scope,entry){
 const editions=(entry.confs||[]).map(conf=>{
  const timezone=String(conf.timezone||'');
  const rounds=(conf.timeline||[]).map(step=>{const round={label:String(step.comment||'')};
   for(const [kind,key] of KINDS){const local=step[key];if(local===undefined||local===null)continue;const text=String(local);round[kind]=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)?{local:text,utc:toUTC(text,timezone)}:{local:null,utc:null,note:text}}
   return round});
  return {year:conf.year,official_url:String(conf.link||''),timezone,conference_dates:String(conf.date||''),place:String(conf.place||''),rounds};
 }).filter(e=>Number.isInteger(e.year)).sort((a,b)=>a.year-b.year);
 return {id:scope.id,name:scope.name,full_name:String(entry.description||''),area:scope.area,coverage:!!scope.coverage,rank:entry.rank||{},source_file:scope.file,editions};
}

async function get(url,type='text'){const r=await fetch(url,{headers:{'User-Agent':'time-space-literature-library deadlines collector (https://github.com/lcl5743/time-space-literature-library)'}});if(!r.ok)throw new Error(`HTTP ${r.status} for ${url}`);return r[type]()}
async function collect(){
 const scope=JSON.parse(await readFile(path.join(root,'data/deadline-scope.json'),'utf8'));
 const repo=scope.source.name,commit=(await get(`https://api.github.com/repos/${repo}/commits/main`,'json')).sha;
 if(!/^[0-9a-f]{40}$/.test(commit))throw new Error('Could not resolve the source commit');
 const venues=[];
 for(const v of scope.venues){
  const parsed=parseYaml(await get(`https://raw.githubusercontent.com/${repo}/${commit}/${v.file}`));
  if(!Array.isArray(parsed)||parsed.length!==1)throw new Error(`${v.file}: expected one conference entry`);
  const venue=normalizeVenue(v,parsed[0]);if(!venue.editions.length)throw new Error(`${v.file}: no editions`);
  for(const e of venue.editions)for(const r of e.rounds)for(const [kind] of KINDS)if(r[kind]?.local&&!r[kind].utc)throw new Error(`${v.name} ${e.year}: cannot resolve timezone "${e.timezone}"`);
  venues.push(venue);
 }
 const target=path.join(root,'data/deadlines.json');let previous=null;try{previous=JSON.parse(await readFile(target,'utf8'))}catch{}
 const flat=d=>new Map((d?.venues||[]).flatMap(v=>v.editions.map(e=>[v.name+' '+e.year,JSON.stringify(e)])));
 const before=flat(previous),after=flat({venues}),added=[...after.keys()].filter(k=>!before.has(k)),changed=[...after.keys()].filter(k=>before.has(k)&&before.get(k)!==after.get(k)),removed=[...before.keys()].filter(k=>!after.has(k));
 // A source edition that disappears is suspicious: stop and let a person look before anything is overwritten.
 if(removed.length&&!process.argv.includes('--allow-removals'))throw new Error('Editions missing from the source: '+removed.join(', ')+' (rerun with --allow-removals after checking)');
 const data={schema:1,retrieved_at:new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),source:{...scope.source,commit,commit_url:`https://github.com/${repo}/tree/${commit}`},note:'Deadlines are copied from a community-maintained list and are not verified against each call for papers. The official link of every edition is the authority.',venues};
 console.log(JSON.stringify({commit,venues:venues.length,editions:after.size,added,changed,removed,mode:process.argv.includes('--dry-run')?'dry-run':'write'},null,2));
 if(!process.argv.includes('--dry-run')){await writeFile(target,JSON.stringify(data,null,1)+'\n');await writeFile(path.join(root,'data/MANIFEST.sha256'),await manifest())}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collect();
