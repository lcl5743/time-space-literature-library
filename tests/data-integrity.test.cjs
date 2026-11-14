const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const library=read('data/library.json'),citations=read('data/citations.json');
const ids=new Set(library.papers.map(p=>p.id));
assert.equal(ids.size,library.papers.length,'Duplicate stable paper IDs');
for(const p of library.papers){assert.ok(p.id&&p.title,'Paper lacks ID/title');}
assert.equal(Object.keys(citations.records).length,library.papers.length);
let matched=0;
for(const [id,r] of Object.entries(citations.records)){
 assert.ok(ids.has(id),'Citation belongs to an unknown paper');
 if(r.status==='matched'){matched++;assert.ok(Number.isInteger(r.cited_by_count)&&r.cited_by_count>=0);}
 else assert.equal(r.cited_by_count,null,'Unknown citations must remain null');
}
assert.equal(matched,citations.meta.matched,'Citation summary differs from records');
assert.deepEqual(read('dist/papers.json'),library.papers,'Build changed canonical papers');
assert.equal(read('dist/build-manifest.json').records,ids.size);
for(const f of fs.readdirSync(path.join(root,'web'))){
 const body=fs.readFileSync(path.join(root,'web',f),'utf8');
 assert.ok(!/\/Users\/cl\/|\.docx|github_pat_|ghp_[A-Za-z0-9]{20}/.test(body),`Private local context in ${f}`);
}
import('../scripts/update-manifest.mjs').then(async m=>{assert.equal(fs.readFileSync(path.join(root,'data/MANIFEST.sha256'),'utf8'),await m.manifest(),'data/MANIFEST.sha256 is stale; run npm run manifest');
 console.log('Canonical IDs, citation nulls, snapshot counts, checksums and generated data integrity passed')}).catch(e=>{console.error(e);process.exit(1)});
