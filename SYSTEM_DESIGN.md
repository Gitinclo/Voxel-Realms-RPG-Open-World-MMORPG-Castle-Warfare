# 🏗️ System Design Document (`SYSTEM_DESIGN.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

## High-Level Topology

1. **Browser Client (React 19 + Three.js WebGL2 + Vite 8)**:
   - Renders procedural 3D terrain, castles, 10 species avatars/clones/shadows, and D3 cosmological trees.
   - Runs 60Hz local CSP input loop and `React.lazy` modular overlays.
2. **Backend Authority (`server.ts` on Port `3000`)**:
   - **Express HTTP API**: HMAC-SHA256 sessions (`/api/auth/*`), RBAC (`/api/admin/*`), Cloud SQL endpoints (`/api/db/*`), and readiness probes (`/healthz`, `/readyz`, `/api/ops/readiness`).
   - **RFC 6455 WebSocket (`/ws/siege`)**: Runs deterministic `20Hz` (`50ms`) 50v50 siege tick broadcasts using `CohortDirtyBit` deltas and FNV-1a checksums.
3. **Persistence & Identity**:
   - **Tier 1**: Atomic `fsync` + `.bak` disk envelope (`data/online_realm_state.json`).
   - **Tier 2**: Cloud SQL PostgreSQL + Drizzle ORM (`src/db/`).
   - **Tier 3**: Firebase Auth + Cloud Firestore (`firestore.rules`).
