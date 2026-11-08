import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "../../../src/geocode";
export async function POST(req: NextRequest) {
  let input;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Send the address as JSON with an address field." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const result = await geocodeAddress(input?.address, req.signal);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
