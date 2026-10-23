/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CharacterAppearance,
  Clan,
  ClanMember,
  ClanRole,
  ClanEmblem,
  ClanBuff,
  ClanChatMessage,
  ClanLeaderboardEntry,
  GameResources,
  Hero,
  LeaderboardEntry,
  MonsterTarget,
  NPC,
  NPCDirective,
  NPCTradeOffer,
  PlayerTroopRoster,
  Quest,
  ResourceNode,
  ResourceType,
  TroopType,
  WorldAIEventLog,
} from './types/game';
import {
  INITIAL_APPEARANCE,
  INITIAL_CLAN,
  INITIAL_CLAN_MEMBERS,
  INITIAL_CLAN_CHAT,
  INITIAL_CLAN_LEADERBOARD,
  INITIAL_HEROES,
  INITIAL_LEADERBOARD,
  INITIAL_MONSTERS,
  INITIAL_NPCS,
  INITIAL_RESOURCE_NODES,
  INITIAL_RESOURCES,
  INITIAL_TROOPS,
} from './game/initialData';
import {
  calculateCastleTroopCapacity,
  calculateMultiplicativePowerRating,
  formatBigInt,
  getCastleUpgradeCost,
  getTroopTierInfo,
  MAX_CASTLE_LEVEL,
} from './game/math';
import { calculateOutpostAssault } from './game/clanMath';
import { sound } from './game/audio';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { CastleModal } from './components/CastleModal';
import { TroopBarracksModal } from './components/TroopBarracksModal';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import { HeroModal } from './components/HeroModal';
import { ClanModal } from './components/ClanModal';
import { WorldBossRallyModal } from './components/WorldBossRallyModal';
import { ResourceGatherModal } from './components/ResourceGatherModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CppArchitectureModal } from './components/CppArchitectureModal';
import { AdminConsoleModal } from './components/AdminConsoleModal';
import { WeatherModal } from './components/WeatherModal';
import { CultivationModal } from './components/CultivationModal';
import { WorldAIDirectorModal } from './components/WorldAIDirectorModal';
import { DailyLoginModal } from './components/DailyLoginModal';
import {
  DAILY_LOGIN_STORAGE_KEY,
  INITIAL_DAILY_LOGIN_STATE,
  PersistedDailyLoginState,
  getCalendarDateKey,
  evaluateDailyLoginState,
  getSevenDayRewardSchedule,
  claimDailyLoginReward,
  calculateVeteranScrollBonuses,
  applyVeteranScrollToCultivation,
} from './game/dailyLogin';
import { tickWorldAI, generateRadiantQuestForNPC } from './game/worldAI';
import { PlayerCultivationState, CultivationPill, CultivationPath } from './types/cultivation';
import {
  CULTIVATION_REALMS,
  CULTIVATION_PATH_META,
  INITIAL_KARMA_STATE,
  INITIAL_DISCIPLES,
  getRealmDef,
  getManualById,
  calculateFourPathSynergy,
  calculatePassiveQiRate,
  calculateEquippedManualsSummary,
  calculateManualUpgradeCost,
  rollManualDiscovery,
} from './game/cultivationMath';
import {
  WeatherType,
  WEATHER_CONFIGS,
  getNextWeather,
  calculateWeatherGatherRate,
} from './game/weather';

type ActiveModal =
  | 'none'
  | 'castle'
  | 'troops'
  | 'character'
  | 'hero'
  | 'clan'
  | 'world_boss'
  | 'resources'
  | 'leaderboard'
  | 'cpp_core'
  | 'admin_console'
  | 'weather'
  | 'cultivation'
  | 'world_ai'
  | 'daily_login';

