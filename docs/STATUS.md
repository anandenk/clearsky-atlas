# Current status — 2026-11-07

Authorized: Phase 1 source verification and Phase 2 local implementation; bounded local CLI delegation/commits. No publication, paid services, or global configuration changes. Full PRODUCT.md inventory retained.

## Working increment

Next.js + TypeScript + MapLibre comparison at `http://127.0.0.1:3000` when `npm run dev` or `npm run start` runs. Two live Census address searches with explicit candidate confirmation; separately cached public Oakland/Fresno examples; full-resolution CES tract lookup and independent Census2020 cross-check; paired percentile choropleths, shared scale, tract outlines, swap/replace/clear, one deterministic PM2.5 story, raw values and source percentiles, evidence disclosure, mobile map tabs, null/failure states, stale request cancellation.

## Verification

- 10 automated spatial/semantic tests passed (`npm test`): live CES point queries vs cached CSV values; full geometry vs Census2020 at three addresses; same-tract distinct coordinates; outside CA/ocean/reversed coordinates; shared edge, polygon hole; null/zero/comparison compatibility; 1:1 join and source null counts.
- 8 browser tests passed in installed headless Chrome: actual rendered tract features in both maps, swap/clear/replace, same tract, missing raw/percentile, source disclosure, network failure, request race, keyboard focus path, reduced-motion preference, layout at 320/375/414/768/1440. Mocked network responses exercise controlled failure/race/null paths, not live provider reliability. Live `/api/geocode` separately returned Oakland tract 06001403402.
- Production build and TypeScript passed. Initial CommonJS mismatch and MapLibre worker 404 were corrected; successful builds alone did not catch the worker problem, rendered tests did.
- Desktop and narrow/tablet screenshots visually inspected. Local screenshots in ignored `artifacts/`. No comprehensive accessibility, screen-reader, hardware performance, all-address spatial accuracy, 3D or deployment claims.

## Source findings / remaining work

See DATA_VERIFICATION.md for all indicators and FACILITY_SOURCES.md for exact feeds. CES CSV/dictionary/shapefile/layer metadata downloaded with provenance; 9,106 joined, valid source geometries. All original CES target fields exist; most individual measurement periods/units remain unverified and inactive. Direct technical-report/fact-page downloads returned security HTML, explicitly labeled failed; official PM fact sheet was readable through web extraction. No unsupported indicator was substituted.

Supplied healthcare feed is LA-only (3,620 records), so statewide healthcare needs a suitable verified source. School/power schemas and samples are cached; reuse, current reporting vintage/status and completeness require further checks. Power includes out-of-state records. No credentials/payment currently needed for working comparison.

## Handoff / next work

1. Finish per-indicator period/unit contracts and source permissions, then Phase 3 registry breadth. Seek statewide CDPH feed; do not treat LA copy as statewide.
2. Add sources through shared contracts, then full stories, neutral demographic charts, facility overlays and qualified distances.
3. Measure large-area viewport payload/lookup memory on demo hardware before choosing tiles/spatial index; keep unsimplified lookup separate. Finish camera linking/3D/motion/accessibility in later phases.

Deferrals with concrete triggers live in DATA_VERIFICATION.md; phases 3–6 remain in the full target. No sponsor integration or account work begun.

One worker: facility-sources, gpt-6.1-terra medium; reviewed and integrated local branch. Worker network failures were resolved with bounded main-session requests. Branch/worktree retained. Remaining weekly allowance unknown; no further workers launched.
