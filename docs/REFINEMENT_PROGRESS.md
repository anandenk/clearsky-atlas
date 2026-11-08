# Post-Prototype-1 desktop refinements — 2026-11-08

Completed locally on `development/prototype-2`. The seven-fix base code checkpoint is `4a11fc4`; the automatic comparison-opening follow-up below is included in the current local build. The production app runs at **http://127.0.0.1:3000**, with `ATLAS_BACKEND_ORIGIN` unset. The frozen frontend `e7e64fb` remains on :3001 as a comparison reference.

The immutable MVP Prototype 1 tag still points to `6dc04f30fe666f11740f236eb686a8156e308140`. Its private repository/release and local backup are unchanged. This refinement was not pushed, published or deployed.

## Current continuation — MVP complete; demo preparation next

Start the next session from [DEMO_PREP_HANDOFF.md](DEMO_PREP_HANDOFF.md). Gemini feature work is complete for the desktop MVP; preserve the uncommitted worktree and focus on demonstration preparation. Older planning/migration sections below are historical.

The later user request authorized the complete Gemini plan using their supplied key and reported $10 credits. All four milestones are now implemented locally, including statewide discovery. Read [GEMINI_INTEGRATION.md](GEMINI_INTEGRATION.md) for setup, API contracts, source/index rules, live results, usage and limits. `.env.local` is configured, ignored and owner-only; `.env.example` contains no credential.

Current application changes are **uncommitted** in this main worktree on `development/prototype-2`; review and preserve them. The earlier README/progress/plan edits were preserved. Generated `next-env.d.ts` remains outside feature work, with the pre-build bytes/patch saved in `artifacts/assistant/`. Do not reset the tree based on the older clean-tree handoff below. No agent worker was launched for this feature.

Production :3000 has been rebuilt and restored in the existing `atlas-local-server` tmux session, with `ATLAS_BACKEND_ORIGIN` unset. Frozen :3001 was left running and untouched. Both example journeys also passed against the production build with real `gemini-3.6-flash`, with no browser page errors: explicit candidate confirmation → automatic comparison and school evidence; accepted discovery profile → statewide alternatives → tract/school exploration without fabricated address pins.

Fresh checks: TypeScript/build, **94 Node tests**, the Python preparation fixture, all **9,946** school joins independently checked, reproducible index/manifest bytes, seven final live prompt checks, actual missing-key HTTP behavior and **14/14 targeted production desktop tests**. The four production live turns took 4.0–9.4 seconds each. Nineteen measured real requests in this session used 144,501 input and 7,584 output/thinking tokens, estimated **$0.1368** at the inspected rates; this is not an account balance. Artifacts are under `artifacts/assistant/`.

The source PDF and fixed Prototype 1 tag are unchanged. No push, deployment, release update, account/billing change, cleanup or other sponsor integration occurred. No Ask ClearSky milestone is deferred; mobile and the other previously recorded source/product limits remain.

## Historical pre-Gemini starting point

- Worktree: `/Users/anand/Projects/hackathon`; branch: `development/prototype-2`. Latest application commit: `f8f2db0` (automatic comparison opening). Later documentation-only commits do not require rebuilding the app.
- The conversation environment may start in `/Users/anand/Projects/hackathon.frontend`; that checkout is the frozen `e7e64fb` reference. Do not resume development there or merge its generated changes.
- Read `AGENTS.md`, `README.md`, this record and `docs/STATUS.md`, then the linked product/experience/architecture/build-plan records for scope. The earlier integration and backend handoffs are historical bases.
- Current app: production :3000, tmux `atlas-local-server`, `ATLAS_BACKEND_ORIGIN` unset. Frozen preview: :3001, tmux `atlas-frontend-preview`, existing API proxy to :3000. Stop the corresponding server before building in its `.next`; retain the other preview.
- At handoff, both servers listen and both worktrees have only generated `next-env.d.ts` changes. Preserve these outside feature commits; do not hand-edit or reset them. All requested application work is committed. No task worker remains active; all seven worktrees/logs are retained.
- The refinements and automatic-opening follow-up are **local only**. Prototype 1's private GitHub backup is unchanged; these new commits and ignored raw screenshots/logs have not been pushed/uploaded. Compact benchmark results and artifact hashes are committed.
- No unfinished action remains for the seven fixes or automatic opening. Remaining product/source follow-ups are listed below; no sponsor, mobile or deployment work is authorized by this handoff.
- Session lesson: the user questioned the prior hour-long implementation/validation pass. Keep small follow-ups scoped, use proportionate targeted checks, and broaden verification only when changed contracts, failures or unresolved concerns justify it.

