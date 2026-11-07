# California Environmental Atlas — frontend design specification

Status: user-approved interaction brief plus proposed visual defaults, prepared for Astra implementation. No rendered UI, color-contrast test, accessibility audit, or completed component system is claimed by this document. Astra must resolve the implementation decisions below before substantive UI code and update this file after visual review. Sol continues from this same system.

## Purpose and authority

Help people explore California places and compare environmental conditions, population health, community context and essential infrastructure. The opening experience is a familiar map, with evidence integrated elegantly. Two-or-more-address comparison is an optional expansion of that map.

User decisions override conflicting older project notes: no automatic example comparison; four navigable modes; map panes split when addresses are added; contextual/comparison information in a side panel; full frontend feature work may proceed with explicit preview fixtures before backend completion.

Read AGENTS.md and docs/FRONTEND_HANDOFF.md for path ownership and backend contracts. This file is explicitly user-requested and frontend-owned; it does not authorize changing root configuration or backend definitions. The latest section in docs/FRONTEND_PROGRESS.md explains preview authorization.

## Design principles

- Geography is the main canvas. Do not put a marketing landing page or dashboard between the user and the map.
- Carry visual character through cartography, typography and purposeful interaction; avoid ornamental UI that competes with evidence.
- Evidence appears progressively: spatial pattern, selected value, explanation, then source/limitations.
- Preserve orientation: selected locations, mode, active metric, pane labels and map scale remain understandable across transitions.
- Make cross-location comparison consistent and readable. Do not turn places or demographics into an overall score.
- Backend availability determines live claims; it does not determine which frontend interactions can be built and demonstrated.

## Screen composition

### Single map, initial state

One viewport-filling California map. Compact product identity and address search near the top left. Four mode controls remain visible, with selected-indicator control nearby. Legend and attribution remain unobscured. Map navigation controls use familiar placement. Right evidence panel is collapsed or minimally inviting until inspection/selection; no preselected comparison addresses.

Proposed initial mode: Environment with current supported PM evidence and honest provisional metadata. The map works independently of /api/demo. Optional verified cached examples are explicit user actions, not initial state.

### Single selected address

Show confirmed address pin, selected tract outline, fly-to, and evidence panel. Address search remains editable. Panel offers Add to comparison. Clicking/hovering a different tract inspects it without silently replacing the selected address. Clearly label inspected versus selected geography and retain a return-to-selected action.

### Comparison

Two locations create side-by-side maps on sufficiently wide screens. Three/four can use a balanced grid when maps remain useful. Additional locations stay in an accessible comparison collection; choose visible panes rather than creating unlimited WebGL contexts. Active mode, indicator and legend are shared.

Panel changes to comparison evidence: Overview and Selected indicator. Each pane and evidence column has matching stable identity. Replace, remove, reorder and choose reference location controls preserve unrelated selections.

One remaining location returns to single-map mode; none returns to overview. Do not reload the entire application or lose user context when layouts change.

### Narrow screens

Use one visible map with location tabs/selector and a bottom evidence sheet or clear stacked evidence region. All selected locations and comparison values remain accessible. Do not squeeze desktop maps into unreadable columns. Opening a sheet must leave a usable return path and respect focus/scroll containment.

Astra records actual breakpoint/panel dimensions and tests at 320, 375, 414, 768 pixels and desktop. Breakpoints must respond to available space, not device names alone.

## Mode and indicator inventory

| Mode | Complete target | Presentation |
| --- | --- | --- |
| Environment | PM2.5, ozone, diesel particulates, traffic impacts, toxic air releases, cleanup-site burden | Sequential tract scales; paired raw values and supplied percentiles |
| Health | Asthma ED visits, cardiovascular/heart-attack ED visits, diabetes prevalence, low birth weight | Population-level tract measures with source definitions |
| Community | Poverty, educational attainment, housing burden, age, racial/ethnic composition | Appropriate tract layers plus neutral categorical/composition charts |
| Infrastructure | Healthcare, public schools, power plants | Category filters, clustered markers as needed, facility detail/list and qualified straight-line distance |

Remember each mode's selected indicator. Switching modes preserves locations and appropriate camera state. Reset context-specific inspection deliberately; do not leave old PM geometry painted under a new metric label. Conditional remediation-site and fire-service features remain in backlog pending appropriate sources. Optional AI/voice are outside this foundation pass.

## Information architecture and components

