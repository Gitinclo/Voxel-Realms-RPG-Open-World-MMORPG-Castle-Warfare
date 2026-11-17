# ⚙️ Concurrency & Tick Scheduling Model (`CONCURRENCY_MODEL.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

- **Node.js Backend**: Single-threaded event loop driving a `50ms` (`20Hz`) deterministic siege simulation timer with bounded synchronous I/O and non-blocking PostgreSQL queries.
- **Browser Runtime**: Main-thread `requestAnimationFrame` loop decoupled from React state updates via throttled HUD refs/snapshots.
- **C++20 Native Model (`architectOptimization.ts`)**: Lock-free Chase-Lev work-stealing job DAG across 5 stages with `std::atomic` telemetry counters.
