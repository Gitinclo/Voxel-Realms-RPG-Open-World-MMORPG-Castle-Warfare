/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAuthoritativeEconomyTransaction,
  claimAuthoritativeGameplayAction,
  createInitialEconomyAccount,
  verifyEconomyLedgerIntegrity,
} from './economyLedger';

test('clients CANNOT mint rewards directly via arbitrary credits even with fresh idempotency keys', () => {
  const initial = createInitialEconomyAccount('cmdr-exploit-1', '2026-11-18T00:00:00.000Z');

  const selfCreditLoot = applyAuthoritativeEconomyTransaction(initial, {
    idempotencyKey: 'fresh-mint-key-001',
    resource: 'diamonds',
    direction: 'credit',
    amountWire: '50',
    reason: 'MONSTER_LOOT',
    isPrivilegedStaff: false,
  });
  assert.equal(selfCreditLoot.ok, false);
  if (!selfCreditLoot.ok) {
    assert.equal(selfCreditLoot.statusCode, 403);
    assert.equal(selfCreditLoot.code, 'CLIENT_SELF_CREDIT_FORBIDDEN');
  }

  const selfCreditGather = applyAuthoritativeEconomyTransaction(initial, {
    idempotencyKey: 'fresh-mint-key-002',
    resource: 'wood',
    direction: 'credit',
    amountWire: '500',
    reason: 'GATHER_REWARD',
    isPrivilegedStaff: false,
  });
  assert.equal(selfCreditGather.ok, false);
  if (!selfCreditGather.ok) {
    assert.equal(selfCreditGather.statusCode, 403);
    assert.equal(selfCreditGather.code, 'CLIENT_SELF_CREDIT_FORBIDDEN');
  }

  const adminForged = applyAuthoritativeEconomyTransaction(initial, {
    idempotencyKey: 'forged-admin-001',
    resource: 'wood',
    direction: 'credit',
    amountWire: '500',
    reason: 'ADMIN_ADJUSTMENT',
    isPrivilegedStaff: false,
  });
  assert.equal(adminForged.ok, false);
  if (!adminForged.ok) {
    assert.equal(adminForged.statusCode, 403);
    assert.equal(adminForged.code, 'ADMIN_REASON_FORBIDDEN');
  }
});

test('server-authoritative gameplay actions derive rewards, deduplicate replays, and block cooldown minting with fresh keys', () => {
  const t0 = 1_800_000_000_000;
  const initial = createInitialEconomyAccount('cmdr-ledger-1', new Date(t0).toISOString());
  assert.equal(initial.balances.diamonds, '100');

  // 1. Valid server-derived monster slay reward (+10 diamonds, 10s cooldown)
  const claim1 = claimAuthoritativeGameplayAction(
    initial,
    {
      idempotencyKey: 'slay-patrol-0001',
      actionType: 'SLAY_PATROL_MONSTER',
    },
    t0
  );
  assert.equal(claim1.ok, true);
  if (!claim1.ok) return;
  assert.equal(claim1.replayed, false);
  assert.equal(claim1.account.balances.diamonds, '110');
  assert.equal(claim1.entry.amountWire, '10');
  assert.equal(claim1.entry.reason, 'MONSTER_LOOT');

  // 2. Exact idempotency replay returns original entry without double-crediting
  const replay = claimAuthoritativeGameplayAction(
    claim1.account,
    {
      idempotencyKey: 'slay-patrol-0001',
      actionType: 'SLAY_PATROL_MONSTER',
    },
    t0 + 1_000
  );
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.replayed, true);
  assert.equal(replay.entry.txId, claim1.entry.txId);
  assert.equal(replay.account.balances.diamonds, '110');

  // 3. Spamming a FRESH idempotency key inside the 10s cooldown window is blocked with 429
  const spamAttempt = claimAuthoritativeGameplayAction(
    replay.account,
    {
      idempotencyKey: 'slay-patrol-0002-spam',
      actionType: 'SLAY_PATROL_MONSTER',
    },
    t0 + 2_000
  );
  assert.equal(spamAttempt.ok, false);
  if (!spamAttempt.ok) {
    assert.equal(spamAttempt.statusCode, 429);
    assert.equal(spamAttempt.code, 'ACTION_COOLDOWN_ACTIVE');
    assert.ok((spamAttempt.retryAfterSec ?? 0) >= 8);
  }

  // 4. After cooldown elapses, next legitimate claim succeeds
  const claim2 = claimAuthoritativeGameplayAction(
    replay.account,
    {
      idempotencyKey: 'slay-patrol-0003-valid',
      actionType: 'SLAY_PATROL_MONSTER',
    },
    t0 + 11_000
  );
  assert.equal(claim2.ok, true);
  if (!claim2.ok) return;
  assert.equal(claim2.account.balances.diamonds, '120');

  // 5. Player spend (debit) succeeds within balance and rejects overdrafts
  const debit = applyAuthoritativeEconomyTransaction(
    claim2.account,
    {
      idempotencyKey: 'promote-troop-0001',
      resource: 'diamonds',
      direction: 'debit',
      amountWire: '50',
      reason: 'TROOP_PROMOTION',
    },
    new Date(t0 + 12_000).toISOString()
  );
  assert.equal(debit.ok, true);
  if (!debit.ok) return;
  assert.equal(debit.account.balances.diamonds, '70');

  const overdraft = applyAuthoritativeEconomyTransaction(debit.account, {
    idempotencyKey: 'overdraft-001',
    resource: 'diamonds',
    direction: 'debit',
    amountWire: '71',
    reason: 'VIP_DIAMOND_COVENANT',
  });
  assert.equal(overdraft.ok, false);
  if (!overdraft.ok) {
    assert.equal(overdraft.statusCode, 409);
    assert.equal(overdraft.code, 'INSUFFICIENT_FUNDS');
  }

  // 6. Hash-chain integrity passes across all 3 committed entries
  const check = verifyEconomyLedgerIntegrity(debit.account);
  assert.equal(check.valid, true);
  assert.equal(check.checkedEntries, 3);
});

test('verifyEconomyLedgerIntegrity detects hash-chain tampering', () => {
  const t0 = 1_800_000_000_000;
  const initial = createInitialEconomyAccount('cmdr-ledger-3', new Date(t0).toISOString());
  const tx1 = claimAuthoritativeGameplayAction(
    initial,
    {
      idempotencyKey: 'gather-wood-001',
      actionType: 'GATHER_WOOD_NODE',
    },
    t0
  );
  assert.equal(tx1.ok, true);
  if (!tx1.ok) return;

  const tx2 = applyAuthoritativeEconomyTransaction(tx1.account, {
    idempotencyKey: 'upgrade-castle-001',
    resource: 'wood',
    direction: 'debit',
    amountWire: '500',
    reason: 'CASTLE_UPGRADE',
  });
  assert.equal(tx2.ok, true);
  if (!tx2.ok) return;

  const tampered = structuredClone(tx2.account);
  tampered.ledger[0].amountWire = '999999';
  const check = verifyEconomyLedgerIntegrity(tampered);
  assert.equal(check.valid, false);
  assert.equal(check.brokenAtSeq, 1);
});
