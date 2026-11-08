# First independent homogeneous-doublet benchmark

Status: benchmark tooling, not a declaration of predictive validation. See EVIDENCE.md
for the runs actually executed. No field calibration is involved.

## Provenance and execution

Inspected ATES Explorer commit `707a767592b1eaf8e5dbb2ab7293ef2a92e0b02d`
("Add Estonia PUMA model and portable exports"). The production solver is unchanged.
Use Node with ES modules, Python 3.11+, FloPy 3.10.0, NumPy 2.x and MODFLOW 6 with
GWE support (executed version recorded in evidence). Install Python dependencies
with `python -m pip install -r benchmarks/mf6-doublet/requirements.txt`.
From repository root:

```sh
node benchmarks/mf6-doublet/explorer.mjs
python benchmarks/mf6-doublet/mf6.py
# Above commands need no MODFLOW executable; they run Explorer and write MF6 inputs.
python benchmarks/mf6-doublet/mf6.py --run --exe /absolute/path/to/mf6
python benchmarks/mf6-doublet/compare.py
```

A missing executable, failed solve, missing output, mismatched time or shape is an
error, never a successful comparison. `results/` is ignored; keep run logs, source
commit, case JSON, solver versions, input decks, comparison JSON and native budgets
with each archived run. MF6 binary files can exceed 1 GB with every-step budgets.
The NPZ is a derived temperature export; native UCN/CBC/listings remain authoritative.
No external geology or building data is required for this synthetic case.

## Implemented equations and assumptions

`src/js/thermal.js:createGrid,transportStep` implements, per depth-averaged cell,

`Cb b A dT/dt = -sum_faces [Cw Q_face T_upwind + G_face(Tcell-Tneighbor)] + Cw Qinj Tinj - Cw Qext Tcell`.

Here Cb is saturated bulk capacity; `Cw=1.163 kWh/m³/K` is hard-coded;
`G_face = lambda*b/1000 + Cw*abs(Q_face)*dispersivity/dx` in kW/K.
Analytical infinite-domain radial doublet face integrals are superimposed on
`Kh*gradient*b*dx/24` regional face flux. There is no hydraulic head solve,
hydraulic storage, buoyancy, density coupling, vertical conduction or leakage.
First-order spatial upwind and forward Euler transport are conservative; the
step is limited to `0.8*cell_capacity/max(outgoing_diagonal)` hours. Cell capacity
is `bulkCapacity/3.6*b*dx²` kWh/K. Well water is perfectly mixed with its cell.
Boundary faces use an ambient external cell and the same conductance as an
interior face (a full dx distance, not half dx). No-flow top/base are implicit.
Well locations snap to cell centers; use actual spacing, never nominal alone.

`runThermal` additionally derives flow from hydraulic screening, splits flow by
transmissivity, dispatches heat then cooling then idle each day, and applies COP,
demand and temperature cutoffs. Its monthly rows mix plant energy (MWh, scaled by
pair count) with per-pair thermal budgets; snapshots may be block averaged. This
benchmark bypasses only that plant dispatch using the exported production kernel,
so it tests heat transport, not demand matching/COP/control or the full UI export.
The fixed schedule is explicit in case.json; no model-specific demand feedback.

## Shared reference inputs

| Quantity | Value / convention |
|---|---|
| Aquifer | Homogeneous, confined, fully penetrating doublet; top 0 m, base -20 m |
| Kh | 20 m/day = 0.8333333333 m/hour; isotropic hydraulic K |
| Porosity | 0.30; introduced for GWE partitioning, not an Explorer transport input |
| Water | 1000 kg/m³, cp 4186.8 J/kg/K, matching exactly 1.163 kWh/m³/K |
| Bulk capacity | 2.5 MJ/m³/K; solid cp derived from `(Cb-n*rhow*cpw)/((1-n)*rhos)` |
| Solid density | 2650 kg/m³; cp is dry-solid mass based |
| Conductivity | Saturated 2.4 W/m/K; water 0.6, solid `(2.4-n*0.6)/(1-n)` W/m/K |
| Conductivity time units | GWE uses J and hours: multiply both W/m/K inputs by 3600 |
| Dispersion | Zero in both models; physical conduction remains active |
| Initial temperature | Uniform 12 °C; local thermal equilibrium, constant properties |
| Regional flow | Zero gradient |
| Solver grid | dx=dy=10 m; Explorer 81×61 cells, 810×610 m; actual wells x=305,505 m, y=305 m |
| Warm charge | Hours 0–2160: warm well injects 20 m³/h at 18 °C; cold well extracts equally |
| Storage | Hours 2160–4320: both wells off |
| Warm recovery / cold charge | Hours 4320–6480: warm extracts 20 m³/h; cold injects equally at 6 °C |
| Rest | Hours 6480–8760: both off |
| Time | Maximum 6 h, clipped to stability and period end; MF6 uses same uniform dt within each period |

