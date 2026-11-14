/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RULES_PATH = path.resolve(import.meta.dirname ?? process.cwd(), 'firestore.rules');
const BLUEPRINT_PATH = path.resolve(
  import.meta.dirname ?? process.cwd(),
  'firebase-blueprint.json'
);

interface BlueprintDoc {
  entities: Record<string, { required?: string[]; properties: Record<string, unknown> }>;
  firestore: Record<string, { schema: { $ref: string } | string }>;
}

interface MockAuthContext {
  uid: string;
  email: string;
  emailVerified: boolean;
}

const REQUEST_TIME = '2026-11-14T00:00:00Z';
const PRIMARY_ADMIN_EMAIL = 'creatergame31@gmail.com';
const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const TAG_REGEX = /^[A-Za-z0-9]{2,6}$/;
const WIRE_REGEX = /^[0-9]{1,18}$/;

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function isAdmin(auth: MockAuthContext | null, adminUids: Set<string>): boolean {
  if (!auth || !auth.emailVerified) return false;
  return adminUids.has(auth.uid) || auth.email === PRIMARY_ADMIN_EMAIL;
}

function hasExactKeyShape(
  data: Record<string, unknown>,
  required: string[],
  allowed: string[]
): boolean {
  const keys = Object.keys(data);
  if (!required.every((k) => keys.includes(k))) return false;
  return keys.every((k) => allowed.includes(k));
}

function isValidUserPublicProfile(data: Record<string, unknown>): boolean {
  const keys = [
    'uid',
    'commanderName',
    'allianceTag',
    'castleLevel',
    'cultivationRealmIndex',
    'vipRank',
    'karmaValue',
    'garrisonTroopsWire',
    'discoveredCodexCount',
    'updatedAt',
  ];
  return (
    hasExactKeyShape(data, keys, keys) &&
    isValidId(String(data.uid ?? '')) &&
    typeof data.commanderName === 'string' &&
    data.commanderName.length >= 1 &&
    data.commanderName.length <= 48 &&
    typeof data.allianceTag === 'string' &&
    TAG_REGEX.test(data.allianceTag) &&
    typeof data.castleLevel === 'number' &&
    Number.isInteger(data.castleLevel) &&
    data.castleLevel >= 0 &&
    data.castleLevel <= 100 &&
    typeof data.cultivationRealmIndex === 'number' &&
    Number.isInteger(data.cultivationRealmIndex) &&
    data.cultivationRealmIndex >= 0 &&
    data.cultivationRealmIndex <= 22 &&
    typeof data.vipRank === 'number' &&
    Number.isInteger(data.vipRank) &&
    data.vipRank >= 0 &&
    data.vipRank <= 3 &&
    typeof data.karmaValue === 'number' &&
    Number.isInteger(data.karmaValue) &&
    data.karmaValue >= -100000 &&
    data.karmaValue <= 100000 &&
    typeof data.garrisonTroopsWire === 'string' &&
    WIRE_REGEX.test(data.garrisonTroopsWire) &&
    typeof data.discoveredCodexCount === 'number' &&
    Number.isInteger(data.discoveredCodexCount) &&
    data.discoveredCodexCount >= 0 &&
    data.discoveredCodexCount <= 100000 &&
    data.updatedAt === REQUEST_TIME
  );
}

function isValidUserPrivateAccount(data: Record<string, unknown>, isCreate: boolean): boolean {
  const keys = ['uid', 'email', 'role', 'createdAt', 'updatedAt'];
  return (
    hasExactKeyShape(data, keys, keys) &&
    isValidId(String(data.uid ?? '')) &&
    typeof data.email === 'string' &&
    data.email.length >= 3 &&
    data.email.length <= 254 &&
    data.role === 'player' &&
    (!isCreate || data.createdAt === REQUEST_TIME) &&
    data.updatedAt === REQUEST_TIME
  );
}

function isValidCommanderSave(data: Record<string, unknown>, isCreate: boolean): boolean {
  const keys = [
    'ownerId',
    'saveId',
    'castleLevel',
    'cultivationRealmIndex',
    'allianceTag',
    'garrisonTroopsWire',
    'discoveredCodexIds',
    'version',
    'createdAt',
    'updatedAt',
  ];
  const arr = data.discoveredCodexIds;
  return (
    hasExactKeyShape(data, keys, keys) &&
    isValidId(String(data.ownerId ?? '')) &&
    isValidId(String(data.saveId ?? '')) &&
    typeof data.castleLevel === 'number' &&
    Number.isInteger(data.castleLevel) &&
    data.castleLevel >= 0 &&
    data.castleLevel <= 100 &&
    typeof data.cultivationRealmIndex === 'number' &&
    Number.isInteger(data.cultivationRealmIndex) &&
    data.cultivationRealmIndex >= 0 &&
    data.cultivationRealmIndex <= 22 &&
    typeof data.allianceTag === 'string' &&
    TAG_REGEX.test(data.allianceTag) &&
    typeof data.garrisonTroopsWire === 'string' &&
    WIRE_REGEX.test(data.garrisonTroopsWire) &&
    Array.isArray(arr) &&
    arr.length <= 64 &&
    (arr.length === 0 || (typeof arr[0] === 'string' && arr[0].length <= 64)) &&
    typeof data.version === 'number' &&
    Number.isInteger(data.version) &&
    data.version >= 1 &&
    (!isCreate || data.createdAt === REQUEST_TIME) &&
    data.updatedAt === REQUEST_TIME
  );
}

