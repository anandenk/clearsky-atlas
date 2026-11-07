import { DATASET_VERSION, indicatorContracts } from "./indicators";
import { CSV_PROVENANCE } from "./provenance";
export const OBSERVATION_CONTRACT = "atlas-observations-v1";
export class ContractError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function validateVersion(version: string | null) {
  if (version !== null && version !== DATASET_VERSION)
    throw new ContractError(
      409,
      "dataset-version-mismatch",
      "Requested dataset version is not available.",
    );
}
export function validateTractId(id: string) {
  if (!/^06\d{9}$/.test(id))
    throw new ContractError(
      400,
      "invalid-tract-id",
      "Use an 11-digit California 2020 Census tract ID, including the leading zero.",
    );
}
export function readyIndicator(id: string) {
  const i = indicatorContracts.find((i) => i.id === id);
  if (!i)
    throw new ContractError(
      400,
      "unknown-indicator",
      `Unknown indicator: ${id}`,
    );
  if (!i.backendReady)
    throw new ContractError(
      422,
      "unverified-indicator",
      `Indicator ${id} is present in source data but its contract is not ready.`,
    );
  return i;
}
export function requestedIndicators(value: string | null) {
  const ids =
    value === null
      ? indicatorContracts.filter((i) => i.backendReady).map((i) => i.id)
      : value.split(",");
  if (!ids.length || ids.some((i) => !i.trim()) || ids.length > 23)
    throw new ContractError(
      400,
      "invalid-indicators",
      "Supply one or more comma-separated indicator IDs.",
    );
  return [...new Set(ids.map((s) => s.trim()))].map(readyIndicator);
}
export function sourceNumber(value: string | null | undefined): number | null {
  if (
    value === null ||
    value === undefined ||
    value.trim() === "" ||
    value === "NA"
  )
    return null;
  const n = Number(value);
  if (!Number.isFinite(n))
    throw new ContractError(
      503,
      "invalid-source-value",
      "Cached source contains an invalid numeric value.",
    );
  return n;
}
export function normalizeObservation(
  tractId: string,
  row: Record<string, string | null>,
  i: ReturnType<typeof readyIndicator>,
) {
  const rawValue = sourceNumber(row[i.rawField]);
  const percentile = i.percentileField
    ? sourceNumber(row[i.percentileField])
    : null;
  if (percentile !== null && (percentile < 0 || percentile > 100))
    throw new ContractError(
      503,
      "invalid-source-percentile",
      "Cached percentile is outside the source scale.",
    );
  return {
    tractId,
    indicatorId: i.id,
    datasetVersion: DATASET_VERSION,
    geographicLevel: i.geographicLevel,
    rawValue,
    percentile,
    unit: i.unit,
    measurementPeriod: i.measurementPeriod,
    definition: i.definition,
    definitionSource: i.definitionSource,
    visualization: i.visualization,
    limitations: i.limitations,
    provenance: {
      ...CSV_PROVENANCE,
      rawField: i.rawField,
      percentileField: i.percentileField,
      evidenceURLs: i.evidence.map((e) => e.sourceURL),
    },
    percentileDomain: i.percentileDomain,
    sourceId: i.sourceId,
    status: rawValue === null ? "missing" : "available",
    qualityFlags: [
      ...(rawValue === null ? ["raw-value-missing"] : []),
      ...(i.percentileField && percentile === null
        ? ["percentile-missing"]
        : []),
    ],
    comparisonKey: [
      DATASET_VERSION,
      i.id,
      i.geographicLevel,
      i.unit,
      i.measurementPeriod,
    ].join("|"),
  };
}
export type Observation = ReturnType<typeof normalizeObservation>;
export function compareObservations(a: Observation, b: Observation) {
  const compatible =
    a.comparisonKey === b.comparisonKey &&
    a.definition === b.definition &&
    a.provenance.sha256 === b.provenance.sha256 &&
    a.indicatorId === b.indicatorId &&
    a.datasetVersion === b.datasetVersion &&
    a.unit === b.unit &&
    a.measurementPeriod === b.measurementPeriod &&
    a.geographicLevel === b.geographicLevel;
  return {
    compatible,
    sameTract: a.tractId === b.tractId,
    rawDifferenceBMinusA:
      compatible && a.rawValue !== null && b.rawValue !== null
        ? b.rawValue - a.rawValue
        : null,
    unit: compatible ? a.unit : null,
    rawDifferenceUnit: compatible
      ? a.unit === "%"
        ? "percentage points"
        : a.unit
      : null,
    percentilePointDifferenceBMinusA:
      compatible && a.percentile !== null && b.percentile !== null
        ? b.percentile - a.percentile
        : null,
    reason: !compatible
      ? "incompatible-definition-version-period-or-unit"
      : a.rawValue === null || b.rawValue === null
        ? "missing-raw-observation"
        : "comparable",
    limitation:
      "Descriptive tract comparison; no causal, significance, property-level or personal-risk inference.",
  };
}
