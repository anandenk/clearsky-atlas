"""Shared-edge overview simplification; exact lookup and existing display are untouched."""
import hashlib,io,json,zipfile
from pathlib import Path
import numpy as np
import shapefile,shapely
from shapely.geometry import shape,mapping
from pyproj import Transformer
ROOT=Path(__file__).resolve().parents[1]
TOLERANCE=250

def prepare():
    archive=ROOT/'data/raw/ces.shp.zip'
    manifest=json.loads((ROOT/'data/raw/manifest.json').read_text())
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==manifest['ces.shp.zip']['sha256']
    z=zipfile.ZipFile(archive)
    def part(ext):return io.BytesIO(z.read(next(n for n in z.namelist() if n.endswith(ext))))
    reader=shapefile.Reader(shp=part('.shp'),shx=part('.shx'),dbf=part('.dbf'))
    records=list(reader.iterShapeRecords())
    ids=[str(int(r.record.as_dict()['tract'])).zfill(11) for r in records]
    original=np.array([shape(r.shape.__geo_interface__) for r in records])
    assert len(set(ids))==9106 and all(shapely.is_valid(original))
    original_errors=shapely.coverage_invalid_edges(original)
    excluded=~shapely.is_empty(original_errors)
    assert shapely.coverage_is_valid(original[~excluded])
    protected=excluded.copy()
    # Engineering display guard, not a scientific accuracy bound: retain source shapes
    # if generalization changes projected tract area by more than ten percent.
    for iteration in range(10):
        assert shapely.coverage_is_valid(original[~protected])
        simplified=original.copy()
        simplified[~protected]=shapely.coverage_simplify(original[~protected],TOLERANCE,simplify_boundary=False)
        ratios=abs(shapely.area(simplified)-shapely.area(original))/shapely.area(original)
        new_protected=protected | (ratios>0.10)
        if np.array_equal(protected,new_protected):break
        protected=new_protected
    else:raise ValueError('Area guard did not converge')
    assert all(shapely.is_valid(simplified)) and not any(shapely.is_empty(simplified))
    errors=shapely.coverage_invalid_edges(simplified)
    assert not any((~shapely.is_empty(errors)) & ~excluded),'New coverage error'
    for i in np.where(protected)[0]:assert original[i].equals_exact(simplified[i],0)
    assert abs(sum(shapely.length(original_errors))-sum(shapely.length(errors)))<0.001
    # Polygonal coverage outer/hole boundaries are fixed. Shared internal edges change together.
    projector=Transformer.from_crs(3310,4326,always_xy=True).transform
    display=json.loads((ROOT/'data/display.json').read_text())
    props={f['properties']['id']:f['properties'] for f in display['features']}
    features=[]; overview_wgs=[]
    for tid,g in zip(ids,simplified):
        projected=shapely.set_precision(shapely.transform(g,projector,interleaved=False),0.000001)
        assert projected.is_valid and not projected.is_empty
        overview_wgs.append(projected)
        features.append(dict(type='Feature',properties={'id':tid},bbox=list(projected.bounds),geometry=mapping(projected)))
    rounded_errors=~shapely.is_empty(shapely.coverage_invalid_edges(overview_wgs))
    assert not any(rounded_errors & ~excluded), 'New WGS84 coverage error after coordinate precision'
    output=dict(type='FeatureCollection',features=features)
    target=ROOT/'data/display-overview.json'
    target.write_text(json.dumps(output,separators=(',',':')))
    ratios=abs(shapely.area(simplified)-shapely.area(original))/shapely.area(original)
    report=dict(geometryVersion='ces5-overview-v1',featureCount=len(features),sourceCoordinates=int(shapely.count_coordinates(original)),overviewCoordinates=int(shapely.count_coordinates(simplified)),
                algorithm='Shapely coverage_simplify Visvalingam-Whyatt on valid remainder, simplify_boundary=False; original invalid-coverage and area-sensitive tracts retained before reprojection/precision',
                coordinatePrecisionDegrees=0.000001,properties='Tract ID only; named map values joined from canonical observations',toleranceParameterMetres=TOLERANCE,toleranceMeaning='Visvalingam-Whyatt area-based parameter; not a maximum positional displacement bound',
                sourceCrs='EPSG:3310',targetCrs='EPSG:4326',sourceInvalidCoverageIds=[ids[i] for i in np.where(excluded)[0]],areaGuardMaxRelativeChange=0.10,areaGuardRetainedIds=[ids[i] for i in np.where(protected & ~excluded)[0]],newCoverageErrorIds=[],
                sourceInvalidEdgeLengthMetres=float(sum(shapely.length(original_errors))),overviewInvalidEdgeLengthMetres=float(sum(shapely.length(errors))),
                relativeAreaChangeMedian=float(np.median(ratios)),relativeAreaChangeP95=float(np.quantile(ratios,.95)),relativeAreaChangeMax=float(max(ratios)),
                sourceArchiveSha256=manifest['ces.shp.zip']['sha256'],displayInputSha256=hashlib.sha256((ROOT/'data/display.json').read_bytes()).hexdigest(),lookupSha256=hashlib.sha256((ROOT/'data/lookup.json').read_bytes()).hexdigest(),
                artifactSha256=hashlib.sha256(target.read_bytes()).hexdigest(),artifactBytes=target.stat().st_size,geosVersion=shapely.geos_version_string,
                limitations=['Overview display only; use default detail geometry for neighborhood inspection and unsimplified lookup for membership.','Source coverage has five known unmatched/overlapping-edge participants; overview retains those source geometries and does not repair scientific boundaries.','Topology checks apply in projected source CRS; no sub-metre or parcel accuracy claim.'])
    (ROOT/'data/contracts/map-overview.json').write_text(json.dumps(report,indent=2))
    (ROOT/'src/contracts/map-overview-proof.ts').write_text('// Generated by scripts/prepare_map_overview.py.\nexport const MAP_OVERVIEW_PROOF = '+json.dumps(report,indent=2)+' as const;\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':prepare()
