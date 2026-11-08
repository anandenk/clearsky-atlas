"""Prepare a spatial cell index from pinned, retained Overture GeoJSON extracts.
Acquire with scripts/fetch_buildings.py first. No heights are imputed.
"""
import hashlib, json, math
from pathlib import Path
from datetime import datetime, timezone
from shapely.geometry import shape
RELEASE = '2026-10-21.0'
REGIONS = {'rancho': [-117.572,34.107,-117.532,34.147], 'oakland': [-122.29,37.79,-122.25,37.83]}
ROOT = Path(__file__).resolve().parents[1]
CELL = .002

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    output = ROOT/'data/buildings'/RELEASE
    output.mkdir(parents=True, exist_ok=True)
    manifest = {'datasetVersion': RELEASE, 'cellSize': CELL, 'regions': [], 'preparedAt': datetime.now(timezone.utc).isoformat()}
    for name, bounds in REGIONS.items():
        raw = ROOT/'data/raw/buildings'/RELEASE/(name+'.geojson')
        source = json.loads(raw.read_text())
        features, cells, ids = [], {}, set()
        for f in source['features']:
            p = f['properties']; ident = f['id']; g = shape(f['geometry'])
            assert ident not in ids and g.is_valid and not g.is_empty
            assert g.geom_type in ('Polygon','MultiPolygon')
            ids.add(ident)
            bbox = list(g.bounds)
            height = p.get('height'); levels = p.get('num_floors')
            assert height is None or (math.isfinite(height) and height >= 0)
            props = {'id': ident, 'height': height, 'levels': levels, 'heightProvenance': 'source-supplied' if height is not None else 'unknown', 'sources': p.get('sources'), 'hasParts': p.get('has_parts'), 'minHeight': p.get('min_height'), 'isUnderground': p.get('is_underground'), 'sourceFeatureVersion': p.get('version'), 'dataset': 'Overture Buildings', 'datasetVersion': RELEASE}
            i = len(features)
            features.append({'type':'Feature','id':ident,'bbox':bbox,'geometry':f['geometry'],'properties':props})
            for x in range(math.floor(bbox[0]/CELL), math.floor(bbox[2]/CELL)+1):
                for y in range(math.floor(bbox[1]/CELL), math.floor(bbox[3]/CELL)+1):
                    cells.setdefault(f'{x},{y}',[]).append(i)
        dest = output/(name+'.json')
        dest.write_text(json.dumps({'features':features,'cells':cells},separators=(',',':')))
        manifest['regions'].append({'id':name,'bbox':bounds,'count':len(features),'missingHeight':sum(f['properties']['height'] is None for f in features),'sourceSha256':sha(raw),'artifactSha256':sha(dest),'artifactBytes':dest.stat().st_size})
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    proof = ROOT/'data/contracts/buildings.json'
    proof.write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(manifest,indent=2))
if __name__ == '__main__': main()
