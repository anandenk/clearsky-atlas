import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { DATASET_VERSION } from "../../../src/contracts/indicators";
export function GET() {
  const required = [
    "lookup.json",
    "display.json",
    "observations.json",
    "demo-geocodes.json",
  ];
  const missing = required.filter(
    (file) => !fs.existsSync(path.join(process.cwd(), "data", file)),
  );
  return NextResponse.json(
    {
      service: "california-environmental-atlas",
      apiContract: "baseline-v1",
      datasetVersion: DATASET_VERSION,
      localArtifactsReady: missing.length === 0,
      missingArtifacts: missing,
      externalServicesChecked: false,
      readinessMeaning:
        "Checks local file presence only, not hashes, geometry validity, provider connectivity, or rendered UI.",
    },
    {
      status: missing.length ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
