import { test, expect, type Page } from "@playwright/test";
import { geographyEnabled } from "../../src/frontend/experimental-features";

test("geography opt-in parsing requires the explicit value 1", () => {
  for (const search of ["", "?geography", "?geography=0", "?geography=true", "?other=1", "?Geography=1"])
    expect(geographyEnabled(search)).toBe(false);
  expect(geographyEnabled("?geography=1")).toBe(true);
  expect(geographyEnabled("?other=1&geography=1")).toBe(true);
});

async function addPlaces(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(path);
  await expect(page.locator(".atlas-map")).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  for (const city of ["Oakland", "Fresno"]) {
    await page.getByLabel("Search a California address").focus();
    await page.getByRole("button", { name: city, exact: true }).click();
    await page.getByRole("button", { name: /Confirm this address/ }).click();
  }
}

test("ordinary multi-place comparison has no geography controls or second map", async ({ page }) => {
  test.setTimeout(60000);
  await addPlaces(page, "/");
  const maps = page.locator(".atlas-map");
  const original = await maps.getAttribute("data-instance");
  // Count DOM nodes as well as accessible buttons: CSS hiding would leave a
  // potential hidden focus target and must not satisfy the default gate.
  await expect(page.locator(".geography-open, .peek-compare")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Compare (geography|maps)$/, includeHidden: true })).toHaveCount(0);
  await expect(page.locator(".comparison-map-stage, .geography-comparison")).toHaveCount(0);
  await expect(maps).toHaveCount(1);
  await page.getByRole("button", { name: "Open evidence", exact: true }).click();
  await expect(page.locator(".comparison-compass")).toBeVisible();
  await page.locator(".index-measure").first().click();
  await expect(page.locator(".place-reading")).toHaveCount(2);
  await expect(page.locator(".geography-open, .peek-compare")).toHaveCount(0);
  await expect(maps).toHaveCount(1);
  await expect(maps).toHaveAttribute("data-instance", original!);
});

for (const launch of ["Compare geography", "Compare maps"]) {
  test(`developer opt-in can open and close linked geography via ${launch}`, async ({ page }) => {
    test.setTimeout(60000);
    await addPlaces(page, "/?geography=1");
    const maps = page.locator(".atlas-map");
    const original = await maps.getAttribute("data-instance");
    await expect(maps).toHaveCount(1); // Opt-in alone must not allocate a second map.
    for (const name of ["Compare geography", "Compare maps"])
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    await page.getByRole("button", { name: launch, exact: true }).click();
    await expect(maps).toHaveCount(2);
    await expect(page.getByRole("region", { name: "Geographic comparison" })).toBeVisible();
    for (const map of await maps.all())
      await expect(map).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
    await page.getByRole("button", { name: "One map", exact: true }).click();
    await expect(maps).toHaveCount(1);
    await expect(maps).toHaveAttribute("data-instance", original!);
    await expect(page.locator(".comparison-map-stage, .geography-comparison")).toHaveCount(0);
    await expect(page.getByRole("button", { name: launch, exact: true })).toBeVisible();
  });
}
