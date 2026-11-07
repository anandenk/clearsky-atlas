# Backend interface updates

## 2026-11-07 — frontend handoff baseline v1

- Frozen existing /api/demo, /api/geocode and /api/map shapes; documented their current limitations in FRONTEND_HANDOFF.md.
- Added local-only frontend proxy configuration via ATLAS_BACKEND_ORIGIN; main :3000, frontend :3001.
- Moved presentation palette to frontend-owned src/map-theme.ts. Shared src/domain.ts stays backend-owned.
- Added representative real-data sample data/samples/frontend-v1.json. No new indicator or facility endpoint at this checkpoint.
- New backend routes/metadata will be additive. No breaking shape/type change without a user-coordinated integration checkpoint.

## 2026-11-07 — additive backend refinement after baseline

Available live on main :3000 and through the frontend :3001 proxy. The frontend branch remains at frontend-handoff-v1; no merge or shared-file synchronization was performed.

### GET /api/indicators — now available

200 JSON with `contractVersion: "atlas-indicators-v1"`, dataset metadata, `nullBehavior`, `percentileMeaning`, `indicators`, and facility readiness notes. Header `X-Atlas-Contract: atlas-indicators-v1`; Cache-Control no-store.

`indicators` contains **23 entries for the original target indicator/demographic fields**, not a claim that all 23 CES model indicators are implemented. Each entry has id, mode, label, rawField, percentileField or null, definition, unit or null, unitVerification, measurementPeriod or null, periodVerification, availability, geographicLevel, sourceId, definitionSource, measured missingRawCount/missingPercentileCount, percentileDomain or null, unresolved notes and rawDifferencePolicy.

- PM: `availability=baseline-active-provisional`, `unitVerification=pending-primary-corroboration`, `rawDifferencePolicy=provisional-unit`. Metadata does NOT resolve the disclosed unit gap or activate a new layer.
- Other original environmental/health/socioeconomic indicators: metadata-only; unresolved periods remain null. No release date substituted as period.
- Age/racial-ethnic percentages: dictionary-verified 2020–2024 ACS period and percent unit, no percentile. Metadata-only because charts/controls are not implemented. They are not hazard measures.
- Facility `apiAvailable=false`. No hidden facility route or coverage claim.
- Definitions live in backend-owned src/contracts/indicators.ts. Selection.observations still contains source strings/null; raw `observations.tract` may lack a leading zero. Use Selection.tractId / map properties.id as canonical 11-digit join identifiers.

Frontend may consume the JSON without changing dependencies or shared types; put any frontend adapter in owned src/frontend/. Do not infer availability from raw field presence. The baseline app is still PM-only until frontend explicitly implements another verified view.

### GET /api/health — now available

200 when four local generated artifact files exist; 503 if any are missing. JSON: service, apiContract (`baseline-v1`), datasetVersion, localArtifactsReady, missingArtifacts, externalServicesChecked (`false`), readinessMeaning. Cache-Control no-store. This checks **file presence only**, not checksum validity, source freshness, geocoder connectivity, map rendering, or an environmental quality grade.

### Existing API compatibility

- /api/demo and /api/geocode response shapes unchanged; current shared domain.ts unchanged after baseline.
- /api/map response shape/error envelope unchanged. Empty coordinate tokens, nonfinite values, longitude outside -180..180, latitude outside -90..90, reversed axes and dateline-wrapped bounds return 400. Clamp map bounds to valid geographic domain or request a new contract before adding dateline behavior; California itself does not cross the dateline. Normal California viewports retain existing behavior. Source geometry/properties unchanged.
- Download cache now validates PDF/CSV/ZIP/JSON headers/envelopes and checksum/source URL on reuse; failed HTTP-200 HTML/error envelopes are recorded in data/failures rather than the successful cache. Legacy labeled failure bytes remain preserved; no automatic retries or replacement sources. These format checks do not establish complete scientific validity.

### Checks actually performed

