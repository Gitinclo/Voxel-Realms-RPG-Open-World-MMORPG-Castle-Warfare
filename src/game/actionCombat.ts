/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MonsterTarget } from '../types/game';

/**
 * Real-Time Action Combat, 4 Classes, Bitmask Status Effects, Stamina/Sprint/Dash,
 * Combo & Kill Streak Multipliers, Ascendant Domain Expansion (Lv.1-999),
 * Radial Open-World Biome Zones, 5-State Enemy FSM (with Ranged Shade Kiter),
 * Non-Destructive Wave Top-Up, and Payment-Free Field Provisions Shop.
 */

export type ActionClassId = 'knight' | 'mage' | 'rogue' | 'shaman';

export const StatusEffectFlag = {
  NONE: 0,
  BURN: 1 << 0,
  FREEZE: 1 << 1,
  POISON: 1 << 2,
  STUN: 1 << 3,
} as const;

export type StatusEffectMask = number;

export interface StatusEffectState {
  readonly mask: StatusEffectMask;
  readonly burnSec: number;
  readonly freezeSec: number;
  readonly poisonSec: number;
  readonly stunSec: number;
}

export interface ActionClassSpec {
  readonly id: ActionClassId;
  readonly name: string;
  readonly title: string;
  readonly icon: string;
  readonly accentHex: string;
  readonly maxHp: number;
  readonly baseAttack: number;
  readonly baseDefense: number;
  readonly critChance: number; // 0..1
  readonly moveSpeedMultiplier: number;
  readonly powerSkillName: string;
  readonly powerSkillDesc: string;
  readonly powerSkillCooldownSec: number;
  readonly powerSkillRadius: number;
  readonly powerSkillMultiplier: number;
  readonly powerStatusFlag: StatusEffectMask;
  readonly powerStatusDurationSec: number;
}

export const ACTION_CLASSES: Readonly<Record<ActionClassId, ActionClassSpec>> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    title: 'Iron Bastion',
    icon: '🛡️',
    accentHex: '#38bdf8',
    maxHp: 260,
    baseAttack: 28,
    baseDefense: 18,
    critChance: 0.16,
    moveSpeedMultiplier: 1.0,
    powerSkillName: 'Shield Bash',
    powerSkillDesc: 'Shockwave slam that deals heavy AoE damage and STUNS foes for 3s.',
    powerSkillCooldownSec: 5.5,
    powerSkillRadius: 9.5,
    powerSkillMultiplier: 2.1,
    powerStatusFlag: StatusEffectFlag.STUN,
    powerStatusDurationSec: 3.0,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    title: 'Astral Arcanist',
    icon: '❄️',
    accentHex: '#60a5fa',
    maxHp: 185,
    baseAttack: 38,
    baseDefense: 10,
    critChance: 0.24,
    moveSpeedMultiplier: 1.04,
    powerSkillName: 'Frost Nova',
    powerSkillDesc: 'Shattering glacial ring that deals arcane burst and FREEZES foes for 4s.',
    powerSkillCooldownSec: 6.0,
    powerSkillRadius: 12.5,
    powerSkillMultiplier: 2.4,
    powerStatusFlag: StatusEffectFlag.FREEZE,
    powerStatusDurationSec: 4.0,
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    title: 'Shadow Stalker',
    icon: '🗡️',
    accentHex: '#34d399',
    maxHp: 205,
    baseAttack: 34,
    baseDefense: 12,
    critChance: 0.36,
    moveSpeedMultiplier: 1.14,
    powerSkillName: 'Venom Fang',
    powerSkillDesc: 'Twin shadow slash with lethal crit rate and 5s POISON corrosion.',
    powerSkillCooldownSec: 4.5,
    powerSkillRadius: 8.5,
    powerSkillMultiplier: 2.25,
    powerStatusFlag: StatusEffectFlag.POISON,
    powerStatusDurationSec: 5.0,
  },
  shaman: {
    id: 'shaman',
    name: 'Shaman',
    title: 'Ember Spirit',
    icon: '🔥',
    accentHex: '#fb923c',
    maxHp: 225,
    baseAttack: 32,
    baseDefense: 14,
    critChance: 0.22,
    moveSpeedMultiplier: 1.06,
    powerSkillName: 'Flame Totem',
    powerSkillDesc: 'Erupts solar embers that BURN nearby enemies for 4.5s and mend self.',
    powerSkillCooldownSec: 5.0,
    powerSkillRadius: 11.0,
    powerSkillMultiplier: 2.15,
    powerStatusFlag: StatusEffectFlag.BURN,
    powerStatusDurationSec: 4.5,
  },
};

