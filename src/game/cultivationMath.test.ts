/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CULTIVATION_REALMS,
  QI_REALMS,
  BODY_REALMS,
  SOUL_REALMS,
  MIND_REALMS,
  CULTIVATION_PATHS_REALMS,
  CULTIVATION_PATH_LIST,
  CULTIVATION_PILLS,
  CULTIVATION_MANUALS,
  calculateQiRequired,
  calculateCultivationMultiplier,
  calculatePassiveQiRate,
  calculateMindCultivationBonuses,
  calculateFourPathSynergy,
  calculateManualEffects,
  calculateManualUpgradeCost,
  calculateEquippedManualsSummary,
  rollManualDiscovery,
  evaluateBreakthroughAttempt,
  calculateTribulationStrikeDefense,
  calculateRealmSuppression,
  INITIAL_KARMA_STATE,
  INITIAL_DISCIPLES,
  evaluatePvPKillKarma,
  tickRedNameStationaryLightning,
  resolveRedNameDeathLootDrop,
  calculateMasterDiscipleEconomy,
  createTransmissionSkillScroll,
  getCultivationAuraVisualSpec,
} from './cultivationMath';

describe('Cultivation System - Four Paths (Qi, Body, Soul, Mind) & Han Jue Realm Progression', () => {
  it('contains all 4 cultivation paths: Qi, Body, Soul, and Mind', () => {
    assert.deepEqual(CULTIVATION_PATH_LIST, ['qi', 'body', 'soul', 'mind']);
    assert.equal(QI_REALMS.length, 23);
    assert.equal(BODY_REALMS.length, 23);
    assert.equal(SOUL_REALMS.length, 23);
    assert.equal(MIND_REALMS.length, 23);
  });

  it('contains exactly 23 Qi realms divided across all 4 specified Eras', () => {
    assert.equal(CULTIVATION_REALMS.length, 23);

    const mortalRealms = CULTIVATION_REALMS.filter((r) => r.era === 'mortal');
    const immortalSageRealms = CULTIVATION_REALMS.filter((r) => r.era === 'immortal_sage');
    const chaosRealms = CULTIVATION_REALMS.filter((r) => r.era === 'chaos_dao');
    const ultimateRealms = CULTIVATION_REALMS.filter((r) => r.era === 'ultimate_origin');

    // 1. Mortal Eras: Qi Refinement to Mahayana (9 realms)
    assert.equal(mortalRealms.length, 9);
    assert.equal(mortalRealms[0].name, 'Qi Refinement');
    assert.equal(mortalRealms[1].name, 'Foundation Establishment');
    assert.equal(mortalRealms[2].name, 'Golden Core Realm');
    assert.equal(mortalRealms[3].name, 'Nascent Soul Realm');
    assert.equal(mortalRealms[4].name, 'Soul Formation Realm');
    assert.equal(mortalRealms[5].name, 'Void Returning Realm');
    assert.equal(mortalRealms[6].name, 'Body Integration Realm');
    assert.equal(mortalRealms[7].name, 'Tribulation Transcendence Realm');
    assert.equal(mortalRealms[8].name, 'Mahayana Realm');

    // 2. Immortal & Sage Eras: Loose Immortal to Freedom Sage (10 realms)
    assert.equal(immortalSageRealms.length, 10);
    assert.equal(immortalSageRealms[0].name, 'Loose Immortal');
    assert.equal(immortalSageRealms[4].name, 'Golden Immortal');
    assert.equal(immortalSageRealms[6].name, 'Zenith Heaven Golden Immortal');
    assert.equal(immortalSageRealms[8].name, 'Sage (Heavenly Dao Sage)');
    assert.equal(immortalSageRealms[9].name, 'Freedom Sage Realm');

    // 3. Great Dao & Cosmic Eras (3 realms)
    assert.equal(chaosRealms.length, 3);
    assert.equal(chaosRealms[0].name, 'Great Dao Sage');
    assert.equal(chaosRealms[1].name, 'Great Dao Supreme');
    assert.equal(chaosRealms[2].name, 'Dao Creator');

    // 4. The Peak - Han Jue's exclusive realm (1 realm)
    assert.equal(ultimateRealms.length, 1);
    assert.equal(ultimateRealms[0].name, 'Ultimate Origin Supreme Realm');
  });

  it('enforces every single realm across Qi, Body, Soul, and Mind has exactly 9 layers', () => {
    for (const path of CULTIVATION_PATH_LIST) {
      const realms = CULTIVATION_PATHS_REALMS[path];
      assert.equal(realms.length, 23, `Path ${path} must have 23 realms`);
      realms.forEach((realm, idx) => {
        assert.equal(realm.totalLayers, 9, `${path} - ${realm.name} must have 9 layers`);
        assert.equal(realm.index, idx);
      });
    }
  });

  it('verifies Body, Soul, and Mind realm milestones across Mortal, Immortal, Chaos, and Ultimate Origin', () => {
    // Body Cultivation milestones
    assert.equal(BODY_REALMS[0].name, 'Skin & Flesh Tempering');
    assert.equal(BODY_REALMS[3].name, 'Golden Marrow Realm');
    assert.equal(BODY_REALMS[19].name, 'Great Dao Fiendcelestial Body');
    assert.equal(BODY_REALMS[22].name, 'Ultimate Origin Eternal Body');

    // Soul Cultivation milestones
    assert.equal(SOUL_REALMS[0].name, 'Mortal Soul Awakening');
    assert.equal(SOUL_REALMS[6].name, 'Primordial Spirit (Yuan Shen)');
    assert.equal(SOUL_REALMS[13].name, 'Golden Immortal True Spirit');
    assert.equal(SOUL_REALMS[22].name, 'Ultimate Origin Eternal Soul');

    // Mind Cultivation milestones
    assert.equal(MIND_REALMS[0].name, 'Calm Water Heart');
    assert.equal(MIND_REALMS[3].name, 'Flawless Dao Heart');
    assert.equal(MIND_REALMS[4].name, 'Inner Demon Slaying Heart');
    assert.equal(MIND_REALMS[22].name, 'Ultimate Origin Supreme Dao Heart');
  });

  it('calculates increasing energy requirements per layer and across realms for all 4 paths', () => {
    for (const path of CULTIVATION_PATH_LIST) {
      const layer1Energy = calculateQiRequired(0, 1, path);
      const layer2Energy = calculateQiRequired(0, 2, path);
      const layer9Energy = calculateQiRequired(0, 9, path);
      const nextRealmEnergy = calculateQiRequired(1, 1, path);

      assert.ok(layer2Energy > layer1Energy, `${path}: L2 > L1`);
      assert.ok(layer9Energy > layer2Energy, `${path}: L9 > L2`);
      assert.ok(nextRealmEnergy > layer9Energy, `${path}: R1L1 > R0L9`);
    }
  });

  it('multiplicative power scales smoothly and reaches astronomical heights at Ultimate Origin', () => {
    const qiRefineMult = calculateCultivationMultiplier(0, 1, 'qi');
    const nascentSoulMult = calculateCultivationMultiplier(3, 1, 'qi');
    const sageMult = calculateCultivationMultiplier(17, 1, 'body');
    const ultimateOriginMult = calculateCultivationMultiplier(22, 9, 'soul');

    assert.ok(qiRefineMult >= 1.0);
    assert.ok(nascentSoulMult > qiRefineMult);
    assert.ok(sageMult > nascentSoulMult);
    assert.ok(ultimateOriginMult > 10_000_000_000_000_000.0);
  });

  it('Mind Cultivation grants breakthrough probability bonus, inner demon immunity, and speed multiplier', () => {
    const mortalMind = calculateMindCultivationBonuses(0, 1);
    const immortalMind = calculateMindCultivationBonuses(12, 5);
    const supremeMind = calculateMindCultivationBonuses(22, 9);

    assert.ok(immortalMind.breakthroughBonusPct > mortalMind.breakthroughBonusPct);
    assert.ok(immortalMind.cultivationSpeedMult > mortalMind.cultivationSpeedMult);
    assert.equal(supremeMind.innerDemonImmunityPct, 100);
  });

  it('Four-Path Synergy Resonance scales when Qi, Body, Soul, and Mind advance together', () => {
    const basicSynergy = calculateFourPathSynergy({
      qi: { realmIndex: 1, layer: 1, currentEnergy: 0n },
      body: { realmIndex: 0, layer: 1, currentEnergy: 0n },
      soul: { realmIndex: 0, layer: 1, currentEnergy: 0n },
      mind: { realmIndex: 0, layer: 1, currentEnergy: 0n },
    });

    const advancedSynergy = calculateFourPathSynergy({
      qi: { realmIndex: 4, layer: 5, currentEnergy: 0n },
      body: { realmIndex: 3, layer: 6, currentEnergy: 0n },
      soul: { realmIndex: 3, layer: 4, currentEnergy: 0n },
      mind: { realmIndex: 3, layer: 8, currentEnergy: 0n },
    });

    assert.equal(basicSynergy.minRealmIndex, 0);
    assert.equal(advancedSynergy.minRealmIndex, 3);
    assert.ok(advancedSynergy.resonanceBonusMult > basicSynergy.resonanceBonusMult);
    assert.ok(advancedSynergy.totalCombinedMultiplier > basicSynergy.totalCombinedMultiplier);
    assert.ok(advancedSynergy.troopHpDefenseBonusPct > basicSynergy.troopHpDefenseBonusPct);
    assert.ok(advancedSynergy.troopAttackCritBonusPct > basicSynergy.troopAttackCritBonusPct);
  });

  it('weather dynamic system and Mind Cultivation enhance passive Qi/Energy collection', () => {
    const clearRate = calculatePassiveQiRate(0, 'clear', false, 'qi', 0, 1);
    const stormRate = calculatePassiveQiRate(0, 'storm', false, 'qi', 0, 1);
    const mindBoostedRate = calculatePassiveQiRate(0, 'storm', false, 'qi', 5, 9);

    assert.ok(stormRate > clearRate, 'Storm weather must boost thunder Qi absorption');
    assert.ok(mindBoostedRate > stormRate, 'Mind Cultivation must amplify passive cultivation speed');
  });

  it('tribulation strike defense checks withstand celestial lightning', () => {
    const weakDefense = calculateTribulationStrikeDefense(100_000_000n, 1_000_000n);
    assert.equal(weakDefense.survived, false);

    const strongDefense = calculateTribulationStrikeDefense(100_000_000n, 50_000_000n);
    assert.equal(strongDefense.survived, true);
  });

  it('alchemy pills cover Qi, Body, Soul, Mind, and Universal paths', () => {
    assert.ok(CULTIVATION_PILLS.length >= 8);
    const bodyPill = CULTIVATION_PILLS.find((p) => p.targetPath === 'body');
    const soulPill = CULTIVATION_PILLS.find((p) => p.targetPath === 'soul');
    const mindPill = CULTIVATION_PILLS.find((p) => p.targetPath === 'mind');
    assert.ok(bodyPill, 'Body tempering pill must exist');
    assert.ok(soulPill, 'Soul solidifying pill must exist');
    assert.ok(mindPill, 'Mind enlightenment pill must exist');
  });

  it('Cultivation Manuals span all 4 paths (Qi, Body, Soul, Mind) and scale with mastery upgrades', () => {
    assert.equal(CULTIVATION_MANUALS.length, 12);
    for (const path of CULTIVATION_PATH_LIST) {
      const pathManuals = CULTIVATION_MANUALS.filter((m) => m.path === path);
      assert.equal(pathManuals.length, 3, `Path ${path} should have 3 ancient manuals`);
    }

    const lv1Effects = calculateManualEffects('manual_qi_six_paths', 1);
    const lv5Effects = calculateManualEffects('manual_qi_six_paths', 5);
    const lv10Effects = calculateManualEffects('manual_qi_six_paths', 10);

    assert.ok(lv5Effects.passiveRateBoostPct > lv1Effects.passiveRateBoostPct);
    assert.ok(lv10Effects.passiveRateBoostPct > lv5Effects.passiveRateBoostPct);
    assert.ok(lv5Effects.breakthroughBoostPct > lv1Effects.breakthroughBoostPct);
    assert.ok(lv10Effects.breakthroughBoostPct > lv5Effects.breakthroughBoostPct);

    const manualDef = CULTIVATION_MANUALS.find((m) => m.id === 'manual_qi_six_paths')!;
    const costLv1 = calculateManualUpgradeCost(manualDef, 1);
    const costLv5 = calculateManualUpgradeCost(manualDef, 5);
    const costMax = calculateManualUpgradeCost(manualDef, 10);

    assert.equal(costLv1.isMaxLevel, false);
    assert.ok(costLv5.fragments > costLv1.fragments);
    assert.ok(costLv5.diamonds > costLv1.diamonds);
    assert.equal(costMax.isMaxLevel, true);
  });

  it('equipped Cultivation Manuals boost passive gathering rates and summarize across all 4 slots', () => {
    const owned = {
      manual_qi_jade_pure: { manualId: 'manual_qi_jade_pure', level: 3 },
      manual_body_vajra_marrow: { manualId: 'manual_body_vajra_marrow', level: 2 },
      manual_soul_astral_visualization: { manualId: 'manual_soul_astral_visualization', level: 4 },
      manual_mind_longevity_seclusion: { manualId: 'manual_mind_longevity_seclusion', level: 5 },
    };
    const equipped = {
      qi: 'manual_qi_jade_pure',
      body: 'manual_body_vajra_marrow',
      soul: 'manual_soul_astral_visualization',
      mind: 'manual_mind_longevity_seclusion',
    };

    const summary = calculateEquippedManualsSummary(equipped, owned);
    assert.ok(summary.byPath.qi.passiveRateBoostPct > 35);
    assert.ok(summary.byPath.body.passiveRateBoostPct > 40);
    assert.ok(summary.totalPassiveBonusPct > 200);
    assert.ok(summary.totalBreakthroughBonusPct > 30);

    const basePassive = calculatePassiveQiRate(3, 'clear', false, 'qi', 0, 1, 0);
    const manualBoostedPassive = calculatePassiveQiRate(
      3,
      'clear',
      false,
      'qi',
      0,
      1,
      summary.byPath.qi.passiveRateBoostPct
    );
    assert.ok(manualBoostedPassive > basePassive, 'Equipped manual must boost passive energy/s');
  });

  it('rollManualDiscovery finds new manuals or converts duplicate insights into Scripture Fragments', () => {
    const owned = {
      manual_qi_jade_pure: { manualId: 'manual_qi_jade_pure', level: 1 },
    };
    const duplicateRoll = rollManualDiscovery(owned, 0); // index 0 is manual_qi_jade_pure
    assert.equal(duplicateRoll.isNewDiscovery, false);
    assert.equal(duplicateRoll.fragmentsGained, 45);

    const newDiscoveryRoll = rollManualDiscovery(owned, 1); // index 1 is manual_qi_six_paths
    assert.equal(newDiscoveryRoll.isNewDiscovery, true);
    assert.equal(newDiscoveryRoll.manual.id, 'manual_qi_six_paths');
    assert.equal(newDiscoveryRoll.fragmentsGained, 20);
  });

  it('Realm Suppression: Golden Core (index 2) deals 100x damage to Qi Refinement (index 0)', () => {
    const goldenVsQi = calculateRealmSuppression(2, 0);
    assert.equal(goldenVsQi.realmDifference, 2);
    assert.equal(goldenVsQi.damageMultiplier, 100);
    assert.equal(goldenVsQi.incomingDamageReductionPct, 99);

    const foundationVsQi = calculateRealmSuppression(1, 0);
    assert.equal(foundationVsQi.damageMultiplier, 10);

    const nascentVsQi = calculateRealmSuppression(3, 0);
    assert.equal(nascentVsQi.damageMultiplier, 1000);

    const qiVsGolden = calculateRealmSuppression(0, 2);
    assert.equal(qiVsGolden.damageMultiplier, 0.01);
  });

  it('Karma System: killing a Green-Name low-level player turns Karma negative (Red Name), sets Bounty, strikes stationary with lightning, and drops equipped loot', () => {
    const killRes = evaluatePvPKillKarma({
      currentKarma: INITIAL_KARMA_STATE,
      attackerRealmIndex: 2, // Golden Core
      victimRealmIndex: 0, // Qi Refinement
      victimKarmaValue: 100, // Green-Name Innocent
      victimName: 'Disciple Zhang',
    });

    assert.ok(killRes.updatedKarma.karmaValue < 0, 'Karma must turn negative');
    assert.equal(killRes.updatedKarma.alignment, 'red_fiend');
    assert.equal(killRes.updatedKarma.isLocationRevealed, true, 'Map location revealed for Justice bounty');
    assert.ok(killRes.updatedKarma.bountySpiritStones > 0n);

    // Moving resets stationary timer
    const step1 = tickRedNameStationaryLightning({
      karma: killRes.updatedKarma,
      isMoving: false,
      deltaSec: 4,
    });
    assert.equal(step1.struckByInstantKillLightning, false);
    assert.equal(step1.updatedKarma.stationarySeconds, 4);

    const movedStep = tickRedNameStationaryLightning({
      karma: step1.updatedKarma,
      isMoving: true,
      deltaSec: 2,
    });
    assert.equal(movedStep.updatedKarma.stationarySeconds, 0, 'Moving must reset lightning lock-on');

    // Staying in one spot >= 8s triggers Instant-Kill Tribulation Lightning
    const strikeStep = tickRedNameStationaryLightning({
      karma: killRes.updatedKarma,
      isMoving: false,
      deltaSec: 8,
    });
    assert.equal(strikeStep.struckByInstantKillLightning, true);

    // Dying as Red Name drops equipped item
    const dropRes = resolveRedNameDeathLootDrop({
      karma: strikeStep.updatedKarma,
      equippedManuals: {
        qi: 'manual_qi_jade_pure',
        body: 'manual_body_vajra_marrow',
        soul: null,
        mind: null,
      },
      inventoryPills: { pill_qi_condensation: 2 },
    });
    assert.equal(dropRes.updatedEquippedManuals.qi, null, 'Equipped Qi manual must drop on Red-Name death');
    assert.ok(dropRes.droppedItemName.includes('Jade Pure'));
  });

  it('Master & Disciple Hierarchy: calculates proximity speed buff, Master tax funneling, and Heaven Earth Sleeve Skill Scroll transmission', () => {
    const economy = calculateMasterDiscipleEconomy({
      masterRealmIndex: 3, // Nascent Soul Master
      disciples: INITIAL_DISCIPLES,
      masterTaxRatePct: 20,
    });

    assert.equal(economy.nearDisciplesCount, 3, '3 disciples are within 50m of Master');
    assert.ok(economy.proximitySpeedBuffPct >= 76);
    assert.ok(economy.totalMasterTaxSpiritStonesPerSec > 0n);
    assert.ok(economy.totalMasterTaxQiPerSec > 0n);

    // Transcribe Mystical Power: Heaven Earth Sleeve into a Skill Scroll item
    const scrollRes = createTransmissionSkillScroll({
      skillId: 'skill_heaven_earth_sleeve',
      masterName: 'Han Jue',
      currentQi: 1_000_000n,
      currentDiamonds: 5_000n,
      learnedSkills: ['skill_heaven_earth_sleeve'],
    });
    assert.equal(scrollRes.success, true);
    assert.ok(scrollRes.scroll);
    assert.equal(scrollRes.scroll?.skillName, 'Mystical Power: Heaven Earth Sleeve');
  });

  it('Visualizing Power (The Aura): resolves exact visual cues per realm and scales Dao Creator Halos with Great Dao count', () => {
    const qiAura = getCultivationAuraVisualSpec(0, 3);
    assert.equal(qiAura.cueType, 'none');
    assert.equal(qiAura.suppressOverheadLevelTag, true);

    const foundationAura = getCultivationAuraVisualSpec(1, 3);
    assert.equal(foundationAura.cueType, 'faint_white_glow');

    const goldenCoreAura = getCultivationAuraVisualSpec(2, 3);
    assert.equal(goldenCoreAura.cueType, 'spinning_golden_core');
    assert.equal(goldenCoreAura.hasTranslucentChestCore, true);

    const nascentAura = getCultivationAuraVisualSpec(3, 3);
    assert.equal(nascentAura.cueType, 'floating_nascent_baby');
    assert.equal(nascentAura.hasFloatingBabyAvatar, true);

    const daoCreator3 = getCultivationAuraVisualSpec(21, 3);
    const daoCreator9 = getCultivationAuraVisualSpec(21, 9);
    assert.equal(daoCreator3.cueType, 'divine_halos');
    assert.equal(daoCreator3.haloCount, 3);
    assert.equal(daoCreator9.haloCount, 9);
    assert.equal(daoCreator9.hdrPeakLuminanceNits, 4000);
  });
});

