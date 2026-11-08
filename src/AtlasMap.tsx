"use client";
import { useEffect, useRef, useState } from "react";
import * as gl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ramps, placeColors, vectorStyle, rasterStyle } from "./map-theme";
import { type Place, type Indicator } from "./frontend/provider";
import { metresPerPercentileAtZoom } from "./frontend/landscape";
import { StatewideOverlays } from "./frontend/map-coverage";
import { value, percentile } from "./frontend/fixtures/preview";
import type { Facility } from "./hooks/useFacilities";
type Props = {
  landscape: boolean;
  overview: boolean;
  onHeightScale: (scale: number) => void;
  onDisplay: (display: {mode: string; metric?: Indicator}) => void;
  collapsed: boolean;
  facilities: Facility[];
  facilitiesReady: boolean;
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
const sourceReady = (m: gl.Map, id: string, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        m.off("sourcedata", check);
        m.off("render", check);
        signal.removeEventListener("abort", abort);
      };
      const abort = () => { cleanup(); reject(new DOMException("Superseded", "AbortError")); };
      const check = () => {
        if (signal.aborted) return abort();
        if (m.getSource(id) && m.isSourceLoaded(id)) {cleanup(); resolve();}
      };
      m.on("sourcedata", check);
      m.on("render", check);
      signal.addEventListener("abort", abort, {once:true});
      check();
    });

