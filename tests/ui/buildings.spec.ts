import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
function inspectMap() {
  const el = document.querySelector(".atlas-map") as any;
  let fiber =
    el[Object.keys(el).find((key) => key.startsWith("__reactFiber"))!];
  while (fiber) {
    let hook = fiber.memoizedState;
    while (hook) {
      if (hook.memoizedState?.current?.getZoom)
        return hook.memoizedState.current;
      hook = hook.next;
    }
    fiber = fiber.return;
  }
  throw Error("Map instance unavailable");
}

test("statewide Overture replaces OSM, reuses tiles and honors flat/3D and failures", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [],
    requests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/api/buildings/tiles/")) requests.push(r.url());
  });
  await page.goto("/");
  const map = page.locator(".atlas-map");
  await expect(map).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  await page.getByRole("button", { name: "City", exact: true }).click();
  await page.evaluate(`window.testMap = (${inspectMap.toString()})()`);
  // The normal zoom path must not show a preliminary OSM cohort at z13,
  // or while the first Overture request is pending at z14+.
  await page.evaluate(() => (window as any).testMap.jumpTo({center:[-117.552,34.127],zoom:13}));
  await expect(page.locator('.building-status')).toContainText('Building detail starts at zoom 14');
  expect(await page.evaluate(() => (window as any).testMap.getPaintProperty('city-buildings','fill-extrusion-opacity'))).toBe(0);
  let releaseCatalog!:()=>void;
  const catalogHeld=new Promise<void>(resolve=>{releaseCatalog=resolve;});
  await page.route('**/api/buildings/catalog?**',async route=>{await catalogHeld;await route.continue();});
  await page.evaluate(() => {
    (window as any).testMap.jumpTo({
      center: [-117.552, 34.127],
      zoom: 15.6,
      pitch: 58,
      bearing: 0,
    });
  });
  await expect(page.locator('.building-status')).toContainText('Loading Overture buildings + parts');
  expect(await page.evaluate(() => (window as any).testMap.getPaintProperty('city-buildings','fill-extrusion-opacity'))).toBe(0);
  releaseCatalog();
  await expect(page.locator(".building-status")).toContainText(
    "Overture · statewide buildings + parts",
    { timeout: 45000 },
  );
  const sample = await page.evaluate(async () => {
    const m = (window as any).testMap;
    const features = m.querySourceFeatures("overture-buildings", {
      sourceLayer: "building",
    });
    return {
      loaded: features.length,
      unknown: features.filter((f: any) => f.properties.height == null).length,
      rendered: m.queryRenderedFeatures({ layers: ["overture-buildings-3d"] })
        .length,
      oldOpacity: m.getPaintProperty(
        "city-buildings",
        "fill-extrusion-opacity",
      ),
      newOpacity: m.getPaintProperty(
        "overture-buildings-3d",
        "fill-extrusion-opacity",
      ),
      frame: document.querySelector(".atlas-map")?.getAttribute("data-metric"),
      tileResources: performance.getEntriesByType("resource").filter(e=>e.name.includes("/api/buildings/tiles/")).map(e=>{const r=e as PerformanceResourceTiming;return {decodedBytes:r.decodedBodySize,transferBytes:r.transferSize,durationMs:r.duration};}),
    };
  });
  expect(sample.loaded).toBeGreaterThan(1000);
  expect(sample.rendered).toBeGreaterThan(500);
  expect(sample.unknown).toBeGreaterThan(0);
  expect(sample.oldOpacity).toBe(0);
  expect(sample.newOpacity).toBeGreaterThan(0);
  expect(sample.frame).toBe("pm");
  mkdirSync("artifacts/building-coverage", {recursive:true});
  writeFileSync(
    "artifacts/building-coverage/frontend-counts.json",
    JSON.stringify({ ...sample, requests: requests.length }, null, 2),
  );
  await test
    .info()
    .attach("building-render-counts", {
      body: JSON.stringify({ ...sample, requests: requests.length }),
      contentType: "application/json",
    });
  await page.screenshot({
    path: "artifacts/building-coverage/rancho-overture.png",
  });
  expect(requests.every((url) => url.includes("/tiles/14/"))).toBe(true);
  expect(requests.length).toBeLessThan(25);
  // Reproduce a held mouse drag: ready Overture must remain the only visible
  // building source throughout movement and after release, even across tiles.
  await page.mouse.move(1000, 450);
  await page.mouse.down();
  await page.mouse.move(850, 480, {steps:8});
  const duringDrag = await page.evaluate(() => {
    const m = (window as any).testMap;
    return {moving:m.isMoving(), osm:m.getPaintProperty("city-buildings", "fill-extrusion-opacity"),
      overture:m.getPaintProperty("overture-buildings-3d", "fill-extrusion-opacity"),
      parts:m.getPaintProperty("overture-building-parts-3d", "fill-extrusion-opacity")};
  });
  expect(duringDrag).toEqual({moving:true, osm:0, overture:.7, parts:.7});
  await expect(page.locator(".building-status")).toContainText("Overture · statewide buildings + parts");
  await page.mouse.up();
  await page.waitForFunction(() => !(window as any).testMap.isMoving());
  await expect(page.locator(".building-status")).toContainText("Overture · statewide buildings + parts");
  await page.evaluate(() => (window as any).testMap.jumpTo({zoom:13}));
  await expect(page.locator(".building-status")).toContainText("Building detail starts at zoom 14");
  expect(await page.evaluate(() => (window as any).testMap.getPaintProperty("city-buildings", "fill-extrusion-opacity"))).toBe(0);
  await page.evaluate(() => (window as any).testMap.jumpTo({center:[-117.552,34.127],zoom:15.6}));
  await expect(page.locator(".building-status")).toContainText("Overture · statewide buildings + parts");
  const count = requests.length;
  await page
    .getByRole("button", { name: "Data Landscape", exact: true })
    .click();
  await page.getByRole("button", { name: "Flat", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).testMap.getPaintProperty(
          "overture-buildings-3d",
          "fill-extrusion-opacity",
        ),
      ),
    )
    .toBe(0);
  await page.getByRole("button", { name: "City", exact: true }).click();
  await page.evaluate(() => {
    (window as any).testMap.jumpTo({
      center: [-117.552, 34.127],
      zoom: 15.6,
      pitch: 58,
      bearing: 0,
    });
  });
  await expect(page.locator(".building-status")).toContainText(
    "Overture · statewide buildings + parts",
  );
  expect(new Set(requests).size).toBe(new Set(requests.slice(0,count)).size);
  await page.route("**/api/buildings/tiles/**", (r) =>
    r.fulfill({
      status: 503,
      json: { code: "buildings-unavailable", error: "Test source failure" },
    }),
  );
  await page.evaluate(() => {
    (window as any).testMap.jumpTo({
      center: [-122.27, 37.81],
      zoom: 15.6,
      pitch: 58,
    });
  });
  await expect(page.locator(".building-status")).toContainText(
    "Overture unavailable",
  );
  expect(
    await page.evaluate(() =>
      (window as any).testMap.getPaintProperty(
        "city-buildings",
        "fill-extrusion-opacity",
      ),
    ),
  ).toBeGreaterThan(0);
  await page.unroute("**/api/buildings/tiles/**");
  await page.evaluate(() => {
    (window as any).testMap.jumpTo({
      center: [-119.786, 36.738],
      zoom: 15.6,
      pitch: 58,
    });
  });
  await expect(page.locator(".building-status")).toContainText(
    "Overture · statewide buildings + parts",
    { timeout: 45000 },
  );
  await page.screenshot({
    path: "artifacts/building-coverage/fresno-statewide.png",
  });
  await page.evaluate(() => {
    (window as any).testMap.jumpTo({
      center: [-110, 36],
      zoom: 15.6,
      pitch: 58,
    });
  });
  await expect(page.locator(".building-status")).toContainText(
    "beyond the Overture California envelope",
  );
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

