# Statewide California building rendering

User requested statewide implementation after the initial pilot. Implemented on main, local only. Frontend worktree remains untouched. Mobile integration remains out of scope by user instruction.

## Frontend contract — use this for all California viewports

Fetch **`/api/buildings/catalog?version=2026-10-21.0`**. It returns TileJSON-compatible fields plus evidence metadata:

- `tiles`: [`/api/buildings/tiles/{z}/{x}/{y}?version=2026-10-21.0`]
- `scheme=xyz`, `minzoom=14`, `maxzoom=14`, California envelope `bounds=[-124.49,32.53,-114.13,42.01]`.
- `metadata.contractVersion=atlas-building-tiles-v1`, `datasetVersion`, statewide scope, current serving mode, attribution/license/source URLs, geometry/null/height definitions and limits.

Use a MapLibre **vector source**. Resolve each returned relative tile URL against the browser's origin, preserving the :3001 → :3000 proxy. Keep browser fetches relative; no hardcoded backend origin. Set `minzoom:14`, `maxzoom:14`, and the supplied bounds on the source. MapLibre overzooms these detail tiles above zoom 14; do not request z15/z16 endpoints. This avoids the lower-zoom archive layers whose attributes are generalized. Clip/deduplicate display features only as needed for rendering; never use these display tiles for exact address membership.

Two source layers: **`building`** and **`building_part`**. Properties are source tile fields, not the pilot GeoJSON property names:

| Property | Meaning |
| --- | --- |
| `id` | Overture string ID; prefer over numeric MVT feature ID |
| `height` | Source-supplied metres, possibly estimated; absent = unknown |
| `num_floors` | Supplied number of floors; absent = unknown |
| `min_height` | Source metres above ground for base, if present |
| `is_underground` | Source boolean, when present |
| `has_parts` | Parent building has associated source parts |
| `building_id` | Parent ID on `building_part` features |
| `sources` | JSON string of source/provenance records; parse before displaying |
| `version` | Source feature version, separate from dataset release |

MVT omits nulls: use `has`/nullish checks, never `Number(undefined)` or a falsy-to-measured-zero rule. No server-generated heights. If using levels/schematic display heights, disclose those separately. `@height_source` and `@geometry_source` are upstream helpers; authoritative property provenance is in `sources`. Inspected helper values sometimes say OpenStreetMap even when `/properties/height` identifies Microsoft, so do not rely on the helper for precise attribution.

Replace the old OpenFreeMap building layer when this source is enabled. For parts rendering, avoid overlapping full parent extrusions: one option is render parent buildings with `has_parts != true`, plus `building_part` using its source height/min_height. Unknown heights should retain an honest footprint or a disclosed schematic representation. Keep tract shading/legends legible. Verify desktop City/Flat/Landscape and linked-map behavior in the separate frontend session. No frontend merge/adoption is claimed by this backend work.

## Geographic scope and errors

This is statewide California **envelope coverage**, not two supported neighborhoods. All tiles intersecting the California rectangle can be requested. Whole buffered boundary tiles include some adjacent-state, Mexico and ocean context; these are not exact state-clipped footprints. Source building completeness/accuracy is not guaranteed. Tile geometry is clipped/quantized and may be simplified by the upstream tile pipeline. IDs can repeat in neighboring tiles; rendered fragment counts are not unique inventories.

200: uncompressed MVT bytes (`application/vnd.mapbox-vector-tile`). 204: known absent tile in the archive, not source failure. JSON errors `{code,error}`: 400 invalid-tile (integer coordinates and z14 required), 409 version-mismatch (missing version also fails), 422 outside-coverage, 413 tile-too-large, 503 data-unavailable/source-busy/cache-full. No truncated tile or fabricated empty tile on failure. Max decompressed response 8 MB. Pin release in every tile request. Successful immutable tile responses cache for one day; errors no-store. Cancellation is checked before/after retrieval; shared successful range fetches may complete into cache after an individual viewer cancels.

## Serving, caching and reproducibility

The version-pinned **official Overture PMTiles archive** provides statewide data immediately through HTTP byte ranges, not GeoParquet scans on pan. Only needed directory/tile ranges are fetched. Every remote range requires HTTP 206, exact Content-Range, expected byte length and pinned ETag. Successful bytes are cached with SHA-256, release-keyed paths, retrieval time and provenance under ignored `data/buildings/2026-10-21.0/ranges/`. Checksums are verified on replay; failures are not cached as successful empty data. Max eight remote range fetches per process, shared in-flight ranges, 20-second source timeouts, 16 MB maximum compressed range, 512 MB range-cache budget (explicit cache-full at budget). The byte budget is checked against current files; concurrent writes can exceed it by up to eight bounded in-flight ranges. Already cached views remain usable offline.

