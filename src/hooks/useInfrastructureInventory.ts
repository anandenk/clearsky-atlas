import { useEffect, useState } from "react";
import type { Facility } from "./useFacilities";
import { json } from "../frontend/provider";
import {
  loadFacilityInventory,
  type InventorySource,
} from "../frontend/facility-inventory";

type Inventory = {
  items: Facility[];
  loading: boolean;
  errors: string[];
  ready: string[];
};
export function useInfrastructureInventory(enabled: boolean, reset: number) {
  const [state, setState] = useState<Inventory>({
    items: [],
    loading: false,
    errors: [],
    ready: [],
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController(),
      signal = controller.signal;
    setState({ items: [], loading: true, errors: [], ready: [] });
    void (async () => {
      try {
        const catalog = await json("/api/facilities/catalog", signal);
        for (const category of ["healthcare", "schools"]) {
          try {
            const source: InventorySource | undefined = catalog.categories.find(
              (c: InventorySource) => c.id === category && c.backendReady,
            );
            if (!source?.datasetVersion)
              throw Error("Verified source unavailable");
            const items = await loadFacilityInventory(source, signal);
            if (signal.aborted) return;
            setState((s) => ({
              ...s,
              items: [...s.items, ...items],
              ready: [...s.ready, category],
            }));
          } catch (e) {
            if (signal.aborted) return;
            setState((s) => ({
              ...s,
              errors: [
                ...s.errors,
                `${category === "healthcare" ? "Healthcare" : "Schools"}: ${(e as Error).message}`,
              ],
            }));
          }
        }
      } catch {
        if (!signal.aborted)
          setState((s) => ({
            ...s,
            errors: [
              "Infrastructure source catalog unavailable. Retry to load the inventories.",
            ],
          }));
      } finally {
        if (!signal.aborted) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => controller.abort();
  }, [enabled, reset]);
  return state;
}
