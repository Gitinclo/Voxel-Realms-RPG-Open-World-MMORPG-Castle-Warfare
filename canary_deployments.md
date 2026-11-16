# 🐤 Canary & Progressive Rollout Strategy (`canary_deployments.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. Roll out `5% -> 25% -> 100%` Cloud Run traffic split.
2. Watch `/api/ops/readiness` (`tickLatency.p95Ms <= 35`, `overrunCount == 0`) for 15 minutes per stage.
3. Execute [`rollback_procedures.md`](./rollback_procedures.md) immediately upon any SLO breach.
