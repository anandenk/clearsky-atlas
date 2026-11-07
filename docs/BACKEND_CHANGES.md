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
