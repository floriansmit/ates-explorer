// Display-only snapshots: solver grid/time stepping is unchanged by output cadence or sampling.
export function snapshotLayout(grids,years,cadence=30,budget=2000000){
 if(![1,7,30].includes(cadence))throw Error('Snapshot cadence must be daily, weekly or month-end.');
 const expectedFrames=cadence===30?12*years+1:Math.ceil(years*365/cadence)+2;
 if(expectedFrames*grids.length*2>budget)throw Error('Snapshot budget is too small for the requested output times.');
 let stride=1;const count=s=>grids.reduce((sum,g)=>{const nx=Math.ceil(g.nx/s),ny=Math.ceil(g.ny/s);return sum+nx*ny+nx;},0)*expectedFrames;
 while(count(stride)>budget)stride++;
 return {cadence,stride,expectedFrames,maxFloatValues:count(stride),layers:grids.map(g=>({nx:Math.ceil(g.nx/stride),ny:Math.ceil(g.ny/stride),width:g.width,height:g.height,xEdges:Array.from({length:Math.ceil(g.nx/stride)+1},(_,i)=>Math.min(i*stride,g.nx)*g.dx),yEdges:Array.from({length:Math.ceil(g.ny/stride)+1},(_,j)=>Math.min(j*stride,g.ny)*g.dx)}))};
}
export function sampleField(g,stride){const nx=Math.ceil(g.nx/stride),ny=Math.ceil(g.ny/stride),temperatures=new Float32Array(nx*ny),centreline=new Float32Array(nx),cy=Math.floor(g.ny/2);
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let sum=0,n=0;for(let y=j*stride;y<Math.min((j+1)*stride,g.ny);y++)for(let x=i*stride;x<Math.min((i+1)*stride,g.nx);x++){sum+=g.temperatures[x+y*g.nx];n++;}temperatures[i+j*nx]=sum/n;}
 for(let i=0;i<nx;i++){let sum=0,n=0;for(let x=i*stride;x<Math.min((i+1)*stride,g.nx);x++){sum+=g.temperatures[x+cy*g.nx];n++;}centreline[i]=sum/n;}
 return {temperatures,centreline};
}
export function shouldCapture(day,monthEnd,lastDay,cadence){return cadence===30?monthEnd:day%cadence===0||lastDay;}
export function snapshotTransferables(result){return result.snapshots.frames.flatMap(frame=>frame.fields.flatMap(f=>[f.temperatures.buffer,f.centreline.buffer]));}
