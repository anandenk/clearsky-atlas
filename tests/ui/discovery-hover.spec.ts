import { test, expect } from "@playwright/test";
function mapInstance() {
  const el = document.querySelector(".atlas-map") as any;
  let f = el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))!];
  while (f) {
    let h = f.memoizedState;
    while (h) {
      if (h.memoizedState?.current?.getZoom) return h.memoizedState.current;
      h = h.next;
    }
    f = f.return;
  }
  throw Error("Map unavailable");
}
test("discovery dots show all requested measures, education meaning and source periods, then clear on dismissal", async ({
  page,
  request,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await request.post("/api/discovery", {
    data: {
      criteria: [{ indicator: "traffic" }, { indicator: "education" }],
      activeSchool: false,
      county: "Alameda",
      limit: 1,
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const candidate = data.candidates[0];
  expect(candidate.representativePoint).toHaveLength(2);
  await page.route("**/api/assistant", (route) =>
    route.fulfill({
      json: {
        message:
          "This tract shows a tradeoff between traffic and the source education measure.",
        insights: [],
        clarification: null,
        followUps: [],
        evidence: [{ id: "e1", kind: "discovery", data }],
        actions: [],
        usage: {
          model: "fixture",
          latencyMs: 1,
          inputTokens: 0,
          outputTokens: 0,
          thinkingTokens: 0,
          calls: 1,
          rounds: 1,
        },
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "pm",
    { timeout: 30000 },
  );
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Find low traffic and highest education");
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "traffic",
    { timeout: 30000 },
  );
  await page.evaluate(`window.hoverTestMap=(${mapInstance.toString()})()`);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const m = (window as any).hoverTestMap;
          return m.getLayer("discovery-candidate-points")
            ? m.queryRenderedFeatures({
                layers: ["discovery-candidate-points"],
              }).length
            : 0;
        }),
      { timeout: 30000 },
    )
    .toBeGreaterThan(0);
  const point = await page.evaluate((coordinate) => {
    const p = (window as any).hoverTestMap.project(coordinate);
    const r = document.querySelector(".atlas-map")!.getBoundingClientRect();
    return { x: p.x + r.x, y: p.y + r.y };
  }, candidate.representativePoint);
  await page.mouse.move(point.x, point.y);
  const tip = page.getByRole("tooltip", { name: "Discovery area evidence" });
  await expect(tip).toBeVisible();
  for (const o of candidate.observations) {
    const row = tip.locator(`[data-indicator="${o.indicatorId}"]`);
    await expect(row).toContainText(o.measurementPeriod);
    await expect(row).toContainText("Source percentile");
    await expect(row).toContainText(
      new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
        o.rawValue,
      ),
    );
  }
  await expect(tip).toContainText("Traffic impacts");
  await expect(tip).toContainText("Educational attainment");
  await expect(tip).toContainText("without a high school diploma");
  await expect(tip.locator('[data-indicator="pm"]')).toHaveCount(0);
  const box = (await tip.boundingBox())!,
    panel = (await page.locator("#ask-clearsky").boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(960);
  expect(box.x + box.width).toBeLessThanOrEqual(panel.x);
  await page.screenshot({
    path: "artifacts/discovery-hover/traffic-education.png",
  });
  await page.mouse.move(box.x + 20, box.y + 20);
  await expect(tip).toBeVisible();
  await page
    .getByRole("button", { name: "Fine particles", exact: true })
    .click();
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "pm",
    { timeout: 30000 },
  );
  await page.mouse.move(point.x, point.y);
  await expect(tip).toBeVisible();
  await expect(tip.locator('[data-indicator="traffic"]')).toHaveCount(1);
  await expect(tip.locator('[data-indicator="education"]')).toHaveCount(1);
  await expect(tip.locator('[data-indicator="pm"]')).toHaveCount(0);
  await page.getByLabel("Your question", { exact: true }).press("Escape");
  await expect(tip).toHaveCount(0);
  await expect(page.locator(".discovery-map-note")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).hoverTestMap.queryRenderedFeatures({
            layers: ["discovery-candidate-points"],
          }).length,
      ),
    )
    .toBe(0);
});

test("ordinary hover still cancels pending work and coalesces pointer events into one hit test", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "pm",
    { timeout: 30000 },
  );
  await page.evaluate(`window.hoverTestMap=(${mapInstance.toString()})()`);
  const cancelled = await page.evaluate(async () => {
    const m = (window as any).hoverTestMap;
    let count = 0;
    const original = m.queryRenderedFeatures;
    m.queryRenderedFeatures = function (...args: any[]) {
      if (args[0] && typeof args[0].x === "number") count++;
      return original.apply(this, args);
    };
    const point = m.project(m.getCenter());
    for (let i = 0; i < 120; i++) m.fire("mousemove", { point });
    m.fire("mouseout");
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    m.queryRenderedFeatures = original;
    return count;
  });
  expect(cancelled).toBe(0);
  await expect(page.locator(".map-tooltip")).toHaveCount(0);
  const completed = await page.evaluate(async () => {
    const m = (window as any).hoverTestMap;
    let count = 0;
    const original = m.queryRenderedFeatures;
    m.queryRenderedFeatures = function (...args: any[]) {
      if (args[0] && typeof args[0].x === "number") count++;
      return original.apply(this, args);
    };
    const point = m.project(m.getCenter());
    for (let i = 0; i < 120; i++) m.fire("mousemove", { point });
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    m.queryRenderedFeatures = original;
    m.fire("mouseout");
    return count;
  });
  expect(completed).toBe(1);
});