export interface DomainMilestone {
  readonly minLevel: number;
  readonly name: string;
  readonly summary: string;
}

export const ASCENDANT_DOMAIN_MILESTONES: readonly DomainMilestone[] = [
  { minLevel: 1, name: 'Soul Devour', summary: 'Drains enemy vitality into XP and self-heal' },
  { minLevel: 10, name: 'Domain Suppression', summary: 'Freezes enemies inside Domain for 4s' },
  { minLevel: 25, name: 'Void Erasure', summary: 'Instantly executes non-boss foes below 20% HP' },
  { minLevel: 50, name: 'Defense Breaker', summary: '+8 bonus DPS armor shred per second' },
  { minLevel: 100, name: 'Chaos Burst', summary: 'Triggers 1.6x resonance burst on cast' },
  { minLevel: 250, name: 'Absolute Zero', summary: 'Extends freeze suppression across max radius' },
  { minLevel: 999, name: 'Absolute Supremacy', summary: 'Maximum sovereign Domain authority' },
];

export interface DomainSpec {
  readonly level: number;
  readonly radiusMeters: number;
  readonly cooldownSeconds: number;
  readonly durationSeconds: number;
  readonly tickDps: number;
  readonly unlockedMilestones: readonly DomainMilestone[];
  readonly executesLowHp: boolean;
  readonly appliesFreeze: boolean;
}

export function getDomainSpec(rawLevel: number): DomainSpec {
  const level = Math.max(1, Math.min(999, Math.floor(rawLevel)));
  const radiusMeters = Number(Math.min(80, 12 + (level - 1) * 0.5).toFixed(1));
  const cooldownSeconds = Number(Math.max(15, 35 - Math.floor((level - 1) * 0.1)).toFixed(1));
  const durationSeconds = Math.min(12, 5 + Math.floor(level / 50));
  const defenseBreakerBonus = level >= 50 ? 8 : 0;
  const chaosMult = level >= 100 ? 1.6 : 1.0;
  const tickDps = Math.round((22 + level * 1.4 + defenseBreakerBonus) * chaosMult);
  const unlockedMilestones = ASCENDANT_DOMAIN_MILESTONES.filter((m) => level >= m.minLevel);

  return {
    level,
    radiusMeters,
    cooldownSeconds,
    durationSeconds,
    tickDps,
    unlockedMilestones,
    executesLowHp: level >= 25,
    appliesFreeze: level >= 10,
  };
}

export function getDomainXpRequired(level: number): number {
  const clamped = Math.max(1, Math.min(999, Math.floor(level)));
  return Math.round(120 + clamped * 45);
}

export function addDomainExperience(
  currentLevel: number,
  currentXp: number,
  gainXp: number
): { level: number; xp: number; leveledUp: boolean } {
  let level = Math.max(1, Math.min(999, Math.floor(currentLevel)));
  let xp = Math.max(0, currentXp) + Math.max(0, Math.floor(gainXp));
  let leveledUp = false;

  while (level < 999) {
    const req = getDomainXpRequired(level);
    if (xp < req) break;
    xp -= req;
    level += 1;
    leveledUp = true;
  }
  if (level >= 999) {
    xp = 0;
  }

  return { level, xp, leveledUp };
}

export interface ActionCombatState {
  readonly classId: ActionClassId;
  readonly playerLevel: number;
  readonly combatXp: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly bonusMaxHp: number;
  readonly bonusAttack: number;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly gold: number;
  readonly reviveTokens: number;
  readonly potions: number;
  readonly comboCount: number;
  readonly comboTimerSec: number;
  readonly killStreak: number;
  readonly totalKills: number;
  readonly lastStreakCallout: string | null;
  readonly strikeCooldownSec: number;
  readonly powerCooldownSec: number;
  readonly healCooldownSec: number;
  readonly dashCooldownSec: number;
  readonly dashInvulnSec: number;
  readonly domainLevel: number;
  readonly domainXp: number;
  readonly domainActiveSec: number;
  readonly domainCooldownSec: number;
  readonly statusEffects: StatusEffectState;
}