The same service prefers a complete local `data/buildings/2026-10-21.0/california.pmtiles` once present. Local and remote archives have **separate directory caches**, since extraction changes byte offsets. Mode is disclosed in catalog `metadata.serving` (`local-offline-archive` versus `upstream-ranges-with-local-success-cache`). Partial downloads are never served. The full statewide-envelope acquisition is about 1.4 GB; download speed is source/network dependent. It is an optional offline artifact, not a requirement for statewide API access.

Reproduce full offline acquisition: `.venv/bin/python scripts/fetch_statewide_buildings.py`. It obtains a local Protomaps CLI v1.31.2, verifies the distribution SHA-256, checks source identity, extracts the California rectangle, verifies the archive structure, hashes the result and atomically promotes the file. No global install/account/billing. Automatic CLI acquisition currently supports this machine's Darwin arm64; another platform needs a checksum-pinned asset entry. The final artifact/provenance record is `data/contracts/buildings-statewide.json`. The source URL has a retention policy, so retain the local archive for durable offline use rather than assuming the upstream pinned release will remain online indefinitely.

Source: https://docs.overturemaps.org/examples/overture-tiles/ ; archive: https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/2026-10-21.0/buildings.pmtiles ; upstream ETag `"21c7d93cafdd2160035ba2b268e25452-674"`. The retained tile metadata contains an inconsistent `planetiler:buildtime` (March) despite the October release URL and 2026 August/September feature source dates. It is retained as-is and is **not** used as the observation/release date. Source identity is the release URL + pinned ETag; raw source matching was checked separately.

License ODbL-1.0. Display linked **© OpenStreetMap contributors, Overture Maps Foundation**, retain additional source credits in `sources` (including Microsoft ML Buildings and source-qualified USGS Lidar where supplied). Preserve the retained license/attribution material and any later adapted-database sharing obligations. Current work remains local and unpublished. Runtime npm dependency: `pmtiles@4.5.0`; decoder verification dependencies: `@mapbox/vector-tile` and `pbf`. Frontend needs no new dependency: it consumes normal MVT via MapLibre.

## Verification

`node scripts/verify_statewide_buildings.mjs` exercises the actual :3000 endpoints in Rancho, Oakland, San Diego, Fresno, Sacramento, Eureka, Tahoe and a rural desert viewport. It verifies source IDs, height/null semantics, parent IDs, parsed sources, repeated-response byte identity and explicit invalid/version/outside errors. For Rancho/Oakland it compares overlapping source-record heights and floor counts to the retained original GeoJSON, rather than inferring accuracy from a successful build. Measurements/hashes: `data/benchmarks/buildings-statewide.json`.

Optional desktop rendering: `.venv/bin/python scripts/verify_statewide_buildings_render.py` (Playwright + installed Chrome). It uses isolated paired maps through the real API, including Rancho/Oakland and Eureka/San Diego, supplied heights, unknown-height footprints, and source parts. Screenshots: `artifacts/buildings-statewide/`. No mobile verification or active frontend integration is included.

The prior `/api/buildings?bbox=...` is retained for backwards-compatible whole-source-geometry inspection **within its documented pilot bounds**. It is not the statewide rendering endpoint. Existing CES APIs/types and exact lookup boundaries are unchanged.

Current completed checks: **69/69 backend tests**, TypeScript no-emit and production build passed. A network-disabled replay test retrieves a cached Rancho tile; a separate cold cache with network disabled returns 503 rather than a fabricated empty result. Aborted requests reject. Eight live endpoint samples, including empty rural coverage, passed. Actual measurements: `data/benchmarks/buildings-statewide.json`; raw-source height/floor matches 6,876; source-part parent-ID checks 295. First local API fetches in that source-cache state ranged ~0.31–1.36 seconds for nonempty tiles, warm repeated responses ~9–19 ms; these are measured samples, not statewide latency guarantees. Example uncompressed tile sizes: Rancho 358 KB, Oakland 1.60 MB. Rendered desktop source/parts checks and screenshots passed with no page/map errors; renderer fragment counts remain non-inventory measurements. Source archive header/metadata identity retained in `data/contracts/buildings-statewide-source.json` independently of the optional full offline extract.

Integration freeze observation, 2026-11-07: no extraction or finalizer process is running. `california.download.pmtiles` and `california.partial.pmtiles` are incomplete sparse files; no final `california.pmtiles`, `data/contracts/buildings-statewide.json`, or finalization log exists. Preserve these partials; do not promote them. Complete offline acquisition requires a deliberate later restart and successful structural/checksum verification. The API serves statewide via the documented online cache path; only successfully cached ranges support offline replay.
