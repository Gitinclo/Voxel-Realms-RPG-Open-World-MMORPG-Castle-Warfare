# 💾 Multi-Tier Storage Engine (`STORAGE_ENGINE.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

1. **Tier 1 (Hot Siege State)**: In-memory Maps flushed via `AtomicRealmPersistence` (`.tmp` → `fsyncSync` → `.bak` → POSIX rename) in `data/online_realm_state.json`.
2. **Tier 2 (Relational Accounts & Saves)**: PostgreSQL `15+` via Drizzle ORM (`users`, `player_profiles`, `game_saves`, `tickets`).
3. **Tier 3 (Realtime Document Sync)**: Cloud Firestore (`ai-studio-voxelrealmsrpgop-416287a7-e9eb-4cc3-b431-b5f2455f192b`) under zero-trust `firestore.rules`.
