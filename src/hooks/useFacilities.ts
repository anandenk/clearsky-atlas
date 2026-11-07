import { useEffect, useState } from "react";
import { type Place, json } from "../frontend/provider";
import { facilities as examples } from "../frontend/fixtures/preview";
export type Facility = {
  id: string;
  category: string;
  name: string;
  coordinate: [number, number];
  distance: number | null;
  status: string | null;
  subtype: string | null;
  period: string | null;
  sourceUrl: string;
  limitations: string[];
  flags: string[];
};
export type FacilityResult = { items: Facility[]; errors: string[] };
export function useFacilities(
  places: Place[],
  preview: boolean,
  enabled: boolean,
  reset: number,
) {
  const [data, setData] = useState<Record<string, FacilityResult>>({});
  const key = (p: Place) => `${preview}/${p.selection.coordinate.join(",")}`;
  useEffect(() => {
    if (!enabled) return;
    const c = new AbortController();
    places.forEach((p) => {
      const k = key(p);
      if (preview) {
        setData((d) => ({
          ...d,
          [k]: {
            items: examples(p.selection).map((f) => ({
              ...f,
              status: "Example status: operating",
              subtype: null,
              period: "Synthetic example period",
              sourceUrl: "",
              limitations: [
                "Synthetic locations; no travel-time, capacity, eligibility or access claim.",
              ],
              flags: [],
            })),
            errors: [],
          },
        }));
        return;
      }
      Promise.allSettled(
        ["healthcare", "schools"].map(async (category) => {
          const r = await json(
            `/api/facilities?category=${category}&near=${p.selection.coordinate.join(",")}&limit=6`,
            c.signal,
          );
          return r.facilities.map(
            (f: any) =>
              ({
                id: f.id,
                category:
                  category === "healthcare" ? "Healthcare" : "Public schools",
                name: f.name,
                coordinate: f.coordinate,
                distance: f.distanceKm,
                status: f.status,
                subtype: f.sourceAttributes?.FAC_FDR || f.subtype,
                period: f.sourcePeriod,
                sourceUrl: r.rights?.url || r.sourceUrl,
                limitations: r.coverage?.limitations || [],
                flags: f.flags || [],
              }) as Facility,
          );
        }),
      ).then((results) => {
        if (c.signal.aborted) return;
        setData((d) => ({
          ...d,
          [k]: {
            items: results
              .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
              .sort(
                (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
              ),
            errors: results.flatMap((r, i) =>
              r.status === "rejected"
                ? [`${i === 0 ? "Healthcare" : "Schools"}: ${r.reason.message}`]
                : [],
            ),
          },
        }));
      });
    });
    return () => c.abort();
  }, [places, preview, enabled, reset]);
  return (p: Place | undefined) => (p ? data[key(p)] : undefined);
}
