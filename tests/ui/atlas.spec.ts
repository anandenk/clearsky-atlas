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

test("live opening, confirmed addresses, three-place profile and exact comparisons", async ({
  page,
}) => {
  let demoRequests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/demo")) demoRequests++;
  });
  await open(page);
  await mapMetric(page, "pm");
  expect(demoRequests).toBe(0);
  await expect(page.locator(".place-chip")).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-opening.png",
  });
  const instance = await page
    .locator(".atlas-map")
    .getAttribute("data-instance");
  await cached(page, "Oakland");
  await expect(page.locator(".score-value").first()).toContainText("8.33");
  await page.screenshot({
    path: "artifacts/creative-reset/verified-single.png",
  });
  await cached(page, "Fresno");
  await expect(page.locator(".profile-row")).toHaveCount(6);
  await page
    .getByRole("button", {
      name: "Explore Fine particulate matter",
      exact: true,
    })
    .click();
  await expect(page.locator(".score-value").nth(1)).toContainText(
    "+4.15 µg/m³",
  );
  await expect(page.locator(".score-bead").nth(1)).toContainText("97.76");
  await page.getByRole("button", { name: "Add a place", exact: true }).click();
  await page
    .getByLabel("Search a California address")
    .fill("200 S Spring St Los Angeles CA 90012");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".candidate")).toHaveCount(1, { timeout: 25000 });
  await expect(page.locator(".candidate")).toContainText("LOS ANGELES");
  await page.getByRole("button", { name: /Confirm this address/ }).click();
  await expect(page.locator(".place-chip")).toHaveCount(3);
  await expect(page.locator(".profile-point")).toHaveCount(18);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-three-live.png",
  });
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-instance",
    instance!,
  );
  await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Ozone", exact: true }).click();
  await mapMetric(page, "ozone");
  await expect(page.locator(".score-value").first()).toContainText("ppm");
  await page.getByRole("button", { name: "About the evidence" }).click();
  await expect(page.getByRole("dialog")).toContainText("2022–2024");
  await expect(
    page.getByRole("link", { name: "Read the original source" }),
  ).toHaveAttribute("href", /oehha/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("all live domains and all 23 fields render with truthful scales", async ({
  page,
  request,
}) => {
  await open(page);
  await cached(page, "Oakland");
  const c = (await (await request.get("/api/indicators")).json()).indicators;
  const b = (await (await request.get("/api/tracts/06001403402")).json())
    .observations;
  const short: Record<string, string> = {
    pm: "Fine particles",
    ozone: "Ozone",
    diesel: "Diesel",
    traffic: "Traffic",
    "toxic-releases": "Toxic releases",
    cleanup: "Cleanup sites",
    asthma: "Asthma",
    "heart-attacks": "Heart attacks",
    diabetes: "Diabetes",
    "low-birth-weight": "Low birth weight",
    poverty: "Poverty",
    education: "Education",
    housing: "Housing",
  };
  for (const mode of ["Environment", "Health", "Community"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const m of c.filter(
      (i: any) => i.mode === mode.toLowerCase() && i.percentileField,
    )) {
      await page
        .getByRole("button", { name: short[m.id], exact: true })
        .click();
      await mapMetric(page, m.id);
      const o = b.find((o: any) => o.indicatorId === m.id);
      const formatted =
        o.rawValue === null
          ? "Unavailable"
          : o.rawValue.toLocaleString("en-US", {
              maximumFractionDigits: m.id === "ozone" ? 4 : 2,
            });
      await expect(
        page.locator(".score-value").first().locator("strong"),
      ).toHaveText(formatted);
    }
  }
  for (const group of ["Age", "Race & ethnicity"]) {
    await page.getByRole("button", { name: group, exact: true }).click();
    const ids =
      group === "Age"
        ? ["pop_und10", "pop_10_64", "pop_ov64"]
        : ["hisp", "white", "black", "amind", "asian", "pacisl", "othmult"];
    for (const id of ids) {
      await page
        .locator(".composition-legend")
        .getByRole("button", {
          name: c.find((m: any) => m.id === id).label,
          exact: true,
        })
        .click();
      await mapMetric(page, id);
      await expect(page.locator(".key-ends")).toContainText("Population %");
    }
  }
  await page.screenshot({
    path: "artifacts/creative-reset/verified-community.png",
  });
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  await expect(page.locator(".facility-list > button")).toHaveCount(12);
  await page.locator(".facility-list > button").first().click();
  await expect(page.locator(".facility-detail")).toBeVisible();
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-facilities-rendered",
    /^[1-9]/,
  );
  await page.screenshot({
    path: "artifacts/creative-reset/verified-live-facilities.png",
  });
  await page.getByRole("button", { name: "Close dialog" }).click();
});

