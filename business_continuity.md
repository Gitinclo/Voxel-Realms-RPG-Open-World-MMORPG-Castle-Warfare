# 🏛️ Business Continuity Plan (`business_continuity.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. **Offline Graceful Degradation**: Single-player 3D Voxel canvas and local progression remain playable via `localStorage` during backend maintenance.
2. **Database Isolation**: Lazy `pg.Pool` init (`src/db/index.ts`) ensures Cloud SQL maintenance never stalls port `3000` or `/ws/siege`.
3. **Key Custodian**: Root continuity & billing governance reside with [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com).
