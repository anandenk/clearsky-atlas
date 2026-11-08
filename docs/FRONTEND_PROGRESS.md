> **Current direction: ClearSky.** Read the final section, **ClearSky implementation handoff for Astra — 2026-11-07**, before continuing. The earlier Common ground/Astra assignments below are historical implementation evidence. Their visual direction and frontend-first preview workflow are superseded by the latest user discussion recorded in that section. AGENTS.md ownership and local-only boundaries still apply.

# Frontend creative reset — Common ground

2026-11-07. This replaces the rejected frontend design. The authoritative assignment is ASTRA_CREATIVE_RESET.md. Work remains local in `frontend/atlas-interactive`; no merge or integration into main has occurred.

## Recoverable checkpoints and ownership

The rejected frontend, its design/source documents and original tests were reviewed and preserved in local commit **dd9d57e**, before replacement. The reset changes only frontend-owned application, presentation, adapter, asset, test and design/progress paths. No dependencies were added, no root/shared configuration or backend data were edited, and no additional agents were used. The existing :3001 preview proxies relative `/api/*` requests to main :3000.

## Creative decisions implemented

**Common ground** is a continuous cartographic field with a comparison canvas that opens beneath it. It replaces the stacked toolbar, repeated map grid and scrolling evidence sidebar. Custom OpenFreeMap vector colors use a blue Pacific, porcelain land, lavender buildings and ink labels; domain-specific tract ramps remain on shared 0–100 scales. Locally served DM Sans and DM Serif Display, original contour identity and location colors are shared by controls, map pins and graphics. Font licenses and basemap attribution are retained in public/ui/.

The first view is an explorable California map with no loaded examples. The floating domain dock changes the lens. Address search confirms every match, including cached Oakland/Fresno examples. A single persistent WebGL map keeps every selected pin; Together frames the collection, while a place chip or plotted row focuses a neighborhood. Place menus support replacement, removal, reference selection and reordering. Narrow screens keep every place in a horizontal collection and all comparison evidence below the map.

Adding another place opens **At a glance**: separate source-percentile tracks for each measure, using the same 0–100 domain. The view identifies the widest and closest compatible percentile spreads as descriptive navigation, not importance, causation or significance. Clicking a track opens its raw values, reference differences, statewide positions, definition and source. Percentage-valued raw differences use percentage points. Same-tract addresses retain distinct pins and share evidence. Incompatible and missing observations do not receive fabricated differences.

Population age and racial/ethnic groups use neutral composition bars and raw population-percentage maps, never manufactured hazard percentiles. Every category remains available and selectable; nulls are explicitly named. Definitions, distinct measurement dates, original source links and interpretation limits are in a focused dialog.

## Live and preview integration

Live catalog v1.2 and normalized version-pinned tract responses support all 23 intended fields. Each selected tract's observation bundle is fetched once and reused for smooth question changes. Per-place failures remain independent. Catalog, geocode, map and inspection requests are cancellable; no live failure falls back to fixtures.

Backend changes became available during the pass. The frontend additionally consumes the additive facility v1 API for **CDPH healthcare (2026-10-16 snapshot)** and **CDE public schools (2025–26)**. Up to six nearest records per category are shown around the focused place, with source-qualified straight-line distances. A per-place table compares nearest distances in each source inventory. Markers and list entries open the same facility dialog, preserving source name/status/date/type/flags and limitations. Healthcare markers are not all walk-in care; published points are not guaranteed entrances, and school snapshots do not establish current operation or eligibility. Category failures are independent. No shared type refresh was needed.

Power plants remain an explicitly separate deterministic synthetic preview, along with synthetic examples of all domains and scenarios. Preview is opt-in and persistently labeled. Provider switches clear incompatible selections, abort pending search/evidence work and separate records. The complete preview supports missing, valid-zero, incompatible and failure scenarios. Synthetic map cells are identified as synthetic geography; they are not census boundaries.

## Motion implemented and measured

- Interruptible 700ms map/canvas size transition, with one retained map instance.
- 1100ms spatial camera flights on place selection/focus; fit selected places together.
- 650ms shared-scale bead movement when changing measures; domain-specific map fills and active controls change with the question.
- Short context entrances, responsive focus/hover states and native dialog focus containment.
- Reduced motion removes visible transitions and uses zero-duration camera changes.
- Old metric shading is hidden before a newly labeled layer is shown; stale requests are cancelled.

Browser frame sampling is saved to ignored `artifacts/creative-reset/motion-samples.json`. It verifies intermediate layout heights, intermediate chart positions, interruption/reversal and stable map instance identity. This is evidence of executed animation, not a blanket 60fps/performance certification. There were occasional long frames while MapLibre resized. External vector tiles remain network-dependent.

## Visual critique and corrections

Reviewed actual first-view, address, comparison, live domain, infrastructure and narrow-screen screenshots. Corrections made after review:

- Enlarged evidence type and added the multi-measure comparison profile instead of presenting only an isolated metric.
- Shortened the profile heading and fixed its location legend alignment.
- Removed a four-pixel horizontal overflow at 320px.
- Folded layer choices on the mobile first view so the map remains usable; expanded selected-place map height to 500px.
- Kept place menus accessible when the place ribbon scrolls, preserved cameras through reorder and adapted overview framing at the narrow breakpoint.
- Moved facility details into a focused dialog so long names, source facts and limitations are readable.
- Fixed Escape behavior in search and verified modal focus return.

## Verification

Final verification results and exact remaining limits are appended below after the last run. Earlier failures were corrected, not counted as passing checks. Backend tests/acquisition were not run from the frontend checkout. The backend owner briefly restarted :3000 during an early screenshot run; that run observed a real proxy connection failure and was rerun after the backend recovered. This session did not restart the backend.

## Remaining work and concrete triggers

- **Live power plants:** connect when main documents a ready facility category and verified source date/status/coverage contract. Power interaction works in the separate preview today.
- **Optional terrain/buildings/AI/voice/shareable views, conditional fire/remediation:** retained from the full inventory; not added to this visual reset. Revisit after user acceptance of the replacement and relevant source/integration authorization.
- **Performance:** one WebGL context is retained for any collection size. Statewide GeoJSON still requires a large payload; production/device profiling and a backend tile/index strategy are next if measured target-device behavior requires them. This pass does not claim a universal animation frame rate, offline map support or full accessibility certification.
- **Dense collections:** six selected places are exercised. More remain in the scrollable collection/profile; large-collection overlap and touch ergonomics deserve additional device review.
- **Integration:** user review comes next. Main retains integration ownership. No merge/rebase/cherry-pick of active work; coordinate a paused checkpoint, review the full diff, then run combined checks. No dependency/config requests are outstanding.

