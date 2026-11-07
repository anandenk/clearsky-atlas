"""Acquire the complete CDE school layer by object IDs; cache originals and audit coverage."""
import collections
import hashlib
import json
import math
import re
import urllib.parse
from pathlib import Path
from fetch_sources import fetch, ROOT

LAYER = 'https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/SchoolSites2526/FeatureServer/0'
FIELDS = 'OBJECTID,Year,CDSCode,SchoolName,SchoolType,Status,OpenDate,ClosedDate,Virtual,Street,City,Zip,State,CountyName,CountyNameGeo,Latitude,Longitude'


def query(name, **params):
    return json.loads(fetch(name, LAYER + '/query?' + urllib.parse.urlencode(dict(f='json', **params))).read_text())


def prepare():
    catalog = json.loads(fetch('schools-catalog.json', 'https://publish.data.ca.gov/api/3/action/package_show?id=california-public-schools-2025-26').read_text())
    assert catalog['success']
    rights = fetch('schools-rights.html', 'https://data.ca.gov/@california-department-of-education/california-public-schools-2025-26').read_text()
    assert 'No restrictions on public use' in rights
    metadata = json.loads(fetch('schools-full-metadata.json', LAYER + '?f=pjson').read_text())
    ids = query('schools-ids.json', where='1=1', returnIdsOnly='true')['objectIds']
    assert len(ids) == len(set(ids)) and ids
    features = []
    for start in range(0, len(ids), 200):
        batch = sorted(ids)[start:start + 200]
        page = query(f'schools-page-{start // 200:02}.json', objectIds=','.join(map(str, batch)), outFields=FIELDS, returnGeometry='true', outSR=4326)
        assert not page.get('exceededTransferLimit'), 'Truncated page'
        assert page['spatialReference']['wkid'] == 4326
        assert {f['attributes']['OBJECTID'] for f in page['features']} == set(batch)
        features.extend(page['features'])
    end = query('schools-ids-after.json', where='1=1', returnIdsOnly='true')
    assert set(end['objectIds']) == set(ids), 'Source IDs changed during pull'
    final_meta = json.loads(fetch('schools-full-metadata-after.json', LAYER + '?f=pjson').read_text())
    assert metadata['editingInfo'] == final_meta['editingInfo'], 'Source edited during pull'
    records = []
    for feature in features:
        a, g = feature['attributes'], feature.get('geometry')
        assert re.fullmatch(r'\d{14}', a['CDSCode'])
        assert a['Year'] == '2025-26'
        coordinate = [g.get('x'), g.get('y')] if g else None
        flags = []
        if coordinate is None or not all(isinstance(v, (float, int)) and math.isfinite(v) for v in coordinate):
            coordinate = None
            flags.append('missing-or-invalid-coordinate')
        elif not (-125 <= coordinate[0] <= -114 and 32 <= coordinate[1] <= 43):
            flags.append('outside-california-envelope')
            coordinate = None
        if a['State'] != 'CA':
            flags.append('source-state-not-CA')
            coordinate = None
        records.append(dict(id='cde:' + a['CDSCode'], category='schools', name=a['SchoolName'], coordinate=coordinate,
                            sourceId='cde-schools-2025-26', status=a['Status'], observationDate=None,
                            sourcePeriod=a['Year'], subtype=a['SchoolType'], flags=flags, sourceAttributes=a))
    assert len({r['id'] for r in records}) == len(ids), 'Duplicate CDS code'
    # Geographic membership uses the existing unsimplified CES lookup only as an audit,
    # not as a claim of official school assignment or statewide boundary completeness.
    import shapely
    lookup = json.loads((ROOT / 'data/lookup.json').read_text())
    polygons = [shapely.geometry.shape(f['geometry']) for f in lookup['features']]
    tree = shapely.STRtree(polygons)
    outside = []
    for r in records:
        if r['coordinate'] and not len(tree.query(shapely.Point(r['coordinate']), predicate='intersects')):
            r['flags'].append('outside-ces-tract-coverage')
            outside.append(r['id'])
    raw_manifest = json.loads((ROOT / 'data/raw/manifest.json').read_text())
    sources = {k: v for k, v in raw_manifest.items() if k.startswith('schools-')}
    version = 'cde-schools-2025-26-' + hashlib.sha256(json.dumps(sources, sort_keys=True).encode()).hexdigest()[:12]
    limitations = [
        'Historical 2025–26 public TK/K–12 school snapshot; status does not establish current operation.',
        'Nonpublic and district office schools are excluded. Complete source acquisition does not prove real-world completeness.',
        'Published points may represent buildings or parcel centroids, not entrances. Virtual-school status is retained.',
        'Distances are spherical straight-line distances to published points, not travel time, attendance eligibility, capacity or access.',
        'Nearest means among coordinate-bearing records in this cached inventory and requested bounds, if any.',
    ]
    audit = dict(sourceCount=len(ids), recordCount=len(records), coordinateCount=sum(r['coordinate'] is not None for r in records),
                 statusCounts=dict(collections.Counter(r['status'] for r in records)),
                 geographicCountyCounts=dict(collections.Counter(r['sourceAttributes']['CountyNameGeo'] for r in records)),
                 flagCounts=dict(collections.Counter(flag for r in records for flag in r['flags'])), outsideCesIds=outside,
                 coLocatedAdditionalRecords=sum(n - 1 for n in collections.Counter(tuple(r['coordinate']) for r in records if r['coordinate']).values() if n > 1),
                 sourceEditInfo=metadata['editingInfo'], acquisition='Exact ID-set equality per page and before/after ID set; unchanged edit metadata')
    bundle = dict(contractVersion='atlas-facilities-v1', datasetVersion=version, category='schools', sourceUrl=LAYER,
                  sourcePeriod='2025-26', observationDate=None,
                  rights=dict(statement='No restrictions on public use', namedLicense=None,
                              url='https://data.ca.gov/@california-department-of-education/california-public-schools-2025-26'),
                  coverage=dict(scope='California public schools in the CDE 2025–26 layer', sourceInventoryComplete=True,
                                realWorldCompleteness='not-established', limitations=limitations),
                  audit=audit, provenance=sources, facilities=sorted(records, key=lambda r: r['id']))
    target = ROOT / 'data/facilities'
    target.mkdir(exist_ok=True)
    temporary = target / 'schools.json.partial'
    temporary.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
    temporary.replace(target / 'schools.json')
    (target / 'schools-validation.json').write_text(json.dumps(dict(datasetVersion=version, **audit), indent=2))
    (target / 'manifest.json').write_text(json.dumps(dict(datasetVersion=version, pipeline='scripts/prepare_schools.py', sourceManifest='data/raw/manifest.json', files={name: dict(sha256=hashlib.sha256((target / name).read_bytes()).hexdigest(), bytes=(target / name).stat().st_size) for name in ['schools.json', 'schools-validation.json']}), indent=2))
    print(json.dumps(audit, indent=2))

if __name__ == '__main__':
    prepare()