Suggested component responsibilities, not mandated filenames:
- Atlas shell: viewport, responsive panel, global provider mode.
- Search/selection: query, candidates, confirmation, errors, replacement target.
- Mode and indicator controls: keyboard-usable selection and remembered state.
- Location collection: stable IDs, visible panes, ordering, reference choice.
- Map pane: map lifecycle, geometry source, current layer, selection/inspection, camera events.
- Shared legend: domain, units, no-data symbol and preview status.
- Evidence panel: single, comparison overview and selected-indicator presentations.
- Indicator comparison: aligned measurements, valid differences, percentile-position strip.
- Community charts: categories, denominators, nulls, neutral colors.
- Facility explorer: category controls, markers, linked list and detail.
- Story navigator: question, evidence step, interpretation and source links.
- Evidence drawer: measurement definition, period, release, source, caveats.
- Preview status: persistent labeling, enter/exit and provider boundaries.

Use existing app boundaries and reusable components; do not scaffold a second app. Domain correctness remains separate from presentation.

## Interaction contracts

Search requires candidate confirmation even for a single result. Address-range geocoding is not rooftop precision. Input changes cancel previous requests and candidate lists. Errors inside HTTP-200 candidates must remain visible and cannot be accepted as valid selections.

Selecting an address flies to it and sets the tract outline; the camera then favors readable analysis. Camera linking copies zoom/pitch/bearing around each location's center, never another location's absolute center. Linking must not cause feedback loops. Resize after panel/layout changes and dispose removed maps/listeners/requests.

Use flat or light-pitch analytical views. A pitch control is not evidence of terrain/buildings. Do not add unavailable map-provider features or unlicensed sources to create visual spectacle.

Same-tract addresses retain different pins but share tract observations. Missing values use an explicit unavailable state, not zero. Format differences with proper units, and percentile differences as percentile points. Never infer percentile distributions from current viewport data.

Overview findings are deterministic and evidence-grounded. Use curated topic ordering when no defensible cross-metric ranking exists. No statistical-significance claims without a method. Similarities and noncomparability deserve clear presentation alongside differences.

Story topics: Air around these places; Health in neighborhood context; Community context; Nearby essentials. Step changes update map, legend and panel together; leaving a story preserves normal exploration.

Infrastructure selection links list and marker. Detail includes category, name, source/status/date when available, coverage and straight-line distance. Proximity does not imply travel time, capacity, eligibility or service access.

## Live and preview providers

