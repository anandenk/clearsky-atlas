// Isolated technical MapLibre harness; never edits or loads the frontend application.
import fs from "node:fs/promises";
import http from "node:http";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const origin = process.env.ATLAS_ORIGIN ?? "http://127.0.0.1:3000";
const datasets = await Promise.all(
  ["standard", "overview"].map(async (detail) => {
    const response = await fetch(
      origin + "/api/map?bbox=-125,32,-114,43&indicator=pm&detail=" + detail,
    );
    assert.equal(response.status, 200);
    return response.json();
  }),
);
const files = {
  "/lib.mjs": "node_modules/maplibre-gl/dist/maplibre-gl.mjs",
  "/maplibre-gl-shared.mjs":
    "node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs",
  "/worker.mjs": "public/maplibre/maplibre-gl-worker.mjs",
  "/map.css": "node_modules/maplibre-gl/dist/maplibre-gl.css",
};
const server = http.createServer(async (req, res) => {
  try {
    if (files[req.url]) {
      res.setHeader(
        "Content-Type",
        req.url.endsWith(".css") ? "text/css" : "application/javascript",
      );
      res.end(await fs.readFile(files[req.url]));
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><link rel="stylesheet" href="/map.css"><style>body{margin:0;background:#f7f5ed;font:16px system-ui}main{display:flex;gap:8px}section{width:calc(50% - 4px)}h1{font-size:18px;margin:12px} .map{height:800px;width:100%}</style><script type="module">import * as lib from "/lib.mjs";window.maplibregl=lib;</script><main><section><h1>Standard · 30 m display</h1><div id="standard" class="map"></div></section><section><h1>Overview · shared-edge simplification</h1><div id="overview" class="map"></div></section></main>',
    );
  } catch {
    res.statusCode = 500;
    res.end("Harness file unavailable");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 860 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !!window.maplibregl);
  await page.evaluate(async (data) => {
    maplibregl.setWorkerUrl("/worker.mjs");
    window.maps = [];
    await Promise.all(
      ["standard", "overview"].map(
        (id, index) =>
          new Promise((resolve) => {
            const map = new maplibregl.Map({
              container: id,
              style: {
                version: 8,
                sources: {},
                layers: [
                  {
                    id: "ocean",
                    type: "background",
                    paint: { "background-color": "#c9e3ed" },
                  },
                ],
              },
              bounds: [
                [-125, 32],
                [-114, 43],
              ],
              fitBoundsOptions: { padding: 12 },
              interactive: false,
              attributionControl: false,
            });
            window.maps.push(map);
            map.on("load", () => {
              map.addSource("tracts", {
                type: "geojson",
                data: data[index],
                promoteId: "id",
                tolerance: 0,
              });
              map.addLayer({
                id: "values",
                type: "fill",
                source: "tracts",
                paint: {
                  "fill-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "percentile"],
                    0,
                    "#faf6e9",
                    100,
                    "#52296f",
                  ],
                  "fill-opacity": 1,
                },
              });
              map.once("idle", resolve);
            });
          }),
      ),
    );
  }, datasets);
  const stats = await page.evaluate(() =>
    window.maps.map((m) => ({
      renderedIds: new Set(
        m
          .queryRenderedFeatures({ layers: ["values"] })
          .map((f) => f.properties.id),
      ).size,
      width: m.getCanvas().clientWidth,
      height: m.getCanvas().clientHeight,
    })),
  );
  console.log(JSON.stringify(stats));
  await fs.mkdir("artifacts/map-overview", { recursive: true });
  await page.screenshot({
    path: "artifacts/map-overview/statewide.png",
    fullPage: true,
  });
  for (const result of stats) {
    assert.ok(result.renderedIds > 8500);
    assert.ok(result.width > 600 && result.height === 800);
  }
  assert.deepEqual(errors, []);
  await fs.mkdir("artifacts/map-overview", { recursive: true });
  await page.screenshot({
    path: "artifacts/map-overview/statewide.png",
    fullPage: true,
  });
  await fs.writeFile(
    "artifacts/map-overview/render-check.json",
    JSON.stringify(
      {
        origin,
        stats,
        uncaughtErrors: errors,
        scope:
          "Isolated headless MapLibre render of backend PM payloads, no frontend integration/basemap/device performance certification.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(stats));
  await page.evaluate(() => window.maps.forEach((m) => m.remove()));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
