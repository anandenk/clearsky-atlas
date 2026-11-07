import { NextRequest, NextResponse } from "next/server";
import { tractRecord } from "../../../../src/data";
import { comparisonOverview } from "../../../../src/contracts/overview";
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
        "overview-request-too-large",
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
    return NextResponse.json(comparisonOverview(input, tractRecord), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return contractFailure(error);
  }
}
