"""Real overview API/error checks on main and its frontend proxy."""
import json
import urllib.error
import urllib.request
from pathlib import Path

BODY = dict(locations=[dict(id='oakland',tractId='06001403402'),dict(id='fresno',tractId='06019000602'),dict(id='oakland-second',tractId='06001403402')],referenceId='fresno')


def request(origin,body,expected=200,content_type='application/json'):
    payload=body if isinstance(body,bytes) else json.dumps(body).encode()
    req=urllib.request.Request(origin+'/api/compare/overview',data=payload,headers={'Content-Type':content_type})
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            assert response.status==expected
            return json.load(response)
    except urllib.error.HTTPError as error:
        assert error.code==expected,(error.code,error.read()[:500])
        return json.load(error)


if __name__=='__main__':
    samples=[]
    for port in [3000,3001]:
        origin=f'http://127.0.0.1:{port}'
        result=request(origin,BODY)
        assert result['contractVersion']=='atlas-overview-v1' and len(result['rows'])==23
        assert result['referenceId']=='fresno'
        assert result['comparisonDirection']=='location-minus-reference'
        for row in result['rows']:
            assert row['values'][0]['rawValue']==row['values'][2]['rawValue']
            assert row['values'][1]['comparisonToReference']['rawDifferenceBMinusA']==0
            assert row['summary']['distinctTractCount']==2
        assert request(origin,{**BODY,'referenceId':'absent'},400)['code']=='invalid-overview-request'
        assert request(origin,{**BODY,'version':'wrong'},409)['code']=='dataset-version-mismatch'
        assert request(origin,dict(locations=[dict(id='x',tractId='06999999999')]),404)['code']=='tract-not-found'
        assert request(origin,b'{',400)['code']=='invalid-json'
        assert request(origin,b'{}',415,'text/plain')['code']=='json-required'
        assert request(origin,b' '*32769,413)['code']=='overview-request-too-large'
        with urllib.request.urlopen(origin+'/api/indicators') as response:
            assert json.load(response)['facilities']['apiAvailable'] is True
        samples.append(result)
        print(origin,'overview smoke passed')
    assert samples[0]==samples[1]
    Path('data/samples/overview-v1.json').write_text(json.dumps(samples[0],indent=2,ensure_ascii=False))
