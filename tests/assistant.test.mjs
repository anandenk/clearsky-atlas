import test, { after } from "node:test";
import assert from "node:assert/strict";
import { loadAssistantModules } from "./load-assistant-modules.mjs";
const modules = await loadAssistantModules();
after(modules.cleanup);
const { runAssistant, validateFinish } = await modules.load("assistant/engine");
const { parseAssistantInput } = await modules.load("assistant/validation");
const { createToolkit } = await modules.load("assistant/tools");
const { demos } = await modules.load("data");
const { assistantFailure } = await modules.load("assistant/errors");
test("provider failures are useful and never disclose submitted content or credentials", () => {
  for (const status of [400, 401, 403, 429, 500]) {
    const failure = assistantFailure(
      Object.assign(new Error("secret-key private-address"), { status }),
    );
    assert.ok(!JSON.stringify(failure).includes("secret-key"));
    assert.ok(!JSON.stringify(failure).includes("private-address"));
    assert.equal(failure.status, status === 429 ? 429 : 503);
  }
  assert.equal(
    assistantFailure(new DOMException("private", "TimeoutError")).status,
    504,
  );
  assert.equal(
    assistantFailure(new Error("private"), true).body.code,
    "assistant-timeout",
  );
});
const locations = demos().map((s, i) => ({
  id: String(i + 1),
  label: s.label,
  tractId: s.tractId,
  coordinate: s.coordinate,
  confirmed: true,
}));
const response = (calls) => ({
  candidates: [
    {
      content: {
        role: "model",
        parts: calls.map(([name, args]) => ({ functionCall: { name, args } })),
      },
    },
  ],
  usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10 },
});
test("comparison tool reuses versioned contracts, original IDs and null/percentage point policies", async () => {
  const kit = createToolkit(locations, new AbortController().signal);
  const c = await kit.execute("compare_places", {
    locationIds: ["1", "2"],
    indicators: ["pm", "poverty"],
  });
  assert.equal(c.data.rows[0].values[0].rawValue, 8.325309645);
  assert.equal(c.data.rows[0].values[1].rawValue, 12.47532712);
  assert.equal(
    c.data.rows[1].values[1].comparisonToReference.rawDifferenceUnit,
    "percentage points",
  );
  assert.equal(c.data.rows[0].datasetVersion, undefined);
  assert.equal(c.data.datasetVersion, "ces-5.0-final-2026-07-01");
  const same = await kit.execute("compare_places", {
    locationIds: ["1"],
    indicators: ["pm"],
  });
  assert.equal(
    same.data.rows[0].values[0].comparisonToReference.rawDifferenceBMinusA,
    0,
  );
});
test("model cannot supply coordinates, confirmation, unknown tools or invented location IDs", async () => {
  const kit = createToolkit(locations, new AbortController().signal);
  for (const [name, args] of [
    ["compare_places", { locationIds: ["unknown"], indicators: ["pm"] }],
    [
      "compare_places",
      { locationIds: ["1"], indicators: ["pm"], confirmed: true },
    ],
    [
      "compare_facilities",
      { locationIds: ["1"], categories: ["schools"], coordinate: [0, 0] },
    ],
    ["confirm_address", { id: "1" }],
  ])
    await assert.rejects(kit.execute(name, args));
  assert.throws(() =>
    createToolkit(
      [{ ...locations[0], coordinate: locations[1].coordinate }],
      new AbortController().signal,
    ),
  );
  assert.throws(() =>
    parseAssistantInput({
      message: "Hi",
      locations: [{ ...locations[0], confirmed: false }],
    }),
  );
});
test("explicit loop returns only validated cards and staged comparison actions", async () => {
  const kit = createToolkit(locations, new AbortController().signal);
  let n = 0;
  const r = await runAssistant(
    { message: "Compare", locations },
    {
      ...kit,
      model: "fixture",
      signal: new AbortController().signal,
      generate: async () =>
        ++n === 1
          ? response([
              [
                "compare_places",
                { locationIds: ["1", "2"], indicators: ["pm"] },
              ],
            ])
          : response([
              [
                "finish_response",
                {
                  message:
                    "These places have different fine particle concentrations. See the evidence.",
                  evidenceIds: ["e1"],
                  openComparison: true,
                },
              ],
            ]),
    },
  );
  assert.equal(r.evidence.length, 1);
  assert.deepEqual(r.actions[0].locationIds, ["1", "2"]);
  assert.equal(r.usage.inputTokens, 40);
  assert.throws(() =>
    validateFinish(
      { message: "The value is 123", evidenceIds: ["e1"] },
      kit.cards,
      locations,
    ),
  );
  assert.throws(() =>
    validateFinish(
      { message: "See source", evidenceIds: ["invented"] },
      kit.cards,
      locations,
    ),
  );
  assert.throws(() =>
    validateFinish(
      { message: "Compare", evidenceIds: [], openComparison: true },
      [],
      locations,
    ),
  );
});
test("loop, parallel-call, deadline and cancellation budgets are enforced", async () => {
  const base = {
    cards: [],
    execute: async () => {
      throw Error("not reached");
    },
    model: "fixture",
    signal: new AbortController().signal,
  };
  await assert.rejects(
    runAssistant(
      { message: "Loop" },
      {
        ...base,
        generate: async () => response([["unknown", {}]]),
        execute: async () => {
          const { ContractError } = await modules.load(
            "contracts/observations",
          );
          throw new ContractError(400, "unknown", "Unknown tool");
        },
      },
    ),
    (e) => e.code === "assistant-round-budget",
  );
  await assert.rejects(
    runAssistant(
      { message: "Fanout" },
      {
        ...base,
        generate: async () => response(Array(13).fill(["unknown", {}])),
      },
    ),
    (e) => e.code === "assistant-call-budget",
  );
  const pending = runAssistant(
    { message: "Wait" },
    {
      ...base,
      limits: { rounds: 6, calls: 12, deadlineMs: 20 },
      generate: () => new Promise(() => {}),
    },
  );
  const keepAlive = setTimeout(() => {}, 100);
  await assert.rejects(pending, (e) => e.name === "TimeoutError");
  clearTimeout(keepAlive);
  const c = new AbortController();
  c.abort();
  await assert.rejects(
    runAssistant(
      { message: "Cancel" },
      { ...base, signal: c.signal, generate: async () => response([]) },
    ),
  );
  await assert.rejects(
    runAssistant(
      { message: "Quota" },
      {
        ...base,
        generate: async () => {
          throw Object.assign(new Error("private"), { status: 429 });
        },
      },
    ),
    (e) => e.status === 429,
  );
});
test("same-tract addresses preserve separate school distances and raw school statuses", async () => {
  const a = locations[0];
  const { selection } = await modules.load("data");
  const fs = await import("node:fs");
  const m = JSON.parse(
    fs.readFileSync("data/raw/geocode-oakland-central-near.json", "utf8"),
  ).result.addressMatches[0];
  assert.ok(m, "cached independently geocoded nearby address");
  const other = selection(
    m.matchedAddress,
    [m.coordinates.x, m.coordinates.y],
    true,
    m.geographies["Census Tracts"][0].GEOID,
  );
  const kit = createToolkit(
    [
      a,
      {
        id: "other",
        label: other.label,
        coordinate: other.coordinate,
        tractId: other.tractId,
        confirmed: true,
      },
    ],
    new AbortController().signal,
  );
  const card = await kit.execute("compare_facilities", {
    locationIds: ["1", "other"],
    categories: ["schools"],
  });
  const results = card.data.categories[0].results;
  assert.equal(results[1].comparisonToReference.sameTract, true);
  assert.notEqual(results[0].nearestDistanceKm, results[1].nearestDistanceKm);
  assert.ok("status" in results[0].facilities[0]);
  assert.ok(card.data.limitations.some((s) => s.includes("straight-line")));
});

