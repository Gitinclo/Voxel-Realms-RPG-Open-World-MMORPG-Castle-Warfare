# Runbook: Multi-Hour Staging Load & Soak Execution (`k6` + `Artillery`)

**Last Updated:** `20/11/2026`  
**Release Gate Requirement:** Continuous `>= 4 hours` on an approved staging cluster (NEVER run against production or placeholder `example.com` hosts).

---

## 1. Pre-Soak Safety & Baseline Checks

1. Confirm staging deployment is healthy and using managed PostgreSQL + Redis REST:
   ```bash
   export STAGING_URL="https://staging.voxelrealms.gg"
   curl --fail --show-error "${STAGING_URL}/healthz"
   curl --fail --show-error "${STAGING_URL}/api/ops/readiness" | tee soak/pre-ops-readiness.json
   ```
2. Record starting Kubernetes pod restart count and Prometheus metrics:
   ```bash
   kubectl get pods -n voxel-realms -o wide | tee soak/pre-pods.txt
   ```
3. Verify `ServiceMonitor` (`k8s/service-monitor.yaml`) and `PodMonitor` (`k8s/pod-monitor.yaml`) are actively scraping `/metrics` in Prometheus.

---

## 2. Executing the 4-Hour Soak Suites

Prefer GitHub Actions workflow `.github/workflows/staging-soak.yml` so JSON, JUnit XML, and memory-drift verdicts are archived for 90 days automatically.

### Manual `k6` Execution (HTTP + Long-Lived 20Hz `/ws/siege`)

```bash
mkdir -p soak
k6 run \
  --summary-export soak/k6-summary.json \
  --out json=soak/k6-results.json \
  -e BASE_URL="${STAGING_URL}" \
  -e DURATION="4h" \
  -e VUS="150" \
  -e WS_SEND_HZ="20" \
  -e TENANT_POOL_SIZE="250" \
  -e SOAK_REPORT_DIR="soak" \
  loadtest/k6-soak.js
```

### Manual `Artillery` Execution (4-Hour Continuous Multi-Phase HTTP Ramp)

```bash
npx artillery run \
  --target "${STAGING_URL}" \
  --output soak/artillery-report.json \
  loadtest/artillery-siege.yml
```

---

## 3. Post-Soak Telemetry & Exit Criteria

Capture post-soak cluster state and PostgreSQL pool utilization:

```bash
curl --fail --show-error "${STAGING_URL}/api/ops/readiness" | tee soak/post-ops-readiness.json
kubectl get pods -n voxel-realms -o wide | tee soak/post-pods.txt
kubectl get hpa,pdb -n voxel-realms | tee soak/post-hpa-pdb.txt
```

Inspect PostgreSQL connection pool saturation (`< 70%`) and deadlock count (`0`) on Cloud SQL:

```sql
SELECT
  count(*) FILTER (WHERE state = 'active') AS active_conns,
  count(*) AS total_conns,
  current_setting('max_connections')::int AS max_conns
FROM pg_stat_activity
WHERE datname = current_database();

SELECT datname, deadlocks, conflicts
FROM pg_stat_database
WHERE datname = current_database();
```

### Mandatory Pass Thresholds (All Must Hold Simultaneously)

- `k6` soak duration `>= 4h` AND `Artillery` soak duration `>= 4h`
- HTTP `500` / `503` responses: `0`
- HTTP `p95 < 100 ms`, `p99 < 250 ms`
- `http_req_failed < 0.1%`, `voxel_http_429_rate < 2%`, `voxel_ws_error_rate < 0.1%`
- `20Hz` tick loop `overrunCount == 0`
- Container RSS memory drift `< 5%` between hour 1 and hour 4
- PostgreSQL connection pool saturation `< 70%` and `deadlocks == 0`
- Kubernetes container restarts during soak: `0`

Archive `soak/` artifacts and attach the GitHub Actions run URL to [`../docs/release-evidence-template.md`](../docs/release-evidence-template.md).
