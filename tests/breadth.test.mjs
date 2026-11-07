import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { loadBackendModules } from "./load-backend-modules.mjs";
const modules = await loadBackendModules();
after(modules.cleanup);
const { readyIndicator, normalizeObservation, compareObservations } =
  modules.observations;
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
const c = modules.indicators.catalog();
test("all 23 original scalar/demographic entries have source-backed ready contracts", () => {
  assert.equal(c.indicators.length, 23);
  assert(
    c.indicators.every(
      (i) =>
        i.backendReady && i.unit && i.measurementPeriod && !i.unresolved.length,
    ),
  );
  const proof = JSON.parse(
    fs.readFileSync("data/contracts/indicator-evidence.json"),
  );
  assert.equal(Object.keys(proof.indicators).length, 13);
  for (const i of c.indicators) {
    if (i.percentileField) {
      const e = proof.indicators[i.id];
      assert.equal(e.unit, i.unit);
      assert.equal(e.measurementPeriod, i.measurementPeriod);
      assert.equal(e.rawField, i.rawField);
      const bytes = fs.readFileSync(e.cacheFile);
      assert.equal(
        crypto.createHash("sha256").update(bytes).digest("hex"),
        e.sha256,
      );
      const popup =
        JSON.parse(bytes).values.searchConfiguration.sources[1].popupTemplate;
      for (const token of e.assertions)
        assert(JSON.stringify(popup).includes(token), i.id + token);
    } else {
      assert.equal(i.unit, "%");
      assert.equal(i.periodVerification, "verified-dictionary");
      assert.equal(i.measurementPeriod, "2020–2024 ACS 5-year");
    }
  }
});
test("all source observations preserve raw/percentile nulls and zeros across every tract", () => {
  for (const i of c.indicators) {
    let nulls = 0,
      pctNulls = 0;
    for (const [tid, row] of Object.entries(rows)) {
      const o = normalizeObservation(tid, row, readyIndicator(i.id));
      assert.equal(
        o.rawValue,
        row[i.rawField] === null ? null : Number(row[i.rawField]),
        i.id + tid,
      );
      assert.equal(
        o.percentile,
        i.percentileField && row[i.percentileField] !== null
          ? Number(row[i.percentileField])
          : null,
      );
      if (o.rawValue === null) {
        nulls++;
        assert.equal(o.status, "missing");
        assert(o.qualityFlags.includes("raw-value-missing"));
      } else assert.equal(o.status, "available");
      if (i.percentileField && o.percentile === null) pctNulls++;
      if (row[i.rawField] === "0") assert.equal(o.rawValue, 0);
    }
    assert.equal(nulls, i.missingRawCount);
    if (i.percentileField) assert.equal(pctNulls, i.missingPercentileCount);
  }
});
test("source point queries match all intended scalar metrics, not just the air subset", () => {
  const proof = JSON.parse(
    fs.readFileSync("data/contracts/indicator-evidence.json"),
  );
  for (const check of proof.pointChecks) {
    const a = JSON.parse(fs.readFileSync(check.cacheFile)).features[0]
      .attributes;
    for (const field of check.fields) {
      assert.equal(a[field] === null, rows[check.tractId][field] === null);
      if (a[field] !== null)
        assert(
          Math.abs(Number(a[field]) - Number(rows[check.tractId][field])) <
            check.tolerance,
        );
    }
  }
});
test("demographic maps are neutral raw percentages with no invented percentile", () => {
  for (const i of c.indicators.filter((i) => !i.percentileField)) {
    assert.equal(i.visualization.kind, "neutral-percentage");
    assert.equal(i.visualization.property, "value");
    assert.equal(i.percentileDomain, null);
    const row = Object.values(rows).find((r) => r[i.rawField] !== null);
    const f = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "06001403402",
            [i.rawField]: Number(row[i.rawField]),
          },
          geometry: null,
        },
      ],
    };
    const map = modules.map.indicatorMap(f, i.id);
    assert.equal(map.metadata.legend.kind, "neutral-percentage");
    assert.equal(map.metadata.legend.property, "value");
    assert.deepEqual(map.metadata.legend.domain, [0, 100]);
    assert.equal(map.features[0].properties.percentile, null);
  }
});
test("actual suppressed health data and valid zero scores compare honestly", () => {
  const id = "low-birth-weight",
    i = readyIndicator(id);
  const [missingId, missingRow] = Object.entries(rows).find(
    ([, r]) => r.lbw === null,
  );
  const [validId, validRow] = Object.entries(rows).find(
    ([, r]) => r.lbw !== null,
  );
  const missing = normalizeObservation(missingId, missingRow, i),
    valid = normalizeObservation(validId, validRow, i);
  assert.equal(compareObservations(missing, valid).rawDifferenceBMinusA, null);
  assert.equal(
    compareObservations(missing, valid).percentilePointDifferenceBMinusA,
    null,
  );
  const poverty = readyIndicator("poverty");
  const a = normalizeObservation(validId, validRow, poverty);
  assert.equal(
    compareObservations(a, a).rawDifferenceUnit,
    "percentage points",
  );
  const cleanup = readyIndicator("cleanup");
  const [zeroId, zeroRow] = Object.entries(rows).find(
    ([, r]) => r.cleanups === "0",
  );
  const z = normalizeObservation(zeroId, zeroRow, cleanup);
  assert.equal(z.rawValue, 0);
  assert.equal(z.percentile, 0);
  assert.equal(z.status, "available");
});
