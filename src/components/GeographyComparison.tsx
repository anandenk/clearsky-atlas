import {
  type Place,
  type Indicator,
  type Observation,
  format,
  delta,
  differenceUnit,
} from "../frontend/provider";
import { placeColors } from "../map-theme";
export default function GeographyComparison({
  places,
  left,
  right,
  metric,
  observe,
  onPair,
  onClose,
  onEvidence,
  matchingRelief,
  measures,
  requestedMetric,
  onMeasure,
}: {
  measures: Indicator[];
  requestedMetric?: Indicator;
  onMeasure: (id: string) => void;
  places: Place[];
  left: Place;
  right: Place;
  metric?: Indicator;
  observe: (p: Place, id?: string) => Observation | undefined;
  onPair: (side: "left" | "right", id: string) => void;
  onClose: () => void;
  onEvidence: () => void;
  matchingRelief: boolean;
}) {
  const a = observe(left, metric?.id),
    b = observe(right, metric?.id),
    difference = delta(a, b);
  return (
    <section
      className="geography-comparison"
      aria-label="Geographic comparison"
    >
      <div className="geography-actions">
        <span>Linked geography</span>
        {measures.length > 0 && (
          <select
            aria-label="Comparison measure"
            value={requestedMetric?.id || ""}
            onChange={(e) => onMeasure(e.target.value)}
          >
            {measures.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}
        <button onClick={onEvidence}>Evidence</button>
        <button onClick={onClose}>One map</button>
      </div>
      {(
        [
          ["left", left, a],
          ["right", right, b],
        ] as const
      ).map(([side, place, observation]) => (
        <div className={`geography-place geography-${side}`} key={side}>
          <label>
            <span
              style={{
                background: placeColors[(+place.id - 1) % placeColors.length],
                  color: "#fff",
              }}
            >
              {String.fromCharCode(64 + +place.id)}
            </span>
            <select
              aria-label={`${side === "left" ? "Left" : "Right"} comparison place`}
              value={place.id}
              onChange={(e) => onPair(side, e.target.value)}
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.selection.label}
                </option>
              ))}
            </select>
          </label>
          {metric && (
            <p>
              <strong>
                {format(observation?.rawValue ?? null, metric.id)}
              </strong>{" "}
              {metric.unit} <span>{metric.label}</span>
            </p>
          )}
        </div>
      ))}
      <div className="geography-caption">
        {requestedMetric?.id !== metric?.id && (
          <span role="status">
            Waiting for both views to load the selected measure.
          </span>
        )}
        <span>
          Zoom, tilt and rotation move together. Pan each place independently.
        </span>
        {metric && (
          <span>
            {difference === null
              ? "Comparable difference unavailable"
              : `${String.fromCharCode(64 + +right.id)} − ${String.fromCharCode(64 + +left.id)}: ${difference > 0 ? "+" : ""}${format(difference, metric.id)} ${differenceUnit(metric)}`}
            {left.selection.tractId === right.selection.tractId
              ? " · Same tract; addresses share tract-level evidence"
              : ""}
          </span>
        )}
        {!matchingRelief && (
          <span role="status">
            Relief is adjusting to a shared height scale.
          </span>
        )}
      </div>
    </section>
  );
}
