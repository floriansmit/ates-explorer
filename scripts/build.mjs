import {mkdir,copyFile,rm,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
// Keep the output directory inode stable for the managed preview server.
await mkdir('dist',{recursive:true});
for(const file of ['index.html','europe-models.html','estonia-integration.html','estonia-point-response.example.json','style.css','app.js','engine.js','reservoirs.js','countries.js','custom-profile.js','fohm.js','location.js','regis.js','thermal.js','snapshots.js','thermal-viewer.js','thermal-worker.js','example-loads.csv'])await copyFile(file,'dist/'+file);
await cp('vendor','dist/vendor',{recursive:true});
execFileSync('python3',['-c',`import zipfile,pathlib
files=['index.html','europe-models.html','estonia-integration.html','estonia-point-response.example.json','style.css','app.js','engine.js','reservoirs.js','countries.js','custom-profile.js','fohm.js','location.js','regis.js','thermal.js','snapshots.js','thermal-viewer.js','thermal-worker.js','example-loads.csv','README.md','HANDOVER.md','package.json']
with zipfile.ZipFile('dist/ates-explorer-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in files+list(map(str,pathlib.Path('tests').glob('*.js')))+list(map(str,pathlib.Path('vendor').glob('*')))+['scripts/build.mjs']+list(map(str,pathlib.Path('docs').rglob('*')))+list(map(str,pathlib.Path('.github').rglob('*'))):
  if pathlib.Path(f).is_file(): z.write(f,'ates-explorer/'+f)
`]);
