# 🧱 Technical Debt Register (`TECH_DEBT.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| ID      | Component           | Description                                                            | Mitigation / Scheduled Target                                        |
| :------ | :------------------ | :--------------------------------------------------------------------- | :------------------------------------------------------------------- |
| `TD-01` | Multi-Pod WS Sync   | Live `/ws/siege` room map is single-instance in-memory (`<=250` peers) | Add Redis pub/sub adapter for multi-pod Cloud Run scaling (`v1.6.0`) |
| `TD-02` | Native Wasm Build   | `cpp/` C++20 SIMD headers run natively / analytically modeled in TS    | Compile via Emscripten `-msimd128` worker pool (`v2.0.0`)            |
| `TD-03` | Bundle Vendor Split | Initial index bundle grew to `649 kB` after adding BVH/Cannon          | Extract physics/BVH workers off initial critical path (`v1.6.0`)     |
