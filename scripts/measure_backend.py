"""Bounded local HTTP timing/payload measurements; no rendered/performance guarantees."""
import argparse
import datetime
import gzip
import hashlib
import json
import platform
import statistics
import time
import urllib.request
from pathlib import Path
from smoke_overview import BODY

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--origin',default='http://127.0.0.1:3000')
    parser.add_argument('--mode',choices=['development','production'],required=True)
    parser.add_argument('--map-only',action='store_true')
    parser.add_argument('--output',default='data/benchmarks/backend-baseline-v1.json')
    args=parser.parse_args()
    rows=json.loads(Path('data/observations.json').read_text())
    six=dict(locations=BODY['locations']+[dict(id='tract-'+str(i),tractId=tid) for i,tid in enumerate(list(rows)[:3])])
    cases=[('statewide-pm','/api/map?bbox=-125,32,-114,43&indicator=pm',None),('statewide-pm-overview','/api/map?bbox=-125,32,-114,43&indicator=pm&detail=overview',None),('oakland-pm','/api/map?bbox=-122.28,37.79,-122.25,37.82&indicator=pm',None),('schools-nearest-six','/api/facilities?category=schools&near=-122.271,37.803&limit=6',None),('healthcare-nearest-six','/api/facilities?category=healthcare&near=-122.271,37.803&limit=6',None),('schools-nearest-six-linked','/api/facilities?category=schools&near=-122.271,37.803&limit=6&evidence=linked',None),('overview-three-23','/api/compare/overview',BODY),('overview-six-23','/api/compare/overview',six)]
    if args.map_only: cases=[c for c in cases if c[0] in ['statewide-pm','statewide-pm-overview','oakland-pm']]
    results=[]
    for name,url,payload in cases:
        durations=[]
        for iteration in range(6):
            req=urllib.request.Request(args.origin+url,data=json.dumps(payload).encode() if payload else None,headers={'Content-Type':'application/json','Accept-Encoding':'identity'})
            start=time.perf_counter()
            with urllib.request.urlopen(req,timeout=60) as response:
                body=response.read();encoding=response.headers.get('Content-Encoding')
            elapsed=(time.perf_counter()-start)*1000
            durations.append(elapsed)
        decoded=json.loads(body)
        item=dict(case=name,firstRequestMs=round(durations[0],2),warmSamplesMs=[round(v,2) for v in durations[1:]],warmMedianMs=round(statistics.median(durations[1:]),2),warmMaxMs=round(max(durations[1:]),2),responseBytes=len(body),offlineGzipBytes=len(gzip.compress(body,mtime=0)),contentEncoding=encoding,featureCount=len(decoded['features']) if 'features' in decoded else None)
        results.append(item);print(json.dumps(item))
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(dict(measuredAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),origin=args.origin,servingMode=args.mode,architecture=platform.machine(),sourceHashes={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['src/contracts/overview.ts','src/contracts/facilities.ts','src/data.ts','src/contracts/map-response.ts','src/contracts/map-overview-proof.ts','scripts/measure_backend.py']},method='First request plus five sequential warm local HTTP requests, read through complete body; no controlled process-cold start or concurrent-load isolation. Accept-Encoding identity. Offline gzip estimate is not observed wire compression.',limitations=['Development timings are not production latency or browser/GPU/frame/memory evidence.','Frontend may issue concurrent requests; no controlled device/network profile or statistical percentile inference.','Payload sizes describe current complete-feature responses, not clipped polygons or tiles.'],results=results),indent=2))
