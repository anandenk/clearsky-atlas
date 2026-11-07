# Common ground — a field guide to place

The existing Common ground identity stays: a continuous California map, porcelain surfaces, blue Pacific, iris accents, local DM Sans and DM Serif Display, persistent lettered pins and fluid camera/canvas transitions. The new emphasis is reading a comparison without decoding a miniature chart.

## Composition and visual system

Porcelain #fafbff; ink #232d4c; iris #5759bb; Pacific #c6d9e8; lilac #e9e6f6; coral #b34e3f. Place colors identify locations, independent of the domain's geographic scale. DM Serif provides the question; DM Sans carries measurements and explanations. Main values are 32px, measure titles 18px, explanation text 14px, secondary source/position text 11–13px.

The map remains the spatial anchor. On desktop the comparison canvas occupies up to 56% of viewport height (570px maximum). Its overview reads as a field guide: a short introduction and two descriptive position findings, followed by aligned place columns. Each measure gives its period, raw value and unit, secondary statewide position, and the magnitude and named endpoints of its raw difference. The measure opens a focused view with definition, reference differences, sources and limits. The findings distinguish wider and closer percentile positions; neither claims significance or overall importance.

Several places add columns within a horizontally scrollable comparison region. No values overlap, and no selection is discarded. On phones each measure becomes a full-width section, with a two-column grid of named places and an interpretation immediately below. The document flows vertically rather than squeezing a desktop chart into a phone. Missing values remain explicitly unavailable.

A critique pass removed repeated long definitions from the overview because they overwhelmed comparison. Definitions remain one click away. Another replaced the first mobile scrolling-table attempt with these stacked sections. Desktop retains an aligned matrix because comparing the same measure across several places benefits from fixed columns.

## Cartography

The original patchwork had three contributing factors: real tract geometry (including straight rural boundaries), visible outlines on every tract at regional zoom, and an opaque thematic layer above roads and water. Synthetic preview also used separated rectangular cells.

Keep actual tract polygons; do not blur, interpolate, round or invent geographic measurements. Use a lighter 52% thematic wash, remove the regional boundary mesh, bring boundary definition in only at neighborhood zoom, and retain cartographic water/roads above the wash. Antialiasing is disabled on adjacent fills to avoid seam halos. Selected/inspected tract outlines remain explicit. Preview cells touch rather than having artificial gutters; their geometry remains conspicuously synthetic and the persistent preview banner remains.

All comparative maps use identical fixed 0–100 source-percentile domains; demographic maps use population share. Exact lookup remains a backend responsibility, separate from display geometry. External basemap availability is still network-dependent.

## Meaning across domains

Environment and health compare the same source-defined measures, with matching comparison keys required before calculating differences. Percentage measures use percentage-point differences. The health introduction explicitly distinguishes community rates from individual disease probabilities.

Age and race/ethnicity now use the same readable raw-share comparison rather than tiny stacked segments. Every group remains selectable for its map; no demographic hazard percentile is created. Missing groups remain unavailable, and group definitions are accessible from the measure.

Infrastructure retains live healthcare and schools, with source-qualified distance ranges and named nearest locations across the selection. Distances are straight-line distances to listed points; they establish neither service access nor eligibility, travel time or completeness beyond the documented inventory. Power remains in a separately labeled synthetic preview. No silent live-to-preview fallback.

## Motion, evidence and limits

Retain one WebGL map and the interruptible 700ms canvas transition, 1100ms camera flight, and 650ms focused-metric position movement. The enlarged canvas and camera padding share measured layout dimensions. Reduced-motion behavior remains. Overview bars use a fixed statewide 0–100 scale and never encode raw values with incompatible units on a common scale.

Local checkpoint before this pass: tag `checkpoint/frontend-before-comparison-20261107`, commit `14a7215`. Actual checks, screenshots, corrections and remaining work are recorded in docs/FRONTEND_PROGRESS.md. This design is local and awaits visual review; no backend/configuration/dependency changes or integration are included.

## Zoom-stable analytical basemap

All non-water ground fills are transparent in the analytical basemap. Moving them underneath the translucent thematic wash was insufficient: zoom-dependent residential/land-use color could still change its apparent intensity. Buildings now use faint outlines rather than filled footprints. Roads, water and labels remain readable above the fixed-scale thematic color. Actual tract geometry and measurements are unchanged. The versioned style URL is an explicit map-effect dependency so an already-open development map reloads a corrected static style.

## Indicator-switch rendering and motion

Every GeoJSON update carries a unique internal render token. A reused buffer filters to that token, preventing cached geometry from an earlier measure from appearing with the current label or ramp. On a measure/domain change the outgoing fill and outlines fade out over 180ms, with interaction disabled and a changing-layer status. The next update waits for both worker processing and source tile readiness, verifies cancellation, and fades in over 450ms. Rapid switches cancel stale work and stale fade timers. Viewport-only refreshes retain the current display until its replacement is ready, then swap without an opacity pulse. Facility markers use the same fade-out/load/fade-in timing; selecting a marker changes its emphasis without reloading its data. Reduced motion removes these durations.

Map motion and style verification are recorded in FRONTEND_PROGRESS.md. Test-only fixture geometry is used for pixel-level stale-overlay and fade regression checks; it is never substituted for live evidence.

The per-overlay switching status uses a dedicated `.map-update-status` class, intrinsically sized and non-intercepting. It is separate from the full-map placeholder used only while the map module initially loads. Desktop and narrow loading-state dimensions are regression-tested.
