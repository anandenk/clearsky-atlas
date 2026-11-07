# Current status — 2026-11-07

Authorized: Phase 1 source verification and Phase 2 local implementation; bounded local CLI delegation/commits. No publication, paid services, or global configuration changes. Full PRODUCT.md inventory retained.

## Current backend checkpoint

57 backend tests and four source-cache tests pass. All 13 target scalar indicators and ten demographic fields have verified normalized tract/map/comparison contracts. Real facilities now support schools (9,946 records) and statewide CDPH healthcare (14,921 records; 14,919 coordinate-bearing query points), with explicit historical dates, subtypes, provenance and distance limitations. Power remains unavailable: complete candidate/spatial audit finished, but reporting-period and retirement-code evidence remains unresolved. /api/facilities/catalog exposes ready categories and explicit power blockers/triggers. See latest BACKEND_CHANGES.md for exact APIs and performed checks.

Backend main remains separate from active frontend work; no integration performed. Frontend owns current map-first/multi-location UI; older two-address UI descriptions below describe the initial baseline. Sponsors remain parked. Full original scope is retained; grouped demographic composition, richer comparisons/stories, measured performance and coordinated rendered-interface integration remain planned.

Current additive backend APIs include POST /api/compare/overview for stable multi-location/reference comparisons and optional evidence=linked facility payloads. Local development measurements found a 15.7 MB statewide map response; linked six-school evidence reduces ~117.9 KB to ~7.4 KB with unchanged records. See latest BACKEND_CHANGES and data/benchmarks for methods/limits. Opt-in detail=overview now reduces statewide PM from 15.70 MB to 5.92 MB (~62%), with all IDs/source values preserved and isolated MapLibre rendering checked. Default detail and exact lookup remain unchanged. Adoption and device/transition profiling remain frontend/integration work.

Optional guided-story APIs now provide four curated topics over all 23 verified fields, with deterministic source-qualified text and exact comparison evidence. Nearby-essentials narratives are explicitly gated on confirmed coordinates; live school/healthcare queries remain available. A source-backed optional grouped demographic API is now available (age and publisher race/ethnicity profile, source population denominator, exact shares and missing/rounding diagnostics, no renormalization). Frontend group/story/overview adoption still needs its coordinated checkpoint. See latest BACKEND_CHANGES for exact behavior and performed checks.

## Historical initial comparison increment


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

## Interactive split — 2026-11-07

User now authorizes a separate interactive frontend session. Main owns backend/data/shared contracts/configuration and integration; frontend/atlas-interactive owns rendering/UI/interactions. See FRONTEND_HANDOFF.md for exact owned paths, real sample and the :3001 → :3000 proxy. No frontend agent launched. Baseline local tag frontend-handoff-v1 identifies the starting commit. No frontend merge while edits are active without a user-coordinated checkpoint. Backend updates are logged in BACKEND_CHANGES.md.

Handoff preparation checks: 10 backend tests, TypeScript, and targeted rendered-map interaction test passed after palette extraction. Subsequent proxy setup verification is recorded in BACKEND_CHANGES.md.

## Backend refinement after frontend baseline

- Frontend worktree `/Users/anand/Projects/hackathon.frontend`, branch `frontend/atlas-interactive`, immutable baseline `2f405625a5272ff7d09cf132d9ccc6f8a2066be4` (tag frontend-handoff-v1). Dependencies installed independently; frontend preview :3001 proxies main :3000. User-run session only; no frontend worker launched.
- Added `/api/indicators` machine-readable metadata/readiness and `/api/health` local-file-presence readiness. Existing selection/map response shapes retained; bbox validation tightened. Interface details and verification are in BACKEND_CHANGES.md, readable from main while frontend works independently. No frontend branch merge.
- Source cache now rejects malformed/security/error responses even on HTTP 200, including legacy failed responses on reuse. Original successful cache bytes unchanged.
- Checks: 14 spatial/data/contract tests, 4 cache regressions, TypeScript, one targeted rendered-map interaction test through frontend proxy, actual HTTP GET/POST and cross-port JSON equivalence. Source evidence gaps (including PM unit) remain unresolved. No new full build or broad UI-pass claim.