## Final verification and review checkpoint

- `npx tsc --noEmit`: passed.
- `npm run build`: passed (Next 16.4.5), with only the frontend preview stopped. This verifies the frontend build; the worktree is still an integration branch, not an independently deployed full backend. Preview restored with the existing :3000 proxy afterward.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:ui`: all seven tests passed before the final motion refinement. After that refinement, the live breadth/search/error cases passed again; temporary live API HTTP 500s blocked the final two live setup steps. After backend recovery, all four affected motion/rendering/collection/responsive tests passed together (37.1s). No test failure was hidden by synthetic fallback or automatic fixture substitution.
- Actual live checks: confirmed Oakland, Fresno and Los Angeles addresses; three-place comparison; all 23 catalog fields against their normalized raw observations; live selected layers; neutral demographic maps; source links and dates; healthcare/school list and rendered marker linkage; rendered tract inspection; independent school-source failure with healthcare retained.
- Preview checks: six locations with one map; replacement/reference/reorder/remove; zero/null/incompatible/failure states; all three facility categories; source separation on return to live.
- Responsive: 320, 375, 414, 768 and 1440px; no horizontal page overflow at the tested widths; narrow collection and all evidence retained. Keyboard search dismissal, dialog containment/focus return and reduced motion exercised.
- Motion: sampled real `requestAnimationFrame` progression, verified intermediate geometry and bead positions, interrupted/reversed the canvas reveal and rapidly switched domains. Map instance and WebGL drawing-buffer size remain stable during desktop canvas motion. Samples and screenshots are under ignored `artifacts/creative-reset/`.

Final visual review found and corrected two additional issues: MapLibre 6 bounds padding is additive by default, so framing now uses `absolutePadding: true`; and resizing the WebGL canvas every animation frame could produce a blank intermediate frame, so desktop motion now clips a stable drawing surface. A regression verifies restoration of California after clearing mobile selections. Intermediate screenshot `motion-midpoint.png` was inspected with map geography visible.

Preview map values and percentiles now share the same deterministic fixture helpers as the charts, including null/zero handling; synthetic non-selected cell IDs no longer collide with selected place IDs.

No root configuration, lockfile, shared types, API handlers or backend data changed. No push, merge, deployment or publication. No outstanding dependency request. The frontend is paused for the user's visual feedback and eventual Sol handoff.

## Field-guide comparison and cartographic refinement — 2026-11-07

User-directed continuation of Common ground, with frontend-design as the creative lead; previous design-skill constraints were not loaded. Existing clean HEAD `14a7215` was preserved before editing with local tag `checkpoint/frontend-before-comparison-20261107`. No additional agents, dependencies, backend/shared configuration changes, merges, pushes or deployments.

### Built and critiqued

- Replaced the miniature multi-measure dot plot with a field guide: readable raw values/units, aligned place columns, secondary statewide-position bars, and explicit named high/low differences. Wider/closer percentile-position findings guide exploration without claiming significance or overall ranking. Source compatibility and null handling remain mandatory.
- Mobile comparisons use a section per measure, a two-column grid of labeled places, and an interpretation underneath. The first scrolling-table attempt was rejected during screenshot review. Several desktop places use horizontal scrolling; six-place behavior was exercised.
- Extended the same readable raw-share presentation to all age and racial/ethnic groups. Infrastructure adds source-qualified distance ranges and nearest-place statements, with access/eligibility/travel limitations adjacent.
- Diagnosed patchwork from actual tract edges, all-tract boundary mesh, high fill opacity above map features, and synthetic cell gutters. Retained true live polygons, reduced fill opacity to 52%, removed low-zoom outlines, retained neighborhood detail, and put water/roads above thematic color. Synthetic rectangles remain synthetic, now contiguous; no inferred smooth field or fabricated live geography.
- Enlarged the desktop canvas and corrected camera padding to use its actual measured height. Corrected an intermediate blank layout gap. Existing motion and one map instance remain. Settled-map screenshot confirms both pins and the regional wash after data arrival.
- Rewrote design.md around the actual result. Definitions remain in the focused measure/source view; removed repeated long definitions from the overview after visual critique.

### Performed verification

- `npx tsc --noEmit`: passed.
- `npm run build`: passed, with only frontend :3001 preview stopped; restored afterward with the existing backend proxy. Final small copy corrections were typechecked after the build.
- Full Playwright suite: **8 passed in 58.6s**. Includes live three-place selection, all 23 live fields, six-place synthetic collection edits, zero/null/incompatible/source-failure cases, source separation, infrastructure markers/filters/failures, keyboard and reduced motion, rendered tract inspection, and sampled intermediate/interrupted transitions with one map instance.
- Added a regression asserting Oakland/Fresno raw PM values, named 4.15 µg/m³ difference, pins inside the visible map, mobile side-by-side value alignment, and no document overflow at 320/375/414/768px.
- Initial test run overlapped development and failed on removed dot/stacked-bar selectors; one hot-reload run also observed a map-style-loading error. Updated presentation assertions and reran the full suite on settled code; all passed. These early failures are not counted as successful verification.
- Inspected actual Chromium screenshots before/after, desktop and mobile, plus existing suite screenshots and motion sampling. In-app browser host was unavailable; used installed Playwright/Chrome. Python Playwright was unavailable, so the repository's existing Node runner was used without installing dependencies.
- Screenshots under ignored `artifacts/field-guide/`: before-comparison.png, settled-map.png, verified-desktop.png, verified-mobile.png. The settled-map capture waits for geographic data; earlier captures can show basemap before the large GeoJSON completes.

### Remaining work / review boundary

- Await user visual review of the new information hierarchy and quieter map. Real tract geometry still includes angular boundaries; smoothing would falsely imply finer geographic resolution. Preview remains explicitly synthetic.
- The full multi-measure desktop guide scrolls vertically; larger collections scroll horizontally. Actual touch-device ergonomics and very large collections remain unverified beyond the tested responsive widths and six examples.
- Large regional GeoJSON can arrive after the basemap; backend tile/index delivery remains a future integration trigger if target-device performance demands it. No universal frame-rate or complete accessibility certification claimed.
- Live power, optional terrain/buildings/AI/voice/shareable views, conditional fire/remediation, and integration deferrals from the earlier entry remain. Revisit after visual acceptance and the corresponding backend/source contract. No new dependency/configuration request.

Stopped for local visual review; integration remains with the main session.

## Follow-up: shading across zoom levels — 2026-11-07

User screenshots exposed a missed neighborhood-zoom issue: inserting thematic layers before water also put residential land-use polygons above them. Residential fill stops at zoom 16, so its pale overlay disappeared while the underlying measurement remained unchanged.

Fixed the frontend-owned vector style by grouping every ground fill below water/thematic insertion. Water, roads and labels remain above the environmental wash. Reduced building opacity from 55% to 16% and removed its outline so footprints remain quiet context. No measurement, ramp domain, tract geometry, backend file or dependency changed. The prior uncommitted work is preserved as `artifacts/zoom-fix/before-fix.patch` in addition to the earlier checkpoint tag.

Verification: TypeScript passed. Added and ran a Playwright regression checking the served style's layer order, subdued buildings, live Fresno Traffic rendering through five zoom-in steps to the disabled maximum-zoom control, return zoom, retained map instance and no browser runtime errors. Inspected neighborhood screenshots under `artifacts/zoom-fix/`. This targeted correction does not require a backend change; the prior full-suite/build results above remain separately dated evidence. External map tiles still depend on network availability. Stopped for visual review.

## Follow-up: incorrect overlay flash on indicator switch — 2026-11-07

Root cause: the two alternating GeoJSON buffers retain old rendered tiles while `setData` processes new data in a worker. Previously the incoming buffer was made visible immediately, briefly exposing an earlier indicator. Opacity-only hiding did not protect reused tiles or outlines.

Changed `src/AtlasMap.tsx` to tag every render update with a unique internal token and filter fill/boundary/selected/inspection layers to the matching token. Await the installed MapLibre version's `setData` promise, recheck cancellation/generation/map identity, then reveal only the current update. Hide outgoing filters immediately, disable old-color interpolation, and prevent superseded errors from clearing a newer layer. Source measurement fields and geographic geometry are untouched.

Added `tests/ui/map-switch.spec.ts`: test-only blank basemap and deliberately different polygon coverage, a 16,000-feature worker update under 4× CPU throttling, pixel samples checking that an old full-screen polygon never reappears in its reused buffer, and rapid indicator switching. Targeted regression passed (7.8s); TypeScript and diff whitespace checks passed. Full browser-suite result follows below. Test fixtures never become application preview/live records.

The completed switching-fix suite before the next refinement passed **10/10 tests (2.0m)**, including the new stale-buffer pixel test and zoom regression.

## Follow-up: stable ground color and smooth loading/unloading — 2026-11-07

Further user screenshots showed the previous zoom fix was insufficient. Two issues remained: a translucent thematic fill still blends with zoom-dependent land-use polygons below it, and already-open maps do not reload a modified static JSON style automatically. The analytical vector basemap now makes non-water ground fills transparent and uses faint building outlines instead of filled footprints. A versioned style URL participates in the map effect dependency so corrected styles reload in an open development page. Map colors/measurements and real tract geometry are unchanged.

Overlay lifecycle now fades outgoing thematic fills and outlines for 180ms, waits for worker processing **and source tile readiness**, then fades the requested data in for 450ms. Interaction with the outgoing layer is disabled and a changing-layer status is displayed. Frame-token filtering and cancellation protect reused buffers. Viewport refreshes keep the old display until ready and swap without repeated fades. Facility circles/strokes follow the same out/load/in sequence; selected-marker radius changes are separate from data replacement. Reduced motion uses zero durations.

The backend temporarily refused connections during verification; no backend session was modified. It later recovered. The isolated pixel regression now supplies its own explicitly test-only catalog and map responses, avoiding dependence on backend availability. Initial zoom tests failed during that outage; a pixel assertion was also adjusted to allow the near-white surface color while still rejecting stale purple shading. After these corrections, the targeted switching and zoom tests passed. Measured fade-in red-channel samples were 246, 237, 224, 206, 190, 180, 173, 169; outgoing samples included 246, 247, 249, 250. These are rendered pixel samples, not inferred CSS behavior. TypeScript passed after correcting a paint-property union type.

Live Fresno screenshots, including airport-area zooms, are under ignored `artifacts/overlay-motion/`. Full final suite/build results follow below. Earlier changes remain preserved in `artifacts/overlay-motion/before-refinement.patch`. No dependency, API, shared config or backend file changes.

Final verification for this refinement: **10/10 browser tests passed (1.7m)**; TypeScript and production build passed. Only the frontend preview was stopped for the build and restored with its :3000 proxy. Visually inspected the live airport-area close/max/return screenshots: ground tint remains consistent while roads and faint building outlines gain detail. The suite also exercised all live domains, six-place preview, mobile widths, null/zero/incompatibility, reduced motion, marker/tract inspection and interrupted transitions. No universal frame-rate guarantee is implied. Work remains local and is stopped for user visual review.

## Follow-up: oversized switching-status background — 2026-11-07

User screenshot identified a CSS class collision missed by the prior tests. The per-overlay status reused `.map-loading`, already used by the initial dynamic-import placeholder with `inset: 0` and grid centering. Later declarations changed top/left but left right/bottom constraints, stretching a pale panel across the map. The prior near-white pixel samples during switching included this unintended panel; the earlier interpretation as ordinary surface variation was incorrect.

Renamed the overlay status to `.map-update-status`, with explicit auto right/bottom, intrinsic width, zero margin, block layout, constrained mobile width and no pointer interception. The initial module-loading placeholder remains separate. Added a delayed-response regression that holds the loading state and asserts a compact bounding box at 1440/375/320px, verifies no pointer interception, and confirms removal after completion. Inspected desktop/mobile screenshots in `artifacts/overlay-motion/loading-status-*.png`. Both switching tests passed (13.9s), including stale-buffer protection and newly unobstructed fade samples (outgoing red channel 168, 179, 213, 245, 255). TypeScript and diff checks passed. No full build/suite rerun was needed for this scoped CSS/class correction.

## Comparison redesign: compact side reading — 2026-11-07

Preserved the entire field-guide/overlay-fix work in local commit **4899c8d** before editing. Used frontend-design as the creative lead, without loading the earlier design-skill collection. No agents, dependency installs, backend edits, merges, pushes or deployment.

### Composition built

Replaced the bottom half-screen field guide with a compact left-side comparison panel. It uses a new component and scoped stylesheet rather than squeezing the previous table into a sidebar. Desktop retains a full-height map, with camera padding accounting for the pane. The panel is at most 420px wide (29% at 1440px), shrinks vertically for short readings, and withdraws sideways for More map. The existing map instance and overlay transition protections remain.

The overview is a measure index: actual raw values and units, stable letter/color identities and a higher/same/incomplete cue. Up to three places show every value. Larger collections explicitly show minimum/maximum endpoints and open into a reading containing all locations. No ranking across unlike measures, inferred hazard score or fabricated range. Source comparison keys still gate differences and nulls remain unavailable.

A selected measure replaces the index in place with a named difference, values, fixed-domain percentile/share bars and reference deltas. Definitions expand on request; sources remain in the existing dialog. The measure selector replaces the horizontally clipped topic strip. Community group shares use the same index/reading without hazard percentiles; health retains population-versus-personal-risk interpretation. Infrastructure shows source-qualified distance comparisons first, with longer facility listings behind a disclosure. Mobile uses a stable 460px map above the compact reading, without a wide table.

### Visual critique and corrections

Inspected actual desktop overview/detail, six-place preview, narrow views and infrastructure screenshots under ignored `artifacts/compass/`. Removed the leftover blank bottom of short readings by making the pane content-sized. Added the index higher/same cue, made six-place legends a compact grid, and separated preview ribbon/panel positions. Corrected place menus being intercepted by the new panel and duplicate accessible reopen controls after collapse. Three-value rows reserve a separate unit line to avoid crowding long values.

Initial verification exposed those menu and collapsed-accessibility issues (two failures); seven tests passed. Those failures were corrected before the final run. Tests were adapted to the new interactions rather than retaining obsolete table/bead selectors. The updated suite checks exact live comparisons, all 23 fields, six-place missing/zero/incompatible/reference behavior, sidebar geometry, pin visibility, responsive overflow, intermediate/interrupted panel motion, reduced motion, keyboard dialogs, request cancellation, source failures, map/marker inspection, and the prior pixel-level overlay and zoom regressions.

### Review limits and remaining work

The 1440×960 two-place environmental overview is explicitly checked to fit all six measures without scrolling. Shorter screens, expanded definitions, three long values or larger detail collections can scroll within the bounded panel. Mobile is an in-flow map-plus-reading layout, not a claim that all content fits one viewport. Full tactile device review and very large collections remain unverified. Infrastructure distances retain inventory/access limits; live power and the earlier optional-scope deferrals remain unchanged. Integration remains with the main session after user review.

Final verification: **9/9 browser tests passed**. The final visual critique additionally corrected camera padding to use the actual panel width at tablet sizes, made infrastructure kilometer units explicit, and suppressed partial endpoint pairs when a larger collection has incomplete evidence. The responsive/interrupted-motion test passed again (17.6s including runner startup), now checking both pins clear the pane at 768px; the six-place preview test passed again (6.4s), including the new unavailable-range assertion. TypeScript, production build and diff whitespace checks passed. Only the frontend preview was stopped for the build and restored on :3001 with its existing :3000 proxy. The framework regenerated next-env.d.ts during the build; it was not hand-edited. No backend or shared configuration changes. Work remains local for visual review.

## Follow-up: retain the previous overlay until replacement is ready — 2026-11-07

User requested removing the separate unload/load animation. Preserved the pre-change diff and untracked comparison files under ignored `artifacts/overlay-hold/` before editing.

Tract changes now leave the outgoing display untouched during fetch, GeoJSON worker processing and source-tile readiness. The ready replacement blends in over 450ms while the previous buffer fades simultaneously. Source-token filtering and cancellation remain; a buffer cannot be reused until its prior blend finishes. Same-measure viewport updates still swap without a repeated transition, and reduced motion is immediate. A failed tract request retains the last successful display with an explicit error instead of clearing the map. Pending layers cannot be inspected as the newly selected metric.

Infrastructure handoffs now wait for the selected place's inventory and rendered source. Existing markers remain while a tract replacement loads, then withdraw with its reveal. Facility data updates no longer perform a preliminary fade-out. Invisible markers are filtered after the handoff so they cannot remain queryable. The switching status remains compact.

Verification: the broader browser run passed nine tests, with one older animation assertion failing because its five samples ended before the delayed replacement transition progressed. Extended that assertion to cover the actual transition, then all four overlay regression tests passed (34.7s). Added delayed/superseded/failed-request pixel checks and delayed infrastructure-to-tract handoffs. The held pixel stayed at red=167 during the artificial delay; replacement samples progressed 167, 168, 170, 174, 181, 190, 203, 211, 217, 221 without a white gap. The infrastructure check also caught invisible markers remaining queryable; the final passing run includes that correction. Inspected retained-overlay and retained-marker screenshots in `artifacts/overlay-hold/`; test basemaps/geometries are explicitly synthetic fixtures, not live product evidence. TypeScript and diff checks passed. Production build passed. The frontend-only preview was restored on :3001 with its existing :3000 proxy; no backend, dependency or shared configuration changes.

## Follow-up: statewide resident overlays for continuous navigation — 2026-11-07

Investigation confirmed that every debounced moveend fetched a viewport bbox and rebuilt an alternating GeoJSON source. Zooming into a neighborhood replaced the statewide features with a small subset; zooming out needed another fetch/parse/worker rebuild and a visible coverage replacement. The baseline navigation run captured 11 completed regional responses as coverage contracted to 17 tracts then expanded to 2,831. Its response-body instrumentation did not retain the large startup response, so its byte total is not a complete session-transfer measurement.

Inspected the current main-worktree API and optional overview contract read-only. Standard statewide PM returns all **9,106 tracts / 15,702,991 decoded bytes** with existing 30m display simplification. The lighter overview is recommended only through zoom 7 and is not a neighborhood-geometry substitute. No backend changes or new dependencies were needed.

Implemented frontend-owned `StatewideOverlays`: fixed California bbox, explicit standard detail, current dataset-version pin, successful-response cache bounded to the two most recently used measures, no caching of failures/aborted responses, and explicit Retry invalidation. Removed camera-movement fetching entirely. Selected-place outlines now update separately from source geometry; live place collection edits no longer re-download/rebuild the map. Synthetic preview remains on its own path. Existing source-ready crossfades, frame tokens and stale-request protection remain for actual measure changes.

The resulting live navigation regression verifies one initial statewide request, zero further map requests through place selection/three zoom-ins/nine zoom-outs/panning, all 9,106 retained features, and a rendered overlay after navigation. Switching PM→ozone→PM makes only the ozone request; Retry fetches again. The five coverage/switching tests passed (50.0s), including delayed, superseded and failed requests and infrastructure handoffs. Inspected statewide zoom-out screenshots under `artifacts/statewide-overlay/`; no regional coverage cutoff remains. TypeScript and diff whitespace checks passed.

A separate local development startup sample measured 4,127,256 transferred bytes / 15,702,991 decoded bytes, 1,081ms resource duration and 3,346ms navigation-to-ready for PM. A navigation measurement recorded one map request and no runtime errors. These are single local Chrome samples with other local activity, not production/device latency guarantees. The retained data increases memory and first-load cost versus a neighborhood-only slice; no claim of mobile memory profiling. Do not prefetch all 23 full geometry payloads. Further improvement to first-time metric loading should be coordinated with the backend owner: a versioned shared-geometry + compact statewide values contract (or server vector tiles) would avoid transferring the same geometry per new measure. No backend work was performed or required to fix camera navigation. Original optional scope remains deferred as recorded earlier.

Final checks: the remaining seven browser tests passed (1.6m), covering all 23 live measures, comparison/source correctness, preview edge cases, mobile layouts, interrupted motion, keyboard/reduced motion, real map/facility inspection and zoom shading. Together with the five coverage/switching tests, all 12 browser checks passed across the two runs. Inspected the final mobile screenshot as well as statewide coverage. Production build passed; only the frontend preview was stopped and restored on :3001 with the existing :3000 proxy. Work remains local for user review.

## ClearSky implementation handoff for Astra — 2026-11-07

### Status and authority

The user wants an entire frontend rework named **ClearSky**, with one continuous geographic experience and a signature City View → Data Landscape transformation. The user will delegate implementation to **Astra in a new session**, superseding the earlier plan to use Sol. The six milestones, workflow, ownership and verification requirements are unchanged. This is a planning handoff: no ClearSky application implementation, dependency installation, commit, or integration happened in this planning pass. Do not interpret the historical test results above as verification of the proposed design.

This direction supersedes the visual/interaction instructions in ASTRA_FRONTEND_PROMPT.md, ASTRA_CREATIVE_RESET.md, design.md, and the older Common ground progress entries. In particular, do not follow the old instruction to complete unsupported frontend experiences first and attach the backend later. Work in complete, contract-led increments with real responses. Clearly labeled previews remain acceptable for isolated exploration/tests; they do not complete a live feature.

### Read first and preserve

- Work in `/Users/anand/Projects/hackathon.frontend`, branch `frontend/atlas-interactive`. Read AGENTS.md, README.md and its four planning links, then FRONTEND_HANDOFF.md. Older presentation proposals are historical; retain the full information inventory and evidence rules.
- Read main-worktree `/Users/anand/Projects/hackathon/docs/BACKEND_CHANGES.md` and `docs/READINESS_AUDIT.md` read-only. This checkout's baseline backend docs/types are older than the running API. Inspect relevant installed Next.js guides before coding.
- Preserve all intended existing frontend-owned tracked and untracked work in a reviewed local checkpoint before replacement. At planning inspection HEAD was `4899c8d`, with changes to app/layout.tsx, app/page.tsx, design.md, this file, src/AtlasMap.tsx, src/components/Infrastructure.tsx and UI tests; ComparisonPanel.tsx, map-coverage.ts, comparison.css and map-coverage.spec.ts were untracked. Recheck status; do not discard/stash them silently or stage another owner's files.
- Reuse frontend :3001 with relative `/api/*` calls proxied to main :3000. Do not restart main, copy backend data, or merge/rebase/cherry-pick active work. No additional frontend agent is authorized. Main owns dependencies, lockfiles, shared types/config and integration; request exact changes through the user.
- Keep all work local. No push, deployment, publication, purchase, billing/global change, sponsor work, or revival of archived source investigations. A merge requires a coordinated paused checkpoint.

### Visual reference and interaction

The user's supplied kepler.gl San Francisco screenshot is preserved byte-for-byte at `artifacts/clearsky-planning/reference.png` in this worktree. View it before designing. It is an ignored local visual reference, not a data source or an asset to ship; copy it explicitly if moving to a different checkout.

Aim for dense recognizable building geometry, navy ground, softly lit extrusions, readable geographic labels and minimal floating controls. The screenshot informs rendering quality, not a requirement to copy kepler.gl's editor panel. Original requested tokens: navy #0B1520, slate #243443, silver #CAD5D9, teal #5DBDB0, amber #F5C36A, coral #F17A70. The screenshot's blue/lavender/coral/peach ramp was proposed as a closer visual treatment; exact final tokens are not locked. Validate ordering/contrast and keep community presentation neutral.

Desktop: map fills the viewport with approximately 85% visually exposed by default; centered search, category tabs below, compact metric choices, collapsible left evidence panel, upper-right City View / Data Landscape switch, bottom legend and Explore Alternatives. Mobile: compact controls and a collapsible bottom sheet, retaining readable comparisons and tap/keyboard alternatives to hover.

Separate category (Health/Environment/Community/Infrastructure), remembered metric per category, visualization mode, selections/reference/inspected tract, and camera state. The existing `mode` variable currently means category. Keep one persistent primary map across category/mode changes. Preserve multi-location capability rather than quietly deleting it for the new default A/B story.

- **City View / Environmental X-Ray:** mapped physical buildings with source-qualified heights; tract statistics on the ground. Buildings neutral by default. Coloring buildings with their containing tract's value remains an optional proposal, not an adopted building-level measurement. Coverage/heights must be inspected at real locations.
- **Data Landscape:** physical buildings fade away and actual census-tract polygons rise using the same source percentile that drives ground color. Use a common linear 0–100 domain, never viewport-relative ranks. Label analytical height explicitly; preserve zero versus null and selected-tract identity. Exact visual height scale needs tuning in the prototype. Broad tract plateaus will differ from the screenshot's fine building texture.
- **Community:** socioeconomic source percentiles may use neutral tract extrusions; age/racial-ethnic composition stays neutral, with no invented hazard percentile or demographic ranking. **Infrastructure:** City View with verified markers and qualified distances; restore the prior analytical mode when leaving the category.
- Motion targets: address arrival 1.5–2 seconds; category crossfade 350–450 ms; coordinated building fade/tract growth. Tune transformation duration from actual renders. Preserve camera context, support interruption/reversal and reduced motion. Keep old data and its matching legend identifiable until replacements are ready.

### Current backend support and frontend corrections

Planning-pass HTTP reads verified catalog v1.2 with all 23 target fields (13 scalar, ten demographic), dataset `ces-5.0-final-2026-07-01`, 9,106 tracts; healthcare/schools ready, power unavailable. PM map metadata and pairwise comparison were inspected; facility catalog and comparison agreed through :3000 and :3001. These were bounded API checks, not a fresh full test/build/rendering pass.

Reuse `/api/geocode`, `/api/indicators`, `/api/tracts/{id}`, `/api/map`, `/api/compare`, `/api/compare/overview`, `/api/facilities/catalog`, `/api/facilities`, and relevant grouped-demographic/story/facility-comparison routes documented on main. Read current contracts rather than guessing shapes. No dedicated nearby environmental-alternatives endpoint was present at inspection.

Address the backend readiness audit during the rework: canonical comparison APIs or equivalent full evidence compatibility checks; preserve nonzero tiny differences in formatting; retain/pin facility versions and withhold mixed-version differences. Labels follow metadata: asthma is emergency-department visits, not prevalence; heart-attacks is not a generic cardiovascular prevalence measure. Preserve definitions, periods, raw units, percentile points, provenance and nulls. Tract data are not building/property readings or personal disease risks.

### Six milestones and completion gates

| Milestone | Work and backend dependency | Completion evidence |
| --- | --- | --- |
| 1. Reference-inspired 3D city | Checkpoint existing work; inspect building source; dark architectural rendering, confirmed address search, 1.5–2s arrival, retained selection. Existing geocode/lookup APIs suffice. | Real address resolves and remains highlighted; source-backed buildings render; pan/zoom/rotate work; inspect screenshots, keyboard/reduced motion, runtime errors and measured device behavior. |
| 2. Environmental X-Ray | New shell, all four categories, metric controls, ground overlays, legend, evidence and live school/healthcare markers using existing APIs. Start with PM end to end before extending. | Supported fields work with correct units/periods/domains; nulls, source failures and rapid switching are honest; state survives category changes. |
| 3. Data Landscape | Shared percentile-driven tract extrusion, physical-building fade, reversible camera/layer choreography; source-delivery improvements only when justified. | Same values in both modes; selection/map instance retained; inspect intermediate and interrupted animation, missing/zero cases, mobile and reduced motion. First major visual review. |
| 4. Explore Alternatives | Define geographic search and filter contract, backend implements query, frontend explains results. Begin with nearby tracts with lower selected environmental indicator. | Real candidate set with reproducible criteria, geographic/distance meaning, per-indicator differences, null exclusions and no-match/error behavior; no composite neighborhood grade. |
| 5. Geographic comparison | Connected A/B geography and aligned evidence, then linked side-by-side geographic views; reuse canonical comparison APIs and keep additional saved locations usable. | Matching domains/versions/definitions, correct difference direction, same-tract distinct pins, incompatible/null/tiny-gap behavior; linked zoom/bearing/pitch around each location's own center without feedback loops. |
| 6. Integrated refinement | Refine lighting, motion, mobile/keyboard interactions, delivery and failure handling; review full diff at coordinated integration checkpoint. | Relevant UI/backend checks, typecheck/build, actual rendered review and target-device measurements; report concrete limits without claiming blanket performance/accessibility. |

For each milestone: specify interaction and acceptance → inspect/agree API contract → implement missing backend pieces with their owner and frontend-owned presentation → connect real responses → verify complete flow → demonstrate, document results/deferrals, and checkpoint. Continue independent work when a dependency is blocked. An unsupported preview does not count as completed live integration. User-directed integration checkpoints remain required; ordinary implementation does not need repeated approval.

### Open decisions and explicit deferrals

- **Renderer:** existing MapLibre is the recommended first prototype; the user has not explicitly settled the Mapbox-versus-MapLibre question. Treat MapLibre as a stated working assumption, not a user-confirmed requirement change. The original spec names Next.js/TypeScript/Tailwind/Motion/Mapbox. Tailwind/Motion/Mapbox are not installed. Coordinate package/config changes through main; no unilateral install. No renderer migration is needed merely to prove extrusion. Reference: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/ . OpenMapTiles `render_height` is approximate, derived from levels/height: https://openmaptiles.org/docs/schema/#building .
- **Geometry delivery:** current resident statewide cache intentionally fixed navigation gaps; do not restore naive per-move replacement requests. Standard statewide PM was previously measured at 15.7 MB decoded per metric; existing optional overview is about 5.92 MB and recommended only through zoom ~7. Prototype with existing contracts, profile, then coordinate versioned shared geometry plus compact values/buffered neighborhood detail or vector tiles. Preserve outgoing coverage until replacements are ready, stable tract IDs and full-resolution backend lookup. No delivery strategy is already approved/implemented by this plan.
- **Discovery:** exact radius/distance definition, candidate order, multiple-criterion rules and pagination/limits must be decided before its backend contract. Prefer explicit per-indicator filters over a combined score. An alternative starts as a tract selection, never an invented address; do not use its centroid as a confirmed address for facility comparison.
- **Power:** unavailable pending first-party reporting-period and retirement-code evidence or verified alternative, as documented on main; do not restart the exhausted investigation without new evidence. **Routes:** require a verified routing source/contract; a visual A/B connector is not a travel route. **Fire/remediation:** require suitable verified feeds. Terrain, sharing, AI/voice and sponsors remain outside the initial implementation increments; original inventory stays recorded.

### First Astra task

Inspect the reference and current work, preserve the reviewed frontend checkpoint, state the MapLibre working assumption, and implement milestone 1 against the existing backend. Use a real confirmed address with inspected building coverage. Do not claim a dark reskin alone fulfills the target: demonstrate recognizable 3D geometry, camera arrival and retained selection. Update this file with actual checks, visual findings and concrete backend requests. The full six-milestone target remains; beginning with milestone 1 is sequencing, not a scope reduction.

## ClearSky milestone 1 — initial local prototype, 2026-11-07

Preserved existing tracked and untracked frontend work in reviewed local checkpoint `d6e3bf3`. No backend/config/dependency changes or integration. MapLibre is a working assumption. Read current main BACKEND_CHANGES and READINESS_AUDIT; their comparison/version/formatter findings remain required for subsequent milestones.

Implemented a separate dark architectural basemap with neutral physical building extrusions, OpenFreeMap OpenMapTiles building geometry and source `render_height` / `render_min_height` in metres. Heights are approximate schema-derived values, not surveyed property measurements; only positive supplied heights extrude. Source attribution retained and visible qualification added. Reference screenshot inspected; no reference data/assets shipped. Source documentation: https://openmaptiles.org/schema/#building and https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/ .

Confirmed-address arrival now targets zoom 15.6, pitch 58, bearing -25 over 1800ms (zero with reduced motion). Existing persistent map, collection, exact backend-selected tract, resident statewide geometry, and comparison features retained. Compass enabled; selected outlines teal. ClearSky name introduced; complete shell remains milestone 2.

Actual checks: TypeScript passed. New live Playwright Oakland confirmation/building/zoom/retained-pin/map-instance/runtime-error flow passed. Initial assertion failed only on floating-point pitch 58.00000000000001; corrected to numeric tolerance and reran. Observed 273 rendered building features (tile fragments, not unique building count). Inspected `artifacts/clearsky-m1/oakland.png`: recognizable downtown blocks and Lake Merritt geography, lit neutral extrusions, retained teal tract boundary. Ground remains too pale from inherited thematic opacity; shell is still historical and needs the planned redesign.

Milestone 1 is **in progress**, not acceptance-complete: keyboard pan/rotate, reduced-motion rendered behavior, mobile screenshots, interrupted/measured arrival and device frame behavior, building failure handling, full regression/build still need verification. No broad performance/accessibility claim. Existing zoom test assumptions need updating for closer initial arrival before full regression. Next pass should finish these gates and darken ground while maintaining truthful legend correspondence. Full six milestones remain intact: city → environmental X-Ray/new shell → Data Landscape → alternatives contract → geographic comparison → integrated refinement. No merge until user-coordinated paused review; all work local.

## ClearSky continuation — city verification and first X-Ray navigation pass

Darkened the thematic ground opacity to 0.32 while preserving source percentile colors/domain, neutral physical buildings and selected outlines. Began milestone 2 navigation: compact horizontal desktop categories beneath search, matching dark mobile controls, readable ClearSky identity. Moved mobile building attribution below legend/navigation after screenshot review. The full milestone 2 shell is not complete: historical evidence/search surfaces remain; compact metric controls, default map exposure and mobile sheet composition still need the dedicated redesign.

City source failures now have independent persistent state: successful tract loading cannot erase a failed basemap warning. Retry/remount or fallback remains explicit. Added camera diagnostics for real browser verification; no backend change.

Performed checks: TypeScript and production build passed. Six map regressions passed (58.9s): resident statewide coverage, rapid/delayed/failed replacements, infrastructure handoff and zoom shading. Updated test-only basemap interception to the new city style and zoom-step counts to reflect arrival at 15.6 instead of 11.5. The broader suite passed all 23 measures, six-place preview edge cases, keyboard/errors and rendered tract/facility flows. Its responsive instance assertion was invalidated by a development hot reload during editing; stopped editing and reran successfully. Final five tests passed together (39.5s): responsive/interrupted panel, confirmed Oakland/buildings/zoom, mobile keyboard pan/rotation/reduced motion, sampled intermediate arrival and interruption retaining selection, and failed basemap disclosure. These are 16 distinct passing checks across bounded runs, not a single uninterrupted full-suite pass.

Actual screenshots inspected: `artifacts/clearsky-m1/oakland.png` and `mobile-keyboard.png`. Desktop categories now leave the right side of the city open; mobile source text no longer overlaps the legend. Native Chrome keyboard rotation/pan and zero-duration reduced-motion arrival retained the pin. requestAnimationFrame sampling established intermediate pitch and arrival at 58 degrees; this is not a frame-rate or universal device-performance certification. Rendered coverage checked at Oakland only; no statewide building completeness claim. Approximate source heights remain disclosed.

Build stopped only the frontend preview, then restored :3001 with the :3000 proxy. Framework-generated next-env.d.ts churn was not hand-edited or staged. No main restart, root/dependency/shared-type edits, merge, publication or new agent.

Milestone 1 functional verification gates are exercised on this local Chrome machine; broader device performance profiling remains milestone 6. Milestone 2 is in progress, not completed. Next: cohesive compact evidence/metric shell and synchronized outgoing legend during data handoff; address readiness-audit comparison metadata, small-gap formatting and facility version pinning before accepting full X-Ray breadth. Milestones 3–6 and all source-dependent deferrals remain intact; alternatives still needs a coordinated backend contract, power remains unavailable. Integration still requires the user-coordinated paused checkpoint.

## Milestone 2 — Environmental X-Ray implementation checkpoint

Implemented the compact navy evidence shell around the existing live four-category flow: narrower 350px desktop evidence, sans-serif measure headings, dark metric controls, matching legend and mobile evidence surface. Preserved multi-place collections, reference changes, raw values/periods/definitions, neutral demographic interpretation, source dialogs and live school/healthcare markers. Inspected final Oakland desktop and 375px screenshots; corrected secondary text/value contrast and panel opacity. Desktop evidence remains collapsible; the mobile evidence surface remains the existing collapsible below-map layout. The exact proposed 85%-exposed default and floating bottom-sheet composition remain visual refinement work, not claimed as implemented.

Visible map state is now separate from requested category/metric. The legend retains the outgoing metric and identifies the last loaded layer during delayed/failed requests; it changes when replacement geometry is ready to blend. Infrastructure handoffs report readiness through the same callback. Source-scale colors and domains remain unchanged. No physical building is assigned a tract measurement.

Read current main observation and facility contracts. Active ComparisonPanel ranges and delta now check definition, provenance SHA-256, dataset version, geographic level, indicator, units and period as well as comparisonKey, matching backend compatibility. Missing metadata suppresses comparison. Synthetic fixtures carry explicit synthetic provenance. Nonzero values below the normal precision use three significant digits instead of becoming zero. Facility requests fetch category metadata, pin each dataset version, verify the returned version, retain it on records and suppress cross-version distance ranges. Category failures remain independent. No root/shared/backend types changed.

Verification: TypeScript and production build passed. Ten live/transition tests passed together (1.9m): all 23 supported fields, comparison/reference/preview edge cases, responsive and keyboard flows, facility interaction and independent failure, delayed/superseded/failed overlays. Five focused checks passed (35s), including same-key/different-definition/source/version incompatibility, 0.004 formatting, delayed PM-to-ozone legend identity and pinned facility requests. Final desktop/mobile city checks passed again after contrast corrections (15.4s); screenshots inspected. A final small CSS correction brightens invitation text and the panel toggle. This is bounded local Chrome verification, not comprehensive accessibility/device certification.

Only frontend :3001 was stopped for build and restored with the main :3000 proxy. No dependencies, main restart, backend changes, integration or publication. The next major interaction is milestone 3 Data Landscape; it is still unimplemented. Remaining visual refinement above stays in milestone 6; source/version failure matrix expansion remains a combined integration check. Alternatives still requires backend contract agreement; linked geographic comparison and full refinement remain milestones 4–6. Full original scope and power/fire/remediation/source gates are unchanged.

## Milestone 3 — Data Landscape local prototype

Implemented City View / Data Landscape controls over the retained primary MapLibre instance. Physical buildings fade while the actual resident CES display polygons rise. Ground color and analytical height use the same original source percentile, never a viewport rank. The common linear prototype scale is 0–100 percentile → 0–300 display metres (3 metres per point), explicitly labeled as analytical rather than building height. Zero has height zero; null percentiles are filtered out of extrusion and remain unscored ground. Existing raw evidence/nulls are untouched. Tract display simplification remains separate from exact backend lookup.

The 1100ms smoothstep transformation starts from its current progress, allowing interruption/reversal without snapping. Reduced motion is immediate. The camera is preserved rather than automatically reframed; selected addresses/tract IDs, collection, map instance and evidence survive the mode change. Raised geometry participates in map hit testing. Infrastructure switches to buildings once its inventory is ready; returning restores the analytical preference. Demographic composition has no extrusion or hazard ranking; scalar community source percentiles remain eligible. The resident two-buffer map cache is reused; no extra source downloads or backend contract changes.

Actual verification: TypeScript and production build passed. Eight combined evidence/landscape/overlay checks passed (46.5s), including delayed legends, version pins, live rise/reversal, same map/camera/pin, and source replacement/failure behavior. Added demographic flat-mode/preference-restoration regression and reran all three final landscape tests after the hit-testing refinement: 3 passed (20.9s). Sampled an intermediate growth value between zero and one and inspected intermediate, completed Oakland and reduced-motion mobile screenshots in `artifacts/landscape/`. No page runtime errors observed in the live transformation test. The scale helper separately checks zero/null/endpoints; no claim of a comprehensive rendered-null fixture matrix.

Visual findings: CES polygons form broad plateaus, visibly different from the reference's fine physical buildings. Initial mobile controls overlapped the pin and clipped the legend; relocated the switch left of the pin and shortened/repositioned the analytical key, then inspected the corrected screenshot. Ground tract outlines may be occluded by raised surfaces; pin/selection/evidence identity persists. Roof-edge selection treatment, label density, cross-metric extrusion blending and geographic scale tuning remain explicit milestone 6 visual refinement items. Frame progression is demonstrated, not a 60fps/device-performance certification. This is the first Data Landscape prototype for the planned major visual review, not final visual acceptance.

Kept all work local and restored frontend :3001 after its build with the unchanged :3000 proxy. No backend/root/dependency edits, additional agent, integration, publication or main restart. Milestone 4 Explore Alternatives still needs the geographic search/filter contract agreed with the backend owner before query implementation; no fabricated candidate addresses or centroid-as-address facility comparisons. Milestone 5 linked geographic comparison and milestone 6 refinement remain intact, as do the original power/conditional-source gates.

## Landscape height separation — user-directed refinement

Increased the common linear analytical height scale threefold: 9 display metres per percentile point, 0–900 m overall, replacing the initial 0–300 m prototype. This increases every inter-tract height difference equally; values, colors, rankings, nulls and the shared percentile domain are unchanged. The legend now derives its multiplier and endpoint from the renderer's constant to prevent drift. Inspected updated desktop/mobile Oakland screenshots: desktop plateau walls are substantially more distinct. On narrow screens large tracts can still fill much of the view; no automatic camera change added. TypeScript and all three landscape checks passed (24.3s), including reversal, retained selection/camera, reduced motion and composition exceptions. No backend/config changes or integration; full milestone inventory retained.

## Regional interpretation correction — user-approved implementation

Replaced regional Data Landscape slabs with flat subdued ground shading and stronger census-tract boundaries. Below zoom 10, analytical height/opacity are zero; between zoom 10 and 12 they interpolate continuously to the existing common scale; at zoom 12+ the full 9 display metres/percentile point returns. The transition is a disclosed zoom presentation, not a change in source values or percentile domain. It preserves camera, selected addresses, resident geometry and mode preference, and causes no extra map requests. The key explains the regional overview and when full heights appear.

Added neutral gray diagonal hatching for missing mapped values, with a separate Not reported legend swatch. Valid zero stays in the quantitative scale. Health/community keys explicitly state that observations describe tract populations, not conditions at every point; environmental keys explain within-tract variation. No artificial subdivision, invented precision, population mask or hidden large-tract data. Expanded the narrow-screen map area to 520px to accommodate the explanatory legend without clipping it.

Checks: TypeScript and production build passed. Five initial landscape/regional checks passed (36s); six final regional/overlay regression checks passed together (39.5s). Verified flat regional state, restored local extrusion, unchanged map request count during zoom navigation, retained pin, heart-attack regional key, and inspected live statewide/health/mobile screenshots plus an explicitly synthetic all-null hatch fixture under `artifacts/regional/`. Existing delayed/superseded/failed overlay and infrastructure handoffs passed. No full accessibility or device-performance certification. Large valid rural polygons still retain their actual footprint; this change removes misleading regional volume and clarifies aggregation, not land-area bias entirely.

Only frontend preview stopped/restored for build; :3001 again proxies :3000. No main restart, backend/config/dependency changes, merge or publication. Full milestones and source deferrals remain intact.

## Together camera framing — user-reported pin visibility fix

Multi-location framing now resets arrival pitch/bearing to a flat north-up geographic overview, uses larger interior padding around the evidence panel and bottom controls, and caps overview zoom at 11. Single-address city arrival is unchanged. Two-place mobile views have a 700px map area with legend below the pin framing region, avoiding squeezing both pins between overlaid controls. Repositioned recenter controls after testing exposed a tablet legend interception.

Verification: TypeScript and diff checks passed. New bounding-rectangle regression confirms both Oakland/Fresno pins stay inside the viewport and clear the evidence panel, legend, view switch, zoom controls and place ribbon at 1440/768/375/320px; passed in 11.9s. Initial attempts exposed recenter interception and a three-pixel mobile pin/control overlap; corrected and reran. Inspected desktop and 320px screenshots in `artifacts/framing/`. Existing responsive/interrupted-panel/map-instance regression passed (16.8s). No fresh production build for this bounded camera/CSS fix. Local only, no backend/config/dependency/integration changes; full milestone inventory retained.
