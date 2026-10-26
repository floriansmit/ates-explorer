# Verification and remaining validation

## v0.6.0 evidence

`npm test`: 37 passing tests. Coverage includes hydraulic/energy conversions, zero-load behaviour, seasonal screening inventory accounting, invalid inputs, layer geometry, conductivity flow splits, stacked fields, equivalent homogeneous stacks, conservative thermal transport, flow reversal, background-flow ambient invariance, snapshot time/memory/output consistency, JSON representation, FOHM grouping/classification/missing data, Danish address CRS parsing and custom profile normalization/round trips. A Gaussian conduction test checks one analytical diffusion benchmark; it is not a full doublet/ATES validation.

Browser exercises completed during development: real Dutch REGIS retrieval, profile/list multi-selection and keyboard toggling; Danish address/profile selection and missing-Kh gate; custom stacked aquifers with clay excluded from net thickness, manual Kh entry, thermal run and invalidation on profile edits/country changes. Screenshots document reproducible software examples. No physical-phone test or independently calibrated Estonia example is claimed.

## Benchmark priorities

1. Match a homogeneous doublet with no regional flow against an independent reference.
2. Compare advection/regional-flow cases and seasonal energy recovery, including grid/time/domain convergence.
3. Compare stacked aquifers with contrasting transmissivity and a mixed production header.
4. Add a vertically resolved reference with aquitard heat exchange, leakage and initial head contrasts.
5. Compare production temperatures, plume extent, energy, heads and delivery with measured systems.

MODFLOW 6 GWF/GWE is the first proposed reference for low-temperature groundwater ATES; OPM Flow is another possible thermal reference, especially for reservoir-style workflows. Neither has been executed as an independent benchmark in this project.

References: [USGS GWE](https://www.usgs.gov/publications/a-new-groundwater-energy-transport-model-modflow-hydrologic-simulator), [MODFLOW ATES example](https://modflow6-examples.readthedocs.io/en/latest/_notebooks/ex-gwe-ates.html), [OPM Flow](https://opm-project.org/?page_id=19).