export default function App() {
  // Query param check for ?autostart=1
  const [gameState, setGameState] = useState<'title' | 'playing'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  // Player State
  const [playerAppearance, setPlayerAppearance] = useState<CharacterAppearance>(INITIAL_APPEARANCE);
  const [castleLevel, setCastleLevel] = useState<number>(12);
  const [resources, setResources] = useState<GameResources>(INITIAL_RESOURCES);
  const [troops, setTroops] = useState<PlayerTroopRoster>(INITIAL_TROOPS);
  const [heroes, setHeroes] = useState<Hero[]>(INITIAL_HEROES);
  const [playerExp, setPlayerExp] = useState<bigint>(48_500n);
  const [clan, setClan] = useState<Clan>(INITIAL_CLAN);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>(INITIAL_CLAN_MEMBERS);
  const [clanCoins, setClanCoins] = useState<bigint>(3_400n);
  const [clanChat, setClanChat] = useState<ClanChatMessage[]>(INITIAL_CLAN_CHAT);
  const [clanLeaderboard, setClanLeaderboard] =
    useState<ClanLeaderboardEntry[]>(INITIAL_CLAN_LEADERBOARD);
  const [monsters, setMonsters] = useState<MonsterTarget[]>(INITIAL_MONSTERS);
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>(INITIAL_RESOURCE_NODES);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [leaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [selectedNpcId, setSelectedNpcId] = useState<string>(INITIAL_NPCS[0].id);
  const playerWorldPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 18 });
  const [aiLogs, setAiLogs] = useState<WorldAIEventLog[]>([
    {
      id: 'ai_init_1',
      timestamp: Date.now() - 15000,
      actorName: 'Captain Thorne',
      actorType: 'npc',
      actorLevel: 220,
      category: 'combat',
      message:
        '[Citadel Vanguard Guard] Intercepting Forest Goblin Clan (Lv.12) along eastern road.',
    },
    {
      id: 'ai_init_2',
      timestamp: Date.now() - 10000,
      actorName: 'Gorim Forgehammer',
      actorType: 'npc',
      actorLevel: 320,
      category: 'gathering',
      message:
        '[Master Runic Blacksmith] Prospected Lv.6 Steel Outcrop (+60,800 Steel Ingots added to stash).',
    },
    {
      id: 'ai_init_3',
      timestamp: Date.now() - 5000,
      actorName: 'Celestial Ender Titan [World Boss]',
      actorType: 'monster',
      actorLevel: 1000,
      category: 'environment',
      message:
        'Tier V Apex World Titan channeling Nine-Heavens Starfall Barrage [Sovereign Tempest Active].',
    },
  ]);

  // Han Jue Four-Path Cultivation State (Qi, Body, Soul, Mind — 23 Realms, 9 Layers each)
  const [cultivation, setCultivation] = useState<PlayerCultivationState>({
    currentRealmIndex: 3, // Starts at Nascent Soul Realm (Realm #4, 元婴境)
    currentLayer: 4,
    currentQi: 420_000n,
    passiveQiPerSec: 1_200n,
    paths: {
      qi: { realmIndex: 3, layer: 4, currentEnergy: 420_000n }, // Nascent Soul L4
      body: { realmIndex: 2, layer: 6, currentEnergy: 1_850_000n }, // Five Viscera Renewal L6
      soul: { realmIndex: 3, layer: 2, currentEnergy: 12_500_000n }, // Yang Spirit Projection L2
      mind: { realmIndex: 3, layer: 5, currentEnergy: 19_000_000n }, // Flawless Dao Heart L5
    },
    ownedManuals: {
      manual_qi_jade_pure: { manualId: 'manual_qi_jade_pure', level: 2 },
      manual_qi_six_paths: { manualId: 'manual_qi_six_paths', level: 1 },
      manual_body_vajra_marrow: { manualId: 'manual_body_vajra_marrow', level: 2 },
      manual_body_ancestral_witch: { manualId: 'manual_body_ancestral_witch', level: 1 },
      manual_soul_astral_visualization: { manualId: 'manual_soul_astral_visualization', level: 2 },
      manual_mind_longevity_seclusion: { manualId: 'manual_mind_longevity_seclusion', level: 3 },
    },
    equippedManuals: {
      qi: 'manual_qi_jade_pure',
      body: 'manual_body_vajra_marrow',
      soul: 'manual_soul_astral_visualization',
      mind: 'manual_mind_longevity_seclusion',
    },
    scriptureFragments: 65,
    secludedYears: 1240,
    tribulationUnderway: false,
    tribulationStrikesLeft: 0,
    tribulationDamageRating: 0n,
    inventoryPills: {
      pill_qi_condensation: 3,
      pill_foundation: 2,
      pill_dragon_blood_temper: 2,
      pill_core_condense: 1,
      pill_nascent_soul: 2,
      pill_bodhi_heart: 2,
    },
    selectedRoot: 'lightning',
    rootPurityPct: 92,
    karma: INITIAL_KARMA_STATE,
    disciples: INITIAL_DISCIPLES,
    masterTaxRatePct: 20,
    learnedMysticalSkills: ['skill_heaven_earth_sleeve', 'skill_six_paths_seal'],
    skillScrollInventory: [],
    spiritStones: 48_000n,
    masteredGreatDaos: 4,
    auraOverrideRealmIndex: null,
    veteranScrolls: 1,
    veteranScrollsComprehended: 0,
  });

  // Daily Login Reward State (persisted in localStorage, triggers on first load of the day)
  const [dailyLoginState, setDailyLoginState] = useState<PersistedDailyLoginState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(DAILY_LOGIN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...INITIAL_DAILY_LOGIN_STATE, ...parsed };
        }
      } catch {
        // Fallback to initial state if localStorage is unavailable or malformed
      }
    }
    return INITIAL_DAILY_LOGIN_STATE;
  });

  // Selected entities for modals
  const [selectedMonster, setSelectedMonster] = useState<MonsterTarget>(INITIAL_MONSTERS[0]);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Day / Night Cycle (hours: 0 to 24)
  const [timeOfDayHours, setTimeOfDayHours] = useState<number>(14.0); // Starts at 2 PM golden daylight
  const [timeSpeedMultiplier, setTimeSpeedMultiplier] = useState<number>(1);
  const [graphicsQuality, setGraphicsQuality] = useState<'ultra' | 'high' | 'balanced'>('ultra');
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());
  const [godmode, setGodmode] = useState<boolean>(false);
  const [isTimeFrozen, setIsTimeFrozen] = useState<boolean>(false);

  // Dynamic Weather System State (Clear, Rain, Snow, Storm)
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [weatherRemainingSec, setWeatherRemainingSec] = useState<number>(60);

  // Touch joystick vector (-1 to 1)
  const [touchVector, setTouchVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate Trillion-scale Multiplicative Power Rating scaled by Four-Path Cultivation Resonance & Veteran Scroll Mastery
  const maxTroopCapacity = calculateCastleTroopCapacity(castleLevel);
  const fourPathSynergy = calculateFourPathSynergy(cultivation.paths);
  const veteranScrollBonuses = calculateVeteranScrollBonuses(
    cultivation.veteranScrollsComprehended ?? 0
  );
  const cultivationMultiplier =
    fourPathSynergy.totalCombinedMultiplier *
    (1 + veteranScrollBonuses.combatResonanceBonusPct / 100);
  const baseKingdomPower = calculateMultiplicativePowerRating({
    troops,
    castleLevel,
    highestHeroRarityMultiplier: 10,
    researchLevel: clan.techLevel.troopAttack + clan.techLevel.troopDefense,
  });
  const playerPower = BigInt(Math.floor(Number(baseKingdomPower) * cultivationMultiplier));

  // Evaluate Daily Login Reward status & 7-Day Scaled Schedule
  const effectiveDateKey = getCalendarDateKey(new Date(), dailyLoginState.simulatedDayOffset);
  const dailyLoginEvaluation = evaluateDailyLoginState(dailyLoginState, effectiveDateKey);
  const dailyRewardSchedule = getSevenDayRewardSchedule({
    castleLevel,
    cultivationRealmIndex: cultivation.paths.qi.realmIndex,
    totalDaysClaimed: dailyLoginState.totalDaysClaimed,
  });

  // Sync gameState to document.body.dataset.state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.state = gameState;
    }
  }, [gameState]);

  // Persist dailyLoginState to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DAILY_LOGIN_STORAGE_KEY, JSON.stringify(dailyLoginState));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [dailyLoginState]);

  // Automatically trigger Daily Login Reward modal on first load of the day
  useEffect(() => {
    if (dailyLoginEvaluation.shouldAutoTriggerOnLoad) {
      setActiveModal('daily_login');
      setDailyLoginState((prev) => ({
        ...prev,
        lastAutoTriggeredDateKey: effectiveDateKey,
      }));
    }
  }, [dailyLoginEvaluation.shouldAutoTriggerOnLoad, effectiveDateKey]);

  // Day & Night Simulation Clock (with Time Freeze from admin_console.cpp)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isTimeFrozen) return;
      setTimeOfDayHours((prev) => {
        const next = (prev + 0.05 * timeSpeedMultiplier) % 24;
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [timeSpeedMultiplier, isTimeFrozen]);

  // Dynamic Weather Periodic Cycle (Periodically shifts environment state and status effects)
  useEffect(() => {
    const weatherTimer = setInterval(() => {
      if (isTimeFrozen) return;
      setWeatherRemainingSec((prev) => {
        if (prev <= 1) {
          setWeather((curr) => {
            const next = getNextWeather(curr);
            const conf = WEATHER_CONFIGS[next];
            if (next === 'storm') {
              sound.playThunder();
            } else {
              sound.playWeatherChange();
            }
            setToastMessage(
              `${conf.icon} Atmosphere Shift: ${conf.name}! ${conf.combatFlavorText}`
            );
            return next;
          });
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(weatherTimer);
  }, [isTimeFrozen]);

  // Ambient Four-Path Cultivation Loop (Qi, Body, Soul, Mind — Weather Resonance, Mind Speed & Equipped Manuals)
  useEffect(() => {
    const qiInterval = setInterval(() => {
      const clanBuffActive = clan.activeBuffs.length > 0;
      setCultivation((prev) => {
        const mindRealm = prev.paths.mind.realmIndex;
        const mindLayer = prev.paths.mind.layer;
        const manualSummary = calculateEquippedManualsSummary(
          prev.equippedManuals,
          prev.ownedManuals
        );
        const scrollBonuses = calculateVeteranScrollBonuses(prev.veteranScrollsComprehended ?? 0);
        const qiRate = calculatePassiveQiRate(
          prev.paths.qi.realmIndex,
          weather,
          clanBuffActive,
          'qi',
          mindRealm,
          mindLayer,
          manualSummary.byPath.qi.passiveRateBoostPct + scrollBonuses.passiveSpeedBonusPct
        );
        const bodyRate = calculatePassiveQiRate(
          prev.paths.body.realmIndex,
          weather,
          clanBuffActive,
          'body',
          mindRealm,
          mindLayer,
          manualSummary.byPath.body.passiveRateBoostPct + scrollBonuses.passiveSpeedBonusPct
        );
        const soulRate = calculatePassiveQiRate(
          prev.paths.soul.realmIndex,
          weather,
          clanBuffActive,
          'soul',
          mindRealm,
          mindLayer,
          manualSummary.byPath.soul.passiveRateBoostPct + scrollBonuses.passiveSpeedBonusPct
        );
        const mindRate = calculatePassiveQiRate(
          prev.paths.mind.realmIndex,
          weather,
          clanBuffActive,
          'mind',
          mindRealm,
          mindLayer,
          manualSummary.byPath.mind.passiveRateBoostPct + scrollBonuses.passiveSpeedBonusPct
        );

        const nextQiEnergy = prev.paths.qi.currentEnergy + qiRate;
        return {
          ...prev,
          currentQi: nextQiEnergy,
          paths: {
            qi: { ...prev.paths.qi, currentEnergy: nextQiEnergy },
            body: { ...prev.paths.body, currentEnergy: prev.paths.body.currentEnergy + bodyRate },
            soul: { ...prev.paths.soul, currentEnergy: prev.paths.soul.currentEnergy + soulRate },
            mind: { ...prev.paths.mind, currentEnergy: prev.paths.mind.currentEnergy + mindRate },
          },
        };
      });
    }, 1000);
    return () => clearInterval(qiInterval);
  }, [weather, clan.activeBuffs]);

  // Continuous Gathering Loop with Weather Multiplier
  useEffect(() => {
    const gatherInterval = setInterval(() => {
      setResourceNodes((prev) => {
        let hasMined = false;
        const updated = prev.map((node) => {
          if (node.assignedTroops > 0n && node.remainingCapacity > 0n) {
            hasMined = true;
            const effectiveRate = calculateWeatherGatherRate(
              node.gatherRatePerSec,
              node.type,
              weather
            );
            const mined = effectiveRate * 2n;
            const actualMined = mined > node.remainingCapacity ? node.remainingCapacity : mined;
            setResources((res) => ({
              ...res,
              [node.type]: res[node.type] + actualMined,
            }));
            return {
              ...node,
              remainingCapacity: node.remainingCapacity - actualMined,
            };
          }
          return node;
        });
        return hasMined ? updated : prev;
      });
    }, 2000);
    return () => clearInterval(gatherInterval);
  }, [weather]);

  // Backtick (~) hotkey to open GM Console as in admin_console.cpp
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        setActiveModal((prev) => (prev === 'admin_console' ? 'none' : 'admin_console'));
        sound.playSwing();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Castle Upgrade
  const handleUpgradeCastle = () => {
    if (castleLevel >= MAX_CASTLE_LEVEL) return;
    const cost = getCastleUpgradeCost(castleLevel);

    setResources((prev) => ({
      wood: prev.wood - cost.wood,
      steel: prev.steel - cost.steel,
      copper: prev.copper - cost.copper,
      grain: prev.grain - cost.grain,
      oil: prev.oil - cost.oil,
      diamond: prev.diamond - cost.diamond,
    }));

    setCastleLevel((prev) => {
      const next = prev + 1;
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setToastMessage(`🏰 Imperial Citadel upgraded to Level ${next}! Troop capacity expanded!`);
      return next;
    });
  };

  // Troop Training
  const handleTrainTroops = (
    type: TroopType,
    tier: number,
    amount: bigint,
    cost: Partial<GameResources>
  ) => {
    setResources((prev) => ({
      wood: prev.wood - (cost.wood || 0n),
      steel: prev.steel - (cost.steel || 0n),
      copper: prev.copper - (cost.copper || 0n),
      grain: prev.grain - (cost.grain || 0n),
      oil: prev.oil - (cost.oil || 0n),
      diamond: prev.diamond - (cost.diamond || 0n),
    }));

    const key = `${type}_t${tier}`;
    setTroops((prev) => ({
      ...prev,
      [key]: (prev[key] || 0n) + amount,
    }));

    const info = getTroopTierInfo(type, tier);
    setToastMessage(`⚔️ Enlisted +${formatBigInt(amount)} ${info.name} into your grand army!`);
  };

  // Clan Chat System
  const handleSendClanChat = (message: string, isSystem: boolean = false, tag?: string) => {
    const newMsg: ClanChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: isSystem ? 'sys' : 'cm_player',
      senderName: isSystem ? 'Clan Overseer' : 'Aiden Skyrender',
      senderRole: isSystem
        ? 'Elder'
        : clanMembers.find((m) => m.id === 'cm_player')?.role || 'Leader',
      senderAvatar: isSystem ? '🏛️' : '👑',
      message,
      timestamp: Date.now(),
      isSystemNotice: isSystem,
      tag,
    };
    setClanChat((prev) => [newMsg, ...prev]);
  };

  // Clan Donation & Vault Supply
  const handleClanDonate = (type: ResourceType, amount: bigint, coins: bigint) => {
    setResources((prev) => ({
      ...prev,
      [type]: prev[type] - amount,
    }));
    setClanCoins((prev) => prev + coins);
    setClan((prev) => {
      const updatedVault = {
        ...prev.vault,
        [type]: (prev.vault[type] || 0n) + amount,
        clanHonor: prev.vault.clanHonor + coins,
      };
      return {
        ...prev,
        donationsToday: prev.donationsToday + amount,
        vault: updatedVault,
        totalPower: prev.totalPower + coins * 100n,
      };
    });
    handleSendClanChat(
      `Leader Aiden Skyrender contributed ${formatBigInt(amount)} ${type} to the Alliance Vault!`,
      true,
      'VAULT DEPOSIT'
    );
    setToastMessage(
      `🎁 Donated supplies to Alliance Vault! Received +${formatBigInt(coins)} Honor.`
    );
  };

  // Clan Store Purchase
  const handleBuyClanStore = (_itemId: string, cost: bigint) => {
    setClanCoins((prev) => prev - cost);
    setToastMessage(`🛒 Purchased item from Clan Store! Applied immediately.`);
  };

  // Activate Territory War Buff
  const handleActivateClanBuff = (buff: ClanBuff) => {
    setClan((prev) => {
      if (prev.vault.clanHonor < buff.costHonor) return prev;
      const activated: ClanBuff = {
        ...buff,
        activeUntil: Date.now() + buff.durationSeconds * 1000,
      };
      return {
        ...prev,
        vault: {
          ...prev.vault,
          clanHonor: prev.vault.clanHonor - buff.costHonor,
        },
        activeBuffs: [...prev.activeBuffs.filter((b) => b.id !== buff.id), activated],
      };
    });
    handleSendClanChat(
      `Territory War Blessing [${buff.name}] invoked across the realm! (${buff.desc})`,
      true,
      'WAR BLESSING'
    );
    setToastMessage(`✨ Activated Territory Blessing: ${buff.name}!`);
  };

  // Assault War Outpost
  const handleAssaultOutpost = (outpostId: string) => {
    if (!clan.activeWar) return;
    const outpost = clan.activeWar.outposts.find((o) => o.id === outpostId);
    if (!outpost) return;

    const result = calculateOutpostAssault(playerPower, outpost.defenseRating);
    const updatedOutposts = clan.activeWar.outposts.map((o) => {
      if (o.id === outpostId) {
        return {
          ...o,
          controlledBy: 'player_clan' as const,
          garrisonTroops: o.garrisonTroops + 50_000n,
        };
      }
      return o;
    });

    setClan((prev) => {
      if (!prev.activeWar) return prev;
      return {
        ...prev,
        activeWar: {
          ...prev.activeWar,
          playerClanScore: prev.activeWar.playerClanScore + result.pointsEarned,
          outposts: updatedOutposts,
        },
      };
    });

    handleSendClanChat(
      `⚔️ Outpost [${outpost.name}] secured by Leader Aiden Skyrender (+${result.pointsEarned} War Points)!`,
      true,
      'OUTPOST ASSAULT'
    );
    setToastMessage(`⚔️ Captured ${outpost.name}! Gained +${result.pointsEarned} War Points!`);
  };

  // Co-op Boss Strike
  const handleAttackCoopBoss = (damage: bigint) => {
    setClan((prev) => {
      const currentBoss = prev.coopBoss;
      const newHp = currentBoss.hp > damage ? currentBoss.hp - damage : 0n;
      const contributions = currentBoss.totalClanContributions.map((c) => {
        if (c.memberName === 'Aiden Skyrender') {
          return { ...c, damage: c.damage + damage };
        }
        return c;
      });

      return {
        ...prev,
        coopBoss: {
          ...currentBoss,
          hp: newHp,
          totalClanContributions: contributions,
        },
      };
    });
    setToastMessage(`🐉 Dealt ${formatBigInt(damage)} damage to the Void Leviathan!`);
  };

  // Claim Co-op Boss Milestone Chest
  const handleClaimCoopChest = (milestonePct: number, diamonds: bigint, honor: bigint) => {
    setResources((prev) => ({ ...prev, diamond: prev.diamond + diamonds }));
    setClanCoins((prev) => prev + honor);
    setClan((prev) => ({
      ...prev,
      coopBoss: {
        ...prev.coopBoss,
        rewardChests: prev.coopBoss.rewardChests.map((chest) =>
          chest.milestonePct === milestonePct ? { ...chest, claimed: true } : chest
        ),
      },
    }));
    confetti({ particleCount: 50, spread: 60 });
    setToastMessage(
      `🎁 Claimed ${milestonePct}% milestone chest: +${formatBigInt(diamonds)} 💎 and +${formatBigInt(honor)} Honor!`
    );
  };

  // Update Clan Emblem
  const handleUpdateClanEmblem = (newEmblem: ClanEmblem) => {
    setClan((prev) => ({ ...prev, emblem: newEmblem }));
    setClanLeaderboard((prev) =>
      prev.map((c) => (c.tag === clan.tag || c.id === clan.id ? { ...c, emblem: newEmblem } : c))
    );
    handleSendClanChat(
      `Leader Aiden Skyrender updated the Clan Heraldic Banner!`,
      true,
      'BANNER RITUAL'
    );
    setToastMessage('🛡️ Clan Heraldic Emblem updated successfully!');
  };

  // Found / Create New Clan
  const handleCreateNewClan = (newClanData: {
    name: string;
    tag: string;
    motto: string;
    emblem: ClanEmblem;
    minCastleLevel: number;
  }) => {
    if (resources.diamond < 500n) {
      setToastMessage('💎 Need at least 500 Diamonds to found a new Clan.');
      return;
    }
    setResources((prev) => ({ ...prev, diamond: prev.diamond - 500n }));

    const createdClan: Clan = {
      ...clan,
      id: `clan_${Date.now()}`,
      name: newClanData.name,
      tag: newClanData.tag,
      motto: newClanData.motto,
      emblem: newClanData.emblem,
      minCastleLevel: newClanData.minCastleLevel,
      leader: 'Aiden Skyrender',
      level: 1,
      memberCount: 1,
      maxMembers: 50,
      totalPower: playerPower,
      donationsToday: 0n,
      warsWon: 0,
    };

    setClan(createdClan);
    setClanLeaderboard((prev) => [
      {
        rank: 1,
        id: createdClan.id,
        name: createdClan.name,
        tag: createdClan.tag,
        level: 1,
        emblem: createdClan.emblem,
        leader: 'Aiden Skyrender',
        memberCount: 1,
        maxMembers: 50,
        totalPower: playerPower,
        territoryOutposts: 1,
        warsWon: 0,
        isPlayerClan: true,
      },
      ...prev.map((c, i) => ({ ...c, rank: i + 2, isPlayerClan: false })),
    ]);

    confetti({ particleCount: 100, spread: 100 });
    setToastMessage(`👑 Founded new Clan [${createdClan.tag}] ${createdClan.name}!`);
  };

  // Roster Management Handlers
  const handlePromoteMember = (memberId: string) => {
    setClanMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        let nextRole: ClanRole = m.role;
        if (m.role === 'Recruit') nextRole = 'Member';
        else if (m.role === 'Member') nextRole = 'Elite';
        else if (m.role === 'Elite') nextRole = 'Elder';
        handleSendClanChat(`${m.name} was promoted to ${nextRole}!`, true, 'PROMOTION');
        return { ...m, role: nextRole };
      })
    );
    setToastMessage('🎖️ Member promoted to higher rank!');
  };

  const handleDemoteMember = (memberId: string) => {
    setClanMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        let nextRole: ClanRole = m.role;
        if (m.role === 'Elder') nextRole = 'Elite';
        else if (m.role === 'Elite') nextRole = 'Member';
        else if (m.role === 'Member') nextRole = 'Recruit';
        handleSendClanChat(`${m.name} was demoted to ${nextRole}.`, true, 'DEMOTION');
        return { ...m, role: nextRole };
      })
    );
    setToastMessage('Member demoted.');
  };

  const handleKickMember = (memberId: string) => {
    const member = clanMembers.find((m) => m.id === memberId);
    if (!member) return;
    setClanMembers((prev) => prev.filter((m) => m.id !== memberId));
    setClan((prev) => ({ ...prev, memberCount: Math.max(1, prev.memberCount - 1) }));
    handleSendClanChat(`${member.name} was discharged from the clan roster.`, true, 'DISCHARGE');
    setToastMessage(`Discharged ${member.name} from the clan.`);
  };

  // Withdraw Daily Vault Rations
  const handleWithdrawVaultRations = () => {
    const rationWood = 100_000n;
    const rationSteel = 80_000n;
    const rationGrain = 120_000n;
    const rationDiamonds = 200n;

    setResources((prev) => ({
      ...prev,
      wood: prev.wood + rationWood,
      steel: prev.steel + rationSteel,
      grain: prev.grain + rationGrain,
      diamond: prev.diamond + rationDiamonds,
    }));
    setToastMessage('🎁 Claimed Lord Daily Rations: +100K Wood, +80K Steel, +120K Grain, +200 💎!');
  };

  // Four-Path Cultivation System Actions
  const handleMeditateQi = (path: CultivationPath, burst: bigint) => {
    const meta = CULTIVATION_PATH_META[path];
    setCultivation((prev) => {
      const updatedEnergy = prev.paths[path].currentEnergy + burst;
      return {
        ...prev,
        currentQi: path === 'qi' ? updatedEnergy : prev.currentQi,
        paths: {
          ...prev.paths,
          [path]: {
            ...prev.paths[path],
            currentEnergy: updatedEnergy,
          },
        },
      };
    });
    setToastMessage(
      `${meta.icon} ${meta.actionVerb}! Absorbed +${formatBigInt(burst)} ${meta.energyName}.`
    );
  };

  const handleCultivationBreakthrough = (
    path: CultivationPath,
    nextRealmIndex: number,
    nextLayer: number
  ) => {
    const nextRealm = getRealmDef(path, nextRealmIndex);
    const meta = CULTIVATION_PATH_META[path];
    setCultivation((prev) => ({
      ...prev,
      currentRealmIndex: path === 'qi' ? nextRealmIndex : prev.currentRealmIndex,
      currentLayer: path === 'qi' ? nextLayer : prev.currentLayer,
      currentQi: path === 'qi' ? 0n : prev.currentQi,
      paths: {
        ...prev.paths,
        [path]: {
          realmIndex: nextRealmIndex,
          layer: nextLayer,
          currentEnergy: 0n,
        },
      },
      secludedYears: prev.secludedYears + Math.floor(Math.random() * 50 + 20),
    }));
    setToastMessage(
      `⚡ [${meta.name}] Breakthrough Success! Ascended to [${nextRealm.chineseName}] ${nextRealm.name} - Layer ${nextLayer}!`
    );
  };

  const handleCraftPill = (pill: CultivationPill, activePath: CultivationPath) => {
    const meta = CULTIVATION_PATH_META[activePath];
    setResources((prev) => ({
      ...prev,
      wood: prev.wood - pill.costHerbWood,
      grain: prev.grain - pill.costHerbGrain,
      diamond: prev.diamond - pill.costDiamonds,
    }));
    setCultivation((prev) => {
      const updatedEnergy = prev.paths[activePath].currentEnergy + pill.qiBonus;
      return {
        ...prev,
        inventoryPills: {
          ...prev.inventoryPills,
          [pill.id]: (prev.inventoryPills[pill.id] || 0) + 1,
        },
        currentQi: activePath === 'qi' ? updatedEnergy : prev.currentQi,
        paths: {
          ...prev.paths,
          [activePath]: {
            ...prev.paths[activePath],
            currentEnergy: updatedEnergy,
          },
        },
      };
    });
    setToastMessage(
      `🧪 Refined ${pill.name}! Gained +${formatBigInt(pill.qiBonus)} instant ${meta.energyName}.`
    );
  };

  const handleConsumePill = (pillId: string) => {
    setCultivation((prev) => ({
      ...prev,
      inventoryPills: {
        ...prev.inventoryPills,
        [pillId]: Math.max(0, (prev.inventoryPills[pillId] || 1) - 1),
      },
    }));
  };

  const handleSurviveTribulation = (
    path: CultivationPath,
    nextRealmIndex: number,
    nextLayer: number
  ) => {
    const nextRealm = getRealmDef(path, nextRealmIndex);
    const meta = CULTIVATION_PATH_META[path];
    setCultivation((prev) => ({
      ...prev,
      currentRealmIndex: path === 'qi' ? nextRealmIndex : prev.currentRealmIndex,
      currentLayer: path === 'qi' ? nextLayer : prev.currentLayer,
      currentQi: path === 'qi' ? 0n : prev.currentQi,
      paths: {
        ...prev.paths,
        [path]: {
          realmIndex: nextRealmIndex,
          layer: nextLayer,
          currentEnergy: 0n,
        },
      },
      secludedYears: prev.secludedYears + 100,
    }));
    setToastMessage(
      `⚡ Survived the ${meta.name} Heavenly Tribulation! Ascended to [${nextRealm.chineseName}] ${nextRealm.name}!`
    );
  };

  const handleChangeRoot = (root: PlayerCultivationState['selectedRoot']) => {
    setCultivation((prev) => ({
      ...prev,
      selectedRoot: root,
    }));
    setToastMessage(`🌟 Attuned Spirit Root to ${root.toUpperCase()}!`);
  };

  const handleEquipManual = (path: CultivationPath, manualId: string) => {
    const manual = getManualById(manualId);
    if (!manual) return;
    const meta = CULTIVATION_PATH_META[path];
    setCultivation((prev) => ({
      ...prev,
      equippedManuals: {
        ...prev.equippedManuals,
        [path]: manualId,
      },
    }));
    setToastMessage(`📜 Equipped [${manual.name}] in your ${meta.name} slot!`);
  };

  const handleUpgradeManual = (manualId: string) => {
    const manual = getManualById(manualId);
    if (!manual) return;
    const owned = cultivation.ownedManuals[manualId];
    if (!owned) return;
    const cost = calculateManualUpgradeCost(manual, owned.level);
    if (cost.isMaxLevel) return;
    if (cultivation.scriptureFragments < cost.fragments || resources.diamond < cost.diamonds)
      return;

    setResources((prev) => ({
      ...prev,
      diamond: prev.diamond - cost.diamonds,
    }));
    const nextLevel = owned.level + 1;
    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: prev.scriptureFragments - cost.fragments,
      ownedManuals: {
        ...prev.ownedManuals,
        [manualId]: {
          manualId,
          level: nextLevel,
        },
      },
    }));
    confetti({ particleCount: 40, spread: 60 });
    setToastMessage(`📜 Upgraded ${manual.name} to Mastery Level ${nextLevel}!`);
  };

  const handleDiscoverManual = (freeDeduction: boolean = false) => {
    if (freeDeduction) {
      setCultivation((prev) => ({
        ...prev,
        scriptureFragments: prev.scriptureFragments + 25,
      }));
      setToastMessage('📜 Secluded Scripture Deduction complete! Gained +25 Scripture Fragments.');
      return;
    }

    if (resources.diamond < 200n) return;
    setResources((prev) => ({
      ...prev,
      diamond: prev.diamond - 200n,
    }));

    const result = rollManualDiscovery(cultivation.ownedManuals);
    setCultivation((prev) => {
      const updatedOwned = { ...prev.ownedManuals };
      if (result.isNewDiscovery) {
        updatedOwned[result.manual.id] = {
          manualId: result.manual.id,
          level: 1,
        };
      }
      return {
        ...prev,
        ownedManuals: updatedOwned,
        scriptureFragments: prev.scriptureFragments + result.fragmentsGained,
      };
    });
    if (result.isNewDiscovery) {
      confetti({ particleCount: 65, spread: 80 });
    }
    setToastMessage(result.message);
  };

  const handleUnlockManualDirect = (manualId: string) => {
    const manual = getManualById(manualId);
    if (!manual || cultivation.ownedManuals[manualId]) return;
    if (cultivation.scriptureFragments < 40) return;

    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: prev.scriptureFragments - 40,
      ownedManuals: {
        ...prev.ownedManuals,
        [manualId]: {
          manualId,
          level: 1,
        },
      },
    }));
    confetti({ particleCount: 55, spread: 70 });
    setToastMessage(`📜 Comprehended Ancient Manual: ${manual.name} (${manual.chineseName})!`);
  };

  // Hero Level Up
  const handleLevelUpHero = (heroId: string) => {
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero) return;
    const cost = BigInt(hero.level * 2500);
    setPlayerExp((prev) => prev - cost);
    setHeroes((prev) =>
      prev.map((h) =>
        h.id === heroId
          ? {
              ...h,
              level: h.level + 1,
              power: h.power + BigInt(h.level * 180_000),
            }
          : h
      )
    );
    confetti({ particleCount: 30, spread: 45 });
    setToastMessage(`⭐ Commander ${hero.name} ascended to Level ${hero.level + 1}!`);
  };

  // Summon Hero
  const handleRecruitHero = () => {
    if (resources.diamond < 500n) {
      setToastMessage('💎 Not enough Diamonds to summon in the Hero Tavern (Need 500).');
      return;
    }
    setResources((prev) => ({ ...prev, diamond: prev.diamond - 500n }));

    const newHero: Hero = {
      id: `hero_summon_${Date.now()}`,
      name: 'Ezekiel Voidcleaver',
      title: 'Harbinger of Ruin',
      rarity: 'mythic',
      level: 40,
      star: 4,
      power: 8_200_000n,
      avatarIcon: '🔮',
      troopSpecialty: 'bomber',
      statBonus: {
        attackBonusPct: 190,
        defenseBonusPct: 80,
        hpBonusPct: 100,
        rallyBonusPct: 60,
      },
      skillName: 'Singularity Implosion',
      skillDesc: 'Creates a cosmic gravity well that drags enemy frontlines together.',
    };

    setHeroes((prev) => [newHero, ...prev]);
    confetti({ particleCount: 70, spread: 80 });
    setToastMessage(`✨ Summoned Mythic Hero: ${newHero.name}!`);
  };

  // World Boss Battle Loot
  const handleVictoryLoot = (loot: Partial<Record<ResourceType, bigint>>, exp: bigint) => {
    setPlayerExp((prev) => prev + exp);
    setResources((prev) => {
      const updated = { ...prev };
      Object.entries(loot).forEach(([k, v]) => {
        const resKey = k as ResourceType;
        updated[resKey] += v as bigint;
      });
      return updated;
    });

    confetti({ particleCount: 80, spread: 90 });
    setToastMessage(`🏆 Victory! Gained +${formatBigInt(exp)} EXP and massive spoils of war!`);
  };

  // Casualties
  const handleCasualties = (cas: { shieldbearers: bigint; shooters: bigint; bombers: bigint }) => {
    if (godmode) {
      setToastMessage('🛡️ [GM Godmode Active] Casualties nullified — supreme invincibility!');
      return;
    }
    // Deduct casualties from lowest/available tiers
    setTroops((prev) => {
      const next = { ...prev };
      if (cas.shieldbearers > 0n && next['shieldbearer_t1']) {
        next['shieldbearer_t1'] =
          next['shieldbearer_t1'] > cas.shieldbearers
            ? next['shieldbearer_t1'] - cas.shieldbearers
            : 0n;
      }
      if (cas.shooters > 0n && next['shooter_t1']) {
        next['shooter_t1'] =
          next['shooter_t1'] > cas.shooters ? next['shooter_t1'] - cas.shooters : 0n;
      }
      if (cas.bombers > 0n && next['bomber_t1']) {
        next['bomber_t1'] = next['bomber_t1'] > cas.bombers ? next['bomber_t1'] - cas.bombers : 0n;
      }
      return next;
    });
  };

  // Dispatch Gather
  const handleDispatchGather = (nodeId: string, troopsAmount: bigint) => {
    setResourceNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, assignedTroops: troopsAmount } : n))
    );
    setToastMessage(`⛏️ Dispatched ${formatBigInt(troopsAmount)} troops to extract supplies!`);
  };

  // Collect Harvest
  const handleHarvestCollect = (nodeId: string) => {
    const node = resourceNodes.find((n) => n.id === nodeId);
    if (!node) return;

    const baseAmount = BigInt(
      Math.min(
        Number(node.totalCapacity - node.remainingCapacity + 25000n),
        Number(node.totalCapacity)
      )
    );
    const weatherMult = WEATHER_CONFIGS[weather].gatherYieldMultipliers[node.type] ?? 1.0;
    const gatheredAmount = BigInt(Math.max(1, Math.floor(Number(baseAmount) * weatherMult)));

    setResources((prev) => ({
      ...prev,
      [node.type]: prev[node.type] + gatheredAmount,
    }));

    setResourceNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, assignedTroops: 0n } : n))
    );

    setToastMessage(
      `🌾 Harvested +${formatBigInt(gatheredAmount)} ${node.type.toUpperCase()} (${Math.round(weatherMult * 100)}% ${WEATHER_CONFIGS[weather].name} yield)!`
    );
  };

  // Focus Node
  const handleFocusNode = (x: number, z: number) => {
    setToastMessage(`📍 Waypoint marked at [${x}, ${z}]. Marching troops dispatched.`);
  };

  // Autonomous Open-World AI Simulation Step (NPCs + Monsters Lv. 1–1000)
  const handleStepWorldAI = () => {
    const result = tickWorldAI({
      npcs,
      monsters,
      resourceNodes,
      playerPos: playerWorldPosRef.current,
      weather,
      timeOfDayHours,
    });
    setNpcs(result.updatedNpcs);
    setMonsters(result.updatedMonsters);
    if (result.newLogs.length > 0) {
      setAiLogs((prev) => [...result.newLogs, ...prev].slice(0, 40));
    }
  };

  useEffect(() => {
    const aiInterval = setInterval(() => {
      if (isTimeFrozen) return;
      setNpcs((currNpcs) => {
        setMonsters((currMonsters) => {
          const result = tickWorldAI({
            npcs: currNpcs,
            monsters: currMonsters,
            resourceNodes,
            playerPos: playerWorldPosRef.current,
            weather,
            timeOfDayHours,
          });
          if (result.newLogs.length > 0) {
            setAiLogs((prev) => [...result.newLogs, ...prev].slice(0, 40));
          }
          setTimeout(() => setNpcs(result.updatedNpcs), 0);
          return result.updatedMonsters;
        });
        return currNpcs;
      });
    }, 3000);
    return () => clearInterval(aiInterval);
  }, [isTimeFrozen, weather, timeOfDayHours, resourceNodes]);

  const handleSetNPCDirective = (npcId: string, directive: NPCDirective) => {
    const targetNpc = npcs.find((n) => n.id === npcId);
    setNpcs((prev) => prev.map((n) => (n.id === npcId ? { ...n, directive } : n)));
    if (targetNpc) {
      setToastMessage(
        `🧠 Assigned AI Directive [${directive.replace('_', ' ').toUpperCase()}] to ${targetNpc.name}!`
      );
    }
  };

  const handleClaimNPCStash = (npcId: string) => {
    const targetNpc = npcs.find((n) => n.id === npcId);
    if (!targetNpc || !targetNpc.gatheredStash) return;
    const stash = targetNpc.gatheredStash;

    setResources((prev) => {
      const next = { ...prev };
      Object.entries(stash).forEach(([k, v]) => {
        if (v && v > 0n) {
          next[k as ResourceType] += v;
        }
      });
      return next;
    });

    setNpcs((prev) => prev.map((n) => (n.id === npcId ? { ...n, gatheredStash: {} } : n)));
    setToastMessage(
      `⛏️ Collected ${targetNpc.name}'s autonomous gathered stash into your Treasury!`
    );
  };

  const handleClaimNPCQuest = (npcId: string, quest: Quest) => {
    setPlayerExp((prev) => prev + quest.rewardExp);
    setResources((prev) => {
      const next = { ...prev, diamond: prev.diamond + quest.rewardDiamonds };
      Object.entries(quest.rewardResources).forEach(([k, v]) => {
        if (v) next[k as ResourceType] += v;
      });
      return next;
    });

    // Generate next radiant quest for this NPC
    setNpcs((prev) =>
      prev.map((n) =>
        n.id === npcId ? { ...n, activeQuest: generateRadiantQuestForNPC(n, castleLevel) } : n
      )
    );
    confetti({ particleCount: 55, spread: 70 });
    setToastMessage(
      `📜 Completed "${quest.title}"! Gained +${formatBigInt(quest.rewardExp)} EXP & +${formatBigInt(quest.rewardDiamonds)} 💎!`
    );
  };

  const handleExecuteNPCTrade = (npcId: string, offer: NPCTradeOffer) => {
    if (resources[offer.giveResource] < offer.giveAmount || offer.stock <= 0) return;

    setResources((prev) => ({
      ...prev,
      [offer.giveResource]: prev[offer.giveResource] - offer.giveAmount,
      [offer.receiveType]: prev[offer.receiveType] + offer.receiveAmount,
    }));

    setNpcs((prev) =>
      prev.map((n) =>
        n.id === npcId
          ? {
              ...n,
              tradeOffers: (n.tradeOffers || []).map((o) =>
                o.id === offer.id ? { ...o, stock: o.stock - 1 } : o
              ),
            }
          : n
      )
    );
    setToastMessage(`⚖️ Caravan Trade Complete: ${offer.label}!`);
  };

  const handleSpawnScaledMonster = (newMonster: MonsterTarget) => {
    setMonsters((prev) => [newMonster, ...prev]);
    setSelectedMonster(newMonster);
    setAiLogs((prev) => [
      {
        id: `ai_spawn_${Date.now()}`,
        timestamp: Date.now(),
        actorName: newMonster.name,
        actorType: 'monster',
        actorLevel: newMonster.level,
        category: 'combat',
        message: `Spawned Lv.${newMonster.level} ${newMonster.tier.toUpperCase()} [${newMonster.movementPolicy}] at [${newMonster.x}, ${newMonster.z}].`,
      },
      ...prev,
    ]);
    setToastMessage(`🐉 Spawned Level ${newMonster.level} ${newMonster.name} into the Open World!`);
  };

  // Action Click from HUD
  const handleHUDActionClick = (action: 'attack' | 'gather' | 'jump') => {
    if (action === 'attack') {
      sound.playSwing();
      setSelectedMonster(monsters[0]);
      setActiveModal('world_boss');
    } else if (action === 'gather') {
      sound.playGather();
      setActiveModal('resources');
    } else {
      sound.playSwing();
      setToastMessage('⚡ Agile leap executed across the terrain!');
    }
  };

  // Daily Login Reward Claim & Veteran Scroll Handlers
  const handleClaimDailyLoginReward = () => {
    const result = claimDailyLoginReward({
      currentState: dailyLoginState,
      effectiveDateKey,
      castleLevel,
      cultivationRealmIndex: cultivation.paths.qi.realmIndex,
    });

    if (!result.claimed || !result.reward) return;
    const reward = result.reward;

    setDailyLoginState(result.updatedState);
    setResources((prev) => ({
      wood: prev.wood + reward.resources.wood,
      steel: prev.steel + reward.resources.steel,
      copper: prev.copper + reward.resources.copper,
      grain: prev.grain + reward.resources.grain,
      oil: prev.oil + reward.resources.oil,
      diamond: prev.diamond + reward.resources.diamond,
    }));

    setCultivation((prev) => ({
      ...prev,
      veteranScrolls: (prev.veteranScrolls ?? 0) + reward.veteranScrolls,
      scriptureFragments: prev.scriptureFragments + reward.scriptureFragments,
      spiritStones: (prev.spiritStones ?? 0n) + reward.spiritStones,
    }));

    sound.playUpgradeFanfare();
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    setToastMessage(
      `🎁 Claimed Day ${reward.day} Login Decree: +${formatBigInt(reward.resources.diamond)} 💎, +${reward.veteranScrolls}x Veteran Scroll & Scaled Resources!`
    );
  };

  const handleAdvanceSimulatedDay = () => {
    setDailyLoginState((prev) => ({
      ...prev,
      simulatedDayOffset: (prev.simulatedDayOffset || 0) + 1,
    }));
    setToastMessage('🌅 Advanced calendar by +1 Day! Next Daily Login Decree is now ready.');
  };

  const handleComprehendVeteranScroll = (
    targetPath: CultivationPath | 'all',
    count: number = 1
  ) => {
    const result = applyVeteranScrollToCultivation(cultivation, targetPath, count);
    if (!result.success) {
      setToastMessage(result.message);
      return;
    }
    setCultivation(result.updatedCultivation);
    confetti({ particleCount: 60, spread: 70 });
    setToastMessage(result.message);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 3D WebGL Canvas Viewport */}
      <GameCanvas
        castleLevel={castleLevel}
        playerAppearance={playerAppearance}
        cultivationRealmIndex={
          typeof cultivation.auraOverrideRealmIndex === 'number'
            ? cultivation.auraOverrideRealmIndex
            : cultivation.paths.qi.realmIndex
        }
        masteredGreatDaos={cultivation.masteredGreatDaos ?? 4}
        isRedName={(cultivation.karma?.karmaValue ?? 120) < 0}
        monsters={monsters}
        resourceNodes={resourceNodes}
        npcs={npcs}
        timeOfDayHours={timeOfDayHours}
        weather={weather}
        graphicsQuality={graphicsQuality}
        onSelectMonster={(m) => {
          setSelectedMonster(m);
          setActiveModal('world_boss');
        }}
        onSelectResourceNode={() => {
          setActiveModal('resources');
        }}
        onSelectCastle={() => {
          setActiveModal('castle');
        }}
        onSelectNPC={(npc) => {
          sound.playSwing();
          setSelectedNpcId(npc.id);
          setActiveModal('world_ai');
        }}
        onPlayerPositionChange={(x, z) => {
          playerWorldPosRef.current = { x, z };
          setCultivation((prev) => {
            if (prev.karma && prev.karma.stationarySeconds > 0) {
              return {
                ...prev,
                karma: {
                  ...prev.karma,
                  stationarySeconds: 0,
                },
              };
            }
            return prev;
          });
        }}
        touchInput={touchVector}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-amber-500/50 shadow-2xl text-xs sm:text-sm font-semibold text-amber-200 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md text-center">
          {toastMessage}
        </div>
      )}

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={() => setGameState('playing')}
          onOpenCharacterCreation={() => setActiveModal('character')}
          onOpenDailyLogin={() => setActiveModal('daily_login')}
          canClaimDailyLogin={dailyLoginEvaluation.canClaimToday}
        />
      )}

      {/* HUD Layer (When playing) */}
      {gameState === 'playing' && (
        <GameHUD
          playerAppearance={playerAppearance}
          castleLevel={castleLevel}
          playerPower={playerPower}
          playerExp={playerExp}
          resources={resources}
          timeOfDayHours={timeOfDayHours}
          timeSpeedMultiplier={timeSpeedMultiplier}
          weather={weather}
          weatherRemainingSec={weatherRemainingSec}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          onCycleTimeSpeed={() => {
            const speeds = [1, 5, 20];
            const nextIdx = (speeds.indexOf(timeSpeedMultiplier) + 1) % speeds.length;
            setTimeSpeedMultiplier(speeds[nextIdx]);
          }}
          onOpenWeather={() => setActiveModal('weather')}
          cultivationRealmName={CULTIVATION_REALMS[cultivation.currentRealmIndex]?.name}
          cultivationLayer={cultivation.currentLayer}
          onOpenCultivation={() => setActiveModal('cultivation')}
          onOpenWorldAI={() => setActiveModal('world_ai')}
          onOpenCastle={() => setActiveModal('castle')}
          onOpenTroops={() => setActiveModal('troops')}
          onOpenCharacterCreation={() => setActiveModal('character')}
          onOpenHeroes={() => setActiveModal('hero')}
          onOpenClan={() => setActiveModal('clan')}
          onOpenWorldBoss={() => {
            setSelectedMonster(monsters[monsters.length - 1]); // Ender Titan World Boss
            setActiveModal('world_boss');
          }}
          onOpenResources={() => setActiveModal('resources')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenCppCore={() => setActiveModal('cpp_core')}
          onOpenAdminConsole={() => setActiveModal('admin_console')}
          onOpenDailyLogin={() => setActiveModal('daily_login')}
          canClaimDailyLogin={dailyLoginEvaluation.canClaimToday}
          dailyStreakDays={dailyLoginEvaluation.currentStreak}
          veteranScrollsOwned={cultivation.veteranScrolls ?? 0}
          graphicsQuality={graphicsQuality}
          onCycleGraphicsQuality={() => {
            const presets: Array<'ultra' | 'high' | 'balanced'> = ['ultra', 'high', 'balanced'];
            const next = presets[(presets.indexOf(graphicsQuality) + 1) % presets.length];
            setGraphicsQuality(next);
            const labels = {
              ultra:
                '✨ Graphics: ULTRA HDR (UnrealBloom Post-Processing + 2048px Shadows + PBR Clearcoat)',
              high: '🎨 Graphics: HIGH (PBR Physical Materials + 2048px Soft Shadows)',
              balanced: '⚡ Graphics: BALANCED (60 FPS Direct Render Mode)',
            };
            setToastMessage(labels[next]);
          }}
          godmode={godmode}
          onTouchMove={(delta) => setTouchVector(delta)}
          onTouchEnd={() => setTouchVector({ x: 0, y: 0 })}
          onActionClick={handleHUDActionClick}
        />
      )}

      {/* Modals */}
      {activeModal === 'castle' && (
        <CastleModal
          castleLevel={castleLevel}
          resources={resources}
          onUpgradeCastle={handleUpgradeCastle}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'troops' && (
        <TroopBarracksModal
          troops={troops}
          resources={resources}
          castleLevel={castleLevel}
          maxCapacity={maxTroopCapacity}
          onTrainTroops={handleTrainTroops}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'character' && (
        <CharacterCreationModal
          currentAppearance={playerAppearance}
          onSaveAppearance={(app) => {
            setPlayerAppearance(app);
            setToastMessage(`👤 Lord styling saved: [${app.clanTag}] ${app.name}`);
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'hero' && (
        <HeroModal
          heroes={heroes}
          playerExp={playerExp}
          diamonds={resources.diamond}
          onLevelUpHero={handleLevelUpHero}
          onRecruitHero={handleRecruitHero}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'clan' && (
        <ClanModal
          clan={clan}
          members={clanMembers}
          resources={resources}
          clanCoins={clanCoins}
          playerPower={playerPower}
          chatMessages={clanChat}
          onDonate={handleClanDonate}
          onBuyStoreItem={handleBuyClanStore}
          onSendChatMessage={handleSendClanChat}
          onActivateBuff={handleActivateClanBuff}
          onAssaultOutpost={handleAssaultOutpost}
          onAttackCoopBoss={handleAttackCoopBoss}
          onClaimCoopChest={handleClaimCoopChest}
          onUpdateEmblem={handleUpdateClanEmblem}
          onCreateNewClan={handleCreateNewClan}
          onPromoteMember={handlePromoteMember}
          onDemoteMember={handleDemoteMember}
          onKickMember={handleKickMember}
          onWithdrawVaultRations={handleWithdrawVaultRations}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'world_boss' && (
        <WorldBossRallyModal
          monster={selectedMonster}
          troops={troops}
          castleLevel={castleLevel}
          heroes={heroes}
          weather={weather}
          onVictoryLoot={handleVictoryLoot}
          onCasualties={handleCasualties}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'resources' && (
        <ResourceGatherModal
          nodes={resourceNodes}
          weather={weather}
          onDispatchGather={handleDispatchGather}
          onHarvestCollect={handleHarvestCollect}
          onFocusNode={handleFocusNode}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'weather' && (
        <WeatherModal
          currentWeather={weather}
          durationRemainingSec={weatherRemainingSec}
          onCycleWeather={() => {
            const next = getNextWeather(weather);
            setWeather(next);
            setWeatherRemainingSec(60);
            const conf = WEATHER_CONFIGS[next];
            setToastMessage(
              `${conf.icon} Weather ritual invoked: ${conf.name}! ${conf.combatFlavorText}`
            );
          }}
          onSetWeather={(w) => {
            setWeather(w);
            setWeatherRemainingSec(60);
            const conf = WEATHER_CONFIGS[w];
            setToastMessage(
              `${conf.icon} Weather altered to ${conf.name}! ${conf.combatFlavorText}`
            );
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          entries={leaderboard}
          clanEntries={clanLeaderboard}
          playerPower={playerPower}
          playerCastleLevel={castleLevel}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'cpp_core' && (
        <CppArchitectureModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'admin_console' && (
        <AdminConsoleModal
          godmode={godmode}
          onToggleGodmode={() => setGodmode(!godmode)}
          castleLevel={castleLevel}
          onSetCastleLevel={(lvl) => setCastleLevel(lvl)}
          onGrantResources={(res) => setResources((prev) => ({ ...prev, ...res }))}
          onSpawnTroops={(type, tier, amt) => {
            const key = `${type}_t${tier}`;
            setTroops((prev) => ({ ...prev, [key]: (prev[key] || 0n) + amt }));
          }}
          timeSpeedMultiplier={timeSpeedMultiplier}
          onSetTimeSpeed={(spd) => setTimeSpeedMultiplier(spd)}
          isTimeFrozen={isTimeFrozen}
          onToggleTimeFreeze={() => setIsTimeFrozen(!isTimeFrozen)}
          onTriggerRivalRaid={() => {
            setToastMessage(
              '⚠️ [Territory Defense] Rival Lord Chronos vanguard repelled by your fortified citadel!'
            );
          }}
          currentWeather={weather}
          onSetWeather={(w) => {
            setWeather(w);
            setWeatherRemainingSec(60);
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'cultivation' && (
        <CultivationModal
          cultivation={cultivation}
          resources={resources}
          playerPower={playerPower}
          weather={weather}
          clanBuffActive={clan.activeBuffs.length > 0}
          onMeditate={handleMeditateQi}
          onBreakthrough={handleCultivationBreakthrough}
          onCraftPill={handleCraftPill}
          onConsumePill={handleConsumePill}
          onSurviveTribulation={handleSurviveTribulation}
          onChangeRoot={handleChangeRoot}
          onEquipManual={handleEquipManual}
          onUpgradeManual={handleUpgradeManual}
          onDiscoverManual={handleDiscoverManual}
          onUnlockManualDirect={handleUnlockManualDirect}
          onUpdateCultivation={setCultivation}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'world_ai' && (
        <WorldAIDirectorModal
          npcs={npcs}
          monsters={monsters}
          resourceNodes={resourceNodes}
          resources={resources}
          weather={weather}
          timeOfDayHours={timeOfDayHours}
          aiLogs={aiLogs}
          initialSelectedNpcId={selectedNpcId}
          onSetNPCDirective={handleSetNPCDirective}
          onClaimNPCStash={handleClaimNPCStash}
          onClaimNPCQuest={handleClaimNPCQuest}
          onExecuteNPCTrade={handleExecuteNPCTrade}
          onSpawnScaledMonster={handleSpawnScaledMonster}
          onEngageMonster={(m) => {
            setSelectedMonster(m);
            setActiveModal('world_boss');
          }}
          onStepWorldAI={handleStepWorldAI}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'daily_login' && (
        <DailyLoginModal
          evaluation={dailyLoginEvaluation}
          schedule={dailyRewardSchedule}
          castleLevel={castleLevel}
          cultivation={cultivation}
          onClaimToday={handleClaimDailyLoginReward}
          onAdvanceSimulatedDay={handleAdvanceSimulatedDay}
          onComprehendVeteranScroll={handleComprehendVeteranScroll}
          onOpenCultivationModal={() => setActiveModal('cultivation')}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
