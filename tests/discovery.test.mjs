import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadAssistantModules } from "./load-assistant-modules.mjs";
const modules = await loadAssistantModules();
after(modules.cleanup);
const { discoverAreas, paretoFront, variedCandidates, parseDiscoveryProfile } =
  await modules.load("contracts/discovery");
const { discovery, discoveryIndex } = await modules.load("discovery");
const { lookup, tractRecord } = await modules.load("data");
const { intersectsTractBounds } = await modules.load("spatial");
const { createToolkit } = await modules.load("assistant/tools");
const version = "ces-5.0-final-2026-07-01";
const profile = {
  criteria: [
    { indicator: "pm" },
    { indicator: "ozone" },
    { indicator: "traffic" },
  ],
  activeSchool: true,
};
test("Pareto frontier and varied examples agree with an independent exhaustive calculation; ties are deterministic", () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({
    row: { tractId: String(i).padStart(11, "0") },
    raw: [(i * 17) % 29, (i * 7) % 13, (i * 11) % 19],
    percentiles: [(i * 17) % 29, (i * 7) % 13, (i * 11) % 19],
  }));
  rows.push({ ...rows[3], row: { tractId: "99999999999" } });
  const expected = rows
    .filter(
      (a) =>
        !rows.some(
          (b) =>
            b.raw.every((x, i) => x <= a.raw[i]) &&
            b.raw.some((x, i) => x < a.raw[i]),
        ),
    )
    .sort((a, b) => a.row.tractId.localeCompare(b.row.tractId));
  assert.deepEqual(paretoFront([...rows].reverse()), expected);
  assert.deepEqual(
    variedCandidates(expected),
    variedCandidates([...expected].reverse()),
  );
  const ties = Array.from({ length: 6 }, (_, i) => ({
    row: { tractId: String(i) },
    percentiles: [1, 1],
  }));
  assert.deepEqual(
    variedCandidates(ties).map((x) => x.row.tractId),
    ["0", "1", "2", "3", "4"],
  );
});
test("active, closed, unknown schools, nulls and thresholds exclude independently without relaxing constraints", () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({
    tractId: `06001000${String(i).padStart(3, "0")}`,
    county: "Fixture",
    place: "Fixture",
    bbox: [0, 0, 1, 1],
    schoolIds: ["school" + i],
  }));
  const index = {
    contractVersion: "fixture",
    cesVersion: version,
    schoolVersion: "fixture",
    schoolSourceUrl: "https://example.com",
    rows,
    schools: Object.fromEntries(
      rows.map((_, i) => [
        "school" + i,
        {
          id: "school" + i,
          name: "Fixture school",
          status: ["Active", "Closed", null, "Active", "Active"][i],
          coordinate: [0.5, 0.5],
          sourcePeriod: "fixture",
        },
      ]),
    ),
  };
  const records = Object.fromEntries(
    rows.map((r, i) => [
      r.tractId,
      {
        pm: i === 3 ? null : String(i + 1),
        pmP: i === 3 ? null : String(i + 1),
      },
    ]),
  );
  const result = discoverAreas(
    { criteria: [{ indicator: "pm", maxRaw: 3 }], activeSchool: true },
    index,
    (id) => records[id],
  );
  assert.deepEqual(
    result.candidates.map((c) => c.tractId),
    [rows[0].tractId],
  );
  assert.equal(result.counts.missingEvidence, 1);
  assert.equal(result.counts.noActiveSchool, 2);
  assert.equal(result.counts.thresholds, 1);
  const empty = discoverAreas(
    { criteria: [{ indicator: "pm", maxRaw: 0 }], activeSchool: true },
    index,
    (id) => records[id],
  );
  assert.equal(empty.candidates.length, 0);
  assert.ok(empty.emptyReason);
  assert.equal(empty.profile.criteria[0].maxRaw, 0);
  assert.equal(
    discoverAreas(
      { criteria: [{ indicator: "pm" }], activeSchool: false },
      index,
      (id) => records[id],
    ).counts.noActiveSchool,
    0,
  );
  for (const input of [
    { criteria: [{ indicator: "hisp" }], activeSchool: true },
    { ...profile, weights: [1, 1, 1] },
    {
      criteria: [{ indicator: "pm", maxPercentile: 101 }],
      activeSchool: false,
    },
  ])
    assert.throws(() => parseDiscoveryProfile(input));
});
test("rectangle intersection handles holes, disjoint bounding boxes and crossing segments using full polygons", () => {
  const geometry = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0],
        ],
        [
          [1, 1],
          [1, 3],
          [3, 3],
          [3, 1],
          [1, 1],
        ],
      ],
    },
  };
  assert.equal(intersectsTractBounds(geometry, [1.5, 1.5, 2.5, 2.5]), false);
  assert.equal(intersectsTractBounds(geometry, [2, 2, 5, 5]), true);
  assert.equal(intersectsTractBounds(geometry, [5, 5, 6, 6]), false);
  assert.equal(intersectsTractBounds(geometry, [-1, 1.8, 5, 2.2]), true);
  assert.equal(intersectsTractBounds(geometry, [4, 1, 5, 2]), true);
});
test("entire prepared school membership agrees with independent production Turf lookup and preserves statuses", () => {
  const index = discoveryIndex(),
    bundle = JSON.parse(
      fs.readFileSync("data/facilities/schools.json", "utf8"),
    );
  const bySchool = new Map(
    index.rows.flatMap((row) => row.schoolIds.map((id) => [id, row.tractId])),
  );
  assert.equal(bySchool.size, 9946);
  const original = new Map(bundle.facilities.map((s) => [s.id, s]));
  for (const [id, school] of Object.entries(index.schools)) {
    assert.deepEqual(
      lookup(school.coordinate).map((f) => f.properties.id),
      [bySchool.get(id)],
      id,
    );
    assert.equal(school.status, original.get(id).sourceAttributes.Status);
  }
});
test("statewide, county and exact map discovery are reproducible with source-traceable, non-dominated results", () => {
  const a = discovery(profile),
    b = discovery(profile);
  assert.deepEqual(a, b);
  assert.ok(a.candidates.length > 1 && a.candidates.length <= 5);
  const index = discoveryIndex();
  for (const candidate of a.candidates) {
    const source = tractRecord(candidate.tractId);
    for (const o of candidate.observations)
      assert.equal(o.rawValue, Number(source[o.provenance.rawField]));
    for (const s of candidate.schoolAnchors) assert.equal(s.status, "Active");
    for (const row of index.rows) {
      if (!row.schoolIds.some((id) => index.schools[id].status === "Active"))
        continue;
      const record = tractRecord(row.tractId);
      const raw = ["pm", "ozone", "traffic"].map((id) =>
        record[id] === null ? null : Number(record[id]),
      );
      if (raw.some((x) => x === null)) continue;
      const actual = candidate.observations.map((o) => o.rawValue);
      assert.equal(
        raw.every((v, i) => v <= actual[i]) &&
          raw.some((v, i) => v < actual[i]),
        false,
      );
    }
  }
  const county = discovery({ ...profile, county: "Alameda County" });
  assert.ok(county.candidates.length);
  assert.ok(county.candidates.every((c) => c.county === "Alameda"));
  const bbox = [-122.31, 37.74, -122.2, 37.85],
    map = discovery({ ...profile, bbox });
  assert.ok(map.candidates.length);
  assert.ok(map.counts.outsideGeography > 0);
  const geo = JSON.parse(fs.readFileSync("data/lookup.json", "utf8")).features;
  for (const c of map.candidates)
    assert.ok(
      intersectsTractBounds(
        geo.find((f) => f.properties.id === c.tractId),
        bbox,
      ),
    );
  assert.throws(() => discovery({ ...profile, county: "Invented" }));
});
test("tools allow inferred searches and validate explicit criteria", async () => {
  const unaccepted = createToolkit([], new AbortController().signal);
  await assert.rejects(
    unaccepted.execute("discover_areas", {}),
    (e) => e.code === "discovery-criteria-required",
  );
  const kit = createToolkit([], new AbortController().signal, profile);
  await assert.rejects(
    kit.execute("discover_areas", { criteria: [{ indicator: "pm" }] }),
  );
  const result = await kit.execute("discover_areas", {});
  assert.deepEqual(result.data.profile, profile);
});

