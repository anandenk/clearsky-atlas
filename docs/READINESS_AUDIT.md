# Readiness audit — 2026-11-07

Current continuation: see [INTEGRATION.md](INTEGRATION.md) for the user-authorized combined desktop checkpoint, preserved refs, corrected findings and fresh checks. The record below describes the earlier separate-session checkpoint and is historical where it differs.

The verified backend is ready for a **coordinated integration review of supported data**, not a claim that the full original product is complete. Power activation and combined frontend validation remain open. No frontend file was changed, merged, rebased or cherry-picked during this audit. Both preview servers were preserved.

## Evidence boundary

Backend application commit: `4f8306b1ab10e6ed7871558e2d95b2a5761c5588`. Frontend snapshot: `4899c8d3a5ba10b652e9158314677485de2286bf`, with active page/map edits and an untracked `src/components/ComparisonPanel.tsx`. The frontend changed during inspection, so these are bounded source findings, not approval of a frozen diff. Re-review all committed, modified and untracked owned paths after the frontend owner pauses.

Machine snapshot: [readiness-2026-11-07.json](../data/audits/readiness-2026-11-07.json). Reproduce integrity/ownership/API availability checks with `python3 scripts/audit_readiness.py --output data/audits/readiness-local.json`. Optional `--live-geocode` sends one public Oakland example to Census; it is unnecessary for ordinary reruns. The saved snapshot is dated evidence, not ongoing monitoring.

## Supported backend and remaining gates

| Area | Verified backend state | Remaining gate |
| --- | --- | --- |
| Location | Unsimplified tract lookup, Census2020 cross-check, ambiguity withholding; one live public Oakland query succeeded | UI candidate confirmation and frozen combined error/race checks; no rooftop accuracy claim |
| Indicators | All 13 scalar and ten demographic fields; normalized observations, pinned versions, null preservation, raw/percentile distinction | Frontend metadata compatibility safeguards and rendered evidence review |
| Comparisons | Pairwise and multi-location/reference APIs; exact source evidence and compatible units | Optional overview API adoption or equivalent owner-maintained safeguards |
| Demographics | Source-backed age/race-ethnicity groups, ACS population denominator, original shares and rounding diagnostics | Frontend review/adoption; no rescaled pie, inferred counts or invented residual category |
| Stories | Four deterministic topics covering all 23 fields; exact evidence and qualified prose | Frontend review/adoption and rendered semantic checks |
| Schools | 9,946 historical CDE records; two Closed retained; all coordinates CES-covered | Snapshot-qualified UI wording, source-version retention and combined checks |
| Healthcare | 14,921 statewide CDPH records; 14,919 query coordinates; non-walk-in subtypes retained | Source-version retention, subtype/status/access qualifications and combined checks |
| Nearby narratives | Caller-confirmed original coordinates, unique exact membership check, category version consistency/failure isolation | Optional `/api/compare/facilities` adoption; confirmation is caller attestation, not re-geocoding |
| Power | Complete 2,378-record candidate staged; deliberately unavailable | Verified reporting period and retired-code meanings, or a verified alternative feed; preserve source rights discrepancy |
| Map performance | Optional overview 5.92 MB versus 15.70 MB standard statewide PM, same 9,106 IDs; isolated MapLibre verification | Active UI adoption and intended-device transition/memory/latency profiling |
| Conditional/optional scope | Fire/remediation retained conditionally; terrain/buildings, sharing, AI/voice remain optional | Suitable feeds or explicit future work; sponsors remain parked |

The three raw cache entries `ces-report.pdf`, `pm-facts.html` and `ozone-facts.html` are known failed/security responses, explicitly excluded from scientific evidence. Their hashes passing only proves their preserved bytes are unchanged. Final publisher app evidence supports active scalar contracts; detailed score-weight reconstruction and statistical uncertainty remain limitations. `/api/health` is a **baseline file-presence check**, not a full readiness or source-integrity certification.

## Frontend owner handoff

These findings came from read-only source inspection and isolated helper probes. They do not demonstrate incorrect current civic-example values. Current inventories are immutable locally and current tract requests pin CES; the gaps matter for consistent failure handling and future source changes.

