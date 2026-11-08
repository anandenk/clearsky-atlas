import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import type { AssistantResponse } from "../../src/assistant/types";
test.setTimeout(90000);
const usage = {
  model: "deterministic-test-fixture",
  rounds: 2,
  calls: 2,
  inputTokens: 10,
  outputTokens: 10,
  thinkingTokens: 0,
  latencyMs: 10,
};
const reply = (
  overrides: Partial<AssistantResponse> = {},
): AssistantResponse => ({
  message: "Here is the verified atlas evidence.",
  clarification: null,
  followUps: [],
  evidence: [],
  actions: [],
  usage,
  ...overrides,
});
async function open(page: Page) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByLabel("Your question", { exact: true })).toBeVisible();
}
async function ask(page: Page, text: string) {
  await page.getByLabel("Your question", { exact: true }).fill(text);
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
}
async function addCached(page: Page, name: "Oakland" | "Fresno") {
  await page.getByLabel("Search a California address").focus();
  await page.getByRole("button", { name, exact: true }).click();
  await page
    .locator(".search-results")
    .getByRole("button", { name: /Confirm this address/ })
    .click();
}
async function comparison(request: APIRequestContext, locations: any[]) {
  const response = await request.post("/api/compare/overview", {
    data: {
      locations: locations.map((l) => ({ id: l.id, tractId: l.tractId })),
      indicators: ["pm", "poverty"],
    },
  });
  expect(response.ok()).toBeTruthy();
  return {
    id: "e1",
    kind: "comparison" as const,
    data: await response.json(),
    labels: Object.fromEntries(locations.map((l) => [l.id, l.label])),
  };
}