test("six places, edits, missing/zero/incompatible evidence and provider separation", async ({
  page,
}) => {
  await open(page);
  await preview(page);
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Add example", exact: true })
      .click();
  await expect(page.locator(".place-chip")).toHaveCount(6);
  await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
  await expect(page.locator(".profile-point")).toHaveCount(36);
  await page
    .getByRole("button", { name: "Fine particles", exact: true })
    .click();
  await scenario(page, "zero");
  await expect(
    page.locator(".score-value").first().locator("strong"),
  ).toHaveText("0");
  await scenario(page, "missing");
  await expect(page.locator(".score-value").nth(1)).toContainText(
    "Unavailable",
  );
  await expect(page.locator(".score-value").nth(1)).toContainText(
    "Difference unavailable",
  );
  await scenario(page, "incompatible");
  await expect(page.locator(".score-value").nth(1)).toContainText(
    "Difference unavailable",
  );
  await scenario(page, "normal");
  await page.locator(".place-options summary").nth(1).click();
  await page.getByRole("button", { name: "Use as reference" }).click();
  await expect(page.locator(".score-value").nth(1)).toContainText("Reference");
  await page.locator(".place-options summary").nth(1).click();
  await page.getByRole("button", { name: "Move earlier" }).click();
  await page
    .getByRole("button", { name: "Replace address", exact: true })
    .click();
  await page.getByLabel("Replace address").fill("Example 1");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: /Confirm this address/ }).click();
  await expect(page.locator(".score-value").nth(1)).toContainText("0 µg/m³");
  await page.locator(".place-options summary").nth(5).click();
  await page.getByRole("button", { name: "Remove place", exact: true }).click();
  await expect(page.locator(".place-chip")).toHaveCount(5);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-many-preview.png",
  });
  await page
    .getByRole("button", { name: "Return to live", exact: true })
    .click();
  await expect(page.locator(".place-chip")).toHaveCount(0);
  await expect(page.locator(".preview-status")).toHaveCount(0);
  await expect(page.locator(".score-row")).toHaveCount(0);
});

test("infrastructure filters, map selection and responsive comparison", async ({
  page,
}) => {
  await open(page);
  await preview(page);
  for (let i = 0; i < 2; i++)
    await page
      .getByRole("button", { name: "Add example", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  await page.locator(".place-focus").first().click();
  await page.getByRole("button", { name: /Example healthcare 1/ }).click();
  await expect(page.locator(".facility-detail")).toContainText("straight-line");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Public schools", exact: true })
    .click();
  await expect(page.locator(".facility-list > button")).toHaveCount(2);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-infrastructure.png",
  });
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
    await page.getByRole("button", { name: "Community", exact: true }).click();
    await page.getByRole("button", { name: "Age", exact: true }).click();
    await expect(page.locator(".composition-row")).toHaveCount(3);
    await page.screenshot({
      path: `artifacts/creative-reset/verified-width-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Environment", exact: true }).click();
  await page.getByRole("button", { name: "At a glance", exact: true }).click();
  await expect(page.locator(".profile-point")).toHaveCount(18);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-mobile-profile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Atlas menu" }).click();
  await page
    .getByRole("button", { name: "Clear all places", exact: true })
    .click();
  await page.waitForTimeout(1400);
  const center = JSON.parse(
    (await page.locator(".atlas-map").getAttribute("data-center"))!,
  );
  expect(center[1]).toBeGreaterThan(32);
  expect(center[1]).toBeLessThan(43);
  await page.screenshot({
    path: "artifacts/creative-reset/verified-mobile-overview-restored.png",
  });
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
  await page.getByRole("button", { name: "Ozone", exact: true }).click();
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
  await expect(page.locator(".score-value strong")).toHaveText("Unavailable");
});

test("motion has intermediate states, responds to interruption and keeps one map instance", async ({
  page,
}) => {
  await open(page);
  await cached(page, "Oakland");
  await cached(page, "Fresno");
  await page
    .getByRole("button", { name: "Fine particles", exact: true })
    .click();
  await expect(page.locator(".score-bead")).toHaveCount(2);
  await page.waitForTimeout(1200);
  const instance = await page
    .locator(".atlas-map")
    .getAttribute("data-instance");
  const canvasHeight = await page
    .locator(".atlas-map canvas")
    .getAttribute("height");
  const samples = await page.evaluate(async () => {
    const stage = document.querySelector(".map-stage")!;
    const toggle = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "More map",
    )!;
    const result: { t: number; height: number }[] = [];
    toggle.click();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function step(now: number) {
        result.push({
          t: now - start,
          height: stage.getBoundingClientRect().height,
        });
        if (now - start < 850) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
    return result;
  });
  expect(
    new Set(samples.map((s) => Math.round(s.height))).size,
  ).toBeGreaterThan(8);
  expect(samples.at(-1)!.height - samples[0].height).toBeGreaterThan(200);
  await page
    .getByRole("button", { name: "Open evidence", exact: true })
    .click();
  await page.waitForTimeout(130);
  await page.getByRole("button", { name: "More map", exact: true }).click();
  await page.waitForTimeout(800);
  await expect(page.locator(".atlas-app")).toHaveClass(/canvas-collapsed/);
  await page
    .getByRole("button", { name: "Open evidence", exact: true })
    .click();
  await page.waitForTimeout(800);
  const dotSamples = await page.evaluate(async () => {
    const bead = document.querySelector(".score-bead")!;
    const result: number[] = [];
    const button = [...document.querySelectorAll(".topic-strip button")].find(
      (b) => b.textContent === "Ozone",
    ) as HTMLButtonElement;
    button.click();
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function step(now: number) {
        result.push(bead.getBoundingClientRect().x);
        if (now - start < 750) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
    return result;
  });
  expect(new Set(dotSamples.map(Math.round)).size).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Health", exact: true }).click();
  await page.getByRole("button", { name: "Community", exact: true }).click();
  await page.getByRole("button", { name: "Environment", exact: true }).click();
  await mapMetric(page, "ozone");
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-instance",
    instance!,
  );
  await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
  fs.writeFileSync(
    "artifacts/creative-reset/motion-samples.json",
    JSON.stringify(
      {
        layout: samples,
        dotX: dotSamples,
        frameCount: samples.length,
        largestFrameGap: Math.max(
          ...samples.slice(1).map((s, i) => s.t - samples[i].t),
        ),
      },
      null,
      2,
    ),
  );
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
