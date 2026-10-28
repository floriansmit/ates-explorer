# Codex handover: ATES Explorer v0.6.0

User intent: open-loop ATES companion to existing REGIS II-based closed-loop Borefield Explorer, later transferred into user-owned GitHub/Codex. Obtain the existing Borefield Explorer repository before integration. This independent implementation is hosted through ChatGPT Sites, currently public, and is being transferred to floriansmit/ates-explorer. Preserve `.openai/hosting.json` identity for updates to that Site.

## Implemented

Live TNO OPeNDAP adapter, exact layer codes, NAP elevations and provenance; manual overrides; monthly load matching/import; scenario restore/export; experimental 2D transient heat transport in a worker, seasonal doublet reversal, regional flow, approximate dispersion and conduction, production-temperature limits and variable approximate COP, temperature plots/maps and energy ledger. All limitations in README and Model tab apply.

Automated tests cover numerical behaviour, providers, profiles and source structure; live retrieval, aquifer selection and a five-year thermal run were exercised in browser. Mobile responsive CSS implemented; no physical iPhone test performed. Analytical Gaussian conduction test passes; this is not validation of the ATES/doublet model.

## Next priorities

1. Compare radial transport/advection/doublet and seasonal results with analytical references and MODFLOW 6 GWF/GWE; test spatial/timestep convergence and larger domains. Calibrate against measured systems. Avoid claims of validated prediction until complete.
2. Import measured hourly loads; weather-based templates; explicit equipment schedules, simultaneous heat recovery, peak/backup dispatch and manufacturer heat-pump performance maps.
3. Add screen interval constraints, pumping tests, saturated thickness/head information, uncertainty. Add vertical heat exchange through confining layers and neighbouring-system interactions.
4. Location UX now includes official PDOK geocoding and BRT map, local profile preview and multi-select sands. Improve profile interaction, aquifer grouping and field-specific evidence as needed.
5. Add robust project persistence, scenario comparison and ensemble uncertainties; whole-life economics, NPV and consistent closed-loop/air-source/district-energy baselines.
6. Support jurisdiction-specific spatial/permitting evidence and groundwater chemistry constraints separately from engineering calculations.

## Numerical conventions

Flow m³/h, temperature °C, capacities kWh/K, source/boundary heat kWh, building outputs MWh. Bulk saturated heat capacity includes rock+water. Each pair is simulated independently, with totals scaled by pair count. Within a pair, screens have separate grids, share operating timesteps, split flow in proportion to transmissivity and mix production into a shared header. Clay gaps remain outside transmissivity and heat storage; vertical inter-layer leakage and different layer heads are not represented. Adaptive explicit stepping uses outgoing-advection plus conduction coefficients. Heating-priority daily dispatch approximates monthly demand; no hourly demand coverage implied. No vertical leakage or density effects. Defaults are illustrative except properties explicitly selected from REGIS.

Source download is built into site footer. No application licence has been selected. The user explicitly requested publication to their public GitHub repository. Do not add a licence without an explicit choice; preserve vendored third-party licence notices.

## Connected stack workflow

Address search/map pick retrieves and previews the local profile; checkboxes select sand units and an explicit Apply action connects them to the plant box. Default example calculations were removed. Screen top/base and Kh can be edited per interval; aggregate net thickness and Kh are derived. New location or draft selection clears active calculations to prevent stale results. Restoring v0.5 scenarios preserves screens/profile/location; legacy v0.2 scenarios are migrated. Synthetic example is an explicit separate action. The five-year browser test used two separated REGIS sands and completed successfully.

## v0.5 visualisation

Saved output cadence is independent of solver timestep: daily, weekly or month-end states, beginning at day zero. Each state has every layer at a common time, block-averaged plan field and exact-centreline sample. A preselected stride bounds display temperature storage to two million Float32 values; final solver results stay full resolution. Timeline scrubbing, previous/next, playback (1/2/4 states/s), selected-layer plan view and all-layer cross-section are synchronised. Cross-section shows local-column geometry extended horizontally and each sand's depth-averaged temperatures, with geological gaps uncoloured thermally. Do not describe it as a vertically resolved model or imply clay temperature predictions.

Snapshots transfer from worker to UI without buffer duplication; JSON export serialises typed arrays to numeric lists. Tests check initial/final snapshots, calendar/cadence, unchanged numerical results across output intervals, memory cap, centreline sampling and JSON representation.

Validation choice: recommend MODFLOW 6 GWF/GWE as first low-temperature ATES reference; OPM Flow is a thermal-capable alternative for reservoir/deeper-geothermal workflows. Neither has yet been run as a benchmark for this app. The app Model tab and README document a comparison matrix and the distinction between code verification, independent solver comparison and field calibration.

## v0.5 Denmark enabled

`countries.js` owns provider/CRS/map defaults, lithology semantics and elevation labels. `fohm.js` fetches and parses GEUS virtual boreholes, groups by `modelnavn`, and never merges overlapping models. The app selects one explicit source group and preserves its name and unreported-version status. Missing conductivity is allowed at the geometry stage via `stackGeometry`; `stackProperties`/all simulation requires positive Kh for every selected interval. Optional evidence notes and Kh provenance are exported. Candidate sands and chalk/limestone can be selected; carbonate modelling remains an effective porous-medium approximation.

