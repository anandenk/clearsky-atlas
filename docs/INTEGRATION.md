# Local desktop integration — 2026-11-07

Current integration record. The user selected the existing desktop experience and authorized this local merge and verification. Optional backend API adoption remains follow-up work. This checkpoint makes no mobile acceptance or publication claim.

## Frozen inputs and recovery

- Original main: `8594cc81c7bf9231831cdbc05994d1892461277f`.
- Reviewed backend building checkpoint: `44558b2b6e81730ade08960c5c54604069f82151`.
- Frozen frontend: `e7e64fbbed713fa2897818c4e38210807bd5bcd5` on `frontend/atlas-interactive`.
- Both existing owners acknowledged the freeze. Frontend has no subsequent feature changes; generated `next-env.d.ts` is left untouched and uncommitted there.
- Recovery branches: `recovery/atlas-main-pre-integration` and `recovery/atlas-frontend-pre-integration`. Main's original uncommitted backend diff and nonignored untracked files are additionally preserved in `artifacts/integration/backend-before.patch` and `backend-untracked-before.tar.gz`.
- Source PDF, original data, ignored caches, incomplete downloads, existing worker worktrees and logs are retained. No stash, reset, cleanup, push or publication. Main also has build-generated next-env.d.ts dev/production import churn; it remains outside feature commits and is not hand-edited.
- Merge started with ordinary `git merge --no-ff --no-commit e7e64fb`. It was conflict-free. The staged frontend changes did not touch backend API/data/contracts/dependency/configuration ownership. Historical frontend assignment documents and design.md are retained as checkpoint context; they do not override current authorization or the selected desktop scope. Fonts retain OFL licenses, map attribution remains linked, and the generalized California display asset matches its provenance hash.

## Review and corrective changes

One bounded read-only Worktrunk/tmux reviewer used `gpt-6.1-sol`, high effort. Frozen SHAs were explicit. It made no edits, source acquisitions, installations, servers, browser runs or delegations. Full result/log pointers: `artifacts/integration/contract-review.txt` and `.git/agent-workflow/atlas-contract-review/`. Its worktree remains clean and retained.

The earlier audit's active comparison/key, tiny-gap and facility-version findings are fixed in the frozen frontend. Review checked all 23 backend definitions, compatible metadata, null/zero and signed differences. The dormant, unimported `ComparisonOverview.tsx` still uses key-only compatibility; apply the canonical helper before any future reuse.

Four findings were corrected in main before acceptance checks:

1. Returning from synthetic preview to a failed live map request could retain synthetic geography after the warning disappeared. Provider changes now clear shared overlays and displayed evidence, remount the map, and clear associated detail/target/source state. Successful last-layer retention remains within a provider.
2. Disposing Overture for the raster fallback left its old status text visible. Disposal now clears that notice.
3. “Together” framing could put the Fresno pin behind the taller analytical legend. Desktop fit bounds now reserve the actual legend footprint; the existing overlap assertion remains intact.
4. While PM was retained during a delayed ozone request, the map legend's source button opened ozone's definition. A fresh rendered test reproduced this mismatch. Map-origin source disclosures now use the rendered measure/mode; evidence-panel disclosures use the selected measure. The initial map source button is disabled until evidence exists.

New rendered regressions cover the provider/status findings and controlled tiny nonzero/same-key-incompatible evidence, full-geometry-verified same-tract distinct coordinates, original-coordinate facility requests, reference direction/replacement/removal, and facility version mismatch with independent healthcare success.

## Runtime and verification

Main runs the combined production application on `http://127.0.0.1:3000` in `atlas-local-server`, with `ATLAS_BACKEND_ORIGIN` unset. The frozen frontend production preview remains on `:3001` and proxies APIs to main. Do not build over either active worktree's `.next`. Main's tmux pane runs a command directly and is dead after Ctrl-C; restore it with `tmux respawn-pane` only after confirming it is dead.

Verification logs and new regression screenshots: `artifacts/integration/`. Existing suites also retain screenshots in their named artifact subdirectories.

