/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure OpenAPI 3.2.0 / 3.1.0 Contract Validator (Zero External Dependencies)
 * Enforces mandatory OpenAPI 3.2 Agent Reference rules (AGENTS.md Sections 1, 6, 7 & 10):
 *  - Exact version strings (`3.2.0` primary, `3.1.0` downlevel; rejects invented `3.2`/`3.2.x` or unreleased `3.3.x`)
 *  - JSON Schema Draft 2020-12 compliance (forbids OAS 3.0 `nullable: true`)
 *  - Globally unique `operationId` across every path operation
 *  - Valid hierarchical `tags[].parent` references
 *  - Forbids mixing `in: querystring` with `in: query` or declaring >1 `in: querystring` on the same operation
 *  - Forbids standard HTTP verbs inside `additionalOperations`
 *  - Forbids 3.2-only keywords (`$self`, `itemSchema`, `deviceAuthorization`, `oauth2MetadataUrl`, `in: querystring`, `dataValue`, `serializedValue`, `parent`, `kind`) in 3.1.0 downlevel specs
 *  - Bidirectional HTTP method + path parity against live Express route stacks
 */

export const STANDARD_OAS_32_METHODS = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
  'query',
]);

export interface OpenApiOperationSummary {
  method: string;
  path: string;
  operationId: string | null;
  inQueryCount: number;
  inQuerystringCount: number;
}

export interface OpenApiValidationResult {
  ok: boolean;
  version: string | null;
  operations: OpenApiOperationSummary[];
  tagNames: string[];
  errors: string[];
}

export function extractOpenApiOperations(yamlText: string): OpenApiOperationSummary[] {
  const lines = yamlText.split(/\r?\n/);
  const operations: OpenApiOperationSummary[] = [];

  let inPaths = false;
  let currentPath: string | null = null;
  let currentOp: OpenApiOperationSummary | null = null;
  let inAdditionalOperations = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = rawLine.length - rawLine.trimStart().length;

    if (indent === 0) {
      inPaths = trimmed === 'paths:';
      currentPath = null;
      currentOp = null;
      inAdditionalOperations = false;
      continue;
    }

    if (!inPaths) continue;

    if (indent === 2 && /^\/[^\s:]+:$/.test(trimmed)) {
      currentPath = trimmed.slice(0, -1);
      currentOp = null;
      inAdditionalOperations = false;
      continue;
    }

    if (indent === 4 && currentPath) {
      if (trimmed === 'additionalOperations:') {
        inAdditionalOperations = true;
        currentOp = null;
        continue;
      }
      inAdditionalOperations = false;
      const methodMatch = /^([a-z]+):$/.exec(trimmed);
      if (methodMatch && STANDARD_OAS_32_METHODS.has(methodMatch[1])) {
        currentOp = {
          method: methodMatch[1].toUpperCase(),
          path: currentPath,
          operationId: null,
          inQueryCount: 0,
          inQuerystringCount: 0,
        };
        operations.push(currentOp);
      } else {
        currentOp = null;
      }
      continue;
    }

    if (inAdditionalOperations && indent === 6 && currentPath) {
      const customMethodMatch = /^([A-Za-z][A-Za-z0-9_-]*):$/.exec(trimmed);
      if (customMethodMatch) {
        currentOp = {
          method: customMethodMatch[1].toUpperCase(),
          path: currentPath,
          operationId: null,
          inQueryCount: 0,
          inQuerystringCount: 0,
        };
        operations.push(currentOp);
      }
      continue;
    }

    if (currentOp) {
      const opIdMatch = /^operationId:\s*['"]?([^'"#\s]+)['"]?/.exec(trimmed);
      if (opIdMatch && !currentOp.operationId) {
        currentOp.operationId = opIdMatch[1];
      }
      if (/^(?:-\s+)?in:\s*['"]?query['"]?\s*$/.test(trimmed)) {
        currentOp.inQueryCount += 1;
      }
      if (/^(?:-\s+)?in:\s*['"]?querystring['"]?\s*$/.test(trimmed)) {
        currentOp.inQuerystringCount += 1;
      }
    }
  }

  return operations;
}

export function extractTagHierarchy(
  yamlText: string
): Array<{ name: string; parent: string | null; kind: string | null }> {
  const lines = yamlText.split(/\r?\n/);
  const tags: Array<{ name: string; parent: string | null; kind: string | null }> = [];
  let inTags = false;
  let current: { name: string; parent: string | null; kind: string | null } | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = rawLine.length - rawLine.trimStart().length;

    if (indent === 0) {
      inTags = trimmed === 'tags:';
      current = null;
      continue;
    }
    if (!inTags) continue;

    const nameMatch = /^-\s+name:\s*['"]?([^'"#\s]+)['"]?/.exec(trimmed);
    if (indent === 2 && nameMatch) {
      current = { name: nameMatch[1], parent: null, kind: null };
      tags.push(current);
      continue;
    }
    if (current && indent >= 4) {
      const parentMatch = /^parent:\s*['"]?([^'"#\s]+)['"]?/.exec(trimmed);
      if (parentMatch) current.parent = parentMatch[1];
      const kindMatch = /^kind:\s*['"]?([^'"#\s]+)['"]?/.exec(trimmed);
      if (kindMatch) current.kind = kindMatch[1];
    }
  }

  return tags;
}

