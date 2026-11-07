"""Reproduce demo and independent Census2020 verification fixtures."""
import sys,json,urllib.parse
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent));from fetch_sources import fetch
R=Path(__file__).resolve().parents[1];samples=[]
for key,address in [('oakland-central','125 14th St Oakland CA 94612'),('fresno','2600 Fresno St Fresno CA'),('oakland-central-near','129 14th St Oakland CA 94612'),('outside','1600 Pennsylvania Ave NW Washington DC')]:
 q=urllib.parse.urlencode(dict(address=address,benchmark='Public_AR_Current',vintage='Census2020_Current',format='json'))
 p=fetch('geocode-'+key+'.json','https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?'+q)
 matches=json.loads(p.read_text())['result']['addressMatches']
 if key in ['oakland-central','fresno']:
  if len(matches)!=1:raise ValueError(f'{key}: demo needs one verified match')
  samples.append({'key':'oakland' if key=='oakland-central' else key,'matches':matches})
(R/'data/demo-geocodes.json').write_text(json.dumps(samples))