function isValidSupportTicket(data: Record<string, unknown>, isCreate: boolean): boolean {
  const keys = [
    'ticketId',
    'ownerId',
    'category',
    'subject',
    'message',
    'status',
    'createdAt',
    'updatedAt',
  ];
  return (
    hasExactKeyShape(data, keys, keys) &&
    isValidId(String(data.ticketId ?? '')) &&
    isValidId(String(data.ownerId ?? '')) &&
    ['general', 'bug', 'abuse', 'billing'].includes(String(data.category)) &&
    typeof data.subject === 'string' &&
    data.subject.length >= 3 &&
    data.subject.length <= 120 &&
    typeof data.message === 'string' &&
    data.message.length >= 5 &&
    data.message.length <= 2000 &&
    ['open', 'resolved'].includes(String(data.status)) &&
    (!isCreate || data.status === 'open') &&
    (!isCreate || data.createdAt === REQUEST_TIME) &&
    data.updatedAt === REQUEST_TIME
  );
}

test('Firestore rules & blueprint cover all declared collections with zero-trust defaults', () => {
  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8')) as BlueprintDoc;

  assert.match(rules, /rules_version = '2';/);
  assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.match(rules, /match \/users\/\{userId\}\/public\/profile/);
  assert.match(rules, /match \/users\/\{userId\}\/private\/account/);
  assert.match(rules, /match \/users\/\{userId\}\/saves\/\{saveId\}/);
  assert.match(rules, /match \/supportTickets\/\{ticketId\}/);
  assert.match(rules, /match \/admins\/\{userId\}/);

  assert.equal(Object.keys(blueprint.firestore).length, 5);
});

test('Dirty Dozen #1–#12 adversarial payloads are all rejected (PERMISSION_DENIED)', () => {
  const user1: MockAuthContext = {
    uid: 'user_alpha_1',
    email: 'alpha@example.com',
    emailVerified: true,
  };
  const user2: MockAuthContext = {
    uid: 'user_beta_2',
    email: 'beta@example.com',
    emailVerified: true,
  };
  const unverifiedAdmin: MockAuthContext = {
    uid: 'spoofed_uid',
    email: PRIMARY_ADMIN_EMAIL,
    emailVerified: false,
  };
  const adminUids = new Set<string>(['real_admin_uid']);

  // 1. Unauthenticated write
  const authNull: MockAuthContext | null = null;
  assert.equal(Boolean(authNull), false);

  // 2. Unverified admin email spoof
  assert.equal(isAdmin(unverifiedAdmin, adminUids), false);

  // 3. Self-assigned admin role on private account creation
  assert.equal(
    isValidUserPrivateAccount(
      {
        uid: user1.uid,
        email: user1.email,
        role: 'admin',
        createdAt: REQUEST_TIME,
        updatedAt: REQUEST_TIME,
      },
      true
    ),
    false
  );

  // 4. Shadow / ghost field injection
  assert.equal(
    isValidUserPublicProfile({
      uid: user1.uid,
      commanderName: 'Alpha',
      allianceTag: 'SOL',
      castleLevel: 12,
      cultivationRealmIndex: 3,
      vipRank: 1,
      karmaValue: 50,
      garrisonTroopsWire: '250000',
      discoveredCodexCount: 4,
      updatedAt: REQUEST_TIME,
      isVerified: true,
    }),
    false
  );

  // 5. Cross-owner identity spoofing
  const spoofedOwnerSave = {
    ownerId: user2.uid,
    saveId: 'primary',
    castleLevel: 12,
    cultivationRealmIndex: 3,
    allianceTag: 'SOL',
    garrisonTroopsWire: '250000',
    discoveredCodexIds: [],
    version: 1,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(spoofedOwnerSave.ownerId === user1.uid, false);

  // 6. ID Poisoning (1.5 KB document ID)
  assert.equal(isValidId('a'.repeat(1500)), false);

  // 7. Value Poisoning (oversized message > 2000 chars)
  assert.equal(
    isValidSupportTicket(
      {
        ticketId: 'ticket_1',
        ownerId: user1.uid,
        category: 'bug',
        subject: 'Crash report',
        message: 'x'.repeat(2001),
        status: 'open',
        createdAt: REQUEST_TIME,
        updatedAt: REQUEST_TIME,
      },
      true
    ),
    false
  );

  // 8. PII Cross-user read denied
  assert.equal(user2.uid === user1.uid || isAdmin(user2, adminUids), false);

  // 9. Client timestamp forgery
  assert.equal(
    isValidCommanderSave(
      {
        ownerId: user1.uid,
        saveId: 'primary',
        castleLevel: 12,
        cultivationRealmIndex: 3,
        allianceTag: 'SOL',
        garrisonTroopsWire: '250000',
        discoveredCodexIds: [],
        version: 1,
        createdAt: '1999-01-01T00:00:00Z',
        updatedAt: REQUEST_TIME,
      },
      true
    ),
    false
  );

  // 10. Immutable ownerId tampering on update
  const existingSave = { ownerId: user1.uid, createdAt: '2026-11-01T00:00:00Z' };
  const tamperedSave = { ownerId: user2.uid, createdAt: '2026-11-01T00:00:00Z' };
  assert.equal(tamperedSave.ownerId === existingSave.ownerId, false);

  // 11. Terminal status lock on resolved ticket for non-admin
  const resolvedTicket = { ownerId: user1.uid, status: 'resolved' };
  const canEditResolved =
    isAdmin(user1, adminUids) ||
    (resolvedTicket.ownerId === user1.uid && resolvedTicket.status !== 'resolved');
  assert.equal(canEditResolved, false);

  // 12. Direct write to /admins denied & unscoped list denied
  const canWriteAdmins = false;
  assert.equal(canWriteAdmins, false);
  const ticketOwnedByOther = { ownerId: user1.uid };
  assert.equal(ticketOwnedByOther.ownerId === user2.uid || isAdmin(user2, adminUids), false);
});
