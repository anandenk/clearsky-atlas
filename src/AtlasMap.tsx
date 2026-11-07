"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as GLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { palette, Selection } from "./domain";
export default function AtlasMap({
  location,
  letter,
}: {
  location: Selection | null;
  letter: string;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<GLMap | null>(null),
    marker = useRef<maplibregl.Marker | null>(null);
  const current = useRef(location);
  current.current = location;
  const [error, setError] = useState("");
  useEffect(() => {
    if (!container.current) return;
    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const m = new maplibregl.Map({
      container: container.current,
      center: location?.coordinate ?? [-119.5, 36.8],
      zoom: location ? 11 : 5,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "paper",
            type: "background",
            paint: { "background-color": "#e8e8dc" },
          },
          {
            id: "base",
            type: "raster",
            source: "osm",
            paint: { "raster-saturation": -1, "raster-opacity": 0.45 },
          },
        ],
      },
      attributionControl: { compact: true },
    });
    map.current = m;
    const resizeObserver = new ResizeObserver(() => m.resize());
    resizeObserver.observe(container.current);
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout>;
    async function update() {
      controller?.abort();
      controller = new AbortController();
      const b = m.getBounds();
      try {
        const r = await fetch(
          "/api/map?bbox=" +
            [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(","),
          { signal: controller.signal },
        );
        if (!r.ok) throw Error();
        const data = await r.json();
        if (m.getSource("tracts"))
          (m.getSource("tracts") as GeoJSONSource).setData(data);
        setError("");
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setError("Tract map unavailable. Values remain available below.");
      }
    }
    m.on("load", () => {
      m.addSource("tracts", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "fill",
        type: "fill",
        source: "tracts",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "pmP"], null],
            "#ddd9d0",
            [
              "interpolate",
              ["linear"],
              ["get", "pmP"],
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
          "fill-opacity": 0.72,
        },
      });
      m.addLayer({
        id: "boundaries",
        type: "line",
        source: "tracts",
        paint: {
          "line-color": "#51695e",
          "line-opacity": 0.28,
          "line-width": 0.65,
        },
      });
      m.addLayer({
        id: "selected",
        type: "line",
        source: "tracts",
        filter: ["==", ["get", "id"], current.current?.tractId ?? ""],
        paint: { "line-color": "#243d37", "line-width": 3 },
      });
      update();
    });
    m.on("idle", () => {
      if (container.current && m.getLayer("fill"))
        container.current.dataset.tractsRendered = String(
          m.queryRenderedFeatures({ layers: ["fill"] }).length > 0,
        );
    });
    m.on("moveend", () => {
      clearTimeout(timer);
      timer = setTimeout(update, 180);
    });
    m.on("error", (e) => {
      if (String(e.error).includes("WebGL"))
        setError("Map graphics unavailable. Read the paired evidence below.");
    });
    return () => {
      resizeObserver.disconnect();
      controller?.abort();
      clearTimeout(timer);
      marker.current?.remove();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current?.remove();
    if (location) {
      const el = document.createElement("div");
      el.className = "pin pin-" + letter;
      el.textContent = letter;
      el.setAttribute("aria-label", "Location " + letter);
      marker.current = new maplibregl.Marker({ element: el })
        .setLngLat(location.coordinate)
        .addTo(m);
      m.flyTo({
        center: location.coordinate,
        zoom: 11,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 1000,
      });
    }
    const select = () => {
      if (m.getLayer("selected"))
        m.setFilter("selected", ["==", ["get", "id"], location?.tractId ?? ""]);
    };
    if (m.isStyleLoaded()) select();
    else m.once("load", select);
  }, [location, letter]);
  return (
    <div className="map-shell">
      <div
        className="map"
        ref={container}
        aria-label={`Map ${letter}: ${location?.place ?? "California"}`}
      />
      <div className="map-label">
        <span className={"identity " + letter}>{letter}</span>
        <div>
          <strong>{location?.place || "Choose an address"}</strong>
          <small>
            {location ? location.county + " County" : "California coverage"}
          </small>
        </div>
      </div>
      <div className="tract-label">
        {location ? "TRACT " + location.tractId : "9,106 CES TRACTS"} · 2020
        GEOGRAPHY
      </div>
      {error && (
        <p className="map-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
