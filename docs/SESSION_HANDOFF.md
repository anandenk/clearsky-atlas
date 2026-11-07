# Backend session migration — 2026-11-07

**Current resume checkpoint:** school and statewide CDPH healthcare inventories are implemented; see latest BACKEND_CHANGES.md and NEXT_SESSION_PROMPT.md. Next is CEC power validation. Historical pause, old hashes and availability descriptions below are migration-time evidence, superseded by resumed sections. Main and frontend remain separate; coordinate before integration.

## Historical migration record

Prepared at user request to migrate before automatic context compaction. **Implementation is paused at a clean, committed milestone.** Do not continue work in the departing session. This handoff is repository documentation, not a memory-store update.

## Resume here

Open the next backend/integration session in `/Users/anand/Projects/hackathon`, branch `main`. Read AGENTS.md, README.md and the four required linked planning documents first. Then read this handoff and the latest **original indicator breadth, catalog v1.2** section of BACKEND_CHANGES.md. Do not reread all old conversation logs or revive archived flood/Earth investigations.

The next substantive backend milestone is **verified infrastructure inventories and qualified facility queries/distances**. Check current worktree/servers and frontend progress before edits. Existing backend APIs/data should not be rebuilt from scratch.

## Authorization and user preferences

- Continue local backend/data work and make reviewed local commits. Full original atlas scope remains the target; no silent reduced MVP.
- Sponsor services are **parked until near MVP readiness**, after core atlas data and frontend flow are integrated/reviewable. No sponsor accounts, integrations or track-specific work now.
- Keep local. No push, publication, deployment, purchases, billing/global configuration changes, or revival of archived investigations.
- Separate user-run frontend session is active. Do not launch a frontend worker. Backend remains integration owner; coordinate a paused checkpoint with the user before merging/rebasing/cherry-picking active frontend edits or synchronizing shared files.
- `$parallel-worktrees` is authorized only when worthwhile: normally zero/one economical bounded CLI worker, no worker delegation, preserve existing work before branching. User reports Pro 5× with possibly scarce weekly allowance; remaining allowance unknown. No extra workers were used in recent milestones.
- Be informative every pass: explain changed behavior, what can be tried, checks actually performed, uncertainty/blockers, and next milestone. Distinguish verified results from source claims and proposals. Do not claim UI/build/accessibility/data checks that were not run.
- User explicitly requested this migration rather than relying on automatic compaction. Prepare another clean handoff when context becomes tight.

## Git/worktrees — inspected at migration

| Worktree | Branch / state |
| --- | --- |
| `/Users/anand/Projects/hackathon` | `main`; clean before these migration-only docs edits; latest implementation commit `50a1e1ce3e027b6106a47ccb9f2364ae08c74da7` |
| `/Users/anand/Projects/hackathon.frontend` | `frontend/atlas-interactive`; HEAD `2f405625a5272ff7d09cf132d9ccc6f8a2066be4`; **active uncommitted frontend changes**, not merged |
| `/Users/anand/Projects/hackathon.agent-facility-sources` | `agent/facility-sources`, HEAD `7d20653`; old reviewed/integrated source investigation; clean, retained, no active assignment |

Important main commits:

- `50a1e1c`: full intended scalar/demographic backend breadth; sponsor parking.
- `921f8a0`: verified PM/ozone contracts, normalized tract/comparison APIs.
- `c1e42b1`: source-cache validation, metadata/readiness APIs, stricter bounds.
- `2f40562`: reviewed frontend handoff baseline/proxy/ownership; immutable local tag `frontend-handoff-v1`.
- `bbb7ded`: initial local comparison application.

A documentation-only migration commit follows 50a1e1c. Use `git log` for its actual SHA. Do not reset main to the earlier implementation commit. Do not commit or stash the frontend session's work from here.

## Servers — verified during migration, not guaranteed forever

Both root pages responded HTTP 200 at 2026-11-07 20:46 UTC. Both /api/health reported localArtifactsReady=true and both /api/indicators returned v1.2 with 23 ready entries.

| Service | URL | Persistent tmux session |
| --- | --- | --- |
| Main/backend (also old baseline UI) | `http://127.0.0.1:3000` | `atlas-local-server` |
| Active frontend preview | `http://127.0.0.1:3001` | `atlas-frontend-preview` |