Performed so far:

- `npm ci`: passed from the combined backend-owned lockfile; postinstall copied the local map worker.
- `npm test`: 69/69 passed, including exact spatial joins, source/null/version checks and network-disabled building cache replay/cold failure.
- `.venv/bin/python scripts/test_fetch_sources.py`: 4/4 passed.
- `npx tsc --noEmit` and production build without `ATLAS_BACKEND_ORIGIN`: passed, including the corrective application changes.
- All seven HTTP smoke suites against integrated `:3000`: passed (`smoke_backend`, `smoke_demographics`, `smoke_facilities`, `smoke_map_overview`, `smoke_nearby`, `smoke_overview`, `smoke_stories`). An initial connection-refused attempt occurred because the old tmux command had exited; it was preserved, the production process was respawned, HTTP 200 checked, and all suites rerun.
- `scripts/audit_readiness.py --output artifacts/integration/readiness.json`: 179 artifact checks, zero failures, source PDF unchanged. The audit's frontend snapshot remains the frozen separate branch; it is not a rendered-readiness certificate.
- `node scripts/verify_statewide_buildings.mjs`: eight integrated endpoint samples passed, with 6,876 retained-source height/floor matches, 295 source parts and byte-identical repeated responses. Fresh measurements are in `data/benchmarks/buildings-statewide.json`.
- New rendered integration regressions: 4/4 passed on integrated production `:3000` (16.0 s).
- Existing desktop suite: 38/44 passed in the first combined run (4.7 min); six failures were diagnosed and corrected. The affected run passed all six original failures plus other affected checks (12 passed, one new test-fixture expectation failed). Final evidence selection after the last source-drawer fix: 6/6 passed (27.0 s), including the corrected fixture. All **44 existing cases and five new integration cases** have passing results across these combined/affected runs; this is not a claim of a single fresh 49-case clean run. Logs: ui-desktop.log, ui-affected.log, ui-final-evidence.log. Initial failure contexts are retained in initial-ui-failures.tar.gz; source-drawer-before.log records the additional reproduced bug.
- Existing performance probes ran sequentially against :3000: CHECK=1 desktop workload assertions passed; navigation, linked-geography and first-click CPU profiling completed. No page errors were recorded by the error-reporting probes. Measurements/conditions and evidence hashes are retained in data/benchmarks/integration-desktop.json; full raw evidence stays under artifacts/.

### Desktop test scope and changed assumptions

Set `ATLAS_DESKTOP_ONLY=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` for this checkpoint. All existing test cases remain selected. Mixed suites run their rendered assertions at desktop width only: atlas overview (exclude 320/375/414/768), Auto controls (exclude 320), Together framing (exclude 768/375/320), linked geography (exclude 320), reduced-motion city/landscape (exclude 375), and loading-status sizing (exclude 375/320). Source-only simulated viewport fixtures are not mobile rendering acceptance.

The city tests now inspect actual rendered Overture buildings rather than suppressed OSM counts, following the recorded user decision to remove the preliminary OSM cohort. No coverage/retention/failure requirement was dropped. Additional harness corrections: scope nearest-list selectors away from the always-rendered hidden statewide directory; distinguish the two nearest-coordinate requests from 164 inventory requests; wait for settled camera pitch; create the building-artifact directory before writing; exclude the independent Census dimmer only inside the deliberately white pixel fixture. The full real display context remains in ordinary rendered tests. A new tiny-gap fixture initially used Oakland's rounded displayed value instead of its exact raw value, producing the wrong expected gap; it now explicitly mutates both test-only observations to 8.33/8.334. No source records were changed. Four existing performance probes now accept `PLAYWRIGHT_BASE_URL`, defaulting to main :3000, so integrated measurements cannot silently test :3001.

## Desktop visual and performance evidence

