/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TargetPlatform } from './graphicsEngine';

export interface HudPlatformScaleClasses {
  // Lord Identity Card
  avatarBox: string;
  armorTierBadge: string;
  clanTagText: string;
  playerNameText: string;
  statsText: string;
  badgeText: string;
  badgeIcon: string;

  // Primary Currencies Bar
  currencyBar: string;
  currencyItemBtn: string;
  currencyEmoji: string;
  currencyValue: string;
  topActionButton: string;
  topActionIcon: string;

  // Merged World Status Bar
  statusZoneText: string;
  statusChipText: string;
  statusIcon: string;
  statusClockIcon: string;
  statusIconButton: string;

  // Touch Controls & Quick Actions
  joystickBase: string;
  joystickKnob: string;
  joystickLabel: string;
  merchantActionBtn: string;
  merchantActionIcon: string;
  merchantActionLabel: string;
  merchantActionSubLabel: string;
  attackActionBtn: string;
  attackActionIcon: string;
  gatherActionBtn: string;
  gatherActionIcon: string;
  flightToggleBtn: string;
  flightStepBtn: string;

  // Bottom Command Dock & More Hub Drawer
  dockTabBtn: string;
  dockTabIcon: string;
  dockTabLabel: string;
  dockCollapseBtn: string;
  moreDrawerGrid: string;
  moreTileBtn: string;
  moreTileIcon: string;
  moreTileTitle: string;
  moreTileSub: string;

  // Minimap Radar
  minimapContainer: string;
  minimapCollapsedContainer: string;
  minimapTitle: string;
  minimapMeta: string;
  minimapIcon: string;
  minimapControlIcon: string;
  minimapControlBtn: string;
}

export interface HudPlatformScaleProfile {
  platform: TargetPlatform;
  label: string;
  textScaleFactor: number;
  iconSizePx: number;
  minTouchTargetPx: number;
  classes: HudPlatformScaleClasses;
}

const PC_CONSOLE_PROFILE: HudPlatformScaleProfile = {
  platform: 'pc_console',
  label: 'PC / Console Precision',
  textScaleFactor: 1.0,
  iconSizePx: 20,
  minTouchTargetPx: 36,
  classes: {
    avatarBox: 'w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg',
    armorTierBadge: 'text-[9px] px-1',
    clanTagText: 'text-[11px]',
    playerNameText: 'text-xs sm:text-sm',
    statsText: 'text-[11px]',
    badgeText: 'text-[10px] px-1.5 py-0.5',
    badgeIcon: 'w-2.5 h-2.5',

    currencyBar: 'gap-0.5 sm:gap-2 px-1.5 py-1 sm:px-2.5 sm:py-1.5',
    currencyItemBtn: 'gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-1',
    currencyEmoji: 'text-[11px] sm:text-sm',
    currencyValue: 'text-[11px] sm:text-xs',
    topActionButton: 'gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs',
    topActionIcon: 'w-3 h-3 sm:w-3.5 sm:h-3.5',

    statusZoneText: 'text-[10px] sm:text-[11px]',
    statusChipText: 'text-[10px] sm:text-[11px]',
    statusIcon: 'w-3.5 h-3.5',
    statusClockIcon: 'w-3 h-3',
    statusIconButton: 'p-1 sm:p-1.5',

    joystickBase: 'w-20 h-20 sm:w-28 sm:h-28',
    joystickKnob: 'w-9 h-9 sm:w-11 sm:h-11',
    joystickLabel: 'text-[10px]',
    merchantActionBtn: 'w-14 h-14 sm:w-16 sm:h-16',
    merchantActionIcon: 'w-5 h-5 sm:w-6 sm:h-6',
    merchantActionLabel: 'text-[9px]',
    merchantActionSubLabel: 'text-[8px]',
    attackActionBtn: 'w-14 h-14 sm:w-16 sm:h-16',
    attackActionIcon: 'w-6 h-6 sm:w-7 sm:h-7',
    gatherActionBtn: 'w-12 h-12 sm:w-14 sm:h-14',
    gatherActionIcon: 'w-5 h-5 sm:w-6 sm:h-6',
    flightToggleBtn: 'w-12 h-12',
    flightStepBtn: 'w-11 h-7 text-[10px]',

    dockTabBtn: 'min-h-[54px] py-1.5 px-1',
    dockTabIcon: 'w-5 h-5',
    dockTabLabel: 'text-[10px] sm:text-[11px]',
    dockCollapseBtn: 'px-3 py-1 text-[10px]',
    moreDrawerGrid: 'grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2',
    moreTileBtn: 'p-2',
    moreTileIcon: 'w-5 h-5',
    moreTileTitle: 'text-[10px]',
    moreTileSub: 'text-[9px]',

    minimapContainer: 'w-36 sm:w-52',
    minimapCollapsedContainer: 'w-36 sm:w-44',
    minimapTitle: 'text-[10px] sm:text-[11px]',
    minimapMeta: 'text-[9px] sm:text-[10px]',
    minimapIcon: 'w-3.5 h-3.5',
    minimapControlIcon: 'w-3 h-3',
    minimapControlBtn: 'p-1',
  },
};