## Historical planning handoff — Gemini Ask ClearSky

This planning handoff is superseded by the completed integration above. The user requested a Gemini-powered conversational query experience and selected statewide tract discovery with geographic filters, explained tradeoffs, school-centered exploration, map actions after explicit address confirmation, and a separate Ask ClearSky panel. The complete four-milestone plan is preserved **verbatim** in [GEMINI_IMPLEMENTATION_PLAN.md](GEMINI_IMPLEMENTATION_PLAN.md), including its original plan wrapper and all assumptions. Read it before starting this feature.

The user chose to return after sleeping. **No Gemini implementation or overnight worker was started.** Quota-monitor research did not install or configure anything, and no unattended run or weekly-usage budget was established. Resume interactively when the user returns; do not infer an overnight-run authorization from the saved plan.

Start with Milestone 1: inspect current backend contract helpers and the installed Next.js guidance, then implement the server-side Gemini/tool foundation and focused verification. The saved plan retains all four milestones; do not treat the later overnight discussion's Milestone-1-only suggestion as a reduction of the full feature target. A user-supplied Gemini key is required for live provider verification; never invent a live pass. Continue in the main worktree on `development/prototype-2`, preserve generated `next-env.d.ts` separately, and keep `hackathon.frontend` frozen. No push or deployment is part of this handoff.

## Delegation and integration

The user requested seven issues, one agent per issue. Seven bounded Worktrunk/Codex CLI workers ran in visible tmux windows, at most three concurrently, with no worker delegation, servers or browser tests. All used `gpt-6.1-sol`; high effort covered address contracts and map timing, medium effort covered the five bounded UI tasks. The integration owner reviewed complete diffs, committed owned paths, merged each branch and performed rendered checks sequentially.

| Issue | Worker | Reviewed worker commit | Result |
| --- | --- | --- | --- |
| Nearby essentials contrast/readability | p2-contrast | `6bc0c34` | Verified selected/unselected, filter, hover, focus and dialog states |
| Current product menu | p2-menu | `9360e2e` | Current coverage; troubleshooting/synthetic tools in closed Advanced tools |
| Flexible address resolution | p2-address | `bcc6842` | Normalization, bounded Census queries, confirmation and exact tract checks |
| Facility directory clutter | p2-directory | `6ab9f37` | Spaced input/status, compact count, single-column scrolling results |
| Direct remove X | p2-chips | `4455e1d` | Full-address labels, stable identities, reference fallback and empty-state focus |
| Immediate City focus | p2-city | `564f531` | City/relief update before flight; Auto, rapid and repeated focus preserved |
| Park geography | p2-geography | `2d8035a` | No normal launch nodes/second map; explicit `?geography=1` opt-in retained |

All seven branches are ancestors of the combined checkpoint. Worktrees, worker logs and source/cache files remain retained. `artifacts/refinement/workers.json` records bases/settings/thread IDs. The launcher required a clean tracked tree: only generated `next-env.d.ts` was temporarily stashed with an announced scoped operation, immediately restored and byte-checked. Preservation stash refs remain; baseline bytes/patch and restoration records are under `artifacts/refinement/`. Framework-generated churn remains unstaged and outside feature commits.

Integration review also corrected first-remaining reference state so adding a later place cannot silently promote it. Evidence-panel address buttons now share City focus behavior. Rendered testing found that portaled facility dialogs could bubble Escape into the evidence panel, while global click/Escape handlers closed background disclosures. Dialog events now preserve the underlying panel/disclosure and return focus to the facility trigger; both Escape and Close are verified.

## User-selected scope

Normal per-place reference/replacement/reordering menus are removed in favor of X. First remaining place is the reference; IDs, letters, colors and coordinates remain stable. Signed-comparison tests use insertion order and reference-removal recovery. Original capabilities remain backlog items, with reactivation requiring a coherent interaction design and user review.

