// Verify actual same-origin statewide tile endpoints, source fields and cache replay.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
const base = process.env.ATLAS_ORIGIN ?? "http://127.0.0.1:3000";
const version = "2026-10-21.0";
const c = await fetch(`${base}/api/buildings/catalog?version=${version}`);
assert.equal(c.status, 200);
const catalog = await c.json();
assert.equal(catalog.metadata.scope, "statewide-california");
assert.equal(catalog.maxzoom, 14);
const report = { serving: catalog.metadata.serving, samples: [] };
let rawMatches = 0,
  missingHeight = 0,
  partFeatures = 0;
const rows = {};
for (const name of ["rancho", "oakland"]) {
  const r = JSON.parse(
    await fs.readFile(`data/raw/buildings/${version}/${name}.geojson`),
  );
  rows[name] = new Map(r.features.map((f) => [f.id, f.properties]));
}
for (const [name, lon, lat] of [
  ["rancho", -117.552, 34.127],
  ["oakland", -122.27, 37.81],
  ["san-diego", -117.16, 32.72],
  ["fresno", -119.787, 36.737],
  ["sacramento", -121.494, 38.582],
  ["eureka", -124.163, 40.802],
  ["tahoe", -119.97, 38.94],
  ["rural-desert", -115.75, 35.0],
]) {
  const x = Math.floor(((lon + 180) / 360) * 16384),
    y = Math.floor(
      ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 16384,
    );
  const url = `${base}/api/buildings/tiles/14/${x}/${y}?version=${version}`;
  const start = performance.now(),
    r = await fetch(url);
  assert.ok(
    [200, 204].includes(r.status),
    `${name}: ${r.status} ${await (r.ok ? Promise.resolve("") : r.text())}`,
  );
  const bytes = new Uint8Array(await r.arrayBuffer()),
    firstMs = performance.now() - start;
  const counts = {};
  let missing = 0,
    matched = 0;
  if (bytes.length) {
    const vt = new VectorTile(new PbfReader(bytes));
    for (const [layerName, layer] of Object.entries(vt.layers)) {
      assert.ok(["building", "building_part"].includes(layerName));
      counts[layerName] = layer.length;
      for (let i = 0; i < layer.length; i++) {
        const f = layer.feature(i),
          p = f.properties;
        assert.equal(typeof p.id, "string");
        if (p.height === undefined) {
          missing++;
          missingHeight++;
        } else assert.ok(Number.isFinite(p.height) && p.height >= 0);
        if (p.sources !== undefined)
          assert.ok(Array.isArray(JSON.parse(p.sources)));
        if (layerName === "building_part") {
          partFeatures++;
          assert.equal(typeof p.building_id, "string");
        }
        const raw = rows[name]?.get(p.id);
        if (raw && layerName === "building") {
          assert.equal(p.height ?? null, raw.height ?? null);
          assert.equal(p.num_floors ?? null, raw.num_floors ?? null);
          matched++;
          rawMatches++;
        }
      }
    }
  }
  const startWarm = performance.now(),
    warm = await fetch(url);
  assert.equal(warm.status, r.status);
  const replay = new Uint8Array(await warm.arrayBuffer());
  assert.deepEqual(replay, bytes);
  report.samples.push({
    name,
    z: 14,
    x,
    y,
    status: r.status,
    bytes: bytes.length,
    counts,
    missingHeight: missing,
    rawMatches: matched,
    firstMs,
    warmMs: performance.now() - startWarm,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  });
}
assert.ok(rawMatches > 2000);
assert.ok(missingHeight > 0);
assert.ok(partFeatures > 0);
for (const [p, status] of [
  ["/api/buildings/tiles/13/2842/6537?version=" + version, 400],
  ["/api/buildings/tiles/14/0/0?version=" + version, 422],
  ["/api/buildings/tiles/14/2842/6537", 409],
  ["/api/buildings/tiles/14/not-a-number/6537?version=" + version, 400],
]) {
  const r = await fetch(base + p);
  assert.equal(r.status, status);
}
report.rawHeightAndFloorMatches = rawMatches;
report.partFeatures = partFeatures;
await fs.writeFile(
  "data/benchmarks/buildings-statewide.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
