"""Cache and normalize the first-party statewide CDPH DataStore inventory."""
import collections
import datetime
import hashlib
import json
import math
import re
import urllib.parse
from fetch_sources import fetch, ROOT

API = 'https://data.chhs.ca.gov/api/3/action/'
RESOURCE = 'f0ae5731-fef8-417f-839d-54a0ed3a126e'
FIELDS = '_id,FACID,FACNAME,FAC_TYPE_CODE,FAC_FDR,FAC_STATUS_TYPE_CODE,LICENSED_CERTIFIED,LATITUDE,LONGITUDE,COUNTY_NAME,FIPS_COUNTY_CODE,DATA_DATE,ISFACMAIN,PARENT_FACID,FAC_FAC_RELATIONSHIP_TYPE_CODE,ADDRESS,CITY,ZIP,LICENSE_STATUS_DESCRIPTION'


def read_query(name, resource=RESOURCE, **params):
    url = API + 'datastore_search?' + urllib.parse.urlencode(dict(resource_id=resource, **params))
    return json.loads(fetch('healthcare-statewide-' + name + '.json', url).read_text())['result']


def prepare():
    catalog_url = API + 'package_show?id=healthcare-facility-locations'
    catalog = json.loads(fetch('healthcare-statewide-catalog.json', catalog_url).read_text())['result']
    rights_url = 'https://data.ca.gov/@california-department-of-public-health/licensed-and-certified-healthcare-facility-listing'
    rights = fetch('healthcare-statewide-rights.html', rights_url).read_text()
    assert 'No restrictions on public use' in rights and 'Creative Commons Attribution' in rights
    dictionary = read_query('dictionary', 'dcc79560-c7ae-49f3-9b04-d498667e5572', limit=100)
    assert len(dictionary['records']) == dictionary['total']
    lookup = read_query('lookup-full', '1e29e3d3-2e35-48e5-a903-de6cfb2eaf2a', limit=1000)
    assert len(lookup['records']) == lookup['total']
    definitions = {r['VARIABLE']: r['DEFINITION'] for r in dictionary['records']}
    assert 'nine-digit' in definitions['FACID']
    assert 'decimal degrees' in definitions['LATITUDE'] and 'decimal degrees' in definitions['LONGITUDE']
    assert 'extracted' in definitions['DATA_DATE']
    rows = []
    count = read_query('count-before', limit=0)
    assert count.get('total_was_estimated') is False
    total = count['total']
    for offset in range(0, total, 1000):
        page = read_query(f'page-{offset // 1000:02}', limit=1000, offset=offset, sort='_id asc', fields=FIELDS)
        assert page['total'] == total and page.get('total_was_estimated') is False
        assert len(page['records']) == min(1000, total - offset), 'Truncated page'
        rows.extend(page['records'])
    assert len(rows) == total == len({r['_id'] for r in rows})
    assert read_query('count-after', limit=0)['total'] == total
    after_catalog = json.loads(fetch('healthcare-statewide-catalog-after.json', catalog_url).read_text())['result']
    before = next(r for r in catalog['resources'] if r['id'] == RESOURCE)
    after = next(r for r in after_catalog['resources'] if r['id'] == RESOURCE)
    assert (before['hash'], before['last_modified']) == (after['hash'], after['last_modified']), 'Source resource changed during acquisition'
    # Audit with exact local tract geometry, never simplified display polygons.
    import shapely
    from shapely.geometry import shape
    polygons = [shape(f['geometry']) for f in json.loads((ROOT / 'data/lookup.json').read_text())['features']]
    tree = shapely.STRtree(polygons)
    records = []
    for row in rows:
        assert re.fullmatch(r'\d{9}', row['FACID'])
        stamp = datetime.datetime.fromisoformat(row['DATA_DATE']).date().isoformat() if row['DATA_DATE'] else None
        coordinate = [row['LONGITUDE'], row['LATITUDE']]
        flags = []
        if not all(isinstance(n, (int, float)) and math.isfinite(n) for n in coordinate):
            coordinate = None
            flags.append('missing-or-invalid-coordinate')
        elif not (-125 <= coordinate[0] <= -114 and 32 <= coordinate[1] <= 43):
            coordinate = None
            flags.append('outside-california-envelope')
        elif not len(tree.query(shapely.Point(coordinate), predicate='intersects')):
            # Retain published raw coordinates but withhold unsupported map points.
            coordinate = None
            flags.append('outside-ces-tract-coverage')
        records.append(dict(id='cdph:' + row['FACID'], category='healthcare', name=row['FACNAME'], coordinate=coordinate,
                            sourceId='cdph-licensed-certified', status=row['FAC_STATUS_TYPE_CODE'], observationDate=stamp,
                            sourcePeriod=stamp, subtype=row['FAC_TYPE_CODE'], flags=flags, sourceAttributes=row))
    assert len({r['id'] for r in records}) == len(rows)
    dates = sorted({r['observationDate'] for r in records if r['observationDate'] is not None})
    assert len(dates) == 1, 'Mixed snapshot dates require a new explicit contract'
    manifest = json.loads((ROOT / 'data/raw/manifest.json').read_text())
    sources = {k:v for k,v in manifest.items() if k.startswith('healthcare-statewide-')}
    version = 'cdph-licensed-certified-' + dates[0] + '-' + hashlib.sha256(json.dumps(sources, sort_keys=True).encode()).hexdigest()[:12]
    audit = dict(sourceCount=total, recordCount=len(records), coordinateCount=sum(r['coordinate'] is not None for r in records),
                 statusCounts=dict(collections.Counter(r['status'] for r in records)), subtypeCounts=dict(collections.Counter(r['subtype'] for r in records)),
                 countyCounts=dict(collections.Counter(r['sourceAttributes']['COUNTY_NAME'] for r in records)),
                 flagCounts=dict(collections.Counter(f for r in records for f in r['flags'])),
                 flaggedIds=[r['id'] for r in records if r['flags']], snapshotDates=dates, sourceResourceHash=before['hash'],
                 acquisition='Sorted DataStore pages, exact count/unique row and FACID checks, unchanged count and resource hash/last_modified before/after')
    limitations = [
        'CDPH licensed and/or CMS-certified scope only; not every healthcare provider. Snapshot does not establish current operation, eligibility, capacity or access.',
        'Home health agencies, hospices, laboratories and other categories are not necessarily walk-in care sites. Read subtype and source fields.',
        'Distances are spherical straight-line to published geocoded points, not travel time or entrances. Nearest means among coordinate-bearing records in this inventory, within bounds if supplied.',
        'Missing/invalid coordinates and points outside CES tract coverage are retained with null query coordinates and flags, excluded from spatial results. Raw coordinates remain in sourceAttributes.',
        'Dictionary calls latitude/longitude decimal degrees but also names EPSG:3857 inconsistently. Values are consumed as longitude/latitude degrees; no Web Mercator metre transform. LOCATION text is not used.',
    ]
    bundle = dict(contractVersion='atlas-facilities-v1', datasetVersion=version, category='healthcare',
                  sourceUrl='https://data.chhs.ca.gov/dataset/healthcare-facility-locations', sourcePeriod=dates[0], observationDate=dates[0],
                  rights=dict(statement='No restrictions on public use', namedLicense='Creative Commons Attribution', licenseVersion=None, url=rights_url),
                  coverage=dict(scope='Statewide CDPH licensed and/or CMS-certified facility listing',sourceInventoryComplete=True,
                                realWorldCompleteness='not-established',limitations=limitations),
                  audit=audit, provenance=sources, facilities=sorted(records,key=lambda r:r['id']))
    target = ROOT / 'data/facilities'
    temporary = target / 'healthcare.json.partial'
    temporary.write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
    temporary.replace(target / 'healthcare.json')
    (target / 'healthcare-validation.json').write_text(json.dumps(dict(datasetVersion=version,**audit),indent=2))
    (target / 'healthcare-manifest.json').write_text(json.dumps(dict(datasetVersion=version,pipeline='scripts/prepare_healthcare.py',sourceManifest='data/raw/manifest.json',files={name:dict(sha256=hashlib.sha256((target/name).read_bytes()).hexdigest(),bytes=(target/name).stat().st_size) for name in ['healthcare.json','healthcare-validation.json']}),indent=2))
    print(json.dumps(audit,indent=2))

if __name__ == '__main__':
    prepare()
