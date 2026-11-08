"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Selection } from "../src/domain";
import {
  type Indicator,
  type Observation,
  type Bundle,
  type Place,
  json,
  bundle,
  previewCatalog,
  format,
  delta,
  differenceUnit,
} from "../src/frontend/provider";
import { example, categories } from "../src/frontend/fixtures/preview";
import { automaticView, type MapView } from "../src/frontend/automatic-view";
import { METRES_PER_PERCENTILE } from "../src/frontend/landscape";
import { placeColors, ramps } from "../src/map-theme";
import { Icon, BrandMark } from "../src/components/Icon";
import Dialog from "../src/components/Dialog";
import AtlasMenu from "../src/components/AtlasMenu";
import PlaceRibbon from "../src/components/PlaceRibbon";
import Infrastructure from "../src/components/Infrastructure";
import { useFacilities, type Facility } from "../src/hooks/useFacilities";
import { useInfrastructureInventory } from "../src/hooks/useInfrastructureInventory";
import FacilityDetail from "../src/components/FacilityDetail";
import FacilityDirectory from "../src/components/FacilityDirectory";
import "../src/styles/facility-directory.css";
import ComparisonPanel from "../src/components/ComparisonPanel";
import GeographyComparison from "../src/components/GeographyComparison";
import { LinkedCamera, OverlayGate } from "../src/frontend/linked-geography";
import { geographyEnabled } from "../src/frontend/experimental-features";
import { StatewideOverlays } from "../src/frontend/map-coverage";
const Map = dynamic(() => import("../src/AtlasMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Opening California…</div>,
});
const modes = ["Environment", "Health", "Community", "Infrastructure"];
const introductions: Record<string, [string, string]> = {
  Environment: [
    "The air around us.",
    "See how environmental conditions change from one neighborhood to the next.",
  ],
  Health: [
    "Health, in context.",
    "Explore population health measures in the places that matter to you.",
  ],
  Community: [
    "The people of a place.",
    "Understand the communities behind the geography.",
  ],
  Infrastructure: [
    "Infrastructure across California.",
    "Explore source-listed healthcare and public schools, from the statewide pattern to an individual location.",
  ],
};
const shortLabels: Record<string, string> = {
  pm: "Fine particles",
  ozone: "Ozone",
  diesel: "Diesel",
  traffic: "Traffic",
  "toxic-releases": "Toxic releases",
  cleanup: "Cleanup sites",
  asthma: "Asthma",
  "heart-attacks": "Heart attacks",
  diabetes: "Diabetes",
  "low-birth-weight": "Low birth weight",
  poverty: "Poverty",
  education: "Education",
  housing: "Housing",
  age: "Age",
  race: "Race & ethnicity",
};
const groups = {
  age: ["pop_und10", "pop_10_64", "pop_ov64"],
  race: ["hisp", "white", "black", "amind", "asian", "pacisl", "othmult"],
};
const compositionColors = [
  "#526aa4",
  "#83a5bd",
  "#b8cad1",
  "#a58dba",
  "#697f96",
  "#c6ad7c",
  "#c2bacd",
];
const letter = (id: string) => String.fromCharCode(64 + Number(id));
const color = (id: string) =>
  placeColors[(Number(id) - 1) % placeColors.length];