test("highest and lowest traffic match independent statewide extrema, with county filters and no school requirement", async () => {
  const index = discoveryIndex();
  for (const county of [undefined, "Alameda"]) {
    const rows = index.rows
      .filter((r) => !county || r.county === county)
      .map((r) => ({ id: r.tractId, record: tractRecord(r.tractId) }))
      .filter((r) => r.record.traffic !== null && r.record.trafficP !== null);
    const values = rows.map((r) => Number(r.record.traffic));
    for (const direction of ["highest", "lowest"]) {
      const expected =
        direction === "highest" ? Math.max(...values) : Math.min(...values);
      const search = {
        criteria: [{ indicator: "traffic", direction }],
        activeSchool: false,
        ...(county ? { county } : {}),
      };
      const result = await createToolkit(
        [],
        new AbortController().signal,
      ).execute("discover_areas", search);
      assert.ok(result.data.candidates.length);
      for (const c of result.data.candidates)
        assert.equal(c.observations[0].rawValue, expected);
      assert.equal(result.data.counts.noActiveSchool, 0);
      assert.equal(result.data.profile.criteria[0].direction, direction);
    }
  }
  assert.throws(() =>
    parseDiscoveryProfile({
      criteria: [{ indicator: "traffic", direction: "sideways" }],
      activeSchool: false,
    }),
  );
});
test("mixed maximum and minimum Pareto directions preserve original values", () => {
  const rows = [
    { row: { tractId: "a" }, raw: [10, 2] },
    { row: { tractId: "b" }, raw: [5, 3] },
    { row: { tractId: "c" }, raw: [12, 4] },
  ];
  assert.deepEqual(
    paretoFront(rows, [-1, 1]).map((r) => r.row.tractId),
    ["a", "c"],
  );
  assert.deepEqual(rows[0].raw, [10, 2]);
});