const MOBILE_PROFILE: HudPlatformScaleProfile = {
  platform: 'mobile',
  label: 'Mobile Readability',
  textScaleFactor: 1.15,
  iconSizePx: 24,
  minTouchTargetPx: 48,
  classes: {
    avatarBox: 'w-11 h-11 text-lg',
    armorTierBadge: 'text-[10px] px-1.5',
    clanTagText: 'text-xs',
    playerNameText: 'text-sm sm:text-base',
    statsText: 'text-xs',
    badgeText: 'text-[11px] px-2 py-0.5',
    badgeIcon: 'w-3.5 h-3.5',

    currencyBar: 'gap-0.5 sm:gap-2 px-1.5 py-1.5 sm:px-3',
    currencyItemBtn: 'gap-0.5 sm:gap-1 px-0.5 sm:px-1.5 py-1',
    currencyEmoji: 'text-xs sm:text-base',
    currencyValue: 'text-xs sm:text-sm',
    topActionButton: 'gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 text-xs min-h-[34px]',
    topActionIcon: 'w-4 h-4',

    statusZoneText: 'text-xs',
    statusChipText: 'text-xs',
    statusIcon: 'w-4 h-4',
    statusClockIcon: 'w-3.5 h-3.5',
    statusIconButton: 'p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center',

    joystickBase: 'w-24 h-24 sm:w-32 sm:h-32',
    joystickKnob: 'w-11 h-11 sm:w-12 sm:h-12',
    joystickLabel: 'text-xs',
    merchantActionBtn: 'w-16 h-16 sm:w-[72px] sm:h-[72px]',
    merchantActionIcon: 'w-6 h-6 sm:w-7 sm:h-7',
    merchantActionLabel: 'text-[10px]',
    merchantActionSubLabel: 'text-[9px]',
    attackActionBtn: 'w-16 h-16 sm:w-[72px] sm:h-[72px]',
    attackActionIcon: 'w-7 h-7 sm:w-8 sm:h-8',
    gatherActionBtn: 'w-14 h-14 sm:w-16 sm:h-16',
    gatherActionIcon: 'w-6 h-6 sm:w-7 sm:h-7',
    flightToggleBtn: 'w-14 h-14',
    flightStepBtn: 'w-12 h-8 text-[11px]',

    dockTabBtn: 'min-h-[62px] py-2 px-1',
    dockTabIcon: 'w-6 h-6',
    dockTabLabel: 'text-[11px] sm:text-xs',
    dockCollapseBtn: 'px-3.5 py-1.5 text-xs',
    moreDrawerGrid: 'grid-cols-3 sm:grid-cols-4 gap-2',
    moreTileBtn: 'p-2.5 min-h-[68px]',
    moreTileIcon: 'w-6 h-6',
    moreTileTitle: 'text-[11px]',
    moreTileSub: 'text-[10px]',

    minimapContainer: 'w-40 sm:w-56',
    minimapCollapsedContainer: 'w-40 sm:w-48',
    minimapTitle: 'text-xs',
    minimapMeta: 'text-[10px] sm:text-[11px]',
    minimapIcon: 'w-4 h-4',
    minimapControlIcon: 'w-3.5 h-3.5',
    minimapControlBtn: 'p-1.5',
  },
};

export function getHudPlatformScale(targetPlatform?: TargetPlatform): HudPlatformScaleProfile {
  return targetPlatform === 'mobile' ? MOBILE_PROFILE : PC_CONSOLE_PROFILE;
}

export function detectInitialTargetPlatform(
  viewportWidth?: number,
  hasCoarsePointer?: boolean
): TargetPlatform {
  if (typeof viewportWidth === 'number' && viewportWidth > 0 && viewportWidth < 768) {
    return 'mobile';
  }
  if (hasCoarsePointer && (viewportWidth === undefined || viewportWidth <= 1024)) {
    return 'mobile';
  }
  return 'pc_console';
}
