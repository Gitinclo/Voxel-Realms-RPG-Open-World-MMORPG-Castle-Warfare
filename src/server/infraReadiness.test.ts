/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readText(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('Kustomize base and staging/production overlays enforce Workload Identity, ExternalSecret, NetworkPolicies, Observability, and zero raw Secrets', () => {
  const baseKustomization = readText('k8s/base/kustomization.yaml');
  const baseConfig = readText('k8s/base/namespace-and-config.yaml');
  const baseSa = readText('k8s/base/service-account.yaml');
  const baseDeployment = readText('k8s/base/deployment.yaml');
  const baseIngress = readText('k8s/base/ingress-tls.yaml');
  const baseRedis = readText('k8s/base/redis.yaml');
  const baseExternalSecret = readText('k8s/base/external-secret.yaml');
  const baseNetworkPolicy = readText('k8s/base/networkpolicy.yaml');
  const baseServiceMonitor = readText('k8s/base/service-monitor.yaml');
  const basePodMonitor = readText('k8s/base/pod-monitor.yaml');

  // Standalone top-level copies stay in exact sync with k8s/base/*
  assert.equal(readText('k8s/external-secret.yaml'), baseExternalSecret);
  assert.equal(readText('k8s/networkpolicy.yaml'), baseNetworkPolicy);
  assert.equal(readText('k8s/service-monitor.yaml'), baseServiceMonitor);
  assert.equal(readText('k8s/pod-monitor.yaml'), basePodMonitor);

  // Kustomize base wiring
  assert.match(baseKustomization, /external-secret\.yaml/);
  assert.match(baseKustomization, /networkpolicy\.yaml/);
  assert.match(baseKustomization, /service-monitor\.yaml/);
  assert.match(baseKustomization, /pod-monitor\.yaml/);

  // Zero raw Kubernetes Secrets or placeholder stringData committed
  assert.equal(/kind:\s*Secret\b/.test(baseConfig), false, 'Must not commit raw kind: Secret');
  assert.equal(/stringData:/.test(baseConfig), false, 'Must not commit Secret stringData');
  assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(baseConfig), false, 'Must not embed API keys');
  assert.match(baseConfig, /VOXEL_ECONOMY_BACKEND:\s*['"]postgres['"]/);
  assert.match(baseConfig, /VOXEL_ALLOW_PRODUCTION_GODMODE:\s*['"]false['"]/);
  assert.match(baseConfig, /pod-security\.kubernetes\.io\/enforce:\s*restricted/);

  // Workload Identity ServiceAccount & External Secrets Operator
  assert.match(baseSa, /iam\.gke\.io\/gcp-service-account:/);
  assert.match(baseExternalSecret, /kind:\s*SecretStore/);
  assert.match(baseExternalSecret, /kind:\s*ExternalSecret/);
  assert.match(baseExternalSecret, /VOXEL_SESSION_SECRET/);
  assert.match(baseExternalSecret, /REDIS_REST_URL/);

  // Deployment security, probes, parameterized Cloud SQL connection name, PDB & HPA
  assert.match(baseDeployment, /runAsNonRoot:\s*true/);
  assert.match(baseDeployment, /readOnlyRootFilesystem:\s*true/);
  assert.match(baseDeployment, /allowPrivilegeEscalation:\s*false/);
  assert.match(baseDeployment, /path:\s*\/healthz/);
  assert.match(baseDeployment, /path:\s*\/readyz/);
  assert.match(baseDeployment, /cloud-sql-proxy/);
  assert.match(baseDeployment, /configMapKeyRef:/);
  assert.equal(
    /dev-ivy-6v0ns:asia-southeast1:ai-studio-416287a7/.test(baseDeployment),
    false,
    'Cloud SQL connection name must be parameterized via environment overlays, not hardcoded in base deployment.yaml'
  );
  assert.match(baseDeployment, /kind:\s*PodDisruptionBudget/);
  assert.match(baseDeployment, /kind:\s*HorizontalPodAutoscaler/);

  // TLS Ingress WebSocket settings
  assert.match(baseIngress, /cert-manager\.io\/cluster-issuer:\s*['"]letsencrypt-prod['"]/);
  assert.match(baseIngress, /ssl-redirect:\s*['"]true['"]/);
  assert.match(baseIngress, /proxy-read-timeout:\s*['"]3600['"]/);
  assert.match(baseIngress, /websocket-services:\s*['"]voxel-realms-service['"]/);

  // Staging Redis has password auth, TLS, and HTTP REST coordination sidecar
  assert.match(baseRedis, /runAsNonRoot:\s*true/);
  assert.match(baseRedis, /--requirepass/);
  assert.match(baseRedis, /--tls-port 6379/);
  assert.match(baseRedis, /name:\s*redis-rest-gateway/);
  assert.match(baseRedis, /name:\s*voxel-redis-rest/);

  // Zero-trust NetworkPolicies & Prometheus Operator Observability
  assert.match(baseNetworkPolicy, /name:\s*default-deny-all/);
  assert.match(baseNetworkPolicy, /name:\s*allow-voxel-server-traffic/);
  assert.match(baseNetworkPolicy, /name:\s*allow-voxel-redis-ingress/);
  assert.match(baseServiceMonitor, /kind:\s*ServiceMonitor/);
  assert.match(baseServiceMonitor, /kind:\s*PrometheusRule/);
  assert.match(baseServiceMonitor, /Voxel20HzTickOverrunDetected/);
  assert.match(basePodMonitor, /kind:\s*PodMonitor/);

  // Environment overlays resolve placeholders and enforce HA in production
  const stagingConfig = readText('k8s/overlays/staging/patches/config-patch.yaml');
  const stagingIngress = readText('k8s/overlays/staging/patches/ingress-patch.yaml');
  const prodConfig = readText('k8s/overlays/production/patches/config-patch.yaml');
  const prodDeployment = readText('k8s/overlays/production/patches/deployment-patch.yaml');
  const prodRedisDelete = readText('k8s/overlays/production/patches/redis-delete-patch.yaml');

  assert.match(stagingConfig, /ai-studio-416287a7/);
  assert.equal(/example\.com/.test(stagingConfig), false);
  assert.equal(/example\.com/.test(stagingIngress), false);
  assert.equal(/example\.com/.test(prodConfig), false);
  assert.match(prodDeployment, /minReplicas:\s*3/);
  assert.match(prodDeployment, /minAvailable:\s*2/);
  assert.match(prodRedisDelete, /\$patch:\s*delete/);
});

test('Hardened k6 and Artillery load/soak suites enforce 4h duration, true 20Hz long-lived WS, bounded tenants, safety guards, and JSON/JUnit reporting', () => {
  const k6Script = readText('loadtest/k6-soak.js');
  const artilleryYml = readText('loadtest/artillery-siege.yml');

  // k6 safeguards, bounded tenants, true 20Hz long-lived WS, drift/429/5xx SLOs, JSON+JUnit export
  assert.match(k6Script, /example\.com/);
  assert.match(k6Script, /Refusing to run load test against production-like hostname/);
  assert.match(k6Script, /TENANT_POOL_SIZE/);
  assert.match(k6Script, /WS_SEND_HZ/);
  assert.match(k6Script, /wsSiegeLongLivedFlow/);
  assert.match(k6Script, /opsReadinessFlow/);
  assert.match(k6Script, /http_req_failed.*rate<0\.001/);
  assert.match(k6Script, /http_req_duration.*p\(95\)<100/);
  assert.match(k6Script, /voxel_http_429_rate.*rate<0\.02/);
  assert.match(k6Script, /voxel_http_5xx_rate.*rate==0/);
  assert.match(k6Script, /voxel_ws_error_rate.*rate<0\.001/);
  assert.match(k6Script, /voxel_tick_overruns.*value==0/);
  assert.match(k6Script, /voxel_rss_drift_pct.*value<5/);
  assert.match(k6Script, /handleSummary/);
  assert.match(k6Script, /k6-junit\.xml/);
  assert.match(k6Script, /\/api\/online\/economy\/claim-action/);
  assert.match(k6Script, /\/ws\/siege/);
  assert.match(k6Script, /\/api\/auth\/logout/);

  // Artillery 4-hour total duration (300 + 12600 + 900 + 600 = 14400s), bounded tenants & SLOs
  assert.match(artilleryYml, /duration:\s*12600/);
  assert.match(artilleryYml, /soak-artillery-tenant-/);
  assert.match(artilleryYml, /http\.response_time\.p95:\s*100/);
  assert.match(artilleryYml, /http\.response_time\.p99:\s*250/);
  assert.match(artilleryYml, /http\.codes\.429:/);
  assert.match(artilleryYml, /http\.codes\.500:\s*0/);
  assert.match(artilleryYml, /http\.codes\.503:\s*0/);
  assert.match(artilleryYml, /\/api\/online\/account\/export/);
  assert.match(artilleryYml, /\/api\/ops\/readiness/);
});

test('CI/CD rollout, 4h soak, release-gate, and signed-release workflows enforce TLS, drift, SBOM, Trivy, provenance, and tag signature checks', () => {
  const deployStaging = readText('.github/workflows/deploy-staging.yml');
  const stagingSoak = readText('.github/workflows/staging-soak.yml');
  const releaseGates = readText('.github/workflows/release-gates.yml');
  const releaseYml = readText('.github/workflows/release.yml');
  const cdYml = readText('.github/workflows/cd.yml');

  assert.match(deployStaging, /kubectl apply -k k8s\/overlays\/staging/);
  assert.match(deployStaging, /openssl s_client/);
  assert.match(deployStaging, /upload-artifact/);

  assert.match(stagingSoak, /environment:\s*\n\s*name:\s*staging-soak/);
  assert.match(stagingSoak, /k6-summary\.json/);
  assert.match(stagingSoak, /artillery-report\.json/);
  assert.match(stagingSoak, /driftPct >= 5/);

  assert.match(releaseGates, /kustomize build k8s\/overlays\/staging/);
  assert.match(releaseGates, /kustomize build k8s\/overlays\/production/);
  assert.match(releaseGates, /trivy-action/);
  assert.match(releaseGates, /sbom-action/);

  assert.match(releaseYml, /attestations:\s*write/);
  assert.match(releaseYml, /id-token:\s*write/);
  assert.match(releaseYml, /environment:\s*production-release/);
  assert.match(releaseYml, /BEGIN \(PGP\|SSH\) SIGNATURE/);
  assert.match(releaseYml, /SBOM\.cdx\.json/);
  assert.match(releaseYml, /SBOM\.spdx\.json/);
  assert.match(releaseYml, /provenance\.json/);
  assert.match(releaseYml, /release-attestation\.json/);
  assert.match(releaseYml, /SHA256SUMS\.txt/);
  assert.match(releaseYml, /attest-build-provenance/);

  assert.match(cdYml, /kustomize build k8s\/overlays\/staging/);

  // Every `docker build --target <stage>` across .github/workflows/*.yml must exist in Dockerfile
  const dockerfile = readText('Dockerfile');
  const validStages = new Set(
    Array.from(dockerfile.matchAll(/^FROM\s+\S+\s+AS\s+([A-Za-z0-9_-]+)/gm), (m) => m[1])
  );
  assert.ok(validStages.has('runner'), 'Dockerfile must define runner stage');
  assert.ok(validStages.has('nginx-runner'), 'Dockerfile must define nginx-runner stage');

  const workflowDir = path.join(ROOT, '.github/workflows');
  for (const file of fs.readdirSync(workflowDir).filter((f) => f.endsWith('.yml'))) {
    const content = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    for (const match of content.matchAll(/docker\s+build\b[^\n]*--target\s+([A-Za-z0-9_-]+)/g)) {
      const targetStage = match[1];
      assert.ok(
        validStages.has(targetStage),
        `${file} references nonexistent Dockerfile target stage "${targetStage}" (valid: ${Array.from(validStages).join(', ')})`
      );
    }
    if (/npm run verify:e2e/.test(content)) {
      assert.match(
        content,
        /@playwright\/cli/,
        `${file} invokes npm run verify:e2e but does not install @playwright/cli`
      );
    }
  }
});

test('Operational runbooks and 24-gate release evidence template exist with required verification steps', () => {
  const clusterRunbook = readText('runbooks/cluster-rollout.md');
  const certRunbook = readText('runbooks/certificate-troubleshooting.md');
  const soakRunbook = readText('runbooks/staging-soak.md');
  const releaseRunbook = readText('runbooks/release-cut.md');
  const evidenceTemplate = readText('docs/release-evidence-template.md');

  assert.match(clusterRunbook, /roles\/cloudsql\.client/);
  assert.match(clusterRunbook, /roles\/secretmanager\.secretAccessor/);
  assert.match(clusterRunbook, /kubectl rollout undo/);

  assert.match(certRunbook, /openssl s_client/);
  assert.match(certRunbook, /http01/i);

  assert.match(soakRunbook, /pg_stat_activity/);
  assert.match(soakRunbook, /< 5%/);

  assert.match(releaseRunbook, /git tag -s/);
  assert.match(releaseRunbook, /git verify-tag/);
  assert.match(releaseRunbook, /SHA256SUMS\.txt/);

  // Verify all 24 numbered release gates exist in template
  for (let gate = 1; gate <= 24; gate += 1) {
    assert.match(
      evidenceTemplate,
      new RegExp(`\\*\\*${gate}\\.`),
      `Expected release gate #${gate} in docs/release-evidence-template.md`
    );
  }
});
