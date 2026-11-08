import type {
  Map as AtlasMap,
  ErrorEvent,
  ExpressionSpecification,
} from "maplibre-gl";

export const buildingVersion = "2026-10-21.0";
const source = "overture-buildings";
const layers = ["overture-buildings-3d", "overture-building-parts-3d"];
type Catalog = {
  tiles: string[];
  bounds: [number, number, number, number];
  minzoom: number;
  maxzoom: number;
  attribution: string;
  metadata: {
    contractVersion: string;
    datasetVersion: string;
    scope: string;
    serving: string;
    truncated: boolean;
    sourceLayers: string[];
  };
};
// These are rendering fallbacks only: missing source heights remain unknown.
export const displayBuildingHeight: ExpressionSpecification = [
  "case",
  ["has", "height"],
  ["get", "height"],
  ["has", "num_floors"],
  ["*", ["get", "num_floors"], 3],
  6,
];
const base: ExpressionSpecification = [
  "min",
  displayBuildingHeight,
  ["coalesce", ["get", "min_height"], 0],
];

export function installBuildings(
  m: AtlasMap,
  report: (message: string) => void,
  ready: (
    m: AtlasMap,
    id: string,
    signal: AbortSignal,
    afterRender: boolean,
  ) => Promise<void>,
) {
  let enabled = false,
    opacity = 0.7,
    active = false,
    generation = 0,
    failed = false;
  let timer: ReturnType<typeof setTimeout> | undefined,
    request: AbortController | undefined;
  let catalog: Catalog | undefined;
  const paint = () => {
    for (const id of layers)
      if (m.getLayer(id))
        m.setPaintProperty(id, "fill-extrusion-opacity", active ? opacity : 0);
    if (m.getLayer("city-buildings"))
      m.setPaintProperty(
        "city-buildings",
        "fill-extrusion-opacity",
        active ? 0 : opacity,
      );
  };
  const visibility = (visible: boolean) => {
    for (const id of layers)
      if (m.getLayer(id))
        m.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  };
  const remove = () => {
    for (const id of layers) if (m.getLayer(id)) m.removeLayer(id);
    if (m.getSource(source)) m.removeSource(source);
  };
  const fallback = (message: string) => {
    active = false;
    paint();
    report(message);
  };
  const cancel = () => {
    request?.abort();
    generation++;
    clearTimeout(timer);
  };
  const onError = (event: ErrorEvent & { sourceId?: string }) => {
    if (event.sourceId !== source || !enabled) return;
    failed = true;
    request?.abort();
    fallback(
      "Overture unavailable; showing OpenStreetMap buildings. Move the map to retry.",
    );
  };
  const update = async () => {
    const token = ++generation;
    request?.abort();
    request = new AbortController();
    const signal = request.signal;
    if (!enabled) return;
    if (m.getZoom() < 14) {
      visibility(false);
      fallback("OpenStreetMap buildings · zoom in for Overture detail.");
      return;
    }
    report(
      "Loading Overture detail · showing OpenStreetMap buildings until ready.",
    );
    try {
      if (!catalog) {
        const response = await fetch(
          `/api/buildings/catalog?version=${buildingVersion}`,
          { signal },
        );
        if (!response.ok) throw Error("Building catalog unavailable");
        const data: Catalog = await response.json();
        if (
          data.metadata?.contractVersion !== "atlas-building-tiles-v1" ||
          data.metadata.datasetVersion !== buildingVersion ||
          data.metadata.scope !== "statewide-california" ||
          data.metadata.truncated !== false ||
          data.minzoom !== 14 ||
          data.maxzoom !== 14 ||
          !data.metadata.sourceLayers?.includes("building_part") ||
          !Array.isArray(data.bounds) ||
          data.bounds.length !== 4 ||
          !data.bounds.every(Number.isFinite) ||
          !Array.isArray(data.tiles) ||
          data.tiles.length !== 1 ||
          data.tiles[0] !==
            `/api/buildings/tiles/{z}/{x}/{y}?version=${buildingVersion}`
        ) {
          throw Error("Building source contract mismatch");
        }
        if (signal.aborted || token !== generation) return;
        catalog = data;
      }
      const b = m.getBounds(),
        [w, s, e, n] = catalog.bounds;
      if (
        b.getWest() < w ||
        b.getEast() > e ||
        b.getSouth() < s ||
        b.getNorth() > n
      ) {
        visibility(false);
        fallback(
          "OpenStreetMap buildings · view extends beyond the Overture California envelope.",
        );
        return;
      }
      if (failed) {
        remove();
        failed = false;
      }
      if (!m.getSource(source)) {
        m.addSource(source, {
          type: "vector",
          tiles: catalog.tiles.map(
            (url) => new URL(url, window.location.origin).href.replaceAll("%7B", "{").replaceAll("%7D", "}"),
          ),
          minzoom: 14,
          maxzoom: 14,
          bounds: catalog.bounds,
          promoteId: "id",
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, <a href="https://docs.overturemaps.org/attribution/">Overture Maps Foundation</a> · <a href="https://github.com/microsoft/GlobalMLBuildingFootprints">Microsoft ML Buildings</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL-1.0</a>',
        });
        for (const [i, id] of layers.entries())
          m.addLayer(
            {
              id,
              type: "fill-extrusion",
              source,
              "source-layer": i === 0 ? "building" : "building_part",
              minzoom: 14,
              filter:
                i === 0
                  ? [
                      "all",
                      ["!=", ["get", "is_underground"], true],
                      ["!=", ["get", "has_parts"], true],
                    ]
                  : ["!=", ["get", "is_underground"], true],
              paint: {
                "fill-extrusion-color": [
                  "case",
                  ["has", "height"],
                  "#84918f",
                  "#a8b3ab",
                ],
                "fill-extrusion-height": displayBuildingHeight,
                "fill-extrusion-base": base,
                "fill-extrusion-opacity": 0,
                "fill-extrusion-opacity-transition": { duration: 0 },
              },
            },
            m.getStyle().layers.find((l) => l.type === "symbol")?.id,
          );
      }
      visibility(true);
      await ready(m, source, signal, true);
      if (signal.aborted || token !== generation || !enabled || failed) return;
      active = true;
      paint();
      report(
        "Overture · statewide buildings + parts. Approximate heights; source coverage varies.",
      );
    } catch (error) {
      if (!signal.aborted && token === generation) {
        failed = true;
        fallback(
          `Overture unavailable; showing OpenStreetMap buildings. ${error instanceof Error ? error.message : "Move the map to retry."}`,
        );
      }
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    if (enabled) timer = setTimeout(update, 180);
  };
  const moving = () => {
    cancel();
    if (enabled)
      fallback(
        "Loading Overture detail · showing OpenStreetMap buildings until ready.",
      );
  };
  m.on("movestart", moving);
  m.on("moveend", schedule);
  m.on("error", onError);
  return {
    setEnabled(value: boolean) {
      if (enabled === value) return;
      enabled = value;
      cancel();
      active = false;
      paint();
      visibility(value && m.getZoom() >= 14);
      if (value) schedule();
      else report("");
    },
    setOpacity(value: number) {
      opacity = value;
      paint();
    },
    dispose() {
      cancel();
      m.off("movestart", moving);
      m.off("moveend", schedule);
      m.off("error", onError);
      remove();
    },
  };
}
