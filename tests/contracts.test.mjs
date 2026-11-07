import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { catalog } from "../src/contracts/indicators.ts";
import { parseBounds } from "../src/contracts/bounds.ts";
const metadata = catalog();
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
test("catalog fields and null counts match all cached source observations", () => {
  assert.equal(metadata.indicators.length, 23);
  assert.equal(new Set(metadata.indicators.map((i) => i.id)).size, 23);
  for (const i of metadata.indicators) {
    assert(
      Object.values(rows).every((o) => i.rawField in o),
      i.id,
    );
    assert.equal(
      Object.values(rows).filter((o) => o[i.rawField] === null).length,
      i.missingRawCount,
      i.id,
    );
    if (i.percentileField) {
      assert(Object.values(rows).every((o) => i.percentileField in o));
      assert.equal(
        Object.values(rows).filter((o) => o[i.percentileField] === null).length,
        i.missingPercentileCount,
      );
      assert.deepEqual(i.percentileDomain, [0, 100]);
    } else {
      assert.equal(i.percentileDomain, null);
      assert.equal(i.missingPercentileCount, null);
    }
  }
});
test("unverified contracts remain explicit and cannot appear fully approved", () => {
  const pm = metadata.indicators.find((i) => i.id === "pm");
  assert.equal(pm.unitVerification, "pending-primary-corroboration");
  assert.equal(pm.rawDifferencePolicy, "provisional-unit");
  for (const i of metadata.indicators) {
    if (
      i.periodVerification === "unresolved" ||
      i.unitVerification === "unresolved"
    ) {
      assert.equal(i.availability, "metadata-only");
      assert.equal(i.rawDifferencePolicy, "withheld-pending-contract");
      assert(i.unresolved.length > 0);
    }
  }
  assert.equal(metadata.facilities.apiAvailable, false);
  assert.equal(metadata.dataset.namedLicense, null);
});
test("bounds reject empty tokens, nonfinite values, inverted axes, out-of-range and dateline wrapping", () => {
  for (const bad of [
    null,
    "",
    "1,2,3",
    "1,2,3,4,5",
    ",0,1,2",
    "0, ,1,2",
    "NaN,0,1,2",
    "0,0,Infinity,2",
    "-181,0,1,2",
    "0,-91,1,2",
    "0,0,181,2",
    "0,0,1,91",
    "2,0,1,2",
    "0,2,1,1",
    "170,-10,-170,10",
  ])
    assert.equal(parseBounds(bad), null, String(bad));
  assert.deepEqual(
    parseBounds(" -122.28,37.79,-122.25,37.82 "),
    [-122.28, 37.79, -122.25, 37.82],
  );
  assert.deepEqual(parseBounds("-180,-90,180,90"), [-180, -90, 180, 90]);
});
test("frontend fixture retains real API strings/nulls and exactly two display features", () => {
  const f = JSON.parse(fs.readFileSync("data/samples/frontend-v1.json"));
  assert.equal(f.locations.length, 2);
  assert.equal(f.displayFeatures.features.length, 2);
  for (const loc of f.locations) {
    assert.deepEqual(loc.observations, rows[loc.tractId]);
    assert(
      f.displayFeatures.features.some((p) => p.properties.id === loc.tractId),
    );
    assert.equal(loc.tractId, loc.censusTract);
  }
  assert.equal(
    rows[f.genuineMissingObservation.tractId][
      f.genuineMissingObservation.indicatorField
    ],
    null,
  );
});
