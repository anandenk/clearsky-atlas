import { DATASET_VERSION } from "./indicators";
import { ContractError } from "./observations";
import { parseOverviewRequest } from "./overview";
import {
  facilityQuery,
  type FacilityCategory,
  type facilityBundle,
  type facilityCatalog,
} from "./facilities";
import { narrativeNumber } from "./stories";
export const NEARBY_CONTRACT = "atlas-nearby-comparison-v1";
type Dependencies = {
  lookupTracts: (coordinate: [number, number]) => string[];
  getBundle: (category: FacilityCategory) => ReturnType<typeof facilityBundle>;
  catalog: () => ReturnType<typeof facilityCatalog>;
};
function invalid(message: string): never {
  throw new ContractError(400, "invalid-nearby-request", message);
}
export function nearbyComparison(input: unknown, dependencies: Dependencies) {
  const base = parseOverviewRequest(input);
  const value = input as Record<string, unknown>;
  if ("indicators" in value || "bbox" in value || "topics" in value)
    invalid(
      "Use locations, categories and limit; this comparison searches the complete covered category inventory.",
    );
  const categories =
    value.categories === undefined
      ? ["schools", "healthcare"]
      : value.categories;
  if (
    !Array.isArray(categories) ||
    !categories.length ||
    categories.length > 3 ||
    categories.some((c) => !["schools", "healthcare", "power"].includes(c)) ||
    new Set(categories).size !== categories.length
  )
    invalid("Use unique categories: schools, healthcare and/or power.");
  const limit = value.limit === undefined ? 3 : value.limit;
  if (
    typeof limit !== "number" ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 10
  )
    invalid("limit must be an integer from 1 to 10 per location/category.");
  const versions =
    value.facilityVersions === undefined ? {} : value.facilityVersions;
  if (
    !versions ||
    typeof versions !== "object" ||
    Array.isArray(versions) ||
    Object.entries(versions).some(
      ([key, v]) =>
        !categories.includes(key) ||
        !["schools", "healthcare"].includes(key) ||
        typeof v !== "string" ||
        !v ||
        v.length > 200,
    )
  )
    invalid(
      "facilityVersions must map requested category IDs to nonempty version strings.",
    );
  const inputs = value.locations as Record<string, unknown>[];
  const locations = base.locations.map((location, index) => {
    const record = inputs[index];
    if (record.confirmed !== true)
      throw new ContractError(
        422,
        "location-confirmation-required",
        "Each location requires confirmed=true after candidate confirmation.",
      );
    const c = record.coordinate;
    if (
      !Array.isArray(c) ||
      c.length !== 2 ||
      c.some((n) => typeof n !== "number" || !Number.isFinite(n)) ||
      c[0] < -180 ||
      c[0] > 180 ||
      c[1] < -90 ||
      c[1] > 90
    )
      invalid(
        "coordinate must be two finite WGS84 numbers in longitude,latitude order.",
      );
    return { ...location, coordinate: [c[0], c[1]] as [number, number] };
  });
  // Validate every input before source queries. No centroid substitution or arbitrary boundary assignment.
  for (const location of locations) {
    const matches = dependencies.lookupTracts(location.coordinate);
    if (!matches.length)
      throw new ContractError(
        422,
        "coordinate-not-covered",
        "A supplied coordinate is outside CES tract coverage.",
      );
    if (matches.length > 1)
      throw new ContractError(
        409,
        "ambiguous-tract-membership",
        "A supplied coordinate matches multiple tracts; no facility narrative was generated.",
      );
    if (matches[0] !== location.tractId)
      throw new ContractError(
        409,
        "coordinate-tract-mismatch",
        "A supplied coordinate does not match its claimed tract.",
      );
  }
  const reference = locations.find((l) => l.id === base.referenceId)!;
  return {
    contractVersion: NEARBY_CONTRACT,
    cesDatasetVersion: DATASET_VERSION,
    referenceId: base.referenceId,
    comparisonDirection: "location-minus-reference",
    locations,
    verification: {
      confirmationSource: "caller-attestation",
      membership: "unique-unsimplified-CES-tract",
      geocoderRequeried: false,
      precision:
        "Original input coordinates retained; unique tract membership does not improve geocoding accuracy.",
    },
    limitations: [
      "Nearest means among coordinate-bearing records in this cached category inventory, not guaranteed nearest statewide. All source statuses are retained.",
      "Distances are spherical straight-line to published points, not travel time, capacity, eligibility, household supply or access.",
      "Healthcare includes non-walk-in services; schools are a historical snapshot. Read each record’s subtype, status and source period.",
      "No overall winner or cross-category ranking. Same-tract locations retain their own coordinate-dependent distances.",
      "Small differences may be sensitive to input geocoding and published-point placement; no significance threshold or uncertainty interval is inferred.",
    ],
    categories: categories.map((category: string) => {
      if (category === "power") {
        const readiness = dependencies
          .catalog()
          .categories.find((c) => c.id === "power");
        return {
          category,
          availability: "unavailable",
          sourceReadiness: readiness,
          results: [],
        };
      }
      try {
        const bundle = dependencies.getBundle(category as FacilityCategory);
        const queries = locations.map((location) =>
          facilityQuery(
            new URLSearchParams({
              category,
              near: location.coordinate.join(","),
              limit: String(limit),
              evidence: "linked",
              ...(category in versions
                ? { version: (versions as Record<string, string>)[category] }
                : {}),
            }),
            bundle,
          ),
        );
        const {
          facilities: _points,
          query: _query,
          matchedCount: _count,
          returnedCount: _returned,
          truncated: _truncated,
          ...source
        } = queries[0];
        const referenceQuery = queries[locations.indexOf(reference)];
        const referenceNearest = referenceQuery.facilities[0];
        return {
          ...source,
          category,
          availability: "ready",
          results: queries.map((query, index) => {
            const location = locations[index],
              nearest = query.facilities[0];
            const distance = nearest?.distanceKm ?? null;
            const referenceDistance = referenceNearest?.distanceKm ?? null;
            const delta =
              distance !== null && referenceDistance !== null
                ? distance - referenceDistance
                : null;
            return {
              locationId: location.id,
              tractId: location.tractId,
              coordinate: location.coordinate,
              matchedCount: query.matchedCount,
              returnedCount: query.returnedCount,
              truncated: query.truncated,
              facilities: query.facilities,
              nearestDistanceKm: distance,
              nearestFacilityId: nearest?.id ?? null,
              comparisonToReference: {
                compatible: true,
                reason:
                  delta === null
                    ? "missing-nearest-point"
                    : "same-category-snapshot-and-distance-method",
                nearestDistanceDifferenceKm: delta,
                unit: "km",
                sameTract: location.tractId === reference.tractId,
                sameCoordinate: location.coordinate.every(
                  (n, i) => n === reference.coordinate[i],
                ),
                sameNearestFacility:
                  nearest && referenceNearest
                    ? nearest.id === referenceNearest.id
                    : null,
              },
              text:
                nearest && distance !== null
                  ? `Nearest published point among covered ${category} records: ${nearest.name ?? "unnamed source record"}, ${narrativeNumber(distance)} km straight-line. Source status: ${nearest.status ?? "not supplied"}; source period: ${nearest.sourcePeriod}.`
                  : "No coordinate-bearing records are available in this source inventory; no nearest distance is stated.",
              comparisonText:
                delta === null
                  ? "A distance difference is unavailable because a nearest point is missing."
                  : delta === 0
                    ? "Equal nearest-point distances within this category inventory; this is not an access guarantee."
                    : `${narrativeNumber(Math.abs(delta))} km ${delta > 0 ? "farther from" : "closer to"} the nearest covered point than the reference location; nearest points may be different facilities.`,
            };
          }),
        };
      } catch (error) {
        if (error instanceof ContractError && error.status === 409) throw error;
        return {
          category,
          availability: "failed",
          error: {
            code: "local-facility-data-unavailable",
            message: "This category inventory could not be queried locally.",
          },
          results: [],
        };
      }
    }),
  };
}
