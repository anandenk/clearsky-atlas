import type { Facility } from "../hooks/useFacilities";
import { json } from "./provider";

type Bounds = [number, number, number, number];
export type InventorySource = {
  id: string;
  backendReady: boolean;
  datasetVersion: string;
};
const complete = new Map<string, Facility[]>();
const california: Bounds = [-125, 32, -114, 43];

export function facilityFromResponse(
  f: any,
  response: any,
  category: string,
): Facility {
  if (
    !Array.isArray(f.coordinate) ||
    f.coordinate.length !== 2 ||
    !f.coordinate.every(Number.isFinite)
  )
    throw Error("Invalid facility coordinates");
  return {
    id: f.id,
    datasetVersion: response.datasetVersion,
    category: category === "healthcare" ? "Healthcare" : "Public schools",
    name: f.name,
    coordinate: f.coordinate,
    distance: null,
    status: f.status ?? null,
    subtype: f.sourceAttributes?.FAC_FDR || f.subtype || null,
    period: f.sourcePeriod ?? response.sourcePeriod ?? null,
    sourceUrl: response.sourceUrl || response.rights?.url || "",
    limitations: response.coverage?.limitations || [],
    flags: f.flags || [],
  };
}

// The API has no pagination and caps each result at 1,000. Recursively split
// truncated bounds, then deduplicate shared-edge/co-located records by source ID.
// No point is substituted for a confirmed address and no distance is invented.
export async function loadFacilityInventory(
  source: InventorySource,
  signal: AbortSignal,
): Promise<Facility[]> {
  const key = `${source.id}/${source.datasetVersion}`;
  const hit = complete.get(key);
  if (hit) return hit;
  const work: { bounds: Bounds; depth: number }[] = [
    { bounds: california, depth: 0 },
  ];
  const records = new Map<string, Facility>();
  let expected: number | undefined,
    queries = 0;
  const query = async (bounds: Bounds, limit: number) => {
    if (++queries > 256)
      throw Error("Inventory query budget reached; complete coverage withheld");
    const r = await json(
      `/api/facilities?category=${source.id}&bbox=${bounds.join(",")}&limit=${limit}&evidence=linked&version=${encodeURIComponent(source.datasetVersion)}`,
      signal,
    );
    if (
      r.contractVersion !== "atlas-facilities-v1" ||
      r.datasetVersion !== source.datasetVersion ||
      r.category !== source.id ||
      !Array.isArray(r.facilities) ||
      !Number.isSafeInteger(r.matchedCount) ||
      r.matchedCount < 0 ||
      r.returnedCount !== r.facilities.length ||
      r.truncated !== r.matchedCount > r.returnedCount
    )
      throw Error("Facility inventory contract mismatch");
    return r;
  };
  const visit = async ({
    bounds,
    depth,
  }: {
    bounds: Bounds;
    depth: number;
  }) => {
    // Probe counts cheaply; do not download 1,000 discarded records at each
    // interior split. Fetch complete records only for bounded leaf cells.
    const r = await query(bounds, 1);
    if (depth === 0) expected = r.matchedCount;
    if (r.matchedCount > 1000) {
      if (depth >= 16)
        throw Error(
          "Dense inventory cannot be fully queried; coverage withheld",
        );
      const [w, s, e, n] = bounds;
      if ((e - w) * 0.8 >= n - s) {
        const x = (w + e) / 2;
        work.push(
          { bounds: [w, s, x, n], depth: depth + 1 },
          { bounds: [x, s, e, n], depth: depth + 1 },
        );
      } else {
        const y = (s + n) / 2;
        work.push(
          { bounds: [w, s, e, y], depth: depth + 1 },
          { bounds: [w, y, e, n], depth: depth + 1 },
        );
      }
    } else {
      const leaf = r.truncated ? await query(bounds, 1000) : r;
      if (leaf.truncated || leaf.matchedCount !== r.matchedCount)
        throw Error("Inventory changed during acquisition");
      for (const f of leaf.facilities) {
        if (typeof f.id !== "string" || !f.id)
          throw Error("Facility ID unavailable");
        records.set(f.id, facilityFromResponse(f, leaf, source.id));
      }
    }
  };
  // Two requests across this category; the hook loads categories sequentially
  // so total acquisition concurrency stays at two, including linked maps.
  while (work.length) {
    signal.throwIfAborted();
    const batch = await Promise.allSettled(work.splice(0, 2).map(visit));
    const failure = batch.find((r) => r.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
  }
  signal.throwIfAborted();
  if (records.size !== expected)
    throw Error("Inventory count mismatch; complete coverage withheld");
  const items = [...records.values()].sort((a, b) => a.id.localeCompare(b.id));
  complete.set(key, items);
  while (complete.size > 4) complete.delete(complete.keys().next().value!);
  return items;
}
