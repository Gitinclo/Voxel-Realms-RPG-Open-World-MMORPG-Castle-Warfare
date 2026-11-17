# ⚡ Performance Benchmarks & Telemetry Baselines (`PERFORMANCE_BENCHMARKS.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

Verified metrics measured on current `v1.5.0` build:

- **Client Bundle Splitting**: Initial chunk `~649 kB` (`205 kB` gzip); 19 conditional modals split into lazy chunks via `React.lazy`.
- **Authoritative 20Hz Siege Loop**: Live `npm run verify:ops` sustained **`1,114.8 req/s`** (`p50 = 26.5ms`, `p95 = 45.7ms`) alongside `12` 20Hz WS peers with **`0` tick overruns**.
- **200-Entity Raid Duplication**: `50` Avatars + `150` Clones consume `3,000 B/tick` (`-58.3%` delta compression) and `~7.55 ms` of the `50ms` tick budget.
- **SoA vs AoS Microkernel**: `4.75x` hot-loop throughput gain (`<2.5%` L1/L2 cache miss model) in `architectOptimization.ts`.
