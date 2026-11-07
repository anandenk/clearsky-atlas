import { test, expect } from "@playwright/test";
import fs from "node:fs";
const demo = JSON.parse(fs.readFileSync("data/demo-geocodes.json", "utf8"));
const m = JSON.parse(
  fs.readFileSync("data/raw/geocode-oakland-central-near.json", "utf8"),
).result.addressMatches[0];
test("real maps, swap, clear, same tract, source drawer and lookup failures", async ({
  page,
}) => {
  const realPair = await (await page.request.get("/api/demo")).json();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("B has a higher PM2.5 estimate.")).toBeVisible();
  await expect(page.locator(".big-number").first()).toContainText("8.33");
  // Require actual rendered tract pixels: style worker and source both load. Map exposes diagnostics through the canvas data attributes.
  await expect(page.locator(".map canvas")).toHaveCount(2);
  await expect(page.locator("[data-tracts-rendered=true]")).toHaveCount(2, {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Swap addresses" }).click();
  await expect(page.getByText("A has a higher PM2.5 estimate.")).toBeVisible();
  await expect(page.locator(".big-number").first()).toContainText("12.48");
  await page.getByRole("button", { name: "Clear address B" }).click();
  await expect(page.getByText("Choose two places to compare.")).toBeVisible();
  await expect(page.locator(".big-number").nth(1)).toContainText("—");
  await page.getByRole("button", { name: /Try example pair/ }).click();
  await expect(page.getByText("B has a higher PM2.5 estimate.")).toBeVisible();
  await page.route("**/api/geocode", (r) =>
    r.fulfill({
      json: {
        candidates: [
          {
            ...realPair[0],
            label: m.matchedAddress,
            coordinate: [m.coordinates.x, m.coordinates.y],
            cached: false,
          },
        ],
      },
    }),
  );
  await page.getByLabel("Compare with").fill("129 14th St Oakland CA 94612");
  await page.getByRole("button", { name: "Find address B" }).click();
  await page.getByRole("button", { name: /Use match/ }).click();
  await expect(page.getByText("Two addresses. One tract.")).toBeVisible();
  await page.getByRole("button", { name: /Definition, sources/ }).click();
  await expect(
    page.getByText(/Days with satellite-detected wildfire smoke/),
  ).toBeVisible();
  await page.unroute("**/api/geocode");
  await page.route("**/api/geocode", (r) =>
    r.fulfill({
      status: 503,
      json: { error: "Address lookup is unavailable or timed out." },
    }),
  );
  await page.getByLabel("Compare with").fill("Some address CA");
  await page.getByRole("button", { name: "Find address B" }).click();
  await expect(page.locator(".error[role=alert]")).toContainText("unavailable");
  expect(errors).toEqual([]);
});
for (const width of [320, 375, 414, 768, 1440])
  test("layout " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByText("B has a higher PM2.5 estimate."),
    ).toBeVisible();
    await page.waitForTimeout(1000);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/atlas-${width}.png`,
      fullPage: true,
    });
    if (width < 600) {
      await page.getByRole("button", { name: /Map B/ }).click();
      await expect(
        page.locator(".map-pane.visible .map-label strong"),
      ).toHaveText("Fresno");
    }
  });
test("request race preserves the newest address result", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("B has a higher PM2.5 estimate.")).toBeVisible();
  let count = 0;
  const a = await (await page.request.get("/api/demo")).json();
  await page.route("**/api/geocode", async (r) => {
    const n = ++count;
    if (n === 1) await new Promise((x) => setTimeout(x, 700));
    await r
      .fulfill({ json: { candidates: [a[n === 1 ? 0 : 1]] } })
      .catch(() => {});
  });
  const input = page.getByLabel("First address");
  await input.fill("Old query Oakland CA");
  await page.getByRole("button", { name: "Find address A" }).click();
  await input.fill("New query Fresno CA");
  await page.getByRole("button", { name: "Find address A" }).click();
  await expect(page.locator(".candidates")).toContainText("FRESNO");
  await page.waitForTimeout(900);
  await expect(page.locator(".candidates")).not.toContainText("OAKLAND");
});

test("missing observation, keyboard search, and reduced motion", async ({
  page,
}) => {
  const a = await (await page.request.get("/api/demo")).json();
  a[1].observations.pm = null;
  a[1].observations.pmP = null;
  await page.route("**/api/demo", (r) => r.fulfill({ json: a }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("Choose two places to compare.")).toBeVisible();
  await expect(page.locator(".big-number").nth(1)).toContainText("—");
  await expect(page.locator(".value").nth(1)).toContainText(
    "Percentile unavailable",
  );
  await page.getByLabel("First address").focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Find address A" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
});
