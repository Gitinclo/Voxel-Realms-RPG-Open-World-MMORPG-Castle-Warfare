# 🚀 Deployment Validation Runbook (`deployment validation.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)
- **Release Authority**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Target Environments**: Google Cloud Run (`asia-southeast1`), Cloud SQL PostgreSQL (`ai-studio-416287a7`), Cloud Firestore (`dev-ivy-6v0ns`), and GitHub Releases (`.github/workflows/release.yml`)

---

## 1. Four-Stage Deployment Validation Pipeline

Every release candidate must pass four sequential validation stages before traffic promotion or Git tag publication:

```text
[Stage 1: Static & Unit Gate] ──► [Stage 2: Live Ops Harness] ──► [Stage 3: Data & Rules Sync] ──► [Stage 4: Post-Deploy Smoke]
       npm run validate                npm run verify:ops          Cloud SQL + firestore.rules       /healthz, /readyz & WS
```

---

## 2. Stage 1 — Static Analysis, Unit Tests & Bundle Gate (`npm run validate`)

Execute the unified 6-step validation command:

```bash
npm run validate
```

### Acceptance Criteria

1. **Lockfile Parity (`npm run lockfile:verify`)**: `package.json`, `package-lock.json`, and `bun.lock` are 100% synchronized.
2. **TypeScript Compiler (`npm run lint` → `tsc --noEmit`)**: `0` errors across all client, server (`server.ts`), database (`src/db/*`), and test files.
3. **Firestore Security Rules Linter (`npm run lint:rules` → `eslint firestore.rules`)**: `0` warnings or errors from `@firebase/eslint-plugin-security-rules`.
4. **Code Formatting (`npm run format:check` → `prettier --check .`)**: `100%` of tracked files conform to `.prettierrc`.
5. **Automated Test Suite (`npm test`)**: All **217 tests across 37 test files** pass (`0` failures), including the **9-Pillar Cross-System Integrity Audit (`109/109` invariants)** and the **Dirty Dozen (#1–#12) Firestore adversarial rule tests**.
6. **Production Bundle (`npm run build` → `vite build`)**:
   - Compiles cleanly to `dist/` with Rolldown vendor chunk splitting (`vendor-three`, `vendor-firebase`, `vendor-d3`, `vendor-react`, `vendor-icons`) and lazy-loaded modal chunks.
   - Zero chunk-size warnings (`chunkSizeWarningLimit: 750`).
7. **Dependency Audit (`npm audit --audit-level=high`)**: `0` high or critical vulnerabilities.

---

## 3. Stage 2 — Live Operational Readiness & Exploit Harness (`npm run verify:ops`)

Execute the automated live-server verification script (`scripts/verify-readiness.ts`):

```bash
npm run verify:ops
```

### What `verify:ops` Validates Against a Real Isolated `server.ts` Process

1. **Cold-Boot & Health Probes**:
   - Binds port immediately and returns `HTTP 200` on `GET /healthz` and `GET /readyz` (`status: "ready"`, `storageWritable: true`).
2. **50-Way Concurrent HTTP & 20Hz WebSocket Siege Load**:
   - Dispatches `200` concurrent HTTP requests while maintaining `12` simultaneous RFC 6455 WebSocket peers on `/ws/siege?sector=B2`.
   - Verifies `S2C_FULL_SIEGE_SNAPSHOT` (`0x10`) and `S2C_DELTA_SIEGE_UPDATE` (`0x11`) frames stream at `20Hz` (`50ms`) with **`0` tick budget overruns**.
3. **Fail-Closed RBAC & Exploit Defenses**:
   - Unauthenticated `GET /api/admin/state` and `POST /api/admin/moderation` → rejected with **`HTTP 401`**.
   - Low-clearance player session attempting `/api/admin/*` → rejected with **`HTTP 403`**.
   - Unauthenticated or forged-Bearer calls to `/api/db/profile`, `/api/db/save`, and `/api/db/tickets` → rejected with **`HTTP 401`**.
   - Cross-origin cookie mutation without matching `Origin`/`Referer` → rejected with **`HTTP 403` (CSRF blocked)**.
   - JSON payload containing `__proto__` or `constructor.prototype` → rejected with **`HTTP 400`**.
   - 5 consecutive bad operator passkeys on `/api/auth/admin-login` → locked out with **`HTTP 429`** and `Retry-After` header.
   - Authoritative Anti-Cheat (`src/game/antiCheat.ts`) rejects out-of-bounds teleports, stale `clientSeq` replays, and `> 1T` rally exploits.
4. **Crash Recovery & Graceful Shutdown**:
   - Corrupts/truncates `online_realm_state.json` and verifies automatic failover recovery from the verified `.bak` snapshot (`recoveredFromBackup: true`).
   - Sends `SIGTERM` and verifies clean WebSocket close frames (`1001`) and atomic disk flush within deadline.

---

## 4. Stage 3 — Database Schema & Security Rules Validation

1. **Cloud SQL PostgreSQL (`ai-studio-416287a7`)**:
   - Verify `src/db/schema.ts` matches deployed tables (`users`, `commander_profiles`, `realm_saves`, `support_tickets`).
   - Ensure `src/db/index.ts` lazily initializes `pg.Pool` so cold container boots never block on idle database sockets.
2. **Cloud Firestore (`ai-studio-voxelrealmsrpgop-416287a7-e9eb-4cc3-b431-b5f2455f192b`)**:
   - Confirm `firestore.rules` and `firebase-blueprint.json` are in sync and pass `npm run test:rules`.

---

## 5. Stage 4 — Post-Deployment Live Smoke Check

Immediately after deploying to Cloud Run or starting the production server (`NODE_ENV=production npm start`), run the post-deploy smoke checks:

```bash
# 1. Verify liveness & readiness
curl -fsS https://<deployed-host>/healthz
curl -fsS https://<deployed-host>/readyz

# 2. Verify detailed operational telemetry
curl -fsS https://<deployed-host>/api/ops/readiness

# 3. Verify public online realm status (confirm emails are redacted)
curl -fsS https://<deployed-host>/api/online/status

# 4. Verify unauthenticated admin access fails closed with HTTP 401
curl -i -s https://<deployed-host>/api/admin/state | head -n 1
```

### Rollback Trigger Criteria

Initiate an immediate rollback (see [`incident response.md`](./incident%20response.md)) if any of the following occur within 15 minutes of deployment:

- `/readyz` returns `HTTP 503` (`degraded` or `storageWritable: false`).
- 20Hz Siege tick `p95` latency exceeds `35ms` or `overrunCount` climbs continuously.
- Any `/api/admin/*` or `/api/db/*` endpoint fails to return `401`/`403` on unauthenticated probes.
