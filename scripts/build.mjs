import {readFile,writeFile,mkdir,readdir,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {buildJournals} from './build-journals.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
const json=async name=>JSON.parse(await readFile(path.join(root,'data',name),'utf8'));
export async function build(){
 const library=await json('library.json'),citations=await json('citations.json'),boundaries=await json('boundary_candidates.json'),deadlines=await json('deadlines.json'),journalScope=await json('journal-scope.json');
 if(!Array.isArray(library.papers)||!library.papers.length)throw new Error('Canonical library has no papers; build stopped.');
 const out=path.join(root,'dist');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
 const names=(await readdir(path.join(root,'web'))).sort();const hash=createHash('sha256');
 for(const name of names){const b=await readFile(path.join(root,'web',name));hash.update(name).update(b);if(name!=='index.html')await copyFile(path.join(root,'web',name),path.join(out,name))}
 hash.update(JSON.stringify(library)).update(JSON.stringify(citations)).update(JSON.stringify(boundaries)).update(JSON.stringify(deadlines));const version=hash.digest('hex').slice(0,12);
 const html=(await readFile(path.join(root,'web/index.html'),'utf8')).replace(/\?v=[A-Za-z0-9_-]+/g,'?v='+version);await writeFile(path.join(out,'index.html'),html);
 for(const page of ['journals.html','deadlines.html'])await writeFile(path.join(out,page),(await readFile(path.join(root,'web',page),'utf8')).replace(/\?v=[A-Za-z0-9_-]+/g,'?v='+version));
 const stringify=x=>JSON.stringify(x).replaceAll('<','\\u003c');
 await writeFile(path.join(out,'data.js'),'window.LITERATURE_DATA='+stringify(library)+';\n');
 const slim={meta:Object.fromEntries(Object.entries(citations.meta).filter(([k])=>k!=='conflicts')),records:Object.fromEntries(Object.entries(citations.records).map(([id,r])=>[id,Object.fromEntries(Object.entries(r).filter(([k])=>['openalex_id','cited_by_count','retrieved_at','status','match_method'].includes(k)))]))};
 await writeFile(path.join(out,'citations.js'),'window.CITATION_DATA='+stringify(slim)+';\n');
 // The deadlines page lists the journals of the journal collection next to the conference deadlines.
 await writeFile(path.join(out,'deadlines-data.js'),'window.DEADLINE_DATA='+stringify({...deadlines,journals:journalScope.journals.map(j=>({id:j.id,title:j.title,official_url:j.official_url}))})+';\n');
 await writeFile(path.join(out,'deadlines.json'),JSON.stringify(deadlines,null,2)+'\n');
 for(const [name,value] of [['papers.json',library.papers],['citations.json',citations],['boundary_candidates.json',boundaries]])await writeFile(path.join(out,name),JSON.stringify(value,null,2)+'\n');
 const require=createRequire(import.meta.url),topics=require(path.join(root,'web/topics.js'));
 const records=library.papers.map(p=>({id:p.id,...topics.classify(p)}));const count=value=>library.papers.filter(p=>topics.matches(p,value)).length;
 await writeFile(path.join(out,'topics.json'),JSON.stringify({method:'Automatic topic signals; overlapping categories; no full-text validation.',counts:{total:records.length,time_series:count('time-series'),spatio_temporal:count('spatio-temporal'),both:count('both'),unclassified:count('unclassified')},records},null,2)+'\n');
 const journalCatalog=await buildJournals(root,out);
 await writeFile(path.join(out,'build-manifest.json'),JSON.stringify({journal_records:journalCatalog.records,journal_abstracts:journalCatalog.abstracts,journal_venues:journalCatalog.journals.length,journal_cutoff:journalCatalog.cutoff,content_version:version,records:library.papers.length,abstracts:library.papers.filter(p=>p.abstract).length,citation_matched:citations.meta.matched,snapshot_date:library.date},null,2)+'\n');
 console.log(`Built ${library.papers.length} records; content version ${version}`);return {version};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
