import { type Indicator, type Observation, type Place, format, differenceUnit } from "../frontend/provider";
import { placeColors } from "../map-theme";
import { Icon } from "./Icon";
export default function ComparisonOverview({ places, metrics, observe, onChoose, mode }: {
  places: Place[]; metrics: Indicator[];
  observe: (p: Place, id: string) => Observation | undefined;
  onChoose: (id: string) => void; mode: string;
}) {
  const rows = metrics.map(m => {
    const entries = places.map(p => ({p, o: observe(p, m.id)}));
    const compatible = entries.every(x => x.o?.rawValue != null && !!x.o.comparisonKey && x.o.comparisonKey === entries[0].o?.comparisonKey);
    const sorted = compatible ? [...entries].sort((a,b) => a.o!.rawValue! - b.o!.rawValue!) : [];
    const low = sorted[0], high = sorted.at(-1);
    const gap = low && high ? high.o!.rawValue! - low.o!.rawValue! : null;
    const positions = entries.map(x => x.o?.percentile);
    const spread = compatible && positions.every(v => v != null) ? Math.max(...positions as number[]) - Math.min(...positions as number[]) : null;
    return {m, entries, gap, low, high, spread};
  });
  const ranked = rows.filter(r => r.spread != null).sort((a,b) => b.spread! - a.spread!);
  const hasPercentiles = metrics.some(m => m.percentileField);
  const same = new Set(places.map(p => p.selection.tractId)).size === 1;
  return <div className="field-guide">
    <div className="guide-intro">
      <div><h2>Different places.<br/>A clearer picture.</h2><p>{mode === "Health" ? "Population health describes communities, not your individual chances of illness." : mode === "Community" ? "Community conditions describe who lives here and the pressures households face. They are not a neighborhood grade." : "Read the measurements side by side. Each tells a different part of the environmental story."}</p></div>
      <div className="guide-findings">
        {same ? <p><strong>Shared tract, shared evidence.</strong>These addresses use the same area-level observations.</p> : ranked.length > 0 ? <>
          <button onClick={() => onChoose(ranked[0].m.id)}><span>Further apart in statewide position</span><strong>{ranked[0].m.label}<Icon name="arrow" size={18}/></strong><span>{format(ranked[0].spread)} percentile points between selected tracts</span></button>
          {ranked.length > 1 && <button onClick={() => onChoose(ranked.at(-1)!.m.id)}><span>Closer in statewide position</span><strong>{ranked.at(-1)!.m.label}<Icon name="arrow" size={18}/></strong><span>{format(ranked.at(-1)!.spread)} percentile points apart; not necessarily equivalent</span></button>}
        </> : <p><strong>Matching evidence is needed.</strong>Missing or incompatible observations have no calculated difference.</p>}
      </div>
    </div>
    <p className="guide-instruction">Actual values below. Color identifies a place, never a winner. Scroll across for more places.</p>
    <div className="guide-scroll" tabIndex={0} role="region" aria-label="Measurements by place">
      <table className="guide-table">
        <thead><tr><th scope="col">Measure & meaning</th>{places.map(p => <th scope="col" key={p.id}><span className="guide-place"><b style={{background:placeColors[(+p.id-1)%placeColors.length]}}>{String.fromCharCode(64 + +p.id)}</b>{p.selection.place}</span><small title={p.selection.label}>{p.selection.label}</small></th>)}<th scope="col">What differs here?</th></tr></thead>
        <tbody>{rows.map(({m, entries, gap, low, high}) => <tr className="profile-row" key={m.id}>
          <th scope="row"><button onClick={() => onChoose(m.id)} aria-label={`Explore ${m.label}`}><strong>{m.label}</strong><Icon name="arrow" size={16}/></button><small>{m.measurementPeriod}</small></th>
          {entries.map(({p,o}) => <td key={p.id} data-place={String.fromCharCode(64 + +p.id) + " · " + p.selection.place} style={{"--place":placeColors[(+p.id-1)%placeColors.length]} as React.CSSProperties}><strong className="guide-value">{format(o?.rawValue,m.id)}</strong><span className="guide-unit">{m.unit}</span>{o?.percentile != null && <div className="guide-position"><div><i style={{width:`${o.percentile}%`}}/></div><span>{format(o.percentile)} / 100 statewide percentile</span></div>}</td>)}
          <td className="guide-meaning">{gap === null ? <><strong>Difference unavailable</strong><p>Missing or incompatible evidence. No value is treated as zero.</p></> : gap === 0 ? <><strong>Same recorded value</strong><p>{same ? "Same census tract; not necessarily the same property conditions." : "These tract observations match on this measure."}</p></> : <><strong>{format(gap,m.id)} <span>{differenceUnit(m)}</span></strong><p>{high!.p.selection.place} is higher than {low!.p.selection.place}{places.length > 2 ? "; the widest difference in this selection" : ""}.</p></>}<button onClick={() => onChoose(m.id)}>Explore measure <Icon name="chevron" size={14}/></button></td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="guide-note">{hasPercentiles ? "Percentiles show relative position among California tracts for each measure. " : "Population shares describe each group, without a hazard ranking. "}Gaps are descriptive, not statistical significance, personal risk or a ranking of importance. Tract observations do not describe individual properties.</p>
  </div>;
}
