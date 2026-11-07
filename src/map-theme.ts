import type { StyleSpecification } from "maplibre-gl";
export const ramps: Record<string, string[]> = {
  Environment: [
    "#eeedf8",
    "#d3cdec",
    "#b4a9df",
    "#9581cb",
    "#775bb5",
    "#553c91",
  ],
  Health: ["#f5eaf0", "#eacddc", "#d8a6c2", "#bd7da5", "#9d5488", "#753164"],
  Community: ["#e5edf4", "#c5dce7", "#9abed4", "#70a0be", "#467fa5", "#285d86"],
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
export const vectorStyle = "/ui/basemap.json";
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
