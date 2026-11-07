# Source contracts — 2026-11-07

Phase 1 completed a bounded source inspection; it did **not** establish every original indicator's full measurement contract. Unsupported contracts stay unavailable. No data is fabricated or replaced. Phase 2 uses the verified PM2.5 path. The full target in PRODUCT.md remains intact.

## CES 5.0 — verified inputs

Official [catalog](https://publish.data.ca.gov/dataset/calenviroscreen-5-0), [release page](https://oehha.ca.gov/calenviroscreen/report/calenviroscreen-50), and PDF-linked ArcGIS layer identify final CES 5.0 released July 1, 2026. Catalog resource updates are October 2026; those are not indicator measurement periods. Anonymous catalog, CSV, shapefile ZIP, dictionary PDF and layer metadata downloads succeeded. Original bytes, URLs, timestamps and SHA-256: `data/raw/manifest.json`. No account, key, or paid service was needed.

Catalog rights: **No restrictions on public use**. License field: **License not specified**. Preserve attribution to OEHHA/CalEPA; do not invent a named license. Local analysis only; no publication performed.

Measured: CSV has 9,106 unique tract IDs, joined 1:1 to 9,106 shapefile features. The dictionary explicitly identifies **2020 Census geography**. Numeric IDs are padded to 11-character strings. Source CRS is EPSG:3310 / NAD83 California Teale Albers; output WGS84 is EPSG:4326 with longitude first. All source geometries valid under Shapely. Lookup geometry is unsimplified. Display geometry is simplified by 30 meters in source CRS before reprojection. `data/validation.json` records field-level null counts. NA/empty values become null; zero is retained. Raw source is preserved.

### Intended indicator coverage

Field existence and raw/percentile null counts were measured from the CSV. Definitions were read from the downloaded dictionary. **Present is not the same as ready for display.** Unverified units or periods block activation; source release date is never substituted for a measurement period.

| Original target | CSV fields | Definition / contract | State |
| --- | --- | --- | --- |
| PM2.5 | pm / pmP | Annual fine-particle concentration, µg/m³; 2022–2024; monitor/satellite estimates; wildfire-smoke days excluded | Active; 0 raw/percentile nulls |
| Ozone | ozone / ozoneP | Mean May–October daily maximum 8-hour concentration; unit/measurement years not verified here | Present, inactive |
| Diesel particles | diesel / dieselP | Emissions near populated blocks; unit/measurement years unresolved | Present; 9 nulls; inactive |
| Traffic impacts | traffic / trafficP | Vehicle-km/hour per road length within 150 m; period unresolved | Present; 9 nulls; inactive |
| Toxic air releases | RSEIhaz / RSEIhazP | Toxicity-weighted air concentrations; unit/period unresolved | Present; 0 nulls; inactive |
| Cleanup sites | cleanups / cleanupsP | Weighted proximity sum; site snapshot years unresolved | Present; 0 nulls; inactive |
| Asthma emergency visits | asthma / asthmaP | Age-adjusted ED rate; denominator/period require source contract | Present; 33 nulls; inactive |
| Cardiovascular / heart-attack ED visits | cvd / cvdP | Age-adjusted heart-attack ED visits per 10,000; period unresolved | Present; 26 nulls; inactive |
| Diabetes prevalence | diabetes / diabetesP | Model-based adult 18+ prevalence; period/model vintage unresolved | Present; 36 nulls; inactive |
| Low birth weight | lbw / lbwP | Percent infants under 2,500 g; period unresolved | Present; 234 nulls; inactive |
| Poverty | pov / povP | Percent below twice federal poverty level; ACS period needs indicator-level confirmation | Present; 50 nulls; inactive |
| Educational attainment | edu / eduP | Percent aged 25+ with less than high school education; period unresolved | Present; 28 nulls; inactive |
| Housing burden | housingB / housingBP | Percent low-income households severely burdened by housing costs; threshold/period unresolved | Present; 64 nulls; inactive |
| Age breakdown | pop_und10 / pop_10_64 / pop_ov64 | Percent under 10, 10–64, 65+; dictionary: 2020–2024 ACS | Present; 25 nulls per field; Phase 3 charts remain |
| Racial/ethnic breakdown | hisp / white / black / amind / asian / pacisl / othmult | Dictionary categories; 2020–2024 ACS | Present; 25 nulls per field; neutral Phase 3 charts remain |

The official [PM2.5 fact sheet](https://oehha.ca.gov/calenviroscreen/fact-sheet/air-quality-pm25) was successfully inspected with the web reader on 2026-11-07: annual means for 2022–2024, averaged across years, then grid cells averaged by tract; satellite-detected wildfire-smoke days anywhere in the state excluded. Raw direct downloads of the fact pages and technical report instead returned security HTML (HTTP 200). Their cached response bytes are labeled FAILED in the manifest and are **not PDF/document evidence**. The fact sheet's web-reader text is evidence for the active period/method, not a successful original-byte download. Full-report acquisition remains blocked by origin security response; no archived/draft report substituted. Standard concentration unit µg/m³ is used; the downloaded dictionary itself does not print the PM unit, so full-report unit corroboration remains a documentation follow-up.

CES estimates describe tracts, not properties or personal disease probabilities. The map shows source PM2.5 percentiles on one fixed statewide 0–100 domain; numerical evidence shows raw concentration separately. Percentiles are source values, never recalculated in this app. Statistical uncertainty is not provided in this bundle; differences are descriptive and not significance or cause claims.

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
