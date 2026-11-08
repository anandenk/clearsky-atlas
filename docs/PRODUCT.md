# Product scope

## Decisions and evidence status

Confirmed by user: solo builder; beautiful comparison atlas is the centerpiece; information should be presented distinctively; aim for the original full scope and allow later explicit deferrals. Current authorization covers source verification and local implementation through Phase 2; see STATUS.md.

The supplied three-page handoff defines the initial concept. Its CES 5.0 coverage, source availability, fields, dates, and infrastructure feeds were initially unverified. Current inspected evidence, gaps, and measured results are in DATA_VERIFICATION.md and STATUS.md. Architectural and design choices below remain the full target; individual implementation status is tracked separately.

## Presentation checkpoint

The integrated desktop presentation is ClearSky: a continuous map-first canvas, a collection of confirmed locations, compact evidence with a chosen reference, and optional linked geography for a selected pair. This user-selected checkpoint supersedes the original always-paired, two-address presentation. Shared evidence, comparable legends and original address coordinates remain requirements. Mobile/bottom sheets and Explore Alternatives are explicitly user-deferred; historical narrow-screen results do not establish current mobile acceptance.

## Product promise

Explore California locations through the same evidence, understand their differences, and see exactly what each comparison can and cannot establish.

Proposed primary audience: residents and community advocates exploring neighborhood context. No location recommendation, personal risk prediction, or overall neighborhood ranking is required.

## Full target inventory

| Area | Intended coverage |
| --- | --- |
| Address navigation | California address search; candidate confirmation for ambiguous results; persistent place pins; tract outline; precise tract lookup; fly-to; outside-California and unmatched states |
| Health | Asthma emergency visits; cardiovascular/heart-attack emergency visits; diabetes prevalence; low birth weight |
| Environment | PM2.5; ozone; diesel particulates; traffic impacts; toxic air releases; cleanup-site burden |
| Community | Poverty; educational attainment; housing burden; age and racial/ethnic population breakdowns |
| Infrastructure | Healthcare facilities; public schools; power plants; source-qualified names/categories/status; straight-line distance |
| Comparison | Multiple selected locations and a reference; optional linked pair of maps; shared metric/legend; raw values and percentile positions; compatible differences; reorder/replace/remove/clear locations |
| Evidence | Definitions; raw values; units; percentiles where supported; measurement periods; dataset release; source links; null and coverage explanations |
| Presentation | Polished map transitions; 3D-capable basemap; persistent context panel; readable charts; responsive and keyboard-usable controls; reduced motion |

Conditional extensions retained from handoff: remediation-site markers and fire services only with suitable verified feeds. Nationwide expansion is outside the original scope. Detailed terrain, shareable views, AI narration, and voice remain optional. Statewide Overture building/part rendering is implemented in the selected desktop experience; source coverage and approximate/unknown heights remain disclosed.

The handoff described comparison as stretch; the user's latest instruction promotes it to the central experience. This plan retains the other original requirements.

## Distinctive information experience: comparison stories

Proposed interaction: choose an inquiry such as “Air around these places,” “Health in context,” or “Nearby essentials.” A short sequence selects relevant indicators, updates both maps, and explains each measure beside the paired values.

Each story step contains a question, selected indicator, A/B evidence, source period, and a plain-language interpretation. Initial prose is deterministic from validated records and curated definitions. Optional AI may later explain these same records; it must not invent the comparison.

An evidence drawer answers “What does this measure?” and “What does this leave out?” A small distribution strip places both tract percentiles on the same statewide scale when those percentiles are actually available. Never manufacture a percentile or label percentile points as percentage change.

Community stories use neutral descriptions. Cross-layer co-occurrence may prompt exploration but must not be presented as evidence of causation. No automatic winner, red/green neighborhood grade, or composite risk score.

## Primary journey

1. Explore the California map, then search for a location and confirm its Census match.
2. Add more locations; keep their original coordinates and identities on the map.
3. Open compact evidence, choose an indicator and reference, and inspect compatible values or collection ranges.
4. Optionally compare two selected locations in linked geography; zoom, tilt and rotation share a scale while each retains its own center.
5. Open definitions, source qualifications or infrastructure details without replacing the confirmed addresses.

A single-location view is a useful completed state, not a different product. Two addresses in the same tract correctly share tract-level indicators while retaining distinct facility distances.

## Future scope decisions

Sponsor services are parked by user decision until near MVP readiness; revisit after the core atlas data and frontend flow are integrated and reviewable. Original atlas scope remains intact.

Deferral means a feature remains in this inventory with a reason and revisit condition. A missing field must produce an explicit coverage decision, never an invented substitute. Power activation is explicitly deferred pending verified reporting-period and retirement-code evidence (or a verified alternative source); staged records remain unavailable. Fire/remediation remain conditional on suitable verified feeds. Optional terrain, sharing, AI and voice remain unimplemented extensions. Complete offline building acquisition and per-tile arrival animation remain explicit follow-ups; current statewide buildings use pinned online ranges plus successful local caching. See [readiness audit](READINESS_AUDIT.md) for current gates; none of these items is removed from the full target.
