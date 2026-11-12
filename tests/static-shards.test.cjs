const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
(async()=>{
 const {shardDist,LIMIT}=await import('../scripts/static-shards.mjs');
 const src=path.join(__dirname,'../dist'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tsl-shards-'));
 for(const f of fs.readdirSync(src))fs.copyFileSync(path.join(src,f),path.join(tmp,f));
 const original=fs.readFileSync(path.join(tmp,'papers.json'));
 const info=await shardDist(tmp);assert.ok(info.shards>=2);
 for(const f of fs.readdirSync(tmp))assert.ok(fs.statSync(path.join(tmp,f)).size<=LIMIT,'Over the hosting limit: '+f);
 // Run the data scripts in the order index.html loads them, as a browser would.
 const html=fs.readFileSync(path.join(tmp,'index.html'),'utf8'),scripts=[...html.matchAll(/<script src="((?:data|data-papers\.part-\d+)\.js)\?v=[^"]+"><\/script>/g)].map(m=>m[1]);
 assert.equal(scripts[0],'data.js');assert.equal(scripts.length,info.shards+1);
 const ctx={window:{}};vm.createContext(ctx);for(const s of scripts)vm.runInContext(fs.readFileSync(path.join(tmp,s),'utf8'),ctx);
 const lib=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/library.json'),'utf8'));
 assert.equal(JSON.stringify(ctx.window.LITERATURE_DATA),JSON.stringify(lib),'Reconstructed library differs');
 assert.ok(zlib.gunzipSync(fs.readFileSync(path.join(tmp,'papers.json.gz'))).equals(original),'papers.json.gz is not the original');
 await assert.rejects(()=>shardDist(tmp),/Already partitioned/);
 fs.rmSync(tmp,{recursive:true,force:true});
 console.log(`PASS: lossless ${info.shards}-part packaging, every file under 25 MiB, browser reconstruction identical`);
})().catch(e=>{console.error(e);process.exit(1)});