export default function Page() {
  const [mapFacility,setMapFacility]=useState<Facility | null>(null);
  const [facilityTarget,setFacilityTarget]=useState<{coordinate:[number,number];serial:number}>();
  const [directoryOpen,setDirectoryOpen]=useState(false);
  const [facilityQuery,setFacilityQuery]=useState("");
  const [buildingStatus,setBuildingStatus]=useState("");
  const [rightBuildingStatus,setRightBuildingStatus]=useState("");
  const [heightScale, setHeightScale] = useState(METRES_PER_PERCENTILE);
  const [rightHeightScale,setRightHeightScale]=useState(METRES_PER_PERCENTILE);
  const [geography,setGeography]=useState(false);
  const [allowGeography,setAllowGeography]=useState(false);
  useEffect(() => {
    setAllowGeography(geographyEnabled(window.location.search));
  }, []);
  const [pair,setPair]=useState({left:"",right:""});
  const collapsedBeforeGeography=useRef(true);
  const overlays=useRef(new StatewideOverlays());
  const linkedCamera=useMemo(()=>new LinkedCamera(),[geography]);
  const [viewPreference, setViewPreference] = useState<"auto" | MapView>("auto");
  const [zoomView, setZoomView] = useState<MapView>("landscape");
  const [placeFocus, setPlaceFocus] = useState<{id: string; serial: number}>();
  const onZoomEnd = useCallback((zoom: number) => {
    setZoomView(previous => automaticView(zoom, previous));
  }, []);
  const visualization = viewPreference === "auto" ? zoomView : viewPreference;
  const [landscapeDepth, setLandscapeDepth] = useState<"flat"|"3d">("3d");
  const onTopDown = useCallback(() => setLandscapeDepth("flat"), []);
  const landscape = visualization === "landscape" && landscapeDepth === "3d";
  const flatLandscape = visualization === "landscape" && landscapeDepth === "flat";
  const [display, setDisplay] = useState<{mode: string; metric?: Indicator}>({mode:"Environment"});
  const [preview, setPreview] = useState(false),
    [scenario, setScenario] = useState("normal"),
    [catalog, setCatalog] = useState<Indicator[]>([]),
    [catalogError, setCatalogError] = useState("");
  const [places, setPlaces] = useState<Place[]>([]),
    [active, setActive] = useState("all"),
    [reference, setReference] = useState(""),
    [mode, setMode] = useState("Environment");
  const [remember, setRemember] = useState<Record<string, string>>({
      Environment: "pm",
      Health: "asthma",
      Community: "poverty",
      Infrastructure: "facilities",
    }),
    [compositionField, setCompositionField] = useState("");
  const [query, setQuery] = useState(""),
    [target, setTarget] = useState(""),
    [candidates, setCandidates] = useState<Selection[]>([]),
    [searchError, setSearchError] = useState(""),
    [busy, setBusy] = useState(false),
    [searchOpen, setSearchOpen] = useState(false);
  const [records, setRecords] = useState<Record<string, Bundle>>({}),
    [evidenceErrors, setEvidenceErrors] = useState<Record<string, string>>({});
  const [sourceFromMap, setSourceFromMap] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false),
    [about, setAbout] = useState(false),
    [inspection, setInspection] = useState(""),
    [inspectionData, setInspectionData] = useState<Observation | null>(null),
    [inspectionError, setInspectionError] = useState("");
  const [filter, setFilter] = useState(categories),
    [facility, setFacility] = useState(""),
    [reset, setReset] = useState(0),
    [raster, setRaster] = useState(false),
    [collapsed, setCollapsed] = useState(true),
    [overview, setOverview] = useState(false),
    [lensExpanded, setLensExpanded] = useState(false);
  const searchAbort = useRef<AbortController | null>(null),
    serial = useRef(0),
    input = useRef<HTMLInputElement>(null),
    cache = useRef<Record<string, Bundle>>({});
  const providerKey = `${preview}/${scenario}`;
  const selectedMetric = remember[mode],
    group =
      selectedMetric === "age" || selectedMetric === "race"
        ? selectedMetric
        : null;
  const metric = catalog.find(
    (m) =>
      m.id ===
      (group
        ? groups[group].includes(compositionField)
          ? compositionField
          : groups[group][0]
        : selectedMetric),
  );
  const selected = places.find((p) => p.id === active) || places[0],
    refPlace = places.find((p) => p.id === reference) || places[0];
  const placeKey = (p: Place) => `${providerKey}/${p.selection.tractId}`;
  const observation = (p: Place, id = metric?.id) =>
    id ? records[placeKey(p)]?.[id] : undefined;
  const scalar = catalog.filter(
    (m) => m.mode === mode.toLowerCase() && m.percentileField,
  );
  const topicIds =
    mode === "Community"
      ? [...scalar.map((m) => m.id), "age", "race"]
      : scalar.map((m) => m.id);
  const hasPlaces = places.length > 0;
  useEffect(() => {
    const c = new AbortController();
    setCatalogError("");
    setCatalog([]);
    if (preview) setCatalog(previewCatalog());
    else
      json("/api/indicators", c.signal)
        .then((d) =>
          setCatalog(d.indicators.filter((i: Indicator) => i.backendReady)),
        )
        .catch((e) => {
          if (e.name !== "AbortError")
            setCatalogError(
              "Evidence catalog unavailable. Retry from the menu; the map remains explorable.",
            );
        });
    return () => c.abort();
  }, [preview, reset]);
  useEffect(() => {
    const c = new AbortController();
    setEvidenceErrors({});
    if (!catalog.length) return () => c.abort();
    places.forEach((p) => {
      const key = placeKey(p);
      if (cache.current[key]) {
        setRecords((r) => ({ ...r, [key]: cache.current[key] }));
        return;
      }
      bundle(p.selection.tractId, preview, scenario, catalog, c.signal)
        .then((data) => {
          if (c.signal.aborted) return;
          cache.current[key] = data;
          setRecords((r) => ({ ...r, [key]: data }));
        })
        .catch((e) => {
          if (e.name !== "AbortError")
            setEvidenceErrors((r) => ({ ...r, [p.id]: e.message }));
        });
    });
    return () => c.abort();
  }, [places, preview, scenario, catalog, reset]);
  useEffect(() => () => searchAbort.current?.abort(), []);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      // Portal clicks belong to their dialog, even if its handler just closed it.
      if (e.target instanceof Element && e.target.closest("dialog")) return;
      document
        .querySelectorAll<HTMLDetailsElement>("details[open]")
        .forEach((d) => {
          if (!d.contains(e.target as Node)) d.open = false;
        });
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // A native modal owns Escape; keep background disclosures/search intact.
        if (document.querySelector("dialog[open]")) return;
        document
          .querySelectorAll<HTMLDetailsElement>("details[open]")
          .forEach((d) => {
            d.open = false;
            d.querySelector("summary")?.focus();
          });
        if (document.querySelector(".search-results")) {
          invalidate();
          setSearchOpen(false);
          input.current?.focus();
        }
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, [searchOpen]);
  useEffect(() => {
    if (!inspection || !metric) return;
    const c = new AbortController();
    setInspectionData(null);
    setInspectionError("");
    bundle(inspection, preview, scenario, catalog, c.signal)
      .then((b) => {
        if (!c.signal.aborted) setInspectionData(b[metric.id]);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setInspectionError(e.message);
      });
    return () => c.abort();
  }, [inspection, metric, preview, scenario, catalog]);
  const sourceMetric = sourceFromMap ? display.metric : metric;
  const sourceMode = sourceFromMap ? display.mode : mode;
  function openSource(fromMap = false) {
    setSourceFromMap(fromMap);
    setSourceOpen(true);
  }
  function invalidate() {
    searchAbort.current?.abort();
    setCandidates([]);
    setSearchError("");
    setBusy(false);
  }
  function switchProvider() {
    setGeography(false);
    invalidate();
    setPreview((v) => !v);
    overlays.current.clear();
    // Provider boundaries invalidate rendered evidence as well as selections.
    // A failed live replacement must never retain an unlabeled synthetic layer.
    setDisplay({mode});
    setBuildingStatus("");
    setRightBuildingStatus("");
    setMapFacility(null);
    setFacilityTarget(undefined);
    setDirectoryOpen(false);
    setSourceOpen(false);
    setOverview(false);
    setPlaces([]);
    setRecords({});
    setScenario("normal");
    setActive("all");
    setReference("");
    setInspection("");
    setFacility("");
    setQuery("");
    setTarget("");
    setAbout(false);
    setSearchOpen(false);
    cache.current = {};
    serial.current = 0;
  }
  function add(s: Selection) {
    if (!target && places.length > 0) setOverview(true);
    const id = target || String(++serial.current);
    setPlaces((p) =>
      target
        ? p.map((x) => (x.id === target ? { ...x, selection: s } : x))
        : [...p, { id, selection: s }],
    );
    if (!reference) setReference(id);
    setActive(target || (!places.length ? id : "all"));
    setTarget("");
    setQuery("");
    setCandidates([]);
    setSearchOpen(false);
    if (!places.length) setCollapsed(true);
    setInspection("");
  }
  async function search(e: React.FormEvent) {
    e.preventDefault();
    invalidate();
    const c = new AbortController();
    searchAbort.current = c;
    setBusy(true);
    try {
      if (preview) {
        if (scenario === "failure")
          throw Error(
            "Simulated search failure. Change the preview scenario to retry.",
          );
        setCandidates([
          example(Math.max(0, (parseInt(query.replace(/\D/g, "")) || 1) - 1)),
        ]);
      } else {
        const d = await json("/api/geocode", c.signal, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: query }),
        });
        if (c.signal.aborted) return;
        const valid = d.candidates.filter(
          (v: Selection & { error?: string }) => !v.error,
        );
        setCandidates(valid);
        const errors = d.candidates
          .filter((v: { error?: string }) => v.error)
          .map((v: { error: string }) => v.error);
        setSearchError(
          errors.join(" ") ||
            (!valid.length
              ? "No match found. Include a city and ZIP code."
              : ""),
        );
      }
    } catch (e) {
      if (!c.signal.aborted) setSearchError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  async function cachedExample(n: number) {
    invalidate();
    const c = new AbortController();
    searchAbort.current = c;
    setBusy(true);
    setSearchOpen(true);
    try {
      const d = await json("/api/demo", c.signal);
      if (!c.signal.aborted) setCandidates([d[n]]);
    } catch (e) {
      if (!c.signal.aborted) setSearchError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  function startSearch(replace = "") {
    document
      .querySelectorAll("details[open]")
      .forEach((e) => e.removeAttribute("open"));
    invalidate();
    setTarget(replace);
    setQuery("");
    setSearchOpen(true);
    input.current?.focus();
  }
  function remove(id: string) {
    const remaining = places.filter((x) => x.id !== id);
    setPlaces(remaining);
    if (remaining.length < 2) {setOverview(false);setGeography(false);setCollapsed(collapsedBeforeGeography.current);}
    if (active === id) setActive("all");
    if (reference === id) setReference(remaining[0]?.id || "");
  }
  function chooseMode(m: string) {
    setMode(m);
    if (m === "Infrastructure" && selected) setActive(selected.id);
    setInspection("");
    setFacility("");
    setCompositionField("");
  }
  const facilityResult = useFacilities(
    places,
    preview,
    mode === "Infrastructure",
    reset,
  );
  const inventory = useInfrastructureInventory(mode === "Infrastructure" && !preview,reset);
  // Don't clear/recluster a resident inventory during catalog/cache revalidation.
  // A completed empty/error response still stages empty coverage honestly.
  const inventoryReady = inventory.ready.length > 0 || (!inventory.loading && inventory.errors.length > 0);
  const statewideFacilities = useMemo(()=>inventory.items.filter(f=>filter.includes(f.category)),[inventory.items,filter]);
  const inventoryById = useMemo(()=>new globalThis.Map(inventory.items.map(f=>[f.id,f])),[inventory.items]);
  const directoryResults = useMemo(()=>statewideFacilities.filter(f=>!facilityQuery.trim() || f.name.toLocaleLowerCase().includes(facilityQuery.trim().toLocaleLowerCase())),[statewideFacilities,facilityQuery]);
  const onMapFacility = (id:string) => {
    const f=inventoryById.get(id);
    if (!preview && f) setMapFacility(f); else setFacility(id);
  };
  const visibleFacilities = useMemo(
    () =>
      (facilityResult(selected)?.items || []).filter((f) =>
        filter.includes(f.category),
      ),
    [facilityResult(selected), filter],
  );
  const linked = allowGeography && geography && places.length > 1;
  const leftPlace=places.find(p=>p.id===pair.left) || places[0];
  const rightPlace=places.find(p=>p.id===pair.right && p.id!==leftPlace?.id) || places.find(p=>p.id!==leftPlace?.id);
  const gate=useMemo(()=>new OverlayGate(),[linked,metric,mode,reset,preview,scenario,places]);
  const leftFacilities=useMemo(()=>(facilityResult(leftPlace)?.items||[]).filter(f=>filter.includes(f.category)),[facilityResult(leftPlace),filter]);
  const rightFacilities=useMemo(()=>(facilityResult(rightPlace)?.items||[]).filter(f=>filter.includes(f.category)),[facilityResult(rightPlace),filter]);
  const openGeography=()=>{if(!allowGeography || places.length<2)return;collapsedBeforeGeography.current=collapsed;setCollapsed(true);setPair({left:(places.find(p=>p.id===reference)||places[0]).id,right:(places.find(p=>p.id!==reference && p.id!==places[0].id)||places[1]).id});setGeography(true);};
  const closeGeography=()=>{setGeography(false);setCollapsed(collapsedBeforeGeography.current);};
  const geographyEvidence=()=>{closeGeography();setCollapsed(false);};
  const choosePair=(side:"left"|"right",id:string)=>setPair(current=>{
    const other=side==="left"?"right":"left";
    return {...current,[side]:id,[other]:current[other]===id ? (side==="left"?leftPlace.id:rightPlace!.id) : current[other]};
  });
  function focusPlace(id: string, side: "left" | "right" = "left") {
    if (!places.some(place => place.id === id)) return;
    // A deliberate focus chooses City now. Auto remains selected so a later
    // zoom-out can resume Landscape; a manual Landscape choice becomes City.
    setZoomView("city");
    setViewPreference(previous => previous === "auto" ? previous : "city");
    // Repeated clicks on the active place are new recenter requests too.
    setPlaceFocus(previous => ({id, serial: (previous?.serial ?? 0) + 1}));
    if (linked) choosePair(side, id);
    else setActive(id);
  }
  const infrastructureControls = (
<div className="infrastructure-map-controls">
          <strong className="infrastructure-control-label">Show on map</strong>
          <div className="facility-filters" aria-label="Infrastructure map categories">
            {["Healthcare","Public schools"].map(c=><button key={c} aria-pressed={filter.includes(c)} onClick={()=>setFilter(filter.includes(c)?filter.filter(f=>f!==c):[...filter,c])}><span className="infrastructure-category-label"><Icon name={c === "Healthcare" ? "Health" : "Infrastructure"} size={17}/>{c}</span><span className="infrastructure-category-state">{filter.includes(c) && <Icon name="check" size={13}/>} {filter.includes(c) ? "Shown" : "Hidden"}</span></button>)}
          </div>
          <p className="inventory-status" role="status">{inventory.loading ? `Loading source inventories${inventory.ready.length ? " · healthcare ready" : ""}…` : `${inventory.items.length.toLocaleString()} source-listed points loaded${inventory.errors.length ? " · partial source coverage" : ""}`}. Clusters show point counts; zoom in to inspect.</p>
          {inventory.errors.map(e=><p className="inventory-error" key={e}>{e}</p>)}
          <div className="inventory-actions"><button onClick={()=>setDirectoryOpen(true)}>Find a facility</button>{inventory.errors.length>0 && <button onClick={()=>setReset(n=>n+1)}>Retry sources</button>}</div>
          <small>CDPH · 2026-10-16 / CDE · 2025–26. Listed locations do not guarantee current services or access. Power and routes unavailable.</small>
        </div>
  );
  const observations = places.map((p) => observation(p));
  const available = observations.filter(
    (o): o is Observation => !!o && o.rawValue !== null,
  );
  const compatible =
    available.length > 0 &&
    available.every((o) => o.comparisonKey === available[0].comparisonKey);
  const vals = available.map((o) => o.rawValue!);
  const spread =
    compatible && vals.length > 1
      ? Math.max(...vals) - Math.min(...vals)
      : null;
  const sameTract =
    places.length > 1 &&
    places.every((p) => p.selection.tractId === places[0].selection.tractId);
  const title =
    group === "age"
      ? "Generations, side by side."
      : group === "race"
        ? "Many communities. One place."
        : metric?.label || "Nearby essentials";
  const intro = introductions[mode];
  return (
    <main
      className={`atlas-app ${linked ? "is-linked" : ""} ${places.length > 1 ? "has-multiple" : ""} ${hasPlaces ? "has-places" : ""} ${collapsed ? "canvas-collapsed" : ""} ${preview ? "is-preview" : ""}`}
      data-mode={mode}
      style={
        {
          "--accent":
            mode === "Health"
              ? "#9d5488"
              : mode === "Community"
                ? "#467fa5"
                : "#5759bb",
        } as React.CSSProperties
      }
    >
      <a className="skip" href="#evidence">
        Skip to evidence
      </a>
      <div className="map-stage">
        <Map
          key={preview ? "preview" : "live"}
          overlays={overlays.current}
          facilityTarget={facilityTarget}
          placeFocus={placeFocus}
          onZoomEnd={onZoomEnd} onTopDown={onTopDown} onBuildingStatus={setBuildingStatus}
          linked={linked ? {camera:linkedCamera,gate,side:"left",placeId:leftPlace.id,coordinate:leftPlace.selection.coordinate} : undefined}
          overview={flatLandscape}
          onHeightScale={setHeightScale}
          landscape={landscape}
          onDisplay={setDisplay}
          places={places}
          collapsed={collapsed}
          active={active}
          metric={metric}
          mode={mode}
          preview={preview}
          scenario={scenario}
          categories={filter}
          facilities={preview ? (linked ? leftFacilities : visibleFacilities) : statewideFacilities}
          facilitiesReady={preview ? (linked ? !!facilityResult(leftPlace) : !selected || !!facilityResult(selected)) : inventoryReady}
          facility={mapFacility?.id || facility}
          onFacility={id=>{if(linked)setActive(leftPlace.id);onMapFacility(id);}}
          onInspect={setInspection}
          onFocus={focusPlace}
          reset={reset}
          raster={raster}
        />
      </div>
      {linked && rightPlace && <div className="comparison-map-stage"><Map
        placeFocus={placeFocus}
        onZoomEnd={onZoomEnd} onTopDown={onTopDown} onBuildingStatus={setRightBuildingStatus}
        overlays={overlays.current} linked={{camera:linkedCamera,gate,side:"right",placeId:rightPlace.id,coordinate:rightPlace.selection.coordinate}}
        overview={flatLandscape} landscape={landscape} onHeightScale={setRightHeightScale} onDisplay={()=>{}}
        places={places} collapsed={true} active={rightPlace.id} metric={metric} mode={mode} preview={preview} scenario={scenario}
        categories={filter} facilities={preview ? rightFacilities : statewideFacilities} facilitiesReady={preview ? !!facilityResult(rightPlace) : inventoryReady} facility={mapFacility?.id || facility}
        onFacility={id=>{setActive(rightPlace.id);onMapFacility(id);}} onInspect={setInspection} onFocus={id=>focusPlace(id,"right")} reset={reset} raster={raster}
      /></div>}
      {linked && rightPlace && <GeographyComparison places={places} left={leftPlace} right={rightPlace} metric={display.metric}
        observe={observation} onPair={choosePair} onClose={closeGeography} onEvidence={geographyEvidence}
        matchingRelief={!landscape || heightScale===rightHeightScale}
        measures={catalog.filter(m=>m.mode===mode.toLowerCase() && m.backendReady)} requestedMetric={metric}
        onMeasure={id=>{const group=Object.entries(groups).find(([,ids])=>ids.includes(id));setRemember(r=>({...r,[mode]:group?.[0]||id}));setCompositionField(group?id:"");setOverview(false);}}/>}
      <header className="masthead">
        <button
          className="brand"
          onClick={() => {
            setActive("all");
            setReset((n) => n + 1);
          }}
          aria-label="ClearSky, return to map overview"
        >
          <BrandMark />
          <span>
            <strong>ClearSky</strong>
            <small>California environmental atlas</small>
          </span>
        </button>
        <div className="search-wrap">
          <form
            className={`search-box ${searchOpen ? "searching" : ""}`}
            onSubmit={search}
          >
            <Icon name="search" size={20} />
            <input
              ref={input}
              aria-label={
                target ? "Replace address" : "Search a California address"
              }
              placeholder={
                preview
                  ? "Search a synthetic example…"
                  : target
                    ? "Replace this address…"
                    : "Find a California address…"
              }
              value={query}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  invalidate();
                  setSearchOpen(false);
                }
              }}
              onChange={(e) => {
                invalidate();
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (!/[\r\n]/.test(text)) return;
                // Text inputs otherwise delete line breaks and join address words.
                e.preventDefault();
                const start = e.currentTarget.selectionStart ?? query.length;
                const end = e.currentTarget.selectionEnd ?? start;
                invalidate();
                setQuery(
                  (query.slice(0, start) +
                    text.replace(/[\r\n]+/g, ", ") +
                    query.slice(end)).slice(0, 1000),
                );
                setSearchOpen(true);
              }}
              maxLength={1000}
              required
              autoComplete="off"
              aria-describedby="search-help"
              aria-invalid={!!searchError}
            />
            <button
              className="search-submit"
              type="submit"
              aria-label="Search"
              disabled={busy}
            >
              {busy ? (
                <span className="spinner" />
              ) : (
                <Icon name="arrow" size={20} />
              )}
            </button>
          </form>
          {searchOpen && (
            <div className="search-results">
              <div className="search-results-head">
                <span>
                  {target ? "Replace a place" : "Find your point of view"}
                </span>
                <button
                  className="icon-button"
                  aria-label="Close search"
                  onClick={() => {
                    invalidate();
                    setSearchOpen(false);
                    setTarget("");
                  }}
                >
                  <Icon name="close" size={17} />
                </button>
              </div>
              {searchError && (
                <p role="alert" className="error">
                  {searchError}
                </p>
              )}
              {candidates.map((s, i) => (
                <button
                  className="candidate"
                  key={s.label + i}
                  onClick={() => add(s)}
                >
                  <Icon name="target" />
                  <span>
                    <strong>{s.label}</strong>
                    <small>
                      {s.cached ? "Verified cached match. " : ""}
                      {s.precision}
                    </small>
                    <em>Confirm this address</em>
                  </span>
                  <Icon name="check" />
                </button>
              ))}
              {!candidates.length && !busy && (
                <>
                  <p id="search-help">
                    {preview
                      ? "Try “Example 1” to explore synthetic evidence."
                      : "Type or paste a numbered street address with a city or ZIP; commas are optional. California is assumed when the state is omitted. Confirm the Census match before exploring."}
                  </p>
                  <div className="example-links">
                    {preview ? (
                      <button
                        onClick={() => setCandidates([example(places.length)])}
                      >
                        Try an example
                      </button>
                    ) : (
                      <>
                        <span>Or explore</span>
                        <button onClick={() => cachedExample(0)}>
                          Oakland
                        </button>
                        <button onClick={() => cachedExample(1)}>Fresno</button>
                      </>
                    )}
                  </div>
                  <small className="privacy-note">
                    {preview
                      ? "Synthetic examples never become live findings."
                      : "Address searches are sent to the US Census geocoder."}
                  </small>
                </>
              )}
            </div>
          )}
        </div>
        <button
          className="about-button"
          onClick={() => setAbout(true)}
          aria-label="Atlas menu"
        >
          <Icon name="more" />
        </button>
      </header>
      {preview && (
        <div className="preview-status">
          <span>Preview data · synthetic examples</span>
          <button onClick={switchProvider}>Return to live</button>
        </div>
      )}
      {catalogError && (
        <div className="catalog-error" role="alert">
          {catalogError}
          <button onClick={() => setReset((n) => n + 1)}>Retry</button>
        </div>
      )}
      {hasPlaces && (
        <PlaceRibbon
          places={places}
          active={active}
          onFocus={focusPlace}
          onOverview={() => {if(linked)closeGeography();setActive("all");}}
          onRemove={(id) => {
            if (places.length === 1) input.current?.focus();
            remove(id);
          }}
          onAdd={() => startSearch()}
          onAddExample={preview ? () => add(example(places.length)) : undefined}
        />
      )}
      <div className="view-switch">
        <div className="view-primary" role="group" aria-label="Visualization">
          <button aria-pressed={viewPreference === "auto"} title="Automatically choose City nearby and Data Landscape farther out" onClick={()=>setViewPreference("auto")}>Auto</button>
          <button aria-pressed={visualization === "city" || mode === "Infrastructure" || !metric?.percentileField} onClick={()=>setViewPreference("city")}>City</button>
          <button aria-pressed={visualization === "landscape" && mode !== "Infrastructure" && !!metric?.percentileField} disabled={mode === "Infrastructure" || !metric?.percentileField || raster} onClick={()=>setViewPreference("landscape")}>Data Landscape</button>
        </div>
        {visualization === "landscape" && mode !== "Infrastructure" && !!metric?.percentileField && <div className="landscape-depth" role="group" aria-label="Landscape depth">
          <button aria-pressed={landscapeDepth === "flat"} onClick={()=>{setLandscapeDepth("flat");setViewPreference("landscape");}}>Flat</button>
          <button aria-pressed={landscapeDepth === "3d"} onClick={()=>{setLandscapeDepth("3d");setViewPreference("landscape");}}>3D</button>
        </div>}
      </div>
      <nav className="domain-dock" aria-label="Explore a domain">
        {modes.map((m) => (
          <button
            key={m}
            className={mode === m ? "selected" : ""}
            aria-pressed={mode === m}
            onClick={() => chooseMode(m)}
          >
            <span className="domain-icon">
              <Icon name={m} size={25} />
            </span>
            <span>{m}</span>
            <i />
          </button>
        ))}
      </nav>
      {!hasPlaces && (
        <section className={`opening-lens ${mode === "Infrastructure" && !preview ? "infrastructure-lens" : ""} ${lensExpanded ? "expanded" : ""}`}>
          <div className="lens-name">
            <Icon name={mode} size={18} />
            {mode}
          </div>
          <h1 key={mode}>{intro[0]}</h1>
          <p>{intro[1]}</p>
          {mode !== "Infrastructure" && (
            <button
              className="mobile-layer-toggle"
              aria-expanded={lensExpanded}
              onClick={() => setLensExpanded((v) => !v)}
            >
              {shortLabels[selectedMetric] || selectedMetric}
              <span>{lensExpanded ? "Close layers" : "Change layer"}</span>
              <Icon name="layers" size={14} />
            </button>
          )}
          <div className="opening-topics">
            {mode === "Infrastructure" ? (
              preview ? <p className="infrastructure-note">Synthetic infrastructure examples for interface exploration.</p> : infrastructureControls
            ) : (
              topicIds.map((id) => (
                <button
                  key={id}
                  aria-pressed={!overview && selectedMetric === id}
                  className={
                    !overview && selectedMetric === id ? "selected" : ""
                  }
                  onClick={() => setRemember((r) => ({ ...r, [mode]: id }))}
                >
                  <span>{shortLabels[id] || id}</span>
                  {selectedMetric === id ? (
                    <span className="topic-dot" />
                  ) : (
                    <Icon name="chevron" size={14} />
                  )}
                </button>
              ))
            )}
          </div>
          <button className="explore-button" onClick={() => startSearch()}>
            Explore an address
            <Icon name="arrow" size={18} />
          </button>
          {preview && (
            <button className="text-button" onClick={() => add(example(0))}>
              Add a synthetic example
            </button>
          )}
        </section>
      )}
      <div className="map-key">
        {mode === "Infrastructure" && !preview && hasPlaces && infrastructureControls}

        {flatLandscape && display.mode !== "Infrastructure" && <p className="analytical-height">Flat landscape: tract shading and boundaries.</p>}
        {landscape && display.mode !== "Infrastructure" && display.metric?.percentileField && <p className="analytical-height">Height exaggerated for visibility: ~{Math.round(heightScale)} m per percentile point at this zoom. Not building height.</p>}
        {landscape && display.mode !== "Infrastructure" && display.metric?.percentileField && <small className="roof-edge-key">Roof edges: saved tracts in teal; last inspected in amber.</small>}
        {(display.mode !== mode || (mode !== "Infrastructure" && display.metric?.id !== metric?.id)) && <small>Showing last loaded layer</small>}
        <div className="map-key-title">
          <span>
            {display.mode === "Infrastructure"
              ? "Infrastructure"
              : display.metric?.label || "Loading evidence…"}
          </span>
          <button
            aria-label="About this measure"
            disabled={!display.metric && display.mode !== "Infrastructure"}
            onClick={() => openSource(true)}
          >
            <Icon name="info" size={15} />
          </button>
        </div>
        {display.mode !== "Infrastructure" ? (
          <>
            <div
              className="color-ramp"
              style={{
                background: `linear-gradient(90deg,${ramps[display.mode].join(",")})`,
              }}
            />
            <div className="key-ends">
              <span>0</span>
              <span>
                {display.metric?.percentileField
                  ? "Statewide percentile"
                  : "Population %"}
              </span>
              <span>100</span>
            </div>
            <div className="missing-key"><i/> Not reported</div>
            <p className="tract-context">{display.mode === "Health" || display.mode === "Community" ? "Population-level tract data; not conditions at every point." : "One observation per tract; conditions within it may vary."}</p>
          </>
        ) : (
          <span className="key-caption">
            {preview
              ? "Synthetic facility locations"
              : "Healthcare & public schools"}
          </span>
        )}
        {preview && <small>Synthetic examples</small>}
        {buildingStatus && <p className="tract-context building-status" role="status">{linked ? (buildingStatus === rightBuildingStatus ? "Both views: " : "Left: ") : ""}{buildingStatus}{linked && rightBuildingStatus && buildingStatus !== rightBuildingStatus ? ` Right: ${rightBuildingStatus}` : ""}</p>}
        <details className="map-provenance">
          <summary>Map sources & limits</summary>
          <p><a href="https://openmaptiles.org/schema/#building" target="_blank" rel="noreferrer">OpenStreetMap buildings</a> via OpenFreeMap. Physical heights are approximate; coverage varies. Overture Buildings 2026-10-21.0 supplies tiled buildings and building parts across the California bounding envelope, including adjacent border context. Coverage is not a complete ground inventory; uncached views require the upstream source. Source heights may be estimates; unknown heights use 3 m per supplied floor, or a schematic 6 m when floors are also unknown. These are source-prepared display extrusions, not precise 3D models. Parent extrusions are suppressed where source parts are provided. Tract heights are analytical, not physical measurements. <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noreferrer">Overture / OSM / Microsoft credits</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL-1.0</a>.</p>
        </details>
      </div>
      <button
        className="recenter"
        onClick={() => {
          setActive("all");
          setReset((n) => n + 1);
        }}
        aria-label="Show all places"
      >
        <Icon name="target" size={19} />
      </button>
      {allowGeography && places.length>1 && !linked && <button className="geography-open" onClick={openGeography}>Compare geography</button>}
      {hasPlaces && collapsed && !linked && <div className="evidence-peek">
        <button className="evidence-reopen" aria-label="Open evidence" aria-expanded={false} aria-controls="evidence" onClick={()=>{setCollapsed(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".canvas-topline button")?.focus());}}>
          <Icon name="layers" size={19}/><span><strong>{mode === "Infrastructure" ? "Nearby essentials" : metric?.label || "Place evidence"}</strong>
          <small>{places.length > 1 ? `${places.length} places to compare` : selected?.selection.place}{mode !== "Infrastructure" && selected && observation(selected) ? ` · ${format(observation(selected)?.rawValue, metric?.id)} ${observation(selected)?.unit || ""}` : ""}</small></span><span className="peek-action">Open evidence ↑</span>
        </button>
        {allowGeography && places.length>1 && <button className="peek-compare" onClick={openGeography}>Compare maps</button>}
      </div>}
      <section
        id="evidence"
        className="comparison-canvas"
        aria-label="Place evidence"
        onKeyDown={event=>{if(event.key === "Escape" && event.currentTarget.contains(event.target as Node)){setCollapsed(true);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".evidence-reopen")?.focus());}}}
        aria-hidden={!hasPlaces || collapsed}
        inert={!hasPlaces || collapsed}
      >
        <div className="canvas-topline">
          <div>
            <span className="context-dot" />
            {preview
              ? "Synthetic exploration"
              : places.length > 1
                ? `${places.length} places`
                : "A closer look"}
            <span className="context-caption">
              {!preview
                ? mode === "Infrastructure"
                  ? "CDPH · CDE"
                  : "CalEnviroScreen 5.0"
                : ""}
            </span>
          </div>
          <button
            className="text-button"
            aria-expanded={!collapsed}
            aria-controls="evidence-body"
            onClick={() => {setCollapsed(true);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(".evidence-reopen")?.focus());}}
          >
            {collapsed ? "Open evidence" : "More map"}
            <span className={collapsed ? "caret up" : "caret"} />
          </button>
        </div>
        <div id="evidence-body" className="canvas-content" inert={collapsed}>
          {mode === "Infrastructure" ? <><header className="compass-heading"><div><h2>Nearby essentials</h2><p>{preview ? "Synthetic preview" : "CDPH healthcare · CDE schools"}</p></div><button onClick={()=>openSource()} aria-label="About the evidence"><Icon name="info" size={19}/></button></header><Infrastructure
            places={places} selected={selected} result={facilityResult} preview={preview}
            filter={filter} setFilter={setFilter} facility={facility} onFacility={setFacility}
            onFocus={setActive} switchProvider={switchProvider}
          /></> : <ComparisonPanel
            places={places} metrics={group ? catalog.filter(m=>groups[group].includes(m.id)) : scalar}
            metric={metric} observe={observation} overview={overview}
            onOverview={()=>setOverview(true)}
            onChoose={id=>{if(group) setCompositionField(id); else setRemember(r=>({...r,[mode]:id})); setOverview(false);}}
            onTopic={id=>{setRemember(r=>({...r,[mode]:id}));setCompositionField("");setOverview(id==="age"||id==="race");}}
            onSource={()=>openSource()} onFocus={focusPlace} reference={reference}
            topics={topicIds.map(id=>({id,label:shortLabels[id]||id}))} selectedTopic={selectedMetric}
            preview={preview} mode={mode} errors={Object.values(evidenceErrors)} onRetry={()=>setReset(n=>n+1)}
          />}
        </div>
      </section>
      <Dialog
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
        title="Behind the measure"
      >
        <div className="source-content">
          <span className="source-badge">
            {preview
              ? "Synthetic preview"
              : sourceMode === "Infrastructure"
                ? "CDPH healthcare · CDE schools"
                : "CalEnviroScreen 5.0 · final release"}
          </span>
          <h3>{sourceMetric?.label || "Infrastructure coverage"}</h3>
          <p>
            {sourceMetric?.definition ||
              "Healthcare and public schools come from CDPH and CDE inventories. Open a facility for dates, source status and limitations. Power plants remain in a separate synthetic preview."}
          </p>
          <dl>
            <div>
              <dt>Measurement period</dt>
              <dd>{sourceMetric?.measurementPeriod || "Not available"}</dd>
            </div>
            <div>
              <dt>Unit</dt>
              <dd>{sourceMetric?.unit || "Not applicable"}</dd>
            </div>
            <div>
              <dt>Geography</dt>
              <dd>
                {preview
                  ? "Synthetic example geography"
                  : sourceMode === "Infrastructure"
                    ? "Published facility points"
                    : "2020 Census tracts"}
              </dd>
            </div>
            <div>
              <dt>Map scale</dt>
              <dd>
                {sourceMode === "Infrastructure"
                  ? "Facility category symbols"
                  : sourceMetric?.percentileField
                    ? "Source percentile, 0–100"
                    : "Population percentage, 0–100"}
              </dd>
            </div>
          </dl>
          {sourceMetric?.definitionSource && (
            <a
              className="source-link"
              target="_blank"
              rel="noreferrer"
              href={sourceMetric.definitionSource}
            >
              Read the original source
              <Icon name="arrow" size={17} />
            </a>
          )}
          <h4>Read this as context.</h4>
          <p>
            Tract statistics describe an area, not an individual or property.
            Co-occurring conditions do not establish causation. Comparisons use
            the same measure, definition, period and source version.
          </p>
          {sourceMetric?.limitations?.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p>
            Address points use Census address-range interpolation, not rooftop
            precision. Missing observations remain unavailable. A
            percentile-point difference is not a percentage change.
          </p>
        </div>
      </Dialog>
      <Dialog
        open={about}
        onClose={() => setAbout(false)}
        title="About ClearSky"
      >
        <AtlasMenu
          key={about ? "open" : "closed"}
          preview={preview}
          raster={raster}
          scenario={scenario}
          onSwitchProvider={switchProvider}
          onToggleRaster={() => {
            setRaster((r) => !r);
            setAbout(false);
          }}
          onRetry={() => {
            setReset((n) => n + 1);
            setAbout(false);
          }}
          onClearPlaces={() => {
            setPlaces([]);
            setOverview(false);
            setActive("all");
            setReference("");
            setAbout(false);
          }}
          onScenarioChange={(value) => {
            setScenario(value);
            setAbout(false);
          }}
        />
      </Dialog>
      <Dialog
        open={!!inspection}
        onClose={() => setInspection("")}
        title="A closer look at this tract"
      >
        <div className="source-content">
          <span className="source-badge">
            {preview ? "Synthetic tract" : "Census tract"} {inspection}
          </span>
          <h3>{metric?.label}</h3>
          {inspectionError ? (
            <p role="alert" className="error">
              {inspectionError}
            </p>
          ) : (
            <p className="inspection-value">
              {inspectionData
                ? format(inspectionData.rawValue, metric?.id)
                : "Loading…"}{" "}
              <small>{metric?.unit}</small>
            </p>
          )}
          <p>{metric?.definition}</p>
          <p>
            This is a map inspection. Your selected addresses have not changed.
          </p>
          <button
            className="primary"
            onClick={() => {
              setInspection("");
              openSource();
            }}
          >
            Definition & source
          </button>
        </div>
      </Dialog>
      <Dialog open={directoryOpen && !preview} onClose={()=>setDirectoryOpen(false)} title="Find a source-listed facility">
        <FacilityDirectory
          query={facilityQuery}
          onQueryChange={setFacilityQuery}
          results={directoryResults}
          loading={inventory.loading}
          partial={inventory.errors.length > 0}
          onChangeCategories={()=>setDirectoryOpen(false)}
          onSelect={f=>{setDirectoryOpen(false);setMapFacility(f);}}
        />
      </Dialog>
      <Dialog open={!!mapFacility && !preview} onClose={()=>setMapFacility(null)} title="About this location">
        {mapFacility && <><FacilityDetail facility={mapFacility} /><div className="facility-locate"><button className="primary" onClick={()=>{setFacilityTarget({coordinate:mapFacility.coordinate,serial:(facilityTarget?.serial || 0)+1});setMapFacility(null);}}>Show on map</button></div></>}
      </Dialog>
    </main>
  );
}