export const EMPTY_STATUS_EFFECTS: StatusEffectState = {
  mask: StatusEffectFlag.NONE,
  burnSec: 0,
  freezeSec: 0,
  poisonSec: 0,
  stunSec: 0,
};

export function createInitialActionCombatState(
  classId: ActionClassId = 'knight'
): ActionCombatState {
  const cls = ACTION_CLASSES[classId];
  return {
    classId,
    playerLevel: 1,
    combatXp: 0,
    hp: cls.maxHp,
    maxHp: cls.maxHp,
    bonusMaxHp: 0,
    bonusAttack: 0,
    stamina: 100,
    maxStamina: 100,
    gold: 650,
    reviveTokens: 1,
    potions: 2,
    comboCount: 0,
    comboTimerSec: 0,
    killStreak: 0,
    totalKills: 0,
    lastStreakCallout: null,
    strikeCooldownSec: 0,
    powerCooldownSec: 0,
    healCooldownSec: 0,
    dashCooldownSec: 0,
    dashInvulnSec: 0,
    domainLevel: 1,
    domainXp: 0,
    domainActiveSec: 0,
    domainCooldownSec: 0,
    statusEffects: EMPTY_STATUS_EFFECTS,
  };
}

export function switchActionClass(
  state: ActionCombatState,
  nextClassId: ActionClassId
): ActionCombatState {
  const cls = ACTION_CLASSES[nextClassId];
  const nextMaxHp = cls.maxHp + state.bonusMaxHp + (state.playerLevel - 1) * 18;
  const hpRatio = state.maxHp > 0 ? state.hp / state.maxHp : 1;
  return {
    ...state,
    classId: nextClassId,
    maxHp: nextMaxHp,
    hp: Math.max(1, Math.min(nextMaxHp, Math.round(nextMaxHp * hpRatio))),
    powerCooldownSec: 0,
  };
}

export function applyStatusEffect(
  current: StatusEffectState,
  flag: StatusEffectMask,
  durationSec: number
): StatusEffectState {
  const safeDur = Math.max(0, durationSec);
  if (safeDur <= 0 || flag === StatusEffectFlag.NONE) return current;
  return {
    mask: current.mask | flag,
    burnSec: flag & StatusEffectFlag.BURN ? Math.max(current.burnSec, safeDur) : current.burnSec,
    freezeSec:
      flag & StatusEffectFlag.FREEZE ? Math.max(current.freezeSec, safeDur) : current.freezeSec,
    poisonSec:
      flag & StatusEffectFlag.POISON ? Math.max(current.poisonSec, safeDur) : current.poisonSec,
    stunSec: flag & StatusEffectFlag.STUN ? Math.max(current.stunSec, safeDur) : current.stunSec,
  };
}

export function hasStatusEffect(state: StatusEffectState, flag: StatusEffectMask): boolean {
  return (state.mask & flag) !== 0;
}

export function tickStatusEffects(
  current: StatusEffectState,
  dtSec: number
): {
  next: StatusEffectState;
  dotDamage: number;
  speedMultiplier: number;
  isStunned: boolean;
} {
  const dt = Math.max(0, dtSec);
  const burnActive = current.burnSec > 0;
  const poisonActive = current.poisonSec > 0;
  const freezeActive = current.freezeSec > 0;
  const stunActive = current.stunSec > 0;

  const dotDamage = (burnActive ? 10 * dt : 0) + (poisonActive ? 7 * dt : 0);
  const burnSec = Math.max(0, current.burnSec - dt);
  const freezeSec = Math.max(0, current.freezeSec - dt);
  const poisonSec = Math.max(0, current.poisonSec - dt);
  const stunSec = Math.max(0, current.stunSec - dt);

  let mask = StatusEffectFlag.NONE;
  if (burnSec > 0) mask |= StatusEffectFlag.BURN;
  if (freezeSec > 0) mask |= StatusEffectFlag.FREEZE;
  if (poisonSec > 0) mask |= StatusEffectFlag.POISON;
  if (stunSec > 0) mask |= StatusEffectFlag.STUN;

  return {
    next: { mask, burnSec, freezeSec, poisonSec, stunSec },
    dotDamage,
    speedMultiplier: stunActive ? 0 : freezeActive ? 0.35 : 1.0,
    isStunned: stunActive,
  };
}

