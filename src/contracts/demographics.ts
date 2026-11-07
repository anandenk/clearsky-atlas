import { DATASET_VERSION } from "./indicators";
import { CSV_PROVENANCE } from "./provenance";
import { DEMOGRAPHIC_PROOF } from "./demographic-proof";
import {
  ContractError,
  readyIndicator,
  normalizeObservation,
  sourceNumber,
  validateTractId,
} from "./observations";
export const DEMOGRAPHIC_CONTRACT = "atlas-demographics-v1";
const GROUPS = [
  {
    id: "age",
    label: "Age profile",
    ids: ["pop_und10", "pop_10_64", "pop_ov64"],
    sourceLabels: [
      "Children <10 years (%)",
      "Population10–64 years (%)",
      "Elderly ≥65 years (%)",
    ],
    dictionaryPage: 4,
  },
  {
    id: "race-ethnicity",
    label: "Publisher race/ethnicity profile",
    ids: ["hisp", "white", "black", "amind", "asian", "pacisl", "othmult"],
    sourceLabels: [
      "Latino (%)",
      "White (%)",
      "Black (%)",
      "Native American (%)",
      "Asian American (%)",
      "Pacific Islander (%)",
      "Other/Multiple (%)",
    ],
    dictionaryPage: 5,
  },
];
export function requestedDemographicGroups(value: string | null) {
  const ids =
    value === null
      ? GROUPS.map((g) => g.id)
      : value.split(",").map((v) => v.trim());
  if (
    !ids.length ||
    ids.length > 2 ||
    ids.some((id) => !GROUPS.some((g) => g.id === id))
  )
    throw new ContractError(
      400,
      "invalid-demographic-groups",
      "groups must contain age and/or race-ethnicity.",
    );
  return [...new Set(ids)].map((id) => GROUPS.find((g) => g.id === id)!);
}
export function demographicCatalog() {
  return {
    contractVersion: DEMOGRAPHIC_CONTRACT,
    datasetVersion: DATASET_VERSION,
    measurementPeriod: DEMOGRAPHIC_PROOF.sourcePeriod,
    unit: "%",
    geographicLevel: "2020-census-tract",
    denominator: DEMOGRAPHIC_PROOF.denominator,
    visualization: {
      kind: "neutral-percentage",
      domain: [0, 100],
      recommended: "independent-neutral-bars",
      interpretation:
        "Source population percentages, no hazard direction or source percentile.",
    },
    normalization: "none",
    derivedCategoryCounts: false,
    rounding: {
      sourceDecimalPlaces: 2,
      interpretation:
        "Sum allowance is arithmetic from rounding each reported share to two decimals, not a confidence interval, missing-share estimate or margin of error.",
    },
    limitations: [
      ...DEMOGRAPHIC_PROOF.limitations,
      "These are publisher-defined combined profile categories. Other/Multiple is retained as supplied; no separate race/ethnicity reclassification or residual category is inferred.",
      "Use reported percentages as values. Label missing shares and sum discrepancies; never rescale bars or available shares to total 100%.",
    ],
    source: {
      ...CSV_PROVENANCE,
      dictionaryUrl: DEMOGRAPHIC_PROOF.sourceProvenance["ces.pdf"].url,
      dictionarySha256: DEMOGRAPHIC_PROOF.sourceProvenance["ces.pdf"].sha256,
      dictionaryPages: DEMOGRAPHIC_PROOF.dictionaryPages,
    },
    groups: GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      dictionaryPage: group.dictionaryPage,
      categories: group.ids.map((id, index) => {
        const i = readyIndicator(id);
        return {
          id,
          indicatorId: id,
          label: i.label,
          sourceLabel: group.sourceLabels[index],
          definition: i.definition,
          rawField: i.rawField,
          sourceLayerField:
            DEMOGRAPHIC_PROOF.sourceAliases[
              id as keyof typeof DEMOGRAPHIC_PROOF.sourceAliases
            ],
        };
      }),
    })),
  };
}
export function tractDemographics(
  tractId: string,
  row: Record<string, string | null>,
  requested: string | null = null,
) {
  validateTractId(tractId);
  const selected = requestedDemographicGroups(requested);
  const catalog = demographicCatalog();
  const populationEstimate = sourceNumber(row.ACS2024Pop);
  if (
    populationEstimate !== null &&
    (!Number.isInteger(populationEstimate) || populationEstimate < 0)
  )
    throw new ContractError(
      503,
      "invalid-demographic-population",
      "Source population estimate is not a nonnegative integer.",
    );
  return {
    ...catalog,
    tractId,
    place: row.approx_loc ?? null,
    county: row.county ?? null,
    denominator: { ...catalog.denominator, populationEstimate },
    groups: selected.map((group) => {
      const metadata = catalog.groups.find((g) => g.id === group.id)!;
      const categories = metadata.categories.map((category) => {
        const observation = normalizeObservation(
          tractId,
          row,
          readyIndicator(category.indicatorId),
        );
        const value = observation.rawValue;
        if (
          value !== null &&
          (value < 0 ||
            value > 100 ||
            Math.abs(value * 100 - Math.round(value * 100)) > 0.000001)
        )
          throw new ContractError(
            503,
            "invalid-demographic-share",
            "Source demographic share is outside 0–100 or has unsupported precision.",
          );
        return {
          ...category,
          value,
          status: observation.status,
          percentile: null,
          qualityFlags: observation.qualityFlags,
        };
      });
      const available = categories.filter((c) => c.value !== null);
      const complete = available.length === categories.length;
      const sum = available.length
        ? Math.round(
            available.reduce((total, c) => total + c.value!, 0) * 100,
          ) / 100
        : null;
      const allowance = categories.length * 0.005;
      const within =
        complete && sum !== null
          ? Math.abs(100 - sum) <= allowance + 1e-8
          : null;
      return {
        ...metadata,
        categories,
        status: complete
          ? "available"
          : available.length
            ? "partial"
            : "missing",
        complete,
        missingCategoryIds: categories
          .filter((c) => c.value === null)
          .map((c) => c.id),
        availableShareSumPercent: sum,
        reportedSumPercent: complete ? sum : null,
        residualTo100PercentagePoints:
          complete && sum !== null ? Math.round((100 - sum) * 100) / 100 : null,
        isWithinRoundingAllowance: within,
        roundingAllowancePercentagePoints: allowance,
        qualityFlags: [
          ...(!complete ? ["missing-source-shares"] : []),
          ...(available.length && !complete ? ["partial-source-profile"] : []),
          ...(within === false
            ? ["reported-sum-outside-rounding-allowance"]
            : []),
          ...(populationEstimate === 0
            ? ["zero-source-population-estimate"]
            : []),
        ],
        sumInterpretation:
          "Reported sum and residual are diagnostics, not new categories. A residual must never be displayed as Other or used to replace missing shares.",
      };
    }),
  };
}
