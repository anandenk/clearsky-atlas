# Public source checkpoint — 2026-11-08

The user authorized publishing the latest ClearSky desktop MVP to `anandenk/clearsky-atlas` and making the repository public. This includes the integrated desktop refinements, Gemini Ask ClearSky, deterministic tract discovery, healthcare proximity and discovery hover evidence. Earlier private-only and uncommitted-work descriptions in historical records are superseded for this checkpoint.

Publication preserves the `mvp-prototype-1` tag at `6dc04f30fe666f11740f236eb686a8156e308140` and its original release assets. Those assets describe the older prototype, not the latest MVP. Use main and the README preparation steps for the latest version. Generated data, dependencies, caches and `.env.local` are excluded from the new source commit; `.env.example` contains no credential.

Fresh checks on the publication candidate: all 109 backend tests passed; an isolated clean dependency installation and production build passed. No paid Gemini calls or rendered-interface suites were rerun for publication; incremental prior UI/provider evidence and limits are recorded in DEMO_PREP_HANDOFF.md. Publication does not deploy or certify the application for hosted operation.

Source and selected history were scanned with Gitleaks 8.30.1 with no findings. Existing release assets are separately checked before switching visibility. Pattern scans are bounded evidence, not proof of absence of every possible secret. Worker-only and unreachable local objects are not uploaded. Local all-ref and working-source backups are retained outside the repository. Existing source attribution and third-party licenses are preserved; no new blanket software license is assigned.

Current desktop, data-version, network, mobile, power-source and accessibility limitations remain unchanged. The README documents reproducible setup and server-side Gemini configuration.
