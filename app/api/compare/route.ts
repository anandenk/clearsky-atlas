import { NextRequest, NextResponse } from "next/server";
import { tractRecord } from "../../../src/data";
import { DATASET_VERSION } from "../../../src/contracts/indicators";
import {
  OBSERVATION_CONTRACT,
  ContractError,
  validateTractId,
  validateVersion,
  readyIndicator,
  normalizeObservation,
  compareObservations,
} from "../../../src/contracts/observations";
import { contractFailure } from "../../../src/contracts/http";
export function GET(req: NextRequest) {
  try {
    validateVersion(req.nextUrl.searchParams.get("version"));
    const a = req.nextUrl.searchParams.get("tractA") ?? "",
      b = req.nextUrl.searchParams.get("tractB") ?? "";
    validateTractId(a);
    validateTractId(b);
    const i = readyIndicator(req.nextUrl.searchParams.get("indicator") ?? "pm");
    const ar = tractRecord(a),
      br = tractRecord(b);
    if (!ar || !br)
      throw new ContractError(
        404,
        "tract-not-found",
        "One or both tracts are not covered by this CES dataset.",
      );
    const ao = normalizeObservation(a, ar, i),
      bo = normalizeObservation(b, br, i);
    return NextResponse.json(
      {
        contractVersion: OBSERVATION_CONTRACT,
        datasetVersion: DATASET_VERSION,
        indicatorId: i.id,
        a: ao,
        b: bo,
        comparison: compareObservations(ao, bo),
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