export default function AtlasMap(p: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<gl.Map | null>(null),
    latest = useRef(p),
    slot = useRef(0),
    frame = useRef(0),
    blend = useRef<Promise<void>>(Promise.resolve()),
    coverage = useRef(new StatewideOverlays()),
    coverageReset = useRef(p.reset);
  latest.current = p;
  const geometryKey = JSON.stringify(
    p.places
      .map((x) => [x.id, x.selection.tractId, ...x.selection.coordinate])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  );
  const dataGeometryKey = p.preview ? geometryKey : "statewide";
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const q = matchMedia("(max-width:759px)");
    const update = () => setNarrow(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  const growth = useRef(0);
  const [rendered, setRendered] = useState<{metric?: Indicator; mode: string; slot: number}>({mode:"Environment",slot:0});
  const [loading, setLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");
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
    setSourceError("");
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
    // Expensive whole-map queries serve browser assertions, not the interface.
    // Tests opt in through their isolated storage state; normal browsing does not.
    let diagnostics = false;
    try { diagnostics = localStorage.getItem("atlas-render-diagnostics") === "1"; } catch { /* storage may be unavailable */ }
    container.current.dataset.instance = String(Date.now());
    m.on("move", () => {
      if (container.current) container.current.dataset.camera = JSON.stringify({zoom:m.getZoom(),pitch:m.getPitch(),bearing:m.getBearing()});
    });
    m.on("idle", () => {
      if (container.current && m.getLayer("city-buildings")) {
        if(diagnostics)container.current.dataset.buildingsRendered = String(m.queryRenderedFeatures({layers:["city-buildings"]}).length);
        container.current.dataset.pitch = String(m.getPitch());
        container.current.dataset.bearing = String(m.getBearing());
      }
    });
    m.addControl(
      new gl.NavigationControl({ showCompass: true }),
      "bottom-right",
    );
    const ro = new ResizeObserver(() => m.resize());
    ro.observe(container.current);
    m.on("load", () => {
      // The vector style groups ground fills before water. Insert thematic
      // shading here so zoom-dependent land use cannot cover the measurements.
      const before = m.getLayer("water") ? "water" : m.getStyle().layers.find((l) => l.type === "symbol")?.id;
      const hatch=new Uint8Array(8*8*4);
      for(let y=0;y<8;y++)for(let x=0;x<8;x++) {const offset=(y*8+x)*4;const stripe=(x+y)%8<2;hatch.set(stripe?[190,198,205,255]:[65,75,85,230],offset);}
      m.addImage("missing-hatch",{width:8,height:8,data:hatch});
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
              "fill-antialias": false,
              "fill-opacity": 0,
              "fill-opacity-transition": { duration: reduced() ? 0 : 450 },
            },
          },
          before,
        );
        m.addLayer({id:"missing"+i,type:"fill",source:"tracts"+i,
          filter:["==",["get","__atlasFrame"],-1],paint:{"fill-pattern":"missing-hatch","fill-opacity":0}},before);
        m.addLayer({id:"landscape" + i, type:"fill-extrusion", source:"tracts" + i,
          filter:["==",["get","__atlasFrame"],-1],
          paint:{"fill-extrusion-color":"#9581cb", "fill-extrusion-height":0,"fill-extrusion-height-transition":{duration:0},"fill-extrusion-opacity-transition":{duration:0},"fill-extrusion-opacity":0}},
          m.getStyle().layers.find(l=>l.type === "symbol")?.id);
        m.addLayer(
          {
            id: "boundary" + i,
            type: "line",
            source: "tracts" + i,
            paint: {
              "line-color": "#a2b2c1",
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
            paint: { "line-color": "#5DBDB0", "line-width": 2.5 },
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
          "circle-opacity": 0,
          "circle-stroke-opacity": 0,
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
      const layers = [...(latest.current.mode === "Infrastructure" ? ["facilities"] : []), ...(container.current?.dataset.metric && container.current.dataset.metric === latest.current.metric?.id ? [...(growth.current > 0.01 ? ["landscape" + slot.current] : []), "fill" + slot.current] : [])].filter(
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
      const layers = [...(latest.current.mode === "Infrastructure" ? ["facilities"] : []), ...(container.current?.dataset.metric && container.current.dataset.metric === latest.current.metric?.id ? [...(growth.current > 0.01 ? ["landscape" + slot.current] : []), "fill" + slot.current] : [])].filter(
        (l) => !!m.getLayer(l),
      );
      if (!layers.length) return;
      const f = m.queryRenderedFeatures(e.point, { layers })[0];
      if (!f) return;
      if (f.layer.id === "facilities")
        latest.current.onFacility(f.properties.id);
      else {
        latest.current.onInspect(f.properties.id);
        m.setFilter("inspection" + slot.current, ["all",
          ["==", ["get", "__atlasFrame"], f.properties.__atlasFrame],
          ["==", ["get", "id"], f.properties.id],
        ]);
      }
    });
    m.on("idle", () => {
      if (container.current) {
        container.current.dataset.ready = "true";
        container.current.dataset.zoom = String(m.getZoom());
        container.current.dataset.center = JSON.stringify(
          m.getCenter().toArray(),
        );
        if (!diagnostics) return;
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
        container.current.dataset.landscapeRendered = String(
          m.getLayer("landscape"+slot.current) ? m.queryRenderedFeatures({layers:["landscape"+slot.current]}).length : 0,
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
      setSourceError(
        "A map source could not load. Evidence is still available. Try the fallback map in the menu.",
      ),
    );
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      setReady(false);
    };
  }, [p.raster, vectorStyle]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getLayer("fill0")) return;
    if (coverageReset.current !== p.reset) {
      coverage.current.clear();
      coverageReset.current = p.reset;
    }
    let controller: AbortController | undefined;
    let generation = 0;
    let firstReveal = true;
    setLoading(p.mode === "Infrastructure" || !!p.metric);
    setError("");
    setHover(null);
    if (container.current) delete container.current.dataset.metric;
    async function update() {
      const g = ++generation;
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      const metric = p.metric;
      if (!metric || p.mode === "Infrastructure") return;
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
                        [x - 0.009, y - 0.007],
                        [x + 0.009, y - 0.007],
                        [x + 0.009, y + 0.007],
                        [x - 0.009, y + 0.007],
                        [x - 0.009, y - 0.007],
                      ],
                    ],
                  },
                } as GeoJSON.Feature;
              }),
            ),
          };
        } else {
          data = await coverage.current.load(metric.id, request.signal);
        }
        // Do not reuse the outgoing buffer until its last blend completes.
        // Requests can fetch concurrently; only the current response can stage.
        await blend.current;
        if (
          request.signal.aborted ||
          g !== generation ||
          !m?.getSource("tracts0")
        )
          return;
        const next = 1 - slot.current,
          prop = metric.percentileField ? "percentile" : "value",
          colors = ramps[p.mode];
        // A reused GeoJSON source retains its old rendered tiles while its
        // worker processes setData. A per-update filter prevents those tiles
        // from ever appearing with the newly selected measure or color ramp.
        const token = ++frame.current;
        const currentFrame: gl.FilterSpecification = ["==", ["get", "__atlasFrame"], token];
        const tagged = {
          ...data,
          features: data.features.map(f => ({
            ...f, properties: { ...f.properties, __atlasFrame: token },
          })),
        };
        m.setPaintProperty("fill" + next, "fill-opacity-transition", { duration: 0 });
        m.setPaintProperty("fill" + next, "fill-opacity", 0);
        for (const layer of ["boundary", "selected", "inspection"]) {
          m.setPaintProperty(layer + next, "line-opacity-transition", {duration: 0});
          m.setPaintProperty(layer + next, "line-opacity", 0);
        }
        m.setPaintProperty("fill" + next, "fill-color-transition", { duration: 0 });
        m.setFilter("fill" + next, currentFrame);
        m.setFilter("missing"+next,["all",currentFrame,["==",["get",prop],null]]);
        m.setPaintProperty("missing"+next,"fill-opacity",0);
        m.setFilter("landscape" + next, ["all",currentFrame,["!=",["get","percentile"],null]]);
        m.setFilter("boundary" + next, currentFrame);
        m.setFilter("selected" + next, ["all", currentFrame,
          ["in", ["get", "id"], ["literal", latest.current.places.map(x => x.selection.tractId)]],
        ]);
        m.setFilter("inspection" + next, ["==", ["get", "id"], ""]);
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
        m.setPaintProperty("landscape" + next, "fill-extrusion-color", m.getPaintProperty("fill" + next, "fill-color"));
        await (m.getSource("tracts" + next) as gl.GeoJSONSource).setData(tagged);
        await sourceReady(m, "tracts" + next, request.signal);
        if (request.signal.aborted || g !== generation || map.current !== m) return;
        // Keep the previous map intact through fetch + worker + tile readiness.
        // Only now blend both buffers together, without a bare-map interval.
        const outgoing = slot.current;
        const duration = reduced() || !firstReveal ? 0 : 450;
        for (const i of [outgoing, next]) {
          m.setPaintProperty("fill" + i, "fill-opacity-transition", {duration});
          for (const layer of ["boundary", "selected", "inspection"])
            m.setPaintProperty(layer + i, "line-opacity-transition", {duration});
        }
        m.setPaintProperty("fill" + next, "fill-opacity", 0.32);
        m.setPaintProperty("missing"+next,"fill-opacity",.85);
        m.setPaintProperty("missing"+outgoing,"fill-opacity",0);
        m.setPaintProperty("selected" + next, "line-opacity", 1);
        m.setPaintProperty("inspection" + next, "line-opacity", 1);
        m.setPaintProperty("boundary" + next, "line-opacity", ["interpolate", ["linear"], ["zoom"], 5, 0.38, 12, 0.22]);
        m.setPaintProperty("fill" + outgoing, "fill-opacity", 0);
        for (const layer of ["boundary", "selected", "inspection"])
          m.setPaintProperty(layer + outgoing, "line-opacity", 0);
        blend.current = new Promise(resolve => setTimeout(() => {
          if (map.current === m) {
            for (const layer of ["fill", "missing", "boundary", "selected", "inspection"])
              m.setFilter(layer + outgoing, ["==", ["get", "__atlasFrame"], -1]);
            if (latest.current.mode !== "Infrastructure")
              m.setFilter("facilities", ["==", ["get", "id"], ""]);
          }
          resolve();
        }, duration));
        for (const prop of ["circle-opacity", "circle-stroke-opacity"] as const) {
          m.setPaintProperty("facilities", `${prop}-transition` as const, {duration});
          m.setPaintProperty("facilities", prop, 0);
        }
        latest.current.onDisplay({mode: p.mode, metric});
        slot.current = next;
        setRendered({mode:p.mode,metric,slot:next});
        firstReveal = false;
        setLoading(false);
        if (container.current) {
          container.current.dataset.metric = metric.id;
          container.current.dataset.provider = p.preview ? "preview" : "live";
          container.current.dataset.features = String(data.features.length);
        }
        setError("");
      } catch (e) {
        if (!request.signal.aborted && g === generation && map.current === m && (e as Error).name !== "AbortError") {
          setLoading(false);
          setError(
            "Tract layer unavailable. Any last loaded overlay is retained; retry from the map menu.",
          );
        }
      }
    }
    update();
    return () => {
      generation++;
      controller?.abort();
    };
  }, [ready, p.metric, p.preview, p.scenario, p.mode, dataGeometryKey, p.reset]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    // Selection outlines change independently of statewide source data.
    for (let i = 0; i < 2; i++) {
      const filter = m.getFilter("fill" + i);
      if (filter) m.setFilter("selected" + i, ["all", filter as gl.ExpressionSpecification,
        ["in", ["get", "id"], ["literal", p.places.map(x => x.selection.tractId)]],
      ]);
    }
  }, [ready, geometryKey]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    m.resize();
    const mobile = innerWidth < 760;
    const panel = document.querySelector<HTMLElement>(".comparison-canvas");
    const side = mobile || p.collapsed || !p.places.length ? 0 :
      (panel ? panel.offsetLeft + panel.offsetWidth + 24 : 468);
    const deck = 0;
    const duration = reduced() ? 0 : 1800;
    if (container.current) container.current.dataset.arrivalDuration = String(duration);
    const focus = p.places.find((v) => v.id === p.active);
    if (focus)
      m.flyTo({
        center: focus.selection.coordinate,
        zoom: 15.6,
        pitch: p.raster ? 0 : 58,
        bearing: -25,
        duration,
        essential: false,
        padding: {
          top: mobile ? 230 : 90,
          bottom: mobile ? 90 : deck + 50,
          left: mobile ? 24 : side + 35,
          right: mobile ? 24 : 150,
        },
      });
    else if (p.places.length > 1) {
      const b = new gl.LngLatBounds();
      p.places.forEach((v) => b.extend(v.selection.coordinate));
      m.fitBounds(b, {
        absolutePadding: true,
        // Together is a geographic overview: remove the arrival perspective
        // and reserve an inner frame, rather than pinning endpoints to corners.
        pitch: 0,
        bearing: 0,
        padding: {
          top: mobile ? 350 : 230,
          bottom: mobile ? 280 : 230,
          left: mobile ? 55 : side + 100,
          right: mobile ? 80 : 150,
        },
        duration,
        maxZoom: 11,
      });
    } else if (p.places.length === 1)
      m.flyTo({
        center: p.places[0].selection.coordinate,
        zoom: 15.6,
        pitch: p.raster ? 0 : 58,
        bearing: -25,
        duration,
        padding: {
          top: mobile ? 230 : 90,
          bottom: mobile ? 90 : deck + 50,
          left: mobile ? 24 : side + 35,
          right: mobile ? 24 : 160,
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
  }, [ready, geometryKey, p.active, p.reset, narrow, p.collapsed]);
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
    if (!m.getSource("facilities") || p.mode !== "Infrastructure" || !p.facilitiesReady) return;
    const controller = new AbortController();
    const update = async () => {
      try {
        await (m.getSource("facilities") as gl.GeoJSONSource).setData({
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
        await sourceReady(m, "facilities", controller.signal);
        await blend.current;
        if (controller.signal.aborted || map.current !== m) return;
        latest.current.onDisplay({mode: "Infrastructure"});
        setRendered({mode:"Infrastructure",slot:slot.current});
        m.setFilter("facilities", null);
        for (let i = 0; i < 2; i++) {
          m.setPaintProperty("fill" + i, "fill-opacity-transition", {duration: reduced() ? 0 : 450});
          m.setPaintProperty("fill" + i, "fill-opacity", 0);
          m.setPaintProperty("missing"+i,"fill-opacity",0);
          for (const layer of ["boundary", "selected", "inspection"]) {
            m.setPaintProperty(layer + i, "line-opacity-transition", {duration: reduced() ? 0 : 450});
            m.setPaintProperty(layer + i, "line-opacity", 0);
          }
        }
        setLoading(false);
        for (const prop of ["circle-opacity", "circle-stroke-opacity"] as const) {
          m.setPaintProperty("facilities", `${prop}-transition` as const, {duration: reduced() ? 0 : 450});
          m.setPaintProperty("facilities", prop, p.mode === "Infrastructure" ? 1 : 0);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError("Facility map layer unavailable. The list is still available.");
      }
    };
    void update();
    return () => {controller.abort();};
  }, [ready, p.mode, p.facilities, p.facilitiesReady]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getLayer("facilities")) return;
    m.setPaintProperty("facilities", "circle-radius", [
      "case",
      ["==", ["get", "id"], p.facility],
      12,
      8,
    ]);
  }, [ready, p.facility]);
  useEffect(() => {
    const m=map.current;
    if(!m || !ready || !m.getLayer("landscape0")) return;
    const target=p.landscape && rendered.mode !== "Infrastructure" && rendered.metric?.percentileField ? 1 : 0;
    const start=growth.current, began=performance.now(), duration=reduced()?0:1100;
    const layer="landscape"+rendered.slot, source="tracts"+rendered.slot;
    let raf=0, timer=0, lastHeight=-1, lastWrite=-Infinity, lastLegend=-1, lastOpacity=-1, pending=false;
    // The hidden buffer does not need animated heights. A feature-dependent
    // paint change reloads source tiles; do not queue one for every camera event.
    m.setPaintProperty("landscape"+(1-rendered.slot),"fill-extrusion-opacity",0);
    if(m.getLayer("city-buildings"))m.setPaintProperty("city-buildings","fill-extrusion-opacity-transition",{duration:0});
    const draw=()=>{
      raf=0;
      const now=performance.now();
      const t=duration ? Math.min(1,(now-began)/duration) : 1;
      const amount=start+(target-start)*(t*t*(3-2*t));growth.current=amount;
      const scale=metresPerPercentileAtZoom(m.getZoom());
      const height=scale*amount;
      const heightChanged=height!==lastHeight;
      // Backpressure keeps only the latest desired height while workers finish.
      // Final and reduced-motion states are exact, as are all submitted scales.
      const canWrite=reduced() || (now-lastWrite>=80 && m.isSourceLoaded(source));
      if(heightChanged && canWrite){
        m.setPaintProperty(layer,"fill-extrusion-height",["*",["coalesce",["get","percentile"],0],height]);
        lastHeight=height;lastWrite=now;
        if(container.current)container.current.dataset.heightScale=String(scale);
        const rounded=Math.round(scale);
        if(rounded!==lastLegend){lastLegend=rounded;latest.current.onHeightScale(rounded);}
      }
      if(amount!==lastOpacity){
        m.setPaintProperty(layer,"fill-extrusion-opacity",rendered.mode!=="Infrastructure" ? .85*amount : 0);
        if(m.getLayer("city-buildings"))m.setPaintProperty("city-buildings","fill-extrusion-opacity",(p.overview && rendered.mode !== "Infrastructure") ? 0 : .95*(1-amount));
        lastOpacity=amount;
      }
      if(container.current)container.current.dataset.landscapeProgress=String(amount);
      pending=heightChanged && !canWrite;
      if(t<1)raf=requestAnimationFrame(draw);
      else if(pending && m.isSourceLoaded(source)){
        clearTimeout(timer);
        timer=window.setTimeout(schedule,Math.max(0,80-(now-lastWrite)));
      }
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(draw);};
    const sourceChanged=(event: gl.MapSourceDataEvent)=>{
      if(pending && event.sourceId===source && m.isSourceLoaded(source))schedule();
    };
    m.on("zoom",schedule);
    m.on("sourcedata",sourceChanged);
    draw();
    return()=>{cancelAnimationFrame(raf);clearTimeout(timer);m.off("zoom",schedule);m.off("sourcedata",sourceChanged);};
  },[ready,p.landscape,p.overview,rendered]);
  useEffect(()=>{
    const m=map.current;if(!m || !ready) return;
    if(p.landscape && m.getPitch()<30)m.easeTo({pitch:50,duration:reduced()?0:900});
    else if(p.overview)m.easeTo({pitch:0,duration:reduced()?0:900});
  },[ready,p.landscape,p.overview]);
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
      {loading && !error && <p role="status" className="map-update-status">Changing to {p.mode === "Infrastructure" ? "infrastructure" : p.metric?.label}…</p>}
      {(error || sourceError) && (
        <p role="status" className="map-error">
          {error || sourceError}
        </p>
      )}
    </div>
  );
}