export function listActiveStatusLabels(state: StatusEffectState): string[] {
  const labels: string[] = [];
  if (hasStatusEffect(state, StatusEffectFlag.BURN)) labels.push('BURN');
  if (hasStatusEffect(state, StatusEffectFlag.FREEZE)) labels.push('FREEZE');
  if (hasStatusEffect(state, StatusEffectFlag.POISON)) labels.push('POISON');
  if (hasStatusEffect(state, StatusEffectFlag.STUN)) labels.push('STUN');
  return labels;
}

export function stepStaminaAndTimers(
  state: ActionCombatState,
  dtSec: number,
  isSprinting: boolean,
  inSafeZone: boolean
): ActionCombatState {
  const dt = Math.max(0, dtSec);
  const staminaDelta = isSprinting ? -22 * dt : 16 * dt;
  const nextStamina = Math.max(0, Math.min(state.maxStamina, state.stamina + staminaDelta));

  const nextComboTimer = Math.max(0, state.comboTimerSec - dt);
  const nextComboCount = nextComboTimer <= 0 ? 0 : state.comboCount;

  const statusTick = tickStatusEffects(state.statusEffects, dt);
  const safeRegen = inSafeZone ? state.maxHp * 0.04 * dt : 0;
  const nextHp = Math.max(1, Math.min(state.maxHp, state.hp + safeRegen - statusTick.dotDamage));

  return {
    ...state,
    hp: nextHp,
    stamina: nextStamina,
    comboCount: nextComboCount,
    comboTimerSec: nextComboTimer,
    strikeCooldownSec: Math.max(0, state.strikeCooldownSec - dt),
    powerCooldownSec: Math.max(0, state.powerCooldownSec - dt),
    healCooldownSec: Math.max(0, state.healCooldownSec - dt),
    dashCooldownSec: Math.max(0, state.dashCooldownSec - dt),
    dashInvulnSec: Math.max(0, state.dashInvulnSec - dt),
    domainActiveSec: Math.max(0, state.domainActiveSec - dt),
    domainCooldownSec: Math.max(0, state.domainCooldownSec - dt),
    statusEffects: statusTick.next,
  };
}

export function triggerDash(state: ActionCombatState): {
  nextState: ActionCombatState;
  triggered: boolean;
  reason?: string;
} {
  if (state.dashCooldownSec > 0) {
    return { nextState: state, triggered: false, reason: 'Dash recharging' };
  }
  if (state.stamina < 20) {
    return { nextState: state, triggered: false, reason: 'Need 20 Stamina to Dash' };
  }
  return {
    nextState: {
      ...state,
      stamina: Math.max(0, state.stamina - 20),
      dashCooldownSec: 2.0,
      dashInvulnSec: 0.45,
    },
    triggered: true,
  };
}

export function applyPlayerDamageWithRevive(
  state: ActionCombatState,
  rawDamage: number
): {
  nextState: ActionCombatState;
  damageTaken: number;
  revived: boolean;
  defeated: boolean;
} {
  if (state.dashInvulnSec > 0 || rawDamage <= 0) {
    return { nextState: state, damageTaken: 0, revived: false, defeated: false };
  }

  const cls = ACTION_CLASSES[state.classId];
  const mitigated = Math.max(2, Math.round(rawDamage - cls.baseDefense * 0.45));
  const remainingHp = state.hp - mitigated;

  if (remainingHp > 0) {
    return {
      nextState: { ...state, hp: remainingHp },
      damageTaken: mitigated,
      revived: false,
      defeated: false,
    };
  }

  if (state.reviveTokens > 0) {
    return {
      nextState: {
        ...state,
        hp: Math.max(1, Math.round(state.maxHp * 0.5)),
        reviveTokens: state.reviveTokens - 1,
        dashInvulnSec: 2.0,
      },
      damageTaken: mitigated,
      revived: true,
      defeated: false,
    };
  }

  return {
    nextState: {
      ...state,
      hp: Math.max(1, Math.round(state.maxHp * 0.35)),
      killStreak: 0,
      comboCount: 0,
      comboTimerSec: 0,
      lastStreakCallout: null,
    },
    damageTaken: mitigated,
    revived: false,
    defeated: true,
  };
}

