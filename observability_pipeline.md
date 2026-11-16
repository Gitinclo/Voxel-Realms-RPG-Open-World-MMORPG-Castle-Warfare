# 🔭 Observability Pipeline (`observability_pipeline.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **Pull Endpoints**: `/healthz`, `/readyz`, `/api/ops/readiness`, `/api/online/anti-cheat`.
- **Audit Ring Buffer**: Staff-restricted `securityAuditLog` (`<=500` entries).
- **In-App Profiler**: Live WebGL/FPS & SoA metrics surfaced in `CppArchitectureModal.tsx`.
