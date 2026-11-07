"""Snapshot real local API examples after smoke checks; no source/provider calls."""
import json,urllib.request
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def get(path):
 with urllib.request.urlopen('http://127.0.0.1:3000'+path,timeout=30) as r:return json.load(r)
a='06001403402';b='06019000602'
sample={'sampleStatus':'Verified source-backed local API responses; not synthetic or a complete coverage test.','sourceEvidence':'data/contracts/air-evidence.json','tracts':[get(f'/api/tracts/{tid}?indicators=pm,ozone') for tid in [a,b]],'comparisons':[get(f'/api/compare?tractA={a}&tractB={b}&indicator={id}') for id in ['pm','ozone']]}
p=R/'data/samples/air-api-v1.json';p.write_text(json.dumps(sample,indent=2));print(p,p.stat().st_size,'bytes')
