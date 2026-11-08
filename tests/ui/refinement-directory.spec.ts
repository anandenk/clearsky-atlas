import { expect, test } from "@playwright/test";

// Run against the integrated app with its verified inventories; no source mocks.
test("desktop directory separates search feedback and keeps facility locate independent of address pins", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByLabel("Search a California address").focus();
  await page.getByRole("button", { name: "Oakland", exact: true }).click();
  await page.getByRole("button", { name: /Confirm this address/ }).click();
  const pins = page.locator(".place-pin");
  await expect(pins).toHaveCount(1);
  const originalPin = await pins.first().getAttribute("aria-label");
  const openEvidence = page.getByRole("button", {
    name: "Open evidence",
    exact: true,
  });
  if (await openEvidence.isVisible()) await openEvidence.click();
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  await expect(page.locator(".inventory-status")).toContainText(
    "24,865 source-listed points loaded",
    { timeout: 60000 },
  );
  const launcher = page.getByRole("button", {
    name: "Find a facility",
    exact: true,
  });
  await launcher.click();
  const dialog = page.getByRole("dialog", {
    name: "Find a source-listed facility",
    exact: true,
  });
  const search = dialog.getByLabel("Facility name", { exact: true });
  const status = dialog.getByRole("status");
  const rows = dialog.locator(".facility-directory-results li > button");
  await expect(status).toHaveText("24,865 matches · First 50 shown");
  await expect(rows).toHaveCount(50);

  // Reproduce screenshot 3's one-character search and visible keyboard ring.
  await search.fill("d");
  await expect(status).toHaveText(/^[\d,]+ matches · First 50 shown$/);
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(rows).toHaveCount(50);
  await expect(search).toBeFocused();
  const spacing = await dialog.evaluate((element) => {
    const input = element.querySelector("input")!;
    const help = element.querySelector(".facility-directory-help")!;
    const status = element.querySelector('[role="status"]')!;
    const style = getComputedStyle(input);
    const ring =
      parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    return {
      helpGap:
        help.getBoundingClientRect().top - input.getBoundingClientRect().bottom,
      statusGap:
        status.getBoundingClientRect().top -
        input.getBoundingClientRect().bottom,
      ring,
      outline: style.outlineStyle,
    };
  });
  expect(spacing.outline).toBe("solid");
  expect(spacing.helpGap).toBeGreaterThan(spacing.ring);
  expect(spacing.statusGap).toBeGreaterThan(spacing.ring + 8);
  const boxes = await rows.evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        x: rect.x,
        width: rect.width,
        top: rect.top,
        bottom: rect.bottom,
      };
    }),
  );
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].x).toBeCloseTo(boxes[0].x, 0);
    expect(boxes[i].width).toBeCloseTo(boxes[0].width, 0);
    expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
  }
  await expect(rows.first().locator("span")).toContainText(
    /Healthcare|Public schools/,
  );
  await expect(rows.first().locator("span")).toContainText("Source status:");
  await page.screenshot({
    path: "artifacts/refinement/directory-one-character.png",
  });
  await page.keyboard.press("Tab");
  await expect(rows.first()).toBeFocused();
  // Native keyboard focus must scroll the final bounded row into the list viewport.
  await rows.last().focus();
  await expect(rows.last()).toBeFocused();
  const scroll = await rows.last().evaluate((button) => {
    const list = button.closest("ul")!;
    const row = button.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    return {
      top: row.top,
      bottom: row.bottom,
      listTop: box.top,
      listBottom: box.bottom,
      scrollTop: list.scrollTop,
    };
  });
  expect(scroll.scrollTop).toBeGreaterThan(0);
  expect(scroll.top).toBeGreaterThanOrEqual(scroll.listTop);
  expect(scroll.bottom).toBeLessThanOrEqual(scroll.listBottom);

  await search.fill("zzzz-no-facility-7e84");
  await expect(status).toHaveText("0 matches");
  await expect(
    dialog.getByText("No matching facilities", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Clear search", exact: true })
    .click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(status).toHaveText("24,865 matches · First 50 shown");

  // Escape returns focus to the launcher using the existing native dialog.
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await launcher.click();
  await search.fill("d");
  const facilityName = await rows.first().locator("strong").innerText();
  await rows.first().focus();
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  const detail = page.getByRole("dialog", {
    name: "About this location",
    exact: true,
  });
  await expect(detail.locator(".facility-detail > strong")).toHaveText(
    facilityName,
  );
  await expect(detail).toContainText(
    "Published source point · no address distance calculated",
  );
  const coordinateText = await detail
    .locator(".facility-detail > span")
    .nth(2)
    .innerText();
  const expectedCoordinate = coordinateText
    .split(" · ")[0]
    .split(", ")
    .map(Number);
  expect(expectedCoordinate).toHaveLength(2);
  await detail
    .getByRole("button", { name: "Show on map", exact: true })
    .click();
  await expect(detail).not.toBeVisible();
  await expect
    .poll(
      async () => {
        const center = JSON.parse(
          (await page.locator(".atlas-map").getAttribute("data-center")) ||
            "[]",
        );
        return (
          center.length === 2 &&
          center.every(
            (value: number, i: number) =>
              Math.abs(value - expectedCoordinate[i]) < 0.0001,
          )
        );
      },
      { timeout: 30000 },
    )
    .toBe(true);
  await expect(pins).toHaveCount(1);
  await expect(pins.first()).toHaveAttribute("aria-label", originalPin!);
});
