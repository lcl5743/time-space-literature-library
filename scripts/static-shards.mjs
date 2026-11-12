// Lossless static packaging with a 25 MiB per-file limit.
// The paper array in data.js and papers.json
// is split into ~8 MiB parts, the browser reconstruction is checked field by field before anything is written,
// and papers.json.gz keeps the byte-identical original. Scholarly fields, IDs, tags and citations are untouched.
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import vm from 'node:vm';
export const LIMIT=25*1024*1024,PART=8*1024*1024;
export const PART_FILE=/^(?:data-)?papers\.part-\d+\.(?:js|json)$/;
const hash=b=>createHash('sha256').update(b).digest('hex');
const PREFIX='window.LITERATURE_DATA=';

export async function shardDist(dir){
 const read=name=>readFile(path.join(dir,name));
 const original=await read('data.js'),papersOriginal=await read('papers.json');
 if(!original.toString().startsWith(PREFIX))throw new Error('Unexpected data.js; no files changed');
 const db=JSON.parse(original.toString().slice(PREFIX.length).trim().replace(/;$/,''));
 const papers=JSON.parse(papersOriginal.toString());
 if(!Array.isArray(papers)||!db.papers.length)throw new Error('Already partitioned or unexpected papers.json; no files changed');
 if(JSON.stringify(db.papers)!==JSON.stringify(papers))throw new Error('data.js and papers.json disagree; no files changed');
 const chunks=[];let current=[],bytes=2;
 for(const paper of papers){const size=Buffer.byteLength(JSON.stringify(paper))+1;if(size>PART)throw new Error('Single paper exceeds the part budget: '+paper.id);if(bytes+size>PART){chunks.push(current);current=[];bytes=2}current.push(paper);bytes+=size}
 if(current.length)chunks.push(current);
 const names=chunks.map((_,i)=>'papers.part-'+String(i+1).padStart(2,'0')),content=chunks.map(c=>JSON.stringify(c));
 const metadata=PREFIX+JSON.stringify({...db,papers:[]}).replaceAll('<','\\u003c')+';\n';
 const shardScripts=content.map(c=>'window.LITERATURE_DATA.papers.push(...'+c.replaceAll('<','\\u003c')+');\n');
 const context={window:{}};vm.createContext(context);vm.runInContext(metadata,context);for(const source of shardScripts)vm.runInContext(source,context);
 if(JSON.stringify(context.window.LITERATURE_DATA)!==JSON.stringify(db))throw new Error('Part reconstruction changed library data; no files changed');
 let html=(await read('index.html')).toString();const marker=/<script src="data\.js\?v=([^"]+)"><\/script>/;
 if(!marker.test(html))throw new Error('Expected data.js script tag not found; no files changed');
 html=html.replace(marker,(_,v)=>'<script src="data.js?v='+v+'-shards1"></script>'+names.map(n=>'<script src="data-'+n+'.js?v='+v+'-shards1"></script>').join(''));
 const manifest={format:'partitioned-json-array-v1',records:papers.length,parts:names.map((n,i)=>({url:n+'.json',records:chunks[i].length,sha256:hash(Buffer.from(content[i]+'\n'))})),complete_gzip_url:'papers.json.gz',original_sha256:hash(papersOriginal),note:'Concatenate the arrays in parts order, or decompress papers.json.gz for the byte-identical original papers.json.'};
 await writeFile(path.join(dir,'data.js'),metadata);
 for(let i=0;i<names.length;i++){await writeFile(path.join(dir,'data-'+names[i]+'.js'),shardScripts[i]);await writeFile(path.join(dir,names[i]+'.json'),content[i]+'\n')}
 await writeFile(path.join(dir,'papers.json.gz'),gzipSync(papersOriginal));
 await writeFile(path.join(dir,'papers.json'),JSON.stringify(manifest,null,2)+'\n');
 await writeFile(path.join(dir,'index.html'),html);
 for(const name of await readdir(dir)){const s=await stat(path.join(dir,name));if(s.isFile()&&s.size>LIMIT)throw new Error('Asset still exceeds the hosting limit: '+name)}
 return {adapter:'scripts/static-shards.mjs',reason:'Static hosting rejects files larger than 25 MiB',original_data_js_sha256:hash(original),original_papers_json_sha256:hash(papersOriginal),paper_records:papers.length,shards:chunks.length,papers_json_format:manifest.format,complete_papers_download:'dist/papers.json.gz',verification:'Reconstructed browser library is identical in every JSON field; gzip preserves original papers.json bytes'};
}
