<!-- Hallmark planning critique: Philosophy 4; Hierarchy 4; Execution 3; Specificity 4; Restraint 4; Variety 4. Planning judgment only; no UI validation performed. -->
# Experience direction

Status: reconciled to the selected integrated desktop ClearSky experience. See INTEGRATION.md for fresh checks and limitations. Historical narrow-screen evidence is not current mobile acceptance; mobile remains user-deferred.

## Composition

The continuous map is the main canvas. A compact masthead holds identity, address search and the menu; a place ribbon retains confirmed locations and reference/reorder/replace/remove controls. Four domains remain available without a landing-page detour.

Desktop evidence starts collapsed so the map stays prominent. Opening it reveals a compact left-hand measure index or focused readings. Multiple places share one map by default. “Compare geography” opens two selected locations with linked zoom, bearing and pitch while preserving their distinct centers; closing restores the original map.

ClearSky uses dark cartography, local DM Sans/DM Serif fonts, quiet map controls and compact evidence. Place colors identify locations independently of ordered measure ramps. Demographic percentages have no hazard interpretation. A patterned missing-data treatment distinguishes unavailable observations from zero. See design.md and src/styles for the implemented tokens; this document does not prescribe a new redesign.

Mobile/bottom-sheet work remains deferred by user direction. Do not infer current responsive acceptance from retained historical CSS or tests.

## Information hierarchy

Question → map pattern → paired values → interpretation → evidence detail.

Show raw value with unit first; label percentile separately. Include measurement period adjacent to values. Source release date belongs in evidence details and must not replace measurement period. Display comparison differences only when definitions, versions, periods, and units support them.

Story headlines should answer the selected question using verified values, not imply a total ranking. If comparability is unknown, show both values with an explanation and suppress the numerical difference.

## Map behavior

Both maps share metric and scale. Linked geography synchronizes zoom, bearing, and pitch around each place's own center; it must not force different addresses to identical coordinates. Independent panning remains possible. Prevent feedback loops between map events.

At analytical zooms favor readable flat shading; pitch can introduce a location and then settle. City uses release-pinned Overture buildings/parts at supported close zooms. Flat and analytical Landscape preserve tract interpretation; exaggerated tract heights are explicitly separate from physical building heights. Overture remains resident during supported navigation; genuine source failure or out-of-envelope views expose the qualified OSM fallback. Normal below-14/loading views have no preliminary OSM cohort. The native reveal fades layer activation/recovery, not every arriving tile. Display geometry simplification must not determine address membership.

Changing a mode preserves addresses, selected tracts, and comparison state. Rapid changes cancel stale requests. Loading never temporarily labels old data as the newly selected metric.

## Motion and accessibility

Use purposeful fly-to, layer transition, and panel transition as the main motion families. Honor reduced motion; keep keyboard focus immediate and stable. Offer a readable data alternative to map-only interactions. Do not rely on color alone.

The integration verifies desktop keyboard/focus, reduced motion and controlled failure/race paths. Comprehensive screen-reader/accessibility certification and mobile acceptance remain open. Continue testing long names, missing metrics, partial facility failures and network outages when these mechanisms change.

## Demonstration narrative

Select two real locations after validation; introduce the comparison, explore one environmental story, reveal related health and community context without causal claims, and inspect essential infrastructure. End by opening the source and definition for a displayed result. The visual reveal and evidence explanation should both be memorable.
