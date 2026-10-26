import {snapshotLayout,sampleField,shouldCapture} from './snapshots.js';
import {resolveStack} from './reservoirs.js';
// Conservative 2-D depth-averaged finite-volume heat transport. Units: m, h, kWh, °C.
import {simulate,heatShape,coolShape} from './engine.js';
export const thermalDefaults={ambient:12,coldTarget:6,warmTarget:18,heatSupply:40,coolSupply:16,approach:2,bulkCapacity:2.5,thermalConductivity:2.4,dispersivity:1,gradient:0.001,flowAngle:0,cellSize:20,padding:200,thermalYears:5};
const CW=1.163;
// Exact integral of the radial flow field across a cell face; source strength is m³/h.
function radialFace(axis,face,lo,hi,wx,wy){const d=face-(axis===0?wx:wy),v=axis===0?wy:wx;return (Math.atan((hi-v)/d)-Math.atan((lo-v)/d))/(2*Math.PI);}
export function createGrid(p,t){const dx=t.cellSize;let nx=Math.ceil((p.spacing+2*t.padding)/dx),ny=Math.ceil(2*t.padding/dx);if(nx%2===0)nx++;if(ny%2===0)ny++;
if(nx*ny>30000)throw Error('Grid too large: increase cell size or reduce padding/spacing.');
const width=nx*dx,height=ny*dx,cy=Math.floor(ny/2),cx=Math.floor(nx/2),offset=Math.max(1,Math.round(p.spacing/(2*dx))),wi=cx-offset,ci=cx+offset;
if(wi<2||ci>=nx-2)throw Error('Increase domain padding.');
const well=[wi+cy*nx,ci+cy*nx],wx=[(wi+.5)*dx,(ci+.5)*dx],wy=(cy+.5)*dx;
const fx=new Float64Array((nx+1)*ny),fy=new Float64Array(nx*(ny+1));
for(let j=0;j<ny;j++)for(let i=0;i<=nx;i++)fx[i+j*(nx+1)]=radialFace(0,i*dx,j*dx,(j+1)*dx,wx[1],wy)-radialFace(0,i*dx,j*dx,(j+1)*dx,wx[0],wy);
for(let j=0;j<=ny;j++)for(let i=0;i<nx;i++)fy[i+j*nx]=radialFace(1,j*dx,i*dx,(i+1)*dx,wx[1],wy)-radialFace(1,j*dx,i*dx,(i+1)*dx,wx[0],wy);
return {nx,ny,dx,width,height,well,wx,wy,fx,fy,temperatures:new Float64Array(nx*ny).fill(t.ambient),capacity:t.bulkCapacity/3.6*p.thickness*dx*dx,actualSpacing:2*offset*dx};}
export function transportStep(g,p,t,flow,tin,dt){
// Positive flow: warm well extracts, cold well injects. Negative reverses.
const {nx,ny,dx,temperatures:T,capacity:C}=g,change=new Float64Array(T.length),angle=t.flowAngle*Math.PI/180;
const base=p.kh*t.gradient/24*p.thickness*dx,bx=base*Math.cos(angle),by=base*Math.sin(angle),cond=t.thermalConductivity/1000*p.thickness;
let boundary=0;const diag=new Float64Array(T.length);
function face(a,b,q){const ta=a<0?t.ambient:T[a],tb=b<0?t.ambient:T[b],conductance=cond+CW*Math.abs(q)*t.dispersivity/dx;
const f=CW*q*(q>=0?ta:tb)+conductance*(ta-tb);
if(a>=0){change[a]-=f;diag[a]+=CW*Math.max(q,0)+conductance;}else boundary+=f;
if(b>=0){change[b]+=f;diag[b]+=CW*Math.max(-q,0)+conductance;}else boundary-=f;
}
for(let j=0;j<ny;j++)for(let i=0;i<=nx;i++)face(i===0?-1:i-1+j*nx,i===nx?-1:i+j*nx,bx+flow*g.fx[i+j*(nx+1)]);
for(let j=0;j<=ny;j++)for(let i=0;i<nx;i++)face(j===0?-1:i+(j-1)*nx,j===ny?-1:i+j*nx,by+flow*g.fy[i+j*nx]);
const q=Math.abs(flow),ex=flow>=0?g.well[0]:g.well[1],inj=flow>=0?g.well[1]:g.well[0],production=T[ex];
change[ex]-=CW*q*production;diag[ex]+=CW*q;change[inj]+=CW*q*tin;
const usedDt=Math.min(dt,.8*C/Math.max(...diag));let storedChange=0;
for(let k=0;k<T.length;k++){const d=usedDt*change[k];T[k]+=d/C;storedChange+=d;}
return {dt:usedDt,production,boundaryEnergy:boundary*usedDt,wellEnergy:CW*q*(tin-production)*usedDt,storedChange};
}
export function validateThermal(t){for(const [k,v] of Object.entries(thermalDefaults))if(!Number.isFinite(t[k]))throw Error(`${k}: finite number required`);for(const k of ['bulkCapacity','thermalConductivity','cellSize','padding'])if(t[k]<=0)throw Error(`${k} must be positive`);if(t.dispersivity<0||t.gradient<0||t.thermalYears<1||t.thermalYears>30||!Number.isInteger(t.thermalYears)||t.approach<0||t.coldTarget>=t.ambient||t.warmTarget<=t.ambient||t.heatSupply<=t.ambient||t.coolSupply<=t.coldTarget+t.approach)throw Error('Check thermal temperature limits, gradient and years (1–30).');if(t.cellSize<5||t.padding<50)throw Error('Use cell size ≥ 5 m and padding ≥ 50 m.');}
export function runThermal(p,t,loads=null,onProgress=()=>{},outputOptions={}){
validateThermal(t);const screening=simulate(p,loads),qmax=screening.flow/p.pairs,profile=loads??heatShape.map((s,i)=>({heat:s*p.heating,cool:coolShape[i]*p.cooling}));
const stack=resolveStack(p),models=stack.layers.map(layer=>{const lp={...p,thickness:layer.thickness,kh:layer.kh},g=createGrid(lp,t),q=qmax*layer.flowShare;
 const stable=[q,-q,0].map(flow=>transportStep({...g,temperatures:g.temperatures.slice()},lp,t,flow,t.ambient,1e90).dt);
 return {layer,p:lp,g,q,stable,boundary:0,wellEnergy:0,storedChange:0,rows:[]};});
if(models.reduce((s,m)=>s+m.g.nx*m.g.ny,0)>100000)throw Error('Combined stack grid is too large: use coarser cells or fewer intervals.');
const layout=snapshotLayout(models.map(m=>m.g),t.thermalYears,outputOptions.cadence??30),frames=[];
function capture(day,year,month,dayOfMonth,operation='Initial condition'){frames.push({day,year,month,dayOfMonth,operation,fields:models.map(m=>sampleField(m.g,layout.stride))});}
capture(0,1,1,0);let elapsedDays=0;
const g=models[0].g,monthDays=[31,28,31,30,31,30,31,31,30,31,30,31],rows=[];let boundary=0,wellEnergy=0,storedChange=0,steps=0;
// COP is a calibrated fraction of ideal heating Carnot COP, bounded for screening.
const factor=p.cop*(t.heatSupply-t.ambient)/(t.heatSupply+273.15);
for(let y=1;y<=t.thermalYears;y++){for(let m=0;m<12;m++){
const row={year:y,month:m+1,heat:0,cool:0,heatDemand:profile[m].heat,coolDemand:profile[m].cool,extraction:0,injection:0,electricity:0,volume:0,warmProduction:0,coldProduction:0,heatHours:0,coolHours:0};
for(let d=0;d<monthDays[m];d++){
const startHeatHours=row.heatHours,startCoolHours=row.coolHours;
let heatNeed=profile[m].heat*1000/monthDays[m]/p.pairs,coolNeed=profile[m].cool*1000/monthDays[m]/p.pairs,hours=24;
// Heating first, then cooling. Idle transport persists between pumping periods.
for(const mode of ['heat','cool','idle']){let guard=0;while(hours>1e-8&&guard++<5000){if(++steps>3000000)throw Error('Simulation exceeds work limit; use a coarser grid.');
const prod=models.reduce((sum,m)=>sum+m.layer.flowShare*m.g.temperatures[m.g.well[mode==='cool'?1:0]],0),cop=Math.min(9,Math.max(1.1,factor*(t.heatSupply+273.15)/Math.max(3,t.heatSupply-prod))),sourceFraction=1-1/cop;
const delta=mode==='heat'?Math.max(0,prod-t.coldTarget):Math.max(0,t.warmTarget-prod);
if(mode==='heat'&&(heatNeed<1e-6||delta<.1))break;
if(mode==='cool'&&(coolNeed<1e-6||delta<.1||prod+t.approach>=t.coolSupply))break;
const power=CW*qmax*delta,need=mode==='heat'?heatNeed*sourceFraction:coolNeed;
const duration=mode==='idle'?hours:Math.min(hours,need/power,24);
const modeIndex=mode==='heat'?0:mode==='cool'?1:2,dt=Math.min(duration,...models.map(m=>m.stable[modeIndex]));
const s={dt,production:prod,boundaryEnergy:0,wellEnergy:0,storedChange:0};
for(const model of models){const z=transportStep(model.g,model.p,t,mode==='idle'?0:mode==='heat'?model.q:-model.q,mode==='heat'?t.coldTarget:t.warmTarget,dt);model.boundary+=z.boundaryEnergy;model.wellEnergy+=z.wellEnergy;model.storedChange+=z.storedChange;s.boundaryEnergy+=z.boundaryEnergy;s.wellEnergy+=z.wellEnergy;s.storedChange+=z.storedChange;}
hours-=dt;boundary+=s.boundaryEnergy;wellEnergy+=s.wellEnergy;storedChange+=s.storedChange;
if(mode!=='idle'){const energy=CW*qmax*delta*s.dt,volume=qmax*s.dt, pump=volume*1000*9.81*p.pumpHead/(p.pumpEfficiency*3.6e6);
row.volume+=volume*p.pairs;row.electricity+=pump*p.pairs/1000;
if(mode==='heat'){const delivered=energy/sourceFraction;heatNeed=Math.max(0,heatNeed-delivered);row.heat+=delivered*p.pairs/1000;row.extraction+=energy*p.pairs/1000;row.electricity+=delivered/cop*p.pairs/1000;row.warmProduction+=s.production*s.dt;row.heatHours+=s.dt;}
else{coolNeed=Math.max(0,coolNeed-energy);row.cool+=energy*p.pairs/1000;row.injection+=energy*p.pairs/1000;row.coldProduction+=s.production*s.dt;row.coolHours+=s.dt;}}
}
}
elapsedDays++;
if(shouldCapture(elapsedDays,d===monthDays[m]-1,elapsedDays===t.thermalYears*365,layout.cadence)){
 const heat=row.heatHours-startHeatHours>1e-7,cool=row.coolHours-startCoolHours>1e-7;
 capture(elapsedDays,y,m+1,d+1,heat&&cool?'Heating + cooling':heat?'Heating / cold charging':cool?'Cooling / warm charging':'Idle / natural transport');
}
}
row.warmProduction=row.heatHours?row.warmProduction/row.heatHours:null;row.coldProduction=row.coolHours?row.coldProduction/row.coolHours:null;row.heatUnmet=Math.max(0,row.heatDemand-row.heat);row.coolUnmet=Math.max(0,row.coolDemand-row.cool);rows.push(row);for(const model of models)model.rows.push({year:y,month:m+1,warm:model.g.temperatures[model.g.well[0]],cold:model.g.temperatures[model.g.well[1]]});
}onProgress(y/t.thermalYears);}
return {model:'Stacked 2D finite-volume ATES experimental v0.4',snapshots:{...layout,frames},stack,layers:models.map(m=>({interval:m.layer,flowPerPair:m.q,rows:m.rows,energyResidualKWh:m.storedChange-m.boundary-m.wellEnergy,grid:{...m.g,fx:undefined,fy:undefined,temperatures:Array.from(m.g.temperatures)}})),rows,grid:{...g,fx:undefined,fy:undefined,temperatures:Array.from(g.temperatures)},boundaryEnergyMWh:boundary/1000,wellEnergyMWh:wellEnergy/1000,storedChangeMWh:storedChange/1000,energyResidualKWh:storedChange-boundary-wellEnergy,steps,perPairDomain:true};
}
