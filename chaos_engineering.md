# 🌪️ Chaos & Fault-Injection Testing (`chaos_engineering.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

Verified continuously via `npm run verify:ops` (`scripts/verify-readiness.ts`):

- **Truncated Disk Save Injection**: Corrupts primary save file & confirms automatic SHA-256 failover from `.bak`.
- **WebSocket Flood Injection**: Validates clean drop on `>30 msg/s` & slow consumers without starving healthy peers.
- **Offline Cloud SQL Resilience**: Boots `server.ts` without a live PG socket verifying instant port `3000` bind.
