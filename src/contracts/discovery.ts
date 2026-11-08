import {
  ContractError,
  readyIndicator,
  normalizeObservation,
  type Observation,
} from "./observations";
import { parseBounds } from "./bounds";
import { DATASET_VERSION } from "./indicators";

export const DISCOVERY_INDICATORS = [
  "pm",
  "ozone",
  "diesel",
  "traffic",
  "toxic-releases",
  "cleanup",
  "asthma",
  "heart-attacks",
  "diabetes",
  "low-birth-weight",
  "poverty",
  "education",
  "housing",
] as const;
export const HEALTHCARE_SUBTYPES = {
  hospital: ["GACH"],
  clinic: [
    "COMTYC",
    "FREEC",
    "FQHC",
    "FQHC/COMTYC",
    "RHC",
    "RHC/MD",
    "RHC/OP",
    "RHC/COMTYC",
  ],
} as const;
export type DiscoveryCriterion = {
  indicator: string;
  direction?: "lowest" | "highest";
  minRaw?: number;
  maxRaw?: number;
  maxPercentile?: number;
};
export type DiscoveryProfile = {
  criteria: DiscoveryCriterion[];
  activeSchool: boolean;
  limit?: number;
  healthcare?: { kind: "hospital" | "clinic"; maxDistanceKm?: number };
  county?: string;
  bbox?: [number, number, number, number];
};
export type SchoolAnchor = {
  id: string;
  name: string | null;
  coordinate: [number, number];
  status: string | null;
  sourcePeriod: string;
  subtype: string | null;
  virtual: string | null;
};
export type DiscoveryRow = {
  tractId: string;
  county: string;
  place: string;
  bbox: [number, number, number, number];
  schoolIds: string[];
  representativePoint?: [number, number];
  healthcare?: Record<
    string,
    { facilityId: string; distanceKm: number } | null
  >;
};
export type DiscoveryIndex = {
  contractVersion: string;
  cesVersion: string;
  schoolVersion: string;
  schoolSourceUrl: string;
  rows: DiscoveryRow[];
  schools: Record<string, SchoolAnchor>;
  healthcareVersion?: string;
  healthcareSourceUrl?: string;
  healthcareTypes?: Record<string, string[]>;
  healthcareFacilities?: Record<string, Omit<SchoolAnchor, "virtual">>;
};
function fail(message: string): never {
  throw new ContractError(400, "invalid-discovery-request", message);
}
export function parseDiscoveryProfile(input: unknown): DiscoveryProfile {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("Supply discovery criteria.");
  const p = input as Record<string, unknown>;
  if (
    Object.keys(p).some(
      (k) =>
        ![
          "criteria",
          "activeSchool",
          "county",
          "bbox",
          "healthcare",
          "limit",
        ].includes(k),
    )
  )
    fail(
      "Use criteria, activeSchool, county, bbox, healthcare and limit only; weights and demographic suitability are unsupported.",
    );
  if (
    !Array.isArray(p.criteria) ||
    (!p.criteria.length && !p.healthcare) ||
    p.criteria.length > DISCOVERY_INDICATORS.length
  )
    fail("Select supported measures, or use healthcare proximity alone.");
  const criteria = p.criteria.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail("Invalid criterion.");
    const c = value as Record<string, unknown>;
    if (
      Object.keys(c).some(
        (k) =>
          ![
            "indicator",
            "direction",
            "minRaw",
            "maxRaw",
            "maxPercentile",
          ].includes(k),
      ) ||
      typeof c.indicator !== "string" ||
      !(DISCOVERY_INDICATORS as readonly string[]).includes(c.indicator)
    )
      fail(
        "Discovery supports verified scalar measures only; demographic suitability is unsupported.",
      );
    readyIndicator(c.indicator);
    if (
      c.direction !== undefined &&
      c.direction !== "lowest" &&
      c.direction !== "highest"
    )
      fail("Direction must be lowest or highest.");
    for (const key of ["minRaw", "maxRaw", "maxPercentile"])
      if (
        c[key] !== undefined &&
        (typeof c[key] !== "number" ||
          !Number.isFinite(c[key]) ||
          (c[key] as number) < 0)
      )
        fail("Thresholds must be finite nonnegative numbers.");
    if (typeof c.maxPercentile === "number" && c.maxPercentile > 100)
      fail("Maximum source percentile must be within its source scale.");
    if (
      typeof c.minRaw === "number" &&
      typeof c.maxRaw === "number" &&
      c.minRaw > c.maxRaw
    )
      fail("Minimum exceeds maximum.");
    return {
      ...(c.minRaw !== undefined ? { minRaw: c.minRaw as number } : {}),
      indicator: c.indicator,
      ...(c.direction !== undefined
        ? { direction: c.direction as "lowest" | "highest" }
        : {}),
      ...(c.maxRaw !== undefined ? { maxRaw: c.maxRaw as number } : {}),
      ...(c.maxPercentile !== undefined
        ? { maxPercentile: c.maxPercentile as number }
        : {}),
    };
  });
  if (new Set(criteria.map((c) => c.indicator)).size !== criteria.length)
    fail("Do not repeat a discovery criterion.");
  if (typeof p.activeSchool !== "boolean")
    fail("Choose whether source-listed active-school presence is required.");
  if (
    p.county !== undefined &&
    (typeof p.county !== "string" || !p.county.trim() || p.county.length > 80)
  )
    fail("Use one California county name.");
  let bbox: DiscoveryProfile["bbox"];
  if (p.bbox !== undefined) {
    if (
      !Array.isArray(p.bbox) ||
      p.bbox.length !== 4 ||
      p.bbox.some((v) => typeof v !== "number")
    )
      fail("Use four numeric map bounds.");
    bbox = parseBounds(p.bbox.join(",")) ?? undefined;
    if (!bbox) fail("Invalid map bounds.");
  }
  let healthcare: DiscoveryProfile["healthcare"];
  if (p.healthcare !== undefined) {
    const h = p.healthcare as Record<string, unknown>;
    if (
      !h ||
      typeof h !== "object" ||
      Array.isArray(h) ||
      Object.keys(h).some((k) => !["kind", "maxDistanceKm"].includes(k)) ||
      !["hospital", "clinic"].includes(h.kind as string)
    )
      fail("Healthcare kind must be hospital or clinic.");
    if (
      h.maxDistanceKm !== undefined &&
      (typeof h.maxDistanceKm !== "number" ||
        !Number.isFinite(h.maxDistanceKm) ||
        h.maxDistanceKm < 0)
    )
      fail("Healthcare distance must be finite nonnegative km.");
    healthcare = {
      kind: h.kind as "hospital" | "clinic",
      ...(h.maxDistanceKm !== undefined
        ? { maxDistanceKm: h.maxDistanceKm as number }
        : {}),
    };
  }
  if (
    p.limit !== undefined &&
    (!Number.isInteger(p.limit) ||
      (p.limit as number) < 1 ||
      (p.limit as number) > 10)
  )
    fail("Request between one and ten candidates.");
  return {
    criteria,
    ...(healthcare ? { healthcare } : {}),
    ...(p.limit !== undefined ? { limit: p.limit as number } : {}),
    activeSchool: p.activeSchool,
    ...(p.county
      ? { county: (p.county as string).trim().replace(/ County$/i, "") }
      : {}),
    ...(bbox ? { bbox } : {}),
  };
}

