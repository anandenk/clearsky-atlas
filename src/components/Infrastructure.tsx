import { type Place, format } from "../frontend/provider";
import { type FacilityResult, type Facility } from "../hooks/useFacilities";
import { categories } from "../frontend/fixtures/preview";
import { placeColors } from "../map-theme";
import Dialog from "./Dialog";
import { Icon } from "./Icon";
export default function Infrastructure({
  places,
  selected,
  result,
  preview,
  filter,
  setFilter,
  facility,
  onFacility,
  onFocus,
  switchProvider,
}: {
  places: Place[];
  selected: Place | undefined;
  result: (p: Place | undefined) => FacilityResult | undefined;
  preview: boolean;
  filter: string[];
  setFilter: (f: string[]) => void;
  facility: string;
  onFacility: (f: string) => void;
  onFocus: (id: string) => void;
  switchProvider: () => void;
}) {
  const data = result(selected),
    list = data?.items.filter((f) => filter.includes(f.category)) || [],
    chosen = list.find((f) => f.id === facility);
  const pick = (f: Facility) => {
    onFacility(f.id);
    if (selected) onFocus(selected.id);
  };
  return (
    <div className="infrastructure-content">
      <div className="narrative">
        <h2>
          What’s around
          <br />
          this place?
        </h2>
        <p>
          Explore nearby locations, then look at what each one actually
          provides. Straight-line distance is not service access.
        </p>
        <div className="infrastructure-sources">
          <span>
            {preview ? "Synthetic locations" : "Healthcare: CDPH · 2026-10-16"}
          </span>
          {!preview && <span>Schools: CDE · 2025–26</span>}
        </div>
        {!preview && (
          <div className="power-preview">
            <strong>Power plants</strong>
            <p>
              Live power inventory is not connected. Explore synthetic examples
              in a separate preview.
            </p>
            <button onClick={switchProvider}>
              Open full preview
              <Icon name="arrow" size={15} />
            </button>
          </div>
        )}
      </div>
      <div className="facilities-content">
        <div className="facility-filters">
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={filter.includes(c)}
              onClick={() =>
                setFilter(
                  filter.includes(c)
                    ? filter.filter((v) => v !== c)
                    : [...filter, c],
                )
              }
            >
              {filter.includes(c) && <Icon name="check" size={14} />} {c}
              {!preview && c === "Power plants" && <small>preview</small>}
            </button>
          ))}
        </div>
        {places.length > 1 && (
          <div className="facility-comparison">
            <p>How far are the nearest listed locations?</p>
            <div className="infrastructure-findings">
              {["Healthcare", "Public schools"].map(category => {
                const distances = places.map(p => ({p, f: result(p)?.items.find(f => f.category === category)}));
                const complete = distances.every(x => x.f?.distance != null);
                const sorted = complete ? [...distances].sort((a,b) => a.f!.distance! - b.f!.distance!) : [];
                const first = sorted[0], last = sorted.at(-1);
                return <p key={category}><strong>{category}</strong>{first && last ? `${format(first.f!.distance)}–${format(last.f!.distance)} km across these places. ${first.p.selection.place} has the nearest listed location in this selection.` : "Complete source coverage is needed to compare these places."}</p>;
              })}
            </div>
            <p className="distance-context">Straight-line distance to a source-listed point. A shorter distance does not establish availability, eligibility or travel time.</p>
            <div className="facility-compare-head">
              <span>Place</span>
              <span>Healthcare</span>
              <span>Public school</span>
            </div>
            {places.map((p) => (
              <button
                className={p.id === selected?.id ? "selected" : ""}
                key={p.id}
                onClick={() => onFocus(p.id)}
              >
                <span>
                  <i
                    style={{
                      background:
                        placeColors[(Number(p.id) - 1) % placeColors.length],
                    }}
                  />
                  {p.selection.place}
                </span>
                {["Healthcare", "Public schools"].map((c) => (
                  <span key={c}>
                    {result(p)
                      ? format(
                          result(p)?.items.find((f) => f.category === c)
                            ?.distance,
                        )
                      : "…"}
                  </span>
                ))}
              </button>
            ))}
          </div>
        )}
        <p className="facility-location">
          Around {selected?.selection.place} ·{" "}
          {preview
            ? "synthetic examples"
            : "up to 6 nearest per available category"}
        </p>
        <div className="facility-list">
          {list.map((f) => (
            <button
              className={facility === f.id ? "selected" : ""}
              key={f.id}
              onClick={() => pick(f)}
            >
              <span className="facility-symbol">
                <Icon
                  name={
                    f.category === "Healthcare" ? "Health" : "Infrastructure"
                  }
                />
              </span>
              <span>
                <strong>{f.name}</strong>
                <small>
                  {f.category} ·{" "}
                  {preview
                    ? "synthetic location"
                    : f.subtype || "Source category"}
                </small>
              </span>
              <b>
                {format(f.distance)}
                <small>km</small>
              </b>
            </button>
          ))}
        </div>
        {!data && (
          <p className="facility-location" role="status">
            Finding nearby locations…
          </p>
        )}
        {data && !list.length && (
          <p className="facility-location">
            No locations in the selected categories.{" "}
            {filter.includes("Power plants") && !preview
              ? "Power plants are available only in the separate synthetic preview."
              : "Choose another category."}
          </p>
        )}
        {data?.errors.map((e) => (
          <p className="error" role="alert" key={e}>
            {e} Other categories remain independent.
          </p>
        ))}
        <Dialog
          open={!!chosen}
          onClose={() => onFacility("")}
          title="About this location"
        >
          {chosen && (
            <div className="facility-detail">
              <strong>{chosen.name}</strong>
              <span>
                {chosen.status || "Status not provided"} ·{" "}
                {chosen.period || "Date not provided"}
              </span>
              <span>
                {chosen.coordinate.map((v) => v.toFixed(4)).join(", ")} ·{" "}
                {format(chosen.distance)} km straight-line
              </span>
              {chosen.flags.length > 0 && <p>{chosen.flags.join("; ")}</p>}
              <p>
                {chosen.category === "Healthcare"
                  ? "CDPH includes hospitals, clinics, laboratories, home-health agencies and other licensed or certified services. A marker does not mean walk-in care."
                  : "A published location does not establish current operation, attendance eligibility or capacity."}
              </p>
              <details>
                <summary>Source & limitations</summary>
                {chosen.limitations.map((l) => (
                  <p key={l}>{l}</p>
                ))}
                {chosen.sourceUrl && (
                  <a href={chosen.sourceUrl} target="_blank" rel="noreferrer">
                    {chosen.category === "Healthcare"
                      ? "CDPH healthcare source"
                      : "CDE school source"}
                  </a>
                )}
              </details>
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}
