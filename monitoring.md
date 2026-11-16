# 📈 Observability, Telemetry & Monitoring Runbook (`monitoring.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)
- **Primary Escalation Contact**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **SLA Uptime Target**: `>= 99.5%` Monthly Uptime (`LEGAL.md §6`)

---

## 1. Built-In Health, Readiness & Telemetry Endpoints

`server.ts` exposes six structured JSON observability endpoints on port `3000`:

| Endpoint                             |       Auth Required        | Purpose & Key Telemetry Fields                                                                                                                                                                              | Target Response                |
| :----------------------------------- | :------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| `GET /healthz` (alias `/api/health`) |            None            | Lightweight container liveness probe (`ok`, `status: "healthy"`, `uptimeSec`). Returns `503` when `isShuttingDown` is true.                                                                                 | `HTTP 200` (`< 5ms`)           |
| `GET /readyz`                        |            None            | Deep readiness probe evaluating 5 subsystem checks: `notShuttingDown`, `storageWritable`, `recoveredFromBackup`, `tickBudgetHealthy` (`overrunCount < 50`), and `wsCapacityAvailable` (`peers.size < 250`). | `HTTP 200` (`status: "ready"`) |
| `GET /api/ops/readiness`             |            None            | Full operational metrics snapshot: `tickLatency` (`p50Ms`, `p95Ms`, `maxMs`, `overrunCount`, `budgetMs: 50`), `persistence` health, `opsCounters`, and capacity utilization.                                | `HTTP 200`                     |
| `GET /api/online/status`             |            None            | Multi-region replication quorum (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`), active sector FNV-1a `stateHash`, connected peer counts, and email-redacted commander roster.     | `HTTP 200`                     |
| `GET /api/online/anti-cheat`         |            None            | Authoritative Anti-Cheat telemetry (`windowMs`, `strikeLimit`, `activeQuarantinedCount`, `opsCounters.antiCheatRejections`, `antiCheatSanitizedWrites`, `antiCheatStrikeLockouts`).                         | `HTTP 200`                     |
| `GET /api/admin/state`               | Staff Session (`Lv. 300+`) | Full `securityAuditLog` ring buffer (`<= 500` entries), moderated player roster, open support tickets, and active global decrees.                                                                           | `HTTP 200` (or `401`/`403`)    |

---

## 2. The Four Golden Signals & SLO Thresholds

### 1. Latency (Authoritative 20Hz Siege Loop & HTTP API)

- **20Hz Siege Tick Loop (`TickLatencyTracker` in `src/game/serverHardening.ts`)**:
  - Rolling window of `200` ticks (`10 seconds` of real-time history) against a hard **`50.0 ms` tick budget**.
  - **Healthy SLO**: `p50Ms <= 2.0 ms`, `p95Ms <= 10.0 ms`, `maxMs <= 35.0 ms`, `overrunCount === 0`.
  - **50-Player Raid Duplication Budget (`src/game/avatarCloneShadow.ts`)**: `50 Avatars + 150 Clones = 200 Tracked Entities` consumes `~7.55 ms` per tick using `8-byte` relative `int16` delta packets (`withinTickBudget: true`).
- **HTTP API Latency**:
  - Read endpoints (`/api/online/status`, `/readyz`): `p95 <= 25 ms`.
  - Write endpoints (`/api/online/sync`, `/api/db/*`): `p95 <= 120 ms`.

### 2. Traffic & Capacity Bounds (`OPERATIONAL_LIMITS`)

- **Concurrent WebSocket Peers (`MAX_WS_PEERS`)**: Hard limit of **`250` total peers** and **`12` peers per IP** (`MAX_WS_PEERS_PER_IP`).
- **WebSocket Frame & Message Rate**: Max frame size **`32 KiB`**, max per-peer RX buffer **`64 KiB`**, max **`30 messages / second`** per peer.
- **HTTP Write Rate Limit**: **`120` mutating requests / minute / IP** (`VOXEL_API_WRITE_LIMIT_PER_MIN`).

### 3. Errors & Exploit Counters (`opsCounters`)

Monitor the monotonic counters returned by `GET /api/ops/readiness`:

- `rateLimitBlocks`: Spike indicates API scraping or flood behavior (`HTTP 429`).
- `csrfBlocks`: Spike indicates cross-origin forgery attempts against cookie-authenticated routes (`HTTP 403`).
- `prototypePollutionBlocks`: Indicates malicious `__proto__` / `constructor` payloads (`HTTP 400`).
- `wsFramesRejected` / `wsRateLimitDisconnects` / `wsSlowConsumerDisconnects`: Indicates malformed RFC 6455 frames, flooders, or stalled clients.
- `antiCheatRejections` / `antiCheatStrikeLockouts`: Indicates speed-hack, teleport, sequence replay, or stat-tampering attempts blocked by `src/game/antiCheat.ts`.

### 4. Saturation (Storage & Memory Bounded Collections)

To prevent unbounded heap growth (`OOM`), `server.ts` enforces deterministic pruning on every save:

- `commanders`: Pruned to **`<= 5,000`** entries (`pruneCommanderMap`).
- `supportTickets`: Capped at **`<= 500`** entries.
- `securityAuditLog`: Capped at **`<= 500`** entries.
- `activeDecrees`: Capped at **`<= 100`** entries.

---

## 3. Security Audit Log Events (`securityAuditLog`)

Every security-relevant action is recorded in `store.securityAuditLog` with an ISO timestamp, actor email, role, outcome (`allowed` | `denied`), and detail string:

| Event Type                                  | Trigger Condition                                                                              | Alert Severity |
| :------------------------------------------ | :--------------------------------------------------------------------------------------------- | :------------: |
| `ADMIN_LOGIN_SUCCESS`                       | Operator authenticated via `/api/auth/admin-login` or verified Firebase Admin token            |      Info      |
| `ADMIN_LOGIN_FAILED`                        | Invalid passkey or unauthorized email on `/api/auth/admin-login` (`>= 5` triggers 15m lockout) |    Warning     |
| `AUTHZ_DENIED`                              | Unauthenticated (`401`), insufficient RBAC clearance (`403`), or prototype pollution attempt   |    Warning     |
| `MODERATION_APPLIED`                        | Staff executed `warn`, `mute`, `temp_ban`, `perm_ban`, or role change                          |  Info / Audit  |
| `ANTI_CHEAT_TRIGGERED`                      | Kinematic teleport, replay seq, economy inflation, or rally cap violation blocked              |    Warning     |
| `ANTI_CHEAT_PARDON`                         | GM cleared a commander's anti-cheat quarantine via `/api/admin/anti-cheat/pardon`              |  Info / Audit  |
| `DECREE_ISSUED` / `SPECIES_REBIRTH_TOGGLED` | Global GM decree broadcast or global species-switch gate toggled                               |  Info / Audit  |

---

## 4. Quick CLI Monitoring Commands

```bash
# Inspect live readiness, tick latency (p50/p95/max), and exploit counters
curl -s http://localhost:3000/api/ops/readiness | npx prettier --parser json

# Inspect multi-region quorum & active 50v50 siege sector state hash
curl -s http://localhost:3000/api/online/status | npx prettier --parser json

# Inspect authoritative anti-cheat strike & quarantine telemetry
curl -s http://localhost:3000/api/online/anti-cheat | npx prettier --parser json
```