- 14 Node spatial/data/contract tests passed, including registry fields/null counts against all observations, explicit unresolved states, geographic bounds and real frontend fixture correctness.
- 4 Python cache regression tests passed using synthetic HTTP responses without network access. Existing successful CES inputs reused with checksum/format validation; no new scientific source corroboration claimed.
- TypeScript passed. Targeted existing rendered-map interaction test passed through :3001 using the frontend worktree with no generated lookup/display/observation files, proving API proxy use.
- HTTP checks passed for demo, map, catalog, readiness on both ports; proxied invalid-bounds GET and invalid-input geocode POST returned expected 400. Proxied demo JSON exactly equals main response.
- No comprehensive new UI test pass, production-build pass, accessibility certification, performance benchmark or fully verified additional indicator is claimed by this backend pass.

### Integration checkpoint

No frontend merge requested or performed. Backend source-contract gaps remain in DATA_VERIFICATION.md. Next backend work can corroborate missing units/periods and investigate a statewide healthcare source without touching frontend paths. Before any shared type/config/dependency change or frontend integration, coordinate a paused checkpoint with the user.

## 2026-11-07 — two verified air contracts and normalized APIs

**Live on main :3000 and through the :3001 frontend proxy. No frontend merge is required.**

### Evidence milestone reached

Official OEHHA fact sheets link to the publisher's CES5 indicator apps. Downloaded app configuration explicitly defines PM2.5 in µg/m³ and ozone in ppm, both for 2022–2024. The ozone fact sheet specifies the May–October mean of daily maximum 8-hour concentrations, estimated at tract centers by ordinary kriging. PM uses annual means and excludes satellite-detected wildfire-smoke days statewide. `data/contracts/air-evidence.json` records exact cached files, JSON paths, app owners, URLs and checksums. `scripts/verify_air_sources.py` reproduces those checks; the app layer matches our CSV's pm/pmP/ozone/ozoneP at both demo points within 1e-8.

The full report URL still returns security HTML; it was not silently replaced. Its absence no longer blocks these two unit contracts because the official linked applications supply direct corroboration. The ozone app popup uses an ambiguous “summed” label; we retain the consistent mean definition from the fact sheet and dictionary rather than copying that label. Remaining indicators/facilities are not promoted.

### Catalog readiness update — atlas-indicators-v1.1

`GET /api/indicators` retains its object/array shape and adds `backendReady` and `evidence` per entry. **New enum values:** PM/ozone `availability="backend-ready"`, `unitVerification="verified-primary-map"`; both have empty unresolved arrays and `rawDifferencePolicy="same-definition-period-unit-only"`. The contractVersion and X-Atlas-Contract header are now `atlas-indicators-v1.1`. Frontend adapters must accept these readiness values instead of treating the old PM provisional state as permanent. Other 21 target-field entries remain metadata-only/backendReady=false. No changes were made to frozen src/domain.ts; live catalog supersedes its baseline readiness assumptions and old hardcoded gap prose.

### GET /api/tracts/{tractId}?indicators=pm,ozone&version=ces-5.0-final-2026-07-01

200 response:

```ts
{
  contractVersion: "atlas-observations-v1",
  datasetVersion: "ces-5.0-final-2026-07-01",
  tractId: string, tractVintage: "2020", place: string, county: string,
  observations: [{
    tractId: string, indicatorId: "pm" | "ozone", datasetVersion: string,
    geographicLevel: "2020-census-tract",
    rawValue: number | null, percentile: number | null,
    unit: "µg/m³" | "ppm", measurementPeriod: "2022–2024",
    definition: string, definitionSource: string,
    provenance: { sourceURL: string, sha256: string, rawField: string,
                  percentileField: string | null, evidenceURLs: string[] },
    percentileDomain: [0, 100], sourceId: string,
    status: "available" | "missing", qualityFlags: string[], comparisonKey: string
  }]
}
```

