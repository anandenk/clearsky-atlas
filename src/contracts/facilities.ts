import fs from "node:fs";
import path from "node:path";
import { ContractError } from "./observations";
import { parseBounds } from "./bounds";

export type Facility = {
  id: string;
  category: "schools";
  name: string | null;
  coordinate: [number, number] | null;
  sourceId: string;
  status: string | null;
  observationDate: string | null;
  sourcePeriod: string;
  subtype: string | null;
  flags: string[];
  sourceAttributes: Record<string, unknown>;
};
type Bundle = {
  contractVersion: string;
  datasetVersion: string;
  category: string;
  sourceUrl: string;
  sourcePeriod: string;
  observationDate: null;
  rights: unknown;
  coverage: unknown;
  audit: unknown;
  provenance: unknown;
  facilities: Facility[];
};
let cached: Bundle | undefined;
export function facilityBundle(): Bundle {
  if (!cached)
    cached = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data/facilities/schools.json"),
        "utf8",
      ),
    );
  return cached!;
}
/** Mean Earth radius (IUGG), spherical great-circle distance, in km. */
export function straightLineKm(
  a: [number, number],
  b: [number, number],
): number {
  const rad = Math.PI / 180;
  const lat = (b[1] - a[1]) * rad,
    lon = (b[0] - a[0]) * rad;
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(lon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
function fail(message: string): never {
  throw new ContractError(400, "invalid-facility-query", message);
}
export function facilityQuery(params: URLSearchParams, bundle: Bundle) {
  const category = params.get("category");
  if (!category) fail("category is required; available category: schools");
  if (category !== "schools")
    throw new ContractError(
      422,
      "facility-category-unavailable",
      "Facility category is unavailable; available category: schools",
    );
  const version = params.get("version");
  if (version !== null && version !== bundle.datasetVersion)
    throw new ContractError(
      409,
      "unsupported-facility-version",
      "Unsupported facility dataset version",
    );
  const bbox = params.has("bbox") ? parseBounds(params.get("bbox")) : null;
  if (params.has("bbox") && !bbox) fail("Invalid bounds");
  let near: [number, number] | null = null;
  if (params.has("near")) {
    const tokens = params.get("near")!.split(",");
    const n = tokens.map(Number);
    if (
      tokens.length !== 2 ||
      tokens.some((t) => !t.trim()) ||
      n.some((x) => !Number.isFinite(x)) ||
      n[0] < -180 ||
      n[0] > 180 ||
      n[1] < -90 ||
      n[1] > 90
    )
      fail("near must be longitude,latitude in WGS84");
    near = n as [number, number];
  }
  if (!bbox && !near) fail("Supply bbox or near");
  const limitText = params.get("limit") ?? "100";
  if (
    !/^\d+$/.test(limitText) ||
    Number(limitText) < 1 ||
    Number(limitText) > 1000
  )
    fail("limit must be an integer from 1 to 1000");
  const limit = Number(limitText);
  const candidates = bundle.facilities
    .filter(
      (f) =>
        f.coordinate &&
        (!bbox ||
          (f.coordinate[0] >= bbox[0] &&
            f.coordinate[0] <= bbox[2] &&
            f.coordinate[1] >= bbox[1] &&
            f.coordinate[1] <= bbox[3])),
    )
    .map((f) => ({
      ...f,
      distanceKm: near ? straightLineKm(near, f.coordinate!) : null,
    }));
  candidates.sort((a, b) =>
    near
      ? a.distanceKm! - b.distanceKm! || a.id.localeCompare(b.id)
      : a.id.localeCompare(b.id),
  );
  const { facilities: _facilities, ...metadata } = bundle;
  return {
    ...metadata,
    query: { category, bbox, near, limit },
    distance: {
      method: "spherical-great-circle",
      unit: "km",
      earthRadiusKm: 6371.0088,
      meaning:
        "Straight-line to published points; nearest among coordinate-bearing records in this inventory, within bbox when supplied. No travel, school assignment or access guarantee.",
    },
    matchedCount: candidates.length,
    returnedCount: Math.min(limit, candidates.length),
    truncated: candidates.length > limit,
    facilities: candidates.slice(0, limit),
  };
}
