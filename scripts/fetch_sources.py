"""Cache official inputs; reruns reuse successful downloads and verify hashes."""
import json,hashlib,datetime,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; RAW=ROOT/'data/raw';RAW.mkdir(parents=True,exist_ok=True)
manpath=RAW/'manifest.json';manifest=json.loads(manpath.read_text()) if manpath.exists() else {}
def fetch(name,url):
 p=RAW/name
 if p.exists() and name in manifest:
  assert hashlib.sha256(p.read_bytes()).hexdigest()==manifest[name]['sha256'];return p
 with urllib.request.urlopen(url,timeout=120) as r: body=r.read()
 p.write_bytes(body);manifest[name]={'url':url,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)}
 manpath.write_text(json.dumps(manifest,indent=2));return p
if __name__=='__main__':
 p=fetch('ces-catalog.json','https://publish.data.ca.gov/api/3/action/package_show?id=calenviroscreen-5-0')
 for r in json.loads(p.read_text())['result']['resources']:
  if r['format'].lower() in ['csv','pdf','shp']: print(fetch('ces.'+{'csv':'csv','pdf':'pdf','shp':'shp.zip'}[r['format'].lower()],r['url']))
 fetch('ces-layer.json','https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/calenviroscreen50results_F_070126_gdb/FeatureServer/2?f=pjson')
