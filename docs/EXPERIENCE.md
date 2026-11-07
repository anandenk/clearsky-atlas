<!-- Hallmark planning critique: Philosophy 4; Hierarchy 4; Execution 3; Specificity 4; Restraint 4; Variety 4. Planning judgment only; no UI validation performed. -->
# Experience direction

Status: proposed design brief, not a locked or rendered design system. Hallmark principles applied to hierarchy, restraint, honest content, and interaction. Visual checks remain future work.

## Composition

The map is the main canvas. Avoid a marketing landing page before the atlas. Place address A and B controls in a compact top bar, the four modes beneath, and the active metric selector close to a persistent shared legend.

Desktop comparison: two balanced map panes, clearly labeled A and B. A compact evidence rail or bottom comparison band holds aligned values, the distribution strip, and story controls. Sources expand in place rather than competing with the map at all times.

Single-location mode uses the full canvas. On narrow screens, use A/B tabs over one map with both evidence columns still available in a readable stacked comparison. Preserve state when changing layouts.

## Visual character

Proposed direction: contemporary cartographic atlas with warm paper surfaces, dark ink typography, quiet rules, ample map area, and restrained editorial headings. Avoid floating-card clutter, decorative gradients, oversized dashboards, and numerical decoration without evidence.

Final fonts, tokens, basemap style, and colors will be selected during design implementation. Use semantic tokens rather than scattered values. A/B identity colors must remain distinguishable from choropleth intensity and facility categories. Use perceptually ordered scales, a visibly separate missing-data treatment, and neutral categorical charts for demographics.

## Information hierarchy

Question → map pattern → paired values → interpretation → evidence detail.

Show raw value with unit first; label percentile separately. Include measurement period adjacent to values. Source release date belongs in evidence details and must not replace measurement period. Display comparison differences only when definitions, versions, periods, and units support them.

Story headlines should answer the selected question using verified values, not imply a total ranking. If comparability is unknown, show both values with an explanation and suppress the numerical difference.

## Map behavior

Both maps share metric and scale. Optional camera linking synchronizes zoom, bearing, and pitch around each place's own center; it must not force different addresses to identical coordinates. Independent panning remains possible. Prevent feedback loops between map events.

At analytical zooms favor readable flat shading; pitch can introduce a location and then settle. Terrain or building extrusions must not obscure tract patterns. Display geometry simplification must not determine address membership.

Changing a mode preserves addresses, selected tracts, and comparison state. Rapid changes cancel stale requests. Loading never temporarily labels old data as the newly selected metric.

## Motion and accessibility

Use purposeful fly-to, layer transition, and panel transition as the main motion families. Honor reduced motion; keep keyboard focus immediate and stable. Offer a readable data alternative to map-only interactions. Do not rely on color alone.

Verify later at 320, 375, 414, 768 pixels and desktop. Test long addresses, long facility names, two unmatched locations, one missing metric, empty facility coverage, network failure, and keyboard-only navigation. No responsive or accessibility result is claimed now.

## Demonstration narrative

Select two real locations after validation; introduce the comparison, explore one environmental story, reveal related health and community context without causal claims, and inspect essential infrastructure. End by opening the source and definition for a displayed result. The visual reveal and evidence explanation should both be memorable.
