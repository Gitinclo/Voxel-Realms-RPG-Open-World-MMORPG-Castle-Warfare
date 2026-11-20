/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GAME_LAUNCH_DATE_DISPLAY = '30/03/2030';
export const GAME_LAUNCH_DATE_ISO = '2030-03-30';
export const GAME_LAUNCH_TIMESTAMP_UTC = Date.UTC(2030, 2, 30, 0, 0, 0);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface LaunchCountdownSnapshot {
  launchDateDisplay: string;
  launchDateIso: string;
  launchTimestampUtc: number;
  daysRemaining: number;
  isLaunched: boolean;
}

export function getLaunchCountdownSnapshot(nowMs: number = Date.now()): LaunchCountdownSnapshot {
  const diffMs = GAME_LAUNCH_TIMESTAMP_UTC - nowMs;
  const isLaunched = diffMs <= 0;
  const daysRemaining = isLaunched ? 0 : Math.ceil(diffMs / MS_PER_DAY);

  return {
    launchDateDisplay: GAME_LAUNCH_DATE_DISPLAY,
    launchDateIso: GAME_LAUNCH_DATE_ISO,
    launchTimestampUtc: GAME_LAUNCH_TIMESTAMP_UTC,
    daysRemaining,
    isLaunched,
  };
}
