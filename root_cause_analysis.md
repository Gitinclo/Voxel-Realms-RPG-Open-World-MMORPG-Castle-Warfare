# 🔍 Root Cause Analysis (5-Whys) Protocol (`root_cause_analysis.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. Snapshot `/api/ops/readiness`, `securityAuditLog`, and browser console logs.
2. Reproduce deterministically via `npm test` or `npm run verify:ops`.
3. Drill 5 Whys to the exact state-machine or contract gap.
4. Register structural invariant in `src/game/systemValidation.ts`.
