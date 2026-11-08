import type { StyleSpecification } from "maplibre-gl";
export const ramps: Record<string, string[]> = {
  Environment: [
    "#fff3bd",
    "#b8e0a5",
    "#58bca9",
    "#3487ad",
    "#4450a0",
    "#391956",
  ],
  Health: ["#fff0c2", "#f4c88a", "#e99578", "#ce617c", "#923e79", "#50235f"],
  Community: ["#edf8b1", "#b8dfb5", "#6cc4b6", "#359fae", "#326d9c", "#25365e"],
  Infrastructure: [
    "#eeedf8",
    "#d3cdec",
    "#b4a9df",
    "#9581cb",
    "#775bb5",
    "#553c91",
  ],
};
export const palette = ramps.Environment;
export const placeColors = [
  "#5759bb",
  "#b34e3f",
  "#237f79",
  "#947025",
  "#94518f",
  "#407b9e",
];
// Revise this key when the style changes: open maps must reload static style fixes.
export const vectorStyle = "/ui/clearsky-city.json?v=1";
export const rasterStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "base",
      type: "raster",
      source: "osm",
      paint: { "raster-saturation": -0.8, "raster-opacity": 0.65 },
    },
  ],
};
