import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { stripTypeScriptTypes } from "node:module";

// No server-only modules, spatial caches, network calls or compiler config changes.
const directory = await fs.mkdtemp(
  path.join(os.tmpdir(), "atlas-address-test-"),
);
after(() => fs.rm(directory, { recursive: true, force: true }));
for (const name of ["address-input", "address-geocoding"]) {
  const source = await fs.readFile(`src/contracts/${name}.ts`, "utf8");
  await fs.writeFile(
    path.join(directory, name + ".mjs"),
    stripTypeScriptTypes(source).replace(
      '"./address-input"',
      '"./address-input.mjs"',
    ),
  );
}
const {
  normalizeAddressInput,
  planAddressQueries: plan,
  AddressInputError,
  GEOCODE_TIMEOUT_MS,
} = await import(pathToFileURL(path.join(directory, "address-input.mjs")));
const {
  resolveCensusAddress: resolve,
  isCensusStreetMatch,
  CENSUS_ADDRESS_ENDPOINT,
} = await import(pathToFileURL(path.join(directory, "address-geocoding.mjs")));
const addresses = (input) => plan(input).queries.map((q) => q.address);
const result = (addressMatches) =>
  Response.json({ result: { addressMatches } });
const signal = () => new AbortController().signal;
// A synthetic transport fixture, not an assertion that Census returned this point.
const match = {
  matchedAddress: "125 14TH ST, OAKLAND, CA, 94612",
  coordinates: { x: -122.26, y: 37.8 },
  addressComponents: { state: "CA", fromAddress: "101", toAddress: "199" },
  tigerLine: { tigerLineId: "synthetic-test-range" },
  geographies: { "Census Tracts": [{ GEOID: "06001402800" }] },
};

test("normalize Unicode spaces, full-width digits, pasted lines, punctuation and US suffixes", () => {
  assert.equal(
    normalizeAddressInput(
      " １２５\u00a014th\u2009St.\r\nOakland; California 94612‑1234\nUnited States of America ",
    ),
    "125 14th St., Oakland, California 94612-1234",
  );
  for (const country of [
    "US",
    "U.S.",
    "USA",
    "U.S.A.",
    "United States",
    "united states of america",
  ])
    assert.equal(
      normalizeAddressInput(`125 14th St, Oakland CA, ${country}`),
      "125 14th St, Oakland CA",
    );
  assert.equal(
    normalizeAddressInput("Address: “125 14th St, Oakland CA”"),
    "125 14th St, Oakland CA",
  );
  assert.equal(
    normalizeAddressInput("125\u200b14th St\tOakland CA"),
    "125 14th St Oakland CA",
  );
});

test("actionable rejection of absent/oversized/non-address/link inputs, never URL fetching", () => {
  for (const value of [
    null,
    {},
    0,
    "",
    "  ",
    "a".repeat(1001),
    "Oakland CA 94612",
    "PO Box 12 Oakland CA",
    "https://maps.example/address/125",
    "www.example.com/125",
    "125 Main St\u0000 Oakland CA",
  ])
    assert.throws(() => plan(value), AddressInputError, String(value));
  assert.throws(
    () => plan("https://127.0.0.1:3000/api/demo"),
    /Links are not opened/,
  );
  assert.throws(() => plan("Oakland"), /building number and street/);
});

test("baseline freeform stays direct; full state names and common California abbreviations normalize", () => {
  assert.deepEqual(addresses("125 14th St Oakland CA 94612"), [
    "125 14th St Oakland CA 94612",
  ]);
  assert.deepEqual(addresses("2600 Fresno St Fresno CA"), [
    "2600 Fresno St Fresno CA",
  ]);
  for (const state of ["California", "california", "Calif.", "Calif", "C.A."])
    assert.equal(
      addresses(`2600 Fresno St, Fresno, ${state}`)[0],
      "2600 Fresno St, Fresno, CA",
    );
  assert.equal(
    addresses("125 California St, Oakland, CA")[0],
    "125 California St, Oakland, CA",
  );
  assert.equal(
    addresses("125 14th st oakland ca 94612")[0],
    "125 14th st oakland CA 94612",
  );
});

