"""Verify real facility routes on main and the frontend proxy; save a small real sample."""
import json
import urllib.error
import urllib.request
from pathlib import Path


def request(origin, query, expected=200):
    try:
        with urllib.request.urlopen(origin + '/api/facilities?' + query, timeout=30) as r:
            assert r.status == expected
            return json.load(r)
    except urllib.error.HTTPError as error:
        assert error.code == expected, (error.code, error.read())
        return json.load(error)


if __name__ == '__main__':
    samples = {}
    for port in [3000, 3001]:
        origin = f'http://127.0.0.1:{port}'
        result = request(origin, 'category=schools&near=-122.271,37.803&limit=3')
        assert result['matchedCount'] == 9946 and result['returnedCount'] == 3 and result['truncated']
        assert 0 < result['facilities'][0]['distanceKm'] < 1
        assert result['facilities'][0]['id'].startswith('cde:01')
        version = result['datasetVersion']
        assert request(origin, f'category=schools&bbox=-122.28,37.79,-122.25,37.82&version={version}')['returnedCount'] > 0
        assert request(origin, 'category=schools&bbox=0,0,1,1')['facilities'] == []
        for query, code in [('category=power&near=0,0', 422), ('category=schools&near=,1',400), ('category=schools&near=0,0&version=other',409), ('category=schools&near=0,0&limit=1001',400)]:
            assert request(origin, query, code)['code']
        health = request(origin, 'category=healthcare&near=-122.271,37.803&limit=3')
        assert health['matchedCount'] == 14919 and health['returnedCount'] == 3
        assert health['observationDate'] == '2026-10-16'
        assert all(f['id'].startswith('cdph:') and f['subtype'] for f in health['facilities'])
        assert request(origin, 'category=healthcare&bbox=0,0,1,1')['facilities'] == []
        assert request(origin, 'category=healthcare&near=0,0&version=' + version, 409)['code']
        samples['healthcare-' + str(port)] = health
        samples[str(port)] = result
        print(origin, 'facility smoke passed')
    assert samples['3000'] == samples['3001']
    assert samples['healthcare-3000'] == samples['healthcare-3001']
    Path('data/samples/healthcare-v1.json').write_text(json.dumps(samples['healthcare-3000'], indent=2, ensure_ascii=False))
    Path('data/samples/facilities-v1.json').write_text(json.dumps(samples['3000'], indent=2, ensure_ascii=False))