export function getKillStreakTier(streak: number): {
  label: string | null;
  rewardMultiplier: number;
} {
  if (streak >= 10) return { label: 'GODLIKE!', rewardMultiplier: 2.5 };
  if (streak >= 7) return { label: 'UNSTOPPABLE!', rewardMultiplier: 2.1 };
  if (streak >= 5) return { label: 'PENTA KILL!', rewardMultiplier: 1.75 };
  if (streak >= 3) return { label: 'TRIPLE KILL!', rewardMultiplier: 1.4 };
  if (streak >= 2) return { label: 'DOUBLE KILL!', rewardMultiplier: 1.2 };
  return { label: null, rewardMultiplier: 1.0 };
}

export function computeCombatHit(
  state: ActionCombatState,
  skillMultiplier: number,
  rngRoll: number
): {
  nextState: ActionCombatState;
  damage: number;
  isCrit: boolean;
} {
  const cls = ACTION_CLASSES[state.classId];
  const nextCombo = state.comboCount + 1;
  const effectiveCritChance = Math.min(0.85, cls.critChance + Math.min(0.25, nextCombo * 0.03));
  const isCrit = rngRoll < effectiveCritChance;
  const comboMult = 1 + Math.min(1.0, (nextCombo - 1) * 0.12);
  const rawBase =
    (cls.baseAttack + state.bonusAttack + (state.playerLevel - 1) * 4) * skillMultiplier;
  const damage = Math.round(rawBase * comboMult * (isCrit ? 4.0 : 1.0));

  return {
    nextState: {
      ...state,
      comboCount: nextCombo,
      comboTimerSec: 2.5,
    },
    damage,
    isCrit,
  };
}

export function recordMonsterDefeat(
  state: ActionCombatState,
  baseGold: number,
  baseXp: number
): {
  nextState: ActionCombatState;
  awardedGold: number;
  awardedXp: number;
  streakLabel: string | null;
  leveledUp: boolean;
  domainLeveledUp: boolean;
} {
  const nextStreak = state.killStreak + 1;
  const tier = getKillStreakTier(nextStreak);
  const awardedGold = Math.round(baseGold * tier.rewardMultiplier);
  const awardedXp = Math.round(baseXp * tier.rewardMultiplier);

  let playerLevel = state.playerLevel;
  let combatXp = state.combatXp + awardedXp;
  let leveledUp = false;
  while (combatXp >= playerLevel * 120) {
    combatXp -= playerLevel * 120;
    playerLevel += 1;
    leveledUp = true;
  }

  const cls = ACTION_CLASSES[state.classId];
  const nextMaxHp = cls.maxHp + state.bonusMaxHp + (playerLevel - 1) * 18;
  const domainGain = addDomainExperience(
    state.domainLevel,
    state.domainXp,
    Math.max(25, Math.round(awardedXp * 0.5))
  );

  return {
    nextState: {
      ...state,
      playerLevel,
      combatXp,
      maxHp: nextMaxHp,
      hp: leveledUp ? nextMaxHp : Math.min(nextMaxHp, state.hp + Math.round(nextMaxHp * 0.08)),
      gold: state.gold + awardedGold,
      killStreak: nextStreak,
      totalKills: state.totalKills + 1,
      lastStreakCallout: tier.label ?? state.lastStreakCallout,
      domainLevel: domainGain.level,
      domainXp: domainGain.xp,
    },
    awardedGold,
    awardedXp,
    streakLabel: tier.label,
    leveledUp,
    domainLeveledUp: domainGain.leveledUp,
  };
}

/* -------------------------------------------------------------------------- */
/* Open-World Radial Biome Zones & Dynamic Atmosphere Tints                   */
/* -------------------------------------------------------------------------- */

export type WorldZoneId =
  'solara_citadel' | 'whisper_forest' | 'obsidian_desert' | 'frost_mountains' | 'shadow_wastes';

export interface WorldZoneInfo {
  readonly id: WorldZoneId;
  readonly name: string;
  readonly shortLabel: string;
  readonly safe: boolean;
  readonly dangerTier: number; // 0..4
  readonly fogTintHex: number;
  readonly ambientTintHex: number;
  readonly badgeClass: string;
}

