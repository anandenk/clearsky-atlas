import { NextResponse } from "next/server";
import { ContractError } from "./observations";
export function contractFailure(error: unknown) {
  if (error instanceof ContractError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  console.error("Atlas data request failed");
  return NextResponse.json(
    {
      error: "Local dataset is unavailable or could not be read.",
      code: "local-data-unavailable",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
