import {
  type Indicator,
  type Observation,
  type Place,
  format,
} from "../frontend/provider";
import { placeColors } from "../map-theme";
import { Icon } from "./Icon";
export default function ComparisonOverview({
  places,
  metrics,
  observe,
  onChoose,
  mode,
}: {
  places: Place[];
  metrics: Indicator[];
  observe: (p: Place, id: string) => Observation | undefined;
  onChoose: (id: string) => void;
  mode: string;
}) {
  const rows = metrics.map((m) => {
    const entries = places.map((p) => ({ p, o: observe(p, m.id) }));
    const valid = entries.every(
      (x) =>
        x.o?.percentile != null &&
        x.o.comparisonKey === entries[0].o?.comparisonKey,
    );
    const values = entries.map((x) => x.o?.percentile ?? 0);
    return {
      m,
      entries,
      gap: valid ? Math.max(...values) - Math.min(...values) : null,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
  const ready = rows.filter((r) => r.gap !== null),
    widest = [...ready].sort((a, b) => b.gap! - a.gap!)[0],
    closest = [...ready].sort((a, b) => a.gap! - b.gap!)[0];
  return (
    <div className="evidence-layout overview-layout">
      <div className="narrative">
        <h2>
          What changes
          <br />
          between places?
        </h2>
        <p>
          {mode === "Environment"
            ? "Six environmental measures, seen together."
            : mode === "Health"
              ? "Population health, across the same measures."
              : "Community context, without an overall ranking."}{" "}
          Follow a line to explore the evidence.
        </p>
        <div className="overview-findings">
          {widest && (
            <button onClick={() => onChoose(widest.m.id)}>
              <span>Widest percentile spread</span>
              <strong>
                {widest.m.label}
                <Icon name="chevron" size={15} />
              </strong>
              <small>{format(widest.gap)} percentile points</small>
            </button>
          )}
          {closest && closest !== widest && (
            <button onClick={() => onChoose(closest.m.id)}>
              <span>Closest percentile positions</span>
              <strong>
                {closest.m.label}
                <Icon name="chevron" size={15} />
              </strong>
              <small>{format(closest.gap)} percentile points</small>
            </button>
          )}
        </div>
        <p className="overview-caveat">
          These gaps are descriptive, not a ranking of importance or a test of
          significance. Missing or incompatible evidence is excluded.
        </p>
      </div>
      <div className="profile-chart">
        <div className="profile-legend">
          {places.map((p) => (
            <span
              className="profile-place"
              key={p.id}
              style={
                {
                  "--place":
                    placeColors[(Number(p.id) - 1) % placeColors.length],
                } as React.CSSProperties
              }
            >
              <b>{String.fromCharCode(64 + Number(p.id))}</b>
              {p.selection.place}
            </span>
          ))}
          <span>Statewide percentiles</span>
        </div>
        <div className="profile-rows">
          {rows.map(({ m, entries, gap, min, max }) => (
            <button
              className="profile-row"
              key={m.id}
              onClick={() => onChoose(m.id)}
              aria-label={`Explore ${m.label}`}
            >
              <span className="profile-name">{m.label}</span>
              <span className="profile-track">
                <span className="profile-grid" />
                {gap !== null && (
                  <span
                    className="profile-range"
                    style={{ left: `${min}%`, width: `${max - min}%` }}
                  />
                )}
                {entries.map(({ p, o }, i) =>
                  o?.percentile == null ? null : (
                    <span
                      className="profile-point"
                      key={p.id}
                      style={{
                        left: `${o.percentile}%`,
                        top:
                          places.length > 2 ? `${8 + (i % 3) * 5}px` : "12px",
                        background:
                          placeColors[(Number(p.id) - 1) % placeColors.length],
                      }}
                      title={`${p.selection.place}: ${format(o.percentile)} percentile`}
                    >
                      {String.fromCharCode(64 + Number(p.id))}
                    </span>
                  ),
                )}
              </span>
              <span className="profile-gap">
                {gap === null ? "Unavailable" : format(gap) + " pts"}
                <Icon name="chevron" size={13} />
              </span>
            </button>
          ))}
        </div>
        <div className="profile-axis">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
        <p className="score-note">
          Each row is a separate measure. A higher position means a higher
          recorded value for that measure, not a less safe place.
        </p>
      </div>
    </div>
  );
}
