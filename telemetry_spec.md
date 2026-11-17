# 📡 Telemetry Metric Schema Specification (`telemetry_spec.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

| Metric                                 |  Type   | Unit  | Source               |
| :------------------------------------- | :-----: | :---: | :------------------- |
| `tickLatency.p50Ms / p95Ms / maxMs`    |  Gauge  | `ms`  | `serverHardening.ts` |
| `tickLatency.overrunCount`             | Counter | ticks | `server.ts`          |
| `opsCounters.rateLimitDrops`           | Counter | reqs  | `serverHardening.ts` |
| `opsCounters.csrfBlocks`               | Counter | reqs  | `serverHardening.ts` |
| `opsCounters.prototypePollutionBlocks` | Counter | reqs  | `serverHardening.ts` |
| `opsCounters.antiCheatRejections`      | Counter | cmds  | `antiCheat.ts`       |