test("linked Oakland and Fresno maps load statewide buildings and parts independently", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/?geography=1");
  for (const name of ["Oakland", "Fresno"]) {
    await page.getByLabel("Search a California address").focus();
    await page.getByRole("button", { name, exact: true }).click();
    await page.getByRole("button", { name: /Confirm this address/ }).click();
  }
  await page
    .getByRole("button", { name: "Compare geography", exact: true })
    .click();
  const maps = page.locator(".atlas-map");
  await expect(maps).toHaveCount(2);
  for (const m of await maps.all())
    await expect(m).toHaveAttribute("data-metric", "pm", { timeout: 30000 });
  await page.evaluate(`window.testMaps = (${mapsForTest.toString()})()`);
  await page.evaluate(() => {
    (window as any).testMaps[0].jumpTo({ zoom: 15.6, pitch: 50 });
  });
  await expect(page.locator(".building-status")).toContainText(
    "Both views: Overture · statewide buildings + parts",
    { timeout: 45000 },
  );
  await expect(page.locator(".building-status")).toContainText(
    "Both views: Overture · statewide buildings + parts",
  );
  expect(
    await page.evaluate(() =>
      (window as any).testMaps.map((m: any) =>
        m.getPaintProperty("overture-buildings-3d", "fill-extrusion-opacity"),
      ),
    ),
  ).toEqual([0.7, 0.7]);
  await page.screenshot({
    path: "artifacts/building-coverage/linked-statewide.png",
  });
  const counts = await page.evaluate(() =>
    (window as any).testMaps.map((m: any) => ({
      buildings: m.queryRenderedFeatures({ layers: ["overture-buildings-3d"] })
        .length,
      parts: m.queryRenderedFeatures({ layers: ["overture-building-parts-3d"] })
        .length,
      parents: m
        .queryRenderedFeatures({ layers: ["overture-buildings-3d"] })
        .filter((f: any) => f.properties.has_parts === true).length,
    })),
  );
  expect(counts.every((c: any) => c.buildings > 100 && c.parents === 0)).toBe(
    true,
  );
  expect(counts[0].parts).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Data Landscape", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).testMaps.map((m: any) =>
          m.getPaintProperty("overture-buildings-3d", "fill-extrusion-opacity"),
        ),
      ),
    )
    .toEqual([0, 0]);
});