Omitted indicators defaults to the backend-ready list (currently pm, ozone). Explicit comma-separated IDs deduplicate in request order. No implicit fallback for unsupported indicators. Version is optional; when supplied it must match the available release. This route reads attributes without loading full-resolution lookup geometry. It can serve each of any number of frontend selections and a clicked display tract; it does not turn tract inspection into an address selection. Normalized numeric observations are a new response contract; legacy Selection.observations remains strings/null.

Error JSON `{error:string, code:string}`: 400 invalid-tract-id / unknown-indicator / invalid-indicators; 404 tract-not-found; 409 dataset-version-mismatch; 422 unverified-indicator; 503 local-data-unavailable or invalid cached source values. Strict 11-digit California IDs; unpadded or non-California IDs fail. Cache-Control no-store, X-Atlas-Dataset identifies release.

### GET /api/map?bbox=...&indicator=ozone&version=ces-5.0-final-2026-07-01

Omit indicator to retain **exactly the legacy FeatureCollection structure/properties**. Explicit pm or ozone returns the same display geometry and legacy properties plus `properties.indicatorId`, numeric/null `properties.value` and `properties.percentile`. Top-level GeoJSON foreign member `metadata` contains atlas-map-v1, datasetVersion, indicatorId, rawField/percentileField, unit, period, definition source, `legend:{property:"percentile",domain:[0,100],meaning:...}`, and geometry CRS/order/30m display simplification/id-property instructions.

Use properties.value for the selected raw metric and properties.percentile for the shared map scale. Ozone values are ppm: do not label them ppb without an explicitly labeled conversion. Membership still uses unsimplified backend geometry. Named maps return no-store; legacy cache policy retained. Unsupported/unknown indicators and version mismatch return the errors above. Empty viewports return an empty features array with honest metadata.

### GET /api/compare?tractA=...&tractB=...&indicator=ozone&version=...

200: atlas-observations-v1, datasetVersion, indicatorId, normalized observations `a` and `b`, plus `comparison`:

- compatible, sameTract;
- rawDifferenceBMinusA, unit;
- percentilePointDifferenceBMinusA (points, not percent change);
- reason and limitation.

Default indicator pm. Compatibility requires matching version, indicator, definition key, period, unit and geography. Incompatibility/missing observations suppress corresponding differences; no denominator-based percent change, causal/significance inference or cross-indicator ranking. Same-tract locations return zero difference while distinct address pins remain a frontend concern. Pairwise API is optional for multi-location views; frontend owns interaction/layout.

### Checks and operational notes

21 backend tests pass: every tract's normalized air values/percentiles, original/source app hashes, live-source cached point checks, signed and same-tract comparisons, incompatible versions/units/periods, missing/zero handling, map property consistency, existing spatial checks. TypeScript passed. `python3 scripts/smoke_backend.py --origin http://127.0.0.1:3000 --origin http://127.0.0.1:3001` passes actual HTTP checks for new routes, legacy compatibility, same-tract comparisons, version pinning, invalid IDs and unsupported indicators through both origins.

A Next dev hot-reload graph briefly served stale readiness in the newly added route while the catalog was current; restarting ONLY the main backend reconciled it. HTTP smoke checks now confirm the same readiness and values across routes. Frontend preview/worktree were not restarted or modified. No shared types, dependencies or framework configuration changed in this pass. Readiness metadata is not a claim that frontend controls or rendered ozone maps are implemented; that verification belongs to the frontend session.

Production build also passed after stopping only the main dev process; backend :3000 was restored and both-port smoke checks passed again. Frontend :3001 was retained. `data/samples/air-api-v1.json` now snapshots real normalized responses for the two verified demo tracts and both pairwise comparisons; reproduce with `python3 scripts/prepare_air_api_sample.py` while the backend runs. This is a sample, not synthetic data or a statewide verification claim.

## 2026-11-07 — original indicator breadth, catalog v1.2