GWF solves steady confined flow each stress period (no STO), with WEL and CHD.
On a one-cell ghost ring, prescribe the analytical dipole head
`h = Q/(2*pi*(Kh/24)*b) * ln(r_warm/r_cold)` (positive Q means warm extraction),
with arbitrary head datum zero. This retains pumping-induced boundary flux while
avoiding regional flow; uniform fixed heads would change that hydraulic problem.
GWE uses matching grid/ghost ring, EST, CND, UPSTREAM ADV, WEL/CHD auxiliary
temperature via SSM, CTP ambient on the ghost ring, and GWF–GWE exchange.
The ring makes thermal boundary-center distance dx, matching Explorer's boundary
stencil. Top/base are impermeable and thermally insulated in the one-layer model.
Array rows are paired by index; MF6 physical y points in the opposite direction
from Explorer's local row axis. The case is reflection-symmetric; exported NPZ
uses Explorer coordinates. Revisit orientation before any regional-flow extension.

## Deliberate residual differences

GWF discrete heads/face flows approximate Explorer's exact radial face flows.
Near-well cells and finite boundary discretization therefore differ. GWE uses
implicit time integration; Explorer uses explicit integration. The production
sink temperature is start-of-step in Explorer and end-of-step in GWE. Report
these actual sink samples for energy; reduce dt to quantify staggering effects.
This is not bitwise equivalence. CTP budgets include a ghost ring; compare native
whole-model closure separately from Explorer interior closure. Inspect boundary
heat flux and expand the domain before interpreting a finite-domain difference.
Nonzero Explorer facewise dispersion cannot generally be matched by simply
setting MF6 longitudinal and transverse dispersivities to the same number.

## Metrics and interpretation gates (proposed, not calibrated acceptance criteria)

`compare.py` emits active-step production RMSE/max error, signed ambient-referenced
produced energy by phase, warm recovery ratio, 1 K warm/cold plume areas, centroids,
intersection-over-union (IoU), full-field RMSE at every phase end, and native
listing budget discrepancies. Null breakthrough means threshold was not reached,
not zero breakthrough time. The 0.6 K first-anomaly metric is a useful contamination
breakthrough measure during warm charging; during recovery it means onset of
stored-heat recovery. Report them separately. The temperature threshold is 10%
of the 6 K injection anomaly; also assess sustained threshold crossings in follow-up.

Warm energy recovery = `sum(Cw*Q*(Tprod-12)*dt)` during warm recovery divided by
`Cw*20*2160*(18-12)` injected during charging. Report raw signed energy: no COP,
pumping electricity or clipping negative contributions. This first-year ratio
excludes later recovery and does not establish cyclic seasonal performance.

Before interpreting agreement require native water/heat cumulative and rate
budget discrepancies <0.1%, Explorer normalized residual <1e-8, and verify actual
storage change from saved temperatures. Follow-up comparison targets: production
RMSE <=0.2 K, maximum <=0.5 K; recovered energy difference <=5% of injected energy;
plume area difference <=10%, centroid separation <=one common comparison cell,
IoU >=0.8 where nonempty; breakthrough within max(24 h,5% of elapsed phase time).
These are initial engineering targets to review, not universal validation bounds.
Tiny or empty plumes require absolute-area reporting rather than unstable ratios.
No automated pass/validated flag is produced.

For numerical convergence, repeat both models at dx=20,10,5 m; dt=6,3,1.5 h;
padding=300,600 m. Change one factor at a time. Keep 200 m spacing and physical
schedules fixed; note odd-grid domain dimensions change slightly. Larger fine
grids hit Explorer's 30,000-cell limit: domain studies use 10/20 m; fine-grid
studies retain 300 m padding. Compare fine fields after conservative area remap,
not nearest-node interpolation. Require successive production RMSE <0.1 K and
recovery change <2% before judging cross-model mismatch. The current script
compares identical grids only and intentionally rejects unmatched arrays/times.
An all-step cumulative CBC ledger audit is implemented; an independent native
face-flow comparison is still needed. Relative flow-rate closure is ill-conditioned
in idle periods: use an absolute tolerance (proposed 1e-6 m³/h) there. Next: regional flow with explicit orientation and matched
boundary heads; multiple repeated seasons; dispersion formulation study; stacked
independent aquifers and header mixing; vertically resolved aquitard exchange.
Aquitard references test omitted physics and should not be called a matched test
of the present 2D kernel. Field data remains a separate calibration/validation step.

## Primary references

- https://modflow6.readthedocs.io/en/6.6.0/_mf6io/gwe-est.html
- https://modflow6.readthedocs.io/en/6.6.0/_mf6io/gwe-cnd.html
- https://modflow6-examples.readthedocs.io/en/latest/_notebooks/ex-gwe-ates.html
- https://www.usgs.gov/publications/a-new-groundwater-energy-transport-model-modflow-hydrologic-simulator

The official ATES example is a package/API reference, not this case's input deck
or evidence that ATES Explorer has been validated.
