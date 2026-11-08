import { NextRequest, NextResponse } from "next/server";
import {
  buildingTileCatalog,
  BuildingTileError,
} from "../../../../src/contracts/building-tiles";
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      await buildingTileCatalog(req.nextUrl.searchParams.get("version")),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      {
        code: e instanceof BuildingTileError ? e.code : "data-unavailable",
        error:
          e instanceof BuildingTileError
            ? e.message
            : "Building catalog unavailable",
      },
      {
        status: e instanceof BuildingTileError ? e.status : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
