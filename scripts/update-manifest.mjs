// Rewrites data/MANIFEST.sha256 (npm run manifest) after a data change; tests compare it with the files.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=path.join(root,'data');
export async function manifest(){
 const names=(await readdir(dir,{recursive:true,withFileTypes:true})).filter(e=>e.isFile()&&e.name!=='MANIFEST.sha256'&&!e.name.startsWith('.')).map(e=>path.relative(dir,path.join(e.parentPath,e.name)).split(path.sep).join('/')).sort((a,b)=>a<b?-1:a>b?1:0);
 let out='';for(const name of names)out+=createHash('sha256').update(await readFile(path.join(dir,name))).digest('hex')+'  '+name+'\n';return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){await writeFile(path.join(dir,'MANIFEST.sha256'),await manifest());console.log('data/MANIFEST.sha256 updated')}
