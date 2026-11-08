import "server-only";
import fs from "node:fs";
import path from "node:path";
import { containingTracts, intersectsTractBounds } from "./spatial";
import type {
  Feature,
  Polygon,
  MultiPolygon,
  FeatureCollection,
} from "geojson";
import type { Selection } from "./domain";
import {
  readyIndicator,
  sourceNumber,
  ContractError,
} from "./contracts/observations";
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
let overviewDisplay: Tract[];
let observations: Record<string, Record<string, string | null>>;
const read = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", f), "utf8"));
export function lookup(coordinate: [number, number]) {
  exact ??= read("lookup.json").features;
  return containingTracts(coordinate, exact) as Tract[];
}
export function exactTractsInBounds(bbox:[number,number,number,number]) {
  exact ??= read("lookup.json").features;
  return new Set(exact.filter(f=>f.bbox[0]<=bbox[2]&&f.bbox[2]>=bbox[0]&&f.bbox[1]<=bbox[3]&&f.bbox[3]>=bbox[1]&&intersectsTractBounds(f,bbox)).map(f=>f.properties.id));
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
export function mapData(
  bbox: number[],
  detail: "standard" | "overview" = "standard",
): FeatureCollection {
  const features =
    detail === "overview"
      ? (overviewDisplay ??= read("display-overview.json").features)
      : (display ??= read("display.json").features);
  return {
    type: "FeatureCollection",
    features: features.filter((f) => {
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

// Versioned observation APIs deliberately do not load the 122 MB spatial lookup.
export function tractRecord(id: string) {
  observations ??= read("observations.json");
  return observations[id] ?? null;
}
export function displayTracts(ids:string[]) {
  display ??= read("display.json").features;
  return {type:"FeatureCollection" as const,features:display.filter(f=>ids.includes(f.properties.id))};
}

// Enrich only the requested metric. Keep legacy display payloads and lookup geometry unchanged.
export function metricMapData(
  bbox: number[],
  id: string,
  detail: "standard" | "overview" = "standard",
): FeatureCollection {
  const indicator = readyIndicator(id);
  const data = mapData(bbox, detail);
  return {
    ...data,
    features: data.features.map((feature) => {
      const tid = feature.properties?.id;
      const row = typeof tid === "string" ? tractRecord(tid) : null;
      if (!row)
        throw new ContractError(
          503,
          "missing-map-attributes",
          "A display tract has no matching observation record.",
        );
      return {
        ...feature,
        properties: {
          ...feature.properties,
          [indicator.rawField]: sourceNumber(row[indicator.rawField]),
          ...(indicator.percentileField
            ? {
                [indicator.percentileField]: sourceNumber(
                  row[indicator.percentileField],
                ),
              }
            : {}),
        },
      };
    }),
  };
}
