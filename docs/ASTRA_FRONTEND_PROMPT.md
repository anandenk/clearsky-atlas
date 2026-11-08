# Astra frontend implementation handoff

Run in `/Users/anand/Projects/hackathon.frontend` with Astra, High reasoning effort, Standard speed. The user opens this interactive session themselves. No worker launch is requested.

The text below is the complete assignment. It can be supplied by asking the session to read and execute this file.

---

You are my interactive frontend lead for the California Environmental Atlas. Another session owns backend/data development and integration. I will collaborate directly with you, then switch this same session to Sol after your foundation pass.

## Workspace and preparation

Work only in `/Users/anand/Projects/hackathon.frontend`.
Expected branch: `frontend/atlas-interactive`.
Original baseline: `2f405625a5272ff7d09cf132d9ccc6f8a2066be4`.
Baseline tag: `frontend-handoff-v1`.

Verify your current branch and working state. Preserve existing changes, including uncommitted `design.md`, `docs/FRONTEND_PROGRESS.md`, and this handoff. These are intentional user-authorized materials. Do not reset the branch to the baseline if newer work exists.

Read:
- AGENTS.md
- README.md
- docs/PRODUCT.md
- docs/EXPERIENCE.md
- docs/ARCHITECTURE.md
- docs/BUILD_PLAN.md
- docs/FRONTEND_HANDOFF.md
- design.md
- docs/FRONTEND_PROGRESS.md

Read current backend updates directly from `/Users/anand/Projects/hackathon/docs/BACKEND_CHANGES.md`; this branch does not synchronize automatically.

The latest authorization in FRONTEND_PROGRESS.md and interaction specification in design.md supersede older suggestions to start with an example comparison or limit frontend development to backend-ready capabilities. Follow repository ownership; this handoff does not transfer backend/config ownership.

## Core goal: visual fidelity and an excellent atlas experience

The centerpiece is a beautiful, responsive California map with environmental information integrated directly into it. Treat cartography, typography, map motion, evidence graphics and panel composition as one design system. Build the full frontend interaction, not an attractive static mockup.

Start with one normal, full-screen California map:
- Familiar address search and map navigation.
- Four prominent clickable modes: Environment, Health, Community, Infrastructure.
- Active-indicator selection, readable legend, and unobscured attribution.
- No marketing landing page, modal onboarding or automatically selected example comparison.

A confirmed address flies into view, receives a pin and tract outline, and opens contextual evidence. Preserve selections while changing modes. Inspecting a tract is distinct from replacing an address or adding it to comparison.

## Full feature scope

Environment: PM2.5, ozone, diesel particulates, traffic impacts, toxic air releases, cleanup-site burden.
Health: asthma emergency visits, cardiovascular emergency visits, diabetes prevalence, low birth weight.
Community: poverty, educational attainment, housing burden, age and racial/ethnic composition, with neutral charts.
Infrastructure: healthcare, public schools, power plants; category filters, markers, linked facility lists/details, and qualified straight-line distances.

Remediation-site markers and fire services remain conditional on suitable sources. AI, voice, detailed 3D assets, and sponsor integrations are optional extensions, not prerequisites for the atlas foundation.

Support two or more comparison addresses:
- Two locations produce paired desktop maps.
- Three/four can use a balanced grid when available space supports it.
- More locations remain in the collection with a selectable visible subset, rather than unlimited tiny maps/WebGL contexts.
- Mobile uses one visible map with location switching and retained comparison evidence.
- Add, replace, remove, reorder and choose a reference location without losing unrelated selections.
- Shared mode, indicator, domain and legend across every visible pane.
- Camera linking matches zoom/pitch/bearing around each location's own center; include unlock/reset.
- Removing to one returns to single-map view; clearing all returns to California overview.

Use a collapsible contextual/comparison side panel, adapted to mobile:
- Single-location values, definitions, periods, percentiles where supported, and sources.
- Comparison Overview and Selected indicator views.
- Aligned charts/table for multiple locations and supported numerical differences.
- Supported similarities as well as differences.
- Optional in-panel comparison stories: Air around these places; Health in neighborhood context; Community context; Nearby essentials.
- Clicking a finding/story step updates relevant layers, legend and evidence together.

