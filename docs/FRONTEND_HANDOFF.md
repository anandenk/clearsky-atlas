# Interactive frontend handoff — baseline v1

Current continuation: see [INTEGRATION.md](INTEGRATION.md) for the user-authorized combined desktop checkpoint, preserved refs, corrected findings and fresh checks. The record below describes the earlier separate-session checkpoint and is historical where it differs.

Prepared 2026-11-07 for a user-run interactive frontend session. No frontend worker is launched. Full original target remains in PRODUCT.md; this handoff exposes current evidence without declaring every backend issue resolved.

## Checkout, baseline and connection

- Backend/integration session: `/Users/anand/Projects/hackathon`, branch `main`, API origin `http://127.0.0.1:3000`.
- Frontend session: `/Users/anand/Projects/hackathon.frontend`, branch `frontend/atlas-interactive`, UI origin `http://127.0.0.1:3001`.
- Immutable baseline: local tag `frontend-handoff-v1`, created at the reviewed commit containing this document before Worktrunk creation. Resolve the exact SHA with `git rev-parse frontend-handoff-v1`; the frontend branch initially has that same HEAD. Later backend commits do not move the tag.
- `next.config.ts` proxies `/api/:path*` in `beforeFiles` when `ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000`. This overrides checked-out local API routes. Browser calls remain relative, avoiding CORS. No backend data copies or symlinks are needed in the frontend tree.
- Main must run without `ATLAS_BACKEND_ORIGIN` (otherwise requests loop). Backend data edits are served from main; module-cached datasets need backend restart after regeneration. Frontend source/type changes in main do NOT appear in the frontend tree automatically.

```sh
cd /Users/anand/Projects/hackathon.frontend
npm ci  # only if node_modules is absent; own install, baseline lockfile
ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000 npm run dev -- --port 3001
# Separate terminal, against the frontend preview:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:ui
```

The setup session installs dependencies and smoke-checks this proxy. If a preview already listens on 3001, reuse it; do not start a second server. Check `tmux capture-pane -p -t atlas-frontend-preview -S -30`. Backend session is `atlas-local-server`. Each worktree has its own node_modules and .next. Framework-generated next-env.d.ts may change between dev/build; do not hand-edit it. Read relevant installed `node_modules/next/dist/docs/` before code changes.

`npm run build` builds UI code, but a successful build is not evidence of rendered map correctness. Run it after stopping YOUR :3001 dev server, without overwriting an active .next directory; then restart the preview with the same proxy environment. `npm test` needs backend ignored generated datasets, intentionally absent in the frontend worktree; backend owns/runs those tests. Do not rerun acquisition to make frontend tests work.

## Exact ownership — no concurrent editing

