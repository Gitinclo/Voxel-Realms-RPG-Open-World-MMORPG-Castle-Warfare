/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Flame, Shield, Swords, Users, Trophy, AlertTriangle, Sparkles, CloudRain, Brain } from 'lucide-react';
import { MonsterTarget, PlayerTroopRoster, Hero, ResourceType } from '../types/game';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { simulateBattle, formatBigInt, calculateRallyCapacity, BattleResult } from '../game/math';
import { getMonsterComplexityByLevel } from '../game/worldAI';
import { sound } from '../game/audio';

interface WorldBossRallyModalProps {
  monster: MonsterTarget;
  troops: PlayerTroopRoster;
  castleLevel: number;
  heroes: Hero[];
  weather?: WeatherType;
  onVictoryLoot: (loot: Partial<Record<ResourceType, bigint>>, exp: bigint) => void;
  onCasualties: (casualties: { shieldbearers: bigint; shooters: bigint; bombers: bigint }) => void;
  onClose: () => void;
}

export const WorldBossRallyModal: React.FC<WorldBossRallyModalProps> = ({
  monster,
  troops,
  castleLevel,
  heroes,
  weather = 'clear',
  onVictoryLoot,
  onCasualties,
  onClose,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');
  const [isRallyMode, setIsRallyMode] = useState<boolean>(monster.isWorldBoss || monster.level > 200);
  const [battleReport, setBattleReport] = useState<BattleResult | null>(null);
  const [isBattling, setIsBattling] = useState<boolean>(false);
  const weatherConfig = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const aiProfile = getMonsterComplexityByLevel(monster.level);
  const activeAttackPattern =
    aiProfile.attackPatterns.find((p) => p.id === monster.activeAttackPatternId) ||
    aiProfile.attackPatterns[0];

  const rallyCapacity = calculateRallyCapacity(castleLevel);
  const leadHero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];

  // Calculate player's available highest tier troops
  const totalShields = Object.entries(troops)
    .filter(([k]) => k.startsWith('shieldbearer'))
    .reduce((s, [, c]) => s + c, 0n);

  const totalShooters = Object.entries(troops)
    .filter(([k]) => k.startsWith('shooter'))
    .reduce((s, [, c]) => s + c, 0n);

  const totalBombers = Object.entries(troops)
    .filter(([k]) => k.startsWith('bomber'))
    .reduce((s, [, c]) => s + c, 0n);

  const [shieldCommit, setShieldCommit] = useState<bigint>(totalShields > 5000n ? 5000n : totalShields);
  const [shooterCommit, setShooterCommit] = useState<bigint>(totalShooters > 5000n ? 5000n : totalShooters);
  const [bomberCommit, setBomberCommit] = useState<bigint>(totalBombers > 5000n ? 5000n : totalBombers);

  const totalArmyCount = shieldCommit + shooterCommit + bomberCommit;

  const handleLaunchAttack = () => {
    if (totalArmyCount === 0n || isBattling) return;

    setIsBattling(true);
    sound.playExplosion();

    // If rally mode, clan members add extra rally troops
    const clanReinforcementMult = isRallyMode ? 2.5 : 1.0;

    const army = {
      shieldbearers: {
        tier: 6,
        count: BigInt(Math.floor(Number(shieldCommit) * clanReinforcementMult)),
      },
      shooters: {
        tier: 6,
        count: BigInt(Math.floor(Number(shooterCommit) * clanReinforcementMult)),
      },
      bombers: {
        tier: 6,
        count: BigInt(Math.floor(Number(bomberCommit) * clanReinforcementMult)),
      },
      heroAttackBonusPct: leadHero?.statBonus.attackBonusPct || 50,
      heroDefenseBonusPct: leadHero?.statBonus.defenseBonusPct || 50,
    };

    setTimeout(() => {
      const result = simulateBattle(army, monster, weather);
      setBattleReport(result);
      setIsBattling(false);

      if (result.victory) {
        sound.playUpgradeFanfare();
        onVictoryLoot(result.lootAwarded, result.expGained);
      } else {
        sound.playSwing();
      }

      onCasualties(result.playerCasualties);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-red-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 relative px-6 py-5 bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/90 border-b border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-red-100 flex items-center gap-2 flex-wrap">
                {monster.name}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 font-mono">
                  Level {monster.level} / 1000
                </span>
                {monster.isWorldBoss && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 font-bold">
                    WORLD TITAN
                  </span>
                )}
              </h2>
              <p className="text-xs text-red-200/70">
                {isRallyMode
                  ? `Grand Clan Rally Mode · Up to ${formatBigInt(rallyCapacity)} Rally Capacity Limit`
                  : 'Solo Reconnaissance Strike'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-200">
          {/* Dynamic Weather Combat Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                {weatherConfig.icon}
              </span>
              <div>
                <div className="text-xs font-bold text-white font-cinzel flex items-center gap-2">
                  <span>Atmospheric Combat Condition: {weatherConfig.name}</span>
                  {weatherConfig.monsterExpBonusPct > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px]">
                      +{weatherConfig.monsterExpBonusPct}% Combat EXP
                    </span>
                  )}
                </div>
                <div className="text-xs text-cyan-200/90 mt-0.5">
                  {weatherConfig.combatFlavorText}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
              <span className="text-slate-400">March Speed:</span>
              <span className="font-bold text-white">
                {Math.round(weatherConfig.marchSpeedMultiplier * 100)}%
              </span>
            </div>
          </div>

          {/* Monster AI Behavior & Telegraph Intelligence Card */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold font-cinzel text-amber-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-amber-400" />
                {aiProfile.name} — {aiProfile.movementPolicyLabel}
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Recommended Counter: {activeAttackPattern.counterTroop.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-rose-300 font-bold">
                  ⚡ Signature Telegraph: {activeAttackPattern.name} ({activeAttackPattern.windupSeconds}s Windup)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeAttackPattern.description} · {activeAttackPattern.statusEffect}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-cyan-300 font-bold">
                  🌍 Environmental AI: {monster.activeEnvInteraction || aiProfile.environmentalInteractions[0]?.actionName}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Pathfinding: {aiProfile.pathfindingAlgorithm} (IQ {aiProfile.tacticalIQ}/100)
                </div>
              </div>
            </div>
          </div>

          {/* Battle Report Overlay if Battle Resolved */}
          {battleReport && (
            <div
              className={`p-5 rounded-2xl border ${
                battleReport.victory
                  ? 'bg-emerald-950/60 border-emerald-400/50'
                  : 'bg-rose-950/60 border-rose-400/50'
              } space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy
                    className={`w-8 h-8 ${
                      battleReport.victory ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <h3 className="text-xl font-bold font-cinzel text-white">
                      {battleReport.victory ? 'Glorious Victory!' : 'Defeat - Troops Retreated!'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Battle concluded in {battleReport.rounds} combat rounds. Damage dealt:{' '}
                      <span className="font-mono font-bold text-white">
                        {formatBigInt(battleReport.damageDealt)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">EXP Acquired</div>
                  <div className="text-lg font-bold font-mono text-emerald-300">
                    +{formatBigInt(battleReport.expGained)}
                  </div>
                </div>
              </div>

              {/* Casualties summary */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div>
                  <div className="text-slate-400">Shieldbearer Casualties</div>
                  <div className="font-bold text-rose-400">
                    -{formatBigInt(battleReport.playerCasualties.shieldbearers)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Shooter Casualties</div>
                  <div className="font-bold text-rose-400">
                    -{formatBigInt(battleReport.playerCasualties.shooters)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Bomber Casualties</div>
                  <div className="font-bold text-rose-400">
                    -{formatBigInt(battleReport.playerCasualties.bombers)}
                  </div>
                </div>
              </div>

              {/* Loot drops */}
              {battleReport.victory && Object.keys(battleReport.lootAwarded).length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">Spoils of War Acquired:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(battleReport.lootAwarded).map(([res, amount]) => (
                      <span
                        key={res}
                        className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold"
                      >
                        +{formatBigInt(amount as bigint)} {res.toUpperCase()}
                      </span>
                    ))}
                    {monster.dropEquipmentChest && (
                      <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1">
                        🎁 {monster.dropEquipmentChest}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monster Profile Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Monster Vitality</span>
                <span className="text-xs font-mono text-rose-400">Level {monster.level}</span>
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-white">
                  {formatBigInt(monster.hp)} / {formatBigInt(monster.maxHp)} HP
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Number((monster.hp * 100n) / (monster.maxHp || 1n))
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  <span className="text-slate-400">Attack:</span>{' '}
                  <span className="text-rose-400 font-bold">{formatBigInt(monster.attack)}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-700">
                  <span className="text-slate-400">Defense:</span>{' '}
                  <span className="text-blue-400 font-bold">{formatBigInt(monster.defense)}</span>
                </div>
              </div>
            </div>

            {/* Lead Hero Selector */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Appointed Vanguard General</span>
                <span className="text-xs text-amber-400 font-mono">Hero Command</span>
              </div>
              <select
                value={selectedHeroId}
                onChange={(e) => setSelectedHeroId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-hidden focus:border-red-400"
              >
                {heroes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.avatarIcon} {h.name} (Lv.{h.level} {h.rarity.toUpperCase()}) - +
                    {h.statBonus.attackBonusPct}% ATK
                  </option>
                ))}
              </select>
              {leadHero && (
                <div className="text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="text-indigo-300 font-bold">{leadHero.skillName}:</span>{' '}
                  {leadHero.skillDesc}
                </div>
              )}
            </div>
          </div>

          {/* Troop Commitment Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Deploy Legions to Combat March</span>
              <span className="text-amber-300 font-mono">
                Total Mobilized: {formatBigInt(totalArmyCount)} / {formatBigInt(rallyCapacity)} Max
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Shieldbearer input */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-400" /> Shieldbearers
                  </span>
                  <span className="font-mono text-slate-400">{formatBigInt(totalShields)} Avail</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Number(totalShields > 1000000n ? 1000000n : totalShields)}
                  value={Number(shieldCommit)}
                  onChange={(e) => setShieldCommit(BigInt(e.target.value))}
                  className="w-full accent-blue-400"
                />
                <div className="text-right font-mono font-bold text-sm text-blue-300">
                  {formatBigInt(shieldCommit)}
                </div>
              </div>

              {/* Shooter input */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-emerald-400" /> Shooters
                  </span>
                  <span className="font-mono text-slate-400">{formatBigInt(totalShooters)} Avail</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Number(totalShooters > 1000000n ? 1000000n : totalShooters)}
                  value={Number(shooterCommit)}
                  onChange={(e) => setShooterCommit(BigInt(e.target.value))}
                  className="w-full accent-emerald-400"
                />
                <div className="text-right font-mono font-bold text-sm text-emerald-300">
                  {formatBigInt(shooterCommit)}
                </div>
              </div>

              {/* Bomber input */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-orange-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-orange-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" /> Bombers
                  </span>
                  <span className="font-mono text-slate-400">{formatBigInt(totalBombers)} Avail</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Number(totalBombers > 1000000n ? 1000000n : totalBombers)}
                  value={Number(bomberCommit)}
                  onChange={(e) => setBomberCommit(BigInt(e.target.value))}
                  className="w-full accent-orange-400"
                />
                <div className="text-right font-mono font-bold text-sm text-orange-300">
                  {formatBigInt(bomberCommit)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRallyMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                !isRallyMode
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              Solo Strike
            </button>
            <button
              onClick={() => setIsRallyMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isRallyMode
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Clan Rally (1 Trillion Cap)
            </button>
          </div>

          <button
            onClick={handleLaunchAttack}
            disabled={totalArmyCount === 0n || isBattling}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              totalArmyCount > 0n && !isBattling
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 text-white shadow-lg shadow-red-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isBattling ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" /> Resolving Simulation...
              </>
            ) : (
              <>
                <Swords className="w-5 h-5" />
                {isRallyMode ? 'Launch 1 Trillion Clan Rally' : 'Attack World Monster'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
