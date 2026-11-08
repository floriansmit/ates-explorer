"""Strict time/grid comparison; no interpolation, missing runs never become passes."""
import argparse,json,re
from pathlib import Path
import numpy as np
ap=argparse.ArgumentParser();ap.add_argument('--results',default='benchmarks/mf6-doublet/results');a=ap.parse_args();r=Path(a.results)
e=json.loads((r/'explorer.json').read_text());m=np.load(r/'mf6-temperatures.npz');ts=m['time'];T=m['temperature'];s=e['steps'];g=e['grid'];c=e['case'];ambient=c['t']['ambient'];dx=g['dx']
assert T.shape==(len(s),g['nx']*g['ny']) and np.isfinite(T).all()
assert np.allclose(ts,[z['end'] for z in s],rtol=0,atol=1e-6)
q=np.array([z['flow'] for z in s]);dt=np.array([z['end']-z['start'] for z in s]);active=q!=0
ex=np.where(q>=0,g['well'][0],g['well'][1]);mp=T[np.arange(len(s)),ex];ep=np.array([z['production'] for z in s]);diff=mp[active]-ep[active]
# Explorer production is explicit start-of-step; MF6 sink uses implicit end-of-step.
# Compare these actual sink temperatures; time refinement must quantify the staggering error.
cw=1.163
metrics={'status':'executed comparison, not validation','production_sampling':'Explorer explicit start vs MF6 implicit end; refine dt','production_rmse_C':float(np.sqrt(np.mean(diff**2))),'production_max_abs_C':float(np.max(np.abs(diff))),'explorer_budget':e['budget'],'periods':[],'plumes':[]}
for k,period in enumerate(c['periods']):
 mask=np.array([z['period']==k for z in s]);indices=np.flatnonzero(mask);sign=1 if period['name']=='warm-recovery' else -1
 # Report signed ambient-referenced produced energy for every active phase.
 row={'name':period['name']}
 for label,prod in [('explorer',ep),('mf6',mp)]:
  row[label+'_produced_anomaly_kWh']=float(np.sum(cw*np.abs(q[mask])*dt[mask]*(prod[mask]-ambient)))
  # First >=0.6 K contamination at opposite producer during warm charging.
  hits=indices[np.abs(prod[mask]-ambient)>=0.6] if period['flow'] else []
  row[label+'_first_0.6K_production_anomaly_hour']=float(ts[hits[0]]) if len(hits) else None
 metrics['periods'].append(row)
charge=0;recovery=2
input_energy=cw*abs(c['periods'][charge]['flow'])*c['periods'][charge]['hours']*(c['periods'][charge]['injection']-ambient)
metrics['warm_recovery']={'injected_anomaly_kWh':input_energy,**{label:metrics['periods'][recovery][label+'_produced_anomaly_kWh']/input_energy for label in ('explorer','mf6')}}
y,x=np.indices((g['ny'],g['nx']));x=(x.ravel()+.5)*dx;y=(y.ravel()+.5)*dx
for frame in e['frames']:
 idx=np.flatnonzero(np.isclose(ts,frame['time'],rtol=0,atol=1e-6));assert len(idx)==1
 E=np.array(frame['temperature']);M=T[idx[0]]
 row={'hour':frame['time'],'field_rmse_C':float(np.sqrt(np.mean((E-M)**2)))}
 for kind,sgn in [('warm',1),('cold',-1)]:
  em=sgn*(E-ambient)>=1;mm=sgn*(M-ambient)>=1;union=(em|mm).sum()
  row[kind+'_iou']=float((em&mm).sum()/union) if union else None
  for label,mask in [('explorer',em),('mf6',mm)]:
   row[label+'_'+kind+'_area_m2']=int(mask.sum())*dx**2
   row[label+'_'+kind+'_centroid_m']=[float(x[mask].mean()),float(y[mask].mean())] if mask.any() else None
 metrics['plumes'].append(row)
# Native listing discrepancies include ghost ring: report separately from interior Explorer ledger.
for model in ['flow','heat']:
 text=(r/f'mf6/{model}.lst').read_text()
 values=[float(v.replace('D','E')) for v in re.findall(r'PERCENT DISCREPANCY\s*=\s*([-+\d.EeDd]+)',text)]
 metrics[model+'_max_listing_discrepancy_percent']=max(map(abs,values)) if values else None
 if not values:raise RuntimeError('No native budget discrepancies parsed')
# Independent cumulative native CBC source/storage ledger (J -> kWh).
import flopy
for model,terms,scale in [('heat',['STORAGE-CELLBLK','SOURCE-SINK MIX','CTP'],3.6e6),('flow',['WEL','CHD'],1.0)]:
 b=flopy.utils.CellBudgetFile(str(r/f'mf6/{model}.cbc'),precision='double')
 ledger={term:0.0 for term in terms};max_residual=0.0
 for i,pair in enumerate(b.get_kstpkper()):
  rate=0.0
  for term in terms:
   records=b.get_data(kstpkper=pair,text=term)
   total=sum(float(z['q'].sum()) if z.dtype.names and 'q' in z.dtype.names else float(z.sum()) for z in records)
   ledger[term]+=total*dt[i]/scale;rate+=total
  max_residual=max(max_residual,abs(rate)/scale)
 metrics[model+'_cbc_ledger']={'units':'kWh' if model=='heat' else 'm3','terms':ledger,'cumulative_residual':sum(ledger.values()),'max_abs_rate_residual_per_hour':max_residual}
if 'heat_cbc_ledger' in metrics:
 stored_mf=float((T[-1]-ambient).sum()*c['t']['bulkCapacity']/3.6*c['p']['thickness']*dx**2)
 metrics['mf6_interior_stored_anomaly_kWh']=stored_mf
 metrics['mf6_storage_vs_temperature_kWh']=stored_mf+metrics['heat_cbc_ledger']['terms']['STORAGE-CELLBLK']
(r/'comparison.json').write_text(json.dumps(metrics,indent=2,allow_nan=False))
print(json.dumps(metrics,indent=2,allow_nan=False))
