# ⏪ Rollback Procedures (`rollback_procedures.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. Shift Cloud Run traffic back to the prior healthy revision.
2. Verify `GET /healthz` and `GET /readyz` return `HTTP 200`.
3. Send clean `SIGTERM` so `AtomicRealmPersistence` drains WS peers and flushes state to disk.
4. Revert `firestore.rules` if rule regressions triggered false `PERMISSION_DENIED`.
