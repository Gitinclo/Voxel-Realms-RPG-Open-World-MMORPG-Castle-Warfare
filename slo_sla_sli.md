# 🎯 SLI, SLO & SLA Targets (`slo_sla_sli.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

| Service Indicator (SLI)     | Internal Objective (SLO) |    External Agreement (SLA)    | Probe Source                  |
| :-------------------------- | :----------------------: | :----------------------------: | :---------------------------- |
| **Monthly Availability**    |        `>= 99.9%`        |   `>= 99.5%` (`LEGAL.md `6`)   | `GET /healthz`                |
| **20Hz Siege Tick Budget**  |      `p95 <= 35ms`       | `< 50ms` (`overrunCount == 0`) | `GET /api/ops/readiness`      |
| **HTTP API p95 Latency**    |        `<= 75ms`         |           `<= 250ms`           | `scripts/verify-readiness.ts` |
| **Save Recovery Integrity** | `100%` SHA-256 verified  |     Zero silent truncation     | `AtomicRealmPersistence`      |
