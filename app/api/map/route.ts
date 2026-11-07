import { NextRequest, NextResponse } from "next/server";
import { parseBounds } from "../../../src/contracts/bounds";
import { mapData, metricMapData } from "../../../src/data";
import { DATASET_VERSION } from "../../../src/contracts/indicators";
import { indicatorMap } from "../../../src/contracts/map-response";
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
    const indicator = req.nextUrl.searchParams.get("indicator");
    if (indicator !== null) readyIndicator(indicator);
    const data =
      indicator === null ? mapData(bbox) : metricMapData(bbox, indicator);
    return NextResponse.json(
      indicator === null ? data : indicatorMap(data, indicator),
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
