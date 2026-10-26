import {access,readdir,readFile} from 'node:fs/promises';
import {dirname,extname,resolve} from 'node:path';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..');
const source=resolve(root,'src');

test('browser source is grouped under src',async()=>{
  const rootFiles=(await readdir(root,{withFileTypes:true})).filter(entry=>entry.isFile()).map(entry=>entry.name);
  assert.deepEqual(rootFiles.filter(file=>['.html','.js','.css'].includes(extname(file))),[]);
  for(const path of ['index.html','js/app.js','assets/style.css','pages/europe-models.html','data/example-loads.csv']){
    await access(resolve(source,path));
  }
});

test('local links and scripts in source HTML resolve',async()=>{
  for(const page of ['index.html','pages/europe-models.html','pages/estonia-integration.html']){
    const file=resolve(source,page);
    const html=await readFile(file,'utf8');
    for(const [,target] of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
      if(/^(?:https?:|data:|mailto:)/.test(target)||target==='./ates-explorer-source.zip')continue;
      const pathname=target.split(/[?#]/,1)[0];
      await assert.doesNotReject(access(resolve(dirname(file),pathname)),`${page}: ${target}`);
    }
  }
});
