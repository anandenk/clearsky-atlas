"""Verify intended CES indicators against final publisher apps and source records."""
import json,sys,hashlib,urllib.parse
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent));from fetch_sources import fetch
R=Path(__file__).resolve().parents[1]
# Curated contracts from inspected final-app popup descriptions AND expression results.
# Units/periods are not inferred from numeric magnitudes or publisher update dates.
specs={
 'pm':('Air Quality: PM2.5','pm','pmP','µg/m³','2022–2024',['micrograms per meter cubed','2022 to 2024'],'Annual mean fine-particle concentration averaged over three years; monitor/satellite estimates exclude wildfire-smoke days statewide.'),
 'ozone':('Air Quality: Ozone','ozone','ozoneP','ppm','2022–2024',['parts per million','2022 to 2024'],'Mean May–October daily maximum 8-hour ozone concentration; ordinary kriging estimates at tract centers.'),
 'diesel':('Diesel Particulate Matter','diesel','dieselP','tons/year','2021 or 2022 by source',['tons per year','2021 or 2022'],'Diesel PM emissions within and near populated parts of the tract, including on-road, stationary, area and ocean-going vessel sources; not ambient concentration.'),
 'traffic':('Traffic Impacts','traffic','trafficP','vehicles/hour','2023',['vehicles per hour','2023','kilometers of roadway'],'Adjusted traffic volume in vehicle-km/hour divided by road length in km within and up to 150 m around the tract; not a vehicle count or travel-time estimate.'),
 'toxic-releases':('Toxic Releases from Facilities','RSEIhaz','RSEIhazP','toxicity-weighted score','2021–2023',['indicator scores','2021–2023'],'Source RSEI toxicity-weighted modeled air-concentration score for large-facility releases; not unweighted emissions, a physical concentration, or personal risk.'),
 'cleanup':('Cleanup Sites','cleanups','cleanupsP','weighted site score','March 2026 source snapshot',['weighted by site characteristics','March 2026'],'Weighted sum of cleanup and NPL Superfund sites by site characteristics and proximity to populated areas; not a site count.'),
 'asthma':('Asthma','asthma','asthmaP','ED visits per 10,000 people','2022–2023',['age-adjusted','10,000','2022 to 2023'],'Age-adjusted asthma emergency department visit rate averaged over 2022–2023; population-level rate, not personal disease probability.'),
 'heart-attacks':('Cardiovascular Disease','cvd','cvdP','ED visits per 10,000 people','2021–2023',['age-adjusted','10,000','2021 to 2023'],'Age-adjusted acute myocardial infarction emergency department visit rate averaged over 2021–2023; not all cardiovascular diagnoses or personal disease probability.'),
 'diabetes':('Diabetes Prevalence','diabetes','diabetesP','%','2023',['2023','% of adults have diabetes'],'Model-based diabetes prevalence among adults aged 18 and older from CDC PLACES, 2023; not a diagnosis or personal disease probability.'),
 'low-birth-weight':('Low-Birth-Weight Infants','lbw','lbwP','%','2018–2024',['2,500 grams','2018 to 2024'],'Percent of live births weighing less than 2,500 g, averaged over 2018–2024; records with too few births may be missing.'),
 'poverty':('Poverty','pov','povP','%','2020–2024 ACS 5-year',['percentage of people','2020 to 2024'],'Percent of people living below twice the federal poverty level, 2020–2024 ACS; not percent below the single federal poverty threshold.'),
 'education':('Educational Attainment','edu','eduP','%','2020–2024 ACS 5-year',['percentage of adults','2020 to 2024'],'Percent of adults aged 25 and older with less than a high school education, 2020–2024 ACS.'),
 'housing':('Housing Burden','housingB','housingBP','%','2018–2022 HUD CHAS',['less than 80%','more than 50%','2018 to 2022'],'Percent of households with income below 80% of county median family income and housing costs above 50% of household income, 2018–2022 HUD CHAS.'),
}
items=[]
for name in ['ces5-official-item-search.json','ces5-official-item-search-page2.json']:items+=json.loads((R/'data/raw'/name).read_text())['results']
evidence={}
for key,(title,field,pct,unit,period,tokens,definition) in specs.items():
 matches=[x for x in items if x['type']=='Web Mapping Application' and x['title']==title+' - CES5'];assert len(matches)==1,key
 item_id=matches[0]['id'];p=fetch(key+'-official-app.json',f'https://www.arcgis.com/sharing/rest/content/items/{item_id}/data?f=json');meta=fetch(key+'-official-item.json',f'https://www.arcgis.com/sharing/rest/content/items/{item_id}?f=json');item=json.loads(meta.read_text());assert item['owner']=='sam.burns_oehha' and item['access']=='public'
 app=json.loads(p.read_text());popup=app['values']['searchConfiguration']['sources'][1]['popupTemplate'];body=json.dumps(popup,ensure_ascii=False)
 for token in tokens:assert token in body,(key,token)
 evidence[key]={'unit':unit,'measurementPeriod':period,'definition':definition,'rawField':field,'percentileField':pct,'sourceURL':f'https://oehha.maps.arcgis.com/apps/instant/sidebar/index.html?appid={item_id}','cacheFile':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'owner':item['owner'],'jsonPath':'values.searchConfiguration.sources[1].popupTemplate (description + popupElements expressions)','assertions':tokens}
obs=json.loads((R/'data/observations.json').read_text());checks=[];fields=[f for s in specs.values() for f in s[1:3]]
for key in ['oakland-central','fresno']:
 m=json.loads((R/f'data/raw/geocode-{key}.json').read_text())['result']['addressMatches'][0];c=m['coordinates'];tid=m['geographies']['Census Tracts'][0]['GEOID'];q=urllib.parse.urlencode({'f':'json','geometry':f"{c['x']},{c['y']}",'geometryType':'esriGeometryPoint','inSR':'4326','spatialRel':'esriSpatialRelIntersects','outFields':','.join(['tract']+fields),'returnGeometry':'false'})
 p=fetch('target-point-'+key+'.json','https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CES5_final_webmap_gdb/FeatureServer/0/query?'+q);features=json.loads(p.read_text())['features'];assert len(features)==1;a=features[0]['attributes'];assert str(int(a['tract'])).zfill(11)==tid
 for f in fields:
  assert (a[f] is None)==(obs[tid][f] is None),(tid,f)
  if a[f] is not None:assert abs(float(a[f])-float(obs[tid][f]))<1e-8,(tid,f,a[f],obs[tid][f])
 checks.append({'tractId':tid,'cacheFile':str(p.relative_to(R)),'fields':fields,'tolerance':1e-8})
result={'datasetVersion':'ces-5.0-final-2026-07-01','indicators':evidence,'pointChecks':checks,'interpretation':'Descriptive tract observations only; source zero/null rules preserved; health is not personal probability; weighted scores are not physical concentrations/site counts.'}
(R/'data/contracts/indicator-evidence.json').write_text(json.dumps(result,indent=2))
# Generated runtime metadata; frontend imports its live API, not this module.
(R/'src/contracts/verified-targets.ts').write_text('// Generated by scripts/verify_indicator_sources.py from inspected publisher evidence.\nexport const verifiedTargets = '+json.dumps(evidence,ensure_ascii=False,indent=2)+' as const;\n')
print('Verified',len(evidence),'indicator contracts and',len(checks),'source point records')