Implement a frontend-owned provider boundary and neutral view models inside src/frontend/**. Suggested capabilities: catalog, address selections, map layers, inspection evidence, facilities, comparison evidence. Adapt actual API responses read-only; future capabilities are not fictional live routes.

Live mode uses current backend endpoints and actual readiness guards. Unavailable live indicators have explanatory states. Partial or failed live responses never silently fall back to fabricated values.

Preview mode implements the complete target interaction with deterministic synthetic fixtures where needed: all indicators, charts, infrastructure, comparisons, stories, nulls and failure scenarios. It is a working frontend demonstration, not just disabled controls. Keep fixtures inside src/frontend/fixtures/** or public/ui/fixtures/**; do not change backend data/**.

Enter preview explicitly via a visible Explore full UI preview action. Persistently label the screen Preview data — synthetic examples. Tooltips, charts, legends, stories and facility details retain preview context. Use clearly named example facilities/places rather than impersonating a verified real institution. Preview numbers must be internally consistent enough to test formatting and charts but are never findings about real places.

Do not blend provider records in any comparison or finding. On provider switch abort in-flight requests, separate caches, and clear or explicitly remap incompatible selections. Preview must be usable without backend catalog/facility support. Returning to live must restore honest live behavior. Browser tile access can still require internet; preview is not automatically offline mode.

## Visual system to complete before UI code

Proposed direction is a calm light cartographic interface: warm off-white surfaces, dark readable type, controlled chromatic data layers. This is not a request for a generic cream/serif marketing template. Use frontend-design and the product subject to refine it once, rather than generating unrelated themes.

Astra must replace the pending decisions below with concrete named tokens and rationale. They are pending because no rendered design has been reviewed, not permission to improvise styles throughout the app.

| Token family | Required decisions |
| --- | --- |
| Surface/ink | App canvas, panel, raised control, primary/secondary text, borders, focus, disabled, error and preview-state colors |
| Typography | Font families/fallbacks, roles, weights, sizes, line heights; tabular numerals where useful; avoid unnecessary remote font dependencies |
| Spacing | Named 4-pixel-based scale, control padding, panel spacing and content gaps |
| Geometry | Control/panel radii, separators, minimal elevation, actual desktop panel width and responsive constraints |
| Cartography | Basemap treatment, choropleth ramps, missing-data fill, tract outline, inspection outline, label hierarchy |
| Location/category identity | A/B/additional location colors/shapes independent of intensity ramps and facility categories |
| Motion | Fly-to behavior, panel/layer transitions, easing/durations, reduced-motion equivalents |
| Overlay hierarchy | Map UI, tooltips, sheet, dialogs; focus and safe-area behavior; respect actual component primitives |

Store implementation tokens in frontend-owned src/styles/** and reference them consistently. This root design.md is the canonical design document; avoid a competing generated MASTER.md. If a skill offers generated recommendations, inspect them for map-product fit before adopting; reject generic landing-page layouts. Use accessible icons with text/tooltips, not decorative emoji as controls.

Contrast goals: normal text 4.5:1, large text 3:1, essential controls/focus/non-text boundaries 3:1 where applicable. Evaluate against actual surfaces, including map backdrops. These are targets; record measurements/checks before claiming compliance.

## Component state requirements

Define default, hover, focus-visible, pressed/selected, disabled, loading, error, and successful-result states where applicable. Avoid success toasts for ordinary exploration. Search errors are actionable and associated with the field; loading does not shift controls or reuse stale evidence labels.

Mode switches and tabs have proper semantics and visible selection. Touch targets should be comfortably usable (aim at least 44 px where feasible). Tooltips are accessible by focus; no essential information requires hover. Collapsing the evidence panel retains an obvious reopen control.

## Design skill responsibilities

Installed under /Users/anand/.codex/skills/:
- frontend-design: primary visual composition and pre-build critique.
- ui-ux-pro-max: targeted guidance for maps, dense evidence, comparison and accessibility; validate search results rather than persisting generic output.
- hallmark: consistency/restraint, state and responsive review; honor this map-first spec over a landing-page pattern.
- shadcn: suitable control/overlay primitives if configured. Installing a skill does not install runtime UI packages. If needed, request exact dependency/config changes through the integration owner, then continue independent frontend work.
- vercel-react-best-practices: relevant React/Next.js performance guidance, especially large map bundles, request deduplication, stable map instances, state boundaries and unnecessary rerenders.
- web-design-guidelines: fetch current guidelines when doing the actual interface review and apply them to edited files.
- webapp-testing: browser reconnaissance, screenshots, interaction and console verification; preserve the project's existing Playwright approach and ownership.

Read relevant SKILL.md files and references at the point of use. Do not run seven competing redesign processes or obey generic package-install suggestions over repository ownership. No extra agents.

## Acceptance and visual QA

Astra's bounded pass must yield a cohesive working frontend covering the full planned interaction in preview, with live behavior preserved. Backend incompleteness belongs in integration requests; frontend incompleteness belongs in the frontend backlog. Do not conflate the two.

Verify:
- Single California overview on startup; no automatic comparison.
- One, two, three/four and additional saved-in-collection locations; replace/remove/reorder and mobile location switching.
- Four modes and indicator changes, correct shared legend, per-mode memory.
- Comparison overview, selected evidence, community chart, story steps and sources.
- Infrastructure filtering and marker/list/detail interaction in preview; honest live unavailability.
- Preview labeling, provider separation and switching; no silent live fallback.
- Null versus zero, same-tract behavior, incompatible evidence, geocode candidates/errors and request races.
- Camera link/unlock, resize, resource cleanup, bounds and map-source failures.
- Real rendered live tract features; preview overlays tested separately and explicitly labeled in results.
- Desktop plus 320/375/414/768 widths, long addresses, keyboard focus, reduced motion and readable non-map alternatives.

Inspect screenshots at initial overview, selected location, two-location comparison, multi-location layout, community view, infrastructure preview, mobile sheet, and failure state. Check browser errors and interaction behavior. Update tests that assumed auto-loaded examples. Stop only the frontend preview when build/dev isolation requires it. Do not run backend acquisition/tests just to satisfy missing data in this worktree.

A successful build alone does not establish rendered correctness. No performance or accessibility certification without measured evidence. Record commands/results, visual findings, remaining issues, and ordered Sol continuation in docs/FRONTEND_PROGRESS.md.

## Astra-to-Sol checkpoint

Before stopping, synchronize this document to the actual component system and token values; mark any unresolved design choice explicitly. Record which flows are live, preview-complete, backend-blocked, and still frontend-incomplete. Keep future integration requests concrete (contract, needed fields, semantics, test case). Stop for user visual review and manual model switch after the bounded implementation and correction pass.

## Cartographic rendering decision — latest user direction

Visual fidelity is a core goal. Retain Next.js/React/TypeScript and MapLibre GL JS. Evaluate a suitable vector basemap rather than treating the existing desaturated OSM raster style as the final appearance. Define land/water/roads/buildings/labels, zoom hierarchy, tract layer ordering and camera presentation as part of the same visual system. Keep labels readable above environmental shading where the style supports it. Provider/source access, attribution, terms and credentials must be checked; no paid setup or guessed credentials. Keep an owned-code basemap adapter/fallback if access blocks the preferred style.

Use native MapLibre layers for current choropleths, outlines and symbols. Add deck.gl only for a concrete advanced visualization/performance requirement. Three.js is for an optional custom 3D-object/scene feature, not a map-engine rewrite. Terrain/buildings need actual suitable data; pitch alone is not terrain. Dependency/config changes remain requests to the integration owner.

Full executable assignment: [ASTRA_FRONTEND_PROMPT.md](docs/ASTRA_FRONTEND_PROMPT.md). Finalize concrete cartographic tokens in this document before substantive UI code and synchronize them after browser review.

## Foundation implementation decisions — 2026-11-07

Use a viewport atlas: 72px masthead, 56px mode/indicator toolbar, flexible map canvas, 360px evidence rail. Under 900px render one map and a stacked evidence sheet; minimum map height 420px. Up to four desktop maps; additional locations are retained with visibility controls. Native buttons, selects and disclosure elements avoid additional dependencies.

Typography: system sans (-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif), 14px/1.5 body, 12px metadata, 20px brand/panel headings, 32px tabular measurements. No remote font requirement. Warm paper #faf9f5, ink #203c37, muted #586862, rule #d8ded6, accent #27695e; synthetic context uses warm ochre #715017 on #fff1cf. Spacing 4/8/12/16/24/32px; control height 44px; radius 6px; subtle control shadow only. Focus: 3px blue outline with 2px offset. Disabled opacity .5; errors dark red with inline text; selected controls dark green with white text.

Vector basemap: OpenFreeMap Positron, public keyless service verified at https://openfreemap.org/ and /quick_start/ on 2026-11-07. Preserve provider source attribution. Quiet grey roads, pale blue water, warm land, inherited zoom-dependent road/city/street labels and building footprints. Insert analytical fills below first symbol layer; boundaries .6px, selected outline 3px, inspection 2px dashed. Sequential sage/teal percentile ramp stays 0–100, grey no-data; demographics use neutral blue category bars and no hazard percentile. Location pins use letter identities separate from intensity. No invented terrain. Raster OSM fallback is explicit configuration, no tile prefetch or bulk download.

Map controls z=2, labels z=3, search candidates z=10; evidence in layout, never over attribution. Fly-to 700ms (0 under reduced motion); no decorative animation. Preview banner persists in header, legend and evidence. Provider switch remounts provider state and cancels requests. No shared provider cache.

## Implemented foundation and review notes

Concrete source of styling is src/styles/atlas.css; prior proposed tokens above are resolved by the Foundation implementation decisions section. System sans is deliberate for dense map controls, overriding generic display-font advice. Native controls are used because shadcn runtime dependencies are not installed; no dependency changes requested. Numeric location identities remain stable through reorder (colors beyond the common dark pin remain a polish item). Demographic charts are neutral blue with explicit percentage labels. Facility categories are purple/blue/ochre, independent of the teal sequential scale.

Actual breakpoint: 899px. Desktop rail 360px, 320px below 1100px; narrow layout is a stacked sheet with a map at least 420px high. Mobile maps use explicit grid sizing; MapLibre's own position rule is overridden with an app-scoped selector. California overview fits geographic bounds; selected locations fly to zoom 11. Up to four WebGL maps exist on desktop and one on mobile. No terrain, fake buildings, external imagery, decorative animation, marketing hero or automatic examples.

Reviewed real overview, selected/paired vector maps and 375px facility map. Two container-height defects were fixed after screenshots exposed blank canvases. Shared legend and provider banner remain visible; native provider attribution stays inside each map. Source roads/water/labels retain Positron defaults (actual water is neutral grey-blue, not a separately customized water palette). Per-layer bespoke basemap styling and hover refinement remain future cartographic work. See FRONTEND_PROGRESS.md for precise limits, tests and screenshot paths. No blanket accessibility/performance or Hallmark gate certification is claimed.
