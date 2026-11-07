import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "atlas-facility-test-"));
for (const name of ["facilities", "bounds"]) {
  let source = stripTypeScriptTypes(
    await fs.readFile(`src/contracts/${name}.ts`, "utf8"),
  );
  source = source
    .replace('"./observations"', '"./error.mjs"')
    .replace('"./bounds"', '"./bounds.mjs"');
  await fs.writeFile(path.join(dir, name + ".mjs"), source);
}
// Load the production error class without bringing in the indicator registry.
const obs = await fs.readFile("src/contracts/observations.ts", "utf8");
const errorClass = obs.slice(
  obs.indexOf("export class ContractError"),
  obs.indexOf("\n}", obs.indexOf("export class ContractError")) + 2,
);
await fs.writeFile(
  path.join(dir, "error.mjs"),
  stripTypeScriptTypes(errorClass),
);
const { facilityBundle, facilityQuery, straightLineKm } = await import(
  pathToFileURL(path.join(dir, "facilities.mjs"))
);
const bundle = facilityBundle();
const query = (s) => facilityQuery(new URLSearchParams(s), bundle);
test.after(() => fs.rm(dir, { recursive: true, force: true }));
test("complete source ID set, unique leading-zero CDS identities, all coordinates, preserved historical status", async () => {
  const ids = JSON.parse(
    await fs.readFile("data/raw/schools-ids.json"),
  ).objectIds.sort((a, b) => a - b);
  assert.deepEqual(
    bundle.facilities
      .map((f) => f.sourceAttributes.OBJECTID)
      .sort((a, b) => a - b),
    ids,
  );
  assert.equal(new Set(bundle.facilities.map((f) => f.id)).size, ids.length);
  assert.equal(
    bundle.facilities.filter((f) => f.status === "Closed").length,
    2,
  );
  assert.ok(bundle.facilities.some((f) => f.id.startsWith("cde:01")));
  for (const f of bundle.facilities) {
    assert.match(f.id, /^cde:\d{14}$/);
    assert.equal(f.observationDate, null);
    assert.equal(f.sourcePeriod, "2025-26");
    assert.equal(f.sourceAttributes.State, "CA");
    assert.ok(f.coordinate?.every(Number.isFinite));
    assert.deepEqual(f.flags, []);
  }
  assert.equal(Object.keys(bundle.audit.geographicCountyCounts).length, 58);
  for (const [name, provenance] of Object.entries(bundle.provenance)) {
    const bytes = await fs.readFile(`data/raw/${name}`);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      provenance.sha256,
    );
  }
});
test("distance is zero at identical points; correct quarter/half circumference and antimeridian", () => {
  assert.equal(straightLineKm([0, 0], [0, 0]), 0);
  assert.ok(
    Math.abs(straightLineKm([0, 0], [90, 0]) - 10007.557221) < 0.000001,
  );
  assert.ok(
    Math.abs(straightLineKm([0, 0], [180, 0]) - 20015.114442) < 0.000001,
  );
  assert.ok(
    Math.abs(straightLineKm([179, 0], [-179, 0]) - 222.39016) < 0.000001,
  );
});
test("real nearest query agrees with independent spherical dot-product ranking; subset bounds and deterministic limits", () => {
  const near = [-122.271, 37.803];
  const radians = (x) => (x * Math.PI) / 180;
  const dot = (c) =>
    Math.sin(radians(near[1])) * Math.sin(radians(c[1])) +
    Math.cos(radians(near[1])) *
      Math.cos(radians(c[1])) *
      Math.cos(radians(near[0] - c[0]));
  const expected = [...bundle.facilities]
    .sort((a, b) => dot(b.coordinate) - dot(a.coordinate))
    .slice(0, 10);
  const result = query(`category=schools&near=${near}&limit=10`);
  assert.deepEqual(
    result.facilities.map((f) => f.id),
    expected.map((f) => f.id),
  );
  assert.equal(result.matchedCount, 9946);
  assert.equal(result.truncated, true);
  assert.ok(result.facilities[0].distanceKm < 1);
  const limited = query(
    "category=schools&bbox=-122.28,37.79,-122.25,37.82&near=-122.271,37.803&limit=1000",
  );
  assert.ok(limited.matchedCount > 0);
  for (const f of limited.facilities)
    assert.ok(
      f.coordinate[0] >= -122.28 &&
        f.coordinate[0] <= -122.25 &&
        f.coordinate[1] >= 37.79 &&
        f.coordinate[1] <= 37.82,
    );
  const atPoint = query(
    `category=schools&near=${expected[0].coordinate}&limit=1`,
  );
  assert.equal(atPoint.facilities[0].distanceKm, 0);
  assert.equal(query("category=schools&bbox=0,0,1,1").returnedCount, 0);
});
test("invalid/unsupported requests fail explicitly and omitted distances stay null", () => {
  for (const s of [
    "category=schools",
    "category=schools&near=,1",
    "category=schools&near=91,91",
    "category=schools&bbox=1,1,0,0",
    "category=schools&near=0,0&limit=0",
    "category=schools&near=0,0&limit=1001",
    "category=schools&near=0,0&limit=1.5",
  ])
    assert.throws(
      () => query(s),
      (e) => e.status === 400,
    );
  assert.throws(
    () => query("category=healthcare&near=0,0"),
    (e) => e.status === 422,
  );
  assert.throws(
    () => query("category=schools&near=0,0&version=other"),
    (e) => e.status === 409,
  );
  assert.ok(
    query("category=schools&bbox=-125,32,-114,43&limit=1").facilities.every(
      (f) => f.distanceKm === null,
    ),
  );
});
test("explicit test fixture: missing geometry is excluded, co-located records retained, ties stable", () => {
  const base = bundle.facilities[0];
  const fixture = {
    ...bundle,
    facilities: [
      { ...base, id: "cde:2", coordinate: [0, 0], status: null },
      { ...base, id: "cde:1", coordinate: [0, 0], status: "Closed" },
      { ...base, id: "cde:missing", coordinate: null },
    ],
  };
  const result = facilityQuery(
    new URLSearchParams("category=schools&near=0,0"),
    fixture,
  );
  assert.equal(result.matchedCount, 2);
  assert.deepEqual(
    result.facilities.map((f) => f.id),
    ["cde:1", "cde:2"],
  );
  assert.equal(result.facilities[1].status, null);
  assert.equal(result.facilities[0].status, "Closed");
  assert.equal(result.facilities[0].distanceKm, 0);
});
