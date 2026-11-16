# Analytics & Telemetry Taxonomy (`ANALYTICS_TAXONOMY.md`)

Privacy-safe metric naming conventions, readiness probe fields, and gameplay event taxonomy for **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Design Principles

- **Zero PII in Telemetry Streams**: Player email addresses are redacted from public `/api/online/status` outputs; operational metrics track opaque session/commander IDs, aggregate counts, and timing histograms.
- **Authoritative Metric Sources**: Performance and siege telemetry derive from live server counters (`serverHardening.ts`), `systemValidation.ts` invariant reports, and `architectOptimization.ts` hardware frames—never synthetic placeholder dashboards (`Clean UI` guardrail).

---

## 2. Operational Metric Namespace (`voxel_realms.*`)

| Metric Key                                  | Type                          | Unit                   | Source Endpoint / Module           |
| :------------------------------------------ | :---------------------------- | :--------------------- | :--------------------------------- |
| `voxel_realms.siege.tick_duration_ms`       | Histogram (`p50`/`p95`/`max`) | Milliseconds           | `server.ts` + `/api/ops/readiness` |
| `voxel_realms.siege.active_ws_peers`        | Gauge                         | Connections (`<= 250`) | `/api/online/status`, `/readyz`    |
| `voxel_realms.persistence.save_failures`    | Counter                       | Count                  | `serverPersistence.ts`             |
| `voxel_realms.persistence.bak_failovers`    | Counter                       | Count                  | `serverPersistence.ts`             |
| `voxel_realms.anticheat.violations_total`   | Counter (by rule)             | Events                 | `/api/online/anti-cheat`           |
| `voxel_realms.anticheat.quarantined_peers`  | Gauge                         | Commanders             | `AuthoritativeAntiCheatEngine`     |
| `voxel_realms.validation.invariants_passed` | Gauge                         | Score (`100 / 100`)    | `runFullSystemValidationReport()`  |

---

## 3. Gameplay Progression Taxonomy

- **`cultivation.realm_breakthrough`**: Path (`qi` | `body` | `soul` | `mind`), previous realm index, new realm index, tribulation outcome.
- **`castle.era_upgrade`**: Era tier (`1..10`), citadel level (`0..100`), troop capacity delta (`BigInt` string).
- **`lore.codex_discovered`**: Entry category (`biome` | `monster`), biome/monster ID, diamond reward claimed.
- **`legal.eula_accepted`**: Version (`v1.5.0-2026-11-15`), deterministic FNV-1a receipt code (`EULA-ACK-...`).
