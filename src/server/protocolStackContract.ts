/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure Multi-Layer MMORPG Protocol Stack Validator (Zero External Dependencies)
 * Validates consistency across:
 *  - Layer 1: FlatBuffers (.fbs) binary wire schema (`schemas/flatbuffers/voxel_siege_protocol.fbs`)
 *  - Layer 2: AsyncAPI 3.0.0 WebSocket contract (`docs/asyncapi.yaml`) against live `SiegeNetOpcode`
 *  - Layer 3: gRPC / Protobuf v3 internal service schema (`schemas/proto/voxel_realm_internal.proto`)
 */

import { ALL_TERRITORY_SECTORS, CohortDirtyBit, SiegeNetOpcode } from '../game/siegeNetProtocol';

export interface ProtocolValidationResult {
  ok: boolean;
  errors: string[];
}

export function getLiveSiegeOpcodeEntries(): Array<{ name: string; value: number }> {
  return Object.entries(SiegeNetOpcode)
    .filter(([, value]) => typeof value === 'number')
    .map(([name, value]) => ({ name, value: value as number }));
}

export function getLiveCohortDirtyBitNames(): string[] {
  return Object.entries(CohortDirtyBit)
    .filter(([, value]) => typeof value === 'number')
    .map(([name]) => name);
}

export function validateAsyncApiSiegeContract(yamlText: string): ProtocolValidationResult {
  const errors: string[] = [];

  if (!/^asyncapi:\s*['"]?3\.0\.0['"]?\s*$/m.test(yamlText)) {
    errors.push('AsyncAPI document must declare exact version "asyncapi: 3.0.0".');
  }
  if (!/address:\s*\/ws\/siege\b/.test(yamlText)) {
    errors.push('AsyncAPI channels must document live WebSocket address "/ws/siege".');
  }
  if (!/action:\s*receive\b/.test(yamlText) || !/action:\s*send\b/.test(yamlText)) {
    errors.push('AsyncAPI 3.0 operations must define both "receive" and "send" actions.');
  }

  for (const { name, value } of getLiveSiegeOpcodeEntries()) {
    const nameRegex = new RegExp(`\\bname:\\s*${name}\\b`);
    if (!nameRegex.test(yamlText)) {
      errors.push(`AsyncAPI contract is missing message for live SiegeNetOpcode.${name}.`);
    }
    const constRegex = new RegExp(`\\bconst:\\s*${value}\\b`);
    if (!constRegex.test(yamlText)) {
      errors.push(
        `AsyncAPI contract is missing numeric opcode const ${value} for SiegeNetOpcode.${name}.`
      );
    }
  }

  for (const controlOpcode of ['S2C_AUTH_ERROR', 'S2C_RATE_LIMIT']) {
    if (!new RegExp(`\\bconst:\\s*${controlOpcode}\\b`).test(yamlText)) {
      errors.push(`AsyncAPI contract is missing gateway control frame "${controlOpcode}".`);
    }
  }

  for (const sector of ALL_TERRITORY_SECTORS) {
    if (!new RegExp(`\\b${sector}\\b`).test(yamlText)) {
      errors.push(`AsyncAPI contract is missing TerritorySectorCode "${sector}".`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateFlatBuffersSiegeSchema(fbsText: string): ProtocolValidationResult {
  const errors: string[] = [];

  if (!/^namespace\s+VoxelRealms\.Siege;/m.test(fbsText)) {
    errors.push('FlatBuffers schema must declare "namespace VoxelRealms.Siege;".');
  }
  if (!/^root_type\s+SiegeNetPacket;/m.test(fbsText)) {
    errors.push('FlatBuffers schema must declare "root_type SiegeNetPacket;".');
  }
  if (!/^file_identifier\s+"VRSG";/m.test(fbsText)) {
    errors.push('FlatBuffers schema must declare 4-byte file_identifier "VRSG".');
  }
  if (!/struct\s+QuantizedVec2\s*\{/.test(fbsText)) {
    errors.push('FlatBuffers schema must define zero-copy inline struct "QuantizedVec2".');
  }

  for (const { name, value } of getLiveSiegeOpcodeEntries()) {
    const hexValue = `0x${value.toString(16).padStart(2, '0')}`;
    const regex = new RegExp(`\\b${name}\\s*=\\s*(?:${hexValue}|${value})\\b`, 'i');
    if (!regex.test(fbsText)) {
      errors.push(
        `FlatBuffers SiegeNetOpcode enum is missing "${name} = ${hexValue}" matching src/game/siegeNetProtocol.ts.`
      );
    }
  }

  for (const bitName of getLiveCohortDirtyBitNames()) {
    if (!new RegExp(`\\b${bitName}\\s*=\\s*\\d+`).test(fbsText)) {
      errors.push(`FlatBuffers CohortDirtyBit enum is missing bit flag "${bitName}".`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateGrpcInternalProtoSchema(protoText: string): ProtocolValidationResult {
  const errors: string[] = [];

  if (!/^syntax\s*=\s*"proto3";/m.test(protoText)) {
    errors.push('Protobuf schema must declare syntax = "proto3";.');
  }
  if (!/^package\s+voxelrealms\.internal\.v1;/m.test(protoText)) {
    errors.push('Protobuf schema must declare package voxelrealms.internal.v1;.');
  }

  const requiredServices = [
    'ZoneHandoffService',
    'EconomyLedgerService',
    'AntiCheatTelemetryService',
    'GuildStorageLockService',
  ];
  for (const serviceName of requiredServices) {
    if (!new RegExp(`service\\s+${serviceName}\\s*\\{`).test(protoText)) {
      errors.push(`Protobuf schema is missing required internal gRPC service "${serviceName}".`);
    }
  }

  for (const sector of ALL_TERRITORY_SECTORS) {
    if (!new RegExp(`SECTOR_CODE_${sector}\\s*=\\s*\\d+;`).test(protoText)) {
      errors.push(`Protobuf SectorCode enum is missing "SECTOR_CODE_${sector}".`);
    }
  }

  return { ok: errors.length === 0, errors };
}
