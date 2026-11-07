# Interactive frontend brief and progress

Complete Astra assignment: [ASTRA_FRONTEND_PROMPT.md](ASTRA_FRONTEND_PROMPT.md). Includes the latest user request for vector-basemap/cartographic fidelity; retain MapLibre, with deck.gl/Three.js only for justified extensions.

## Latest authorization: full frontend independent of backend readiness

User explicitly requests full frontend features even where backend work is incomplete, the six newly installed design/implementation/testing skills, and a well-built root design.md. This section supersedes earlier instructions that would leave unsupported features as merely inactive placeholders.

Build all planned interactions behind a frontend-owned provider interface. Live provider uses actual endpoints with evidence/readiness guards. Preview provider supplies deterministic, explicitly synthetic fixtures for unsupported indicators, facilities, charts, stories, missing-data cases and multi-location comparison. All feature paths must be usable in preview, not disabled mock buttons. Never change live measurements or silently substitute preview results after a live request fails.

Default initial view stays the normal single California map with supported live evidence. Provide a clear “Explore full UI preview” entry and persistent “Preview data — synthetic examples” labeling when enabled, including panel, tooltips, legends, story copy and facility details. Preview locations/facilities must be labeled examples, not verified real-world findings. Live and preview never share a chart, computed finding, or unlabeled choropleth. Switching providers aborts requests, separates caches, and clears or explicitly remaps incompatible selections. Users can exit preview at any time.

