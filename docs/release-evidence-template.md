# Voxel Realms RPG — Release Evidence & 24-Gate Sign-Off Record

Copy this template to `docs/releases/vX.Y.Z-evidence.md` for each release candidate and complete **every** row with verifiable artifact URLs, digests, and approver signatures before running `git tag -s`.

- **Release Tag:** `vX.Y.Z`
- **Commit SHA:** `<40-char-sha>`
- **Target Launch Milestone:** `30/03/2030`
- **Staging Rollout Workflow Run:** `<GitHub Actions deploy-staging.yml URL>`
- **4-Hour Soak Workflow Run:** `<GitHub Actions staging-soak.yml URL>`
- **Release Gates Workflow Run:** `<GitHub Actions release-gates.yml URL>`

---

## Mandatory 24-Gate Pre-Tag Checklist

### Cluster Rollout, TLS, Secrets & HA Infrastructure (Gates 1–8)

- [ ] **1. Signed/approved cluster rollout** — Artifact: `staging-rollout-evidence-<run_id>`
- [ ] **2. Live staging health and readiness probes pass** — `/healthz`, `/readyz`, `/api/ops/readiness` HTTP 200
- [ ] **3. Live certificate chain, expiry, and TLS handshake verified** — `openssl s_client` verify code `0 (ok)`
- [ ] **4. DNS points only to intended ingress** — `dig` A/AAAA record matches ingress LoadBalancer IP
- [ ] **5. Secret Manager bindings verified** — ExternalSecret `Synced=True`, zero raw `Secret` manifests in Git
- [ ] **6. Kubernetes rollout completes** — `kubectl rollout status` succeeded cleanly with `0` failed pods
- [ ] **7. PDB and HPA behavior verified** — `PodDisruptionBudget` and `HorizontalPodAutoscaler` active and tested
- [ ] **8. Redis and PostgreSQL connectivity verified** — `/api/ops/readiness` confirms `economyBackend=postgres` and `coordinationBackend=redis_rest`

### Multi-Hour Load & Soak SLO Evidence (Gates 9–16)

- [ ] **9. k6 soak ran for >= 4 hours** — Artifact: `soak/k6-summary.json`, `soak/k6-junit.xml`
- [ ] **10. Artillery soak ran for >= 4 hours** — Artifact: `soak/artillery-report.json`
- [ ] **11. No HTTP 500/503 responses** — Observed count: `0`
- [ ] **12. HTTP p95 < 100 ms** — Observed p95: `___ ms`
- [ ] **13. HTTP p99 < 250 ms** — Observed p99: `___ ms`
- [ ] **14. Memory drift < 5%** — Pre-soak RSS: `___ MB`, Post-soak RSS: `___ MB`, Drift: `___%`
- [ ] **15. PostgreSQL pool saturation < 70%** — Peak active/max connections: `___ / ___`
- [ ] **16. Zero deadlocks and restarts** — PostgreSQL deadlocks: `0`, K8s container restarts: `0`, 20Hz tick overruns: `0`

### Independent Security & Legal Sign-Off (Gates 17–20)

- [ ] **17. Independent penetration test completed** — Firm / Report ID / Date: `___________`
- [ ] **18. High/Critical findings remediated** — Re-test confirmation attached; Trivy CRITICAL/HIGH = `0`
- [ ] **19. Legal counsel approved EULA and privacy terms** — Counsel sign-off reference: `___________`
- [ ] **20. Refund/monetization terms approved** — Counsel sign-off reference: `___________`

### Supply-Chain Attestation, Signed Tag & Independent Approval (Gates 21–24)

- [ ] **21. SBOM and provenance attached** — `SBOM.cdx.json`, `SBOM.spdx.json`, `provenance.json`, `release-attestation.json`
- [ ] **22. SHA-256 manifest verified** — `sha256sum -c SHA256SUMS.txt` passed
- [ ] **23. GPG/SSH-signed tag verified** — `git verify-tag vX.Y.Z` key fingerprint: `___________`
- [ ] **24. Protected environments approved by independent approvers** — GitHub environment approval log attached

---

## Independent Sign-Offs

| Role                        | Name / Handle | Date (DD/MM/YYYY) | Approval Reference |
| --------------------------- | ------------- | ----------------- | ------------------ |
| Release Engineering Lead    |               |                   |                    |
| Security Reviewer           |               |                   |                    |
| Legal Counsel               |               |                   |                    |
| Independent Second Approver |               |                   |                    |
