# Common ground — creative reset

The map is a continuous field. Places become a collection; the collection unfolds into a comparison canvas. The memorable object is the **shared-scale comparison score**: colored location beads move along aligned tracks as the reader changes the question. The map never disappears behind a long evidence rail.

## Creative critique

The rejected implementation was a toolbar, map grid and scrolling sidebar. This replacement removes the sidebar and repeated map boxes. One persistent map provides spatial continuity, a compact four-domain dock changes the lens, and an expanding bottom canvas gives the evidence room to breathe. Comparison is composed around differences and shared positions, rather than repeated metric cards. No automatic examples or marketing interstitial.

## Identity and tokens

Name: Common ground; descriptor: California environmental atlas. Color: porcelain #fafbff, deep ink #232d4c, iris #5759bb, Pacific #c6d9e8, lilac #e9e6f6, coral #b34e3f. Health uses a restrained plum ramp; community uses a neutral blue ramp; infrastructure uses blue/purple/amber category symbols. Location colors remain independent of map intensity: iris, coral, teal, ochre, plum.

DM Sans carries navigation and data; DM Serif Display carries the current question and selected measurement title. Local font files with licenses. Body 14px, metadata 11–12px, display 32–46px, evidence numbers 26px. Tabular numerals, proportional text. Spacious floating controls have soft depth; the comparison canvas has a continuous surface, not a grid of cards.

## Composition

Desktop: identity at top left, address search centered, context menu top right. Domain dock at right center. An introductory map lens at lower left describes the selected question. On selection, a place ribbon appears and the map contracts continuously above a bottom comparison canvas. The canvas has a compact narrative on the left and aligned location plots on the right. Topic chips sit on one horizontal scrollable strip. A reference location can be changed; a place can be focused, replaced, removed or moved earlier. Any number of places use a vertically scrolling plot. One persistent map avoids mounting extra WebGL contexts.

Narrow screens: compact identity, full-width search, horizontal four-domain dock, map above an in-flow analysis canvas. Location ribbon scrolls horizontally. Values and plots remain legible in a single-column composition. No hidden comparison locations or horizontal page overflow.

## Cartography

Custom OpenFreeMap vector style: blue Pacific, porcelain land, subdued lavender buildings, restrained roads, ink labels above colored tract fills. Domain ramps share fixed 0–100 bounds. Neutral population percentages use raw percentage and never a hazard percentile. Whole-state view has faint tract boundaries; neighborhood zoom reveals definition. Tract geometry is display-only; source API resolves exact membership. Pins retain stable letters and colors. Clicking a tract opens an independent inspection, without changing an address. Provider attribution remains visible.

## Evidence and comparison

Use live catalog and normalized observations for all ready fields. Fetch a full tract bundle once, so switching indicators animates without a new evidence round trip. Show actual values/units alongside statewide percentile positions. Raw differences require identical comparison keys; percentage measures use percentage points. A concise range statement describes the current metric, never ranks unlike metrics or implies significance. The first location is the initial reference. Age and ethnicity are neutral composition charts, with original category labels and nulls preserved. Detail dialog exposes definition, period, source and caveats on demand.

Infrastructure is an explicit separate synthetic preview with category filters, map/list linkage, details and calculated straight-line distances. Switching providers clears incompatible selections and cancels pending requests. No silent fixture fallback.

## Motion choreography

Map viewport height: interruptible 700ms cubic-bezier(.22,1,.36,1). Search confirmation: camera fly and bottom canvas expansion run together. Domain selection: dock highlight, active ink, map ramp and indicator track change together; no map remount. Shared-scale bead positions transition for 650ms, tracks for 500ms. Evidence content has one short entrance tied to context, not separate animated cards. Places retain DOM identity on reorder. Drawers use native dialog focus containment and a short anchored entrance. Reduced motion removes transitions and map flight while preserving the same final states.

## Scope and verification

Implemented details, measured checks, visual corrections and integration limits are recorded in docs/FRONTEND_PROGRESS.md after rendered review. No additional dependencies or root configuration changes are planned.

## Correction pass and live breadth

Comparison now opens with an At a glance profile, one line per scalar measure. The widest/closest percentile spreads navigate to detail without claiming importance or significance. A focused metric uses the larger location score and raw reference differences. The profile heading and legend were simplified after screenshot review, and evidence labels enlarged.

The responsive breakpoint is 759px. Desktop canvas height is 390px, 430px on tall screens; More map leaves a 49px reopen handle. On narrow screens the selected-place map is 500px and evidence flows below it; the initial lens folds its layer controls. One map instance persists through domain, measure and collection changes. Narrow/desktop switches reframe the same map.

Healthcare and schools became live during this pass and now use independent source-qualified facility queries. A small per-place distance table supports infrastructure comparison; the focused place shows up to six nearest records from each available category. Map/list selection opens a native dialog with status, period, source, flags and limitations. Power remains separately synthetic. The general source dialog identifies facility sources separately from CES.

Actual motion samples, rendered review corrections, source boundaries and verification are recorded in FRONTEND_PROGRESS.md. Local font licenses and basemap provenance are in public/ui/README.md. No dependency or root configuration changes were needed.

The final motion correction keeps the desktop WebGL drawing surface at a stable viewport size and animates its clipped visible area with the evidence canvas. Controls follow the visible edge. Camera padding accounts for the evidence canvas, and bounds use MapLibre 6 `absolutePadding: true` to prevent accumulated offsets. This avoids an observed blank intermediate frame from continuous canvas-buffer resizing. Mobile framing is recalculated against the current container size after layout changes.