test("all available indicators, discovered-tract comparisons and null observations use the existing verified contracts", async () => {
  const { indicatorContracts } = await modules.load("contracts/indicators");
  const { tractRecord } = await modules.load("data");
  const all = indicatorContracts.filter((i) => i.backendReady);
  const kit = createToolkit(locations, new AbortController().signal);
  for (let i = 0; i < all.length; i += 6) {
    const indicators = all.slice(i, i + 6).map((i) => i.id);
    const card = await kit.execute("compare_places", {
      locationIds: locations.map((l) => l.id),
      indicators,
    });
    assert.deepEqual(
      card.data.rows.map((r) => r.indicatorId),
      indicators,
    );
    for (const row of card.data.rows)
      for (const v of row.values) {
        const contract = all.find((c) => c.id === row.indicatorId);
        const value = tractRecord(v.tractId)[contract.rawField];
        assert.equal(v.rawValue, value === null ? null : Number(value));
      }
  }
  const tracts = await kit.execute("compare_tracts", {
    tractIds: ["06049000400", "06073010009"],
    indicators: ["pm", "ozone"],
  });
  assert.equal(tracts.data.locations.length, 2);
  assert.ok(tracts.data.locations.every((l) => l.id.startsWith("tract-")));
  await assert.rejects(
    kit.execute("compare_tracts", {
      tractIds: ["00000000000"],
      indicators: ["pm"],
    }),
  );
});

