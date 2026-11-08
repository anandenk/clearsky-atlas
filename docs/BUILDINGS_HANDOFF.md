# Overture building service — frontend adoption handoff

**Statewide update:** the pilot-only restriction is superseded by [BUILDINGS_STATEWIDE.md](BUILDINGS_STATEWIDE.md). Use the new vector tile catalog/API for any California viewport. The GeoJSON interface documented below remains a separate exact-source pilot inspection endpoint, not the statewide renderer.

Main implementation, 2026-11-07 (acquisition timestamps UTC Nov 8). All changes local. Active frontend untouched; no merge requested. User subsequently removed mobile integration from ongoing work; desktop is the verification target.

## Endpoint

`GET /api/buildings?bbox=west,south,east,north&version=2026-10-21.0`

Example: `/api/buildings?bbox=-117.56,34.12,-117.55,34.13&version=2026-10-21.0`.

Returns WGS84 longitude/latitude GeoJSON FeatureCollection with `bbox`, `features`, and `metadata`. Each feature has stable Overture `id` at top level and in properties, whole original Polygon/MultiPolygon geometry, bbox, nullable `height` in metres, nullable `levels` from `num_floors`, `minHeight`, `isUnderground`, `hasParts`, `sourceFeatureVersion`, unchanged `sources`, `dataset`, `datasetVersion`, and `heightProvenance` (`source-supplied` or `unknown`). “Source-supplied” does **not** mean surveyed: Microsoft heights can be estimates. Inspect the source entry whose `property` is `/properties/height`. No derived heights, defaults, or CES-derived dimensions. Missing values stay null. Floors are counts, not metres. No building parts included; `hasParts` preserves source information but does not imply parts were loaded.

Metadata supplies `contractVersion=atlas-buildings-v1`, `datasetVersion`, license/attribution/source links, height and geometry meanings, `partsIncluded=false`, `truncated=false`, count, limits, and `coverage` (`scope=pilot`, `region`, region bounds, `completeInventory=false`, `status=available|empty`). Empty in-cache queries return 200/empty, not an error. Footprint bbox intersection is a rendering candidate test, not exact polygon membership. No footprint simplification or clipping.

Explicit JSON errors `{code,error}`: 400 invalid-bounds / bounds-too-large; 409 version-mismatch (also missing version); 413 result-too-large; 422 outside-coverage; 503 data-unavailable / buildings-unavailable. No partial/truncated success. Errors and responses use no-store; frontend can cache by exact bbox + pinned release. Local immutable spatial cell indices are cached server-side. There are no remote acquisition calls on pan. Aborted request signals are checked; frontend still needs AbortController plus stale-response IDs.

## Geographic/performance boundaries

Entire query bbox must fit one cached rectangle:

| Region | west,south,east,north | Cached buildings | Missing height |
| --- | --- | ---: | ---: |
| Rancho Cucamonga | -117.572,34.107,-117.532,34.147 | 12,079 | 1,553 |
| Oakland | -122.29,37.79,-122.25,37.83 | 13,847 | 5,384 |

Max width/height 0.02 degrees, 5,000 features, 4,000,000 serialized bytes. Recommended minimum zoom 15; pitch can increase viewport bounds past the limit even at this zoom. Subdivide bounded views and deduplicate IDs if needed; do not silently omit an oversized viewport. Whole features can extend outside the extraction bounds. Rectangles describe queryable acquisition coverage, not a completeness guarantee for buildings on the ground.

Statewide source coverage remains the target. Pilot restriction is explicit: even these ~4 km-wide extracts generate ~23 MB of prepared indices, with ~3 MB neighborhood responses. Expansion trigger: move serving to fixed bounded release-keyed cells/vector tiles with measured storage/acquisition budgets before prefetching statewide. Add requested California regions through the same reproducible pipeline in the meantime; do not present the two pilots as statewide. Building parts are deferred until footprint adoption is verified and an ID-linked parts cache is prepared; no frontend part modeling should be inferred today.

