import type { ExpressionSpecification } from "maplibre-gl";
// Analytical scale only: 0–100 source percentile maps linearly to 0–900 metres.
// These are display heights, never physical measurements.
export const METRES_PER_PERCENTILE = 9;
export const landscapeHeight = (percentile: number | null) => percentile === null ? null : percentile * METRES_PER_PERCENTILE;

// Same zoom-dependent multiplier for every visible tract. Cap distant exaggeration.
const anchorScale = (zoom: number) => {
  const distance = Math.max(0, Math.min(6, 10 - zoom));
  // Four times the previous relief at regional/statewide zooms, tapering
  // continuously back to the original neighborhood scale by zoom 10.
  const prominence = 1 + 3 * Math.min(1, distance / 3);
  return METRES_PER_PERCENTILE * 2 ** distance * prominence;
};

// The renderer interpolates composite expressions between integer tile zooms.
// Match that interpolation in the legend; all original integer-zoom heights stay exact.
export const metresPerPercentileAtZoom = (zoom: number) => {
  const low = Math.floor(zoom), fraction = zoom - low;
  const t = (1 - 0.5 ** fraction) / 0.5;
  return anchorScale(low) + (anchorScale(low + 1) - anchorScale(low)) * t;
};
export const landscapeHeightExpression = (growth: number): ExpressionSpecification => [
  "interpolate", ["exponential", 0.5], ["zoom"],
  ...Array.from({length: 8}, (_, i) => {
    const zoom = i + 3;
    return [zoom, ["*", ["coalesce", ["get", "percentile"], 0], anchorScale(zoom) * growth]];
  }).flat(),
] as ExpressionSpecification;
