import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadBackendModules } from "./load-backend-modules.mjs";
const modules = await loadBackendModules();
test.after(modules.cleanup);
const { comparisonOverview, parseOverviewRequest, summarizeObservations } =
  modules.overview;
const { normalizeObservation, readyIndicator, compareObservations } =
  modules.observations;
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
const a = "06001403402",
  b = "06019000602";
const locations = [
  { id: "oakland", tractId: a },
  { id: "fresno", tractId: b },
  { id: "oakland-other-address", tractId: a },
];
const get = (id) => rows[id] ?? null;
test("overview retains location identities/order and same-tract evidence, matching pairwise comparisons across all 23 indicators", () => {
  const reads = [];
  const result = comparisonOverview(
    { locations, referenceId: "fresno" },
    (id) => {
      reads.push(id);
      return get(id);
    },
  );
  assert.deepEqual(reads, [a, b]);
  assert.equal(result.rows.length, 23);
  assert.deepEqual(
    result.locations.map((l) => l.id),
    locations.map((l) => l.id),
  );
  for (const row of result.rows) {
    const i = readyIndicator(row.indicatorId),
      ref = normalizeObservation(b, rows[b], i);
    assert.equal(row.summary.distinctTractCount, 2);
    for (let j = 0; j < locations.length; j++) {
      const expected = normalizeObservation(
        locations[j].tractId,
        rows[locations[j].tractId],
        i,
      );
      assert.equal(row.values[j].rawValue, expected.rawValue);
      assert.deepEqual(
        row.values[j].comparisonToReference,
        compareObservations(ref, expected),
      );
    }
    assert.equal(row.values[0].rawValue, row.values[2].rawValue);
    assert.equal(row.measurementPeriod, i.measurementPeriod);
    assert.equal(row.provenance.sha256, ref.provenance.sha256);
  }
  const same = comparisonOverview(
    { locations: [locations[0], locations[2]], indicators: ["pm"] },
    get,
  ).rows[0];
  assert.equal(same.summary.allSameTract, true);
  assert.equal(same.summary.rawRange.spread, 0);
  assert.equal(same.values[1].comparisonToReference.sameTract, true);
  const reordered = comparisonOverview(
    {
      locations: [locations[2], locations[1], locations[0]],
      referenceId: "fresno",
      indicators: ["pm"],
    },
    get,
  );
  assert.equal(
    reordered.rows[0].values[0].rawValue,
    result.rows[0].values[2].rawValue,
  );
});
test("range units distinguish raw percentages from percentage-point spreads; demographics remain neutral", () => {
  const result = comparisonOverview(
    {
      locations: locations.slice(0, 2),
      indicators: ["poverty", "pop_und10", "pm"],
    },
    get,
  );
  assert.deepEqual(
    result.rows.map((r) => r.indicatorId),
    ["poverty", "pop_und10", "pm"],
  );
  for (const row of result.rows.slice(0, 2)) {
    assert.equal(row.summary.rawRange.unit, "%");
    assert.equal(row.summary.rawRange.spreadUnit, "percentage points");
  }
  assert.equal(result.rows[1].summary.percentileRange, null);
  assert.equal(result.rows[1].visualization.kind, "neutral-percentage");
  assert.equal(result.rows[2].summary.rawRange.unit, "µg/m³");
  assert.equal(
    result.rows[2].summary.percentileRange.spreadUnit,
    "percentile points",
  );
});
test("actual suppression/zero records remain distinct; missing reference withholds differences and range uses available values", () => {
  const missing = Object.keys(rows).find(
    (id) =>
      normalizeObservation(id, rows[id], readyIndicator("low-birth-weight"))
        .rawValue === null,
  );
  const zero = Object.keys(rows).find(
    (id) =>
      normalizeObservation(id, rows[id], readyIndicator("cleanup")).rawValue ===
      0,
  );
  const result = comparisonOverview(
    {
      locations: [
        { id: "missing", tractId: missing },
        { id: "a", tractId: a },
        { id: "b", tractId: b },
      ],
      indicators: ["low-birth-weight"],
    },
    get,
  ).rows[0];
  assert.equal(result.values[0].rawValue, null);
  assert.equal(result.summary.missingLocationCount, 1);
  assert.ok(
    result.values.every(
      (v) => v.comparisonToReference.rawDifferenceBMinusA === null,
    ),
  );
  assert.ok(result.summary.rawRange !== null);
  const z = comparisonOverview(
    {
      locations: [
        { id: "zero", tractId: zero },
        { id: "a", tractId: a },
      ],
      indicators: ["cleanup"],
    },
    get,
  ).rows[0];
  assert.equal(z.values[0].rawValue, 0);
  assert.equal(z.values[0].status, "available");
  const one = comparisonOverview(
    { locations: [locations[0]], indicators: ["pm"] },
    get,
  ).rows[0];
  assert.equal(one.summary.rawRange, null);
  assert.equal(one.values[0].comparisonToReference.rawDifferenceBMinusA, 0);
});
test("incompatible evidence suppresses summary ranges, with no invented importance score", () => {
  const first = normalizeObservation(a, rows[a], readyIndicator("pm"));
  const incompatible = { ...first, measurementPeriod: "different" };
  const result = summarizeObservations([first, incompatible]);
  assert.equal(result.compatible, false);
  assert.equal(result.rawRange, null);
  assert.equal(result.percentileRange, null);
  const missing = { ...first, rawValue: null, percentile: null };
  assert.equal(summarizeObservations([missing, missing]).rawRange, null);
  assert.equal(result.score, undefined);
});
test("malformed/oversized batches and missing references/tracts fail explicitly; repeated tracts allowed", () => {
  for (const input of [
    null,
    [],
    {},
    { locations: [] },
    {
      locations: Array.from({ length: 21 }, (_, i) => ({
        id: String(i),
        tractId: a,
      })),
    },
    {
      locations: [
        { id: "a", tractId: a },
        { id: "a", tractId: b },
      ],
    },
    { locations: [{ id: "a", tractId: 123 }] },
    { locations: [{ id: "a", tractId: a }], referenceId: "no" },
    { locations, indicators: [] },
    { locations, indicators: ["pm,ozone"] },
    { locations, version: 42 },
  ])
    assert.throws(
      () => parseOverviewRequest(input),
      (e) => e.status === 400,
    );
  assert.throws(
    () =>
      comparisonOverview(
        { locations: [{ id: "a", tractId: "06999999999" }] },
        get,
      ),
    (e) => e.status === 404,
  );
  assert.throws(
    () => parseOverviewRequest({ locations, version: "wrong" }),
    (e) => e.status === 409,
  );
  assert.throws(
    () => parseOverviewRequest({ locations, indicators: ["unknown"] }),
    (e) => e.status === 400,
  );
  assert.equal(parseOverviewRequest({ locations }).referenceId, "oakland");
  assert.equal(
    parseOverviewRequest({
      locations: Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        tractId: a,
      })),
    }).locations.length,
    20,
  );
});
test("indicator catalog corrects stale facility availability and links category-specific readiness", () => {
  const catalog = modules.indicators.catalog();
  assert.equal(catalog.facilities.apiAvailable, true);
  assert.equal(catalog.facilities.catalogUrl, "/api/facilities/catalog");
  assert.match(catalog.facilities.power, /unavailable/);
});
