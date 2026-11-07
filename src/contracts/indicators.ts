/** Backend-owned source contracts. Unknown evidence stays null; do not infer from release dates. */
export const CONTRACT_VERSION = "atlas-indicators-v1";
export const DATASET_VERSION = "ces-5.0-final-2026-07-01";
const dictionary = "https://publish.data.ca.gov/dataset/calenviroscreen-5-0";
type Mode = "environment" | "health" | "community";
export type IndicatorContract = {
  id: string;
  mode: Mode;
  label: string;
  rawField: string;
  percentileField: string | null;
  definition: string;
  unit: string | null;
  unitVerification:
    "verified-dictionary" | "pending-primary-corroboration" | "unresolved";
  measurementPeriod: string | null;
  periodVerification:
    "verified-factsheet" | "verified-dictionary" | "unresolved";
  availability: "baseline-active-provisional" | "metadata-only";
  geographicLevel: "2020-census-tract";
  sourceId: string;
  definitionSource: string;
  missingRawCount: number;
  missingPercentileCount: number | null;
  percentileDomain: readonly [0, 100] | null;
  unresolved: string[];
  rawDifferencePolicy:
    | "provisional-unit"
    | "withheld-pending-contract"
    | "same-definition-period-unit-only";
};
function row(
  id: string,
  mode: Mode,
  label: string,
  rawField: string,
  percentileField: string | null,
  definition: string,
  missingRawCount: number,
  unit: string | null = null,
): IndicatorContract {
  return {
    id,
    mode,
    label,
    rawField,
    percentileField,
    definition,
    unit,
    unitVerification: unit ? "verified-dictionary" : "unresolved",
    measurementPeriod: null,
    periodVerification: "unresolved",
    availability: "metadata-only",
    geographicLevel: "2020-census-tract",
    sourceId: DATASET_VERSION,
    definitionSource: dictionary,
    missingRawCount,
    missingPercentileCount: percentileField ? missingRawCount : null,
    percentileDomain: percentileField ? [0, 100] : null,
    unresolved: [
      "Indicator-specific measurement period is unresolved.",
      ...(!unit ? ["Source unit is unresolved."] : []),
    ],
    rawDifferencePolicy: "withheld-pending-contract",
  };
}
export const indicatorContracts: IndicatorContract[] = [
  {
    ...row(
      "pm",
      "environment",
      "Fine particulate matter",
      "pm",
      "pmP",
      "Tract-average annual fine particle concentration estimated from monitoring and satellite observations; three annual estimates averaged; satellite-detected wildfire-smoke days anywhere in California excluded.",
      0,
    ),
    unit: "µg/m³",
    unitVerification: "pending-primary-corroboration",
    measurementPeriod: "2022–2024",
    periodVerification: "verified-factsheet",
    availability: "baseline-active-provisional",
    definitionSource:
      "https://oehha.ca.gov/calenviroscreen/fact-sheet/air-quality-pm25",
    unresolved: [
      "Standard PM unit used by baseline UI; corroboration against final technical report is pending because origin returned security HTML.",
    ],
    rawDifferencePolicy: "provisional-unit",
  },
  row(
    "ozone",
    "environment",
    "Ozone",
    "ozone",
    "ozoneP",
    "Mean May–October daily maximum 8-hour ozone concentration.",
    0,
  ),
  row(
    "diesel",
    "environment",
    "Diesel particles",
    "diesel",
    "dieselP",
    "Diesel emissions from on-road and non-road sources within and near populated blocks.",
    9,
  ),
  {
    ...row(
      "traffic",
      "environment",
      "Traffic impacts",
      "traffic",
      "trafficP",
      "Traffic density within 150 meters of the tract boundary.",
      9,
      "vehicle-km/hour per road length",
    ),
    unresolved: [
      "Measurement period and full denominator/unit convention require technical-report verification.",
    ],
    rawDifferencePolicy: "withheld-pending-contract",
  },
  row(
    "toxic-releases",
    "environment",
    "Toxic air releases",
    "RSEIhaz",
    "RSEIhazP",
    "Toxicity-weighted air concentrations from chemical releases by large facilities.",
    0,
  ),
  {
    ...row(
      "cleanup",
      "environment",
      "Cleanup sites",
      "cleanups",
      "cleanupsP",
      "Weighted proximity sum for EnviroStor cleanup and Superfund sites near populated blocks; not a facility count.",
      0,
      "weighted sum",
    ),
    unresolved: [
      "Site snapshot period and weighting/radius contract need final-report verification.",
    ],
  },
  row(
    "asthma",
    "health",
    "Asthma emergency visits",
    "asthma",
    "asthmaP",
    "Age-adjusted emergency department visit rate for asthma; denominator not verified.",
    33,
  ),
  row(
    "heart-attacks",
    "health",
    "Heart-attack emergency visits",
    "cvd",
    "cvdP",
    "Age-adjusted emergency department visits for heart attacks.",
    26,
    "visits per 10,000",
  ),
  row(
    "diabetes",
    "health",
    "Diabetes prevalence",
    "diabetes",
    "diabetesP",
    "Model-based prevalence among adults aged 18 and older.",
    36,
  ),
  row(
    "low-birth-weight",
    "health",
    "Low birth weight",
    "lbw",
    "lbwP",
    "Percent of infants weighing less than 2,500 grams.",
    234,
    "%",
  ),
  row(
    "poverty",
    "community",
    "Poverty",
    "pov",
    "povP",
    "Percent of people living below twice the federal poverty level.",
    50,
    "%",
  ),
  row(
    "education",
    "community",
    "Educational attainment",
    "edu",
    "eduP",
    "Percent of population aged 25 and over with less than a high school education.",
    28,
    "%",
  ),
  {
    ...row(
      "housing",
      "community",
      "Housing burden",
      "housingB",
      "housingBP",
      "Percent of households both low-income and severely burdened by housing costs.",
      64,
      "%",
    ),
    unresolved: [
      "Measurement period and income/severe-burden thresholds need source confirmation.",
    ],
  },
  ...[
    ["pop_und10", "Children under 10", "Percent of population under age 10."],
    [
      "pop_10_64",
      "Population ages 10–64",
      "Percent of population ages 10 through 64.",
    ],
    [
      "pop_ov64",
      "Population ages 65+",
      "Percent of population aged 65 and older.",
    ],
    [
      "hisp",
      "Hispanic or Latino",
      "Percent identifying as Hispanic or Latino.",
    ],
    [
      "white",
      "Non-Hispanic White",
      "Percent identifying as non-Hispanic White.",
    ],
    [
      "black",
      "Non-Hispanic Black",
      "Percent identifying as non-Hispanic African American or Black.",
    ],
    [
      "amind",
      "Non-Hispanic Native American",
      "Percent identifying as non-Hispanic Native American.",
    ],
    [
      "asian",
      "Non-Hispanic Asian",
      "Percent identifying as non-Hispanic Asian.",
    ],
    [
      "pacisl",
      "Non-Hispanic Pacific Islander",
      "Percent identifying as non-Hispanic Pacific Islander.",
    ],
    [
      "othmult",
      "Other or multiple races",
      "Percent identifying as non-Hispanic other or multiple races.",
    ],
  ].map(([field, label, definition]) => ({
    ...row(field, "community", label, field, null, definition, 25, "%"),
    measurementPeriod: "2020–2024 ACS 5-year",
    periodVerification: "verified-dictionary" as const,
    unresolved: [],
    rawDifferencePolicy: "same-definition-period-unit-only" as const,
  })),
];
export function catalog() {
  return {
    contractVersion: CONTRACT_VERSION,
    dataset: {
      id: DATASET_VERSION,
      releaseDate: "2026-07-01",
      tractVintage: "2020",
      coverage: "California",
      tractCount: 9106,
      source: dictionary,
      rights: "No restrictions on public use",
      namedLicense: null,
    },
    nullBehavior:
      "Selection observations remain numeric strings or null; map values are numbers or null. Preserve zero. Missing raw value suppresses raw difference.",
    percentileMeaning:
      "Source-supplied statewide relative position, not concentration, percent change, or personal risk. Zero conventions can vary by indicator.",
    indicators: indicatorContracts,
    facilities: {
      apiAvailable: false,
      healthcare:
        "Supplied feed is Los Angeles only; statewide source unresolved.",
      schools:
        "2025–26 schema/sample verified; completeness and reuse terms unresolved.",
      power:
        "Includes out-of-state records; vintage/status/coverage require verification.",
    },
  };
}