**User decision:** sponsor services are parked until near MVP readiness, after the core atlas data and frontend flow are integrated and reviewable. No sponsor-service work in this pass; optional services remain future candidates.

### What is now available

All **13 originally intended scalar indicators** (six environment, four health, three socioeconomic) and **ten age/racial-ethnic population percentages** are backend-ready. These 23 entries are the target field set, not the 23-indicator CES model or a claim that infrastructure is implemented. Catalog is `atlas-indicators-v1.2`; dataset remains `ces-5.0-final-2026-07-01` and source observations are unchanged.

`GET /api/tracts/{id}` now defaults to all 23 ready entries; use `?indicators=...` for an explicit smaller set. Existing response shape and numeric/null semantics remain. Explicit indicator requests to /api/map and /api/compare support the same 23 IDs. /api/demo, /api/geocode, and /api/map without an indicator retain legacy behavior/fields. No frontend branch merge, shared src/domain.ts edit, package change, or framework-config change was needed.

| ID | Raw field | Unit | Measurement/source period |
| --- | --- | --- | --- |
| pm | pm | µg/m³ | 2022–2024 |
| ozone | ozone | ppm | 2022–2024, May–October daily maximum 8-hour means |
| diesel | diesel | tons/year | 2021 or 2022 depending on emission source |
| traffic | traffic | vehicles/hour | 2023; adjusted vehicle-km/hour divided by km roadway within/up to 150 m |
| toxic-releases | RSEIhaz | toxicity-weighted score | 2021–2023 average; not a physical concentration or mass |
| cleanup | cleanups | weighted site score | March 2026 source snapshot; not a site count or averaging period |
| asthma | asthma | ED visits per 10,000 people | 2022–2023, age-adjusted |
| heart-attacks | cvd | ED visits per 10,000 people | 2021–2023, age-adjusted acute myocardial infarctions |
| diabetes | diabetes | % | 2023, model-based prevalence among adults 18+ |
| low-birth-weight | lbw | % of live births | 2018–2024, infants under 2,500 g |
| poverty | pov | % of people | 2020–2024 ACS, below twice federal poverty level |
| education | edu | % of adults 25+ | 2020–2024 ACS, less than high school education |
| housing | housingB | % of households | 2018–2022 HUD CHAS; income below 80% of county median family income, housing cost above 50% of household income |
| pop_und10 / pop_10_64 / pop_ov64 | same names | % of population | 2020–2024 ACS |
| hisp / white / black / amind / asian / pacisl / othmult | same names | % of population | 2020–2024 ACS; dictionary category definitions |

### Evidence and important interpretation

`data/contracts/indicator-evidence.json` records all 13 scalar contracts, exact publisher item IDs, owner, JSON paths, source hashes, unit/period assertions, and two representative live-source point responses. `scripts/verify_indicator_sources.py` reproduces validation and generates backend-owned verified-targets.ts. The publisher's final app **popup expressions**, not just description text, explicitly supply diesel tons/year, traffic vehicles/hour, and diabetes percent. Their field values match our CSV across all 26 scalar raw/percentile fields at both demo locations, within 1e-8. Demographic percentages and periods are from the already-downloaded CES dictionary.

Primary fact sheets corroborate distinct dates for cardiovascular, low-birth-weight, diabetes, education, housing, traffic, toxic releases and cleanup. No old CES4 or draft date was carried into this release. Full report acquisition is still blocked by origin security HTML; no draft report substituted. Site and RSEI measures remain **weighted source scores**, not invented physical units or counts. Detailed source weighting methods cannot be independently reconstructed from this bundle; we compare publisher outputs under the same release/definition.

Source null/suppression counts remain unchanged: e.g. 234 low-birth-weight missing observations, 36 diabetes, 33 asthma, 26 cardiovascular, 25 per demographic field. Do not turn a missing observation into zero. Conversely a valid zero remains an observed value even if publisher popup code uses IsEmpty; we do not copy its zero-hiding behavior. Population health rates/prevalence are not personal disease probabilities; community composition has no hazard direction.

