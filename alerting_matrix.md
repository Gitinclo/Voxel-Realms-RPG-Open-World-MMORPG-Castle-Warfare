# 🚨 Alerting & Notification Matrix (`alerting_matrix.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

| Alert Condition                         | Severity | Telemetry Field                  | Target Responder                            |
| :-------------------------------------- | :------: | :------------------------------- | :------------------------------------------ |
| `/healthz` or `/readyz` non-200 `> 60s` | `SEV-1`  | HTTP status / `checks`           | Primary On-Call / `creatergame31@gmail.com` |
| `tickLatency.overrunCount >= 50`        | `SEV-2`  | `/api/ops/readiness`             | Engine & Netcode On-Call                    |
| `bruteForceLockouts` burst              | `SEV-2`  | `opsCounters.bruteForceLockouts` | Security Maintainer                         |
| `antiCheatStrikeLockouts` spike         | `SEV-3`  | `/api/online/anti-cheat`         | Game Master Queue                           |
