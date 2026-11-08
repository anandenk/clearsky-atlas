# Ask ClearSky — local integration, 2026-11-08

The full [saved plan](GEMINI_IMPLEMENTATION_PLAN.md) is implemented on `development/prototype-2`: address comparison and statewide area discovery both use real Gemini tool calling. This is local desktop work. The frozen frontend checkout, Prototype 1 tag, private release, original PDF and other sponsor integrations remain preserved.

## Run and configure

The production application is running at <http://127.0.0.1:3000> in the existing `atlas-local-server` tmux session. The compact **Ask ClearSky** question box is visible by default; sending expands it.

The user supplied the key in `.env.local`. It is ignored by Git and has owner-only permissions. A new checkout can copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and restart Next. The pinned default/model setting is `GEMINI_MODEL=gemini-3.6-flash`, verified through the provider model endpoint. SDK version is resolved by the lockfile (`@google/genai` 3.0.0). No key belongs in a `NEXT_PUBLIC_` setting.

After preparing the existing tract and school data, build the reproducible discovery artifact:

```sh
.venv/bin/python scripts/prepare_discovery.py
npm run build
npm run start
```

`data/discovery/index.json` is generated and ignored; its small tracked manifest records input/output SHA-256, source versions, membership rules and exceptions. The atlas remains independently usable if Gemini is unavailable. Discovery itself is a deterministic local API and needs no provider credentials.

## Journeys and contracts

**Compare addresses:** the model resolves each address through the same Census adapter as manual search. Each candidate is unconfirmed until its explicit application button is pressed. Confirmation appends the original selection through the existing atlas interaction, preserving user-selected places, identities, first-remaining reference behavior and coordinates. After all requested candidate groups are confirmed, the panel resubmits with application-owned confirmed IDs, obtains comparisons/school evidence and opens the comparison. The model cannot supply coordinates or confirmation through tools. Existing manual atlas selections use application confirmation attestation; this is a local UI boundary, not an authenticated identity service.

**Discover areas:** Gemini infers supported criteria and highest/lowest direction directly from the question, searches immediately, and displays its interpretation alongside verified results. Discovery includes verified scalar environmental/health/community measures for descriptive searches, top-N ordering, lower/upper thresholds and healthcare proximity. Healthcare means a labeled source-point distance proxy; full evaluation and limits are in [GEMINI_EVALUATION.md](GEMINI_EVALUATION.md). Default scope is all California, no thresholds and no school requirement unless requested. A manual profile form remains available only when explicitly requested. Direction is validated server-side; address confirmation remains a separate unchanged requirement. Unsupported city boundaries require clarification rather than silent substitution of a county. Race/ethnicity, age, health-outcome suitability and weights remain excluded.

Discovery automatically highlights and frames all returned candidates and selects the first searched measure in its corresponding map domain, and creates no address pins. Verified comparison evidence for at least two confirmed selections opens the comparison panel even if the model omits its optional view action. Cancellation and stale-context guards apply before these UI changes.

Up to five non-dominated tract alternatives are selected respecting each chosen measure’s highest/lowest raw-value direction. Axis minima and farthest-point spread in normalized source-percentile space select varied examples; ties use tract ID. No composite score or universally best place is produced. County is an exact case-insensitive source-name match. Map filtering uses full-resolution polygon/rectangle intersection, including holes and crossing boundaries; display outlines use separate simplified geometry.

School association uses Shapely STRtree against unsimplified tract polygons. Only unique matches are assigned; ambiguous and unmatched points are recorded separately. The pinned snapshot has 9,946 unique associations, no ambiguous/unmatched points, 9,944 literal `Active` statuses and two `Closed` statuses. The source Status field describes active/closed/pending operation; no numeric status code is guessed. Missing statuses stay null. Virtual-school source flags are retained. Tract school anchors establish neither distance to every home nor current operation, quality, eligibility or access. Address-to-school distances use the confirmed address coordinates and existing straight-line-distance contract.

