# Post-Prototype-1 desktop refinements — 2026-11-08

Completed locally on `development/prototype-2`. The seven-fix base code checkpoint is `4a11fc4`; the automatic comparison-opening follow-up below is included in the current local build. The production app runs at **http://127.0.0.1:3000**, with `ATLAS_BACKEND_ORIGIN` unset. The frozen frontend `e7e64fb` remains on :3001 as a comparison reference.

The immutable MVP Prototype 1 tag still points to `6dc04f30fe666f11740f236eb686a8156e308140`. Its private repository/release and local backup are unchanged. This refinement was not pushed, published or deployed.

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
