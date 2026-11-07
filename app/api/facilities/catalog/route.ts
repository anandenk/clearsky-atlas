import { NextResponse } from "next/server";
import { facilityCatalog } from "../../../../src/contracts/facilities";
export function GET() {
  return NextResponse.json(facilityCatalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
