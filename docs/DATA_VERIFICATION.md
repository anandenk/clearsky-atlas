# Source contracts — 2026-11-07

The backend now supports verified contracts for all 13 intended scalar indicators and ten demographic fields, plus qualified CDE school and statewide CDPH healthcare inventories. Power is staged but unavailable pending source evidence. Backend contract verification does not establish full scientific uncertainty, current real-world completeness or rendered frontend readiness. No data is fabricated or replaced; the full target in PRODUCT.md remains intact. See [READINESS_AUDIT.md](READINESS_AUDIT.md) for current evidence and integration gates.

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

See [FACILITY_SOURCES.md](FACILITY_SOURCES.md), the original cached bytes and category manifests. The supplied LA-only healthcare feed is historical investigation evidence; it is **not** the live statewide inventory.

- **Schools ready:** 9,946 unique CDE 2025–26 source records, all with CES-covered coordinates (9,944 Active / two Closed). Geographic county coverage spans 58 counties. State catalog rights say no restrictions on public use, with no named license specified. These are historical source statuses; source completeness does not prove every real-world school is present.
- **Healthcare ready:** 14,921 unique first-party statewide CDPH records dated 2026-10-16; 14,919 query coordinates covered by CES. Two out-of-coverage Nevada/Oregon points remain in the preserved source with null query coordinates. CSV/XLSX downloads returned 403; complete selected-field DataStore JSON and dictionaries/lookup tables were cached instead. Some subtypes are home health, hospice or laboratories, not walk-in destinations. The source CRS-label inconsistency and coordinate checks remain documented; no access guarantee.
- **Power unavailable:** complete 2,378-record source candidate is staged (2,334 CES-covered / 44 excluded). May 2022 prose and June 2026 edits do not establish a reporting period; LastReportedYear is absent. Retired_Plant numeric 0/1 meanings remain unverified. Item-linked CEC conditions and catalog CC label differ; both are preserved. Index/statistical source pages reset connections. Revisit only with new date/code evidence, changed source access or a verified alternative; do not repeat the exhausted search by default. See `data/contracts/power-readiness.json`.
- **Conditional categories:** no suitable fire or remediation-point feed is verified. A CES tract cleanup score is not a facility inventory.

Distances use original coordinates and spherical straight lines, qualified by the named source inventory, bounds and snapshot. Status does not establish present operation, capacity, eligibility or travel access. School and healthcare source versions are independent of CES and each other; consumers must preserve category versions.

## Concrete continuation gates

- All intended scalar/demographic contracts are now active in catalog v1.2; final publisher definitions/units/periods and dictionary mappings are cached. Detailed score-weight reconstruction and statistical uncertainty remain limitations, not invented values.
- Grouped demographics and deterministic story/narrative APIs are implemented. Frontend adoption needs source/period/null/version semantics reviewed at a coordinated checkpoint; shares must not be renormalized or turned into derived category counts.
- Power activation requires the specific reporting-period/retirement-code evidence above or a verified alternative source. Its full-target requirement is retained.
- Opt-in overview geometry delivers statewide PM in 5.92 MB versus 15.70 MB standard detail, with all 9,106 IDs/source values retained. Source topology exceptions, area guard and isolated MapLibre results are in the map-overview proof and BACKEND_CHANGES.md. Exact lookup remains unsimplified. Intended-device latency/memory/transition profiling and active frontend adoption remain pending; choose tiles/index only from measured need.
- Reconcile the original paired-map presentation plan with the active user-directed map-first/multi-location UI at integration. Freeze and review the frontend owned diff, address comparison safeguards and numerical formatting, then run combined rendered/semantic checks. See READINESS_AUDIT.md.
- Conditional fire/remediation and optional terrain/buildings, sharing, AI/voice remain in scope as recorded in PRODUCT.md. Sponsors remain parked until the core atlas is integrated and reviewable. No publication/deployment is authorized.
