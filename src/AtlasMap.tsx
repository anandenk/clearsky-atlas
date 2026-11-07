"use client";
import { useEffect, useRef, useState } from "react";
import * as gl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Selection } from "./domain";
import { palette, vectorStyle, rasterStyle } from "./map-theme";
import { value, facilities } from "./frontend/fixtures/preview";
import { json, version } from "./frontend/provider";
export type Camera = {
  zoom: number;
  pitch: number;
  bearing: number;
  origin: string;
  tick: number;
};
type Props = {
  location: Selection | null;
  letter: string;
  metric: string;
  preview: boolean;
  enabled: boolean;
  scenario: string;
  categories: string[];
  selectedFacility: string;
  onFacility: (id: string) => void;
  onInspect: (id: string) => void;
  camera: Camera | null;
  onCamera: (c: Camera) => void;
  reset: number;
  raster: boolean;
};
export default function AtlasMap(p: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<gl.Map | null>(null),
    latest = useRef(p);
  latest.current = p;
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!container.current) return;
    gl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const m = new gl.Map({
      container: container.current,
      style: p.raster ? rasterStyle : vectorStyle,
      center: p.location?.coordinate ?? [-119.5, 37],
      zoom: p.location ? 11 : 5,
      renderWorldCopies: false,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.addControl(new gl.NavigationControl(), "bottom-right");
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(container.current);
    m.on("load", () => {
      m.addSource("tracts", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      const before = m.getStyle().layers.find((l) => l.type === "symbol")?.id;
      m.addLayer(
        {
          id: "fill",
          type: "fill",
          source: "tracts",
          paint: {
            "fill-color": [
              "case",
              ["==", ["get", "percentile"], null],
              "#d7d8d3",
              [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "percentile"], 0],
                0,
                palette[0],
                20,
                palette[1],
                40,
                palette[2],
                60,
                palette[3],
                80,
                palette[4],
                100,
                palette[5],
              ],
            ],
            "fill-opacity": 0.65,
          },
        },
        before,
      );
      m.addLayer(
        {
          id: "boundary",
          type: "line",
          source: "tracts",
          paint: {
            "line-color": "#526d61",
            "line-opacity": 0.35,
            "line-width": 0.6,
          },
        },
        before,
      );
      m.addLayer(
        {
          id: "selected",
          type: "line",
          source: "tracts",
          filter: ["==", ["get", "id"], ""],
          paint: { "line-color": "#173f40", "line-width": 3 },
        },
        before,
      );
      m.addLayer(
        {
          id: "inspection",
          type: "line",
          source: "tracts",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "line-color": "#68549b",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        },
        before,
      );
      m.addSource("facilities", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "facilities",
        type: "circle",
        source: "facilities",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "category"],
            "Healthcare",
            "#68549b",
            "Public schools",
            "#326b9b",
            "#9a601e",
          ],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
      setReady(true);
    });
    m.on("click", (e) => {
      const f = m.queryRenderedFeatures(e.point, {
        layers: ["facilities", "fill"].filter((l) => !!m.getLayer(l)),
      })[0];
      if (f?.layer.id === "facilities")
        latest.current.onFacility(f.properties.id);
      else if (f) {
        m.setFilter("inspection", ["==", ["get", "id"], f.properties.id]);
        latest.current.onInspect(f.properties.id);
      }
    });
    m.on("moveend", (e) => {
      if (e.originalEvent)
        latest.current.onCamera({
          zoom: m.getZoom(),
          pitch: m.getPitch(),
          bearing: m.getBearing(),
          origin: latest.current.letter,
          tick: Date.now(),
        });
    });
    m.on("idle", () => {
      if (container.current) {
        container.current.dataset.ready = "true";
        container.current.dataset.zoom = String(m.getZoom());
        container.current.dataset.center = JSON.stringify(
          m.getCenter().toArray(),
        );
      }
      if (container.current && m.getLayer("fill"))
        container.current.dataset.tractsRendered = String(
          m.queryRenderedFeatures({ layers: ["fill"] }).length > 0,
        );
    });
    m.on("error", () =>
      setError(
        "Some map sources could not load. Evidence remains available; try the fallback basemap.",
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
    if (!ready || !m || !m.getSource("tracts")) return;
    let controller: AbortController;
    let timer: ReturnType<typeof setTimeout>;
    async function update() {
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      if (!m?.getSource("tracts")) return;
      (m!.getSource("tracts") as gl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [],
      });
      if (
        !p.enabled ||
        p.metric === "facilities" ||
        ["age", "race"].includes(p.metric)
      )
        return;
      try {
        let data;
        if (p.preview) {
          const c = p.location?.coordinate ?? [-119.5, 37];
          const n = Number(p.location?.tractId.split("-").pop()) || 0;
          data = {
            type: "FeatureCollection",
            features: Array.from({ length: 25 }, (_, i) => {
              const x = c[0] + ((i % 5) - 2) * 0.015,
                y = c[1] + (Math.floor(i / 5) - 2) * 0.012;
              return {
                type: "Feature",
                properties: {
                  id: i === 12 ? `preview-${n}` : `preview-cell-${i}`,
                  percentile: value(
                    `preview-${i === 12 ? n : i % 5}`,
                    p.metric,
                    p.scenario,
                  ),
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [x - 0.007, y - 0.005],
                      [x + 0.007, y - 0.005],
                      [x + 0.007, y + 0.005],
                      [x - 0.007, y + 0.005],
                      [x - 0.007, y - 0.005],
                    ],
                  ],
                },
              };
            }),
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
            `/api/map?bbox=${bounds.join(",")}&indicator=${p.metric}&version=${version}`,
            request.signal,
          );
        }
        if (!request.signal.aborted && m?.getSource("tracts"))
          (m!.getSource("tracts") as gl.GeoJSONSource).setData(data);
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setError("Tract layer unavailable. No preview substituted.");
      }
    }
    const move = () => {
      clearTimeout(timer);
      timer = setTimeout(update, 180);
    };
    m.on("moveend", move);
    update();
    return () => {
      controller?.abort();
      clearTimeout(timer);
      m.off("moveend", move);
    };
  }, [ready, p.metric, p.preview, p.location, p.enabled, p.scenario]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getSource("tracts")) return;
    if (!p.location)
      m.fitBounds(
        [
          [-124.5, 32.5],
          [-114.1, 42],
        ],
        { padding: 28, duration: 0 },
      );
    else
      m.flyTo({
        center: p.location.coordinate,
        zoom: p.location ? 11 : 5,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 700,
      });
    m.setFilter("selected", ["==", ["get", "id"], p.location?.tractId ?? ""]);
    if (!p.location) return;
    const el = document.createElement("div");
    el.className = "atlas-pin";
    el.textContent = p.letter;
    const marker = new gl.Marker({ element: el })
      .setLngLat(p.location.coordinate)
      .addTo(m);
    return () => {
      marker.remove();
    };
  }, [ready, p.location, p.letter, p.reset]);
  useEffect(() => {
    const m = map.current;
    if (m && ready && p.camera && p.camera.origin !== p.letter)
      m.jumpTo({
        center: p.location?.coordinate ?? [-119.5, 37],
        zoom: p.camera.zoom,
        pitch: p.camera.pitch,
        bearing: p.camera.bearing,
      });
  }, [p.camera, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getSource("tracts")) return;
    m.setPaintProperty("facilities", "circle-stroke-color", [
      "case",
      ["==", ["get", "id"], p.selectedFacility],
      "#173f40",
      "#ffffff",
    ]);
    m.setPaintProperty("facilities", "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], p.selectedFacility],
      4,
      2,
    ]);
    (m.getSource("facilities") as gl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features:
        p.preview && p.metric === "facilities" && p.location
          ? facilities(p.location)
              .filter((f) => p.categories.includes(f.category))
              .map((f) => ({
                type: "Feature",
                properties: f,
                geometry: { type: "Point", coordinates: f.coordinate },
              }))
          : [],
    });
  }, [
    ready,
    p.location,
    p.metric,
    p.preview,
    p.categories,
    p.selectedFacility,
  ]);
  return (
    <div className="atlas-map-shell">
      <div
        ref={container}
        className="atlas-map"
        aria-label={`Map ${p.letter}: ${p.location?.place ?? "California"}`}
      />
      <div className="pane-label">
        <b>{p.location ? p.letter : "CA"}</b>{" "}
        {p.location?.place ?? "California"}
        {p.preview && <small>Synthetic geography</small>}
      </div>
      {error && (
        <p className="map-notice" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