### Frontend consumption changes

Every catalog entry now includes:

```ts
visualization: {
  kind: "source-percentile" | "neutral-percentage",
  property: "percentile" | "value",
  domain: [0, 100],
  interpretation: string
};
limitations: string[];
```

- Scalar indicators use source percentiles on the shared 0–100 domain. Their raw units and periods remain distinct; don't rank unlike raw units or mix measurement years into a common label.
- Age/racial-ethnic entries have `percentileField=null`, `percentileDomain=null`, and no manufactured percentile. Named map responses use `metadata.legend.property="value"`, `kind="neutral-percentage"`, raw domain 0–100. Use neutral presentation rather than hazard coloring.
- The named map route now joins the **requested** field from canonical observation records to cached display features, without adding every indicator to the legacy statewide geometry payload. Feature ID/geometry are unchanged. Read properties.value, properties.percentile and metadata.legend; do not assume every map is PM or every legend is a percentile.
- /api/compare adds `rawDifferenceUnit`. For percentage-valued observations it is **percentage points**; legacy `unit` remains the raw observation unit `%`. percentilePointDifferenceBMinusA remains separate. Percentage change is not computed.
- Read live metadata through the proxy; don't import backend-only generated files into the frontend branch. Backend readiness is not a claim that frontend controls/charts or rendered maps have been implemented/verified.

Representative real responses: `data/samples/breadth-api-v1.json`, including a genuinely suppressed health observation and a genuine zero cleanup score. Reproduce with `python3 scripts/prepare_breadth_sample.py` while the backend runs.

### Verification and remaining work

26 backend tests passed: all 23 fields over 9,106 tracts, original raw/percentile null counts and zeros, evidence hashes/assertions, all intended scalar source-point matches, compatible/same-tract/missing comparisons, neutral demographic legends, existing lookup boundaries/holes/outside-CA checks. TypeScript and production build passed. Actual HTTP smoke checks passed on both :3000 and :3001 for all 23 named maps, normalized observations, comparison units, a real suppression, error handling and unchanged legacy maps. Backend server was restarted after build; frontend server/worktree remained untouched.

Infrastructure APIs remain unavailable: statewide healthcare source, facility coverage/status/license/date validation, complete acquisition and qualified distance queries are still to do. Broad-area performance measurement, richer comparison/story summaries and final integration remain planned. Sponsor services stay parked. No UI completion, full clinical-method reproduction, facility access, or deployment claim is made.

## 2026-11-07 — verified school inventory and facility queries v1

Additive `GET /api/facilities` now serves real **CDE 2025–26 public schools**. No frontend source, shared configuration, dependencies or active frontend worktree changed. The latest frontend checkpoint is now `dd9d57e` (observed this pass); `design.md` remains actively modified. No integration performed.

### Requests and response contract

- `/api/facilities?category=schools&bbox=-122.28,37.79,-122.25,37.82`: inclusive viewport points, stable ID ordering. `distanceKm=null` without `near`.
- `/api/facilities?category=schools&near=-122.271,37.803&limit=10`: nearest among **all coordinate-bearing records in the cached inventory**, sorted by spherical great-circle distance, with stable ID tie breaking. Optional bbox restricts the search before ordering. `near` is longitude,latitude WGS84. No radius or travel calculation.
- Optional `version` pins the facility datasetVersion from the response (separate from CES). `limit` defaults to 100, integer 1–1000. Response includes matchedCount, returnedCount and truncated; truncated lists do not represent all visible facilities.
- Envelope: `contractVersion=atlas-facilities-v1`, datasetVersion, category, sourceUrl, sourcePeriod, observationDate, rights, coverage, audit, provenance, query, distance, facilities. Each facility: stable `cde:{14-digit CDSCode}` id, category, name, WGS84 coordinate, sourceId, status, observationDate, sourcePeriod, subtype, flags, sourceAttributes and distanceKm. No manufactured dates. Source dates (open/closed epoch milliseconds) remain in sourceAttributes; observationDate is null and sourcePeriod is 2025–26.
- **All source statuses are retained**, including Closed; this is not an open-only endpoint. Preserve that distinction in markers/lists. No school assignment, admission, services, capacity, travel-time or current-operation inference.
- HTTP 400 `invalid-facility-query` for missing category, missing bbox/near, malformed coordinates/bounds or limit; 422 `facility-category-unavailable` for healthcare, power or other unsupported categories; 409 `unsupported-facility-version`; existing 503 `local-data-unavailable` on local artifact failure. Errors have error/code and no-store. Successes also use no-store. Empty covered queries return 200 with an empty facilities list.

