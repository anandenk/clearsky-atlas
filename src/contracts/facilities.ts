import fs from "node:fs";
import path from "node:path";
import { ContractError } from "./observations";
import { parseBounds } from "./bounds";

export type FacilityCategory = "schools" | "healthcare";
export const FACILITY_CATEGORIES: FacilityCategory[] = [
  "schools",
  "healthcare",
];
export function facilityCategory(value: string | null): FacilityCategory {
  if (!value)
    fail("category is required; available categories: schools, healthcare");
  if (!FACILITY_CATEGORIES.includes(value as FacilityCategory))
    throw new ContractError(
      422,
      "facility-category-unavailable",
      "Facility category is unavailable; available categories: schools, healthcare",
    );
  return value as FacilityCategory;
}
export type Facility = {
  id: string;
  category: FacilityCategory;
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
  observationDate: string | null;
  rights: unknown;
  coverage: unknown;
  audit: unknown;
  provenance: unknown;
  facilities: Facility[];
};
const cached = new Map<FacilityCategory, Bundle>();
export function facilityBundle(category: FacilityCategory = "schools"): Bundle {
  facilityCategory(category);
  if (!cached.has(category))
    cached.set(
      category,
      JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), `data/facilities/${category}.json`),
          "utf8",
        ),
      ),
    );
  return cached.get(category)!;
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
  const category = facilityCategory(params.get("category"));
  if (category !== bundle.category)
    throw new ContractError(
      422,
      "facility-category-unavailable",
      "Requested category does not match the loaded inventory",
    );
  const evidence = params.get("evidence") ?? "full";
  if (evidence !== "full" && evidence !== "linked")
    fail("evidence must be full or linked");
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
    provenance:
      evidence === "linked"
        ? {
            kind: "catalog-reference",
            catalogUrl: "/api/facilities/catalog",
            category,
            datasetVersion: bundle.datasetVersion,
            meaning:
              "Full source URLs, retrieval times and SHA-256 hashes are in this category’s catalog provenance; match datasetVersion before reuse.",
          }
        : bundle.provenance,
    query: { category, bbox, near, limit, evidence },
    distance: {
      method: "spherical-great-circle",
      unit: "km",
      earthRadiusKm: 6371.0088,
      meaning:
        "Straight-line to published points; nearest among coordinate-bearing records in this inventory, within bbox when supplied. No travel, eligibility or access guarantee.",
    },
    matchedCount: candidates.length,
    returnedCount: Math.min(limit, candidates.length),
    truncated: candidates.length > limit,
    facilities: candidates.slice(0, limit),
  };
}

/** Discover supported inventories and explicit source gates without loading all points into the response. */
export function facilityCatalog() {
  const categories: Record<string, unknown>[] = FACILITY_CATEGORIES.map(
    (category) => {
      try {
        const { facilities: _points, ...metadata } = facilityBundle(category);
        return { id: category, backendReady: true, ...metadata, blockers: [] };
      } catch {
        return {
          id: category,
          category,
          backendReady: false,
          blockers: [
            {
              code: "local-data-unavailable",
              detail: "Verified inventory could not be read locally.",
            },
          ],
        };
      }
    },
  );
  try {
    const staged = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data/contracts/power-readiness.json"),
        "utf8",
      ),
    );
    categories.push({ ...staged, id: "power", backendReady: false });
  } catch {
    categories.push({
      id: "power",
      category: "power",
      backendReady: false,
      blockers: [
        {
          code: "source-contract-unverified",
          detail:
            "Power source contract remains unverified; readiness evidence unavailable locally.",
        },
      ],
    });
  }
  return {
    contractVersion: "atlas-facility-catalog-v1",
    categories,
    distanceMeaning:
      "Straight-line distance to published points among the covered inventory, within bounds when supplied. No travel, eligibility or access guarantee.",
  };
}
