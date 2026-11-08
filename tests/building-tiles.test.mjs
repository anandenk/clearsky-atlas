import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
let source = fs
  .readFileSync("src/contracts/building-tiles.ts", "utf8")
  .replace(
    'from "pmtiles"',
    `from ${JSON.stringify(import.meta.resolve("pmtiles"))}`,
  );
const mod = await import(
  "data:text/javascript;base64," +
    Buffer.from(stripTypeScriptTypes(source)).toString("base64")
);
test("tile coordinates enforce statewide bounds and complete-detail zoom", () => {
  for (const [x, y] of [
    [2842, 6537],
    [2627, 6330],
    [2859, 6614],
    [2740, 6392],
    [2662, 6286],
    [2541, 6153],
  ])
    assert.doesNotThrow(() => mod.validateBuildingTile(14, x, y));
  for (const args of [
    [13, 2842, 6537],
    [14, 1.5, 0],
    [14, -1, 0],
    [14, 16384, 0],
  ])
    assert.throws(
      () => mod.validateBuildingTile(...args),
      (e) => e.code === "invalid-tile",
    );
  assert.throws(
    () => mod.validateBuildingTile(14, 0, 0),
    (e) => e.code === "outside-coverage",
  );
  assert.throws(
    () => mod.requireBuildingTileVersion(null),
    (e) => e.status === 409,
  );
  assert.throws(
    () => mod.requireBuildingTileVersion("latest"),
    (e) => e.status === 409,
  );
});
test("slippy tile bounds enclose actual Rancho and Oakland acceptance coordinates", () => {
  for (const [x, y, lon, lat] of [
    [2842, 6537, -117.552, 34.127],
    [2627, 6330, -122.27, 37.81],
  ]) {
    const b = mod.buildingTileBounds(14, x, y);
    assert.ok(b[0] <= lon && b[2] >= lon && b[1] <= lat && b[3] >= lat);
  }
});

test("statewide cached tiles remain available without network; cold source failure is not empty success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network disabled for resilience test");
  };
  try {
    const tile = await mod.buildingVectorTile(14, 2842, 6537, "2026-10-21.0");
    assert.ok(tile.byteLength > 10000);
    const unique = "test-unavailable-" + process.pid;
    const coldSource = source
      .replace('"california.pmtiles"', '"missing-test.pmtiles"')
      .replace('"ranges"', JSON.stringify(unique));
    const cold = await import(
      "data:text/javascript;base64," +
        Buffer.from(stripTypeScriptTypes(coldSource)).toString("base64")
    );
    try {
      await assert.rejects(
        cold.buildingVectorTile(14, 2842, 6537, "2026-10-21.0"),
        (e) => e.status === 503 && e.code === "data-unavailable",
      );
    } finally {
      fs.rmSync("data/buildings/2026-10-21.0/" + unique, {
        recursive: true,
        force: true,
      });
    }
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      mod.buildingVectorTile(14, 2842, 6537, "2026-10-21.0", controller.signal),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
