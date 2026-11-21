# Voxel Realms RPG — Kubernetes Kustomize Manifests

This directory contains environment-separated Kustomize manifests for **staging** and **production** GKE/Kubernetes rollouts.

## Structure

```text
k8s/
├── networkpolicy.yaml        # Standalone canonical zero-trust NetworkPolicies
├── external-secret.yaml      # Standalone canonical External Secrets Operator GCP Secret Manager manifest
├── service-monitor.yaml      # Standalone canonical Prometheus ServiceMonitor + PrometheusRule SLO alerts
├── pod-monitor.yaml          # Standalone canonical Prometheus PodMonitor (per-pod 20Hz tick & RSS metrics)
├── base/
│   ├── kustomization.yaml
│   ├── namespace-and-config.yaml  # Restricted PodSecurity namespace + non-secret ConfigMap (NO raw Secret stringData)
│   ├── service-account.yaml       # Workload Identity ServiceAccount (`voxel-realms-sa`)
│   ├── external-secret.yaml       # ExternalSecret syncing GCP Secret Manager -> `voxel-realms-secrets`
│   ├── deployment.yaml            # Hardened non-root Deployment, Cloud SQL Auth Proxy, Service, PDB & HPA
│   ├── redis.yaml                 # Staging Redis (TLS + password auth) + HTTP REST coordination sidecar
│   ├── ingress-tls.yaml           # cert-manager ClusterIssuer + TLS 1.3 NGINX WebSocket Ingress
│   ├── networkpolicy.yaml
│   ├── service-monitor.yaml
│   └── pod-monitor.yaml
└── overlays/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/               # Staging domain, Cloud SQL instance, Workload Identity SA, 2–6 replicas
    └── production/
        ├── kustomization.yaml
        └── patches/               # Production domain, HA Cloud SQL, 3–20 replicas, PDB=2, deletes single-node Redis
```

## Prerequisites

1. `ingress-nginx` (>= v1.11)
2. `cert-manager` (>= v1.15) with HTTP-01 port 80 reachability (or DNS-01 solver)
3. `external-secrets` (>= v0.10) backed by GCP Secret Manager
4. `kube-prometheus-stack` (for `ServiceMonitor`, `PodMonitor`, and `PrometheusRule` CRDs)
5. GKE Workload Identity binding for `voxel-realms-sa` to `roles/cloudsql.client` and `roles/secretmanager.secretAccessor`

See [`../runbooks/cluster-rollout.md`](../runbooks/cluster-rollout.md) before applying any overlay.
