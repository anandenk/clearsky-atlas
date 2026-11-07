import { NextRequest, NextResponse } from "next/server";
import { lookup } from "../../../../src/data";
import { nearbyComparison } from "../../../../src/contracts/facility-narratives";
import {
  facilityBundle,
  facilityCatalog,
} from "../../../../src/contracts/facilities";
import { ContractError } from "../../../../src/contracts/observations";
import { contractFailure } from "../../../../src/contracts/http";
export async function POST(req: NextRequest) {
  try {
    if (
      req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
      "application/json"
    )
      throw new ContractError(
        415,
        "json-required",
        "Use Content-Type application/json.",
      );
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 32768)
      throw new ContractError(
        413,
        "nearby-request-too-large",
        "Request body must not exceed 32 KiB.",
      );
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      throw new ContractError(
        400,
        "invalid-json",
        "Request body must be valid JSON.",
      );
    }
    return NextResponse.json(
      nearbyComparison(input, {
        lookupTracts: (coordinate) =>
          lookup(coordinate).map((f) => f.properties.id),
        getBundle: facilityBundle,
        catalog: facilityCatalog,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return contractFailure(error);
  }
}
