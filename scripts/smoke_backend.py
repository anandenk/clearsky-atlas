"""Local live API contract smoke checks. Server(s) must already be running."""
import argparse,json,urllib.request,urllib.error,urllib.parse
P=argparse.ArgumentParser();P.add_argument('--origin',action='append',default=[]);args=P.parse_args()
VERSION='ces-5.0-final-2026-07-01'
def get(base,path,status=200):
 try:r=urllib.request.urlopen(base+path,timeout=30)
 except urllib.error.HTTPError as e:r=e
 assert r.status==status,(base,path,r.status,r.read()[:500]);return json.load(r)
for base in args.origin or ['http://127.0.0.1:3000']:
 catalog=get(base,'/api/indicators');assert catalog['contractVersion']=='atlas-indicators-v1.1';assert [i['id'] for i in catalog['indicators'] if i['backendReady']]==['pm','ozone']
 demo=get(base,'/api/demo');assert len(demo)==2;a,b=[x['tractId'] for x in demo]
 tract=get(base,f'/api/tracts/{a}?indicators=pm,ozone&version={VERSION}');assert tract['datasetVersion']==VERSION;assert len(tract['observations'])==2
 legacy=get(base,'/api/map?bbox=-122.28,37.79,-122.25,37.82');assert 'metadata' not in legacy
 for id in ['pm','ozone']:
  query=urllib.parse.urlencode({'bbox':'-122.28,37.79,-122.25,37.82','indicator':id,'version':VERSION});mapped=get(base,'/api/map?'+query);assert mapped['metadata']['indicatorId']==id;assert mapped['metadata']['legend']['domain']==[0,100];assert len(mapped['features'])==len(legacy['features'])
  selected=next(f['properties'] for f in mapped['features'] if f['properties']['id']==a);o=next(o for o in tract['observations'] if o['indicatorId']==id);assert selected['value']==o['rawValue'];assert selected['percentile']==o['percentile']
  pair=get(base,f'/api/compare?tractA={a}&tractB={b}&indicator={id}');assert pair['comparison']['compatible'];assert pair['comparison']['rawDifferenceBMinusA']==pair['b']['rawValue']-pair['a']['rawValue']
  assert pair['a']['rawValue']==float(demo[0]['observations'][id]);assert pair['b']['rawValue']==float(demo[1]['observations'][id]);same=get(base,f'/api/compare?tractA={a}&tractB={a}&indicator={id}');assert same['comparison']['sameTract'];assert same['comparison']['rawDifferenceBMinusA']==0
 for path,status,code in [(f'/api/tracts/{a}?version=other',409,'dataset-version-mismatch'),('/api/tracts/6001403402',400,'invalid-tract-id'),('/api/tracts/06999999999',404,'tract-not-found'),(f'/api/tracts/{a}?indicators=asthma',422,'unverified-indicator'),(f'/api/tracts/{a}?indicators=fake',400,'unknown-indicator'),('/api/map?bbox=-122.28,37.79,-122.25,37.82&indicator=asthma',422,'unverified-indicator')]:assert get(base,path,status)['code']==code
 print(base,'PASS: catalog, normalized observations, source-valued maps, pair/same-tract comparisons, version and invalid/unsupported errors; legacy map response unchanged')
