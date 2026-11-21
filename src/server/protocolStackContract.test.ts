/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateAsyncApiSiegeContract,
  validateFlatBuffersSiegeSchema,
  validateGrpcInternalProtoSchema,
} from './protocolStackContract';

const ROOT = process.cwd();

test('Layer 2 AsyncAPI 3.0.0 (docs/asyncapi.yaml) matches all live /ws/siege opcodes and sectors', () => {
  const yamlText = fs.readFileSync(path.join(ROOT, 'docs/asyncapi.yaml'), 'utf8');
  const result = validateAsyncApiSiegeContract(yamlText);
  assert.equal(result.ok, true, `AsyncAPI 3.0.0 validation errors:\n${result.errors.join('\n')}`);
});

test('Layer 1 FlatBuffers (schemas/flatbuffers/voxel_siege_protocol.fbs) mirrors all SiegeNetOpcode and CohortDirtyBit flags', () => {
  const fbsText = fs.readFileSync(
    path.join(ROOT, 'schemas/flatbuffers/voxel_siege_protocol.fbs'),
    'utf8'
  );
  const result = validateFlatBuffersSiegeSchema(fbsText);
  assert.equal(result.ok, true, `FlatBuffers schema errors:\n${result.errors.join('\n')}`);
});

test('Layer 3 gRPC Proto3 (schemas/proto/voxel_realm_internal.proto) defines all 4 planned multi-shard services and 9 sectors', () => {
  const protoText = fs.readFileSync(
    path.join(ROOT, 'schemas/proto/voxel_realm_internal.proto'),
    'utf8'
  );
  const result = validateGrpcInternalProtoSchema(protoText);
  assert.equal(result.ok, true, `gRPC proto3 schema errors:\n${result.errors.join('\n')}`);
});

test('Protocol stack validators reject drifted opcodes, wrong spec versions, and missing services', () => {
  const badAsync = validateAsyncApiSiegeContract('asyncapi: 2.6.0\nchannels: {}');
  assert.equal(badAsync.ok, false);
  assert.ok(badAsync.errors.some((e) => e.includes('3.0.0')));
  assert.ok(badAsync.errors.some((e) => e.includes('C2S_TROOP_POSITION_CMD')));

  const badFbs = validateFlatBuffersSiegeSchema('namespace Other;\ntable Empty {}');
  assert.equal(badFbs.ok, false);
  assert.ok(badFbs.errors.some((e) => e.includes('VoxelRealms.Siege')));
  assert.ok(badFbs.errors.some((e) => e.includes('QuantizedVec2')));

  const badProto = validateGrpcInternalProtoSchema('syntax = "proto2";\npackage wrong;');
  assert.equal(badProto.ok, false);
  assert.ok(badProto.errors.some((e) => e.includes('proto3')));
  assert.ok(badProto.errors.some((e) => e.includes('ZoneHandoffService')));
});
