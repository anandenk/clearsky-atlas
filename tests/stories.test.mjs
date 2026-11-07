import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadBackendModules } from "./load-backend-modules.mjs";
const m = await loadBackendModules();
test.after(m.cleanup);
const { storyCatalog, comparisonStories, describeStoryStep, narrativeNumber } =
  m.stories;
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
const a = "06001403402",
  b = "06019000602";
const locations = [
  { id: "oakland", tractId: a },
  { id: "fresno", tractId: b },
  { id: "oakland-second", tractId: a },
];
const read = (id) => rows[id] ?? null;
const step = (result, id) =>
  result.topics.flatMap((t) => t.steps).find((s) => s.id === id);
test("curated catalog covers all 23 verified fields exactly once and preserves a separate coordinate-dependent facilities gate", () => {
  const catalog = storyCatalog();
  assert.deepEqual(
    catalog.topics.map((t) => t.id),
    ["environment", "health", "community", "population", "nearby-essentials"],
  );
  const ids = catalog.topics.flatMap((t) => t.steps.map((s) => s.indicatorId));
  assert.equal(new Set(ids).size, 23);
  assert.deepEqual(
    [...ids].sort(),
    m.indicators.indicatorContracts.map((i) => i.id).sort(),
  );
  for (const topic of catalog.topics.slice(0, 4))
    for (const s of topic.steps) {
      const i = m.observations.readyIndicator(s.indicatorId);
      assert.equal(s.target.mode, i.mode);
      assert.equal(s.definitionSource, i.definitionSource);
    }
  const nearby = catalog.topics.at(-1);
  assert.equal(nearby.availability, "use-coordinate-facility-api");
  assert.deepEqual(nearby.steps, []);
  assert.ok(nearby.activationTrigger);
  assert.equal(nearby.sourceReadinessUrl, "/api/facilities/catalog");
});
test("real story statements trace to exact overview rows, reference differences and source provenance for every field", () => {
  const result = comparisonStories({ locations, referenceId: "oakland" }, read);
  assert.equal(result.topics.length, 4);
  assert.equal(result.evidence.rows.length, 23);
  assert.equal(result.evidence.comparisonDirection, "location-minus-reference");
  for (const row of result.evidence.rows) {
    const s = step(result, row.indicatorId);
    assert.equal(s.evidenceRowId, row.indicatorId);
    assert.equal(s.measurementPeriod, row.measurementPeriod);
    assert.equal(s.source.sha256, row.provenance.sha256);
    assert.equal(s.source.rawField, row.provenance.rawField);
    assert.equal(s.source.definitionUrl, row.definitionSource);
    for (let i = 0; i < row.values.length; i++) {
      const value = row.values[i],
        statement = s.locationStatements[i];
      assert.equal(statement.locationId, value.locationId);
      assert.equal(statement.tractId, value.tractId);
      if (value.rawValue !== null)
        assert.ok(
          statement.observationText.includes(narrativeNumber(value.rawValue)),
        );
      const diff = value.comparisonToReference.rawDifferenceBMinusA;
      if (diff !== null && diff !== 0) {
        assert.ok(
          statement.comparisonText.includes(narrativeNumber(Math.abs(diff))),
        );
        assert.match(statement.comparisonText, diff > 0 ? /above/ : /below/);
      }
    }
  }
  assert.ok(step(result, "pm").locationStatements[2].sameTractNote);
  const swapped = comparisonStories(
    { locations, referenceId: "fresno", topics: ["environment"] },
    read,
  );
  const pm = step(swapped, "pm");
  assert.match(pm.locationStatements[0].comparisonText, /below/);
  assert.match(
    step(result, "pm").locationStatements[1].comparisonText,
    /above/,
  );
});
test("source percentages and percentage-point differences stay separate, with no population percentile", () => {
  const result = comparisonStories(
    { locations, topics: ["population", "community"] },
    read,
  );
  assert.deepEqual(
    result.topics.map((t) => t.id),
    ["community", "population"],
  );
  const poverty = step(result, "poverty");
  assert.match(poverty.locationStatements[0].observationText, /%/);
  assert.match(
    poverty.locationStatements[1].comparisonText,
    /percentage points/,
  );
  for (const s of result.topics.find((t) => t.id === "population").steps) {
    assert.ok(s.locationStatements.every((v) => v.percentileText === null));
    assert.equal(
      result.evidence.rows.find((r) => r.indicatorId === s.id).visualization
        .kind,
      "neutral-percentage",
    );
  }
});
test("actual missing/zero and same-tract records produce qualified prose without invented raw differences", () => {
  const missing = Object.keys(rows).find(
    (id) =>
      m.observations.normalizeObservation(
        id,
        rows[id],
        m.observations.readyIndicator("low-birth-weight"),
      ).rawValue === null,
  );
  const zero = Object.keys(rows).find(
    (id) =>
      m.observations.normalizeObservation(
        id,
        rows[id],
        m.observations.readyIndicator("cleanup"),
      ).rawValue === 0,
  );
  const absent = comparisonStories(
    {
      locations: [{ id: "missing", tractId: missing }, locations[0]],
      topics: ["health"],
    },
    read,
  );
  const lbw = step(absent, "low-birth-weight");
  assert.match(lbw.locationStatements[0].observationText, /No raw observation/);
  assert.ok(
    lbw.locationStatements.every((s) =>
      s.comparisonText.startsWith("No raw difference"),
    ),
  );
  const z = comparisonStories(
    { locations: [{ id: "zero", tractId: zero }], topics: ["environment"] },
    read,
  );
  assert.match(
    step(z, "cleanup").locationStatements[0].observationText,
    /^0 weighted site score/,
  );
  const same = comparisonStories(
    { locations: [locations[0], locations[2]], topics: ["environment"] },
    read,
  );
  assert.match(step(same, "pm").text, /same tract-level observation/);
  const allMissing = comparisonStories(
    {
      locations: [
        { id: "m1", tractId: missing },
        { id: "m2", tractId: missing },
      ],
      topics: ["health"],
    },
    read,
  );
  assert.match(
    step(allMissing, "low-birth-weight").text,
    /No raw observations/,
  );
});
test("explicit incompatible fixture withholds narrative comparison/range, and significant-digit formatting retains tiny nonzero values", () => {
  const row = m.overview.comparisonOverview(
    { locations, indicators: ["pm"] },
    read,
  ).rows[0];
  const incompatible = {
    ...row,
    summary: { ...row.summary, compatible: false, rawRange: null },
    values: row.values.map((v) => ({
      ...v,
      comparisonToReference: {
        ...v.comparisonToReference,
        compatible: false,
        rawDifferenceBMinusA: null,
      },
    })),
  };
  const s = describeStoryStep(incompatible);
  assert.match(s.text, /range is withheld/);
  assert.ok(
    s.locationStatements.every((v) =>
      v.comparisonText.startsWith("Comparison withheld"),
    ),
  );
  assert.equal(narrativeNumber(0), "0");
  assert.equal(narrativeNumber(-0), "0");
  assert.notEqual(narrativeNumber(1e-12), "0");
  assert.equal(narrativeNumber(12.3456), "12.35");
  assert.throws(
    () => narrativeNumber(Infinity),
    (e) => e.status === 503,
  );
});
test("request errors retain source/version/location validation; nearby-only request yields no invented facility facts", () => {
  for (const input of [
    null,
    [],
    { locations, topics: [] },
    { locations, topics: ["unknown"] },
    { locations, topics: ["health", "health"] },
    { locations, indicators: ["pm"] },
  ])
    assert.throws(
      () => comparisonStories(input, read),
      (e) => e.status === 400,
    );
  assert.throws(
    () => comparisonStories({ locations, version: "wrong" }, read),
    (e) => e.status === 409,
  );
  assert.throws(
    () => comparisonStories({ locations, referenceId: "unknown" }, read),
    (e) => e.status === 400,
  );
  assert.throws(
    () =>
      comparisonStories(
        { locations: [{ id: "x", tractId: "06999999999" }] },
        read,
      ),
    (e) => e.status === 404,
  );
  const nearby = comparisonStories(
    { locations, topics: ["nearby-essentials"] },
    read,
  );
  assert.equal(nearby.evidence.rows.length, 0);
  assert.equal(nearby.topics.length, 1);
  assert.deepEqual(nearby.topics[0].steps, []);
  assert.equal(nearby.topics[0].availability, "use-coordinate-facility-api");
});
