# ClearSky — California Environmental Atlas

Status: the local desktop ClearSky experience combines the map-first, multi-location frontend with all 23 supported tract measures, schools, healthcare and statewide Overture building tiles. See the [post-Prototype-1 desktop refinements](docs/REFINEMENT_PROGRESS.md), [integration checkpoint](docs/INTEGRATION.md), [current status](docs/STATUS.md) and [data verification](docs/DATA_VERIFICATION.md) for performed checks and limits. Power remains source-gated; mobile acceptance is outside this checkpoint.

A map-first California atlas for exploring and comparing environmental conditions, population health, community context, and essential infrastructure.

Source publication does not deploy the application. Gemini credentials stay local; generated data can be rebuilt with the commands below. See [publication checks](docs/PUBLICATION.md).

## Preserved prototype

The verified desktop application is pinned as **MVP Prototype 1** at `mvp-prototype-1` (source `6dc04f3`). See [PROTOTYPE_1.md](docs/PROTOTYPE_1.md) for the original backup, snapshot contents, restore instructions and verification limits.

## Session continuation

**The desktop MVP, including Gemini integration, is complete for demo preparation. Start the next session from [DEMO_PREP_HANDOFF.md](docs/DEMO_PREP_HANDOFF.md).** The desktop MVP source, including Ask ClearSky and discovery, is included in the published repository.

Start from [REFINEMENT_PROGRESS.md](docs/REFINEMENT_PROGRESS.md) for the current branch, runtime, completed work and next-session instructions. Work in `/Users/anand/Projects/hackathon` on `development/prototype-2`; `/Users/anand/Projects/hackathon.frontend` is the frozen reference. [INTEGRATION.md](docs/INTEGRATION.md) documents the earlier integrated base; [SESSION_HANDOFF.md](docs/SESSION_HANDOFF.md) is historical. Recheck worktrees and servers before edits. [Ask ClearSky is integrated](docs/GEMINI_INTEGRATION.md): Gemini-assisted address comparison and deterministic statewide tract discovery, including direction-aware ranking and labeled healthcare proximity. See the [use-case evaluation](docs/GEMINI_EVALUATION.md) for coverage and limits. The [original four-milestone plan](docs/GEMINI_IMPLEMENTATION_PLAN.md) remains preserved verbatim.

## Start here

- [Product scope](docs/PRODUCT.md): full target, comparison stories, feature boundaries.
- [Experience direction](docs/EXPERIENCE.md): map composition, interaction, interpretation.
- [Architecture](docs/ARCHITECTURE.md): proposed modules, contracts, unresolved dependencies.
- [Build plan](docs/BUILD_PLAN.md): solo sequence, acceptance gates, independent deferrals, sponsor strategy.
- [Original handoff](docs/source/california-environmental-atlas-handoff.pdf).

The full original scope is the target. Build in complete increments so constraints can lead to explicit feature deferrals without redesigning the foundation. Comparison is the centerpiece. Ask ClearSky is an optional Gemini-assisted way into the same evidence; voice remains a future extension.

Statewide building rendering is available through the [Overture tile service](docs/BUILDINGS_STATEWIDE.md). It serves pinned tiles across California with verified byte-range caching and optional full offline acquisition; the desktop frontend consumes this service. Uncached views need the upstream source; complete offline acquisition remains unfinished.

## Interactive frontend session

The frozen frontend checkpoint `e7e64fb` is preserved at :3001 as a comparison reference, proxying APIs to main on :3000. The combined application runs on :3000 without `ATLAS_BACKEND_ORIGIN`. [FRONTEND_HANDOFF.md](docs/FRONTEND_HANDOFF.md) retains ownership/baseline details; [BACKEND_CHANGES.md](docs/BACKEND_CHANGES.md) records API history. Coordinate before resuming separate frontend work or integrating another checkpoint.

## Run locally

Use Node 26 (tested) and Python 3.14 (tested). The atlas needs no credentials. Ask ClearSky additionally uses a server-side Gemini key in `.env.local`; see the empty [.env.example](.env.example) and [setup/verification notes](docs/GEMINI_INTEGRATION.md).

```sh
npm ci
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/fetch_sources.py
.venv/bin/python scripts/prepare_data.py
.venv/bin/python scripts/cache_demo.py
.venv/bin/python scripts/write_derived_manifest.py
.venv/bin/python scripts/prepare_discovery.py
npm run dev
```

Open http://127.0.0.1:3000. Downloaded originals and manifests are retained in `data/raw/`; large generated geometry/observations are ignored and reproducible. Example queries are public civic addresses; new searches are sent to Census and not persisted by the app. Basemap tiles/glyphs, uncached building ranges and new Census searches require internet; UI fonts are local. Cached building views, local tract evidence and cached examples do not.

```sh
npm test
npm run build
npm run start
# In another terminal, with Google Chrome installed:
ATLAS_DESKTOP_ONLY=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:ui
```

The browser suite records ignored screenshots in `artifacts/`. It verifies actual tract features render, plus comparison/failure behaviors. See STATUS.md for performed checks and limits. The original full scope and explicit follow-up triggers remain in PRODUCT.md and INTEGRATION.md.

Optional statewide map overview: named `/api/map` requests may add `detail=overview` at broad scales (recommended through zoom 7); default detail remains unchanged. See BACKEND_CHANGES.md for compact properties, source topology exceptions and display limitations. To regenerate its separate artifact from cached source bytes, run `.venv/bin/python scripts/prepare_map_overview.py`, format generated `src/contracts/map-overview-proof.ts` with installed Prettier, then `python3 scripts/write_derived_manifest.py` and restart only main. Exact lookup never uses the overview geometry. Verify with `python3 scripts/smoke_map_overview.py`; isolated rendering uses `node scripts/verify_map_overview_render.mjs` and installed Chrome/Node Playwright.
