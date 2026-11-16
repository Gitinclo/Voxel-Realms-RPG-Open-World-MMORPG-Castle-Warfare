import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AVATAR_CLONE_SHADOW_COMPARISON_MATRIX,
  CLONE_SUBTYPE_CATALOG,
  SHADOW_SUBTYPE_CATALOG,
  MMORPG_DUPLICATION_LIMITS,
  spawnAvatarClone,
  spawnAvatarShadow,
  executeShadowSwapTeleport,
  resolveCosmeticCloneAvatarProfile,
  evaluateRaidDuplicationServerLoad,
  type AvatarIdentityVessel,
} from './avatarCloneShadow.ts';

const MOCK_AVATAR: AvatarIdentityVessel = {
  avatarId: 'avatar_sovereign_01',
  commanderName: 'Aethelgard',
  speciesName: 'High-Elf',
  guildTag: 'SOV',
  level: 45,
  baseMaxHp: 10000,
  baseAttack: 800,
  position: { x: 120, y: 12, z: -85 },
  baseSkinId: 'valkyrie_prime',
  cosmeticCloneTargetSkinId: null,
};

describe('Avatar, Clone & Shadow MMORPG Engine', () => {
  it('defines the canonical 4-row Key Differences Matrix (Core Purpose, Control, Physicality, Lifespan)', () => {
    assert.equal(AVATAR_CLONE_SHADOW_COMPARISON_MATRIX.length, 4);
    const features = AVATAR_CLONE_SHADOW_COMPARISON_MATRIX.map((r) => r.feature);
    assert.deepEqual(features, ['Core Purpose', 'Control', 'Physicality', 'Lifespan']);
    for (const row of AVATAR_CLONE_SHADOW_COMPARISON_MATRIX) {
      assert.ok(row.clone.length > 10);
      assert.ok(row.shadow.length > 10);
      assert.ok(row.avatar.length > 10);
    }
  });

  it('distinguishes Tactical Clones (0% damage decoy), Combat Clones (reduced HP/damage AI summon), and Cosmetic Clone Avatars', () => {
    assert.equal(CLONE_SUBTYPE_CATALOG.length, 3);
    const tactical = CLONE_SUBTYPE_CATALOG.find((c) => c.id === 'tactical_illusion')!;
    const combat = CLONE_SUBTYPE_CATALOG.find((c) => c.id === 'combat_summon')!;
    const cosmetic = CLONE_SUBTYPE_CATALOG.find((c) => c.id === 'cosmetic_clone_avatar')!;

    assert.equal(tactical.pveDamageRatio, 0);
    assert.equal(tactical.pvpDamageRatio, 0);
    assert.ok(tactical.aggroThreatMultiplier >= 3.0);

    assert.equal(combat.pveDamageRatio, 0.35);
    assert.equal(combat.pvpDamageRatio, 0.2);
    assert.ok(
      combat.pvpDamageRatio < combat.pveDamageRatio,
      'PvP damage must be reduced for balance'
    );
    assert.equal(combat.maxHpRatio, 0.4);

    assert.ok((cosmetic.statBonuses?.cultivationSpeedBonusPct ?? 0) > 0);
    assert.ok((cosmetic.statBonuses?.troopAttackBonusPct ?? 0) > 0);
  });

  it('enforces the per-Avatar Clone cap (<= 3) by evicting the oldest clone when spawning a 4th', () => {
    let clones: ReturnType<typeof spawnAvatarClone>['nextClones'] = [];
    for (let i = 0; i < 4; i++) {
      const res = spawnAvatarClone(
        MOCK_AVATAR,
        clones,
        i % 2 === 0 ? 'tactical_illusion' : 'combat_summon',
        {
          x: i + 1,
          y: 0,
          z: i + 1,
        }
      );
      clones = res.nextClones;
      if (i < 3) {
        assert.equal(res.evictedOldest, false);
      } else {
        assert.equal(res.evictedOldest, true);
      }
    }
    assert.equal(clones.length, MMORPG_DUPLICATION_LIMITS.MAX_ACTIVE_CLONES_PER_AVATAR);
  });

  it('supports Shadow Action Mimics, 3.0s Time Echoes, Dark Doppelgänger Bosses, and instant Shadow Swap teleportation', () => {
    assert.equal(SHADOW_SUBTYPE_CATALOG.length, 3);
    const first = spawnAvatarShadow(MOCK_AVATAR, [], 'shadow_action_mimic', {
      x: 15,
      y: 0,
      z: -10,
    });
    assert.equal(first.nextShadows.length, 1);
    assert.equal(first.spawned.supportsTeleportSwap, true);

    const swapRes = executeShadowSwapTeleport(
      MOCK_AVATAR,
      first.nextShadows,
      first.spawned.instanceId
    );
    assert.equal(swapRes.swapped, true);
    assert.deepEqual(swapRes.nextAvatar.position, { x: 135, y: 12, z: -95 });
    assert.deepEqual(swapRes.nextShadows[0].position, MOCK_AVATAR.position);
  });

  it('computes Cosmetic Clone Avatar stat bonuses while overriding visual skin ID', () => {
    const inactive = resolveCosmeticCloneAvatarProfile(MOCK_AVATAR, false, 'void_archon');
    assert.equal(inactive.effectiveVisualSkinId, 'valkyrie_prime');
    assert.equal(inactive.effectiveAttack, 800);

    const active = resolveCosmeticCloneAvatarProfile(MOCK_AVATAR, true, 'void_archon');
    assert.equal(active.isCosmeticCloneActive, true);
    assert.equal(active.effectiveVisualSkinId, 'void_archon');
    assert.ok(active.effectiveAttack > MOCK_AVATAR.baseAttack);
    assert.equal(active.cultivationSpeedBonusPct, 12);
  });

  it('evaluates 50-player Raid Server Performance & Lag when summoning 3 clones each (200 total tracked entities)', () => {
    const raid = evaluateRaidDuplicationServerLoad(50, 3, 0);
    assert.equal(raid.totalAvatars, 50);
    assert.equal(raid.totalClones, 150);
    assert.equal(raid.totalTrackedEntities, 200);
    assert.ok(raid.bandwidthReductionPct > 55);
    assert.equal(raid.withinTickBudget, true);
  });
});