test("missing state uses explicit California search context, never invents a city or ZIP", () => {
  assert.equal(plan("125 14th St Oakland").assumedCalifornia, true);
  assert.equal(addresses("125 14th St Oakland")[0], "125 14th St Oakland, CA");
  assert.equal(addresses("125 14th St 94612")[0], "125 14th St CA 94612");
  assert.equal(plan("125 14th St 97201").assumedCalifornia, false);
  assert.equal(plan("26000 Fresno St, Fresno").assumedCalifornia, true);
  assert(!addresses("125 14th St 97201").some((q) => /\bCA\b/.test(q)));
});

test("explicit other states survive full names, abbreviations and reordered components", () => {
  for (const input of [
    "125 Main St, Portland, OR 97201",
    "125 Main St Portland Oregon 97201",
    "Portland OR 125 Main St",
    "OR Portland 125 Main St",
    "Oregon Portland 125 Main St",
    "New York, NY, 125 Main St",
    "125 Main St, Washington, District of Columbia",
  ])
    assert.equal(plan(input).assumedCalifornia, false, input);
  assert.equal(
    addresses("125 Main St Portland Oregon 97201")[0],
    "125 Main St Portland OR 97201",
  );
  assert.equal(
    addresses("125 Main St, Washington, District of Columbia")[0],
    "125 Main St, Washington, DC",
  );
  assert(
    addresses("OR Portland 125 Main St").includes("125 Main St, Portland, OR"),
  );
  assert.equal(plan("125 Main St NE, Oakland").assumedCalifornia, true);
});

test("reordered city/state/ZIP components retain all locality constraints", () => {
  for (const input of [
    "Oakland, CA 94612, 125 14th St",
    "94612, Oakland, CA, 125 14th St",
    "CA, Oakland, 125 14th St, 94612",
  ])
    assert(
      addresses(input).some((q) =>
        /^125 14th St, Oakland, CA(?:,\s*| )94612$/.test(q),
      ),
      input,
    );
  assert(
    addresses("Oakland CA 94612 125 14th St").includes(
      "125 14th St, Oakland CA 94612",
    ),
  );
  assert(
    addresses("Fresno California 2600 Fresno St").includes(
      "2600 Fresno St, Fresno CA",
    ),
  );
  assert(
    addresses("94612 Oakland 125 14th St").some((q) =>
      q.startsWith("125 14th St,"),
    ),
  );
  assert(
    addresses("94612 Oakland 125 14th St").includes(
      "125 14th St, Oakland, CA 94612",
    ),
  );
});

test("unit, public-building context and ZIP+4 fallbacks are explicit and retain street/city/state", () => {
  const unit = plan("125 14th St Apt 2 Oakland CA 94612-1234");
  assert.equal(
    unit.queries[0].address,
    "125 14th St Apt 2 Oakland CA 94612-1234",
  );
  assert.equal(unit.queries.at(-1).address, "125 14th St Oakland CA 94612");
  assert.match(
    unit.queries.at(-1).adjustments.join(" "),
    /Unit or floor omitted.*ZIP\+4/,
  );
  const building = plan(
    "Oakland Public Library, 125 14th St, Oakland, CA 94612",
  );
  assert.equal(
    building.queries.at(-1).address,
    "125 14th St, Oakland, CA 94612",
  );
  assert.match(
    building.queries.at(-1).adjustments.join(" "),
    /Building-name context omitted/,
  );
  assert.equal(addresses("125 Unit Circle, Oakland, CA").length, 1);
  assert.equal(addresses("12345-6789 Main St, Oakland, CA").length, 1);
  assert.equal(
    addresses("12345-6789 Main St, Oakland, CA")[0],
    "12345-6789 Main St, Oakland, CA",
  );
  assert.equal(
    addresses("125 14th St, Unit 2, Oakland, CA").at(-1),
    "125 14th St, Oakland, CA",
  );
});

