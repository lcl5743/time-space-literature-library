import {build,root} from './build.mjs';
import {shardDist} from './static-shards.mjs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
await build();
const info=await shardDist(path.join(root,'dist'));
await writeFile(path.join(root,'dist','.nojekyll'),'');
console.log(`Static release ready: ${info.paper_records} thematic records, ${info.shards} paper parts.`);
