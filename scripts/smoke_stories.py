"""Verify real story/catalog/error responses through main and frontend proxy."""
import json,urllib.request,urllib.error
from pathlib import Path
BODY=dict(locations=[dict(id='oakland',tractId='06001403402'),dict(id='fresno',tractId='06019000602'),dict(id='oakland-second',tractId='06001403402')],referenceId='oakland')

def post(origin,body,status=200,content_type='application/json'):
    data=body if isinstance(body,bytes) else json.dumps(body).encode()
    request=urllib.request.Request(origin+'/api/compare/stories',data=data,headers={'Content-Type':content_type})
    try:
        with urllib.request.urlopen(request,timeout=30) as response:
            assert response.status==status
            return json.load(response)
    except urllib.error.HTTPError as error:
        assert error.code==status,(error.code,error.read()[:500])
        return json.load(error)

if __name__=='__main__':
    samples=[]
    for port in [3000,3001]:
        origin=f'http://127.0.0.1:{port}'
        with urllib.request.urlopen(origin+'/api/stories',timeout=30) as response:catalog=json.load(response)
        assert catalog['contractVersion']=='atlas-stories-v1' and len(catalog['topics'])==5
        result=post(origin,BODY)
        assert len(result['topics'])==4 and len(result['evidence']['rows'])==23
        steps=[s for topic in result['topics'] for s in topic['steps']]
        assert len(steps)==23
        for step in steps:
            row=next(r for r in result['evidence']['rows'] if r['indicatorId']==step['evidenceRowId'])
            assert row['provenance']['sha256']==step['source']['sha256']
            assert step['locationStatements'][2]['sameTractNote']
        nearby=post(origin,{**BODY,'topics':['nearby-essentials']})
        assert nearby['topics'][0]['availability']=='use-coordinate-facility-api' and not nearby['evidence']['rows']
        assert post(origin,{**BODY,'topics':['unknown']},400)['code']=='invalid-story-topics'
        assert post(origin,{**BODY,'version':'wrong'},409)['code']=='dataset-version-mismatch'
        assert post(origin,dict(locations=[dict(id='x',tractId='06999999999')]),404)['code']=='tract-not-found'
        assert post(origin,b'{',400)['code']=='invalid-json'
        assert post(origin,b' '*32769,413)['code']=='story-request-too-large'
        assert post(origin,b'{}',415,'text/plain')['code']=='json-required'
        samples.append(result)
        print(origin,'story smoke passed: 23 sourced steps, same-tract identities, facility gate and errors')
    assert samples[0]==samples[1]
    Path('data/samples/stories-v1.json').write_text(json.dumps(samples[0],indent=2,ensure_ascii=False))
