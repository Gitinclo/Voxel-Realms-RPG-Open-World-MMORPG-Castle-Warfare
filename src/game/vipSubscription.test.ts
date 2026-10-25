/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_VIP_SUBSCRIPTION_STATE,
  VIP_TIER_CONFIGS,
  activateVipSubscription,
  applyVipDiscountToCosts,
  calculateVipLoyaltyStatus,
  calculateVipRallyCapacity,
  checkVipFeatureAccess,
  claimVipDailyStipend,
  evaluateVipSubscription,
} from './vipSubscription';

test('VIP Member Subscription — Tiers, Multipliers, Stipends & Billing Lifecycle', async (t) => {
  await t.test('evaluates Free Sovereign tier baseline accurately', () => {
    const evalState = evaluateVipSubscription(INITIAL_VIP_SUBSCRIPTION_STATE, '2026-10-23');
    assert.equal(evalState.isActiveSubscriber, false);
    assert.equal(evalState.tierConfig.id, 'free');
    assert.equal(evalState.canClaimDailyStipend, true);
    assert.equal(evalState.totalEffectiveCultivationMultiplier, 1.0);
    assert.equal(evalState.totalEffectiveGatherMultiplier, 1.0);
    assert.equal(evalState.castleDiscountMultiplier, 1.0);
    assert.ok(evalState.vipLoyaltyLevel >= 1);
  });

  await t.test(
    'activates Monthly and Annual VIP tiers with accurate duration and instant bonuses',
    () => {
      const silverMonthly = activateVipSubscription(
        INITIAL_VIP_SUBSCRIPTION_STATE,
        'silver_vanguard',
        'monthly',
        '2026-10-23'
      );
      assert.equal(silverMonthly.nextState.activeTier, 'silver_vanguard');
      assert.equal(silverMonthly.nextState.expiresAtDaysRemaining, 30);
      assert.equal(
        silverMonthly.instantBonusDiamonds,
        VIP_TIER_CONFIGS.silver_vanguard.instantActivationDiamonds
      );

      const celestialAnnual = activateVipSubscription(
        silverMonthly.nextState,
        'celestial_sovereign',
        'annual',
        '2026-10-23'
      );
      assert.equal(celestialAnnual.nextState.activeTier, 'celestial_sovereign');
      assert.equal(celestialAnnual.nextState.expiresAtDaysRemaining, 365);
      assert.equal(
        celestialAnnual.instantBonusDiamonds,
        VIP_TIER_CONFIGS.celestial_sovereign.instantActivationDiamonds * 3n
      );

      const evalCelestial = evaluateVipSubscription(celestialAnnual.nextState, '2026-10-23');
      assert.equal(evalCelestial.isActiveSubscriber, true);
      assert.equal(evalCelestial.totalEffectiveCultivationMultiplier, 2.2);
      assert.equal(evalCelestial.totalEffectiveGatherMultiplier, 2.0);
      assert.equal(evalCelestial.castleDiscountMultiplier, 0.65);

      // Verify 5x diamond costs for monthly & annual tiers
      assert.equal(VIP_TIER_CONFIGS.silver_vanguard.monthlyDiamondCost, 12_500n);
      assert.equal(VIP_TIER_CONFIGS.silver_vanguard.annualDiamondCost, 120_000n);
      assert.equal(VIP_TIER_CONFIGS.golden_immortal.monthlyDiamondCost, 25_000n);
      assert.equal(VIP_TIER_CONFIGS.golden_immortal.annualDiamondCost, 240_000n);
      assert.equal(VIP_TIER_CONFIGS.celestial_sovereign.monthlyDiamondCost, 50_000n);
      assert.equal(VIP_TIER_CONFIGS.celestial_sovereign.annualDiamondCost, 480_000n);
    }
  );

  await t.test('claims daily VIP stipend once per calendar day and awards loyalty points', () => {
    const activated = activateVipSubscription(
      INITIAL_VIP_SUBSCRIPTION_STATE,
      'golden_immortal',
      'monthly',
      '2026-10-23'
    ).nextState;

    const firstClaim = claimVipDailyStipend(activated, '2026-10-23');
    assert.equal(firstClaim.claimed, true);
    assert.equal(firstClaim.stipend.diamonds, 18_000n);
    assert.equal(firstClaim.stipend.veteranScrolls, 2);
    assert.equal(firstClaim.nextState.totalStipendsClaimed, 1);

    // Duplicate claim on the same day is blocked
    const duplicateClaim = claimVipDailyStipend(firstClaim.nextState, '2026-10-23');
    assert.equal(duplicateClaim.claimed, false);
    assert.equal(duplicateClaim.nextState.totalStipendsClaimed, 1);

    // Next calendar day allows claiming again
    const nextDayClaim = claimVipDailyStipend(firstClaim.nextState, '2026-10-24');
    assert.equal(nextDayClaim.claimed, true);
    assert.equal(nextDayClaim.nextState.totalStipendsClaimed, 2);
  });

  await t.test('applies VIP Castle Upgrade resource cost discount accurately', () => {
    const baseCosts = {
      wood: 100_000n,
      steel: 200_000n,
      copper: 50_000n,
      grain: 80_000n,
      oil: 40_000n,
      diamond: 1_000n,
    };

    const discounted = applyVipDiscountToCosts(baseCosts, 25);
    assert.equal(discounted.wood, 75_000n);
    assert.equal(discounted.steel, 150_000n);
    assert.equal(discounted.diamond, 750n);
  });

  await t.test('calculates VIP Loyalty Level progression from 1 to 15', () => {
    const lv1 = calculateVipLoyaltyStatus(0);
    assert.equal(lv1.level, 1);
    const lv15 = calculateVipLoyaltyStatus(90_000);
    assert.equal(lv15.level, 15);
    assert.equal(lv15.currentLevelProgressPct, 100);
  });

  await t.test(
    'strictly locks premium features behind active subscription state and rejects expired or unsubscribed states',
    () => {
      // 1. Free user is denied all premium VIP features
      assert.equal(
        checkVipFeatureAccess(INITIAL_VIP_SUBSCRIPTION_STATE, '2026-10-23', 'barracks_speed_up')
          .allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(
          INITIAL_VIP_SUBSCRIPTION_STATE,
          '2026-10-23',
          'barracks_instant_finish'
        ).allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(
          INITIAL_VIP_SUBSCRIPTION_STATE,
          '2026-10-23',
          'barracks_multi_queue',
          {
            currentQueueCount: 0,
          }
        ).allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(
          INITIAL_VIP_SUBSCRIPTION_STATE,
          '2026-10-23',
          'tribulation_ward_shield'
        ).allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(INITIAL_VIP_SUBSCRIPTION_STATE, '2026-10-23', 'custom_aura_crown')
          .allowed,
        false
      );
      // Free user gets 1 base gather march, denied a 2nd concurrent march
      assert.equal(
        checkVipFeatureAccess(INITIAL_VIP_SUBSCRIPTION_STATE, '2026-10-23', 'extra_gather_march', {
          activeGatherMarches: 0,
        }).allowed,
        true
      );
      assert.equal(
        checkVipFeatureAccess(INITIAL_VIP_SUBSCRIPTION_STATE, '2026-10-23', 'extra_gather_march', {
          activeGatherMarches: 1,
        }).allowed,
        false
      );

      // 2. VIP 1 (Silver Vanguard) unlocks Speed Up and 1 extra queue, but NOT Instant Finish, Tribulation Ward, or Custom Aura Crown
      const vip1State = activateVipSubscription(
        INITIAL_VIP_SUBSCRIPTION_STATE,
        'silver_vanguard',
        'monthly',
        '2026-10-23'
      ).nextState;

      assert.equal(
        checkVipFeatureAccess(vip1State, '2026-10-23', 'barracks_speed_up').allowed,
        true
      );
      assert.equal(
        checkVipFeatureAccess(vip1State, '2026-10-23', 'barracks_multi_queue', {
          currentQueueCount: 0,
        }).allowed,
        true
      );
      assert.equal(
        checkVipFeatureAccess(vip1State, '2026-10-23', 'barracks_multi_queue', {
          currentQueueCount: 1,
        }).allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(vip1State, '2026-10-23', 'barracks_instant_finish').allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(vip1State, '2026-10-23', 'tribulation_ward_shield').allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(vip1State, '2026-10-23', 'custom_aura_crown').allowed,
        false
      );

      // 3. VIP 2 (Golden Immortal) unlocks Instant Finish, Tribulation Ward, Custom Aura Crown, and 2 extra queues
      const vip2State = activateVipSubscription(
        INITIAL_VIP_SUBSCRIPTION_STATE,
        'golden_immortal',
        'monthly',
        '2026-10-23'
      ).nextState;

      assert.equal(
        checkVipFeatureAccess(vip2State, '2026-10-23', 'barracks_instant_finish').allowed,
        true
      );
      assert.equal(
        checkVipFeatureAccess(vip2State, '2026-10-23', 'tribulation_ward_shield').allowed,
        true
      );
      assert.equal(
        checkVipFeatureAccess(vip2State, '2026-10-23', 'custom_aura_crown').allowed,
        true
      );
      assert.equal(
        calculateVipRallyCapacity(100_000n, evaluateVipSubscription(vip2State, '2026-10-23')),
        125_000n
      );

      // 4. Expired or tampered state (activeTier set without valid days/dateKey) is strictly denied
      const expiredTamperedState = {
        ...vip2State,
        activeTier: 'celestial_sovereign' as const,
        expiresAtDaysRemaining: 0,
      };
      const unsubscribedTamperedState = {
        ...vip2State,
        activeTier: 'celestial_sovereign' as const,
        expiresAtDaysRemaining: 30,
        subscribedAtDateKey: null,
      };

      assert.equal(
        checkVipFeatureAccess(expiredTamperedState, '2026-10-23', 'barracks_instant_finish')
          .allowed,
        false
      );
      assert.equal(
        checkVipFeatureAccess(unsubscribedTamperedState, '2026-10-23', 'custom_aura_crown').allowed,
        false
      );
    }
  );
});
