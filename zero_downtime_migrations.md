# 🔁 Zero-Downtime Expand-and-Contract Migrations (`zero_downtime_migrations.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. **Expand**: Add nullable/defaulted columns in `src/db/schema.ts`.
2. **Dual-Read**: Handle legacy & new envelope formats in `serverPersistence.ts` & `src/db/users.ts`.
3. **Backfill**: Migrate dormant records in bounded batches.
4. **Contract**: Remove compatibility shims only in the next verified release.
