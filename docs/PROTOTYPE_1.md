# ClearSky — MVP Prototype 1

The verified integrated desktop application is frozen at annotated tag
`mvp-prototype-1`, source commit `6dc04f30fe666f11740f236eb686a8156e308140`.
Integration merge: `634b1a63ec8d5ac54f43437cb86fd8c5de04254e`.
Preservation documentation on main may advance without moving this tag.

Verified private backup: [anandenk/clearsky-atlas](https://github.com/anandenk/clearsky-atlas).
Private release: [MVP Prototype 1](https://github.com/anandenk/clearsky-atlas/releases/tag/mvp-prototype-1).
This is private preservation, not public release or deployment. No workers or
recovery branches are uploaded. Original worktrees, caches, logs and partial
building downloads remain local and untouched.

## Restorable capsule

The release assets include:

- `source-history.bundle`: self-contained selected source history and the fixed annotated tag.
- `runtime-data-and-evidence.tar.gz`: generated tract lookup/display/observations, retained data/provenance, successful building ranges and pilot caches, original bounded building extracts, screenshots and verification records.
- `snapshot-manifest.json`: per-file SHA-256 and size, source commit/capture time, and explicit exclusions.
- `restore_snapshot.py` and `RESTORE.md`: safe restore into a fresh checkout at the pinned source commit.
- `checkpoint.json`, `review-summary.json`, `restore-verification.json` and `SHA256SUMS`: checkpoint, bounded checks and asset identities.

The snapshot retains 1,109 files (382.6 MB uncompressed; about 190.8 MB compressed),
including 393 verified successful building ranges. It excludes six incomplete
acquisition/state files preserved in the original checkout. Dependencies, `.next`,
local tooling, OS metadata, Git internals and worker logs are excluded; source
history is a separate bundle and dependencies reinstall from lockfile/requirements.

## Restore

Use a fresh directory, access to the private repository, Git/GitHub CLI, Node 26
and Python 3.14. The release's RESTORE.md is the complete standalone procedure.

```sh
gh repo clone anandenk/clearsky-atlas clearsky-prototype-1
cd clearsky-prototype-1
git switch --detach mvp-prototype-1
cd ..
mkdir clearsky-prototype-1-assets
gh release download mvp-prototype-1 --repo anandenk/clearsky-atlas --dir clearsky-prototype-1-assets
cd clearsky-prototype-1-assets
shasum -a 256 -c SHA256SUMS
python3 restore_snapshot.py --target ../clearsky-prototype-1
cd ../clearsky-prototype-1
npm ci
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
npm test
npm run build
env -u ATLAS_BACKEND_ORIGIN npm run start
```

Open http://127.0.0.1:3000 after ensuring the port is free. Do not build over an
active server's .next directory. A source bundle can replace the GitHub clone:
`git clone /path/to/source-history.bundle clearsky-prototype-1`; then detach at
the same tag and restore the adjacent snapshot assets. Chrome is required for
recorded browser tests. Framework-generated next-env.d.ts imports regenerate
through build/dev; no manual edits are necessary.

## Evidence and limits

The original integration verification remains in [INTEGRATION.md](INTEGRATION.md).
Fresh preservation/restore results are in the release's restore-verification.json.
The source credential-pattern check found no matched findings in the selected
source tree/history; it is bounded evidence, not a security certification. Source
licenses, font OFL files, ODbL attribution and provenance remain preserved.

This is a desktop prototype with all 23 supported measures, multi-location
comparison, linked maps, analytical relief, Overture buildings/parts, and school/
healthcare exploration. Existing source caveats and deferrals are unchanged.

There is no complete statewide offline building archive. Cached ranges in the
snapshot support cached views; uncached buildings, basemap tiles/glyphs and new
Census searches still need upstream services. Power remains source-gated; mobile,
Explore Alternatives, per-tile arrival animation and optional extensions remain
deferred. Historical failed-test/mobile screenshots are evidence records rather
than fresh acceptance claims. No deployment or live-provider reliability is
inferred from preservation.

## Completed preservation verification

Private repository and non-draft prerelease verified on 2026-11-08 UTC. A fresh
GitHub clone matched the reviewed main/tag objects and passed Git object-integrity
checks. All 10 assets were downloaded independently and matched the reviewed
local bytes and GitHub SHA-256 digests; all 1,109 snapshot members reverified.
Unauthenticated repository access returned HTTP 404 while authenticated metadata
confirmed PRIVATE visibility.

A fresh local source-bundle restore passed dependency installation, all 69 backend
tests, four Python cache tests, TypeScript, production build, all seven API smoke
suites and a rendered Oakland/tract/Overture-building check. The temporary restore
server was stopped; the original :3000 app and frozen :3001 preview remain intact.
No application code changed during preservation. Only the known generated
next-env.d.ts churn remains outside commits.

Local capsule and readback evidence: `~/Project-Backups/clearsky-mvp-prototype-1-20261107-232231/`,
including `release-assets/`, `github-release-readback/`, `restore-logs/` and
`BACKUP_COMPLETE.json`. The checksummed source tag remains fixed at `6dc04f3`.
