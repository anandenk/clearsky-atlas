import { json, version } from './provider';

// Full standard display geometry preserves the existing 30 m simplification.
// Fetch once per measure, not per camera movement. This is not lookup geometry.
const STATE_BOUNDS = '-125,32,-114,43';
const MAX_MEASURES = 2;

export class StatewideOverlays {
  private completed = new Map<string, GeoJSON.FeatureCollection>();

  clear() { this.completed.clear(); }

  async load(indicator: string, signal: AbortSignal): Promise<GeoJSON.FeatureCollection> {
    const cached = this.completed.get(indicator);
    if (cached) {
      this.completed.delete(indicator);
      this.completed.set(indicator, cached);
      return cached;
    }
    const data = await json(
      `/api/map?bbox=${STATE_BOUNDS}&indicator=${encodeURIComponent(indicator)}&detail=standard&version=${version}`,
      signal,
    );
    if (signal.aborted) throw new DOMException('Superseded', 'AbortError');
    // Do not cache failures or mutate cached features when tagging render frames.
    this.completed.set(indicator, data);
    while (this.completed.size > MAX_MEASURES)
      this.completed.delete(this.completed.keys().next().value!);
    return data;
  }
}
