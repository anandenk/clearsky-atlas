# Source contracts — 2026-11-07

Phase 1 completed a bounded source inspection; it did **not** establish every original indicator's full measurement contract. Unsupported contracts stay unavailable. No data is fabricated or replaced. The backend now supports verified PM2.5 and ozone contracts; frontend activation is separate. The full target in PRODUCT.md remains intact.

## CES 5.0 — verified inputs

Official [catalog](https://publish.data.ca.gov/dataset/calenviroscreen-5-0), [release page](https://oehha.ca.gov/calenviroscreen/report/calenviroscreen-50), and PDF-linked ArcGIS layer identify final CES 5.0 released July 1, 2026. Catalog resource updates are October 2026; those are not indicator measurement periods. Anonymous catalog, CSV, shapefile ZIP, dictionary PDF and layer metadata downloads succeeded. Original bytes, URLs, timestamps and SHA-256: `data/raw/manifest.json`. No account, key, or paid service was needed.

Catalog rights: **No restrictions on public use**. License field: **License not specified**. Preserve attribution to OEHHA/CalEPA; do not invent a named license. Local analysis only; no publication performed.

Measured: CSV has 9,106 unique tract IDs, joined 1:1 to 9,106 shapefile features. The dictionary explicitly identifies **2020 Census geography**. Numeric IDs are padded to 11-character strings. Source CRS is EPSG:3310 / NAD83 California Teale Albers; output WGS84 is EPSG:4326 with longitude first. All source geometries valid under Shapely. Lookup geometry is unsimplified. Display geometry is simplified by 30 meters in source CRS before reprojection. `data/validation.json` records field-level null counts. NA/empty values become null; zero is retained. Raw source is preserved.

### Current intended indicator coverage

All 13 intended scalar indicators and 10 demographic fields now have verified backend contracts. The current units, dates, field mapping and important distinctions are tabulated in the latest section of [BACKEND_CHANGES.md](BACKEND_CHANGES.md). Machine evidence is `data/contracts/indicator-evidence.json`; source null counts remain in `data/validation.json`. Backend-ready does not mean rendered frontend layers are complete.

The official final-app descriptions and expression templates corroborate scalar units/periods. Source originals, item metadata, URLs, timestamps and SHA-256 are cached. All 26 scalar raw/percentile fields match the final publisher layer at both demo points within 1e-8. Demographic definitions, percentages and 2020–2024 ACS period are in the downloaded dictionary. Nulls remain null; observed zeros remain zero.

Environmental source distinctions: PM2.5 µg/m³ and ozone ppm use 2022–2024; diesel is tons/year with 2021/2022 source vintages; traffic is vehicles/hour from a normalized road-volume measure for 2023; toxic releases are a toxicity-weighted score averaged 2021–2023; cleanup is a weighted site score using a March 2026 source snapshot. Neither source score is presented as a physical concentration or facility count.

Health is tract population context: age-adjusted asthma ED rate 2022–2023, age-adjusted heart-attack ED rate 2021–2023, adult modeled diabetes prevalence 2023, low-birth-weight share 2018–2024. Housing uses 2018–2022 HUD CHAS; poverty/education/demographics use 2020–2024 ACS. No single common measurement period is substituted for these differences.

The full technical-report and some direct fact-page downloads remain blocked by HTTP-200 security HTML, explicitly recorded as failed bytes. No draft or old release was substituted. Final publisher apps directly corroborate the required contracts; detailed score-weight reconstruction and statistical uncertainty remain limitations of comparing published outputs. See the source log for evidence provenance.

## Location and maps

US Census geocoder: public anonymous server-side endpoint, Public_AR_Current benchmark, **Census2020_Current** geography vintage. Available vintage was inspected and cached. [Official API documentation](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) describes address-range interpolation; it is not rooftop accuracy. Each live match needs user confirmation. The request is sent by POST to the local server; raw addresses are not persisted in application logs or caches. Census receives the address. Only explicitly chosen public example/verification addresses are cached. The Current benchmark changes; fixture retrieval times are preserved.

Full CES geometry determines membership; the Census2020 GEOID returned alongside the coordinate is an independent cross-check. Any disagreement or multi-tract boundary match is withheld. No guess across tract vintages. Tests separately cover a shared-edge ambiguity and polygon hole. Projection transformation is numerical; sub-meter near-edge uncertainty is not claimed resolved.

Verified examples: 125 14TH, OAKLAND CA 94612 → 06001403402; 2600 FRESNO ST, FRESNO CA 93721 → 06019000602. Both agree between full CES geometry and Census2020 lookup. Live CES ArcGIS point-intersection queries also return the same IDs and PM2.5 raw/percentile values as the downloaded CSV (tolerance 1e-8); responses cached as ces-point-*.json. A nearby Oakland address (129 14TH) shares tract 06001403402, with distinct coordinates. An Oakland query without ZIP unexpectedly matched East 14th: retained as evidence that geocodes need confirmation, not used as demo default. Known unmatched civic-plaza queries are cached as failures, not fabricated points.

MapLibre GL is bundled locally with its BSD license and explicit worker assets. OSM raster tiles load only for viewed map areas under [tile usage policy](https://operations.osmfoundation.org/policies/tiles/), with attribution, browser referrer and browser HTTP caching; no offline tile download or bulk caching. Tiles are best-effort external service; tract attributes and display geometry are local. Basemap failure does not invalidate the evidence values.

## Infrastructure and unsupported categories

See FACILITY_SOURCES.md and the cached original schema/sample responses. **The supplied healthcare feed is Los Angeles only (3,620 records)**; no statewide healthcare claim is supported. Schools have 58 district-county groups in a 2025–26 snapshot, without proof of exhaustive geographic completeness or clear item license text. Power plants include out-of-state counties and nulls; vintage/status decoding still needs resolution. No fire feed was supplied. Remediation markers remain conditional; a tract cleanup index is not a point inventory.

## Concrete continuation gates

- Phase 3 health/community/environment controls: activate each only after unit, period, quality thresholds and source definition are verified. Trigger: missing contract above, not a decision to remove indicators.
- Statewide healthcare: find/verify a first-party statewide feed and reuse terms; supplied LA subset cannot satisfy it.
- Facilities: resolve licenses, full coverage, CRS/status/vintage and pagination before adapters/nearest claims.
- Map display at statewide zoom: current viewport GeoJSON is functional, but 14 MB statewide display and 122 MB server lookup are measured disk sizes, not performance claims. Trigger for tiles/index: measured latency/memory on intended demo hardware; PMTiles remains planned.
- Broad stories, 3D, camera linking, terrain/buildings, remaining layers and optional integrations stay in phases 3–6. They are outside this authorized initial implementation increment, not deleted scope.

## Current backend air milestone

PM2.5 and ozone are backend-ready in catalog atlas-indicators-v1.1. Normalized tract observations, indicator-specific map fields and checked pairwise comparisons are live; details in BACKEND_CHANGES.md. Live official indicator-layer point queries agree with the cached CSV for all four air fields at both demo tracts. Other indicator contracts and facility blockers remain as recorded above. No unsupported source was substituted.

## Current breadth milestone

Catalog v1.2 exposes the full intended scalar/demographic field set through existing normalized and named-map APIs. Demographic maps use neutral raw percentages with no source percentiles. Percent-valued raw differences are labeled percentage points. Infrastructure remains a separate unfinished acquisition/coverage milestone. Sponsor services are parked by user decision until near MVP readiness.