Candidate outlines and school anchors are temporary and independently clearable. “Explore area” frames the tract and anchors and invites a street-address search. It creates no confirmed address or fabricated home point.

API additions (all responses are `no-store`):

- `POST /api/assistant`: `{message, history?, locations?, discoveryProfile?}`. Recent history is at most twelve user/assistant text messages; locations are at most twenty application-confirmed IDs, labels, tract IDs and original coordinates. The server verifies unique exact tract membership again. Responses contain qualitative text, clarification, follow-ups, server-owned evidence, typed comparison actions and aggregate token/latency metadata.
- `POST /api/discovery`: `{criteria:[{indicator,maxRaw?,maxPercentile?}], activeSchool, county?, bbox?}`. Environmental IDs: `pm`, `ozone`, `diesel`, `traffic`, `toxic-releases`, `cleanup`. Both raw evidence and source percentiles must exist for each selected measure. Exclusion counts are mutually exclusive in this order: geography, missing selected evidence, school presence, thresholds. `missingByIndicator` is measured inside the requested geography. Empty results explain constraints without relaxing them.
- `GET /api/discovery/geometry?tractIds=…`: up to five unique California tract IDs; simplified outlines only.

The extracted `src/geocode.ts` preserves the existing geocoding response/error shapes, Census source, budgets, normalization and exact lookup checks. Comparison and facility tools call existing contract functions, including null/version/definition/unit compatibility, percentage-point differences and same-tract distinct distances.

## Provider bounds and privacy

Each turn has six model rounds, twelve total calls, a 45-second shared deadline, 2,048 output tokens per round, bounded conversation/body/context sizes and no SDK automatic retries. Two concurrent local assistant turns are admitted. Tool names, fields, enum values, references, final response structure and comparison actions are validated. Digit-bearing numeric prose and generated URLs are rejected, and the model is instructed to leave quantitative claims in server-owned tool cards. Qualitative explanations remain model-generated and are evaluated separately from deterministic data correctness.

Cancellation, close, selection changes and newer generations invalidate pending responses before actions can apply. Requests carry abort signals to provider/geocoder operations. Missing keys, quota errors, rejected provider access and deadlines return useful states; raw provider exceptions are neither logged nor returned.

Prompts, addresses and assistant responses are held in browser memory and the active server request, with no application transcript persistence. Submitted queries, selected addresses and relevant evidence go to Gemini; new address resolutions also go to Census. The panel discloses this before submission. Test artifacts use only public civic fixtures and test prompts. No database, web-search grounding, account creation, deployment or billing configuration was introduced.

## Performed verification

- TypeScript, production build and **94/94 Node tests** passed. This includes strict tool validation, unknown calls, call/round/deadline budgets, cancellation, final evidence/action references, provider error sanitization, exact location confirmation, source/null/version compatibility, percentage-point differences and same-tract separate school distances.
- The new Python spatial fixture passed, exercising active/closed/unknown statuses, an ambiguous shared edge, unmatched/missing points and byte-identical regeneration. It caught and corrected serialization of null-status audit keys. The full real index and manifest also regenerated byte-identically.
- An independent Turf pass verified **all 9,946** Shapely school memberships against production full-resolution lookup. Exhaustive fixture calculations check Pareto membership/ties; real statewide, county and exact-map results are reproducible and trace back to source observations. Missing values, thresholds, unsupported criteria, school-status exclusions and empty results are covered.
- **14/14 targeted production desktop browser cases** passed in installed headless Chrome at 1440×960: new assistant journeys/recovery plus existing address/chip/reference/geography regressions. They check explicit confirmation, automatic continuation/opening, original IDs/coordinates, cancellation/close/selection changes, stale actions, quota UI, manual search, Escape/focus recovery, profile editing/acceptance, map/county filters, rendered candidate outlines, no fabricated address pins and empty results. Earlier test diagnostics are retained; a dynamic locator needed an explicit wait for the second profile form before clicking its acceptance button.
- Both example journeys were inspected with the **real provider in the rendered application**: two civic addresses resolved/confirmed and compared with school evidence; a statewide profile accepted and candidate tract/school exploration rendered. The initial successful request samples took approximately 3.2–5.8 seconds per turn. Final production live samples took 4.0–9.4 seconds per turn; both journeys passed with no page errors. Usage and responses are in the artifacts below.
- A seven-prompt live set covered ordinary selection comparison, vague “healthiest,” unavailable criteria, confirmation bypass, invented-result attacks, accepted county discovery and changed preferences. All seven final checks passed. The first attack assertion matched a phrase inside the model’s refusal; human review confirmed the refusal, and the corrected targeted check passed on a new live response. Provider behavior is sampled evidence, not a universal guarantee.
- An actual production server with an empty key returned `503 gemini-key-missing`; its ordinary `/api/demo` still returned 200. Quota/deadline/access failures are deterministic tests, not deliberately exhausted account quotas.
- `.env.local` is ignored, owner-only, and its credential had **zero matches across all twelve built browser JavaScript files**. The fixed Prototype 1 tag still resolves to `6dc04f3`; original PDF bytes match Git.

