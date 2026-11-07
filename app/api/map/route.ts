import { NextRequest, NextResponse } from "next/server";
import { parseBounds } from "../../../src/contracts/bounds";
import { mapData } from "../../../src/data";
export function GET(req: NextRequest) {
  const bbox = parseBounds(req.nextUrl.searchParams.get("bbox"));
  if (!bbox)
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  return NextResponse.json(mapData(bbox), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
