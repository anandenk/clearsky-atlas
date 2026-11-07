import "server-only";
import fs from "node:fs";
import path from "node:path";
import { containingTracts } from "./spatial";
import type {
  Feature,
  Polygon,
  MultiPolygon,
  FeatureCollection,
} from "geojson";
import { Selection } from "./domain";
type Tract = Feature<
  Polygon | MultiPolygon,
  {
    id: string;
    place?: string;
    county?: string;
    pm?: number | null;
    pmP?: number | null;
  }
> & { bbox: number[] };
let exact: Tract[];
let display: Tract[];
let observations: Record<string, Record<string, string | null>>;
const read = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", f), "utf8"));
export function lookup(coordinate: [number, number]) {
  exact ??= read("lookup.json").features;
  return containingTracts(coordinate, exact) as Tract[];
}
export function selection(
  label: string,
  coordinate: [number, number],
  cached = false,
  censusTract?: string,
): Selection {
  const matches = lookup(coordinate);
  if (matches.length > 1)
    throw new Error(
      "This coordinate lies on a tract boundary. Try a more precise address; no tract was assigned.",
    );
  if (!matches.length)
    throw new Error(
      "No California CES tract covers this coordinate. Check the address or try another location.",
    );
  const tractId = matches[0].properties.id;
  if (censusTract && censusTract !== tractId)
    throw new Error(
      "Census and CES tract lookups disagree. This match needs review; no indicator was assigned.",
    );
  observations ??= read("observations.json");
  const o = observations[tractId];
  return {
    label,
    coordinate,
    tractId,
    place: o.approx_loc ?? "",
    county: o.county ?? "",
    observations: o,
    cached,
    censusTract,
    precision:
      "Census address-range interpolation; confirm the matched address",
  };
}
export function mapData(bbox: number[]): FeatureCollection {
  display ??= read("display.json").features;
  return {
    type: "FeatureCollection",
    features: display.filter((f) => {
      const b = f.bbox;
      return (
        b[0] <= bbox[2] && b[2] >= bbox[0] && b[1] <= bbox[3] && b[3] >= bbox[1]
      );
    }),
  };
}
export function demos() {
  return read("demo-geocodes.json")
    .filter((d: { key: string }) => ["oakland", "fresno"].includes(d.key))
    .map((d: { matches: any[] }) => {
      const m = d.matches[0];
      return selection(
        m.matchedAddress,
        [m.coordinates.x, m.coordinates.y],
        true,
        m.geographies["Census Tracts"]?.[0]?.GEOID,
      );
    });
}
