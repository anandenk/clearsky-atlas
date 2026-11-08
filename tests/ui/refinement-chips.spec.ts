import { test, expect, type Page } from "@playwright/test";

test.setTimeout(90000);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

async function addCached(page: Page, name: "Oakland" | "Fresno") {
  await page.getByLabel("Search a California address").focus();
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: /Confirm this address/ }).click();
}

async function openReadings(page: Page) {
  const open = page.getByRole("button", { name: "Open evidence", exact: true });
  if (await open.isVisible()) await open.click();
  await page.getByRole("button", {
    name: "Explore Fine particulate matter", exact: true,
  }).click();
}

test("direct X removes only its place, retaining identities, active place and evidence", async ({ page }) => {
  await addCached(page, "Oakland");
  await addCached(page, "Fresno");
  await addCached(page, "Oakland");
  const a = page.locator('.place-chip[data-place-id="1"]');
  const b = page.locator('.place-chip[data-place-id="2"]');
  const c = page.locator('.place-chip[data-place-id="3"]');
  const bTitle = await b.locator(".place-focus").getAttribute("title");
  const bColor = await b.evaluate(e => getComputedStyle(e).getPropertyValue("--place"));
  await b.locator(".place-focus").click();
  await expect(b).toHaveClass(/is-active/);
  const remove = c.getByRole("button", { name: /^Remove place C: / });
  const target = await remove.boundingBox();
  expect(target!.width).toBeGreaterThanOrEqual(24);
  expect(target!.height).toBeGreaterThanOrEqual(24);
  await expect(page.locator(".place-options, .place-menu")).toHaveCount(0);
  await remove.click();
  await expect(c).toHaveCount(0);
  await expect(a).toBeVisible();
  await expect(b).toHaveClass(/is-active/);
  await expect(b.locator(".place-focus")).toHaveAttribute("title", bTitle!);
  await expect(b.locator("b")).toHaveText("B");
  expect(await b.evaluate(e => getComputedStyle(e).getPropertyValue("--place"))).toBe(bColor);
  await openReadings(page);
  await expect(page.locator(".reading-value")).toHaveText(["8.33", "12.48"]);
});

test("focus and keyboard removal are separate actions with a visible focus ring", async ({ page }) => {
  await addCached(page, "Oakland");
  await addCached(page, "Fresno");
  const b = page.locator('.place-chip[data-place-id="2"]');
  const focus = b.getByRole("button", { name: /^Focus place B: / });
  await focus.click();
  await expect(b).toHaveClass(/is-active/);
  await expect(page.locator(".place-chip")).toHaveCount(2);
  await focus.focus();
  await page.keyboard.press("Tab");
  const remove = b.getByRole("button", { name: /^Remove place B: / });
  await expect(remove).toBeFocused();
  expect(await remove.evaluate(e => getComputedStyle(e).outlineStyle)).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(b).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toBeFocused();
  await expect(page.locator(".place-chip.is-active")).toHaveCount(0);
});

test("removing the reference uses the first remaining place without relabeling it", async ({ page }) => {
  await addCached(page, "Oakland");
  await addCached(page, "Fresno");
  await addCached(page, "Oakland");
  await openReadings(page);
  await expect(page.locator(".reading-delta").first()).toHaveText("Reference");
  await page.getByRole("button", { name: /^Remove place A: / }).click();
  await expect(page.locator(".place-chip b")).toHaveText(["B", "C"]);
  await expect(page.locator(".reading-value")).toHaveText(["12.48", "8.33"]);
  await expect(page.locator(".reading-delta")).toHaveText(["Reference", "-4.15 vs B"]);
});

test("last-place removal clears the ribbon, map pins and evidence and returns focus to search", async ({ page }) => {
  await addCached(page, "Oakland");
  await openReadings(page);
  await expect(page.locator(".reading-value")).toHaveText("8.33");
  await page.getByRole("button", { name: /^Remove place A: / }).click();
  await expect(page.locator(".place-ribbon")).toHaveCount(0);
  await expect(page.locator(".place-pin")).toHaveCount(0);
  await expect(page.locator(".reading-value")).toHaveCount(0);
  await expect(page.locator(".opening-lens")).toBeVisible();
  await expect(page.getByLabel("Search a California address")).toBeFocused();
});
