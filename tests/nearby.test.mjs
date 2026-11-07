import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { containingTracts } from "../src/spatial.ts";
import { loadBackendModules } from "./load-backend-modules.mjs";
const m = await loadBackendModules();
test.after(m.cleanup);
const { nearbyComparison } = m.nearby;
const { facilityBundle, facilityQuery, facilityCatalog, straightLineKm } =
  m.facilities;
const exact = JSON.parse(fs.readFileSync("data/lookup.json")).features;
function fixture(name, id) {
  const match = JSON.parse(
    fs.readFileSync("data/raw/geocode-" + name + ".json"),
  ).result.addressMatches[0];
  return {
    id,
    tractId: match.geographies["Census Tracts"][0].GEOID,
    coordinate: [match.coordinates.x, match.coordinates.y],
    confirmed: true,
  };
}
const a = fixture("oakland-central", "oakland"),
  near = fixture("oakland-central-near", "oakland-near"),
  b = fixture("fresno", "fresno");
const dependencies = {
  lookupTracts: (c) => containingTracts(c, exact).map((f) => f.properties.id),
  getBundle: facilityBundle,
  catalog: facilityCatalog,
};
test("real confirmed points match full geometry; facility facts/differences equal direct category queries with original coordinates", () => {
  const result = nearbyComparison(
    { locations: [a, b, near], referenceId: a.id, limit: 3 },
    dependencies,
  );
  assert.equal(result.contractVersion, "atlas-nearby-comparison-v1");
  assert.equal(result.verification.confirmationSource, "caller-attestation");
  assert.equal(result.verification.geocoderRequeried, false);
  assert.deepEqual(
    result.locations.map((l) => l.coordinate),
    [a.coordinate, b.coordinate, near.coordinate],
  );
  for (const category of result.categories) {
    assert.equal(category.availability, "ready");
    const bundle = facilityBundle(category.category);
    for (const [i, location] of [a, b, near].entries()) {
      const direct = facilityQuery(
        new URLSearchParams({
          category: category.category,
          near: location.coordinate.join(","),
          limit: "3",
          evidence: "linked",
        }),
        bundle,
      );
      const actual = category.results[i];
      assert.deepEqual(actual.facilities, direct.facilities);
      assert.equal(
        actual.nearestDistanceKm,
        straightLineKm(location.coordinate, direct.facilities[0].coordinate),
      );
      assert.equal(
        actual.comparisonToReference.nearestDistanceDifferenceKm,
        actual.nearestDistanceKm - category.results[0].nearestDistanceKm,
      );
      assert.ok(actual.text.includes(direct.facilities[0].status));
      assert.ok(actual.text.includes(direct.facilities[0].sourcePeriod));
    }
    assert.equal(category.results[2].comparisonToReference.sameTract, true);
    assert.equal(
      category.results[2].comparisonToReference.sameCoordinate,
      false,
    );
    assert.notEqual(
      category.results[2].nearestDistanceKm,
      category.results[0].nearestDistanceKm,
    );
  }
  const swapped = nearbyComparison(
    { locations: [a, b], referenceId: b.id, categories: ["schools"] },
    dependencies,
  );
  assert.equal(
    swapped.categories[0].results[0].comparisonToReference
      .nearestDistanceDifferenceKm,
    -result.categories[0].results[1].comparisonToReference
      .nearestDistanceDifferenceKm,
  );
});
test("same coordinate gives zero difference and preserves distinct stable IDs", () => {
  const result = nearbyComparison(
    { locations: [a, { ...a, id: "same-point" }], categories: ["schools"] },
    dependencies,
  ).categories[0];
  assert.equal(result.results.length, 2);
  assert.equal(
    result.results[1].comparisonToReference.nearestDistanceDifferenceKm,
    0,
  );
  assert.equal(result.results[1].comparisonToReference.sameCoordinate, true);
  assert.equal(
    result.results[1].comparisonToReference.sameNearestFacility,
    true,
  );
});
test("unconfirmed, invalid, uncovered, mismatched and ambiguous points are withheld before any facility query", () => {
  for (const [location, status, code] of [
    [{ ...a, confirmed: false }, 422, "location-confirmation-required"],
    [{ ...a, coordinate: [37, -122] }, 400, "invalid-nearby-request"],
    [{ ...a, coordinate: [-130, 36] }, 422, "coordinate-not-covered"],
    [{ ...a, tractId: b.tractId }, 409, "coordinate-tract-mismatch"],
  ])
    assert.throws(
      () => nearbyComparison({ locations: [location] }, dependencies),
      (e) => e.status === status && e.code === code,
    );
  let called = false;
  assert.throws(
    () =>
      nearbyComparison(
        { locations: [a] },
        {
          ...dependencies,
          lookupTracts: () => [a.tractId, b.tractId],
          getBundle: () => {
            called = true;
            throw Error("must not query");
          },
        },
      ),
    (e) => e.code === "ambiguous-tract-membership",
  );
  assert.equal(called, false);
});
test("category failures are independent, power stays unready, and explicit source/version mismatches never compare", () => {
  const result = nearbyComparison(
    { locations: [a, b], categories: ["schools", "healthcare", "power"] },
    {
      ...dependencies,
      getBundle: (category) => {
        if (category === "healthcare") throw Error("fixture source failure");
        return facilityBundle(category);
      },
    },
  );
  assert.equal(result.categories[0].availability, "ready");
  assert.equal(result.categories[1].availability, "failed");
  assert.deepEqual(result.categories[1].results, []);
  assert.equal(result.categories[2].availability, "unavailable");
  assert.equal(result.categories[2].sourceReadiness.backendReady, false);
  assert.throws(
    () =>
      nearbyComparison(
        { locations: [a], facilityVersions: { schools: "wrong" } },
        dependencies,
      ),
    (e) => e.status === 409 && e.code === "unsupported-facility-version",
  );
  assert.throws(
    () => nearbyComparison({ locations: [a], version: "wrong" }, dependencies),
    (e) => e.status === 409,
  );
});
test("explicit empty-source and closed-status fixtures produce truthful null/status evidence without access guarantees", () => {
  const empty = nearbyComparison(
    { locations: [a, b], categories: ["schools"] },
    {
      ...dependencies,
      getBundle: () => ({ ...facilityBundle("schools"), facilities: [] }),
    },
  ).categories[0];
  assert.ok(
    empty.results.every(
      (r) =>
        r.nearestDistanceKm === null &&
        r.comparisonToReference.nearestDistanceDifferenceKm === null,
    ),
  );
  const original = facilityBundle("schools"),
    closed = original.facilities.find((f) => f.status === "Closed");
  assert.ok(closed);
  const result = nearbyComparison(
    { locations: [a], categories: ["schools"] },
    {
      ...dependencies,
      getBundle: () => ({ ...original, facilities: [closed] }),
    },
  ).categories[0].results[0];
  assert.equal(result.facilities[0].status, "Closed");
  assert.match(result.text, /Source status: Closed/);
});
test("batch/category/version-pin/limit validation rejects unsupported selectors with no silent fallback", () => {
  for (const extra of [
    { categories: null },
    { categories: [] },
    { categories: ["unknown"] },
    { categories: ["schools", "schools"] },
    { limit: 0 },
    { limit: 11 },
    { limit: "3" },
    { bbox: [-125, 32, -114, 43] },
    { indicators: ["pm"] },
    { facilityVersions: null },
    { categories: ["power"], facilityVersions: { power: "wrong" } },
  ])
    assert.throws(
      () => nearbyComparison({ locations: [a], ...extra }, dependencies),
      (e) => e.status === 400,
    );
});

test("an actual shared vertex in the unsimplified source is withheld as ambiguous", () => {
  const feature = exact.find((f) => f.properties.id === a.tractId);
  const ring =
    feature.geometry.type === "Polygon"
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0];
  const boundary = ring.find((c) => dependencies.lookupTracts(c).length > 1);
  assert.ok(boundary, "source tract should have a shared boundary vertex");
  assert.throws(
    () =>
      nearbyComparison(
        { locations: [{ ...a, coordinate: boundary }] },
        dependencies,
      ),
    (e) => e.code === "ambiguous-tract-membership",
  );
});
