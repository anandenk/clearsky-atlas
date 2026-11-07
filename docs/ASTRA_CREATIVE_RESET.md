# Astra creative reset — visual experience comes first

This is the new user-authorized frontend assignment. It supersedes the visual direction, data-presentation design, comparison interaction design and implementation priorities in the earlier Astra prompt, design.md and FRONTEND_PROGRESS.md. Those documents describe a rejected design. They are not constraints on the replacement.

## The assignment

Start the frontend over. The user rejected the current visual design, the way information is presented, and the comparison experience. A cosmetic refresh, extra transitions on the same layout, or a more decorated version of the current dashboard will not satisfy this request.

**VISUAL DESIGN AND USER EXPERIENCE ARE THE NUMBER ONE REQUIREMENT.**

Create a visually exceptional, highly polished, fluid interactive environmental atlas. Be ambitious. Make strong original design decisions. The user wants a striking, memorable experience with sophisticated data presentation and smooth, connected interactions. Technical completeness alone is not success. A functional but visually ordinary result is a failed outcome for this assignment.

You have creative ownership of the entire frontend: information architecture, composition, navigation, typography, colors, cartography, data graphics, comparison mechanics and motion. Decide how the information should be experienced. Do not inherit the previous side panel, toolbar stack, charts, default controls, palette, fixed dimensions, or rigid grid just because they already exist. You may rewrite frontend-owned application code and replace its components, styles and frontend tests after preserving the current work.

## What the product must let people do

Explore California through a map-centered experience. Someone should be able to enter an address, understand the place around it, explore the evidence, and compare it with two or more other California addresses.

The product has four information domains:
- Environment: air pollution, ozone, diesel particulates, traffic, toxic air releases and cleanup-site burden.
- Health: asthma emergency visits, cardiovascular emergency visits, diabetes prevalence and low birth weight.
- Community: poverty, education, housing burden, age and racial/ethnic composition.
- Infrastructure: healthcare facilities, public schools and power plants, with location details and qualified straight-line distances.

These domains must be discoverable and explorable. Choose their best presentation; do not assume four plain tab buttons and a dropdown is the answer.

The opening experience is a usable California map, not a marketing page or an automatically loaded example comparison. Beyond that, you decide how exploration unfolds.

Comparison must help people understand what meaningfully differs, what is similar, and what those differences mean. Make the act of adding another place feel like a compelling expansion of the experience. Invent a better information presentation and comparison interaction than the rejected implementation. Split maps, linked views, visual stories, charts and contextual surfaces are tools you may choose and combine—not a prescribed wireframe. More locations must remain usable on smaller screens.

Reveal definitions, measurement dates, source links and limitations when needed. Make complex information understandable without burying the experience in technical prose. Do not simply put every available number into a long scrolling evidence rail.

## The visual and motion bar

Aim for a showcase-quality interactive product with a clear visual point of view. The map, controls, typography and data graphics should feel deliberately designed together. Spend design effort on how the information itself looks and behaves, not only the surrounding chrome.

Smooth motion is a core deliverable, not an optional finishing task:
- Entering and exploring a place should feel spatially continuous.
- Changing information domains should create a meaningful visual transformation.
- Entering, updating and leaving comparison should be fluid rather than abrupt layout jumps.
- Revealing details and changing data graphics should have intentional timing and continuity.
- Hover, selection and direct manipulation should feel responsive and crafted.

You choose the choreography and implementation. Include interruptible transitions, preserve map state and avoid unnecessary remounts. Motion must be perceivable and purposeful, not just a single map fly-to or a generic fade on every element. Support reduced motion without removing motion for everyone else. Do not defer the motion system to Sol.

No prescribed light/dark theme, warm-paper palette, system-font requirement, sidebar width, corner radius or motion-family limit. Use this freedom. Visual richness can come from composition, depth, typography, cartography, lighting, transitions or distinctive graphics; choose a coherent concept rather than piling effects onto a template.

Use a well-styled vector map as the natural starting point; the previous basemap's defaults are not the visual ceiling. Keep real geography readable. Additional rendering/animation libraries are possible when justified, subject to the shared-dependency ownership below. Do not spend the pass rewriting geographic fundamentals when a custom visual experience can be built on the current engine.

## Only the necessary skills

Use **frontend-design** as the sole creative lead. Read `/Users/anand/.codex/skills/frontend-design/SKILL.md`.

