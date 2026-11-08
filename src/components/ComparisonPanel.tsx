import {
  type Indicator,
  type Observation,
  type Place,
  format,
  delta,
  compatible,
  differenceUnit,
} from "../frontend/provider";
import { placeColors } from "../map-theme";
import { Icon } from "./Icon";
const color = (p: Place) => placeColors[(+p.id - 1) % placeColors.length];
const letter = (p: Place) => String.fromCharCode(64 + +p.id);
function extent(
  places: Place[],
  observe: (p: Place, id: string) => Observation | undefined,
  id: string,
) {
  const entries = places.map((p) => ({ p, o: observe(p, id) }));
  const valid = entries.every(
    (e) =>
      e.o?.rawValue != null &&
      !!e.o.comparisonKey &&
      compatible(e.o, entries[0].o),
  );
  const sorted = valid
    ? [...entries].sort((a, b) => a.o!.rawValue! - b.o!.rawValue!)
    : [];
  const low = sorted[0],
    high = sorted.at(-1);
  return {
    entries,
    low,
    high,
    gap: low && high ? high.o!.rawValue! - low.o!.rawValue! : null,
  };
}
export default function ComparisonPanel({
  places,
  metrics,
  metric,
  observe,
  overview,
  onChoose,
  onOverview,
  onSource,
  onFocus,
  reference,
  topics,
  selectedTopic,
  onTopic,
  preview,
  mode,
  errors,
  onRetry,
}: {
  places: Place[];
  metrics: Indicator[];
  metric: Indicator | undefined;
  observe: (p: Place, id: string) => Observation | undefined;
  overview: boolean;
  onChoose: (id: string) => void;
  onOverview: () => void;
  onSource: () => void;
  onFocus: (id: string) => void;
  reference: string;
  topics: { id: string; label: string }[];
  selectedTopic: string;
  onTopic: (id: string) => void;
  preview: boolean;
  mode: string;
  errors: string[];
  onRetry: () => void;
}) {
  const m = metric,
    ref = places.find((p) => p.id === reference) || places[0];
  const result = m ? extent(places, observe, m.id) : null;
  const same = new Set(places.map((p) => p.selection.tractId)).size === 1;
  return (
    <div className="comparison-compass">
      <header className="compass-heading">
        <div>
          <h2>
            {overview ? "Places in perspective" : m?.label || "Your place"}
          </h2>
          <p>
            {preview
              ? "Synthetic preview"
              : overview
                ? `${mode} · ${places.length} selected places`
                : m?.measurementPeriod}
          </p>
        </div>
        <button onClick={onSource} aria-label="About the evidence">
          <Icon name="info" size={19} />
        </button>
      </header>
      <div className="compass-navigation">
        <button onClick={onOverview} aria-pressed={overview}>
          At a glance
        </button>
        <label>
          <span className="sr-only">Choose a measure</span>
          <select
            value={selectedTopic}
            onChange={(e) => onTopic(e.target.value)}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {overview ? (
        <>
          <div
            className={`compass-places ${places.length > 3 ? "many-places" : ""}`}
          >
            {places.map((p) => (
              <button
                key={p.id}
                onClick={() => onFocus(p.id)}
                title={p.selection.label}
              >
                <b style={{ background: color(p) }}>{letter(p)}</b>
                <span>{p.selection.place}</span>
              </button>
            ))}
          </div>
          {places.length > 3 && (
            <p className="index-explanation">
              Lowest and highest values shown. Open a measure for all{" "}
              {places.length} places.
            </p>
          )}
          <div className="measure-index">
            {metrics.map((metric) => {
              const r = extent(places, observe, metric.id);
              const compact = places.length > 3;
              const entries = compact
                ? r.low && r.high
                  ? [r.low, r.high]
                  : []
                : r.entries;
              return (
                <button
                  className="index-measure"
                  key={metric.id}
                  onClick={() => onChoose(metric.id)}
                  aria-label={`Explore ${metric.label}`}
                >
                  <span className="index-heading">
                    <strong>{metric.label}</strong>
                    <span className="index-direction">
                      {places.length < 2
                        ? ""
                        : r.gap === null
                          ? "Incomplete"
                          : r.gap === 0
                            ? "Same"
                            : `${letter(r.high!.p)} higher`}
                      <Icon name="chevron" size={13} />
                    </span>
                  </span>
                  {compact && !entries.length && (
                    <span className="index-range">
                      Range unavailable · open individual readings
                    </span>
                  )}
                  <span
                    className={`index-values ${entries.length === 3 ? "three-values" : ""}`}
                  >
                    {entries.map(({ p, o }, i) => (
                      <span key={`${p.id}-${i}`} style={{ color: color(p) }}>
                        <b>{letter(p)}</b>
                        <strong>{format(o?.rawValue, metric.id)}</strong>
                      </span>
                    ))}
                    <small>{metric.unit}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="compass-footnote">
            {same && places.length > 1
              ? "Same tract. These addresses share area-level evidence."
              : "Values describe census tracts, not individual properties."}{" "}
            Select a measure for the difference and its meaning.
          </p>
        </>
      ) : (
        <>
          <div className="compass-finding">
            {places.length < 2 ? (
              <p>Add another place to discover what changes.</p>
            ) : result?.gap == null ? (
              <p>
                Matching evidence is needed. Missing or incompatible values have
                no calculated difference.
              </p>
            ) : result.gap === 0 ? (
              <>
                <strong>Same recorded value</strong>
                <p>
                  {same
                    ? "These addresses share one census tract."
                    : "All selected places match on this measure."}
                </p>
              </>
            ) : (
              <>
                <strong>
                  {format(result.gap, m?.id)}{" "}
                  <small>{differenceUnit(m)} apart</small>
                </strong>
                <p>
                  <b>{result.high!.p.selection.place}</b> is higher than{" "}
                  <b>{result.low!.p.selection.place}</b>
                  {places.length > 2 ? " — the widest gap here" : ""}.
                </p>
              </>
            )}
          </div>
          <div className="compass-scale-label">
            {m?.percentileField
              ? "Statewide position · 0–100 percentile"
              : "Population share · 0–100%"}
          </div>
          <div className="place-readings">
            {places.map((p) => {
              const o = m ? observe(p, m.id) : undefined,
                d = delta(m && ref ? observe(ref, m.id) : undefined, o),
                position = m?.percentileField ? o?.percentile : o?.rawValue;
              return (
                <div
                  className="place-reading"
                  key={p.id}
                  style={{ "--place": color(p) } as React.CSSProperties}
                >
                  <button
                    onClick={() => onFocus(p.id)}
                    title={p.selection.label}
                  >
                    <b>{letter(p)}</b>
                    <span>{p.selection.place}</span>
                  </button>
                  <strong className="reading-value">
                    {format(o?.rawValue, m?.id)}
                  </strong>
                  <div
                    className="reading-track"
                    aria-label={`${p.selection.place}: ${format(position)} ${m?.percentileField ? "statewide percentile" : "percent population"}`}
                  >
                    <i style={{ width: `${position ?? 0}%` }} />
                  </div>
                  <small>
                    {position == null
                      ? "Position unavailable"
                      : `${format(position)}${m?.percentileField ? " percentile" : "% of population"}`}
                  </small>
                  <small className="reading-delta">
                    {p.id === ref?.id
                      ? "Reference"
                      : d == null
                        ? "Difference unavailable"
                        : `${d > 0 ? "+" : ""}${format(d, m?.id)} vs ${letter(ref)}`}
                  </small>
                </div>
              );
            })}
          </div>
          <p className="reading-units">
            Recorded values in {m?.unit}. Differences use {differenceUnit(m)}.
          </p>
          <details className="compass-definition">
            <summary>What does this measure?</summary>
            <p>{m?.definition}</p>
            <button onClick={onSource}>
              Full definition & source <Icon name="arrow" size={15} />
            </button>
          </details>
          <p className="compass-footnote">
            {mode === "Health"
              ? "Population rates are not personal disease probabilities. "
              : mode === "Community"
                ? "Demographic shares are not hazards. "
                : ""}
            Differences are descriptive, not a test of significance.
          </p>
        </>
      )}
      {errors.length > 0 && (
        <p className="error" role="alert">
          {errors[0]} <button onClick={onRetry}>Retry evidence</button>
        </p>
      )}
    </div>
  );
}
