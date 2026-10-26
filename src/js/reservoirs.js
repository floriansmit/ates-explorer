// Screens share head change; geological gaps contribute no screened thickness or transmissivity.
export function stackGeometry(reservoirs){
 if(!Array.isArray(reservoirs)||reservoirs.length===0)throw Error('Select at least one aquifer interval.');if(reservoirs.length>12)throw Error('Select at most 12 intervals.');
 const layers=reservoirs.map((r,i)=>{const top=r.screenTop??r.top,bottom=r.screenBottom??r.bottom;
 if(![top,bottom].every(Number.isFinite)||top<=bottom)throw Error(`Interval ${i+1}: screen top must exceed base in source elevation units.`);
 if(Number.isFinite(r.top)&&top>r.top+1e-8||Number.isFinite(r.bottom)&&bottom<r.bottom-1e-8)throw Error(`Interval ${i+1}: screen must stay within the selected geological unit.`);
 return {...r,code:String(r.code??`Interval ${i+1}`),screenTop:top,screenBottom:bottom,thickness:top-bottom};}).sort((a,b)=>b.screenTop-a.screenTop);
 for(let i=1;i<layers.length;i++)if(layers[i].screenTop>layers[i-1].screenBottom+1e-8)throw Error('Selected screen intervals overlap. Choose intervals within one consistent model group.');
 const thickness=layers.reduce((s,r)=>s+r.thickness,0),top=layers[0].screenTop,bottom=layers.at(-1).screenBottom;
 return {layers,thickness,top,bottom,grossThickness:top-bottom,excludedThickness:top-bottom-thickness};
}
export function stackProperties(reservoirs){const geometry=stackGeometry(reservoirs),layers=geometry.layers.map(r=>{if(!Number.isFinite(r.kh)||r.kh<=0)throw Error(`Enter positive Kh (m/day) for ${r.code}. Conductivity is not supplied for all selected intervals.`);return {...r,transmissivity:r.kh*r.thickness};}),transmissivity=layers.reduce((s,r)=>s+r.transmissivity,0);
return {...geometry,layers:layers.map(r=>({...r,flowShare:r.transmissivity/transmissivity})),transmissivity,kh:transmissivity/geometry.thickness};}
export function resolveStack(p){return stackProperties(p.reservoirs?.length?p.reservoirs:[{code:'Manual aquifer',top:0,bottom:-p.thickness,kh:p.kh}]);}
// Legacy helper retained for compatibility with the original REGIS adapter.
export function isSand(layer){return /z\d/i.test(layer.code)&&Number.isFinite(layer.kh)&&layer.kh>0;}
