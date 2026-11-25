/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Causality Engine v2 — Priority-sorted reactive open-world rule engine
 * supporting SINGLE, AND, OR, and NOT predicate combinators, per-rule cooldowns,
 * maxFires caps, and live inspection snapshots.
 */

export type CausalityCombinator = 'SINGLE' | 'AND' | 'OR' | 'NOT';

export type CausalityActionType =
  | 'danger_warning'
  | 'super_skill_unlock'
  | 'domain_evolution'
  | 'boss_proximity_alert'
  | 'kill_streak_surge'
  | 'relic_milestone_airdrop'
  | 'boss_reinforcements'
  | 'wave_clear_bounty'
  | 'nightfall_warning'
  | 'domain_ready_reminder';

export interface CausalityContext {
  readonly hpRatio: number; // 0..1
  readonly playerLevel: number;
  readonly totalKills: number;
  readonly killStreak: number;
  readonly domainLevel: number;
  readonly domainCooldownSeconds: number;
  readonly nearestBossDistance: number; // Infinity if no boss nearby
  readonly nearestBossHpRatio: number; // 0..1 (1 if none)
  readonly aliveEnemies: number;
  readonly isNight: boolean;
  readonly inSafeZone: boolean;
}

export type CausalityPredicate = (ctx: CausalityContext) => boolean;

export interface CausalityRuleDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priority: number; // Higher executes first
  readonly combinator: CausalityCombinator;
  readonly predicates: readonly CausalityPredicate[];
  readonly cooldownSeconds: number;
  readonly maxFires: number; // 0 = unlimited
  readonly actionType: CausalityActionType;
  readonly message: string;
  readonly rewardGold?: number;
  readonly rewardMaxHpBonus?: number;
}

export interface CausalityRuleRuntime {
  readonly cooldownRemaining: number;
  readonly fireCount: number;
  readonly lastFiredAtMs: number | null;
}

export interface CausalityEngineState {
  readonly rules: Readonly<Record<string, CausalityRuleRuntime>>;
  readonly recentEvents: readonly CausalityTriggeredEvent[];
}

export interface CausalityTriggeredEvent {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly actionType: CausalityActionType;
  readonly message: string;
  readonly priority: number;
  readonly timestampMs: number;
  readonly rewardGold: number;
  readonly rewardMaxHpBonus: number;
}

export interface CausalityRuleSnapshot {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priority: number;
  readonly combinator: CausalityCombinator;
  readonly cooldownSeconds: number;
  readonly cooldownRemaining: number;
  readonly fireCount: number;
  readonly maxFires: number;
  readonly exhausted: boolean;
  readonly ready: boolean;
}

export interface EvaluateCausalityResult {
  readonly nextState: CausalityEngineState;
  readonly triggered: readonly CausalityTriggeredEvent[];
}

