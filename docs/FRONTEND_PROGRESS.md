> **Start here — new Sol session:** [Sol migration handoff — resume after statewide Overture](#sol-migration-handoff--resume-after-statewide-overture). This is the current resume point; older Astra assignments and debugging-delegation instructions below are historical.
>
> **Current user direction:** desktop only; fast direct implementation with focused checks, no routine debug delegation. Main owns statewide Overture acquisition/serving. Resume frontend adoption once the user reports that main is ready, then finish the remaining original milestones. Keep all work local and honor AGENTS.md ownership/integration gates.

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

Opening introduction styling correction: removed the accidentally inherited panel border/background/shadow from `.opening-lens`, preserving evidence-panel and legend styling. Browser computed styles confirmed 0px border, transparent background and no shadow; screenshot captured at `artifacts/opening-border-removed.png`. No application logic or backend changes.

Legend/source overlap correction: moved the detached building/source note into a keyboard-accessible “Map sources & limits” disclosure within the legend. MapLibre's native attribution remains visible. Source links and approximate-height/analytical-height qualifications are retained, and mobile legend height is capped with internal scrolling when expanded. TypeScript and diff checks passed; browser checks confirmed the source link is accessible and the detached footer is absent. Inspected desktop and mobile screenshots; mobile expanded source content measured 246px within a 178px scrolling legend, keeping it inside the map area. No backend changes or fresh production build for this presentation-only fix.

## Adaptive vertical exaggeration — user-authorized experiment

Added explicit Overview alongside City View and Data Landscape. Overview keeps flat tract shading/boundaries and removes physical buildings; Infrastructure retains its physical context. Data Landscape now uses a shared zoom-dependent multiplier instead of the previous regional flattening rule. Formula: 9 × 2^clamp(10 − zoom, 0, 6) display metres per percentile point. At zoom 10+ this is the existing 9 m/point; at zoom 5 it is 288 m/point, capped at 576 at very distant zooms. All tracts use exactly the same multiplier at a given zoom; source values, ranks, zeros and nulls are unchanged. The current approximate multiplier and “Height exaggerated for visibility” appear in the key. No physical-height interpretation is implied. The earlier automatic regional flattening is deliberately superseded only for the explicit Landscape choice; Overview remains available.

Entering Landscape from a flat camera introduces 50-degree pitch to expose relief, preserving the center; Overview returns to flat pitch. Existing reversal/reduced-motion behavior remains. Mobile mode labels compact the visible Landscape text while preserving its accessible name. Infrastructure/composition exceptions and saved analytical preference remain intact.

Verification: TypeScript and production build passed. Five focused browser checks passed (39.6s), including adaptive statewide vs neighborhood scale (tested distant multiplier >50, local exactly9), flat Overview, selection persistence, transformation/reversal, demographic exceptions and missing-data pattern. Inspected statewide and neighborhood screenshots under `artifacts/adaptive-landscape/` and mobile landscape rendering. The observed statewide sample used approximately202 m/point. This remains a visual experiment: large rural tracts deliberately regain volume in Landscape, and their land-area dominance is not solved by exaggeration. Overview is the interpretation-focused alternative. No general performance certification or combined integration claim.

Frontend preview restored at :3001 with unchanged main :3000 proxy. No backend/dependency/root changes, integration or publication. Full six-milestone target retained; linked comparison must synchronize zoom/multiplier before comparing visual heights across separate maps.

## Simplified visualization controls

Replaced the three peer choices with City / Data Landscape. Data Landscape exposes a nested Flat / 3D choice; the former Overview rendering is now Flat. Depth preference is held separately from the main visualization choice, retaining it across City visits. Adaptive exaggeration, source legend, null hatch, infrastructure/composition restrictions and existing selection/map state remain unchanged. Compact two-row controls fit the mobile space above the legend.

TypeScript and five focused browser checks passed (34.9s): flat/3D zoom behavior, city/landscape reversal, selected address retention, composition exception and missing hatch. Inspected updated statewide desktop and mobile screenshots. No fresh production build for this controls-only change. Local only; no backend/config/dependency/integration changes. Full remaining milestones retained.

Zoomed-out prominence refinement: multiplied the previous adaptive height scale by up to four at zoom 7 and below, tapering continuously back to unchanged 9 m/point at zoom 10+. The factor is shared by all tracts and reported by the existing dynamic legend; Flat and null behavior are unchanged. Inspected statewide screenshot: Central Valley and southern California peaks/edges are visibly stronger; observed scale about808 m/point versus prior202. TypeScript and both focused adaptive-scale/missing-data checks passed (9s), including the unchanged neighborhood scale and retained selection. No fresh production build for this bounded scale adjustment. Full scope and local-only integration boundaries retained.

## Resume here — responsiveness first, then remaining milestones

### User direction at session close

The user reports that the frontend has become **very unresponsive** after the feature additions; responsiveness is critical to the user-centered product goal. They explicitly requested saving this session and migrating to a fresh session to tackle performance and the remaining milestones. Do not continue adding features before investigating this regression. This is a handoff, not a completed performance fix.

The last screenshot showed fragmented triangular extrusion surfaces around Los Angeles after zooming in (legend approximately9 m/point). The user then corrected the report: **it cleared after waiting for loading**. Treat this as user-observed transient rendering/loading behavior, not established permanent corruption or a proven root cause. Screenshot preserved locally at `artifacts/session-handoff/transient-fragmentation-user.png` (ignored). The interrupted investigation made read-only source/web inspections only; no fix, rollback, repro trace or performance measurement was completed. An initial search of MapLibre rendering sources is not evidence that a library bug caused it.

### Exact resume state

- Workspace `/Users/anand/Projects/hackathon.frontend`, branch `frontend/atlas-interactive`.
- Application checkpoint `4b999a77e531f9ea9a181f7e62d76dd896993e6b` (fourfold distant relief). Worktree clean before this documentation-only handoff.
- Previous recoverable checkpoints include `d6e3bf3` (all pre-ClearSky frontend work), `cb1a8c4` (city prototype), `5146931` (X-Ray evidence), `4f55f4e` (initial landscape), `be80add` (regional interpretation), `cab1272` (Together framing), `1790053` (source disclosure), `d3b9839` (adaptive exaggeration), `a140d30` (two main modes/nested depth).
- Both local servers observed listening at handoff: main :3000 and frontend :3001. Frontend started with `ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000 npm run dev -- --port 3001`. Recheck live processes; do not assume recorded PIDs remain valid. No server restart for this handoff.
- All changes remain local. Nothing merged into main, pushed, deployed or published. No backend/config/dependency changes were made in this frontend session. No worker agents were launched.

### Read order and boundaries

Read AGENTS.md, this resume section, README and its four planning links, FRONTEND_HANDOFF.md, then the current main-worktree `/Users/anand/Projects/hackathon/docs/BACKEND_CHANGES.md` and `READINESS_AUDIT.md` read-only. The earlier ClearSky implementation handoff in this file preserves all six milestones/reference intent; older Common ground/Astra presentation directions are superseded. Read relevant installed Next.js guides before code changes.

Honor the explicit frontend/backend split. This session owns frontend app except API routes, AtlasMap/map-theme, frontend components/hooks/styles/adapters, UI tests and this progress document. Main owns API/data/scripts/shared types/root configs/package files. Request specific backend/dependency/config changes through the user; do not install or edit them unilaterally. No additional frontend agent is authorized. User-coordinated paused review is required before any integration/merge/rebase/cherry-pick. Preserve source PDF and original six-milestone scope. No archived source investigations, sponsor work, publication or paid access.

### Current product decisions — do not regress during optimization

- Two main choices: **City / Data Landscape**. Data Landscape has nested **Flat / 3D**, remembering depth preference. Do not restore a third peer Overview button.
- City uses neutral OpenStreetMap/OpenFreeMap physical buildings with qualified approximate heights. Data Landscape uses actual CES tract display polygons and supplied percentiles, not building-level readings.
- 3D intentionally has stronger distant peaks: `src/frontend/landscape.ts` defines `d=clamp(10-zoom,0,6)` and `scale=9*2^d*(1+3*min(1,d/3))` metres/percentile point. At zoom10+ the scale is9; zoom7 and below has four times the earlier adaptive relief. Tested statewide screenshot about808 m/point. All tracts share one multiplier at the same zoom; linear percentile heights, zero/null distinction and explicit exaggeration legend are mandatory. Flat preserves the boundary-focused non-extruded interpretation alternative. User explicitly requested prominent distant peaks; do not silently remove them as a performance shortcut.
- Health/community are population-level tract observations, not uniform conditions at every point or personal risks. Large rural polygons have real values and large footprints; do not fabricate smaller measurement cells or treat them as missing. Missing map values use gray hatching, distinct from zero.
- Infrastructure/composition exceptions remain; no invented demographic hazard rank. Healthcare/schools live, power unavailable. Mode/category/metric/selection/reference/camera remain separate concerns.
- One persistent primary map, multiple saved locations, confirmed address candidates, source-qualified evidence. Together uses a flat north-up inner frame; single-address arrival is pitched. Mobile comparison has extra map height to avoid pin/control collisions.
- Source limits are in a disclosure **inside the legend**, not a separate overlapping footer. Opening prompt has no accidental bordered panel. Recent screenshot feedback focused on control/pin visibility and avoiding overlap.
- Outgoing metric/legend remain identifiable during delayed replacements. Retain previous successful geometry on failures. Exact backend membership stays separate from simplified display geometry.

### Performance investigation: evidence vs hypotheses

Confirmed current source characteristics (inspect rather than assuming a diagnosis):

1. `src/frontend/map-coverage.ts` retains standard statewide geometry per metric, bounded to two successful entries. Historical measurement: 9,106 features and15.7 MB decoded per standard metric. This deliberately fixed navigation gaps from per-move subset replacement. Do not restore naive fetch-on-pan or drop statewide coverage.
2. `src/AtlasMap.tsx` uses two GeoJSON sources, tagging/copying every feature with a frame token and calling setData for new measures. Each has ground, missing, boundary, selection/inspection and extrusion layers. Buildings are a separate vector source.
3. Its landscape effect rewrites **data-driven height expressions for both buffers on every zoom event and animation frame**. It also writes opacity and calls the React parent `onHeightScale` with a changing floating-point value. It queries rendered extrusion features and writes diagnostic DOM attributes during animation; other idle/move diagnostics/query work also remains. These are concrete profiling candidates, not proven bottlenecks. Investigate style invalidation/worker recalculation/upload cost and parent rerenders before guessing.
4. `app/page.tsx` owns much of the UI state; callbacks/derived arrays and useFacilities dependencies warrant profiling. `src/styles/city.css` is a growing override sheet; panel/legend layout and backdrop blur may contribute. Do not call these causal without measurement.
5. External basemap tile loading, statewide payload fetch/parse/worker processing, main-thread React work, GPU fill/extrusion cost, and development HMR overhead need to be distinguished. Test both cold and warmed flows, development vs production where useful. Starting a production frontend is allowed locally; preserve/restart only the frontend and retain the backend proxy. Do not restart main without coordination.

Suggested first complete increment: reproduce the reported loading/interaction problem, capture a baseline, change one measured hotspot, verify the same flows with before/after traces and visible input responsiveness. Prefer renderer-native camera expressions/uniform-compatible animation where supported and verified; avoid repeated whole-geometry/data-driven style work if traces implicate it. Consider scheduling/deduplicating React legend updates and moving diagnostics off animation hot paths. If geometry delivery is measured as dominant, propose a concrete contract to main (shared versioned geometry + compact values or vector tiles) rather than editing backend here. Existing optional overview geometry is documented only through about zoom7 and must not silently replace neighborhood detail.

Measure real interactions: statewide→LA zoom/pan/rotate while 3D is active, rapid City/Flat/3D reversal, switches across metrics/categories, address confirmation/arrival, Together framing and source failures. Capture long tasks, frame-time distribution, input latency, request/worker timing and memory where tooling permits. Verify whether fragmented surfaces occur only during pending data/style work; preserve or communicate a coherent loading state instead of presenting unready triangles as settled evidence. Do not treat a spinner alone as fixing unresponsiveness. Keep controls interruptible, preserve selection/camera, and verify reduced motion. Avoid editing while a browser test runs: an earlier HMR invalidated a map-instance test and needed rerun.

### Validation history and its limits

Prior build/type/browser passes are detailed chronologically above. Latest **application** production build was during `d3b9839`; subsequent control simplification and fourfold scale adjustment ran TypeScript and focused browser checks, not a fresh build. Latest focused checks at `4b999a7`: adaptive statewide/local scale and missing-hatch tests, 2 passed (9s). Other tests cover live 23-field breadth, six-place preview, comparison incompatibility, tiny gaps, pinned facility versions, source failures, overlay hold/cache behavior, landscape reversal, demographics, framing and responsive layouts. None establish current responsiveness on the user's hardware. Do not cite historical functional passes as performance acceptance or claim a full suite was freshly run.

Test command: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:ui`. Targeted suites are `tests/ui/landscape.spec.ts`, `regional.spec.ts` (name retained, now Flat/adaptive), `map-switch.spec.ts`, `map-coverage.spec.ts`, `framing.spec.ts`, `evidence-contract.spec.ts`, `city.spec.ts`, `atlas.spec.ts`. Tests include synthetic fixtures explicitly; those are not live evidence. Some screenshot tests assert metadata rather than visual pixel integrity, so investigate/strengthen the specific failure path rather than trusting screenshots exist. Use a stable frozen implementation while testing.

### Remaining milestones — full target intact

1. Reference-inspired city: implemented prototype with confirmed-address flow; performance/device/coverage limitations remain.
2. Environmental X-Ray: live four categories/23 fields, evidence and schools/healthcare implemented; visual/layout refinement and integrated failure-matrix review remain. Original ~85%-exposed default and polished bottom-sheet target are not fully achieved.
3. Data Landscape: implemented, including adaptive prominence and Flat/3D controls. **Responsiveness/loading quality is now the immediate blocker to accepting it.** Rendering polish, roof-edge selection, cross-metric extrusion blending and label density remain review items.
4. Explore Alternatives: **not implemented**. Define geographic radius/distance semantics, per-indicator criteria, ordering, limits, null/no-match handling with main before backend query work. Use real tract candidates, not invented addresses or centroid-as-confirmed-address facility requests. No composite neighborhood score.
5. Geographic comparison: existing multi-place evidence and Together view are not the full milestone. Connected A/B geography and linked side-by-side views remain. Sync zoom/bearing/pitch and adaptive height multiplier around each place's own center without feedback loops; common definitions/versions/domains, same-tract distinct pins and null/tiny-gap semantics remain required.
6. Integrated refinement: performance first now, then lighting/motion/mobile/accessibility/failure and visual quality; full stable diff and user-coordinated main integration followed by combined backend/UI checks. No blanket performance/accessibility claim until measured.

Power remains blocked on documented reporting-period/retired-code evidence or a verified alternative. Fire/remediation need suitable sources; routes need a routing contract. Terrain, sharing, AI/voice and sponsors stay retained but outside these initial increments. Do not silently delete scope or resume exhausted investigations. Continue independent authorized frontend work; document specific owner requests and triggers.

## Responsiveness checkpoint — measured workload reduction, 2026-11-07

**Latest user feedback:** after trying the production preview with this change, the user reported **“Much more responsive now.”** This is user-observed improvement, separately from the bounded browser measurements below. The earlier fragmented surfaces remain a transient loading observation with no confirmed cause. No claim of permanent corruption, a MapLibre defect, or universal device performance is made.

### Changes and preserved behavior

Inspected the installed Next.js client-component guide and MapLibre 6.16 implementation. Feature-dependent paint-expression updates request layer relayout (`style_layer.ts` / `style.ts`); native transitions to data-driven heights are explicitly unsupported (`properties.ts`). The previous effect rewrote both buffers during zoom and animation, queried rendered extrusion geometry every animation frame, and sent unrounded scale changes into React.

The visible buffer now receives at most one submitted height per 80ms, with source-readiness backpressure and only the latest desired height retained. It stops polling after the animation and resumes on relevant source readiness or camera events. Hidden-buffer height rewrites are removed, opacity writes are deduplicated, and the legend receives rounded display values only when changed. Whole-map test diagnostics run on idle only and require `atlas-render-diagnostics=1` in local storage; Playwright opts in through its isolated storage state. Normal browsing does not execute those diagnostic queries. Ordinary picking still works.

The accepted **exact** `metresPerPercentileAtZoom` formula, stronger distant peaks, 9 m/point at zoom10+, zero/null distinction, 1,100ms reversible growth/opacity timeline, City / Data Landscape with Flat / 3D, persistent map, statewide 9,106-feature standard geometry, source-qualified evidence and outgoing-layer retention are unchanged. Worker throughput can limit intermediate height cadence; input/opacity/camera animation are not gated on the worker. No native zoom-expression approximation or geometry-detail substitution was introduced.

### Reproducible measurements and limitations

`node tests/ui/performance-probe.mjs <label>` runs two statewide→Los Angeles zoom/pan/rotation→statewide cycles with City/Landscape reversals, recording frame intervals, long tasks, Event Timing, calls/relayout requests, JS heap snapshot and map resource timing. It uses test-only inspection; application renderer internals are not exposed. `performance-first-click.mjs` captures an optional CPU profile of first activation. Results/screenshots are ignored under `artifacts/responsiveness/`.

| Corrected sample | Before, development | First candidate, development | Before, production | Final candidate, production |
| --- | ---: | ---: | ---: | ---: |
| Height expression writes | 2,356 | 72 | 2,354 | 81 |
| Layer relayout requests | 1,578 | 75 | 1,576 | 84 |
| Rendered-feature queries | 263 | 27 | 255 | 2 |
| Frame interval p95 | 16.8ms | 16.8ms | 16.8ms | 16.7ms |
| Largest sampled frame gap | 183ms | 117ms | 133ms | 367ms |
| All-session long-task time | 492ms | 653ms | 1,056ms | 643ms |
| First Landscape click event duration | 144ms | 128ms | 168ms | 392ms |

Final production height/relayout requests fell about **96.6% / 94.7%**. Later production candidate click events were 24–32ms, but first activation remains variable and was worse in this single candidate sample. Cold navigation-to-data-ready was 3.89s before / 2.51s after in these production samples, with unchanged 4,127,256 transferred / 15,702,991 decoded map bytes. These are sequential local samples with uncontrolled external tiles, OS/browser caching, GC and background activity; not statistically controlled speedup claims. Heap snapshots are recorded but are not peak browser/GPU/worker memory measurements. The first-click CPU profile did not isolate a dominant JS function, so no shader/GPU or network root cause is claimed.

**Discarded measurement artifact:** `before-dev`, `after-backpressure`, and `frozen-diagnostic` returned the entire map instance from one Playwright evaluation, inducing test-only serialization. Their multi-second gaps must not be cited as product stalls. Corrected labels are `baseline-corrected`, `candidate-corrected`, `baseline-production`, `candidate-production`. Frozen-height diagnostic is deliberately not accepted visual behavior. A backup source file initially had a `.tsx` extension under artifacts and failed build typechecking; renamed to `.txt`, then baseline and final production builds passed.

### Verification and next work

Final production build passed. **All 24 existing UI tests passed (3.1m)**, including all 23 live fields, comparison units/compatibility/tiny gaps, six-place null/zero scenarios, source-version failures, confirmation, Together framing, responsive layouts, keyboard/reduced motion, real map/facility inspection and retained delayed/failed overlays. **Two new responsiveness regressions passed (21.5s):** a disclosure responds during an ongoing camera flight, only the active buffer receives bounded height updates, settled local height is exactly percentile×9, all 9,106 features remain; normal browsing omits expensive test diagnostics. Statewide/neighborhood/mobile render artifacts were produced by the tests. No combined main integration or backend test rerun is claimed.

The preview is temporarily production mode on :3001 with the unchanged :3000 proxy. Only the frontend server was restarted. No dependencies, backend data, shared root configuration or source PDF changed; generated next-env.d.ts is framework churn. No merge into main, push or publication.

The next independent milestone is connected/linked geographic comparison, following review of this checkpoint. Explore Alternatives remains blocked on an agreed backend query contract: radius and distance meaning, per-indicator criteria, ordering/limits, source compatibility, null exclusions and no-match/failure behavior. A proposal was explained to the user; it has **not** been sent to or accepted by the backend owner. Tract candidates must never become invented confirmed addresses. Power/fire/remediation/routes and the other optional deferrals above retain their stated triggers.

### Updated delegation direction from the user

From this point forward, the user requested initial frontend design by the primary Astra session and later debugging delegated to Sol (or another necessary model). This explicitly updates the prior no-frontend-worker instruction for bounded debugging. Use the authorized isolated Worktrunk/tmux Codex CLI workflow, normally one worker; no worker delegation, shared-file edits, main integration or publication. Primary session retains design, review and integration responsibility. Main-worktree integration still requires the user-coordinated paused checkpoint. Record actual worker model/effort, scope and results rather than treating a worker exit as verification.

## Paused checkpoint — 2026-11-07

Paused at the user's request after feedback that this cycle was taking too long. Do not resume implementation until the user addresses their next topic.

- Responsiveness checkpoint is committed locally as `f12b10f`; the user reports “Much more responsive now.” The transient fragmented rendering cause remains unconfirmed.
- Linked geographic comparison is committed locally as `e6ab26e`. Subsequent Sol-reviewed readiness, facility-selection, viewport-restoration and presentation fixes remain saved in the working tree, with new verification files. No integration into main has occurred.
- Latest production build passed. The earlier full 31-test production suite passed before the latest fixes. The latest targeted run completed with **16 passed, 1 failed**: linked facility-marker detail did not expose the expected dialog (`tests/ui/geography.spec.ts:188`). Its cause remains unconfirmed; this is the concrete next debugging item, not a verified-complete milestone. Mobile exit framing and linked readiness tests passed in that run.
- Frontend production preview remains at :3001; backend :3000 was not changed. The Sol review worker has finished. Generated `next-env.d.ts` churn is not feature work.
- Preserve ownership and integration gates on resume. Initial design remains with the primary session; subsequent debugging is delegated to Sol as requested. Explore Alternatives still requires the backend-owned contract; no acceptance by the backend owner has been established. All remaining scope and prior deferrals remain applicable.

## Automatic view checkpoint — 2026-11-07

User resumed specifically for zoom-dependent visualization. Auto is now the default: after a zoom settles, zoom >=12 selects City, zoom <=11 selects Data Landscape, and the intervening band keeps the prior automatic view. Explicit City, Data Landscape, Flat or 3D choices disable Auto until the user selects Auto again. Flat/3D preference survives City visits. The existing metric/composition/infrastructure restrictions, percentile formula, geometry, values and source legends remain unchanged. Both linked panes share the decision; follower synchronization events are excluded. No continuous zoom values are stored in React state.

Initial implementation and the previously saved linked-view fixes were preserved locally in `8fcbebd`. Primary session handled initial design; the existing Sol CLI worker performed bounded review/debugging through parallel-worktrees. Review found linked follower zoom events could trigger tilt during the driver's flight. Browser testing also reproduced initial Auto tilt cancelling an address arrival. Accepted fixes report only driving zoom events (from either pane) and defer tilt until camera movement settles, rechecking the latest requested view. A fresh production build passed after those fixes. Mobile control bounds and screenshot inspected at 320px.

Prior failed linked facility-dialog test remains open and outside this resumed increment. No merge/rebase/cherry-pick into main, backend edits, dependencies or publication. Full remaining target and previous source-contract/integration gates remain in force. Pause again after this focused verification checkpoint.

Verification completed: after the camera fixes, 7/8 focused tests passed (Auto boundary/manual/depth behavior; right-pane flight; address arrival and reversal; composition; numeric null/zero; bounded height updates; diagnostics off). The remaining failure was a measured 4px mobile pin/control overlap at375px. Sol implemented the primary's compact single-row mobile control design. Latest production build passed; rerun of both Auto tests and Together framing passed **3/3 in38.6s**, covering320/375/768/1440px framing. Latest320px screenshot inspected. Initial run against a stopped preview failed with connection refused and is not application evidence; another cold map load exceeded the old5s test readiness timeout, now explicitly30s (arrival15s). No full-suite or new frame-time benchmark claimed. The previously recorded facility-dialog failure remains unresolved. Frontend production preview restored at:3001. Paused here for the user.

## City color distinction — 2026-11-07

User requested faster direct iteration without debug delegation and stronger neighborhood color distinction. Direct local pass: replaced narrow single-hue Environment/Health/Community ramps with broader sequential color ranges (same fixed0–100 scale and shared map/legend palette); close-zoom tract fill increases from0.32 to0.72 byzoom13; tract boundaries now strengthen with zoom rather than fade; physical buildings use neutral gray at0.70 opacity instead of near-opaque blue-gray. Physical building heights, tract measurements, null patterns, source scale, camera framing and analytical-height formula are unchanged. No local re-ranking or fabricated within-tract differences. Similar observations still receive similar colors.

Inspected actual Oakland arrival before/after at identical zoom15.6/pitch58/bearing−25 (`/tmp/atlas-color-before.png`, `/tmp/atlas-color-after.png`): underlying tract colors are now visible through quieter buildings and vary across the surrounding tracts. Production build passed; existing city arrival/selection/mobile-keyboard browser check passed1/1 in6.9s. No broad suite or delegated review. Preview remains:3001; no backend/integration changes. Prior facility-dialog issue and all remaining milestones remain open.

## Smooth zoom-dependent relief — 2026-11-07

User requested continuous animation of landscape height exaggeration during zoom. Direct pass, no delegation. Height now uses MapLibre's native composite zoom interpolation (`exponential`, base0.5), with the existing formula evaluated at integer zoom anchors3–10. Renderer interpolation updates the height between zoom levels without replacing the data-driven expression during navigation. Mode-entry/reversal growth remains bounded by existing worker backpressure; incoming-buffer readiness now checks growth, since the staged expression already covers every zoom. Legend scale follows the same renderer curve.

Explicit visual change: whole-zoom heights, distant cap and local9m/percentile-point remain exact. Between zoom7–10, renderer interpolation replaces the former exponential-times-linear prominence curve; maximum sampled difference is6.025% in display height atzoom9.613 (0.001 zoom sampling over3.3–16). Outside that taper the curves match. This is display exaggeration only, not a change to source observations, percentile ranks, differences, nulls or shared comparison scales. This supersedes prior claims that the old fractional-zoom formula is preserved exactly.

Production build passed. Eight focused landscape/readiness/responsiveness checks passed in44.4s. The real2.5s navigation test now asserts **zero height-expression writes during zoom**, versus the previous bounded-under40 allowance; controls remained interactive and the final expression/legend matched the local scale. Existing growth/reversal, selection, composition and null/zero checks passed. No broad suite or new device-wide performance claim. Preview restored at:3001; local only. Prior facility-dialog issue and remaining milestones stay open.

## Building coverage investigation / handoff — 2026-11-07

User reports missing/inaccurate 3D buildings in Rancho Cucamonga and requests fuller coverage. Direct investigation, no delegation. Current physical layer uses OpenFreeMap/OpenMapTiles OSM footprints with positive render_height. Tested approximate nearby center[-117.552,34.127], zoom15.6/pitch58 after `areTilesLoaded()` and camera settlement: `querySourceFeatures(openmaptiles, building)` returned9 tile features, all9 with positive render_height, zero rejected by the height condition;7 building-line features were returned by rendered-feature query. These are tile-feature counts, not a unique-building inventory or a claim of exact screenshot-coordinate reproduction. Screenshot: artifacts/building-coverage/rancho-current.png. Empty residential coverage remains visible. A fallback-height/filter tweak would not remedy this inspected source gap. No rendering fix claimed.

Recommended source path: Overture Buildings, preserving MapLibre and tract visualization. Official docs say it combines OSM with other community/authoritative/ML footprints; 3D is extrusion from heights or levels, not a guaranteed accurate model of every building. Source documentation: https://docs.overturemaps.org/guides/buildings/ ; bounded acquisition: https://docs.overturemaps.org/getting-data/overturemaps-py/ ; MapLibre tile preparation: https://docs.overturemaps.org/examples/build-a-map/ . Licensing/attribution must retain ODbL and source credits. No release has been downloaded or locally validated yet. A static demo extract must not be presented as statewide coverage.

Concrete proposed backend handoff (not an accepted contract): serve version-pinned building footprints as viewport vector tiles or a bounded `/api/buildings?bbox=...&version=...` GeoJSON endpoint. Include stable building ID, source footprint geometry, nullable supplied height/metres and levels, source/provenance, release/version, attribution/license, coverage/truncation and unavailable/error states. Preserve missing height; do not write invented defaults into source observations. Require bounded requests/cache, cancellation, explicit limits and neighborhood-scale loading; never ship all California buildings as one browser payload. Verify the Rancho viewport against the current sparse source, plus Oakland and a missing-height case. Use supplied height, then clearly labeled level-derived height, then a disclosed schematic height only if necessary. Replace the old building layer in covered views rather than stack duplicate footprints; retain coverage disclosure for gaps. Frontend owner handles rendering, loading states and map/legend compatibility after the source contract exists.

Photorealistic alternative: Google3D Tiles, documented at https://developers.google.com/maps/documentation/tile/3d-tiles , requires billing/API key and a compatible3D Tiles renderer; not authorized under the current no-billing/config/dependency-change boundary. No paid access or account changes attempted.

Asked user to route the bounded building-source work to main or explicitly transfer that ownership here. AGENTS.md assigns data/API/dependencies to main and requires frontend changes there to be requested through the user. Awaiting that decision; no source install, API/data changes, fabricated buildings, or integration performed. Remaining milestones retained.

## Ready-to-send main-session handoff: Overture building coverage

User decision: main session owns the building-source work; frontend waits for the user to report that it is built. This supersedes the pending ownership question above.

**Task for main:** Add fuller California building footprint/height coverage using Overture Buildings, preserving the existing MapLibre frontend and current CES evidence semantics. Implement only backend-owned acquisition/cache/data/API/config paths; do not touch the active frontend or integrate its branch. Keep everything local; no billing, publication or paid source. This is footprint extrusion, not photorealistic3D and not a promise of complete building coverage.

**Evidence and first acceptance location:** current OpenFreeMap source visibly misses residential areas around Rancho Cucamonga. Approximate test center[-117.552,34.127], zoom15.6:9 queried source tile features, all with positive render_height. Screenshot and caveats are in the preceding investigation. Validate actual coverage improvement there, then Oakland and a height-missing case before claiming the source solves the issue.

**Source work:** select/pin an available Overture release, inspect its building/building_part schema and licenses, cache successful downloads with provenance/checksums, preserve original supplied heights/levels and nulls. Prefer a unified source over blindly overlaying duplicate OSM buildings. Include building-part relationships if used. Do not derive source heights from CES metrics or treat defaults as measured data. Verify ODbL attribution obligations and retain required contributor credits. Official starting points: https://docs.overturemaps.org/guides/buildings/ and https://docs.overturemaps.org/getting-data/overturemaps-py/ . Current release and local coverage are not yet verified.

**Preferred additive interface:** `/api/buildings?bbox=west,south,east,north&version=<release>` returning a bounded WGS84 longitude/latitude GeoJSON FeatureCollection, or a versioned vector-tile endpoint if that is materially faster. Publish the exact selected contract in BACKEND_CHANGES.md before frontend adoption. Frontend proposes feature fields: stable source ID, geometry, nullable supplied height in metres, nullable levels, height provenance/quality (supplied/estimated/unknown), source/dataset and optional parent/building-part identity. Metadata: contractVersion, datasetVersion, attribution/license/source URLs, actual coverage scope and explicit truncation/limit status. Pin release on requests. Preserve null heights; frontend may disclose schematic extrusion where unknown. Return honest empty/unavailable/version-mismatch/error states, not success with silent missing coverage.

**Performance gate:** bound request area and result size; document limits/minimum zoom; cache by release and spatial key; support cancellation/stale-request handling. Use tiled or spatially indexed serving rather than a statewide GeoJSON download to each browser. No on-demand nationwide scan on every pan. Measure representative response bytes/latency and feature counts. A bounded pilot is acceptable only with explicit geographic scope and a concrete expansion trigger; full California remains the target.

**Deliver back through user:** endpoint/parameters and response/error examples, dataset version, source/license/attribution text, field units and height/null semantics, coverage and limits, verification results for Rancho/Oakland/missing-height, performance measurements, and any required root dependency/config changes. Keep :3000 available and :3001 proxy-compatible. No shared-type breaking change without coordination. Frontend will then implement neighborhood-scale loading, replace the old building layer where new coverage applies, show source/height limitations, and verify City/Flat/Landscape plus linked maps. No frontend merge is requested by this handoff.

## Manual top-down selects Flat — 2026-11-07

Issue4 fixed directly: a user-originated pitchend at3degrees or less switches active Data Landscape to Flat. Programmatic arrival/Together camera motions and synthetic linked-follower events do not change the saved depth. Both map panes report the originating gesture. Explicit3D still restores relief/tilt; Auto preference is preserved. Production build passed; keyboard top-down/Flat/3D restoration and existing Together framing checks passed2/2. Buildings source remains with main under the handoff above; wait for user's completion notice before frontend integration.

## Desktop map-first milestone — 2026-11-07

User directed independent frontend progress while main builds Overture, then explicitly deferred mobile integration/refinement from now on. Desktop is the active target; the mobile bottom-sheet target remains deferred until the user reopens mobile scope. Unverified new sheet work was removed from this pass; existing mobile behavior was not comprehensively rechecked.

Desktop now starts confirmed-place exploration with a compact evidence summary instead of the full evidence panel. Summary uses the same real observation/unit helpers; full evidence remains one click away. Opening evidence moves focus to its collapse control; More map/Escape returns focus to Open evidence. An explicitly opened panel stays open when adding another location. Map instance, selections and existing data controls persist. Opening-prompt text and topic controls now have a restrained navy backdrop for readable contrast over light tract colors. No numerical85%-visible-map claim was measured.

Dialogs now render via a body portal, outside hidden/inert evidence-panel ancestors. This directly resolves the previously recorded linked-facility dialog regression: the actual right/left map marker test now opens the correct inventory detail without recentering either place. No facility data semantics changed.

Verification: production build passed; focused desktop summary/evidence/focus test and linked facility test passed2/2 in9.1s. After preserving explicitly opened evidence during additional selections, desktop summary/focus plus all23 live-measure access/unit/value checks passed2/2 in46.4s. Inspected desktop compact, opening and evidence screenshots in artifacts/map-first/. Adjusted existing evidence-focused test interactions to explicitly open the now-collapsed panel. No full-suite/mobile/accessibility certification claimed. Current work stays local, preview:3001 restored, backend untouched; wait for user's Overture completion notice before adopting its contract.

## Overture frontend adoption — 2026-11-07

User reported main's building integration complete. Read main docs/BUILDINGS_HANDOFF.md and verified the actual pinned API through:3001; backend is a two-region pilot, not statewide coverage. Frontend now consumes `/api/buildings` at zoom15+ in Rancho Cucamonga/Oakland, using fixed0.01-degree region-aligned cells, two concurrent requests,180ms move-end debounce, AbortController/generation guards, ID deduplication, and an LRU bounded to12 cells/12million response-text characters. No backend/dependency edits or branch integration required.

New footprints replace the old physical-building layer after source/render readiness, never stack over it. Outside the pilots, at wider zoom, or on failure, use the original OSM layer with explicit status. Views intersecting but extending beyond a pilot are explicitly labeled partial; during the Overture view, buildings beyond that pilot are not rendered. Source-supplied heights may be estimates. Nulls remain in source properties: rendering alone uses supplied floors×3m, otherwise a disclosed6m schematic height, with a separate neutral tone for unknown heights. Supplied zero remains zero; supplied underground flags suppress underground buildings. No inferred building parts, photorealistic/complete coverage claim, or CES-derived building heights. OSM/Overture/Microsoft/ODbL attribution is linked in map attribution and sources. Legend placement avoids the opening prompt; both linked panes disclose their independent coverage.

Latest desktop verification: production build passed and5 focused tests passed in28s (real Rancho fill/source replacement/cache reuse/Flat/3D, simulated503 fallback, outside-pilot fallback, linked Oakland versus outside-pilot Fresno, and existing source-readiness checks). Same-camera Rancho screenshot inspected at[-117.552,34.127], zoom15.6/pitch58: residential blocks visibly fill the previous gaps. The recorded load deduplicated9,305 source footprints from12 cell requests,590 with unknown source heights; renderer query returned5,527 fragments, not a unique visible-building inventory. CES metric stayedPM and old-building opacity was0. Repeating that exact view reused the cache without new requests. Artifacts: artifacts/building-coverage/rancho-overture.png and frontend-counts.json. An initial test used an obsolete private GeoJSONSource field and was corrected to the public getData() API; no application failure inferred from that test error. No broad performance/frame-time, mobile or full-suite certification.

Preview:3001 is restored. Full California expansion/parts remain main-owned deferrals under BUILDINGS_HANDOFF.md, with fixed bounded release-keyed serving/acquisition budgets as the expansion trigger. Frontend stays local/unmerged; full coordinated integration gates remain. Mobile remains out of current scope per user.


## Sol migration handoff — resume after statewide Overture

### User request and working style

The user is moving subsequent frontend implementation from Astra to a **new primary Sol session**. This is a handoff, not a model/global-config change or a new worker launch. The main session will implement statewide Overture coverage first; it has not yet been verified at this migration checkpoint. Do not implement a competing backend pipeline here.

- Use Sol directly for design, implementation and debugging. The earlier Astra-design/Sol-debug split is superseded: its repeated delegation/review cycles were too slow. No routine subagents or CLI workers unless the user asks again.
- Keep iterations focused: one meaningful interaction, relevant checks, brief evidence, local checkpoint. Do not repeatedly run broad suites for small UI changes. A final coordinated integration pass still needs appropriate combined checks.
- **Desktop only.** Mobile integration, bottom sheets and mobile-specific polish/checks are deferred until explicitly requested again. Keep the original inventory recorded rather than marking those items complete.
- Preserve the accepted ClearSky direction and recent improvements. Do not restart the visual design or archived source investigations. The user reported the performance fixes made the app “Much more responsive now.” The earlier transient fragmented rendering cleared after loading; its cause remains unconfirmed.

### Where to resume and read order

1. Work in `/Users/anand/Projects/hackathon.frontend`, branch `frontend/atlas-interactive`. Read local AGENTS.md and this migration section first.
2. Read README.md and its four planning links (PRODUCT, EXPERIENCE, ARCHITECTURE, BUILD_PLAN), then docs/FRONTEND_HANDOFF.md for ownership. Older planning descriptions are the original target, not authoritative current implementation state.
3. Read **current main-worktree** `/Users/anand/Projects/hackathon/docs/BUILDINGS_HANDOFF.md`, BACKEND_CHANGES.md and READINESS_AUDIT.md read-only. They may change after this checkpoint. Inspect the actual statewide endpoint contract and proxy responses before coding; do not assume the pilot's bbox/version/limits remain valid.
4. Read only the relevant recent sections above for measured evidence and corrections. Installed Next.js guidance lives in node_modules/next/dist/docs/; consult the relevant guide before code changes.

Main/backend: `/Users/anand/Projects/hackathon`, port3000. Frontend: port3001, relative `/api/*` proxy via `ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000`. At migration the frontend production preview is live in tmux `atlas-frontend-preview`; inspect it and reuse it. Do not restart main. Stop only the frontend process before rebuilding its `.next`, then restore the preview. This tmux pane runs the server directly, so after Ctrl-C it becomes dead; use `tmux respawn-pane -t atlas-frontend-preview -c /Users/anand/Projects/hackathon.frontend 'ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000 npm run start -- --hostname 127.0.0.1 --port 3001'` after a successful build. Verify HTTP readiness before launching browser checks.

### Saved local state

Latest application checkpoint: **9e0e6b3** (`feat: render Overture building pilots with bounded loading`). This migration adds a documentation-only commit after it. No frontend merge/rebase/cherry-pick into main has been performed. `git status` at preparation showed only generated `next-env.d.ts` churn; do not hand-edit/stage that as feature work. No source edits are knowingly left unsaved.

Useful recent checkpoints:
- `d2285ae`: desktop map-first compact evidence; body-portaled dialogs fix the old linked facility-detail regression.
- `abaa4b3`: manual top-down pitch selects Flat.
- `0330154`: renderer-native smooth zoom-dependent landscape heights.
- `032918b`: stronger tract colors/boundaries and quieter physical buildings.
- `8efb8ab` / `8fcbebd`: Auto mode with manual overrides and camera-flight safeguards.
- `e6ab26e`: linked geographic comparison; subsequent fixes are included in later commits.
- `f12b10f`: responsiveness work. The earliest probe's test-only MapLibre serialization invalidated its apparent frame-gap results; use the corrected measurements documented above, not the discarded samples.

The existing Sol CLI review worker is finished; its worktree/logs are preserved. Do not resume it just because it exists. All accepted fixes are already in this frontend branch.

### Current implementation to preserve

- **Auto view** defaults on: settled zoom>=12 selects City; zoom<=11 selects Data Landscape; the gap prevents oscillation. Explicit City/Landscape/Flat/3D choices disable Auto until selected again. Flat/3D preference survives City visits. Manual top-down pitch<=3degrees selects Flat without changing the Auto preference. Programmatic arrivals/Together/linked-follower events do not impersonate user choices.
- **Landscape:** shared percentile heights, real tract geometry, null hatching, zero preservation and source-qualified legend. Native composite zoom interpolation avoids height-expression rewrites during navigation; bounded source updates remain only for growth/reversal. Original integer-zoom heights and9m/point local scale are retained. The smooth fractional-zoom curve differs from the old formula by at most approximately6.025% in display exaggeration, explicitly documented; do not claim exact preservation at every fractional zoom. Measurement values and comparisons are unchanged.
- **Color:** wider sequential ramps shared by map and legend on the same statewide0–100 scale. Closer-zoom fill opacity0.72, clearer boundaries, neutral physical buildings at0.70 opacity. No local re-ranking or invented within-tract variation.
- **Desktop shell:** compact evidence summary after first confirmed address; open evidence on demand. An opened panel stays open when adding places. Keyboard open/collapse/Escape focus behavior exists. Opening text has a navy backdrop. The map instance and saved places persist.
- **Comparison:** multiple saved places, aligned evidence, Together, linked left/right maps sharing zoom/pitch/bearing around independent centers. Two-pane source readiness gates preserve coherent metric changes. The old facility-dialog failure is **fixed and browser-verified**, not an open issue: dialogs now portal outside hidden/inert evidence ancestors.
- **Correctness:** source units/periods/versions/nulls, same-tract distinct addresses, direction/tiny-gap handling and facility version pinning remain mandatory. Current provider.ts compatible() checks more than comparisonKey, and useFacilities pins/verifies datasetVersion; the old main READINESS_AUDIT findings were against an older snapshot, so inspect current code before reopening them as unresolved.

### Overture: implemented pilot and first new-session task

The frontend currently supports only the main-provided pinned **2026-10-21.0 two-region pilot**. `src/frontend/buildings.ts` hardcodes Rancho/Oakland coverage rectangles and fixed0.01-degree cells, fetches at zoom15+, limits concurrency to2, debounces move-end180ms, aborts superseded work, deduplicates IDs, and caches at most12 cells/12million response-text characters. It validates the response contract/version/truncation. It hides old OSM buildings while the Overture layer is active; no double-stacking. Outside pilot/wider zoom/failure falls back to OSM with disclosure. A partially covered viewport is explicitly labeled, and buildings beyond the pilot are not shown in that view.

Height data remain nullable/unmodified. Rendering uses supplied height; otherwise supplied floors×3m; otherwise disclosed6m schematic height. Known zero stays zero. Underground flags suppress underground buildings. Unknown heights have a distinct neutral tone. These are approximate footprint extrusions, not complete/surveyed/photorealistic models. OSM/Overture/Microsoft/ODbL attribution is linked. Building parts remain absent under the pilot contract.

**First task after main reports statewide ready:**
1. Inspect the new handoff/contract and live relative-proxy responses. Determine actual geographic coverage, release, tile/cell delivery, limits, height/parts/null semantics, attribution, caching and errors. “Statewide integrated” is a user report until those checks are performed.
2. Replace the frontend's pilot rectangles/version/query assumptions with the documented statewide interface. Do not just relabel the pilot as statewide or fetch statewide GeoJSON into the browser. Coordinate any root/dependency/config changes through main; do not install unilaterally.
3. Preserve bounded loading, cancellation, coherent old/new coverage, source failure handling, linked-map independence, City/Flat/Landscape behavior and source-qualified height disclosure. Update UI copy only to the coverage actually supplied.
4. Verify desktop Rancho, Oakland and a previously outside-pilot location; test mode changes, one failure/stale-request path and linked maps. Measure requests/payload/work sufficiently to catch a new responsiveness regression. Do not repeat a whole historical suite before the first useful rendered checkpoint.

Main handoff reference: `docs/BUILDINGS_HANDOFF.md` **in main**, not this checkout. Frontend integration points: `src/frontend/buildings.ts`, `src/AtlasMap.tsx`, building statuses/provenance in `app/page.tsx`, `tests/ui/buildings.spec.ts`. Do not copy backend source/data into this tree.

### Remaining original milestones, in order

1. **Complete statewide City coverage adoption** as above. Pilot is functional; statewide coverage and any building parts are not yet frontend-complete. Keep camera/selection and CES readability intact.
2. **Explore Alternatives — largest missing feature, not implemented.** Agree/publish the main-owned query contract before real results: confirmed starting point; explicit geographic radius/distance definition (proposed straight-line); one selected environmental indicator and lower raw-value criterion; matching definition/unit/release/period; stable ordering/ties; null exclusions; bounded limits; empty/error states. Do not create a composite neighborhood grade or implied safety recommendation. Results are tract candidates, never fabricated/confirmed addresses; no centroid substitution for confirmed-coordinate facility APIs. No endpoint was found in BACKEND_CHANGES at migration; recheck current main. Prepare the frontend interaction while main supplies the query if necessary, but do not present synthetic results as live.
3. **Finish desktop Landscape/X-Ray refinement:** deliberate cross-indicator extrusion transitions, selected-tract/roof-edge inspection clarity and label density; consistent source/loading states; no regression to whole-map queries or source rewrites on every zoom frame. All four categories/23 fields and healthcare/schools already work—do not rebuild them.
4. **Finish geographic comparison acceptance:** linked maps are implemented, not absent. Review final desktop evidence/camera/source-failure behavior, correct signed differences, same-tract distinct pins and null/incompatible/tiny-gap cases. The facility dialog is already fixed. Further polish should respond to concrete defects/user feedback.
5. **Integrated desktop refinement and coordinated local integration:** targeted keyboard/focus/reduced-motion/contrast/failure checks, reviewed stable full frontend diff, user-coordinated checkpoint with main, owner commits and main-owned merge, combined backend/UI/build checks. No blanket performance/accessibility claim. Preserve main/frontend separation until that checkpoint.

Mobile/bottom sheet is explicitly deferred by user. Power remains source-gated; fire/remediation/routes need suitable verified source contracts. Terrain/sharing/AI/voice/sponsors remain recorded outside these initial increments. No resurrection of exhausted investigations or scope deletion.

### Evidence, tests and limits

Latest application build passed at9e0e6b3. Latest Overture checks:5 focused tests passed in28s (Rancho source replacement/cache/Flat/3D, simulated503 and outside-coverage fallback, linked Oakland/Fresno, source readiness). Actual Rancho view loaded9,305 deduplicated footprints from12 cell requests,590 unknown heights; renderer returned5,527 fragments, **not unique visible buildings**. Repeated same-view requests reused cache. Screenshot/counts: artifacts/building-coverage/rancho-overture.png and frontend-counts.json. Desktop map-first plus all23 live-measure unit/value/access checks passed2/2 in46.4s; prior linked facility-dialog test passed. Top-down checks passed2/2. Historical full31-test pass predates later changes and is not a current full-suite result.

Useful focused commands (preview must be ready):
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/ui/buildings.spec.ts`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/ui/map-first.spec.ts tests/ui/top-down.spec.ts`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/ui/responsiveness.spec.ts tests/ui/relief-readiness.spec.ts`

Select geography/atlas cases with `-g` when relevant; some older tests include mobile passes or assume evidence opens by default. Update obsolete interaction assumptions deliberately, without weakening data/render assertions. Test code may inspect map instances through React internals; never expose those internals in application code or accidentally return a MapLibre instance from page.evaluate (the earlier serialization mistake). The public GeoJSONSource API is getData(); current private _data is not a FeatureCollection.

No backend tests/acquisition should be rerun from this frontend checkout just to satisfy missing ignored datasets. No new memory/global configuration edits are requested. When reporting progress, state what actually changed/tested and any remaining coverage gate; keep the user-facing summary short.

## Sol continuation — statewide adoption and desktop refinement, 2026-11-07

User reported main finished; independently read current main BUILDINGS_HANDOFF.md, BUILDINGS_STATEWIDE.md and BACKEND_CHANGES.md and verified the catalog plus an actual Fresno MVT through the relative :3001 proxy. Statewide online serving is ready; complete offline extraction is a separate optional artifact, not claimed complete here.

### Implemented

- Replaced hardcoded pilot rectangles/GeoJSON cells with the catalog-validated, release-pinned zoom-14 vector source. Existing MapLibre overzooms bounded detail tiles; no statewide GeoJSON building download, new dependency, backend edit or shared-config change. Tile template placeholders remain unescaped after same-origin resolution.
- Renders building and building_part layers, suppresses full parents with has_parts=true and underground records, retains measured zero and absent height semantics. Source-supplied metres, otherwise disclosed floors×3m or 6m schematic display; missing heights keep their distinct neutral tone. No source value mutation or unique-inventory inference.
- OSM stays visible until current Overture detail crosses source/render readiness. Movement, mode changes, cancellation/generation guards and tile failure cannot reveal stale Overture after a superseding view. Errors restore OSM and movement retries failed sources. Disabled layers do not keep loading; linked map instances retain independent sources and share release/definitions only. Native viewport tile loading/cache replaces the pilot LRU. Returning to City can reissue the same tile URLs; no zero-request or zero-transfer cache claim.
- Source notice is compact and shared as “Both views” when linked statuses agree. Full envelope/border, completeness, upstream dependency, source-height and schematic-height limits stay in Map sources & limits, with attribution/license links.
- Ready Landscape buffers now crossfade at the same shared analytical scale instead of switching plateau visibility abruptly. Reduced motion remains immediate. Native opacity transitions avoid per-frame geometry/height rewrites. Local road names become quieter in Landscape; city/place names remain. Tract hover now carries raw value/unit, source percentile where supplied, period and tract-level qualification; click/evidence remains the readable alternative.

### Evidence and working-style correction

Initial browser run exposed a build-time proxy environment omission; rebuilt with ATLAS_BACKEND_ORIGIN. Next run exposed URL-encoded tile template braces; corrected before adoption verification. No backend data was copied. The old pilot assertion that mode re-entry emits zero request events was invalid for native vector sources; it now checks reuse of the same release-keyed tile URLs, not a universal network-cache guarantee.

Before the last desktop polish, linked Oakland/Fresno building/parts rendering passed (10.4s); focused Rancho replacement, Flat/3D, injected503 fallback, recovered Fresno and outside-envelope behavior passed (11.5s). Rancho sampled seven z14 requests, 17,653 source fragments, 2,646 fragments with missing heights and 5,882 rendered fragments; counts are not unique buildings. Browser resource timing did not expose tile-worker byte totals, so no measured frontend transferred-byte total is claimed. Main's tile sizes remain backend evidence only. Reviewed actual linked screenshot: both cities show physical buildings and readable tract shading; the verbose duplicated notice motivated its compaction.

User asked to stop the lengthy testing cycle and will test the UI directly. No further browser runs after that direction. Final hover/label/crossfade polish has type/build checks only, with visual acceptance left to the user. No broad responsiveness/accessibility certification. Preview stays on :3001 with the :3000 proxy.

### Retained scope and integration checkpoint

- **Explore Alternatives explicitly deferred by user in this session.** Revisit when requested and main publishes a query contract: confirmed origin; explicit straight-line radius/candidate geometry meaning; one strictly lower environmental raw-value criterion; matching definitions/units/release/period; null exclusions; stable distance/tract-ID ordering/ties; bounded results; honest empty/errors. No invented results/address or centroid substitution.
- Desktop comparison already exists with compatibility/signed/tiny-gap/null safeguards, same-tract distinct pins and linked cameras. This pass confirms statewide buildings on both panes; final holistic evidence, keyboard/focus, reduced-motion and source-failure acceptance remains user review/combined integration work. Existing facility-dialog fix is preserved.
- Tract inspection/label/cross-indicator refinement implemented above. Dedicated elevated roof-edge outlines are not implemented: the installed renderer's line layers do not expose roof elevation; retain ground selected/inspection outlines and evidence. Revisit only if user review identifies inadequate selection clarity and a supported bounded rendering method is agreed; do not invent physical/analytical heights to fake it.
- Mobile/bottom sheets remain deferred by user. Power/fire/remediation retain source gates; terrain/sharing/AI/voice/sponsors retain original backlog.
- All work local in frontend/atlas-interactive. No merge/rebase/cherry-pick/push or root/shared-dependency changes. Main integration requires the user-coordinated paused checkpoint, full stable frontend diff review against frontend-handoff-v1 and main-owned merge/combined checks. No integration permission is inferred from this implementation pass.

## Statewide infrastructure exploration — 2026-11-07

User requested infrastructure visible at statewide zoom and during general navigation, without requiring an address. Prior behavior supplied only six nearest facilities per source after an address confirmation, so no-address statewide Infrastructure was empty.

Implemented frontend-only acquisition of the verified CDE/CDPH coordinate-bearing inventories through the existing version-pinned `/api/facilities/catalog` and bbox API (`evidence=linked`). Count probes recursively subdivide bounds until every leaf fits the API's 1,000-result bound; any unresolved truncation, schema/version change, budget/depth excess or ID-count mismatch withholds that category instead of silently claiming completeness. Shared-edge duplicates are removed by source ID; distinct co-located records remain. Two requests maximum, 256-query/category and depth-16 bounds; successful release-keyed inventories cached in a bounded module cache. No acquisition on map movement. Failures/cancellation are isolated by source; partial source availability is disclosed. This is complete coverage of coordinate-bearing records in the verified inventories, not every real-world provider or service.

MapLibre clusters display point counts at broad zoom; click expands a cluster, and zoom14+ shows individual markers. Healthcare/school toggles and a name-search directory are accessible without an address. The directory displays the first50 matches with an explicit narrowing prompt; it does not cap the map inventory. Individual markers/directory entries open shared source details including subtype, status, period, datasetVersion and limitations. Explicit Show on map moves the camera to the published point without creating a confirmed address. General map markers have null distances; the existing independently queried nearest-six lists and same-source distance comparisons remain for confirmed addresses. Both linked maps receive the same complete inventory, with their own rendered geography. No hypothetical route or current access guarantee.

Actual production-loader check through :3001: **14,919 healthcare + 9,946 schools = 24,865 unique source IDs**, matching root query counts. All general-inventory distances remain null. Final count-probe strategy:164 HTTP requests,19,767,824 decoded response bytes across both sources, observed max concurrency2. An earlier direct-result subdivision transferred61,107,696 bytes; replaced before delivery. Counts/payload evidence: `artifacts/infrastructure/statewide-inventory.json`. Final adapter stores compact facility fields rather than whole sourceAttributes. Full CDPH inventory has two additional records without query coordinates; they are not fabricated as map markers. Historical Closed schools and source service subtypes remain visible.

TypeScript/build and bounded live data-completeness verification performed; no browser suite or fresh rendered/keyboard/performance certification, honoring the user's direction to test the UI themselves. Preview remains :3001; refresh to load the new bundle. UI runtime/rendered acceptance is user review. Main/backend/data/dependencies/config unchanged. Local source inventories remain the evidence boundary. Power still requires its verified source contract; routes need a routing contract. Alternatives/mobile remain user-deferred. No integration/merge/push/deployment.
