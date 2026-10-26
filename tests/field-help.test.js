import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldHelp} from '../src/js/field-help.js';
import {defaults} from '../src/js/engine.js';
import {thermalDefaults} from '../src/js/thermal.js';

test('every screening and thermal parameter has complete contextual help',()=>{
 const keys=[...Object.keys(defaults),...Object.keys(thermalDefaults),'screenTop','screenBottom','screenKh','profileDepth','customReference','customTopDepth','customBaseDepth','snapshotCadence'];
 for(const key of keys){
  assert.ok(fieldHelp[key],`missing help for ${key}`);
  for(const section of ['meaning','range','effect'])assert.ok(fieldHelp[key][section]?.length>20,`${key}.${section} is incomplete`);
 }
});