### Source verification and measured inventory

`data/facilities/schools.json` is the versioned normalized artifact, with original selected source attributes and full provenance. `scripts/prepare_schools.py` reproduces it from cached originals, verifying every source object ID exactly once, unique 14-character CDS codes, academic year, CRS, coordinates and source state. Original metadata, ID sets, 50 pages (200 IDs per bounded request), and rights HTML are in data/raw with URL/retrieval UTC/bytes/SHA-256. A 1,000-ID GET exceeded the source's URL handling and returned HTTP 400; 200-ID requests succeeded without retries. No credentials needed.

Complete acquisition: **9,946 records**, **9,946 valid published coordinates**, **9,944 Active / two Closed**, **58 geographic site counties**. Before/after ID sets and source edit metadata agreed in the acquisition. All points intersect existing **unsimplified** CES lookup polygons (Shapely STRtree audit); this is a coverage check, not a school-attendance boundary or independent proof of real-world completeness. Co-located schools remain distinct records; no coordinate deduplication. See schools-validation.json for counts. Missing/invalid points would remain in the inventory with null coordinates and flags, excluded from spatial queries.

Publisher describes TK/K–12 schools open in October 2025. Nonpublic and district office schools are excluded. Buildings/parcel centroids may differ from entrances; virtual-school flags are preserved. Source metadata edit times are retained separately and do not replace the academic period. The state [catalog rights](https://data.ca.gov/@california-department-of-education/california-public-schools-2025-26) explicitly report no public-use restrictions; its original HTML is cached and asserted by the pipeline. The ArcGIS item has no named license; namedLicense remains null. Attribute CDE and link the source. This resolves the previous school reuse blocker without inventing a license.

Cached reuse verifies hashes and source URLs. Before/after checks represent the acquired snapshot; rerunning against the same immutable cache does not claim a fresh upstream check. Refresh requires a deliberately new cache/snapshot, never silent overwrite. Version is derived from the source manifest. Restart backend after regenerating process-cached artifacts.

### Verification and limits

31 Node tests passed, including original scalar/spatial regressions, actual inventory IDs/provenance hashes/statuses/coordinates, known zero/quarter/half-circumference/antimeridian distances, independent dot-product ranking at an Oakland query, subset/empty/limit/version/error cases and explicitly synthetic null/co-location/tie fixtures. Four Python cache regression tests passed. TypeScript and production build passed with only main dev stopped; main restored afterward. `scripts/smoke_facilities.py` passed real HTTP cases on both ports and produces `data/samples/facilities-v1.json`; general scalar smoke checks rerun separately. No new rendered UI, facility markers, accessibility or map-performance certification. Frontend can read the API via its existing relative proxy; no shared type merge required.

Next: verify the statewide first-party CDPH [licensed/certified listing](https://data.ca.gov/@california-department-of-public-health/licensed-and-certified-healthcare-facility-listing) (candidate discovered, not acquired/approved here), then CEC vintage/status/geometry. Healthcare/power remain unavailable until their individual evidence/acquisition/query gates pass. Grouped demographic charts, richer summaries, measured statewide performance and coordinated frontend integration remain in the full target. Sponsors remain parked.
