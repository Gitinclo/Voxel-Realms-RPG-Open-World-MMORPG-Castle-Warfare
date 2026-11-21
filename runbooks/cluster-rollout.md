# Runbook: Kubernetes Cluster Rollout (Staging & Production)

**Last Updated:** `20/11/2026`  
**Target Architecture:** GKE (Workload Identity) + Cloud SQL PostgreSQL + Managed Redis REST + `ingress-nginx` + `cert-manager` + External Secrets Operator + Prometheus Operator

---

## 1. Cluster Prerequisites

Confirm all four platform controllers are healthy before applying any overlay:

```bash
kubectl get crd \
  certificates.cert-manager.io \
  externalsecrets.external-secrets.io \
  servicemonitors.monitoring.coreos.com \
  podmonitors.monitoring.coreos.com \
  prometheusrules.monitoring.coreos.com

kubectl get pods -n ingress-nginx
kubectl get pods -n cert-manager
kubectl get pods -n external-secrets
```

---

## 2. GCP Workload Identity & Secret Manager Binding

Create and bind the environment-specific GCP service account (`voxel-realms-staging` or `voxel-realms-prod`) with least-privilege roles:

```bash
export GCP_PROJECT="dev-ivy-6v0ns"
export ENV_SA="voxel-realms-staging" # or voxel-realms-prod

# 1. Cloud SQL Client (for cloud-sql-proxy sidecar)
gcloud projects add-iam-policy-binding "${GCP_PROJECT}" \
  --member="serviceAccount:${ENV_SA}@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# 2. Secret Manager Secret Accessor (for External Secrets Operator)
gcloud projects add-iam-policy-binding "${GCP_PROJECT}" \
  --member="serviceAccount:${ENV_SA}@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 3. Workload Identity federation to Kubernetes SA voxel-realms/voxel-realms-sa
gcloud iam service-accounts add-iam-policy-binding \
  "${ENV_SA}@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:${GCP_PROJECT}.svc.id.goog[voxel-realms/voxel-realms-sa]"
```

Verify the required Secret Manager keys exist before rollout (never commit values to Git):

- `voxel-realms-session-secret` (`>= 32` random bytes)
- `voxel-realms-admin-passkey` (`>= 12` chars)
- `voxel-realms-sql-user`
- `voxel-realms-sql-password`
- `voxel-realms-redis-rest-url` (staging: `http://voxel-redis-rest.voxel-realms.svc.cluster.local:8080`; production: managed HA HTTPS REST endpoint)
- `voxel-realms-redis-rest-token`
- `voxel-realms-redis-password` (staging in-cluster Redis only)
- `voxel-realms-redis-internal-tls-uri` (staging in-cluster Redis sidecar only)

---

## 3. Render & Dry-Run Kustomize Overlay

Always render locally first and verify zero raw `Secret` objects or unresolved placeholders exist:

```bash
kubectl kustomize k8s/overlays/staging > /tmp/staging-rendered.yaml
! grep -qE '^kind:\s*Secret$' /tmp/staging-rendered.yaml
! grep -qiE 'REPLACE_VIA_SECRET_MANAGER|SET_IN_ENVIRONMENT_OVERLAY|example\.com' /tmp/staging-rendered.yaml
```

For production, also confirm the single-replica in-cluster `voxel-redis` StatefulSet is stripped:

```bash
kubectl kustomize k8s/overlays/production > /tmp/prod-rendered.yaml
! grep -q 'name: voxel-redis' /tmp/prod-rendered.yaml
```

---

## 4. Execute Rollout & Verify Probes

Prefer GitHub Actions workflow `.github/workflows/deploy-staging.yml` for staging so rollout artifacts are archived automatically for 90 days. For manual operator execution:

```bash
kubectl apply -k k8s/overlays/staging
kubectl set image deployment/voxel-realms-server \
  app="ghcr.io/gitinclo/voxel-realms-rpg:v1.5.0-rc.1" \
  -n voxel-realms
kubectl rollout status deployment/voxel-realms-server -n voxel-realms --timeout=15m
```

Verify runtime state:

```bash
kubectl get externalsecret,certificate,pdb,hpa,networkpolicy,pods -n voxel-realms -o wide
curl --fail --show-error https://staging.voxelrealms.gg/healthz
curl --fail --show-error https://staging.voxelrealms.gg/readyz
curl --fail --show-error https://staging.voxelrealms.gg/api/ops/readiness
```

Confirm `/api/ops/readiness` reports:

- `"ok": true`
- `"persistence": { "economyBackend": "postgres", "coordinationBackend": "redis_rest" }`
- `"tickLoop20Hz": { "overrunCount": 0 }`

---

## 5. Rollback Procedure

If probes fail, `overrunCount > 0`, or error rates spike:

```bash
kubectl rollout undo deployment/voxel-realms-server -n voxel-realms
kubectl rollout status deployment/voxel-realms-server -n voxel-realms --timeout=10m
kubectl describe pods -n voxel-realms -l app.kubernetes.io/name=voxel-realms-rpg
```
