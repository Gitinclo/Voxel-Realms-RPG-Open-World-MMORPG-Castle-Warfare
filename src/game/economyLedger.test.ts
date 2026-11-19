/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAuthoritativeEconomyTransaction,
  createInitialEconomyAccount,
  verifyEconomyLedgerIntegrity,
} from './economyLedger';

test('authoritative economy ledger credits, debits, and enforces idempotency replay protection', () => {
  const initial = createInitialEconomyAccount('cmdr-ledger-1', '2026-11-18T00:00:00.000Z');
  assert.equal(initial.balances.diamonds, '100');

  const credit = applyAuthoritativeEconomyTransaction(
    initial,
    {
      idempotencyKey: 'loot-drop-0001',
      resource: 'diamonds',
      direction: 'credit',
      amountWire: '250',
      reason: 'MONSTER_LOOT',
    },
    '2026-11-18T00:01:00.000Z'
  );
  assert.equal(credit.ok, true);
  if (!credit.ok) return;
  assert.equal(credit.replayed, false);
  assert.equal(credit.account.balances.diamonds, '350');
  assert.equal(credit.entry.seq, 1);

  // Exact replay of same idempotencyKey must NOT double-credit
  const replay = applyAuthoritativeEconomyTransaction(
    credit.account,
    {
      idempotencyKey: 'loot-drop-0001',
      resource: 'diamonds',
      direction: 'credit',
      amountWire: '250',
      reason: 'MONSTER_LOOT',
    },
    '2026-11-18T00:01:05.000Z'
  );
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.replayed, true);
  assert.equal(replay.entry.txId, credit.entry.txId);
  assert.equal(replay.account.balances.diamonds, '350');
  assert.equal(replay.account.ledger.length, 1);

  // Debit succeeds within balance
  const debit = applyAuthoritativeEconomyTransaction(
    replay.account,
    {
      idempotencyKey: 'promote-troop-0001',
      resource: 'diamonds',
      direction: 'debit',
      amountWire: '125',
      reason: 'TROOP_PROMOTION',
    },
    '2026-11-18T00:02:00.000Z'
  );
  assert.equal(debit.ok, true);
  if (!debit.ok) return;
  assert.equal(debit.account.balances.diamonds, '225');
  assert.equal(debit.entry.seq, 2);

  // Integrity check passes
  const check = verifyEconomyLedgerIntegrity(debit.account);
  assert.equal(check.valid, true);
  assert.equal(check.checkedEntries, 2);
});

test('authoritative economy ledger rejects overdrafts, unprivileged admin credits, and inflation exploits', () => {
  const account = createInitialEconomyAccount('cmdr-ledger-2');

  const overdraft = applyAuthoritativeEconomyTransaction(account, {
    idempotencyKey: 'overdraft-001',
    resource: 'diamonds',
    direction: 'debit',
    amountWire: '101',
    reason: 'VIP_DIAMOND_COVENANT',
  });
  assert.equal(overdraft.ok, false);
  if (!overdraft.ok) {
    assert.equal(overdraft.statusCode, 409);
    assert.equal(overdraft.code, 'INSUFFICIENT_FUNDS');
  }

  const inflation = applyAuthoritativeEconomyTransaction(account, {
    idempotencyKey: 'exploit-credit-001',
    resource: 'diamonds',
    direction: 'credit',
    amountWire: '50000000',
    reason: 'MONSTER_LOOT',
  });
  assert.equal(inflation.ok, false);
  if (!inflation.ok) {
    assert.equal(inflation.statusCode, 403);
    assert.equal(inflation.code, 'CREDIT_LIMIT_EXCEEDED');
  }

  const adminForged = applyAuthoritativeEconomyTransaction(account, {
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

test('verifyEconomyLedgerIntegrity detects hash-chain tampering', () => {
  const initial = createInitialEconomyAccount('cmdr-ledger-3');
  const tx1 = applyAuthoritativeEconomyTransaction(initial, {
    idempotencyKey: 'gather-wood-001',
    resource: 'wood',
    direction: 'credit',
    amountWire: '1000',
    reason: 'GATHER_REWARD',
  });
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

  // Mutate a historical ledger record to simulate disk tampering
  const tampered = structuredClone(tx2.account);
  tampered.ledger[0].amountWire = '999999';
  const check = verifyEconomyLedgerIntegrity(tampered);
  assert.equal(check.valid, false);
  assert.equal(check.brokenAtSeq, 1);
});
