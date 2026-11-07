import { NextResponse } from "next/server";
import { catalog } from "../../../src/contracts/indicators";
export function GET() {
  return NextResponse.json(catalog(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Atlas-Contract": "atlas-indicators-v1",
    },
  });
}
