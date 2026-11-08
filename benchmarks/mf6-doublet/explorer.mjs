// Calls the production solver unchanged; fixed pumping deliberately bypasses plant dispatch.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createGrid,transportStep} from '../../src/js/thermal.js';
const file=process.argv[2]??'benchmarks/mf6-doublet/case.json';
const out=process.argv[3]??'benchmarks/mf6-doublet/results';
fs.mkdirSync(out,{recursive:true});
const c=JSON.parse(fs.readFileSync(file)),g=createGrid(c.p,c.t),steps=[],frames=[];
let time=0,well=0,boundary=0;
for(const [period,s] of c.periods.entries()){
 let remaining=s.hours;
 while(remaining>1e-8){
  const r=transportStep(g,c.p,c.t,s.flow,s.injection,Math.min(c.max_step_hours,remaining));
  if(!(r.dt>0))throw Error('Nonpositive step');
  steps.push({start:time,end:time+r.dt,period,flow:s.flow,injection:s.injection,production:r.production,well_kWh:r.wellEnergy,boundary_kWh:r.boundaryEnergy});
  time+=r.dt;remaining-=r.dt;well+=r.wellEnergy;boundary+=r.boundaryEnergy;
 }
 frames.push({time,temperature:Array.from(g.temperatures)});
}
const stored=g.temperatures.reduce((s,v)=>s+(v-c.t.ambient)*g.capacity,0);
const grid={nx:g.nx,ny:g.ny,dx:g.dx,well:g.well,wx:g.wx,wy:g.wy,width:g.width,height:g.height,actualSpacing:g.actualSpacing};
fs.writeFileSync(`${out}/explorer.json`,JSON.stringify({solver_sha256:createHash('sha256').update(fs.readFileSync(new URL('../../src/js/thermal.js',import.meta.url))).digest('hex'),case:c,grid,steps,frames,budget:{well_kWh:well,boundary_kWh:boundary,stored_kWh:stored,residual_kWh:stored-well-boundary}}));
console.log(JSON.stringify({steps:steps.length,grid,budget:{well,boundary,stored,residual:stored-well-boundary}}));
