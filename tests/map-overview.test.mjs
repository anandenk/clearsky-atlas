import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { loadBackendModules } from "./load-backend-modules.mjs";
const modules = await loadBackendModules();
test.after(modules.cleanup);
const standard = JSON.parse(fs.readFileSync("data/display.json"));
const overview = JSON.parse(fs.readFileSync("data/display-overview.json"));
const rows = JSON.parse(fs.readFileSync("data/observations.json"));
const proof = JSON.parse(fs.readFileSync("data/contracts/map-overview.json"));
test("overview retains every tract ID and source hashes without altering existing lookup/display", () => {
  assert.equal(overview.features.length, 9106);
  assert.deepEqual(
    overview.features.map((f) => f.properties.id),
    standard.features.map((f) => f.properties.id),
  );
  assert.equal(
    new Set(overview.features.map((f) => f.properties.id)).size,
    9106,
  );
  for (const [file, hash] of [
    ["data/display-overview.json", proof.artifactSha256],
    ["data/display.json", proof.displayInputSha256],
    ["data/lookup.json", proof.lookupSha256],
  ])
    assert.equal(
      crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"),
      hash,
    );
  assert.deepEqual(proof.newCoverageErrorIds, []);
  assert.equal(proof.sourceInvalidCoverageIds.length, 5);
  assert.ok(proof.relativeAreaChangeMax <= 0.1);
  assert.equal(proof.areaGuardRetainedIds.length, 278);
});
test("all overview rings are finite/closed, feature bounds contain coordinates, missing metrics remain source-null", () => {
  for (const f of overview.features) {
    assert.match(f.properties.id, /^06\d{9}$/);
    const polys =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    for (const rings of polys)
      for (const ring of rings) {
        assert.ok(ring.length >= 4);
        assert.deepEqual(ring[0], ring.at(-1));
        for (const [x, y] of ring) {
          assert.ok(Number.isFinite(x) && Number.isFinite(y));
          assert.ok(
            x >= f.bbox[0] &&
              x <= f.bbox[2] &&
              y >= f.bbox[1] &&
              y <= f.bbox[3],
          );
        }
      }
  }
  for (const indicator of modules.indicators.indicatorContracts) {
    const features = overview.features.map((f) => ({
      ...f,
      properties: {
        id: f.properties.id,
        [indicator.rawField]: modules.observations.sourceNumber(
          rows[f.properties.id][indicator.rawField],
        ),
        ...(indicator.percentileField
          ? {
              [indicator.percentileField]: modules.observations.sourceNumber(
                rows[f.properties.id][indicator.percentileField],
              ),
            }
          : {}),
      },
    }));
    const map = modules.map.indicatorMap(
      { type: "FeatureCollection", features },
      indicator.id,
      "overview",
    );
    for (const f of map.features) {
      const r = rows[f.properties.id];
      assert.equal(
        f.properties.value,
        modules.observations.sourceNumber(r[indicator.rawField]),
      );
      assert.equal(
        f.properties.percentile,
        indicator.percentileField
          ? modules.observations.sourceNumber(r[indicator.percentileField])
          : null,
      );
      assert.ok(!("place" in f.properties));
    }
    assert.equal(map.metadata.legend.kind, indicator.visualization.kind);
    assert.equal(map.metadata.geometry.artifactSha256, proof.artifactSha256);
    assert.equal(map.metadata.geometry.purpose, "display-only");
    assert.equal(map.metadata.geometry.simplificationMeters, null);
  }
});
test("default map contract remains standard; explicit overview must be valid", () => {
  const feature = standard.features[0];
  const map = modules.map.indicatorMap(
    { type: "FeatureCollection", features: [feature] },
    "pm",
  );
  assert.equal(map.metadata.geometry.simplificationMeters, 30);
  assert.deepEqual(map.features[0].geometry, feature.geometry);
  assert.equal(map.features[0].properties.place, feature.properties.place);
  assert.equal(modules.map.mapDetail(null), "standard");
  assert.equal(modules.map.mapDetail("overview"), "overview");
  assert.throws(
    () => modules.map.mapDetail("auto"),
    (e) => e.status === 400,
  );
});
