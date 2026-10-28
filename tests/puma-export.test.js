import {readFile,readdir} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const root=new URL('../exports/estonia-puma-v1/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
const architecture=JSON.parse(await readFile(new URL('geothermal-explorer/architecture-3d.json',root),'utf8'));

test('portable PUMA export declares a non-fabricated basement half-space',()=>{
  assert.equal(manifest.schema,'ates-explorer/portable-geological-model/v1');
  assert.equal(architecture.basement.top_horizon,'basement-top');
  assert.equal(architecture.basement.extent,'half_space_below_top');
  assert.equal(architecture.basement.base_horizon,null);
  assert.deepEqual(architecture.basement.future_overlays,['basement_type_map','fault_locations']);
});

test('portable PUMA adapters contain the complete shared horizon stack',async()=>{
  const cells=architecture.grid.rows*architecture.grid.cols;
  assert.equal(architecture.horizons.length,43);
  assert.equal(architecture.intervals.length,42);
  assert.equal(manifest.adapters.geodecision.horizons.length,43);
  assert.equal(manifest.properties.horizontal_hydraulic_conductivity.length,42);
  assert.ok(architecture.horizons.every(horizon=>horizon.depths_m_bmsl.length===cells));
  assert.ok(architecture.intervals.every(interval=>interval.horizontal_hydraulic_conductivity_m_day.length===cells));
  assert.equal((await readdir(new URL('geodecision/horizons/',root))).filter(name=>name.endsWith('.asc')).length,43);
  assert.equal((await readdir(new URL('geodecision/horizons/',root))).filter(name=>name.endsWith('.prj')).length,43);
  assert.equal((await readdir(new URL('properties/horizontal-hydraulic-conductivity/',root))).filter(name=>name.endsWith('.asc')).length,42);
});

test('portable PUMA depths are ordered and share a common coverage mask',()=>{
  const surfaces=architecture.horizons.map(horizon=>horizon.depths_m_bmsl);
  const valid=surfaces.at(-1).map(Number.isFinite);
  assert.ok(valid.filter(Boolean).length>2500);
  for(let cell=0;cell<valid.length;cell++){
    assert.ok(surfaces.every(surface=>Number.isFinite(surface[cell])===valid[cell]));
    if(!valid[cell])continue;
    for(let surface=1;surface<surfaces.length;surface++){
      assert.ok(surfaces[surface][cell]>=surfaces[surface-1][cell]-.05,`crossing at cell ${cell}, surface ${surface}`);
    }
  }
});

test('GeoDecision grids state their geometry and NoData explicitly',async()=>{
  const first=await readFile(new URL('geodecision/horizons/00_top-q.asc',root),'utf8');
  assert.match(first,/^ncols 82\r?\nnrows 58\r?\n/);
  assert.match(first,/\r?\ncellsize 5000\r?\nNODATA_value -9999\r?\n/);
});
