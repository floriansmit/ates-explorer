"""Compile the Estonia portion of the public PUMA/MOSYS VTK model for the browser.

The source archive is intentionally not committed (about 114 MB compressed). The
generated subset retains the source triangular mesh, all 43 geological surfaces,
and horizontal conductivity for all 42 model layers.

Requires Python packages ``pyproj`` and ``shapely``. The normal application build
does not run this script or require those packages.
"""

from __future__ import annotations

import argparse
from array import array
from datetime import datetime, timezone
import json
from pathlib import Path
import urllib.request
import zipfile

from pyproj import Transformer
from shapely.geometry import shape, Polygon
from shapely.ops import transform, unary_union


SOURCE_URL = "https://www.puma.lu.lv/fileadmin/user_upload/lu_portal/projekti/puma/Interactives/MOSYS-BAB.VTK.zip"
SOURCE_PAGE = "https://www.gprm.lu.lv/lv/dati/baltbasinhgmodelis/"
BOUNDARY_URL = "https://nominatim.openstreetmap.org/search?country=Estonia&format=geojson&polygon_geojson=1&polygon_threshold=0.005&limit=1"
LAANE_VIRU_URL = "https://nominatim.openstreetmap.org/search?q=L%C3%A4%C3%A4ne-Viru%20maakond%2C%20Estonia&format=geojson&polygon_geojson=1&polygon_threshold=0.003&limit=1"
IDA_VIRU_URL = "https://nominatim.openstreetmap.org/search?q=Ida-Viru%20maakond%2C%20Estonia&format=geojson&polygon_geojson=1&polygon_threshold=0.003&limit=1"
LAYERS = "Q,Q2,Q3,Q4,PgNg,K,J,J*,T,P2,P2*,C,C*,D3insk,D3stel,D3ogkt,D3ogkt*,D3dg,D3slp,D3pl,D3pl*,D3am,D3am*,D3gl,D3gl*,D2br,D2br*,D2ar,D2nr,D1gr-D2zpr,S4pr,S3ld,S2vn,S1ln,O3,O2,O1,Cmtr,Cmln,V2vr,V2kt,V2gd".split(",")
SURFACE_COUNT = len(LAYERS) + 1


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "ATES Explorer research integration (https://github.com/floriansmit/ates-explorer)"},
    )
    with urllib.request.urlopen(request) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)


def boundary(path: Path) -> tuple[object, dict]:
    if not path.exists():
        download(BOUNDARY_URL, path)
    document = json.loads(path.read_text(encoding="utf-8"))
    feature = document["features"][0]
    wgs84 = shape(feature["geometry"])
    projector = Transformer.from_crs(4326, 25884, always_xy=True).transform
    return transform(projector, wgs84), feature["geometry"]


def first_geometry(path: Path, url: str) -> dict:
    if not path.exists():
        download(url, path)
    return json.loads(path.read_text(encoding="utf-8"))["features"][0]["geometry"]


