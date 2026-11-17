# 💥 Stress & Spike Testing Playbook (`stress_testing.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- Exceed `120 req/min/IP` write cap -> expect `HTTP 429` + `Retry-After`.
- Exceed `32 KiB` WS frame -> expect close code `1009`.
- Exceed `200` raid entities -> expect `evaluateRaidDuplicationServerLoad` clamp telemetry warning.