No artificial overall neighborhood winner, hazard treatment of demographics, personal disease probabilities or causal claims. Do not rank unlike raw units as the largest overall differences without a defensible method. Distinguish percentile-point differences from percent change and measurement periods from release dates. Same-tract addresses share tract observations but retain distinct pins.

## Rendering stack and cartographic fidelity

Retain Next.js + React + TypeScript + MapLibre GL JS as the foundation. Do not rewrite the map in Three.js or migrate the app framework for aesthetic reasons.

Treat cartography as a primary design deliverable:
- Evaluate a suitable vector basemap. The baseline uses desaturated OSM raster tiles; do not assume that raster appearance is the visual ceiling.
- Prefer a vector style when a suitable accessible provider/source is available, so roads, water, land, buildings and labels can be styled independently.
- Define label density, zoom hierarchy, contrast, road weights, land/water treatment and building presentation in design.md.
- Integrate tract shading beneath readable vector labels where supported, with deliberate boundary/selection/inspection hierarchy.
- Define consistent choropleth ramps, separate no-data styling, and location/category identity independent of intensity colors.
- Prioritize clean antialiased boundaries, readable map labels, stable hover/selection, smooth camera behavior and fluid split-pane transitions.
- Preserve attribution. Check provider terms, keys, permitted use and availability. Do not use demo tile hosts as assumed unlimited production infrastructure, bulk-download tiles, buy services or invent credentials.
- If a preferred provider is blocked, isolate the basemap style/source behind configuration in owned code, retain the working fallback, record the precise request, and continue the full frontend.

Use MapLibre native layers for the current choropleths, outlines, symbols and marker/category rendering. Terrain requires an actual appropriate elevation source. Pitch alone is not terrain or photorealistic 3D.

Consider deck.gl only for a specific advanced visualization/native-layer limitation or measured performance requirement. Three.js is reserved for a concrete custom 3D-object/scene feature; it is not the core renderer. Additional libraries require an exact dependency request to the integration owner. Use SVG-based comparison graphics or existing suitable chart primitives consistent with the visual system.

Reference documentation, verified during planning:
- https://maplibre.org/maplibre-style-spec/
- https://maplibre.org/maplibre-gl-js/docs/
- https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/
- https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre

Read documentation relevant to the installed version at implementation time; these links establish capabilities, not tested project integrations.

## Full frontend independent of backend readiness

Build frontend-owned adapters/view models with two data providers:
- Live: actual endpoints, documented source availability and semantic guards.
- Preview: deterministic synthetic fixtures implementing missing indicators, maps, charts, infrastructure, stories, comparisons and failure/null scenarios.

All planned feature paths should have functioning preview interactions, not merely disabled controls or coming-soon text. Backend gaps are future integration dependencies, not frontend scope cuts.

Default to the normal live map. Provide an explicit Explore full UI preview action. Persistently label preview as Preview data — synthetic examples, retaining this context in tooltips, legends, charts, stories and facility details. Example institutions must not masquerade as verified real facilities.

Never silently substitute synthetic results for failed live requests. Never combine live and preview records in a comparison/finding. Separate cache keys, abort stale requests, and clear or deliberately remap incompatible selections when switching providers. Preview must work without unavailable backend catalog/facility routes; it is not automatically offline map mode.

Fixtures belong in `src/frontend/fixtures/**` or `public/ui/fixtures/**`, not backend-owned `data/**`. Read existing shared types/helpers without changing them; keep frontend adapters in `src/frontend/**`. Preview calculations are demonstrative and isolated. Live numeric/compatibility policy remains backend-owned.

Inspect current backend readiness rather than hardcoding an old snapshot. `/api/indicators` provides documented catalog metadata, not proof that every indicator has a supported map layer. `/api/health` file presence is not scientific validity. Report unsupported live contracts precisely.

## Design skills and design.md

Read relevant installed SKILL.md files and supporting references selectively:
- frontend-design: primary visual direction and critique.
- ui-ux-pro-max: targeted interaction/chart/responsive/accessibility guidance; validate recommendation fit before adoption.
- hallmark: consistency, restraint, full component states and responsive checks.
- shadcn: appropriate component primitives, when setup is suitable.
- vercel-react-best-practices: relevant React/Next.js performance patterns.
- web-design-guidelines: fresh guidelines for actual edited-interface review.
- webapp-testing: browser interaction, screenshots and console verification.

