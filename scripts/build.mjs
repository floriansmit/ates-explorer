import {mkdir,readdir,rm,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
// Keep the output directory inode stable for the managed preview server.
await mkdir('dist',{recursive:true});
for(const entry of await readdir('dist'))await rm(`dist/${entry}`,{recursive:true,force:true});
for(const entry of await readdir('src'))await cp(`src/${entry}`,`dist/${entry}`,{recursive:true});
execFileSync('python3',['-c',`import zipfile,pathlib
files=list(map(str,pathlib.Path('src').rglob('*')))+['README.md','HANDOVER.md','package.json']
with zipfile.ZipFile('dist/ates-explorer-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in files+list(map(str,pathlib.Path('tests').glob('*.js')))+['scripts/build.mjs']+list(map(str,pathlib.Path('docs').rglob('*')))+list(map(str,pathlib.Path('.github').rglob('*'))):
  if pathlib.Path(f).is_file(): z.write(f,'ates-explorer/'+f)
`]);
