"use client";
import { useLayoutEffect, useRef } from "react";
import { indicatorContracts } from "../contracts/indicators";
import type { DiscoveryResult } from "../contracts/discovery";
import { format } from "../frontend/provider";

type Candidate = DiscoveryResult["candidates"][number];
export function DiscoveryHoverCard({
  candidate,
  x,
  y,
  width,
  height,
  anchor,
  onEnter,
  onLeave,
}: {
  candidate: Candidate;
  x: number;
  y: number;
  width: number;
  height: number;
  anchor?: { name: string; kind: string };
  onEnter: () => void;
  onLeave: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const w = el.offsetWidth,
      h = el.offsetHeight;
    const preferred = x + 18 + w <= width - 12 ? x + 18 : x - w - 18;
    let left = Math.max(12, Math.min(preferred, width - w - 12));
    let top = Math.max(12, Math.min(y - 24, height - h - 12));
    const shell = el.parentElement?.getBoundingClientRect();
    const panel = document
      .getElementById("ask-clearsky")
      ?.getBoundingClientRect();
    if (shell && panel) {
      const pLeft = panel.left - shell.left,
        pTop = panel.top - shell.top,
        pBottom = panel.bottom - shell.top;
      if (
        left + w > pLeft &&
        left < panel.right - shell.left &&
        top + h > pTop &&
        top < pBottom
      ) {
        if (pLeft > w + 24) left = Math.min(left, pLeft - w - 12);
        else if (pTop > h + 24) top = pTop - h - 12;
        else if (pBottom + h + 24 < height) top = pBottom + 12;
      }
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y, width, height, candidate]);
  return (
    <div
      ref={box}
      role="tooltip"
      aria-label="Discovery area evidence"
      className="map-tooltip discovery-tooltip"
      style={{
        left: x + 18,
        top: y - 24,
        maxHeight: height - 24,
        maxWidth: width - 24,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <header>
        <strong>{candidate.place || "Discovered area"}</strong>
        <span>
          {candidate.county} County · Tract {candidate.tractId}
        </span>
      </header>
      {anchor && (
        <p className="discovery-tooltip-anchor">
          {anchor.kind === "healthcare"
            ? "Healthcare reference"
            : "School reference"}
          : {anchor.name}
        </p>
      )}
      <dl>
        {candidate.observations.map((o) => {
          const contract = indicatorContracts.find(
            (c) => c.id === o.indicatorId,
          );
          return (
            <div key={o.indicatorId} data-indicator={o.indicatorId}>
              <dt>{contract?.label ?? o.indicatorId}</dt>
              <dd>
                <strong>{format(o.rawValue, o.indicatorId)}</strong>{" "}
                {o.unit ?? "Unit unavailable"}
              </dd>
              <small>
                {o.percentile === null
                  ? "Source percentile unavailable"
                  : `Source percentile ${format(o.percentile)} / 100`}{" "}
                · {o.measurementPeriod ?? "Period unavailable"}
              </small>
              {o.indicatorId === "education" && (
                <p className="discovery-tooltip-definition">
                  Adults without a high school diploma. Lower values mean fewer
                  adults without a diploma.
                </p>
              )}
            </div>
          );
        })}
      </dl>
      {candidate.healthcare && (
        <div className="discovery-tooltip-extra">
          <strong>
            {format(candidate.healthcare.distanceKm)} km to a source-listed{" "}
            {candidate.healthcare.kind}
          </strong>
          <span>{candidate.healthcare.facility.name}</span>
          <small>
            From an interior tract point; actual access is unverified.
          </small>
        </div>
      )}
      {candidate.schoolAnchors.length > 0 && (
        <div className="discovery-tooltip-extra">
          {candidate.activeSchoolCount} source-listed Active schools within this
          tract
        </div>
      )}
      <footer>
        Values describe the tract, not a specific home or the facility. Source
        percentiles are relative ranks, not personal risk.
      </footer>
    </div>
  );
}
