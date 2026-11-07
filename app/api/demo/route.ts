import { NextResponse } from "next/server";
import { demos } from "../../../src/data";
export function GET() {
  return NextResponse.json(demos());
}
