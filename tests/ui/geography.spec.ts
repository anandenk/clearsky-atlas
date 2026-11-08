import { test, expect } from "@playwright/test";
test("linked geography keeps both places, shared cameras and measures, and the original map", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/?geography=1");
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "pm",
    { timeout: 30000 },
  );
  for (const city of ["Oakland", "Fresno"]) {
    await page.getByLabel("Search a California address").focus();
    await page.getByRole("button", { name: city, exact: true }).click();
    await page.getByRole("button", { name: /Confirm this address/ }).click();
  }
  const original = await page
    .locator(".atlas-map")
    .getAttribute("data-instance");
  await page
    .getByRole("button", { name: "Compare geography", exact: true })
    .click();
  const maps = page.locator(".atlas-map");
  await expect(maps).toHaveCount(2);
  for (const map of await maps.all())
    await expect(map).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  await expect(page.locator(".place-pin")).toHaveCount(2);
  await page
    .locator(".comparison-map-stage")
    .getByRole("button", { name: "Zoom in", exact: true })
    .click();
  await expect
    .poll(async () => {
      const cameras = await maps.evaluateAll((es) =>
        es.map((e) => JSON.parse((e as HTMLElement).dataset.camera || "{}")),
      );
      return Math.abs(cameras[0].zoom - cameras[1].zoom);
    })
    .toBeLessThan(0.001);
  await page
    .getByRole("button", { name: "Data Landscape", exact: true })
    .click();
  for (const map of await maps.all()) {
    await expect(map).toHaveAttribute("data-landscape-progress", "1");
    await expect(map).toHaveAttribute("data-height-scale", "9");
  }
  await page.getByLabel("Comparison measure").selectOption("ozone");
  for (const map of await maps.all())
    await expect(map).toHaveAttribute("data-metric", "ozone", {
      timeout: 30000,
    });
  await expect(page.locator(".geography-place").first()).toContainText("Ozone");
  await page.screenshot({ path: "artifacts/geography/desktop.png" });
  const width=process.env.ATLAS_DESKTOP_ONLY === '1' ? 1440 : 320;
  await page.setViewportSize({ width, height: 960 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "artifacts/geography/resized.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "One map", exact: true }).click();
  await expect(maps).toHaveCount(1);
  await expect(maps.first()).toHaveAttribute("data-instance", original!);
  await page.screenshot({path:'artifacts/geography/closed.png',fullPage:true});
  for(const pin of await page.locator('.place-pin').all()){
    const box=(await pin.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
});

function mapsForTest() {
  return [...document.querySelectorAll(".atlas-map")].map((el: any) => {
    let f = el[Object.keys(el).find((k) => k.startsWith("__reactFiber"))!];
    while (f) {
      let h = f.memoizedState;
      while (h) {
        if (h.memoizedState?.current?.getZoom) return h.memoizedState.current;
        h = h.next;
      }
      f = f.return;
    }
    throw Error("Map unavailable");
  });
}

test("paired overlays wait for the slower renderer and retain common evidence on failure", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 960 });
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/map?"))
      requests.push(new URL(r.url()).searchParams.get("indicator")!);
  });
  await page.goto("/?geography=1");
  await expect(page.locator(".atlas-map")).toHaveAttribute(
    "data-metric",
    "pm",
    { timeout: 30000 },
  );
  for (const city of ["Oakland", "Fresno"]) {
    await page.getByLabel("Search a California address").focus();
    await page.getByRole("button", { name: city, exact: true }).click();
    await page.getByRole("button", { name: /Confirm this address/ }).click();
  }
  await page
    .getByRole("button", { name: "Compare geography", exact: true })
    .click();
  for (const map of await page.locator(".atlas-map").all())
    await expect(map).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  await page.evaluate(`window.testMaps=(${mapsForTest.toString()})()`);
  const visibleFrames = () =>
    (window as any).testMaps.map((m: any) =>
      [0, 1]
        .filter((i) => m.getPaintProperty("fill" + i, "fill-opacity") > 0)
        .map((i) => m.getFilter("fill" + i)),
    );
  const beforeFrames = await page.evaluate(visibleFrames);
  // Deliberate renderer-delay fixture, not a claim about live source readiness.
  await page.evaluate(() => {
    const w = window as any,
      m = w.testMaps[1];
    w.originalLoaded = m.isSourceLoaded.bind(m);
    m.isSourceLoaded = (id: string) =>
      id.startsWith("tracts") ? false : w.originalLoaded(id);
  });
  await page.getByLabel("Comparison measure").selectOption("ozone");
  await page.waitForTimeout(1000);
  await expect(page.locator(".map-key")).toContainText(
    "Fine particulate matter",
  );
  await expect(page.locator(".geography-place").first()).toContainText(
    "Fine particulate matter",
  );
  expect(await page.evaluate(visibleFrames)).toEqual(beforeFrames);
  await page.evaluate(() => {
    const w = window as any;
    w.testMaps[1].isSourceLoaded = w.originalLoaded;
    w.testMaps[1].triggerRepaint();
  });
  for (const map of await page.locator(".atlas-map").all())
    await expect(map).toHaveAttribute("data-metric", "ozone", {
      timeout: 30000,
    });
  expect(requests.filter((x) => x === "ozone")).toHaveLength(1);
  await page.route("**/api/map?**", (r) =>
    new URL(r.request().url()).searchParams.get("indicator") === "diesel"
      ? r.fulfill({
          status: 503,
          json: { error: "Deliberate source-failure fixture" },
        })
      : r.continue(),
  );
  await page.getByLabel("Comparison measure").selectOption("diesel");
  await expect(page.locator(".map-error").first()).toContainText(
    "Tract layer unavailable",
  );
  await expect(page.locator(".map-key")).toContainText("Ozone");
  await expect(page.locator(".geography-place").first()).toContainText("Ozone");
  await page.getByLabel("Comparison measure").selectOption("pm");
  for (const map of await page.locator(".atlas-map").all())
    await expect(map).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  expect(requests.filter((x) => x === "pm")).toHaveLength(1);
});

test('each linked facility marker opens its own inventory detail without recentering either place',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:960});await page.goto('/?geography=1');
 for(const city of ['Oakland','Fresno']){await page.getByLabel('Search a California address').focus();await page.getByRole('button',{name:city,exact:true}).click();await page.getByRole('button',{name:/Confirm this address/}).click();}
 await page.getByRole('button',{name:'Compare geography',exact:true}).click();await page.getByRole('button',{name:'Infrastructure',exact:true}).click();
 const maps=page.locator('.atlas-map');
 for(const index of [1,0]){
  const map=maps.nth(index);await expect(map).toHaveAttribute('data-facility-hit',/"id"/,{timeout:30000});
  const centers=await maps.evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.center));
  const hit=JSON.parse((await map.getAttribute('data-facility-hit'))!),box=(await map.boundingBox())!;
  await page.mouse.click(box.x+hit.x,box.y+hit.y);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(/source|Source/);
  await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  expect(await maps.evaluateAll(es=>es.map(e=>(e as HTMLElement).dataset.center))).toEqual(centers);
 }
});