Use **webapp-testing** for browser verification after implementation, adapting to the existing Playwright setup. Read `/Users/anand/.codex/skills/webapp-testing/SKILL.md` at that stage.

Do not apply Hallmark, UI/UX Pro Max, shadcn, or additional design rulebooks to this pass by default. They remain installed but are not part of this assignment. Do not spend time satisfying competing skill checklists. Use relevant installed framework documentation for technical correctness.

## Design process

First develop a concise, strong creative concept: the visual identity, how people discover information, how comparison works, and the defining motion experience. Critique it against the rejected result. If it is essentially the same interface in different colors, rethink it before implementation. Choose one direction; routine aesthetic choices are yours to make.

Rebuild design.md around the replacement concept. Keep it specific and useful: visual tokens, typography, component/interaction language, cartographic treatment, data-visualization logic, responsive composition and motion choreography. It should describe the design you are actually building. Do not write another long constraint document and then leave the visual system unimplemented.

Implement the concept end to end. Inspect it visually and in motion. Make a deliberate correction pass before handing it back. Functional checks are the floor; strong visual execution and intuitive use are the acceptance gate. Do not describe an ordinary result as polished just because it builds.

## Keep frontend ambition independent of backend readiness

All planned frontend experiences can be built now. Use frontend-owned adapters and deterministic preview fixtures for unsupported backend capabilities. Every domain and comparison path needs a real working interaction, not a disabled coming-soon button.

Make synthetic preview status clear without scattering repetitive engineering warnings throughout the composition. Never silently replace live results with fixtures or mix synthetic and live findings. Keep measurements, nulls, units, dates and percentile semantics truthful. Tract statistics are not personal/property-level risk. Demographics are not hazards; correlation is not causation; no fabricated overall safety score.

Use real endpoints where available, and isolate missing integrations so they can be connected later. Source availability limits live claims; it does not limit frontend design exploration. Backend/source work and sponsor integrations are not your assignment.

## Workspace and preservation

Worktree: `/Users/anand/Projects/hackathon.frontend`
Branch: `frontend/atlas-interactive`
Backend/integration worktree: `/Users/anand/Projects/hackathon`

Read AGENTS.md and docs/FRONTEND_HANDOFF.md for technical ownership and source/API contracts. Read current `/Users/anand/Projects/hackathon/docs/BACKEND_CHANGES.md` for additive updates. Treat old product documents as an information inventory, not a mandated presentation. Read relevant installed Next.js documentation before coding.

Before replacing the frontend, preserve the current frontend-owned changes and untracked design/source files in a reviewed local checkpoint commit, staging only owned paths. Do not reset or stash work silently. This request authorizes replacing the frontend design and frontend implementation, not deleting backend data or another session's work. Keep the checkpoint recoverable.

You own documented frontend paths, design.md, frontend progress and this user-requested handoff. Backend/API/data/shared numeric helpers/types/root configuration/manifests/lockfiles and integration remain with the main session. If a visual or animation library needs installation, request the precise dependency/config change through the user to the integration owner. Do not settle for a poor design merely because native controls are already available; continue independent work while coordinating necessary setup.

Frontend :3001 uses relative /api calls proxied to backend :3000. Reuse the existing preview. Do not restart backend or merge/rebase/cherry-pick active work. No additional agents, push, deployment, purchases or global configuration changes.

## Finish and handoff

Review the actual first view, address exploration, all four domains, comparison and narrow-screen experience. Exercise transitions while interacting, not just screenshot endpoints. Check keyboard operation, reduced motion, errors and preview/live separation, and test real rendered map content. Report what you actually verified; static screenshots do not prove smooth animation.

Reserve a substantial part of the pass for visual critique and fixes. Do not spend the entire allowance on functional breadth and call motion future work. Preserve the full feature inventory; record real remaining work honestly without silently replacing the target with a tiny MVP.

When the replacement is ready for user review, synchronize design.md and update docs/FRONTEND_PROGRESS.md with the creative decisions, visual/motion verification, working live/preview flows, integration requests and remaining issues. Stop for user feedback and the eventual switch to Sol.

The central test: does this feel like an exceptional visual product someone would want to explore, and does its presentation make the information and comparisons genuinely easier to understand? If it is merely a correct dashboard, the assignment is not finished.
