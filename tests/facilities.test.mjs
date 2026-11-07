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
const { facilityBundle, facilityQuery, straightLineKm, facilityCatalog } =
  await import(pathToFileURL(path.join(dir, "facilities.mjs")));
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

test("statewide healthcare acquisition preserves all source FACIDs, snapshot/status and out-of-coverage points", async () => {
  const health = facilityBundle("healthcare");
  assert.equal(health.facilities.length, 14921);
  assert.equal(new Set(health.facilities.map((f) => f.id)).size, 14921);
  assert.equal(
    health.facilities.filter((f) => f.coordinate !== null).length,
    14919,
  );
  const rows = [];
  for (let i = 0; i < 15; i++)
    rows.push(
      ...JSON.parse(
        await fs.readFile(
          `data/raw/healthcare-statewide-page-${String(i).padStart(2, "0")}.json`,
        ),
      ).result.records,
    );
  assert.deepEqual(
    health.facilities.map((f) => f.id).sort(),
    rows.map((r) => "cdph:" + r.FACID).sort(),
  );
  for (const f of health.facilities) {
    assert.match(f.id, /^cdph:\d{9}$/);
    assert.equal(f.observationDate, "2026-10-16");
    assert.equal(f.status, "OPEN");
    assert.equal(f.subtype, f.sourceAttributes.FAC_TYPE_CODE);
    if (f.coordinate)
      assert.deepEqual(f.coordinate, [
        f.sourceAttributes.LONGITUDE,
        f.sourceAttributes.LATITUDE,
      ]);
  }
  const excluded = health.facilities.filter((f) => f.coordinate === null);
  assert.deepEqual(
    excluded.map((f) => f.id),
    ["cdph:630006081", "cdph:630017965"],
  );
  assert.equal(excluded[1].sourceAttributes.FIPS_COUNTY_CODE, 41015); // Oregon branch, not California.
  assert.ok(
    excluded.every((f) => f.flags.includes("outside-ces-tract-coverage")),
  );
  for (const [name, provenance] of Object.entries(health.provenance)) {
    assert.equal(
      createHash("sha256")
        .update(await fs.readFile("data/raw/" + name))
        .digest("hex"),
      provenance.sha256,
    );
  }
  const manifest = JSON.parse(
    await fs.readFile("data/facilities/healthcare-manifest.json"),
  );
  for (const [name, entry] of Object.entries(manifest.files))
    assert.equal(
      createHash("sha256")
        .update(await fs.readFile("data/facilities/" + name))
        .digest("hex"),
      entry.sha256,
    );
});
test("healthcare geographic coordinates agree with independent LA-hosted WGS84 geometry at two facilities", async () => {
  const health = facilityBundle("healthcare");
  const reference = JSON.parse(
    await fs.readFile("data/facility-verification/healthcare-sample.json"),
  );
  for (const f of reference.features) {
    const r = health.facilities.find(
      (r) => r.sourceAttributes.FACID === f.attributes.FACID,
    );
    assert.ok(r?.coordinate);
    assert.ok(
      straightLineKm(r.coordinate, [f.geometry.x, f.geometry.y]) < 0.003,
    );
  }
});
test("healthcare query stays category/version isolated; real excluded coordinates never leak into nearest search", () => {
  const health = facilityBundle("healthcare");
  const result = facilityQuery(
    new URLSearchParams("category=healthcare&near=-122.271,37.803&limit=5"),
    health,
  );
  assert.equal(result.matchedCount, 14919);
  assert.equal(result.returnedCount, 5);
  assert.ok(
    result.facilities.every(
      (f) => f.id.startsWith("cdph:") && f.distanceKm >= 0,
    ),
  );
  for (let i = 1; i < result.facilities.length; i++)
    assert.ok(
      result.facilities[i].distanceKm >= result.facilities[i - 1].distanceKm,
    );
  assert.throws(
    () =>
      facilityQuery(
        new URLSearchParams(
          "category=healthcare&near=0,0&version=" + bundle.datasetVersion,
        ),
        health,
      ),
    (e) => e.status === 409,
  );
  assert.throws(
    () =>
      facilityQuery(new URLSearchParams("category=schools&near=0,0"), health),
    (e) => e.status === 422,
  );
  assert.equal(facilityBundle(), bundle);
});

