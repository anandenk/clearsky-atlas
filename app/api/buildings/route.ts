import { NextRequest, NextResponse } from "next/server";
import { parseBounds } from "../../../src/contracts/bounds";
import { buildingData, BuildingError } from "../../../src/contracts/buildings";
export function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const bbox = parseBounds(req.nextUrl.searchParams.get("bbox"));
  if (!bbox)
    return NextResponse.json(
      { code: "invalid-bounds", error: "Invalid bounds" },
      { status: 400, headers },
    );
  try {
    return NextResponse.json(
      buildingData(bbox, req.nextUrl.searchParams.get("version"), req.signal),
      { headers },
    );
  } catch (e) {
    if (e instanceof BuildingError)
      return NextResponse.json(
        { code: e.code, error: e.message },
        { status: e.status, headers },
      );
    return NextResponse.json(
      { code: "buildings-unavailable", error: "Building request unavailable" },
      { status: 503, headers },
    );
  }
}
