# 🚀 Load Testing Specification (`load_testing.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **Harness (`npm run verify:ops`)**: Runs `200` HTTP requests at `50` concurrency alongside `12` live `20Hz` WS peers.
- **Baseline**: `1,114.8 req/s` (`p50=26.5ms`, `p95=45.7ms`, `p99=48.5ms`, `0` tick overruns).
