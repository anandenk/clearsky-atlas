import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { containingTracts } from "../src/spatial.ts";
import { compare, numberValue } from "../src/domain.ts";
const exact = JSON.parse(fs.readFileSync("data/lookup.json")).features;
const read = (n) =>
  JSON.parse(fs.readFileSync("data/raw/geocode-" + n + ".json")).result
    .addressMatches[0];
for (const name of ["oakland-central", "oakland-central-near", "fresno"])
  test(
    "full geometry agrees with independent Census2020 lookup: " + name,
    () => {
      const m = read(name),
        c = [m.coordinates.x, m.coordinates.y];
      assert.deepEqual(
        containingTracts(c, exact).map((x) => x.properties.id),
        [m.geographies["Census Tracts"][0].GEOID],
      );
    },
  );
test("same tract addresses retain distinct coordinates", () => {
  const a = read("oakland-central"),
    b = read("oakland-central-near");
  assert.notDeepEqual(a.coordinates, b.coordinates);
  assert.equal(
    a.geographies["Census Tracts"][0].GEOID,
    b.geographies["Census Tracts"][0].GEOID,
  );
});
test("outside California, ocean, and reversed coordinates have no membership", () => {
  for (const c of [
    [-77.035, 38.899],
    [-130, 36],
    [37.8, -122.26],
  ])
    assert.equal(containingTracts(c, exact).length, 0);
});
const polygon = (id, x) => ({
  type: "Feature",
  properties: { id },
  bbox: [x, 0, x + 1, 1],
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, 0],
        [x + 1, 0],
        [x + 1, 1],
        [x, 1],
        [x, 0],
      ],
    ],
  },
});
test("shared edge retains ambiguity rather than choosing a tract", () =>
  assert.equal(
    containingTracts([1, 0.5], [polygon("A", 0), polygon("B", 1)]).length,
    2,
  ));
test("holes are excluded from membership", () => {
  const p = polygon("hole", 0);
  p.geometry.coordinates.push([
    [0.2, 0.2],
    [0.2, 0.8],
    [0.8, 0.8],
    [0.8, 0.2],
    [0.2, 0.2],
  ]);
  assert.equal(containingTracts([0.5, 0.5], [p]).length, 0);
});
test("nulls, zero, compatibility and signed differences", () => {
  assert.equal(numberValue(null), null);
  assert.equal(numberValue("NA"), null);
  assert.equal(numberValue("0"), 0);
  assert.equal(compare(null, 5), null);
  assert.equal(compare(1, 5, false), null);
  assert.equal(compare(1, 5), 4);
  assert.equal(compare(5, 1), -4);
  assert.equal(compare(5, 5), 0);
});
test("observations join 1:1 with geometry, source pm null counts preserved", () => {
  const o = JSON.parse(fs.readFileSync("data/observations.json"));
  assert.equal(exact.length, 9106);
  assert.equal(new Set(exact.map((f) => f.properties.id)).size, 9106);
  assert(exact.every((f) => o[f.properties.id]));
  assert.equal(Object.values(o).filter((v) => v.pm === null).length, 0);
  assert.equal(Object.values(o).filter((v) => v.lbw === null).length, 234);
});

test("cached live CES point queries agree with CSV values and Census2020 IDs", () => {
  const observations = JSON.parse(fs.readFileSync("data/observations.json"));
  for (const key of ["oakland-central", "fresno"]) {
    const result = JSON.parse(
      fs.readFileSync("data/raw/ces-point-" + key + ".json"),
    );
    assert.equal(result.features.length, 1);
    const a = result.features[0].attributes;
    const id = String(a.tract).padStart(11, "0");
    assert.equal(id, read(key).geographies["Census Tracts"][0].GEOID);
    assert(Math.abs(a.PM2_5 - Number(observations[id].pm)) < 1e-8);
    assert(Math.abs(a.PM2_5_Pctl - Number(observations[id].pmP)) < 1e-8);
  }
});
