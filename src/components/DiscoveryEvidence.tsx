"use client";
import { AssistantNarrative } from "./AssistantNarrative";
import { useState } from "react";
import { indicatorContracts } from "../contracts/indicators";
import {
  DISCOVERY_INDICATORS,
  type DiscoveryProfile,
  type DiscoveryResult,
} from "../contracts/discovery";
const labels: Record<string, string> = {
  pm: "Fine particles (PM2.5)",
  ozone: "Ozone",
  diesel: "Diesel particulate matter",
  traffic: "Traffic burden",
  "toxic-releases": "Toxic air releases",
  cleanup: "Cleanup burden",
  ...Object.fromEntries(
    indicatorContracts
      .filter(
        (c) =>
          !DISCOVERY_INDICATORS.slice(0, 6).includes(
            c.id as (typeof DISCOVERY_INDICATORS)[number],
          ),
      )
      .map((c) => [c.id, c.label]),
  ),
};
const num = (value: number | null) =>
  value === null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", { maximumSignificantDigits: 5 }).format(
        value,
      );
export function DiscoveryProfileEditor({
  profile,
  bounds,
  onAccept,
  disabled,
}: {
  profile: DiscoveryProfile;
  bounds?: [number, number, number, number];
  onAccept: (p: DiscoveryProfile) => void;
  disabled: boolean;
}) {
  const [criteria, setCriteria] = useState(profile.criteria),
    [county, setCounty] = useState(profile.county ?? ""),
    [school, setSchool] = useState(profile.activeSchool),
    [useMap, setUseMap] = useState(!!profile.bbox),
    [acceptedBounds, setAcceptedBounds] = useState<DiscoveryProfile["bbox"]>();
  const shownBounds = acceptedBounds ?? bounds;
  return (
    <form
      className="ask-card ask-profile"
      aria-label="Discovery preferences"
      onSubmit={(e) => {
        e.preventDefault();
        setAcceptedBounds(useMap && bounds ? [...bounds] : undefined);
        onAccept({
          criteria,
          activeSchool: school,
          ...(profile.healthcare ? { healthcare: profile.healthcare } : {}),
          ...(profile.limit ? { limit: profile.limit } : {}),
          ...(county.trim() ? { county: county.trim() } : {}),
          ...(useMap && bounds ? { bbox: [...bounds] } : {}),
        });
      }}
    >
      <h3>Choose your starting profile</h3>
      <p>
        Choose highest or lowest for each checked measure. No weights or overall
        health score. Accept these criteria or edit them first.
      </p>
      {profile.healthcare && (
        <p>
          Healthcare preference: lower {profile.healthcare.kind} distance from a
          representative tract point
          {profile.healthcare.maxDistanceKm !== undefined
            ? `, maximum ${profile.healthcare.maxDistanceKm} km`
            : ""}
          .
        </p>
      )}
      <fieldset disabled={disabled}>
        <legend>Search measures</legend>
        {DISCOVERY_INDICATORS.map((id) => {
          const criterion = criteria.find((c) => c.indicator === id);
          const definition = indicatorContracts.find((c) => c.id === id);
          return (
            <div className="ask-profile-criterion" key={id}>
              <label>
                <input
                  type="checkbox"
                  checked={!!criterion}
                  onChange={(e) =>
                    setCriteria((c) =>
                      e.target.checked
                        ? [...c, { indicator: id }]
                        : c.filter((v) => v.indicator !== id),
                    )
                  }
                />
                {labels[id]}
              </label>
              {criterion && (
                <label className="ask-field">
                  Direction
                  <select
                    aria-label={`${labels[id]} direction`}
                    value={criterion.direction ?? "lowest"}
                    onChange={(e) =>
                      setCriteria((c) =>
                        c.map((x) =>
                          x.indicator === id
                            ? {
                                ...x,
                                direction: e.target.value as
                                  "highest" | "lowest",
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="lowest">Lowest values</option>
                    <option value="highest">Highest values</option>
                  </select>
                </label>
              )}
              {criterion && (
                <p>
                  {definition?.unit} · {definition?.measurementPeriod} ·{" "}
                  <a
                    href={definition?.definitionSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source definition
                  </a>
                </p>
              )}
              {criterion && (
                <div className="ask-thresholds">
                  <label>
                    Maximum raw value
                    <input
                      aria-label={`${labels[id]} maximum raw value`}
                      type="number"
                      min="0"
                      step="any"
                      value={criterion.maxRaw ?? ""}
                      placeholder="No limit"
                      onChange={(e) => {
                        const v = e.target.value;
                        setCriteria((c) =>
                          c.map((x) =>
                            x.indicator === id
                              ? {
                                  ...x,
                                  maxRaw: v === "" ? undefined : Number(v),
                                }
                              : x,
                          ),
                        );
                      }}
                    />
                  </label>
                  <label>
                    Maximum source percentile
                    <input
                      aria-label={`${labels[id]} maximum source percentile`}
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={criterion.maxPercentile ?? ""}
                      placeholder="No limit"
                      onChange={(e) => {
                        const v = e.target.value;
                        setCriteria((c) =>
                          c.map((x) =>
                            x.indicator === id
                              ? {
                                  ...x,
                                  maxPercentile:
                                    v === "" ? undefined : Number(v),
                                }
                              : x,
                          ),
                        );
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>
      <label className="ask-option">
        <input
          type="checkbox"
          checked={school}
          disabled={disabled}
          onChange={(e) => setSchool(e.target.checked)}
        />
        Require a source-listed Active school within the tract
      </label>
      <label className="ask-field">
        County (optional)
        <input
          value={county}
          disabled={disabled}
          placeholder="All California counties"
          onChange={(e) => setCounty(e.target.value)}
          maxLength={80}
        />
      </label>
      <label className="ask-option">
        <input
          type="checkbox"
          checked={useMap}
          disabled={disabled || !bounds}
          onChange={(e) => setUseMap(e.target.checked)}
        />
        Limit to the current map view
      </label>
      {useMap && shownBounds && (
        <p>
          Map bounds captured when you accept:{" "}
          {shownBounds.map((n) => n.toFixed(3)).join(", ")}. Whole intersecting
          tracts are considered.
        </p>
      )}
      <p>
        School status is historical. A school in a tract is not near every home,
        and does not establish quality, enrollment eligibility or access.
        Race/ethnicity and age are excluded from selection.
      </p>
      <button
        type="submit"
        disabled={disabled || (!criteria.length && !profile.healthcare)}
      >
        Accept profile & find areas
      </button>
    </form>
  );
}
export function DiscoveryEvidence({
  data,
  summaries = [],
  onExplore,
  disabled,
}: {
  data: DiscoveryResult;
  summaries?: { tractId: string; text: string }[];
  onExplore: (candidate: DiscoveryResult["candidates"][number]) => void;
  disabled: boolean;
}) {
  const [explored, setExplored] = useState("");
  return (
    <section className="ask-card" aria-label="Area discovery results">
      <h3>
        {data.profile.criteria.length === 1 && !data.profile.healthcare
          ? `${data.profile.criteria[0].direction === "highest" ? "Highest" : "Lowest"} ${labels[data.profile.criteria[0].indicator].toLowerCase()}`
          : "Areas matching your priorities"}
      </h3>
      {data.profile.healthcare && (
        <p className="ask-muted">
          Healthcare proximity is an area-level estimate. Confirm an address to
          check distances from a specific home; actual access to care is
          unverified.
        </p>
      )}
      <details className="ask-evidence-details ask-search-details">
        <summary>Search criteria & coverage</summary>
        <p className="ask-search-summary">
          Search: {!data.profile.criteria.length && "Healthcare proximity"}
          {data.profile.criteria
            .map((c) => `${c.direction ?? "lowest"} ${labels[c.indicator]}`)
            .join(", ")}
          .{" "}
          {data.profile.activeSchool
            ? "Active school required."
            : "No school requirement."}{" "}
          {data.profile.criteria.some(
            (c) =>
              c.minRaw !== undefined ||
              c.maxRaw !== undefined ||
              c.maxPercentile !== undefined,
          )
            ? data.profile.criteria
                .map(
                  (c) =>
                    `${labels[c.indicator]}: minimum raw ${c.minRaw ?? "unlimited"}, maximum raw ${c.maxRaw ?? "unlimited"}, maximum source percentile ${c.maxPercentile ?? "unlimited"}`,
                )
                .join("; ")
            : "No numeric thresholds."}
        </p>
        <p>
          {data.profile.county ? `${data.profile.county} County` : "California"}
          {data.profile.bbox ? " · within accepted map bounds" : ""} ·{" "}
          {data.counts.eligible} eligible tracts ·{" "}
          {data.selection.ranked
            ? `${data.candidates.length} ranked results`
            : `${data.counts.pareto} non-dominated alternatives`}
        </p>
        <p>
          {data.counts.missingEvidence} excluded for missing selected evidence;{" "}
          {data.counts.noActiveSchool} excluded for school presence;{" "}
          {data.counts.thresholds} excluded by thresholds;{" "}
          {data.counts.outsideGeography} outside the geography.
        </p>
        {data.profile.healthcare && (
          <p>
            Healthcare: prefer shorter distance to a source-listed{" "}
            {data.profile.healthcare.kind}, measured from a representative point
            inside each tract.{" "}
            {data.profile.healthcare.maxDistanceKm !== undefined
              ? `Maximum ${data.profile.healthcare.maxDistanceKm} km.`
              : "No distance limit."}{" "}
            This does not establish actual access.
          </p>
        )}
        {data.counts.healthcare > 0 && (
          <p>
            {data.counts.healthcare} excluded by healthcare evidence or distance
            constraint.
          </p>
        )}
      </details>
      {data.emptyReason && <p role="status">{data.emptyReason}</p>}
      {data.candidates.map((candidate) => (
        <section className="ask-discovery-candidate" key={candidate.tractId}>
          <h4>
            {candidate.place || "Census tract"} · {candidate.county} County
          </h4>
          {summaries.find((s) => s.tractId === candidate.tractId) && (
            <AssistantNarrative
              text={
                summaries.find((s) => s.tractId === candidate.tractId)!.text
              }
            />
          )}
          <details className="ask-evidence-details">
            <summary>Values & sources · tract {candidate.tractId}</summary>
            {candidate.observations.map((o) => (
              <div className="ask-discovery-value" key={o.indicatorId}>
                <strong>{labels[o.indicatorId]}</strong>
                <span>
                  {num(o.rawValue)} {o.unit} · {num(o.percentile)} source
                  percentile
                </span>
                <small>
                  {o.measurementPeriod} ·{" "}
                  <a href={o.definitionSource} target="_blank" rel="noreferrer">
                    Source
                  </a>
                </small>
              </div>
            ))}
            <details>
              <summary>Measure definitions & limits</summary>
              {candidate.observations.map((o) => (
                <div key={o.indicatorId}>
                  <p>
                    <strong>{labels[o.indicatorId]}</strong>: {o.definition}
                  </p>
                  {o.limitations.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  <small>Source SHA-256: {o.provenance.sha256}</small>
                </div>
              ))}
            </details>
            <p>{candidate.explanation}</p>
            {candidate.healthcare && (
              <div className="ask-healthcare">
                <strong>Hospital / clinic proximity</strong>
                <p>
                  {num(candidate.healthcare.distanceKm)} km straight-line to{" "}
                  {candidate.healthcare.facility.name ??
                    "Unnamed source record"}
                </p>
                <small>
                  {candidate.healthcare.facility.subtype} ·{" "}
                  {candidate.healthcare.facility.status ?? "Unknown status"} ·{" "}
                  {candidate.healthcare.facility.sourcePeriod}
                </small>
                <p>
                  From an interior representative tract point (
                  {candidate.healthcare.representativePoint
                    .map((n) => n.toFixed(5))
                    .join(", ")}
                  ), not a home address. Travel time, capacity, services,
                  insurance and access are unverified.
                </p>
                {data.healthcareSourceUrl && (
                  <a
                    href={data.healthcareSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Healthcare source · {data.healthcareVersion}
                  </a>
                )}
                <small>
                  Included subtype codes: {data.healthcareTypes.join(", ")}
                </small>
              </div>
            )}
            {data.profile.activeSchool && (
              <div>
                {" "}
                <p>
                  {candidate.activeSchoolCount} source-listed Active schools
                  within the tract; up to three exploration anchors:
                </p>
                {candidate.schoolAnchors.map((s) => (
                  <p key={s.id}>
                    {s.name ?? "Unnamed school"} · {s.status ?? "Unknown"} ·{" "}
                    {s.sourcePeriod} · Virtual: {s.virtual ?? "Not supplied"}
                  </p>
                ))}
                <a href={data.schoolSourceUrl} target="_blank" rel="noreferrer">
                  School source · {data.schoolVersion}
                </a>
              </div>
            )}
          </details>
          <button
            disabled={disabled}
            onClick={() => {
              setExplored(candidate.tractId);
              onExplore(candidate);
            }}
          >
            Explore area · {candidate.tractId}
          </button>
          {explored === candidate.tractId && (
            <p role="status">
              This tract and school anchors are framed on the map. Search and
              confirm a street address to compare actual address-to-school
              distances.
            </p>
          )}
        </section>
      ))}
      <details>
        <summary>Selection method & limits</summary>
        <p>{data.selection.method}</p>
        {data.limitations.map((l) => (
          <p key={l}>{l}</p>
        ))}
        <p>Dataset: {data.datasetVersion}</p>
      </details>
    </section>
  );
}
