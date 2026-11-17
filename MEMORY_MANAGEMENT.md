# 🧠 Memory Management & Disposal Discipline (`MEMORY_MANAGEMENT.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

- **Three.js WebGL2**: Every procedural geometry, `CanvasTexture`, BVH acceleration tree (`disposeBoundsTree()`), and `MeshPhysicalMaterial` must be disposed on scene teardown (`GameCanvas.tsx`).
- **Node.js Bounds**: Single-instance peer map capped at `<=250` WebSocket clients, commander cache pruned LRU at `<=5,000` entries, audit ring buffer capped at `500` entries, and WS RX buffers capped at `64 KiB`.
- **C++20 Guardrails**: Strict `std::unique_ptr` / `std::shared_ptr` RAII ownership enforced by `.clang-tidy`.