test("hospital and clinic filters exclude agency offices and preserve original address distances", async () => {
  const { facilityBundle, straightLineKm } = await modules.load(
    "contracts/facilities",
  );
  const { HEALTHCARE_SUBTYPES } = await modules.load("contracts/discovery");
  for (const kind of ["hospital", "clinic"]) {
    const card = await createToolkit(
      locations,
      new AbortController().signal,
    ).execute("compare_facilities", {
      locationIds: ["1", "2"],
      categories: ["healthcare"],
      healthcareKind: kind,
    });
    assert.equal(card.healthcareFilter.kind, kind);
    const valid = facilityBundle("healthcare").facilities.filter(
      (f) =>
        f.coordinate &&
        f.status === "OPEN" &&
        HEALTHCARE_SUBTYPES[kind].includes(f.subtype),
    );
    for (const r of card.data.categories[0].results) {
      assert.ok(
        r.facilities.every((f) =>
          HEALTHCARE_SUBTYPES[kind].includes(f.subtype),
        ),
      );
      assert.equal(
        r.nearestDistanceKm,
        Math.min(
          ...valid.map((f) => straightLineKm(r.coordinate, f.coordinate)),
        ),
      );
    }
  }
});
test("healthcare prose cannot substitute centroid or tract center for the actual proxy", async () => {
  const kit = createToolkit([], new AbortController().signal);
  await kit.execute("discover_areas", {
    criteria: [{ indicator: "pm" }],
    activeSchool: false,
    healthcare: { kind: "hospital" },
  });
  assert.throws(() =>
    validateFinish(
      { message: "The distances are from tract centers.", evidenceIds: ["e1"] },
      kit.cards,
      [],
    ),
  );
});

test("discovery summaries require a grounded insight for each candidate and reject fabricated IDs or values", async () => {
  const kit = createToolkit([], new AbortController().signal);
  const card = await kit.execute("discover_areas", {
    criteria: [{ indicator: "traffic", direction: "highest" }],
    activeSchool: false,
  });
  const base = {
    message:
      "San Ysidro stands out for high traffic in this historical source.",
    evidenceIds: [card.id],
  };
  const insight = {
    evidenceId: card.id,
    tractId: card.data.candidates[0].tractId,
    text: "This area has the highest reported traffic among the eligible tracts. That describes the tract rather than every street.",
  };
  assert.equal(
    validateFinish({ ...base, insights: [insight] }, kit.cards, []).insights[0]
      .tractId,
    insight.tractId,
  );
  for (const insights of [
    [],
    [{ ...insight, tractId: "00000000000" }],
    [{ ...insight, evidenceId: "invented" }],
    [insight, insight],
    [{ ...insight, text: "Traffic is 1234 vehicles/hour." }],
  ])
    assert.throws(() => validateFinish({ ...base, insights }, kit.cards, []));
});

test("summary prose rejects unsupported causal explanations", () => {
  assert.throws(() =>
    validateFinish(
      {
        message:
          "Traffic is high, driven by major transit corridor throughput.",
        evidenceIds: [],
      },
      [],
      [],
    ),
  );
});

test("requests for current air require a visible historical-data qualification", async () => {
  const kit = createToolkit(locations, new AbortController().signal);
  await kit.execute("compare_places", {
    locationIds: ["1", "2"],
    indicators: ["pm"],
  });
  const base = { evidenceIds: ["e1"] };
  assert.throws(() =>
    validateFinish(
      { ...base, message: "Oakland has lower fine particles." },
      kit.cards,
      locations,
      "Which has cleaner air right now?",
    ),
  );
  assert.ok(
    validateFinish(
      {
        ...base,
        message:
          "These historical measurements show lower fine particles in Oakland; they do not establish live conditions.",
      },
      kit.cards,
      locations,
      "Which has cleaner air right now?",
    ),
  );
});

test("discovery leads with a named finding and avoids invented exposure categories", async () => {
  const kit = createToolkit([], new AbortController().signal);
  const card = await kit.execute("discover_areas", {
    criteria: [{ indicator: "traffic", direction: "highest" }],
    activeSchool: false,
  });
  const insights = card.data.candidates.map((c) => ({
    evidenceId: card.id,
    tractId: c.tractId,
    text: "This tract has the highest source traffic value among eligible tracts.",
  }));
  assert.throws(() =>
    validateFinish(
      {
        message: "I evaluated all your criteria across California.",
        insights,
        evidenceIds: [card.id],
      },
      kit.cards,
      [],
    ),
  );
  assert.throws(() =>
    validateFinish(
      {
        message: "San Ysidro has moderate traffic exposure.",
        insights,
        evidenceIds: [card.id],
      },
      kit.cards,
      [],
    ),
  );
});
