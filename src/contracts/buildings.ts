import fs from "node:fs";
import path from "node:path";
import type { Feature, Geometry } from "geojson";
export const BUILDING_VERSION = "2026-10-21.0";
export const BUILDING_LIMITS = {
  maxSpanDegrees: 0.02,
  maxFeatures: 5000,
  maxBytes: 4000000,
  recommendedMinZoom: 15,
};
type Bounds = [number, number, number, number];
type Region = {
  id: string;
  bbox: Bounds;
  count: number;
  missingHeight: number;
};
type Building = Feature<
  Geometry,
  {
    id: string;
    height: number | null;
    levels: number | null;
    heightProvenance: string;
    sources: unknown;
    hasParts: boolean | null;
    dataset: string;
    datasetVersion: string;
  }
> & { bbox: Bounds };
type Index = { features: Building[]; cells: Record<string, number[]> };
const base = path.join(process.cwd(), "data/buildings", BUILDING_VERSION);
const cache = new Map<string, Index>();
export class BuildingError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const intersects = (a: Bounds, b: Bounds) =>
  a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
export function buildingData(
  bbox: Bounds,
  version: string | null,
  signal?: AbortSignal,
) {
  if (version !== BUILDING_VERSION)
    throw new BuildingError(
      409,
      "version-mismatch",
      `Required version=${BUILDING_VERSION}`,
    );
  if (
    bbox[2] - bbox[0] > BUILDING_LIMITS.maxSpanDegrees + 1e-9 ||
    bbox[3] - bbox[1] > BUILDING_LIMITS.maxSpanDegrees + 1e-9
  )
    throw new BuildingError(
      400,
      "bounds-too-large",
      "Zoom in: maximum bbox width and height are 0.02 degrees.",
    );
  signal?.throwIfAborted();
  let manifest: { cellSize: number; regions: Region[] };
  try {
    manifest = JSON.parse(
      fs.readFileSync(path.join(base, "manifest.json"), "utf8"),
    );
  } catch {
    throw new BuildingError(
      503,
      "data-unavailable",
      "Building cache is unavailable; run acquisition and preparation.",
    );
  }
  const region = manifest.regions.find(
    (r) =>
      bbox[0] >= r.bbox[0] &&
      bbox[1] >= r.bbox[1] &&
      bbox[2] <= r.bbox[2] &&
      bbox[3] <= r.bbox[3],
  );
  if (!region)
    throw new BuildingError(
      422,
      "outside-coverage",
      "Entire viewport must be inside a documented pilot region; statewide coverage is not yet cached.",
    );
  let index = cache.get(region.id);
  if (!index) {
    try {
      index = JSON.parse(
        fs.readFileSync(path.join(base, region.id + ".json"), "utf8"),
      ) as Index;
      cache.set(region.id, index);
    } catch {
      throw new BuildingError(
        503,
        "data-unavailable",
        "Building region cache is unavailable.",
      );
    }
  }
  const ids = new Set<number>();
  const cell = manifest.cellSize;
  for (let x = Math.floor(bbox[0] / cell); x <= Math.floor(bbox[2] / cell); x++)
    for (
      let y = Math.floor(bbox[1] / cell);
      y <= Math.floor(bbox[3] / cell);
      y++
    )
      for (const i of index.cells[`${x},${y}`] ?? []) ids.add(i);
  const features: Building[] = [];
  for (const i of ids) {
    signal?.throwIfAborted();
    const f = index.features[i];
    if (intersects(f.bbox, bbox)) features.push(f);
  }
  features.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
  if (features.length > BUILDING_LIMITS.maxFeatures)
    throw new BuildingError(
      413,
      "result-too-large",
      "Zoom in: more than 5000 buildings; no partial result returned.",
    );
  const result = {
    type: "FeatureCollection",
    bbox,
    features,
    metadata: {
      contractVersion: "atlas-buildings-v1",
      datasetVersion: BUILDING_VERSION,
      dataset: "Overture Buildings",
      sourceUrl: "https://docs.overturemaps.org/guides/buildings/",
      license: "ODbL-1.0",
      licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
      attribution:
        "© OpenStreetMap contributors, Overture Maps Foundation; additional contributors in feature sources",
      attributionUrl: "https://docs.overturemaps.org/attribution/",
      coverage: {
        scope: "pilot",
        region: region.id,
        regions: manifest.regions.map((r) => ({ id: r.id, bbox: r.bbox })),
        completeInventory: false,
        status: features.length ? "available" : "empty",
      },
      truncated: false,
      count: features.length,
      limits: BUILDING_LIMITS,
      heightUnit: "metres",
      heightMeaning:
        "Source-supplied height may be estimated; not a surveyed-height guarantee. Null means unknown; no defaults or level-derived heights supplied.",
      geometryMeaning:
        "Source footprint/roofprint, whole features whose bounding boxes intersect the viewport; not photorealistic 3D.",
      partsIncluded: false,
    },
  };
  if (Buffer.byteLength(JSON.stringify(result)) > BUILDING_LIMITS.maxBytes)
    throw new BuildingError(
      413,
      "result-too-large",
      "Zoom in: response exceeds 4 MB; no partial result returned.",
    );
  return result;
}
