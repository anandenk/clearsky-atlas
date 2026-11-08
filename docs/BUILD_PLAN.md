# Solo build and adaptation plan

## Full-scope policy

Aim for the entire PRODUCT.md inventory. Build complete increments in dependency order; use explicit deferrals only when a measured constraint appears. No reduced scope is preselected. Comparison and truthful evidence are protected priorities.

## Phases and acceptance gates

| Phase | Work | Exit evidence |
| --- | --- | --- |
| 0: foundation | Product, experience, contracts, risks, source preservation | Reviewable planning foundation; user selects next phase |
| 1: source contracts | Bounded inspection of proposed sources, versions, fields, access, licenses; geocoding/basemap options | Field coverage matrix and provenance; known gaps recorded; no fabricated fields |
| 2: complete comparison path | One supported indicator, two locations, correct tract lookup, paired maps, shared legend, paired evidence | Two real locations resolve correctly; changing metric/state cannot show stale values; same-tract and missing-data behavior demonstrated |
| 3: full atlas breadth | All supported original indicators and three infrastructure categories through reusable adapters/registry | Each intended field has working behavior or an explicit source blocker; nulls and categories reviewed |
| 4: comparison stories | Curated question sequences, distribution strip, numerical differences, source drawer | Every sentence traces to a compatible observation or curated definition; incompatibility suppresses differences |
| 5: visual completion | Fly-to, 3D-capable presentation, camera link, mobile layouts, typography, accessibility | Visual review on demo hardware and specified widths; keyboard/reduced-motion paths work |
| 6: optional integrations and presentation | Chosen sponsor integration, deployment, demo narrative, submission assets | Integration adds real value; failure leaves atlas usable; claims match demonstrated behavior |

Visual quality starts in phase 2; phase 5 completes it. Source breadth can grow alongside story authoring once the shared contracts stabilize, but solo work should avoid simultaneous unfinished subsystems.

## Independent deferral options

Use only if constraints arise. Record trigger, evidence, selected fallback, and revisit condition.

| Constraint | First adaptation | Preserve |
| --- | --- | --- |
| Two-map GPU/memory pressure | One rendered map with A/B switching and persistent paired evidence | Two-location comparison, identical scales |
| Terrain/building complexity | Pitched basemap or flat analytical map | Spatial clarity and polished transitions |
| An individual source fails | Mark that category unavailable; continue other adapters | Honest coverage and original backlog |
| Indicator absent/incompatible | Hide unsupported control with coverage note; retain backlog entry | Original intent, no invented proxy |
| Statewide artifact bottleneck | Declare supported demo region while retaining statewide architecture | Accurate geographic coverage disclosure |
| Too many story sequences | Ship fewer complete stories | Full manual layer exploration |
| Sponsor integration threatens core stability | Disable optional integration | Atlas and deterministic explanations |
| Geocoder outage | Clearly labeled cached, previously verified demo locations | Genuine results and explicit live-service status |
| Remaining polish time shrinks | Simplify motion and decorative 3D first | Legibility, comparison, definitions, sources |

No automatic region restriction or field cut is authorized by this table. Do not silently present a restricted dataset as statewide.

## Sponsor and theme strategy

**User decision, 2026-11-07:** sponsor services are parked until the core atlas nears MVP readiness. Revisit after supported data layers and the frontend exploration/comparison flow are integrated and reviewed. No sponsor accounts, service integration, or track-specific implementation work is part of current backend passes. The optional routes below remain future candidates; they do not reduce the full atlas scope.

Sources inspected in the planning conversation on 2026-11-07:
- https://hackrpi-2026.devpost.com/
- https://hackrpi.com/event/
- https://www.hackrpi.com/sponsor-us

These are event-description observations, not confirmed eligibility decisions. Recheck final track requirements before submission.

Primary thematic fit: Sustainability; secondary Healthcare. In the Clouds framing: a cloud-delivered, visual way to understand place-based evidence. Comparison is the product centerpiece regardless of sponsor selection.

Optional sponsor routes:
- Databricks: meaningful source ingestion, transformations, and serving artifacts. Choose if platform access and workflow fit the pipeline without rebuilding it.
- Gemini: grounded explanations of an active comparison or question-to-layer navigation. Deterministic comparison works independently.
- Fish Audio: accessible narration of comparison stories, with API use and actual voice-agent functionality aligned to the published track before claiming qualification.
- Vultr: actual application/artifact hosting if operationally suitable.
- Ethical AI Agent: only if an agent is implemented and the additional linked rubric is inspected. Ethical presentation alone is not an agent implementation.

Select at most one substantial sponsor integration first. No accounts, subscriptions, credits, or eligibility have been verified. Do not add a database or AI service merely to display its logo.

Published scheduling discrepancy: event instructions said submit 9 AM Sunday and finish edits 11 AM; Devpost header showed 10:15 AM. Plan around the earlier submission time pending organizer clarification. Do not interpret this as a reason to remove the full product target.

## Validation to perform later

- Spatial: real address membership checked independently, tract boundary cases, geographic coverage, coordinate order.
- Semantic: null preservation, raw/percentile distinction, periods, stable IDs, compatibility, same-tract comparison.
- UI: paired legend consistency, rapid switching, A/B swapping, request races, failure isolation, readable mobile comparison.
- Facilities: category correctness, published status, distance calculation, scope/completeness wording.
- Stories: grounded numbers, unsupported comparisons suppressed, no causal or individual-risk claims.
- Delivery: cached artifacts, source attribution, absent-key behavior, actual deployed app smoke check after deployment authorization.

## Current implementation status

The combined desktop checkpoint implements the comparison path, all 23 supported tract fields, schools/healthcare, linked maps, City/Flat/Landscape/Auto, statewide buildings/parts and source-qualified evidence. The post-Prototype-1 desktop refinement adds direct X removal, flexible Census input and immediate City focus; linked maps are now an explicit `?geography=1` experiment. Fresh refinement results are in [REFINEMENT_PROGRESS.md](REFINEMENT_PROGRESS.md); the original integrated base and remaining gates are in [INTEGRATION.md](INTEGRATION.md). Power remains source-gated. Optional guided story/overview/grouped-demographic/nearby-narrative adoption, comprehensive accessibility and later delivery remain follow-ups. Mobile/bottom sheets and Explore Alternatives are user-deferred. Full original target remains unchanged; these deferrals retain concrete revisit triggers. No push, publication, deployment, or paid integration is authorized.
