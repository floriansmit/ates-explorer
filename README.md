# ATES Explorer v0.6.0

[ChatGPT Sites app](https://ates-explorer.floriansmit88.chatgpt.site/) · [User guide](docs/USER_GUIDE.md) · [Model and validation](docs/MODEL.md) · [Developer guide](docs/DEVELOPMENT.md) · [Codex handover](HANDOVER.md)

![ATES Explorer custom profile](docs/screenshots/custom-profile.jpg)

This repository contains the complete browser application, vendored map libraries, 37 automated tests and a GitHub Pages deployment workflow. See [deployment instructions](docs/DEPLOYMENT.md) for the Pages activation step and [screenshot catalogue](docs/SCREENSHOTS.md) for reproducible examples.

Portable browser tool for low-temperature aquifer thermal energy storage and building demand matching. No npm dependencies. Source for the existing closed-loop Borefield Explorer was unavailable, so this is an independent companion.

## Run and build

`npm start` (Python 3) serves http://localhost:8080. `npm test` requires Node 18+. `npm run build` generates `dist/` and a downloadable source ZIP. Serve through HTTP: browser ES modules and module workers do not run reliably under file://. The hosted application is static; calculations run on the visitor's device, and TNO OPeNDAP queries go directly to TNO with CORS. No telemetry, credentials or automatic persistence.

## Working features

- Country selector: Netherlands (TNO REGIS II), Denmark (GEUS FOHM service), or Other / custom profile (worldwide). Country change clears geology, screens and results while retaining building and plant assumptions.
- Live REGIS II point query for Dutch RD coordinates (EPSG:28992); full local layer table, missing data handling, version/time/query/cell bounds provenance.
- Live Danish GEUS point profiles for ETRS89 / UTM 32N (EPSG:25832), separated into named FOHM / DK-model / deep-geology groups. Select a single group; groups are never merged. Version is explicitly unreported by this point service.
- Danish address search uses the current KDS Adressevælger house-number search and coordinate lookup; the obsolete DAWA API is not used. Danish map uses OpenStreetMap with attribution.
- Connected workflow: PDOK address/place search or map click → local REGIS depth profile → multi-select aquifer intervals → apply to the system. No automatic example calculation or silent fallback.
- Stack-aware screened intervals: editable screen top/base (source elevation datum) and Kh per unit; net thickness and summed transmissivity exclude clay and unselected gaps. Aggregate thickness/Kh are derived and read-only.
- Live PDOK/Kadaster BRT background map; vendored Leaflet and Proj4 with licences. Coordinate conversion is approximate RD/WGS84 transformation, adequate for regional 100 m data rather than survey use.
- Ideal confined-well hydraulic flow estimate and cap, ideal parallel independent pairs, monthly building load matching.
- CSV load import, JSON scenario export and restore, monthly screening result CSV export, full transient JSON export.
- Separate depth-averaged 2D conservative thermal fields per selected sand in a cancellable Web Worker: radial doublet, regional flow, seasonal reversal, upwind advection, conduction and approximate face dispersion. Flow splits by transmissivity under a common head-change assumption; production mixes at a shared header and injection/operating times are common. Temperature maps can switch between intervals.
- Production temperatures constrain thermal power and free-cooling operation. Heating COP follows a calibrated Carnot fraction (not manufacturer data).
- Synchronous plan-view and cross-section playback, time slider and stepping, monthly production-temperature plot, final-year delivered/unmet energy and electricity. Output cadence selects daily, weekly or month-end saved states; the numerical solver still uses its own adaptive steps.
- Thirty-seven automated numerical/parser/profile tests, including energy conservation, uniform-temperature invariance, reversal, zero loads and a Gaussian conduction benchmark (<2% relative L2 error in that test).

## Live service

Source: https://www.dinodata.nl/opendap/REGIS/REGIS.nc (TNO Geological Survey). Verified dataset on 26 October 2026: REGIS v02r2s3, 132 layer entries, grid coordinates x=0..279900, y=300000..624900 at 100 m steps, m NAP positive up. Cell bounds are obtained from grid convention: x coordinates are left edges and y coordinates lower edges, verified against bounds. Layer codes are retained as supplied. Kh/Kv and standard deviations are m/day, transmissivity m²/day, resistance days. No-data -9999 becomes null, never a substituted estimate. Aquifers with unknown conductivity can be selected, but calculations remain blocked until positive Kh is supplied. Service failure is reported without silently substituting data. Queries time out and retry once.

Browser test at RD (121687, 487326) returned 32 nonzero layers; selecting NUPZ-WAz2 applied thickness 19.66 m and Kh 39.38 m/day and completed the five-year run. This is a software test location, not an endorsed site/design. The v0.4 browser test used the public address Dam 1, Amsterdam via PDOK; the map and profile loaded, selecting NUEEz2 and NUSTz2 gave 12.43 m net sand over 52.12 m total span (39.69 m excluded), and the coupled five-year run completed with two separate fields. These figures are test evidence, not site advice.

## Physics and limitations

See the Model tab for equations. This remains experimental screening, not an independently validated or calibrated design model. REGIS is regional evidence. Actual feasible screens, saturated thickness, groundwater chemistry, salinity, injection pressure, interference and permitting need site-specific evidence.

Fast screening uses constant COP and ΔT, monthly energy ceilings and a separate diagnostic warm/cold inventory. That diagnostic loss parameter does not enter the transient solver. Monthly power ratios do not establish peak-hour coverage.

Transient model: each screened sand is a separate homogeneous fully penetrating aquifer, water/rock local thermal equilibrium, uniform Cartesian grid, ambient open boundaries, exact face integrals of radial flow and uniform background Darcy flux. Conservative finite-volume upwind advection; conduction plus approximate face dispersion; adaptive positivity timestep. Injection is imposed at user target temperatures. Heating uses warm well → cold well, cooling reverses. Monthly demand is uniform within each day; heating priority, cooling next, idle last. Identical pairs are independent, with no mutual interference. The per-pair total hydraulic limit is proportional to Σ(Kh_i × screen thickness_i); interval flow share is T_i/ΣT. Clay and other gaps do not contribute to transmissivity or thermal storage. Separate grids advance together at a common stable timestep. Flow-weighted production mixes into a shared heat-pump/direct-cooling header. Initial heads are assumed compatible; vertical groundwater/thermal leakage, off-cycle crossflow and different per-layer injection constraints are not represented. The heat pump is a bounded Carnot-fraction approximation calibrated to nominal COP at ambient groundwater and supply temperatures. Pumps are based on specified total circuit head. Backup is excluded.

Bulk saturated heat capacity is entered in MJ/m³/K and includes rock and water. Porosity is not separately required in this local-equilibrium formulation. Grid cell-average production temperatures have numerical mixing and strong near-well resolution dependence; wells snap to centres and actual spacing is reported. Domain must be checked for boundary effects. Plan view and a conceptual well-to-well cross-section show saved output states from initial conditions to the final year. Daily, weekly and month-end states can be stepped, scrubbed or played at 1/2/4 states per second. Cross-section temperatures are vertically uniform within each screened interval and clay is shown only as geological context; this is not a 3D thermal calculation. The local column is extended horizontally, so it does not map lateral stratigraphic variation. No vertical aquitard conduction or inter-layer leakage, density/buoyancy, reactive transport, well skin/clogging or neighbourhood interference.

Energy residual is storage change minus boundary input minus well input, in kWh per independent pair; building totals sum pairs. Numerical tests and a conduction benchmark do not validate ATES predictions. Established-solver advection/doublet benchmarks and field calibration remain necessary. No seasonal thermal recovery efficiency is claimed.

## Files

`location.js`: PDOK search, Leaflet map and RD/WGS84 conversion. `reservoirs.js`: screen validation, transmissivity and flow allocation. `engine.js`: stack-aware monthly screening. `thermal.js`: transient model. `snapshots.js`: bounded display snapshots and sampling. `thermal-viewer.js`: synchronised timeline, plan view and conceptual section. `thermal-worker.js`: worker boundary with transferable display buffers. `regis.js`: live adapter/parser. `app.js`: UI/import/export. `tests/`: invariants and benchmark. `scripts/build.mjs`: static build and portable source ZIP. `HANDOVER.md`: continuation priorities. `.openai/hosting.json` links the existing private Site; preserve project_id when editing that Site, and omit the manifest when creating a separate unrelated Site.

## Import formats

Monthly CSV: `month,heat_MWh,cool_MWh` then 12 nonnegative finite rows, months 1–12 in order. Overrides annual demand fields. Scenario JSON: schemaVersion 5 includes inputs with reservoirs, thermalInputs, monthlyLoads and profile/location provenance; imported inputs are checked. Files stay on device unless the visitor chooses to share them elsewhere.

## v0.4 model checks

Tests cover net versus gross thickness, clay exclusion, partial screens, invalid/overlapping screens, flow splits, separate temperature fields, stacked energy conservation and equivalence to one combined aquifer when Kh is identical. A synthetic stack can be opened explicitly for exploration; it is visibly labelled and never used as fallback for failed live retrieval. Resetting system settings preserves applied screen intervals. Changing map/address or draft selection disconnects previous results until the new intervals are applied.

## Playback and output memory

An immutable initial frame is saved, then actual fields at the chosen output interval. Month-end uses calendar month boundaries (365-day repeating year); weekly includes the final day even if off cadence. All layers are saved at the same simulation time. For display, each frame contains block-average plan temperatures and a separate average along the exact well centreline. Physical cell-block edges are retained, including smaller edge blocks. Layout is selected before simulation to cap saved Float32 values at two million (about 8 MB of temperature data), plus object/geometry overhead. Full solver grids and final results are not coarsened. Worker buffers transfer ownership to the UI rather than being copied. Exports convert typed arrays to plain JSON arrays; exports can be substantially larger than in-memory snapshots. Playback pauses on input invalidation, tab navigation and browser page hiding.

## Independent validation recommendation

The app combines analytical hydraulics with a custom numerical thermal model. Benchmark independently with MODFLOW 6 GWF/GWE first for low-temperature ATES. Official GWE documentation describes groundwater/rock heat storage, transport and multi-aquifer wells, and MODFLOW publishes an ATES example. OPM Flow also supports thermal physics and temperature-dependent properties; consider it for reservoir-style well controls and deeper geothermal workflows. No established-simulator comparison has yet been run for this app.

Suggested benchmark matrix: isolated homogeneous doublet with no regional flow; repeated seasonal operation with regional flow; stacked sands with contrasting transmissivity; then aquitard heat conduction and vertical leakage using a vertically resolved model. Match boundaries, heat capacities, thermal conductivity, dispersivity, screen geometry, injection schedule and plant energy accounting. Compare production-temperature trajectories, recovered energy, plume extent and head changes; repeat with finer meshes, smaller timesteps and larger domains. Independent numerical agreement checks implementation and simplification error, while field pumping/thermal observations are needed for site calibration.

References: https://www.usgs.gov/publications/a-new-groundwater-energy-transport-model-modflow-hydrologic-simulator ; https://modflow6-examples.readthedocs.io/en/latest/_notebooks/ex-gwe-ates.html ; https://opm-project.org/?page_id=19

## Denmark provider and missing hydraulic properties

FOHM endpoint: `https://fohm.geus.dk/getvirtualborehole/1/{x}/{y}`, integer ETRS89 / UTM 32N coordinates. Records are grouped by `modelnavn`; each `data[0]` gives `[0, top, bottom]` elevations. Missing, nonfinite, zero/negative thickness and -9999 entries are omitted and counted. Each named model remains a separate profile; a FOHM group is preferred when returned, otherwise the explicit DK-model/deep-group name is displayed. An empty response reports unavailable coverage rather than substituting geology. Rønne had no intervals at the tested point during feasibility checks; model coverage must be evaluated per location.

Danish geometry does not contain Kh or Kv. These remain null. Candidate sands (including named Bastrup/Billund/Odderup units) and chalk/limestone can be selected and applied without Kh; the system shows the real screened geometry but blocks performance and thermal simulation until all Kh values are positive finite numbers. Entered Kh is labelled as user supplied/assumed; an optional evidence field records a pumping-test reference or assumption. A scenario can be exported/restored while conductivity is pending. No REGIS/default Kh is silently carried into Danish intervals. Chalk/limestone is approximated as an effective porous medium; fractures are not explicitly modelled. Classification uses unit names/codes and needs local geological confirmation. The FOHM thermal-conductivity endpoint is not automatically used.

The point response does not declare vertical datum: Danish elevations are labelled “m source elev.”, never Dutch NAP or an assumed DVR90. Confirm source model datum for design. Screen geometry and the cross-section preserve those labels and source values. Dutch profiles retain their NAP metadata.

Danish addresses: `https://adressevaelger.dk/husnumre/soeg?tekst=...&maksimum=6&token=adressevaelger123`, then `/husnumre/{id}?token=...`. KDS documentation recommends that public transition token while user management is not yet introduced (checked 26 October 2026). It is not a private credential. Lookup returns explicit `EPSG:25832` point geometry; unexpected CRS or absent coordinates fail rather than guessing. Broad street suggestions refine the search; choosing an exact house number resolves the coordinate before retrieving geology. Search and profile responses are guarded against stale country/location requests. Future KDS authentication changes will need an adapter update.

References: https://fohm.geus.dk/ ; https://confluence.kds.dk/display/ADV/Brugerstyring ; https://confluence.kds.dk/pages/viewpage.action?pageId=244318431 ; https://confluence.kds.dk/pages/viewpage.action?pageId=246743156 ; https://dataforsyningen.dk/data/4924

Browser verification for v0.5: selecting Denmark, searching the public test address Sankt Kjelds Plads 11, 2100 København Ø, retrieving Sjælland (FOHM), applying sand 400 and 1200 with null Kh, observing the blocked calculation, entering explicitly labelled test assumptions and completing a five-year/two-field thermal run all passed. Changing to Sjælland (DK-model) cleared the previous screens/results. These tests do not establish site suitability or measured conductivity.

### Worldwide custom profiles (v0.6)
Choose Other / custom profile to hide national lookup controls. Define the site, elevation reference and aquifer/aquitard layers, update the preview, select aquifers and apply them. Depths are positive down; elevations are positive up. Clay gaps do not contribute to screened thickness or transmissivity. Enter missing Kh before calculating. Custom definitions and evidence are preserved in scenario JSON. See europe-models.html for the sourced country expansion inventory and estonia-integration.html for a proposed EGT data request.
