<proposed_plan>
# Gemini-powered “Ask ClearSky”

## Summary

Add a conversational panel beside address search that supports two complete journeys:

- **“Compare these two addresses for my family.”** Resolve and confirm the addresses, open their comparison, and explain relevant environmental measures and nearby schools.
- **“Suggest areas in California with cleaner air and schools nearby.”** Clarify priorities, search statewide or within county/map filters, and present several evidence-backed options with explicit tradeoffs.

Gemini interprets requests and explains results. Validated backend tools perform searches, spatial checks and calculations. This follows Gemini’s [function-calling architecture](https://ai.google.dev/gemini-api/docs/function-calling).

Suggestions refer to **census tracts**, with county context. They are matches to stated preferences—not predictions of personal health, school eligibility or a universally best place.

## Milestone 1 — Server-side Gemini and tool foundation

- Add the official `@google/genai` SDK and a server-only `POST /api/assistant` endpoint. Configure the API key and model through environment variables; never expose credentials to the browser.
- Implement an explicit, bounded tool loop: validate every tool name and argument, execute approved backend functions, return evidence to Gemini, and validate its final response. Limit each turn to six tool rounds, twelve calls and a 45-second deadline.
- Initial tools expose indicator definitions, address candidate resolution, tract evidence, multi-place comparisons and confirmed-address facility comparisons. Reuse existing contract functions rather than duplicating calculations.
- Responses contain explanatory text, server-owned evidence cards, clarification requests and typed map actions. Numeric cards and source links come directly from tool results.
- Preserve session context in browser memory only. Keep prompts, addresses and responses out of persistent application logs. Explain that submitted queries are processed by Gemini.
- Missing credentials, quota errors and timeouts produce a useful unavailable state while ordinary atlas functions remain usable.

**Exit:** A real Gemini request successfully calls a validated comparison tool and returns traceable evidence. Invalid calls, loops and provider failures are bounded and tested.

## Milestone 2 — Complete conversational address comparison

- Add **Ask ClearSky** beside the existing address search. Its panel supports conversation, cancellation, status messages, evidence cards and suggested follow-ups.
- Reuse Census matching and the existing explicit confirmation interaction. The model cannot mark an address confirmed; the application records confirmation before allowing location-dependent actions.
- After confirmation, automatically add the requested places and open comparison. Preserve existing location identities, first-remaining reference behavior and user-selected places.
- Support queries about current selections, such as “Which has lower PM2.5?” and “Compare nearby schools.” Use original address coordinates for distances and existing version/compatibility checks for differences.
- Display source periods, units, raw school statuses and straight-line-distance qualifications alongside results. Explain missing observations without replacing them with model guesses.
- Stage map actions until the response is validated, and reject actions from cancelled or superseded turns.

**Exit:** Entering two addresses, confirming them and receiving a grounded comparison works end to end in the rendered application.

## Milestone 3 — Deterministic statewide area discovery

- Add `POST /api/discovery` and a corresponding Gemini tool. Inputs specify geographic filters, selected environmental criteria and optional source-listed active-school presence. Outputs include tract IDs, county labels, evidence, school anchors, missing-data exclusions and candidate-selection explanations.
- Build a reproducible local index from the pinned tract and school datasets. Associate school points with full-resolution tract geometry; record ambiguous or unmatched points instead of forcing membership. Use only verified source status codes for active-school filtering.
- For vague requests such as “healthiest for my children,” ask the user to accept or edit a proposed starting profile: **lower PM2.5, ozone and traffic burden, with a source-listed active school in the tract**. Do not silently choose weights.
- Filter by explicit constraints and require available values for every selected discovery criterion. Report how many tracts were excluded for missing evidence.
- Produce up to five varied candidates using deterministic Pareto-front selection across the chosen measures: retain alternatives that improve at least one criterion without another option being better on every criterion. Use normalized source percentiles only to select a spread of examples; never publish a composite health score. Resolve ties by tract ID.
- Show qualifying school points as exploration anchors. Do not interpret a school within a tract as being near every home. Calculate actual address-to-school distances only after a user confirms an address.
- Candidate tracts use distinct temporary highlights and an “Explore area” action; they never become fabricated confirmed addresses. Selecting a candidate frames its tract and schools and invites an address search.
- If no candidates match, explain which constraints eliminated results and offer explicit revisions. Never silently relax requirements.
- Exclude race/ethnicity and age composition from suitability selection. Keep housing cost, school quality, catchment eligibility, travel time and personal medical suitability explicitly unsupported by this dataset.

**Exit:** Statewide, county-filtered and map-filtered discovery return reproducible candidates with traceable selection reasons and truthful school context.

## Milestone 4 — Integrated verification and handoff

- Test tool validation, call budgets, provider errors, cancellation, stale actions and attempts to bypass address confirmation.
- Test comparison correctness: same-tract addresses, distinct school distances, nulls, source versions, incompatible observations and percentage-point differences.
- Test discovery against independently calculated fixtures: spatial school membership, active/closed/unknown status, missing values, Pareto selection, ties, geographic filters and empty results.
- Run focused desktop browser journeys for both example requests, follow-up preference changes, candidate exploration, confirmation, automatic comparison opening and keyboard/focus recovery.
- Evaluate a small prompt set covering ordinary requests, vague “healthiest” requests, unavailable criteria and attempts to obtain invented results. Inspect live Gemini responses separately from deterministic mocked-provider tests.
- Record the tested model, request latency, token usage, failure behavior and remaining limitations. Update the local refinement handoff after passing targeted checks.

**Exit:** Both journeys work with the real provider, and every displayed numerical claim is supported by backend evidence.

## Assumptions and boundaries

- Implement locally on `development/prototype-2`; keep the frozen frontend checkout and Prototype 1 tag untouched.
- This feature brings Gemini into scope; other sponsor integrations remain parked. Deployment and publication remain separate work.
- Use an available stable Flash-family model selected and pinned during provider setup. A user-supplied API key is required for the live acceptance gate; account creation or paid-plan changes are not included.
- Keep the existing address input and manual atlas usable independently. No new database, vector store, web-search grounding or autonomous agent framework is needed.
- Build milestones sequentially. Address comparison is the first usable increment; statewide discovery remains part of the committed implementation target.
</proposed_plan>