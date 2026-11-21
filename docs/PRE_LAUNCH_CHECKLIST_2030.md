# Voxel Realms RPG — Pre-Launch Production Gate Checklist (Target: `30/03/2030`)

**Last Updated:** `20/11/2026`  
**Target Public Game Launch Date:** `30/03/2030` (`2030-03-30`)  
**Current Maturity:** `Pre-Production Prototype` (`v1.5.0`)

This document tracks every infrastructure, performance, security, legal, and release gate required before accepting public MMO traffic or publishing the first signed `v*` GitHub release. Record completed evidence for each release candidate in [`./release-evidence-template.md`](./release-evidence-template.md).

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

## 2. Kustomize Overlays, External Secrets, Redis Coordination, TLS 1.3 & Observability (`k8s/`)

Repository manifests are organized as Kustomize base + environment overlays and unit-validated in [`../src/server/infraReadiness.test.ts`](../src/server/infraReadiness.test.ts):

- [`../k8s/base/`](../k8s/base/) — Restricted PodSecurity namespace, non-secret `ConfigMap` (zero raw `Secret` `stringData`), Workload Identity `ServiceAccount` (`voxel-realms-sa`), `Deployment` with parameterized Cloud SQL Auth Proxy, staging Redis (TLS + `--requirepass`) + HTTP REST coordination sidecar, `ClusterIssuer` + TLS 1.3 WebSocket `Ingress`, PDB, and HPA.
- [`../k8s/external-secret.yaml`](../k8s/external-secret.yaml) — External Secrets Operator `SecretStore` + `ExternalSecret` binding GCP Secret Manager into `voxel-realms-secrets`.
- [`../k8s/networkpolicy.yaml`](../k8s/networkpolicy.yaml) — Default-deny ingress/egress + least-privilege namespace NetworkPolicies.
- [`../k8s/service-monitor.yaml`](../k8s/service-monitor.yaml) & [`../k8s/pod-monitor.yaml`](../k8s/pod-monitor.yaml) — Prometheus Operator scraping + Alertmanager SLO rules (`Voxel20HzTickOverrunDetected`, `VoxelHighIngress5xxRate`, `VoxelHighIngressLatencyP95`, `VoxelHighPodMemoryUtilization`, `VoxelPodRestarting`, `VoxelCertExpiringSoon`).
- [`../k8s/overlays/staging/`](../k8s/overlays/staging/) & [`../k8s/overlays/production/`](../k8s/overlays/production/) — Environment-specific hosts, Cloud SQL connection names, Workload Identity SAs, HA replica bounds (`3–20`, `PDB minAvailable: 2`), and automatic removal of the single-replica in-cluster Redis StatefulSet in production to enforce HA managed Redis.

**External Operator Action Required (see [`../runbooks/cluster-rollout.md`](../runbooks/cluster-rollout.md) & [`../runbooks/certificate-troubleshooting.md`](../runbooks/certificate-troubleshooting.md)):**

1. Bind GCP Workload Identity (`voxel-realms-sa`) to `roles/cloudsql.client` and `roles/secretmanager.secretAccessor`.
2. Populate required keys in GCP Secret Manager and verify `ExternalSecret` reports `Synced=True`.
3. Trigger [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml) to apply `k8s/overlays/staging`, verify `/healthz`, `/readyz`, `/api/ops/readiness` (`economyBackend=postgres`, `coordinationBackend=redis_rest`), live TLS handshake (`openssl s_client`), and archive rollout evidence.

---

## 3. Multi-Hour External Load & Soak Testing (`loadtest/`)

Hardened 4-hour soak suites are committed under [`../loadtest/`](../loadtest/) and automated via [`.github/workflows/staging-soak.yml`](../.github/workflows/staging-soak.yml) (see [`../runbooks/staging-soak.md`](../runbooks/staging-soak.md)):

- **k6 (HTTP + Long-Lived 20Hz `/ws/siege` + RSS Drift Observer + JSON/JUnit Export):**
  ```bash
  k6 run --summary-export soak/k6-summary.json --out json=soak/k6-results.json \
    -e BASE_URL=https://staging.voxelrealms.gg -e DURATION=4h -e VUS=150 loadtest/k6-soak.js
  ```
