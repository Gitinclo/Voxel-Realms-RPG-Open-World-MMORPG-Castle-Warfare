# Runbook: TLS Certificate & Ingress Troubleshooting (`cert-manager` + `ingress-nginx`)

**Last Updated:** `20/11/2026`  
**Scope:** HTTP-01 ACME issuance, TLS 1.3 handshake verification, and `/ws/siege` WebSocket routing

---

## 1. Fast Health Check

```bash
kubectl get clusterissuer,certificate,certificaterequest,order,challenge -n voxel-realms
kubectl describe certificate -n voxel-realms
```

Expected healthy state:

- `ClusterIssuer/letsencrypt-prod`: `READY=True`
- `Certificate/voxel-realms-staging-tls-cert` (or `voxel-realms-prod-tls-cert`): `READY=True`

---

## 2. Live TLS Handshake & Chain Verification

```bash
export TARGET_HOST="staging.voxelrealms.gg"

openssl s_client \
  -connect "${TARGET_HOST}:443" \
  -servername "${TARGET_HOST}" \
  -verify_return_error </dev/null 2>&1 \
  | openssl x509 -noout -subject -issuer -dates -fingerprint -sha256
```

Verify:

1. `Verify return code: 0 (ok)`
2. Issuer is Let's Encrypt production (not `Fake LE Intermediate` or `Kubernetes Ingress Controller Fake Certificate`)
3. Expiry is `> 14 days` away (`VoxelCertExpiringSoon` alert fires below 14 days)

---

## 3. Common HTTP-01 Failure Modes & Fixes

| Symptom                                               | Root Cause                                                          | Resolution                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Challenge` stuck in `pending` (`connection refused`) | Firewall/Cloud Armor blocks TCP port `80` or DNS points to wrong IP | Verify `dig +short ${TARGET_HOST}` matches `kubectl get svc -n ingress-nginx` LoadBalancer IP; open TCP `80`. |
| `404` on `/.well-known/acme-challenge/*`              | `ingressClassName` mismatch or NetworkPolicy blocking ingress-nginx | Confirm `ingressClassName: nginx` in `ClusterIssuer` and `Ingress`; inspect `cert-manager` solver ingress.    |
| Let's Encrypt `429 Too Many Requests`                 | Repeated failed orders against `letsencrypt-prod`                   | Switch temporarily to `letsencrypt-staging` while debugging DNS/firewall, then switch back to `prod`.         |
| Private/internal staging host not reachable publicly  | HTTP-01 cannot reach non-public DNS                                 | Switch `ClusterIssuer` solver from `http01` to `dns01` (Cloud DNS Workload Identity solver).                  |
| `/ws/siege` disconnects after 60s                     | Ingress timeout annotations missing or LB backend timeout `< 3600s` | Confirm `proxy-read-timeout: '3600'`, `proxy-send-timeout: '3600'`, and GCP BackendConfig timeout >= `3600s`. |

---

## 4. Force Renewal / Recovery

Only delete the target Secret if the certificate is corrupted or issued by staging CA:

```bash
kubectl delete secret voxel-realms-staging-tls-cert -n voxel-realms
kubectl get certificate -n voxel-realms -w
```

Check controller logs if renewal does not complete within 3 minutes:

```bash
kubectl logs -n cert-manager deploy/cert-manager --tail=200
```
