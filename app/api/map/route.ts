import { NextRequest, NextResponse } from "next/server";
import { parseBounds } from "../../../src/contracts/bounds";
import { mapData, metricMapData } from "../../../src/data";
import { DATASET_VERSION } from "../../../src/contracts/indicators";
import { indicatorMap, mapDetail } from "../../../src/contracts/map-response";
import {
  validateVersion,
  readyIndicator,
} from "../../../src/contracts/observations";
import { contractFailure } from "../../../src/contracts/http";
export function GET(req: NextRequest) {
  const bbox = parseBounds(req.nextUrl.searchParams.get("bbox"));
  if (!bbox)
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  try {
    validateVersion(req.nextUrl.searchParams.get("version"));
    const detail = mapDetail(req.nextUrl.searchParams.get("detail"));
    const indicator = req.nextUrl.searchParams.get("indicator");
    if (detail === "overview" && indicator === null)
      return NextResponse.json(
        {
          error: "Overview detail requires a named indicator.",
          code: "indicator-required",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    if (indicator !== null) readyIndicator(indicator);
    const data =
      indicator === null
        ? mapData(bbox)
        : metricMapData(bbox, indicator, detail);
    return NextResponse.json(
      indicator === null ? data : indicatorMap(data, indicator, detail),
      {
        headers: {
          "Cache-Control":
            indicator === null ? "public, max-age=86400" : "no-store",
          "X-Atlas-Dataset": DATASET_VERSION,
        },
      },
    );
  } catch (e) {
    return contractFailure(e);
  }
}
