import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { PMTiles, type Source } from "pmtiles";
export const TILE_BUILDING_VERSION = "2026-10-21.0";
export const CALIFORNIA_BUILDING_BOUNDS = [
  -124.49, 32.53, -114.13, 42.01,
] as const;
const filename = path.join(
  process.cwd(),
  "data/buildings",
  TILE_BUILDING_VERSION,
  "california.pmtiles",
);
const REMOTE =
  "https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/2026-10-21.0/buildings.pmtiles";
const ETAG = '\"21c7d93cafdd2160035ba2b268e25452-674\"';
const rangeFolder = path.join(
  process.cwd(),
  "data/buildings",
  TILE_BUILDING_VERSION,
  "ranges",
);
let activeRanges = 0;
const pendingRanges = new Map<string, Promise<ArrayBuffer>>();
async function rangeBytes(
  offset: number,
  length: number,
): Promise<ArrayBuffer> {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 1 ||
    length > 16000000
  )
    throw new Error("Invalid archive range");
  const key = `${offset}-${length}`;
  const existing = pendingRanges.get(key);
  if (existing) return existing;
  const operation = (async () => {
    await fs.mkdir(rangeFolder, { recursive: true });
    const file = path.join(rangeFolder, key);
    try {
      const b = await fs.readFile(file),
        proof = JSON.parse(await fs.readFile(file + ".json", "utf8"));
      if (
        b.length !== length ||
        crypto.createHash("sha256").update(b).digest("hex") !== proof.sha256 ||
        proof.sourceEtag !== ETAG
      )
        throw new Error("Invalid cached range");
      return b.buffer.slice(
        b.byteOffset,
        b.byteOffset + b.byteLength,
      ) as ArrayBuffer;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    if (activeRanges >= 8)
      throw new BuildingTileError(
        503,
        "source-busy",
        "Building source is busy; retry after current tiles complete.",
      );
    activeRanges++;
    try {
      const response = await fetch(REMOTE, {
        headers: {
          Range: `bytes=${offset}-${offset + length - 1}`,
          "If-Match": ETAG,
        },
        signal: AbortSignal.timeout(20000),
      });
      if (
        response.status !== 206 ||
        response.headers.get("etag") !== ETAG ||
        response.headers.get("content-range") !==
          `bytes ${offset}-${offset + length - 1}/180679746134`
      )
        throw new Error("Upstream archive identity or byte range changed");
      const data = await response.arrayBuffer();
      if (data.byteLength !== length)
        throw new Error("Incomplete upstream range");
      const digest = crypto
        .createHash("sha256")
        .update(new Uint8Array(data))
        .digest("hex");
      const entries = await fs.readdir(rangeFolder);
      let used = 0;
      for (const entry of entries)
        if (/^\d+-\d+$/.test(entry)) used += Number(entry.split("-")[1]);
      if (used + length > 512000000)
        throw new BuildingTileError(
          503,
          "cache-full",
          "Building range cache reached 512 MB; finish the statewide archive acquisition.",
        );
      const temp = file + "." + crypto.randomUUID() + ".partial";
      await fs.writeFile(temp, new Uint8Array(data));
      await fs.writeFile(
        temp + ".json",
        JSON.stringify({
          sourceUrl: REMOTE,
          sourceEtag: ETAG,
          offset,
          length,
          sha256: digest,
          retrievedAt: new Date().toISOString(),
        }),
      );
      await fs.rename(temp + ".json", file + ".json");
      await fs.rename(temp, file);
      return data;
    } finally {
      activeRanges--;
    }
  })();
  pendingRanges.set(key, operation);
  try {
    return await operation;
  } finally {
    pendingRanges.delete(key);
  }
}
const source: Source = {
  getKey: () => filename,
  async getBytes(offset, length, signal) {
    signal?.throwIfAborted();
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      length > 16000000
    )
      throw new Error("Invalid archive range");
    const handle = await fs.open(filename, "r");
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, offset);
      if (bytesRead !== length)
        throw new Error("Incomplete building archive range");
      signal?.throwIfAborted();
      return {
        data: buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
      };
    } finally {
      await handle.close();
    }
  },
};
const localArchive = new PMTiles(source);
const remoteArchive = new PMTiles({
  getKey: () => REMOTE,
  getBytes: async (offset, length, signal) => {
    signal?.throwIfAborted();
    const data = await rangeBytes(offset, length);
    signal?.throwIfAborted();
    return { data };
  },
});
async function currentArchive() {
  return await fs.access(filename).then(
    () => localArchive,
    () => remoteArchive,
  );
}
export class BuildingTileError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function requireBuildingTileVersion(version: string | null) {
  if (version !== TILE_BUILDING_VERSION)
    throw new BuildingTileError(
      409,
      "version-mismatch",
      `Required version=${TILE_BUILDING_VERSION}`,
    );
}
export function buildingTileBounds(z: number, x: number, y: number) {
  const n = 2 ** z;
  const lat = (v: number) =>
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * v) / n))) * 180) / Math.PI;
  return [(x / n) * 360 - 180, lat(y + 1), ((x + 1) / n) * 360 - 180, lat(y)];
}
export function validateBuildingTile(z: number, x: number, y: number) {
  if (
    ![z, x, y].every(Number.isSafeInteger) ||
    z !== 14 ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  )
    throw new BuildingTileError(
      400,
      "invalid-tile",
      "Only integer zoom-14 tiles are supported; overzoom these at neighborhood scales.",
    );
  const b = buildingTileBounds(z, x, y),
    ca = CALIFORNIA_BUILDING_BOUNDS;
  if (b[0] > ca[2] || b[2] < ca[0] || b[1] > ca[3] || b[3] < ca[1])
    throw new BuildingTileError(
      422,
      "outside-coverage",
      "Tile is outside the California extraction bounds.",
    );
}
export async function buildingVectorTile(
  z: number,
  x: number,
  y: number,
  version: string | null,
  signal?: AbortSignal,
) {
  requireBuildingTileVersion(version);
  validateBuildingTile(z, x, y);
  signal?.throwIfAborted();
  try {
    const tile = await (await currentArchive()).getZxy(z, x, y, signal);
    if (tile && tile.data.byteLength > 8000000)
      throw new BuildingTileError(
        413,
        "tile-too-large",
        "Building tile exceeds the 8 MB serving limit.",
      );
    return tile?.data;
  } catch (e) {
    if (e instanceof BuildingTileError || signal?.aborted) throw e;
    throw new BuildingTileError(
      503,
      "data-unavailable",
      "Statewide building archive unavailable or unreadable; run scripts/fetch_statewide_buildings.py.",
    );
  }
}
export async function buildingTileCatalog(version: string | null) {
  requireBuildingTileVersion(version);
  try {
    await (await currentArchive()).getHeader();
  } catch {
    throw new BuildingTileError(
      503,
      "data-unavailable",
      "Statewide building archive unavailable.",
    );
  }
  return {
    tilejson: "3.0.0",
    name: "Overture California buildings",
    scheme: "xyz",
    minzoom: 14,
    maxzoom: 14,
    tiles: [
      `/api/buildings/tiles/{z}/{x}/{y}?version=${TILE_BUILDING_VERSION}`,
    ],
    bounds: CALIFORNIA_BUILDING_BOUNDS,
    attribution:
      "© OpenStreetMap contributors, Overture Maps Foundation; per-feature source credits in sources. ODbL-1.0.",
    metadata: {
      contractVersion: "atlas-building-tiles-v1",
      datasetVersion: TILE_BUILDING_VERSION,
      scope: "statewide-california",
      serving: await fs.access(filename).then(
        () => "local-offline-archive",
        () => "upstream-ranges-with-local-success-cache",
      ),
      sourceLayers: ["building", "building_part"],
      sourceUrl: "https://docs.overturemaps.org/examples/overture-tiles/",
      license: "ODbL-1.0",
      licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
      attributionUrl: "https://docs.overturemaps.org/attribution/",
      minDisplayZoom: 14,
      maxTileBytes: 8000000,
      rangeCacheBudgetBytes: 512000000,
      truncated: false,
      completeInventory: false,
      boundaryMeaning:
        "California bounding rectangle, whole buffered tiles; includes adjacent-state/Mexico/ocean context. Not exact state-clipped geometry or an exhaustive ground inventory.",
      geometryMeaning:
        "Source-prepared display tiles: clipped, quantized and possibly simplified. Never use tiles for exact spatial lookup or unique-building inventory counts.",
      fields: {
        id: "Overture ID string property (prefer over MVT numeric feature ID)",
        height:
          "metres, source-supplied; may be estimated; absent means unknown",
        num_floors: "source floor count; absent means unknown",
        min_height: "metres; absent means unknown",
        is_underground: "source boolean if available",
        building_id: "parent building ID in building_part layer",
        sources: "JSON string with source/provenance records",
        has_parts:
          "building has source parts; do not extrude full building and parts on top of each other",
      },
      nullMeaning:
        "MVT omits null attributes. Missing height/levels must remain unknown; never interpret absent as zero measured height.",
      heightMeaning:
        "No server-imputed or CES-derived heights. Source-supplied heights can be ML estimates. Any schematic or floors-derived display height must be disclosed by the frontend.",
    },
  };
}