test("address candidates require explicit confirmation, preserve existing places and automatically resume comparison", async ({
  page,
  request,
}) => {
  const demos = await (await request.get("/api/demo")).json();
  let turns = 0;
  let submitted: any;
  await page.route("**/api/assistant", async (route) => {
    const input = route.request().postDataJSON();
    turns++;
    if (turns === 1)
      await route.fulfill({
        json: reply({
          message: "Confirm each Census match to continue.",
          evidence: demos.map((s: any, i: number) => ({
            id: `e${i + 1}`,
            kind: "candidates",
            query: s.label,
            candidates: [s],
            errors: [],
          })),
        }),
      });
    else {
      submitted = input;
      await route.fulfill({
        json: reply({
          evidence: [await comparison(request, input.locations)],
          actions: [],
        }),
      });
    }
  });
  await open(page);
  await addCached(page, "Oakland");
  await ask(page, "Compare these addresses with my existing place");
  const panel = page.locator("#ask-clearsky");
  await expect(
    panel.getByRole("button", { name: "Confirm this address", exact: true }),
  ).toHaveCount(2);
  await expect(page.locator(".place-chip")).toHaveCount(1);
  await panel
    .getByRole("button", { name: "Confirm this address", exact: true })
    .first()
    .click();
  await expect(page.locator(".place-chip")).toHaveCount(2);
  expect(turns).toBe(1);
  await panel
    .getByRole("button", { name: "Confirm this address", exact: true })
    .click();
  await expect(page.locator(".place-chip")).toHaveCount(3);
  await expect(
    panel.getByRole("region", { name: "Verified comparison" }),
  ).toBeVisible();
  await expect(page.locator("#evidence")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect(submitted.locations.map((l: any) => l.id)).toEqual(["1", "2", "3"]);
  expect(submitted.locations.every((l: any) => l.confirmed)).toBeTruthy();
  expect(submitted.locations[1].coordinate).toEqual(demos[0].coordinate);
  await expect(panel).toContainText("percentage points");
  await expect(panel).toContainText("2022–2024");
});

test("cancelled, closed, superseded and changed-selection turns cannot apply stale map actions", async ({
  page,
}) => {
  const held: import("@playwright/test").Route[] = [];
  await page.route("**/api/assistant", (route) => {
    held.push(route);
  });
  await open(page);
  await ask(page, "Hold this question");
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await held[0]
    .fulfill({ json: reply({ message: "STALE CANCELLED ANSWER" }) })
    .catch(() => {});
  await expect(page.locator("#ask-clearsky")).not.toContainText(
    "STALE CANCELLED",
  );
  await ask(page, "Another held question");
  await expect.poll(() => held.length).toBe(2);
  await page.getByRole("button", { name: "Minimize Ask ClearSky" }).click();
  await held[1]
    .fulfill({ json: reply({ message: "STALE CLOSED ANSWER" }) })
    .catch(() => {});
  await expect(page.getByLabel("Your question", { exact: true })).toBeFocused();
  await page
    .getByRole("button", { name: "Resume conversation", exact: true })
    .click();
  await ask(page, "Held while places change");
  await expect.poll(() => held.length).toBe(3);
  await addCached(page, "Oakland");
  await held[2]
    .fulfill({
      json: reply({
        message: "STALE SELECTION ANSWER",
        actions: [{ type: "open-comparison", locationIds: ["invented"] }],
      }),
    })
    .catch(() => {});
  await expect(page.locator("#ask-clearsky")).not.toContainText("STALE");
  await expect(page.locator("#evidence")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await ask(page, "Latest question");
  await expect.poll(() => held.length).toBe(4);
  await held[3].fulfill({ json: reply({ message: "LATEST VERIFIED ANSWER" }) });
  await expect(page.locator("#ask-clearsky")).toContainText(
    "LATEST VERIFIED ANSWER",
  );
});

test("provider unavailable states preserve manual search and Escape restores keyboard focus", async ({
  page,
}) => {
  await page.route("**/api/assistant", (r) =>
    r.fulfill({
      status: 429,
      json: {
        code: "gemini-quota",
        error: "Gemini quota is unavailable. The atlas remains available.",
      },
    }),
  );
  await open(page);
  await expect(page.getByLabel("Your question", { exact: true })).toBeFocused();
  await ask(page, "Compare places");
  await expect(page.locator(".ask-error")).toContainText(
    "quota is unavailable",
  );
  await addCached(page, "Oakland");
  await expect(page.locator(".place-chip")).toHaveCount(1);
  await page.getByLabel("Your question", { exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#ask-clearsky")).toHaveClass(/ask-panel-intro/);
  await expect(page.getByLabel("Your question", { exact: true })).toBeFocused();
});

test("optional manual discovery honors edited profile acceptance and county/map filters, explores without address pins and reports empty results", async ({
  page,
  request,
}) => {
  let accepted: any;
  let turns = 0;
  const profile = {
    criteria: [
      { indicator: "pm" },
      { indicator: "ozone" },
      { indicator: "traffic" },
    ],
    activeSchool: true,
  };
  await page.route("**/api/assistant", async (route) => {
    turns++;
    if (turns === 1 || turns === 3) {
      await route.fulfill({
        json: reply({
          evidence: [
            {
              id: "e1",
              kind: "profile",
              profile:
                turns === 3
                  ? {
                      criteria: [{ indicator: "pm", maxRaw: 0 }],
                      activeSchool: true,
                      county: "Alameda",
                    }
                  : profile,
            },
          ],
        }),
      });
      return;
    }
    accepted = route.request().postDataJSON().discoveryProfile;
    const result = await request.post("/api/discovery", { data: accepted });
    expect(result.ok()).toBeTruthy();
    await route.fulfill({
      json: reply({
        evidence: [{ id: "e1", kind: "discovery", data: await result.json() }],
      }),
    });
  });
  await open(page);
  await ask(page, "Find areas with cleaner air and schools");
  await expect(
    page.getByRole("form", { name: "Discovery preferences" }),
  ).toBeVisible();
  expect(turns).toBe(1);
  await page.getByLabel("County (optional)", { exact: true }).fill("Alameda");
  await expect(page.getByLabel("Limit to the current map view")).toBeEnabled({
    timeout: 30000,
  });
  await page.getByLabel("Limit to the current map view").check();
  await page
    .getByRole("button", { name: "Accept profile & find areas", exact: true })
    .click();
  const results = page.getByRole("region", { name: "Area discovery results" });
  await expect(results).toBeVisible();
  expect(accepted.county).toBe("Alameda");
  expect(accepted.bbox).toHaveLength(4);
  await results
    .getByRole("button", { name: /Explore area ·/ })
    .first()
    .click();
  await expect(page.locator(".discovery-map-note")).toBeVisible();
  await expect(page.locator(".place-chip")).toHaveCount(0);
  await expect(results.getByRole("status")).toContainText(
    "Search and confirm a street address",
  );
  await expect
    .poll(
      async () =>
        Number(
          await page
            .locator(".atlas-map")
            .first()
            .getAttribute("data-discovery-rendered"),
        ),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Clear highlights", exact: true })
    .click();
  await expect(page.locator(".discovery-map-note")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/assistant/discovery-county-browser.png",
  });
  await ask(
    page,
    "Set the fine particle maximum to zero and keep Alameda County",
  );
  await expect(
    page.getByRole("form", { name: "Discovery preferences" }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Accept profile & find areas", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("region", { name: "Area discovery results" }).last(),
  ).toContainText("No tract meets every search constraint");
  expect(accepted.criteria).toEqual([{ indicator: "pm", maxRaw: 0 }]);
  await expect(page.locator(".discovery-map-note")).toHaveCount(0);
});

test("compact question box expands on send and preserves the focused composer", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const panel = page.locator("#ask-clearsky");
  const input = page.getByLabel("Your question", { exact: true });
  await expect(panel).toHaveClass(/ask-panel-intro/);
  await expect(page.locator(".ask-trigger")).toHaveCount(0);
  await expect(input).toBeFocused();
  const compactHeight = (await panel.boundingBox())!.height;
  expect(compactHeight).toBeLessThan(350);
  await page.route("**/api/assistant", (route) =>
    route.fulfill({ json: reply() }),
  );
  await input.fill("Tell me about air quality in Oakland");
  await input.press("Enter");
  await expect(panel).not.toHaveClass(/ask-panel-intro/);
  await expect(
    panel.getByText("Tell me about air quality in Oakland", { exact: true }),
  ).toBeVisible();
  await expect(input).toBeFocused();
  await expect
    .poll(async () => (await panel.boundingBox())!.height)
    .toBeGreaterThan(compactHeight + 200);
  await page.getByRole("button", { name: "Minimize Ask ClearSky" }).click();
  await page
    .getByRole("button", { name: "Resume conversation", exact: true })
    .click();
  await expect(panel).not.toHaveClass(/ask-panel-intro/);
  await expect(
    panel.getByText("Tell me about air quality in Oakland", { exact: true }),
  ).toBeVisible();
});

test("direct highest traffic discovery needs no form or explore click and renders its tract", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/discovery", {
    data: {
      criteria: [{ indicator: "traffic", direction: "highest" }],
      activeSchool: false,
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  await page.route("**/api/assistant", (route) =>
    route.fulfill({
      json: reply({ evidence: [{ id: "e1", kind: "discovery", data }] }),
    }),
  );
  await open(page);
  await ask(page, "Find the highest traffic tract");
  await expect(
    page.getByRole("form", { name: "Discovery preferences" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Highest traffic burden" }),
  ).toBeVisible();
  await expect(page.locator(".discovery-map-note")).toBeVisible();
  await expect
    .poll(
      async () =>
        Number(
          await page
            .locator(".atlas-map")
            .first()
            .getAttribute("data-discovery-rendered"),
        ),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".place-chip")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/assistant-dynamic/highest-auto.png",
  });
});

test("healthcare changes discovery, displays its proxy and source, and omits unrelated school cards", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/discovery", {
    data: {
      criteria: [{ indicator: "pm" }, { indicator: "ozone" }],
      activeSchool: false,
      healthcare: { kind: "hospital", maxDistanceKm: 5 },
      county: "Alameda",
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  let sent: any;
  await page.route("**/api/assistant", (route) => {
    sent = route.request().postDataJSON();
    return route.fulfill({
      json: reply({ evidence: [{ id: "e1", kind: "discovery", data }] }),
    });
  });
  await open(page);
  await ask(page, "Find clean air and healthcare nearby");
  const results = page.getByRole("region", { name: "Area discovery results" });
  await expect(results).toContainText("Hospital / clinic proximity");
  await expect(results).toContainText("representative point");
  await results
    .locator(".ask-discovery-candidate > details")
    .first()
    .locator("summary")
    .first()
    .click();
  await expect(
    results.getByRole("link", { name: /Healthcare source/ }).first(),
  ).toBeVisible();
  await expect(
    results.getByRole("link", { name: /School source/ }),
  ).toHaveCount(0);
  await expect(page.locator(".discovery-map-note")).toBeVisible();
  await expect
    .poll(
      async () =>
        Number(
          await page
            .locator(".atlas-map")
            .first()
            .getAttribute("data-discovery-rendered"),
        ),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0);
  await ask(page, "Compare those discoveries");
  await expect
    .poll(() => sent?.discoveredTractIds)
    .toEqual(data.candidates.map((c: any) => c.tractId));
  expect(sent.mapBounds).toHaveLength(4);
  expect(sent.discoveredTractIds).toEqual(
    data.candidates.map((c: any) => c.tractId),
  );
  expect(sent.discoveryProfile.healthcare).toEqual({
    kind: "hospital",
    maxDistanceKm: 5,
  });
  await page.screenshot({ path: "artifacts/assistant-audit/healthcare.png" });
});

test("persistent question box leaves the desktop map view controls reachable", async ({
  page,
}) => {
  await open(page);
  const panel = await page.locator("#ask-clearsky").boundingBox();
  const controls = await page.locator(".view-switch").boundingBox();
  expect(controls!.y).toBeGreaterThanOrEqual(panel!.y + panel!.height);
  expect(controls!.x + controls!.width).toBeCloseTo(panel!.x + panel!.width, 0);
  await page.getByRole("button", { name: "City", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "City", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("verified comparison reopens a dismissed overview without a model view action", async ({
  page,
  request,
}) => {
  await open(page);
  await addCached(page, "Oakland");
  await addCached(page, "Fresno");
  await page.getByRole("button", { name: "More map", exact: true }).click();
  await page.route("**/api/assistant", async (route) => {
    const input = route.request().postDataJSON();
    await route.fulfill({
      json: reply({
        evidence: [await comparison(request, input.locations)],
        actions: [],
      }),
    });
  });
  await ask(page, "Compare my selected places");
  await expect(
    page.getByRole("heading", { name: "Places in perspective", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "At a glance", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("descriptive health discovery selects the Health domain and corresponding map measure", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/discovery", {
    data: {
      criteria: [{ indicator: "asthma", direction: "highest" }],
      activeSchool: false,
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  await page.route("**/api/assistant", (route) =>
    route.fulfill({
      json: reply({ evidence: [{ id: "e1", kind: "discovery", data }] }),
    }),
  );
  await open(page);
  await ask(page, "Show highest source-reported asthma rate");
  await expect(
    page.getByRole("button", { name: "Health", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "asthma",
    { timeout: 30000 },
  );
});

test("minimizing by X or Escape clears discovery geometry and anchors while retaining places and conversation", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/discovery", {
    data: {
      criteria: [{ indicator: "pm" }],
      activeSchool: true,
      county: "Alameda",
      healthcare: { kind: "hospital" },
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  await page.route("**/api/assistant", (route) =>
    route.fulfill({
      json: reply({
        message: "Temporary discovery highlights are shown.",
        evidence: [{ id: "e1", kind: "discovery", data }],
      }),
    }),
  );
  await open(page);
  await addCached(page, "Oakland");
  const map = page.locator(".atlas-map").first();
  for (const method of ["button", "escape"]) {
    await ask(page, "Find areas with cleaner air, schools and hospitals");
    await expect(page.locator(".discovery-map-note")).toBeVisible();
    await expect
      .poll(
        async () => Number(await map.getAttribute("data-discovery-rendered")),
        { timeout: 20000 },
      )
      .toBeGreaterThan(0);
    await expect
      .poll(
        async () =>
          Number(await map.getAttribute("data-discovery-schools-rendered")),
        { timeout: 20000 },
      )
      .toBeGreaterThan(0);
    if (method === "button")
      await page.getByRole("button", { name: "Minimize Ask ClearSky" }).click();
    else
      await page.getByLabel("Your question", { exact: true }).press("Escape");
    await expect(page.locator("#ask-clearsky")).toHaveClass(/ask-panel-intro/);
    await expect(page.locator(".discovery-map-note")).toHaveCount(0);
    await expect
      .poll(async () =>
        Number(await map.getAttribute("data-discovery-rendered")),
      )
      .toBe(0);
    await expect
      .poll(async () =>
        Number(await map.getAttribute("data-discovery-schools-rendered")),
      )
      .toBe(0);
    await expect(page.locator(".place-chip")).toHaveCount(1);
    await expect(page.locator(".place-pin")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Resume conversation", exact: true })
      .click();
    await expect(
      page
        .getByText("Temporary discovery highlights are shown.", { exact: true })
        .last(),
    ).toBeVisible();
    await expect(page.locator(".discovery-map-note")).toHaveCount(0);
    await expect
      .poll(async () =>
        Number(await map.getAttribute("data-discovery-rendered")),
      )
      .toBe(0);
  }
});

test("Gemini summary and area insight lead the answer while raw evidence stays expandable", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/discovery", {
    data: {
      criteria: [{ indicator: "traffic", direction: "highest" }],
      activeSchool: false,
    },
  });
  const data = await response.json();
  await page.route("**/api/assistant", (route) =>
    route.fulfill({
      json: reply({
        message:
          "**San Ysidro** has the highest reported traffic among the eligible tracts.\n\nUse the highlighted tract to explore its surroundings.",
        insights: [
          {
            evidenceId: "e1",
            tractId: data.candidates[0].tractId,
            text: "Traffic stands out here compared with the other eligible tracts. It does not describe conditions on every street.",
          },
        ],
        evidence: [{ id: "e1", kind: "discovery", data }],
      }),
    }),
  );
  await open(page);
  await ask(page, "Find the highest traffic tract");
  const assistant = page.locator(".ask-message.assistant").last();
  await expect(assistant.locator(".ask-narrative strong").first()).toHaveText(
    "San Ysidro",
  );
  await expect(
    assistant.getByText(
      "Traffic stands out here compared with the other eligible tracts. It does not describe conditions on every street.",
      { exact: true },
    ),
  ).toBeVisible();
  const detail = assistant
    .locator(".ask-discovery-candidate > details")
    .first();
  await expect(detail).not.toHaveAttribute("open", "");
  await expect(
    detail.locator(".ask-discovery-value").first(),
  ).not.toBeVisible();
  await detail.locator("summary").first().click();
  await expect(detail.locator(".ask-discovery-value").first()).toBeVisible();
  await expect(detail).toContainText("vehicles/hour");
  await expect(detail).toContainText("2023");
  await page.screenshot({
    path: "artifacts/assistant-summary/rendered-summary.png",
  });
});
