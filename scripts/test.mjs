import {build,root} from './build.mjs';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
await build();
for(const name of (await readdir(path.join(root,'web'))).filter(n=>n.endsWith('.js')).sort())execFileSync(process.execPath,['--check',path.join(root,'web',name)],{stdio:'inherit'});
for(const name of (await readdir(path.join(root,'tests'))).filter(n=>n.endsWith('.test.cjs')).sort())execFileSync(process.execPath,[path.join(root,'tests',name)],{cwd:root,stdio:'inherit'});
