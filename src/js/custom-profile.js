// Depths are positive down from an explicitly named reference elevation.
export function makeCustomProfile(definition,now=new Date().toISOString()){
 const number=(v,label)=>{if(v==null||String(v).trim()===''||!Number.isFinite(Number(v)))throw Error(label+' must be a finite number.');return Number(v);};
 const reference=number(definition.referenceElevation,'Reference elevation'),datum=String(definition.datumName??'').trim();
 if(!datum)throw Error('Name the elevation datum or local reference.');
 if(!Array.isArray(definition.layers)||!definition.layers.length||definition.layers.length>60)throw Error('Define between 1 and 60 geological layers.');
 const codes=new Set(),layers=definition.layers.map((r,i)=>{const code=String(r.code??'').trim(),topDepth=number(r.topDepth,`Layer ${i+1} top depth`),baseDepth=number(r.baseDepth,`Layer ${i+1} base depth`);
 if(!code||codes.has(code))throw Error('Give each layer a unique, non-empty name.');codes.add(code);
 if(topDepth<0||baseDepth<=topDepth)throw Error(code+': depths must be nonnegative and base depth must exceed top depth.');
 if(!['sand','aquifer','carbonate','clay','other'].includes(r.lithology))throw Error(code+': choose a layer type.');
 const kh=r.kh==null||String(r.kh).trim()===''?null:number(r.kh,code+' Kh');if(kh!==null&&kh<=0)throw Error(code+': enter positive Kh or leave it empty.');
 return {code,lithology:r.lithology,top:reference-topDepth,bottom:reference-baseDepth,thickness:baseDepth-topDepth,kh,khSource:'User-defined profile',khNote:String(r.khNote??'')};
 }).sort((a,b)=>b.top-a.top);
 for(let i=1;i<layers.length;i++)if(layers[i].top>layers[i-1].bottom+1e-8)throw Error('Geological layers overlap: '+layers[i-1].code+' / '+layers[i].code+'.');
 return {country:'OTHER',custom:true,provider:'User-defined profile',version:'Custom profile v1',retrievedAt:now,datum:'m '+datum+', positive up.',datumShort:'m '+datum,customDefinition:structuredClone({...definition,referenceElevation:reference}),layers};
}
