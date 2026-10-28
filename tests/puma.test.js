import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileFromPuma} from '../src/js/puma.js';
import {describePumaUnit,PUMA_STRATIGRAPHY} from '../src/js/puma-stratigraphy.js';
import {aquiferCandidate,countryConfig} from '../src/js/countries.js';

const data=JSON.parse(await readFile(new URL('../src/data/puma-estonia.json',import.meta.url),'utf8'));

test('compiled PUMA mesh reproduces the published Tallinn point profile',()=>{
  const profile=profileFromPuma(data,542640,6588955);
  assert.equal(profile.country,'EE');
  assert.equal(profile.crs,'EPSG:25884');
  assert.match(profile.citation,/University of Latvia/);
  assert.equal(profile.layers.length,8);
  assert.deepEqual(profile.layers.map(layer=>layer.code),['Q','Q2','Q4','Cmtr','Cmln','V2vr','V2kt','V2gd']);
  assert.ok(Math.abs(profile.layers[0].top-18.6)<.15);
  assert.equal(profile.layers[0].kh,10);
  assert.equal(profile.layers[1].kh,.001);
  assert.equal(aquiferCandidate(profile.layers[0]),true);
  assert.equal(aquiferCandidate(profile.layers[1]),false);
});

test('PUMA query rejects points outside its compiled Estonia mesh',()=>{
  assert.throws(()=>profileFromPuma(data,0,0),/outside/);
  assert.equal(countryConfig('EE').crs,'EPSG:25884');
});

test('every compiled PUMA code has an explicit stratigraphic interpretation',()=>{
  assert.deepEqual(data.layers.filter(code=>!PUMA_STRATIGRAPHY[code]),[]);
});

test('Estonian units retain rock type independently of conductivity',()=>{
  assert.equal(describePumaUnit('O2',5).lithology,'carbonate');
  assert.equal(describePumaUnit('O2',5).aquiferCandidate,true);
  assert.equal(describePumaUnit('O2',1e-6).lithology,'carbonate');
  assert.equal(describePumaUnit('O2',1e-6).aquiferCandidate,false);
  assert.equal(describePumaUnit('S1ln',2).lithology,'carbonate');
  assert.equal(describePumaUnit('D2br',2).lithology,'aquifer');
  assert.equal(describePumaUnit('D2nr',2).aquiferCandidate,false);
  assert.equal(describePumaUnit('Cmln',1).aquiferCandidate,false);
  assert.equal(describePumaUnit('V2kt',1).aquiferCandidate,false);
  assert.match(describePumaUnit('O1',1).rock,/argillite/);
});
