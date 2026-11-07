import type { StyleSpecification } from "maplibre-gl";
export const palette = [
  "#eee8cf",
  "#d4d8ac",
  "#a1b994",
  "#659c84",
  "#397b72",
  "#205b5c",
];
export const vectorStyle = "https://tiles.openfreemap.org/styles/positron";
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
      paint: { "raster-saturation": -1, "raster-opacity": 0.55 },
    },
  ],
};
