import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
test.setTimeout(90000);
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 960 });
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});
async function open(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Environment", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 45000 },
  );
}
async function cached(page: Page, name: string) {
  await page.getByLabel("Search a California address").focus();
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator(".candidate")).toHaveCount(1);
  await page.getByRole("button", { name: /Confirm this address/ }).click();
}
async function preview(page: Page) {
  await page.getByRole("button", { name: "Atlas menu" }).click();
  await page.getByRole("button", { name: "Explore full UI preview" }).click();
  await page.getByRole("button", { name: "Add a synthetic example" }).click();
}
async function scenario(page: Page, value: string) {
  await page.getByRole("button", { name: "Atlas menu" }).click();
  await page.getByLabel("Preview scenario").selectOption(value);
}
async function mapMetric(page: Page, id: string) {
  await expect(page.locator(".atlas-map")).toHaveAttribute("data-metric", id, {
    timeout: 30000,
  });
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-tracts-rendered",
    "true",
    { timeout: 30000 },
  );
}

test("compact live index, exact differences, source and map prominence", async ({
  page,
}) => {
  await open(page);
  await cached(page, "Oakland");
  await cached(page, "Fresno");
  await expect(page.locator(".index-measure")).toHaveCount(6);
  await expect(page.locator(".index-measure").first()).toContainText("8.33");
  await expect(page.locator(".index-measure").first()).toContainText("12.48");
  await expect(page.locator(".index-measure").first()).toContainText(
    "B higher",
  );
  const pane = await page.locator(".comparison-canvas").boundingBox();
  expect(pane!.width).toBeLessThan(450);
  expect(pane!.x + pane!.width).toBeLessThan(1440 * 0.34);
  expect(
    await page
      .locator(".canvas-content")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 2),
  ).toBe(true);
  await page.waitForTimeout(1400);
  for (const pin of await page.locator(".place-pin").all()) {
    const box = await pin.boundingBox();
    expect(box!.x).toBeGreaterThan(pane!.x + pane!.width);
  }
  await page.screenshot({ path: "artifacts/compass/verified-overview.png" });
  await page
    .getByRole("button", {
      name: "Explore Fine particulate matter",
      exact: true,
    })
    .click();
  await expect(page.locator(".compass-finding")).toContainText("4.15");
  await expect(page.locator(".compass-finding")).toContainText(
    "Fresno is higher than Oakland",
  );
  await expect(page.locator(".reading-value")).toHaveText(["8.33", "12.48"]);
  await page.getByRole("button", { name: "About the evidence" }).click();
  await expect(page.getByRole("dialog")).toContainText("2022–2024");
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "artifacts/compass/verified-detail.png" });
});

test("all 23 live measures remain accessible with accurate units and values", async ({
  page,
  request,
}) => {
  await open(page);
  await cached(page, "Oakland");
  const catalog = (await (await request.get("/api/indicators")).json())
    .indicators;
  const observations = (
    await (await request.get("/api/tracts/06001403402")).json()
  ).observations;
  for (const mode of ["Environment", "Health", "Community"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const m of catalog.filter((m: any) => m.mode === mode.toLowerCase())) {
      if (m.percentileField)
        await page
          .getByRole("combobox", { name: "Choose a measure" })
          .selectOption(m.id);
      else {
        const group = m.id.startsWith("pop_") ? "age" : "race";
        await page
          .getByRole("combobox", { name: "Choose a measure" })
          .selectOption(group);
        await page
          .getByRole("button", { name: "At a glance", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Explore " + m.label, exact: true })
          .click();
      }
      await mapMetric(page, m.id);
      const o = observations.find((o: any) => o.indicatorId === m.id);
      await expect(page.locator(".reading-value")).toHaveText(
        o.rawValue == null
          ? "Unavailable"
          : o.rawValue.toLocaleString("en-US", {
              maximumFractionDigits: m.id === "ozone" ? 4 : 2,
            }),
      );
    }
  }
});

test("six places, reference edits and honest missing/zero/incompatible preview", async ({
  page,
}) => {
  await open(page);
  await preview(page);
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Add example", exact: true })
      .click();
  await expect(page.locator(".compass-places button")).toHaveCount(6);
  await expect(page.locator(".index-explanation")).toContainText(
    "all 6 places",
  );
  await page.screenshot({ path: "artifacts/compass/six-overview.png" });
  await page
    .getByRole("button", {
      name: "Explore Fine particulate matter",
      exact: true,
    })
    .click();
  await expect(page.locator(".place-reading")).toHaveCount(6);
  await scenario(page, "zero");
  await expect(page.locator(".reading-value").first()).toHaveText("0");
  await scenario(page, "missing");
  await expect(page.locator(".place-reading").nth(1)).toContainText(
    "Unavailable",
  );
  await expect(page.locator(".compass-finding")).toContainText(
    "Matching evidence",
  );
  await page.getByRole("button", { name: "At a glance", exact: true }).click();
  await expect(page.locator(".index-measure").first()).toContainText(
    "Range unavailable",
  );
  await expect(
    page.locator(".index-measure").first().locator(".index-values strong"),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Explore Fine particulate matter",
      exact: true,
    })
    .click();
  await scenario(page, "incompatible");
  await expect(page.locator(".reading-delta").nth(1)).toContainText(
    "Difference unavailable",
  );
  await scenario(page, "normal");
  await page.locator(".place-options summary").nth(1).click();
  await page.getByRole("button", { name: "Use as reference" }).click();
  await expect(page.locator(".reading-delta").nth(1)).toContainText(
    "Reference",
  );
  await page.locator(".place-options summary").nth(5).click();
  await page.getByRole("button", { name: "Remove place", exact: true }).click();
  await expect(page.locator(".place-reading")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Return to live", exact: true })
    .click();
  await expect(page.locator(".place-chip")).toHaveCount(0);
  await expect(page.locator(".preview-status")).toHaveCount(0);
});

test("responsive overview and interrupted side-panel motion retain map and evidence", async ({
  page,
}) => {
  await open(page);
  await cached(page, "Oakland");
  await cached(page, "Fresno");
  const instance = await page
    .locator(".atlas-map")
    .getAttribute("data-instance");
  await page.waitForTimeout(1200);
  const samples = await page.evaluate(async () => {
    const e = document.querySelector(".comparison-canvas")!;
    (
      [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "More map",
      ) as HTMLButtonElement
    ).click();
    const xs: number[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function step(t: number) {
        xs.push(e.getBoundingClientRect().x);
        if (t - start < 750) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
    return xs;
  });
  expect(new Set(samples.map(Math.round)).size).toBeGreaterThan(5);
  await page
    .getByRole("button", { name: "Open evidence", exact: true })
    .click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "More map", exact: true }).click();
  await page
    .getByRole("button", { name: "Open evidence", exact: true })
    .click();
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(1200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".index-measure")).toHaveCount(6);
    if (width === 768) {
      const pane = await page.locator(".comparison-canvas").boundingBox();
      for (const pin of await page.locator(".place-pin").all()) {
        const box = await pin.boundingBox();
        expect(box!.x).toBeGreaterThan(pane!.x + pane!.width);
      }
    }
    await page.screenshot({
      path: `artifacts/compass/width-${width}.png`,
      fullPage: true,
    });
  }
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-instance",
    instance!,
  );
  await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
});