export const DEFAULT_WORLD_CAUSALITY_RULES: readonly CausalityRuleDef[] = [
  {
    id: 'rule_low_hp_danger',
    name: 'Critical Vitality Alert',
    description: 'Fires when commander HP drops below 20% outside safe zones.',
    priority: 100,
    combinator: 'AND',
    predicates: [(ctx) => ctx.hpRatio > 0 && ctx.hpRatio < 0.2, (ctx) => !ctx.inSafeZone],
    cooldownSeconds: 5,
    maxFires: 0,
    actionType: 'danger_warning',
    message: 'DANGER: Vitality below 20%! Cast [C] Heal or drink a Field Potion!',
  },
  {
    id: 'rule_super_skill_unlock',
    name: 'Ascendant Awakening',
    description: 'Unlocks heightened Domain resonance at Level 5+ and 10+ defeats.',
    priority: 95,
    combinator: 'AND',
    predicates: [(ctx) => ctx.playerLevel >= 5, (ctx) => ctx.totalKills >= 10],
    cooldownSeconds: 0,
    maxFires: 1,
    actionType: 'super_skill_unlock',
    message: 'ASCENDANT AWAKENING: Domain Resonance unlocked (+250 Gold bounty)!',
    rewardGold: 250,
  },
  {
    id: 'rule_domain_evolution',
    name: 'Ascendant Domain Evolution',
    description: 'Permanent +150 Max HP blessing at Domain Lv.50+ and 50+ defeats.',
    priority: 90,
    combinator: 'AND',
    predicates: [(ctx) => ctx.domainLevel >= 50, (ctx) => ctx.totalKills >= 50],
    cooldownSeconds: 0,
    maxFires: 1,
    actionType: 'domain_evolution',
    message: 'DOMAIN EVOLUTION: Permanent +150 Max HP sovereign blessing bestowed!',
    rewardMaxHpBonus: 150,
  },
  {
    id: 'rule_boss_proximity',
    name: 'Titan Proximity Warning',
    description: 'Alerts when a Boss or World Titan approaches within 20m.',
    priority: 85,
    combinator: 'SINGLE',
    predicates: [(ctx) => ctx.nearestBossDistance <= 20],
    cooldownSeconds: 12,
    maxFires: 0,
    actionType: 'boss_proximity_alert',
    message: 'TITAN PROXIMITY: Apex boss detected within 20m — prepare [G] Domain!',
  },
  {
    id: 'rule_kill_streak_fire',
    name: 'Unstoppable Streak Surge',
    description: 'Triggers ON FIRE! surge at 5+ consecutive defeats.',
    priority: 80,
    combinator: 'SINGLE',
    predicates: [(ctx) => ctx.killStreak >= 5],
    cooldownSeconds: 8,
    maxFires: 0,
    actionType: 'kill_streak_surge',
    message: 'ON FIRE! 5+ Kill Streak Surge active — +180 bonus Gold!',
    rewardGold: 180,
  },
  {
    id: 'rule_relic_milestone_airdrop',
    name: 'Mythic Relic Airdrop',
    description: 'Drops a payment-free Mythic Relic cache after 15 field defeats.',
    priority: 75,
    combinator: 'SINGLE',
    predicates: [(ctx) => ctx.totalKills >= 15],
    cooldownSeconds: 0,
    maxFires: 1,
    actionType: 'relic_milestone_airdrop',
    message: 'MYTHIC RELIC AIRDROP: Celestial Sovereign Cache claimed (+500 Gold)!',
    rewardGold: 500,
  },
  {
    id: 'rule_boss_reinforcements',
    name: 'Boss Reinforcement Call',
    description: 'Boss summons skirmishers if wounded (<50% HP) OR within 12m.',
    priority: 70,
    combinator: 'OR',
    predicates: [
      (ctx) => ctx.nearestBossHpRatio < 0.5 && ctx.nearestBossDistance < 60,
      (ctx) => ctx.nearestBossDistance <= 12,
    ],
    cooldownSeconds: 30,
    maxFires: 0,
    actionType: 'boss_reinforcements',
    message: 'BOSS REINFORCEMENTS: Enemy vanguard rallying to defend their Titan!',
  },
  {
    id: 'rule_wave_clear_bounty',
    name: 'Sector Wave Clear Bounty',
    description: 'Grants wave-clear Gold bounty and triggers non-destructive wave top-up.',
    priority: 65,
    combinator: 'SINGLE',
    predicates: [(ctx) => ctx.aliveEnemies === 0],
    cooldownSeconds: 10,
    maxFires: 0,
    actionType: 'wave_clear_bounty',
    message: 'SECTOR CLEARED! Wave Bounty +300 Gold awarded — fresh patrol inbound.',
    rewardGold: 300,
  },
  {
    id: 'rule_nightfall_danger',
    name: 'Nightfall Bloodmoon Fury',
    description: 'Warns when traversing hostile frontier zones after nightfall.',
    priority: 60,
    combinator: 'AND',
    predicates: [(ctx) => ctx.isNight, (ctx) => !ctx.inSafeZone],
    cooldownSeconds: 45,
    maxFires: 0,
    actionType: 'nightfall_warning',
    message: 'NIGHTFALL: Shadow creatures grow fiercer outside Solara Citadel!',
  },
  {
    id: 'rule_domain_ready_reminder',
    name: 'Ascendant Domain Ready',
    description: 'Reminds commander when Domain Expansion is off cooldown in hostile territory.',
    priority: 50,
    combinator: 'NOT',
    predicates: [(ctx) => ctx.domainCooldownSeconds > 0 || ctx.aliveEnemies <= 0 || ctx.inSafeZone],
    cooldownSeconds: 20,
    maxFires: 0,
    actionType: 'domain_ready_reminder',
    message: 'ASCENDANT DOMAIN READY: Press [G] to unleash Void Resonance!',
  },
];

