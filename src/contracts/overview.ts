import { DATASET_VERSION } from "./indicators";
import {
  ContractError,
  validateVersion,
  validateTractId,
  requestedIndicators,
  normalizeObservation,
  compareObservations,
  type Observation,
} from "./observations";
export const OVERVIEW_CONTRACT = "atlas-overview-v1";
type Location = { id: string; tractId: string };
function invalid(message: string): never {
  throw new ContractError(400, "invalid-overview-request", message);
}
export function parseOverviewRequest(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    invalid("Supply an object with locations.");
  const value = input as Record<string, unknown>;
  if (
    !Array.isArray(value.locations) ||
    value.locations.length < 1 ||
    value.locations.length > 20
  )
    invalid(
      "Supply 1–20 locations per request; clients may batch larger collections.",
    );
  const locations: Location[] = value.locations.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      invalid("Each location needs id and tractId.");
    const location = item as Record<string, unknown>;
    if (
      typeof location.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(location.id)
    )
      invalid(
        "Location IDs must be 1–64 letters, numbers, underscores or hyphens.",
      );
    if (typeof location.tractId !== "string")
      invalid("tractId must be a string.");
    validateTractId(location.tractId);
    return { id: location.id, tractId: location.tractId };
  });
  if (new Set(locations.map((l) => l.id)).size !== locations.length)
    invalid("Location IDs must be unique; repeated tract IDs are allowed.");
  if (value.version !== undefined && typeof value.version !== "string")
    invalid("version must be a string when supplied.");
  validateVersion((value.version as string | undefined) ?? null);
  const referenceId =
    value.referenceId === undefined ? locations[0].id : value.referenceId;
  if (
    typeof referenceId !== "string" ||
    !locations.some((l) => l.id === referenceId)
  )
    invalid("referenceId must match a supplied location ID.");
  if (
    value.indicators !== undefined &&
    (!Array.isArray(value.indicators) ||
      value.indicators.some(
        (id) => typeof id !== "string" || !id || id.includes(","),
      ))
  )
    invalid("indicators must be an array of indicator IDs.");
  const indicators = requestedIndicators(
    value.indicators === undefined
      ? null
      : (value.indicators as string[]).join(","),
  );
  return { locations, referenceId, indicators };
}
/** Within-indicator ranges only. Incompatible evidence suppresses the whole range. */
export function summarizeObservations(observations: Observation[]) {
  if (!observations.length) invalid("No observations supplied.");
  const compatible = observations.every(
    (o) => compareObservations(observations[0], o).compatible,
  );
  const raw = observations
    .map((o) => o.rawValue)
    .filter((n): n is number => n !== null);
  const percentiles = observations
    .map((o) => o.percentile)
    .filter((n): n is number => n !== null);
  const range = (
    values: number[],
    unit: string | null,
    spreadUnit: string | null,
  ) =>
    compatible && values.length > 1
      ? {
          min: Math.min(...values),
          max: Math.max(...values),
          spread: Math.max(...values) - Math.min(...values),
          unit,
          spreadUnit,
        }
      : null;
  const distinctTractCount = new Set(observations.map((o) => o.tractId)).size;
  return {
    compatible,
    selectedLocationCount: observations.length,
    distinctTractCount,
    availableLocationCount: raw.length,
    missingLocationCount: observations.length - raw.length,
    percentileLocationCount: percentiles.length,
    allSameTract: distinctTractCount === 1,
    rawRange: range(
      raw,
      observations[0].unit,
      compareObservations(observations[0], observations[0]).rawDifferenceUnit,
    ),
    percentileRange: range(
      percentiles,
      "source percentile",
      "percentile points",
    ),
    interpretation: !compatible
      ? "Incompatible evidence; ranges withheld."
      : distinctTractCount === 1 && observations.length > 1
        ? "Selected locations share tract-level evidence; this does not imply identical properties."
        : raw.length < observations.length
          ? "Range uses available observations only; missing locations remain unavailable."
          : "Descriptive range across selected locations; no importance ranking, significance or causal inference.",
  };
}
export function comparisonOverview(
  input: unknown,
  record: (tractId: string) => Record<string, string | null> | null,
) {
  const request = parseOverviewRequest(input);
  const sourceRows = new Map<string, Record<string, string | null>>();
  for (const location of request.locations) {
    if (sourceRows.has(location.tractId)) continue;
    const row = record(location.tractId);
    if (!row)
      throw new ContractError(
        404,
        "tract-not-found",
        "One or more supplied tracts are not covered by this CES dataset.",
      );
    sourceRows.set(location.tractId, row);
  }
  const referenceIndex = request.locations.findIndex(
    (l) => l.id === request.referenceId,
  );
  return {
    contractVersion: OVERVIEW_CONTRACT,
    datasetVersion: DATASET_VERSION,
    referenceId: request.referenceId,
    comparisonDirection: "location-minus-reference",
    locations: request.locations.map((l) => ({
      ...l,
      place: sourceRows.get(l.tractId)!.approx_loc ?? null,
      county: sourceRows.get(l.tractId)!.county ?? null,
    })),
    ordering:
      "Requested indicator order; default catalog order. No cross-indicator importance ranking.",
    limitations: [
      "Each row retains its own source definition, unit and period; periods differ between indicators.",
      "Repeated tracts preserve distinct location IDs and share tract evidence. No property-level, personal-risk, causal or significance inference.",
      "Demographic percentages have no hazard direction or source percentile. No composition renormalization or aggregation is performed.",
    ],
    rows: request.indicators.map((indicator) => {
      const observations = request.locations.map((l) =>
        normalizeObservation(l.tractId, sourceRows.get(l.tractId)!, indicator),
      );
      const reference = observations[referenceIndex];
      return {
        indicatorId: indicator.id,
        label: indicator.label,
        mode: indicator.mode,
        unit: indicator.unit,
        measurementPeriod: indicator.measurementPeriod,
        definition: indicator.definition,
        definitionSource: indicator.definitionSource,
        visualization: indicator.visualization,
        limitations: indicator.limitations,
        provenance: reference.provenance,
        values: observations.map((o, index) => ({
          locationId: request.locations[index].id,
          tractId: o.tractId,
          rawValue: o.rawValue,
          percentile: o.percentile,
          status: o.status,
          qualityFlags: o.qualityFlags,
          comparisonToReference: compareObservations(reference, o),
        })),
        summary: summarizeObservations(observations),
      };
    }),
  };
}