test("keyboard, reduced motion, confirmation errors, request cancellation and failures", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(
    await page
      .locator(".map-stage")
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("1e-05s");
  await page.getByLabel("Search a California address").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator(".search-results")).toHaveCount(0);
  await page.route("**/api/geocode", async (route) => {
    const address = route.request().postDataJSON().address;
    if (address.includes("slow")) {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        json: { candidates: [{ error: "Stale response should not appear" }] },
      });
    } else
      await route.fulfill({
        json: {
          candidates: [
            { error: "Outside California. Choose a California address." },
          ],
        },
      });
  });
  await page.getByLabel("Search a California address").fill("slow address");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByLabel("Search a California address").fill("new address");
  await page.waitForTimeout(750);
  await expect(page.getByText("Stale response should not appear")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".error[role=alert]")).toContainText(
    "Outside California",
  );
  await expect(page.locator(".candidate")).toHaveCount(0);
  await page.getByRole("button", { name: "Close search" }).click();
  await cached(page, "Oakland");
  await page.getByRole("button", { name: "About the evidence" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "About the evidence" }),
  ).toBeFocused();
  await page.route("**/api/map?**", (route) =>
    route.fulfill({ status: 503, json: { error: "Test source unavailable" } }),
  );
  await page
    .getByRole("combobox", { name: "Choose a measure" })
    .selectOption("ozone");
  await expect(page.locator(".map-error")).toContainText(
    "Tract layer unavailable",
  );
  await expect(page.locator(".preview-status")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-source-error.png",
  });
  await page.unroute("**/api/map?**");
  await preview(page);
  await scenario(page, "failure");
  await expect(page.locator(".error[role=alert]")).toContainText(
    "Simulated evidence failure",
  );
  await expect(page.locator(".reading-value")).toHaveText("Unavailable");
});

test("rendered tract and facility clicks, and independent facility-source failure", async ({
  page,
}) => {
  await open(page);
  await cached(page, "Oakland");
  await mapMetric(page, "pm");
  await page.waitForTimeout(1300);
  const map = page.locator(".atlas-map");
  const box = await page.locator(".map-stage").boundingBox();
  await map.click({
    position: { x: box!.width / 2 + 50, y: box!.height / 2 + 40 },
  });
  await expect(
    page.getByRole("dialog", { name: "A closer look at this tract" }),
  ).toBeVisible();
  await expect(page.locator(".inspection-value")).not.toContainText("Loading");
  await expect(page.locator(".place-chip")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  await expect(page.locator(".facility-list > button")).toHaveCount(12);
  await expect(map).toHaveAttribute("data-facility-hit", /"x"/);
  const hit = JSON.parse((await map.getAttribute("data-facility-hit"))!);
  await map.click({ position: { x: hit.x, y: hit.y } });
  await expect(
    page.getByRole("dialog", { name: "About this location" }),
  ).toBeVisible();
  await expect(page.locator(".facility-detail")).toContainText("straight-line");
  await page.getByText("Source & limitations", { exact: true }).click();
  await expect(page.locator(".facility-detail a")).toHaveAttribute(
    "href",
    /^https:/,
  );
  await page.keyboard.press("Escape");
  await page.route("**/api/facilities?category=schools**", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "School source temporarily unavailable" },
    }),
  );
  await page.getByRole("button", { name: "Atlas menu" }).click();
  await page.getByRole("button", { name: "Retry map & evidence" }).click();
  await expect(page.locator(".facilities-content .error")).toContainText(
    "School source temporarily unavailable",
  );
  await expect(page.locator(".facility-list > button")).toHaveCount(6);
  await expect(page.locator(".facility-list")).toContainText("Healthcare");
  await expect(page.locator(".preview-status")).toHaveCount(0);
});