Linked geography is retained behind the explicit reload-based `?geography=1` flag, with no public menu entry. Its existing linked-map suites/probe opt in; ordinary multi-location evidence stays on one map. Public reactivation requires coherent entry/exit design and desktop review.

Address input supports common formatting variations, not universal postal interpretation. See [ADDRESS_LOOKUP.md](ADDRESS_LOOKUP.md) for source precision, assumptions, request limits, privacy, actual live results and unsupported inputs. Every candidate still requires confirmation. Power remains unavailable in live evidence; synthetic preview is explicit and separate.

## Verification

- `npm test`: **82/82 passed** after integration; exact spatial/source/null/version and building-cache checks remain covered.
- `.venv/bin/python scripts/test_fetch_sources.py`: **4/4 passed**.
- TypeScript (`--noEmit --incremental false`) and production build: passed, with no backend-origin proxy. The server was stopped before each build in its `.next`; :3001 artifacts were untouched.
- Seven HTTP smoke suites: passed against integrated :3000; suites that also default to :3001 verified its existing API proxy. Readiness integrity audit: **179 artifact checks, zero failures**, original source PDF unchanged. The audit's frontend hash snapshot still describes the frozen separate worktree, not rendered readiness.
- Actual combined `/api/geocode`: **12/12 public civic cases passed**. Ten valid formatting variants retained the source coordinate and exact tract; explicit outside-California and no-match inputs stayed qualified. All were `no-store` and completed on their first normalized source query. Thirteen pure tests cover fallback ordering/budgets, ambiguity, cancellation and malformed source precision; the live sample does not prove every fallback or address.
- Desktop Playwright: all **69 selected unique cases have passing results across combined/affected runs**. First run: 62/69 passed. An affected run passed 21/25 and exposed a real modal event bug plus remaining fixture assumptions. After corrections, **32/32 passed freshly against the final built code** (2.5 min), including all seven initial failures, the expanded City regression, all 23 measures and keyboard/focus flows. This is not a claim of a single clean 69-case run on the final code.

No test case was excluded. Assertions were adapted to explicit user decisions: removed menus, Advanced tools disclosure and geography opt-in. Fixture corrections wait for current overview/detail state after adding places, explicitly choose the initial active location, scope alerts away from Next's route announcer, inspect visible controls inside a `display:contents` geography wrapper, and use the actual native modal keyboard sequence. The final contrast check measures all visible panel text at **at least 4.5:1** through selection, hover, keyboard focus and modal exit. Mobile widths remain excluded as documented in [INTEGRATION.md](INTEGRATION.md); no mobile or comprehensive accessibility acceptance is claimed.

Logs: `artifacts/refinement/{unit-verified,source-cache,http-smoke,readiness,ui-desktop,ui-affected,ui-final}.log`, build logs and `ui-*-results/`. Initial diagnostics are preserved. The seven-fix checkpoint used `build-verified.log`; the later comparison-opening follow-up uses `auto-comparison-build.log`.

## Rendered and measured evidence

Agent-inspected settled desktop screenshots: `artifacts/refinement/infrastructure-after.png`, `directory-after.png` and `menu-after.png`. They show readable dark evidence/selected rows, direct X chips, single-column directory rows with input/status separation, current menu context, closed Advanced tools and no normal geography launcher. Early captures caught modal entry animation and are preserved separately under `early-capture/`; final static images wait for entry animations to settle.

Single local samples: installed headless Chrome at 1440×960, Darwin arm64, Node 26, production :3000 and warm source/range caches. Browser probes ran sequentially. The baseline had three CLI workers active; final samples had none. Other desktop load was uncontrolled, so these are bounded observations, not a controlled performance certification or universal thresholds.

| Observation | Baseline | Final |
| --- | --- | --- |
| City selected after chip click | 1,825 ms | 12.6 ms, first sampled frame |
| Analytical relief reaches zero | 2,941 ms | 12.6 ms, first sampled frame |
| Search input to directory status gap | 0 px | 40.67 px |
| Directory result layout | Two columns | One column |

