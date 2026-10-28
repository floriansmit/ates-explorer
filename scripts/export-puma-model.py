"""Export the compiled Estonia PUMA model for other geothermal applications.

The export keeps the source model as the authority, resamples its triangular
surfaces to a regular screening grid, and writes two adapters:

* Geothermal Explorer ``architecture-3d.json``;
* GeoDecision Arc/Info ASCII horizon grids.

The final PUMA surface is the top of crystalline basement.  No artificial
basement base or thickness is introduced.

Requires ``pyproj``.  The normal browser build does not run this script.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess

from pyproj import CRS, Transformer


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "src" / "data" / "puma-estonia.json"
DEFAULT_OUTPUT = ROOT / "exports" / "estonia-puma-v1"
NODATA = -9999


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def stratigraphy() -> dict:
    module = (ROOT / "src" / "js" / "puma-stratigraphy.js").as_uri()
    script = f"import {{PUMA_STRATIGRAPHY as x}} from {json.dumps(module)}; process.stdout.write(JSON.stringify(x));"
    result = subprocess.run(
        ["node", "--input-type=module", "--eval", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def barycentric(px: float, py: float, points: tuple[tuple[float, float], ...]):
    (x1, y1), (x2, y2), (x3, y3) = points
    denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
    if denominator == 0:
        return None
    a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator
    b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator
    c = 1 - a - b
    return (a, b, c) if min(a, b, c) >= -1e-7 else None


def regularise(model: dict, spacing: int) -> dict:
    stride = model["meta"]["vertexStride"]
    vertices = model["vertices"]
    triangles = model["triangles"]
    surfaces = model["meta"]["layerCount"] + 1
    xs = vertices[0::stride]
    ys = vertices[1::stride]
    xmin = math.floor(min(xs) / spacing) * spacing
    xmax = math.ceil(max(xs) / spacing) * spacing
    ymin = math.floor(min(ys) / spacing) * spacing
    ymax = math.ceil(max(ys) / spacing) * spacing
    x_axis = list(range(xmin, xmax + spacing, spacing))
    y_axis = list(range(ymax, ymin - spacing, -spacing))
    rows, columns = len(y_axis), len(x_axis)
    values: list[list[float | None]] = [[None] * (rows * columns) for _ in range(surfaces)]
    triangle_index: list[int | None] = [None] * (rows * columns)

    for triangle in range(0, len(triangles), 3):
        indices = triangles[triangle : triangle + 3]
        points = tuple((vertices[index * stride], vertices[index * stride + 1]) for index in indices)
        txmin, txmax = min(point[0] for point in points), max(point[0] for point in points)
        tymin, tymax = min(point[1] for point in points), max(point[1] for point in points)
        col_start = max(0, math.ceil((txmin - xmin) / spacing))
        col_end = min(columns - 1, math.floor((txmax - xmin) / spacing))
        row_start = max(0, math.ceil((ymax - tymax) / spacing))
        row_end = min(rows - 1, math.floor((ymax - tymin) / spacing))
        for row in range(row_start, row_end + 1):
            for column in range(col_start, col_end + 1):
                flat = row * columns + column
                if triangle_index[flat] is not None:
                    continue
                weights = barycentric(x_axis[column], y_axis[row], points)
                if weights is None:
                    continue
                triangle_index[flat] = triangle // 3
                for surface in range(surfaces):
                    elevation = sum(
                        weights[offset] * vertices[index * stride + 2 + surface]
                        for offset, index in enumerate(indices)
                    )
                    values[surface][flat] = round(-elevation, 2)  # positive depth below model sea level
    return {
        "spacing": spacing,
        "xmin": xmin,
        "ymin": ymin,
        "rows": rows,
        "columns": columns,
        "x": x_axis,
        "y": y_axis,
        "depths": values,
        "triangle": triangle_index,
    }


def write_ascii_grid(path: Path, grid: dict, values: list[float | None]) -> None:
    lines = [
        f"ncols {grid['columns']}",
        f"nrows {grid['rows']}",
        f"xllcorner {grid['xmin'] - grid['spacing'] / 2:g}",
        f"yllcorner {grid['ymin'] - grid['spacing'] / 2:g}",
        f"cellsize {grid['spacing']}",
        f"NODATA_value {NODATA}",
    ]
    for row in range(grid["rows"]):
        start = row * grid["columns"]
        cells = values[start : start + grid["columns"]]
        lines.append(" ".join(str(NODATA) if value is None else f"{value:.2f}" for value in cells))
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def export(source: Path, output: Path, spacing: int) -> None:
    model = json.loads(source.read_text(encoding="utf-8"))
    descriptions = stratigraphy()
    grid = regularise(model, spacing)
    layers = model["layers"]
    output.mkdir(parents=True, exist_ok=True)
    geo_dir = output / "geodecision" / "horizons"
    property_dir = output / "properties" / "horizontal-hydraulic-conductivity"
    explorer_dir = output / "geothermal-explorer"
    geo_dir.mkdir(parents=True, exist_ok=True)
    property_dir.mkdir(parents=True, exist_ok=True)
    explorer_dir.mkdir(parents=True, exist_ok=True)

    transformer = Transformer.from_crs(model["meta"]["crs"], 4326, always_xy=True)
    longitude, latitude = transformer.transform(
        [x for _y in grid["y"] for x in grid["x"]],
        [y for y in grid["y"] for _x in grid["x"]],
    )
    horizons = []
    horizon_files = []
    projection_wkt = CRS.from_user_input(model["meta"]["crs"]).to_wkt()
    for index, depths in enumerate(grid["depths"]):
        if index < len(layers):
            code = layers[index]
            horizon_id = f"top-{slug(code)}"
            name = f"Top {code} · {descriptions[code]['name']}"
        else:
            horizon_id = "basement-top"
            name = "Top crystalline basement · base of V2gd"
        filename = f"{index:02d}_{horizon_id}.asc"
        path = geo_dir / filename
        write_ascii_grid(path, grid, depths)
        projection_path = path.with_suffix(".prj")
        projection_path.write_text(projection_wkt + "\n", encoding="utf-8")
        horizons.append({"id": horizon_id, "name": name, "source": filename, "depths_m_bmsl": depths})
        horizon_files.append(
            {
                "path": f"geodecision/horizons/{filename}",
                "role": "basement_horizon" if index == len(layers) else "stratigraphic_horizon",
                "surface_index": index,
                "id": horizon_id,
                "sha256": sha256(path),
                "crs_path": f"geodecision/horizons/{projection_path.name}",
                "crs_sha256": sha256(projection_path),
            }
        )

    intervals = []
    units = []
    property_files = []
    for index, code in enumerate(layers):
        details = descriptions[code]
        conductivity = [
            None if triangle is None else model["conductivity"][triangle * len(layers) + index]
            for triangle in grid["triangle"]
        ]
        property_name = f"{index:02d}_{slug(code)}_kh-m-per-day.asc"
        property_path = property_dir / property_name
        write_ascii_grid(property_path, grid, conductivity)
        intervals.append(
            {
                "id": slug(code),
                "code": code,
                "name": details["name"],
                "top_horizon": horizons[index]["id"],
                "base_horizon": horizons[index + 1]["id"],
                "kind": "non_reservoir" if details["hydraulics"] == "aquitard" else "reservoir",
                "lithology": details["lithology"],
                "hydraulics": details["hydraulics"],
                "horizontal_hydraulic_conductivity_m_day": conductivity,
            }
        )
        units.append({"code": code, **details})
        property_files.append(
            {
                "path": f"properties/horizontal-hydraulic-conductivity/{property_name}",
                "unit": "m/day",
                "interval": slug(code),
                "sha256": sha256(property_path),
            }
        )

    architecture = {
        "model_version": "puma-estonia-2012-export-v1",
        "contract": "geothermal-explorer/architecture-3d/v1-compatible",
        "crs": model["meta"]["crs"],
        "vertical_reference": "source model sea level (exact datum not stated)",
        "vertical_units": "m",
        "depth_convention": "positive down",
        "grid": {
            "rows": grid["rows"],
            "cols": grid["columns"],
            "spacing_m": spacing,
            "longitude": [round(value, 6) for value in longitude],
            "latitude": [round(value, 6) for value in latitude],
        },
        "horizons": horizons,
        "intervals": intervals,
        "basement": {
            "top_horizon": "basement-top",
            "extent": "half_space_below_top",
            "type": "unclassified_crystalline_basement",
            "base_horizon": None,
            "future_overlays": ["basement_type_map", "fault_locations"],
        },
        "wells": [],
    }
    architecture_path = explorer_dir / "architecture-3d.json"
    architecture_path.write_text(json.dumps(architecture, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")

    coverage_path = output / "coverage.geojson"
    coverage_path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"id": "puma-estonia", "name": "PUMA/MOSYS Estonia model", "model": "puma-estonia-2012-export-v1"},
                        "geometry": model["coverage"],
                    }
                ],
            },
            separators=(",", ":"),
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    stratigraphy_path = output / "stratigraphy.json"
    stratigraphy_path.write_text(json.dumps({"units": units}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    manifest = {
        "schema": "ates-explorer/portable-geological-model/v1",
        "id": "puma-estonia-2012-export-v1",
        "title": "Estonia PUMA/MOSYS sedimentary succession and basement top",
        "source_model": model["meta"],
        "export": {"grid_spacing_m": spacing, "rows": grid["rows"], "columns": grid["columns"], "nodata": NODATA},
        "geometry": {
            "horizontal_crs": model["meta"]["crs"],
            "vertical_reference": model["meta"]["datum"],
            "surface_values": "positive depth in metres below source model sea level",
            "resampling": "barycentric interpolation from original triangular mesh",
        },
        "basement": architecture["basement"],
        "coverage": {"path": "coverage.geojson", "sha256": sha256(coverage_path)},
        "stratigraphy": {"path": "stratigraphy.json", "sha256": sha256(stratigraphy_path)},
        "properties": {"horizontal_hydraulic_conductivity": property_files},
        "adapters": {
            "geothermal_explorer": {"path": "geothermal-explorer/architecture-3d.json", "sha256": sha256(architecture_path)},
            "geodecision": {
                "path": "geodecision",
                "format": "Arc/Info ASCII Grid",
                "import_crs": model["meta"]["crs"],
                "vertical_unit": "m",
                "positive_down": True,
                "vertical_datum": "source model sea level (exact datum not stated)",
                "horizons": horizon_files,
            },
        },
        "limitations": [
            "Regional 2012 screening model; not a site model.",
            "The 5 km export grid is a resampling; use the source triangular mesh for point-query fidelity.",
            "Basement is an unbounded half-space below basement-top; no synthetic basement base is supplied.",
            "Basement lithology/type and faults are intentionally unassigned pending later overlays.",
        ],
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    source_readme = ROOT / "docs" / "PUMA_MODEL_EXPORT.md"
    shutil.copyfile(source_readme, output / "README.md")
    print(f"Exported {len(horizons)} surfaces on a {grid['rows']} x {grid['columns']} grid to {output}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--spacing", type=int, default=5000)
    args = parser.parse_args()
    if args.spacing <= 0:
        parser.error("--spacing must be positive")
    export(args.source.resolve(), args.output.resolve(), args.spacing)


if __name__ == "__main__":
    main()
