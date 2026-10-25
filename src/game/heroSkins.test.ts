/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_HEROES } from './initialData';
import {
  HERO_SKIN_ORDER,
  applySkinToHero,
  generateAuraParticles,
  getHeroSkinsForHero,
  resolveHeroActiveSkin,
} from './heroSkins';

test('getHeroSkinsForHero returns 5 distinct aesthetic skins with unique icons and particle auras', () => {
  const arthur = INITIAL_HEROES[0];
  const skins = getHeroSkinsForHero(arthur);

  assert.equal(skins.length, 5);
  assert.deepEqual(
    skins.map((s) => s.id),
    HERO_SKIN_ORDER
  );

  const uniqueIcons = new Set(skins.map((s) => s.resolvedIcon));
  assert.equal(uniqueIcons.size, 5);

  const uniqueAuras = new Set(skins.map((s) => s.auraType));
  assert.equal(uniqueAuras.size, 5);
});

test('applySkinToHero dynamically swaps avatarIcon and activeAuraType and restores original icon on default', () => {
  const arthur = INITIAL_HEROES[0];
  assert.equal(arthur.avatarIcon, '🛡️');

  const solarArthur = applySkinToHero(arthur, 'solar_seraph');
  assert.equal(solarArthur.equippedSkinId, 'solar_seraph');
  assert.equal(solarArthur.avatarIcon, '☀️');
  assert.equal(solarArthur.activeAuraType, 'solar_flare_embers');
  assert.equal(solarArthur.baseAvatarIcon, '🛡️');

  const voidArthur = applySkinToHero(solarArthur, 'abyssal_void');
  assert.equal(voidArthur.equippedSkinId, 'abyssal_void');
  assert.equal(voidArthur.avatarIcon, '🌑');
  assert.equal(voidArthur.activeAuraType, 'void_singularity_vortex');

  const restoredArthur = applySkinToHero(voidArthur, 'default');
  assert.equal(restoredArthur.equippedSkinId, 'default');
  assert.equal(restoredArthur.avatarIcon, '🛡️');
  assert.equal(restoredArthur.activeAuraType, 'valiant_radiance');
});

test('resolveHeroActiveSkin and generateAuraParticles produce deterministic particle emitters per skin', () => {
  const lyra = applySkinToHero(INITIAL_HEROES[1], 'celestial_jade');
  const activeSkin = resolveHeroActiveSkin(lyra);

  assert.equal(activeSkin.id, 'celestial_jade');
  assert.equal(activeSkin.resolvedIcon, '🦢');
  assert.equal(activeSkin.auraName, 'Immortal Jade Lotus Aura');

  const defaultParticles = generateAuraParticles('default');
  const bloodmoonParticles = generateAuraParticles('bloodmoon_fiend');

  assert.equal(defaultParticles.length, 6);
  assert.equal(bloodmoonParticles.length, 10);
  assert.ok(bloodmoonParticles.some((p) => p.symbol === '🩸'));
});