test("Overture reveal uses native opacity fade without rewriting building geometry", async ({page}) => {
  test.setTimeout(60000);
  await page.setViewportSize({width:1440,height:960});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto('/?geography=1');
  await expect(page.locator('.atlas-map')).toHaveAttribute('data-metric','pm',{timeout:30000});
  await page.getByRole('button',{name:'City',exact:true}).click();
  await page.evaluate(`window.testMap = (${inspectMap.toString()})()`);
  await page.evaluate(() => (window as any).testMap.jumpTo({center:[-117.552,34.127],zoom:15.6,pitch:58}));
  await expect(page.locator('.building-status')).toContainText('Overture · statewide buildings + parts',{timeout:45000});
  expect(await page.evaluate(() => (window as any).testMap.getPaintProperty('overture-buildings-3d','fill-extrusion-opacity-transition').duration)).toBe(0);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.evaluate(() => {
    const w=window as any,m=w.testMap;
    w.revealSamples=[];w.buildingHeightWrites=0;
    const set=m.setPaintProperty;
    m.setPaintProperty=function(...args:any[]){
      if(args[0].startsWith('overture-') && ['fill-extrusion-height','fill-extrusion-base'].includes(args[1]))w.buildingHeightWrites++;
      return set.apply(this,args);
    };
    m.on('render',()=>{
      const opacity=m.style.getLayer('overture-buildings-3d').paint.get('fill-extrusion-opacity');
      w.revealSamples.push({opacity,target:m.getPaintProperty('overture-buildings-3d','fill-extrusion-opacity'),parts:m.style.getLayer('overture-building-parts-3d').paint.get('fill-extrusion-opacity'),osm:m.style.getLayer('city-buildings').paint.get('fill-extrusion-opacity')});
    });
    m.jumpTo({zoom:13});
  });
  await expect(page.locator('.building-status')).toContainText('Building detail starts at zoom 14');
  await page.evaluate(() => {
    const w=window as any;
    // Exercise the same concurrent opacity updates as the real Auto→City
    // arrival. The first regression only covered a settled, constant target.
    const el=document.querySelector('.atlas-map') as any;
    let fiber=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))!],controller:any;
    while(fiber){let hook=fiber.memoizedState;while(hook){
      if(hook.memoizedState?.current?.setEnabled && hook.memoizedState.current.setOpacity)controller=hook.memoizedState.current;
      hook=hook.next;
    }fiber=fiber.return;}
    if(!controller)throw Error('Building controller unavailable');
    const start=performance.now();
    const timer=setInterval(()=>{
      const t=Math.min(1,(performance.now()-start)/1200);
      controller.setOpacity(.3+.4*t);
      if(t===1)clearInterval(timer);
    },16);
    w.testMap.jumpTo({zoom:15.6});
  });
  await expect.poll(() => page.evaluate(() => (window as any).revealSamples.some((s:any)=>s.opacity>0 && s.opacity<.7))).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).revealSamples.at(-1)?.opacity)).toBe(.7);
  const result=await page.evaluate(() => ({samples:(window as any).revealSamples, writes:(window as any).buildingHeightWrites}));
  expect(result.writes).toBe(0);
  expect(result.samples.some((s:any)=>s.opacity>0 && s.target>.25 && s.opacity<s.target*.5)).toBe(true);
  expect(result.samples.filter((s:any)=>s.opacity>0).every((s:any)=>s.osm===0 && Math.abs(s.parts-s.opacity)<.001)).toBe(true);
  await test.info().attach('native-building-fade',{body:JSON.stringify(result),contentType:'application/json'});
});