## Current milestone — verified two-indicator backend

This section supersedes earlier PM provisional-unit and PM-only backend status. Official OEHHA-linked CES5 app configuration corroborated PM2.5 µg/m³ and ozone ppm, both 2022–2024; exact originals/checksums cached. The full-report URL remains blocked, with no substitution.

Catalog atlas-indicators-v1.1 marks PM and ozone backend-ready. Added normalized `/api/tracts/{tractId}`, optional indicator-specific `/api/map`, and `/api/compare`. Existing demo/geocode/unnamed map contracts remain compatible. Version, source artifact hash, period/unit, null handling and compatible comparison checks are explicit. Live proxy :3001 serves main backend updates without merging frontend code.

21 backend tests and TypeScript passed. Repeatable HTTP smoke checks passed on :3000 and :3001, including source/value/map consistency and unsupported/invalid/version errors. Full frontend source ownership remains with the other session; no UI edits, dependency/config changes, or frontend merges in this pass. Additional source breadth and infrastructure remain planned. See BACKEND_CHANGES.md for consumption instructions and exact checks.

Final milestone checkpoint: production build passed, main dev server restored, both-port HTTP smoke checks passed again. Real API sample is data/samples/air-api-v1.json. No remaining PM/ozone unit gap; remaining scientific/source uncertainty is recorded by indicator instead of blocking unrelated implementation.

## Current milestone — full intended scalar/demographic backend breadth

This supersedes earlier two-indicator-only backend status. All 13 original scalar targets plus 10 demographic entries are backend-ready in catalog v1.2. Final publisher app descriptions/expressions corroborated units/periods; all 26 scalar values/percentiles matched at both source-point checks. Demographic period/units are dictionary-verified. Source null/zero behavior preserved across all 9,106 tracts. Named maps join only the selected metric; demographic legends use neutral raw percentages, not hazard percentiles. Percent-valued raw comparison differences now explicitly label percentage points.

26 backend tests, TypeScript, production build and all-23-indicator HTTP smoke checks on :3000 and :3001 passed. No frontend-owned code was edited or merged. Source matrix, API consumption changes and limits are in BACKEND_CHANGES.md; representative real API records including null/zero cases are data/samples/breadth-api-v1.json.

Next backend milestone: complete verified infrastructure feeds and qualified facility queries/distances. Statewide healthcare source and other facility coverage/status/license details remain blockers. Comparison/story summaries, measured statewide performance and integration remain later work. Sponsor services parked until near MVP readiness, by user decision; full atlas scope retained.

## Session migration checkpoint — 2026-11-07

Implementation paused at user request for fresh-session migration, not due to a technical blocker. Latest substantive implementation commit: 50a1e1ce3e027b6106a47ccb9f2364ae08c74da7. Main was clean before migration documentation. See SESSION_HANDOFF.md and NEXT_SESSION_PROMPT.md for current contracts, authorizations, worktrees/ownership, actual checks, source blockers, server recovery and ordered infrastructure work.

Migration availability check at 20:46 UTC: both pages/health/catalog responded successfully on :3000 and :3001; catalog v1.2 with 23 ready entries. Frontend remains active and uncommitted at baseline branch; its progress reports a map-first/multi-location foundation and its own checks, not independently certified in this backend migration. Do not merge/overwrite that work. No new implementation or full test rerun during migration; leave both preview servers running.

## Backend facility increment — 2026-11-07

Verified complete CDE 2025–26 source inventory (9,946 unique schools) and additive viewport/nearby API implemented; schools reuse gap resolved from cached state catalog rights. All published coordinates validated against unsimplified CES coverage; historical Active/Closed status preserved. Source completeness is separate from real-world completeness. See latest BACKEND_CHANGES.md and data/facilities/schools-validation.json. Healthcare/power remain unavailable; their evidence gates are next. Frontend worktree preserved with no integration. Sponsor services remain parked. Validation: 31 backend tests, four Python cache tests, TypeScript/build, facility HTTP smoke both ports; no new rendered UI claim.