export const WORLD_ZONES: readonly WorldZoneInfo[] = [
  {
    id: 'solara_citadel',
    name: 'Solara Citadel',
    shortLabel: 'Safe Haven',
    safe: true,
    dangerTier: 0,
    fogTintHex: 0xaad8ff,
    ambientTintHex: 0xd8ecff,
    badgeClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
  },
  {
    id: 'whisper_forest',
    name: 'Emerald Whisper Forest',
    shortLabel: 'Tier I Frontier',
    safe: false,
    dangerTier: 1,
    fogTintHex: 0x8ec7a8,
    ambientTintHex: 0xbce6cc,
    badgeClass: 'text-teal-300 border-teal-500/40 bg-teal-950/60',
  },
  {
    id: 'obsidian_desert',
    name: 'Sunscorched Obsidian Desert',
    shortLabel: 'Tier II Frontier',
    safe: false,
    dangerTier: 2,
    fogTintHex: 0xd6a670,
    ambientTintHex: 0xffdcb0,
    badgeClass: 'text-amber-300 border-amber-500/40 bg-amber-950/60',
  },
  {
    id: 'frost_mountains',
    name: 'Celestial Frost Mountains',
    shortLabel: 'Tier III Frontier',
    safe: false,
    dangerTier: 3,
    fogTintHex: 0x9cc9e8,
    ambientTintHex: 0xd0ecff,
    badgeClass: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/60',
  },
  {
    id: 'shadow_wastes',
    name: 'Cursed Shadow Wastes',
    shortLabel: 'Tier IV Abyss',
    safe: false,
    dangerTier: 4,
    fogTintHex: 0x4c356b,
    ambientTintHex: 0x9172bd,
    badgeClass: 'text-purple-300 border-purple-500/50 bg-purple-950/70',
  },
];

export function detectWorldZone(playerX: number, playerZ: number): WorldZoneInfo {
  const dist = Math.hypot(playerX, playerZ);
  if (dist < 28) return WORLD_ZONES[0];
  if (dist < 75) return WORLD_ZONES[1];
  if (dist < 135) return WORLD_ZONES[2];
  if (dist < 210) return WORLD_ZONES[3];
  return WORLD_ZONES[4];
}

export function computeZoneScaledMonsterLevel(
  playerLevel: number,
  zoneDangerTier: number,
  jitterNormalized: number // 0..1
): number {
  const jitter = Math.round((jitterNormalized - 0.5) * 4); // -2..+2
  return Math.max(1, playerLevel + zoneDangerTier * 3 + jitter);
}

/* -------------------------------------------------------------------------- */
/* Enemy 5-State AI FSM + Ranged Kiter ('shade') + Non-Destructive Wave TopUp */
/* -------------------------------------------------------------------------- */

export type EnemyFsmState = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee';
export type EnemyArchetype = 'goblin' | 'wolf' | 'shade' | 'boss';

export interface EnemyFsmInput {
  readonly archetype: EnemyArchetype;
  readonly x: number;
  readonly z: number;
  readonly homeX: number;
  readonly homeZ: number;
  readonly hpRatio: number; // 0..1
  readonly playerX: number;
  readonly playerZ: number;
  readonly statusMask: StatusEffectMask;
  readonly dtSec: number;
}

export interface EnemyFsmOutput {
  readonly state: EnemyFsmState;
  readonly nextX: number;
  readonly nextZ: number;
  readonly attackedPlayer: boolean;
}

const FLEE_THRESHOLDS: Readonly<Record<EnemyArchetype, number>> = {
  goblin: 0.12,
  wolf: 0.05,
  shade: 0.3,
  boss: 0,
};

const ATTACK_RANGES: Readonly<Record<EnemyArchetype, number>> = {
  goblin: 3.4,
  wolf: 3.2,
  shade: 13.5, // Ranged kiter
  boss: 5.5,
};

const BASE_SPEEDS: Readonly<Record<EnemyArchetype, number>> = {
  goblin: 4.5,
  wolf: 6.2,
  shade: 5.4,
  boss: 4.2,
};

