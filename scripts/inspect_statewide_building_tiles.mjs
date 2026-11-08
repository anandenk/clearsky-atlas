// Inspect pinned upstream tile fields before local extract is finalized.
import { PMTiles } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader as Pbf } from "pbf";
import fs from "node:fs/promises";
const archive = new PMTiles(
  "https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/2026-10-21.0/buildings.pmtiles",
);
const coords = (lon, lat) => [
  Math.floor(((lon + 180) / 360) * 16384),
  Math.floor(
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 16384,
  ),
];
for (const [name, lon, lat] of [
  ["rancho", -117.552, 34.127],
  ["oakland", -122.27, 37.81],
  ["san-diego", -117.16, 32.72],
  ["fresno", -119.787, 36.737],
  ["sacramento", -121.494, 38.582],
  ["eureka", -124.163, 40.802],
]) {
  const [x, y] = coords(lon, lat),
    start = performance.now();
  const tile = await archive.getZxy(14, x, y);
  if (!tile) throw Error(name + " missing");
  const vt = new VectorTile(new Pbf(new Uint8Array(tile.data))),
    layer = vt.layers.building;
  let missing = 0,
    hasParts = 0;
  const samples = [];
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    if (f.properties.height === undefined) missing++;
    if (f.properties.has_parts) hasParts++;
    if (samples.length < 2) samples.push(f.properties);
  }
  console.log(
    JSON.stringify({
      name,
      x,
      y,
      bytes: tile.data.byteLength,
      count: layer.length,
      missingHeight: missing,
      hasParts,
      partCount: vt.layers.building_part?.length ?? 0,
      ms: performance.now() - start,
      samples,
    }),
  );
}