test("complete CEC candidate preserves raw fields/nulls but cannot assert status or reporting period", async () => {
  const stagedBytes = await fs.readFile(
    "data/facility-verification/power-normalized.json",
  );
  const staged = JSON.parse(stagedBytes);
  const raw = JSON.parse(await fs.readFile("data/raw/power-inventory.json"));
  const ids = JSON.parse(
    await fs.readFile("data/raw/power-inventory-ids.json"),
  ).objectIds;
  assert.equal(staged.backendReady, false);
  assert.equal(staged.facilities.length, 2378);
  assert.equal(staged.facilities.filter((f) => f.coordinate).length, 2334);
  assert.deepEqual(
    staged.facilities
      .map((f) => f.sourceAttributes.OBJECTID)
      .sort((a, b) => a - b),
    ids.sort((a, b) => a - b),
  );
  assert.equal(new Set(staged.facilities.map((f) => f.id)).size, 2378);
  const byId = new Map(
    raw.features.map((f) => ["cec:" + f.attributes.CECPlantID, f]),
  );
  for (const f of staged.facilities) {
    assert.deepEqual(f.sourceAttributes, byId.get(f.id).attributes);
    assert.deepEqual(f.sourceGeometry, byId.get(f.id).geometry);
    assert.equal(f.status, null);
    assert.equal(f.sourcePeriod, null);
    assert.equal(f.observationDate, null);
    if (f.coordinate)
      assert.deepEqual(f.coordinate, [
        byId.get(f.id).geometry.x,
        byId.get(f.id).geometry.y,
      ]);
    else assert.ok(f.flags.includes("outside-ces-tract-coverage"));
  }
  assert.equal(staged.audit.nullCounts.Capacity_Latest, 1);
  assert.equal(staged.audit.nullCounts.PriEnergySource, 6);
  assert.deepEqual(staged.audit.rawRetiredCodeCounts, { 0: 2082, 1: 296 });
  assert.ok(staged.audit.maxIndependentTransformDifferenceMetres < 3);
  assert.equal(staged.audit.sourceCrs, "EPSG:4269");
  assert.equal(staged.audit.queryCrs, "EPSG:4326");
  for (const [name, provenance] of Object.entries(staged.provenance))
    assert.equal(
      createHash("sha256")
        .update(await fs.readFile("data/raw/" + name))
        .digest("hex"),
      provenance.sha256,
    );
  const readiness = JSON.parse(
    await fs.readFile("data/contracts/power-readiness.json"),
  );
  assert.equal(
    createHash("sha256").update(stagedBytes).digest("hex"),
    readiness.stagedArtifactSha256,
  );
  assert.throws(
    () => facilityQuery(new URLSearchParams("category=power&near=0,0"), staged),
    (e) => e.status === 422,
  );
});
test("facility catalog exposes ready inventories and explicit unavailable power gates without point payloads", () => {
  const catalog = facilityCatalog();
  assert.equal(catalog.contractVersion, "atlas-facility-catalog-v1");
  assert.deepEqual(
    catalog.categories.map((c) => c.id),
    ["schools", "healthcare", "power"],
  );
  const [schools, health, power] = catalog.categories;
  assert.equal(schools.backendReady, true);
  assert.equal(health.backendReady, true);
  assert.equal(power.backendReady, false);
  assert.ok(catalog.categories.every((c) => !("facilities" in c)));
  assert.equal(power.sourcePeriod, null);
  assert.equal(power.observationDate, null);
  assert.deepEqual(
    power.blockers.map((b) => b.code),
    ["reporting-period-unverified", "retired-code-unverified"],
  );
  assert.ok(power.blockers.every((b) => b.trigger));
});

test("opt-in linked evidence reduces repeated manifests while retaining identical facility facts and versioned evidence reference", () => {
  const full = facilityQuery(
    new URLSearchParams("category=schools&near=-122.271,37.803&limit=6"),
    bundle,
  );
  const linked = facilityQuery(
    new URLSearchParams(
      "category=schools&near=-122.271,37.803&limit=6&evidence=linked",
    ),
    bundle,
  );
  assert.deepEqual(linked.facilities, full.facilities);
  assert.deepEqual(linked.coverage, full.coverage);
  assert.deepEqual(linked.rights, full.rights);
  assert.equal(linked.matchedCount, full.matchedCount);
  assert.equal(linked.provenance.catalogUrl, "/api/facilities/catalog");
  assert.equal(linked.provenance.datasetVersion, full.datasetVersion);
  assert.equal(linked.provenance.category, "schools");
  assert.ok(JSON.stringify(linked).length < JSON.stringify(full).length / 2);
  assert.deepEqual(
    facilityCatalog().categories.find((c) => c.id === "schools").provenance,
    full.provenance,
  );
  assert.throws(
    () =>
      facilityQuery(
        new URLSearchParams("category=schools&near=0,0&evidence=none"),
        bundle,
      ),
    (e) => e.status === 400,
  );
});
