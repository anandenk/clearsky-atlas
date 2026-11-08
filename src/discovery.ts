import "server-only";
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  discoverAreas,
  parseDiscoveryProfile,
  type DiscoveryIndex,
} from "./contracts/discovery";
import { tractRecord, exactTractsInBounds } from "./data";
import { facilityBundle } from "./contracts/facilities";
import { ContractError } from "./contracts/observations";
let index: DiscoveryIndex;
export function discoveryIndex() {
  if (!index) {
    try {
      const bytes = fs.readFileSync("data/discovery/index.json");
      const manifest = JSON.parse(
        fs.readFileSync("data/discovery/manifest.json", "utf8"),
      );
      if (
        createHash("sha256").update(bytes).digest("hex") !==
        manifest.output.sha256
      )
        throw Error("Index checksum mismatch");
      const parsed = JSON.parse(bytes.toString()) as DiscoveryIndex;
      if (parsed.schoolVersion !== facilityBundle("schools").datasetVersion)
        throw Error("School version mismatch");
      if (
        parsed.healthcareVersion !== facilityBundle("healthcare").datasetVersion
      )
        throw Error("Healthcare version mismatch");
      index = parsed;
    } catch {
      throw new ContractError(
        503,
        "discovery-index-unavailable",
        "Rebuild the local discovery index with .venv/bin/python scripts/prepare_discovery.py.",
      );
    }
  }
  return index;
}
export function discovery(input: unknown) {
  const profile = parseDiscoveryProfile(input);
  const ids = profile.bbox ? exactTractsInBounds(profile.bbox) : null;
  return discoverAreas(
    profile,
    discoveryIndex(),
    tractRecord,
    ids ? (row) => ids.has(row.tractId) : undefined,
  );
}
