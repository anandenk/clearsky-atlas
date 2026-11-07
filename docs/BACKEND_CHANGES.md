# Backend interface updates

## 2026-11-07 — frontend handoff baseline v1

- Frozen existing /api/demo, /api/geocode and /api/map shapes; documented their current limitations in FRONTEND_HANDOFF.md.
- Added local-only frontend proxy configuration via ATLAS_BACKEND_ORIGIN; main :3000, frontend :3001.
- Moved presentation palette to frontend-owned src/map-theme.ts. Shared src/domain.ts stays backend-owned.
- Added representative real-data sample data/samples/frontend-v1.json. No new indicator or facility endpoint at this checkpoint.
- New backend routes/metadata will be additive. No breaking shape/type change without a user-coordinated integration checkpoint.