def write_coverages(estonia_geometry: dict, laane_path: Path, ida_path: Path, output: Path) -> None:
    virumaa = unary_union(
        (shape(first_geometry(laane_path, LAANE_VIRU_URL)), shape(first_geometry(ida_path, IDA_VIRU_URL)))
    )
    collection = {
        "type": "FeatureCollection",
        "attribution": "Administrative boundaries © OpenStreetMap contributors, ODbL 1.0.",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "puma-estonia",
                    "name": "PUMA/MOSYS · compiled Estonia subset",
                    "status": "queryable",
                    "description": "Original model mesh clipped to Estonia; click within this green area to retrieve a 42-layer model column.",
                    "source": SOURCE_PAGE,
                },
                "geometry": estonia_geometry,
            },
            {
                "type": "Feature",
                "properties": {
                    "id": "virumaa",
                    "name": "Virumaa regional MODFLOW model",
                    "status": "catalogued",
                    "description": "Published coverage is Lääne- and Ida-Viru counties. Numerical model files are not publicly queryable here yet.",
                    "source": "https://virumudel.ut.ee/modelleerimine/",
                },
                "geometry": virumaa.__geo_interface__,
            },
            {
                "type": "Feature",
                "properties": {
                    "id": "uljaste",
                    "name": "EGT Lake Uljaste 3D model",
                    "status": "location-only",
                    "description": "Study location only: EGT publishes the report but not a verified digital model boundary or query package.",
                    "source": "https://fond.egt.ee/fond/egf/9757",
                },
                "geometry": {"type": "Point", "coordinates": [26.742, 59.365]},
            },
        ],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(collection, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")


def next_nonempty(stream) -> str:
    while line := stream.readline():
        value = line.decode("ascii").strip()
        if value:
            return value
    raise EOFError("Unexpected end of VTK file")


def compile_model(archive: Path, boundary_path: Path, output: Path) -> None:
    estonia, coverage = boundary(boundary_path)
    with zipfile.ZipFile(archive) as zipped, zipped.open("MOSYS_BAB.vtk") as stream:
        while not (line := next_nonempty(stream)).startswith("POINTS "):
            pass
        point_count = int(line.split()[1])
        if point_count % SURFACE_COUNT:
            raise ValueError("The VTK point count is incompatible with the documented 42-layer model")
        vertex_count = point_count // SURFACE_COUNT
        xs, ys, surfaces = array("f"), array("f"), [array("f") for _ in range(SURFACE_COUNT)]
        for index in range(point_count):
            x_text, y_text, z_text = stream.readline().split()
            surface_index, vertex_index = divmod(index, vertex_count)
            if surface_index == 0:
                xs.append(float(x_text))
                ys.append(float(y_text))
            surfaces[surface_index].append(float(z_text))

        line = next_nonempty(stream)
        if not line.startswith("CELLS "):
            raise ValueError("Expected VTK cell connectivity")
        cell_count = int(line.split()[1])
        if cell_count % len(LAYERS):
            raise ValueError("The VTK cell count is incompatible with the documented 42-layer model")
        triangle_count = cell_count // len(LAYERS)
        selected: list[int] = []
        base_triangles: list[tuple[int, int, int]] = []
        for cell_index in range(cell_count):
            values = [int(value) for value in stream.readline().split()]
            if len(values) != 7 or values[0] != 6:
                raise ValueError("Expected six-node VTK wedge cells")
            if cell_index < triangle_count:
                a, b, c = values[1:4]
                triangle = Polygon(((xs[a], ys[a]), (xs[b], ys[b]), (xs[c], ys[c])))
                if triangle.intersects(estonia):
                    selected.append(cell_index)
                    base_triangles.append((a, b, c))

        while not next_nonempty(stream).startswith("POINT_DATA "):
            pass
        while not next_nonempty(stream).startswith("LOOKUP_TABLE "):
            pass
        for _ in range(point_count):
            stream.readline()  # calculated piezometric head; not used by the ATES model

        while not next_nonempty(stream).startswith("CELL_DATA "):
            pass
        while not next_nonempty(stream).startswith("SCALARS conductivityXY"):
            pass
        if not next_nonempty(stream).startswith("LOOKUP_TABLE "):
            raise ValueError("Expected conductivity lookup table")
        selected_set = set(selected)
        conductivity_by_layer: list[list[float]] = []
        for layer in range(len(LAYERS)):
            values: list[float] = []
            offset = layer * triangle_count
            for triangle_index in range(triangle_count):
                value = float(stream.readline())
                if triangle_index in selected_set:
                    values.append(value)
            conductivity_by_layer.append(values)

    used = sorted({vertex for triangle in base_triangles for vertex in triangle})
    remap = {old: new for new, old in enumerate(used)}
    vertices: list[float] = []
    for old in used:
        vertices.extend((round(xs[old], 1), round(ys[old], 1)))
        vertices.extend(round(surface[old], 1) for surface in surfaces)
    triangles = [remap[vertex] for triangle in base_triangles for vertex in triangle]
    conductivity = [
        float(f"{conductivity_by_layer[layer][triangle]:.6g}")
        for triangle in range(len(base_triangles))
        for layer in range(len(LAYERS))
    ]
    compiled = {
        "meta": {
            "model": "PUMA/MOSYS Baltic Artesian Basin hydrogeological model",
            "source": SOURCE_URL,
            "sourcePage": SOURCE_PAGE,
            "sourcePublished": "2012-11-29",
            "compiledAt": datetime.now(timezone.utc).isoformat(),
            "crs": "EPSG:25884",
            "datum": "Model elevation in metres above sea level; exact vertical datum is not stated in the point service.",
            "mesh": "Original variable-resolution triangular-prism mesh; no spatial resampling.",
            "citation": "University of Latvia, ESF PUMA project; Virbulis et al. (2013), Hydrogeology Journal 21(4), 845–862.",
            "boundary": "OpenStreetMap contributors, ODbL 1.0; simplified Estonia administrative boundary used only to clip the model subset.",
            "vertexStride": SURFACE_COUNT + 2,
            "layerCount": len(LAYERS),
        },
        "layers": LAYERS,
        "coverage": coverage,
        "vertices": vertices,
        "triangles": triangles,
        "conductivity": conductivity,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(compiled, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {output}: {len(used)} vertices, {len(base_triangles)} triangles, {output.stat().st_size / 1_000_000:.2f} MB")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path, default=Path(".tmp-model-data/MOSYS-BAB.VTK.zip"))
    parser.add_argument("--boundary", type=Path, default=Path(".tmp-model-data/estonia.geojson"))
    parser.add_argument("--laane-viru", type=Path, default=Path(".tmp-model-data/laane-viru.geojson"))
    parser.add_argument("--ida-viru", type=Path, default=Path(".tmp-model-data/ida-viru.geojson"))
    parser.add_argument("--output", type=Path, default=Path("src/data/puma-estonia.json"))
    parser.add_argument("--coverage-output", type=Path, default=Path("src/data/estonia-model-coverages.geojson"))
    args = parser.parse_args()
    if not args.archive.exists():
        download(SOURCE_URL, args.archive)
    compile_model(args.archive, args.boundary, args.output)
    estonia_geometry = json.loads(args.boundary.read_text(encoding="utf-8"))["features"][0]["geometry"]
    write_coverages(estonia_geometry, args.laane_viru, args.ida_viru, args.coverage_output)


if __name__ == "__main__":
    main()
