# 📈 Scalability Matrix & Hard Capacity Limits (`SCALABILITY_MATRIX.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| Dimension                   | Current Limit / Scale             | Enforcement Location            | Horizontal Scaling Path         |
| :-------------------------- | :-------------------------------- | :------------------------------ | :------------------------------ |
| **Troop Army Capacity**     | `1,000 Trillion` (`10^15`)        | `src/game/math.ts` (`BigInt`)   | Unlimited arbitrary precision   |
| **WebSocket Siege Peers**   | `250` concurrent / `20` per IP    | `src/game/serverHardening.ts`   | Shard by sector + Redis pub/sub |
| **Cached Realm Commanders** | `5,000` LRU in-memory             | `src/game/serverHardening.ts`   | Backed permanently in Cloud SQL |
| **50-Player Raid Clones**   | `3` clones + `2` shadows / Avatar | `src/game/avatarCloneShadow.ts` | Delta `int16` packet pruning    |
| **Lore Corpus Size**        | `10^100` words (`10^97` volumes)  | `src/game/loreHistory.ts`       | Stateless procedural generation |
