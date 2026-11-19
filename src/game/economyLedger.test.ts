/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_LEDGER_REASONS,
  applyAuthoritativeCastleUpgrade,
  applyAuthoritativeEconomyTransaction,
  applyAuthoritativeMarketTrade,
  applyAuthoritativeTroopPurchase,
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
    assert.ok(validStaffGrant.entry.eventId.startsWith('evt_'));
  }
});

test('validateAndApplyGameplayEvent derives quest, VIP stipend, gathering, and siege rewards while rejecting payload tampering', () => {
  const t0 = 1_800_000_000_000;
  const initial = createInitialEconomyAccount('cmdr-event-sec', new Date(t0).toISOString());

  const forgedOverrides: Array<Record<string, unknown>> = [
    { idempotencyKey: 'evt-override-1', eventType: 'SLAY_PATROL_MONSTER', amountWire: '999999' },
    {
      idempotencyKey: 'evt-override-2',
      eventType: 'COMPLETE_QUEST_MILESTONE',
      resource: 'diamonds',
    },
    { idempotencyKey: 'evt-override-3', eventType: 'CLAIM_VIP_DAILY_STIPEND', direction: 'credit' },
    {
      idempotencyKey: 'evt-override-4',
      eventType: 'SIEGE_CHECKPOINT_REWARD',
      reason: 'SIEGE_REWARD',
    },
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

  // Quest reward (+25 diamonds)
  const questRes = validateAndApplyGameplayEvent(
    initial,
    { idempotencyKey: 'evt-quest-01', eventType: 'COMPLETE_QUEST_MILESTONE', sectorId: 'B2' },
    t0
  );
  assert.equal(questRes.ok, true);
  if (!questRes.ok) return;
  assert.equal(questRes.account.balances.diamonds, '125');
  assert.equal(questRes.entry.reason, 'QUEST_REWARD');
  assert.ok(questRes.entry.eventId.startsWith('reward_'));

  // VIP daily stipend (+50 diamonds, 24h cooldown)
  const vipRes = validateAndApplyGameplayEvent(
    questRes.account,
    { idempotencyKey: 'evt-vip-01', eventType: 'CLAIM_VIP_DAILY_STIPEND' },
    t0
  );
  assert.equal(vipRes.ok, true);
  if (!vipRes.ok) return;
  assert.equal(vipRes.account.balances.diamonds, '175');
  assert.equal(vipRes.entry.reason, 'VIP_DAILY_STIPEND');

  // VIP daily stipend fresh-key retry 1 hour later must fail with 429 cooldown
  const vipCooldown = validateAndApplyGameplayEvent(
    vipRes.account,
    { idempotencyKey: 'evt-vip-02-spam', eventType: 'CLAIM_VIP_DAILY_STIPEND' },
    t0 + 3_600_000
  );
  assert.equal(vipCooldown.ok, false);
  if (!vipCooldown.ok) {
    assert.equal(vipCooldown.statusCode, 429);
    assert.equal(vipCooldown.code, 'ACTION_COOLDOWN_ACTIVE');
  }
});

test('server-authoritative Castle Upgrades, Troop Purchases, and Marketplace Trades with 5% tax enforce costs, tier locks, and idempotency', () => {
  const t0 = '2026-11-19T10:00:00.000Z';
  const initial = createInitialEconomyAccount('cmdr-auth-econ', t0);
  // Initial balances: wood=5000, steel=3000, grain=5000, diamonds=100, castleLevel=1

  // 1. Forged cost override on castle upgrade rejected
  const forgedCastle = applyAuthoritativeCastleUpgrade(
    initial,
    { idempotencyKey: 'castle-forged-1', cost: '1' },
    t0
  );
  assert.equal(forgedCastle.ok, false);
  if (!forgedCastle.ok) {
    assert.equal(forgedCastle.statusCode, 400);
    assert.equal(forgedCastle.code, 'CLIENT_PAYLOAD_OVERRIDE_FORBIDDEN');
  }

  // 2. Legitimate Castle Lv.1 -> Lv.2 (server derives wood=400, steel=250, grain=300)
  const upg1 = applyAuthoritativeCastleUpgrade(initial, { idempotencyKey: 'castle-upg-001' }, t0);
  assert.equal(upg1.ok, true);
  if (!upg1.ok) return;
  assert.equal(upg1.replayed, false);
  assert.equal(upg1.newLevel, 2);
  assert.equal(upg1.costs.wood, '400');
  assert.equal(upg1.costs.steel, '250');
  assert.equal(upg1.costs.grain, '300');
  assert.equal(upg1.account.balances.wood, '4600');
  assert.equal(upg1.account.balances.steel, '2750');
  assert.equal(upg1.account.balances.grain, '4700');

  // Replay does not double-upgrade or double-deduct
  const upgReplay = applyAuthoritativeCastleUpgrade(
    upg1.account,
    { idempotencyKey: 'castle-upg-001' },
    t0
  );
  assert.equal(upgReplay.ok, true);
  if (!upgReplay.ok) return;
  assert.equal(upgReplay.replayed, true);
  assert.equal(upgReplay.account.castleLevel, 2);
  assert.equal(upgReplay.account.balances.wood, '4600');

  // 3. Troop purchase enforces Castle tier unlock (Lv.2 unlocks T1 only; T2 must fail with 403)
  const lockedTroop = applyAuthoritativeTroopPurchase(
    upg1.account,
    { idempotencyKey: 'troop-locked-t2', branch: 'shieldbearers', tier: 2, quantity: 5 },
    t0
  );
  assert.equal(lockedTroop.ok, false);
  if (!lockedTroop.ok) {
    assert.equal(lockedTroop.statusCode, 403);
    assert.equal(lockedTroop.code, 'TIER_LOCKED_BY_CASTLE_LEVEL');
  }

  // Valid T1 Shieldbearers purchase (qty=5 -> wood=200, grain=125, steel=150)
  const troopBuy = applyAuthoritativeTroopPurchase(
    upg1.account,
    { idempotencyKey: 'troop-buy-t1-01', branch: 'shieldbearers', tier: 1, quantity: 5 },
    t0
  );
  assert.equal(troopBuy.ok, true);
  if (!troopBuy.ok) return;
  assert.equal(troopBuy.replayed, false);
  assert.equal(troopBuy.newBranchTierCount, 15);
  assert.equal(troopBuy.costs.wood, '200');
  assert.equal(troopBuy.costs.grain, '125');
  assert.equal(troopBuy.costs.steel, '150');
  assert.equal(troopBuy.account.balances.wood, '4400');

  // Replay returns original without double-training
  const troopReplay = applyAuthoritativeTroopPurchase(
    troopBuy.account,
    { idempotencyKey: 'troop-buy-t1-01', branch: 'shieldbearers', tier: 1, quantity: 5 },
    t0
  );
  assert.equal(troopReplay.ok, true);
  if (!troopReplay.ok) return;
  assert.equal(troopReplay.replayed, true);
  assert.equal(troopReplay.account.troops.shieldbearers[1], 15);

  // 4. Marketplace trade derives exchange output and 5% Imperial Market Tax
  // Trade 1000 wood (weight 1) -> grain (weight 1): gross=1000, tax=50 (5%), net=950
  const tradeRes = applyAuthoritativeMarketTrade(
    troopBuy.account,
    {
      idempotencyKey: 'mkt-trade-001',
      fromResource: 'wood',
      toResource: 'grain',
      inputAmountWire: '1000',
    },
    t0
  );
  assert.equal(tradeRes.ok, true);
  if (!tradeRes.ok) return;
  assert.equal(tradeRes.replayed, false);
  assert.equal(tradeRes.grossOutputWire, '1000');
  assert.equal(tradeRes.taxAmountWire, '50');
  assert.equal(tradeRes.netOutputWire, '950');
  assert.equal(tradeRes.taxBps, 500);
  assert.equal(tradeRes.account.balances.wood, '3400');
  assert.equal(tradeRes.account.balances.grain, String(4700 - 125 + 950));
  assert.equal(tradeRes.account.totalTaxCollectedWire, '50');

  // Market trade replay does not double-credit or double-tax
  const tradeReplay = applyAuthoritativeMarketTrade(
    tradeRes.account,
    {
      idempotencyKey: 'mkt-trade-001',
      fromResource: 'wood',
      toResource: 'grain',
      inputAmountWire: '1000',
    },
    t0
  );
  assert.equal(tradeReplay.ok, true);
  if (!tradeReplay.ok) return;
  assert.equal(tradeReplay.replayed, true);
  assert.equal(tradeReplay.account.balances.wood, '3400');

  // Hash-chain integrity holds across all 8 committed entries (3 castle + 3 troop + 2 market)
  const check = verifyEconomyLedgerIntegrity(tradeRes.account);
  assert.equal(check.valid, true);
  assert.equal(check.checkedEntries, 8);
});

test('server-authoritative gameplay actions derive rewards, deduplicate replays, and block cooldown minting with fresh keys', () => {
  const t0 = 1_800_000_000_000;
  const initial = createInitialEconomyAccount('cmdr-ledger-1', new Date(t0).toISOString());
  assert.equal(initial.balances.diamonds, '100');

  const claim1 = claimAuthoritativeGameplayAction(
    initial,
    { idempotencyKey: 'slay-patrol-0001', actionType: 'SLAY_PATROL_MONSTER' },
    t0
  );
  assert.equal(claim1.ok, true);
  if (!claim1.ok) return;
  assert.equal(claim1.replayed, false);
  assert.equal(claim1.account.balances.diamonds, '110');

  const replay = claimAuthoritativeGameplayAction(
    claim1.account,
    { idempotencyKey: 'slay-patrol-0001', actionType: 'SLAY_PATROL_MONSTER' },
    t0 + 1_000
  );
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.replayed, true);
  assert.equal(replay.entry.txId, claim1.entry.txId);

  const spamAttempt = claimAuthoritativeGameplayAction(
    replay.account,
    { idempotencyKey: 'slay-patrol-0002-spam', actionType: 'SLAY_PATROL_MONSTER' },
    t0 + 2_000
  );
  assert.equal(spamAttempt.ok, false);
  if (!spamAttempt.ok) {
    assert.equal(spamAttempt.statusCode, 429);
    assert.equal(spamAttempt.code, 'ACTION_COOLDOWN_ACTIVE');
  }

  const claim2 = claimAuthoritativeGameplayAction(
    replay.account,
    { idempotencyKey: 'slay-patrol-0003-valid', actionType: 'SLAY_PATROL_MONSTER' },
    t0 + 11_000
  );
  assert.equal(claim2.ok, true);
  if (!claim2.ok) return;
  assert.equal(claim2.account.balances.diamonds, '120');

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

  const check = verifyEconomyLedgerIntegrity(debit.account);
  assert.equal(check.valid, true);
  assert.equal(check.checkedEntries, 3);
});

test('verifyEconomyLedgerIntegrity detects hash-chain tampering', () => {
  const t0 = 1_800_000_000_000;
  const initial = createInitialEconomyAccount('cmdr-ledger-3', new Date(t0).toISOString());
  const tx1 = claimAuthoritativeGameplayAction(
    initial,
    { idempotencyKey: 'gather-wood-001', actionType: 'GATHER_WOOD_NODE' },
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
