# 🔄 Version & Schema Migration Guide (`MIGRATION.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

## 1. Save File Envelope Migrations (`src/game/serverPersistence.ts`)

- **Legacy v1 → Schema v2**: Wrapped raw JSON realm state in a SHA-256 verified `PersistedEnvelope` with `.bak` shadow promotion. Handled automatically at startup on read.

## 2. Cloud SQL Drizzle Migrations (`src/db/`)

1. Update `src/db/schema.ts` preserving backward-compatible nullable columns before backfilling.
2. Validate config via `src/db/drizzle.config.ts`.
3. Follow [`zero_downtime_migrations.md`](./zero_downtime_migrations.md) expand-and-contract steps.

## 3. Firestore Rules Migrations

- Update `firestore.rules` alongside `firebase-blueprint.json`, then run `npm run lint:rules && npm run test:rules`.
