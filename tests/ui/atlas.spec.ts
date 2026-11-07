import { test, expect } from "@playwright/test";
test.setTimeout(90000);
test("live overview, confirmed address, ozone and provider isolation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
  await expect(page.locator(".measurement")).toHaveCount(0);
  await expect(page.locator("[data-tracts-rendered=true]")).toHaveCount(1, {
    timeout: 45000,
  });
  await page
    .getByLabel("Search California address")
    .fill("125 14th St Oakland CA 94612");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: /Use match/ }).click();
  await expect(page.locator(".measurement-value")).toContainText("8.33");
  await page.getByLabel("Indicator", { exact: true }).selectOption("ozone");
  await expect(page.locator(".measurement-value")).toContainText("ppm");
  await expect(page.locator("[data-tracts-rendered=true]")).toHaveCount(1, {
    timeout: 30000,
  });
  await page.screenshot({ path: "artifacts/live-ozone.png" });
  await page
    .getByRole("button", { name: "Explore full UI preview", exact: true })
    .click();
  await expect(page.locator(".measurement")).toHaveCount(0);
  await page.getByRole("button", { name: "Return to live" }).click();
  await expect(page.locator(".measurement")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("preview collection, modes, facilities, null and zero, widths", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore full UI preview", exact: true })
    .click();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "Add example location" }).click();
  await expect(page.locator(".atlas-map canvas")).toHaveCount(4);
  await expect(page.locator(".collection details")).toHaveCount(5);
  await page.getByLabel("Scenario").selectOption("zero");
  await expect(page.locator(".measurement-value").first()).toHaveText(
    "0 µg/m³",
  );
  await page.getByLabel("Scenario").selectOption("missing");
  await expect(page.locator(".measurement-value").nth(1)).toContainText(
    "Unavailable",
  );
  await page.getByLabel("Scenario").selectOption("incompatible");
  await expect(
    page.getByText("Difference unavailable: missing or incompatible evidence."),
  ).toHaveCount(4);
  await page.getByLabel("Scenario").selectOption("normal");
  await page.getByRole("button", { name: "Community", exact: true }).click();
  await page.getByLabel("Indicator", { exact: true }).selectOption("age");
  await expect(page.getByLabel("Population composition")).toBeVisible();
  await page.screenshot({ path: "artifacts/community.png" });
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  await page.getByRole("button", { name: /Example healthcare/ }).click();
  await expect(page.getByText(/Example status: operating/)).toBeVisible();
  await page.getByLabel("Public schools", { exact: true }).uncheck();
  await expect(page.locator(".facility")).toHaveCount(2);
  await page.screenshot({ path: "artifacts/infrastructure.png" });
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
    expect(
      await page
        .locator(".atlas-map")
        .evaluate((e) => e.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(420);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".atlas-map[data-ready=true]")).toHaveCount(1, {
      timeout: 30000,
    });
    await page.screenshot({
      path: `artifacts/mobile-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Environment", exact: true }).click();
  await page.getByLabel("Scenario").selectOption("failure");
  await expect(page.locator(".atlas-error")).toContainText(
    "Simulated evidence failure",
  );
  await page.screenshot({ path: "artifacts/failure.png", fullPage: true });
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator(".measurement")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("collection editing, stories, same tract and camera interaction", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore full UI preview", exact: true })
    .click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Add example location" }).click();
  await expect(page.locator(".atlas-map canvas")).toHaveCount(3);
  await expect(page.locator("[data-tracts-rendered=true]")).toHaveCount(3, {
    timeout: 30000,
  });
  await page.screenshot({ path: "artifacts/three.png" });
  await page.locator(".collection summary").nth(1).click();
  await page.getByRole("button", { name: "Reference", exact: true }).click();
  await page.getByRole("button", { name: "Move earlier" }).click();
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await page.getByLabel("Replace address").fill("Example 1");
  await page
    .getByRole("button", { name: "Replace", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Use match/ }).click();
  await expect(
    page.getByText("Same tract observations; distinct address pins."),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Air around these places" }).click();
  await page
    .locator(".story-steps")
    .getByRole("button", { name: "Ozone", exact: true })
    .click();
  await expect(page.getByLabel("Indicator", { exact: true })).toHaveValue(
    "ozone",
  );
  await page.getByRole("button", { name: "Leave story" }).click();
  await page
    .getByRole("button", { name: "Zoom in", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Cameras linked" }).click();
  await expect(
    page.getByRole("button", { name: "Cameras unlocked" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Reset views" }).click();
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator(".atlas-map canvas")).toHaveCount(1);
});
test("live failures never substitute preview, edits abort stale candidate", async ({
  page,
}) => {
  await page.goto("/");
  await page.route("**/api/geocode", async (route) => {
    await new Promise((r) => setTimeout(r, 250));
    await route.fulfill({
      status: 503,
      json: { error: "Test upstream unavailable" },
    });
  });
  await page.getByLabel("Search California address").fill("address one");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByLabel("Search California address").fill("address two");
  await expect(page.locator(".atlas-candidates")).toHaveCount(0);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".atlas-error")).toContainText(
    "Test upstream unavailable",
  );
  await expect(page.locator(".preview-banner")).toHaveCount(0);
  await page.getByRole("button", { name: "Health", exact: true }).click();
  await page.getByRole("button", { name: "Show evidence" }).click();
  await expect(
    page.getByText(/This live indicator is not verified/),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/live-failure.png" });
});
