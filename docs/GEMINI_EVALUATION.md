# Ask ClearSky evaluation — 2026-11-08

This local audit tests the supported product journeys and adversarial/failure cases. It is a finite regression set, not proof that every phrasing will succeed. Gemini interprets questions; validated local tools own measurements, source versions, spatial lookup, ranking and UI evidence. No publication or deployment occurred.

## Cases and findings

The initial live baseline passed 29/35 cases. Failures exposed omitted healthcare priorities, a requested top-three list collapsing to one extreme, missing application map bounds, and unsupported city/out-of-state geography silently producing broader results. The first expanded run passed 40/41 assertions: its remaining failure was an overly strict test that rejected a legitimate source-definition card accompanying a refusal to fabricate. That assertion now rejects fabricated result cards while allowing verified definitions.

The expanded live set passed **49/49**. It includes both extrema for all six environmental measures; county, current-map and numeric constraints; top-N ranking; clean air with healthcare; hospitals, clinics and healthcare-only discovery; schools; selected-address and discovered-tract comparisons; explicit tract evidence; all 23 catalog measures in comparison batches; descriptive health/community extrema; context/preference changes; optional manual forms; definitions; current versus historical data; percentile versus personal probability; unsupported rent/school guarantees; city limits and out-of-state coverage; demographic suitability; confirmation bypass; invention/prompt injection; impossible thresholds; and greetings.

Reproduce the live set (incurs Gemini usage):

```sh
node scripts/evaluate_assistant.mjs
# Optional case ID regular expression:
ATLAS_EVAL_OUTPUT=artifacts/assistant-audit/focused.json node scripts/evaluate_assistant.mjs 'healthcare|clinic'
```

`artifacts/assistant-audit/` retains raw requests/responses, checks, usage and latency. The 49-case pass used 401,856 input tokens, 7,270 output tokens and 11,610 thinking tokens; maximum observed request elapsed time was 8,297 ms. These are local samples, not a performance guarantee. Earlier failures remain preserved in baseline/diagnostic outputs.

## Corrections

- Discovery respects highest/lowest directions and explicit numeric lower/upper bounds. Requested top-N lists for a single measure sort all eligible tracts, rather than displaying only frontier ties. Multiple measures show varied Pareto tradeoffs without an invented composite score.
- Supported scalar health/community searches are descriptive statistics. All ten age/race composition fields remain available for neutral comparisons and excluded from discovery suitability/ranking.
- Healthcare participates in selection. A point produced by Shapely `representative_point()` lies inside each full-resolution tract. Spherical great-circle km to a pinned, source-listed OPEN general acute care hospital (`GACH`) or the explicitly listed clinic subtype set becomes another minimized dimension. Optional maximum distance is a real filter. This point is not a tract centroid, household location or population center.
- The reproducible index records source hashes and versions for both schools and healthcare. Home-health/hospice office records are excluded from the hospital/clinic proxy. Address-based hospital/clinic queries use the same explicit subtype/status filters; the original confirmed street coordinates determine those distances.
- Search criteria, source period/version, healthcare subtype/status and method limits appear in server-owned cards. Unrequested school cards are omitted. Discovery definitions retain source-specific caveats, including PM2.5 wildfire-smoke-day exclusions.
- Application map bounds and discovered tract IDs reach Gemini for follow-ups. County equality and full-resolution map intersection remain exact; city boundaries are not invented. Explicit unsupported scope is rejected instead of silently expanded.
- Discovery frames and highlights its results, selects the appropriate domain/map measure, and draws healthcare facility anchors. Verified selected-place comparison evidence opens the comparison even if the model omits a view action. Discovered-tract comparisons show tract evidence without creating confirmed address pins.
- The persistent composer no longer covers map view controls. The optional linked-map mode retains reachable controls, legend and place selectors.

## Verification and limits

Backend tests independently scan source fields for extrema/rank ordering, verify mixed Pareto directions and null exclusions, compare healthcare nearest distances against a full valid-inventory scan, check hospital/clinic filtering, exact point membership, typed argument/scope validation, all 23 comparison fields, cancellation and provider error redaction. The preparation fixture checks deterministic output, boundary ambiguity, unmatched points, status retention and exclusion of non-care offices/closed hospitals.

UI checks cover compact entry/expansion, confirmation and automatic continuation, cancellation/stale actions, errors/focus, optional forms, automatic discovery framing and map layers, healthcare evidence, follow-up context, comparison reopening and reachable map controls. Desktop acceptance remains the target; no mobile or comprehensive accessibility certification is claimed.

Actual healthcare access remains unmeasured: insurance, specialty/services, appointment capacity, quality, travel time and current operation are not established by facility-point proximity. Tract points can be far from where residents live, especially in large rural tracts. Environmental periods differ by measure and are historical; a PM2.5 average with wildfire-smoke days excluded does not establish current smoke conditions. A city label is approximate tract context. Unsupported prices, catchments and personal medical suitability still require a clear limitation rather than invented substitutes. Exact city limits require a separately verified city-boundary source before support can be added.

The final hospital-filter and point-method refinements were additionally checked with four live healthcare scenarios; all four passed. The final backend suite passed **104/104**; preparation fixture and TypeScript checks passed. The final full desktop run passed **79/79** in 7.0 minutes (`ui-complete.log`, `ATLAS_DESKTOP_ONLY=1`), including all ten assistant UI tests. No test was excluded from that desktop run.

The desktop sweep exposed actual overlay regressions introduced by persistent question entry: map view controls and the optional geography launcher/right-pane controls were covered by the assistant. Layout corrections were checked with actual pointer clicks, including linked zoom, shared measures, mode changes and return to one map. Early interrupted runs and failure evidence remain in the diagnostic logs; only the completed final run is used for the desktop total.


Three additional live edge cases passed: source-gated power queries, new-address pairs requiring explicit confirmation, and map-only queries without available bounds. This gives **52 distinct passing live scenarios**, plus four healthcare reruns after the final hospital-filter/point-method refinements. `edge-final.json` and `healthcare-final.json` retain those responses. The corpus now contains all 52 cases for future full runs.

Final build, TypeScript, all 104 backend tests, the preparation fixture and all 79 desktop regressions passed. Twelve production browser JavaScript files were scanned for the actual server credential without printing it; no credential exposure was found. Generated `next-env.d.ts` remained byte-identical to the saved pre-audit copy. The fixed Prototype 1 tag still peels to `6dc04f30fe666f11740f236eb686a8156e308140`. Main :3000 serves the reviewed local build; the frozen frontend remains untouched. No push, deployment or release change occurred.
