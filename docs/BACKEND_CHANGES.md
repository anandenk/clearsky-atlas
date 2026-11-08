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

## 2026-11-07 — sanity audit and statewide CDPH healthcare inventory

### Sanity audit

Reviewed AGENTS ownership/authorization, current planning/continuation records, main and frontend status, school acquisition/versioning/null/status/distance behavior and source/derived hashes. Main started clean at 746f2a5. Changes since the split remain in backend-owned paths; active frontend UI/design edits are preserved. No merge, deployment, sponsor work, package or shared-root configuration change. Original scope remains intact. Re-ran all 31 pre-existing backend tests, four cache tests and both-port facility checks successfully before broadening.

Found documentation drift: STATUS and NEXT_SESSION_PROMPT opened with old PM-only or pre-facility instructions despite later superseding sections. Added a current summary to STATUS and SESSION_HANDOFF and rewrote NEXT_SESSION_PROMPT around the actual continuation. Historical source/test evidence is retained and explicitly labeled. PRODUCT/EXPERIENCE's older two-address composition remains a known reconciliation item for the user-coordinated frontend checkpoint; no attempt to revert the current map-first/multi-location UI.

### Healthcare is now available

`GET /api/facilities?category=healthcare&near=-122.271,37.803&limit=10` and `category=healthcare&bbox=...` use the existing v1 facility contract and validation/limit/truncation semantics. Schools remain compatible; category caches and dataset versions are independent. Category is required; supported values are schools/healthcare. Power and unknown categories remain 422. A school/CES version on a healthcare request is 409. No frontend merge or shared type import is needed: use relative JSON requests through :3001.

**14,921 unique string FACIDs**, snapshot **2026-10-16**, source status OPEN for all; **14,919 coordinate-bearing spatial-query records**. Statewide listing includes records in **57 California counties plus Curry County, Oregon**. This is county presence, not a claim that every county has facilities or that every provider is represented. Source scope is CDPH licensed and/or CMS-certified facilities, with 42 subtype codes; `UNLICEN` is preserved rather than silently discarded (CMS-only certification can differ from CDPH licensure).

Each record retains `cdph:{nine-digit FACID}` identity (including leading zero), FAC_TYPE_CODE subtype, FAC_FDR roll-up, raw selected attributes, licensing/status, parent/branch relationship and extraction date. `observationDate` and `sourcePeriod` are the DATA_DATE extraction date, not a claim that operation was rechecked today. Codes include home-health agencies, hospices, laboratories, hospitals, clinics and other services: **do not label every marker as walk-in care**. No travel, capacity, insurance, current-license validity, emergency-service or access guarantee. Coordinates are published geocodes, not guaranteed entrances.

Two points fall outside unsimplified CES lookup coverage: `cdph:630006081` (published address Stateline, Nevada, despite an El Dorado county label) and `cdph:630017965` (Oregon branch, FIPS 41015). Both records and raw source coordinates remain in the normalized inventory with `coordinate=null` and `outside-ces-tract-coverage`; spatial queries omit them. This filter establishes coverage relative to CES, not independent statewide land-boundary certification. Missing/invalid geometry would likewise remain flagged/null. No coordinate invention or county-label-only inclusion.

### Acquisition, rights and coordinate evidence

