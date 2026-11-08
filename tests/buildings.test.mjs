import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const source = fs.readFileSync("src/contracts/buildings.ts", "utf8");
const mod = await import(
  "data:text/javascript;base64," +
    Buffer.from(stripTypeScriptTypes(source)).toString("base64")
);
const v = mod.BUILDING_VERSION;
test("indexed selection matches brute force, preserves source nulls/height and IDs", () => {
  for (const [name, bbox] of [
    ["rancho", [-117.56, 34.12, -117.55, 34.13]],
    ["oakland", [-122.275, 37.8, -122.265, 37.81]],
  ]) {
    const data = mod.buildingData(bbox, v);
    const raw = JSON.parse(
      fs.readFileSync(`data/raw/buildings/${v}/${name}.geojson`),
    );
    const index = JSON.parse(
      fs.readFileSync(`data/buildings/${v}/${name}.json`),
    );
    const expected = index.features.filter(
      (f) =>
        f.bbox[0] <= bbox[2] &&
        f.bbox[2] >= bbox[0] &&
        f.bbox[1] <= bbox[3] &&
        f.bbox[3] >= bbox[1],
    );
    assert.deepEqual(
      data.features.map((f) => f.id).sort(),
      expected.map((f) => f.id).sort(),
    );
    const originals = new Map(raw.features.map((f) => [f.id, f]));
    assert.ok(data.features.length > 100);
    assert.ok(data.features.some((f) => f.properties.height === null));
    for (const f of data.features) {
      const r = originals.get(f.id);
      assert.deepEqual(f.geometry, r.geometry);
      assert.equal(f.properties.height, r.properties.height ?? null);
      assert.equal(f.properties.levels, r.properties.num_floors ?? null);
    }
    assert.equal(data.metadata.truncated, false);
  }
});
test("invalid release, large bounds, uncovered views and cancellation fail explicitly", () => {
  assert.throws(
    () => mod.buildingData([-117.56, 34.12, -117.55, 34.13], null),
    (e) => e.status === 409,
  );
  assert.throws(
    () => mod.buildingData([-118, 34, -117, 35], v),
    (e) => e.code === "bounds-too-large",
  );
  assert.throws(
    () => mod.buildingData([-121, 38, -120.99, 38.01], v),
    (e) => e.code === "outside-coverage",
  );
  const c = new AbortController();
  c.abort();
  assert.throws(() =>
    mod.buildingData([-117.56, 34.12, -117.55, 34.13], v, c.signal),
  );
});
