// Analytical scale only: 0–100 source percentile maps linearly to 0–900 metres.
// These are display heights, never physical measurements.
export const METRES_PER_PERCENTILE = 9;
export const landscapeHeight = (percentile: number | null) => percentile === null ? null : percentile * METRES_PER_PERCENTILE;

// Same zoom-dependent multiplier for every visible tract. Cap distant exaggeration.
export const metresPerPercentileAtZoom = (zoom: number) => {
  const distance = Math.max(0, Math.min(6, 10 - zoom));
  // Four times the previous relief at regional/statewide zooms, tapering
  // continuously back to the original neighborhood scale by zoom 10.
  const prominence = 1 + 3 * Math.min(1, distance / 3);
  return METRES_PER_PERCENTILE * 2 ** distance * prominence;
};
