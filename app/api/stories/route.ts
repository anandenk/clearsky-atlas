import { NextResponse } from "next/server";
import { storyCatalog } from "../../../src/contracts/stories";
export function GET() {
  return NextResponse.json(storyCatalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
