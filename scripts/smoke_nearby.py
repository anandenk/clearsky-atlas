"""Real confirmed-coordinate facility comparisons and withholding/errors through both origins."""
import json,urllib.request,urllib.error
from pathlib import Path

def location(name,id):
    match=json.loads(Path('data/raw/geocode-'+name+'.json').read_text())['result']['addressMatches'][0]
    return dict(id=id,tractId=match['geographies']['Census Tracts'][0]['GEOID'],coordinate=[match['coordinates']['x'],match['coordinates']['y']],confirmed=True)
A=location('oakland-central','oakland');B=location('fresno','fresno');N=location('oakland-central-near','oakland-near')
BODY=dict(locations=[A,B,N],referenceId=A['id'],categories=['schools','healthcare','power'],limit=3)

def post(origin,body,status=200,content_type='application/json'):
    payload=body if isinstance(body,bytes) else json.dumps(body).encode()
    request=urllib.request.Request(origin+'/api/compare/facilities',data=payload,headers={'Content-Type':content_type})
    try:
        with urllib.request.urlopen(request,timeout=30) as response:
            assert response.status==status;return json.load(response)
    except urllib.error.HTTPError as error:
        assert error.code==status,(error.code,error.read()[:500]);return json.load(error)

if __name__=='__main__':
    samples=[]
    for port in [3000,3001]:
        origin=f'http://127.0.0.1:{port}'
        with urllib.request.urlopen(origin+'/api/stories',timeout=30) as response:
            assert json.load(response)['topics'][-1]['facilityNarrativeUrl']=='/api/compare/facilities'
        result=post(origin,BODY)
        assert result['contractVersion']=='atlas-nearby-comparison-v1'
        assert [c['availability'] for c in result['categories']]==['ready','ready','unavailable']
        for category in result['categories'][:2]:
            assert category['results'][2]['comparisonToReference']['sameTract']
            assert not category['results'][2]['comparisonToReference']['sameCoordinate']
            assert category['results'][2]['nearestDistanceKm']!=category['results'][0]['nearestDistanceKm']
            assert category['results'][0]['comparisonToReference']['nearestDistanceDifferenceKm']==0
            assert category['results'][0]['facilities'][0]['sourcePeriod']
        for location,code,status in [({**A,'confirmed':False},'location-confirmation-required',422),({**A,'tractId':B['tractId']},'coordinate-tract-mismatch',409),({**A,'coordinate':[-130,36]},'coordinate-not-covered',422),({**A,'coordinate':[37,-122]},'invalid-nearby-request',400)]:
            assert post(origin,dict(locations=[location]),status)['code']==code
        assert post(origin,{**BODY,'facilityVersions':{'schools':'wrong'}},409)['code']=='unsupported-facility-version'
        assert post(origin,b'{',400)['code']=='invalid-json'
        assert post(origin,b' '*32769,413)['code']=='nearby-request-too-large'
        assert post(origin,b'{}',415,'text/plain')['code']=='json-required'
        samples.append(result);print(origin,'nearby smoke passed: original coordinates, same-tract distinct distances, category readiness and withholding')
    assert samples[0]==samples[1]
    Path('data/samples/nearby-v1.json').write_text(json.dumps(samples[0],indent=2,ensure_ascii=False))
