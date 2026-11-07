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
