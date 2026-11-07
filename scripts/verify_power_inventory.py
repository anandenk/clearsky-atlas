"""Audit the complete CEC candidate without promoting unresolved date/status contracts."""
import collections
import hashlib
import json
import math
import urllib.parse
from fetch_sources import fetch, ROOT

LAYER = 'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Power_Plant/FeatureServer/0'
BLOCKERS = [
    dict(code='reporting-period-unverified', detail='Service says May 2022; data edit is June 12, 2026. Last Reported Year is described but absent from the current schema. No verified observation/reporting period.', trigger='First-party per-record reporting-year or applicable snapshot documentation, explicitly tied to this layer.'),
    dict(code='retired-code-unverified', detail='Retired_Plant has numeric 0/1 values but no coded domain or verified dictionary. No active/retired interpretation is promoted.', trigger='First-party code definition tied to this field/version, or a verified alternative status-bearing source.'),
]


def query(name, **params):
    return json.loads(fetch(name, LAYER + '/query?' + urllib.parse.urlencode(dict(f='json', **params))).read_text())


def prepare():
    metadata = json.loads(fetch('power-current-metadata.json', LAYER + '?f=pjson').read_text())
    # Reuse the original successful complete pull exactly; source ID checks are separate.
    inventory = query('power-inventory.json', where='1=1',outFields='*',returnGeometry='true',outSR=4326,resultRecordCount=5000,orderByFields='OBJECTID')
    ids = query('power-inventory-ids.json',where='1=1',returnIdsOnly='true')['objectIds']
    count = query('power-inventory-count.json',where='1=1',returnCountOnly='true')['count']
    assert not inventory.get('exceededTransferLimit')
    features = inventory['features']
    assert inventory['spatialReference']['wkid'] == 4326
    assert len(features) == len(ids) == count == len(set(ids))
    assert {f['attributes']['OBJECTID'] for f in features} == set(ids)
    assert len({f['attributes']['CECPlantID'] for f in features}) == count
    assert all(isinstance(f['attributes']['CECPlantID'],str) and f['attributes']['CECPlantID'] for f in features)
    after = json.loads(fetch('power-inventory-metadata-after.json',LAYER+'?f=pjson').read_text())
    assert metadata['editingInfo'] == after['editingInfo']
    # Independent pyproj check against original native NAD83 point coordinates.
    native = query('power-inventory-native.json',where='1=1',outFields='OBJECTID',returnGeometry='true',resultRecordCount=5000,orderByFields='OBJECTID')
    assert native['spatialReference']['wkid'] == 4269 and not native.get('exceededTransferLimit')
    native_by_id = {f['attributes']['OBJECTID']:f.get('geometry') for f in native['features']}
    assert set(native_by_id) == set(ids)
    import shapely
    from shapely.geometry import shape
    from pyproj import Transformer, Geod
    transformer = Transformer.from_crs(4269,4326,always_xy=True)
    lookup = ROOT / 'data/lookup.json'
    tree = shapely.STRtree([shape(f['geometry']) for f in json.loads(lookup.read_text())['features']])
    geod = Geod(ellps="WGS84")
    records, deltas, metre_deltas = [], [], []
    for f in features:
        a,g = f['attributes'],f.get('geometry')
        coordinate = [g.get('x'),g.get('y')] if g else None
        flags = []
        if not coordinate or not all(isinstance(v,(int,float)) and math.isfinite(v) for v in coordinate):
            coordinate = None
            flags.append('missing-or-invalid-coordinate')
        else:
            n = native_by_id[a['OBJECTID']]
            assert n is not None
            transformed = transformer.transform(n['x'],n['y'])
            deltas.append(max(abs(coordinate[i]-transformed[i]) for i in [0,1]))
            metre_deltas.append(geod.inv(coordinate[0],coordinate[1],transformed[0],transformed[1])[2])
            if not len(tree.query(shapely.Point(coordinate),predicate='intersects')):
                flags.append('outside-ces-tract-coverage')
                coordinate = None
        records.append(dict(id='cec:'+a['CECPlantID'],category='power',name=a['PlantName'],coordinate=coordinate,
                            sourceId='cec-power-plant-candidate',status=None,observationDate=None,sourcePeriod=None,
                            subtype=a['PriEnergySource'],flags=flags,sourceAttributes=a,sourceGeometry=g,sourceNativeGeometry=native_by_id[a['OBJECTID']]))
    assert max(metre_deltas, default=0)<3, 'Native/WGS84 coordinate difference exceeds 3 metres'
    manifest = json.loads((ROOT/'data/raw/manifest.json').read_text())
    names = ['power-current-metadata.json','power-inventory.json','power-inventory-ids.json','power-inventory-count.json','power-inventory-metadata-after.json','power-inventory-native.json','power-item.json','power-service.json','power-item-data.json','power-item-metadata.xml','power-catalog.json','power-conditions.html','power-state-rights.html','power-qfer-catalog.json','power-retired-counts.json']
    provenance = {name:manifest[name] for name in names}
    version = 'cec-power-candidate-'+hashlib.sha256(json.dumps(provenance,sort_keys=True).encode()).hexdigest()[:12]
    audit = dict(sourceCount=count,recordCount=len(records),coordinateCount=sum(r['coordinate'] is not None for r in records),
                 flagCounts=dict(collections.Counter(flag for r in records for flag in r['flags'])),
                 excludedIds=[r['id'] for r in records if r['coordinate'] is None],
                 rawRetiredCodeCounts=dict(collections.Counter(str(r['sourceAttributes']['Retired_Plant']) for r in records)),
                 sourceCountyCounts=dict(collections.Counter(str(r['sourceAttributes']['County']) for r in records)),
                 nullCounts={field:sum(r['sourceAttributes'][field] is None for r in records) for field in [f['name'] for f in metadata['fields']]},
                 sourceCrs='EPSG:4269',queryCrs='EPSG:4326',maxIndependentTransformDifferenceDegrees=max(deltas,default=None),maxIndependentTransformDifferenceMetres=max(metre_deltas,default=None),
                 sourceEditInfo=metadata['editingInfo'],lookupSha256=hashlib.sha256(lookup.read_bytes()).hexdigest())
    rights = dict(namedLicense='Creative Commons Attribution (state catalog); CEC conditions linked by item',licenseVersion=None,
                  url='https://www.energy.ca.gov/conditions-of-use',
                  qualification='CEC credit required. Linked conditions prohibit commercial/profit-making use or modification; do not represent catalog CC label as unrestricted commercial permission. Current work is local source verification; review applicable rights before any future publication/commercial use.')
    bundle = dict(contractVersion='atlas-facility-staging-v1',backendReady=False,datasetVersion=version,category='power',
                  sourceUrl=LAYER,sourcePeriod=None,observationDate=None,rights=rights,blockers=BLOCKERS,
                  coverage=dict(scope='Complete CEC source layer; candidate query coordinates limited to unsimplified CES coverage',sourceInventoryComplete=True,realWorldCompleteness='not-established',limitations=['Staged source candidate, not live facility data. Unknown reporting period and unverified retirement codes.','CES coverage is not an independent California land-boundary certification. Raw county/coordinates and out-of-coverage records are preserved.','Plant point/capacity does not establish household supply, access, current generation or environmental impact.']),
                  audit=audit,provenance=provenance,facilities=records)
    target = ROOT/'data/facility-verification'
    (target/'power-normalized.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':')))
    (target/'power-validation.json').write_text(json.dumps(dict(datasetVersion=version,**audit),indent=2))
    readiness = {k:v for k,v in bundle.items() if k not in ['facilities','audit','provenance']}
    readiness['audit'] = {k:audit[k] for k in ['sourceCount','coordinateCount','flagCounts','rawRetiredCodeCounts','sourceEditInfo']}
    readiness['evidenceFile']='data/facility-verification/power-validation.json'
    readiness['provenance'] = provenance
    readiness['stagedArtifactSha256']=hashlib.sha256((target/'power-normalized.json').read_bytes()).hexdigest()
    (ROOT/'data/contracts/power-readiness.json').write_text(json.dumps(readiness,indent=2))
    print(json.dumps(audit,indent=2))

if __name__=='__main__':
    prepare()
