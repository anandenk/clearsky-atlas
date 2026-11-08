import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { landscapeHeightExpression, metresPerPercentileAtZoom } from "../../src/frontend/landscape";

// Integration-owner regression: run against the rebuilt combined application.
// These probes use the real MapLibre renderer and live local evidence, including
// evaluated paint on render events (getPaintProperty alone is only a target).
test.setTimeout(120000);

test("focus layout hides both relief buffers and rims without waiting for source readiness", () => {
  // Supplemental unit coverage only; the real first-render probes below are
  // the acceptance check. Exercise the actual production layout body with an
  // unsettled worker and a previously fully elevated landscape.
  const source = readFileSync(new URL("../../src/AtlasMap.tsx", import.meta.url), "utf8");
  const start = source.indexOf('    const m=map.current;\n    if(!m || !ready || !m.getLayer("landscape0"))');
  const body = source.slice(start, source.indexOf("  },[ready,p.landscape", start));
  const run = new Function("map", "ready", "p", "appliedPlaceFocus", "growth", "rendered", "performance", "reduced",
    "container", "latest", "metresPerPercentileAtZoom", "landscapeHeightExpression", "buildings",
    "requestAnimationFrame", "cancelAnimationFrame", "window", "clearTimeout",
    "return (" + stripTypeScriptTypes("function layout(){\n" + body + "\n}") + ")();");
  const writes: any[][] = [], opacity: number[] = [];
  const listeners = new Set<string>();
  const m = {
    getLayer: () => true, getZoom: () => 8, isSourceLoaded: () => false,
    setPaintProperty: (...args: any[]) => { writes.push(args); },
    on: (name: string) => { listeners.add(name); },
    off: (name: string) => { listeners.delete(name); },
  };
  const growth = { current: 1 }, applied = { current: 0 }, container = { current: { dataset: {} as Record<string, string> } };
  const unexpectedFrame = () => { throw Error("Settled focus must not animate or wait for tiles"); };
  const cleanup = run({ current: m }, true, { landscape: false, overview: false, placeFocus: { id: "1", serial: 1 } }, applied,
    growth, { mode: "Environment", metric: { percentileField: "p" }, slot: 0 }, { now: () => 100 }, () => false,
    container, { current: { onHeightScale: () => {} } }, metresPerPercentileAtZoom, landscapeHeightExpression,
    { current: { setOpacity: (value: number) => { opacity.push(value); } } }, unexpectedFrame, () => {}, {}, () => {});
  expect(growth.current).toBe(0); expect(applied.current).toBe(1);
  expect(container.current.dataset.landscapeProgress).toBe("0");
  for (const layer of ["landscape0", "landscape1", "tract-roof-highlight"])
    expect(writes).toContainEqual([layer, "fill-extrusion-opacity", 0]);
  expect(writes.some(write => ["fill-extrusion-height", "fill-extrusion-base"].includes(write[1]))).toBe(false);
  expect(opacity).toEqual([.7]); // Only the existing building controller receives the opacity request.
  cleanup(); expect(listeners.size).toBe(0);
});

