import fs from "node:fs";
fs.mkdirSync("public/maplibre", { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"])
  fs.copyFileSync(
    "node_modules/maplibre-gl/dist/" + file,
    "public/maplibre/" + file,
  );
fs.copyFileSync(
  "node_modules/maplibre-gl/LICENSE.txt",
  "public/maplibre/LICENSE.txt",
);