The rendered regressions additionally inspect **evaluated renderer opacity on the first post-click render**, both analytical buffers and roof rims, unchanged source/legend identity and no height/geometry submissions. They cover Auto zoom-out recovery, manual Landscape, rapid/latest and same-place focus, evidence-panel focus, reduced motion, held building readiness, native building reveal, source residency, parts and parent suppression.

`CHECK=1` desktop workload passed: 120 hover events produced one query (81.1 ms query / 89.1 ms elapsed), cancellation produced zero queries/no tooltip, inventory submissions were 14,919 → 24,865, filter toggles 9,946 → 24,865, and facility Show on map created no confirmed-address pin. Navigation sample: ready 1,950 ms; rAF delta p50/p95 16.7/16.7 ms, max 16.8 ms; two observed long tasks totaling 182 ms; JS heap snapshot 93.0 MB. Both probes recorded no page errors. No new linked-geography or first-click CPU benchmark is claimed; those older measurements remain in the Prototype 1 integration record.

Compact results, environment and artifact hashes are retained in [refinement-desktop.json](../data/benchmarks/refinement-desktop.json). Raw timing samples are in `artifacts/refinement/{before,after}.json`; workload/navigation data are in `artifacts/performance-pass/refinement-final.json` and `artifacts/responsiveness/refinement-final.json`.

## Remaining scope

No blocking issue remains for these seven fixes. Provider coverage/typos/incomplete addresses still need explicit correction or a future separately verified provider. Source-gated power, complete offline building acquisition, per-tile arrival animation and optional overview/story/grouped-demographic/nearby-narrative adoption remain follow-ups with their existing triggers. Sponsors remain parked. Mobile, Explore Alternatives, comprehensive accessibility and deployment remain outside this checkpoint. No cleanup, new GitHub push, tag movement, release or publication occurred.

## Automatic comparison opening — 2026-11-08

User-requested follow-up: confirming a second or subsequent location opens the at-a-glance comparison automatically. A single location still starts with evidence collapsed, and More map can close the panel. The change is local to the existing add-location interaction. TypeScript and production build passed; the focused desktop interaction/default-geography/opt-in checks passed 4/4 in `artifacts/refinement/auto-comparison-final.log`. The regression explicitly starts with the panel collapsed, confirms the second address, checks both comparison values, and checks manual dismissal/focus restoration. The retained geography fixture now explicitly closes the automatically opened panel before inspecting its collapsed peek control. No broader suite or performance rerun was needed for this follow-up.

## Ask ClearSky visual refinement — 2026-11-08

Refined the assistant to match the atlas's DM Sans typography, navy surfaces, teal accents and existing brand mark. The welcome state now has two clearly separated prompt choices, the header has a compact expandable privacy disclosure, and the composer uses one focused input surface. Address confirmation has a prominent action; evidence uses balanced label/value columns, quieter metadata and consistent spacing. All source definitions, units, periods, null handling and explicit confirmation remain intact. No backend or provider changes were made in this visual pass.

Validation: production build passed; all four assistant Playwright regressions passed. Inspected rendered welcome, confirmation, comparison, discovery-profile and discovery evidence screens at 1440×960, plus the compact desktop panel at 1280×800. Browser probe found no page errors or panel horizontal overflow and checked privacy disclosure expansion. Preview responses were replayed from saved evidence, with no Gemini requests. Screenshots, probe and logs are in `artifacts/assistant-design/`. Generated `next-env.d.ts` remained byte-identical to its saved pre-pass copy. Main production server is running on :3000; the separate frontend worktree remains untouched. Mobile and a comprehensive accessibility audit remain deferred.

### Compact question entry

Follow-up: Ask ClearSky now initially opens a 285px-high question box with automatic input focus, replacing the welcome illustration and preset prompts. Sending the first question expands the same mounted panel to the full conversation height over 420ms; reduced-motion preference removes the transition. Closing/reopening retains a started conversation. Privacy details remain expandable before sending. Production build and all five assistant UI regressions passed, including compact entry, expansion, input focus and reopening. Rendered snapshots and logs: `artifacts/assistant-compact/`. No paid provider calls were made for verification.

### Question box visible by default

