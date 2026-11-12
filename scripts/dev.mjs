import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
import {build,root} from './build.mjs';
await build();const flag=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1]};
const host=flag('--host','127.0.0.1'),port=Number(flag('--port','5173')),base=path.join(root,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 try{const url=new URL(req.url,'http://localhost'),decoded=decodeURIComponent(url.pathname),file=path.resolve(base,'.'+(decoded.endsWith('/')?decoded+'index.html':decoded));const relative=path.relative(base,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end();return}
  if(!(await stat(file)).isFile())throw new Error('not a file');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(404);res.end('Not found')}
});server.listen(port,host,()=>console.log(`Local preview: http://${host}:${port}`));
