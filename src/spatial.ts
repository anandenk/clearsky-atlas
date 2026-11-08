import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, Polygon, MultiPolygon } from "geojson";
export function containingTracts(
  coordinate: [number, number],
  features: (Feature<Polygon | MultiPolygon> & { bbox: number[] })[],
) {
  if (
    coordinate.some((x) => !Number.isFinite(x)) ||
    coordinate[0] < -180 ||
    coordinate[0] > 180 ||
    coordinate[1] < -90 ||
    coordinate[1] > 90
  )
    return [];
  return features.filter((f) => {
    const b = f.bbox;
    return (
      coordinate[0] >= b[0] &&
      coordinate[0] <= b[2] &&
      coordinate[1] >= b[1] &&
      coordinate[1] <= b[3] &&
      booleanPointInPolygon(coordinate, f)
    );
  });
}

/** Closed rectangle intersection, including tract boundaries and polygon holes. */
export function intersectsTractBounds(feature:Feature<Polygon|MultiPolygon>, b:[number,number,number,number]) {
  const corners:[[number,number],[number,number],[number,number],[number,number]]=[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]];
  if(corners.some(c=>booleanPointInPolygon(c,feature)))return true;
  const polygons=feature.geometry.type==="Polygon"?[feature.geometry.coordinates]:feature.geometry.coordinates;
  // Liang–Barsky clipping of each ring segment against the closed rectangle.
  for(const polygon of polygons)for(const ring of polygon)for(let i=1;i<ring.length;i++){
    const a=ring[i-1],c=ring[i],dx=c[0]-a[0],dy=c[1]-a[1];let low=0,high=1,hit=true;
    for(const [p,q] of [[-dx,a[0]-b[0]],[dx,b[2]-a[0]],[-dy,a[1]-b[1]],[dy,b[3]-a[1]]]){
      if(p===0){if(q<0){hit=false;break;}}
      else {const r=q/p;if(p<0)low=Math.max(low,r);else high=Math.min(high,r);if(low>high){hit=false;break;}}
    }
    if(hit)return true;
  }
  return false;
}
