# Model architecture and scientific scope

## Hydraulic and monthly screening

For a screened stack, transmissivity is `Σ(Kh_i × b_i)`, net thickness is `Σb_i`, and equivalent Kh is transmissivity/net thickness. Clay and unscreened gaps are excluded. The isolated confined-well estimate is `Q = 2π T s / ln(R/r)`, converted from m³/day to m³/h and capped by requested pair flow. One well pair does not double this flow. Layer flow shares are `T_i/ΣT`. Independent pairs scale building totals without modelling inter-pair interference.

Source power is `1.163 × flow_m3h × ΔT_K` kW. Heating delivery includes compressor energy through nominal COP; direct cooling returns building heat to the aquifer. Monthly demand is limited by capacity and calendar hours, not an hourly dispatch calculation. The diagnostic warm/cold inventories and annual loss fraction are used only in screening and do not alter transient transport.

## Transient heat transport

`thermal.js` advances a separate homogeneous, depth-averaged Cartesian field per connected aquifer. Radial doublet face flows are superimposed on regional Darcy flow, `q_D = Kh × hydraulic_gradient`. Bulk saturated heat capacity includes rock and water. Advection uses conservative first-order upwind fluxes; conduction uses central differences and face dispersion is approximate. A positivity bound controls explicit timesteps. Uniform ambient-temperature open boundaries apply.

Heating extracts from the warm well and injects at the cold target; cooling reverses. Monthly loads are spread uniformly over days, dispatching heating first, then cooling, then idle transport. Regional flow and conduction continue while idle. Flow-weighted production mixes at a common header. Production temperature limits delivered energy; heating COP is a bounded, calibrated Carnot fraction, not a manufacturer's curve. Direct cooling is limited by supply temperature and exchanger approach. Injection targets are imposed rather than calculated from a full surface plant.

Monthly building rows are scaled across pairs. The returned boundary/well/storage energy ledger and numerical residual are per independent pair/domain. Interpret units before comparing those quantities. Snapshots are block-averaged only for display; solver grids are not coarsened by saved-output cadence.

## Views

Plan fields show cell-average temperatures at saved times. The section extrudes each field's centreline across screen thickness. Neither vertical gradients nor clay temperatures are calculated. Well positions snap to grid centres: actual spacing is displayed and may differ from requested spacing. The axes are local simulation axes; no geographic well orientation has been specified.

## Excluded processes

- Vertical aquitard heat exchange/leakage, buoyancy and density-dependent flow.
- Different initial layer heads, off-cycle crossflow, partial penetration physics, skin and nonlinear well losses.
- Explicit fracture/karst flow, clogging, geochemistry, salinity effects and injection-pressure design.
- Neighbouring systems or interactions among repeated pairs.
- Hourly equipment control, simultaneous heat recovery, manufacturer maps and backup electricity.

Carbonate and other rock aquifers are equivalent porous media. Regional geometry and entered Kh do not establish operational suitability. No independent MODFLOW/OPM comparison or field calibration has been completed. See VALIDATION.md for the distinction between code checks and predictive evidence.
