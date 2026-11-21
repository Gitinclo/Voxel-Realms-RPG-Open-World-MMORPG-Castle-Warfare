/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createVoxelServerRuntime } from './createApp';
import { validateOpenApiContract } from './openapiContract';

const ROOT = process.cwd();

function collectExpressRoutes(): Set<string> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-oas-routes-'));
  const runtime = createVoxelServerRuntime({
    port: 0,
    dataDir,
    enableTickLoop: false,
    securityConfig: {
      isProduction: false,
      sessionSecret: 'openapi-contract-test-secret-0123456789',
      adminPasskey: 'openapi-contract-passkey',
      allowProductionGodMode: false,
      ephemeralSessionSecretGenerated: false,
      ephemeralDevPasskeyGenerated: false,
      failClosedMisconfigured: false,
      misconfigurationReason: null,
    },
  });

  try {
    const routes = new Set<string>();
    const stack =
      (
        runtime.app as unknown as {
          router?: {
            stack?: Array<{
              route?: { path?: string | string[]; methods?: Record<string, boolean> };
            }>;
          };
        }
      ).router?.stack ?? [];

    for (const layer of stack) {
      if (!layer.route) continue;
      const paths = Array.isArray(layer.route.path)
        ? layer.route.path
        : layer.route.path
          ? [layer.route.path]
          : [];
      const methods = Object.entries(layer.route.methods ?? {})
        .filter(([, enabled]) => enabled)
        .map(([m]) => m.toUpperCase());
      for (const p of paths) {
        for (const m of methods) {
          routes.add(`${m} ${p}`);
        }
      }
    }
    return routes;
  } finally {
    void runtime.shutdown();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

test('docs/openapi.yaml passes OpenAPI 3.2.0 contract validation and matches 100% of Express routes bidirectionally', () => {
  const yamlText = fs.readFileSync(path.join(ROOT, 'docs/openapi.yaml'), 'utf8');
  const result = validateOpenApiContract(yamlText, '3.2.0');
  assert.equal(result.ok, true, `OpenAPI 3.2.0 validation errors:\n${result.errors.join('\n')}`);
  assert.equal(result.version, '3.2.0');
  assert.match(yamlText, /^\$self:\s*https:\/\//m, 'Expected root $self URI in OpenAPI 3.2.0 spec');
  assert.match(yamlText, /parent:\s*economy/, 'Expected hierarchical tag parent in 3.2.0 spec');
  assert.match(yamlText, /dataValue:/, 'Expected 3.2 dataValue example in docs/openapi.yaml');

  const mountedRoutes = collectExpressRoutes();
  const documentedRoutes = new Set(result.operations.map((op) => `${op.method} ${op.path}`));

  for (const route of mountedRoutes) {
    assert.equal(
      documentedRoutes.has(route),
      true,
      `Express route "${route}" is missing from docs/openapi.yaml`
    );
  }
  for (const route of documentedRoutes) {
    assert.equal(
      mountedRoutes.has(route),
      true,
      `docs/openapi.yaml route "${route}" is not mounted on Express`
    );
  }
});

test('docs/openapi.3.1.yaml passes OpenAPI 3.1.0 downlevel validation with zero 3.2-only keywords and 100% route parity', () => {
  const yamlText = fs.readFileSync(path.join(ROOT, 'docs/openapi.3.1.yaml'), 'utf8');
  const result = validateOpenApiContract(yamlText, '3.1.0');
  assert.equal(
    result.ok,
    true,
    `OpenAPI 3.1.0 downlevel validation errors:\n${result.errors.join('\n')}`
  );
  assert.equal(result.version, '3.1.0');

  const mountedRoutes = collectExpressRoutes();
  const documentedRoutes = new Set(result.operations.map((op) => `${op.method} ${op.path}`));
  assert.deepEqual([...documentedRoutes].sort(), [...mountedRoutes].sort());
});

test('validateOpenApiContract catches AGENTS.md Section 1 & Section 6 anti-patterns', () => {
  const brokenSpec = [
    'openapi: 3.3.0',
    'tags:',
    '  - name: bundles',
    '    parent: missing-parent',
    'paths:',
    '  /bad:',
    '    get:',
    '      operationId: dupOp',
    '      parameters:',
    '        - name: q',
    '          in: query',
    '        - name: qs',
    '          in: querystring',
    '      responses:',
    "        '200':",
    '          description: ok',
    '    additionalOperations:',
    '      POST:',
    '        operationId: dupOp',
    'components:',
    '  schemas:',
    '    Legacy:',
    '      type: string',
    '      nullable: true',
  ].join('\n');

  const result = validateOpenApiContract(brokenSpec, '3.2.0');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('Expected openapi version "3.2.0"')));
  assert.ok(result.errors.some((e) => e.includes('nullable: true')));
  assert.ok(result.errors.some((e) => e.includes('Duplicate operationId')));
  assert.ok(result.errors.some((e) => e.includes('combines "in: querystring" with "in: query"')));
  assert.ok(result.errors.some((e) => e.includes('additionalOperations must not redefine')));
  assert.ok(result.errors.some((e) => e.includes('unknown parent tag "missing-parent"')));
});

test('AGENTS.md preserves OpenAPI 3.2 hard rules and Voxel Realms RPG stack bindings', () => {
  const agentsText = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
  assert.match(agentsText, /openapi:\s*3\.2\.0/);
  assert.match(agentsText, /Draft 2020-12/);
  assert.match(agentsText, /docs\/openapi\.yaml/);
  assert.match(agentsText, /docs\/openapi\.3\.1\.yaml/);
  assert.match(agentsText, /Express `5\.3\.0`/);
  assert.match(agentsText, /\/ws\/siege/);
});