Agent-inspected desktop screenshots include `artifacts/compass/verified-overview.png`, `verified-detail.png`, `artifacts/framing/together-1440.png`, `artifacts/building-coverage/linked-statewide.png` and `artifacts/landscape/oakland.png`. They show the real tract coverage, compact multi-place evidence, distinct linked building geography, analytical relief, and pins clear of the legend after the framing fix. Focused keyboard tests exercise evidence-panel restoration, dialog focus/Escape, map keyboard movement and reduced motion. These are local agent/test observations, not a new human acceptance or comprehensive accessibility certification.

Single sequential samples, installed headless Chrome at 1440×960, Darwin arm64, Node 26.10.0, local production server and warm source/range caches:

| Workload | Measured result |
| --- | --- |
| 120-event hover burst | 1 query; 88.0 ms query time; 98.8 ms elapsed; latest position retained |
| Hover cancellation | 0 queued queries; no tooltip after mouseout |
| Infrastructure load/re-entry | Submissions 14,919 → 24,865 only; category toggles 9,946 → 24,865; directory Show on map creates no confirmed-address pin |
| Single-map navigation probe | ready 1,879 ms; rAF delta p50/p95 16.7/16.7 ms, max 16.8 ms; 2 observed long tasks / 177 ms total; JS heap snapshot 92.2 MB |
| Linked-map warm navigation | rAF delta p50/p95 16.7/16.8 ms, max 16.8 ms; no observed warm long tasks; JS heap snapshot 162.0 MB |
| Shared statewide PM payload | 15,702,991 decoded bytes in each navigation probe; one shared request in the linked sample |

These are bounded workload samples. rAF deltas are not renderer/GPU frame-time certification; network tiles, OS/GPU load and caches are uncontrolled. The 88 ms individual elevated pick remains an explicit limitation despite coalescing. One linked-probe click event duration was 152 ms (processing delay ~0.9 ms); no universal responsiveness claim follows. Building tile-worker byte totals are not exposed by these resource timings, so no total building-transfer claim is made. First-click CPU profile is retained, without inferring a universal dominant bottleneck. No general performance acceptance threshold was defined.

## Serving mode and remaining scope

The actual building catalog serves `upstream-ranges-with-local-success-cache`. There is no complete `california.pmtiles` or final proof. No downloader/finalizer was active at freeze. The two sparse partial archives are preserved and must not be promoted. Only successfully cached views support offline replay; statewide uncached views require the pinned upstream source. Source completeness and height accuracy are not guaranteed.

| Follow-up | Concrete revisit trigger |
| --- | --- |
| Optional overview/story/grouped-demographic/nearby-narrative API adoption | A selected product workflow or measured payload/duplication problem; preserve definitions, periods, source versions and exact coordinates |
| Power | New verified reporting-period and retirement-code evidence, or a verified alternative source; do not revive the exhausted investigation without that evidence |
| Complete offline building acquisition | Explicit deliberate restart with adequate disk/network budget, then successful archive structure/hash verification and final provenance |
| Per-tile building arrival animation | A measured compatible implementation that preserves resident buildings and source semantics; current native fade is layer activation/recovery only |
| Individual elevated hover pick | Normal input remains visibly slow; profile a bounded equivalent picker without losing raised-surface inspection |
| Cold infrastructure acquisition | First-load latency is unacceptable; consider an additive compact inventory contract preserving complete source records/coordinates/versions |
| Mobile/bottom sheets; Explore Alternatives | Renewed user direction; Alternatives additionally needs its agreed main-owned query contract |
| Comprehensive accessibility/screen-reader acceptance | A dedicated intended-device pass; current focused keyboard/reduced-motion checks do not certify all access needs |
| Terrain, sharing, AI/voice, sponsors | Explicit selection after core review; sponsor account work remains parked |
| Fire/remediation/routes | Suitable verified feeds or explicit new contract; never imply availability/access |

The canonical PRODUCT/EXPERIENCE/ARCHITECTURE descriptions now describe the accepted map-first multi-location desktop presentation and linked selected-pair comparison. Original scope remains visible with these deferrals. No purchases, global changes, deployment or publication occurred.
