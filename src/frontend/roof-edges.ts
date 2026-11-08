import {
  MercatorCoordinate,
  type Map as AtlasMap,
  type GeoJSONSource,
  type ExpressionSpecification,
} from "maplibre-gl";

// A narrow native extrusion ribbon shares the plateau's base/height expression.
// This is a selection highlight on display geometry, not another measurement.
function ribbonHeight(
  height: number | ExpressionSpecification,
): number | ExpressionSpecification {
  if (typeof height === "number") return height + 0.5;
  // Keep zoom at the top-level composite expression, as required by the style.
  const result: unknown[] = height.slice(0, 3);
  for (let i = 3; i < height.length; i += 2)
    result.push(height[i], ["+", height[i + 1], 0.5]);
  return result as ExpressionSpecification;
}

function ribbons(
  feature: GeoJSON.Feature,
  zoom: number,
  inspected: boolean,
  token: number,
): GeoJSON.Feature[] {
  const percentile = feature.properties?.percentile;
  if (typeof percentile !== "number" || !Number.isFinite(percentile)) return [];
  const geometry = feature.geometry;
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  // Three screen pixels wide before perspective. Rebuild only on settled zoom,
  // selection or data-frame changes; never rewrite geometry on animation frames.
  const halfWidth = 1.5 / (512 * 2 ** zoom);
  const result: GeoJSON.Feature[] = [];
  for (const polygon of polygons)
    for (const ring of polygon)
      for (let i = 1; i < ring.length; i++) {
        const a = MercatorCoordinate.fromLngLat([
          ring[i - 1][0],
          ring[i - 1][1],
        ]);
        const b = MercatorCoordinate.fromLngLat([ring[i][0], ring[i][1]]);
        const dx = b.x - a.x,
          dy = b.y - a.y,
          length = Math.hypot(dx, dy);
        if (!length) continue;
        const nx = (-dy / length) * halfWidth,
          ny = (dx / length) * halfWidth;
        const capX = (dx / length) * halfWidth,
          capY = (dy / length) * halfWidth;
        const corners = [
          [a.x - capX + nx, a.y - capY + ny],
          [b.x + capX + nx, b.y + capY + ny],
          [b.x + capX - nx, b.y + capY - ny],
          [a.x - capX - nx, a.y - capY - ny],
        ];
        const coordinates = corners.map(([x, y]) =>
          new MercatorCoordinate(x, y).toLngLat().toArray(),
        );
        coordinates.push(coordinates[0]);
        result.push({
          type: "Feature",
          properties: {
            id: feature.properties?.id,
            percentile,
            inspected,
            token,
          },
          geometry: { type: "Polygon", coordinates: [coordinates] },
        });
      }
  return result;
}

export function installRoofEdges(m: AtlasMap, activeSlot: () => number) {
  const source = "tract-roof-edges",
    layer = "tract-roof-highlight";
  m.addSource(source, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    tolerance: 0,
  });
  m.addLayer(
    {
      id: layer,
      type: "fill-extrusion",
      source,
      filter: ["==", ["get", "token"], -1],
      paint: {
        "fill-extrusion-color": [
          "case",
          ["get", "inspected"],
          "#ffdd99",
          "#b9f3df",
        ],
        "fill-extrusion-base": 0,
        "fill-extrusion-height": 0.5,
        "fill-extrusion-opacity": 0,
        "fill-extrusion-vertical-gradient": false,
        "fill-extrusion-height-transition": { duration: 0 },
        "fill-extrusion-base-transition": { duration: 0 },
        "fill-extrusion-opacity-transition": { duration: 0 },
      },
    },
    m.getStyle().layers.find((l) => l.type === "symbol")?.id,
  );
  const frames: { revision: number; features: Map<string, GeoJSON.Feature> }[] =
    [
      { revision: 0, features: new Map() },
      { revision: 0, features: new Map() },
    ];
  let ids: string[] = [],
    inspected = "",
    selectionRevision = 0,
    widthRevision = 0,
    widthZoom = m.getZoom(),
    token = 0;
  let lastGeometry = "",
    lastHeight = "",
    lastOpacity = -1,
    disposed = false;
  const sync = () => {
    if (disposed || !m.getLayer(layer)) return;
    const index = activeSlot(),
      landscape = "landscape" + index;
    if (!m.getLayer(landscape)) return;
    const amount =
      Number(m.getPaintProperty(landscape, "fill-extrusion-opacity")) || 0;
    const opacity = Math.min(1, amount / 0.85);
    if (opacity !== lastOpacity) {
      m.setPaintProperty(layer, "fill-extrusion-opacity", opacity);
      lastOpacity = opacity;
    }
    if (!opacity) return;
    const frame = frames[index],
      geometryKey = `${index}/${frame.revision}/${selectionRevision}/${widthRevision}`;
    if (geometryKey !== lastGeometry) {
      lastGeometry = geometryKey;
      const current = ++token,
        features: GeoJSON.Feature[] = [];
      for (const id of new Set([...ids, inspected])) {
        const feature = frame.features.get(id);
        if (feature)
          features.push(
            ...ribbons(feature, widthZoom, id === inspected, current),
          );
      }
      // A reused worker source retains old tiles while new strips are built.
      // Filter before setData so old measure/selection rims never leak through.
      m.setFilter(layer, ["==", ["get", "token"], current]);
      void (m.getSource(source) as GeoJSONSource)
        .setData({ type: "FeatureCollection", features })
        .catch(() => {
          /* Map source errors are reported by the existing map notice. */
        });
    }
    const height = m.getPaintProperty(landscape, "fill-extrusion-height") as
      number | ExpressionSpecification;
    const heightKey = JSON.stringify(height);
    if (heightKey !== lastHeight) {
      lastHeight = heightKey;
      m.setPaintProperty(layer, "fill-extrusion-base", height);
      m.setPaintProperty(layer, "fill-extrusion-height", ribbonHeight(height));
    }
  };
  const settled = () => {
    const zoom = m.getZoom();
    if (Math.abs(zoom - widthZoom) < 0.01) return;
    widthZoom = zoom;
    widthRevision++;
    sync();
  };
  m.on("render", sync);
  m.on("zoomend", settled);
  return {
    stage(index: number, data: GeoJSON.FeatureCollection) {
      frames[index] = {
        revision: frames[index].revision + 1,
        features: new Map(
          data.features.map((f) => [String(f.properties?.id), f]),
        ),
      };
    },
    select(next: string[]) {
      ids = next;
      selectionRevision++;
      sync();
    },
    inspect(id: string) {
      inspected = id;
      selectionRevision++;
      sync();
    },
    dispose() {
      disposed = true;
      m.off("render", sync);
      m.off("zoomend", settled);
      if (m.getLayer(layer)) m.removeLayer(layer);
      if (m.getSource(source)) m.removeSource(source);
    },
  };
}
