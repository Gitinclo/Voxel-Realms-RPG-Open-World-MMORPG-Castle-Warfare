/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_LEDGER_REASONS,
  applyAuthoritativeEconomyTransaction,
  claimAuthoritativeGameplayAction,
  createInitialEconomyAccount,
  validateAndApplyGameplayEvent,
  verifyEconomyLedgerIntegrity,
} from './economyLedger';

test('ledger strictly rejects arbitrary credits across all non-authorized reasons for players and staff', () => {
  const initial = createInitialEconomyAccount('cmdr-exploit-1', '2026-11-18T00:00:00.000Z');

  for (const reason of ALLOWED_LEDGER_REASONS) {
    const playerAttempt = applyAuthoritativeEconomyTransaction(initial, {
      idempotencyKey: `player-arbitrary-${reason}`,
      resource: 'diamonds',
      direction: 'credit',
      amountWire: '500',
      reason,
      isPrivilegedStaff: false,
    });
    assert.equal(playerAttempt.ok, false, `Expected player credit with ${reason} to be rejected`);
    if (!playerAttempt.ok) {
      assert.equal(playerAttempt.statusCode, 403);
      assert.equal(
        playerAttempt.code,
        reason === 'ADMIN_ADJUSTMENT' ? 'ADMIN_REASON_FORBIDDEN' : 'CLIENT_SELF_CREDIT_FORBIDDEN'
      );
    }

    if (reason !== 'ADMIN_ADJUSTMENT') {
      const staffArbitraryAttempt = applyAuthoritativeEconomyTransaction(initial, {
        idempotencyKey: `staff-arbitrary-${reason}`,
        resource: 'wood',
        direction: 'credit',
        amountWire: '500',
        reason,
        isPrivilegedStaff: true,
      });
      assert.equal(
        staffArbitraryAttempt.ok,
        false,
        `Expected non-ADMIN_ADJUSTMENT staff credit with ${reason} to be rejected`
      );
      if (!staffArbitraryAttempt.ok) {
        assert.equal(staffArbitraryAttempt.statusCode, 403);
        assert.equal(staffArbitraryAttempt.code, 'CLIENT_SELF_CREDIT_FORBIDDEN');
      }
    }
  }

  // Only explicit privileged ADMIN_ADJUSTMENT credits succeed directly without a gameplay event
  const validStaffGrant = applyAuthoritativeEconomyTransaction(initial, {
    idempotencyKey: 'staff-valid-grant-001',
    resource: 'diamonds',
    direction: 'credit',
    amountWire: '25',
    reason: 'ADMIN_ADJUSTMENT',
    isPrivilegedStaff: true,
  });
  assert.equal(validStaffGrant.ok, true);
  if (validStaffGrant.ok) {
    assert.equal(validStaffGrant.account.balances.diamonds, '125');
  }
});

test('validateAndApplyGameplayEvent rejects client payload overrides, invalid sectors, and forged timestamps', () => {
  const t0 = 1_800_000_000_000;
  const initial = createInitialEconomyAccount('cmdr-event-sec', new Date(t0).toISOString());

  const forgedOverrides: Array<Record<string, unknown>> = [
    { idempotencyKey: 'evt-override-1', eventType: 'SLAY_PATROL_MONSTER', amountWire: '999999' },
    { idempotencyKey: 'evt-override-2', eventType: 'SLAY_PATROL_MONSTER', resource: 'diamonds' },
    { idempotencyKey: 'evt-override-3', eventType: 'SLAY_PATROL_MONSTER', direction: 'credit' },
    { idempotencyKey: 'evt-override-4', eventType: 'SLAY_PATROL_MONSTER', reason: 'MONSTER_LOOT' },
    {
      idempotencyKey: 'evt-override-5',
      eventType: 'SLAY_PATROL_MONSTER',
      serverAuthorizedCredit: true,
    },
    {
      idempotencyKey: 'evt-override-6',
      eventType: 'SLAY_PATROL_MONSTER',
      isPrivilegedStaff: true,
    },
  ];

  for (const payload of forgedOverrides) {
    const res = validateAndApplyGameplayEvent(initial, payload, t0);
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.statusCode, 400);
      assert.equal(res.code, 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN');
    }
  }

  const badSector = validateAndApplyGameplayEvent(
    initial,
    { idempotencyKey: 'evt-bad-sector-1', eventType: 'GATHER_WOOD_NODE', sectorId: 'Z99' },
    t0
  );
  assert.equal(badSector.ok, false);
  if (!badSector.ok) {
    assert.equal(badSector.statusCode, 400);
    assert.equal(badSector.code, 'INVALID_EVENT_CONTEXT');
  }

  const staleEvent = validateAndApplyGameplayEvent(
    initial,
    {
      idempotencyKey: 'evt-stale-1',
      eventType: 'GATHER_WOOD_NODE',
      sectorId: 'A1',
      occurredAtMs: t0 - 10 * 60 * 1000,
    },
    t0
  );
  assert.equal(staleEvent.ok, false);
  if (!staleEvent.ok) {
    assert.equal(staleEvent.statusCode, 400);
    assert.equal(staleEvent.code, 'INVALID_EVENT_TIMESTAMP');
  }

  const validEvent = validateAndApplyGameplayEvent(
    initial,
    {
      idempotencyKey: 'evt-valid-wood-01',
      eventType: 'GATHER_WOOD_NODE',
      sectorId: 'B2',
      entityId: 'node-forest-12',
      occurredAtMs: t0 - 500,
    },
    t0
  );
  assert.equal(validEvent.ok, true);
  if (validEvent.ok) {
    assert.equal(validEvent.account.balances.wood, '5150');
    assert.equal(validEvent.entry.amountWire, '150');
    assert.equal(validEvent.entry.reason, 'GATHER_REWARD');
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
