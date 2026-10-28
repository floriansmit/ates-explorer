import {describePumaUnit} from './puma-stratigraphy.js';

const DATA_URL=new URL('../data/puma-estonia.json',import.meta.url);
let dataPromise;

function barycentric(data,triangle,x,y){
  const stride=data.meta.vertexStride,vertices=data.vertices,indices=data.triangles,offset=triangle*3;
  const a=indices[offset],b=indices[offset+1],c=indices[offset+2],ao=a*stride,bo=b*stride,co=c*stride;
  const x1=vertices[ao],y1=vertices[ao+1],x2=vertices[bo],y2=vertices[bo+1],x3=vertices[co],y3=vertices[co+1];
  const denominator=(y2-y3)*(x1-x3)+(x3-x2)*(y1-y3);
  if(!denominator)return null;
  const wa=((y2-y3)*(x-x3)+(x3-x2)*(y-y3))/denominator;
  const wb=((y3-y1)*(x-x3)+(x1-x3)*(y-y3))/denominator;
  const wc=1-wa-wb;
  return Math.min(wa,wb,wc)>=-1e-7?{weights:[wa,wb,wc],vertices:[a,b,c],bounds:{xmin:Math.min(x1,x2,x3),xmax:Math.max(x1,x2,x3),ymin:Math.min(y1,y2,y3),ymax:Math.max(y1,y2,y3)}}:null;
}

function interpolate(data,match,surface){
  const stride=data.meta.vertexStride;
  return match.vertices.reduce((sum,vertex,index)=>sum+match.weights[index]*data.vertices[vertex*stride+2+surface],0);
}

export function profileFromPuma(data,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Enter valid Baltic TM coordinates.');
  let match,triangle=-1;
  for(let index=0;index<data.triangles.length/3;index++)if(match=barycentric(data,index,x,y)){triangle=index;break;}
  if(!match)throw Error('This point is outside the compiled Estonia portion of PUMA/MOSYS. Choose a point inside the green coverage polygon.');
  const layerCount=data.meta.layerCount,layers=[];
  for(let layer=0;layer<layerCount;layer++){
    const top=interpolate(data,match,layer),bottom=interpolate(data,match,layer+1),thickness=top-bottom;
    if(!Number.isFinite(thickness)||thickness<=0.2)continue;
    const kh=data.conductivity[triangle*layerCount+layer],code=data.layers[layer],stratigraphy=describePumaUnit(code,kh);
    layers.push({code,top,bottom,thickness,kh:Number.isFinite(kh)&&kh>0?kh:null,kv:null,khSource:'PUMA/MOSYS regional model cell conductivity',...stratigraphy});
  }
  if(!layers.length)throw Error('PUMA/MOSYS contains no active geological intervals at this point.');
  return {country:'EE',provider:'University of Latvia PUMA/MOSYS',x,y,crs:data.meta.crs,datumShort:'m source elev.',datum:data.meta.datum,version:`PUMA/MOSYS public VTK · ${data.meta.sourcePublished}`,retrievedAt:data.meta.compiledAt,url:data.meta.sourcePage,citation:data.meta.citation,cellBounds:match.bounds,meshTriangle:triangle,layers};
}

export async function fetchPuma(x,y){
  if(x<300000||x>800000||y<6300000||y>6700000)throw Error('Enter an Estonian Baltic TM (EPSG:25884) point.');
  dataPromise??=fetch(DATA_URL).then(response=>{if(!response.ok)throw Error(`Compiled PUMA dataset returned ${response.status}`);return response.json();});
  try{return profileFromPuma(await dataPromise,x,y);}catch(error){throw Error('PUMA/MOSYS retrieval failed: '+error.message);}
}
