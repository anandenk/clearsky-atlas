import { NextRequest, NextResponse } from "next/server";
import { selection } from "../../../src/data";
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (
      typeof address !== "string" ||
      address.length < 6 ||
      address.length > 240
    )
      return NextResponse.json(
        { error: "Enter a street number, street, and California city or ZIP." },
        { status: 400 },
      );
    const params = new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      vintage: "Census2020_Current",
      format: "json",
    });
    const r = await fetch(
      "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?" +
        params,
      { signal: AbortSignal.timeout(20000), cache: "no-store" },
    );
    if (!r.ok)
      throw new Error(
        "Census geocoding is unavailable. Try the verified example addresses.",
      );
    const body = await r.json();
    const matches = body.result?.addressMatches ?? [];
    if (!matches.length)
      return NextResponse.json(
        {
          error:
            "No Census address match. Include a street number and California city or ZIP.",
        },
        { status: 404 },
      );
    const candidates = matches.map((m: any) => {
      if (m.addressComponents.state !== "CA")
        return { error: "This address is outside California." };
      try {
        return selection(
          m.matchedAddress,
          [m.coordinates.x, m.coordinates.y],
          false,
          m.geographies?.["Census Tracts"]?.[0]?.GEOID,
        );
      } catch (e) {
        return { error: (e as Error).message };
      }
    });
    return NextResponse.json({ candidates });
  } catch {
    return NextResponse.json(
      {
        error:
          "Address lookup is unavailable or timed out. Try again, or use the cached example addresses.",
      },
      { status: 503 },
    );
  }
}
