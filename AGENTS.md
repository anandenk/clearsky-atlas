# California Environmental Atlas

## Current authorization

Authorized 2026-11-07: advance through Phase 1 data-source verification and Phase 2 local implementation, including data-service queries, successful-download caching with provenance, dependency installation, and meaningful spatial, comparison, and rendered-interface verification. Continue without routine approvals. Full original scope remains the target; record deferrals and concrete triggers explicitly.

Bounded Codex CLI workers through `$parallel-worktrees`, Worktrunk worktrees, and local commits/merges are authorized. Preserve existing work before branching. Normally use zero or one worker, choose model/effort deliberately, prohibit worker delegation, and reserve allowance for integration/tests. Remaining allowance is unknown.

Subsequent user authorization, 2026-11-07: continue backend indicator-contract and layer breadth while the frontend session remains separate. Sponsor services are parked until near MVP readiness; do not work on sponsor accounts/integrations during current backend milestones.

Authorized 2026-11-07: preserve the current verified application as **MVP Prototype 1**. Create the private GitHub repository `anandenk/clearsky-atlas`, push reviewed `main` and the fixed `mvp-prototype-1` tag, upload reviewed source/data/evidence/restore assets to its private release, and verify remote visibility, content and restoration. The tag stays at application checkpoint `6dc04f3`. This is a scoped private backup authorization; it does not authorize public visibility, deployment, other branch/ref uploads, purchases or global changes.

Except for the scoped private Prototype 1 backup above, keep all work local. No other push, public publication, deployment, purchases, billing/global configuration changes, or revival of archived investigations. If credentials or paid access block a source, finish independent work and document the specific blocker.

## Interactive frontend split — authorized 2026-11-07

The user opens their own frontend session; do not launch a frontend worker. Backend/integration owner works in the main worktree, frontend owner in `frontend/atlas-interactive`. See `docs/FRONTEND_HANDOFF.md` before edits. These ownership rules supersede the earlier sequential-solo rule for this explicitly authorized two-session arrangement.

- Backend owner: `app/api/**`, `data/**`, `scripts/**`, `src/data.ts`, `src/spatial.ts`, `src/domain.ts` (shared types and numeric/comparison correctness helpers), `src/contracts/**`, backend tests outside `tests/ui/**`, backend/status/handoff documentation.
- Frontend owner: `app/**` EXCEPT `app/api/**`, `src/AtlasMap.tsx`, `src/map-theme.ts`, new `src/components/**`, `src/hooks/**`, `src/styles/**`, `src/frontend/**`, `public/ui/**`, `tests/ui/**`, `playwright.config.ts`, `.hallmark/**`, and `docs/FRONTEND_PROGRESS.md`.
- Backend/integration owner exclusively owns `package.json`, lockfiles, `next.config.*`, `tsconfig.json`, `.gitignore`, `.gitattributes`, AGENTS.md, shared types, and other root configuration. Frontend requests changes through the user; do not edit concurrently or install new dependencies unilaterally. `npm ci` from the baseline lockfile is allowed. Framework-generated `next-env.d.ts` and ignored `.next/**` are per-worktree generated artifacts; do not hand-edit or treat their dev/build churn as feature work.
- Frontend owns application entry points `app/page.tsx` and `app/layout.tsx`. Backend must not edit those after the baseline without an explicit ownership handoff.
- Backend :3000; frontend :3001 proxies `/api/*` to :3000. Keep browser requests relative; do not copy or change backend data in the frontend tree. Backend interface updates are additive and logged in `docs/BACKEND_CHANGES.md`; breaking changes require an explicit integration checkpoint through the user.
- Integration remains with the main session. Do not merge/rebase/cherry-pick active frontend edits without coordinating with the user. Agree on a checkpoint, review full diff, commit owned paths, merge, then run combined checks. No automated frontend agent is authorized by this split.

## Working agreement

- Read README.md and the four linked planning documents before substantive work.
- The prior flood and Earth investigations are archived outside this workspace. Do not import their conclusions or instructions into this project by default.
- Preserve the source PDF. Distinguish user decisions, proposals, handoff claims, inspected evidence, and measured results.
- Delegation, worktrees, and local commits/merges are authorized only within the bounded workflow above. Other pushes, deployment, public publication, and global configuration changes remain prohibited; the scoped private Prototype 1 backup above is authorized.
- Keep solo implementation sequential, with one complete interaction working before broadening coverage.
- Comparison, visual quality, truthful interpretation, and clear provenance are central product requirements.
- No invented data, causal claims, personal disease probabilities, demographic hazard scores, or facility-access guarantees.
- Use identical metric definitions, units, source versions, and legend domains when comparing locations. Preserve nulls.
- Keep exact lookup boundaries separate from simplified display geometry.
- Record scope deferrals explicitly; do not delete them from the full target.
- Do not claim builds, tests, responsiveness, accessibility, or data checks passed unless actually performed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