export function stepEnemyActionFsm(input: EnemyFsmInput): EnemyFsmOutput {
  const { archetype, x, z, homeX, homeZ, hpRatio, playerX, playerZ, statusMask, dtSec } = input;
  const dt = Math.max(0, Math.min(0.25, dtSec));

  if ((statusMask & StatusEffectFlag.STUN) !== 0) {
    return { state: 'idle', nextX: x, nextZ: z, attackedPlayer: false };
  }

  const speedMult = (statusMask & StatusEffectFlag.FREEZE) !== 0 ? 0.35 : 1.0;
  const speed = BASE_SPEEDS[archetype] * speedMult;
  const dx = playerX - x;
  const dz = playerZ - z;
  const distToPlayer = Math.hypot(dx, dz);

  // 1. Flee check (boss never flees)
  const fleeHp = FLEE_THRESHOLDS[archetype];
  if (fleeHp > 0 && hpRatio > 0 && hpRatio <= fleeHp && distToPlayer < 26) {
    const nx = distToPlayer > 0.01 ? -dx / distToPlayer : 1;
    const nz = distToPlayer > 0.01 ? -dz / distToPlayer : 0;
    return {
      state: 'flee',
      nextX: x + nx * speed * 1.15 * dt,
      nextZ: z + nz * speed * 1.15 * dt,
      attackedPlayer: false,
    };
  }

  // 2. Shade ranged kiter backs away if player gets too close (< 6.5m) while still firing
  if (archetype === 'shade' && distToPlayer < 6.5) {
    const nx = distToPlayer > 0.01 ? -dx / distToPlayer : 1;
    const nz = distToPlayer > 0.01 ? -dz / distToPlayer : 0;
    return {
      state: 'attack',
      nextX: x + nx * speed * 0.9 * dt,
      nextZ: z + nz * speed * 0.9 * dt,
      attackedPlayer: true,
    };
  }

  // 3. Attack range check
  if (distToPlayer <= ATTACK_RANGES[archetype]) {
    return {
      state: 'attack',
      nextX: x,
      nextZ: z,
      attackedPlayer: true,
    };
  }

  // 4. Chase check
  const aggroRange = archetype === 'boss' ? 38 : 26;
  if (distToPlayer <= aggroRange) {
    const nx = dx / Math.max(0.01, distToPlayer);
    const nz = dz / Math.max(0.01, distToPlayer);
    return {
      state: 'chase',
      nextX: x + nx * speed * dt,
      nextZ: z + nz * speed * dt,
      attackedPlayer: false,
    };
  }

  // 5. Patrol back near home
  const hdx = homeX - x;
  const hdz = homeZ - z;
  const homeDist = Math.hypot(hdx, hdz);
  if (homeDist > 2.5) {
    return {
      state: 'patrol',
      nextX: x + (hdx / homeDist) * speed * 0.55 * dt,
      nextZ: z + (hdz / homeDist) * speed * 0.55 * dt,
      attackedPlayer: false,
    };
  }

  return { state: 'idle', nextX: x, nextZ: z, attackedPlayer: false };
}

/**
 * Non-destructive wave top-up: preserves all existing living monsters intact and
 * appends only the missing wave count (including ranged Shadow Shades).
 */
export function computeNonDestructiveWaveTopUp(params: {
  existingMonsters: readonly MonsterTarget[];
  minWaveCount: number;
  playerX: number;
  playerZ: number;
  playerLevel: number;
  waveSeed: number;
}): MonsterTarget[] {
  const { existingMonsters, minWaveCount, playerX, playerZ, playerLevel, waveSeed } = params;
  const living = existingMonsters.filter((m) => m.hp > 0n);
  if (living.length >= minWaveCount) {
    return [...living];
  }

  const zone = detectWorldZone(playerX, playerZ);
  const missing = minWaveCount - living.length;
  const spawned: MonsterTarget[] = [];

  for (let i = 0; i < missing; i++) {
    const angle = (waveSeed + i * 2.13) % (Math.PI * 2);
    const radius = 20 + ((waveSeed + i * 7) % 14);
    const spawnX = Math.round(playerX + Math.cos(angle) * radius);
    const spawnZ = Math.round(playerZ + Math.sin(angle) * radius);
    const isShade = i % 2 === 0;
    const lvl = computeZoneScaledMonsterLevel(playerLevel, Math.max(1, zone.dangerTier), 0.5);
    const maxHp = BigInt(180 + lvl * 65);

    spawned.push({
      id: `m_wave_${waveSeed}_${i}`,
      name: isShade ? 'Umbral Shade Kiter' : 'Frontier Dire Stalker',
      level: lvl,
      tier: isShade ? 'elite' : 'minion',
      hp: maxHp,
      maxHp,
      attack: BigInt(18 + lvl * 5),
      defense: BigInt(8 + lvl * 2),
      x: spawnX,
      z: spawnZ,
      homeX: spawnX,
      homeZ: spawnZ,
      expReward: BigInt(95 + lvl * 25),
      dropResources: { wood: 1500n, steel: 900n },
      aiState: 'patrolling',
      movementPolicy: isShade ? 'flanking_orbiter' : 'pack_swarmer',
      aggroRadius: isShade ? 28 : 22,
    });
  }

  return [...living, ...spawned];
}

