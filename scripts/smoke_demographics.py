"""Check real grouped values, source rounding, nulls, and errors on both origins."""
import json,urllib.request,urllib.error
from pathlib import Path

def get(origin,path,status=200):
    try:
        with urllib.request.urlopen(origin+path,timeout=30) as response:
            assert response.status==status;return json.load(response)
    except urllib.error.HTTPError as error:
        assert error.code==status,(error.code,error.read()[:500]);return json.load(error)

if __name__=='__main__':
    rows=json.loads(Path('data/observations.json').read_text())
    missing=next(t for t,r in rows.items() if r['hisp'] is None)
    samples=[]
    for port in [3000,3001]:
        origin=f'http://127.0.0.1:{port}'
        catalog=get(origin,'/api/demographics')
        assert catalog['contractVersion']=='atlas-demographics-v1'
        assert catalog['normalization']=='none'
        profile=get(origin,'/api/tracts/06001403402/demographics')
        for group in profile['groups']:
            assert group['complete'] and group['isWithinRoundingAllowance']
            for category in group['categories']:
                assert category['value']==float(rows['06001403402'][category['id']]) and category['percentile'] is None
        absent=get(origin,f'/api/tracts/{missing}/demographics')
        assert absent['denominator']['populationEstimate']==0
        assert all(g['status']=='missing' and g['reportedSumPercent'] is None for g in absent['groups'])
        assert len(get(origin,'/api/tracts/06001403402/demographics?groups=age')['groups'])==1
        assert get(origin,'/api/tracts/06001403402/demographics?groups=unknown',400)['code']=='invalid-demographic-groups'
        assert get(origin,'/api/tracts/06001403402/demographics?version=wrong',409)['code']=='dataset-version-mismatch'
        assert get(origin,'/api/tracts/06999999999/demographics',404)['code']=='tract-not-found'
        assert get(origin,'/api/tracts/bad/demographics',400)['code']=='invalid-tract-id'
        samples.append(dict(profile=profile,zeroPopulationMissingProfile=absent))
        print(origin,'demographic smoke passed: source shares, neutral domain, real missing/zero population, groups/version/errors')
    assert samples[0]==samples[1]
    Path('data/samples/demographics-v1.json').write_text(json.dumps(samples[0],indent=2,ensure_ascii=False))
