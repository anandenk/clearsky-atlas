import { NextRequest, NextResponse } from "next/server";
import {
  buildingVectorTile,
  BuildingTileError,
} from "../../../../../../../src/contracts/building-tiles";
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const p = await ctx.params;
  if (![p.z, p.x, p.y].every((v) => /^\d{1,5}$/.test(v)))
    return NextResponse.json(
      { code: "invalid-tile", error: "Invalid tile coordinates" },
      { status: 400 },
    );
  try {
    const data = await buildingVectorTile(
      Number(p.z),
      Number(p.x),
      Number(p.y),
      req.nextUrl.searchParams.get("version"),
      req.signal,
    );
    return new Response(data ?? null, {
      status: data ? 200 : 204,
      headers: {
        "Content-Type": "application/vnd.mapbox-vector-tile",
        "Cache-Control": "public, max-age=86400",
        "X-Atlas-Dataset": "2026-10-21.0",
        "X-Atlas-Coverage": "statewide-california",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        code: e instanceof BuildingTileError ? e.code : "buildings-unavailable",
        error:
          e instanceof BuildingTileError
            ? e.message
            : "Building tile request unavailable",
      },
      {
        status: e instanceof BuildingTileError ? e.status : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
