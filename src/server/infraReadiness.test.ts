/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Kubernetes manifests enforce non-root security, probes, Cloud SQL proxy, TLS, and zero real secrets', () => {
  const deployment = fs.readFileSync(path.join(ROOT, 'k8s/deployment.yaml'), 'utf8');
  const ingress = fs.readFileSync(path.join(ROOT, 'k8s/ingress-tls.yaml'), 'utf8');
  const config = fs.readFileSync(path.join(ROOT, 'k8s/namespace-and-config.yaml'), 'utf8');
  const redis = fs.readFileSync(path.join(ROOT, 'k8s/redis.yaml'), 'utf8');

  assert.match(deployment, /runAsNonRoot:\s*true/);
  assert.match(deployment, /readOnlyRootFilesystem:\s*true/);
  assert.match(deployment, /allowPrivilegeEscalation:\s*false/);
  assert.match(deployment, /path:\s*\/healthz/);
  assert.match(deployment, /path:\s*\/readyz/);
  assert.match(deployment, /cloud-sql-proxy/);
  assert.match(deployment, /ai-studio-416287a7/);
  assert.match(deployment, /kind:\s*PodDisruptionBudget/);
  assert.match(deployment, /kind:\s*HorizontalPodAutoscaler/);

  assert.match(ingress, /cert-manager\.io\/cluster-issuer:\s*['"]letsencrypt-prod['"]/);
  assert.match(ingress, /ssl-redirect:\s*['"]true['"]/);
  assert.match(ingress, /proxy-read-timeout:\s*['"]3600['"]/);
  assert.match(ingress, /websocket-services:\s*['"]voxel-realms-service['"]/);

  assert.match(config, /VOXEL_ECONOMY_BACKEND:\s*['"]postgres['"]/);
  assert.match(config, /VOXEL_ALLOW_PRODUCTION_GODMODE:\s*['"]false['"]/);
  assert.match(config, /REPLACE_VIA_SECRET_MANAGER/);
  assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(config), false, 'Must not embed API keys in k8s yaml');

  assert.match(redis, /runAsNonRoot:\s*true/);
  assert.match(redis, /redis-cli/);
});

test('External k6 and Artillery load/soak suites define explicit SLO thresholds and economy/WS flows', () => {
  const k6Script = fs.readFileSync(path.join(ROOT, 'loadtest/k6-soak.js'), 'utf8');
  const artilleryYml = fs.readFileSync(path.join(ROOT, 'loadtest/artillery-siege.yml'), 'utf8');

  assert.match(k6Script, /http_req_failed.*rate<0\.001/);
  assert.match(k6Script, /http_req_duration.*p\(95\)<100/);
  assert.match(k6Script, /\/api\/online\/economy\/claim-action/);
  assert.match(k6Script, /\/ws\/siege/);
  assert.match(k6Script, /\/api\/auth\/logout/);

  assert.match(artilleryYml, /http\.response_time\.p95:\s*100/);
  assert.match(artilleryYml, /http\.codes\.500:\s*0/);
  assert.match(artilleryYml, /\/api\/online\/account\/export/);
});