Corrected entry behavior per user clarification: removed the masthead Ask ClearSky launcher entirely. The compact question box is now visible and focused on initial load. Sending expands it; minimizing or Escape returns to the persistent compact composer, with Resume conversation available when history exists. Disabled preview mode still suppresses the assistant. Build and all five assistant UI regressions passed; rendered initial state verified with no launcher. Evidence: `artifacts/assistant-default/`. This supersedes the prior click-to-open behavior.

### Natural-language discovery and automatic views

Corrected lower-only discovery: criteria now optionally specify highest/lowest direction (legacy omission remains lowest), preserving source values, null exclusions and exact geography. Gemini can infer and execute supported searches directly; the profile form is optional when requested. Result cards expose direction, geography, school constraints and numeric thresholds. Discovery automatically frames/highlights all returned tracts and selects the first searched environmental map measure. Verified comparison cards automatically open the overview for two or more currently confirmed selections; address confirmation and stale/cancel guards remain intact.

Verified 96/96 backend tests, production build, and 6/6 assistant UI tests. Independent statewide and Alameda scans validate highest/lowest traffic; mixed-direction fixture validates Pareto dominance. Three live Gemini requests passed: highest, lowest, and changing an existing lowest profile to highest. Highest was San Ysidro tract 06073010009 at 6136.471 vehicles/hour; lowest Cedarville 06049000400 at 4.529, using pinned 2023 source observations. Inspected automatic San Ysidro framing, outline and Traffic layer. Artifacts: `artifacts/assistant-dynamic/`. City-boundary inference and unsupported criteria still require a truthful clarification; no demographic suitability ranking or invented boundaries were added. Local only.

### Gemini use-case evaluation and breadth

User requested broad tests and fixes after a clean-air/healthcare query omitted healthcare. Added a 49-case live evaluation corpus, independent data/spatial tests and desktop assistant regressions. Fixed healthcare omission through explicitly labeled hospital/clinic proximity in discovery, single-dimension top-N ranking, numeric lower limits, current map bounds, structured discovered-tract follow-up context, descriptive scalar health/community searches and explicit scope handling. All age/race composition fields remain descriptive comparison only. Healthcare source status/subtypes, period, version and representative-point methodology are exposed; unrelated school detail is omitted. Address-based hospital/clinic queries filter out non-care agency records and keep original address distances. Source-specific measure definitions are available inside discovery cards.

The 49-case live pass and four affected healthcare reruns passed; final backend suite 104/104, preparation fixture, TypeScript and production build passed. Desktop sweep found and corrected assistant overlap with normal view controls and optional linked-map controls. Final desktop totals and artifacts are in `docs/GEMINI_EVALUATION.md` / `artifacts/assistant-audit/`. Main production :3000 retains the existing tmux server; frontend reference remains frozen, and all work is local. Mobile, comprehensive accessibility, real-time pollution, exact city boundaries and actual healthcare access remain unverified/unsupported as documented.

Final audit completion: **52 distinct live scenarios passed**, with four final healthcare reruns also passing; **104 backend tests**, preparation fixture, TypeScript, production build and **79/79 full desktop regressions** passed. Final desktop run: `artifacts/assistant-audit/ui-complete.log` (7.0m). All ten assistant UI regressions are included. Actual credential absent from 12 scanned browser JS files; generated next-env bytes preserved and Prototype 1 tag target verified. No required work remains for this bounded use-case audit; future new phrasing/source coverage should extend the checked-in evaluation corpus.

### Clear discovery highlights on conversation dismissal

User-reported follow-up: minimizing Ask ClearSky left temporary discovered tracts and facility anchors on the map. Both the X button and Escape now cancel the active turn and clear the integration's discovery candidates and pending area target. Entering disabled preview also clears these temporary highlights. Conversation history and confirmed locations are retained; resuming the conversation does not automatically restore old highlights. Explicit exploration/new discovery can draw them again.

Production build and TypeScript passed; the assistant UI suite passed 11/11. The new rendered regression checks outlines and anchor counts reach zero after both dismissal paths, the map note disappears, a confirmed place/pin remains, and reopening retains history without restoring highlights. Evidence: `artifacts/assistant-dismiss/{build,ui}.log`. Generated next-env bytes remained unchanged. Main :3000 serves the updated local build; no provider requests were needed for verification.

### Gemini narrative summaries and progressive evidence