test("explicit top count ranks raw values across eligible tracts with stable tie order", () => {
  for (const direction of ["lowest", "highest"]) {
    const result = discovery({
      criteria: [{ indicator: "traffic", direction }],
      activeSchool: false,
      limit: 3,
    });
    const expected = discoveryIndex()
      .rows.map((r) => ({ id: r.tractId, r: tractRecord(r.tractId) }))
      .filter((v) => v.r.traffic !== null && v.r.trafficP !== null)
      .sort(
        (a, b) =>
          (Number(a.r.traffic) - Number(b.r.traffic)) *
            (direction === "highest" ? -1 : 1) || a.id.localeCompare(b.id),
      )
      .slice(0, 3);
    assert.deepEqual(
      result.candidates.map((c) => c.tractId),
      expected.map((v) => v.id),
    );
  }
});
test("healthcare participates in Pareto selection; distances match independent full inventory scan", async () => {
  const { facilityBundle, straightLineKm } = await modules.load(
    "contracts/facilities",
  );
  const result = discovery({
    criteria: [{ indicator: "pm" }],
    activeSchool: false,
    county: "Alameda",
    healthcare: { kind: "hospital", maxDistanceKm: 5 },
  });
  assert.ok(result.candidates.length);
  const hospitals = facilityBundle("healthcare").facilities.filter(
    (f) => f.status === "OPEN" && f.subtype === "GACH" && f.coordinate,
  );
  const eligible = discoveryIndex()
    .rows.filter(
      (r) => r.county === "Alameda" && r.healthcare.hospital.distanceKm <= 5,
    )
    .map((r) => ({ r, o: tractRecord(r.tractId) }))
    .filter((v) => v.o.pm !== null && v.o.pmP !== null);
  for (const c of result.candidates) {
    assert.equal(c.healthcare.facility.subtype, "GACH");
    assert.ok(
      lookup(c.healthcare.representativePoint).some(
        (f) => f.properties.id === c.tractId,
      ),
    );
    const distances = hospitals.map((f) =>
      straightLineKm(c.healthcare.representativePoint, f.coordinate),
    );
    assert.ok(
      Math.abs(c.healthcare.distanceKm - Math.min(...distances)) < 1e-8,
    );
    assert.ok(
      !eligible.some(
        (v) =>
          Number(v.o.pm) <= c.observations[0].rawValue &&
          v.r.healthcare.hospital.distanceKm <= c.healthcare.distanceKm &&
          (Number(v.o.pm) < c.observations[0].rawValue ||
            v.r.healthcare.hospital.distanceKm < c.healthcare.distanceKm),
      ),
    );
  }
  const impossible = discovery({
    criteria: [{ indicator: "pm" }],
    activeSchool: false,
    healthcare: { kind: "hospital", maxDistanceKm: 0 },
  });
  assert.equal(impossible.candidates.length, 0);
  assert.ok(impossible.counts.healthcare > 0);
});
test("application map bounds, scope restrictions, healthcare validation and numeric lower limits", async () => {
  const bbox = [-122.31, 37.74, -122.2, 37.85];
  const kit = createToolkit([], new AbortController().signal, undefined, bbox);
  const c = await kit.execute("discover_areas", {
    criteria: [{ indicator: "traffic", minRaw: 200, maxRaw: 400 }],
    activeSchool: false,
    useMap: true,
  });
  assert.deepEqual(c.data.profile.bbox, bbox);
  assert.ok(
    c.data.candidates.every(
      (c) =>
        c.observations[0].rawValue >= 200 && c.observations[0].rawValue <= 400,
    ),
  );
  await assert.rejects(
    kit.execute("discover_areas", {
      criteria: [{ indicator: "traffic" }],
      activeSchool: false,
      bbox,
    }),
  );
  for (const question of [
    "Find lowest traffic in New York",
    "Find lowest traffic within city limits of Los Angeles",
  ])
    await assert.rejects(
      createToolkit(
        [],
        new AbortController().signal,
        undefined,
        undefined,
        question,
      ).execute("discover_areas", {
        criteria: [{ indicator: "traffic" }],
        activeSchool: false,
      }),
    );
  for (const input of [
    { healthcare: { kind: "hospice" } },
    { healthcare: { kind: "hospital", maxDistanceKm: -1 } },
    { limit: 11 },
    { criteria: [{ indicator: "traffic", minRaw: 4, maxRaw: 2 }] },
  ])
    assert.throws(() =>
      parseDiscoveryProfile({
        criteria: [{ indicator: "traffic" }],
        activeSchool: false,
        ...input,
      }),
    );
});

