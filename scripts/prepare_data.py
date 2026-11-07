import csv,json,zipfile,io,sys
from pathlib import Path
import shapefile
from pyproj import Transformer
from shapely.geometry import shape,mapping
from shapely.ops import transform
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'scripts'))
rows=list(csv.DictReader((R/'data/raw/ces.csv').open(encoding='utf-8-sig')))
z=zipfile.ZipFile(R/'data/raw/ces.shp.zip')
def part(ext):return io.BytesIO(z.read(next(n for n in z.namelist() if n.endswith(ext))))
r=shapefile.Reader(shp=part('.shp'),shx=part('.shx'),dbf=part('.dbf'));print(r.fields[:8])
t=Transformer.from_crs(3310,4326,always_xy=True).transform
records={str(int(x['tract'])).zfill(11):x for x in rows}
exact=[];display=[];invalid=[]
for sr in r.iterShapeRecords():
 a=sr.record.as_dict();tid=str(int(a['tract'])).zfill(11);g=shape(sr.shape.__geo_interface__)
 if not g.is_valid:invalid.append(tid)
 geo=transform(t,g)
 props={'id':tid,'place':records[tid]['approx_loc'],'county':records[tid]['county']}
 for f in ['pm','pmP','ozone','ozoneP']:
  s=records[tid][f];props[f]=None if s in ('','NA','-999') else float(s)
 exact.append({'type':'Feature','properties':{'id':tid},'bbox':list(geo.bounds),'geometry':mapping(geo)})
 simple=transform(t,g.simplify(30,preserve_topology=True))
 display.append({'type':'Feature','properties':props,'bbox':list(simple.bounds),'geometry':mapping(simple)})
(R/'data/lookup.json').write_text(json.dumps({'type':'FeatureCollection','features':exact},separators=(',',':')))
(R/'data/display.json').write_text(json.dumps({'type':'FeatureCollection','features':display},separators=(',',':')))
normalized={str(int(x['tract'])).zfill(11):{k:None if v in ('','NA') else v for k,v in x.items()} for x in rows}
(R/'data/observations.json').write_text(json.dumps(normalized,separators=(',',':')))
summary={'tractCount':len(rows),'geometryCount':len(exact),'uniqueIds':len(records),'invalidSourceGeometries':invalid,'sourceCRS':'EPSG:3310','targetCRS':'EPSG:4326','displaySimplificationMeters':30,'lookupSimplification':None,'release':'CES 5.0 final 2026-07-01','nullCounts':{k:sum(x[k] in ('','NA') for x in rows) for k in rows[0]}}
(R/'data/validation.json').write_text(json.dumps(summary,indent=2));print(summary)
