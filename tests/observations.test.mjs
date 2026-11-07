import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { loadBackendModules } from "./load-backend-modules.mjs";
const modules = await loadBackendModules();
after(modules.cleanup);
const {
  readyIndicator,
  normalizeObservation,
  compareObservations,
  requestedIndicators,
  validateTractId,
  validateVersion,
  sourceNumber,
} = modules.observations;
const { indicatorMap } = modules.map;
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
const a = "06001403402",
  b = "06019000602";
test("both ready air indicators normalize all 9,106 source tracts without invented percentiles", () => {
  assert.deepEqual(
    requestedIndicators(null).map((i) => i.id),
    ["pm", "ozone"],
  );
  for (const id of ["pm", "ozone"]) {
    const i = readyIndicator(id);
    for (const [tid, row] of Object.entries(rows)) {
      const o = normalizeObservation(tid, row, i);
      assert.equal(o.rawValue, Number(row[i.rawField]));
      assert.equal(o.percentile, Number(row[i.percentileField]));
      assert.equal(o.status, "available");
      assert.equal(o.unit, id === "pm" ? "µg/m³" : "ppm");
      assert.equal(o.measurementPeriod, "2022–2024");
      assert.deepEqual(o.qualityFlags, []);
    }
  }
});
test("official linked-app evidence validates actual units, period, hashes and representative values", () => {
  const o = normalizeObservation(a, rows[a], readyIndicator("pm"));
  assert.equal(
    o.provenance.sha256,
    crypto
      .createHash("sha256")
      .update(fs.readFileSync("data/raw/ces.csv"))
      .digest("hex"),
  );
  const evidence = JSON.parse(
    fs.readFileSync("data/contracts/air-evidence.json"),
  );
  for (const id of ["pm", "ozone"]) {
    const e = evidence.evidence[id];
    const bytes = fs.readFileSync(e.rawAppFile);
    assert.equal(
      crypto.createHash("sha256").update(bytes).digest("hex"),
      e.rawAppSHA256,
    );
    const popup =
      JSON.parse(bytes).values.searchConfiguration.sources[1].popupTemplate
        .description;
    assert.match(
      popup,
      id === "pm" ? /micrograms per meter cubed/ : /parts per million/,
    );
    assert.match(popup, /2022 to 2024/);
  }
  for (const c of evidence.pointChecks) {
    const p = JSON.parse(fs.readFileSync(c.responseFile)).features[0]
      .attributes;
    assert.equal(String(p.tract).padStart(11, "0"), c.tractId);
    for (const field of c.fields)
      assert(
        Math.abs(p[field] - Number(rows[c.tractId][field])) < c.matchTolerance,
      );
  }
});
test("signed comparison is correct for either order and equal for same-tract locations", () => {
  for (const id of ["pm", "ozone"]) {
    const i = readyIndicator(id);
    const ao = normalizeObservation(a, rows[a], i),
      bo = normalizeObservation(b, rows[b], i);
    const c = compareObservations(ao, bo);
    assert(c.compatible);
    assert.equal(
      c.rawDifferenceBMinusA,
      Number(rows[b][i.rawField]) - Number(rows[a][i.rawField]),
    );
    assert.equal(
      c.percentilePointDifferenceBMinusA,
      Number(rows[b][i.percentileField]) - Number(rows[a][i.percentileField]),
    );
    assert.equal(
      compareObservations(bo, ao).rawDifferenceBMinusA,
      -c.rawDifferenceBMinusA,
    );
    const same = compareObservations(ao, { ...ao });
    assert(same.sameTract);
    assert.equal(same.rawDifferenceBMinusA, 0);
  }
});
test("incompatible period, definition, version, unit and geography withhold differences", () => {
  const o = normalizeObservation(a, rows[a], readyIndicator("pm"));
  for (const changes of [
    { unit: "ppm" },
    { definition: "different definition" },
    { provenance: { ...o.provenance, sha256: "different source artifact" } },
    { datasetVersion: "other" },
    { measurementPeriod: "other" },
    { geographicLevel: "county" },
    { indicatorId: "ozone" },
    { comparisonKey: "different-definition" },
  ]) {
    const c = compareObservations(o, { ...o, ...changes });
    assert(!c.compatible);
    assert.equal(c.rawDifferenceBMinusA, null);
    assert.equal(c.percentilePointDifferenceBMinusA, null);
  }
});
test("missing values remain missing, zero remains valid, corrupt numeric values fail explicitly", () => {
  const i = readyIndicator("pm");
  const missing = normalizeObservation(
      a,
      { ...rows[a], pm: null, pmP: null },
      i,
    ),
    zero = normalizeObservation(b, { ...rows[b], pm: "0", pmP: "0" }, i);
  assert.equal(missing.rawValue, null);
  assert.equal(sourceNumber("   "), null);
  assert.equal(missing.status, "missing");
  assert.equal(zero.rawValue, 0);
  assert.equal(zero.percentile, 0);
  assert.equal(compareObservations(missing, zero).rawDifferenceBMinusA, null);
  assert.equal(
    compareObservations(missing, zero).percentilePointDifferenceBMinusA,
    null,
  );
  assert.throws(() => sourceNumber("NaN"), /invalid numeric/);
  assert.throws(
    () => normalizeObservation(a, { ...rows[a], pmP: "101" }, i),
    /outside/,
  );
});
test("invalid IDs, unsupported indicators and dataset versions fail before serving data", () => {
  for (const id of ["6001403402", "11001980000", "06001403402x"])
    assert.throws(() => validateTractId(id));
  validateTractId(a);
  assert.throws(
    () => readyIndicator("asthma"),
    (e) => e.status === 422,
  );
  assert.throws(
    () => readyIndicator("invented"),
    (e) => e.status === 400,
  );
  assert.throws(() => requestedIndicators("pm,,ozone"));
  assert.throws(
    () => validateVersion("other"),
    (e) => e.status === 409,
  );
  validateVersion("ces-5.0-final-2026-07-01");
  assert.deepEqual(
    requestedIndicators("ozone,pm,ozone").map((i) => i.id),
    ["ozone", "pm"],
  );
});
test("indicator map retains canonical tract IDs, legacy properties, geometry and source values", () => {
  const sample = JSON.parse(
    fs.readFileSync("data/samples/frontend-v1.json"),
  ).displayFeatures;
  const before = JSON.stringify(sample);
  for (const id of ["pm", "ozone"]) {
    const out = indicatorMap(sample, id),
      i = readyIndicator(id);
    assert.equal(out.metadata.indicatorId, id);
    assert.deepEqual(out.metadata.legend.domain, [0, 100]);
    for (const feature of out.features) {
      assert.equal(
        feature.properties.value,
        Number(rows[feature.properties.id][i.rawField]),
      );
      assert.equal(
        feature.properties.percentile,
        Number(rows[feature.properties.id][i.percentileField]),
      );
      assert("pm" in feature.properties);
      assert("ozone" in feature.properties);
    }
    assert.deepEqual(out.features[0].geometry, sample.features[0].geometry);
  }
  assert.equal(JSON.stringify(sample), before);
  const missing = structuredClone(sample);
  missing.features[0].properties.ozone = null;
  missing.features[0].properties.ozoneP = null;
  const out = indicatorMap(missing, "ozone");
  assert.equal(out.features[0].properties.value, null);
  assert.equal(out.features[0].properties.percentile, null);
});
