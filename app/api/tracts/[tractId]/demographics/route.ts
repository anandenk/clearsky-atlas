import { NextRequest, NextResponse } from "next/server";
import { tractRecord } from "../../../../../src/data";
import {
  tractDemographics,
  requestedDemographicGroups,
} from "../../../../../src/contracts/demographics";
import {
  ContractError,
  validateTractId,
  validateVersion,
} from "../../../../../src/contracts/observations";
import { contractFailure } from "../../../../../src/contracts/http";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tractId: string }> },
) {
  try {
    const { tractId } = await context.params;
    validateTractId(tractId);
    validateVersion(req.nextUrl.searchParams.get("version"));
    const groups = req.nextUrl.searchParams.get("groups");
    requestedDemographicGroups(groups);
    const row = tractRecord(tractId);
    if (!row)
      throw new ContractError(
        404,
        "tract-not-found",
        "Tract is not covered by this CES dataset.",
      );
    return NextResponse.json(tractDemographics(tractId, row, groups), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return contractFailure(error);
  }
}
