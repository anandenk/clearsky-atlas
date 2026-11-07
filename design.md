# Common ground — comparison beside the map

## Direction

The map is the continuous canvas. Comparison is a compact, left-aligned instrument for reading the places on it. The prior field guide is preserved in checkpoint `4899c8d`; its half-screen bottom layout and large repeated value rows have been replaced, rather than moved into a narrow container.

The concept explored was a compact matrix versus a measure index with focused readings. The matrix still required horizontal scrolling as places accumulated. The index was chosen: one short row per measure, immediately comparable raw values and a named-place-letter higher/same/incomplete cue. Opening a row replaces the index with an explanatory reading. No giant introductory question, repeated paragraph or permanent source section competes with the map.

## Identity and composition

Retain porcelain #fafbff, ink #232d4c, iris #5759bb, Pacific #c6d9e8, lilac #eeedf7 and coral #b34e3f. Place colors are identifiers, independent of environmental intensity. DM Serif gives the selected reading its title (24–27px); DM Sans carries values (20–27px), names (14px) and secondary context (11–13px). Text remains left aligned; numeric readings align against the right edge.

Desktop:

    identity       address search                        menu
    places collection
    ┌ comparison ┐           continuous map               domains
    │ index      │        selected places remain visible
    │ or reading │
    └────────────┘                             legend / navigation

The pane is at most 420px wide, near 29% of a 1440px viewport. It shrinks to its content for short readings, and is height-bounded on short screens. Six environmental measures fit without scrolling at the verified desktop review size. The map retains full viewport height and a single WebGL drawing surface. Camera padding accounts for the panel's width instead of reserving half the viewport at the bottom. More map withdraws the pane sideways and exposes a compact reopening control.

On narrow screens the map occupies a stable 460px region with both pins and controls, followed by the compact reading. Values remain readable; there is no horizontally scrolling table. Larger collections wrap their place legend and use the same focused readings.

## Information hierarchy

The index names the selected places once, then aligns actual measurements, units and a short higher/same/incomplete cue for each measure. With up to three locations every raw value is visible in each row. Larger collections show source-compatible minimum/maximum observations with stable place identities; the heading explicitly says these are range endpoints and opening a measure reveals every selected location. An incomplete collection is labeled incomplete, never given a fabricated range.

A focused reading gives the magnitude and named endpoints of the descriptive difference, then one row per selected place. Each row combines the raw value, a horizontal position bar, its explicitly labeled statewide percentile (or population percentage), and the difference from the chosen reference. Bars use one fixed 0–100 domain; raw values with different units are never charted on a common scale. Percentage-valued differences use percentage points. Nulls and incompatible source keys suppress differences.

At a glance is the consistent return control; a labeled measure selector avoids a long strip of clipped pills. A definition disclosure expands only when wanted, and the source button opens the existing evidence dialog. Selecting a place focuses its pin without removing any comparisons. Reference, reorder, replacement and removal remain in the place collection menus.

Community age/race groups use the same index and focused percentage readings with no hazard interpretation. Health keeps population-versus-personal-risk language. Infrastructure uses compact source-qualified nearest-distance comparisons and explorable facility details; power remains explicitly synthetic until supported by the backend.

## Motion and cartography

The pane slides from the left over 600ms while the existing camera smoothly reframes the visible geography. It does not resize or recreate the map canvas. Reading bars transition over 650ms; reduced motion removes transitions. Cartography retains zoom-stable ground styling, versioned basemap loading, source-token protection and tile-readiness gating. Overlay changes now keep the previous display throughout loading, then use a single 450ms blend when the replacement is ready. The incoming source is staged invisibly; outgoing buffers are not reused until their blend finishes. Infrastructure handoffs also wait for source readiness; failed tract requests retain the last successful display with an explicit error. The compact loading-status class stays separate from initial module loading.

Each live measure now loads all 9,106 California tracts using the existing standard display geometry, once rather than per viewport. MapLibre keeps that source resident as the camera moves; zoom/pan never re-fetch or replace it. A two-measure in-memory LRU cache makes recent measure revisits network-free, and Retry explicitly clears it. This trades a larger first download per uncached measure for continuous statewide navigation. The overview-only geometry is not used beyond its intended scale, and all measures are not eagerly downloaded. Preview geography remains separate.

No backend-owned files, dependencies or root configuration are changed. Live evidence remains live; synthetic preview is opt-in and persistently labeled. Remaining work and actual visual/behavioral verification belong in FRONTEND_PROGRESS.md.
