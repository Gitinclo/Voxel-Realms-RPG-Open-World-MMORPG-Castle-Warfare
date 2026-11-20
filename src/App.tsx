/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './contexts/AuthContext';
import { subscribeToCommanderSave, syncUserAccountDocuments } from './lib/firestore';
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
  INITIAL_CLAN,
  INITIAL_CLAN_MEMBERS,
  INITIAL_CLAN_CHAT,
  INITIAL_CLAN_LEADERBOARD,
  INITIAL_HEROES,
  INITIAL_LEADERBOARD,
  INITIAL_MONSTERS,
  INITIAL_NPCS,
  INITIAL_RESOURCE_NODES,
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
import { applyTroopPromotion } from './game/troopTraining';
import { applySkinToHero, HERO_SKIN_CATALOG, HeroSkinId } from './game/heroSkins';
import { sound } from './game/audio';
import { detectInitialTargetPlatform } from './game/hudPlatformScale';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';

const CastleModal = lazy(() =>
  import('./components/CastleModal').then((m) => ({ default: m.CastleModal }))
);
const TroopBarracksModal = lazy(() =>
  import('./components/TroopBarracksModal').then((m) => ({ default: m.TroopBarracksModal }))
);
const CharacterCreationModal = lazy(() =>
  import('./components/CharacterCreationModal').then((m) => ({ default: m.CharacterCreationModal }))
);
const HeroModal = lazy(() =>
  import('./components/HeroModal').then((m) => ({ default: m.HeroModal }))
);
const ClanModal = lazy(() =>
  import('./components/ClanModal').then((m) => ({ default: m.ClanModal }))
);
const WorldBossRallyModal = lazy(() =>
  import('./components/WorldBossRallyModal').then((m) => ({ default: m.WorldBossRallyModal }))
);
const ResourceGatherModal = lazy(() =>
  import('./components/ResourceGatherModal').then((m) => ({ default: m.ResourceGatherModal }))
);
const LeaderboardModal = lazy(() =>
  import('./components/LeaderboardModal').then((m) => ({ default: m.LeaderboardModal }))
);
const CppArchitectureModal = lazy(() =>
  import('./components/CppArchitectureModal').then((m) => ({ default: m.CppArchitectureModal }))
);
const AdminConsoleModal = lazy(() =>
  import('./components/AdminConsoleModal').then((m) => ({ default: m.AdminConsoleModal }))
);
const WeatherModal = lazy(() =>
  import('./components/WeatherModal').then((m) => ({ default: m.WeatherModal }))
);
const CultivationModal = lazy(() =>
  import('./components/CultivationModal').then((m) => ({ default: m.CultivationModal }))
);
const WorldAIDirectorModal = lazy(() =>
  import('./components/WorldAIDirectorModal').then((m) => ({ default: m.WorldAIDirectorModal }))
);
const DailyLoginModal = lazy(() =>
  import('./components/DailyLoginModal').then((m) => ({ default: m.DailyLoginModal }))
);
const DailyMissionModal = lazy(() =>
  import('./components/DailyMissionModal').then((m) => ({ default: m.DailyMissionModal }))
);
const VipSubscriptionModal = lazy(() =>
  import('./components/VipSubscriptionModal').then((m) => ({ default: m.VipSubscriptionModal }))
);
const LoreHistoryModal = lazy(() =>
  import('./components/LoreHistoryModal').then((m) => ({ default: m.LoreHistoryModal }))
);
const CosmologicalAdminModal = lazy(() =>
  import('./components/CosmologicalAdminModal').then((m) => ({ default: m.CosmologicalAdminModal }))
);
const GmailModal = lazy(() =>
  import('./components/GmailModal').then((m) => ({ default: m.GmailModal }))
);
const EulaModal = lazy(() =>
  import('./components/EulaModal').then((m) => ({ default: m.EulaModal }))
);
const MarketplaceModal = lazy(() =>
  import('./components/MarketplaceModal').then((m) => ({ default: m.MarketplaceModal }))
);
import type { BulkExchangeOffer, CurioMarketItem } from './components/MarketplaceModal';
import { evaluateChunkBoundaryProximity } from './game/openWorld3DEngine';
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
import {
  DAILY_MISSIONS_STORAGE_KEY,
  DailyMissionBoardState,
  DailyMissionCategory,
  DailyMissionDestinationModal,
  advanceDailyMissionById,
  applyMissionRewardBundle,
  claimDailyMissionMilestone,
  claimDailyMissionReward,
  countClaimableDailyMissions,
  deserializeDailyMissionBoard,
  recordDailyMissionEvent,
  refreshDailyMissionBoard,
  serializeDailyMissionBoard,
  syncBoardForDate,
} from './game/dailyMissions';
import {
  VIP_SUBSCRIPTION_STORAGE_KEY,
  INITIAL_VIP_SUBSCRIPTION_STATE,
  PersistedVipSubscriptionState,
  VipTierId,
  BillingCycle,
  VIP_TIER_CONFIGS,
  evaluateVipSubscription,
  activateVipSubscription,
  claimVipDailyStipend,
  applyVipDiscountToCosts,
  checkVipFeatureAccess,
} from './game/vipSubscription';
import { tickWorldAI, generateRadiantQuestForNPC } from './game/worldAI';
import { PlayerCultivationState, CultivationPill, CultivationPath } from './types/cultivation';
import {
  CULTIVATION_REALMS,
  CULTIVATION_PATH_META,
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
import {
  PRIMARY_ADMIN_EMAIL,
  INITIAL_MODERATED_PLAYERS,
  INITIAL_SUPPORT_TICKETS,
  ModeratedPlayerRecord,
  SupportTicket,
  createContactTicket,
  isPrimaryAdminAccount,
} from './game/adminModeration';
import {
  GOD_FLIGHT_SPEC,
  GodTeleportWaypointId,
  buildMaxedGodCharacterBundle,
  evaluateGodCharacterImmunity,
  evaluateGodFlightPermission,
  evaluateGodTeleportPermission,
  executeGodTeleportJump,
} from './game/godModeCharacter';
import { getSpeciesSpec } from './game/species';
import {
  TOP_100_OMNIVERSE_SPECIES_NPCS,
  OmniverseSpeciesNpcEntry,
  WhitePageAuthorDecreeType,
  WhitePageRoot,
  executeOmniverseSuperAdminCommand,
  executeWhitePageAuthorDecree,
  getWhitePageSingletonRoot,
  projectOmniverseNpcToWorldNPC,
} from './game/omniverse';
import {
  comprehendLoreEpoch,
  LORE_CODEX_STORAGE_KEY,
  INITIAL_LORE_CODEX_STATE,
  PersistedLoreCodexState,
  LoreCodexEntry,
  evaluateOpenWorldLoreDiscovery,
  unlockLoreCodexEntry,
  claimLoreCodexReward,
  buildDynamicMonsterCodexEntry,
} from './game/loreHistory';

import {
  EULA_STORAGE_KEY,
  EulaAcceptanceState,
  acceptEulaVersion,
  createInitialEulaAcceptanceState,
  revokeEulaAcceptance,
} from './game/eula';

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
  | 'daily_login'
  | 'daily_missions'
  | 'vip_subscription'
  | 'lore_history'
  | 'cosmological_admin'
  | 'gmail'
  | 'eula'
  | 'marketplace';

export default function App() {
  const {
    user: authUser,
    serverSession,
    loading: authLoading,
    authError,
    clearAuthError,
    signInWithGoogle,
    logout: signOutGoogle,
    getFreshIdToken,
    authorizedFetch,
  } = useAuth();
  const [isSyncingAccount, setIsSyncingAccount] = useState<boolean>(false);

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

  const [initialGodBundle] = useState(() =>
    buildMaxedGodCharacterBundle({ baseHeroes: INITIAL_HEROES })
  );

  // Player State (Initialized to Max-Out God Character for Root Creator creatergame31@gmail.com)
  const [playerAppearance, setPlayerAppearance] = useState<CharacterAppearance>(
    initialGodBundle.appearance
  );
  const [castleLevel, setCastleLevel] = useState<number>(initialGodBundle.castleLevel);
  const [resources, setResources] = useState<GameResources>(initialGodBundle.resources);
  const [troops, setTroops] = useState<PlayerTroopRoster>(() => {
    const reserveTotal = Object.values(INITIAL_TROOPS).reduce((sum, count) => sum + count, 0n);
    const recruitmentHeadroom = 50_000_000n;
    const baseT20Bombers = initialGodBundle.troops.bomber_t20 ?? 0n;
    return {
      ...INITIAL_TROOPS,
      ...initialGodBundle.troops,
      bomber_t20:
        baseT20Bombers > reserveTotal + recruitmentHeadroom
          ? baseT20Bombers - reserveTotal - recruitmentHeadroom
          : baseT20Bombers,
    };
  });
  const [heroes, setHeroes] = useState<Hero[]>(initialGodBundle.heroes);
  const [playerExp, setPlayerExp] = useState<bigint>(initialGodBundle.playerExp);
  const [clan, setClan] = useState<Clan>(INITIAL_CLAN);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>(INITIAL_CLAN_MEMBERS);
  const [clanCoins, setClanCoins] = useState<bigint>(initialGodBundle.clanCoins);
  const [clanChat, setClanChat] = useState<ClanChatMessage[]>(INITIAL_CLAN_CHAT);
  const [clanLeaderboard, setClanLeaderboard] =
    useState<ClanLeaderboardEntry[]>(INITIAL_CLAN_LEADERBOARD);
  const [monsters, setMonsters] = useState<MonsterTarget[]>(INITIAL_MONSTERS);
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>(INITIAL_RESOURCE_NODES);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [leaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [selectedNpcId, setSelectedNpcId] = useState<string>(INITIAL_NPCS[0].id);
  const playerWorldPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 18 });
  const [hudPlayerCoords, setHudPlayerCoords] = useState<{ x: number; z: number }>({
    x: 0,
    z: 18,
  });
  const [fetchedBoundaryKeys, setFetchedBoundaryKeys] = useState<string[]>([]);
  const [streamedChunkCount, setStreamedChunkCount] = useState<number>(9);
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

  // Han Jue Four-Path Cultivation State (Maxed Realm 22 L9 across all 4 paths for Root Creator)
  const [cultivation, setCultivation] = useState<PlayerCultivationState>(
    initialGodBundle.cultivation
  );

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

  // Daily Cultivation Missions State (persisted in localStorage, cultivation-level scaled & repeatable)
  const [dailyMissionBoard, setDailyMissionBoard] = useState<DailyMissionBoardState>(() => {
    const initDateKey = getCalendarDateKey(new Date(), 0);
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);
        if (raw) {
          const hydrated = deserializeDailyMissionBoard(raw);
          if (hydrated) {
            return syncBoardForDate(hydrated, initDateKey, initialGodBundle.cultivation);
          }
        }
      } catch {
        // Fallback to freshly generated board
      }
    }
    return syncBoardForDate(null, initDateKey, initialGodBundle.cultivation);
  });

  // VIP Member Subscription State (persisted in localStorage; Root Creator defaults to VIP 3 Celestial)
  const [vipState, setVipState] = useState<PersistedVipSubscriptionState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(VIP_SUBSCRIPTION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedVipSubscriptionState>;
          if (parsed.activeTier && parsed.activeTier !== 'free') {
            return { ...INITIAL_VIP_SUBSCRIPTION_STATE, ...parsed };
          }
        }
      } catch {
        // Fallback to initial state
      }
    }
    return initialGodBundle.vipState;
  });

  // Selected entities for modals
  const [selectedMonster, setSelectedMonster] = useState<MonsterTarget>(INITIAL_MONSTERS[0]);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Day / Night Cycle (hours: 0 to 24)
  const [timeOfDayHours, setTimeOfDayHours] = useState<number>(14.0); // Starts at 2 PM golden daylight
  const [timeSpeedMultiplier, setTimeSpeedMultiplier] = useState<number>(1);
  const [graphicsQuality, setGraphicsQuality] = useState<'ultra' | 'high' | 'balanced'>('ultra');
  const [targetPlatform, setTargetPlatform] = useState<'pc_console' | 'mobile'>(() => {
    if (typeof window === 'undefined') return 'pc_console';
    const hasCoarsePointer =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
    return detectInitialTargetPlatform(window.innerWidth, hasCoarsePointer);
  });
  const [hdPackMounted, setHdPackMounted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());
  const [godmode, setGodmode] = useState<boolean>(true);
  const [isTimeFrozen, setIsTimeFrozen] = useState<boolean>(false);
  const [activeAccountEmail, setActiveAccountEmail] = useState<string>(PRIMARY_ADMIN_EMAIL);
  const [eulaState, setEulaState] = useState<EulaAcceptanceState>(() => {
    try {
      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(EULA_STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<EulaAcceptanceState>;
        if (typeof parsed.accepted === 'boolean' && typeof parsed.acceptedByEmail === 'string') {
          return {
            accepted: parsed.accepted,
            acceptedVersion: parsed.acceptedVersion ?? null,
            acceptedAtIso: parsed.acceptedAtIso ?? null,
            acceptedByEmail: parsed.acceptedByEmail,
            receiptHash: parsed.receiptHash ?? null,
          };
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    return createInitialEulaAcceptanceState(PRIMARY_ADMIN_EMAIL);
  });
  const [moderatedPlayers, setModeratedPlayers] =
    useState<ModeratedPlayerRecord[]>(INITIAL_MODERATED_PLAYERS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [omniverseRoster, setOmniverseRoster] = useState<OmniverseSpeciesNpcEntry[]>(
    TOP_100_OMNIVERSE_SPECIES_NPCS
  );
  const [cosmologicalTree, setCosmologicalTree] = useState<WhitePageRoot>(() =>
    getWhitePageSingletonRoot()
  );
  const [worldAiInitialTab, setWorldAiInitialTab] = useState<
    'npcs' | 'monsters' | 'telemetry' | 'omniverse'
  >('npcs');

  const handleExecuteOmniverseCommand = (
    command: Parameters<typeof executeOmniverseSuperAdminCommand>[0]['command']
  ) => {
    const res = executeOmniverseSuperAdminCommand({
      actorEmail: activeAccountEmail,
      roster: omniverseRoster,
      command,
    });
    if (!res.allowed) {
      setToastMessage(`🔒 ${res.reason}`);
      return;
    }

    setOmniverseRoster(res.updatedRoster);

    // Sync projected 3D Overworld NPCs while preserving core Citadel NPCs
    const projectedOmniNpcs = res.updatedRoster
      .filter((e) => e.deployedInOverworld)
      .map((e, idx) => projectOmniverseNpcToWorldNPC(e, idx));
    setNpcs((prev) => {
      const coreNpcs = prev.filter((n) => !n.id.startsWith('omni_npc_'));
      return [...coreNpcs, ...projectedOmniNpcs];
    });

    if (res.tributeDiamondsGranted > 0n) {
      setResources((prev) => ({
        ...prev,
        diamond: prev.diamond + res.tributeDiamondsGranted,
        wood: prev.wood + res.tributeWoodGranted,
        grain: prev.grain + res.tributeGrainGranted,
      }));
      confetti({ particleCount: 90, spread: 95 });
      setToastMessage(
        `🌌 ${res.reason} (+${formatBigInt(res.tributeDiamondsGranted)} 💎, +${formatBigInt(res.tributeWoodGranted)} Wood, +${formatBigInt(res.tributeGrainGranted)} Grain)`
      );
      return;
    }

    setToastMessage(`🌌 ${res.reason}`);
  };

  const handleExecuteWhitePageDecree = (decreeType: WhitePageAuthorDecreeType) => {
    const res = executeWhitePageAuthorDecree({
      actorEmail: activeAccountEmail,
      roster: omniverseRoster,
      decreeType,
    });
    if (!res.allowed) {
      setToastMessage(`🔒 ${res.reason}`);
      return;
    }

    setOmniverseRoster(res.updatedRoster);

    const projectedOmniNpcs = res.updatedRoster
      .filter((e) => e.deployedInOverworld)
      .map((e, idx) => projectOmniverseNpcToWorldNPC(e, idx));
    setNpcs((prev) => {
      const coreNpcs = prev.filter((n) => !n.id.startsWith('omni_npc_'));
      return [...coreNpcs, ...projectedOmniNpcs];
    });

    if (res.tributeDiamondsGranted > 0n) {
      setResources((prev) => ({
        ...prev,
        diamond: prev.diamond + res.tributeDiamondsGranted,
        wood: prev.wood + res.tributeWoodGranted,
        grain: prev.grain + res.tributeGrainGranted,
      }));
      confetti({ particleCount: 110, spread: 100 });
      setToastMessage(`📜 ${res.reason} (+${formatBigInt(res.tributeDiamondsGranted)} 💎)`);
      return;
    }

    setToastMessage(`📜 ${res.reason}`);
  };

  // Dynamic Weather System State (Clear, Rain, Snow, Storm)
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [weatherRemainingSec, setWeatherRemainingSec] = useState<number>(60);

  // Touch joystick vector (-1 to 1)
  const [touchVector, setTouchVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sovereign Divine Flight & Teleportation State (Initialized airborne for Root Creator creatergame31@gmail.com)
  const [isFlying, setIsFlying] = useState<boolean>(true);
  const [flightAltitude, setFlightAltitude] = useState<number>(
    GOD_FLIGHT_SPEC.defaultCruiseAltitude
  );
  const [teleportCommand, setTeleportCommand] = useState<{
    seq: number;
    x: number;
    y: number;
    z: number;
  } | null>(null);

  // Evaluate VIP Member Subscription status & multipliers
  const vipEffectiveDateKey = getCalendarDateKey(new Date(), vipState.simulatedVipDayOffset);
  const vipEvaluation = evaluateVipSubscription(vipState, vipEffectiveDateKey);

  // Evaluate Supreme Creator 12-Domain All-Things Immunity, Sovereign Divine Flight & Sovereign Divine Teleportation (fail-closed for all non-root accounts)
  const godImmunity = evaluateGodCharacterImmunity(activeAccountEmail, godmode);
  const godFlightPermission = evaluateGodFlightPermission(activeAccountEmail, godmode);
  const godTeleportPermission = evaluateGodTeleportPermission(activeAccountEmail, godmode);

  const handleToggleFlight = useCallback(() => {
    const perm = evaluateGodFlightPermission(activeAccountEmail, godmode);
    if (!perm.allowed) {
      setIsFlying(false);
      setFlightAltitude(0);
      setToastMessage(`🔒 ${perm.reason}`);
      return;
    }
    setIsFlying((prev) => {
      const next = !prev;
      if (next) {
        setFlightAltitude((alt) =>
          alt >= GOD_FLIGHT_SPEC.minAirborneAltitude ? alt : GOD_FLIGHT_SPEC.defaultCruiseAltitude
        );
        setToastMessage(
          `🕊️ Sovereign Divine Flight: AIRBORNE (${GOD_FLIGHT_SPEC.defaultCruiseAltitude}m · ${perm.flightSpeedMultiplier}x Speed · Citadel Wall Bypass) for ${PRIMARY_ADMIN_EMAIL}!`
        );
      } else {
        setToastMessage(`🕊️ Sovereign Divine Flight: LANDED (0.0m) for ${PRIMARY_ADMIN_EMAIL}.`);
      }
      return next;
    });
  }, [activeAccountEmail, godmode]);

  const handleAdjustFlightAltitude = useCallback(
    (deltaMeters: number) => {
      const perm = evaluateGodFlightPermission(activeAccountEmail, godmode);
      if (!perm.allowed) {
        setToastMessage(`🔒 ${perm.reason}`);
        return;
      }
      setIsFlying(true);
      setFlightAltitude((prev) => {
        const base = prev > 0 ? prev : perm.defaultCruiseAltitude;
        const clamped = Math.max(
          GOD_FLIGHT_SPEC.minAirborneAltitude,
          Math.min(perm.maxAltitude, Number((base + deltaMeters).toFixed(1)))
        );
        setToastMessage(
          `🕊️ Sovereign Flight Altitude: ${clamped.toFixed(1)}m (${perm.flightSpeedMultiplier}x Speed · ${PRIMARY_ADMIN_EMAIL})`
        );
        return clamped;
      });
    },
    [activeAccountEmail, godmode]
  );

  const handleSetFlightAltitude = useCallback(
    (targetAlt: number) => {
      const perm = evaluateGodFlightPermission(activeAccountEmail, godmode);
      if (!perm.allowed) {
        setToastMessage(`🔒 ${perm.reason}`);
        return;
      }
      if (targetAlt <= 0) {
        setIsFlying(false);
        setFlightAltitude(0);
        setToastMessage(`🕊️ Sovereign Divine Flight: LANDED (0.0m) for ${PRIMARY_ADMIN_EMAIL}.`);
        return;
      }
      const clamped = Math.max(
        GOD_FLIGHT_SPEC.minAirborneAltitude,
        Math.min(perm.maxAltitude, Number(targetAlt.toFixed(1)))
      );
      setIsFlying(true);
      setFlightAltitude(clamped);
      setToastMessage(
        `🕊️ Sovereign Flight Altitude Set: ${clamped.toFixed(1)}m (${perm.flightSpeedMultiplier}x Speed · ${PRIMARY_ADMIN_EMAIL})`
      );
    },
    [activeAccountEmail, godmode]
  );

  const handleTeleportToWaypoint = useCallback(
    (waypointId: GodTeleportWaypointId) => {
      const perm = evaluateGodTeleportPermission(activeAccountEmail, godmode);
      const jump = executeGodTeleportJump({
        currentX: playerWorldPosRef.current.x,
        currentY: isFlying ? flightAltitude : 0,
        currentZ: playerWorldPosRef.current.z,
        mode: 'waypoint',
        waypointId,
        permission: perm,
      });
      if (!jump.teleported) {
        setToastMessage(`🔒 ${jump.reason}`);
        return;
      }
      playerWorldPosRef.current = { x: jump.nextX, z: jump.nextZ };
      setHudPlayerCoords({ x: jump.nextX, z: jump.nextZ });
      if (jump.nextY > 0) {
        setIsFlying(true);
        setFlightAltitude(jump.nextY);
      } else {
        setIsFlying(false);
        setFlightAltitude(0);
      }
      setTeleportCommand((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        x: jump.nextX,
        y: jump.nextY,
        z: jump.nextZ,
      }));
      setToastMessage(`⚡ ${jump.reason}`);
    },
    [activeAccountEmail, godmode, isFlying, flightAltitude]
  );

  const handleTeleportToCoordinates = useCallback(
    (targetX: number, targetY: number, targetZ: number) => {
      const perm = evaluateGodTeleportPermission(activeAccountEmail, godmode);
      const jump = executeGodTeleportJump({
        currentX: playerWorldPosRef.current.x,
        currentY: isFlying ? flightAltitude : 0,
        currentZ: playerWorldPosRef.current.z,
        mode: 'coordinates',
        targetX,
        targetY,
        targetZ,
        permission: perm,
      });
      if (!jump.teleported) {
        setToastMessage(`🔒 ${jump.reason}`);
        return;
      }
      playerWorldPosRef.current = { x: jump.nextX, z: jump.nextZ };
      setHudPlayerCoords({ x: jump.nextX, z: jump.nextZ });
      if (jump.nextY > 0) {
        setIsFlying(true);
        setFlightAltitude(jump.nextY);
      } else {
        setIsFlying(false);
        setFlightAltitude(0);
      }
      setTeleportCommand((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        x: jump.nextX,
        y: jump.nextY,
        z: jump.nextZ,
      }));
      setToastMessage(`⚡ ${jump.reason}`);
    },
    [activeAccountEmail, godmode, isFlying, flightAltitude]
  );

  const handleForwardBlink = useCallback(
    (facingAngleRad = Math.PI) => {
      const perm = evaluateGodTeleportPermission(activeAccountEmail, godmode);
      const jump = executeGodTeleportJump({
        currentX: playerWorldPosRef.current.x,
        currentY: isFlying ? flightAltitude : 0,
        currentZ: playerWorldPosRef.current.z,
        facingAngleRad,
        mode: 'forward_blink',
        permission: perm,
      });
      if (!jump.teleported) {
        setToastMessage(`🔒 ${jump.reason}`);
        return;
      }
      playerWorldPosRef.current = { x: jump.nextX, z: jump.nextZ };
      setHudPlayerCoords({ x: jump.nextX, z: jump.nextZ });
      setTeleportCommand((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        x: jump.nextX,
        y: jump.nextY,
        z: jump.nextZ,
      }));
      setToastMessage(`⚡ ${jump.reason}`);
    },
    [activeAccountEmail, godmode, isFlying, flightAltitude]
  );

  // Calculate Trillion-scale Multiplicative Power Rating scaled by Four-Path Cultivation Resonance, Veteran Scroll Mastery & VIP Covenant
  const maxTroopCapacity = calculateCastleTroopCapacity(castleLevel);
  const fourPathSynergy = calculateFourPathSynergy(cultivation.paths);
  const veteranScrollBonuses = calculateVeteranScrollBonuses(
    cultivation.veteranScrollsComprehended ?? 0
  );
  const cultivationMultiplier =
    fourPathSynergy.totalCombinedMultiplier *
    (1 + veteranScrollBonuses.combatResonanceBonusPct / 100) *
    vipEvaluation.totalEffectiveCombatMultiplier;
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

  const activeDailyMissionBoard = syncBoardForDate(
    dailyMissionBoard,
    effectiveDateKey,
    cultivation
  );
  const claimableDailyMissionsCount = countClaimableDailyMissions(activeDailyMissionBoard);
  const dailyMissionsClaimedCount = activeDailyMissionBoard.missions.filter(
    (m) => m.claimed
  ).length;

  // Keep dailyMissionBoard synced when calendar date / simulated day advances
  useEffect(() => {
    if (dailyMissionBoard.dateKey !== effectiveDateKey) {
      setDailyMissionBoard((prev) => syncBoardForDate(prev, effectiveDateKey, cultivation));
    }
  }, [dailyMissionBoard.dateKey, effectiveDateKey, cultivation]);

  // Persist dailyMissionBoard to localStorage (BigInt-safe)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          DAILY_MISSIONS_STORAGE_KEY,
          serializeDailyMissionBoard(dailyMissionBoard)
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [dailyMissionBoard]);

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

  // Persist vipState to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(VIP_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(vipState));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [vipState]);

  // Sync daily login auto-trigger date key without blocking the 3D viewport with a modal overlay
  useEffect(() => {
    if (dailyLoginEvaluation.shouldAutoTriggerOnLoad) {
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

  // Ambient Four-Path Cultivation Loop (Qi, Body, Soul, Mind — Weather Resonance, Mind Speed, Equipped Manuals & VIP Bonus)
  const vipCultivationBonusPct = vipEvaluation.tierConfig.perks.cultivationSpeedBonusPct;
  const vipGatherBonusPct = vipEvaluation.tierConfig.perks.gatherSpeedBonusPct;

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
        const totalExtraBoost = scrollBonuses.passiveSpeedBonusPct + vipCultivationBonusPct;
        const qiRate = calculatePassiveQiRate(
          prev.paths.qi.realmIndex,
          weather,
          clanBuffActive,
          'qi',
          mindRealm,
          mindLayer,
          manualSummary.byPath.qi.passiveRateBoostPct + totalExtraBoost
        );
        const bodyRate = calculatePassiveQiRate(
          prev.paths.body.realmIndex,
          weather,
          clanBuffActive,
          'body',
          mindRealm,
          mindLayer,
          manualSummary.byPath.body.passiveRateBoostPct + totalExtraBoost
        );
        const soulRate = calculatePassiveQiRate(
          prev.paths.soul.realmIndex,
          weather,
          clanBuffActive,
          'soul',
          mindRealm,
          mindLayer,
          manualSummary.byPath.soul.passiveRateBoostPct + totalExtraBoost
        );
        const mindRate = calculatePassiveQiRate(
          prev.paths.mind.realmIndex,
          weather,
          clanBuffActive,
          'mind',
          mindRealm,
          mindLayer,
          manualSummary.byPath.mind.passiveRateBoostPct + totalExtraBoost
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
  }, [weather, clan.activeBuffs, vipCultivationBonusPct]);

  // Continuous Gathering Loop with Weather & VIP Multiplier
  useEffect(() => {
    const gatherInterval = setInterval(() => {
      setResourceNodes((prev) => {
        let hasMined = false;
        const updated = prev.map((node) => {
          if (node.assignedTroops > 0n && node.remainingCapacity > 0n) {
            hasMined = true;
            const weatherRate = calculateWeatherGatherRate(
              node.gatherRatePerSec,
              node.type,
              weather
            );
            const effectiveRate = (weatherRate * BigInt(100 + vipGatherBonusPct)) / 100n;
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
  }, [weather, vipGatherBonusPct]);

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

  const handleActivateMaxGodCharacter = () => {
    const bundle = buildMaxedGodCharacterBundle({
      baseAppearance: { species: playerAppearance.species },
      baseHeroes: INITIAL_HEROES,
    });
    setActiveAccountEmail(PRIMARY_ADMIN_EMAIL);
    setGodmode(true);
    setIsFlying(true);
    setFlightAltitude(GOD_FLIGHT_SPEC.defaultCruiseAltitude);
    setCastleLevel(bundle.castleLevel);
    setPlayerAppearance(bundle.appearance);
    setResources(bundle.resources);
    setTroops(bundle.troops);
    setHeroes(bundle.heroes);
    setPlayerExp(bundle.playerExp);
    setClanCoins(bundle.clanCoins);
    setCultivation(bundle.cultivation);
    setVipState(bundle.vipState);
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });
    setToastMessage(
      '👑 Maxed-Out Creator God Character, 12-Domain Immunity & Sovereign Divine Flight Activated for creatergame31@gmail.com!'
    );
  };

  // Castle Upgrade (with active VIP Castle Upgrade Discount or Creator God Immunity)
  const handleUpgradeCastle = () => {
    if (castleLevel >= MAX_CASTLE_LEVEL) return;
    if (!godImmunity.immuneToAllThings) {
      const baseCost = getCastleUpgradeCost(castleLevel);
      const cost = applyVipDiscountToCosts(
        baseCost,
        vipEvaluation.tierConfig.perks.castleUpgradeDiscountPct
      );

      setResources((prev) => ({
        wood: prev.wood - cost.wood,
        steel: prev.steel - cost.steel,
        copper: prev.copper - cost.copper,
        grain: prev.grain - cost.grain,
        oil: prev.oil - cost.oil,
        diamond: prev.diamond - cost.diamond,
      }));
    }

    setCastleLevel((prev) => {
      const next = prev + 1;
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setToastMessage(`🏰 Imperial Citadel upgraded to Level ${next}! Troop capacity expanded!`);
      return next;
    });
    recordDailyMissionProgress('citadel_expansion', 1);
  };

  // Troop Training
  const handleTrainTroops = (
    type: TroopType,
    tier: number,
    amount: bigint,
    cost: Partial<GameResources>
  ) => {
    if (!godImmunity.immuneToAllThings) {
      setResources((prev) => ({
        wood: prev.wood - (cost.wood || 0n),
        steel: prev.steel - (cost.steel || 0n),
        copper: prev.copper - (cost.copper || 0n),
        grain: prev.grain - (cost.grain || 0n),
        oil: prev.oil - (cost.oil || 0n),
        diamond: prev.diamond - (cost.diamond || 0n),
      }));
    }

    const key = `${type}_t${tier}`;
    setTroops((prev) => ({
      ...prev,
      [key]: (prev[key] || 0n) + amount,
    }));

    const info = getTroopTierInfo(type, tier);
    setToastMessage(`⚔️ Enlisted +${formatBigInt(amount)} ${info.name} into your grand army!`);
    recordDailyMissionProgress('troop_muster', 1);
  };

  // Troop Tier Promotion (Low-Tier -> Higher Unlocked Tier)
  const handlePromoteTroops = (
    type: TroopType,
    sourceTier: number,
    targetTier: number,
    amount: bigint
  ): { ok: boolean; error?: string; powerGained?: bigint } => {
    const result = applyTroopPromotion({
      troops,
      resources,
      type,
      sourceTier,
      targetTier,
      amount,
      castleLevel,
      zeroResourceCost: godImmunity.immuneToAllThings,
    });

    if (!result.ok) {
      if (result.error) {
        setToastMessage(`⚠️ ${result.error}`);
      }
      return { ok: false, error: result.error };
    }

    setTroops(result.nextTroops);
    if (!godImmunity.immuneToAllThings) {
      setResources(result.nextResources);
    }

    confetti({ particleCount: 36, spread: 52, origin: { y: 0.65 } });
    return { ok: true, powerGained: result.quote.statDeltas.totalPowerGain };
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
    if (!godImmunity.immuneToAllThings) {
      setResources((prev) => ({
        ...prev,
        [type]: prev[type] - amount,
      }));
    }
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
    recordDailyMissionProgress('citadel_expansion', 1);
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
    if (!godImmunity.immuneToAllThings) {
      setClanCoins((prev) => prev - cost);
    }
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
    recordDailyMissionProgress('boss_skirmish', 1);
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
    if (!godImmunity.immuneToAllThings) {
      if (resources.diamond < 500n) {
        setToastMessage('💎 Need at least 500 Diamonds to found a new Clan.');
        return;
      }
      setResources((prev) => ({ ...prev, diamond: prev.diamond - 500n }));
    }

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
    recordDailyMissionProgress('cultivation_meditate', 1, { path });
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
    if (!godImmunity.immuneToAllThings) {
      setResources((prev) => ({
        ...prev,
        wood: prev.wood - pill.costHerbWood,
        grain: prev.grain - pill.costHerbGrain,
        diamond: prev.diamond - pill.costDiamonds,
      }));
    }
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
    recordDailyMissionProgress('pill_alchemy', 1, { path: activePath });
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
    if (!godImmunity.immuneToAllThings) {
      if (cultivation.scriptureFragments < cost.fragments || resources.diamond < cost.diamonds)
        return;

      setResources((prev) => ({
        ...prev,
        diamond: prev.diamond - cost.diamonds,
      }));
    }
    const nextLevel = owned.level + 1;
    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: godImmunity.immuneToAllThings
        ? prev.scriptureFragments
        : prev.scriptureFragments - cost.fragments,
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
    recordDailyMissionProgress('manual_study', 1);
  };

  const handleDiscoverManual = (freeDeduction: boolean = false) => {
    if (freeDeduction) {
      setCultivation((prev) => ({
        ...prev,
        scriptureFragments: prev.scriptureFragments + 25,
      }));
      setToastMessage('📜 Secluded Scripture Deduction complete! Gained +25 Scripture Fragments.');
      recordDailyMissionProgress('manual_study', 1);
      return;
    }

    if (!godImmunity.immuneToAllThings) {
      if (resources.diamond < 200n) return;
      setResources((prev) => ({
        ...prev,
        diamond: prev.diamond - 200n,
      }));
    }

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
    recordDailyMissionProgress('manual_study', 1);
  };

  const handleUnlockManualDirect = (manualId: string) => {
    const manual = getManualById(manualId);
    if (!manual || cultivation.ownedManuals[manualId]) return;
    if (!godImmunity.immuneToAllThings && cultivation.scriptureFragments < 40) return;

    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: godImmunity.immuneToAllThings
        ? prev.scriptureFragments
        : prev.scriptureFragments - 40,
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
    if (!godImmunity.immuneToAllThings) {
      const cost = BigInt(hero.level * 2500);
      setPlayerExp((prev) => prev - cost);
    }
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
    if (!godImmunity.immuneToAllThings) {
      if (resources.diamond < 500n) {
        setToastMessage('💎 Not enough Diamonds to summon in the Hero Tavern (Need 500).');
        return;
      }
      setResources((prev) => ({ ...prev, diamond: prev.diamond - 500n }));
    }

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

  // Hero Aesthetic Skin & Particle Aura Customization
  const handleSelectHeroSkin = (heroId: string, skinId: HeroSkinId) => {
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero) return;
    const updatedHero = applySkinToHero(hero, skinId);
    const skinMeta = HERO_SKIN_CATALOG[skinId];
    setHeroes((prev) => prev.map((h) => (h.id === heroId ? updatedHero : h)));
    setToastMessage(
      `✨ ${hero.name} equipped aesthetic skin "${skinMeta?.name ?? skinId}" (${updatedHero.avatarIcon} · ${skinMeta?.auraName ?? 'Aura'})!`
    );
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
    recordDailyMissionProgress('boss_skirmish', 1);
  };

  // Casualties
  const handleCasualties = (cas: { shieldbearers: bigint; shooters: bigint; bombers: bigint }) => {
    if (godImmunity.immuneToAllThings || godmode) {
      setToastMessage(
        '👑 [Creator God Immunity Active] All damage & troop casualties nullified (0.0x)!'
      );
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

  // Dispatch Gather (Enforces VIP Extra March Queue Access Control)
  const handleDispatchGather = (nodeId: string, troopsAmount: bigint) => {
    const targetNode = resourceNodes.find((n) => n.id === nodeId);
    const activeGatherMarches = resourceNodes.filter((n) => n.assignedTroops > 0n).length;
    const isAlreadyGatheringThisNode = Boolean(targetNode && targetNode.assignedTroops > 0n);

    if (!isAlreadyGatheringThisNode) {
      const marchAccess = checkVipFeatureAccess(
        vipState,
        vipEffectiveDateKey,
        'extra_gather_march',
        { activeGatherMarches }
      );
      if (!marchAccess.allowed) {
        setToastMessage(`🔒 ${marchAccess.reason}`);
        return;
      }
    }

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
    recordDailyMissionProgress('resource_harvest', 1, { resource: node.type });
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
    if (
      (!godImmunity.immuneToAllThings && resources[offer.giveResource] < offer.giveAmount) ||
      offer.stock <= 0
    )
      return;

    setResources((prev) => ({
      ...prev,
      [offer.giveResource]: godImmunity.immuneToAllThings
        ? prev[offer.giveResource]
        : prev[offer.giveResource] - offer.giveAmount,
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
    recordDailyMissionProgress('market_caravan', 1, { resource: offer.giveResource });
  };

  const handleExecuteBulkExchange = (offer: BulkExchangeOffer) => {
    if (!godImmunity.immuneToAllThings && resources[offer.costResource] < offer.costAmount) return;
    setResources((prev) => ({
      ...prev,
      [offer.costResource]: godImmunity.immuneToAllThings
        ? prev[offer.costResource]
        : prev[offer.costResource] - offer.costAmount,
      [offer.rewardResource]: prev[offer.rewardResource] + offer.rewardAmount,
    }));
    setToastMessage(
      `⚖️ Marketplace Exchange Settled: ${offer.title} (+${formatBigInt(offer.rewardAmount)} ${offer.rewardResource.toUpperCase()})!`
    );
    recordDailyMissionProgress('market_caravan', 1, { resource: offer.rewardResource });
  };

  const handlePurchaseCurioItem = (item: CurioMarketItem) => {
    if (!godImmunity.immuneToAllThings && resources[item.costResource] < item.costAmount) return;
    setResources((prev) => {
      const next = {
        ...prev,
        [item.costResource]: godImmunity.immuneToAllThings
          ? prev[item.costResource]
          : prev[item.costResource] - item.costAmount,
      };
      if (item.rewardType === 'imperial_supply_crate') {
        next.wood += 250_000n;
        next.grain += 250_000n;
        next.steel += 150_000n;
        next.oil += 100_000n;
      }
      return next;
    });
    if (item.rewardType === 'veteran_scrolls') {
      setCultivation((prev) => ({
        ...prev,
        veteranScrolls: (prev.veteranScrolls ?? 0) + item.rewardAmount,
      }));
    } else if (item.rewardType === 'spirit_stones') {
      setCultivation((prev) => ({
        ...prev,
        spiritStones: (prev.spiritStones ?? 0n) + BigInt(item.rewardAmount),
      }));
    }
    setToastMessage(`🛍️ Marketplace Purchase Complete: ${item.name} (${item.badgeText})!`);
  };

  const handleExecuteP2PTrade = (
    giveResource: ResourceType,
    giveAmount: bigint,
    receiveResource: ResourceType,
    receiveAmount: bigint,
    counterpartyLabel: string
  ) => {
    if (!godImmunity.immuneToAllThings && resources[giveResource] < giveAmount) return;
    setResources((prev) => ({
      ...prev,
      [giveResource]: godImmunity.immuneToAllThings
        ? prev[giveResource]
        : prev[giveResource] - giveAmount,
      [receiveResource]: prev[receiveResource] + receiveAmount,
    }));
    setToastMessage(
      `🤝 P2P Trade Settled with ${counterpartyLabel}: +${formatBigInt(receiveAmount)} ${receiveResource.toUpperCase()}!`
    );
    recordDailyMissionProgress('market_caravan', 1, { resource: receiveResource });
  };

  const handleExecuteArbitrageTrade = (
    resource: 'copper' | 'diamond',
    netProfit: bigint,
    routeSummary: string
  ) => {
    setResources((prev) => ({
      ...prev,
      [resource]: prev[resource] + netProfit,
    }));
    setToastMessage(
      `⚡ Arbitrage Route Settled (${routeSummary}): +${formatBigInt(netProfit)} ${resource.toUpperCase()} Net Profit!`
    );
  };

  const currentBoundaryStatus = evaluateChunkBoundaryProximity({
    playerWorldX: hudPlayerCoords.x,
    playerWorldZ: hudPlayerCoords.z,
    fetchedBoundaryKeys,
  });

  const handleFetchNewAreaData = () => {
    const targetKey = currentBoundaryStatus.targetChunkKey;
    setFetchedBoundaryKeys((prev) => (prev.includes(targetKey) ? prev : [...prev, targetKey]));
    setStreamedChunkCount((prev) => prev + 3);
    setToastMessage(
      `🗺️ Streamed New World Chunk Sector [${targetKey}] (${currentBoundaryStatus.approachingDirection} Frontier Stabilized)!`
    );
  };

  const handleSpawnScaledMonster = (newMonster: MonsterTarget) => {
    setMonsters((prev) => [newMonster, ...prev]);
    setSelectedMonster(newMonster);
    setLoreCodexState((prev) => {
      const entry = buildDynamicMonsterCodexEntry(newMonster);
      return unlockLoreCodexEntry({
        currentState: prev,
        entry,
        discoveredVia: 'monster_encounter',
      }).updatedState;
    });
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
    setToastMessage(
      `🐉 Spawned Level ${newMonster.level} ${newMonster.name} & auto-recorded in Lore Codex!`
    );
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

  // Daily Cultivation Mission System Handlers (Cultivation-scaled, randomized & repeatable)
  function recordDailyMissionProgress(
    category: DailyMissionCategory,
    delta: number = 1,
    filter?: { path?: CultivationPath; resource?: ResourceType }
  ) {
    setDailyMissionBoard((prev) => {
      const synced = syncBoardForDate(prev, effectiveDateKey, cultivation);
      const res = recordDailyMissionEvent(synced, category, delta, filter);
      return res.updatedBoard;
    });
  }

  const handleAdvanceDailyMission = (missionId: string) => {
    const result = advanceDailyMissionById(activeDailyMissionBoard, missionId, 1);
    if (!result.advancedMission) return;
    setDailyMissionBoard(result.updatedBoard);

    const m = result.advancedMission;
    if (m.completed) {
      sound.playUpgradeFanfare();
      setToastMessage(`Commission complete: "${m.title}" is ready to claim!`);
    } else {
      setToastMessage(`Commission progress: "${m.title}" (${m.currentCount}/${m.targetCount}).`);
    }
  };

  const handleClaimDailyMission = (missionId: string) => {
    const result = claimDailyMissionReward(activeDailyMissionBoard, missionId);
    if (!result.claimed || !result.reward || !result.mission) return;

    setDailyMissionBoard(result.updatedBoard);
    const applied = applyMissionRewardBundle({
      resources,
      cultivation,
      reward: result.reward,
    });
    setResources(applied.nextResources);
    setCultivation(applied.nextCultivation);

    sound.playUpgradeFanfare();
    confetti({ particleCount: 55, spread: 70, origin: { y: 0.65 } });
    setToastMessage(
      `Claimed "${result.mission.title}": +${formatBigInt(result.reward.resources.diamond)} Diamonds, +${formatBigInt(result.reward.spiritStones)} Spirit Stones & scaled materials.`
    );
  };

  const handleClaimDailyMissionMilestone = (milestoneId: 'milestone_3' | 'milestone_5') => {
    const result = claimDailyMissionMilestone(activeDailyMissionBoard, milestoneId);
    if (!result.claimed || !result.reward || !result.milestone) return;

    setDailyMissionBoard(result.updatedBoard);
    const applied = applyMissionRewardBundle({
      resources,
      cultivation,
      reward: result.reward,
    });
    setResources(applied.nextResources);
    setCultivation(applied.nextCultivation);

    sound.playUpgradeFanfare();
    confetti({ particleCount: 75, spread: 85, origin: { y: 0.6 } });
    setToastMessage(
      `Opened ${result.milestone.title}: +${formatBigInt(result.reward.resources.diamond)} Diamonds, +${formatBigInt(result.reward.spiritStones)} Spirit Stones${
        result.reward.veteranScrolls > 0 ? `, +${result.reward.veteranScrolls} Veteran Scroll` : ''
      }!`
    );
  };

  const handleClaimAllDailyMissions = () => {
    let workingBoard = activeDailyMissionBoard;
    let workingResources = resources;
    let workingCultivation = cultivation;
    let totalClaimedCount = 0;
    let totalDiamonds = 0n;
    let totalSpiritStones = 0n;

    for (const mission of workingBoard.missions) {
      if (mission.completed && !mission.claimed) {
        const res = claimDailyMissionReward(workingBoard, mission.id);
        if (res.claimed && res.reward) {
          workingBoard = res.updatedBoard;
          const applied = applyMissionRewardBundle({
            resources: workingResources,
            cultivation: workingCultivation,
            reward: res.reward,
          });
          workingResources = applied.nextResources;
          workingCultivation = applied.nextCultivation;
          totalClaimedCount += 1;
          totalDiamonds += res.reward.resources.diamond;
          totalSpiritStones += res.reward.spiritStones;
        }
      }
    }

    for (const ms of workingBoard.milestones) {
      const msRes = claimDailyMissionMilestone(workingBoard, ms.id);
      if (msRes.claimed && msRes.reward) {
        workingBoard = msRes.updatedBoard;
        const applied = applyMissionRewardBundle({
          resources: workingResources,
          cultivation: workingCultivation,
          reward: msRes.reward,
        });
        workingResources = applied.nextResources;
        workingCultivation = applied.nextCultivation;
        totalClaimedCount += 1;
        totalDiamonds += msRes.reward.resources.diamond;
        totalSpiritStones += msRes.reward.spiritStones;
      }
    }

    if (totalClaimedCount === 0) return;

    setDailyMissionBoard(workingBoard);
    setResources(workingResources);
    setCultivation(workingCultivation);
    sound.playUpgradeFanfare();
    confetti({ particleCount: 85, spread: 90, origin: { y: 0.6 } });
    setToastMessage(
      `Claimed ${totalClaimedCount} daily mission rewards: +${formatBigInt(totalDiamonds)} Diamonds & +${formatBigInt(totalSpiritStones)} Spirit Stones!`
    );
  };

  const handleRefreshDailyMissionBoard = () => {
    const res = refreshDailyMissionBoard({
      board: activeDailyMissionBoard,
      cultivation,
      playerDiamonds: resources.diamond,
      bypassCost: godImmunity.immuneToAllThings,
    });

    if (!res.ok) {
      setToastMessage(res.reason || 'Unable to refresh daily mission board.');
      return;
    }

    if (res.diamondCostPaid > 0n) {
      setResources((prev) => ({
        ...prev,
        diamond: prev.diamond - res.diamondCostPaid,
      }));
    }

    setDailyMissionBoard(res.updatedBoard);
    setToastMessage(
      `Generated 5 randomized commissions for Cycle ${res.updatedBoard.cycleIndex} scaled to your cultivation realm.`
    );
  };

  const handleNavigateFromDailyMission = (destination: DailyMissionDestinationModal) => {
    if (destination === 'world_boss') {
      setSelectedMonster(monsters[monsters.length - 1]);
    }
    setActiveModal(destination);
  };

  // VIP Member Covenant Handlers (in-game Diamond treasury redemption only — no real-money billing)
  const handleActivateVipTier = (
    tierId: VipTierId,
    billingCycle: BillingCycle,
    paymentMethod: 'diamonds'
  ) => {
    if (paymentMethod !== 'diamonds') return;
    const targetConfig = VIP_TIER_CONFIGS[tierId];
    const diamondCost =
      billingCycle === 'annual' ? targetConfig.annualDiamondCost : targetConfig.monthlyDiamondCost;

    if (!godImmunity.immuneToAllThings && resources.diamond < diamondCost) {
      setToastMessage('⚠️ Insufficient Diamonds in treasury for this VIP tier.');
      return;
    }

    const activation = activateVipSubscription(vipState, tierId, billingCycle, vipEffectiveDateKey);
    setVipState(activation.nextState);

    setResources((prev) => ({
      ...prev,
      diamond:
        prev.diamond -
        (!godImmunity.immuneToAllThings ? diamondCost : 0n) +
        activation.instantBonusDiamonds,
    }));

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    setToastMessage(
      `👑 Unlocked ${targetConfig.name} (${billingCycle === 'annual' ? 'Annual' : 'Monthly'}) with ${formatBigInt(diamondCost)} 💎! Gained +${formatBigInt(activation.instantBonusDiamonds)} 💎 rebate & +${activation.pointsAdded} VIP Loyalty Pts!`
    );
  };

  const handleClaimVipStipend = () => {
    const result = claimVipDailyStipend(vipState, vipEffectiveDateKey);
    if (!result.claimed) return;

    setVipState(result.nextState);
    const stipend = result.stipend;

    setResources((prev) => ({
      wood: prev.wood + stipend.resources.wood,
      steel: prev.steel + stipend.resources.steel,
      copper: prev.copper + stipend.resources.copper,
      grain: prev.grain + stipend.resources.grain,
      oil: prev.oil + stipend.resources.oil,
      diamond: prev.diamond + stipend.diamonds,
    }));

    setCultivation((prev) => ({
      ...prev,
      spiritStones: (prev.spiritStones ?? 0n) + stipend.spiritStones,
      veteranScrolls: (prev.veteranScrolls ?? 0) + stipend.veteranScrolls,
      secludedYears: prev.secludedYears + stipend.secludedYears,
      scriptureFragments: prev.scriptureFragments + stipend.scriptureFragments,
    }));

    confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
    setToastMessage(
      `👑 Claimed ${vipEvaluation.tierConfig.name} Daily Stipend: +${formatBigInt(stipend.diamonds)} 💎, +${formatBigInt(stipend.spiritStones)} Spirit Stones & +${stipend.veteranScrolls} Veteran Scrolls!`
    );
  };

  const handleAdvanceSimulatedVipDay = () => {
    setVipState((prev) => {
      const nextDaysRemaining =
        prev.expiresAtDaysRemaining > 1
          ? prev.expiresAtDaysRemaining - 1
          : prev.autoRenewEnabled && prev.activeTier !== 'free'
            ? prev.billingCycle === 'annual'
              ? 365
              : 30
            : 0;
      const nextActiveTier = nextDaysRemaining > 0 ? prev.activeTier : 'free';
      if (nextActiveTier === 'free') {
        setCultivation((c) => ({ ...c, auraOverrideRealmIndex: null }));
      }
      return {
        ...prev,
        activeTier: nextActiveTier,
        simulatedVipDayOffset: (prev.simulatedVipDayOffset || 0) + 1,
        expiresAtDaysRemaining: nextDaysRemaining,
      };
    });
    setToastMessage('🌅 Advanced VIP Covenant calendar by +1 Day! Daily VIP Stipend is now ready.');
  };

  const handleToggleVipAutoRenew = () => {
    setVipState((prev) => {
      const next = !prev.autoRenewEnabled;
      setToastMessage(
        `🔄 VIP Auto-Renewal turned ${next ? 'ON' : 'OFF'}. You can change this at any time.`
      );
      return { ...prev, autoRenewEnabled: next };
    });
  };

  const handleCancelVipSubscription = () => {
    setVipState((prev) => ({
      ...prev,
      activeTier: 'free',
      expiresAtDaysRemaining: 0,
      autoRenewEnabled: false,
    }));
    setCultivation((prev) => ({
      ...prev,
      auraOverrideRealmIndex: null,
    }));
    setToastMessage(
      '🛡️ VIP Membership cancelled and reverted to Free Sovereign. All VIP-locked features have been re-locked.'
    );
  };

  // Lore & Cosmological History Comprehension State + Open-World Auto-Populating Lore Codex
  const [comprehendedEpochIds, setComprehendedEpochIds] = useState<string[]>([]);
  const [loreCodexState, setLoreCodexState] = useState<PersistedLoreCodexState>(() => {
    try {
      const saved = localStorage.getItem(LORE_CODEX_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.discoveredRecords === 'object' && parsed.discoveredRecords) {
          return {
            discoveredRecords: parsed.discoveredRecords,
            lastVisitedBiomeId:
              parsed.lastVisitedBiomeId ?? INITIAL_LORE_CODEX_STATE.lastVisitedBiomeId,
            totalDiscoveryEvents:
              typeof parsed.totalDiscoveryEvents === 'number'
                ? parsed.totalDiscoveryEvents
                : Object.keys(parsed.discoveredRecords).length,
          };
        }
      }
    } catch {
      // Fallback to initial state
    }
    return INITIAL_LORE_CODEX_STATE;
  });
  const lastCodexEvalPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  useEffect(() => {
    try {
      localStorage.setItem(LORE_CODEX_STORAGE_KEY, JSON.stringify(loreCodexState));
    } catch {
      // Ignore storage quota errors
    }
  }, [loreCodexState]);

  const handleComprehendLoreEpoch = (epochId: string) => {
    const res = comprehendLoreEpoch({ epochId, comprehendedEpochIds });
    if (!res.newlyComprehended) {
      setToastMessage(`📜 ${res.message}`);
      return;
    }
    sound.playLevelUp();
    setComprehendedEpochIds(res.updatedComprehendedIds);
    setResources((prev) => ({
      ...prev,
      diamond: prev.diamond + res.rewardDiamonds,
    }));
    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: prev.scriptureFragments + res.rewardFragments,
    }));
    confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
    setToastMessage(`📜 ${res.message}`);
  };

  const handleScoutDiscoverCodexEntry = (entry: LoreCodexEntry) => {
    const result = unlockLoreCodexEntry({
      currentState: loreCodexState,
      entry,
      discoveredVia: 'expedition_scout',
    });
    setLoreCodexState(result.updatedState);
    if (result.newlyDiscovered) {
      sound.playLevelUp();
      setToastMessage(
        `🧭 Lore Codex Auto-Populated: ${entry.icon} ${entry.title} (${entry.kind === 'biome' ? 'Biome Surveyed' : 'Monster Bestiary Recorded'})!`
      );
    } else {
      setToastMessage(`🧭 ${entry.title} is already inscribed in your Lore Codex.`);
    }
  };

  const handleClaimCodexBounty = (entryId: string) => {
    const res = claimLoreCodexReward({
      currentState: loreCodexState,
      entryId,
      monsters,
    });
    if (!res.claimed) {
      setToastMessage(`📜 ${res.message}`);
      return;
    }
    sound.playLevelUp();
    setLoreCodexState(res.updatedState);
    setResources((prev) => ({
      ...prev,
      diamond: prev.diamond + res.rewardDiamonds,
    }));
    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: prev.scriptureFragments + res.rewardFragments,
    }));
    confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
    setToastMessage(res.message);
  };

  const handleSyncCloudAccount = useCallback(async () => {
    const token = await getFreshIdToken();
    if (!token) {
      setToastMessage('Sign in with Google to save and sync your commander profile.');
      return;
    }

    setIsSyncingAccount(true);
    try {
      const totalTroops = (Object.values(troops) as bigint[]).reduce((sum, n) => sum + n, 0n);
      const discoveredIds = Object.keys(loreCodexState.discoveredRecords);
      const discoveredCodexCount = discoveredIds.length;
      const commanderName = authUser?.displayName || playerAppearance.name || 'Sovereign Vanguard';

      if (authUser) {
        await syncUserAccountDocuments(authUser, {
          commanderName,
          allianceTag: clan.tag || 'SOL',
          castleLevel,
          cultivationRealmIndex: cultivation.currentRealmIndex,
          vipRank: vipEvaluation.tierConfig.rank,
          karmaValue: cultivation.karma?.karmaValue ?? 0,
          garrisonTroopsWire: totalTroops.toString(),
          discoveredCodexIds: discoveredIds,
        });
      }

      const profileRes = await authorizedFetch('/api/db/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commanderName,
          allianceTag: clan.tag || 'SOL',
          castleLevel,
          cultivationRealmIndex: cultivation.currentRealmIndex,
          vipTier: vipEvaluation.tierConfig.rank,
          karma: cultivation.karma?.karmaValue ?? 0,
          garrisonTroopsWire: totalTroops.toString(),
          discoveredCodexCount,
        }),
      });

      if (!profileRes.ok && profileRes.status !== 503) {
        const errPayload = (await profileRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errPayload.error || 'Unable to sync commander profile.');
      }

      const saveRes = await authorizedFetch('/api/db/save', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 1,
          snapshot: {
            castleLevel,
            cultivationRealmIndex: cultivation.currentRealmIndex,
            allianceTag: clan.tag,
            garrisonTroopsWire: totalTroops.toString(),
            savedAtIso: new Date().toISOString(),
          },
        }),
      });

      if (!saveRes.ok && saveRes.status !== 503) {
        const errPayload = (await saveRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errPayload.error || 'Unable to save realm snapshot.');
      }

      setToastMessage(`Commander progress synced for ${authUser?.email || 'your account'}.`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to sync commander progress right now.';
      if (msg.includes('Quota exceeded')) {
        setToastMessage('Daily storage quota exceeded. Free tier quota resets tomorrow.');
      } else {
        setToastMessage(msg);
      }
    } finally {
      setIsSyncingAccount(false);
    }
  }, [
    authUser,
    authorizedFetch,
    castleLevel,
    clan.tag,
    cultivation.currentRealmIndex,
    cultivation.karma?.karmaValue,
    getFreshIdToken,
    loreCodexState.discoveredRecords,
    playerAppearance.name,
    troops,
    vipEvaluation.tierConfig.rank,
  ]);

  useEffect(() => {
    if (serverSession?.email && serverSession.email !== 'guest@voxelrealms.example') {
      setActiveAccountEmail(serverSession.email);
    } else if (!authLoading && authUser?.email) {
      setActiveAccountEmail(authUser.email);
    }
  }, [authLoading, authUser, serverSession]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading || !authUser) return;

    const unsubscribeSave = subscribeToCommanderSave(
      authUser.uid,
      (save) => {
        if (!save || cancelled) return;
        setCastleLevel((prev) => Math.max(prev, save.castleLevel));
        if (save.allianceTag) {
          setClan((prev) => ({ ...prev, tag: save.allianceTag || prev.tag }));
        }
      },
      (err) => {
        if (!cancelled && err.message.includes('Quota exceeded')) {
          setToastMessage('Daily storage quota exceeded. Free tier quota resets tomorrow.');
        }
      }
    );

    const loadAuthenticatedProfile = async () => {
      const token = await getFreshIdToken();
      if (!token || cancelled) return;
      try {
        const [profileRes, saveRes] = await Promise.all([
          authorizedFetch('/api/db/profile'),
          authorizedFetch('/api/db/save'),
        ]);

        if (profileRes.ok && !cancelled) {
          const data = (await profileRes.json()) as {
            ok?: boolean;
            user?: { email?: string };
            profile?: { castleLevel?: number; allianceTag?: string } | null;
          };
          if (data.user?.email && !cancelled) {
            setActiveAccountEmail(data.user.email);
          }
          if (data.profile && typeof data.profile.castleLevel === 'number' && !cancelled) {
            setCastleLevel((prev) => Math.max(prev, data.profile?.castleLevel ?? prev));
          }
          if (data.profile?.allianceTag && !cancelled) {
            setClan((prev) => ({ ...prev, tag: data.profile?.allianceTag || prev.tag }));
          }
        }

        if (saveRes.ok && !cancelled) {
          const saveData = (await saveRes.json()) as {
            ok?: boolean;
            exists?: boolean;
            snapshot?: { castleLevel?: number; allianceTag?: string } | null;
          };
          if (
            saveData.exists &&
            saveData.snapshot &&
            typeof saveData.snapshot.castleLevel === 'number' &&
            !cancelled
          ) {
            setCastleLevel((prev) => Math.max(prev, saveData.snapshot?.castleLevel ?? prev));
          }
          if (saveData.exists && saveData.snapshot?.allianceTag && !cancelled) {
            setClan((prev) => ({ ...prev, tag: saveData.snapshot?.allianceTag || prev.tag }));
          }
        }
      } catch (err) {
        console.error('Failed to load authenticated profile:', err);
      }
    };

    loadAuthenticatedProfile();
    return () => {
      cancelled = true;
      unsubscribeSave();
    };
  }, [authLoading, authUser, authorizedFetch, getFreshIdToken]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 3D WebGL Canvas Viewport */}
      <GameCanvas
        castleLevel={castleLevel}
        playerAppearance={playerAppearance}
        cultivationRealmIndex={
          vipEvaluation.tierConfig.perks.customAuraCrown &&
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
        targetPlatform={targetPlatform}
        hdPackMounted={hdPackMounted}
        onSelectMonster={(m) => {
          setSelectedMonster(m);
          setLoreCodexState((prev) => {
            const entry = buildDynamicMonsterCodexEntry(m);
            return unlockLoreCodexEntry({
              currentState: prev,
              entry,
              discoveredVia: 'monster_encounter',
            }).updatedState;
          });
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
          setHudPlayerCoords((prev) => {
            if (Math.hypot(x - prev.x, z - prev.z) >= 0.8) {
              return { x, z };
            }
            return prev;
          });
          const dx = x - lastCodexEvalPosRef.current.x;
          const dz = z - lastCodexEvalPosRef.current.z;
          if (dx * dx + dz * dz >= 4) {
            lastCodexEvalPosRef.current = { x, z };
            const discovery = evaluateOpenWorldLoreDiscovery({
              currentState: loreCodexState,
              playerX: x,
              playerZ: z,
              monsters,
            });
            if (discovery.newlyDiscoveredEntries.length > 0) {
              setLoreCodexState(discovery.updatedState);
              const firstNew = discovery.newlyDiscoveredEntries[0];
              setToastMessage(
                `🧭 Lore Codex Auto-Populated: ${firstNew.icon} ${firstNew.title} (${firstNew.kind === 'biome' ? 'New Biome Visited' : 'New Monster Discovered'})!`
              );
            } else if (
              discovery.updatedState.lastVisitedBiomeId !== loreCodexState.lastVisitedBiomeId
            ) {
              setLoreCodexState(discovery.updatedState);
            }
          }
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
        flightPermission={godFlightPermission}
        isFlying={isFlying && godFlightPermission.allowed}
        flightTargetAltitude={flightAltitude}
        onFlightAltitudeChange={(alt) => setFlightAltitude(alt)}
        onToggleFlight={handleToggleFlight}
        teleportPermission={godTeleportPermission}
        teleportCommand={teleportCommand}
        onForwardBlink={(facingRad) => handleForwardBlink(facingRad)}
        onShiftClickTeleport={(x, y, z) => handleTeleportToCoordinates(x, y, z)}
        fetchedBoundaryKeys={fetchedBoundaryKeys}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          data-testid="app-toast-notification"
          className={`absolute top-4 left-1/2 -translate-x-1/2 ${activeModal ? 'z-[45]' : 'z-[60]'} px-5 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-amber-500/60 shadow-2xl text-xs sm:text-sm font-semibold text-amber-200 animate-in fade-in slide-in-from-top-4 duration-200 max-w-lg text-center pointer-events-none`}
        >
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
          onOpenDailyMissions={() => setActiveModal('daily_missions')}
          claimableDailyMissionsCount={claimableDailyMissionsCount}
          onOpenVipSubscription={() => setActiveModal('vip_subscription')}
          vipBadgeLabel={vipEvaluation.tierConfig.badgeLabel}
          canClaimVipStipend={vipEvaluation.canClaimDailyStipend}
          onOpenAdminConsole={() => setActiveModal('admin_console')}
          onOpenLoreHistory={() => setActiveModal('lore_history')}
          onOpenCosmologicalAdmin={() => setActiveModal('cosmological_admin')}
          onOpenGmail={() => setActiveModal('gmail')}
          onOpenEula={() => setActiveModal('eula')}
          onOpenMarketplace={() => setActiveModal('marketplace')}
          authUserEmail={authUser?.email ?? null}
          authLoading={authLoading}
          isSyncingAccount={isSyncingAccount}
          authError={authError}
          onSignInGoogle={() => {
            void signInWithGoogle();
          }}
          onSignOutGoogle={() => {
            void signOutGoogle();
          }}
          onSyncAccount={() => {
            void handleSyncCloudAccount();
          }}
          onDismissAuthError={clearAuthError}
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
          onOpenLoreHistory={() => setActiveModal('lore_history')}
          onOpenCosmologicalAdmin={() => setActiveModal('cosmological_admin')}
          onOpenGmail={() => setActiveModal('gmail')}
          onOpenEula={() => setActiveModal('eula')}
          onOpenDailyLogin={() => setActiveModal('daily_login')}
          canClaimDailyLogin={dailyLoginEvaluation.canClaimToday}
          dailyStreakDays={dailyLoginEvaluation.currentStreak}
          veteranScrollsOwned={cultivation.veteranScrolls ?? 0}
          onOpenDailyMissions={() => setActiveModal('daily_missions')}
          claimableDailyMissionsCount={claimableDailyMissionsCount}
          dailyMissionsClaimedCount={dailyMissionsClaimedCount}
          dailyMissionsTotalCount={activeDailyMissionBoard.missions.length}
          onOpenVipSubscription={() => setActiveModal('vip_subscription')}
          vipBadgeLabel={vipEvaluation.tierConfig.badgeLabel}
          canClaimVipStipend={vipEvaluation.canClaimDailyStipend}
          vipLoyaltyLevel={vipEvaluation.vipLoyaltyLevel}
          graphicsQuality={graphicsQuality}
          onCycleGraphicsQuality={() => {
            const presets: Array<'ultra' | 'high' | 'balanced'> = ['ultra', 'high', 'balanced'];
            const next = presets[(presets.indexOf(graphicsQuality) + 1) % presets.length];
            setGraphicsQuality(next);
            const labels = {
              ultra:
                '✨ Graphics: NEXT-GEN ULTRA (4K BC7 Master Override + LOD 0 Hero Meshes + Hybrid Real-Time GI + Full Uber Shader)',
              high: '🎨 Graphics: HIGH (2K BC7 Master Override + LOD 0/1 Chain + Teyvat Stylized PBR + Soft Shadows)',
              balanced: '⚡ Graphics: BALANCED (60 FPS Direct Render Mode · 78K Poly)',
            };
            setToastMessage(labels[next]);
          }}
          targetPlatform={targetPlatform}
          onToggleTargetPlatform={() => {
            const nextPlatform = targetPlatform === 'pc_console' ? 'mobile' : 'pc_console';
            setTargetPlatform(nextPlatform);
            setToastMessage(
              nextPlatform === 'mobile'
                ? '📱 Platform Override: MOBILE (ASTC 1024px · LOD Bias +1 [Skips LOD 0] · Baked Lightmap · Small-Prop Shadow Culling · 640MB Base Build)'
                : '🖥️ Platform Override: PC / PS5 / Xbox (BC7 4K Master · LOD 0 Hero Meshes · Hybrid GI + Soft Shadows · Full Uber Shader)'
            );
          }}
          godmode={godmode}
          canFly={godFlightPermission.allowed}
          isFlying={isFlying && godFlightPermission.allowed}
          flightAltitude={flightAltitude}
          flightSpeedMultiplier={godFlightPermission.flightSpeedMultiplier}
          onToggleFlight={handleToggleFlight}
          onAdjustFlightAltitude={handleAdjustFlightAltitude}
          canTeleport={godTeleportPermission.allowed}
          onTeleportToWaypoint={handleTeleportToWaypoint}
          onForwardBlink={() => handleForwardBlink()}
          onTouchMove={(delta) => setTouchVector(delta)}
          onTouchEnd={() => setTouchVector({ x: 0, y: 0 })}
          onActionClick={handleHUDActionClick}
          playerX={hudPlayerCoords.x}
          playerZ={hudPlayerCoords.z}
          resourceNodes={resourceNodes}
          onSelectResourceNode={() => setActiveModal('resources')}
          boundaryStatus={currentBoundaryStatus}
          streamedChunkCount={streamedChunkCount}
          onFetchNewAreaData={handleFetchNewAreaData}
          isMarketplaceOpen={activeModal === 'marketplace'}
          onToggleMarketplace={() =>
            setActiveModal((prev) => (prev === 'marketplace' ? 'none' : 'marketplace'))
          }
          onOpenMarketplace={() =>
            setActiveModal((prev) => (prev === 'marketplace' ? 'none' : 'marketplace'))
          }
        />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {activeModal === 'castle' && (
          <CastleModal
            castleLevel={castleLevel}
            resources={resources}
            vipDiscountPct={vipEvaluation.tierConfig.perks.castleUpgradeDiscountPct}
            vipRallyBonusPct={vipEvaluation.tierConfig.perks.rallyCapacityBonusPct}
            vipBadgeLabel={vipEvaluation.tierConfig.badgeLabel}
            onUpgradeCastle={handleUpgradeCastle}
            onOpenMarketplace={() => setActiveModal('marketplace')}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'marketplace' && (
          <MarketplaceModal
            resources={resources}
            npcs={npcs}
            isGodImmune={godImmunity.immuneToAllThings}
            activeAccountEmail={activeAccountEmail}
            playerName={playerAppearance.name}
            veteranScrollsOwned={cultivation.veteranScrolls ?? 0}
            spiritStonesOwned={cultivation.spiritStones ?? 0n}
            onExecuteNPCTrade={handleExecuteNPCTrade}
            onExecuteBulkExchange={handleExecuteBulkExchange}
            onPurchaseCurioItem={handlePurchaseCurioItem}
            onExecuteP2PTrade={handleExecuteP2PTrade}
            onExecuteArbitrageTrade={handleExecuteArbitrageTrade}
            onNotifyToast={(msg) => setToastMessage(msg)}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'troops' && (
          <TroopBarracksModal
            troops={troops}
            resources={resources}
            castleLevel={castleLevel}
            maxCapacity={maxTroopCapacity}
            vipSpeedBonusPct={vipEvaluation.tierConfig.perks.gatherSpeedBonusPct}
            vipState={vipState}
            vipEffectiveDateKey={vipEffectiveDateKey}
            zeroResourceCost={godImmunity.immuneToAllThings}
            onOpenVipSubscription={() => setActiveModal('vip_subscription')}
            onTrainTroops={handleTrainTroops}
            onPromoteTroops={handlePromoteTroops}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'character' && (
          <CharacterCreationModal
            currentAppearance={playerAppearance}
            activeAccountEmail={activeAccountEmail}
            onSaveAppearance={(app) => {
              setPlayerAppearance(app);
              const spec = getSpeciesSpec(app.species);
              setToastMessage(
                `${spec.icon} Lord Avatar Locked: [${app.clanTag}] ${app.name} (${spec.name})`
              );
            }}
            onRequestSpeciesPermissionTicket={(requestedSpecies) => {
              const spec = getSpeciesSpec(requestedSpecies);
              const res = createContactTicket({
                tickets: supportTickets,
                category: 'administration',
                senderName: playerAppearance.name,
                senderEmail: activeAccountEmail,
                subject: `[SPECIES REBIRTH] Request to switch to ${spec.name}`,
                message: `Lord ${playerAppearance.name} requests Admin Permission (${PRIMARY_ADMIN_EMAIL}) to switch species from ${getSpeciesSpec(playerAppearance.species).name} to ${spec.name} (${spec.chineseName}).`,
                priority: 'high',
              });
              if (res.success) {
                setSupportTickets(res.updatedTickets);
                setToastMessage(
                  `📩 Species Rebirth Permission Request sent to Admin (${PRIMARY_ADMIN_EMAIL})`
                );
              }
            }}
            onOpenAdminConsole={() => setActiveModal('admin_console')}
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
            onSelectHeroSkin={handleSelectHeroSkin}
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
            vipRallyBonusPct={vipEvaluation.tierConfig.perks.rallyCapacityBonusPct}
            onVictoryLoot={handleVictoryLoot}
            onCasualties={handleCasualties}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'resources' && (
          <ResourceGatherModal
            nodes={resourceNodes}
            weather={weather}
            maxGatherMarches={1 + vipEvaluation.tierConfig.perks.extraMarchQueues}
            vipBadgeLabel={vipEvaluation.tierConfig.badgeLabel}
            onOpenVipSubscription={() => setActiveModal('vip_subscription')}
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
          <CppArchitectureModal
            targetPlatform={targetPlatform}
            graphicsQuality={graphicsQuality}
            hdPackMounted={hdPackMounted}
            onChangeTargetPlatform={(plat) => {
              setTargetPlatform(plat);
              setToastMessage(
                plat === 'mobile'
                  ? '📱 Platform Override: MOBILE (ASTC Compression · LOD Bias +1 [Skips LOD 0] · Baked Lightmap · Small-Prop Shadow Culling)'
                  : '🖥️ Platform Override: PC / PS5 / Xbox (BC7 4K Master · LOD 0 Hero Meshes · Hybrid GI · Full Uber Shader)'
              );
            }}
            onChangeGraphicsQuality={(q) => setGraphicsQuality(q)}
            onToggleHdPackMounted={() => {
              const nextHd = !hdPackMounted;
              setHdPackMounted(nextHd);
              setToastMessage(
                nextHd
                  ? '📦 Addressable Bundle: Mounted HighDefinition_4K_LOD0_Pack (+3.85 GB) for Mobile!'
                  : '📦 Addressable Bundle: Unmounted HighDefinition Pack — Reverted to 640 MB Base Mobile Build!'
              );
            }}
            onClose={() => setActiveModal('none')}
          />
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
            activeAccountEmail={activeAccountEmail}
            onChangeAccountEmail={(email) => {
              setActiveAccountEmail(email);
              const isRoot = isPrimaryAdminAccount(email);
              setGodmode(isRoot);
              if (!isRoot) {
                setIsFlying(false);
              }
              setToastMessage(
                isRoot
                  ? `👑 Active Session Bound to Root Creator (${email}) · Godmode Immunity & Sovereign Flight: ACTIVE`
                  : `🛡️ Active Session Bound to: ${email} · Creator Godmode & Flight Disabled`
              );
            }}
            moderatedPlayers={moderatedPlayers}
            onUpdateModeratedPlayers={(updated) => setModeratedPlayers(updated)}
            supportTickets={supportTickets}
            onUpdateSupportTickets={(updated) => setSupportTickets(updated)}
            onBroadcastSystemMessage={(msg, tag) => {
              handleSendClanChat(msg, true, tag);
              setToastMessage(`📢 ${msg}`);
            }}
            playerAppearance={playerAppearance}
            onUpdatePlayerAppearance={(updated) => {
              setPlayerAppearance(updated);
              const spec = getSpeciesSpec(updated.species);
              setToastMessage(
                `⚖️ [Admin Species Governance] ${spec.icon} ${spec.name} · Switch Approved: ${updated.adminSpeciesSwitchApproved ? 'YES' : 'NO'}`
              );
            }}
            omniverseRoster={omniverseRoster}
            onExecuteOmniverseCommand={handleExecuteOmniverseCommand}
            onExecuteWhitePageDecree={handleExecuteWhitePageDecree}
            onOpenOmniverseDirector={() => {
              setWorldAiInitialTab('omniverse');
              setActiveModal('world_ai');
            }}
            onOpenCosmologicalAdmin={() => setActiveModal('cosmological_admin')}
            godImmunity={godImmunity}
            onActivateMaxGodCharacter={handleActivateMaxGodCharacter}
            flightPermission={godFlightPermission}
            isFlying={isFlying && godFlightPermission.allowed}
            flightAltitude={flightAltitude}
            onToggleFlight={handleToggleFlight}
            onSetFlightAltitude={handleSetFlightAltitude}
            teleportPermission={godTeleportPermission}
            onTeleportToWaypoint={handleTeleportToWaypoint}
            onTeleportToCoordinates={handleTeleportToCoordinates}
            onForwardBlink={() => handleForwardBlink()}
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
            vipState={vipState}
            vipEffectiveDateKey={vipEffectiveDateKey}
            onOpenVipSubscription={() => setActiveModal('vip_subscription')}
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
            isGodImmune={godImmunity.immuneToAllThings}
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
            omniverseRoster={omniverseRoster}
            activeAccountEmail={activeAccountEmail}
            initialTab={worldAiInitialTab}
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
            onExecuteOmniverseCommand={handleExecuteOmniverseCommand}
            onExecuteWhitePageDecree={handleExecuteWhitePageDecree}
            onOpenAdminConsole={() => setActiveModal('admin_console')}
            cosmologicalTree={cosmologicalTree}
            onUpdateCosmologicalTree={(nextTree) => setCosmologicalTree(nextTree)}
            onOpenCosmologicalAdmin={() => setActiveModal('cosmological_admin')}
            onClose={() => {
              setWorldAiInitialTab('npcs');
              setActiveModal('none');
            }}
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

        {activeModal === 'daily_missions' && (
          <DailyMissionModal
            board={activeDailyMissionBoard}
            resources={resources}
            cultivation={cultivation}
            bypassRerollCost={godImmunity.immuneToAllThings}
            onAdvanceMission={handleAdvanceDailyMission}
            onClaimMission={handleClaimDailyMission}
            onClaimMilestone={handleClaimDailyMissionMilestone}
            onClaimAllReady={handleClaimAllDailyMissions}
            onRefreshBoard={handleRefreshDailyMissionBoard}
            onAdvanceSimulatedDay={handleAdvanceSimulatedDay}
            onNavigateToModal={handleNavigateFromDailyMission}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'vip_subscription' && (
          <VipSubscriptionModal
            vipState={vipState}
            evaluation={vipEvaluation}
            playerDiamonds={resources.diamond}
            onActivateTier={handleActivateVipTier}
            onClaimDailyStipend={handleClaimVipStipend}
            onAdvanceSimulatedVipDay={handleAdvanceSimulatedVipDay}
            onToggleAutoRenew={handleToggleVipAutoRenew}
            onCancelSubscription={handleCancelVipSubscription}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'lore_history' && (
          <LoreHistoryModal
            comprehendedEpochIds={comprehendedEpochIds}
            onComprehendEpoch={handleComprehendLoreEpoch}
            loreCodexState={loreCodexState}
            monsters={monsters}
            onScoutDiscoverCodexEntry={handleScoutDiscoverCodexEntry}
            onClaimCodexBounty={handleClaimCodexBounty}
            onOpenOmniverseMatrix={() => {
              setWorldAiInitialTab('omniverse');
              setActiveModal('world_ai');
            }}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'cosmological_admin' && (
          <CosmologicalAdminModal
            cosmologicalTree={cosmologicalTree}
            onUpdateCosmologicalTree={(nextTree) => setCosmologicalTree(nextTree)}
            omniverseRoster={omniverseRoster}
            activeAccountEmail={activeAccountEmail}
            onNotify={(msg) => setToastMessage(msg)}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'gmail' && (
          <GmailModal
            commanderName={playerAppearance.name || 'Sovereign Vanguard'}
            castleLevel={castleLevel}
            allianceTag={clan.tag || 'SOL'}
            activeAccountEmail={activeAccountEmail}
            onClose={() => setActiveModal('none')}
          />
        )}

        {activeModal === 'eula' && (
          <EulaModal
            eulaState={eulaState}
            activeAccountEmail={activeAccountEmail}
            onAcceptEula={() => {
              const next = acceptEulaVersion(activeAccountEmail);
              setEulaState(next);
              try {
                window.localStorage.setItem(EULA_STORAGE_KEY, JSON.stringify(next));
              } catch {
                // ignore storage write errors
              }
              sound.playUpgradeFanfare();
              setToastMessage(`📜 EULA Accepted (${next.receiptHash}) for ${next.acceptedByEmail}`);
            }}
            onRevokeEula={() => {
              const next = revokeEulaAcceptance(activeAccountEmail);
              setEulaState(next);
              try {
                window.localStorage.setItem(EULA_STORAGE_KEY, JSON.stringify(next));
              } catch {
                // ignore storage write errors
              }
              setToastMessage('⚠️ EULA Acceptance Reset — Review & Accept EULA');
            }}
            onClose={() => setActiveModal('none')}
          />
        )}
      </Suspense>
    </div>
  );
}
