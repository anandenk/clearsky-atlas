import type { Facility } from "../hooks/useFacilities";
import { format } from "../frontend/provider";
export default function FacilityDetail({ facility }: { facility: Facility }) {
  return (
    <div className="facility-detail">
      <strong>{facility.name}</strong>
      <span>
        {facility.category}
        {facility.subtype ? ` · ${facility.subtype}` : ""}
      </span>
      <span>
        {facility.status || "Status not provided"} ·{" "}
        {facility.period || "Date not provided"}
      </span>
      <span>
        {facility.coordinate.map((v) => v.toFixed(4)).join(", ")} ·{" "}
        {facility.distance !== null
          ? `${format(facility.distance)} km straight-line`
          : "Published source point · no address distance calculated"}
      </span>
      {facility.flags.length > 0 && <p>{facility.flags.join("; ")}</p>}
      <p>
        {facility.category === "Healthcare"
          ? "CDPH includes hospitals, clinics, laboratories, home-health agencies and other licensed or certified services. A marker does not mean walk-in care."
          : "A published location does not establish current operation, attendance eligibility or capacity."}
      </p>
      <details>
        <summary>Source & limitations</summary>
        <p>Source version: {facility.datasetVersion}</p>
        {facility.limitations.map((l) => (
          <p key={l}>{l}</p>
        ))}
        {facility.sourceUrl && (
          <a href={facility.sourceUrl} target="_blank" rel="noreferrer">
            {facility.category === "Healthcare"
              ? "CDPH healthcare source"
              : "CDE school source"}
          </a>
        )}
      </details>
    </div>
  );
}
