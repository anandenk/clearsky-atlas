# California Environmental Atlas

Status: verified local backend covers all intended scalar/demographic fields, schools and statewide healthcare. Power source gates and coordinated frontend integration remain open. See the [readiness audit](docs/READINESS_AUDIT.md), [current status](docs/STATUS.md) and [data verification](docs/DATA_VERIFICATION.md).

An address-first California atlas for exploring and comparing environmental conditions, population health, community context, and essential infrastructure.

## Session continuation

For backend migration, read [SESSION_HANDOFF.md](docs/SESSION_HANDOFF.md); [NEXT_SESSION_PROMPT.md](docs/NEXT_SESSION_PROMPT.md) is the ready-to-paste continuation prompt. Recheck active frontend work and servers before edits.

## Start here

- [Product scope](docs/PRODUCT.md): full target, comparison stories, feature boundaries.
- [Experience direction](docs/EXPERIENCE.md): map composition, interaction, interpretation.
- [Architecture](docs/ARCHITECTURE.md): proposed modules, contracts, unresolved dependencies.
- [Build plan](docs/BUILD_PLAN.md): solo sequence, acceptance gates, independent deferrals, sponsor strategy.
- [Original handoff](docs/source/california-environmental-atlas-handoff.pdf).

The full original scope is the target. Build in complete increments so constraints can lead to explicit feature deferrals without redesigning the foundation. Comparison is the centerpiece. AI and voice are optional extensions.

Statewide building rendering is available through the [Overture tile service](docs/BUILDINGS_STATEWIDE.md). It serves pinned tiles across California with verified byte-range caching and optional full offline acquisition; frontend adoption remains separate.

## Interactive frontend session

See [FRONTEND_HANDOFF.md](docs/FRONTEND_HANDOFF.md) for ownership, baseline, sample and the :3001 frontend → :3000 backend proxy. Backend interface updates are recorded in [BACKEND_CHANGES.md](docs/BACKEND_CHANGES.md). Do not merge active frontend work without a user-coordinated checkpoint.

## Run locally

Use Node 26 (tested) and Python 3.14 (tested). No credentials required.

```sh
npm ci
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/fetch_sources.py
.venv/bin/python scripts/prepare_data.py
.venv/bin/python scripts/cache_demo.py
.venv/bin/python scripts/write_derived_manifest.py
npm run dev
```

Open http://127.0.0.1:3000. Downloaded originals and manifests are retained in `data/raw/`; large generated geometry/observations are ignored and reproducible. Example queries are public civic addresses; new searches are sent to Census and not persisted by the app. Map tiles and Google Fonts require internet; local tract evidence and cached examples do not.

```sh
npm test
npm run build
npm run start
# In another terminal, with Google Chrome installed:
npm run test:ui
```

The browser suite records ignored screenshots in `artifacts/`. It verifies actual tract features render, plus comparison/failure behaviors. See STATUS.md for performed checks and limits. This is an initial complete comparison increment, with the original full scope still planned.

Optional statewide map overview: named `/api/map` requests may add `detail=overview` at broad scales (recommended through zoom 7); default detail remains unchanged. See BACKEND_CHANGES.md for compact properties, source topology exceptions and display limitations. To regenerate its separate artifact from cached source bytes, run `.venv/bin/python scripts/prepare_map_overview.py`, format generated `src/contracts/map-overview-proof.ts` with installed Prettier, then `python3 scripts/write_derived_manifest.py` and restart only main. Exact lookup never uses the overview geometry. Verify with `python3 scripts/smoke_map_overview.py`; isolated rendering uses `node scripts/verify_map_overview_render.mjs` and installed Chrome/Node Playwright.