/* -------------------------------------------------------------------------- */
/* Payment-Free Field Provisions Shop (In-Game Gold Only)                     */
/* -------------------------------------------------------------------------- */

export type FieldProvisionId =
  'health_potion' | 'stamina_draught' | 'revive_token' | 'shadow_essence' | 'relic_whetstone';

export interface FieldProvisionItem {
  readonly id: FieldProvisionId;
  readonly name: string;
  readonly icon: string;
  readonly goldCost: number;
  readonly description: string;
}

export const FIELD_PROVISIONS_CATALOG: readonly FieldProvisionItem[] = [
  {
    id: 'health_potion',
    name: 'Crimson Elixir',
    icon: '🧪',
    goldCost: 120,
    description: 'Restores 50% Max HP immediately and adds +1 reserve potion.',
  },
  {
    id: 'stamina_draught',
    name: 'Windrunner Draught',
    icon: '⚡',
    goldCost: 100,
    description: 'Refills Stamina to 100% and resets Dash cooldown.',
  },
  {
    id: 'revive_token',
    name: 'Phoenix Revive Token',
    icon: '🪶',
    goldCost: 450,
    description: 'Auto-prevents defeat once, reviving at 50% HP with 2s invulnerability.',
  },
  {
    id: 'shadow_essence',
    name: 'Ascendant Essence',
    icon: '🔮',
    goldCost: 300,
    description: 'Infuses +240 Ascendant Domain XP toward higher Domain milestones.',
  },
  {
    id: 'relic_whetstone',
    name: 'Mythic Relic Whetstone',
    icon: '⚔️',
    goldCost: 520,
    description: 'Permanently sharpens combat strikes by +12 Attack (max +120).',
  },
];

export function purchaseFieldProvision(
  state: ActionCombatState,
  itemId: FieldProvisionId
): {
  nextState: ActionCombatState;
  ok: boolean;
  message: string;
} {
  const item = FIELD_PROVISIONS_CATALOG.find((p) => p.id === itemId);
  if (!item) {
    return { nextState: state, ok: false, message: 'Unknown provision item.' };
  }
  if (state.gold < item.goldCost) {
    return {
      nextState: state,
      ok: false,
      message: `Need ${item.goldCost} Gold (you have ${state.gold} Gold).`,
    };
  }

  const spentGold = state.gold - item.goldCost;

  switch (itemId) {
    case 'health_potion':
      return {
        nextState: {
          ...state,
          gold: spentGold,
          potions: state.potions + 1,
          hp: Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.5)),
        },
        ok: true,
        message: 'Purchased Crimson Elixir (+50% HP & +1 potion)!',
      };
    case 'stamina_draught':
      return {
        nextState: {
          ...state,
          gold: spentGold,
          stamina: state.maxStamina,
          dashCooldownSec: 0,
        },
        ok: true,
        message: 'Drank Windrunner Draught (Stamina 100% & Dash ready)!',
      };
    case 'revive_token':
      return {
        nextState: {
          ...state,
          gold: spentGold,
          reviveTokens: state.reviveTokens + 1,
        },
        ok: true,
        message: 'Acquired Phoenix Revive Token (auto-revive on lethal blow)!',
      };
    case 'shadow_essence': {
      const domainGain = addDomainExperience(state.domainLevel, state.domainXp, 240);
      return {
        nextState: {
          ...state,
          gold: spentGold,
          domainLevel: domainGain.level,
          domainXp: domainGain.xp,
        },
        ok: true,
        message: domainGain.leveledUp
          ? `Ascendant Domain surged to Lv.${domainGain.level}!`
          : 'Infused +240 Ascendant Domain XP!',
      };
    }
    case 'relic_whetstone': {
      if (state.bonusAttack >= 120) {
        return {
          nextState: state,
          ok: false,
          message: 'Mythic Relic Whetstone bonus is already maxed (+120 ATK).',
        };
      }
      return {
        nextState: {
          ...state,
          gold: spentGold,
          bonusAttack: Math.min(120, state.bonusAttack + 12),
        },
        ok: true,
        message: `Mythic Relic Whetstone forged (+12 permanent ATK -> +${Math.min(120, state.bonusAttack + 12)})!`,
      };
    }
  }
}
