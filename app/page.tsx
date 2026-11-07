"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Selection } from "../src/domain";
import type { Camera } from "../src/AtlasMap";
import { provider, Indicator, Observation } from "../src/frontend/provider";
import {
  example,
  previewLabel,
  facilities,
  categories,
  specs,
  composition,
} from "../src/frontend/fixtures/preview";
import { palette } from "../src/map-theme";
const Map = dynamic(() => import("../src/AtlasMap"), { ssr: false });
type Place = { id: string; selection: Selection; visible: boolean };
const modes = ["Environment", "Health", "Community", "Infrastructure"];
export default function Page() {
  const [preview, setPreview] = useState(false);
  return (
    <Atlas
      key={String(preview)}
      preview={preview}
      switchProvider={() => setPreview(!preview)}
    />
  );
}
function Atlas({
  preview,
  switchProvider,
}: {
  preview: boolean;
  switchProvider: () => void;
}) {
  const [places, setPlaces] = useState<Place[]>([]),
    [catalog, setCatalog] = useState<Indicator[]>([]),
    [mode, setMode] = useState("Environment"),
    [remember, setRemember] = useState<Record<string, string>>({
      Environment: "pm",
      Health: "asthma",
      Community: "pov",
      Infrastructure: "facilities",
    }),
    [query, setQuery] = useState(""),
    [candidates, setCandidates] = useState<Selection[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [target, setTarget] = useState(""),
    [reference, setReference] = useState(""),
    [active, setActive] = useState(""),
    [panel, setPanel] = useState(false),
    [overview, setOverview] = useState(false),
    [scenario, setScenario] = useState("normal"),
    [loadedKey, setLoadedKey] = useState(""),
    [observations, setObservations] = useState<Record<string, Observation>>({}),
    [differences, setDifferences] = useState<Record<string, number | null>>({}),
    [inspection, setInspection] = useState(""),
    [inspectionValue, setInspectionValue] = useState<Observation | null>(null),
    [filter, setFilter] = useState(categories),
    [facility, setFacility] = useState(""),
    [camera, setCamera] = useState<Camera | null>(null),
    [linked, setLinked] = useState(true),
    [reset, setReset] = useState(0),
    [story, setStory] = useState(false),
    [raster, setRaster] = useState(false),
    [narrow, setNarrow] = useState(true);
  const service = useMemo(
      () => provider(preview, scenario),
      [preview, scenario],
    ),
    searchAbort = useRef<AbortController | null>(null),
    serial = useRef(0);
  const metric = catalog.find((i) => i.id === remember[mode]);
  const enabled =
    !!metric?.backendReady && (preview || ["pm", "ozone"].includes(metric.id));
  const selected = places.find((p) => p.id === active) ?? places[0],
    refPlace = places.find((p) => p.id === reference) ?? places[0];
  useEffect(() => {
    const c = new AbortController();
    service
      .catalog(c.signal)
      .then(setCatalog)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [service]);
  useEffect(() => {
    const m = matchMedia("(max-width: 899px)");
    const update = () => setNarrow(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => () => searchAbort.current?.abort(), []);
  const evidenceKey = JSON.stringify([
    preview,
    scenario,
    metric?.id,
    reference,
    places.map((p) => [p.id, p.selection.tractId]),
  ]);
  useEffect(() => {
    const c = new AbortController();
    setObservations({});
    setDifferences({});
    setInspectionValue(null);
    if (metric && enabled && metric.id !== "facilities") {
      Promise.all(
        places.map(
          async (p) =>
            [
              p.id,
              await service.observations(p.selection.tractId, metric, c.signal),
            ] as const,
        ),
      )
        .then((x) => {
          if (!c.signal.aborted) {
            setObservations(Object.fromEntries(x));
            setLoadedKey(evidenceKey);
          }
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        });
      if (refPlace)
        Promise.all(
          places.map(
            async (p) =>
              [
                p.id,
                await service.difference(
                  refPlace.selection.tractId,
                  p.selection.tractId,
                  metric,
                  c.signal,
                ),
              ] as const,
          ),
        )
          .then((x) => {
            if (!c.signal.aborted) setDifferences(Object.fromEntries(x));
          })
          .catch((e) => {
            if (e.name !== "AbortError") setError(e.message);
          });
      if (inspection)
        service
          .observations(inspection, metric, c.signal)
          .then(setInspectionValue)
          .catch((e) => {
            if (e.name !== "AbortError") setError(e.message);
          });
    }
    return () => c.abort();
  }, [places, metric, enabled, service, refPlace, inspection]);
  function add(s: Selection) {
    const id = target || String(++serial.current);
    setPlaces((p) =>
      target
        ? p.map((v) => (v.id === target ? { ...v, selection: s } : v))
        : [
            ...p,
            {
              id,
              selection: s,
              visible: p.filter((x) => x.visible).length < 4,
            },
          ],
    );
    setActive(id);
    if (!reference) setReference(id);
    setCandidates([]);
    setQuery("");
    setTarget("");
    setInspection("");
    setPanel(true);
  }
  function invalidate() {
    searchAbort.current?.abort();
    setCandidates([]);
    setBusy(false);
  }
  async function search(e: React.FormEvent) {
    e.preventDefault();
    invalidate();
    const c = new AbortController();
    searchAbort.current = c;
    setBusy(true);
    setError("");
    try {
      const x = await service.search(query, c.signal);
      if (!c.signal.aborted) setCandidates(x);
    } catch (e) {
      if (!c.signal.aborted) setError((e as Error).message);
    } finally {
      if (!c.signal.aborted) setBusy(false);
    }
  }
  function chooseMode(m: string) {
    setMode(m);
    setInspection("");
    setError("");
    if (m === "Infrastructure") setPanel(true);
  }
  const shown = narrow
    ? selected
      ? [selected]
      : []
    : places.filter((p) => p.visible).slice(0, 4);
  const list = selected
    ? facilities(selected.selection).filter((f) => filter.includes(f.category))
    : [];
  const fmt = (n: number | null | undefined) =>
    n == null
      ? "Unavailable"
      : n.toLocaleString(undefined, {
          maximumFractionDigits: metric?.id === "ozone" ? 4 : 2,
        });
  return (
    <main className="atlas-app">
      <a href="#evidence" className="skip">
        Skip to evidence
      </a>
      <header className="atlas-header">
        <div className="atlas-brand">
          <svg viewBox="0 0 32 40" aria-hidden="true">
            <path d="M8 2h10v15l12 16-8 5-8-7-2-10-6-9z" />
          </svg>
          <h1>
            California<span>Environmental Atlas</span>
          </h1>
        </div>
        <form className="atlas-search" onSubmit={search}>
          <label className="sr-only" htmlFor="search">
            {target ? "Replace address" : "Search California address"}
          </label>
          <input
            id="search"
            name="address"
            autoComplete="street-address"
            value={query}
            onChange={(e) => {
              invalidate();
              setQuery(e.target.value);
            }}
            placeholder={
              preview ? "Try Example 1…" : "Street address, city, CA…"
            }
            required
            maxLength={240}
          />
          <button disabled={busy}>
            {busy ? "Finding…" : target ? "Replace" : "Search"}
          </button>
          {target && (
            <button
              type="button"
              onClick={() => {
                setTarget("");
                setQuery("");
                invalidate();
              }}
            >
              Cancel
            </button>
          )}
          {candidates.length > 0 && (
            <div className="atlas-candidates">
              <p>
                {preview
                  ? "Confirm synthetic example"
                  : "Confirm the Census match · address-range estimate"}
              </p>
              {candidates.map((c) => (
                <button type="button" key={c.label} onClick={() => add(c)}>
                  {c.label} · Use match →
                </button>
              ))}
            </div>
          )}
        </form>
        <button onClick={switchProvider}>
          {preview ? "Return to live" : "Explore full UI preview"}
        </button>
      </header>
      {preview && (
        <div className="preview-banner">
          <strong>{previewLabel}</strong>
          <label>
            Scenario{" "}
            <select
              aria-label="Scenario"
              value={scenario}
              onChange={(e) => {
                invalidate();
                setScenario(e.target.value);
                setError("");
              }}
            >
              <option value="normal">Normal</option>
              <option value="missing">Missing value</option>
              <option value="zero">Valid zero</option>
              <option value="incompatible">Incompatible evidence</option>
              <option value="failure">Request failure</option>
            </select>
          </label>
          <button onClick={() => add(example(places.length))}>
            Add example location
          </button>
        </div>
      )}
      <nav className="atlas-toolbar" aria-label="Atlas modes">
        <div className="mode-buttons">
          {modes.map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => chooseMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="indicator-control">
          Indicator{" "}
          <select
            aria-label="Indicator"
            value={remember[mode]}
            onChange={(e) => {
              setRemember({ ...remember, [mode]: e.target.value });
              setInspection("");
              setError("");
            }}
          >
            {(preview
              ? catalog.filter((i) => i.mode === mode.toLowerCase())
              : specs
                  .filter((s) => s[1] === mode)
                  .map(
                    (s) =>
                      catalog.find((i) => i.id === s[0]) ?? {
                        id: s[0],
                        label: s[2],
                      },
                  )
            ).map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setPanel(!panel)} aria-expanded={panel}>
          {panel ? "Hide evidence" : "Show evidence"}
        </button>
      </nav>
      {error && (
        <div className="atlas-error" role="alert">
          {error} <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      <div className="atlas-workspace">
        <section className="map-region" aria-label="Atlas maps">
          {places.length > 0 && (
            <div className="location-strip">
              {places.map((p, i) => (
                <button
                  key={p.id}
                  aria-pressed={selected?.id === p.id}
                  onClick={() => setActive(p.id)}
                >
                  {p.id} · {p.selection.place}
                  {p.id === refPlace?.id ? " · reference" : ""}
                </button>
              ))}
              <button
                onClick={() => {
                  setPlaces([]);
                  setReference("");
                  setInspection("");
                  setActive("");
                  setPanel(false);
                }}
              >
                Clear all
              </button>
            </div>
          )}
          <div className={"atlas-maps count-" + Math.max(1, shown.length)}>
            {(shown.length ? shown : [null]).map((p) => (
              <Map
                key={p?.id ?? "overview"}
                location={p?.selection ?? null}
                letter={p?.id ?? "CA"}
                metric={remember[mode]}
                enabled={enabled}
                preview={preview}
                scenario={scenario}
                categories={filter}
                selectedFacility={facility}
                onFacility={(id) => {
                  setFacility(id);
                  if (p) setActive(p.id);
                  setPanel(true);
                }}
                onInspect={(id) => {
                  setInspection(id);
                  setPanel(true);
                }}
                camera={linked ? camera : null}
                onCamera={setCamera}
                reset={reset}
                raster={raster}
              />
            ))}
          </div>
          <div className="map-tools">
            <button aria-pressed={linked} onClick={() => setLinked(!linked)}>
              {linked ? "Cameras linked" : "Cameras unlocked"}
            </button>
            <button
              onClick={() => {
                setCamera(null);
                setReset(reset + 1);
              }}
            >
              Reset views
            </button>
            <button onClick={() => setRaster(!raster)}>
              {raster ? "Vector basemap" : "Fallback basemap"}
            </button>
          </div>
          <div className="atlas-legend">
            <div>
              <b>
                {metric?.label ??
                  specs.find((s) => s[0] === remember[mode])?.[2]}
              </b>
              <small>
                {preview
                  ? previewLabel
                  : enabled
                    ? "CES 5.0 · California tract percentiles"
                    : "Live layer unavailable · explore the preview"}
              </small>
            </div>
            {enabled && metric?.percentileField && (
              <div className="legend-ramp">
                <div>
                  {palette.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </div>
                <span>0</span>
                <span>100 · shared scale</span>
              </div>
            )}
            <small>▧ No data</small>
          </div>
        </section>
        {panel && (
          <aside id="evidence" className="evidence-panel" tabIndex={-1}>
            <div className="panel-heading">
              <h2>
                {inspection
                  ? "Inspected tract"
                  : places.length > 1
                    ? "Places in comparison"
                    : "A closer look"}
              </h2>
              <button
                aria-label="Close evidence"
                onClick={() => setPanel(false)}
              >
                ×
              </button>
            </div>
            <p className="context-label">
              {preview
                ? previewLabel
                : "Live evidence · CES 5.0 · release July 2026"}
            </p>
            {inspection && (
              <section className="inspection">
                <b>{inspection}</b>
                <p>
                  {fmt(inspectionValue?.rawValue)} {metric?.unit}
                </p>
                <button onClick={() => setInspection("")}>
                  Return to selected locations
                </button>
                <p>Inspection does not replace an address.</p>
              </section>
            )}
            {!places.length && (
              <p>
                Search and confirm an address to explore its tract. Click a
                shaded tract to inspect it.
              </p>
            )}
            {places.length > 0 && (
              <>
                <div className="panel-tabs">
                  <button
                    aria-pressed={!overview}
                    onClick={() => setOverview(false)}
                  >
                    Selected indicator
                  </button>
                  <button
                    aria-pressed={overview}
                    onClick={() => setOverview(true)}
                  >
                    Overview
                  </button>
                </div>
                {overview && (
                  <section>
                    <h3>Explore a question</h3>
                    {[
                      "Air around these places",
                      "Health in neighborhood context",
                      "Community context",
                      "Nearby essentials",
                    ].map((s, i) => (
                      <button
                        className="story"
                        key={s}
                        onClick={() => {
                          chooseMode(modes[i]);
                          setRemember((r) => ({
                            ...r,
                            [modes[i]]: ["pm", "asthma", "pov", "facilities"][
                              i
                            ],
                          }));
                          setOverview(false);
                          setStory(true);
                        }}
                      >
                        {s} →
                      </button>
                    ))}
                    <p>
                      Follow the indicators in each mode. No combined score or
                      overall neighborhood winner.
                    </p>
                  </section>
                )}
                {story && (
                  <section className="story-steps">
                    <p>
                      {preview ? previewLabel : "Source-backed exploration"} ·{" "}
                      {mode} story
                    </p>
                    {specs
                      .filter((s) => s[1] === mode)
                      .map((s) => (
                        <button
                          key={s[0]}
                          aria-pressed={remember[mode] === s[0]}
                          onClick={() => {
                            setRemember((r) => ({ ...r, [mode]: s[0] }));
                            setInspection("");
                          }}
                        >
                          {s[2]}
                        </button>
                      ))}
                    <button onClick={() => setStory(false)}>Leave story</button>
                  </section>
                )}
                <div className="collection">
                  {places.map((p, i) => (
                    <details key={p.id}>
                      <summary>
                        {p.id} · {p.selection.label}
                      </summary>
                      <div className="collection-actions">
                        <button
                          onClick={() => {
                            setTarget(p.id);
                            setQuery(p.selection.label);
                            invalidate();
                            document.getElementById("search")?.focus();
                          }}
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => {
                            setPlaces(places.filter((x) => x.id !== p.id));
                            setInspection("");
                          }}
                        >
                          Remove
                        </button>
                        <button onClick={() => setReference(p.id)}>
                          Reference
                        </button>
                        <button
                          disabled={i === 0}
                          onClick={() =>
                            setPlaces((a) => {
                              const b = [...a];
                              [b[i - 1], b[i]] = [b[i], b[i - 1]];
                              return b;
                            })
                          }
                        >
                          Move earlier
                        </button>
                        <label>
                          <input
                            type="checkbox"
                            checked={p.visible}
                            disabled={
                              !p.visible &&
                              places.filter((x) => x.visible).length >= 4
                            }
                            onChange={() =>
                              setPlaces((a) =>
                                a.map((x) =>
                                  x.id === p.id
                                    ? { ...x, visible: !x.visible }
                                    : x,
                                ),
                              )
                            }
                          />{" "}
                          Show map
                        </label>
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}
            {mode === "Infrastructure" ? (
              <section>
                <h3>Nearby essentials</h3>
                {categories.map((c) => (
                  <label className="filter" key={c}>
                    <input
                      type="checkbox"
                      checked={filter.includes(c)}
                      onChange={() =>
                        setFilter((a) =>
                          a.includes(c) ? a.filter((x) => x !== c) : [...a, c],
                        )
                      }
                    />
                    {c}
                  </label>
                ))}
                {!preview ? (
                  <p>
                    Live facility API is not available. No coverage or access is
                    inferred. Explore full UI preview for synthetic facilities.
                  </p>
                ) : !selected ? (
                  <p>Add an example location to explore facilities.</p>
                ) : (
                  <>
                    {list.map((f) => (
                      <button
                        className={
                          "facility " + (facility === f.id ? "chosen" : "")
                        }
                        key={f.id}
                        onClick={() => setFacility(f.id)}
                      >
                        <b>{f.name}</b>
                        <span>
                          {f.category} · approximately {f.distance.toFixed(1)}{" "}
                          km straight-line (synthetic)
                        </span>
                        {facility === f.id && (
                          <small>
                            {previewLabel}. Example status: operating. Example
                            date: 2026. Not travel time, capacity, eligibility
                            or service access. Distance is demonstrative.
                          </small>
                        )}
                      </button>
                    ))}
                    {!list.length && <p>No categories selected.</p>}
                  </>
                )}
              </section>
            ) : (
              <>
                <h3>{metric?.label ?? "Indicator evidence"}</h3>
                {!enabled ? (
                  <p>
                    This live indicator is not verified for display. No
                    measurements or substitute layer are shown. Explore full UI
                    preview to use this feature.
                  </p>
                ) : (
                  <>
                    {metric && <p>{metric.definition}</p>}
                    {!["age", "race"].includes(remember[mode]) &&
                      places.map((p) => {
                        const o =
                          loadedKey === evidenceKey
                            ? observations[p.id]
                            : undefined;
                        return (
                          <section className="measurement" key={p.id}>
                            <div>
                              <b>
                                {p.id} · {p.selection.place}
                              </b>
                              <small>{p.selection.tractId}</small>
                            </div>
                            <strong className="measurement-value">
                              {fmt(o?.rawValue)} <small>{metric?.unit}</small>
                            </strong>
                            {metric?.percentileField && (
                              <>
                                <div
                                  className="data-track"
                                  aria-label={`${fmt(o?.percentile)} percentile`}
                                >
                                  <i
                                    style={{ width: `${o?.percentile ?? 0}%` }}
                                  />
                                </div>
                                <small>
                                  {fmt(o?.percentile)} percentile ·{" "}
                                  {o?.measurementPeriod ?? "Loading evidence…"}
                                </small>
                              </>
                            )}
                            <p>
                              {p.id === refPlace?.id
                                ? "Reference location"
                                : loadedKey !== evidenceKey ||
                                    differences[p.id] == null
                                  ? "Difference unavailable: missing or incompatible evidence."
                                  : `${fmt(differences[p.id])} ${metric?.unit} relative to ${refPlace?.id}${differences[p.id] === 0 ? " · same measured value" : ""}`}
                            </p>
                            {refPlace &&
                              p.id !== refPlace.id &&
                              p.selection.tractId ===
                                refPlace.selection.tractId && (
                                <small>
                                  Same tract observations; distinct address
                                  pins.
                                </small>
                              )}
                          </section>
                        );
                      })}
                    {preview && ["age", "race"].includes(remember[mode]) && (
                      <section aria-label="Population composition">
                        <p>
                          Neutral synthetic composition · percent of example
                          population
                        </p>
                        {places.map((p) => (
                          <section key={p.id}>
                            <h3>
                              {p.id} · {p.selection.place}
                            </h3>
                            {composition(
                              p.selection.tractId,
                              remember[mode],
                            ).map((c) => (
                              <div className="composition" key={c.label}>
                                <span>
                                  {c.label} ·{" "}
                                  {scenario === "missing" && p.id === "2"
                                    ? "Unavailable"
                                    : c.value + "%"}
                                </span>
                                <div className="data-track">
                                  <i
                                    style={{
                                      width:
                                        (scenario === "missing" && p.id === "2"
                                          ? 0
                                          : c.value) + "%",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </section>
                        ))}
                      </section>
                    )}
                    <details className="source-details">
                      <summary>Definition, period & sources</summary>
                      <p>{metric?.definition}</p>
                      <p>
                        Measurement: {metric?.measurementPeriod ?? "Unverified"}
                        .{" "}
                        {preview
                          ? previewLabel
                          : "Release: July 2026; geography: 2020 census tracts."}
                      </p>
                      {metric?.definitionSource && (
                        <a
                          href={metric.definitionSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Official indicator source ↗
                        </a>
                      )}
                      <p>
                        Tract context is not a property measurement, causal
                        explanation or personal health prediction. Percentiles
                        are statewide positions, not percent change.
                      </p>
                    </details>
                  </>
                )}
              </>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
