# Product scope

## Decisions and evidence status

Confirmed by user: solo builder; beautiful comparison atlas is the centerpiece; information should be presented distinctively; aim for the original full scope and allow later explicit deferrals. Current phase is planning.

The supplied three-page handoff defines the initial concept. Its CES 5.0 coverage, source availability, fields, dates, and infrastructure feeds have not been verified here. Architectural and design choices below are proposals, not measured feasibility results.

## Product promise

Explore two California locations through the same evidence, understand their differences, and see exactly what each comparison can and cannot establish.

Proposed primary audience: residents and community advocates exploring neighborhood context. No location recommendation, personal risk prediction, or overall neighborhood ranking is required.

## Full target inventory

| Area | Intended coverage |
| --- | --- |
| Address navigation | California address search; candidate confirmation for ambiguous results; persistent A/B pins; tract outline; precise tract lookup; fly-to; outside-California and unmatched states |
| Health | Asthma emergency visits; cardiovascular/heart-attack emergency visits; diabetes prevalence; low birth weight |
| Environment | PM2.5; ozone; diesel particulates; traffic impacts; toxic air releases; cleanup-site burden |
| Community | Poverty; educational attainment; housing burden; age and racial/ethnic population breakdowns |
| Infrastructure | Healthcare facilities; public schools; power plants; source-qualified names/categories/status; straight-line distance |
| Comparison | Two selected locations; paired maps; shared metric and legend; paired values and percentile positions; per-metric differences; swap/replace/clear locations |
| Evidence | Definitions; raw values; units; percentiles where supported; measurement periods; dataset release; source links; null and coverage explanations |
| Presentation | Polished map transitions; 3D-capable basemap; persistent context panel; readable charts; responsive and keyboard-usable controls; reduced motion |

Conditional extensions retained from handoff: remediation-site markers and fire services only with suitable verified feeds. Nationwide expansion is outside the original scope. Detailed terrain/buildings, shareable views, AI narration, and voice are separately optional.

The handoff described comparison as stretch; the user's latest instruction promotes it to the central experience. This plan retains the other original requirements.

## Distinctive information experience: comparison stories

Proposed interaction: choose an inquiry such as “Air around these places,” “Health in context,” or “Nearby essentials.” A short sequence selects relevant indicators, updates both maps, and explains each measure beside the paired values.

Each story step contains a question, selected indicator, A/B evidence, source period, and a plain-language interpretation. Initial prose is deterministic from validated records and curated definitions. Optional AI may later explain these same records; it must not invent the comparison.

An evidence drawer answers “What does this measure?” and “What does this leave out?” A small distribution strip places both tract percentiles on the same statewide scale when those percentiles are actually available. Never manufacture a percentile or label percentile points as percentage change.

Community stories use neutral descriptions. Cross-layer co-occurrence may prompt exploration but must not be presented as evidence of causation. No automatic winner, red/green neighborhood grade, or composite risk score.

## Primary journey

1. Enter location A; confirm the geocode if necessary; reveal its tract and context.
2. Add location B; preserve A and show a paired comparison.
3. Choose a mode and indicator; both maps and the evidence panel update together.
4. Select a comparison story or inspect individual indicators freely.
5. Open evidence details or infrastructure markers without losing the comparison.

A single-location view is a useful completed state, not a different product. Two addresses in the same tract correctly share tract-level indicators while retaining distinct facility distances.

## Future scope decisions

Deferral means a feature remains in this inventory with a reason and revisit condition. A missing field must produce an explicit coverage decision, never an invented substitute. No feature is currently deferred.
