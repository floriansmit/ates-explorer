import {runThermal} from './thermal.js';
import {snapshotTransferables} from './snapshots.js';
onmessage=e=>{try{const result=runThermal(e.data.p,e.data.t,e.data.loads,progress=>postMessage({type:'progress',progress}),e.data.outputOptions);postMessage({type:'result',result},snapshotTransferables(result));}catch(error){postMessage({type:'error',message:error.message});}};
