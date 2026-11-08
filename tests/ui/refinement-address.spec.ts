import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Retained source-backed selections exercise UI state; mocked geocoding below
// does not establish that a live Census input variant resolves.
const locations = JSON.parse(
  fs.readFileSync("data/samples/frontend-v1.json", "utf8"),
).locations;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("multiline civic-address paste preserves separators and ambiguous results require confirmation", async ({
  page,
}) => {
  let submitted = "";
  await page.route("**/api/geocode", (route) => {
    submitted = route.request().postDataJSON().address;
    return route.fulfill({ json: { candidates: locations } });
  });
  await page.goto("/");
  const input = page.getByLabel("Search a California address");
  await input.focus();
  await expect(page.locator("#search-help")).toContainText(
    "commas are optional",
  );
  await expect(input).toHaveAttribute("maxlength", "1000");
  await input.evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text/plain", "125 14th St\nOakland\nCalifornia 94612\nUSA");
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(input).toHaveValue(
    "125 14th St, Oakland, California 94612, USA",
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".candidate")).toHaveCount(2);
  expect(submitted).toBe("125 14th St, Oakland, California 94612, USA");
  await expect(page.locator(".place-pin")).toHaveCount(0);
  await expect(page.locator(".candidate").first()).toContainText(
    locations[0].label,
  );
  await expect(page.locator(".candidate").first()).toContainText(
    "address-range interpolation",
  );
  await page
    .getByRole("button", { name: /Confirm this address/ })
    .first()
    .click();
  await expect(page.locator(".place-pin")).toHaveCount(1);
  await expect(page.locator(".candidate")).toHaveCount(0);
});

test("short invalid input reaches actionable API guidance; editing cancels stale candidates", async ({
  page,
}) => {
  let releaseSlow: (() => void) | undefined;
  const slow = new Promise<void>((resolve) => {
    releaseSlow = resolve;
  });
  let complete: (() => void) | undefined;
  const completed = new Promise<void>((resolve) => {
    complete = resolve;
  });
  await page.route("**/api/geocode", async (route) => {
    const address = route.request().postDataJSON().address;
    if (address === "x")
      return route.fulfill({
        status: 400,
        json: {
          error: "Include a building number and street, plus a city or ZIP.",
        },
      });
    await slow;
    await route.fulfill({ json: { candidates: locations } }).catch(() => {});
    complete!();
  });
  await page.goto("/");
  const input = page.getByLabel("Search a California address");
  await input.fill("x");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "building number and street",
  );
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("125 14th St Oakland");
  const started = page.waitForRequest((request) =>
    request.url().endsWith("/api/geocode"),
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await started;
  await input.fill("2600 Fresno St Fresno California");
  releaseSlow!();
  await completed;
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(page.locator(".candidate")).toHaveCount(0);
  await expect(page.locator(".place-pin")).toHaveCount(0);
});

test("combined API rejects links and non-address inputs without opening URLs", async ({
  request,
}) => {
  for (const address of [
    "https://127.0.0.1:3000/api/demo",
    "Oakland CA 94612",
    "PO Box 12 Oakland CA",
  ]) {
    const response = await request.post("/api/geocode", { data: { address } });
    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");
    const body = await response.json();
    expect(body.error).toMatch(/street|building|Links are not opened/);
    expect(body.candidates).toBeUndefined();
  }
});
