"""Snapshot representative real scalar/demographic API records, including null/zero cases."""
import json,urllib.request
from pathlib import Path
R=Path(__file__).resolve().parents[1]
rows=json.loads((R/'data/observations.json').read_text())
def get(path):
 with urllib.request.urlopen('http://127.0.0.1:3000'+path,timeout=30) as r:return json.load(r)
ids='asthma,heart-attacks,diabetes,low-birth-weight,poverty,housing,diesel,cleanup,pop_und10,hisp'
missing=next(tid for tid,row in rows.items() if row['lbw'] is None);zero=next(tid for tid,row in rows.items() if row['cleanups']=='0')
sample={'sampleStatus':'Representative real source-backed local API responses; not synthetic and not proof of every geocode.','sourceEvidence':'data/contracts/indicator-evidence.json','tracts':[get(f'/api/tracts/{tid}?indicators={ids}') for tid in ['06001403402','06019000602']],'genuineMissing':get(f'/api/tracts/{missing}?indicators=low-birth-weight'),'genuineZero':get(f'/api/tracts/{zero}?indicators=cleanup')}
p=R/'data/samples/breadth-api-v1.json';p.write_text(json.dumps(sample,indent=2));print(p,p.stat().st_size,'bytes')
