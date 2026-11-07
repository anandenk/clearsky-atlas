"use client";
import { useEffect, useRef, useState } from "react";
import * as gl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ramps, placeColors, vectorStyle, rasterStyle } from "./map-theme";
import { json, version, type Place, type Indicator } from "./frontend/provider";
import { value, percentile } from "./frontend/fixtures/preview";
import type { Facility } from "./hooks/useFacilities";
type Props = {
  facilities: Facility[];
  places: Place[];
  active: string;
  metric: Indicator | undefined;
  mode: string;
  preview: boolean;
  scenario: string;
  categories: string[];
  facility: string;
  onFacility: (id: string) => void;
  onInspect: (id: string) => void;
  onFocus: (id: string) => void;
  reset: number;
  raster: boolean;
};
const empty: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
export default function AtlasMap(p: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<gl.Map | null>(null),
    latest = useRef(p),
    slot = useRef(0);
  latest.current = p;
  const geometryKey = JSON.stringify(
    p.places
      .map((x) => [x.id, x.selection.tractId, ...x.selection.coordinate])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const q = matchMedia("(max-width:759px)");
    const update = () => setNarrow(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [hover, setHover] = useState<{
      x: number;
      y: number;
      label: string;
    } | null>(null);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!container.current) return;
    gl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const m = new gl.Map({
      container: container.current,
      style: p.raster ? rasterStyle : vectorStyle,
      center: [-120, 37.3],
      zoom: 5.2,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      maxZoom: 16,
      minZoom: 3.3,
    });
    map.current = m;
    container.current.dataset.instance = String(Date.now());
    m.addControl(
      new gl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(container.current);
    m.on("load", () => {
      const before = m.getStyle().layers.find((l) => l.type === "symbol")?.id;
      for (let i = 0; i < 2; i++) {
        m.addSource("tracts" + i, {
          type: "geojson",
          data: empty,
          promoteId: "id",
        });
        m.addLayer(
          {
            id: "fill" + i,
            type: "fill",
            source: "tracts" + i,
            paint: {
              "fill-color": "#9581cb",
              "fill-opacity": 0,
              "fill-opacity-transition": { duration: reduced() ? 0 : 450 },
            },
          },
          before,
        );
        m.addLayer(
          {
            id: "boundary" + i,
            type: "line",
            source: "tracts" + i,
            paint: {
              "line-color": "#77739a",
              "line-opacity": 0,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5,
                0.25,
                12,
                0.7,
              ],
            },
          },
          before,
        );
        m.addLayer(
          {
            id: "selected" + i,
            type: "line",
            source: "tracts" + i,
            filter: ["in", ["get", "id"], ["literal", []]],
            paint: { "line-color": "#454582", "line-width": 2.5 },
          },
          before,
        );
        m.addLayer(
          {
            id: "inspection" + i,
            type: "line",
            source: "tracts" + i,
            filter: ["==", ["get", "id"], ""],
            paint: {
              "line-color": "#232d4c",
              "line-width": 2,
              "line-dasharray": [2, 2],
            },
          },
          before,
        );
      }
      m.addSource("facilities", { type: "geojson", data: empty });
      m.addLayer({
        id: "facilities",
        type: "circle",
        source: "facilities",
        paint: {
          "circle-radius": ["case", ["==", ["get", "id"], ""], 12, 8],
          "circle-color": [
            "match",
            ["get", "category"],
            "Healthcare",
            "#8d569d",
            "Public schools",
            "#447fa9",
            "#a47b2a",
          ],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 3,
        },
      });
      setReady(true);
    });
    m.on("mousemove", (e) => {
      const layers = ["facilities", "fill" + slot.current].filter(
        (l) => !!m.getLayer(l),
      );
      if (!layers.length) return;
      const f = m.queryRenderedFeatures(e.point, { layers })[0];
      m.getCanvas().style.cursor = f ? "pointer" : "";
      setHover(
        f
          ? {
              x: e.point.x,
              y: e.point.y,
              label:
                f.properties.name ||
                f.properties.place ||
                "Census tract " + f.properties.id,
            }
          : null,
      );
    });
    m.on("mouseout", () => setHover(null));
    m.on("click", (e) => {
      const layers = ["facilities", "fill" + slot.current].filter(
        (l) => !!m.getLayer(l),
      );
      if (!layers.length) return;
      const f = m.queryRenderedFeatures(e.point, { layers })[0];
      if (!f) return;
      if (f.layer.id === "facilities")
        latest.current.onFacility(f.properties.id);
      else {
        latest.current.onInspect(f.properties.id);
        for (let i = 0; i < 2; i++)
          m.setFilter("inspection" + i, ["==", ["get", "id"], f.properties.id]);
      }
    });
    m.on("idle", () => {
      if (container.current) {
        container.current.dataset.ready = "true";
        container.current.dataset.zoom = String(m.getZoom());
        container.current.dataset.center = JSON.stringify(
          m.getCenter().toArray(),
        );
        const facilityFeature = m.getLayer("facilities")
          ? m.queryRenderedFeatures({ layers: ["facilities"] })[0]
          : undefined;
        if (facilityFeature?.geometry.type === "Point") {
          const hit = m.project(
            facilityFeature.geometry.coordinates as [number, number],
          );
          container.current.dataset.facilityHit = JSON.stringify({
            x: hit.x,
            y: hit.y,
            id: facilityFeature.properties.id,
          });
        } else delete container.current.dataset.facilityHit;
        container.current.dataset.facilitiesRendered = String(
          m.getLayer("facilities")
            ? m.queryRenderedFeatures({ layers: ["facilities"] }).length
            : 0,
        );
        container.current.dataset.tractsRendered = String(
          m.getLayer("fill" + slot.current)
            ? m.queryRenderedFeatures({ layers: ["fill" + slot.current] })
                .length > 0
            : false,
        );
      }
    });
    m.on("error", () =>
      setError(
        "A map source could not load. Evidence is still available. Try the fallback map in the menu.",
      ),
    );
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      setReady(false);
    };
  }, [p.raster]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    let controller: AbortController | undefined,
      timer: ReturnType<typeof setTimeout>;
    let generation = 0;
    async function update() {
      const g = ++generation;
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      const metric = p.metric;
      if (!metric || p.mode === "Infrastructure") {
        for (let i = 0; i < 2; i++) {
          m!.setPaintProperty("fill" + i, "fill-opacity", 0);
          m!.setPaintProperty("boundary" + i, "line-opacity", 0);
          (m!.getSource("tracts" + i) as gl.GeoJSONSource).setData(empty);
        }
        return;
      }
      try {
        let data: GeoJSON.FeatureCollection;
        if (p.preview) {
          data = {
            type: "FeatureCollection",
            features: p.places.flatMap((place, n) =>
              Array.from({ length: 9 }, (_, i) => {
                const c = place.selection.coordinate,
                  x = c[0] + ((i % 3) - 1) * 0.018,
                  y = c[1] + (Math.floor(i / 3) - 1) * 0.014;
                const cellId =
                  i === 4 ? place.selection.tractId : `preview-cell-${n}-${i}`;
                return {
                  type: "Feature",
                  properties: {
                    id: cellId,
                    place: "Synthetic example geography",
                    percentile: percentile(cellId, metric.id, p.scenario),
                    value: value(cellId, metric.id, p.scenario),
                  },
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [x - 0.008, y - 0.006],
                        [x + 0.008, y - 0.006],
                        [x + 0.008, y + 0.006],
                        [x - 0.008, y + 0.006],
                        [x - 0.008, y - 0.006],
                      ],
                    ],
                  },
                } as GeoJSON.Feature;
              }),
            ),
          };
        } else {
          const b = m!.getBounds();
          const bounds = [
            Math.max(-180, b.getWest()),
            Math.max(-85, b.getSouth()),
            Math.min(180, b.getEast()),
            Math.min(85, b.getNorth()),
          ];
          data = await json(
            `/api/map?bbox=${bounds.join(",")}&indicator=${metric.id}&version=${version}`,
            request.signal,
          );
        }
        if (
          request.signal.aborted ||
          g !== generation ||
          !m?.getSource("tracts0")
        )
          return;
        const next = 1 - slot.current,
          prop = metric.percentileField ? "percentile" : "value",
          colors = ramps[p.mode];
        for (let i = 0; i < 2; i++)
          m.setFilter("selected" + i, [
            "in",
            ["get", "id"],
            ["literal", p.places.map((x) => x.selection.tractId)],
          ]);
        m.setPaintProperty("fill" + next, "fill-color", [
          "case",
          ["==", ["get", prop], null],
          "#cdd0d8",
          [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", prop], 0],
            0,
            colors[0],
            20,
            colors[1],
            40,
            colors[2],
            60,
            colors[3],
            80,
            colors[4],
            100,
            colors[5],
          ],
        ]);
        (m.getSource("tracts" + next) as gl.GeoJSONSource).setData(data);
        m.setPaintProperty("fill" + next, "fill-opacity-transition", {
          duration: reduced() ? 0 : 450,
        });
        m.setPaintProperty("fill" + next, "fill-opacity", 0.72);
        m.setPaintProperty("boundary" + next, "line-opacity", 0.3);
        m.setPaintProperty("fill" + slot.current, "fill-opacity", 0);
        m.setPaintProperty("boundary" + slot.current, "line-opacity", 0);
        slot.current = next;
        if (container.current) {
          container.current.dataset.metric = metric.id;
          container.current.dataset.provider = p.preview ? "preview" : "live";
          container.current.dataset.features = String(data.features.length);
        }
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          for (let i = 0; i < 2; i++) {
            m!.setPaintProperty("fill" + i, "fill-opacity", 0);
            (m!.getSource("tracts" + i) as gl.GeoJSONSource).setData(empty);
          }
          setError(
            "Tract layer unavailable. Try another layer or retry from the map menu.",
          );
        }
      }
    }
    // Hide old measurements immediately: a new label must never describe an old layer.
    for (let i = 0; i < 2; i++) {
      m.setPaintProperty("fill" + i, "fill-opacity-transition", {
        duration: 0,
      });
      m.setPaintProperty("fill" + i, "fill-opacity", 0);
    }
    const move = () => {
      clearTimeout(timer);
      timer = setTimeout(update, 180);
    };
    m.on("moveend", move);
    update();
    return () => {
      generation++;
      controller?.abort();
      clearTimeout(timer);
      m.off("moveend", move);
    };
  }, [ready, p.metric, p.preview, p.scenario, p.mode, geometryKey, p.reset]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    m.resize();
    const mobile = innerWidth < 760;
    const deck = mobile
      ? 0
      : parseFloat(
          getComputedStyle(
            container.current!.closest(".atlas-app")!,
          ).getPropertyValue("--deck-height"),
        ) || 0;
    const duration = reduced() ? 0 : 1100;
    const focus = p.places.find((v) => v.id === p.active);
    if (focus)
      m.flyTo({
        center: focus.selection.coordinate,
        zoom: 11.5,
        duration,
        essential: false,
        padding: {
          top: mobile ? 230 : 90,
          bottom: mobile ? 90 : deck + 50,
          left: mobile ? 24 : 100,
          right: mobile ? 24 : 150,
        },
      });
    else if (p.places.length > 1) {
      const b = new gl.LngLatBounds();
      p.places.forEach((v) => b.extend(v.selection.coordinate));
      m.fitBounds(b, {
        absolutePadding: true,
        padding: {
          top: mobile ? 300 : 190,
          bottom: mobile ? 110 : deck + 90,
          left: mobile ? 45 : 150,
          right: mobile ? 45 : 210,
        },
        duration,
        maxZoom: 12,
      });
    } else if (p.places.length === 1)
      m.flyTo({
        center: p.places[0].selection.coordinate,
        zoom: 11.5,
        duration,
        padding: {
          top: mobile ? 230 : 90,
          bottom: mobile ? 90 : deck + 50,
          left: 24,
          right: 24,
        },
      });
    else
      m.fitBounds(
        [
          [-124.5, 32.45],
          [-114.1, 42],
        ],
        {
          absolutePadding: true,
          padding: {
            top: mobile ? 220 : 100,
            bottom: mobile ? 340 : 80,
            left: mobile ? 24 : 350,
            right: mobile ? 24 : 140,
          },
          duration,
        },
      );
  }, [ready, geometryKey, p.active, p.reset, narrow]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const markers = p.places.map((place) => {
      const el = document.createElement("button");
      el.className = "place-pin";
      el.style.setProperty(
        "--place",
        placeColors[(Number(place.id) - 1) % placeColors.length],
      );
      el.textContent = String.fromCharCode(64 + Number(place.id));
      el.setAttribute("aria-label", "Focus " + place.selection.place);
      el.onclick = () => latest.current.onFocus(place.id);
      return new gl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(place.selection.coordinate)
        .addTo(m);
    });
    return () => markers.forEach((m) => m.remove());
  }, [ready, geometryKey]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource("facilities") as gl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features:
        p.mode === "Infrastructure"
          ? p.facilities.map((f) => ({
              type: "Feature" as const,
              properties: { id: f.id, name: f.name, category: f.category },
              geometry: { type: "Point" as const, coordinates: f.coordinate },
            }))
          : [],
    });
    m.setPaintProperty("facilities", "circle-radius", [
      "case",
      ["==", ["get", "id"], p.facility],
      12,
      8,
    ]);
  }, [
    ready,
    p.mode,
    p.preview,
    p.places,
    p.active,
    p.categories,
    p.facility,
    p.facilities,
  ]);
  return (
    <div className="atlas-map-shell">
      <div
        ref={container}
        className="atlas-map"
        aria-label="Interactive California map"
      />
      {hover && (
        <div
          className="map-tooltip"
          style={{
            left: Math.max(
              8,
              Math.min(
                hover.x + 16,
                (container.current?.clientWidth || 600) - 220,
              ),
            ),
            top: Math.max(10, hover.y - 42),
          }}
        >
          {hover.label}
        </div>
      )}
      {error && (
        <p role="status" className="map-error">
          {error}
        </p>
      )}
    </div>
  );
}
