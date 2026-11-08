import {
  GEOCODE_REQUEST_LIMIT,
  GEOCODE_TIMEOUT_MS,
  type AddressPlan,
} from "./address-input";

export const CENSUS_ADDRESS_ENDPOINT =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
export const CENSUS_BENCHMARK = "Public_AR_Current";
export const CENSUS_VINTAGE = "Census2020_Current";

type CensusMatch = {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  addressComponents: { state: string; fromAddress: string; toAddress: string };
  tigerLine: { tigerLineId: string };
  geographies?: { "Census Tracts"?: { GEOID: string }[] };
};

/** Require a source street-range match; never treat a ZIP/city point as an address. */
export function isCensusStreetMatch(value: unknown): value is CensusMatch {
  if (!value || typeof value !== "object") return false;
  const m = value as CensusMatch;
  return (
    typeof m.matchedAddress === "string" &&
    m.matchedAddress.length > 0 &&
    Number.isFinite(m.coordinates?.x) &&
    Number.isFinite(m.coordinates?.y) &&
    Math.abs(m.coordinates.x) <= 180 &&
    Math.abs(m.coordinates.y) <= 90 &&
    typeof m.addressComponents?.state === "string" &&
    typeof m.addressComponents.fromAddress === "string" &&
    /\d/.test(m.addressComponents.fromAddress) &&
    typeof m.addressComponents.toAddress === "string" &&
    /\d/.test(m.addressComponents.toAddress) &&
    typeof m.tigerLine?.tigerLineId === "string" &&
    m.tigerLine.tigerLineId.length > 0
  );
}

export async function resolveCensusAddress(
  plan: AddressPlan,
  callerSignal: AbortSignal,
  fetcher: typeof fetch = fetch,
) {
  // One deadline for the entire resolution, rather than 20 seconds per variant.
  const signal = AbortSignal.any([
    callerSignal,
    AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
  ]);
  let requests = 0;
  let used = plan.queries[0];
  for (const query of plan.queries.slice(0, GEOCODE_REQUEST_LIMIT)) {
    signal.throwIfAborted();
    used = query;
    const params = new URLSearchParams({
      address: query.address,
      benchmark: CENSUS_BENCHMARK,
      vintage: CENSUS_VINTAGE,
      format: "json",
    });
    requests++;
    const response = await fetcher(CENSUS_ADDRESS_ENDPOINT + "?" + params, {
      signal,
      cache: "no-store",
      redirect: "error",
    });
    // Do not fan out or retry a source outage/rate limit/invalid response.
    if (!response.ok) throw new Error("Census geocoding unavailable");
    const body = await response.json();
    signal.throwIfAborted();
    const matches: unknown = body?.result?.addressMatches;
    if (!Array.isArray(matches)) throw new Error("Invalid Census response");
    if (matches.length)
      return { matches: matches as unknown[], query: used, requests };
  }
  return { matches: [] as unknown[], query: used, requests };
}