1. **Comparison compatibility:** `src/frontend/provider.ts` (`delta`) and active `src/components/ComparisonPanel.tsx` (`extent`) rely on matching `comparisonKey` and non-null values. The key encodes dataset, indicator, geography, unit and period, but does not encode definition or source hash. Backend `src/contracts/observations.ts` also verifies definition, provenance SHA-256 and explicit metadata. A synthetic same-key/different-definition helper probe still returns a difference in the frontend. Use canonical comparison APIs or retain and check equivalent metadata before calculating ranges, differences and “higher” text. Cover incompatible evidence explicitly.
2. **Small-gap formatting:** the active panel branches on exact `gap > 0` but renders with the provider's maximum-two-decimal formatter for most indicators. Running the actual extracted helper with `0.004` and indicator `pm` returns `"0"`; ozone's four-decimal path returns `"0.004"`. This can display “0 … apart” beside “higher.” Preserve nonzero gaps with suitable significant digits or an explicit threshold label; keep exact values available. This was an isolated numerical edge probe, not a new rendered UI test.
3. **Facility snapshot consistency:** `src/hooks/useFacilities.ts` correctly keys by original coordinates and separates synthetic preview, but GET requests do not pin category versions and the adapter discards response `datasetVersion`. `Infrastructure.tsx` calculates cross-location nearest differences without a version guard. Retain/pin each category version and withhold mixed-source comparisons, or use `/api/compare/facilities`. Keep category failures independent and nearest qualified by source inventory. All source categories need not be real-world exhaustive to compare available source-listed records.
4. **Optional adoption/performance:** active map requests do not use `detail=overview`; facility queries do not use `evidence=linked`. New overview/story/grouped-demographic/nearby APIs were not yet consumed in the inspected UI. Adoption is optional, but current large payloads and device behavior need measurement before a performance claim. Preserve zoom/detail guidance and exact lookup separation.
5. **Presentation plan reconciliation:** PRODUCT/EXPERIENCE/ARCHITECTURE retain the original two-address/paired-map proposal; the user-directed frontend now uses a map-first multi-location experience. Resolve the canonical description at the integration checkpoint without silently reverting UI or treating this audit as design acceptance. Preserve common definitions, legend domains, null semantics and original address coordinates across either presentation.

The ownership audit found no main changes in frontend-owned paths, no frontend changes in backend-owned paths, and no differences in the inspected shared runtime configuration. This does not substitute for a full stable integration diff review. Source hashes and the active/untracked snapshot are in the machine artifact.

## Checks actually performed

- `npm test`: **64/64 passed**; `.venv/bin/python scripts/test_fetch_sources.py`: **4 passed**; `npx tsc --noEmit`: passed.
- `smoke_nearby.py`, `smoke_demographics.py`, `smoke_stories.py`, `smoke_overview.py`, `smoke_facilities.py`, `smoke_map_overview.py` and `smoke_backend.py`: passed through both `:3000` and the `:3001` proxy.
- **179 artifact checks:** 161 raw entries, six initial facility responses, seven derived files, two school files, two healthcare files and one staged power artifact. No recorded hash/size failures. Original handoff PDF matches the immutable frontend baseline.
- Health, indicator, facility catalog, demographic and story catalog routes returned HTTP 200 on both ports. One live public Oakland query returned the expected tract `06001403402` at 22:37 UTC; no raw response was persisted and no human UI confirmation was performed.
- The actual frontend format/delta helpers were extracted and executed without changing frontend files; the isolated probes above are preserved separately in the snapshot.

No application code changed in this audit, so the running servers were not interrupted for another production build. The last production build passed for application commit `4f8306b`; this is prior milestone evidence. Frontend-reported browser/type/build results were not independently rerun here. No fresh rendered-interface, comprehensive accessibility, responsiveness or hardware-performance certification is claimed.

## Coordinated integration sequence

1. Through the user, agree on a paused frontend checkpoint and deliver this report. The frontend owner addresses/reviews the findings and commits all intended owned changes, including the new ComparisonPanel component. Keep both worktrees and existing work intact.
2. Review the full stable frontend diff against `frontend-handoff-v1`, any new owned files, shared configuration compatibility and API/source semantics. Confirm the intended map-first/multi-location presentation and optional API choices.
3. Only at that explicitly coordinated checkpoint, integrate the reviewed local frontend commit(s). Run backend tests, TypeScript and a production build with main dev stopped only as needed; preserve the separate frontend server and restore main afterward.
4. Run fresh combined rendered checks for actual features/legends, confirmation, same-tract distinct coordinates, reference direction, null/zero/incompatible/tiny-gap cases, facility category/source-version failures, stale requests, keyboard/reduced motion and narrow layouts. Profile the intended device and inspect screenshots/behavior before claiming readiness.

Until that checkpoint, independent backend work is limited to justified defects or new source evidence. Do not restart the exhausted power investigation without its concrete trigger. No push, deployment, publication or sponsor account work is authorized.
