# Estonia PUMA portable model export

This directory is a portable, versioned export of the compiled Estonia subset
of the 2012 PUMA/MOSYS Baltic Artesian Basin hydrogeological model. It contains
the complete modelled sedimentary succession, a top-of-basement surface, unit
lithology metadata and the model coverage polygon.

The original variable-resolution triangular mesh is authoritative. The adapter
files use barycentric interpolation to a 5 km regular grid so applications that
expect a raster-like architecture can load the same horizons. This resolution
is appropriate for regional screening, not site design.

## Geothermal Explorer

`geothermal-explorer/architecture-3d.json` follows the existing
`architecture-3d.json` shape used by Geothermal Explorer. It provides a regular
grid in WGS84 for display, 43 positive-down depth surfaces, 42 named intervals,
PUMA horizontal hydraulic conductivity per interval, and no wells. The
additional `basement` member declares the region below
`basement-top` as an unbounded crystalline-basement half-space.

The current Geothermal Explorer frontend still loads one hard-coded model file.
To expose this as a second selectable model, point its model registry/selector
at this file and teach its basement renderer to extend below `basement-top` to
the viewer's current maximum depth. Do not invent a geological base horizon.

## GeoDecision

Import the files in `geodecision/horizons` in numerical order. For every file:

- CRS: `EPSG:25884` (ETRS89 / TM Baltic93)
- vertical unit: metres
- direction: positive down
- vertical datum: source model sea level; exact datum is not stated
- NoData: `-9999`

Each `.asc` has a same-named `.prj` sidecar containing the EPSG:25884 WKT. If a
GeoDecision/GDAL installation does not discover the sidecar, select EPSG:25884
explicitly in the import review.

Assign files `00` through `41` as **Stratigraphic horizon** and file `42` as
**Basement horizon**. The grids have identical CRS, dimensions, origin and cell
size, which is required by GeoDecision's horizon-stack checks. Formation and
lithology descriptions are in `stratigraphy.json` and the exact ordered import
recipe plus checksums is in `manifest.json`.

PUMA horizontal hydraulic conductivity is retained in
`properties/horizontal-hydraulic-conductivity` in m/day. GeoDecision's current
formation editor asks for permeability rather than hydraulic conductivity, so
these grids are evidence, not a unit-equivalent permeability import. Conversion
requires an explicit fluid density/viscosity assumption.

GeoDecision may require a finite decision maximum depth when it builds an AOI.
That is a calculation/view boundary inside the basement half-space, not a
geological basement-base interpretation.

## Basement and future overlays

Everything below `basement-top` is classified as
`unclassified_crystalline_basement`. The export deliberately leaves these
separate future inputs empty:

- basement type/lithology polygons;
- mapped fault traces or fault surfaces.

Those datasets can later be overlaid without changing the sedimentary horizon
stack or pretending the PUMA model resolves basement architecture.

## Rebuild

From the ATES Explorer repository root:

```powershell
python scripts/export-puma-model.py
```

The exporter requires Python `pyproj` and Node.js. It reads the compiled PUMA
mesh and the application's checked-in stratigraphic nomenclature so descriptions
cannot silently diverge between the profile and portable model.
