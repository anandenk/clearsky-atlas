"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { placeColors, ramps } from "../src/map-theme";
import { Icon, BrandMark } from "../src/components/Icon";
import Dialog from "../src/components/Dialog";
import Infrastructure from "../src/components/Infrastructure";
import { useFacilities } from "../src/hooks/useFacilities";
import ComparisonOverview from "../src/components/ComparisonOverview";
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
    "A place to connect.",
    "Explore the schools, healthcare and energy infrastructure around a place.",
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
  const [sourceOpen, setSourceOpen] = useState(false),
    [about, setAbout] = useState(false),
    [inspection, setInspection] = useState(""),
    [inspectionData, setInspectionData] = useState<Observation | null>(null),
    [inspectionError, setInspectionError] = useState("");
  const [filter, setFilter] = useState(categories),
    [facility, setFacility] = useState(""),
    [reset, setReset] = useState(0),
    [raster, setRaster] = useState(false),
    [collapsed, setCollapsed] = useState(false),
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
    const close = (e: MouseEvent) =>
      document
        .querySelectorAll<HTMLDetailsElement>("details[open]")
        .forEach((d) => {
          if (!d.contains(e.target as Node)) d.open = false;
        });
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
  function invalidate() {
    searchAbort.current?.abort();
    setCandidates([]);
    setSearchError("");
    setBusy(false);
  }
  function switchProvider() {
    invalidate();
    setPreview((v) => !v);
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
    setCollapsed(false);
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
    if (remaining.length < 2) setOverview(false);
    if (active === id) setActive("all");
    if (reference === id) setReference("");
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
  const visibleFacilities = useMemo(
    () =>
      (facilityResult(selected)?.items || []).filter((f) =>
        filter.includes(f.category),
      ),
    [facilityResult(selected), filter],
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
      className={`atlas-app ${hasPlaces ? "has-places" : ""} ${collapsed ? "canvas-collapsed" : ""} ${preview ? "is-preview" : ""}`}
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
          places={places}
          active={active}
          metric={metric}
          mode={mode}
          preview={preview}
          scenario={scenario}
          categories={filter}
          facilities={visibleFacilities}
          facility={facility}
          onFacility={setFacility}
          onInspect={setInspection}
          onFocus={setActive}
          reset={reset}
          raster={raster}
        />
      </div>
      <header className="masthead">
        <button
          className="brand"
          onClick={() => {
            setActive("all");
            setReset((n) => n + 1);
          }}
          aria-label="Common ground, return to map overview"
        >
          <BrandMark />
          <span>
            <strong>Common ground</strong>
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
              maxLength={240}
              minLength={preview ? 1 : 6}
              required
              autoComplete="off"
              aria-describedby="search-help"
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
                      : "Enter a street address, city and ZIP. Confirm the Census match before exploring."}
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
        <div className="place-ribbon" aria-label="Your places">
          <button
            className={`all-places ${active === "all" ? "is-active" : ""}`}
            onClick={() => setActive("all")}
          >
            <Icon name="layers" size={17} />
            <span>{places.length > 1 ? "Together" : "Overview"}</span>
          </button>
          {places.map((p, i) => (
            <div
              className={`place-chip ${active === p.id ? "is-active" : ""}`}
              key={p.id}
              style={{ "--place": color(p.id) } as React.CSSProperties}
            >
              <button className="place-focus" onClick={() => setActive(p.id)}>
                <b>{letter(p.id)}</b>
                <span>{p.selection.place}</span>
              </button>
              <details className="place-options">
                <summary aria-label={`Options for ${p.selection.place}`}>
                  <Icon name="more" size={17} />
                </summary>
                <div className="place-menu">
                  <p>{p.selection.label}</p>
                  <button
                    onClick={() => {
                      setReference(p.id);
                      document
                        .querySelectorAll("details[open]")
                        .forEach((e) => e.removeAttribute("open"));
                    }}
                  >
                    Use as reference
                  </button>
                  <button onClick={() => startSearch(p.id)}>
                    Replace address
                  </button>
                  <button
                    disabled={i === 0}
                    onClick={() =>
                      setPlaces((xs) => {
                        const a = [...xs];
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        return a;
                      })
                    }
                  >
                    Move earlier
                  </button>
                  <button onClick={() => remove(p.id)}>Remove place</button>
                </div>
              </details>
            </div>
          ))}
          <button className="add-place" onClick={() => startSearch()}>
            <Icon name="plus" size={17} />
            Add a place
          </button>
          {preview && (
            <button
              className="preview-add"
              onClick={() => add(example(places.length))}
            >
              Add example
            </button>
          )}
        </div>
      )}
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
        <section className={`opening-lens ${lensExpanded ? "expanded" : ""}`}>
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
              <p className="infrastructure-note">
                Healthcare and public schools, from verified source inventories.
                Enter an address to explore nearby locations. Power plants
                remain in a separate synthetic preview.
              </p>
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
        <div className="map-key-title">
          <span>
            {mode === "Infrastructure"
              ? "Infrastructure"
              : metric?.label || "Loading evidence…"}
          </span>
          <button
            aria-label="About this measure"
            onClick={() => setSourceOpen(true)}
          >
            <Icon name="info" size={15} />
          </button>
        </div>
        {mode !== "Infrastructure" ? (
          <>
            <div
              className="color-ramp"
              style={{
                background: `linear-gradient(90deg,${ramps[mode].join(",")})`,
              }}
            />
            <div className="key-ends">
              <span>0</span>
              <span>
                {metric?.percentileField
                  ? "Statewide percentile"
                  : "Population %"}
              </span>
              <span>100</span>
            </div>
          </>
        ) : (
          <span className="key-caption">
            {preview
              ? "Synthetic facility locations"
              : "Healthcare & public schools"}
          </span>
        )}
        {preview && <small>Synthetic examples</small>}
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
      <section
        id="evidence"
        className="comparison-canvas"
        aria-label="Place evidence"
        aria-hidden={!hasPlaces}
        inert={!hasPlaces}
      >
        <div className="canvas-topline">
          <div>
            <span className="context-dot" />
            {preview
              ? "Synthetic exploration"
              : places.length > 1
                ? `${places.length} places, one shared perspective`
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
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "Open evidence" : "More map"}
            <span className={collapsed ? "caret up" : "caret"} />
          </button>
        </div>
        <div className="canvas-content">
          <div className="topic-strip" aria-label="Choose a measure">
            {places.length > 1 && mode !== "Infrastructure" && (
              <button
                className={overview ? "selected overview-tab" : "overview-tab"}
                aria-pressed={overview}
                onClick={() => setOverview(true)}
              >
                At a glance
              </button>
            )}
            {mode === "Infrastructure" ? (
              <span className="infrastructure-heading">Nearby essentials</span>
            ) : (
              topicIds.map((id) => (
                <button
                  key={id}
                  aria-pressed={!overview && selectedMetric === id}
                  className={
                    !overview && selectedMetric === id ? "selected" : ""
                  }
                  onClick={() => {
                    setRemember((r) => ({ ...r, [mode]: id }));
                    setOverview(false);
                    setCompositionField("");
                  }}
                >
                  {shortLabels[id] || id}
                </button>
              ))
            )}
            <button
              className="source-button"
              onClick={() => setSourceOpen(true)}
            >
              <Icon name="info" size={16} />
              About the evidence
            </button>
          </div>
          {mode === "Infrastructure" ? (
            <Infrastructure
              places={places}
              selected={selected}
              result={facilityResult}
              preview={preview}
              filter={filter}
              setFilter={setFilter}
              facility={facility}
              onFacility={setFacility}
              onFocus={setActive}
              switchProvider={switchProvider}
            />
          ) : overview && places.length > 1 ? (
            <ComparisonOverview
              places={places}
              metrics={scalar}
              observe={observation}
              mode={mode}
              onChoose={(id) => {
                setRemember((r) => ({ ...r, [mode]: id }));
                setOverview(false);
              }}
            />
          ) : (
            <div className="evidence-layout">
              <div className="narrative">
                <h2>{title}</h2>
                {group ? (
                  <p>
                    Population composition, shown as a share of the tract.
                    Select a group to see its geography.
                  </p>
                ) : (
                  <>
                    <p className="measure-definition">{metric?.definition}</p>
                    {places.length > 1 ? (
                      <div className="finding" key={selectedMetric}>
                        {sameTract ? (
                          <>
                            <strong>Shared tract. Shared evidence.</strong>
                            <p>
                              These addresses have the same tract observations,
                              even when the properties differ.
                            </p>
                          </>
                        ) : spread === null ? (
                          <>
                            <strong>
                              {available.length
                                ? "A comparison needs matching evidence."
                                : "Gathering the evidence…"}
                            </strong>
                            <p>
                              Missing or incompatible measurements are left
                              unscored.
                            </p>
                          </>
                        ) : spread === 0 ? (
                          <>
                            <strong>The same recorded value.</strong>
                            <p>
                              No difference in this measure across the selected
                              tracts.
                            </p>
                          </>
                        ) : (
                          <>
                            <strong>
                              <span>{format(spread, metric?.id)}</span>{" "}
                              {differenceUnit(metric)}
                            </strong>
                            <p>
                              between the highest and lowest recorded values
                              here. A descriptive difference, not a test of
                              significance.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="single-invitation">
                        <span className="overlapping-dots">
                          <i>A</i>
                          <i>+</i>
                        </span>
                        <p>
                          Places make more sense
                          <br />
                          when seen together.
                        </p>
                        <button onClick={() => startSearch()}>
                          Add a place to compare
                          <Icon name="plus" size={16} />
                        </button>
                      </div>
                    )}
                  </>
                )}
                <div className="evidence-footnote">
                  {preview
                    ? "Synthetic example period"
                    : metric?.measurementPeriod}
                  <button onClick={() => setSourceOpen(true)}>
                    Definition & source
                  </button>
                </div>
              </div>
              {group ? (
                <div className="composition-view">
                  <div className="composition-legend">
                    {groups[group].map((id, i) => (
                      <button
                        key={id}
                        className={metric?.id === id ? "selected" : ""}
                        onClick={() => setCompositionField(id)}
                      >
                        <i style={{ background: compositionColors[i] }} />
                        {catalog.find((m) => m.id === id)?.label}
                      </button>
                    ))}
                  </div>
                  <ComparisonOverview
                    places={places}
                    metrics={catalog.filter(m => groups[group].includes(m.id))}
                    observe={observation}
                    mode="Community"
                    onChoose={(id) => { setCompositionField(id); setSourceOpen(true); }}
                  />
                  <small>
                    Shares describe the population of each tract. Missing groups
                    are not zero. Demographics are not hazards.
                  </small>
                </div>
              ) : (
                <div className="comparison-score">
                  <div className="score-header">
                    <span>
                      {places.length > 1
                        ? "Compared with " + refPlace?.selection.place
                        : "Your selected place"}
                    </span>
                    <span>
                      {metric?.percentileField
                        ? "Position among California tracts"
                        : "Population share"}
                    </span>
                    <span>Recorded value</span>
                  </div>
                  <div className="score-rows">
                    {places.map((p) => {
                      const o = observation(p),
                        d = delta(
                          refPlace ? observation(refPlace) : undefined,
                          o,
                        ),
                        position = o?.percentile,
                        err = evidenceErrors[p.id];
                      return (
                        <div
                          className={`score-row ${active === p.id ? "focused" : ""}`}
                          key={p.id}
                          style={
                            { "--place": color(p.id) } as React.CSSProperties
                          }
                        >
                          <button
                            className="score-place"
                            onClick={() => setActive(p.id)}
                          >
                            <b className="letter">{letter(p.id)}</b>
                            <span>
                              <strong>{p.selection.place}</strong>
                              <small title={p.selection.label}>
                                {p.selection.label}
                              </small>
                            </span>
                          </button>
                          <div
                            className="score-track"
                            aria-label={`${p.selection.place} statewide percentile: ${format(position)}`}
                          >
                            <div className="track-grid" />
                            <div className="track-line" />
                            {position != null ? (
                              <div
                                className="score-bead"
                                style={{ left: `${position}%` }}
                              >
                                <b>{letter(p.id)}</b>
                                <span>{format(position)}</span>
                              </div>
                            ) : (
                              <span className="no-percentile">
                                {err
                                  ? "Evidence unavailable"
                                  : o
                                    ? "Not reported"
                                    : "Loading…"}
                              </span>
                            )}
                          </div>
                          <div className="score-value">
                            <strong>
                              {err
                                ? "Unavailable"
                                : o
                                  ? format(o.rawValue, metric?.id)
                                  : "…"}
                            </strong>
                            <span>{metric?.unit}</span>
                            <small>
                              {places.length > 1
                                ? p.id === refPlace?.id
                                  ? "Reference"
                                  : d === null
                                    ? "Difference unavailable"
                                    : `${d > 0 ? "+" : ""}${format(d, metric?.id)} ${differenceUnit(metric)}`
                                : "Tract-level observation"}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="score-axis">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                  <p className="score-note">
                    {preview ? "Synthetic examples. " : ""}Percentiles describe
                    relative position for this measure, not personal risk.
                    {mode === "Health"
                      ? " Population rates are not individual disease probabilities."
                      : ""}
                  </p>
                  {Object.values(evidenceErrors).length > 0 && (
                    <p role="alert" className="error">
                      {Object.values(evidenceErrors)[0]}{" "}
                      <button onClick={() => setReset((n) => n + 1)}>
                        Retry evidence
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
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
              : mode === "Infrastructure"
                ? "CDPH healthcare · CDE schools"
                : "CalEnviroScreen 5.0 · final release"}
          </span>
          <h3>{metric?.label || "Infrastructure coverage"}</h3>
          <p>
            {metric?.definition ||
              "Healthcare and public schools come from CDPH and CDE inventories. Open a facility for dates, source status and limitations. Power plants remain in a separate synthetic preview."}
          </p>
          <dl>
            <div>
              <dt>Measurement period</dt>
              <dd>{metric?.measurementPeriod || "Not available"}</dd>
            </div>
            <div>
              <dt>Unit</dt>
              <dd>{metric?.unit || "Not applicable"}</dd>
            </div>
            <div>
              <dt>Geography</dt>
              <dd>
                {preview
                  ? "Synthetic example geography"
                  : mode === "Infrastructure"
                    ? "Published facility points"
                    : "2020 Census tracts"}
              </dd>
            </div>
            <div>
              <dt>Map scale</dt>
              <dd>
                {mode === "Infrastructure"
                  ? "Facility category symbols"
                  : metric?.percentileField
                    ? "Source percentile, 0–100"
                    : "Population percentage, 0–100"}
              </dd>
            </div>
          </dl>
          {metric?.definitionSource && (
            <a
              className="source-link"
              target="_blank"
              rel="noreferrer"
              href={metric.definitionSource}
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
          {metric?.limitations?.map((l) => (
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
        title="A little more context"
      >
        <div className="about-content">
          <BrandMark />
          <h3>Common ground</h3>
          <p>
            A California environmental atlas. Explore a place, change your
            perspective, and compare it with the places that matter to you.
          </p>
          <div className="menu-actions">
            <button onClick={switchProvider}>
              <Icon name="layers" />
              {preview ? "Return to live evidence" : "Explore full UI preview"}
              <Icon name="arrow" size={17} />
            </button>
            <button
              onClick={() => {
                setRaster((r) => !r);
                setAbout(false);
              }}
            >
              Use {raster ? "vector" : "fallback raster"} basemap
            </button>
            <button
              onClick={() => {
                setReset((n) => n + 1);
                setAbout(false);
              }}
            >
              Retry map & evidence
            </button>
            <button
              onClick={() => {
                setPlaces([]);
                setOverview(false);
                setActive("all");
                setReference("");
                setAbout(false);
              }}
            >
              Clear all places
            </button>
          </div>
          {preview && (
            <label className="scenario">
              Preview scenario
              <select
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value);
                  setAbout(false);
                }}
              >
                <option value="normal">Typical values</option>
                <option value="missing">Missing observation</option>
                <option value="zero">Valid zero</option>
                <option value="incompatible">Incompatible evidence</option>
                <option value="failure">Source failure</option>
              </select>
            </label>
          )}
          <p className="small">
            Live environment, health and community evidence comes from
            CalEnviroScreen 5.0. Healthcare and schools use their own source
            inventories; power plants remain in synthetic preview. Map data ©
            OpenStreetMap contributors, OpenMapTiles and OpenFreeMap.
          </p>
        </div>
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
              setSourceOpen(true);
            }}
          >
            Definition & source
          </button>
        </div>
      </Dialog>
    </main>
  );
}
