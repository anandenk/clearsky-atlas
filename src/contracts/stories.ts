import { DATASET_VERSION, indicatorContracts } from "./indicators";
import { comparisonOverview } from "./overview";
import { ContractError } from "./observations";
export const STORY_CONTRACT = "atlas-stories-v1";
const TOPICS = [
  {
    id: "environment",
    title: "Environment around these places",
    question: "What environmental indicators describe these tracts?",
    indicators: [
      "pm",
      "ozone",
      "diesel",
      "traffic",
      "toxic-releases",
      "cleanup",
    ],
    interpretation:
      "Source periods and units differ by indicator. Weighted source scores are not concentrations or counts.",
  },
  {
    id: "health",
    title: "Health in context",
    question: "What population health estimates describe these tracts?",
    indicators: ["asthma", "heart-attacks", "diabetes", "low-birth-weight"],
    interpretation:
      "Tract population estimates are not personal disease probabilities. These observations do not establish causes or statistical significance.",
  },
  {
    id: "community",
    title: "Community context",
    question: "How do the source measures of community context compare?",
    indicators: ["poverty", "education", "housing"],
    interpretation:
      "Each measure has its own denominator, source period and definition. No overall neighborhood grade is calculated.",
  },
  {
    id: "population",
    title: "Population context",
    question: "What source population percentages describe these tracts?",
    indicators: [
      "pop_und10",
      "pop_10_64",
      "pop_ov64",
      "hisp",
      "white",
      "black",
      "amind",
      "asian",
      "pacisl",
      "othmult",
    ],
    interpretation:
      "Neutral population percentages, with no hazard direction or percentile. Categories are shown individually; missing shares are not normalized to 100%.",
  },
];
const NEARBY = {
  id: "nearby-essentials",
  title: "Nearby essentials",
  question: "Which covered facilities are near each confirmed location?",
  availability: "use-coordinate-facility-api",
  steps: [],
  reason:
    "This tract-only story request does not resolve address-dependent distances. Query the facility API with the confirmed location coordinates; do not substitute a tract centroid.",
  sourceReadinessUrl: "/api/facilities/catalog",
  facilityQueryUrl: "/api/facilities",
  activationTrigger:
    "A confirmed-coordinate-to-tract contract for facility narratives, preserving inventory/status/date and straight-line distance qualifications.",
};
const ROUNDING =
  "Narrative numbers use four significant digits; exact numeric evidence is retained. No significance threshold is applied.";