First-party [CHHS catalog/API](https://data.chhs.ca.gov/dataset/healthcare-facility-locations) provides the current facility resource and dictionaries. Direct CSV and two XLSX downloads returned HTTP 403 after redirects; they were not cached as successful files. The same publisher's anonymous DataStore API successfully supplied 15 sorted selected-field pages, all 59 dictionary definitions and all 277 lookup rows. Original JSON responses and before/after resource metadata are cached byte-for-byte with URL, retrieval UTC and hashes. The pipeline validates page lengths, total, unique row IDs and nine-digit FACIDs, unchanged before/after resource hash/last_modified and counts, one extraction date, fields and spatial coverage. These are API snapshot checks, not byte-identity claims against the unavailable CSV. Cached reruns do not claim a fresh upstream check.

The [state catalog](https://data.ca.gov/@california-department-of-public-health/licensed-and-certified-healthcare-facility-listing) explicitly lists no public-use restrictions and Creative Commons Attribution; original HTML is cached/asserted. Catalog does not specify the license version here; licenseVersion stays null. Attribute CDPH and preserve source links.

The dictionary explicitly describes LATITUDE/LONGITUDE as decimal degrees but also inconsistently references EPSG:3857. We consume numeric LONGITUDE,LATITUDE in degrees, retain that conflict in limitations and do not project those degree values as metres. Two matching FACIDs independently agree with the previously cached LA-hosted WGS84 sample points within 3 m. LOCATION text is unused because its documented ordering also conflicts with sample text. Full spatial validation uses existing unsimplified CES polygons; the precise geocoder/CRS discrepancy is not claimed resolved by two examples.

`data/facilities/healthcare.json`, healthcare-validation.json and healthcare-manifest.json preserve normalized records, audit and derived hashes. `scripts/prepare_healthcare.py` reproduces these from validated cached originals. `data/samples/healthcare-v1.json` is a small real response, reproduced by scripts/smoke_facilities.py. Existing school sample changed only in the generic distance disclaimer wording.

### Checks and remaining work

34 backend Node tests pass (31 previous plus full healthcare ID/hash/status/date/geometry/null checks, two independent source-point comparisons and category/version isolation); four cache tests pass. TypeScript and production build pass. Only main's dev pane was stopped for build and restored; frontend process remains separate. Both-port facility and all-23-indicator smoke checks are run after restoration. No new frontend rendering, accessibility or performance claim.

Next source milestone remains CEC power: reporting vintage, Retired_Plant semantics, reuse and complete California spatial filtering. Full inventory, explicit unavailable categories and optional fire/remediation gates remain. Grouped demographic agreement, richer deterministic comparisons/stories, measured statewide payload/index performance and coordinated integration follow. Sponsors remain parked until core MVP readiness.

## 2026-11-07 — complete CEC candidate audit and facility readiness catalog

### Additive discovery API

`GET /api/facilities/catalog` returns `contractVersion=atlas-facility-catalog-v1`, `categories`, and qualified distanceMeaning. Category entries have `id`, backendReady, datasetVersion, sourceUrl, sourcePeriod, observationDate, rights, coverage, audit/provenance and blockers. Point arrays are omitted. Schools/healthcare remain ready with their existing independently versioned contracts; local read failure reports that category unavailable without disabling other catalog entries. Power is **backendReady=false** with named blockers and concrete revisit triggers. Catalog readiness is not frontend completion or real-world completeness. All responses no-store.

`GET /api/facilities?category=power&...` remains HTTP 422; no new live power markers or distances. Existing school/healthcare query shapes/behavior are unchanged. Frontend can discover category readiness through its existing relative proxy, without a code/type merge. A real catalog sample is in data/samples/facility-catalog-v1.json; scripts/smoke_facilities.py reproduces it and checks both origins.

### Complete source acquisition and spatial audit

`scripts/verify_power_inventory.py` reproduces a **staged**, explicitly unapproved power inventory in data/facility-verification/power-normalized.json plus power-validation.json and data/contracts/power-readiness.json. All **2,378 unique CECPlantIDs/object IDs** acquired in one successful complete query, checked against a separate full ID set/count and unchanged before/after edit metadata. No transfer truncation. Native EPSG:4269 and publisher-transformed EPSG:4326 responses are both preserved with URL/time/bytes/SHA-256; raw attributes, native/query geometry and nulls remain in staging. No source originals overwritten.

**2,334 points** intersect unsimplified CES lookup coverage; **44** outside points are retained with raw geometries but null candidate query coordinates and flags. This is a CES coverage rule, not independent state land-boundary certification; county labels alone do not determine eligibility. Source nulls include one Capacity_Latest, five County, six PriEnergySource, 13 StartDate and 322 Units values. None become zero or invented labels. Names/CECID and raw 0/1 retired codes remain intact.

Independent pyproj NAD83→WGS84 comparison across all published coordinate pairs differs from ArcGIS output by at most approximately **1.30 m** (exact maximum in validation JSON). An initial 0.00001-degree equality tolerance failed because the two transformation paths differ slightly; the audit now measures geodesic metres and requires <3 m. This does not certify sub-metre accuracy or resolve edge uncertainty. Lookup geometry hash is recorded for reproducibility.

### Source gates: power activation explicitly deferred

1. **Reporting period unverified.** Service purpose still says May 2022, current layer edit is June 12, 2026, and item description mentions a Last Reported Year field absent from the actual schema. Edit/retrieval dates and StartDate are not reporting/observation dates. Staged sourcePeriod and observationDate remain null. Trigger: first-party applicable snapshot documentation or per-record reporting-year evidence tied to this layer/version.
2. **Retirement code unverified.** 2,082 records have Retired_Plant=0; 296 have 1. Field has no coded domain or definition in current layer/item metadata, item popup configuration or XML. All staged normalized status values remain null; no 0→operating or 1→retired inference. Trigger: first-party code dictionary tied to this field/version, or a verified alternative status-bearing feed.

Both linked QFER source-file index and plant-statistics pages reset the connection. Exact attempted URLs: https://ww2.energy.ca.gov/almanac/electricity_data/web_qfer/source_files/ and https://ww2.energy.ca.gov/almanac/electricity_data/web_qfer/Power_Plant_Statistical_Information_cms.php . No failed bodies treated as successful evidence, account workaround, automatic retry or contact message. This is not proof the publisher lacks those definitions. Do not repeatedly restart the same investigation until a source/access change provides new evidence. No dated older dataset, unrelated annual energy table or third-party status label substituted.

The state catalog lists Creative Commons Attribution/no public-use restrictions; the actual item links [CEC conditions](https://www.energy.ca.gov/conditions-of-use), whose text requires credit and restricts commercial/profit-making use/modification. Both originals cached. Staged rights preserve the difference and unspecified license version; do not turn the catalog label into a blanket unrestricted-license claim. This pass remains local source verification; future publication/commercial rights require reconciliation separately. No publication is authorized.

### Verification and next independent work

36 Node tests passed, including complete source-ID/attribute/null preservation, provenance and staged artifact hashes, coordinate audit thresholds, catalog ready/unavailable separation, explicit blockers/triggers and continued rejection of power queries. Source-geometry preservation was then checked with the focused ten-test facility suite. Four cache tests, TypeScript and production build passed. Both-port facility/catalog and scalar smoke checks after main restoration are recorded at final checkpoint; no frontend process/worktree changes or rendered UI/accessibility/performance claims. A first new-route dev request transiently returned 500; the next smoke run passed on both ports; final build/restart/checks verify a fresh server graph.

Power remains part of the full target, with the specific activation deferral and triggers above. Continue independent backend work: grounded multi-location comparison/overview support and measured payload/query performance; grouped demographics still require agreement on source category identities/denominators/null handling. Frontend is actively consuming live scalar/facility APIs but remains separately owned; no integration is authorized without the user-coordinated checkpoint. Fire/remediation remain conditional. Sponsors stay parked.

## 2026-11-07 — grounded multi-location overview and measured payloads

### Optional batch comparison API

`POST /api/compare/overview` accepts Content-Type application/json and `{locations:[{id:"oakland",tractId:"06001403402"},{id:"fresno",tractId:"06019000602"}],referenceId:"oakland",indicators:["pm","poverty"],version:"ces-5.0-final-2026-07-01"}`. referenceId defaults to the first location; indicators defaults to all 23 ready entries; version may be omitted. IDs must be unique 1–64 alphanumeric/underscore/hyphen strings; tract IDs remain 11-digit CA strings. Repeated tracts are allowed and retain distinct location identities. Input order is preserved; no stored address/coordinate/label is needed. Each unique tract attribute row is read once without spatial geometry.

The endpoint accepts **1–20 locations per request**, at most 23 indicator IDs and at most 32 KiB JSON. These are explicit batch limits, not a product collection/display cap; clients may batch larger collections. No silent truncation. Unknown/invalid indicators, invalid IDs/references/batches return 400; malformed JSON 400 invalid-json, non-JSON Content-Type 415 json-required, body >32 KiB 413 overview-request-too-large, wrong source version 409, valid uncovered tract 404. Existing error envelope/no-store semantics retained. Whole-request validation is intentional; it does not silently drop uncovered locations. Existing GET /api/compare is unchanged.

Response `contractVersion=atlas-overview-v1`: datasetVersion, referenceId, comparisonDirection=`location-minus-reference`, locations (id/tract/place/county), ordering/limitations and rows. Each row carries its own verified definition/unit/period/visualization/provenance once, then aligned values with locationId, tractId, rawValue, percentile, status, qualityFlags and comparisonToReference. The existing compareObservations helper supplies compatibility, sameTract and signed differences: within comparisonToReference, **A is reference and B is this location**. Missing reference raw values suppress every raw difference; valid zero remains available. Percent-valued differences use percentage points. Different source periods remain row-specific.

Row summary includes selectedLocationCount, distinctTractCount, available/missingLocationCount, percentileLocationCount, allSameTract and within-indicator raw/percentile ranges. A range requires at least two available values and compatible evidence; one/missing values do not manufacture a range. All incompatible ranges are withheld. rawRange.unit labels min/max values (e.g. `%`), while rawRange.spreadUnit labels max-minus-min (e.g. percentage points); percentile range uses source percentile / percentile points respectively. Source percentile nulls remain null; demographics have no hazard percentile or composition renormalization. Same-tract addresses share evidence without becoming one location or implying identical properties. Deterministic interpretation text states these limits; no significance, personal-risk, causal or unlike-unit importance ranking.

`data/samples/overview-v1.json` is a real 3-location/23-indicator response with a repeated tract, reproducible by scripts/smoke_overview.py against both ports. API consumption is optional; frontend may retain its existing adapter. No UI edit or shared-type merge required.

### Metadata correction and optional facility payload reduction

/api/indicators previously retained a stale `facilities.apiAvailable=false` and pre-acquisition descriptions. Corrected it to true with additive catalogUrl `/api/facilities/catalog`; healthcare/school strings now describe available qualified inventories, power remains explicitly unavailable. Indicator definitions and catalog v1.2 are unchanged. A previously stale test asserting facilities unavailable was corrected to the current contract.

Facility queries now accept optional `evidence=linked` (default `full`). Linked responses retain identical facility facts, source attributes, coordinates, distances, rights, coverage, counts and limitations, while replacing the repeated full provenance manifest with `{kind:"catalog-reference",catalogUrl,category,datasetVersion,meaning}`. Fetch the catalog once and match category/datasetVersion for full original URLs, retrieval times and hashes. Default full provenance is unchanged; query.evidence is additive. Invalid evidence selector is 400. This is not evidence removal: original manifests remain cached and served in the category catalog. No frontend switch was made automatically.

### Measurements and verification

`scripts/measure_backend.py --mode development` records complete-body local HTTP timings, byte sizes, an offline gzip estimate and source-code hashes in data/benchmarks. Six/seven bounded cases cover statewide/local maps, nearest facilities and 3/6-location overviews. First request is not a controlled process-cold start; five subsequent sequential samples give median/max, not a robust latency percentile. Frontend may concurrently load the server/device. No production, browser/GPU/frame/memory or network guarantee is inferred. Gzip figures are offline estimates, not observed wire compression; requests explicitly use identity encoding.

Measured named statewide PM map: **15,702,991 bytes / 9,106 whole display features**; Oakland bbox: 27,159 bytes / 33 features. Six-school response: approximately **117.9 KB full versus 7.4 KB linked**, about **94% fewer response bytes**, with identical returned records. Local development latency varied substantially across runs, so no speedup claim is made. Overview responses are approximately 67 KB (three locations/all fields) and 100 KB (six/all fields), with source metadata per row. Exact samples and environments are retained in benchmark JSON. `backend-baseline-v1.json` and `backend-linked-evidence-v1.json` are intermediate measurements before the final additive comparisonDirection field; `backend-checkpoint-v1.json` is the final post-restart snapshot with source hashes.

43 backend Node tests passed: all existing source/spatial/null/comparison tests plus multi-location/reference/order/same-tract, real suppression/zero, percentage-vs-spread units, incompatible summaries, batch validation and linked/full evidence equivalence. Four Python cache tests, TypeScript and production build passed. Main alone stopped/restarted for build; final overview/facility/catalog/all-scalar HTTP smoke checks run on :3000 and :3001 afterward. No frontend integration, rendered UI/accessibility or controlled device-performance certification. Frontend now reports a separate Common ground creative reset and live all-23-field/facility consumption; this is its session report, not backend certification.

### Next work and retained gates

The measured 15.7 MB startup response makes bounded statewide display delivery (overview LOD/tiles or equivalent) the next concrete backend performance task; preserve full-resolution membership and existing map contracts, and verify feature IDs/properties/nulls and visual coverage before recommending frontend adoption. No tile strategy/dependency/config change is preselected here. Target-device/frame measurements remain frontend/integration work. Grounded guided stories and grouped-demographic agreement remain planned; power activation still awaits its existing source triggers. Conditional fire/remediation and original optional extensions remain retained. Sponsors stay parked. Active frontend work is untouched; a paused user-coordinated checkpoint is still required before integration.

## 2026-11-07 — opt-in statewide overview geometry

### API and compatibility

Named maps accept optional `detail=overview`: `/api/map?bbox=-125,32,-114,43&indicator=pm&detail=overview`. Default/explicit `detail=standard` retains the previous 30 m geometry, properties and metadata. Unnamed legacy requests are unchanged. Overview requires a named indicator (400 indicator-required); unknown detail is 400 invalid-map-detail, dataset pinning still applies. Missing optional overview artifact returns existing 503; there is no silent substitution. Success remains no-store for named maps. All 23 scalar/demographic IDs are supported with their original source values, nulls, units, periods and shared legends.

Overview feature properties are compact `{id,indicatorId,value,percentile}`; place/county/legacy raw-field aliases remain available via the default map and tract APIs. Full polygons, not bbox-clipped geometry, are returned. Geometry is **display only**, recommended through approximately zoom 7; use standard for neighborhood detail and the unchanged unsimplified lookup for membership. No automatic zoom/detail selection or frontend change was made. Frontend adoption remains optional and must preserve inspection and tract IDs.

metadata.geometry includes detail, geometryVersion `ces5-overview-v1`, artifactSha256, algorithm, simplificationParameterMetres=250, toleranceMeaning, coordinatePrecisionDegrees=0.000001, recommendedMaxZoom=7, area guard and limitations. `simplificationMeters=null` for overview deliberately avoids implying a maximum 250 m displacement: this is a Visvalingam-Whyatt **area-based** simplification parameter. Standard keeps simplificationMeters=30 as before. CES datasetVersion still pins observations; the separate geometry version/hash identifies display derivation.

### Geometry audit and derivation

`scripts/prepare_map_overview.py` uses the cached, hash-verified original EPSG:3310 shapefile; no new source download/dependency/root-config/shared-type change. Source polygons are individually valid, but coverage_invalid_edges identified five source participants with unmatched/overlapping edges: 06037599000, 06037599100, 06075012700, 06075042800, 06075060100. Their combined invalid-edge length is 9,432.225 m. Whole-layer coverage_simplify would be invalid under its input assumptions, so it was not used as the production derivation.

Instead, retain those five source geometries, simplify only the valid remainder with shared-edge coverage simplification and `simplify_boundary=False` (outer/hole boundaries fixed before reprojection/precision). Apply an engineering area-change guard: iteratively retain additional source tracts if simplification changes projected area by >10%. **278 additional tracts** are retained before reprojection/coordinate precision. All 9,106 IDs and nonempty valid polygons remain. No new coverage-error participants in source CRS or final WGS84 precision check; original source issues are retained, not repaired. The source invalid-edge length is unchanged in projected coordinates.

After shared-edge simplification: 209,433 coordinate tuples versus 3,150,461 in the original unsimplified source. Median/P95/maximum relative projected area change before reprojection/coordinate precision are approximately 0.84% / 5.98% / 10.00%. These are engineering display checks, not scientific accuracy, maximum positional-error, land-boundary, parcel or population-allocation guarantees. Overview shapes may visibly differ near a tract edge; values and exact membership always come from the original tract source. Reproject to WGS84 and use a 1e-6-degree precision grid; per-feature validity/nonempty and no-new-error-participant checks pass afterward.

`data/display-overview.json` (~6.37 MB on disk) is a separate committed generated artifact; original lookup/display bytes are untouched. Source/display/lookup/artifact hashes, preserved IDs, algorithm/runtime, area/coverage results and limitations are in `data/contracts/map-overview.json`, with generated `src/contracts/map-overview-proof.ts`. `scripts/write_derived_manifest.py` now records the new artifact/report in addition to existing derivatives. Regeneration is sequential and must be followed by backend restart because geometry caches are intentional. Source PDF/raw bytes unchanged.

### Measurements and rendered checks

`data/benchmarks/map-overview-v1.json` records bounded local **development** HTTP measurements with source hashes and identity encoding: full statewide PM **15,702,991 bytes**, overview **5,917,703 bytes** (about **62% fewer response bytes**), both 9,106 features. Offline gzip estimates are 4,083,042 vs 1,209,495 bytes; these are not observed wire compression. One five-sample warm run gave ~50.5 ms standard / ~24.5 ms overview median, but concurrency/process-cold start/device/network were uncontrolled: no production latency, browser frame/memory or universal speedup claim. Future tiles/indexing remain possible; this increment reduces one measured payload without rebuilding the rendering stack.

46 Node tests passed, including unchanged source/spatial/comparison contracts plus all-ID/hash/bounds/ring checks and all 23 fields/nulls/legends over the complete overview. Four cache tests, TypeScript and production build passed. `scripts/smoke_map_overview.py` checks full statewide IDs, all 23 fields in a bounded viewport, default equivalence and error/version handling on both origins. Existing scalar/facility/overview smoke checks run after restoring main.

An isolated MapLibre harness (`scripts/verify_map_overview_render.mjs`) renders actual main API payloads side-by-side without loading/editing the frontend application. Python Playwright bindings were unavailable, so it uses the already-installed Node Playwright/Chrome driver; no dependency install. Initial harness fixes addressed MapLibre 6 ESM loading and HTML charset. With default client GeoJSON tolerance, not every tiny tract appeared in rendered-feature queries; the controlled harness sets tolerance=0 and verifies **9,106 rendered IDs on each 716×800 canvas**, no uncaught page errors. Reviewed the final `artifacts/map-overview/statewide.png` directly: geography and broad PM pattern present on both panels, no blank canvas. `render-check.json` records the results. This is a technical display check, not frontend integration, basemap/device performance or accessibility certification. Frontend default-tolerance behavior and dense neighborhood transitions still need its own measured adoption check.

### Continuation

Frontend HEAD is now local commit **14a7215**, Common ground reset; its worktree was clean at this pass's initial inspection. No merge or integration performed; still coordinate a paused checkpoint with the user. Optional consumption: choose overview at broad scales, standard for detail; preserve generic value/percentile semantics and source IDs. Next independent backend work can add grounded guided story summaries and any remaining agreed demographic-group contract; performance work should now be driven by measured frontend/device results before selecting tiles/extra dependencies. Power activation gates, conditional fire/remediation and full original scope remain retained; sponsors stay parked.

## 2026-11-07 — deterministic guided comparison stories

### Optional APIs

`GET /api/stories` returns `contractVersion=atlas-stories-v1`, datasetVersion, curated ordering/rounding policy and five topic entries. Four ready topics cover all **23 verified fields exactly once**: environment (six), health (four), community (three), population (ten). Steps include stable IDs, indicator titles, source definition links, visualization metadata and `{mode,indicatorId}` navigation targets. Population steps remain individual neutral fields; this does not establish a new grouped composition/denominator contract.

`POST /api/compare/stories` takes the same stable `locations:[{id,tractId}]`, optional referenceId/version as overview, plus optional `topics:["environment","health","community","population","nearby-essentials"]`. Default is the four ready topics. Example: `{ "locations":[{"id":"oakland","tractId":"06001403402"},{"id":"fresno","tractId":"06019000602"}], "referenceId":"oakland", "topics":["environment","health"] }`. Topic subsets use curated order, regardless of request order; unknown/duplicate/empty/oversized topic lists return 400 invalid-story-topics. An arbitrary indicators list is rejected (400 invalid-story-request); use overview for that purpose. Existing overview/batch/tract/version validation and 1–20-location batch limit apply; no product collection cap or silent truncation. JSON Content-Type required (415); malformed JSON 400; >32 KiB 413 story-request-too-large; uncovered tract 404; wrong version 409. Responses are no-store; existing endpoints unchanged.

Story response includes referenceId, comparisonDirection=location-minus-reference, ordering/rounding, exact canonical `evidence` overview and topics/steps. Each step references its evidenceRowId and includes a deterministic range/same-tract/missing/incompatible summary; per-location source-value/percentile/reference-difference statements; source period; missing/distinct-tract counts; source definition/CSV/evidence URLs, CSV SHA-256 and raw/percentile fields; and indicator limitations. Evidence metadata is retained once per row with exact numeric values, definitions, period/unit, source legend and comparison results. The story templates do not accept client-supplied observations as truth; only server-local canonical tract records are used.

### Interpretation and unavailable narrative scope

Narrative values use **four significant digits**, explicitly labeled as rounded; exact evidence remains alongside. Tiny nonzero differences retain nonzero formatting. Differences are computed from exact values by the existing comparison helper before formatting. Percentage-valued differences use **percentage points**; source percentages and percentiles remain distinct. No inferred similarity threshold, significance, cross-indicator importance score, neighborhood winner, causal explanation or personal disease probability. Different measurement periods remain attached to each step. Weighted toxic/cleanup measures retain their source-score units, not concentrations/counts. Health topic and source limitations describe population context. Demographic steps have no hazard direction or source percentile and do not aggregate or renormalize shares.

Same-tract location IDs remain separate and receive explicit shared-evidence notes; this does not imply identical properties or facility distances. Missing reference/other observations suppress raw differences, while independent available ranges remain qualified by counts. All-missing rows produce missing prose, never zero. Incompatible evidence suppresses range/comparison prose. Topic order is curated, not a claim of largest overall differences.

**Nearby essentials** is explicitly `availability=use-coordinate-facility-api`, with no fabricated steps/distances, links to `/api/facilities/catalog` and `/api/facilities`, and a concrete activation trigger: a confirmed-coordinate-to-tract narrative contract preserving source inventory/status/date and straight-line qualifications. These tract-only requests never substitute centroids. Requesting only nearby-essentials returns that gate with an empty evidence.rows array (locations/tract coverage are still validated). Existing live school/healthcare endpoints and frontend facilities remain available; this gate applies to the new narrative API, not to facility data availability. Power's existing source gates remain unchanged.

### Actual verification and continuation

52 backend Node tests passed (46 prior plus six story checks): every catalog field/topic/navigation target, exact overview/provenance trace, reference sign reversal, same-tract identities, percentages vs percentage-point differences, neutral population percentiles, actual suppression/zero/all-missing cases, explicitly incompatible fixtures, tiny-number formatting and invalid request/source/version cases. After a grammar-only template refinement, the six focused story tests passed again. Four Python cache tests, TypeScript and production build passed. `scripts/smoke_stories.py` checks real 23-step output/catalog/source linkage/facility gate and HTTP errors through both origins; real response saved in data/samples/stories-v1.json. Final post-restart story/scalar/map/facility/overview smokes are run after restoring main. No frontend edits/merge, new dependencies, source downloads, sponsor integration, rendered story UI/accessibility or controlled device-performance claim.

Frontend remains clean at 14a7215 at this pass's inspection. Guided-story consumption is optional and needs frontend-owned rendering/adoption; user-coordinated integration remains required. Next independent backend work: verify/propose the remaining demographic grouping/denominator contract from the source dictionary, or implement the explicitly confirmed-coordinate facility narrative contract; avoid inventing either. Core power activation still awaits new reporting-period/retirement-code evidence. Original optional/conditional scope retained; sponsors parked. Overview geometry/device adoption remains a separate integration follow-up.

## 2026-11-07 — source-backed grouped demographic profiles

### Optional APIs and category contract

`GET /api/demographics` returns `contractVersion=atlas-demographics-v1`, CES datasetVersion, measurementPeriod/unit/geography, denominator concept/source field, neutral visualization/domain, rounding/missing/normalization policy, source CSV/dictionary URLs and SHA-256, and two groups: **age** (`pop_und10`, `pop_10_64`, `pop_ov64`) and **race-ethnicity** (`hisp`, `white`, `black`, `amind`, `asian`, `pacisl`, `othmult`). Category IDs equal existing indicator IDs; each keeps its label, original dictionary sourceLabel, existing definition, CSV rawField and publisher GIS field mapping. This is a backend source contract, not a claim that the user has approved frontend chart adoption.

`GET /api/tracts/{11-digit-id}/demographics` returns the same metadata plus tract/place/county, `denominator.populationEstimate` (the source ACS2024Pop estimate, or null), and groups with the published category values/status/flags. Optional `groups=age,race-ethnicity` selects one or both in requested order; default both. Explicit unknown/empty groups are 400 invalid-demographic-groups. Existing version pinning (409), tract validation (400), uncovered tract (404), local failure (503) and no-store semantics apply. Existing scalar, normalized tract, map, comparison and story routes are unchanged. No source download, new dependency, root/shared-type/configuration or frontend change.

Each category has `value` (the unmodified source percentage or null), status, percentile=null and qualityFlags. Groups include complete, status=available/partial/missing, missingCategoryIds, availableShareSumPercent, reportedSumPercent (null unless complete), residualTo100PercentagePoints (null unless complete), isWithinRoundingAllowance (null unless complete), roundingAllowancePercentagePoints and qualityFlags. All-missing groups have null sums/residual/allowance-status, not zero. Partial available shares may have a diagnostic sum, but never become a new denominator or a completed composition. Valid zero remains available. Out-of-range/unsupported-precision shares and invalid population estimates produce 503 rather than silent coercion.

Recommended display is **independent neutral bars on 0–100**, not a rescaled pie/stack. Reported totals need not equal exactly 100. Residuals are arithmetic diagnostics, **never an invented Other category or missing share**. The genuine publisher Other/Multiple field is preserved, not split or independently reclassified. No demographic hazard score/percentile, derived category count, causal link, confidence interval or current-occupancy inference. The denominator is the publisher's tract population estimate for 2020–2024 ACS; multiplying rounded shares by that estimate does not produce source category counts and is not performed.

### Verified source evidence and measured values

`scripts/verify_demographics.py` verifies original dictionary/CSV/layer SHA-256, complete relevant PDF text (pages 4–6), publisher layer field aliases and all ten shares across 9,106 tracts. Every canonical share/population value is independently matched to the original CSV row, preserving source NAs/zeros. Pages 4/5 were also rendered and visually inspected with source table definitions intact; initial sips transparency rendering was replaced by readable Quick Look renders in /tmp. Original PDF is unchanged. Dictionary defines the age bands, Hispanic/Latino and source non-Hispanic/Other-Multiple profile fields as tract population percentages from the 2024 five-year ACS estimates. Page 6 explicitly names the 2020–2024 ACS window and 25 zero-population tracts. Publisher GIS `Population` aliases ACS2024Pop; Hispanic, Native_American, Pacific_Islander and Other_Multiple map to the CSV's shorter field names. No unmatched field-name assumption remains.

Both groups have **9,081 complete / 25 all-missing** profiles; actual source contains no partial profile (partial support tested with explicit fixtures). Age has **139 observed zero shares**, totals **99.99–100.01**, and **2,219** complete totals differ from exactly 100. Race/ethnicity has **14,438 observed zero shares**, totals **99.98–100.02**, and **3,844** complete totals differ from exactly 100. All missing profiles correspond to source ACS population estimate zero; this does not claim zero current residents. All shares are within 0–100 and published with at most two decimal places.

The complete-sum rounding allowance is categoryCount×0.005 percentage points: 0.015 for age, 0.035 for the seven-field profile. This is only the maximum arithmetic discrepancy from rounding each share to two decimals, not proof of the cause of a discrepancy or an estimate's margin of error. Sums/residuals are calculated at source two-decimal precision. Current complete profiles are within this allowance; anomalous future/fixture sums remain unmodified and flagged, not normalized.

Machine evidence: `data/contracts/demographic-evidence.json`, generated `src/contracts/demographic-proof.ts`. Reproduce verifier from cached originals and format generated TS using installed Prettier. Real present/missing API examples are in `data/samples/demographics-v1.json`, reproduced by scripts/smoke_demographics.py. No new scientific population estimation or race/ethnicity taxonomy is introduced.

### Checks and continuation

57 Node tests passed: original 52 plus dictionary/field mapping/hashes, all 9,106 grouped source values/zeros/nulls/population estimates and exact aggregate diagnostics, real >100 total preserved, explicit partial/anomalous fixtures, input/error/precision handling and neutral categories. Four Python cache tests, TypeScript and production build passed. Both-port demographic smoke checks cover present and real zero-population/missing profiles, group selection, source/version/error semantics; final post-restart checks include existing scalar/maps/facility/overview/story APIs. No new rendered demographic UI, frontend integration, accessibility or device-performance claim.

Frontend remains based on 14a7215; it was clean initially, then resumed active owned UI/design/progress/test edits during this pass. Those changes were inspected only for status and preserved. This supplies a concrete source-backed grouping/denominator contract for review/adoption; no user/frontend agreement or merge is inferred. Next independent backend task: confirmed-coordinate facility narrative contract (preserve original location coordinates and tract cross-checks, no centroid substitution); then user-coordinated integration/adoption checks for optional backend APIs and display overview. Power remains unavailable pending its previously recorded source evidence; conditional fire/remediation and original optional scope retained. Sponsors remain parked.

## 2026-11-07 — confirmed-coordinate facility comparisons and narratives

### Optional endpoint and validation

`POST /api/compare/facilities` returns `contractVersion=atlas-nearby-comparison-v1`. Request: `{locations:[{id:"oakland",tractId:"06001403402",coordinate:[-122.26360620685,37.801240729976],confirmed:true}],referenceId:"oakland",categories:["schools","healthcare"],limit:3}`. Stable ID/reference/CES-version and 1–20-location batch validation reuse the overview contract. Original WGS84 longitude/latitude coordinates are required and retained; `confirmed=true` is a **caller attestation**, not independent evidence that a person clicked confirmation. The backend does not re-query Census or improve input geocoding precision.

Before any facility query, each point must have **one unique unsimplified CES tract match equal to the claimed tract**. Missing confirmation is 422 location-confirmation-required; malformed coordinates 400 invalid-nearby-request; outside CES coverage 422 coordinate-not-covered; multiple full-geometry matches 409 ambiguous-tract-membership; claim mismatch 409 coordinate-tract-mismatch. No centroid substitution, arbitrary shared-edge assignment or comparison generated for invalid points. A valid match describes CES membership, not exact address/property accuracy.

categories defaults to schools/healthcare; explicit unique schools/healthcare/power selectors supported, unknown/empty/null categories are 400. limit is integer 1–10 per location/category, default three (explicit batch/response bound, not product collection cap). Optional `facilityVersions:{schools:"...",healthcare:"..."}` pins independently versioned requested ready categories; source mismatch is a whole-request 409 unsupported-facility-version, not a partial numerical comparison. Power is source-unready and cannot be pinned as a ready source. CES version pin is separate. This endpoint always searches the whole covered category inventory; bbox/topics/arbitrary indicators selectors are rejected rather than silently restricting the meaning of nearest. JSON required (415), invalid JSON 400, body >32 KiB 413 nearby-request-too-large. Responses no-store; originals/source routes unchanged.

### Evidence, distance comparison and failure semantics

Envelope includes cesDatasetVersion, stable locations/reference, comparisonDirection=location-minus-reference, verification details and interpretation limits. Each ready category includes one shared source metadata/rights/coverage/period/version/linked-provenance block and per-location results. Results preserve the existing facility query's names, IDs, source attributes, subtype/status/date/flags, original coordinates, numeric straight-line distances, counts/limit/truncation; nearestDistanceKm/nearestFacilityId; comparisonToReference; and deterministic source-qualified narrative. Full evidence remains in /api/facilities/catalog, matched by category/version. No request addresses/coordinates are persisted; only pre-existing public cached verification points are saved in the reproducible sample.

All locations within a category use the **same bundle, covered inventory, status policy and spherical distance method**. `nearestDistanceDifferenceKm` is this location's nearest-covered-point distance minus the reference's nearest-covered-point distance; the nearest facilities may differ. sameNearestFacility is explicit. sameTract does not reuse tract-level distances; sameCoordinate yields equal distances without merging IDs. All source statuses remain, including Closed schools; narrative reports the raw source status and period. A category with no coordinate-bearing records yields null nearest/difference values, never zero/infinity. No cross-category ranking, overall winner, household supply, capacity, travel-time, service/eligibility or access inference. Healthcare includes non-walk-in types; school status is historical. Small differences may reflect input geocoding/published-point placement; no significance threshold or uncertainty interval inferred. Narrative rounds to four significant digits while numeric evidence remains exact.

Source-category failures are isolated as `availability=failed`, error code local-facility-data-unavailable and empty results; other categories continue. Power is `availability=unavailable` with existing source-readiness blockers and empty results. A successful HTTP 200 can therefore contain failed/unavailable categories; consumers must inspect availability (even if all categories fail). Explicit source-version mismatches still return whole-request 409. No invented placeholder values or silent source substitution.

The existing tract-only nearby-essentials story entry retains its availability behavior but now links `facilityNarrativeUrl=/api/compare/facilities` and describes the required separate confirmed-coordinate request. No breaking change or automatic frontend adoption. Existing facility GET queries remain available independently.

### Actual checks and continuation

64 backend tests passed: previous 57 plus full-lookup public Oakland/Fresno comparisons matching direct facility queries, same-tract distinct-coordinate distances, identical coordinates, reference reversal, invalid/unconfirmed/outside/mismatched/ambiguous withholding, an actual shared source vertex, independent source failure, unavailable power, source/CES version pins, empty-source and Closed-status fixtures, selectors and limits. Four Python cache tests, TypeScript and production build passed. `scripts/smoke_nearby.py` verifies real original-coordinate results and errors on both origins; `data/samples/nearby-v1.json` reproduces three cached public civic-point cases, including two distinct coordinates in the same Oakland tract. Final existing story/demographic/overview/facility/map/scalar smokes run after main restoration. No new data source, dependency/config/shared-type change, source download, frontend edit/merge, rendered narrative UI/accessibility or device-performance claim.

Frontend remains active at base 14a7215 with owned UI/design/progress/test edits, preserved. Next independent work is a backend readiness/source-gate audit and a concrete integration/adoption handoff; coordinate a paused checkpoint through the user before touching/merging frontend changes. Review optional API adoption and source/null/confirmation semantics together, then combined rendered checks at that checkpoint. Power still awaits source definitions/reporting vintage; fire/remediation remain conditional. Full original inventory retained and sponsors parked until core atlas integration/review nears MVP readiness.

## 2026-11-07 — backend readiness audit and integration handoff

Read [READINESS_AUDIT.md](READINESS_AUDIT.md) for the current outcome, supported-data matrix, concrete frontend owner findings and coordinated integration sequence. The verified subset is ready for integration review; full original scope is not complete. Power remains unavailable pending reporting-period/retirement-code evidence or a verified alternative. No repeated power-source search, sponsor work or frontend integration was performed.

Fresh audit checks passed: 64 Node tests, four Python cache tests, TypeScript, all seven backend HTTP smoke suites through both :3000 and :3001, 179 artifact hash/size checks and original handoff PDF equality. One live public Oakland Census query returned the expected tract; no human confirmation or raw response persistence. `scripts/audit_readiness.py` reproduces read-only integrity/ownership/catalog availability checks and optionally the one-shot public geocode. Its Python compile and a separate no-provider rerun passed. Dated evidence is `data/audits/readiness-2026-11-07.json`; known failed security responses are identified, not accepted as scientific evidence.

Read-only frontend inspection found comparison helpers relying only on comparison keys rather than the backend's additional definition/provenance checks, loss of facility dataset versions, and a reproduced tiny-gap formatter case (`0.004` → `0` for PM) that can conflict with “higher” prose. Optional overview/story/demographic/nearby contracts and compact payload options were not consumed in the inspected frontend. Current immutable snapshots are consistent; no incorrect current civic-example values are claimed. Findings are bounded by saved source hashes because the frontend is actively changing. No frontend-owned file was edited. The ownership/configuration checks found no conflicting owned paths or inspected shared runtime configuration differences.

Corrected stale status/source/product documents that still described ready contracts as blocked or claimed no deferrals. Recorded the original paired-map plan versus user-directed map-first/multi-location presentation for checkpoint reconciliation. No API/application/dependency/configuration change: prior production build evidence remains application commit `4f8306b`; no new build, rendered UI/accessibility/responsiveness or controlled device-performance claim. Both servers remain running and frontend work is preserved. Next: user-coordinated paused frontend checkpoint, owner fixes and full stable diff review before explicitly coordinated local integration and combined checks. Sponsors remain parked and all work remains local.

## 2026-11-07 — additive Overture building pilot

Added `/api/buildings?bbox=...&version=2026-10-21.0`, bounded local spatial-index queries for Rancho Cucamonga and Oakland. Full interface, source/null semantics, errors, coverage limits, acquisition/serving deferrals and frontend adoption steps: [BUILDINGS_HANDOFF.md](BUILDINGS_HANDOFF.md). No existing interfaces changed. Active frontend untouched. Python acquisition dependencies added; no npm dependencies/config changed. Checks: 66 backend tests and TypeScript passed; isolated desktop rendering reviewed. :3001 unavailable during proxy check. User removes mobile integration from subsequent work.

## 2026-11-07 — statewide Overture building tiles (supersedes pilot rendering restriction)

User requests statewide coverage. Added `/api/buildings/catalog?version=2026-10-21.0` and `/api/buildings/tiles/14/{x}/{y}?version=2026-10-21.0`, serving official version-pinned MVT statewide through verified cached byte ranges, preferring the complete local California PMTiles extract when present. The pilot bbox route remains unchanged for exact-source inspections. See [BUILDINGS_STATEWIDE.md](BUILDINGS_STATEWIDE.md) for source-layer fields, parts, null/height semantics, tile bounds, errors, limits, cache modes and frontend adoption. No active frontend edits/merge. Runtime root dependency `pmtiles`; dev decoders `@mapbox/vector-tile`/`pbf`; updated lockfile. Frontend uses existing MapLibre, no new frontend library required.

Verified actual API tiles at Rancho, Oakland, San Diego, Fresno, Sacramento, Eureka, Tahoe and a rural empty tile; 6,876 source-record height/floor comparisons agree, 295 building parts retain parent IDs, replayed response bytes agree. Isolated desktop rendering inspected for Rancho/Oakland and Eureka/San Diego, no page/map errors. 68 backend tests and TypeScript pass. Full offline extraction continues independently (~1.4 GB); statewide online serving is already functional. Catalog reports the actual serving mode rather than assuming the offline download completed. Finalization verifies structure/checksum and promotes atomically; see artifact log and data/contracts/buildings-statewide.json when finished. No mobile work.

Final verification: 69/69 tests including network-disabled cache replay and cold-cache failure, plus TypeScript and production build passed. Main :3000 restarted. See source metadata snapshot `data/contracts/buildings-statewide-source.json` and current serving mode from the catalog. Statewide online service is ready for frontend adoption; optional complete offline acquisition is still progressing separately.