export function evaluateCombinator(
  combinator: CausalityCombinator,
  predicates: readonly CausalityPredicate[],
  ctx: CausalityContext
): boolean {
  if (predicates.length === 0) return false;
  switch (combinator) {
    case 'SINGLE':
      return Boolean(predicates[0](ctx));
    case 'AND':
      return predicates.every((fn) => fn(ctx));
    case 'OR':
      return predicates.some((fn) => fn(ctx));
    case 'NOT':
      return !predicates[0](ctx);
  }
}

export function createInitialCausalityState(
  rules: readonly CausalityRuleDef[] = DEFAULT_WORLD_CAUSALITY_RULES
): CausalityEngineState {
  const runtimeMap: Record<string, CausalityRuleRuntime> = {};
  for (const rule of rules) {
    runtimeMap[rule.id] = {
      cooldownRemaining: 0,
      fireCount: 0,
      lastFiredAtMs: null,
    };
  }
  return {
    rules: runtimeMap,
    recentEvents: [],
  };
}

export function evaluateCausalityTick(params: {
  state: CausalityEngineState;
  context: CausalityContext;
  dtSeconds: number;
  nowMs: number;
  rules?: readonly CausalityRuleDef[];
  maxTriggeredPerTick?: number;
}): EvaluateCausalityResult {
  const {
    state,
    context,
    dtSeconds,
    nowMs,
    rules = DEFAULT_WORLD_CAUSALITY_RULES,
    maxTriggeredPerTick = 3,
  } = params;

  const safeDt = Math.max(0, dtSeconds);
  const nextRuntime: Record<string, CausalityRuleRuntime> = {};
  for (const rule of rules) {
    const prev = state.rules[rule.id] ?? {
      cooldownRemaining: 0,
      fireCount: 0,
      lastFiredAtMs: null,
    };
    nextRuntime[rule.id] = {
      ...prev,
      cooldownRemaining: Math.max(0, prev.cooldownRemaining - safeDt),
    };
  }

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
  const triggered: CausalityTriggeredEvent[] = [];

  for (const rule of sortedRules) {
    if (triggered.length >= maxTriggeredPerTick) break;
    const rt = nextRuntime[rule.id];
    if (rt.cooldownRemaining > 0) continue;
    if (rule.maxFires > 0 && rt.fireCount >= rule.maxFires) continue;

    if (evaluateCombinator(rule.combinator, rule.predicates, context)) {
      const event: CausalityTriggeredEvent = {
        id: `${rule.id}_${nowMs}_${rt.fireCount + 1}`,
        ruleId: rule.id,
        ruleName: rule.name,
        actionType: rule.actionType,
        message: rule.message,
        priority: rule.priority,
        timestampMs: nowMs,
        rewardGold: rule.rewardGold ?? 0,
        rewardMaxHpBonus: rule.rewardMaxHpBonus ?? 0,
      };
      triggered.push(event);
      nextRuntime[rule.id] = {
        cooldownRemaining: rule.cooldownSeconds,
        fireCount: rt.fireCount + 1,
        lastFiredAtMs: nowMs,
      };
    }
  }

  const nextRecentEvents =
    triggered.length > 0 ? [...triggered, ...state.recentEvents].slice(0, 12) : state.recentEvents;

  return {
    nextState: {
      rules: nextRuntime,
      recentEvents: nextRecentEvents,
    },
    triggered,
  };
}

export function buildCausalityRuleSnapshots(
  state: CausalityEngineState,
  rules: readonly CausalityRuleDef[] = DEFAULT_WORLD_CAUSALITY_RULES
): CausalityRuleSnapshot[] {
  return [...rules]
    .sort((a, b) => b.priority - a.priority)
    .map((rule) => {
      const rt = state.rules[rule.id] ?? {
        cooldownRemaining: 0,
        fireCount: 0,
        lastFiredAtMs: null,
      };
      const exhausted = rule.maxFires > 0 && rt.fireCount >= rule.maxFires;
      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        priority: rule.priority,
        combinator: rule.combinator,
        cooldownSeconds: rule.cooldownSeconds,
        cooldownRemaining: Number(rt.cooldownRemaining.toFixed(1)),
        fireCount: rt.fireCount,
        maxFires: rule.maxFires,
        exhausted,
        ready: !exhausted && rt.cooldownRemaining <= 0,
      };
    });
}