test("every plan is deduplicated and bounded even with multiple interpretation changes", () => {
  const p = plan(
    "Oakland Public Library, Oakland, California 94612-1234, 125 14th St Apt 2",
  );
  assert(p.queries.length <= 3);
  assert.equal(
    new Set(p.queries.map((q) => q.address.toLowerCase())).size,
    p.queries.length,
  );
  assert(
    p.queries.every(
      (q) =>
        q.address.includes("125 14th St") &&
        q.address.includes("Oakland") &&
        q.address.includes("94612"),
    ),
  );
});

test("transport uses only the fixed Census source, no-store, unchanged benchmark/vintage and one deadline", async (t) => {
  let deadlines = 0;
  const timeout = AbortSignal.timeout;
  t.mock.method(AbortSignal, "timeout", (ms) => {
    deadlines++;
    assert.equal(ms, GEOCODE_TIMEOUT_MS);
    return timeout(ms);
  });
  const p = plan("Oakland, CA 94612, 125 14th St Apt 2");
  const seen = [];
  const signals = [];
  const answer = await resolve(p, signal(), async (url, init) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, CENSUS_ADDRESS_ENDPOINT);
    assert.equal(parsed.searchParams.get("benchmark"), "Public_AR_Current");
    assert.equal(parsed.searchParams.get("vintage"), "Census2020_Current");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    seen.push(parsed.searchParams.get("address"));
    signals.push(init.signal);
    return result(seen.length === p.queries.length ? [match] : []);
  });
  assert.deepEqual(
    seen,
    p.queries.map((q) => q.address),
  );
  assert(signals.every((s) => s === signals[0]));
  assert.equal(deadlines, 1);
  assert.equal(answer.requests, p.queries.length);
  assert.deepEqual(answer.matches, [match]);
});

test("first nonempty result preserves ambiguity and outside-CA matches; no wider retry", async () => {
  const ambiguous = [
    match,
    {
      ...match,
      addressComponents: { ...match.addressComponents, state: "NV" },
    },
  ];
  let calls = 0;
  const answer = await resolve(
    plan("Oakland, CA, 125 14th St"),
    signal(),
    async () => {
      calls++;
      return result(ambiguous);
    },
  );
  assert.equal(calls, 1);
  assert.deepEqual(answer.matches, ambiguous);
});

test("no-match budget is enforced in transport too; malformed responses and outages never fan out", async () => {
  const p = plan("125 14th St Oakland CA");
  p.queries = Array.from({ length: 10 }, (_, i) => ({
    address: `125 14th St Oakland CA ${i}`,
    adjustments: [],
  }));
  let calls = 0;
  const answer = await resolve(p, signal(), async () => {
    calls++;
    return result([]);
  });
  assert.equal(calls, 3);
  assert.deepEqual(answer.matches, []);
  for (const body of [
    new Response("offline", { status: 503 }),
    Response.json({ result: {} }),
    new Response("not json"),
    Response.json(null),
  ]) {
    calls = 0;
    await assert.rejects(
      resolve(p, signal(), async () => {
        calls++;
        return body;
      }),
    );
    assert.equal(calls, 1);
  }
});

test("cancelled or expired resolution makes no further request", async (t) => {
  const p = plan("Oakland, CA, 125 14th St Apt 2");
  let calls = 0;
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(
    resolve(p, cancelled.signal, async () => {
      calls++;
      return result([]);
    }),
  );
  assert.equal(calls, 0);
  const during = new AbortController();
  await assert.rejects(
    resolve(p, during.signal, async () => {
      calls++;
      during.abort();
      return result([]);
    }),
  );
  assert.equal(calls, 1);
  t.mock.method(AbortSignal, "timeout", () => cancelled.signal);
  await assert.rejects(
    resolve(p, signal(), async () => {
      calls++;
      return result([]);
    }),
  );
  assert.equal(calls, 1);
});

test("only complete street-range source matches qualify; missing/nonfinite points and centroids do not", () => {
  assert.equal(isCensusStreetMatch(match), true);
  for (const bad of [
    null,
    {},
    { ...match, tigerLine: undefined },
    { ...match, coordinates: { x: NaN, y: 37.8 } },
    { ...match, coordinates: { x: -122.26, y: 91 } },
    { ...match, addressComponents: { state: "CA" } },
    { ...match, matchedAddress: "" },
  ])
    assert.equal(isCensusStreetMatch(bad), false);
});