type Evaluated = {
  row: DiscoveryRow;
  observations: Observation[];
  percentiles: number[];
  raw: number[];
  schools: SchoolAnchor[];
  healthcare: {
    kind: string;
    distanceKm: number;
    representativePoint: [number, number];
    facility: Omit<SchoolAnchor, "virtual">;
  } | null;
};
export function paretoFront<
  T extends { raw: number[]; row: { tractId: string } },
>(rows: T[], directions: number[] = []): T[] {
  const frontier: T[] = [];
  const dominates = (a: T, b: T) =>
    a.raw.every(
      (v, i) => v * (directions[i] ?? 1) <= b.raw[i] * (directions[i] ?? 1),
    ) &&
    a.raw.some(
      (v, i) => v * (directions[i] ?? 1) < b.raw[i] * (directions[i] ?? 1),
    );
  for (const row of [...rows].sort((a, b) =>
    a.row.tractId.localeCompare(b.row.tractId),
  )) {
    if (frontier.some((f) => dominates(f, row))) continue;
    for (let i = frontier.length - 1; i >= 0; i--)
      if (dominates(row, frontier[i])) frontier.splice(i, 1);
    frontier.push(row);
  }
  return frontier;
}
export function variedCandidates<
  T extends { percentiles: number[]; row: { tractId: string } },
>(front: T[], limit = 5, directions: number[] = []): T[] {
  if (!front.length) return [];
  const selected: T[] = [];
  const take = (row: T) => {
    if (!selected.includes(row) && selected.length < limit) selected.push(row);
  };
  // Axis minima make tradeoffs visible; percentile space selects spread only, never a score.
  for (let axis = 0; axis < front[0].percentiles.length; axis++)
    take(
      [...front].sort(
        (a, b) =>
          (a.percentiles[axis] - b.percentiles[axis]) *
            (directions[axis] ?? 1) ||
          a.row.tractId.localeCompare(b.row.tractId),
      )[0],
    );
  const distance = (a: T, b: T) =>
    a.percentiles.reduce(
      (sum, v, i) => sum + ((v - b.percentiles[i]) / 100) ** 2,
      0,
    );
  while (selected.length < Math.min(limit, front.length)) {
    const remaining = front.filter((f) => !selected.includes(f));
    remaining.sort(
      (a, b) =>
        Math.min(...selected.map((s) => distance(b, s))) -
          Math.min(...selected.map((s) => distance(a, s))) ||
        a.row.tractId.localeCompare(b.row.tractId),
    );
    take(remaining[0]);
  }
  return selected;
}

