const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const U=require('../web/journal-utils.js'),root=path.join(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const core=[{id:'a',doi:'10.1/a',title:'A result in statistical theory',authors:[],year:2010,topics:['inference'],article_kind:'research-or-unspecified'},{id:'b',doi:'',official_url:'https://example.org/b',title:'Time series causality',authors:[{name:'Researcher'}],year:2026,topics:['time-series','causal'],article_kind:'research-or-unspecified'},{id:'c',doi:'',official_url:'https://example.org/c',title:'Another paper without DOI',authors:[],year:2015,topics:['other-statistics'],article_kind:'discussion'}];
const state={year:'',topic:'',kind:'',query:'',sort:'new',saved:false};
assert.equal(U.filter(core,state).length,3,'All topics must remain available by default');
assert.deepEqual(U.filter(core,{...state,topic:'time-series'}).map(p=>p.id),['b']);
assert.equal(U.filter(core,{...state,topic:'outside-focus'}).length,2);
assert.equal(U.filter(core,{...state,query:'researcher'}).length,1);
assert.equal(U.filter(core,{...state,year:'2010'}).length,1);
assert.equal(U.filter(core,{...state,saved:true},{a:{saved:true}})[0].id,'a');
assert.equal(U.mergeRecords([core,[core[0]]]).length,3,'DOI-less publisher records must not collapse');
for(const payload of ['=1+1','+cmd','-2','@SUM(A1)','\t=1','\r=1'])assert.ok(U.csvCell(payload).startsWith('"\''));
assert.equal(U.csvCell('a,"b"\nc'),'"a,""b""\nc"');
const scope=read('data/journal-scope.json'),index=read('dist/journals-index.json');
assert.equal(scope.journals.filter(j=>j.core).length,4);assert.equal(scope.journals.filter(j=>j.scope_origin==='researcher-list').length,49);
let total=0;const ids=new Set();
for(const j of index.journals){
 const source=read('data/journals/'+j.id+'.json');assert.equal(j.records,source.papers.length);assert.ok(source.coverage.all_topics_included);
 const built=[];
 for(const part of j.parts){const bytes=fs.readFileSync(path.join(root,'dist',part.url));assert.ok(bytes.length<25*1024*1024);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),part.sha256);const raw=part.encoding==='gzip'?zlib.gunzipSync(bytes):bytes;if(part.uncompressed_sha256)assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),part.uncompressed_sha256);built.push(...JSON.parse(raw))}
 assert.deepEqual(built,source.papers,'Journal shards changed source fields');
 for(const p of built){assert.ok(p.id&&p.title&&p.official_url);assert.ok(!ids.has(p.id),'Duplicate stable journal ID: '+p.id);ids.add(p.id);assert.ok(p.year>=2010&&p.year<=2026);assert.equal(p.citation_count,null);assert.equal(p.reading_status,'Not started');assert.equal(p.download_status,'Not started');assert.equal(p.ai_summary,'');}
 assert.equal(j.abstracts,built.filter(p=>p.abstract).length);total+=built.length;
 if(j.coverage.api_status==='crossref-enumerated')assert.equal(j.records,j.coverage.expected_crossref_records);
}
assert.equal(total,index.records);
console.log(`PASS: ${index.journals.length} journal inventories, ${total} records, lossless shards, core-four all-topic inclusion, DOI-less deduplication and safe CSV`);
(async()=>{const part=index.journals.find(j=>j.parts.length).parts[0],bytes=fs.readFileSync(path.join(root,'dist',part.url));const rows=await U.decodePart(new Response(bytes),part);assert.equal(rows.length,part.records);assert.deepEqual(rows,JSON.parse(zlib.gunzipSync(bytes)));console.log('PASS: streamed gzip journal decoder preserves complete source records')})().catch(error=>{console.error(error);process.exitCode=1});