test("all environmental extrema agree with exhaustive independent field scans", () => {
  const { rows } = discoveryIndex();
  const fields = {
    pm: ["pm", "pmP"],
    ozone: ["ozone", "ozoneP"],
    diesel: ["diesel", "dieselP"],
    traffic: ["traffic", "trafficP"],
    "toxic-releases": ["toxic", "toxicP"],
    cleanup: ["cleanup", "cleanupP"],
  };
  for (const [indicator, [raw, pct]] of Object.entries(fields)) {
    const contracts = discovery({
      criteria: [{ indicator }],
      activeSchool: false,
    });
    // Resolve fields from the observation provenance rather than assuming legacy aliases.
    const observed = contracts.candidates[0].observations[0];
    const rfield = observed.provenance.rawField,
      pfield = observed.provenance.percentileField;
    const values = rows
      .map((r) => tractRecord(r.tractId))
      .filter((r) => r[rfield] !== null && r[pfield] !== null)
      .map((r) => Number(r[rfield]));
    for (const direction of ["lowest", "highest"]) {
      const d = discovery({
        criteria: [{ indicator, direction }],
        activeSchool: false,
      });
      const expected =
        direction === "lowest" ? Math.min(...values) : Math.max(...values);
      assert.ok(
        d.candidates.every((c) => c.observations[0].rawValue === expected),
      );
    }
  }
});

test("descriptive health/community extrema and healthcare-only rankings preserve scalar semantics", () => {
  for (const indicator of [
    "asthma",
    "heart-attacks",
    "diabetes",
    "low-birth-weight",
    "poverty",
    "education",
    "housing",
  ]) {
    const result = discovery({
      criteria: [{ indicator, direction: "highest" }],
      activeSchool: false,
      limit: 3,
    });
    assert.equal(result.candidates.length, 3);
    assert.ok(
      result.candidates[0].observations[0].rawValue >=
        result.candidates[1].observations[0].rawValue,
    );
  }
  const result = discovery({
    criteria: [],
    healthcare: { kind: "hospital" },
    activeSchool: false,
    limit: 3,
  });
  assert.equal(result.candidates.length, 3);
  assert.ok(
    result.candidates[0].healthcare.distanceKm <=
      result.candidates[1].healthcare.distanceKm,
  );
  assert.throws(() =>
    parseDiscoveryProfile({
      criteria: [{ indicator: "hisp" }],
      activeSchool: false,
    }),
  );
});

test("every discovery result has a genuine interior display point and unrequested school anchors are omitted", () => {
  const result = discovery({
    criteria: [{ indicator: "traffic" }, { indicator: "education" }],
    activeSchool: false,
    limit: 3,
  });
  assert.ok(result.candidates.length);
  for (const c of result.candidates) {
    assert.equal(c.schoolAnchors.length, 0);
    assert.ok(
      lookup(c.representativePoint).some((f) => f.properties.id === c.tractId),
    );
    assert.deepEqual(
      c.observations.map((o) => o.indicatorId),
      ["traffic", "education"],
    );
  }
});
