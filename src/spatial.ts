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
