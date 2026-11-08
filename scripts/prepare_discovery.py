"""Reproducible school/tract membership using the pinned, full-resolution lookup."""
import hashlib
import json
from collections import Counter
from pathlib import Path
import numpy as np
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
def read(name):
    return json.loads((ROOT / name).read_text())
def digest(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()

# These explicit CDPH subtypes describe in-person hospital/clinic inventories.
# Other OPEN records include home health/hospice agencies and are not care-site proxies.
CARE_TYPES = {"hospital": {"GACH"}, "clinic": {"COMTYC", "FREEC", "FQHC", "FQHC/COMTYC", "RHC", "RHC/MD", "RHC/OP", "RHC/COMTYC"}}
def nearest_care(point, facilities):
    if not facilities:
        return None
    coords = np.radians(np.array([f["coordinate"] for f in facilities]))
    lon, lat = np.radians(point)
    h = np.sin((coords[:, 1] - lat) / 2) ** 2 + np.cos(lat) * np.cos(coords[:, 1]) * np.sin((coords[:, 0] - lon) / 2) ** 2
    distances = 6371.0088 * 2 * np.arcsin(np.sqrt(np.clip(h, 0, 1)))
    # Input is ID-sorted; argmin gives deterministic ID tie-breaks.
    idx = int(np.argmin(distances))
    return {"facilityId": facilities[idx]["id"], "distanceKm": float(distances[idx])}

def build():
    features = read("data/lookup.json")["features"]
    observations = read("data/observations.json")
    schools = read("data/facilities/schools.json")
    healthcare = read("data/facilities/healthcare.json")
    care = {kind: sorted([f for f in healthcare["facilities"] if f["coordinate"] is not None and f["status"] == "OPEN" and f["subtype"] in types], key=lambda f: f["id"]) for kind, types in CARE_TYPES.items()}
    metadata = read("data/raw/schools-full-metadata.json")
    status_field = next(f for f in metadata["fields"] if f["name"] == "Status")
    assert "active, closed or pending" in status_field["description"].lower()
    shapes = [shape(f["geometry"]) for f in features]
    tree = STRtree(shapes)
    members = {f["properties"]["id"]: [] for f in features}
    associations, ambiguous, unmatched = {}, [], []
    for school in sorted(schools["facilities"], key=lambda s: s["id"]):
        coordinate = school["coordinate"]
        if coordinate is None:
            unmatched.append({"id": school["id"], "reason": "missing-coordinate"})
            continue
        point = Point(coordinate)
        matches = sorted(features[int(i)]["properties"]["id"] for i in tree.query(point, predicate="intersects"))
        if len(matches) != 1:
            (ambiguous if matches else unmatched).append({"id": school["id"], "tractIds": matches})
            continue
        # Source strings, not guessed status codes. Unknowns never become active.
        assert school["status"] == school["sourceAttributes"]["Status"]
        tract_id = matches[0]
        members[tract_id].append(school["id"])
        associations[school["id"]] = {k: school[k] for k in ["id", "name", "coordinate", "status", "sourcePeriod", "subtype"]}
        associations[school["id"]]["virtual"] = school["sourceAttributes"].get("Virtual")
    rows = []
    for feature, geometry in sorted(zip(features, shapes), key=lambda pair: pair[0]["properties"]["id"]):
        tid = feature["properties"]["id"]
        row = observations[tid]
        rows.append({"tractId": tid, "county": row["county"], "place": row["approx_loc"], "bbox": list(geometry.bounds), "schoolIds": members[tid], "representativePoint": list(geometry.representative_point().coords[0]), "healthcare": {kind: nearest_care(list(geometry.representative_point().coords[0]), facilities) for kind, facilities in care.items()}})
    index = {"contractVersion": "atlas-discovery-index-v2", "cesVersion": "ces-5.0-final-2026-07-01", "schoolVersion": schools["datasetVersion"], "schoolSourceUrl": schools["sourceUrl"], "healthcareVersion": healthcare["datasetVersion"], "healthcareSourceUrl": healthcare["sourceUrl"], "healthcareTypes": {k: sorted(v) for k, v in CARE_TYPES.items()}, "healthcareFacilities": {f["id"]: {k: f[k] for k in ["id", "name", "coordinate", "status", "sourcePeriod", "subtype"]} for records in care.values() for f in records}, "rows": rows, "schools": associations}
    folder = ROOT / "data/discovery"
    folder.mkdir(exist_ok=True)
    output = folder / "index.json"
    output.write_text(json.dumps(index, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n")
    manifest = {"contractVersion": index["contractVersion"], "cesVersion": index["cesVersion"], "schoolVersion": index["schoolVersion"], "healthcareVersion": index["healthcareVersion"], "healthcareMethod": "Shapely representative_point inside full tract geometry; nearest source-listed OPEN GACH hospital or explicit clinic subtype set, spherical great-circle km (IUGG radius 6371.0088); no home location, travel time, capacity or access guarantee", "inputs": {name: {"sha256": digest(name)} for name in ["data/lookup.json", "data/observations.json", "data/facilities/schools.json", "data/raw/schools-full-metadata.json", "data/facilities/healthcare.json"]}, "output": {"path": "data/discovery/index.json", "sha256": digest("data/discovery/index.json")}, "membership": "Shapely STRtree intersects with full unsimplified WGS84 CES geometry; unique membership only; no forced boundary assignment", "activeStatus": {"field": "Status", "exactValue": "Active", "fieldDescription": json.loads(status_field["description"])["value"], "note": "Source-listed historical status; not current operation, eligibility or access."}, "audit": {"tracts": len(rows), "sourceSchools": len(schools["facilities"]), "uniquelyAssociatedSchools": len(associations), "associatedStatusCounts": dict(Counter(s["status"] if s["status"] is not None else "not-supplied" for s in associations.values())), "ambiguous": ambiguous, "unmatched": unmatched}}
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    print(json.dumps({k: v for k, v in manifest["audit"].items() if k not in ["ambiguous", "unmatched"]} | {"ambiguous": len(ambiguous), "unmatched": len(unmatched)}))

if __name__ == "__main__":
    build()
