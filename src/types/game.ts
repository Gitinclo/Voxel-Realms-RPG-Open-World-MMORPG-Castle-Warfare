/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TroopType = 'shieldbearer' | 'shooter' | 'bomber';

export type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

export type ResourceType = 'wood' | 'steel' | 'copper' | 'diamond' | 'grain' | 'oil';

export interface TroopTierInfo {
  tier: number; // 1 to 20
  type: TroopType;
  name: string;
  attack: bigint;
  defense: bigint;
  hp: bigint;
  speed: number;
  woodCost: bigint;
  steelCost: bigint;
  copperCost: bigint;
  grainCost: bigint;
  oilCost: bigint;
  diamondCost: bigint;
  powerPerUnit: bigint;
  description: string;
}

export interface CharacterAppearance {
  name: string;
  title: string;
  gender: 'male' | 'female' | 'warlord';
  skinColor: string;
  hairStyle: 'spiky' | 'knight' | 'mohawk' | 'dreadlocks' | 'sorcerer' | 'braided';
  hairColor: string;
  eyeColor: string;
  armorTier: number; // 1 - 20
  armorColor: string;
  weaponType: 'broadsword' | 'crossbow' | 'siege_mortar' | 'arcane_halberd';
  capeColor: string;
  hasCape: boolean;
  clanTag: string;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  rarity: HeroRarity;
  level: number;
  star: number;
  power: bigint;
  avatarIcon: string;
  troopSpecialty: TroopType;
  statBonus: {
    attackBonusPct: number;
    defenseBonusPct: number;
    hpBonusPct: number;
    rallyBonusPct: number;
  };
  skillName: string;
  skillDesc: string;
}

export interface ResourceNode {
  id: string;
  type: ResourceType;
  level: number; // 1 to 10
  x: number;
  z: number;
  totalCapacity: bigint;
  remainingCapacity: bigint;
  gatherRatePerSec: bigint;
  assignedTroops: bigint;
  gatheringLord?: string;
}

export type MonsterAIBehaviorState =
  | 'patrolling'
  | 'stalking_player'
  | 'flanking_march'
  | 'attack_windup'
  | 'siphoning_node'
  | 'seeking_shelter'
  | 'enraged_berserk'
  | 'clashing_guard';

export type MonsterMovementPolicy =
  | 'pack_swarmer'
  | 'shielded_charger'
  | 'flanking_orbiter'
  | 'blink_intercepter'
  | 'supreme_arbiter';

export type MonsterComplexityBracketId =
  | 'bracket_1_feral'
  | 'bracket_2_tactical'
  | 'bracket_3_sovereign'
  | 'bracket_4_abyssal'
  | 'bracket_5_apex_titan';

export interface MonsterAttackPattern {
  id: string;
  name: string;
  type:
    'melee_cleave' | 'ranged_barrage' | 'aoe_slam' | 'cone_breath' | 'void_rift' | 'omni_cataclysm';
  windupSeconds: number;
  damageMultiplier: number;
  aoeRadius: number;
  statusEffect: string;
  counterTroop: TroopType;
  description: string;
}

export interface MonsterEnvInteraction {
  trigger:
    | 'weather_storm'
    | 'weather_rain'
    | 'weather_snow'
    | 'nightfall'
    | 'near_resource_node'
    | 'low_hp';
  actionName: string;
  effectDescription: string;
  buffStat: 'attack' | 'defense' | 'regen' | 'speed' | 'node_siphon';
  magnitudePct: number;
}

export interface WaypointCoord {
  x: number;
  z: number;
}

export interface MonsterTarget {
  id: string;
  name: string;
  level: number; // 1 to 1000
  tier: 'minion' | 'elite' | 'boss' | 'world_titan';
  hp: bigint;
  maxHp: bigint;
  attack: bigint;
  defense: bigint;
  x: number;
  z: number;
  homeX?: number;
  homeZ?: number;
  expReward: bigint;
  dropResources: Partial<Record<ResourceType, bigint>>;
  dropEquipmentChest?: string;
  isWorldBoss?: boolean;
  // Advanced Monster AI state
  aiState?: MonsterAIBehaviorState;
  movementPolicy?: MonsterMovementPolicy;
  complexityBracket?: MonsterComplexityBracketId;
  activeAttackPatternId?: string;
  telegraphProgress?: number; // 0 to 1 during windup
  pathWaypoints?: WaypointCoord[];
  targetNodeId?: string;
  activeEnvInteraction?: string;
  aggroRadius?: number;
}

export type NPCRole = 'elder' | 'blacksmith' | 'marshal' | 'merchant' | 'mystic' | 'guard';

export type NPCAIBehaviorState =
  | 'idle_sanctum'
  | 'patrolling_citadel'
  | 'gathering_resource'
  | 'forging_armaments'
  | 'caravan_trading'
  | 'evading_threat'
  | 'intercepting_monster'
  | 'combating_monster'
  | 'channeling_blessing'
  | 'offering_quest';

export type NPCDirective =
  'autonomous' | 'patrol_citadel' | 'gather_resources' | 'hunt_monsters' | 'escort_caravan';