async function prepare(page: Page) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const map = page.locator(".atlas-map");
  await expect(map).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  for (const name of ["Oakland", "Fresno"]) {
    await page.getByLabel("Search a California address").focus();
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: /Confirm this address/ }).click();
  }
  await page.getByRole("button", { name: "Together", exact: true }).click();
  await expect(map).toHaveAttribute("data-landscape-progress", "1");
  await expect(page.locator(".map-update-status")).toHaveCount(0);
  await page.evaluate(() => {
    const w = window as any, el = document.querySelector(".atlas-map") as any;
    let fiber = el[Object.keys(el).find(k => k.startsWith("__reactFiber"))!];
    while (fiber && !w.focusMap) {
      let hook = fiber.memoizedState;
      while (hook) {
        if (hook.memoizedState?.current?.getZoom) w.focusMap = hook.memoizedState.current;
        hook = hook.next;
      }
      fiber = fiber.return;
    }
    const m = w.focusMap;
    if (!m) throw Error("Map unavailable");
    w.focusSources = [m.getSource("tracts0"), m.getSource("tracts1")];
    w.focusWrites = [];
    w.focusSubmissions = [];
    for (const id of ["tracts0", "tracts1", "tract-roof-edges"]) {
      const source = m.getSource(id), set = source.setData;
      source.setData = function (...args: any[]) {
        w.focusSubmissions.push(id);
        return set.apply(this, args);
      };
    }
    const paint = m.setPaintProperty;
    m.setPaintProperty = function (...args: any[]) {
      if (["fill-extrusion-height", "fill-extrusion-base"].includes(args[1])) w.focusWrites.push(args);
      return paint.apply(this, args);
    };
    w.focusSnapshot = () => {
      const layers = ["landscape0", "landscape1", "tract-roof-highlight"];
      return {
        t: performance.now() - w.focusStarted,
        city: document.querySelector('.view-primary button:nth-child(2)')?.getAttribute("aria-pressed"),
        auto: document.querySelector('.view-primary button:nth-child(1)')?.getAttribute("aria-pressed"),
        moving: m.isMoving(), zoom: m.getZoom(), center: m.getCenter().toArray(),
        target: layers.map(id => m.getPaintProperty(id, "fill-extrusion-opacity")),
        actual: layers.map(id => m.style.getLayer(id).paint.get("fill-extrusion-opacity")),
        osm: m.getPaintProperty("city-buildings", "fill-extrusion-opacity"),
        metric: el.dataset.metric, provider: el.dataset.provider,
        title: document.querySelector(".map-key-title")?.textContent,
        scale: document.querySelector(".key-ends")?.textContent,
        ramp: getComputedStyle(document.querySelector(".color-ramp")!).backgroundImage,
        sourcesRetained: w.focusSources.every((source: any, i: number) => m.getSource("tracts" + i) === source),
      };
    };
    m.on("render", () => {
      if (w.focusSampling) w.focusRenders.push(w.focusSnapshot());
      if (w.focusNative && m.getLayer("overture-buildings-3d")) w.focusNative.push({
        opacity: m.style.getLayer("overture-buildings-3d").paint.get("fill-extrusion-opacity"),
        parts: m.style.getLayer("overture-building-parts-3d").paint.get("fill-extrusion-opacity"),
        osm: m.style.getLayer("city-buildings").paint.get("fill-extrusion-opacity"),
      });
    });
    document.addEventListener("click", event => {
      if (!(event.target as Element).closest(".place-focus, .place-pin, .compass-places button, .place-reading > button")) return;
      w.focusStarted = performance.now();
      w.focusFrames = []; w.focusRenders = []; w.focusWrites = [];
      w.focusSubmissions = [];
      w.focusSampling = true;
      const started = w.focusStarted;
      const sample = () => {
        if (started !== w.focusStarted) return;
        w.focusFrames.push(w.focusSnapshot());
        if (w.focusFrames.length < 12) requestAnimationFrame(sample);
        else w.focusSampling = false;
      };
      requestAnimationFrame(sample);
    }, true);
  });
  const response = await page.request.get("/api/demo");
  expect(response.ok()).toBe(true);
  return (await response.json()) as { coordinate: [number, number] }[];
}

async function earlyFrames(page: Page, label: string, moving: boolean) {
  await page.waitForFunction(() => (window as any).focusFrames.length >= 12);
  const probe = await page.evaluate(() => {
    const w = window as any;
    return { frames: w.focusFrames, renders: w.focusRenders, writes: w.focusWrites, submissions: w.focusSubmissions };
  });
  await test.info().attach(label, { body: JSON.stringify(probe), contentType: "application/json" });
  expect(probe.frames.length).toBe(12);
  expect(probe.renders.length).toBeGreaterThan(0);
  for (const frame of [...probe.frames, ...probe.renders]) {
    expect(frame.city).toBe("true");
    expect(frame.target).toEqual([0, 0, 0]);
    expect(frame.metric).toBe("pm"); expect(frame.provider).toBe("live");
    expect(frame.title).toContain("Fine particulate matter");
    expect(frame.scale.replace(/\s/g, "")).toBe("0Statewidepercentile100");
    expect(frame.sourcesRetained).toBe(true);
  }
  // Sample evaluated renderer opacity from the very first post-click render,
  // ahead of camera arrival, rather than polling for eventual zero.
  for (const frame of probe.renders) expect(frame.actual).toEqual([0, 0, 0]);
  expect(new Set(probe.frames.map((f: any) => f.ramp)).size).toBe(1);
  expect(probe.writes).toEqual([]);
  expect(probe.submissions).toEqual([]);
  if (moving) {
    expect(probe.frames[0].zoom).toBeLessThan(15.5);
    expect(probe.frames.some((f: any) => f.moving)).toBe(true);
  }
  return probe;
}

