import type { Selection } from "../domain";
import { specs, value, percentile, composition } from "./fixtures/preview";
export type Indicator = {
  id: string;
  mode: string;
  label: string;
  unit: string | null;
  definition: string;
  measurementPeriod: string | null;
  definitionSource: string;
  backendReady: boolean;
  percentileField: string | null;
  limitations?: string[];
};
export type Observation = {
  indicatorId: string;
  rawValue: number | null;
  percentile: number | null;
  unit: string;
  measurementPeriod: string;
  comparisonKey: string;
  datasetVersion?: string;
  geographicLevel?: string;
  provenance?: {sha256: string};
  definition: string;
  definitionSource: string;
};
export type Place = { id: string; selection: Selection };
export type Bundle = Record<string, Observation>;
export const version = "ces-5.0-final-2026-07-01";
export async function json(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
) {
  const r = await fetch(url, { ...init, signal });
  if (!r.ok) {
    let message = `Request failed (${r.status}). Try again.`;
    try {
      message = (await r.json()).error || message;
    } catch {}
    throw Error(message);
  }
  return r.json();
}
export function previewCatalog(): Indicator[] {
  const base = specs
    .filter((s) => !["age", "race", "facilities"].includes(s[0]))
    .map(([id, mode, label, unit]) => ({
      id,
      mode: mode.toLowerCase(),
      label,
      unit,
      definition: `Synthetic ${label.toLowerCase()} for interface exploration. These values do not describe real places.`,
      measurementPeriod: "Synthetic example period",
      definitionSource: "",
      backendReady: true,
      percentileField: id + "P",
    }));
  const ids = [
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
  ];
  const labels = [
    ...composition("preview-0", "age"),
    ...composition("preview-0", "race"),
  ];
  return [
    ...base,
    ...ids.map((id, i) => ({
      id,
      mode: "community",
      label: labels[i].label,
      unit: "% of population",
      definition: "Synthetic population composition. No hazard interpretation.",
      measurementPeriod: "Synthetic example period",
      definitionSource: "",
      backendReady: true,
      percentileField: null,
    })),
  ];
}
export async function bundle(
  tract: string,
  preview: boolean,
  scenario: string,
  catalog: Indicator[],
  signal: AbortSignal,
): Promise<Bundle> {
  if (!preview) {
    const d = await json(`/api/tracts/${tract}?version=${version}`, signal);
    return Object.fromEntries(
      d.observations.map((o: Observation) => [o.indicatorId, o]),
    );
  }
  if (scenario === "failure")
    throw Error(
      "Simulated evidence failure. Choose another preview scenario to retry.",
    );
  const ids = [
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
  ];
  const comp = [...composition(tract, "age"), ...composition(tract, "race")];
  return Object.fromEntries(
    catalog.map((m) => {
      const i = ids.indexOf(m.id);
      const raw =
        scenario === "missing" && tract === "preview-1"
          ? null
          : i >= 0
            ? comp[i].value
            : value(tract, m.id, scenario);
      return [
        m.id,
        {
          indicatorId: m.id,
          rawValue: raw,
          percentile:
            raw === null || !m.percentileField
              ? null
              : percentile(tract, m.id, scenario),
          unit: m.unit || "",
          measurementPeriod: "Synthetic example period",
          comparisonKey:
            scenario === "incompatible" ? tract : "preview-" + m.id,
          datasetVersion: "synthetic-preview-v1",
          geographicLevel: "synthetic-cell",
          provenance: {sha256: "synthetic-preview-v1"},
          definition: m.definition,
          definitionSource: "",
        },
      ];
    }),
  );
}
export function format(n: number | null | undefined, id = "") {
  return n == null
    ? "Unavailable"
    : n !== 0 && Math.abs(n) < (id === "ozone" ? 0.0001 : 0.01)
      ? n.toLocaleString("en-US", {maximumSignificantDigits: 3})
      : n.toLocaleString("en-US", {
        maximumFractionDigits: id === "ozone" ? 4 : 2,
      });
}
export function compatible(a: Observation | undefined, b: Observation | undefined) {
  return !!(a && b && a.comparisonKey && a.comparisonKey === b.comparisonKey &&
    a.definition === b.definition && a.provenance?.sha256 && a.provenance.sha256 === b.provenance?.sha256 &&
    a.indicatorId === b.indicatorId && a.datasetVersion && a.datasetVersion === b.datasetVersion &&
    a.geographicLevel && a.geographicLevel === b.geographicLevel && a.unit === b.unit && a.measurementPeriod === b.measurementPeriod);
}
export function delta(a: Observation | undefined, b: Observation | undefined) {
  return a &&
    b &&
    compatible(a, b) &&
    a.rawValue !== null &&
    b.rawValue !== null
    ? b.rawValue - a.rawValue
    : null;
}
export function differenceUnit(m: Indicator | undefined) {
  return m?.unit?.startsWith("%") ? "percentage points" : m?.unit || "";
}
