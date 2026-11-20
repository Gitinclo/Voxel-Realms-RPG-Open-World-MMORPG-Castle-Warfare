/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_LAUNCH_DATE_DISPLAY,
  GAME_LAUNCH_DATE_ISO,
  GAME_LAUNCH_TIMESTAMP_UTC,
  getLaunchCountdownSnapshot,
} from './launchSchedule';

test('GAME_LAUNCH_DATE constants encode 30/03/2030 (2030-03-30 UTC)', () => {
  assert.equal(GAME_LAUNCH_DATE_DISPLAY, '30/03/2030');
  assert.equal(GAME_LAUNCH_DATE_ISO, '2030-03-30');
  assert.equal(new Date(GAME_LAUNCH_TIMESTAMP_UTC).toISOString(), '2030-03-30T00:00:00.000Z');
});

test('getLaunchCountdownSnapshot computes remaining days before launch and clamps at launch', () => {
  const tenDaysBefore = GAME_LAUNCH_TIMESTAMP_UTC - 10 * 24 * 60 * 60 * 1000;
  const beforeSnap = getLaunchCountdownSnapshot(tenDaysBefore);
  assert.equal(beforeSnap.isLaunched, false);
  assert.equal(beforeSnap.daysRemaining, 10);
  assert.equal(beforeSnap.launchDateDisplay, '30/03/2030');

  const onLaunchSnap = getLaunchCountdownSnapshot(GAME_LAUNCH_TIMESTAMP_UTC);
  assert.equal(onLaunchSnap.isLaunched, true);
  assert.equal(onLaunchSnap.daysRemaining, 0);

  const afterLaunchSnap = getLaunchCountdownSnapshot(GAME_LAUNCH_TIMESTAMP_UTC + 5_000);
  assert.equal(afterLaunchSnap.isLaunched, true);
  assert.equal(afterLaunchSnap.daysRemaining, 0);
});
