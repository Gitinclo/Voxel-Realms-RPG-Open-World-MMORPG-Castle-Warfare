# 🚨 Incident Response, Quarantine & Recovery Runbook (`incident response.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)
- **Incident Commander & Root Owner**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Related Runbooks**: [`monitoring.md`](./monitoring.md) · [`backups.md`](./backups.md) · [`environment hardening.md`](./environment%20hardening.md) · [`deployment validation.md`](./deployment%20validation.md)

---

## 1. Incident Severity Classification & SLA Response Times

| Severity  | Classification                             | Trigger Conditions                                                                                                                                        | Response SLA |  Resolution / Mitigation Target   |
| :-------: | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------: | :-------------------------------: |
| **SEV-1** | **Critical Outage / Security Breach**      | `/healthz` or `/readyz` returning `503` for `> 2 min`; primary + `.bak` storage failure; unauthorized privilege escalation; Cloud SQL / Firestore outage. | `< 15 mins`  | `< 1 hour` (Rollback or failover) |
| **SEV-2** | **Degraded Multiplayer / Siege Desync**    | 20Hz `/ws/siege` tick `p95 > 40ms` or `overrunCount >= 50`; sustained WebSocket flood/DDoS; regional quorum desync.                                       | `< 30 mins`  |            `< 4 hours`            |
| **SEV-3** | **Localized Subsystem / Anti-Cheat Spike** | False-positive anti-cheat quarantine wave; Gmail OAuth token refresh issue; non-critical UI modal error.                                                  | `< 4 hours`  |           `< 24 hours`            |
| **SEV-4** | **Minor / Cosmetic Defect**                | Visual shader/LOD artifact on a specific GPU; typo or documentation update.                                                                               | `< 24 hours` |      Next scheduled release       |

---

## 2. Standard Incident Response Playbooks

### Playbook A — Dev or Production Server Fails to Start / Port `3000` Unresponsive (`SEV-1`)

1. **Diagnose**:
   ```bash
   ps -ef
   curl -i http://localhost:3000/healthz
   curl -i http://localhost:3000/readyz
   ```
2. **Verify Environment Config (`resolveServerRuntimeSecurityConfig`)**:
   - If `NODE_ENV=production`, confirm `VOXEL_SESSION_SECRET` (`>= 32` chars) and `VOXEL_ADMIN_PASSKEY` (`>= 12` chars) are set and not `.env.example` placeholders.
3. **Verify Lockfile & Cold-Boot Speed**:
   - Ensure `bun.lock` is present so container dependency checks complete in `< 50ms` and `server.ts` binds `0.0.0.0:3000` immediately while `viteReadyPromise` initializes asynchronously.

### Playbook B — Corrupted or Truncated Realm Save (`SEV-1` / `SEV-2`)

1. **Automatic `.bak` Healing**:
   - On startup, `AtomicRealmPersistence` (`src/game/serverPersistence.ts`) automatically detects SHA-256 mismatches on `data/online_realm_state.json`, quarantines the damaged file to `data/online_realm_state.json.corrupt-<timestamp>`, and restores `data/online_realm_state.json.bak`.
2. **Confirm Recovery Status**:
   ```bash
   curl -s http://localhost:3000/api/ops/readiness | grep -E "writable|recoveredFromBackup|recoveryReason"
   ```
3. **Manual Cloud SQL / Firestore Restore**:
   - Follow the `pg_restore` and `gcloud firestore import` commands in [`backups.md`](./backups.md).

### Playbook C — Multiplayer Exploit, Speed-Hack Wave, or False-Positive Quarantine (`SEV-2` / `SEV-3`)

1. **Inspect Live Anti-Cheat Telemetry**:
   ```bash
   curl -s http://localhost:3000/api/online/anti-cheat | npx prettier --parser json
   ```
2. **Pardon a Falsely Quarantined Commander (Staff / GM Clearance `Lv. 800+`)**:
   - Authenticate as `creatergame31@gmail.com` via the **GM / Admin Console** (`AdminConsoleModal.tsx`) or dispatch:
     ```bash
     curl -X POST http://localhost:3000/api/admin/anti-cheat/pardon \
       -H "Content-Type: application/json" \
       -b "voxel_realm_session=<verified-operator-cookie>" \
       -d '{"commanderId":"<target-commander-id>"}'
     ```
3. **Sanction aConfirmed Exploiter**:
   - Issue a `temp_ban` or `perm_ban` via `POST /api/admin/moderation` (root account `creatergame31@gmail.com` is protected by immutable root guardrails and can never be sanctioned).

### Playbook D — Emergency Session Secret Rotation (`SEV-1`)

If an operator session cookie is ever suspected of compromise:

1. Generate a new 256-bit secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `VOXEL_SESSION_SECRET` and `VOXEL_ADMIN_PASSKEY` in the deployment secret manager and restart `server.ts`. All previously minted HMAC-SHA256 cookies are invalidated immediately.

---

## 3. Blameless Post-Mortem Template

After resolving any `SEV-1` or `SEV-2` incident, file a Post-Mortem record containing:

1. **Incident Summary & Impact Window** (UTC start/end timestamps, affected sectors/endpoints).
2. **Root Cause Analysis (5 Whys)**.
3. **Detection & Mitigation Timeline** (which `/readyz` or `opsCounters` metric triggered the alert).
4. **Regression Guardrail Added** (new unit test in `src/game/*.test.ts` or new invariant in `src/game/systemValidation.ts` ensuring the defect can never recur).