export function discoverAreas(
  input: unknown,
  index: DiscoveryIndex,
  record: (id: string) => Record<string, string | null> | null,
  intersects?: (
    row: DiscoveryRow,
    bbox: NonNullable<DiscoveryProfile["bbox"]>,
  ) => boolean,
) {
  const profile = parseDiscoveryProfile(input);
  if (index.cesVersion !== DATASET_VERSION)
    throw new ContractError(
      409,
      "discovery-version-mismatch",
      "Rebuild the discovery index for the current source version.",
    );
  const county = profile.county?.toLowerCase();
  if (
    profile.healthcare &&
    (!index.healthcareVersion || !index.healthcareFacilities)
  )
    throw new ContractError(
      503,
      "healthcare-discovery-unavailable",
      "Rebuild the discovery index with healthcare data.",
    );
  if (profile.bbox && !intersects)
    throw new ContractError(
      503,
      "discovery-spatial-filter-unavailable",
      "Exact tract intersection is required for map-filtered discovery.",
    );
  if (county && !index.rows.some((r) => r.county.toLowerCase() === county))
    fail(
      "This county is not in the pinned California inventory. Check the county name.",
    );
  const counts = {
    total: index.rows.length,
    outsideGeography: 0,
    missingEvidence: 0,
    noActiveSchool: 0,
    thresholds: 0,
    healthcare: 0,
    eligible: 0,
    pareto: 0,
  };
  const missingByIndicator: Record<string, number> = Object.fromEntries(
    profile.criteria.map((c) => [c.indicator, 0]),
  );
  const eligible: Evaluated[] = [];
  for (const row of index.rows) {
    if (
      (county && row.county.toLowerCase() !== county) ||
      (profile.bbox &&
        !(intersects
          ? intersects(row, profile.bbox)
          : row.bbox[0] <= profile.bbox[2] &&
            row.bbox[2] >= profile.bbox[0] &&
            row.bbox[1] <= profile.bbox[3] &&
            row.bbox[3] >= profile.bbox[1]))
    ) {
      counts.outsideGeography++;
      continue;
    }
    const source = record(row.tractId);
    if (!source)
      throw new ContractError(
        503,
        "discovery-source-missing",
        "A discovery tract has no source observation. Rebuild the index.",
      );
    const observations = profile.criteria.map((c) =>
      normalizeObservation(row.tractId, source, readyIndicator(c.indicator)),
    );
    let missing = false;
    observations.forEach((o) => {
      if (o.rawValue === null || o.percentile === null) {
        missing = true;
        missingByIndicator[o.indicatorId]++;
      }
    });
    if (missing) {
      counts.missingEvidence++;
      continue;
    }
    const schools = row.schoolIds
      .map((id) => index.schools[id])
      .filter((s) => s?.status === "Active");
    if (profile.activeSchool && !schools.length) {
      counts.noActiveSchool++;
      continue;
    }
    const nearest = profile.healthcare
      ? row.healthcare?.[profile.healthcare.kind]
      : null;
    const facility = nearest
      ? index.healthcareFacilities?.[nearest.facilityId]
      : null;
    if (
      profile.healthcare &&
      (!nearest ||
        !facility ||
        !row.representativePoint ||
        (profile.healthcare.maxDistanceKm !== undefined &&
          nearest.distanceKm > profile.healthcare.maxDistanceKm))
    ) {
      counts.healthcare++;
      continue;
    }
    const healthcare =
      nearest && facility && row.representativePoint && profile.healthcare
        ? {
            kind: profile.healthcare.kind,
            distanceKm: nearest.distanceKm,
            representativePoint: row.representativePoint,
            facility,
          }
        : null;
    if (
      observations.some(
        (o, i) =>
          (profile.criteria[i].minRaw !== undefined &&
            o.rawValue! < profile.criteria[i].minRaw!) ||
          (profile.criteria[i].maxRaw !== undefined &&
            o.rawValue! > profile.criteria[i].maxRaw!) ||
          (profile.criteria[i].maxPercentile !== undefined &&
            o.percentile! > profile.criteria[i].maxPercentile!),
      )
    ) {
      counts.thresholds++;
      continue;
    }
    eligible.push({
      row,
      healthcare,
      observations,
      schools,
      raw: [
        ...observations.map((o) => o.rawValue!),
        ...(healthcare ? [healthcare.distanceKm] : []),
      ],
      percentiles: observations.map((o) => o.percentile!),
    });
  }
  counts.eligible = eligible.length;
  const directions = profile.criteria.map((c) =>
    c.direction === "highest" ? -1 : 1,
  );
  if (profile.healthcare) {
    directions.push(1);
    const distances = eligible
      .map((e) => e.healthcare!.distanceKm)
      .sort((a, b) => a - b);
    for (const e of eligible) {
      // Internal within-query rank for spread only; never a source percentile or displayed score.
      let lo = 0,
        hi = distances.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (distances[mid] < e.healthcare!.distanceKm) lo = mid + 1;
        else hi = mid;
      }
      e.percentiles.push(
        distances.length > 1 ? (100 * lo) / (distances.length - 1) : 0,
      );
    }
  }
  const front = paretoFront(eligible, directions);
  counts.pareto = front.length;
  const ranked =
    profile.criteria.length + (profile.healthcare ? 1 : 0) === 1 &&
    profile.limit !== undefined;
  const selected = ranked
    ? [...eligible]
        .sort(
          (a, b) =>
            (a.raw[0] - b.raw[0]) * directions[0] ||
            a.row.tractId.localeCompare(b.row.tractId),
        )
        .slice(0, profile.limit)
    : variedCandidates(front, profile.limit ?? 5, directions);
  return {
    contractVersion: "atlas-discovery-v1",
    datasetVersion: DATASET_VERSION,
    schoolVersion: index.schoolVersion,
    schoolSourceUrl: index.schoolSourceUrl,
    profile,
    healthcareVersion: index.healthcareVersion ?? null,
    healthcareSourceUrl: index.healthcareSourceUrl ?? null,
    healthcareTypes: profile.healthcare
      ? (index.healthcareTypes?.[profile.healthcare.kind] ?? [])
      : [],
    counts,
    missingByIndicator,
    selection: {
      ranked,
      method: ranked
        ? "Requested top results sorted by the selected raw measure in its requested direction; ties by tract ID."
        : "Non-dominated (Pareto) alternatives respecting each selected highest/lowest raw-value direction and minimizing healthcare distance when requested; varied examples use environmental source percentiles and an internal within-search distance rank, with no composite score; ties by tract ID. A single search dimension yields its eligible extreme.",
      weights: null,
      compositeScore: null,
      geography:
        "County name equality and exact full-resolution tract/map-rectangle intersection when supplied.",
      exclusionOrder: [
        "outsideGeography",
        "missingEvidence",
        "noActiveSchool",
        "healthcare",
        "thresholds",
      ],
    },
    candidates: selected.map(({ row, observations, schools, healthcare }) => ({
      tractId: row.tractId,
      county: row.county,
      place: row.place,
      bbox: row.bbox,
      representativePoint: row.representativePoint ?? null,
      observations,
      healthcare,
      activeSchoolCount: schools.length,
      schoolAnchors: profile.activeSchool ? schools.slice(0, 3) : [],
      explanation: ranked
        ? "One of the requested ranked results for this raw measure; ordering is by the requested direction, with tract ID breaking ties."
        : profile.criteria.length === 1 && !profile.healthcare
          ? `This tract has the ${profile.criteria[0].direction ?? "lowest"} reported raw value among eligible tracts. Ties may exist; this is not an overall suitability ranking.`
          : "No eligible tract improves any selected measure in its requested direction without worsening another. This is one varied example, not an overall best place.",
    })),
    limitations: [
      ...(profile.healthcare
        ? [
            "Healthcare is straight-line km from a Shapely representative point inside the tract to the nearest source-listed OPEN hospital/clinic of the shown subtypes. It is not a home address, travel time, capacity, insurance coverage, quality or access guarantee. Hospital means GACH; clinics use the listed CDPH subtype codes. Internal distance ranks select varied examples only and are not source percentiles.",
          ]
        : []),
      "Matches to the displayed search criteria, not personal medical suitability or a universally best location.",
      "Source-listed Active means historical source status, not current operation. Virtual-school flags are retained.",
      "A school within a tract is an exploration anchor; it is not near every home. Confirm an address for actual straight-line distances.",
      "Housing cost, school quality, catchment eligibility, travel time and personal medical suitability are unsupported. Race/ethnicity and age do not participate in selection.",
      "Missing raw values or source percentiles exclude a tract for selected criteria. Constraints are never silently relaxed.",
    ],
    emptyReason: selected.length
      ? null
      : "No tract meets every search constraint. Review the exclusion counts and explicitly revise the profile.",
  };
}
export type DiscoveryResult = ReturnType<typeof discoverAreas>;
