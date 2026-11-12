import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function buildJournals(root,out){
 const scope=JSON.parse(await readFile(path.join(root,'data/journal-scope.json'),'utf8'));
 const journals=[];
 for(const definition of scope.journals){
  let source;try{source=JSON.parse(await readFile(path.join(root,'data/journals',definition.id+'.json'),'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
  if(!source){journals.push({...definition,records:0,abstracts:0,parts:[],coverage:{api_status:'not-collected',publisher_directory_status:'not-reconciled',years:[]}});continue}
  const parts=[];let rows=[],bytes=2;
  async function flush(){if(!rows.length)return;const body=JSON.stringify(rows)+'\n',compressed=gzipSync(body),digest=sha(compressed),file='journal-'+definition.id+'-'+digest.slice(0,12)+'.json.gz';await writeFile(path.join(out,file),compressed);parts.push({url:file,encoding:'gzip',records:rows.length,sha256:digest,uncompressed_sha256:sha(body)});rows=[];bytes=2}
  for(const paper of source.papers){const size=Buffer.byteLength(JSON.stringify(paper))+1;if(size>6*1024*1024)throw Error('Journal record exceeds shard budget: '+paper.id);if(bytes+size>6*1024*1024)await flush();rows.push(paper);bytes+=size}await flush();
  journals.push({...definition,records:source.papers.length,abstracts:source.papers.filter(p=>p.abstract).length,parts,coverage:source.coverage});
 }
 const catalog={schema_version:1,start_year:scope.start_year,cutoff:scope.cutoff,scope_status:scope.scope_status,inclusion:scope.inclusion,journals,records:journals.reduce((n,j)=>n+j.records,0),abstracts:journals.reduce((n,j)=>n+j.abstracts,0),notice:'Crossref pagination coverage is not publisher issue reconciliation. All declared topics are retained. Tags are provisional; missing abstracts remain empty. Citation counts are not mixed with the OpenAlex conference snapshot.'};
 await writeFile(path.join(out,'journals-index.json'),JSON.stringify(catalog,null,2)+'\n');
 console.log(`Journal collection: ${catalog.records} records; ${catalog.journals.filter(j=>j.parts.length).length}/${journals.length} venues with records`);
 return catalog;
}