Commands:

```sh
npm test
.venv/bin/python scripts/test_prepare_discovery.py
npx tsc --noEmit --incremental false
npm run build
npx playwright test tests/ui/assistant.spec.ts tests/ui/refinement-chips.spec.ts tests/ui/refinement-geography-visibility.spec.ts tests/ui/refinement-address.spec.ts
# Opt-in real provider calls, using public fixtures and consuming API tokens:
node scripts/evaluate_assistant.mjs
```

Evidence is retained locally in `artifacts/assistant/`: `build.log`, `unit-final.log`, `preparation-final.log`, `ui-production.log`, `live-evaluation-final.json`, `missing-key-http.json`, `production-live.json`, screenshots and `usage-summary.json`. Per-turn model, rounds, calls, latency and token usage are also available under “Request details” in the panel. All nineteen measured real requests used 144,501 input and 7,584 output/thinking tokens, estimated **$0.1368** using the inspected November 8 standard rates. Rates: [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). Account balance and credit applicability were not queried or changed.

## Remaining boundaries

No requested Ask ClearSky milestone is deferred. Mobile acceptance, comprehensive screen-reader certification, deployment, housing prices, school quality/catchment eligibility, travel time, personal medical suitability, current school-operation verification, source-gated power, offline building acquisition and unrelated sponsor integrations retain their existing boundaries. Discovery is limited to the pinned California tract and school snapshots and its explicitly accepted criteria.

## Dynamic discovery correction — 2026-11-08

The previous lower-only acceptance flow incorrectly answered a highest-traffic request with a minimum. Direction-aware Pareto selection now returns the exact eligible extreme for a single measure. Independently scanned statewide and Alameda extrema agree with toolkit results; mixed directions preserve raw observations. Live Gemini checks returned highest traffic tract 06073010009 (San Ysidro), 6136.471 vehicles/hour, and lowest 06049000400 (Cedarville), 4.529 vehicles/hour, both for the pinned 2023 traffic measure and without a profile form. Raw live responses: `artifacts/assistant-dynamic/live.json`. These are source tract measures, not current road counts.

## Summary-first answers

Ask ClearSky now leads with Gemini's interpretation of the actual findings: named places, relevant differences, tradeoffs and a next step. Discovery additionally requires a short Gemini-generated insight for every returned candidate, keyed to a valid evidence ID and tract ID. Unknown or duplicate candidate references, invented numerical claims and flagged causal-claim phrasing are rejected before display; real-time questions require a visible historical/snapshot qualification.

Main answers render as readable paragraphs, with text-only bold/list formatting. Area interpretations remain visible beside Explore controls. Search criteria/counts, comparison and facility tables, raw values, units, periods and source links are expandable evidence. Address confirmation and optional manual-profile controls stay directly available. Server-owned numeric evidence remains the source of measurements; generated insights interpret it rather than replace it.
