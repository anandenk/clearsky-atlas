import { test, expect, type Page } from "@playwright/test";

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Atlas menu", exact: true }).click();
  const menu = page.getByRole("dialog", {
    name: "About ClearSky",
    exact: true,
  });
  await expect(menu).toBeVisible();
  return menu;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

test("current coverage and clear places are visible; diagnostics start closed", async ({
  page,
}) => {
  const menu = await openMenu(page);
  await expect(menu).toContainText("All 23 supported tract measures");
  await expect(menu).toContainText("CalEnviroScreen 5.0");
  await expect(menu).toContainText("source-listed CDPH and CDE inventories");
  await expect(menu).toContainText(
    "Power plants are unavailable in live evidence",
  );
  await expect(
    menu.getByRole("button", { name: "Clear all places", exact: true }),
  ).toBeVisible();
  await expect(menu.locator("details")).not.toHaveAttribute("open");
  for (const name of [
    "Explore synthetic preview",
    "Use fallback raster basemap",
    "Retry map & evidence",
  ]) {
    await expect(menu.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  }
  await expect(menu.getByLabel("Preview scenario")).toHaveCount(0);
});

test("native disclosure supports keyboard, resets on reopen and preserves modal focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Atlas menu", exact: true });
  const menu = await openMenu(page);
  const close = menu.getByRole("button", { name: "Close dialog", exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    menu.getByRole("button", { name: "Clear all places", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu.locator("summary")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu.locator("details")).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await expect(
    menu.getByRole("button", {
      name: "Explore synthetic preview",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await openMenu(page);
  await expect(menu.locator("details")).not.toHaveAttribute("open");
  // With Advanced tools closed, native modal tab order cycles back to Close.
  await page.keyboard.press("Shift+Tab");
  await expect(menu.locator("summary")).toBeFocused();
  await close.click();
  await expect(trigger).toBeFocused();
});

test("advanced preview scenarios remain available and synthetic state clears on live return", async ({
  page,
}) => {
  let menu = await openMenu(page);
  await menu.locator("summary").click();
  await menu
    .getByRole("button", { name: "Explore synthetic preview", exact: true })
    .click();
  await expect(menu).not.toBeVisible();
  await expect(page.locator(".preview-status")).toContainText(/synthetic/i);
  await page
    .getByRole("button", { name: "Add a synthetic example", exact: true })
    .click();
  await expect(page.locator(".place-pin")).toHaveCount(1);

  menu = await openMenu(page);
  await expect(menu.getByRole("status")).toContainText("not live evidence");
  await expect(menu.locator("details")).not.toHaveAttribute("open");
  await menu.locator("summary").click();
  const scenario = menu.getByLabel("Preview scenario");
  await expect(scenario.locator("option")).toHaveText([
    "Typical values",
    "Missing observation",
    "Valid zero",
    "Incompatible evidence",
    "Source failure",
  ]);
  await scenario.selectOption("zero");
  await expect(menu).not.toBeVisible();
  menu = await openMenu(page);
  await menu.locator("summary").click();
  await expect(menu.getByLabel("Preview scenario")).toHaveValue("zero");
  await menu
    .getByRole("button", { name: "Clear all places", exact: true })
    .click();
  await expect(menu).not.toBeVisible();
  await expect(page.locator(".place-pin")).toHaveCount(0);
  await expect(page.locator(".preview-status")).toBeVisible();
  await page
    .getByRole("button", { name: "Add a synthetic example", exact: true })
    .click();
  menu = await openMenu(page);
  await menu.locator("summary").click();
  await menu
    .getByRole("button", { name: "Return to live evidence", exact: true })
    .click();
  await expect(page.locator(".preview-status")).toHaveCount(0);
  await expect(page.locator(".place-pin")).toHaveCount(0);
  menu = await openMenu(page);
  await menu.locator("summary").click();
  await expect(menu.getByLabel("Preview scenario")).toHaveCount(0);
  await expect(
    menu.getByRole("button", {
      name: "Explore synthetic preview",
      exact: true,
    }),
  ).toBeVisible();
});

test("fallback and retry remain reachable only after opting into advanced tools", async ({
  page,
}) => {
  let menu = await openMenu(page);
  await menu.locator("summary").click();
  await menu
    .getByRole("button", { name: "Use fallback raster basemap", exact: true })
    .click();
  await expect(menu).not.toBeVisible();
  menu = await openMenu(page);
  await expect(menu.locator("details")).not.toHaveAttribute("open");
  await menu.locator("summary").click();
  await menu
    .getByRole("button", { name: "Use vector basemap", exact: true })
    .click();
  menu = await openMenu(page);
  await menu.locator("summary").click();
  await menu
    .getByRole("button", { name: "Retry map & evidence", exact: true })
    .click();
  await expect(menu).not.toBeVisible();
  await expect(page.locator(".preview-status")).toHaveCount(0);
});