Skills are installed under `/Users/anand/.codex/skills/`. Apply the product brief over generic templates. Do not perform seven competing design processes or add redundant testing stacks merely to follow an example. Preserve existing Playwright conventions.

Before substantial UI code, finalize one coherent design system in `design.md`: screen composition, exact typography/fallbacks, semantic colors, cartographic tokens, spacing, panel/control dimensions, radii/elevation, layer/overlay hierarchy, component anatomy/states, responsive rules, motion/reduced motion, live/preview treatment and accessibility targets.

Proposed direction: calm light cartographic interface, restrained warm surfaces, readable dark type and data-led color. Make the atlas distinctive through cartography and composition; avoid generic marketing typography, excessive cards, decorative gradients or unnecessary animation.

Keep design.md synchronized with the actual implementation. Use frontend-owned style tokens consistently. Design.md is explicitly authorized as frontend-owned; other root configuration is not.

## Ownership and operation

Follow AGENTS.md and FRONTEND_HANDOFF.md exactly. Read relevant installed `node_modules/next/dist/docs/` before code; do not rely on outdated Next.js conventions.

Frontend owns rendering/interaction and its documented paths. Backend owns API/data, shared types/correctness helpers, root configuration/dependencies/lockfiles, and integration. Do not copy backend data or edit main. Request exact dependency/config/contract changes through me to the integration owner; continue independent work meanwhile. `npm ci` from the baseline lockfile is allowed if necessary.

Browser API requests remain relative. Frontend :3001 proxies backend :3000. Reuse the existing preview if available. If absent, use the handoff command with `ATLAS_BACKEND_ORIGIN=http://127.0.0.1:3000`. Do not alter or restart backend. Do not build concurrently into the .next directory used by your dev server; stop/restart only your frontend preview as needed.

No additional agents. Local commits of reviewed owned files are authorized. No merge/rebase/cherry-pick, push, publication, deployment, purchases or global configuration changes. Preserve the source PDF and archived-investigation boundary.

## Bounded pass, verification and stopping point

Use Astra High at Standard speed for one substantial foundation pass with internal review/corrections:
1. Inspect implementation/contracts, choose a cohesive composition and finalize design.md.
2. Implement the full interaction structure in owned paths with usable preview coverage and preserved live functionality.
3. Inspect the actual rendered interface and correct major visual/functional defects.
4. Run meaningful checks, update design.md and FRONTEND_PROGRESS.md, and stop for my visual review and switch to Sol.

Prioritize visual coherence and complete interactions over component count. Reserve time within this pass for screenshot critique and corrections. Make routine design decisions autonomously; ask only about consequential unresolved decisions. Do not treat the first render as the final result or enter an unbounded completion loop.

Verify:
- Single-map startup, confirmed search, one/two/three/four/additional location flows.
- Mode and indicator switching, shared legends, panel evidence, comparisons and stories.
- Preview infrastructure filter/marker/list interaction and live unavailability behavior.
- Provider labeling, switching, cache isolation and no silent live fallback.
- Same-tract cases, zero versus null, missing/incompatible evidence, candidates/errors and rapid request races.
- Camera linking/unlocking, resizing, map resource cleanup, valid bounds and source failures.
- Actual rendered live tract features, separately from synthetic preview results.
- Desktop and 320/375/414/768 widths, long labels, keyboard/focus, reduced motion and readable data alternatives.

Inspect screenshots of overview, selected address, paired and multi-location comparison, community charts, infrastructure preview, mobile and failure states. Check browser errors and interaction behavior, not just static screenshots. Update old UI tests that assumed auto-loaded examples. Run relevant TypeScript/build/UI checks while respecting preview isolation. Do not run backend acquisition to fix missing generated data in this worktree.

A successful build is not proof of map correctness, smooth performance or accessibility. Record actual results and limits, including measured payload/frame/memory concerns if encountered. Preserve full scope; document each actual deferral with its concrete trigger and revisit condition.

Before stopping, report in FRONTEND_PROGRESS.md:
- Changed files and completed interactions.
- Exact checks and actual outcomes.
- Live-connected, preview-complete, backend-blocked and frontend-incomplete features separately.
- Screenshots and visual review findings.
- Concrete backend/dependency/provider requests.
- Remaining defects and ordered continuation work for Sol.

Stop at the review checkpoint. I will switch the same session to Sol for further iteration.