Frontend-only fixtures belong in src/frontend/fixtures/** or public/ui/fixtures/**, never backend-owned data/**. Contracts for the frontend view model belong in src/frontend/** and adapt existing shared types read-only. Define provider methods for selection, indicator catalog, map features, inspection evidence, facilities and comparison views. They may describe future capabilities but must not be claimed as existing API routes. Back-end-owned calculations remain authoritative for live results; preview calculations are demonstrative, clearly labeled and isolated.

The requested root design.md is explicitly authorized as a frontend deliverable. It is the frontend source of truth for layout, visual tokens, component anatomy, interaction/state behavior, map semantics, accessibility, responsiveness and provider states. Astra must complete concrete implementation tokens and decisions before substantial UI code, and keep it synchronized after visual verification. This does not transfer ownership of other root config or manifests.

Installed skills in /Users/anand/.codex/skills/: frontend-design, ui-ux-pro-max, shadcn, web-design-guidelines, webapp-testing, vercel-react-best-practices. They are available on the next turn/new session. Read each relevant entrypoint, use supporting references selectively, and apply the user brief over generic templates. frontend-design leads visual composition; Hallmark supplies restraint/consistency checks; ui-ux-pro-max supplies targeted validated recommendations; shadcn applies where actual component setup is appropriate; Vercel skills guide React performance and final interface review; webapp-testing guides browser checks. Preserve the existing Playwright suite rather than adding a second testing stack merely for a skill example.

Skill installation is not app dependency installation. Request a concrete shadcn/Tailwind/primitives dependency/config change through the user to the integration owner if needed. Continue independent layout/provider work while waiting. No unilateral manifest/lockfile/config edits, no package migration, no extra agents.

Astra acceptance now includes: full four-mode flows working in explicit preview, existing live comparison preserved, multi-location behavior, infrastructure marker/list interaction in preview, substantive design.md, and screenshots/tests separately identifying live and preview coverage. Missing backend is an integration dependency, not a frontend scope cut. Report implementation gaps separately from API gaps. A UI screen with unavailable-state text alone does not satisfy preview implementation.

## Status and authority

Prepared 2026-11-07 for the user-run Astra session, followed by Sol in the same thread. This file is an implementation handoff, not a claim of frontend completion. No application files changed in preparing it. User requests one substantial, bounded foundation pass, then visual review and fixes; a single pass cannot guarantee a complete all-source product while backend contracts remain unresolved.

Read AGENTS.md and FRONTEND_HANDOFF.md for ownership. Read README.md and PRODUCT.md, EXPERIENCE.md, ARCHITECTURE.md, BUILD_PLAN.md for full context. The user-approved interaction below supersedes earlier suggestions to start in an example comparison, and extends the earlier two-address target to multiple locations. Do not edit integration-owned planning files; report their needed reconciliation to the integration owner through the user.

## Approved product interaction

Start with one normal, full-screen California map with integrated environmental information, similar in interaction familiarity to Google Maps. No landing-page hero or automatically loaded comparison. Four clickable modes: Environment, Health, Community, Infrastructure. Search and inspect one address; optionally add more addresses and split the map into comparison panes, with corresponding information in the side panel.

User wants the full original scope retained and independently adaptable if measured constraints arise. No feature is silently removed because a backend source is not ready. AI/voice/sponsor integrations remain optional and must not delay the map-first foundation.

## Proposed visual defaults for this pass

Use $hallmark for a cohesive contemporary cartographic atlas: warm off-white controls/panels, dark ink typography, quiet borders, restrained map labels and data-led color. These styling choices are proposed defaults from the discussion, not user-provided exact font/color tokens. Choose and document one system rather than generating alternatives. Preserve the existing Next.js/React/MapLibre stack and frozen dependencies; Tailwind is not installed and must not be added unilaterally.

Map fills the application viewport. Compact identity/search area at top left; persistent four-mode switch; active-indicator selector nearby; shared legend; map controls away from panel and attribution. No marketing dashboard, gratuitous cards, modal onboarding, or example data covering the initial map.

Desktop contextual panel on the right, collapsible; map reflows and resizes correctly. Narrow screens use a bottom sheet or inline panel and one visible map with location switching and retained comparison evidence. Document the exact composition and tokens chosen. Keep controls readable at 320/375/414/768 pixels and desktop.

## Initial map and selection

- Initial state: one California overview, no selected address and no automatically opened two-example comparison. Proposed default is the available Environment/PM layer, with its actual provisional evidence status disclosed where relevant.
- Do not require /api/demo to initialize the map. It may remain an explicitly labeled optional example action for reproducibility. A backend/demo error must not prevent basic map exploration.
- Address search returns candidates; require user confirmation even for a single valid candidate. Preserve address-range precision wording. Show invalid candidates/errors honestly, including error entries inside HTTP-200 responses.
- Confirmed selection flies to its coordinate, pins the address, outlines its tract, and opens contextual evidence. Address and tract measurements must not be confused.
- Tract click/hover is inspection, not address selection or automatic addition to comparison. Explicitly distinguish inspected tract from selected address. Use the contract's display properties for inspection; request an additive API if more fields are required.
- Zoom, orientation/reset, and supported pitch controls. No promises of terrain, extruded buildings, satellite imagery, or provider capabilities not actually available. Label pitch honestly rather than implying a full 3D dataset.

## Modes and full inventory

| Mode | Full intended content | Behavior |
| --- | --- | --- |
| Environment | PM2.5, ozone, diesel particulates, traffic impacts, toxic air releases, cleanup-site burden | Tract shading and evidence |
| Health | Asthma emergency visits, cardiovascular emergency visits, diabetes prevalence, low birth weight | Population-level tract indicators |
| Community | Poverty, education, housing burden, age and racial/ethnic composition | Appropriate choropleths and neutral composition charts |
| Infrastructure | Healthcare facilities, public schools, power plants | Category filters, qualified marker details, linked lists and straight-line distances |

All four mode controls are real navigable UI states. Remember the last selected indicator in each. Preserve locations, comparison membership, inspection, and camera state where appropriate when switching modes. Do not recolor unchanged PM data under another indicator's name. Unavailable modes/indicators explain their actual readiness and do not show misleading layers.

Conditional original extensions: remediation-site points and fire services require suitable sources. Detailed terrain/buildings, shareable views, AI, voice, and sponsor services remain optional. No nationwide expansion.

## Single-location evidence

Panel hierarchy: address/place and tract → active raw value/unit and period → supplied statewide percentile where available → short definition/interpretation → supporting charts → expandable sources/methodology/limitations. Add to comparison is a prominent explicit action. Keep location context visible when collapsing the panel.

Distinguish measurement period from release date. A statewide percentile-position strip may show A/B/etc. on the 0–100 scale; it is not an empirical distribution histogram unless distribution data actually exist. Keep raw values and percentiles separate. Unknown values and dates remain unknown.

## Multiple-location comparison

- Maintain a collection of selected locations with stable identities, not a fixed pair. Adding the second transitions from one map to paired maps. Add/replace/remove/reorder controls must preserve the other locations.
- Two locations: side-by-side panes on desktop. Three/four: grid when space allows. More locations remain in the comparison collection; let users choose the visible subset rather than shrinking maps indefinitely. This is a display limit, not a silent two-address product cap.
- Narrow screens: one visible map with accessible location tabs/selector; paired/multiple values remain reachable in the panel. Remove back to one returns to normal single-location view; clearing all returns to California overview.
- One shared active mode, indicator, scale/domain, legend and units across panes. Do not derive percentile domains from current viewport data. Stable location identity is separate from mutable visible labels/order.
- Linked cameras match zoom, bearing and pitch around each location's own center. Do not copy absolute centers across distant addresses. Provide unlock/reset, avoid event loops, call resize after layout changes, and clean up removed maps/listeners/requests.
- Side panel has Overview and Selected indicator views. For multiple locations use aligned values/charts or a compact table; optional reference location for explicit differences. No automatic overall winner.
- Backend numeric helpers and semantic policies remain read-only. Use supported comparison logic; request an additive multi-location/reference comparison contract if needed, rather than inventing new correctness policy in frontend code.
- Same-tract locations retain distinct pins but share tract-level observations. Explain this and preserve any genuinely address-dependent facility distances later.

## What stands out and comparison stories

Overview surfaces supported differences and similarities. Clicking a finding selects its mode/indicator and updates maps and evidence together. Within a comparable indicator, show aligned measurements and differences. Do not rank unlike raw units against each other, declare significance without a method, or invent a cross-indicator importance score. If a global ranking method is unavailable, use curated topic order rather than calling items the largest overall differences.

Optional in-panel guided topics: Air around these places; Health in neighborhood context; Community context; Nearby essentials. A step selects available evidence, explains it concisely, and permits free exploration at any time. Ground deterministic copy in actual records and definitions. With only PM usable, only the supported story has live findings; unavailable topics explain their dependencies.

Demographics use neutral charts and descriptions, not hazard coloring or ranked concerns. No causal links, personal disease probabilities, safety judgments, or composite neighborhood scores. Preserve source-definition caveats in story interpretation.

## Infrastructure

Design category filters, category-specific markers/clustering, facility details and per-location lists. Clicking a list item highlights its marker. Distances are explicitly straight-line; nearest means among covered/loaded facilities, not guaranteed nearest statewide. Show source/status/coverage where available. Proximity is not access, capacity or travel time. No fabricated facility pins while API/data are unavailable.

## Inspected backend checkpoint, not new data verification

Frontend branch was clean at baseline 2f405625a5272ff7d09cf132d9ccc6f8a2066be4 when this brief was prepared. A previous UI already exists; evolve it in owned paths rather than scaffolding another app.

Read live main-worktree /Users/anand/Projects/hackathon/docs/BACKEND_CHANGES.md before implementation and at checkpoints; it does not synchronize into this branch automatically. As inspected during this review:
- /api/demo, /api/geocode and /api/map retain baseline shapes.
- Additive /api/indicators is documented as available on main, with 23 target field entries and explicit availability/unit/period states. Consume through a frontend-owned adapter; do not copy backend modules into the frontend tree or infer readiness from field presence.
- PM is baseline-active-provisional, including a pending unit-corroboration gap. Other target indicators are mostly metadata-only. Age/demographic units and periods are dictionary-verified, but live chart/rendering support remains work. /api/map exposes only the documented fields, so not every catalog entry is a map layer.
- Facility API is unavailable. Existing samples do not establish a usable statewide facility inventory.
- /api/health checks artifact file presence only, not scientific or live-service readiness.

Astra should inspect the actual catalog response and current backend log when starting; documentation observations above are not an independently rerun endpoint or source validation. Rendering/metadata additions must respect readiness, provenance and available map properties. Backend changes are additive; request unresolved capabilities through the user.

## Ownership and operation

Frontend owns app/** except app/api/**, src/AtlasMap.tsx, src/map-theme.ts, new src/components/**, src/hooks/**, src/styles/**, src/frontend/**, public/ui/**, tests/ui/**, playwright.config.ts, .hallmark/**, and this file. Backend owns API/data/numeric correctness/shared contracts/root config/lockfiles and integration. Full details in AGENTS.md and FRONTEND_HANDOFF.md take precedence.

Do not install new dependencies, alter package manifests/shared types, duplicate backend data, merge/rebase/cherry-pick, or edit main. npm ci from the baseline lockfile is allowed if needed. No additional agents. Keep local; no push, publication, deployment, purchases or global changes.

Reuse an existing :3001 preview if available. Otherwise:

```sh
ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000 npm run dev -- --port 3001
```

Keep browser API requests relative. Backend is :3000. Read relevant installed node_modules/next/dist/docs/ before code. Do not run build concurrently against the same .next directory as your dev preview; stop only your frontend server when a build requires it. No backend source acquisition to repair absent data in this worktree.

## One bounded Astra foundation pass

1. Inspect code/contracts and report the chosen composition briefly. Use this brief to make routine design choices; ask only about a consequential unresolved choice.
2. Implement the cohesive map-first shell, one/many-location state, mode/indicator controls, contextual/comparison panel, supported evidence/story presentation, responsive map panes, and honest unavailability states in existing owned paths.
3. Wire the real available API paths; preserve existing confirmed address matching, null handling, stale-request protection, source disclosure and actual map rendering. Retain the full target in the component structure and backlog, without pretending unavailable integrations are complete.
4. Inspect the browser at desktop and 320/375/414/768 widths; fix major visual and functional defects. Update UI tests that assumed automatic cached comparison to exercise the new initial state and explicit comparison path. Run relevant UI checks and TypeScript/build as appropriate, observing preview isolation. Backend semantic tests belong to main.
5. Update progress below with owned file changes, exact checks/results, limitations, backend requests, screenshots if created, deferrals/triggers, and ordered Sol continuation work. Stop for user visual review and model switch after the coherent increment; do not launch an open-ended completion loop.

## Acceptance checklist for the handoff to Sol

- [ ] Starts with one California map and no auto-selected example comparison.
- [ ] Search requires confirmation; selected address/tract evidence is explicit.
- [ ] Four modes are navigable, with supported indicators and honest readiness states.
- [ ] Adding/removing/replacing locations produces the right single/paired/grid/tab layout.
- [ ] Active indicator and legend agree across all visible panes and panel values.
- [ ] Multi-location data model preserves stable identity and handles same-tract locations.
- [ ] Panel, source details, supported findings and story navigation are coherent.
- [ ] Raw/percentile/null/provisional metadata semantics are preserved; no invented facilities.
- [ ] Camera/layout changes resize correctly, requests cancel safely, removed maps clean up.
- [ ] Keyboard, narrow-screen and reduced-motion paths checked; failures are visible.
- [ ] Actual rendered tract features verified, not merely successful build or screenshots of empty maps.
- [ ] Original full inventory retained; unavailable backend capabilities and remaining frontend work listed separately.

Unchecked items are not completion claims. Report evidence, not just tick marks.

## Implementation results

Not started by this preparatory review. Astra fills this section after its bounded pass.

## Backend requests and Sol continuation

Initial requests to assess against current backend: per-indicator map properties and approved metadata; authoritative inspection data for fields absent from display features; facility API/coverage; multi-location compatibility/comparison helper; performance support for broad California viewports if measured necessary. Do not assume any is already delivered.

Integration owner should later reconcile PRODUCT.md/EXPERIENCE.md with map-first initial state and multiple-address scope. No shared documents edited here.

## Foundation review checkpoint — 2026-11-07

Implemented in `frontend/atlas-interactive`, without workers, merges, shared configuration changes or backend edits. The original uncommitted prompt is unchanged; this document and design.md were extended rather than discarded. No dependency installation was needed.

### Changed paths

- app/page.tsx: map-first application state, confirmed search, location collection, shared mode/indicator selection, comparison rail, stories, sources, infrastructure explorer and provider switch.
- app/layout.tsx: loads the new scoped atlas stylesheet. Original app/globals.css is preserved but no longer imported; it belonged to the replaced landing/comparison layout.
- src/AtlasMap.tsx and src/map-theme.ts: OpenFreeMap Positron vector style, explicit OSM raster fallback, native tract/facility layers, selection/inspection outlines, linked camera orientation/zoom, resize observation and cleanup.
- src/frontend/provider.ts and src/frontend/fixtures/preview.ts: live adapters, deterministic synthetic preview, null/zero/incompatible/failure scenarios, synthetic composition and point facilities. No backend data copied.
- src/styles/atlas.css: documented tokens, desktop rail, one-map mobile layout, focus styles and reduced motion.
- tests/ui/atlas.spec.ts: replaces obsolete automatic-example assumptions with four meaningful interaction tests.

### Live-connected

Default California overview has no selected examples and does not call /api/demo. Confirmed geocoding, source-qualified PM and ozone evidence, named map layers, inspected tract evidence, and backend-computed pairwise raw differences use current :3000 APIs through relative :3001 requests. Catalog backendReady is additionally restricted to the known PM/ozone map contracts. Tract observations use the pinned CES release. Non-ready modes clear the analytical layer and explain live unavailability. Switching providers remounts state and aborts requests; neither provider silently falls back to the other. No cross-provider cache exists.

### Preview interactions available

All four modes and target indicator controls; one/two/three/four maps; fifth and later locations retained with a four-pane maximum and user-selected visibility; single visible mobile map with location switching. Add, confirm search, replace, remove, reorder, select reference, clear, collapse/reopen evidence. Same-tract examples (Example 1 and Example 6) retain separate pins and common tract values. Story topics expose indicator steps and update the shared selection. Raw comparisons, percentile strips, per-location neutral age/racial composition bars, source disclosures, and missing/zero/incompatible/request-failure scenarios work. Healthcare/school/power filters, native markers, linked list selection/highlight and facility details are synthetic. Distances are haversine straight-line distances between synthetic coordinates, not access claims. Preview context appears in header, legend, evidence and details.

### Checks actually performed

- `npx tsc --noEmit`: passed.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:ui`: four tests passed after corrections. Covers real live tract rendering and confirmed Oakland geocode (8.33 µg/m³), ozone, provider clearing, five-location/four-map cap, null vs zero, incompatible comparisons, category filters, 320/375/414/768 widths with no document overflow, actual mobile map height, replacement/reorder/reference, same-tract behavior, story navigation, reduced-motion configuration, upstream failure and stale-search cancellation. Tests collect uncaught page errors in primary live/preview flows; none occurred in those final runs.
- `npm run build`: passed with only the frontend server stopped. Backend was not restarted. Preview restored in its existing tmux session after build. Final code is also typechecked; see final validation note below for last build rerun.
- Independent browser camera probe: four panes started at zoom 11; clicking the first zoom-in updated all four to zoom 12. Raster fallback reached loaded state. No frame-time or memory benchmark was performed.
- Screenshot critique found and corrected two genuine zero-height map bugs: MapLibre CSS specificity on desktop and percentage-height resolution in the mobile flex layout. Rendered-feature diagnostics alone had missed the blank visible container; the suite now asserts mobile map height.
- Console inspection observed an upstream Positron missing highway shield sprite warning (`us-interstate_5`). Basemap roads/labels otherwise rendered. This is retained as a provider-style issue, not hidden or called error-free.

### Screenshots and visual findings

Ignored local `artifacts/`: overview-fixed.png (real live statewide tracts), live-ozone.png, paired-fixed.png, three.png, multi-final.png, community.png, infrastructure-final.png, mobile-320.png / mobile-375.png / mobile-414.png / mobile-768.png, failure.png and live-failure.png. The latest mobile-width captures supersede mobile-final.png and early blank captures. Reviewed overview, paired map, and final 375px infrastructure capture directly. Calm map canvas and readable labels are successful; dense multi-place rail still needs editorial refinement. Synthetic geometry is intentionally obvious rectilinear example geometry, not California tract evidence.

### Backend-blocked / requests through integration owner

1. Remaining environment, health and socioeconomic layers need verified normalized observations, units, measurement periods, comparison keys and named map support. Revisit each when catalog readiness and its route contract are explicitly documented. Field existence alone is not sufficient.
2. Live demographic compositions need an agreed normalized category/denominator contract; current frontend preview uses grouped age/race IDs rather than inventing a live aggregation API. Trigger: documented category identity, period, missing/suppression semantics and unit.
3. Facility endpoint remains absent: require category, stable ID, coordinate, name, source/status/date and coverage constraints. Trigger: documented viewport/nearby route and distance/completeness policy. No dependency or configuration request is currently necessary.
4. OpenFreeMap public use and keyless access verified against https://openfreemap.org/ and https://openfreemap.org/quick_start/. Keep attribution and network dependency. Investigate the missing highway shield sprite with provider style revision; raster fallback remains available.

### Frontend-incomplete and ordered Sol continuation

This is a substantial foundation checkpoint, not a claim of every original acceptance detail completed.

1. Expand Overview into an aligned cross-indicator table and curated multi-metric similarities/differences. Currently it offers stories plus the selected metric's comparison sections; equal values/same tracts are identified, but no comprehensive multi-indicator overview exists. Trigger: visual review of rail density; retain backend-compatible comparisons, no unlike-unit ranking.
2. Improve cartographic inspection: click outline/evidence is present; hover tooltips, inspection-outline clearing on return, and location colors beyond stable numeric identities need refinement. Trigger: next visual polish pass. Selected marker/list linking works, but facility list selection does not yet fly to the facility.
3. Complete all acceptance edge cases: delayed live evidence/map race assertions, source failure during basemap switching, keyboard-only end-to-end operation, focus transfer on panel collapse, accessibility contrast measurements and screen reader testing. Basic semantics/focus/reduced motion are implemented, not certification. Four tests do not prove exhaustive correctness.
4. Refactor the substantial page component into smaller owned components/hooks after user visual review. Add request deduplication/bounded successful-response caching if measurements justify it; current requests abort on invalidation and have no shared provider cache.
5. Preview composition has meaningful per-location distributions and missing scenarios; more varied long-label/partial-failure fixtures and richer story prose remain. Synthetic percentile/difference demonstrations are not findings about actual locations.
6. Measure payload/frame/memory behavior on target hardware; a four-context cap is implemented, not a measured performance guarantee. Panel motion is intentionally omitted in this pass; preserve map readability before adding transitions.
7. Conditional remediation points/fire services require suitable verified sources. Terrain, custom 3D, AI, voice and sponsor integrations remain optional extensions and were not attempted.

Stop here for user visual review and the requested manual switch to Sol. No frontend merge or publication is authorized or performed by this checkpoint.

Final validation: after the last overview-fit and stale-evidence guard changes, TypeScript passed, all four UI tests passed (19.6s), production build passed again, and `git diff --check` passed. Restored :3001 via the original tmux pane with the backend proxy environment. Build/dev may regenerate next-env.d.ts; it was not hand-edited. No local commit was created, so the complete owned diff remains available for review alongside the preserved uncommitted handoff files.
