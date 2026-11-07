import type { Selection } from "../domain";
import { specs, value, example } from "./fixtures/preview";
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
};
export type Observation = {
  rawValue: number | null;
  percentile: number | null;
  unit: string;
  measurementPeriod: string;
  comparisonKey: string;
  definition: string;
  definitionSource: string;
};
export const version = "ces-5.0-final-2026-07-01";
export async function json(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
) {
  const r = await fetch(url, { ...init, signal });
  if (!r.ok) {
    let message = `Request failed (${r.status})`;
    try {
      message = (await r.json()).error || message;
    } catch {}
    throw Error(message);
  }
  return r.json();
}
export function provider(preview: boolean, scenario: string) {
  return {
    async catalog(signal: AbortSignal): Promise<Indicator[]> {
      return preview
        ? specs.map(([id, mode, label, unit]) => ({
            id,
            mode: mode.toLowerCase(),
            label,
            unit,
            definition: `Synthetic ${label.toLowerCase()} for interface exploration only.`,
            measurementPeriod: "Example period",
            definitionSource: "",
            backendReady: true,
            percentileField: ["age", "race", "facilities"].includes(id)
              ? null
              : id + "P",
          }))
        : (await json("/api/indicators", signal)).indicators;
    },
    async search(query: string, signal: AbortSignal): Promise<Selection[]> {
      if (preview) {
        if (scenario === "failure")
          throw Error(
            "Simulated search failure. Change the preview scenario to retry.",
          );
        return [
          example(Math.max(0, (parseInt(query.replace(/\D/g, "")) || 1) - 1)),
        ];
      }
      const d = await json("/api/geocode", signal, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: query }),
      });
      const valid = d.candidates.filter(
        (c: Selection & { error?: string }) => !c.error,
      );
      if (!valid.length) throw Error(d.candidates[0]?.error || "No match");
      return valid;
    },
    async observations(
      tract: string,
      metric: Indicator,
      signal: AbortSignal,
    ): Promise<Observation> {
      if (preview) {
        if (scenario === "failure") throw Error("Simulated evidence failure");
        return {
          rawValue: value(tract, metric.id, scenario),
          percentile: metric.percentileField
            ? value(tract, metric.id, scenario)
            : null,
          unit: metric.unit || "",
          measurementPeriod: "Example period",
          comparisonKey:
            scenario === "incompatible" ? tract : "synthetic-" + metric.id,
          definition: metric.definition,
          definitionSource: "",
        };
      }
      return (
        await json(
          `/api/tracts/${tract}?indicators=${metric.id}&version=${version}`,
          signal,
        )
      ).observations[0];
    },
    async difference(
      a: string,
      b: string,
      metric: Indicator,
      signal: AbortSignal,
    ) {
      if (preview) {
        const x = value(a, metric.id, scenario),
          y = value(b, metric.id, scenario);
        return scenario === "incompatible" || x === null || y === null
          ? null
          : y - x;
      }
      return (
        await json(
          `/api/compare?tractA=${a}&tractB=${b}&indicator=${metric.id}&version=${version}`,
          signal,
        )
      ).comparison.rawDifferenceBMinusA;
    },
  };
}