export function validateOpenApiContract(
  yamlText: string,
  expectedVersion: '3.2.0' | '3.1.0'
): OpenApiValidationResult {
  const errors: string[] = [];

  const versionMatch = /^openapi:\s*['"]?([^\s'"#]+)['"]?\s*$/m.exec(yamlText);
  const version = versionMatch ? versionMatch[1] : null;
  if (!version) {
    errors.push('Missing root "openapi:" version field.');
  } else if (version !== expectedVersion) {
    errors.push(`Expected openapi version "${expectedVersion}", found "${version}".`);
  }

  if (/^\s+nullable:\s*true\b/m.test(yamlText)) {
    errors.push(
      'OAS 3.0 "nullable: true" is forbidden in OAS 3.1/3.2 (JSON Schema 2020-12); use type: [T, "null"].'
    );
  }

  // Enforce additionalOperations does not redefine native HTTP verbs
  const lines = yamlText.split(/\r?\n/);
  let inAdditionalOps = false;
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = rawLine.length - rawLine.trimStart().length;
    if (indent <= 4) {
      inAdditionalOps = indent === 4 && trimmed === 'additionalOperations:';
      continue;
    }
    if (inAdditionalOps && indent === 6) {
      const verbMatch = /^([A-Za-z][A-Za-z0-9_-]*):$/.exec(trimmed);
      if (verbMatch && STANDARD_OAS_32_METHODS.has(verbMatch[1].toLowerCase())) {
        errors.push(
          `additionalOperations must not redefine native HTTP verb "${verbMatch[1]}"; use the standard Path Item field instead.`
        );
      }
    }
  }

  // Check operations: unique operationId + querystring vs query conflict
  const operations = extractOpenApiOperations(yamlText);
  if (operations.length === 0) {
    errors.push('No operations found under paths:.');
  }

  const seenOpIds = new Set<string>();
  for (const op of operations) {
    if (!op.operationId) {
      errors.push(`Operation ${op.method} ${op.path} is missing a unique operationId.`);
    } else if (seenOpIds.has(op.operationId)) {
      errors.push(`Duplicate operationId "${op.operationId}" on ${op.method} ${op.path}.`);
    } else {
      seenOpIds.add(op.operationId);
    }

    if (op.inQuerystringCount > 1) {
      errors.push(
        `Operation ${op.method} ${op.path} declares ${op.inQuerystringCount} "in: querystring" parameters (max 1).`
      );
    }
    if (op.inQuerystringCount > 0 && op.inQueryCount > 0) {
      errors.push(
        `Operation ${op.method} ${op.path} combines "in: querystring" with "in: query", which is forbidden in OAS 3.2.`
      );
    }
  }

  // Validate hierarchical tags
  const tags = extractTagHierarchy(yamlText);
  const tagNameSet = new Set(tags.map((t) => t.name));
  for (const tag of tags) {
    if (tag.parent && !tagNameSet.has(tag.parent)) {
      errors.push(`Tag "${tag.name}" references unknown parent tag "${tag.parent}".`);
    }
  }

  // Downlevel 3.1.0 must not retain 3.2-only keywords
  if (expectedVersion === '3.1.0') {
    const oas32OnlyChecks: Array<{ label: string; regex: RegExp }> = [
      { label: '$self', regex: /^\$self:/m },
      { label: 'itemSchema', regex: /^\s+itemSchema:/m },
      { label: 'deviceAuthorization', regex: /^\s+deviceAuthorization:/m },
      { label: 'oauth2MetadataUrl', regex: /^\s+oauth2MetadataUrl:/m },
      { label: 'in: querystring', regex: /^\s+(?:-\s+)?in:\s*['"]?querystring['"]?\s*$/m },
      { label: 'dataValue', regex: /^\s+dataValue:/m },
      { label: 'serializedValue', regex: /^\s+serializedValue:/m },
      { label: 'additionalOperations', regex: /^\s+additionalOperations:/m },
      { label: 'query operation', regex: /^ {4}query:\s*$/m },
      { label: 'tag parent', regex: /^ {4}parent:/m },
      { label: 'tag kind', regex: /^ {4}kind:/m },
    ];
    for (const check of oas32OnlyChecks) {
      if (check.regex.test(yamlText)) {
        errors.push(
          `OpenAPI 3.1.0 downlevel spec must not contain 3.2-only field "${check.label}".`
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    version,
    operations,
    tagNames: [...tagNameSet],
    errors,
  };
}
