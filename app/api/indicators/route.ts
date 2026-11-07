import { NextResponse } from "next/server";
import { catalog, CONTRACT_VERSION } from "../../../src/contracts/indicators";
export function GET() {
  return NextResponse.json(catalog(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Atlas-Contract": CONTRACT_VERSION,
    },
  });
}
