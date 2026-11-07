"""Extract real baseline selections, display geometry, and a genuine missing value."""
import hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads((R/p).read_text())
obs=read('data/observations.json');locations=[]
for demo in read('data/demo-geocodes.json'):
 m=demo['matches'][0];tid=m['geographies']['Census Tracts'][0]['GEOID'];o=obs[tid]
 locations.append(dict(label=m['matchedAddress'],coordinate=[m['coordinates']['x'],m['coordinates']['y']],tractId=tid,place=o['approx_loc'],county=o['county'],observations=o,cached=True,censusTract=tid,precision='Census address-range interpolation; confirm the matched address'))
ids={v['tractId'] for v in locations};features=[f for f in read('data/display.json')['features'] if f['properties']['id'] in ids]
assert len(features)==2
for loc in locations:
 key='oakland-central' if loc['place']=='Oakland' else 'fresno';p=read('data/raw/ces-point-'+key+'.json')['features'][0]['attributes']
 assert str(int(p['tract'])).zfill(11)==loc['tractId'];assert abs(p['PM2_5']-float(loc['observations']['pm']))<1e-8
missing=next((tid,o) for tid,o in obs.items() if o['lbw'] is None)
out={'contractVersion':'baseline-v1','sourceVersion':'CES 5.0 final 2026-07-01','locations':locations,'displayFeatures':{'type':'FeatureCollection','features':features},'genuineMissingObservation':{'tractId':missing[0],'indicatorField':'lbw','value':None,'percentile':missing[1]['lbwP'],'context':'Real CES missing low-birth-weight record; this indicator is not yet activated. This is not an address geocode.'},'verification':{'locations':'Cached Census2020 + live CES point-query responses match CSV values; see data/raw/ces-point-*.json','geometry':'Exact extracted 30m-simplified display features; never use for tract lookup.','csvSHA256':hashlib.sha256((R/'data/raw/ces.csv').read_bytes()).hexdigest(),'inventedValues':False}}
p=R/'data/samples/frontend-v1.json';p.parent.mkdir(exist_ok=True);p.write_text(json.dumps(out,indent=2));print(p, p.stat().st_size,'bytes')
