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
