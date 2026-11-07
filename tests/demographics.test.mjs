import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { loadBackendModules } from "./load-backend-modules.mjs";
const m = await loadBackendModules();
test.after(m.cleanup);
const { demographicCatalog, tractDemographics, requestedDemographicGroups } =
  m.demographics;
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
const proof = JSON.parse(
  fs.readFileSync("data/contracts/demographic-evidence.json"),
);
const a = "06001403402";
test("catalog maps the exact source categories, denominator and dictionary/layer evidence", () => {
  const c = demographicCatalog();
  assert.equal(c.contractVersion, "atlas-demographics-v1");
  assert.deepEqual(
    c.groups.map((g) => g.id),
    ["age", "race-ethnicity"],
  );
  assert.equal(c.denominator.sourceField, "ACS2024Pop");
  assert.equal(c.measurementPeriod, "2020–2024 ACS 5-year");
  assert.equal(c.normalization, "none");
  assert.equal(c.derivedCategoryCounts, false);
  assert.deepEqual(
    c.groups.flatMap((g) => g.categories.map((c) => c.id)),
    [
      "pop_und10",
      "pop_10_64",
      "pop_ov64",
      "hisp",
      "white",
      "black",
      "amind",
      "asian",
      "pacisl",
      "othmult",
    ],
  );
  assert.equal(c.groups[1].categories[0].sourceLayerField, "Hispanic");
  assert.equal(c.groups[1].categories.at(-1).sourceLabel, "Other/Multiple (%)");
  assert.equal(
    c.source.dictionarySha256,
    proof.sourceProvenance["ces.pdf"].sha256,
  );
  for (const [file, p] of Object.entries(proof.sourceProvenance))
    assert.equal(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync("data/raw/" + file))
        .digest("hex"),
      p.sha256,
    );
});
test("every tract preserves the ten canonical raw shares including zero/missing, source population, complete sums and no renormalization", () => {
  const zeroCounts = { age: 0, "race-ethnicity": 0 },
    missingCounts = { age: 0, "race-ethnicity": 0 },
    not100 = { age: 0, "race-ethnicity": 0 };
  for (const [tid, row] of Object.entries(rows)) {
    const result = tractDemographics(tid, row);
    assert.equal(result.denominator.populationEstimate, Number(row.ACS2024Pop));
    for (const group of result.groups) {
      for (const category of group.categories) {
        const n = m.observations.normalizeObservation(
          tid,
          row,
          m.observations.readyIndicator(category.id),
        );
        assert.equal(category.value, n.rawValue);
        assert.equal(category.percentile, null);
        assert.equal(category.status, n.status);
        if (category.value === 0) zeroCounts[group.id]++;
      }
      if (group.complete) {
        assert.equal(group.status, "available");
        assert.equal(group.isWithinRoundingAllowance, true);
        assert.deepEqual(group.missingCategoryIds, []);
        if (group.reportedSumPercent !== 100) not100[group.id]++;
      } else {
        missingCounts[group.id]++;
        assert.equal(group.status, "missing");
        assert.equal(group.availableShareSumPercent, null);
        assert.equal(group.reportedSumPercent, null);
        assert.equal(group.residualTo100PercentagePoints, null);
        assert.equal(group.isWithinRoundingAllowance, null);
        assert.equal(result.denominator.populationEstimate, 0);
      }
    }
  }
  assert.deepEqual(zeroCounts, { age: 139, "race-ethnicity": 14438 });
  assert.deepEqual(missingCounts, { age: 25, "race-ethnicity": 25 });
  assert.deepEqual(not100, { age: 2219, "race-ethnicity": 3844 });
});
test("actual rounding discrepancies remain reported with diagnostics and no invented residual category", () => {
  const [tid, row] = Object.entries(rows).find(
    ([tid, row]) =>
      tractDemographics(tid, row, "race-ethnicity").groups[0]
        .reportedSumPercent === 100.02,
  );
  const group = tractDemographics(tid, row, "race-ethnicity").groups[0];
  assert.equal(group.reportedSumPercent, 100.02);
  assert.equal(group.residualTo100PercentagePoints, -0.02);
  assert.equal(group.isWithinRoundingAllowance, true);
  assert.equal(group.categories.length, 7);
  assert.equal(group.categories.at(-1).value, Number(row.othmult));
  assert.ok(group.categories.every((c) => c.id !== "residual"));
});
test("explicit partial/zero/anomalous fixtures preserve values and flag incomplete or inconsistent sums", () => {
  const partial = tractDemographics(
    a,
    { ...rows[a], pop_und10: null, pop_10_64: "0", pop_ov64: "25" },
    "age",
  ).groups[0];
  assert.equal(partial.status, "partial");
  assert.equal(partial.categories[0].value, null);
  assert.equal(partial.categories[1].value, 0);
  assert.equal(partial.availableShareSumPercent, 25);
  assert.equal(partial.reportedSumPercent, null);
  assert.equal(partial.residualTo100PercentagePoints, null);
  assert.equal(partial.isWithinRoundingAllowance, null);
  const inconsistent = tractDemographics(
    a,
    { ...rows[a], pop_und10: "50", pop_10_64: "50", pop_ov64: "50" },
    "age",
  ).groups[0];
  assert.equal(inconsistent.reportedSumPercent, 150);
  assert.equal(inconsistent.isWithinRoundingAllowance, false);
  assert.ok(
    inconsistent.qualityFlags.includes(
      "reported-sum-outside-rounding-allowance",
    ),
  );
  assert.deepEqual(
    inconsistent.categories.map((c) => c.value),
    [50, 50, 50],
  );
  for (const value of ["-1", "101", "33.333"])
    assert.throws(
      () => tractDemographics(a, { ...rows[a], pop_und10: value }, "age"),
      (e) => e.status === 503,
    );
  assert.throws(
    () => tractDemographics(a, { ...rows[a], ACS2024Pop: "-1" }),
    (e) => e.status === 503,
  );
});
test("explicit group/tract validation has no fallback and retains requested group order", () => {
  for (const groups of [
    "",
    ",",
    "age,unknown",
    "population",
    "age,race-ethnicity,age",
  ])
    assert.throws(
      () => requestedDemographicGroups(groups),
      (e) => e.status === 400,
    );
  assert.deepEqual(
    tractDemographics(a, rows[a], "race-ethnicity,age").groups.map((g) => g.id),
    ["race-ethnicity", "age"],
  );
  assert.equal(tractDemographics(a, rows[a], "age").groups.length, 1);
  assert.throws(
    () => tractDemographics("bad", rows[a]),
    (e) => e.status === 400,
  );
});
