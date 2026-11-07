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
