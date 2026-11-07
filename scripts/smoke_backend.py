"""Live local contract checks; servers must already run. No environmental-provider calls."""
import argparse,json,urllib.request,urllib.error,urllib.parse
from pathlib import Path
P=argparse.ArgumentParser();P.add_argument('--origin',action='append',default=[]);args=P.parse_args()
VERSION='ces-5.0-final-2026-07-01';R=Path(__file__).resolve().parents[1]
rows=json.loads((R/'data/observations.json').read_text())
def get(base,path,status=200):
 try:r=urllib.request.urlopen(base+path,timeout=30)
 except urllib.error.HTTPError as e:r=e
 assert r.status==status,(base,path,r.status,r.read()[:500]);return json.load(r)
for base in args.origin or ['http://127.0.0.1:3000']:
 catalog=get(base,'/api/indicators');assert catalog['contractVersion']=='atlas-indicators-v1.2';ready=[i for i in catalog['indicators'] if i['backendReady']];assert len(ready)==23
 demo=get(base,'/api/demo');assert len(demo)==2;a,b=[x['tractId'] for x in demo]
 tract=get(base,f'/api/tracts/{a}?version={VERSION}');assert tract['datasetVersion']==VERSION;assert len(tract['observations'])==23
 legacy=get(base,'/api/map?bbox=-122.28,37.79,-122.25,37.82');assert 'metadata' not in legacy
 for i in ready:
  id=i['id'];query=urllib.parse.urlencode({'bbox':'-122.28,37.79,-122.25,37.82','indicator':id,'version':VERSION});mapped=get(base,'/api/map?'+query);assert mapped['metadata']['indicatorId']==id;assert mapped['metadata']['legend']['domain']==[0,100];assert len(mapped['features'])==len(legacy['features'])
  selected=next(f['properties'] for f in mapped['features'] if f['properties']['id']==a);o=next(o for o in tract['observations'] if o['indicatorId']==id);assert selected['value']==o['rawValue'];assert selected['percentile']==o['percentile']
  assert mapped['metadata']['legend']['property']==('percentile' if i['percentileField'] else 'value')
  pair=get(base,f'/api/compare?tractA={a}&tractB={b}&indicator={id}');assert pair['comparison']['compatible'];av,bv=pair['a']['rawValue'],pair['b']['rawValue'];assert pair['comparison']['rawDifferenceBMinusA']==(None if av is None or bv is None else bv-av)
  assert av==(None if rows[a][i['rawField']] is None else float(rows[a][i['rawField']]))
  if i['unit']=='%':assert pair['comparison']['rawDifferenceUnit']=='percentage points'
 same=get(base,f'/api/compare?tractA={a}&tractB={a}&indicator=pm');assert same['comparison']['sameTract'];assert same['comparison']['rawDifferenceBMinusA']==0
 missing_id=next(tid for tid,row in rows.items() if row['lbw'] is None);missing=get(base,f'/api/tracts/{missing_id}?indicators=low-birth-weight')['observations'][0];assert missing['rawValue'] is None;assert missing['status']=='missing'
 for path,status,code in [(f'/api/tracts/{a}?version=other',409,'dataset-version-mismatch'),('/api/tracts/6001403402',400,'invalid-tract-id'),('/api/tracts/06999999999',404,'tract-not-found'),(f'/api/tracts/{a}?indicators=fake',400,'unknown-indicator'),('/api/map?bbox=-122.28,37.79,-122.25,37.82&indicator=fake',400,'unknown-indicator')]:assert get(base,path,status)['code']==code
 print(base,'PASS: 23 scalar/demographic contracts, source-valued map joins, neutral legends, normalized observations, comparisons, real suppression, version/errors and legacy map compatibility')
