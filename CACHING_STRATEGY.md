# 🗄️ Caching Strategy (`CACHING_STRATEGY.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| Tier                        | Cache Target                                | Invalidation & Bounds                                                       |
| :-------------------------- | :------------------------------------------ | :-------------------------------------------------------------------------- |
| **HTTP Static Assets**      | Vite hashed `dist/assets/*`                 | Immutable filename hashes; `no-store` strictly enforced on `/api/*`.        |
| **Three.js Geometries/PBR** | In-scene material/texture pools             | Rebuilt only when `EngineQualityPreset` or `PlatformTarget` mutates.        |
| **Infinite Cosmology**      | `InfiniteCollection.loadedNodes`            | Deterministically paged slice-by-slice (`lazilyGenerateInfiniteTierSlice`). |
| **Client Save Sync**        | `localStorage` (`UNTRUSTED_CLIENT_PREVIEW`) | Overwritten by server/Firestore authoritative snapshots upon sign-in.       |
