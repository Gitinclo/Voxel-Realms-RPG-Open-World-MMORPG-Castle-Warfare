# Voxel Realms RPG — Pre-Launch Production Gate Checklist (Target: `30/03/2030`)

**Last Updated:** `20/11/2026`  
**Target Public Game Launch Date:** `30/03/2030` (`2030-03-30`)  
**Current Maturity:** `Pre-Production Prototype` (`v1.5.0`)

This document tracks every infrastructure, performance, security, legal, and release gate required before accepting public MMO traffic or publishing the first signed `v*` GitHub release.

---

## 1. Managed PostgreSQL (Cloud SQL) & Live Drizzle Migrations

| Check                                                                                 | Status      | Evidence / Verification                                                                                                                              |
| :------------------------------------------------------------------------------------ | :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provision Cloud SQL PostgreSQL instance                                               | **DONE**    | Instance `ai-studio-416287a7` provisioned in `asia-southeast1` (project `dev-ivy-6v0ns`)                                                             |
| Push Drizzle ORM schema (`src/db/schema.ts`) to live PostgreSQL                       | **DONE**    | `drizzle-kit push` applied all 7 tables + `UNIQUE INDEX economy_ledger_cmdr_idem_uidx` + FK constraints                                              |
| Verify live schema against `information_schema.columns`                               | **DONE**    | All 7 tables (`users`, `commander_profiles`, `realm_saves`, `support_tickets`, `economy_accounts`, `economy_ledger_entries`, `realm_snapshots`) live |
| Auto-enable PostgreSQL ACID economy backend (`SELECT ... FOR UPDATE`) when configured | **DONE**    | `server.ts` selects `AuthoritativeEconomyService` (`postgres`) automatically when `SQL_HOST`/`SQL_USER`/`SQL_DB_NAME` are present                    |
| Enable automated daily backups, PITR (`>= 7d`), and staging restore drill             | **PENDING** | Configure on production GCP Cloud SQL instance and record restore RTO in [`../backups.md`](../backups.md)                                            |

---

## 2. Redis Coordination, TLS 1.3 & Kubernetes Deployment (`k8s/`)

Repository manifests are committed and unit-validated in [`../src/server/infraReadiness.test.ts`](../src/server/infraReadiness.test.ts):

- [`../k8s/namespace-and-config.yaml`](../k8s/namespace-and-config.yaml) — Restricted PodSecurity namespace, production `ConfigMap` (`VOXEL_ECONOMY_BACKEND=postgres`, `VOXEL_TRUST_PROXY`), and Secret Manager template.
- [`../k8s/redis.yaml`](../k8s/redis.yaml) — Non-root Redis StatefulSet (swap for GCP Memorystore / managed Redis REST in production) backing `REDIS_REST_URL` / `REDIS_REST_TOKEN`.
- [`../k8s/deployment.yaml`](../k8s/deployment.yaml) — Non-root `voxel-realms-server` Deployment with read-only root filesystem, Cloud SQL Auth Proxy sidecar, `/healthz` + `/readyz` probes, Prometheus `/metrics` scrape annotations, `PodDisruptionBudget`, and `HorizontalPodAutoscaler`.
- [`../k8s/ingress-tls.yaml`](../k8s/ingress-tls.yaml) — `cert-manager` Let's Encrypt TLS 1.3 `ClusterIssuer` + NGINX `Ingress` configured for 3600s `/ws/siege` WebSocket sessions and cookie affinity.

**External Operator Action Required:**

1. Bind GCP Workload Identity (`voxel-realms-sa`) to Cloud SQL Client & Secret Manager Secret Accessor roles.
2. Replace placeholder values in `voxel-realms-secrets` via External Secrets Operator or GCP Secret Manager.
3. Apply `kubectl apply -f k8s/` to the staging cluster and confirm `https://<staging-host>/api/ops/readiness` returns `"economyBackend":"postgres"` and `"coordinationBackend":"redis_rest"`.