| Paths | Sole owner |
| --- | --- |
| `app/api/**`, `src/data.ts`, `src/spatial.ts`, new `src/contracts/**` | Backend session |
| `data/**`, `scripts/**`, backend tests outside `tests/ui/**` | Backend session |
| `src/domain.ts`: shared Selection/Metric types, indicator metadata, numeric helpers | Backend/integration session; frontend imports read-only |
| `app/**` except `app/api/**`, including entry points `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Frontend session |
| `src/AtlasMap.tsx`, `src/map-theme.ts`, new `src/components/**`, `src/hooks/**`, `src/styles/**`, `src/frontend/**` | Frontend session |
| `tests/ui/**`, `playwright.config.ts`, `.hallmark/**`, `public/ui/**`, `docs/FRONTEND_PROGRESS.md` | Frontend session |
| `package.json`, all lockfiles, `next.config.*`, `tsconfig.json`, all other root config, AGENTS.md, README.md | Backend/integration session |
| `public/maplibre/**` (generated worker assets + license), source/provenance docs, this handoff, STATUS.md, BACKEND_CHANGES.md | Backend/integration session |
| `next-env.d.ts`, ignored `.next/**`, node_modules | Generated per worktree; no manual concurrent edits |

Unlisted paths default to backend/integration ownership until a written handoff assigns them. Frontend may run npm ci from the frozen lockfile; request new dependencies or shared type/config changes through the user, and the integration owner applies them once. Do not symlink node_modules, change lockfiles, or independently install packages. Frontend owns interaction/rendering; backend owns data correctness and definitions. Rendering colors moved out of shared domain.ts into frontend-owned map-theme.ts before branching. No visual redesign is preselected for the second session; user directs it interactively.

## Contract stability

**Stable for this checkpoint:** current routes and response shapes below, 11-digit tract IDs, longitude-first WGS84 coordinates, explicit nulls, source percentile domain 0–100, distinction between full lookup/display geometry, same-tract observations. Backend will keep existing shapes backward compatible during frontend work. New keys/routes may be added; do not require exact object-key sets.

**Provisional implementation:** Selection observations are raw numeric strings or null, not normalized numeric observations; metadata is currently a single PM definition in domain.ts; dataset version is not yet embedded in every response; no per-indicator map API or facility endpoint exists. `compare` currently accepts an explicit compatibility boolean, not a complete version-aware policy. Do not treat this as a final all-indicator model.

**Unresolved source contracts:** PM raw unit corroboration, other indicator periods/units/quality thresholds, facility licensing/completeness. Those are evidence work, not a frontend design decision. The backend will announce metadata/API additions in BACKEND_CHANGES.md; do not fabricate future endpoint responses and present them as available.

## Available indicators and intended breadth

CES 5.0 final release July 1, 2026, 2020 Census tracts; 9,106 joined records. All target fields below exist locally. Only PM2.5 is active in the baseline registry/UI. A data field being present does not make its evidence contract approved. Full details and measured null counts: DATA_VERIFICATION.md and data/validation.json.

| Indicator / fields | Definition and unit | Measurement period / readiness |
| --- | --- | --- |
| PM2.5 `pm` / `pmP` | Tract-average fine particle concentration. Existing UI uses standard µg/m³; final-report unit corroboration is still pending. Monitor/satellite estimates, wildfire-smoke days excluded. | 2022–2024 verified through official fact sheet web extraction; active with disclosed unit gap; zero raw/percentile nulls |
| Ozone `ozone` / `ozoneP` | May–October daily maximum 8-hour concentration; unit not yet verified | Years unresolved; inactive |
| Diesel particles `diesel` / `dieselP` | Emissions near populated blocks; unit unresolved | Years unresolved; 9 nulls; inactive |
| Traffic `traffic` / `trafficP` | Vehicle-km/hour per road length near tract boundary | Years unresolved; 9 nulls; inactive |
| Toxic releases `RSEIhaz` / `RSEIhazP` | Toxicity-weighted air concentration; unit unresolved | Years unresolved; inactive |
| Cleanup `cleanups` / `cleanupsP` | Weighted proximity sum, not a count of nearby facilities | Source snapshot unresolved; inactive |
| Asthma `asthma` / `asthmaP` | Age-adjusted emergency visit rate; denominator needs verification | Years unresolved; 33 nulls; inactive |
| Heart attacks `cvd` / `cvdP` | Age-adjusted ED visits per 10,000 | Years unresolved; 26 nulls; inactive |
| Diabetes `diabetes` / `diabetesP` | Model-based adult 18+ prevalence; exact unit/model contract pending | Years unresolved; 36 nulls; inactive |
| Low birth weight `lbw` / `lbwP` | Percent infants under 2,500 g | Years unresolved; 234 nulls; inactive |
| Poverty `pov` / `povP` | Percent below twice federal poverty level | ACS period needs indicator-specific confirmation; 50 nulls; inactive |
| Education `edu` / `eduP` | Percent aged 25+ with less than high school education | Years unresolved; 28 nulls; inactive |
| Housing `housingB` / `housingBP` | Percent low-income households severely burdened by housing costs; detailed threshold pending | Years unresolved; 64 nulls; inactive |
| Age `pop_und10`, `pop_10_64`, `pop_ov64` | Population percentages: under 10 / 10–64 / 65+; no hazard interpretation or source percentile | 2020–2024 ACS per dictionary; 25 nulls per field; charts not implemented |
| Demographics `hisp`, `white`, `black`, `amind`, `asian`, `pacisl`, `othmult` | Dictionary-defined racial/ethnic population percentages, not hazard scores; no percentile fields | 2020–2024 ACS per dictionary; 25 nulls per field; charts not implemented |

Healthcare/schools/power: metadata + two-feature samples only, no working facility API or complete imported inventory. Supplied healthcare layer is LA-only (3,620 records), schools 2025–26, power includes out-of-state records. Remediation points and fire remain conditional on suitable sources. Infrastructure controls must not pretend coverage or access exists.

## Nulls, percentiles and comparison

- Selection.observations: `{ [sourceField: string]: string | null }`. Parse with numberValue; do not use Number(null), truthiness, or `value || 0`. Preserve valid zero. `tractId` is a zero-padded 11-character string; never numeric arithmetic on IDs.
- Map feature properties use numeric values or JSON null. `properties.id` equals Selection.tractId. There is no guaranteed top-level Feature.id; set promoteId if rendering requires it.
- PM percentiles are supplied by CES. Map both places on one 0–100 statewide domain. Never calculate a percentile from just the currently loaded viewport, treat it as raw concentration, or call percentile-point differences percent change.
- For some CES fields, source zero-percentile conventions exclude zero raw values from percentile calculation; definitions matter before enabling more layers. Do not infer percentile denominator from 9,106 automatically.
- Missing raw or percentile: render an explicit unavailable state. Missing raw data suppresses the raw difference. Same tract gives equal tract observations; this says nothing about identical properties. Compare identical source versions, periods, units and definitions only. Unit provenance remains disclosed for PM.
- Census coordinates use address-range interpolation, not rooftop precision. User confirms the matched label. Exact polygon lookup does not make an imprecise geocode exact. Multi-tract membership or disagreement with a returned Census2020 ID is withheld, not arbitrarily assigned.

## Representative verified sample

`data/samples/frontend-v1.json` is a small, real extract, reproducible with backend-owned `scripts/prepare_frontend_sample.py`. Contains the exact baseline Selection[] example response, two extracted display polygons, and a real missing low-birth-weight observation. No invented locations, measurements, or missing values. The missing observation is a tract-only case, not an address and not an active health layer.

| Example | Tract | PM raw / percentile |
| --- | --- | --- |
| 125 14TH, OAKLAND, CA, 94612 | `06001403402` | 8.325309645 / 44.3663518559192 |
| 2600 FRESNO ST, FRESNO, CA, 93721 | `06019000602` | 12.47532712 / 97.7597188666813 |

Coordinates are in the sample. Geocodes, full CES membership, Census2020 IDs and live CES ArcGIS point query values agree at both locations; original responses and CSV hashes are preserved. A separately cached 129 14TH Oakland 94612 match has distinct coordinates but the same tract as example A. An Oakland query without ZIP once matched East 14th, so never silently accept approximate input as the intended address.

Use this extract for honest UI development/failure fixtures. Synthetic network-failure/race fixtures are acceptable in tests when labeled as tests; do not display synthetic observations as live evidence.

## Geometry and assets

- Source: `data/raw/ces.shp.zip`, EPSG:3310 NAD83 California Teale Albers. Exact transformed WGS84 lookup: ignored `data/lookup.json`, main only, ~122 MB disk. Never ship it to the browser or infer membership from simplified display polygons.
- Display: ignored `data/display.json`, ~14 MB statewide, polygons simplified 30 m in source CRS then transformed to WGS84. API filters by bbox intersections; it returns whole selected features, not clipped geometry. No vector tiles/PMTiles available yet.
- Current map properties: `id`, `place`, `county`, `pm`, `pmP`, `ozone`, `ozoneP`; the ozone fields being present does not authorize displaying a fully verified ozone story. Shapes are Polygon/MultiPolygon in a FeatureCollection, longitude/latitude, optional bbox retained.
- MapLibre workers: `/maplibre/maplibre-gl-worker.mjs`, shared asset and LICENSE.txt, generated during npm ci by postinstall. Use the explicit worker URL to avoid the earlier bundled-worker 404.
- OSM browser raster tiles require internet and visible attribution; no bulk/offline tile downloads. Current Google Fonts require internet. No imagery assets, terrain DEM, buildings, facility layer or design screenshot is a data source. Frontend may add owned visual assets in public/ui/.

## Current API interfaces — baseline v1

All routes are anonymous, local, same origin through frontend proxy. No CORS change is needed. New searches are POSTed to the local API and forwarded to Census; exact addresses are not persisted by the application. External Census receives the query. Use abort/request IDs to prevent stale state. No facility or individual-tract endpoint yet.

### GET /api/demo

200: `Selection[]` in A=Oakland, B=Fresno order. Fields:

```ts
type Selection = {
  label: string;
  coordinate: [number, number]; // longitude, latitude, WGS84
  tractId: string;             // 11 digits, California prefix 06
  place: string; county: string;
  observations: Record<string, string | null>;
  cached: boolean;             // geocode was a cached example, not a live lookup
  censusTract?: string;
  precision: string;
};
```

No version envelope currently. Failed server data preparation may produce a non-JSON framework error; check HTTP status before parsing. Cached does not mean the basemap works offline.

### POST /api/geocode

Request: JSON `{ "address": "125 14th St Oakland CA 94612" }` with Content-Type application/json.

- 200: `{ "candidates": (Selection | { "error": string })[] }`. Each valid selection needs confirmation, even if there is only one candidate. Outside-California and tract mismatch errors can occur inside this 200 candidates array. Do not assume HTTP 200 means every candidate is usable.
- 400: `{ "error": string }`, input string length outside 6–240.
- 404: `{ "error": string }`, Census returns no address match.
- 503: `{ "error": string }`, network/upstream failure, timeout (20 seconds), malformed JSON or caught failure. Error categorization is provisional; existing response keys remain supported.

Benchmark Public_AR_Current; geography Census2020_Current. Do not hardcode a confidence percentage; source supplies none in this adapter.

### GET /api/map?bbox=west,south,east,north

Example: `/api/map?bbox=-122.28,37.79,-122.25,37.82`.

200: GeoJSON FeatureCollection with properties described above. Empty coverage is an empty features array, not fake data. Baseline accepts four finite ascending bounds; stricter validation may be added as a bug fix. 400: `{ "error": "Invalid bounds" }`. Cache-Control currently public, max-age=86400. Data are immutable for this CES release; a future dataset change will need versioned cache handling.

Current metadata is imported from src/domain.ts. A future `/api/indicators` is proposed, **not available at baseline**; backend will document when it becomes live. Existing frontend code hardcodes PM and will need an explicit frontend change to consume a future registry; new data do not automatically make controls functional.

## Integration and updates

Backend writes `docs/BACKEND_CHANGES.md` on main with dates, actual new routes/fields, verification and compatibility notes. You can read that absolute main-worktree file without modifying it; it is not automatically synchronized into this checkout. Frontend writes `docs/FRONTEND_PROGRESS.md` in its tree and reports owned changes, requested shared changes, tests and unfinished work through the user.

While frontend edits are active: no automatic merge, rebase, cherry-pick, shared-type refresh, or worktree cleanup. Before integration, user coordinates a checkpoint: frontend pauses with a reviewed commit, main reviews complete diff including new files, agrees contract compatibility, merges explicitly, and runs backend plus rendered-interface checks. If backend changes affect shared types, agree an isolated cherry-pick of only integration-owned paths during a checkpoint; do not overwrite the frontend tree. Main remains integration owner. Do not push, publish, deploy, buy services, change global configuration, or launch another agent.
