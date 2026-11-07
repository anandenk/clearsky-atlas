# Proposed architecture

Original target architecture, retained as design context. Current implementation uses Next.js/TypeScript, MapLibre, a Python preparation pipeline, server-local full lookup geometry, and viewport-filtered display GeoJSON. See STATUS.md for verified behavior and DATA_VERIFICATION.md for source contracts. Tailwind and PMTiles have not been needed for the initial increment; hosting compatibility and hardware performance remain unverified.

## Shape

Source adapters → reproducible normalization → versioned dataset bundle → lookup/query layer → atlas state → map and evidence views.

Proposed frontend: Next.js, TypeScript, Tailwind, MapLibre GL JS. Geospatial preparation: Python tooling chosen after source inspection. PMTiles/vector tiles are the candidate statewide display format, not a proven necessity. Turf is a candidate for bounded browser operations; do not ship every full-resolution boundary just to resolve an address.

## Module boundaries

- sources: independent CES, healthcare, schools, and power-plant adapters with provenance manifests.
- preparation: stable IDs, field mapping, units, nulls, versioning, geometry validation, display simplification, tile generation.
- locations: provider-neutral geocoder plus authoritative tract lookup; preserve precision/confidence and selected candidate.
- indicators: central metadata registry and tract records.
- facilities: category and viewport queries, marker details, deterministic straight-line distances.
- comparison: paired records, compatibility checks, typed differences, same-tract behavior.
- stories: curated sequences and deterministic evidence summaries.
- atlas: shared application state and one reusable map component instantiated once or twice.
- optional integrations: separate assistant, voice, analytics-platform, and deployment adapters.

These are logical boundaries; avoid creating a service or package for every item. Default to one application and one preparation pipeline.

## Contract outline

IndicatorDefinition: id, mode, label, definition, geographicLevel, rawUnit, percentileMeaning, sourceId, fieldMapping, measurementPeriod, missingRules, visualization, scaleDomain, interpretationDirection, comparisonPolicy.

TractObservation: tractId (string preserving leading zeros), datasetVersion, indicatorId, rawValue or null, percentile or null, measurementPeriod, qualityFlags.

LocationSelection: label, coordinate, geocoderProvider, precision/confidence, confirmedCandidate, tractId or null, matchStatus. Keep exact addresses out of persistent logs by default.

Facility: id, category, name, coordinate, sourceId, status if supplied, observationDate if supplied. Nearest results are “nearest among loaded/covered facilities” until completeness is established.

ComparisonResult: indicatorId, locationA, locationB, comparabilityStatus, rawDifference with unit when valid, percentilePointDifference when valid, limitations. Suppress derived differences for incompatible data.

SourceManifest: original URL, retrieval timestamp, checksum, attribution/license, source CRS, transformed CRS, release/version, measurement period, feature count, transformations, validation state. Unknown values stay unknown.

StoryStep: question, indicatorId, optional supporting layer IDs, deterministic template, required fields, evidence references, unavailable-state text.

## State and rendering

Application state owns A/B location selections, mode, metric, active story step, camera-link setting, evidence drawer, and enabled facility categories. Map instances consume state; they are not competing sources of truth.

Share metric domains across comparison maps. Query and cache by dataset version and tract ID; use cancellation or request IDs to prevent stale responses. A failure in one point source must not break choropleths or the other facility categories.

## Spatial correctness

Resolve tract membership against appropriate lookup geometry, not simplified tiles. Define boundary-point ambiguity behavior. Validate CRS and coordinate order later. Test water/outside coverage, tract edges, same-tract addresses, inaccurate geocodes, and large facilities whose published coordinates may represent a centroid rather than an entrance.

Straight-line distance is not travel time or service accessibility. Retain source boundaries and provenance through transformations. No guessed geographic joins across different tract vintages.

## Performance and resilience

Measure two-map memory and frame behavior before adding detailed 3D. Keep geometry separate from attribute payloads. Cluster/draw viewport-bounded facilities. Cache successful artifacts for repeatable demos. Provide explicit offline/unavailable states for geocoding and optional sponsor APIs.

Budgets will be selected and measured during implementation on the actual demo device. No performance targets are recorded as passed.

## Open dependencies

CES version/status, field completeness and tract vintage; per-indicator years; facility licensing/status/coverage; basemap and geocoding provider terms and credentials; tile serving and range-request support; sponsor account access; exact framework versions. Resolve these during later authorized verification, not by assumption.