---

## 3. Multi-Hour External Load & Soak Testing (`loadtest/`)

Automated soak suites are committed under [`../loadtest/`](../loadtest/):

- **k6 (HTTP + 20Hz WebSocket):**
  ```bash
  k6 run -e BASE_URL=https://staging.voxelrealms.example.com -e DURATION=4h -e VUS=150 loadtest/k6-soak.js
  ```
- **Artillery (Multi-Phase HTTP Economy Ramp):**
  ```bash
  npx artillery run --target https://staging.voxelrealms.example.com loadtest/artillery-siege.yml
  ```

**Exit Criteria (must pass on live staging for `>= 4 hours` continuously):**

- `http_req_failed < 0.1%` (`0` HTTP `500`/`503` responses)
- `http_req_duration p95 < 100ms`, `p99 < 250ms`
- `20Hz` tick loop `overrunCount == 0` under sustained `/ws/siege` load
- Stable container RSS memory (`< 5%` drift between hour 1 and hour 4 — no heap leak)
- PostgreSQL connection pool saturation `< 70%` (`pg_stat_activity`) with zero deadlocks

---

## 4. Independent Security Review Scope

Before public launch (`30/03/2030`), engage an external security reviewer against the live staging cluster covering:

1. **Authentication & Session Revocation:** HMAC-SHA256 `vr_session` cookie signing, Firebase ID token verification (`/api/auth/firebase-exchange`), server-side revocation across pods after `/api/auth/logout` and `DELETE /api/online/account`, and `/ws/siege` Origin/CSWSH checks.
2. **Authoritative Economy & Anti-Cheat:** Concurrent `castle-upgrade`, `purchase-troops`, `market-trade`, and `claim-action` race-condition fuzzing against live PostgreSQL `SELECT ... FOR UPDATE` + `UNIQUE (commander_id, idempotency_key)`.
3. **RBAC & Data Isolation:** `/api/admin/*`, `/api/db/*` role boundaries, Cloud Firestore `firestore.rules` default-deny enforcement, and DSR export/delete completeness across PostgreSQL + Firestore + Redis.
4. **Edge & Container Hardening:** Production CSP (no `'unsafe-eval'`), HSTS, `VOXEL_TRUST_PROXY` IP spoofing tests, non-root container escape checks, and zero High/Critical CVEs (`npm audit --audit-level=high` + container image Trivy scan).

---

## 5. Legal & Policy Review Checklist

Have qualified legal counsel review and sign off on all player-facing legal documents before public commercial release:

- [`../EULA.md`](../EULA.md) & `src/game/eula.ts` (v1.5.0 End User License Agreement, dispute resolution, virtual currency/non-monetary VIP disclosures).
- [`../LEGAL.md`](../LEGAL.md) (Terms of Service, Privacy Policy, Cookie Policy, DMCA/IP notices, age-gating / COPPA / GDPR / CCPA compliance).
- [`../AI_USAGE_POLICY.md`](../AI_USAGE_POLICY.md) (Platform AI/procedural content disclosures for Steam / web distribution).
- Confirm DSR (`DELETE /api/online/account`) retention windows and backup purge SLAs align with Privacy Policy commitments.

---

## 6. Publishing a Signed `v*` GitHub Release

No `v*` tag should be pushed until Gates 1–5 are signed off for the target release milestone. When ready:

```bash
# 1. Verify clean local validation, ops probe, and E2E suite on main
npm run validate && npm run verify:ops && npm run verify:e2e

# 2. Create a GPG- or SSH-signed annotated release tag
git tag -s v1.5.0 -m "Voxel Realms RPG v1.5.0 — Staging/Beta Release Candidate"

# 3. Verify tag signature locally before pushing
git tag -v v1.5.0

# 4. Push signed tag to trigger .github/workflows/release.yml (builds checksummed release bundle)
git push origin v1.5.0
```
