# ClearSky desktop MVP — demo-prep handoff

**Decision, 2026-11-08:** Gemini integration is complete for the current desktop MVP. The next session should focus on demo preparation, not expand feature scope. Fix a demonstrable demo blocker if one appears; preserve the full original product backlog and its explicit deferrals.

## Publication update — 2026-11-08

The latest MVP source is being committed and published to `anandenk/clearsky-atlas` under the user's explicit upload/public-visibility request. The uncommitted-work and private-only descriptions below record the earlier handoff state; see [PUBLICATION.md](PUBLICATION.md) for the publication checkpoint. Runtime, feature limits and deferred product work remain as described.

## Start here

- Workspace: `/Users/anand/Projects/hackathon`.
- Branch: `development/prototype-2`; committed HEAD observed at `3076245`.
- **The Gemini implementation and subsequent refinements are uncommitted**, including untracked source/tests/docs. They are present in this worktree; HEAD alone does not contain this MVP. Inspect `git status --short` and preserve the working tree. Do not reset, clean, switch branches or run a clean-tree worker launcher over these edits.
- Main production app: <http://127.0.0.1:3000>, HTTP 200 verified at handoff. Existing tmux session: `atlas-local-server`; run without `ATLAS_BACKEND_ORIGIN`.
- Frozen frontend reference: `/Users/anand/Projects/hackathon.frontend`, :3001. Leave it untouched.
- `.env.local` already contains the server-side Gemini configuration and is Git-ignored. Never print, copy into a prompt, expose through browser code, or bundle the key. Remaining provider credits were not checked at this handoff.
- Generated `next-env.d.ts` has pre-existing churn. Preserve it; its saved bytes/patch and later byte-identity checks are in the assistant artifacts. Do not hand-edit/reset it or silently stash authored work.
- `mvp-prototype-1` still peels to `6dc04f30fe666f11740f236eb686a8156e308140`. Its private backup/release is the older Prototype 1, not a backup of the current uncommitted MVP. No new tag, push, deployment or release was created.

## What is complete

The atlas combines 23 source-qualified tract measures, multiple confirmed places, schools/healthcare inventories and statewide Overture buildings/parts. Ask ClearSky is visible as a compact composer on load and expands after sending.

Gemini uses validated tools for scalar extrema, top-N lists, mixed-criterion Pareto discovery, county/current-map scope, numeric limits, school presence and labeled hospital/clinic proximity. New addresses require explicit confirmation; verified comparisons open the comparison view. Discovered tracts can be compared without pretending they are street addresses.

Answers lead with Gemini's interpreted findings. Discovery has per-area insights tied to actual evidence/tract IDs; raw values, definitions, periods and source links are expandable. Discovery automatically frames/highlights the candidates and selects the corresponding map measure. Hover/click cards show all measures used in the question, even when the map layer is different. Education is explicitly defined as adults without a high-school diploma, where lower means fewer without one. Closing with X/Escape clears temporary highlights and hover cards while retaining conversation and confirmed places. View controls sit directly beneath Ask ClearSky and remain within the desktop viewport.

## Verification already performed

| Check | Evidence / scope |
| --- | --- |
| Latest production build and TypeScript | Passed; `artifacts/assistant-controls/{build,types}.log` |
| Backend suite | 109/109 passed; `artifacts/discovery-hover/unit.log` |
| Broad real Gemini evaluation | 52 distinct scenarios passed at the breadth checkpoint, plus four healthcare reruns; `artifacts/assistant-audit/` |
| Final narrative contract | 8/8 representative live scenarios passed; `artifacts/assistant-summary/verified-live.json` |
| Broad desktop sweep | 79/79 passed at the pre-hover/control-position checkpoint; `artifacts/assistant-audit/ui-complete.log` |
| Discovery hover follow-up | 21/21 targeted checks passed; `artifacts/discovery-hover/ui-final.log` |
| Latest control placement | 20 checks passed in the main run plus the corrected expansion assertion passed in its focused rerun; `artifacts/assistant-controls/{ui,ui-expansion}.log`. New geometry tests cover compact, privacy-open, expanded and minimized states at 1440×960 and 1280×800. |
| Rendered review | Actual summaries, discovery hover values, and new control placement screenshots are in the corresponding artifact folders. |

These checks were performed incrementally. Do not describe the earlier 79-case full run as a full rerun of the final tree. No need to repeat expensive suites or paid live calls for demo planning; use targeted checks when a new change, failure or blocker warrants them.

## Product limits to preserve in the demo

- Historical source snapshots, not live pollution or traffic conditions. PM2.5 methodology excludes specified wildfire-smoke days; definitions are in the evidence.
- Tract context, not measurements of each home. Exact address lookup uses full-resolution geometry; display geometry is separate.
- Healthcare discovery minimizes straight-line distance from an interior representative tract point to source-listed OPEN hospitals/clinics of explicit subtypes. This does not establish insurance, services, capacity, quality, travel time or actual access. Confirm an address for address-based distances.
- School status is historical; no quality, enrollment or access guarantee.
- Several priorities produce tradeoffs rather than an invented overall best score. No personal disease probabilities, causal claims or demographic suitability ranking.
- Current supported geography is California, named counties and explicit application map bounds; exact city limits need a separately verified source. Power remains source-gated.
- Gemini requires network/provider availability. Uncached building tiles require upstream access; complete offline building acquisition is unfinished. Ordinary atlas tools remain available if Gemini fails.
- Mobile and comprehensive accessibility acceptance remain deferred. Linked geography stays behind opt-in (`?geography=1`). Sponsors, purchases, publishing and deployment remain parked unless separately authorized.

## Demo-prep priorities

1. Establish presentation duration, audience/judging criteria and delivery format from the user; do not invent event rules.
2. Choose a short, repeatable demonstration around a user question, interpreted findings, automatic map action, hover evidence and a confirmed-place comparison. Use public civic example addresses.
3. Rehearse chosen prompts; verify timing, key/credit availability without exposing credentials, source/cache readiness and recovery from an unavailable provider. Avoid blanket repeated live evaluations.
4. Prepare a timed script, screenshots/recording or other agreed fallback, and concise statements of the important source limits.
5. Preserve the local MVP while preparing. Any commit/checkpoint work must review the full diff and exclude credentials/generated artifacts; a new remote backup or deployment needs separate authorization.

## Focused references

- `README.md` and `docs/{PRODUCT,EXPERIENCE,ARCHITECTURE,BUILD_PLAN}.md`: working agreement and full scope.
- `docs/GEMINI_INTEGRATION.md`: runtime and assistant contracts.
- `docs/GEMINI_EVALUATION.md`: evaluation coverage, data semantics and limits.
- `docs/REFINEMENT_PROGRESS.md`: detailed performed checks and recent UI changes.
- `docs/BUILDINGS_STATEWIDE.md`: tile service/cache recovery if needed.

Do not restart from old migration instructions, the original Gemini implementation plan, or archived investigations. They do not represent unfinished work at this checkpoint.
