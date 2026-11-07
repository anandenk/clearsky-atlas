"""Reproducible primary-source evidence for the two air contracts; no guessed units."""
import json,sys,urllib.parse,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fetch_sources import fetch
R=Path(__file__).resolve().parents[1]
apps={'pm':'5068668b6c4744ada5b6d38ec621ba5f','ozone':'fc7c46d8b7e14ce69c0bc17fe71eb34b'}
evidence={}
for name,item_id in apps.items():
 app=fetch(name+'-official-app.json',f'https://www.arcgis.com/sharing/rest/content/items/{item_id}/data?f=json')
 item=fetch(name+'-official-item.json',f'https://www.arcgis.com/sharing/rest/content/items/{item_id}?f=json')
 a=json.loads(app.read_text());i=json.loads(item.read_text());popup=a['values']['searchConfiguration']['sources'][1]['popupTemplate']['description']
 assert '2022 to 2024' in popup
 assert ('micrograms per meter cubed' if name=='pm' else 'parts per million') in popup
 mapid=a['values']['webmap'];wm=fetch(name+'-official-webmap.json',f'https://www.arcgis.com/sharing/rest/content/items/{mapid}/data?f=json')
 layer=json.loads(wm.read_text())['operationalLayers'][0]['layers'][0]['url']
 evidence[name]={'factSheetURL':f'https://oehha.ca.gov/calenviroscreen/fact-sheet/air-quality-{ "pm25" if name=="pm" else "ozone"}', 'officialLinkedAppURL':f'https://oehha.maps.arcgis.com/apps/instant/sidebar/index.html?appid={item_id}', 'appItemOwner':i['owner'],'appItemTitle':i['title'],'unit':'µg/m³' if name=='pm' else 'ppm','measurementPeriod':'2022–2024','unitEvidenceJSONPath':'values.searchConfiguration.sources[1].popupTemplate.description','methodAuthority':'Official fact sheet and downloaded dictionary; app ozone popup uses ambiguous summed wording, not adopted as metric definition.','rawAppFile':str(app.relative_to(R)), 'rawAppSHA256':hashlib.sha256(app.read_bytes()).hexdigest(),'webmapFile':str(wm.relative_to(R)),'layerURL':layer}
obs=json.loads((R/'data/observations.json').read_text());checks=[]
for key in ['oakland-central','fresno']:
 m=json.loads((R/f'data/raw/geocode-{key}.json').read_text())['result']['addressMatches'][0];coord=m['coordinates'];tid=m['geographies']['Census Tracts'][0]['GEOID']
 q=urllib.parse.urlencode({'f':'json','geometry':f"{coord['x']},{coord['y']}",'geometryType':'esriGeometryPoint','inSR':'4326','spatialRel':'esriSpatialRelIntersects','outFields':'tract,pm,pmP,ozone,ozoneP','returnGeometry':'false'})
 p=fetch('air-map-point-'+key+'.json',evidence['pm']['layerURL']+'/query?'+q)
 features=json.loads(p.read_text())['features'];assert len(features)==1;a=features[0]['attributes'];assert str(int(a['tract'])).zfill(11)==tid
 for f in ['pm','pmP','ozone','ozoneP']:assert abs(float(a[f])-float(obs[tid][f]))<1e-8,(key,f,a[f],obs[tid][f])
 checks.append({'tractId':tid,'fields':['pm','pmP','ozone','ozoneP'],'matchTolerance':1e-8,'responseFile':str(p.relative_to(R))})
result={'datasetVersion':'ces-5.0-final-2026-07-01','evidence':evidence,'pointChecks':checks,'unresolved':[],'scope':'Verifies these indicator contracts and two representative point records, not every address or statistical uncertainty.'}
(R/'data/contracts/air-evidence.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