User requested interpretation rather than raw-data-heavy output. Main assistant answers now explicitly summarize findings and named-place tradeoffs; discovery requires a Gemini-generated per-candidate insight tied to that turn's real evidence/tract IDs. Unknown/duplicate references and fabricated numerical claims are rejected. Observed unsupported local-cause prose was addressed with prompt and validation changes; current-condition questions require a visible historical-source qualification. Main answers support escaped text-only paragraphs, bold and bullets. Detailed search metadata and raw evidence are expandable, while candidate interpretation and Explore actions remain visible.

Production build, TypeScript, 108 backend tests and all 12 assistant UI regressions passed. The new UI regression verifies the main narrative and area insight precede initially collapsed values, then expands the actual values/period/units. Live summary checks and rendered review are retained in `artifacts/assistant-summary/`; final live totals follow after completion. Existing fixed Prototype 1 and frozen frontend remain preserved; work is local.

Final narrative verification: 8/8 representative live Gemini requests passed against the final summary contract (`artifacts/assistant-summary/verified-live.json`), including extrema, top-N, clean air plus healthcare, address/tract comparisons, definitions and current-air limitations. Reviewed the actual generated main answer and per-area interpretations in rendered desktop screenshots (`live-overview.png`, `live-area-insights.png`). Values/sources remain collapsed until opened. Backend tests reject missing/unknown/duplicate candidate insights, invented numbers, observed unsupported causal/exposure-category phrasing, methodology-only leads, and omitted historical qualification for current-condition queries. Generated next-env bytes stayed identical to the saved pre-pass copy. No full desktop/performance or mobile rerun is claimed for this summary-only follow-up.

### Discovery hover evidence

User requested contextual boxes on discovered-area dots showing the measures used in the question, such as traffic and education together. Added explicit candidate markers at the prepared interior representative points for every returned tract. Hovering or clicking those points (or a requested facility reference) shows the candidate's complete selected observations, raw units, source percentiles, measurement periods, and an education-definition clarification. The popup reads the discovery result rather than the current map layer, so changing the map measure does not replace the requested evidence. Healthcare and requested-school context are included when present. Unrequested school anchors are omitted, keeping discovery dots tied to the actual query.

Popup position is bounded to the map and avoids the assistant panel; it remains visible while the pointer enters it. Moving the map or clearing/minimizing discovery clears it. Ordinary map hover retains immediate cancellation and one hit-test per animation frame. No API or Gemini request runs on hover. Exact lookup geometry, evidence values and legend definitions are unchanged; candidate points are display references, not confirmed addresses.

Verification: production build and TypeScript passed; 109 backend tests passed. All 21 targeted browser checks passed, covering assistant flows, actual traffic/education dot hover and source values, education interpretation, popup bounds, staying open while hovered, map-layer independence, dismissal, 120-event coalescing/cancellation, integration evidence and existing navigation responsiveness. Visually reviewed `artifacts/discovery-hover/traffic-education.png`; logs are in that folder. Generated next-env bytes preserved. No mobile or comprehensive accessibility acceptance is claimed.

### View controls beneath Ask ClearSky

User requested the Auto/City/Data Landscape and Flat/3D controls directly beneath the assistant. The desktop controls and assistant now share a right-aligned column with a 12px gap. Expanded conversation height reserves space for the controls; compact/privacy-expanded states move them with the panel. Blank space in the column does not intercept map input. Preview keeps the independent controls, and compact linked geography retains its lower-right placement with room for the map controls.

Build and TypeScript passed. New rendered checks at 1440×960 and 1280×800 verify placement and viewport bounds through compact, privacy-expanded, conversation-expanded, City and minimized states. Artifacts and the targeted assistant/map/geography checks are in `artifacts/assistant-controls/`. Screenshots: `compact-1440.png`, `compact-1280.png`. No backend or provider behavior changed.

Placement follow-up verification completed: 21 targeted checks passed across the completed run and corrected expansion-case rerun. The earlier expansion assertion assumed the conversation consumed the full available height; it now verifies meaningful expansion relative to compact height, while the new placement tests separately enforce the reserved controls space and viewport bounds. Build/TypeScript passed; generated next-env bytes stayed identical. Existing assistant, hover, automatic map mode and linked geography interactions passed. No provider calls were needed.