async function arrived(page: Page, coordinate: [number, number]) {
  await expect.poll(() => page.evaluate(() => {
    const m = (window as any).focusMap;
    return !m.isMoving() && Math.abs(m.getZoom() - 15.6) < .001;
  })).toBe(true);
  const center = await page.evaluate(() => (window as any).focusMap.getCenter().toArray());
  expect(center[0]).toBeCloseTo(coordinate[0], 6);
  expect(center[1]).toBeCloseTo(coordinate[1], 6);
  await expect(page.locator(".place-pin")).toHaveCount(2);
}

async function togetherLandscape(page: Page) {
  await page.getByRole("button", { name: "Together", exact: true }).click();
  await expect.poll(() => page.evaluate(() => !(window as any).focusMap.isMoving())).toBe(true);
  await expect(page.getByRole("button", { name: "Data Landscape", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".atlas-map")).toHaveAttribute("data-landscape-progress", "1");
}

async function sourceDetails(page: Page) {
  await page.getByRole("button", { name: "About this measure", exact: true }).click();
  const text = await page.getByRole("dialog").locator(".source-content").innerText();
  await page.keyboard.press("Escape");
  return text;
}

test("Auto place focus removes real relief on first renders and recovers Landscape on later zoom-out", async ({ page }) => {
  const locations = await prepare(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const provenance = await sourceDetails(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const index of [0, 1]) {
    await expect(page.getByRole("button", { name: "Auto", exact: true })).toHaveAttribute("aria-pressed", "true");
    // Establish actual, nonzero rendered analytical relief before every click.
    await expect.poll(() => page.evaluate(() => {
      const m = (window as any).focusMap;
      return [0, 1].some(i => m.style.getLayer("landscape" + i).paint.get("fill-extrusion-opacity") > .8);
    })).toBe(true);
    await page.locator(".place-focus").nth(index).click();
    const probe = await earlyFrames(page, `auto-focus-${index + 1}-first-frames`, true);
    expect(probe.frames.every((f: any) => f.auto === "true")).toBe(true);
    await arrived(page, locations[index].coordinate);
    expect(await sourceDetails(page)).toBe(provenance);
    await togetherLandscape(page);
  }
  // Manual choices still override the zoom heuristic after focus.
  await page.getByRole("button", { name: "City", exact: true }).click();
  await page.getByRole("button", { name: "Data Landscape", exact: true }).click();
  await expect(page.locator(".atlas-map")).toHaveAttribute("data-landscape-progress", "1");
  // Focusing the same saved address from evidence follows the same City intent.
  const open = page.getByRole("button", { name: "Open evidence", exact: true });
  if (await open.isVisible()) await open.click();
  await expect.poll(() => page.evaluate(() => !(window as any).focusMap.isMoving())).toBe(true);
  await page.locator(".compass-places button").first().click();
  await earlyFrames(page, "evidence-place-focus-first-frames", false);
  await arrived(page, locations[0].coordinate);
  expect(errors).toEqual([]);
});

test("manual Landscape, interrupted flights, latest-place clicks and same-place refocus remain coherent", async ({ page }) => {
  const locations = await prepare(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Data Landscape", exact: true }).click();
  await page.locator(".place-focus").nth(0).click();
  await earlyFrames(page, "manual-landscape-focus-first-frames", true);
  await expect(page.getByRole("button", { name: "Auto", exact: true })).toHaveAttribute("aria-pressed", "false");
  // Interrupt while still below City's normal zoom threshold. Canceling this
  // flight must not report its intermediate zoom as a new Auto intent.
  await page.locator(".place-focus").nth(1).click();
  await earlyFrames(page, "superseding-place-first-frames", false);
  await arrived(page, locations[1].coordinate);
  await page.evaluate(() => {
    const m = (window as any).focusMap;
    m.jumpTo({ center: [-120, 37], zoom: 9, pitch: 0 });
  });
  await page.locator(".place-focus").nth(1).click();
  await earlyFrames(page, "same-active-place-refocus", true);
  await arrived(page, locations[1].coordinate);
  await page.getByRole("button", { name: "Auto", exact: true }).click();
  await page.evaluate(() => (window as any).focusMap.jumpTo({ zoom: 9, pitch: 0 }));
  await expect(page.locator(".atlas-map")).toHaveAttribute("data-landscape-progress", "1");
  // Separate click tasks within one frame interval reproduce the cancel path.
  // This is intentionally not one batched loop of synthetic React updates.
  await page.evaluate(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".place-focus");
    buttons[0].click();
    setTimeout(() => buttons[1].click(), 50);
    setTimeout(() => buttons[0].click(), 100);
  });
  await page.waitForTimeout(140);
  await earlyFrames(page, "rapid-latest-place-first-frames", false);
  await arrived(page, locations[0].coordinate);
  await expect(page.getByRole("button", { name: "Auto", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.place-chip[data-place-id="1"]')).toHaveClass(/is-active/);
});

test("reduced-motion focus is immediate while buildings stay source-gated and reveal natively", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/buildings/catalog?**", async route => {
    await held;
    await route.continue();
  });
  try {
    const locations = await prepare(page);
    await page.locator(".place-focus").nth(0).click();
    const probe = await earlyFrames(page, "reduced-motion-focus", false);
    expect(probe.frames.every((f: any) => f.osm === 0)).toBe(true);
    await expect(page.locator(".atlas-map")).toHaveAttribute("data-arrival-duration", "0");
    await arrived(page, locations[0].coordinate);
    await expect(page.locator(".building-status")).toContainText("Loading Overture buildings + parts");
    await expect(page.locator(".building-status")).not.toContainText("Overture · statewide buildings + parts");
    release();
    await expect(page.locator(".building-status")).toContainText("Overture · statewide buildings + parts", { timeout: 45000 });
    await expect.poll(() => page.evaluate(() => {
      const m = (window as any).focusMap;
      return m.queryRenderedFeatures({ layers: ["overture-buildings-3d"] }).length;
    })).toBeGreaterThan(50);
    const source = await page.evaluate(() => {
      const m = (window as any).focusMap;
      (window as any).residentBuildingSource = m.getSource("overture-buildings");
      return {
        osm: m.getPaintProperty("city-buildings", "fill-extrusion-opacity"),
        parents: m.queryRenderedFeatures({ layers: ["overture-buildings-3d"] }).filter((f: any) => f.properties.has_parts === true).length,
        parts: m.queryRenderedFeatures({ layers: ["overture-building-parts-3d"] }).length,
      };
    });
    expect(source.osm).toBe(0); expect(source.parents).toBe(0); expect(source.parts).toBeGreaterThan(0);
    await togetherLandscape(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => { (window as any).focusNative = []; });
    await page.locator(".place-focus").nth(0).click();
    await earlyFrames(page, "resident-overture-refocus", true);
    await arrived(page, locations[0].coordinate);
    expect(await page.evaluate(() => (window as any).focusMap.getSource("overture-buildings") === (window as any).residentBuildingSource)).toBe(true);
    await expect.poll(() => page.evaluate(() => (window as any).focusNative.at(-1)?.opacity), { timeout: 30000 }).toBe(.7);
    const native = await page.evaluate(() => ({
      samples: (window as any).focusNative,
      writes: (window as any).focusWrites.filter((write: any[]) => write[0].startsWith("overture-")),
    }));
    expect(native.samples.some((s: any) => s.opacity > 0 && s.opacity < .7)).toBe(true);
    expect(native.samples.every((s: any) => s.osm === 0 && Math.abs(s.parts - s.opacity) < .001)).toBe(true);
    expect(native.writes).toEqual([]);
    await test.info().attach("focus-native-building-reveal", { body: JSON.stringify(native), contentType: "application/json" });
  } finally {
    release();
  }
});
