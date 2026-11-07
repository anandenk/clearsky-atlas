#!/usr/bin/env python3
"""Fetch bounded raw ArcGIS metadata and samples; no installations required."""
import datetime, hashlib, json, pathlib, urllib.parse, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
SOURCES = {
    'healthcare': 'https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/CDPH_Healthcare_Facilities/FeatureServer/0',
    'schools': 'https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/SchoolSites2526/FeatureServer/0',
    'power': 'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Power_Plant/FeatureServer/0',
}
records = []
for name, base in SOURCES.items():
    for kind, params in [('metadata', {'f': 'pjson'}), ('sample', {'where': '1=1', 'outFields': '*', 'resultRecordCount': '2', 'outSR': '4326', 'returnGeometry': 'true', 'f': 'pjson'})]:
        url = base + ('/query' if kind == 'sample' else '') + '?' + urllib.parse.urlencode(params)
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                raw = response.read(2_000_001)
                if len(raw) > 2_000_000:
                    raise ValueError('response exceeds 2 MB bound')
                payload = json.loads(raw)
                if 'error' in payload:
                    raise ValueError('ArcGIS error: ' + str(payload['error']))
                if kind == 'metadata' and not isinstance(payload.get('fields'), list):
                    raise ValueError('missing metadata fields')
                if kind == 'sample' and (not isinstance(payload.get('features'), list) or not 1 <= len(payload['features']) <= 2):
                    raise ValueError('missing or out-of-bounds sample features')
                stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
                filename = f'{name}-{kind}.json'
                (HERE / filename).write_bytes(raw)
                records.append({'file': filename, 'original_url': url, 'retrieved_utc': stamp, 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), 'http_status': response.status})
                print(filename, 'OK')
        except Exception as exc:
            print(name, kind, 'FAILED:', exc)
(HERE / 'raw-manifest.json').write_text(json.dumps({'description': 'Successful raw HTTP responses from fetch.py; failures are not cached.', 'responses': records}, indent=2) + '\n')
