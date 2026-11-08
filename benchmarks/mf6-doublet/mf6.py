"""Generate GWF/GWE decks from the exact Explorer case/grid. Run only with --run."""
import argparse,json,math,sys
from pathlib import Path
import numpy as np
import flopy
ap=argparse.ArgumentParser();ap.add_argument('--results',default='benchmarks/mf6-doublet/results');ap.add_argument('--exe',default='mf6');ap.add_argument('--run',action='store_true');a=ap.parse_args()
r=Path(a.results); e=json.loads((r/'explorer.json').read_text());c=e['case'];g=e['grid'];p=c['p'];t=c['t'];dx=g['dx'];nx=g['nx']+2;ny=g['ny']+2
assert t['gradient']==0 and t['dispersivity']==0, 'This generator supports only zero regional flow and zero dispersion'
assert abs(c['water_density']*c['water_heat_capacity']/3.6e6-1.163)<1e-12
# One ghost ring has fixed head and temperature. Interior ordering remains Explorer row-major.
wells=[(0,k//g['nx']+1,k%g['nx']+1) for k in g['well']]
edge=[(0,j,i) for j in range(ny) for i in range(nx) if j in (0,ny-1) or i in (0,nx-1)]
# Positive Explorer flow: warm sink / cold source; exact infinite-domain dipole heads.
def head(j,i,q):
 x=(i-.5)*dx;y=(j-.5)*dx
 rw=math.hypot(x-g['wx'][0],y-g['wy']);rc=math.hypot(x-g['wx'][1],y-g['wy'])
 return q*math.log(rw/rc)/(2*math.pi*(p['kh']/24)*p['thickness'])
perioddata=[]
for k,s in enumerate(c['periods']):
 steps=[z for z in e['steps'] if z['period']==k]; dts=np.array([z['end']-z['start'] for z in steps]);assert np.allclose(dts,dts[0]),'Uniform timestep per period required'
 perioddata.append((s['hours'],len(steps),1.0))
sim=flopy.mf6.MFSimulation(sim_name='doublet',sim_ws=str(r/'mf6'),exe_name=a.exe)
flopy.mf6.ModflowTdis(sim,time_units='HOURS',nper=len(perioddata),perioddata=perioddata)
f=flopy.mf6.ModflowGwf(sim,modelname='flow',save_flows=True)
ims=flopy.mf6.ModflowIms(sim,filename='flow.ims',complexity='COMPLEX',outer_dvclose=1e-9,inner_dvclose=1e-10,rcloserecord=1e-8);sim.register_ims_package(ims,[f.name])
flopy.mf6.ModflowGwfdis(f,nlay=1,nrow=ny,ncol=nx,delr=dx,delc=dx,top=0,botm=-p['thickness'])
flopy.mf6.ModflowGwfic(f,strt=0);flopy.mf6.ModflowGwfnpf(f,icelltype=0,k=p['kh']/24,save_specific_discharge=True)
# No STO: each period solves steady confined flow, matching instantaneous radial response.
chd={};wel={}
for k,s in enumerate(c['periods']):
 q=s['flow'];chd[k]=[(cell,head(cell[1],cell[2],q),t['ambient']) for cell in edge]
 wel[k]=[(wells[0],-q,s['injection']),(wells[1],q,s['injection'])]
flopy.mf6.ModflowGwfchd(f,pname='BOUNDARY',auxiliary=['TEMPERATURE'],stress_period_data=chd)
flopy.mf6.ModflowGwfwel(f,pname='WELLS',auxiliary=['TEMPERATURE'],stress_period_data=wel)
flopy.mf6.ModflowGwfoc(f,head_filerecord='flow.hds',budget_filerecord='flow.cbc',saverecord=[('HEAD','ALL'),('BUDGET','ALL')])
h=flopy.mf6.ModflowGwe(sim,modelname='heat',save_flows=True)
ims2=flopy.mf6.ModflowIms(sim,filename='heat.ims',complexity='COMPLEX',linear_acceleration='BICGSTAB',outer_dvclose=1e-9,inner_dvclose=1e-10,rcloserecord=1e-8);sim.register_ims_package(ims2,[h.name])
flopy.mf6.ModflowGwedis(h,nlay=1,nrow=ny,ncol=nx,delr=dx,delc=dx,top=0,botm=-p['thickness'])
flopy.mf6.ModflowGweic(h,strt=t['ambient']);flopy.mf6.ModflowGweadv(h,scheme='UPSTREAM')
n=c['porosity'];cw=c['water_density']*c['water_heat_capacity'];cs=(t['bulkCapacity']*1e6-n*cw)/((1-n)*c['solid_density']);ks=(t['thermalConductivity']-n*c['water_conductivity'])/(1-n)
assert cs>0 and ks>0
flopy.mf6.ModflowGweest(h,porosity=n,density_water=c['water_density'],heat_capacity_water=c['water_heat_capacity'],density_solid=c['solid_density'],heat_capacity_solid=cs,save_flows=True)
# J, m, h: conductivity W/m/K must be multiplied by 3600.
flopy.mf6.ModflowGwecnd(h,alh=0,ath1=0,ktw=c['water_conductivity']*3600,kts=ks*3600)
flopy.mf6.ModflowGwessm(h,sources=[('WELLS','AUX','TEMPERATURE'),('BOUNDARY','AUX','TEMPERATURE')])
flopy.mf6.ModflowGwectp(h,stress_period_data={0:[(cell,t['ambient']) for cell in edge]})
flopy.mf6.ModflowGweoc(h,temperature_filerecord='heat.ucn',budget_filerecord='heat.cbc',saverecord=[('TEMPERATURE','ALL'),('BUDGET','ALL')],printrecord=[('BUDGET','LAST')])
flopy.mf6.ModflowGwfgwe(sim,exgtype='GWF6-GWE6',exgmnamea=f.name,exgmnameb=h.name)
sim.write_simulation(silent=True)
(r/'mf6-build.json').write_text(json.dumps({'flopy':flopy.__version__,'solid_cp_J_kgK':cs,'solid_k_W_mK':ks,'status':'inputs generated; no comparison implied'},indent=2))
if a.run:
 ok,log=sim.run_simulation(silent=True,report=True)
 (r/'mf6-run.log').write_text('\n'.join(log))
 if not ok:sys.exit('MODFLOW failed; inspect mf6-run.log')
 u=flopy.utils.HeadFile(str(r/'mf6/heat.ucn'),text='TEMPERATURE',precision='double')
 times=u.get_times();temps=u.get_alldata()[:,0,1:-1,1:-1].reshape(len(times),-1)
 np.savez_compressed(r/'mf6-temperatures.npz',time=times,temperature=temps)
 print('MF6 completed; run compare.py and inspect budgets before interpreting agreement.')