export interface NPCTradeOffer {
  id: string;
  giveResource: ResourceType;
  giveAmount: bigint;
  receiveType: 'diamond' | 'wood' | 'steel' | 'grain' | 'oil' | 'copper';
  receiveAmount: bigint;
  label: string;
  stock: number;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  level: number; // 1 to 1000
  role: NPCRole;
  x: number;
  z: number;
  homeX?: number;
  homeZ?: number;
  dialogue: string[];
  activeQuest?: Quest;
  // Advanced NPC AI fields
  aiState?: NPCAIBehaviorState;
  directive?: NPCDirective;
  statusActionText?: string;
  pathWaypoints?: WaypointCoord[];
  targetEntityId?: string;
  gatheredStash?: Partial<Record<ResourceType, bigint>>;
  combatPower?: bigint;
  tradeOffers?: NPCTradeOffer[];
  specialtyBuffDesc?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  requiredLevel: number;
  targetType: 'defeat_monster' | 'gather_resource' | 'train_troops' | 'upgrade_castle';
  targetAmount: bigint;
  currentAmount: bigint;
  completed: boolean;
  claimed?: boolean;
  rewardExp: bigint;
  rewardDiamonds: bigint;
  rewardResources: Partial<Record<ResourceType, bigint>>;
}

export interface WorldAIEventLog {
  id: string;
  timestamp: number;
  actorName: string;
  actorType: 'npc' | 'monster';
  actorLevel: number;
  category: 'combat' | 'gathering' | 'quest' | 'environment' | 'pathfinding' | 'trade';
  message: string;
}

export type ClanRole = 'Leader' | 'Elder' | 'Elite' | 'Member' | 'Recruit';

export interface ClanEmblem {
  shape: 'shield' | 'diamond' | 'crest' | 'roundel' | 'banner' | 'octagon';
  primaryColor: string;
  secondaryColor: string;
  sigil:
    | 'dragon'
    | 'crown'
    | 'swords'
    | 'phoenix'
    | 'wolf'
    | 'lion'
    | 'skull'
    | 'lightning'
    | 'citadel'
    | 'gryphon';
  borderColor: string;
  borderStyle: 'gold_filigree' | 'runed_iron' | 'star_silver' | 'spiked_bronze';
}

export interface ClanPermissions {
  canDeclareWar: boolean;
  canTriggerBuffs: boolean;
  canWithdrawVault: boolean;
  canPromoteDemote: boolean;
  canKickMembers: boolean;
  canApproveJoin: boolean;
  canEditEmblem: boolean;
  canPostAnnouncements: boolean;
}

export interface ClanVault {
  wood: bigint;
  steel: bigint;
  copper: bigint;
  grain: bigint;
  oil: bigint;
  diamond: bigint;
  clanHonor: bigint;
}

export interface ClanBuff {
  id: string;
  name: string;
  desc: string;
  icon: string;
  durationSeconds: number;
  activeUntil?: number; // timestamp in ms
  costHonor: bigint;
  statBonus: {
    troopAttackPct?: number;
    troopDefensePct?: number;
    gatherSpeedPct?: number;
    marchSpeedPct?: number;
    bossDamagePct?: number;
  };
}

export interface ClanWarOutpost {
  id: string;
  name: string;
  controlledBy: 'player_clan' | 'enemy_clan' | 'neutral';
  defenseRating: bigint;
  pointsPerMinute: number;
  garrisonTroops: bigint;
}

export interface ClanWarState {
  id: string;
  opponentClan: {
    id: string;
    name: string;
    tag: string;
    level: number;
    emblem: ClanEmblem;
    totalPower: bigint;
  };
  phase: 'preparation' | 'battle' | 'victory' | 'defeat';
  playerClanScore: number;
  opponentClanScore: number;
  timeRemainingSec: number;
  outposts: ClanWarOutpost[];
}

export interface ClanCoopBoss {
  id: string;
  name: string;
  title: string;
  level: number;
  hp: bigint;
  maxHp: bigint;
  avatar: string;
  activeUntil: number;
  rewardChests: { milestonePct: number; claimed: boolean; diamonds: bigint; honor: bigint }[];
  totalClanContributions: { memberName: string; damage: bigint }[];
}

export interface ClanChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: ClanRole;
  senderAvatar: string;
  message: string;
  timestamp: number;
  isSystemNotice?: boolean;
  tag?: string;
}

export interface ClanLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  tag: string;
  level: number;
  emblem: ClanEmblem;
  leader: string;
  memberCount: number;
  maxMembers: number;
  totalPower: bigint;
  territoryOutposts: number;
  warsWon: number;
  isPlayerClan?: boolean;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  level: number;
  leader: string;
  memberCount: number;
  maxMembers: number;
  totalPower: bigint;
  donationsToday: bigint;
  minCastleLevel: number;
  joinPolicy: 'open' | 'approval' | 'closed';
  emblem: ClanEmblem;
  techLevel: {
    troopAttack: number;
    troopDefense: number;
    gatherSpeed: number;
    rallyCapacity: number;
  };
  motto: string;
  bannerColor: string;
  vault: ClanVault;
  activeBuffs: ClanBuff[];
  activeWar: ClanWarState | null;
  coopBoss: ClanCoopBoss;
  warsWon: number;
}

export interface ClanMember {
  id: string;
  name: string;
  role: ClanRole;
  power: bigint;
  donations: bigint;
  online: boolean;
  avatar: string;
  castleLevel: number;
  joinedDaysAgo: number;
}

export interface ActiveRally {
  id: string;
  targetMonsterId: string;
  targetMonsterName: string;
  targetMonsterLevel: number;
  rallyCreator: string;
  currentTroops: bigint;
  maxRallyCapacity: bigint; // Up to 1 Trillion
  timeLeftSeconds: number;
  contributors: {
    lordName: string;
    troops: bigint;
    troopType: TroopType;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  clanTag: string;
  power: bigint;
  castleLevel: number;
  troopsTotal: bigint;
  monstersSlain: number;
  isPlayer?: boolean;
}

export interface GameResources {
  wood: bigint;
  steel: bigint;
  copper: bigint;
  diamond: bigint;
  grain: bigint;
  oil: bigint;
}

export interface PlayerTroopRoster {
  [key: string]: bigint; // e.g. "shieldbearer_t1": 10000n
}
