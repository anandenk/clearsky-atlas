import { NextRequest, NextResponse } from "next/server";
import { mapData } from "../../../src/data";
export function GET(req: NextRequest) {
  const bbox = (req.nextUrl.searchParams.get("bbox") ?? "")
    .split(",")
    .map(Number);
  if (
    bbox.length !== 4 ||
    bbox.some((x) => !Number.isFinite(x)) ||
    bbox[0] >= bbox[2] ||
    bbox[1] >= bbox[3]
  )
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  return NextResponse.json(mapData(bbox), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
