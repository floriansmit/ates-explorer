import {resolveStack} from './reservoirs.js';
// Screening equations. Water heat capacity: 1.163 kWh/(m³ K).
export const defaults={thickness:25,kh:20,drawdown:5,radius:0.15,influence:500,spacing:100,deltaT:6,cop:5,flow:60,pairs:1,heating:500,cooling:350,peakHeat:250,peakCool:200,loss:0.15,years:20,electricity:0.25,pumpHead:25,pumpEfficiency:0.65};
export const heatShape=[.18,.15,.13,.08,.04,.01,0,0,.03,.08,.13,.17];
export const coolShape=[0,0,.01,.03,.1,.2,.26,.23,.12,.04,.01,0];
export function simulate(p,loads=null){
 const stack=resolveStack(p);p={...p,thickness:stack.thickness,kh:stack.kh};
 for(const k of Object.keys(defaults)) if(!Number.isFinite(p[k])) throw Error(`${k}: enter a finite number`);
 for(const k of ['thickness','kh','drawdown','radius','influence','spacing','deltaT','flow','pairs','pumpEfficiency']) if(p[k]<=0) throw Error(`${k} must be positive`);
 for(const k of ['heating','cooling','peakHeat','peakCool','pumpHead','electricity']) if(p[k]<0) throw Error(`${k} cannot be negative`);
 if(p.cop<=1||p.loss<0||p.loss>=1||p.pumpEfficiency>1||p.influence<=p.radius||!Number.isInteger(p.pairs)||!Number.isInteger(p.years)||p.years<1||p.years>100) throw Error('Check COP, loss, efficiency, radii, integer well pairs and years (1–100).');
 const profiles=loads??heatShape.map((x,i)=>({heat:x*p.heating,cool:coolShape[i]*p.cooling}));
 if(profiles.length!==12||profiles.some(x=>!Number.isFinite(x.heat)||!Number.isFinite(x.cool)||x.heat<0||x.cool<0)) throw Error('Loads require 12 nonnegative monthly heat/cool MWh values.');
 const hydraulicFlow=2*Math.PI*p.kh*p.thickness*p.drawdown/Math.log(p.influence/p.radius)/24;
 const flow=Math.min(p.flow,hydraulicFlow)*p.pairs;
 const sourceKW=1.163*flow*p.deltaT, heatKW=sourceKW/(1-1/p.cop),coolKW=sourceKW;
 const hours=[744,672,744,720,744,720,744,744,720,744,720,744];
 let warm=0,cold=0;const rows=[]; const annual=[];
 for(let y=1;y<=p.years;y++){
 let s={year:y,heat:0,cool:0,electricity:0,extraction:0,injection:0,heatUnmet:0,coolUnmet:0,warmLoss:0,coldLoss:0};
 for(let m=0;m<12;m++){
 // Retain seasonal inventories diagnostically; ambient aquifer heat is not treated as a finite tank.
 const retention=Math.pow(1-p.loss,1/12),warmLoss=warm*(1-retention),coldLoss=cold*(1-retention);warm-=warmLoss;cold-=coldLoss;
 const heat=Math.min(profiles[m].heat,heatKW*hours[m]/1000),cool=Math.min(profiles[m].cool,coolKW*hours[m]/1000);
 const extraction=heat*(1-1/p.cop),injection=cool;
 const recoveredWarm=Math.min(warm,extraction);warm-=recoveredWarm;
 const recoveredCold=Math.min(cold,injection);cold-=recoveredCold;
 warm+=injection;cold+=extraction;
 const volume=(extraction+injection)*1000/(1.163*p.deltaT);
 const pumping=volume*1000*9.81*p.pumpHead/(p.pumpEfficiency*3.6e9);
 const electricity=heat/p.cop+pumping;
 const row={year:y,month:m+1,heat,cool,heatUnmet:profiles[m].heat-heat,coolUnmet:profiles[m].cool-cool,extraction,injection,volume,electricity,warm,cold,warmLoss,coldLoss,recoveredWarm,recoveredCold};rows.push(row);
 for(const k of ['heat','cool','electricity','extraction','injection','heatUnmet','coolUnmet','warmLoss','coldLoss'])s[k]+=row[k];
 }annual.push(s);
 }
 const first=annual[0],annualVolume=(first.extraction+first.injection)*1000/(1.163*p.deltaT);
 // Thermal radius uses bulk saturated volumetric heat capacity = 2.5 MJ/(m³ K).
 const thermalRadius=Math.sqrt(Math.max(first.extraction,first.injection)/p.pairs*3600/(Math.PI*p.thickness*2.5*p.deltaT));
 const imbalance=(first.injection-first.extraction)/Math.max(first.injection,first.extraction,1e-9);
 const warnings=[p.reservoirs?.length?'Selected screened intervals drive the calculation; geological gaps are excluded.':'Manual single-aquifer calculation.','Monthly loads cannot establish peak-hour coverage.','Fast-screening inventories are diagnostic only; run the separate transient model for temperatures.'];
 if(p.flow>hydraulicFlow)warnings.push('Requested flow is limited by the idealised hydraulic estimate.');
 if(Math.abs(imbalance)>.15)warnings.push('Material annual aquifer energy imbalance: investigate regeneration or hybrid plant.');
 const layerRadii=stack.layers.map(layer=>({code:layer.code,radius:Math.sqrt(Math.max(first.extraction,first.injection)/p.pairs*layer.flowShare*3600/(Math.PI*layer.thickness*2.5*p.deltaT))}));
 if(p.spacing<2*Math.max(...layerRadii.map(x=>x.radius)))warnings.push('Well spacing is below two estimated thermal radii; investigate interference.');
 return {stack,layerRadii,flow,hydraulicFlow,sourceKW,heatKW,coolKW,annualVolume,thermalRadius,imbalance,peakHeatCoverage:p.peakHeat?Math.min(1,heatKW/p.peakHeat):1,peakCoolCoverage:p.peakCool?Math.min(1,coolKW/p.peakCool):1,annual,rows,warnings,annualElectricityCost:first.electricity*1000*p.electricity};
}
