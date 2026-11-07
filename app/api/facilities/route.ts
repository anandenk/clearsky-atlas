import { NextRequest, NextResponse } from "next/server";
import {
  facilityBundle,
  facilityCategory,
  facilityQuery,
} from "../../../src/contracts/facilities";
import { contractFailure } from "../../../src/contracts/http";
export function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      facilityQuery(
        req.nextUrl.searchParams,
        facilityBundle(
          facilityCategory(req.nextUrl.searchParams.get("category")),
        ),
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return contractFailure(error);
  }
}