## Reproduction and retained evidence

Install main `scripts/requirements.txt`; run `.venv/bin/python scripts/fetch_buildings.py`, then `.venv/bin/python scripts/prepare_buildings.py`. Fetch caches verified successes, pins release, enforces a 600-second subprocess timeout, and fails on STAC spatial-index fallback instead of scanning globally. Region bounds are explicit constants. Original extracts are retained/ignored, metadata and SHA-256 proofs tracked under `data/raw/buildings/2026-10-21.0/` and `data/contracts/buildings.json`. Preparation validates geometry, IDs, finite nonnegative heights and builds a 0.002-degree spatial index. Restart only main after regeneration. Frozen optional acquisition dependencies added to Python requirements; no npm dependency/config change.

Official schema: https://docs.overturemaps.org/schema/reference/buildings/building/ ; guide: https://docs.overturemaps.org/guides/buildings/ ; licensing: https://docs.overturemaps.org/attribution/ . Original source geometries and per-feature source credits are retained. Theme license ODbL-1.0; display **© OpenStreetMap contributors, Overture Maps Foundation**, with Microsoft ML Buildings credits for these extracts, and linked license/source notices. Retained documentation includes ODbL text. Any later distributed adapted database must preserve ODbL attribution/share-alike obligations and source availability; current work is local only.

## Verification and frontend adoption

`npm test` passed 66/66; TypeScript no-emit passed. Indexed results were checked against brute-force bbox selection and raw source geometry/heights/nulls for both regions; wrong release, oversized/outside bbox and cancellation tested. HTTP 400/409/422 behavior verified against :3000. The :3001 proxy could not be exercised because that preview was not listening; frontend session owns its restart.

Optional isolated render: install `playwright==1.64.1` in the venv and run `.venv/bin/python scripts/verify_buildings_render.py` with installed Chrome. It leaves active frontend unchanged. Screenshots and performance JSON: `artifacts/buildings/`. Actual screenshots reviewed: Rancho residential footprints substantially fill the previous source gaps; Oakland renders many additional footprints but also visibly exposes missing heights. These are footprint extrusions, not photorealistic or verified precise building models. Paired rendered-feature counts can include tile fragments and must not be treated as unique inventories.

Frontend next: consume pinned requests at neighborhood zoom; replace old building rendering in fully covered viewports, avoid duplicate overlays, preserve previous coverage/error/loading truthfully, disclose source and unknown/estimated heights. Use supplied height, then explicitly labeled levels-derived/schematic display only if desired; never mutate source values. Suppress underground buildings using supplied flag if appropriate. Verify desktop City/Flat/Landscape, linked maps and CES legibility in the frontend session. No mobile integration requested going forward. No active frontend application integration has been claimed here.

Final recorded isolated-run measurements (`data/benchmarks/buildings.json`, six HTTP requests per region): Rancho bbox `-117.562,34.117,-117.542,34.137`: 3,586 features, 195 unknown heights, 3,017,444 bytes, first 140 ms / warm median 14 ms. Oakland bbox `-122.28,37.8,-122.26,37.82`: 2,893 features, 1,258 unknown heights, 2,946,032 bytes, first 29 ms / warm median 12 ms. First requests here are not guaranteed cold OS/framework caches. Screenshots at zoom 15.6/pitch 58 compare identical cameras: Rancho rendered feature fragments 5 old / 1,773 new, Oakland 134 / 1,623; these are renderer fragments, not unique building counts or exact source-completeness ratios. Pitched visible bounds exceed the acquired request bbox in this technical harness, so the comparison is qualitative within loaded coverage. Production adoption must cover the full visible bounds or explicitly show partial/unavailable coverage.

Production `npm run build` also passed, including the new `/api/buildings` route. Main :3000 dev service restarted after build; frontend :3001 was not started or changed.
