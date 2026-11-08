import { json, version } from "./provider";

// Full standard display geometry preserves the existing 30 m simplification.
// Fetch once per measure, not per camera movement. This is not lookup geometry.
const STATE_BOUNDS = "-125,32,-114,43";
const MAX_MEASURES = 2;

export class StatewideOverlays {
  private completed = new Map<string, GeoJSON.FeatureCollection>();

  private pending = new Map<
    string,
    {
      controller: AbortController;
      promise: Promise<GeoJSON.FeatureCollection>;
      clients: number;
    }
  >();
  private resetToken: number | undefined;
  clear(token?: number) {
    if(token !== undefined && token === this.resetToken)return;
    this.resetToken=token;
    this.completed.clear();
    for(const pending of this.pending.values())pending.controller.abort();
    this.pending.clear();
  }

  async load(
    indicator: string,
    signal: AbortSignal,
  ): Promise<GeoJSON.FeatureCollection> {
    const cached = this.completed.get(indicator);
    if (cached) {
      this.completed.delete(indicator);
      this.completed.set(indicator, cached);
      return cached;
    }
    let entry = this.pending.get(indicator);
    if (!entry || entry.controller.signal.aborted) {
      const controller = new AbortController();
      const next = {
        controller,
        clients: 0,
        promise: Promise.resolve(null as unknown as GeoJSON.FeatureCollection),
      };
      next.promise = json(
        `/api/map?bbox=${STATE_BOUNDS}&indicator=${encodeURIComponent(indicator)}&detail=standard&version=${version}`,
        controller.signal,
      )
        .then((data) => {
          if (controller.signal.aborted)
            throw new DOMException("Superseded", "AbortError");
          this.completed.set(indicator, data);
          while (this.completed.size > MAX_MEASURES)
            this.completed.delete(this.completed.keys().next().value!);
          return data as GeoJSON.FeatureCollection;
        })
        .finally(() => {
          if (this.pending.get(indicator) === next)
            this.pending.delete(indicator);
        });
      entry = next;
      this.pending.set(indicator, entry);
    }
    const shared = entry;
    shared.clients++;
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = () => {
        if (finished) return false;
        finished = true;
        signal.removeEventListener("abort", abort);
        shared.clients--;
        if (!shared.clients && this.pending.get(indicator) === shared)
          shared.controller.abort();
        return true;
      };
      const abort = () => {
        if (finish()) reject(new DOMException("Superseded", "AbortError"));
      };
      signal.addEventListener("abort", abort, { once: true });
      shared.promise.then(
        (data) => {
          if (finish()) resolve(data);
        },
        (error) => {
          if (finish()) reject(error);
        },
      );
      if (signal.aborted) abort();
    });
  }
}