export function storyCatalog() {
  return {
    contractVersion: STORY_CONTRACT,
    datasetVersion: DATASET_VERSION,
    ordering:
      "Curated topic and indicator order, not ranked importance or an overall winner.",
    rounding: ROUNDING,
    topics: [
      ...TOPICS.map((topic) => ({
        ...topic,
        availability: "ready",
        steps: topic.indicators.map((id) => {
          const indicator = indicatorContracts.find((i) => i.id === id)!;
          return {
            id,
            indicatorId: id,
            title: indicator.label,
            target: { mode: indicator.mode, indicatorId: id },
            visualization: indicator.visualization,
            definitionSource: indicator.definitionSource,
          };
        }),
      })),
      NEARBY,
    ],
  };
}
export function narrativeNumber(value: number) {
  if (!Number.isFinite(value))
    throw new ContractError(
      503,
      "invalid-story-value",
      "Story evidence contains a nonfinite number.",
    );
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 4,
    useGrouping: false,
  }).format(Object.is(value, -0) ? 0 : value);
}
type EvidenceRow = ReturnType<typeof comparisonOverview>["rows"][number];
function measured(value: number, unit: string | null) {
  return narrativeNumber(value) + (unit ? " " + unit : "");
}
/** Pure templates over canonical overview evidence; never accept a user-authored observation as source truth. */
export function describeStoryStep(row: EvidenceRow) {
  const summary = row.summary;
  const range = summary.rawRange;
  const text = !summary.compatible
    ? "A range is withheld because the evidence definitions, versions, periods or units are incompatible."
    : summary.availableLocationCount === 0
      ? "No raw observations are available for the selected tracts."
      : summary.allSameTract && summary.selectedLocationCount > 1
        ? "These locations share the same tract-level observation; this does not imply identical properties."
        : range
          ? `Across ${summary.availableLocationCount} selected locations with available values, source values for “${row.label}” range from ${measured(range.min, range.unit)} to ${measured(range.max, range.unit)} (${row.measurementPeriod}).`
          : "One selected location has an available raw observation; no multi-location range is stated.";
  return {
    id: row.indicatorId,
    evidenceRowId: row.indicatorId,
    title: row.label,
    target: { mode: row.mode, indicatorId: row.indicatorId },
    text,
    measurementPeriod: row.measurementPeriod,
    missingLocationCount: summary.missingLocationCount,
    distinctTractCount: summary.distinctTractCount,
    locationStatements: row.values.map((value) => {
      const comparison = value.comparisonToReference;
      const difference = comparison.rawDifferenceBMinusA;
      return {
        locationId: value.locationId,
        tractId: value.tractId,
        observationText:
          value.rawValue === null
            ? "No raw observation is available for this tract."
            : `${measured(value.rawValue, row.unit)} (${row.measurementPeriod}).`,
        percentileText:
          value.percentile === null
            ? null
            : `Source percentile ${narrativeNumber(value.percentile)} on the statewide 0–100 scale.`,
        comparisonText: !comparison.compatible
          ? "Comparison withheld because definitions, versions, periods or units differ."
          : difference === null
            ? "No raw difference is available because an observation is missing."
            : difference === 0
              ? "Equal source values relative to the reference location."
              : `${measured(Math.abs(difference), comparison.rawDifferenceUnit)} ${difference > 0 ? "above" : "below"} the reference value.`,
        sameTractNote: comparison.sameTract
          ? "Shares the reference tract; tract evidence is shared, while properties and address-dependent distances may differ."
          : null,
      };
    }),
    source: {
      definitionUrl: row.definitionSource,
      sourceUrl: row.provenance.sourceURL,
      sha256: row.provenance.sha256,
      rawField: row.provenance.rawField,
      percentileField: row.provenance.percentileField,
      evidenceUrls: row.provenance.evidenceURLs,
    },
    limitations: row.limitations,
  };
}
export function comparisonStories(
  input: unknown,
  record: (tractId: string) => Record<string, string | null> | null,
) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new ContractError(
      400,
      "invalid-story-request",
      "Supply a story request object with locations.",
    );
  const value = input as Record<string, unknown>;
  if ("indicators" in value)
    throw new ContractError(
      400,
      "invalid-story-request",
      "Select topics for curated stories; use the overview API for an arbitrary indicator list.",
    );
  const topicIds =
    value.topics === undefined ? TOPICS.map((t) => t.id) : value.topics;
  const known = [...TOPICS.map((t) => t.id), NEARBY.id];
  if (
    !Array.isArray(topicIds) ||
    !topicIds.length ||
    topicIds.length > known.length ||
    topicIds.some((id) => typeof id !== "string" || !known.includes(id)) ||
    new Set(topicIds).size !== topicIds.length
  )
    throw new ContractError(
      400,
      "invalid-story-topics",
      "Use unique known topic IDs: " + known.join(", "),
    );
  const selected = TOPICS.filter((t) => topicIds.includes(t.id));
  const ids = selected.flatMap((t) => t.indicators);
  const overview = comparisonOverview(
    { ...value, indicators: ids.length ? ids : undefined },
    record,
  );
  const evidence = { ...overview, rows: ids.length ? overview.rows : [] };
  const byId = new Map(evidence.rows.map((row) => [row.indicatorId, row]));
  return {
    contractVersion: STORY_CONTRACT,
    datasetVersion: DATASET_VERSION,
    referenceId: overview.referenceId,
    comparisonDirection: overview.comparisonDirection,
    ordering:
      "Curated topic and indicator order, not ranked importance or an overall winner.",
    rounding: ROUNDING,
    evidence,
    topics: [
      ...selected.map((topic) => ({
        id: topic.id,
        title: topic.title,
        question: topic.question,
        availability: "ready",
        interpretation: topic.interpretation,
        steps: topic.indicators.map((id) => describeStoryStep(byId.get(id)!)),
      })),
      ...(topicIds.includes(NEARBY.id) ? [NEARBY] : []),
    ],
  };
}
