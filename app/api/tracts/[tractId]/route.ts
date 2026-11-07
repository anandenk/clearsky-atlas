import { NextRequest, NextResponse } from "next/server";
import { tractRecord } from "../../../../src/data";
import { DATASET_VERSION } from "../../../../src/contracts/indicators";
import {
  OBSERVATION_CONTRACT,
  ContractError,
  validateTractId,
  validateVersion,
  requestedIndicators,
  normalizeObservation,
} from "../../../../src/contracts/observations";
import { contractFailure } from "../../../../src/contracts/http";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ tractId: string }> },
) {
  try {
    const { tractId } = await context.params;
    validateTractId(tractId);
    validateVersion(req.nextUrl.searchParams.get("version"));
    const indicators = requestedIndicators(
      req.nextUrl.searchParams.get("indicators"),
    );
    const row = tractRecord(tractId);
    if (!row)
      throw new ContractError(
        404,
        "tract-not-found",
        "Tract is not covered by this CES dataset.",
      );
    return NextResponse.json(
      {
        contractVersion: OBSERVATION_CONTRACT,
        datasetVersion: DATASET_VERSION,
        tractId,
        tractVintage: "2020",
        place: row.approx_loc,
        county: row.county,
        observations: indicators.map((i) =>
          normalizeObservation(tractId, row, i),
        ),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Atlas-Dataset": DATASET_VERSION,
        },
      },
    );
  } catch (e) {
    return contractFailure(e);
  }
}
