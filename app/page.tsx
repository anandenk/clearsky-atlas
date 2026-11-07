"use client";
import { palette } from "../src/map-theme";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { indicators, numberValue, compare, Selection } from "../src/domain";
const AtlasMap = dynamic(() => import("../src/AtlasMap"), {
  ssr: false,
  loading: () => <div className="map-shell loading">Preparing the atlas…</div>,
});
const metric = indicators.pm;
function Address({
  letter,
  value,
  onChange,
}: {
  letter: string;
  value: Selection | null;
  onChange: (s: Selection | null) => void;
}) {
  const [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [candidates, setCandidates] = useState<Selection[]>([]);
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    generation.current++;
    abort.current?.abort();
    setBusy(false);
    setQuery(value?.label ?? "");
    setCandidates([]);
    setError("");
  }, [value]);
  useEffect(() => () => abort.current?.abort(), []);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    const id = ++generation.current;
    abort.current?.abort();
    abort.current = new AbortController();
    setBusy(true);
    setError("");
    setCandidates([]);
    try {
      const r = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: query }),
        signal: abort.current.signal,
      });
      const d = await r.json();
      if (id !== generation.current) return;
      if (d.error) throw Error(d.error);
      const valid = d.candidates.filter(
        (c: Selection & { error?: string }) => !c.error,
      );
      if (!valid.length)
        throw Error(d.candidates[0]?.error ?? "No covered tract found.");
      setCandidates(valid);
    } catch (e) {
      if (id === generation.current && (e as Error).name !== "AbortError")
        setError((e as Error).message);
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  return (
    <section className="address">
      <form onSubmit={search}>
        <label htmlFor={"address-" + letter}>
          <span className={"identity " + letter}>{letter}</span>{" "}
          {letter === "A" ? "First address" : "Compare with"}
        </label>
        <div className="address-input">
          <input
            id={"address-" + letter}
            value={query}
            onChange={(e) => {
              generation.current++;
              abort.current?.abort();
              setBusy(false);
              setCandidates([]);
              setQuery(e.target.value);
            }}
            placeholder="Street address, city, CA"
            required
            maxLength={240}
          />
          <button disabled={busy} aria-label={"Find address " + letter}>
            {busy ? "…" : "↗"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={"Clear address " + letter}
            >
              ×
            </button>
          )}
        </div>
      </form>
      {value && (
        <small>
          {value.cached ? "Verified cached example" : "Confirmed Census match"}{" "}
          · address-range estimate
        </small>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {candidates.length > 0 && (
        <div className="candidates">
          <p>
            Confirm the Census match. Coordinates are estimated along a street.
          </p>
          {candidates.map((c) => (
            <button key={c.label} onClick={() => onChange(c)}>
              {c.label} <span>Use match →</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
function Value({
  location,
  letter,
}: {
  location: Selection | null;
  letter: string;
}) {
  const v = numberValue(location?.observations.pm),
    p = numberValue(location?.observations.pmP);
  return (
    <div className="value">
      <div className="value-title">
        <span className={"identity " + letter}>{letter}</span>
        <span>{location?.place ?? "No location selected"}</span>
      </div>
      <p className="big-number">
        {v === null ? "—" : v.toFixed(2)} <span>{metric.unit}</span>
      </p>
      <p className="percentile">
        {p === null ? "Percentile unavailable" : `${p.toFixed(1)} percentile`}{" "}
        <span>in California</span>
      </p>
      <p className="period">{metric.period} · tract estimate</p>
    </div>
  );
}
export default function Page() {
  const [places, setPlaces] = useState<(Selection | null)[]>([null, null]),
    [ready, setReady] = useState(false),
    [failure, setFailure] = useState(""),
    [tab, setTab] = useState(0),
    [evidence, setEvidence] = useState(false),
    [coverage, setCoverage] = useState(false);
  const initial = useRef(false);
  async function loadDemo() {
    setFailure("");
    try {
      const r = await fetch("/api/demo");
      if (!r.ok) throw Error();
      setPlaces(await r.json());
    } catch {
      setFailure(
        "Cached examples could not load. Check that data preparation has completed.",
      );
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    if (!initial.current) {
      initial.current = true;
      loadDemo();
    }
  }, []);
  const a = numberValue(places[0]?.observations.pm),
    b = numberValue(places[1]?.observations.pm),
    diff = compare(a, b),
    same = places[0] && places[1] && places[0].tractId === places[1].tractId;
  function change(i: number, s: Selection | null) {
    setPlaces((p) => p.map((v, j) => (i === j ? s : v)));
  }
  return (
    <main>
      <header className="masthead">
        <a
          className="brand"
          href="/"
          aria-label="California Environmental Atlas home"
        >
          <svg viewBox="0 0 32 40" aria-hidden="true">
            <path d="M8 2h10v15l12 16-8 5-8-7-2-10-6-9z" />
          </svg>
          <span>
            California
            <br />
            <b>Environmental Atlas</b>
          </span>
        </a>
        <div className="edition">
          A FIELD GUIDE TO PLACE
          <br />
          <span>California · Local edition 01</span>
        </div>
        <button
          className="text-button"
          onClick={() => setCoverage(!coverage)}
          aria-expanded={coverage}
        >
          Coverage & sources <span>↗</span>
        </button>
      </header>
      <div className="intro">
        <div>
          <p className="eyebrow">TWO PLACES. THE SAME LENS.</p>
          <h1>What changes from here to there?</h1>
        </div>
        <p>
          Look closer at the places we live.
          <br />
          Compare the evidence, one layer at a time.
        </p>
      </div>
      <div className="search-row">
        <Address letter="A" value={places[0]} onChange={(s) => change(0, s)} />
        <button
          className="swap"
          onClick={() => setPlaces(([a, b]) => [b, a])}
          aria-label="Swap addresses"
        >
          ⇄
        </button>
        <Address letter="B" value={places[1]} onChange={(s) => change(1, s)} />
        <button className="examples" onClick={loadDemo}>
          Try example pair <span>↗</span>
        </button>
      </div>
      {failure && (
        <p className="error" role="alert">
          {failure}
        </p>
      )}
      {coverage && (
        <section className="coverage">
          <h2>A growing atlas, with visible boundaries.</h2>
          <p>
            CES 5.0 covers 9,106 California census tracts using 2020 boundaries.
            This initial increment renders PM2.5. Health, community,
            infrastructure, and the remaining environmental indicators stay in
            the full project scope; they are not yet interactive layers.
          </p>
          <p>
            Source:{" "}
            <a
              href="https://publish.data.ca.gov/dataset/calenviroscreen-5-0"
              target="_blank"
              rel="noreferrer"
            >
              OEHHA / CalEnviroScreen 5.0
            </a>
            . Released July 2026. Public access; catalog rights say no
            restrictions on public use, with no named license. New address
            searches are sent to the US Census Bureau; the app does not persist
            them.
          </p>
          <p>
            Map tiles: © OpenStreetMap contributors. Examples are previously
            verified public civic addresses, cached for repeatable local use.
            Live geocoding needs internet and may fail.
          </p>
        </section>
      )}
      <section className="atlas">
        <div className="toolbar">
          <div className="mode">
            <span className="active">01 Environment</span>
            <span>Health</span>
            <span>Community</span>
            <span>Infrastructure</span>
          </div>
          <button className="text-button" onClick={() => setCoverage(true)}>
            Layer coverage ↗
          </button>
        </div>
        <div className="layer-row">
          <div>
            <span className="eyebrow">AIR AROUND THESE PLACES</span>
            <h2>Fine particles, different places.</h2>
          </div>
          <div className="metric-label">
            <strong>PM2.5</strong>
            <span>Annual mean · 2022–2024</span>
          </div>
        </div>
        <div className="mobile-tabs" aria-label="Visible map">
          {["A", "B"].map((l, i) => (
            <button key={l} aria-pressed={tab === i} onClick={() => setTab(i)}>
              Map {l} · {places[i]?.place ?? "Select"}
            </button>
          ))}
        </div>
        <div className="maps">
          {[0, 1].map((i) => (
            <div className={"map-pane " + (tab === i ? "visible" : "")} key={i}>
              {ready ? (
                <AtlasMap letter={i === 0 ? "A" : "B"} location={places[i]} />
              ) : (
                <div className="map-shell loading">Loading local evidence…</div>
              )}
            </div>
          ))}
        </div>
        <div className="legend">
          <span>PM2.5 · California percentile</span>
          <div className="scale">
            <div className="swatches">
              {palette.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </div>
            <div className="ticks">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
          <span className="legend-note">
            <i /> Missing data
          </span>
          <span className="shared">One scale, both maps</span>
        </div>
      </section>
      <section className="evidence-band" aria-busy={!ready}>
        <div className="reading">
          <p className="eyebrow">READING THE DIFFERENCE</p>
          <h2>
            {same
              ? "Two addresses. One tract."
              : diff === null
                ? "Choose two places to compare."
                : Math.abs(diff) < 0.005
                  ? "The estimates are nearly equal."
                  : `${diff > 0 ? "B" : "A"} has a higher PM2.5 estimate.`}
          </h2>
          <p>
            {same
              ? "Both addresses share the same tract-level observation. This dataset cannot distinguish conditions at these two properties."
              : diff === null
                ? "A comparison needs two non-missing observations from the same source, period, and definition."
                : `${Math.abs(diff).toFixed(2)} µg/m³ ${diff >= 0 ? "higher at B than A" : "higher at A than B"}, using the same 2022–2024 method. The data describe a difference; they do not establish its cause.`}
          </p>
        </div>
        <Value letter="A" location={places[0]} />
        <Value letter="B" location={places[1]} />
      </section>
      <section className="distribution">
        <div>
          <p className="eyebrow">A SHARED FRAME OF REFERENCE</p>
          <p>Where these tracts sit in California</p>
        </div>
        <div className="distribution-track">
          <div className="distribution-line" />
          {places.map((p, i) => {
            const n = numberValue(p?.observations.pmP);
            return n === null ? null : (
              <span
                key={i}
                className={"distribution-pin d" + i}
                style={{ left: n + "%" }}
              >
                {i === 0 ? "A" : "B"}
                <small>{n.toFixed(1)}</small>
              </span>
            );
          })}
          <span className="end low">Lower concentration</span>
          <span className="end high">Higher concentration</span>
        </div>
        <p className="dist-note">
          Percentile is a relative position,
          <br />
          not a concentration or health risk.
        </p>
      </section>
      <section className="source-section">
        <button
          className="source-toggle"
          onClick={() => setEvidence(!evidence)}
          aria-expanded={evidence}
        >
          <span>
            <span className="eyebrow">BEHIND THIS LAYER</span>
            <strong>Definition, sources & limits</strong>
          </span>
          <span>{evidence ? "−" : "+"}</span>
        </button>
        {evidence && (
          <div className="source-detail">
            <div>
              <h3>The measurement</h3>
              <p>{metric.definition}</p>
              <p>{metric.limitation}</p>
            </div>
            <div>
              <h3>The evidence</h3>
              <p>
                OEHHA · CalEnviroScreen 5.0 final · July 1, 2026. Raw fields: pm
                / pmP. Measurement period: 2022–2024. Both maps use the source
                percentile on a fixed 0–100 scale. No percentiles are calculated
                by this app.
              </p>
              <a href={metric.source} target="_blank" rel="noreferrer">
                Read the official indicator definition ↗
              </a>
              <p>
                Concentrations are displayed in the standard PM unit µg/m³. Unit
                corroboration against the final technical report remains pending
                because its download returned a security page.
              </p>
              <p>
                Membership uses full-resolution CES boundaries in WGS84,
                separate from the 30 m simplified display. Boundary ambiguity or
                a disagreement with Census is withheld for review.
              </p>
            </div>
          </div>
        )}
      </section>
      <footer>
        <span>CALIFORNIA ENVIRONMENTAL ATLAS</span>
        <p>Understand places. Keep the evidence in view.</p>
        <span>Tract context, not personal risk.</span>
      </footer>
    </main>
  );
}
