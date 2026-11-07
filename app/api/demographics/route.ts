import { NextResponse } from "next/server";
import { demographicCatalog } from "../../../src/contracts/demographics";
export function GET() {
  return NextResponse.json(demographicCatalog(), {
    headers: { "Cache-Control": "no-store" },
  });
}
