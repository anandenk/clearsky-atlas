"""Live overview/default geometry contract and all-indicator value checks on both ports."""
import json,urllib.request,urllib.error
from pathlib import Path

def get(origin,path,status=200):
    try:
        with urllib.request.urlopen(origin+path,timeout=30) as r:
            assert r.status==status
            return json.load(r)
    except urllib.error.HTTPError as e:
        assert e.code==status,(e.code,e.read()[:500]);return json.load(e)

if __name__=='__main__':
    records=json.loads(Path('data/observations.json').read_text())
    proof=json.loads(Path('data/contracts/map-overview.json').read_text())
    for port in [3000,3001]:
        origin=f'http://127.0.0.1:{port}'
        statewide=get(origin,'/api/map?bbox=-125,32,-114,43&indicator=pm&detail=overview')
        assert len(statewide['features'])==9106
        assert statewide['metadata']['geometry']['artifactSha256']==proof['artifactSha256']
        catalog=get(origin,'/api/indicators')
        for indicator in catalog['indicators']:
            data=get(origin,'/api/map?bbox=-122.28,37.79,-122.25,37.82&indicator='+indicator['id']+'&detail=overview')
            assert data['features']
            for f in data['features']:
                r=records[f['properties']['id']]
                raw=r[indicator['rawField']]
                assert f['properties']['value']==(None if raw is None or raw in ['','NA'] else float(raw))
                pct=r[indicator['percentileField']] if indicator['percentileField'] else None
                assert f['properties']['percentile']==(None if pct is None or pct in ['','NA'] else float(pct))
            assert data['metadata']['legend']['kind']==indicator['visualization']['kind']
        default=get(origin,'/api/map?bbox=-122.28,37.79,-122.25,37.82&indicator=pm')
        assert default==get(origin,'/api/map?bbox=-122.28,37.79,-122.25,37.82&indicator=pm&detail=standard')
        assert default['metadata']['geometry']['simplificationMeters']==30
        assert get(origin,'/api/map?bbox=-125,32,-114,43&detail=overview',400)['code']=='indicator-required'
        assert get(origin,'/api/map?bbox=-125,32,-114,43&detail=auto',400)['code']=='invalid-map-detail'
        assert get(origin,'/api/map?bbox=-125,32,-114,43&indicator=pm&detail=overview&version=wrong',409)['code']=='dataset-version-mismatch'
        print(origin,'overview map smoke passed: 9106 IDs, all 23 fields, defaults and errors')