Main runs `npm run dev` WITHOUT ATLAS_BACKEND_ORIGIN. Frontend runs `ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000 npm run dev -- --port 3001`. next.config.ts uses beforeFiles rewrites to proxy /api/* from frontend to main, overriding local checked-out API routes. Each worktree has its own node_modules and .next. Frontend needs no ignored backend datasets or type/code merge to call current APIs.

Check lsof/tmux before starting another server. Preserve existing sessions. Don't kill-server. If restarting main is necessary, restart only atlas-local-server; don't stop frontend. A Next dev reload graph once served stale readiness in a newly added route; one backend restart reconciled it. Recheck /api/indicators and actual routes together rather than assuming HMR propagated everything.

Do not run next build concurrently with dev against the same worktree's .next. Previous backend build checks stopped/restarted only main, retained :3001, and reran HTTP smoke checks afterward. next-env.d.ts dev/build path churn is generated, not a hand-edited feature.

## Exact ownership

Backend/integration owner: `app/api/**`, `data/**`, `scripts/**`, `src/data.ts`, `src/spatial.ts`, `src/domain.ts` shared types/numeric correctness, `src/contracts/**`, backend tests outside tests/ui, source/status/API/migration docs. Own package.json, all lockfiles, next.config.*, tsconfig.json, AGENTS.md and other root config. Coordinate shared-file/dependency/config changes through the user while frontend is active.

Frontend owner: `app/**` EXCEPT app/api (including page/layout/globals), `src/AtlasMap.tsx`, `src/map-theme.ts`, new `src/components/**`, `src/hooks/**`, `src/styles/**`, `src/frontend/**`, `public/ui/**`, `tests/ui/**`, playwright.config.ts, .hallmark, FRONTEND_PROGRESS.md. Do not change these in main while ownership remains assigned. Root design.md in frontend is also active frontend design material; don't overwrite it.

Integration: frontend pauses/commits reviewed owned changes at a user-coordinated checkpoint; main reviews complete tracked/untracked diff, resolves compatibility, merges explicitly and runs combined checks. **No automatic merging or worktree cleanup.**

## Backend capabilities now complete

Dataset: `ces-5.0-final-2026-07-01`, 9,106 joined 2020 Census tracts. Catalog v1.2 has **13 original scalar indicators + ten demographic fields**; this is the intended target field set, not all 23 CES model indicators and not infrastructure.

- Environment: PM2.5, ozone, diesel, traffic, toxic releases, cleanup.
- Health: age-adjusted asthma/heart-attack ED rates, adult modeled diabetes prevalence, low birth weight.
- Community: poverty, less-than-high-school attainment, housing burden.
- Demographics: pop_und10/pop_10_64/pop_ov64; hisp/white/black/amind/asian/pacisl/othmult.

Units/periods/definitions are verified against final publisher apps (including popup expression results) and downloaded dictionary. See latest BACKEND_CHANGES table. Source periods differ and must remain visible. Toxic/cleanup values are **weighted source scores**, not physical concentrations/site counts. Percent-valued differences are percentage points, not percentage change. Health observations are tract population context, never personal probabilities.

Demographics have NO source percentile or hazard direction: visualization.kind=neutral-percentage, property=value, domain=[0,100]. Scalar maps use source-percentile / property=percentile / shared [0,100]. Null and suppression preserved; zero is valid. All scalar raw/percentile fields matched the publisher's final map layer at two representative geocoded tract points, not at every address statewide.

### Current APIs

- GET /api/indicators: atlas-indicators-v1.2; metadata/readiness/evidence/visualization/limitations. All 23 target entries backendReady=true. Named license remains unspecified; source catalog rights say no restrictions on public use.
- GET /api/tracts/{11-digit CA tractId}?indicators=...&version=...: atlas-observations-v1; defaults to all ready entries (23), numeric rawValue/percentile or null, unit, period, provenance/hash, status/flags, comparison key. Attribute read avoids full spatial geometry load.
- GET /api/map?bbox=west,south,east,north&indicator=...&version=...: named map joins only chosen field into display features, returns generic properties.value/percentile and metadata.legend. Without indicator, legacy response/properties preserved.
- GET /api/compare?tractA=...&tractB=...&indicator=...&version=...: normalized A/B plus compatibility, sameTract, B-minus-A raw difference and percentile-point difference; rawDifferenceUnit labels percentage points when appropriate. Checks definition, dataset/hash, period, unit, geography; withholds incompatible/missing differences.
- POST /api/geocode: Census address-range interpolation with candidate confirmation and Census2020 cross-check. Legacy Selection.observations remains numeric strings/null. HTTP-200 candidate array can contain error entries; don't treat 200 alone as a usable selection. Exact addresses are not persisted; Census receives live queries.
- GET /api/demo: cached verified public Oakland/Fresno pair; optional demonstration, not required startup experience.
- GET /api/health: local file presence only, NOT hashes/source connectivity/scientific validity/rendering.

Source version pinning supported on new/named routes. Explicit unknown/unsupported IDs fail; no silent fallback. Error shapes and examples in BACKEND_CHANGES.md. No facilities API yet.

### Data/code pointers

- `data/raw/manifest.json`: original bytes, URLs, UTC timestamps, checksums; raw artifacts intentionally preserved byte-for-byte and treated as binary by .gitattributes.
- `data/contracts/indicator-evidence.json`, `scripts/verify_indicator_sources.py`: 13 scalar source contracts, generated `src/contracts/verified-targets.ts`, two final-service point checks.
- `src/contracts/indicators.ts`: registry; definitions/readiness promoted from generated verified targets. Demographic dictionary evidence separately applied. `observations.ts`, `map-response.ts`, `provenance.ts`, `bounds.ts`, `http.ts`: normalized/API correctness.
- `src/data.ts`: cached attributes/geometry, full lookup, selected-metric map join. `src/spatial.ts`: membership helper.
- `data/samples/breadth-api-v1.json`: real normalized samples including actual null/zero records; reproduce via scripts/prepare_breadth_sample.py against running main.
- `scripts/fetch_sources.py`: checks checksum and source URL on reuse; screens PDF/CSV/ZIP/JSON content, rejects HTTP-200 security/error pages, records new failures separately; no automatic retries.
- Full technical report and some direct fact-page downloads still return security HTML. Failures are labeled; **do not reuse as PDFs**. Final official app configuration supplied corroboration instead; no draft/old CES report substituted. Detailed weighting/uncertainty cannot be independently reconstructed from this bundle; compare publisher outputs honestly.
- Main-only ignored artifacts already present: data/lookup.json (~122 MB unsimplified WGS84), display.json (~14 MB, simplified 30 m in EPSG:3310 then reprojected), observations.json (~14 MB). Exact lookup does not use simplified display geometry. Tract IDs preserve leading zeroes. Don't ship full lookup to frontend.

## Verification completed before migration

Latest backend implementation pass (not rerun wholesale just for migration):

- 26 Node tests passed: all 23 fields over 9,106 tracts, raw/percentile null counts and zeros, source evidence hashes/assertions and two source point records, neutral legends, compatible/missing/same-tract/incompatible comparisons, invalid requests, spatial holes/boundary ambiguity/outside-CA behavior.
- Four Python download-cache regression tests passed.
- TypeScript and production build passed; restored main dev after build.
- Live smoke checks passed for all 23 named maps, normalized values and comparisons, real suppressed health record, version/error handling and legacy map compatibility on BOTH :3000 and :3001.
- At migration only root/health/catalog availability was freshly checked; no claim of new comprehensive UI/accessibility/performance validation.

Useful bounded commands (from main):

```sh
npm test
.venv/bin/python scripts/test_fetch_sources.py
npx tsc --noEmit
python3 scripts/smoke_backend.py --origin http://127.0.0.1:3000 --origin http://127.0.0.1:3001
```

Node 26 / Python 3.14 tested. Compiler is TypeScript 7; its package did not expose the old transpileModule API. Tests use Node stripTypeScriptTypes in isolated temp modules via tests/load-backend-modules.mjs; an experimental warning is expected. No shared tsconfig changes or new dependencies were needed.

Only regenerate ignored geometry if missing/changed, using README commands. To rebuild current contracts, scripts/verify_indicator_sources.py validates cached originals and generates verified-targets.ts; format with installed Prettier afterward. Do not redownload sources merely to redo known checks. Regeneration needs backend restart because process-cached data are intentional. Refresh derived-manifest hashes after changed artifacts via scripts/write_derived_manifest.py.

## Frontend snapshot — independent session report, not backend certification

Frontend HEAD remains the baseline, with uncommitted tracked changes in .hallmark/log.json, app/layout.tsx, app/page.tsx, src/AtlasMap.tsx, src/map-theme.ts, tests/ui/atlas.spec.ts; untracked design.md, docs/ASTRA_FRONTEND_PROMPT.md, docs/FRONTEND_PROGRESS.md, src/frontend/, src/styles/. These files are live work; recheck status before any integration.

Read `/Users/anand/Projects/hackathon.frontend/docs/FRONTEND_PROGRESS.md` directly. It now reports a map-first, multi-location foundation, independent preview provider with explicitly synthetic facilities/demographics/scenarios, four passing UI tests and frontend production builds. Backend did not independently rerun those checks during migration. Never call synthetic preview facilities verified real coverage.

Frontend brief records user-approved single full-screen California startup, no automatic example comparison, optional multiple addresses/panes. PRODUCT/EXPERIENCE still describe an earlier two-address starting composition. **Do not revert frontend to old composition based on stale planning prose.** Reconcile canonical plans with the user/other session at an integration checkpoint.

Reported frontend remaining requests:

1. More live scalar layers: backend NOW supplies all 13, but frontend progress still says its live adapter whitelists PM/ozone. Have frontend read catalog v1.2 and latest BACKEND_CHANGES; no backend-code merge is needed to consume live JSON.
2. Grouped age/racial composition contract: individual normalized fields/definitions/periods/null semantics now available; frontend preview uses group IDs. Agree explicit grouping, denominator and rounding/suppression handling rather than inventing a new aggregation or normalizing missing shares to 100.
3. Real facility endpoint still absent. This is next backend milestone.
4. Frontend owns visual polish, larger comparison overview, hover/inspection refinement, keyboard/a11y edge cases and measured pane performance. Provider missing highway-shield sprite reported; don't claim it resolved.

## Next backend milestone — ordered first actions

1. Inventory current state and read latest frontend progress; keep code ownership intact. Refresh only inexpensive availability/status checks. Explain planned work to the user.
2. Read FACILITY_SOURCES.md **including its main-session follow-up**, not just the older table. Metadata/sample originals are cached in data/facility-verification; service/item metadata and county statistics in data/raw.
3. Find a suitable first-party statewide healthcare feed and verify permissions, snapshot, categories, CRS/status, coverage. The PDF's LA-hosted CDPH copy has **3,620 records, all Los Angeles County**, so cannot satisfy statewide healthcare. No substitute chosen yet. Don't use an account/paid service to bypass a blocker.
4. Schools: CDE 2025–26 snapshot; samples/leading-zero CDS IDs verified, county grouping has 58 operating-district groups but does not prove geographic completeness. Item license empty. Resolve reuse, full acquisition/pagination, missing coordinates/status and coverage.
5. Power: CEC feed includes out-of-state/null counties. Item points to CEC conditions. June 12, 2026 edit timestamp conflicts with old May 2022 description; neither is automatically an observation period. Establish reporting vintage, decode Retired_Plant and filter with valid California geometry. Preserve raw fields/nulls.
6. Complete one verified facility category through acquisition → normalized versioned artifact → documented query → meaningful spatial/distance checks before broadening. Proposed Facility contract: stable ID/category/name/coordinate/source/status/date; coverage/completeness descriptor. Distances are straight-line to published points, not travel time, service access, capacity or guaranteed nearest statewide.
7. Keep interface additions explicit in BACKEND_CHANGES; provide small real samples and errors/unavailability. Make reviewed local commits. No facility placeholder data presented as live. Fire/remediation points remain conditional.

After infrastructure: richer grounded comparison/story summaries, measured statewide payload/index/tile performance, fuller spatial validation, coordinated integration/combined UI checks. Sponsor/AI/voice/hosting remain optional and parked per user decision. Do not claim original scope finished merely because scalar APIs are ready.

## Resumed backend increment — supersedes next-milestone status above

2026-11-07: schools category is now complete through cached acquisition, versioned normalization, `/api/facilities` viewport/nearest queries, distance/coverage tests and both-port HTTP smoke. Read latest BACKEND_CHANGES.md and FACILITY_SOURCES.md. 9,946 schools / all coordinates / 58 geographic counties; Active and Closed retained. Rights resolved from cached state catalog. Healthcare/power remain unavailable. Next concrete source investigation: statewide CDPH listing candidate linked there, followed by CEC vintage/status gates. No integration or frontend edits. Frontend HEAD observed `dd9d57e`, with `design.md` modified; recheck before coordination. Main/preview sessions preserved. This resume explicitly proceeds past the earlier departing-session pause.

## Sanity audit and healthcare continuation

After 746f2a5, audited plan/ownership/source/API claims and reran the existing 31 tests/cache/proxy checks. No ownership or scope drift found; repaired stale opening continuation/status prose. Added statewide CDPH healthcare via public DataStore (direct CSV/XLSX downloads 403): 14,921 snapshot records, 14,919 eligible query coordinates. All source status OPEN, extraction 2026-10-16, 57 CA county labels plus Curry OR. Nevada/Oregon out-of-CES points retained/flagged, excluded spatially. Dictionary coordinate-CRS inconsistency documented; two independent source points checked. See latest BACKEND_CHANGES for license/provenance/limitations and 34-test/build/smoke evidence. Next: CEC power gates. Frontend active and untouched; integration still requires user coordination.
