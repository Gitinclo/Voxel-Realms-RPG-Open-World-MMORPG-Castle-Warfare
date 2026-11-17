# 🧬 Schema Evolution Rules (`SCHEMA_EVOLUTION.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

1. **Disk Snapshots (`serverPersistence.ts`)**: Increment `SCHEMA_VERSION` only with a pure upgrader function tested against legacy v1 fixtures in `serverPersistence.test.ts`.
2. **PostgreSQL (`src/db/schema.ts`)**: Add nullable or defaulted columns first; never drop active columns in the same release as application code removal.
3. **Firestore (`firebase-blueprint.json`)**: Update schema blueprint + `firestore.rules` + `firestore.rules.test.ts` in one atomic PR.
