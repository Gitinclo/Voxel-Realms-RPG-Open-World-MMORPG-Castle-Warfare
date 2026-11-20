/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectInitialTargetPlatform, getHudPlatformScale } from './hudPlatformScale';

test('getHudPlatformScale returns larger icon, text, and touch targets for mobile than pc_console', () => {
  const pc = getHudPlatformScale('pc_console');
  const mobile = getHudPlatformScale('mobile');

  assert.equal(pc.platform, 'pc_console');
  assert.equal(mobile.platform, 'mobile');

  assert.ok(
    mobile.textScaleFactor > pc.textScaleFactor,
    'mobile text scale factor should exceed pc_console'
  );
  assert.ok(mobile.iconSizePx > pc.iconSizePx, 'mobile base icon size should exceed pc_console');
  assert.ok(
    mobile.minTouchTargetPx >= 44 && mobile.minTouchTargetPx > pc.minTouchTargetPx,
    'mobile touch targets must meet >= 44px readability/ergonomics threshold'
  );

  // Key icon and typography classes must step up on mobile
  assert.equal(pc.classes.dockTabIcon, 'w-5 h-5');
  assert.equal(mobile.classes.dockTabIcon, 'w-6 h-6');
  assert.notEqual(mobile.classes.playerNameText, pc.classes.playerNameText);
  assert.notEqual(mobile.classes.currencyValue, pc.classes.currencyValue);
  assert.notEqual(mobile.classes.moreDrawerGrid, pc.classes.moreDrawerGrid);
});

test('getHudPlatformScale defaults safely to pc_console when platform is omitted', () => {
  const fallback = getHudPlatformScale(undefined);
  assert.equal(fallback.platform, 'pc_console');
  assert.equal(fallback.textScaleFactor, 1.0);
});

test('getHudPlatformScale populates every class slot with non-empty Tailwind classes', () => {
  for (const platform of ['pc_console', 'mobile'] as const) {
    const profile = getHudPlatformScale(platform);
    for (const [key, value] of Object.entries(profile.classes)) {
      assert.equal(typeof value, 'string', `${platform}.${key} must be a string`);
      assert.ok(value.trim().length > 0, `${platform}.${key} must be non-empty`);
    }
  }
});

test('detectInitialTargetPlatform chooses mobile for narrow or touch viewports and pc_console for desktop', () => {
  assert.equal(detectInitialTargetPlatform(390, true), 'mobile');
  assert.equal(detectInitialTargetPlatform(640, false), 'mobile');
  assert.equal(detectInitialTargetPlatform(900, true), 'mobile');
  assert.equal(detectInitialTargetPlatform(1440, false), 'pc_console');
  assert.equal(detectInitialTargetPlatform(1280, true), 'pc_console');
  assert.equal(detectInitialTargetPlatform(undefined, false), 'pc_console');
});
