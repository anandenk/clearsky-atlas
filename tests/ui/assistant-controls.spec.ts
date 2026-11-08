import { test, expect } from "@playwright/test";
for (const viewport of [
  { width: 1440, height: 960 },
  { width: 1280, height: 800 },
])
  test(`view controls stay beneath compact and expanded Ask ClearSky at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/assistant", (route) =>
      route.fulfill({
        json: {
          message:
            "You can explore the map using the controls below this conversation.",
          clarification: null,
          followUps: [],
          insights: [],
          evidence: [],
          actions: [],
          usage: {
            model: "fixture",
            latencyMs: 1,
            inputTokens: 0,
            outputTokens: 0,
            thinkingTokens: 0,
            calls: 1,
            rounds: 1,
          },
        },
      }),
    );
    await page.goto("/");
    const panel = page.locator("#ask-clearsky"),
      controls = page.locator(".view-switch");
    const below = async () => {
      const a = (await panel.boundingBox())!,
        b = (await controls.boundingBox())!;
      expect(b.y).toBeGreaterThanOrEqual(a.y + a.height + 10);
      expect(b.y).toBeLessThanOrEqual(a.y + a.height + 16);
      expect(b.x + b.width).toBeCloseTo(a.x + a.width, 0);
      expect(b.y + b.height).toBeLessThanOrEqual(viewport.height - 20);
    };
    await expect(panel).toBeVisible();
    await below();
    await page.locator(".ask-privacy summary").click();
    await below();
    await page.locator(".ask-privacy summary").click();
    await page
      .getByLabel("Your question", { exact: true })
      .fill("Help me explore");
    await page
      .getByRole("button", { name: "Send question", exact: true })
      .click();
    await expect(panel).not.toHaveClass(/ask-panel-intro/);
    await below();
    await page.getByRole("button", { name: "City", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "City", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await below();
    await page.getByRole("button", { name: "Minimize Ask ClearSky" }).click();
    await expect(panel).toHaveClass(/ask-panel-intro/);
    await below();
    await page.screenshot({
      path: `artifacts/assistant-controls/compact-${viewport.width}.png`,
    });
  });
