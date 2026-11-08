import { expect, test, type Locator } from "@playwright/test";

// Measure computed text colors against composed ancestor backgrounds, rather
// than testing CSS tokens. This catches later stylesheet cascade regressions.
async function expectReadableText(scope: Locator) {
  const report = await scope.evaluate((root) => {
    type Color = [number, number, number, number];
    const parse = (value: string): Color => {
      const numbers = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (!value.startsWith("rgb") || numbers.length < 3)
        throw new Error(`Unsupported computed color: ${value}`);
      return [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1];
    };
    const over = (front: Color, back: Color): Color => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      return [
        ...[0, 1, 2].map(
          (i) =>
            (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / alpha,
        ),
        alpha,
      ] as Color;
    };
    const luminance = (color: Color) => {
      const linear = color.slice(0, 3).map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const failures: {
      text: string;
      ratio: number;
      color: string;
      background: Color;
    }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let count = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent?.trim();
      const element = node.parentElement;
      if (
        !text ||
        !element ||
        !element.checkVisibility({
          checkVisibilityCSS: true,
          checkOpacity: true,
        })
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      if (!range.getBoundingClientRect().width) continue;
      const ancestors: Element[] = [];
      let current: Element | null = element;
      while (current) {
        ancestors.unshift(current);
        current = current.parentElement;
      }
      let background: Color = [255, 255, 255, 1];
      let opacity = 1;
      for (const ancestor of ancestors) {
        const style = getComputedStyle(ancestor);
        background = over(parse(style.backgroundColor), background);
        opacity *= Number(style.opacity);
      }
      const color = getComputedStyle(element).color;
      const foreground = parse(color);
      foreground[3] *= opacity;
      const a = luminance(over(foreground, background));
      const b = luminance(background);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      count++;
      if (ratio < 4.5) failures.push({ text, ratio, color, background });
    }
    return { count, failures };
  });
  expect(
    report.count,
    "Contrast check must cover actual rendered text",
  ).toBeGreaterThan(10);
  expect(
    report.failures,
    "Every visible infrastructure text node must meet 4.5:1",
  ).toEqual([]);
}

test("Nearby essentials keeps labels and contrast across row, filter and keyboard states", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const name of ["Fresno", "Oakland"]) {
    await page.getByLabel("Search a California address").focus();
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: /Confirm this address/ }).click();
  }
  // Adding a second place keeps Together active; select this fixture explicitly.
  await page.locator(".place-focus").filter({ hasText: "Oakland" }).click();
  const open = page.getByRole("button", { name: "Open evidence", exact: true });
  if (await open.isVisible()) await open.click();
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  const panel = page.locator(".comparison-canvas .infrastructure-content");
  const rows = panel.locator(".facility-comparison > button");
  await expect(rows).toHaveCount(2);
  await expect(panel.locator(".facility-list > button").first()).toBeAttached();
  await expect(panel.locator(".facility-comparison > p").first()).toHaveText(
    "How far are the nearest listed locations?",
  );
  await expect(panel.locator(".distance-context")).toContainText(
    "does not establish availability, eligibility or travel time",
  );
  await expect(panel.locator(".facility-compare-head")).toContainText("Place");
  await expect(panel.locator(".facility-compare-head")).toContainText(
    "Healthcare",
  );
  await expect(panel.locator(".facility-compare-head")).toContainText(
    "Public school",
  );
  for (const name of ["Healthcare", "Public schools", "Power plants preview"]) {
    await expect(
      panel.getByRole("button", { name, exact: true }),
    ).toBeVisible();
  }
  for (const button of await panel.getByRole("button").all()) {
    await expect(button).toHaveAccessibleName(/\S/);
  }
  await expect(rows.filter({ hasText: "Oakland" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(rows.filter({ hasText: "Fresno" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expectReadableText(panel);
  await rows.filter({ hasText: "Fresno" }).click();
  await expect(rows.filter({ hasText: "Fresno" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(rows.filter({ hasText: "Oakland" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expectReadableText(panel);

  // Hover must not reintroduce global purple text; underline is a non-color cue.
  await rows.last().hover();
  await expect(rows.last()).toHaveCSS("text-decoration-line", "underline");
  await expectReadableText(panel);
  await rows.first().focus();
  await page.keyboard.press("Tab");
  await expect(rows.last()).toBeFocused();
  await expect(rows.last()).toHaveCSS("outline-style", "solid");
  await expect(rows.last()).toHaveCSS("outline-width", "3px");
  await expect(rows.first()).toHaveCSS("font-weight", "600");
  expect(
    await rows.first().evaluate((el) => getComputedStyle(el).boxShadow),
  ).not.toBe(
    await rows.last().evaluate((el) => getComputedStyle(el).boxShadow),
  );
  await expectReadableText(panel);

  const healthcare = panel.getByRole("button", {
    name: "Healthcare",
    exact: true,
  });
  await healthcare.click();
  await expect(healthcare).toHaveAttribute("aria-pressed", "false");
  await expectReadableText(panel);
  await page.mouse.move(1400, 900);
  await expectReadableText(panel);
  await healthcare.click();
  await expect(healthcare).toHaveAttribute("aria-pressed", "true");
  await expect(healthcare.locator("svg")).toHaveCount(1);

  // The independently portaled facility dialog must retain its light styling.
  await panel.locator(".facility-directory > summary").click();
  await expectReadableText(panel);
  const facility = panel.locator(".facility-list > button").first();
  await facility.hover();
  await expectReadableText(panel);
  await facility.click();
  const dialog = page.getByRole("dialog", {
    name: "About this location",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((el) => {
      const rgb = getComputedStyle(el)
        .backgroundColor.match(/[\d.]+/g)!
        .map(Number);
      return Math.min(...rgb.slice(0, 3));
    }),
  ).toBeGreaterThan(200);
  await expect(facility).toHaveClass("selected");
  await expectReadableText(panel);
  await page.keyboard.press("Escape");
  await expectReadableText(panel);
});