- **Artillery (4-Hour / 14,400s Continuous Multi-Phase HTTP Ramp):**
  ```bash
  npx artillery run --target https://staging.voxelrealms.gg \
    --output soak/artillery-report.json loadtest/artillery-siege.yml
  ```

**Exit Criteria (must pass on live staging for `>= 4 hours` continuously):**

- `http_req_failed < 0.1%` (`0` HTTP `500`/`503` responses, `voxel_http_429_rate < 2%`, `voxel_ws_error_rate < 0.1%`)
- `http_req_duration p95 < 100ms`, `p99 < 250ms`
- `20Hz` tick loop `overrunCount == 0` under sustained long-lived 20Hz `/ws/siege` load
- Stable container RSS memory (`< 5%` drift between hour 1 and hour 4 — no heap leak) and `0` pod restarts
- PostgreSQL connection pool saturation `< 70%` (`pg_stat_activity`) with `0` deadlocks

---

## 4. Independent Security Review Scope

Before public launch (`30/03/2030`), engage an external security reviewer against the live staging cluster covering:

1. **Authentication & Session Revocation:** HMAC-SHA256 `vr_session` cookie signing, Firebase ID token verification (`/api/auth/firebase-exchange`), server-side revocation across pods after `/api/auth/logout` and `DELETE /api/online/account`, and `/ws/siege` Origin/CSWSH checks.
2. **Authoritative Economy & Anti-Cheat:** Concurrent `castle-upgrade`, `purchase-troops`, `market-trade`, and `claim-action` race-condition fuzzing against live PostgreSQL `SELECT ... FOR UPDATE` + `UNIQUE (commander_id, idempotency_key)`.
3. **RBAC & Data Isolation:** `/api/admin/*`, `/api/db/*` role boundaries, Cloud Firestore `firestore.rules` default-deny enforcement, Kubernetes `NetworkPolicy` isolation, and DSR export/delete completeness across PostgreSQL + Firestore + Redis.
4. **Edge & Container Hardening:** Production CSP (no `'unsafe-eval'`), HSTS, `VOXEL_TRUST_PROXY` IP spoofing tests, non-root container escape checks, and zero High/Critical CVEs (`npm audit --audit-level=high` + Trivy container scan in `release-gates.yml` / `release.yml`).

---

## 5. Legal & Policy Review Checklist

Have qualified legal counsel review and sign off on all player-facing legal documents before public commercial release:

- [`../EULA.md`](../EULA.md) & `src/game/eula.ts` (v1.5.0 End User License Agreement, dispute resolution, virtual currency/non-monetary VIP disclosures).
- [`../LEGAL.md`](../LEGAL.md) (Terms of Service, Privacy Policy, Cookie Policy, DMCA/IP notices, age-gating / COPPA / GDPR / CCPA compliance).
- [`../AI_USAGE_POLICY.md`](../AI_USAGE_POLICY.md) (Platform AI/procedural content disclosures for Steam / web distribution).
- Confirm DSR (`DELETE /api/online/account`) retention windows and backup purge SLAs align with Privacy Policy commitments.

---

## 6. Publishing a Signed `v*` GitHub Release

No `v*` tag should be pushed until all 24 gates in [`./release-evidence-template.md`](./release-evidence-template.md) and [`.github/workflows/release-gates.yml`](../.github/workflows/release-gates.yml) are signed off (full procedure in [`../runbooks/release-cut.md`](../runbooks/release-cut.md)):

```bash
git checkout main && git pull --ff-only origin main
npm ci && npm run validate && npm run verify:ops && npm run verify:e2e

git tag -s v1.5.0 -m "Voxel Realms RPG v1.5.0"
git rev-parse v1.5.0^{}
git verify-tag v1.5.0
git push origin v1.5.0
```

Pushing a GPG/SSH-signed tag triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml) under the protected `production-release` environment, verifying the tag signature, running Trivy + E2E, generating `SBOM.cdx.json`, `SBOM.spdx.json`, `provenance.json`, `release-attestation.json`, `SHA256SUMS.txt`, and GitHub Build Provenance Attestations.
