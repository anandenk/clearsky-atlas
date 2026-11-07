export const VERSION = "CES 5.0 · July 2026";
export const indicators = {
  pm: {
    id: "pm",
    label: "Fine particulate matter",
    short: "PM2.5",
    unit: "µg/m³",
    period: "2022–2024",
    field: "pm",
    percentile: "pmP",
    digits: 2,
    definition:
      "Tract-average fine particle concentration, estimated from monitoring and satellite data. Annual estimates are averaged across three years.",
    limitation:
      "Days with satellite-detected wildfire smoke anywhere in California are excluded. This is not live air quality, a property measurement, or a personal health prediction.",
    source: "https://oehha.ca.gov/calenviroscreen/fact-sheet/air-quality-pm25",
  },
} as const;
export type Metric = keyof typeof indicators;
export type Selection = {
  label: string;
  coordinate: [number, number];
  tractId: string;
  place: string;
  county: string;
  observations: Record<string, string | null>;
  cached: boolean;
  censusTract?: string;
  precision: string;
};
export function numberValue(v: unknown): number | null {
  if (v === null || v === undefined || v === "" || v === "NA") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function compare(a: number | null, b: number | null, compatible = true) {
  return compatible && a !== null && b !== null ? b - a : null;
}
export const palette = [
  "#eee8cf",
  "#d4d8ac",
  "#a1b994",
  "#659c84",
  "#397b72",
  "#205b5c",
];
