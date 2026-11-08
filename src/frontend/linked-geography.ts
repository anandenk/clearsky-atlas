import type { Map as AtlasMap, LngLatLike } from "maplibre-gl";
export type Side = "left" | "right";

// Only orientation and zoom are linked. Panning never substitutes one place's
// coordinates for the other, and the guard prevents synthetic feedback loops.
export class LinkedCamera {
  private maps = new Map<Side, AtlasMap>();
  private applying = false;
  enabled = true;
  attach(side: Side, map: AtlasMap, center: LngLatLike) {
    const peer = [...this.maps.values()][0];
    const initial = peer ?? map;
    const saved = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      padding: map.getPadding(),
    };
    this.maps.set(side, map);
    map.jumpTo({
      center,
      zoom: peer ? initial.getZoom() : Math.max(13, initial.getZoom()),
      pitch: initial.getPitch(),
      bearing: initial.getBearing(),
      padding: { top: 40, bottom: 60, left: 40, right: 40 },
    });
    const move = () => {
      if (this.applying || !this.enabled) return;
      this.applying = true;
      try {
        for (const other of this.maps.values()) {
          if (other === map) continue;
          if (
            other.getZoom() !== map.getZoom() ||
            other.getPitch() !== map.getPitch() ||
            other.getBearing() !== map.getBearing()
          )
            other.jumpTo({
              zoom: map.getZoom(),
              pitch: map.getPitch(),
              bearing: map.getBearing(),
            });
        }
      } finally {
        this.applying = false;
      }
    };
    map.on("move", move);
    return () => {
      map.off("move", move);
      this.maps.delete(side);
      if (side === "left") map.jumpTo(saved);
    };
  }
}

// A fresh gate belongs to one requested measure/provider/collection. Neither
// pane relabels its outgoing geometry until both have staged the replacement.
export class OverlayGate {
  private waiting = new Map<
    Side,
    {
      resolve: (ready: boolean) => void;
      reject: (error: Error) => void;
      current: () => boolean;
    }
  >();
  private complete = false;
  private error: Error | null = null;
  fail(error: Error) {
    this.error = error;
    for (const waiter of this.waiting.values()) waiter.reject(error);
    this.waiting.clear();
  }
  ready(
    side: Side,
    signal: AbortSignal,
    current: () => boolean = () => true,
  ): Promise<boolean> {
    if (signal.aborted)
      return Promise.reject(new DOMException("Superseded", "AbortError"));
    if (this.error) return Promise.reject(this.error);
    if (this.complete) return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      const clean = () => {
        signal.removeEventListener("abort", abort);
        this.waiting.delete(side);
      };
      const abort = () => {
        clean();
        reject(new DOMException("Superseded", "AbortError"));
      };
      this.waiting.set(side, {
        current,
        resolve: (ready) => {
          clean();
          resolve(ready);
        },
        reject: (error) => {
          clean();
          reject(error);
        },
      });
      signal.addEventListener("abort", abort, { once: true });
      if (this.waiting.size === 2) {
        const coherent = [...this.waiting.values()].every((waiter) =>
          waiter.current(),
        );
        this.complete = coherent;
        for (const waiter of [...this.waiting.values()])
          waiter.resolve(coherent);
      }
    });
  }
}
export type LinkedPane = {
  camera: LinkedCamera;
  gate: OverlayGate;
  side: Side;
  placeId: string;
  coordinate: [number, number];
};
