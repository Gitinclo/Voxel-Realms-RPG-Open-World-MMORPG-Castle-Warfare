# 🛟 Disaster Recovery Plan (`disaster_recovery.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

Complements [`backups.md`](./backups.md):

- **Tier 1 (Local Disk Save)**: Automatic boot failover from SHA-256 verified `data/online_realm_state.json.bak` (`RTO < 50ms`).
- **Tier 2 (Cloud SQL PostgreSQL `ai-studio-416287a7`)**: Point-in-Time Recovery (PITR) from WAL logs (`RPO <= 5m`, `RTO < 15m`).
- **Tier 3 (Cloud Firestore `dev-ivy-6v0ns`)**: Multi-region synchronous replication + GCS daily export restore (`RTO < 10m`).
