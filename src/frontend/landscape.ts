// Analytical scale only: 0–100 source percentile maps linearly to 0–900 metres.
// These are display heights, never physical measurements.
export const METRES_PER_PERCENTILE = 9;
export const landscapeHeight = (percentile: number | null) => percentile === null ? null : percentile * METRES_PER_PERCENTILE;