Address service: current KDS Adressevælger, not retired DAWA. Search returns suggestions, then exact house-number ID lookup yields explicit EPSG:25832 coordinates. Public KDS transition token is documented in `location.js`; watch for future authentication changes. Denmark uses normal interactive OSM tiles with attribution. Changing country resets location/profile/screens/results and guards stale requests; building/plant settings stay editable.

Danish source vertical datum is unconfirmed by the point endpoint and must not be relabelled NAP/DVR90. Profiles/screens/cross-section carry `datumShort`. FoHM-derived thermal-conductivity estimates have not been integrated; they require provenance/method validation first. Country, selected group, raw returned groups, geometry, missing Kh, entered Kh source/evidence and location are retained in schema v5 scenarios. Legacy scenarios default to the Netherlands unless their profile country explicitly states otherwise.

## v0.5.1 Profile selection

Aquifer bands and labels in the 1D profile toggle the same draft selection as table checkboxes. Selected bands and rows are highlighted; profile taps reveal the matching row inside the layer list. Clay remains nonselectable. Enter/Space toggles focused bands and preserves keyboard focus. Apply selected aquifer intervals to reconnect the system after selection changes. Browser checks used a real 32-unit REGIS profile and verified multi-selection, deselection, checkbox synchronization and keyboard controls.

## v0.6 Other / custom profiles

OTHER hides address/map/coordinate retrieval. The custom editor defines unique named aquifers and aquitards using positive-down top/base depths and a named elevation reference; custom-profile.js converts to the common positive-up elevation schema and rejects overlaps, reversed/empty geometry and invalid Kh. Sand/gravel, generic aquifer/sandstone and carbonate can be selected; clay/non-reservoirs cannot. Missing Kh is allowed for geometry and still blocks performance. Updates invalidate connected reservoirs before a new preview is applied. Scenario schema v6 retains customDefinition and restores its editor as well as selected screen configuration. No Estonian geometry is fabricated.

The hosted Europe inventory and EGT integration request are linked from Model & next steps and included in downloadable source. The inventory distinguishes verified model families from unassessed countries, public viewing from numerical APIs, and geological frameworks from hydrogeological columns. Three custom-profile tests cover conversions, stacked calculations, missing/invalid data and JSON round trips.

## Estonia PUMA/MOSYS integration

`scripts/compile-puma.py` clips the public University of Latvia PUMA/MOSYS VTK model to Estonia while retaining its original triangular-prism mesh, 43 surfaces and 42 horizontal-conductivity layers. The generated `src/data/puma-estonia.json` supports browser-local barycentric point queries through `puma.js`; no runtime proxy or CORS-dependent PUMA call is used. The model is from 2012 and must be described as regional screening evidence, not a current EGT model or site verification. Required University of Latvia/PUMA/Virbulis et al. citation is retained in the dataset metadata and UI documentation.

`src/js/puma-stratigraphy.js` is the single source of truth for PUMA code names, typical Estonian lithologies and aquifer/aquitard roles. It is based on the EGT national stratigraphic column, the Estonia–Latvia hydrostratigraphic correlation and the original PUMA paper. Do not revert to classifying units by Kh alone: Ordovician–Silurian packages are carbonate successions, O1 is mixed, Devonian packages alternate clastic and carbonate units, and named `*`, Narva, Lontova and Kotlin intervals are explicit aquitards. The local stratigraphic column is rendered from the same metadata used by the profile table.

The Estonia map shows the queryable compiled PUMA subset in green, the published Lääne-/Ida-Viru regional-model coverage as a dashed catalogue polygon, and Lake Uljaste as a location-only marker because no verified digital model boundary/package is public. Administrative outlines derive from OpenStreetMap under ODbL. Virumaa and Uljaste must not be presented as queryable until their numerical packages, reuse terms, CRS/datum and layer semantics are obtained.

## Working from GitHub / Codex

Repository: https://github.com/floriansmit/ates-explorer (main). Read docs/DEVELOPMENT.md, docs/MODEL.md and docs/VALIDATION.md before changing calculations. Run npm test and npm run build. Application source lives under `src/`: JavaScript in `src/js/`, styles and vendored browser assets in `src/assets/`, supporting pages in `src/pages/`, and examples in `src/data/`. `dist/` is generated and ignored. No dependency installation is required for the app. A GitHub Actions workflow builds and publishes `dist/` after Pages is enabled with GitHub Actions as its source. The ChatGPT Sites deployment is separate and is not automatically updated by a GitHub push. Preserve `.openai/hosting.json` only when working on the existing Sites project; do not accidentally register a duplicate Site.

Documentation screenshots use illustrative assumptions or explicitly identified public REGIS test coordinates. They are software examples, not calibrated Estonia/site results. Pending scientific work: independent MODFLOW/OPM comparison, advection convergence, vertical leakage/conduction, hourly dispatch, manufacturer curves, actual saturation and field calibration. The Europe inventory is a research shortlist with unknown entries, not a complete registry. EGT's proposed JSON example is not an existing EGT endpoint.
