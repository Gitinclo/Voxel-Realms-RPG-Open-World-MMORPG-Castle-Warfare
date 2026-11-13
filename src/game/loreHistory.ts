/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRIMARY_ADMIN_EMAIL } from './adminModeration';
import { SIX_LAYER_COSMIC_HIERARCHY, OMNIVERSE_TIER_METADATA } from './omniverse';
import { CHARACTER_SPECIES_CATALOG } from './species';
import { MonsterTarget } from '../types/game';

export type LoreCategoryId =
  | 'cosmology'
  | 'omniverse_envoys'
  | 'playable_species'
  | 'cultivation_dao'
  | 'citadel_warfare'
  | 'architect_convergence';

export interface LoreHistoricalEpoch {
  epochNumber: number; // 0 to 6
  id: string;
  eraCode: string;
  title: string;
  chineseTitle: string;
  chronologicalDateLabel: string;
  cosmicLayerAnchor: string;
  keyFigures: string[];
  summary: string;
  chronicleScrollText: string[];
  comprehensionRewardDiamonds: bigint;
  comprehensionRewardFragments: number;
  icon: string;
  accentColor: string;
}

export interface LoreCompendiumArticle {
  id: string;
  category: LoreCategoryId;
  title: string;
  subtitle: string;
  inscribedBy: string;
  summary: string;
  keyTenets: string[];
  icon: string;
}

/**
 * ============================================================================
 * GOOGOL-SCALE (10^100 WORDS MINIMUM) AKASHIC LORE & HISTORY ARCHIVE ENGINE
 * ============================================================================
 * Because 10^100 (1 Googol) words exceeds the ~10^80 atoms in the observable
 * physical universe, the Akashic Lore Corpus is modeled via deterministic
 * seed-driven lazy pagination across 10^97 Volumes × 1,000 Words/Volume
 * (= 10^100 Words Minimum), rooted in Layer 6: The White Page / The House of Ideas.
 */
export const GOOGOL_LORE_WORD_EXPONENT = 100 as const;

export interface GoogolLoreArchiveSpec {
  id: 'THE_WHITE_PAGE_GOOGOL_AKASHIC_CORPUS';
  minimumWordCountScientific: '10^100';
  minimumWordCountExponent: 100;
  minimumWordCountName: 'One Googol Words Minimum (10^100)';
  totalVolumesScientific: '10^97';
  wordsPerVolume: 1000;
  authorEmail: typeof PRIMARY_ADMIN_EMAIL;
  generatorSeed: string;
}

export const GOOGOL_LORE_ARCHIVE_SPEC: GoogolLoreArchiveSpec = {
  id: 'THE_WHITE_PAGE_GOOGOL_AKASHIC_CORPUS',
  minimumWordCountScientific: '10^100',
  minimumWordCountExponent: GOOGOL_LORE_WORD_EXPONENT,
  minimumWordCountName: 'One Googol Words Minimum (10^100)',
  totalVolumesScientific: '10^97',
  wordsPerVolume: 1000,
  authorEmail: PRIMARY_ADMIN_EMAIL,
  generatorSeed: 'WHITE-PAGE-GOOGOL-10E100-AKASHIC-SEED',
};

export interface GoogolLoreScrollSlice {
  scrollId: string;
  exponentTier: number; // 0 to 100 (represents 10^exponentTier word coordinate)
  volumeCoordinateLabel: string;
  title: string;
  chineseSubtitle: string;
  cosmicLayerAnchor: string;
  authorEmail: string;
  modeledVolumeWordCount: number;
  cumulativeWordHorizonScientific: string;
  paragraphs: string[];
}

const GOOGOL_EPOCH_MOTIFS = [
  {
    titlePrefix: 'Annals of the Pre-Existential White Page',
    chinese: '太初白页无量真卷',
    anchor: 'Layer 6: The White Page / The House of Ideas',
    theme:
      'inscribing causality, Oblivion boundary axioms, and transfinite ink resonance before spacetime existed',
  },
  {
    titlePrefix: 'Chronicles of the 100 Bounded Overvoids',
    chinese: '百界超虚逻辑法典',
    anchor: 'Layer 5: The Overvoid / Exonverse (1..100)',
    theme:
      'partitioning non-Euclidean meta-logic, paraconsistent Dao laws, and 100 distinct Omniversal thrones',
  },
  {
    titlePrefix: 'Akashic Records of the Infinite Omniverses',
    chinese: '无尽全能宇宙史诗',
    anchor: 'Layer 4: Omniverse (InfiniteCollection<Omniverse>)',
    theme:
      'recording every past, present, and potential timeline of the Top 100 Fictional Species and their Level-1000 Envoys',
  },
  {
    titlePrefix: 'Hyperversal Brane & Multiversal Loom Scroll',
    chinese: '超维膜网与多元时间志',
    anchor: 'Layers 3 & 2: Megaverse / Hyperverse → Multiverse',
    theme:
      'weaving 26-dimensional Calabi-Yau manifolds and parallel/series quantum timeline branches',
  },
  {
    titlePrefix: 'Imperial Gazetteer of Solara Prime & The Four Paths',
    chinese: '索拉拉帝城与四途修真考',
    anchor: 'Layer 1: Universe (Solara Prime Continent)',
    theme:
      'chronicling the 10 Citadel Eras, T1–T20 Tri-Branch legions, Han Jue 100x Realm Suppression, and open-world biomes',
  },
] as const;

/**
 * Deterministically synthesizes a paginated slice of the 10^100-word Akashic Lore
 * & History Corpus for any exponent coordinate (0..100) and scroll offset without
 * unbounded loops or memory overflow.
 */
export function generateGoogolScaleLoreScrollSlice(params: {
  exponentTier: number;
  scrollOffset?: number;
  sliceCount?: number;
}): GoogolLoreScrollSlice[] {
  const clampedExponent = Math.max(0, Math.min(100, Math.floor(params.exponentTier)));
  const startOffset = Math.max(1, Math.floor(params.scrollOffset ?? 1));
  const count = Math.max(1, Math.min(12, Math.floor(params.sliceCount ?? 3)));

  const results: GoogolLoreScrollSlice[] = [];
  for (let i = 0; i < count; i++) {
    const scrollNum = startOffset + i;
    const motif = GOOGOL_EPOCH_MOTIFS[(clampedExponent + scrollNum) % GOOGOL_EPOCH_MOTIFS.length];
    const overvoidIndex = ((clampedExponent * 7 + scrollNum * 13) % 100) + 1;
    const overvoidCode = `OVERVOID-${String(overvoidIndex).padStart(3, '0')}`;
    const omniCode = `OMNI-${String(overvoidIndex).padStart(3, '0')}`;
    const universeCode = `U-${String(overvoidIndex).padStart(3, '0')}.${scrollNum}`;

    const paragraphs = [
      `[Googol Akashic Coordinate 10^${clampedExponent} · Scroll #${scrollNum}] Inscribed under the sovereign seal of ${PRIMARY_ADMIN_EMAIL} upon Layer 6 (The White Page / The House of Ideas), this volume preserves ${motif.theme} across ${overvoidCode} and ${omniCode}. Even absolute nothingness (Oblivion) remains anchored as a subordinate boundary condition beneath the White Page.`,
      `Within the ${universeCode} continuum of this scroll, cultivators of the Four Immortal Paths — Qi (练气), Body (炼体), Soul (炼魂), and Mind (炼心) — uphold the 100.0x Law of Realm Suppression across 23 Realms and 9 Layers while marshaling up to 1,000 Trillion (1,000T) T1–T20 troops across the 10 Citadel Eras.`,
      `By procedural seed "${GOOGOL_LORE_ARCHIVE_SPEC.generatorSeed}-EXP${clampedExponent}-S${scrollNum}", this 1,000-word canonical volume forms an immutable leaf of the 10^100-word (One Googol Words Minimum) Akashic History Stream, ensuring every biome expedition, monster encounter, and cosmic decree is eternally recorded without memory overflow.`,
    ];

    results.push({
      scrollId: `googol_scroll_10e${clampedExponent}_${scrollNum}`,
      exponentTier: clampedExponent,
      volumeCoordinateLabel: `10^${clampedExponent} · Vol. #${scrollNum.toLocaleString()}`,
      title: `${motif.titlePrefix} — Coordinate 10^${clampedExponent}.${scrollNum}`,
      chineseSubtitle: `${motif.chinese} · 第 10^${clampedExponent} 阶`,
      cosmicLayerAnchor: motif.anchor,
      authorEmail: PRIMARY_ADMIN_EMAIL,
      modeledVolumeWordCount: GOOGOL_LORE_ARCHIVE_SPEC.wordsPerVolume,
      cumulativeWordHorizonScientific: `10^${clampedExponent} / 10^100 Words`,
      paragraphs,
    });
  }

  return results;
}

/**
 * ============================================================================
 * OPEN-WORLD AUTO-POPULATING LORE CODEX (BIOMES & MONSTER BESTIARY)
 * ============================================================================
 */
export type LoreCodexEntryKind = 'biome' | 'monster';

export interface LoreCodexEntry {
  id: string;
  kind: LoreCodexEntryKind;
  targetId: string; // biomeId or monsterId
  title: string;
  chineseTitle: string;
  subtitle: string;
  icon: string;
  regionCoordinatesLabel: string;
  worldPosition: { x: number; z: number };
  dangerLevelLabel: string;
  elementalLeyline: string;
  tacticalNotes: string;
  loreParagraphs: string[];
  discoveryRewardDiamonds: bigint;
  discoveryRewardFragments: number;
}

export interface LoreCodexDiscoveryRecord {
  entryId: string;
  kind: LoreCodexEntryKind;
  discoveredAtTimestamp: number;
  discoveredVia: 'world_exploration' | 'monster_encounter' | 'expedition_scout' | 'initial_sanctum';
  rewardClaimed: boolean;
}

export interface PersistedLoreCodexState {
  discoveredRecords: Record<string, LoreCodexDiscoveryRecord>;
  lastVisitedBiomeId: string;
  totalDiscoveryEvents: number;
}

export const LORE_CODEX_STORAGE_KEY = 'voxel_realms_lore_codex_state_v1';

/**
 * Canonical Open-World Biomes of Solara Prime (Layer 1 Universe).
 * Auto-populated as the player traverses coordinates (x, z) in the 3D world.
 */
export const OPEN_WORLD_BIOME_CODEX_CATALOG: LoreCodexEntry[] = [
  {
    id: 'codex_biome_solara_citadel_sanctum',
    kind: 'biome',
    targetId: 'biome_solara_citadel_sanctum',
    title: 'Solara Imperial Citadel Sanctum',
    chineseTitle: '索拉拉帝城龙脉圣域',
    subtitle: 'Central Keep Heartlands & Dragon-Vein Convergence',
    icon: '🏰',
    regionCoordinatesLabel: 'Sector Origin [X: -11..+11, Z: -11..+19]',
    worldPosition: { x: 0, z: 12 },
    dangerLevelLabel: 'Sanctuary Zone (Citadel Aegis Ward Active)',
    elementalLeyline: 'Imperial Sovereign Qi & Golden Core Resonance (+25% Cultivation Stability)',
    tacticalNotes:
      'Protected by A* pathfinding keep barriers and High Marshal Valerius’s garrison sentinels. Ideal for secluded cultivation and T1–T20 troop mobilization.',
    loreParagraphs: [
      'Raised atop the prime Dragon-Vein nexus of the Solara Universe (U-081.1-SOLARA-PRIME), the Solara Imperial Citadel Sanctum has evolved across ten architectural eras — from a humble Wooden Outpost to an Omnipotent Citadel capable of garrisoning 1,000 Trillion immortal soldiers.',
      'Beneath its runic paving stones lie the foundational array seals inscribed during Epoch III and Epoch V, channeling spiritual energy directly from Layer 6 (The White Page / The House of Ideas) to shield mortal and immortal Lords alike from encroaching abyssal rifts.',
      'Arch-Mage Eldrin, Captain Thorne, Gorim Forgehammer, Caravan Master Zane, and Sage Lin Xuan maintain their command posts along the outer courtyard causeways, dispatching autonomous patrols across the surrounding wilderness.',
    ],
    discoveryRewardDiamonds: 35_000n,
    discoveryRewardFragments: 8,
  },
  {
    id: 'codex_biome_verdant_emerald_plains',
    kind: 'biome',
    targetId: 'biome_verdant_emerald_plains',
    title: 'Verdant Emerald Plains & Whispering Bramble',
    chineseTitle: '翠微灵原·荆棘古林',
    subtitle: 'Northwestern Timber Groves & Spirit-Grain Steppe',
    icon: '🌿',
    regionCoordinatesLabel: 'Northwestern Quadrant [X: -24..-10, Z: -22..+4]',
    worldPosition: { x: -16, z: -12 },
    dangerLevelLabel: 'Bracket 1 — Feral Frontier (Lv. 1–50)',
    elementalLeyline: 'Wood & Spirit-Grain Leyline (+30% Rain Harvest Yield)',
    tacticalNotes:
      'Rich in Level 4–7 Wood and Grain resource nodes. Roaming Wild Bramble Stalkers siphon unguarded timber veins; deploy Shooters or Citadel Guards to secure gathering marches.',
    loreParagraphs: [
      'Stretching northwest from the Citadel moat, the Verdant Emerald Plains are carpeted in wind-swayed spirit grass and ancient iron-bark groves irrigated by celestial rainstorms.',
      'During the First Immortal Millennium, Sylvan High Elves and Daoist herbalists cultivated these fertile steppes to supply medicinal spirit herbs for Qi Condensation and Foundation Establishment alchemy pills.',
      'Though peaceful by daylight, feral plant-spirits and bramble stalkers awaken whenever spiritual rain saturates the soil, siphoning timber nodes to regenerate their thorny carapaces.',
    ],
    discoveryRewardDiamonds: 45_000n,
    discoveryRewardFragments: 10,
  },
  {
    id: 'codex_biome_eastern_iron_outcrops',
    kind: 'biome',
    targetId: 'biome_eastern_iron_outcrops',
    title: 'Eastern Runic Iron & Goblin Badlands',
    chineseTitle: '东境玄铁矿脉·哥布林荒原',
    subtitle: 'Meteoritic Steel Crags & Ambush Ravines',
    icon: '⛰️',
    regionCoordinatesLabel: 'Northeastern Quadrant [X: +12..+26, Z: -20..+4]',
    worldPosition: { x: 20, z: -10 },
    dangerLevelLabel: 'Bracket 1–2 — Pack Ambush Zone (Lv. 10–120)',
    elementalLeyline: 'Metallic Damascus & Meteoric Iron Vein (+25% Steel Smelting)',
    tacticalNotes:
      'Contains high-grade Lv. 6 Steel Outcrops prospected by Gorim Forgehammer. Forest Goblin Clans execute pack-howl ambushes along the ridge — counter with frontline Shieldbearers.',
    loreParagraphs: [
      'Formed when fragments of a shattered Hyperversal war-forge rained upon Solara during Epoch Ω-II, the Eastern Runic Iron Outcrops gleam with natural Damascus steel strata.',
      'Master Runic Armorer Gorim Forgehammer leads daily smelting expeditions into these crags, extracting high-purity ore to plate T10–T20 siege dreadnoughts.',
      'Marauding Forest Goblin Clans have burrowed warrens beneath the iron ledges, using pack-swarmer tactics to harass unescorted resource caravans.',
    ],
    discoveryRewardDiamonds: 50_000n,
    discoveryRewardFragments: 10,
  },
  {
    id: 'codex_biome_southern_copper_highlands',
    kind: 'biome',
    targetId: 'biome_southern_copper_highlands',
    title: 'Southern Copper Terraces & Golem Quarry',
    chineseTitle: '南境赤铜高地·古神巨像遗迹',
    subtitle: 'Runic Monolith Quarry & Copper Leyline Basin',
    icon: '🪨',
    regionCoordinatesLabel: 'Southwestern Quadrant [X: -28..-10, Z: +8..+28]',
    worldPosition: { x: -20, z: 18 },
    dangerLevelLabel: 'Bracket 2 — Tactical Sentinel Zone (Lv. 51–200)',
    elementalLeyline: 'Earth & Conductive Copper Resonance (+30% Carapace Defense)',
    tacticalNotes:
      'Guarded by Lv. 75 Ancient Stone Golems that absorb copper veins to boost their armor. Dispatch Bomber artillery cohorts to shatter their stone plating.',
    loreParagraphs: [
      'Carved with geometric runes by the Crystalline Ancient Automatons and Ironforge Runic Dwarves in Epoch III, the Southern Copper Terraces hum with geomagnetic conductivity.',
      'Colossal Stone Golems left behind as quarry guardians still patrol the stepped basins, drawing metallic essence from Lv. 5 Copper Veins to repair any cracks in their granite hulls.',
      'Cultivators practicing the Body Path (炼体) frequently temper their bones and viscera against the gravitational pressure radiating from the quarry monoliths.',
    ],
    discoveryRewardDiamonds: 60_000n,
    discoveryRewardFragments: 12,
  },
  {
    id: 'codex_biome_scorched_magma_caldera',
    kind: 'biome',
    targetId: 'biome_scorched_magma_caldera',
    title: 'Scorched Magma Caldera & Diamond Rift',
    chineseTitle: '焚天熔岩火山·星钻裂谷',
    subtitle: 'Southeastern Volcanic Leylines & Crystalline Diamond Mines',
    icon: '🌋',
    regionCoordinatesLabel: 'Southeastern Quadrant [X: +12..+32, Z: +12..+32]',
    worldPosition: { x: 24, z: 24 },
    dangerLevelLabel: 'Bracket 3 — Sovereign Drake Domain (Lv. 201–500)',
    elementalLeyline: 'Solar Fire & High-Pressure Diamond Crystallization (+35% Flame ATK)',
    tacticalNotes:
      'Home to Lv. 8 Diamond Veins and the Lv. 240 Infernal Magma Drake. Use long-range Shooters in loose skirmish formation to kite magma breath cones.',
    loreParagraphs: [
      'In the southeastern reaches of Solara, subterranean dragon-fire erupts through basalt fissures, compressing ancient carbon beds into gleaming Level 8 Kingdom Diamond deposits.',
      'Caravan Master Zane’s armored silk-and-gem convoys brave these scorching causeways to trade timber and grain for raw diamonds.',
      'At the heart of the caldera lairs the Infernal Magma Drake, a Sovereign-bracket wyvern whose wings superheat the surrounding oil and diamond leylines.',
    ],
    discoveryRewardDiamonds: 75_000n,
    discoveryRewardFragments: 15,
  },
  {
    id: 'codex_biome_abyssal_void_chasm',
    kind: 'biome',
    targetId: 'biome_abyssal_void_chasm',
    title: 'Abyssal Chaos Chasm & Black-Gold Rift',
    chineseTitle: '深渊混沌裂隙·黑金灵泉',
    subtitle: 'Outer Dimensional Faults & High-Yield Oil Wells',
    icon: '🕳️',
    regionCoordinatesLabel: 'Outer Abyssal Rim [X: -34..+34, Z: -30..-20]',
    worldPosition: { x: -28, z: -26 },
    dangerLevelLabel: 'Bracket 4 — Abyssal Rift Zone (Lv. 501–800)',
    elementalLeyline: 'Abyssal Void & Tempest Oil Surge (+40% Storm Extraction)',
    tacticalNotes:
      'Contains Lv. 9 Oil Wells and the Lv. 650 Abyssal Chaos Wyrm. Beware blink-interception teleports and gravitational void implosion fields.',
    loreParagraphs: [
      'Where the spacetime membrane of Universe U-081.1 thins against the boundary of Layer 2 (Multiverse) and Layer 5 (The Overvoid), jagged purple-black chasms vent primordial abyssal energy.',
      'During electrical thunderstorms, these rifts surge with refined black-gold oil capable of fueling T20 siege artillery and orbital napalm salvos.',
      'Void Walkers and high-realm Soul Path cultivators study the chasm edges to comprehend spatial blink laws while warding off the Abyssal Chaos Wyrm.',
    ],
    discoveryRewardDiamonds: 95_000n,
    discoveryRewardFragments: 18,
  },
  {
    id: 'codex_biome_frozen_starfall_tundra',
    kind: 'biome',
    targetId: 'biome_frozen_starfall_tundra',
    title: 'Frozen Starfall Tundra & Ender Titan Crater',
    chineseTitle: '极北星陨冰原·终焉泰坦祭坛',
    subtitle: 'Northern Polar Crater & World Boss Battlefield',
    icon: '❄️',
    regionCoordinatesLabel: 'Northern Polar Apex [X: -15..+15, Z: -40..-28]',
    worldPosition: { x: 0, z: -34 },
    dangerLevelLabel: 'Bracket 5 — Apex World Titan Cataclysm (Lv. 801–1000)',
    elementalLeyline: 'Astral Frost & Nine-Heavens Starfall (+50% Diamond & Soul Sense)',
    tacticalNotes:
      'Sanctum of the Lv. 1000 Celestial Ender Titan [World Boss]. Requires coordinated 1-Trillion-troop rallies and Golden Core / Nascent Soul / Dao Creator suppression auras.',
    loreParagraphs: [
      'At the northernmost pole of Solara lies a miles-wide impact basin of vitrified star-ice where the Celestial Ender Titan descended during the War of the Nine Contested Sectors.',
      'Perpetual blizzards and aurora-lit starfall showers freeze shallow rivers into walkable navmesh causeways while crystallizing pure astral diamonds along the crater rim.',
      'Only Lords who have ascended through the Four Immortal Paths and marshaled multi-billion or trillion-scale T1–T20 legions dare march into the crater to challenge the Level 1000 World Titan.',
    ],
    discoveryRewardDiamonds: 125_000n,
    discoveryRewardFragments: 25,
  },
  {
    id: 'codex_biome_celestia_sky_archipelago',
    kind: 'biome',
    targetId: 'biome_celestia_sky_archipelago',
    title: 'Celestia Floating Sky Archipelago & Jade Ether',
    chineseTitle: '九天浮空仙岛·玉虚灵境',
    subtitle: 'High-Altitude Immortal Cloud Sanctuaries &Omniversal Envoy Conduits',
    icon: '☁️',
    regionCoordinatesLabel: 'Upper Firmament & Outer Horizon [Radius >= 32]',
    worldPosition: { x: 32, z: 0 },
    dangerLevelLabel: 'Immortal Ascension & Omniversal Projection Realm (Lv. 500–1000)',
    elementalLeyline: 'Nine-Heavens Pure Yang & Omniversal Envoy Conduit (+100% Dao Comprehension)',
    tacticalNotes:
      'Anchors the floating Celestia sky islands and the projection beacons for the 100 Level-1000 Omniversal Species Background NPCs under creatergame31@gmail.com.',
    loreParagraphs: [
      'Suspended high above the mortal clouds by inverted gravity crystals and golden waterfalls, the Celestia Floating Sky Archipelago bridges Layer 1 (Solara Universe) with the higher rungs of the 6-Tier Cosmological Tree.',
      'Here, the 100 Level-1000 Background NPC Envoys of the Top 100 Fictional Species — from Beyonders and Celestialsapiens to Time Lords, Saiyans, and Kryptonians — materialize when projected by Super Admin creatergame31@gmail.com.',
      'Cultivators who ascend to the Dao Creator and Ultimate Origin realms meditate upon these jade sky-pillars to gaze directly toward The White Page / The House of Ideas.',
    ],
    discoveryRewardDiamonds: 150_000n,
    discoveryRewardFragments: 30,
  },
];

/**
 * Canonical Open-World Monster Bestiary Codex Entries across all 5 AI Complexity Brackets.
 * Auto-populated when the player approaches, clicks, rallies against, or spawns monsters.
 */
export const OPEN_WORLD_MONSTER_CODEX_CATALOG: LoreCodexEntry[] = [
  {
    id: 'codex_monster_m_slime_1',
    kind: 'monster',
    targetId: 'm_slime_1',
    title: 'Wild Bramble Stalker (Lv. 1 · Minion)',
    chineseTitle: '荒野荆棘潜行兽 · 一阶妖灵',
    subtitle: 'Bracket 1 Feral Pack Swarmer · Verdant Emerald Plains',
    icon: '🌿',
    regionCoordinatesLabel: 'Home Coordinates [X: -18, Z: -16]',
    worldPosition: { x: -18, z: -16 },
    dangerLevelLabel: 'Level 1 · Minion (Bracket 1: Feral)',
    elementalLeyline: 'Wood Leyline Forager (Siphons Lv.4 Wood Nodes for +4% HP Regen)',
    tacticalNotes:
      'Executes basic pack-swarmer slashes. Easily suppressed by T1–T5 Shooters or Captain Thorne’s perimeter vanguard patrol.',
    loreParagraphs: [
      'Born from tangled spirit-briars saturated with ambient Qi along the northwestern timber groves, the Wild Bramble Stalker is the first autonomous creature encountered by fledgling Lords.',
      'Its rudimentary feral AI instincts drive it to forage unguarded timber nodes, weaving splintered bark into its thorny hide.',
      'Harvesting its core yields seasoned spirit-wood and grain rations essential for early Citadel palisade construction.',
    ],
    discoveryRewardDiamonds: 30_000n,
    discoveryRewardFragments: 6,
  },
  {
    id: 'codex_monster_m_goblin_12',
    kind: 'monster',
    targetId: 'm_goblin_12',
    title: 'Forest Goblin Clan (Lv. 12 · Minion)',
    chineseTitle: '幽林哥布林战族 · 十二阶妖群',
    subtitle: 'Bracket 1 Feral Pack Ambushers · Eastern Runic Iron Outcrops',
    icon: '👺',
    regionCoordinatesLabel: 'Home Coordinates [X: +18, Z: -14]',
    worldPosition: { x: 18, z: -14 },
    dangerLevelLabel: 'Level 12 · Minion (Bracket 1: Feral)',
    elementalLeyline: 'Scavenged Iron & War-Horn Resonance',
    tacticalNotes:
      'Uses Pack Howl telegraphs to coordinate multi-angle charges near the eastern Steel Outcrop. Counter with Shieldbearer phalanx walls.',
    loreParagraphs: [
      'Operating in noisy war-bands along the eastern iron ravines, the Forest Goblin Clan scavenges meteoric slag discarded from Gorim Forgehammer’s smelting camps.',
      'Their chieftains blow bone war-horns (`atk_pack_howl`) to rally nearby pack swarmers whenever supply caravans march toward the steel mines.',
      'Routing their warrens secures vital trade roads and recovers stolen grain and timber stockpiles.',
    ],
    discoveryRewardDiamonds: 40_000n,
    discoveryRewardFragments: 8,
  },
  {
    id: 'codex_monster_m_golem_75',
    kind: 'monster',
    targetId: 'm_golem_75',
    title: 'Ancient Stone Golem (Lv. 75 · Elite)',
    chineseTitle: '太古符文巨像 · 七十五阶精英',
    subtitle: 'Bracket 2 Tactical Shielded Charger · Southern Copper Highlands',
    icon: '🗿',
    regionCoordinatesLabel: 'Home Coordinates [X: -24, Z: +16]',
    worldPosition: { x: -24, z: 16 },
    dangerLevelLabel: 'Level 75 · Elite (Bracket 2: Tactical)',
    elementalLeyline: 'Geomagnetic Copper Absorption (+30% Carapace DEF)',
    tacticalNotes:
      'Executes `atk_seismic_slam` shockwaves and shielded bull-rushes. Vulnerable to Bomber siege artillery (`1.5x` Tri-Branch counter advantage).',
    loreParagraphs: [
      'Forged during the dawn of Epoch III by Ironforge Runic Dwarves and Crystalline Ancient Automatons, the Ancient Stone Golem was originally programmed to guard subterranean copper veins.',
      'Over millennia of exposure to wild leyline storms, its runic logic core drifted into autonomous defensive hostility, treating all approaching armies as quarry trespassers.',
      'Defeating this elite sentinel yields Gilded Titan Chests packed with refined steel, copper ingots, and raw diamonds.',
    ],
    discoveryRewardDiamonds: 65_000n,
    discoveryRewardFragments: 12,
  },
  {
    id: 'codex_monster_m_drake_240',
    kind: 'monster',
    targetId: 'm_drake_240',
    title: 'Infernal Magma Drake (Lv. 240 · Boss)',
    chineseTitle: '焚世熔岩魔龙 · 二百四十阶霸主',
    subtitle: 'Bracket 3 Sovereign Flanking Orbiter · Scorched Magma Caldera',
    icon: '🔥',
    regionCoordinatesLabel: 'Home Coordinates [X: +28, Z: +22]',
    worldPosition: { x: 28, z: 22 },
    dangerLevelLabel: 'Level 240 · Boss (Bracket 3: Sovereign)',
    elementalLeyline: 'Volcanic Diamond & Oil Leyline Superheating (+35% Fire ATK)',
    tacticalNotes:
      'Orbits targets in flanking arcs before unleashing `atk_infernal_cone` magma breath. Counter with high-tier Shooters and Rain weather rituals.',
    loreParagraphs: [
      'A degenerated offshoot of the ancient dragon bloodlines that nested in Solara’s southeastern volcanic caldera, the Infernal Magma Drake feeds upon liquid petroleum and crystallized diamond veins.',
      'Its Sovereign-tier AI calculates wide flanking trajectories around castle fortifications, attempting to incinerate rear-line Bomber batteries before they can unlimber.',
      'Slaying the Magma Drake unlocks the Infernal Dragonplate Coffer and frees the southeastern diamond mines for uninterrupted extraction.',
    ],
    discoveryRewardDiamonds: 90_000n,
    discoveryRewardFragments: 16,
  },
  {
    id: 'codex_monster_m_wyrm_650',
    kind: 'monster',
    targetId: 'm_wyrm_650',
    title: 'Abyssal Chaos Wyrm (Lv. 650 · Boss)',
    chineseTitle: '深渊混沌古龙 · 六百五十阶深渊主宰',
    subtitle: 'Bracket 4 Abyssal Blink Intercepter · Abyssal Chaos Chasm',
    icon: '🐉',
    regionCoordinatesLabel: 'Home Coordinates [X: -28, Z: -26]',
    worldPosition: { x: -28, z: -26 },
    dangerLevelLabel: 'Level 650 · Boss (Bracket 4: Abyssal)',
    elementalLeyline: 'Void Rift Beacon Projection (+40% Abyssal Power)',
    tacticalNotes:
      'Folds local spacetime to blink-intercept marching cohorts and channels `atk_void_implosion`. Requires Nascent Soul+ Realm Suppression and combined-arms T12+ legions.',
    loreParagraphs: [
      'Slithering through dimensional fractures between Layer 1 (Universe) and Layer 5 (The Overvoid), the Abyssal Chaos Wyrm is a winglessleviathan of anti-matter scales and gravity-warping horns.',
      'Wherever it coils, it projects a Void Rift Beacon that corrupts nearby resource veins and bends light into an event-horizon halo.',
      'Only Lords who have tempered their Soul and Mind paths against spatial distortion can lock onto its quantum signature and claim its Abyssal Relic Casket.',
    ],
    discoveryRewardDiamonds: 120_000n,
    discoveryRewardFragments: 22,
  },
  {
    id: 'codex_monster_m_titan_999',
    kind: 'monster',
    targetId: 'm_titan_999',
    title: 'Celestial Ender Titan [World Boss] (Lv. 1000)',
    chineseTitle: '九天终焉泰坦 · 千阶世界主宰',
    subtitle: 'Bracket 5 Apex World Titan · Frozen Starfall Tundra',
    icon: '👑',
    regionCoordinatesLabel: 'Home Coordinates [X: 0, Z: -34]',
    worldPosition: { x: 0, z: -34 },
    dangerLevelLabel: 'Level 1000 · World Titan (Bracket 5: Apex Titan)',
    elementalLeyline: 'Sovereign Tempest & Adaptive Nine-Heavens Starfall',
    tacticalNotes:
      '250,000,000 HP Apex World Boss with `supreme_arbiter` AI and `atk_celestial_starfall`. Assemble up to 1 Trillion (1T) troops in the World Boss Rally Modal to vanquish.',
    loreParagraphs: [
      'Towering above the northern polar crater in a corona of gold-and-violet starfire, the Level 1000 Celestial Ender Titan is the ultimate martial trial of the Solara Universe.',
      'Created during Epoch V as an autonomous arbiter to test whether mortal citadels were worthy of ascending into the Omniversal hierarchy, its multi-phase AI adapts dynamically to Shieldbearer, Shooter, and Bomber ratios.',
      'Shattering its 250M HP aegis rewards 50,000 Kingdom Diamonds, millions of war supplies, and the legendary Cosmic God-Slayer Cache.',
    ],
    discoveryRewardDiamonds: 200_000n,
    discoveryRewardFragments: 35,
  },
];

/**
 * Dynamically builds a LoreCodexEntry for any procedurally spawned Lv. 1–1000 monster
 * that is not already in the static OPEN_WORLD_MONSTER_CODEX_CATALOG.
 */
export function buildDynamicMonsterCodexEntry(monster: MonsterTarget): LoreCodexEntry {
  const existing = OPEN_WORLD_MONSTER_CODEX_CATALOG.find((e) => e.targetId === monster.id);
  if (existing) {
    return existing;
  }

  const iconByTier: Record<MonsterTarget['tier'], string> = {
    minion: '🐺',
    elite: '🗿',
    boss: '🐉',
    world_titan: '👑',
  };

  const bracket = monster.complexityBracket ?? 'bracket_1_feral';
  const policy = monster.movementPolicy ?? 'pack_swarmer';
  const pattern = monster.activeAttackPatternId ?? 'atk_feral_slash';
  const envInteraction = monster.activeEnvInteraction ?? 'Chaotic Leyline Rift Resonance';

  return {
    id: `codex_monster_${monster.id}`,
    kind: 'monster',
    targetId: monster.id,
    title: `${monster.name} (Lv. ${monster.level} · ${monster.tier.toUpperCase()})`,
    chineseTitle: `异界投影妖兽 · ${monster.level}阶`,
    subtitle: `${bracket.replace(/_/g, ' ').toUpperCase()} · Policy: ${policy}`,
    icon: iconByTier[monster.tier] || '👾',
    regionCoordinatesLabel: `Spawn Coordinates [X: ${Math.round(monster.x)}, Z: ${Math.round(monster.z)}]`,
    worldPosition: { x: monster.x, z: monster.z },
    dangerLevelLabel: `Level ${monster.level} · ${monster.tier.toUpperCase()} (${bracket})`,
    elementalLeyline: envInteraction,
    tacticalNotes: `HP: ${monster.maxHp.toLocaleString()} · ATK: ${monster.attack.toLocaleString()} · DEF: ${monster.defense.toLocaleString()} · Active Pattern: ${pattern}.`,
    loreParagraphs: [
      `Emerged from a dimensional leyline fluctuation at world coordinates [${Math.round(monster.x)}, ${Math.round(monster.z)}], this Level ${monster.level} ${monster.name} operates under the ${bracket} AI directive.`,
      `Observed by Arch-Mage Eldrin’s Arcane Observatory exhibiting "${policy}" kinematics and "${envInteraction}" environmental coupling.`,
      `Inscribed automatically into the Solara Bestiary Codex upon field encounter, contributing to the 10^100-word Akashic Lore Archive under ${PRIMARY_ADMIN_EMAIL}.`,
    ],
    discoveryRewardDiamonds: BigInt(Math.max(25_000, monster.level * 150)),
    discoveryRewardFragments: Math.max(5, Math.min(30, Math.ceil(monster.level / 40))),
  };
}

/**
 * Resolves the complete list of Lore Codex entries (all 8 canonical biomes +
 * all canonical and dynamically spawned open-world monsters).
 */
export function getCompleteLoreCodexCatalog(monsters: MonsterTarget[] = []): LoreCodexEntry[] {
  const monsterEntries = new Map<string, LoreCodexEntry>();
  for (const staticMonster of OPEN_WORLD_MONSTER_CODEX_CATALOG) {
    monsterEntries.set(staticMonster.targetId, staticMonster);
  }
  for (const liveMonster of monsters) {
    if (!monsterEntries.has(liveMonster.id)) {
      monsterEntries.set(liveMonster.id, buildDynamicMonsterCodexEntry(liveMonster));
    }
  }
  return [...OPEN_WORLD_BIOME_CODEX_CATALOG, ...Array.from(monsterEntries.values())];
}

/**
 * Deterministically maps any open-world coordinate (x, z) to its corresponding
 * Biome LoreCodexEntry so traversing the 3D world auto-populates the Lore Codex.
 */
export function resolveBiomeAtWorldPosition(x: number, z: number): LoreCodexEntry {
  const distFromOrigin = Math.hypot(x, z);

  // 1. High-altitude / outer rim Celestia Floating Sky Archipelago
  if (distFromOrigin >= 32) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[7];
  }
  // 2. Northern Polar Crater (Frozen Starfall Tundra)
  if (z <= -28) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[6];
  }
  // 3. Central Solara Imperial Citadel Sanctum
  if (x >= -11 && x <= 11 && z >= -11 && z <= 19) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[0];
  }
  // 4. Outer Abyssal Chaos Chasm
  if (distFromOrigin >= 25 && z < 0) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[5];
  }
  // 5. Quadrants
  if (x < 0 && z < 0) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[1]; // Verdant Emerald Plains
  }
  if (x >= 0 && z < 0) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[2]; // Eastern Runic Iron Outcrops
  }
  if (x < 0 && z >= 0) {
    return OPEN_WORLD_BIOME_CODEX_CATALOG[3]; // Southern Copper Highlands
  }
  return OPEN_WORLD_BIOME_CODEX_CATALOG[4]; // Scorched Magma Caldera
}

export const INITIAL_LORE_CODEX_STATE: PersistedLoreCodexState = {
  discoveredRecords: {
    codex_biome_solara_citadel_sanctum: {
      entryId: 'codex_biome_solara_citadel_sanctum',
      kind: 'biome',
      discoveredAtTimestamp: 1762387200000,
      discoveredVia: 'initial_sanctum',
      rewardClaimed: false,
    },
    codex_monster_m_slime_1: {
      entryId: 'codex_monster_m_slime_1',
      kind: 'monster',
      discoveredAtTimestamp: 1762387200000,
      discoveredVia: 'initial_sanctum',
      rewardClaimed: false,
    },
  },
  lastVisitedBiomeId: 'codex_biome_solara_citadel_sanctum',
  totalDiscoveryEvents: 2,
};

/**
 * Pure function that evaluates the player's current open-world position (x, z)
 * and nearby monsters, auto-populating any newly visited Biome or newly encountered
 * Monster in the Lore Codex state.
 */
export function evaluateOpenWorldLoreDiscovery(params: {
  currentState: PersistedLoreCodexState;
  playerX: number;
  playerZ: number;
  monsters: MonsterTarget[];
  monsterProximityRadius?: number;
  nowTimestamp?: number;
}): {
  updatedState: PersistedLoreCodexState;
  activeBiome: LoreCodexEntry;
  newlyDiscoveredEntries: LoreCodexEntry[];
} {
  const {
    currentState,
    playerX,
    playerZ,
    monsters,
    monsterProximityRadius = 16,
    nowTimestamp = Date.now(),
  } = params;

  const activeBiome = resolveBiomeAtWorldPosition(playerX, playerZ);
  const newlyDiscoveredEntries: LoreCodexEntry[] = [];
  let nextRecords = currentState.discoveredRecords;
  let mutated = false;

  // Check Biome discovery at (playerX, playerZ)
  if (!nextRecords[activeBiome.id]) {
    nextRecords = {
      ...nextRecords,
      [activeBiome.id]: {
        entryId: activeBiome.id,
        kind: 'biome',
        discoveredAtTimestamp: nowTimestamp,
        discoveredVia: 'world_exploration',
        rewardClaimed: false,
      },
    };
    newlyDiscoveredEntries.push(activeBiome);
    mutated = true;
  }

  // Check Monster proximity discovery
  for (const monster of monsters) {
    const dist = Math.hypot(playerX - monster.x, playerZ - monster.z);
    if (dist <= monsterProximityRadius) {
      const codexEntry = buildDynamicMonsterCodexEntry(monster);
      if (!nextRecords[codexEntry.id]) {
        nextRecords = {
          ...nextRecords,
          [codexEntry.id]: {
            entryId: codexEntry.id,
            kind: 'monster',
            discoveredAtTimestamp: nowTimestamp,
            discoveredVia: 'monster_encounter',
            rewardClaimed: false,
          },
        };
        newlyDiscoveredEntries.push(codexEntry);
        mutated = true;
      }
    }
  }

  if (!mutated && currentState.lastVisitedBiomeId === activeBiome.id) {
    return {
      updatedState: currentState,
      activeBiome,
      newlyDiscoveredEntries: [],
    };
  }

  return {
    updatedState: {
      discoveredRecords: nextRecords,
      lastVisitedBiomeId: activeBiome.id,
      totalDiscoveryEvents: currentState.totalDiscoveryEvents + newlyDiscoveredEntries.length,
    },
    activeBiome,
    newlyDiscoveredEntries,
  };
}

/**
 * Pure function to explicitly unlock/auto-populate a specific Biome or Monster
 * in the Lore Codex (e.g., when clicking/engaging/spawning a monster or scouting a biome).
 */
export function unlockLoreCodexEntry(params: {
  currentState: PersistedLoreCodexState;
  entry: LoreCodexEntry;
  discoveredVia?: LoreCodexDiscoveryRecord['discoveredVia'];
  nowTimestamp?: number;
}): {
  updatedState: PersistedLoreCodexState;
  newlyDiscovered: boolean;
  entry: LoreCodexEntry;
} {
  const {
    currentState,
    entry,
    discoveredVia = 'expedition_scout',
    nowTimestamp = Date.now(),
  } = params;

  if (currentState.discoveredRecords[entry.id]) {
    return {
      updatedState:
        entry.kind === 'biome' ? { ...currentState, lastVisitedBiomeId: entry.id } : currentState,
      newlyDiscovered: false,
      entry,
    };
  }

  return {
    updatedState: {
      discoveredRecords: {
        ...currentState.discoveredRecords,
        [entry.id]: {
          entryId: entry.id,
          kind: entry.kind,
          discoveredAtTimestamp: nowTimestamp,
          discoveredVia,
          rewardClaimed: false,
        },
      },
      lastVisitedBiomeId: entry.kind === 'biome' ? entry.id : currentState.lastVisitedBiomeId,
      totalDiscoveryEvents: currentState.totalDiscoveryEvents + 1,
    },
    newlyDiscovered: true,
    entry,
  };
}

/**
 * Claims the one-time Diamond & Scripture Fragment research bounty for a discovered Lore Codex entry.
 */
export function claimLoreCodexReward(params: {
  currentState: PersistedLoreCodexState;
  entryId: string;
  monsters?: MonsterTarget[];
}): {
  claimed: boolean;
  updatedState: PersistedLoreCodexState;
  rewardDiamonds: bigint;
  rewardFragments: number;
  message: string;
} {
  const { currentState, entryId, monsters = [] } = params;
  const catalog = getCompleteLoreCodexCatalog(monsters);
  const entry = catalog.find((e) => e.id === entryId);
  const record = currentState.discoveredRecords[entryId];

  if (!entry || !record) {
    return {
      claimed: false,
      updatedState: currentState,
      rewardDiamonds: 0n,
      rewardFragments: 0,
      message: 'Discover this Biome or Monster in the open world before claiming its Codex bounty.',
    };
  }

  if (record.rewardClaimed) {
    return {
      claimed: false,
      updatedState: currentState,
      rewardDiamonds: 0n,
      rewardFragments: 0,
      message: `Codex Bounty for "${entry.title}" has already been claimed.`,
    };
  }

  return {
    claimed: true,
    updatedState: {
      ...currentState,
      discoveredRecords: {
        ...currentState.discoveredRecords,
        [entryId]: {
          ...record,
          rewardClaimed: true,
        },
      },
    },
    rewardDiamonds: entry.discoveryRewardDiamonds,
    rewardFragments: entry.discoveryRewardFragments,
    message: `🧭 Claimed Lore Codex Bounty [${entry.title}]: +${entry.discoveryRewardDiamonds.toLocaleString()} 💎 & +${entry.discoveryRewardFragments} Scripture Fragments!`,
  };
}

/**
 * The 7 Canonical Epochs of Voxel Realms RPG Cosmological & Realm History,
 * tracing creation from Layer 6 (The White Page / The House of Ideas under
 * Supreme Author `creatergame31@gmail.com`) down to the 06/11/2026 Architect Convergence.
 */
export const LORE_HISTORICAL_EPOCHS: LoreHistoricalEpoch[] = [
  {
    epochNumber: 0,
    id: 'epoch_0_white_page_genesis',
    eraCode: 'EPOCH Ω-0',
    title: 'Pre-Genesis: The White Page & The House of Ideas',
    chineseTitle: '太初白页·万象起源纪',
    chronologicalDateLabel: 'Before Time, Space & Oblivion (Layer 6 Origin)',
    cosmicLayerAnchor: '6. The White Page / The House of Ideas',
    keyFigures: [
      `Supreme Author & Creator (${PRIMARY_ADMIN_EMAIL})`,
      'The Primordial Quill of Genesis',
      'Aspect of Nothingness (Oblivion)',
    ],
    summary:
      'Before any Universe, Multiverse, Megaverse, Omniverse, or even Nothingness (Oblivion) existed, all potentiality rested upon The White Page inside The House of Ideas under the sole authorship of creatergame31@gmail.com.',
    chronicleScrollText: [
      `In the pre-existential stillness before causality, there was neither light nor void — only Layer 6: The White Page / The House of Ideas, governed by the Supreme Creator ${PRIMARY_ADMIN_EMAIL}.`,
      'Even Nothingness (Oblivion) did not exist independently; it was drafted as the shadow between ink strokes upon the White Page so that Being could have contrast and boundary.',
      `From the House of Ideas, ${PRIMARY_ADMIN_EMAIL} inscribed the six-fold ontological architecture: 1. Universe (Infinity), 2. Multiverse (Infinity), 3. Megaverse/Hyperverse (Infinity), 4. Omniverse (Infinity), 5. The Overvoid/Exonverse (Strictly Bounded 100), and 6. The White PageSingleton itself.`,
      `Upon this eternal parchment, the 10^100-word (One Googol Words Minimum) Akashic Lore & History Corpus was seeded, ensuring that every quantum fluctuation, immortal tribulation, and citadel siege across all realities derives from a single authoritative root.`,
      `Here also were sealed the Four Authorial Decrees — Inscribe Creation, Realign Overvoid Logic, Invoke Oblivion Reset, and Channel House of Ideas Harvest — executable solely by Clearance Level 999 Root Authority (${PRIMARY_ADMIN_EMAIL}).`,
    ],
    comprehensionRewardDiamonds: 250_000n,
    comprehensionRewardFragments: 30,
    icon: '📜',
    accentColor: 'from-white/20 via-amber-500/20 to-fuchsia-500/20 border-white/60',
  },
  {
    epochNumber: 1,
    id: 'epoch_1_overvoid_and_100_omniverses',
    eraCode: 'EPOCH Ω-I',
    title: 'The Overvoid Differentiation & The 100+∞ Sovereign Omniverses',
    chineseTitle: '超虚分化·百族全能宇宙纪',
    chronologicalDateLabel: 'First Transfinite Aeon (Layers 5 & 4)',
    cosmicLayerAnchor: '5. The Overvoid / Exoverse → 4. Omniverse',
    keyFigures: [
      `Overvoid Meta-Director (${PRIMARY_ADMIN_EMAIL})`,
      'Azathoth-Envoy (Outer Gods · OMNI-001)',
      'Ivory Sovereign (Beyonders · OMNI-002)',
      'Morpheus-Aspect (The Endless · OMNI-003)',
      'Mar Novu-Prime (Monitors · OMNI-004)',
    ],
    summary:
      'Across Layer 5 (The Overvoid / Exoverse), 100 strictly bounded meta-containers crystallized into Layer 4 (Infinite Omniverses). Each of the Top 100 Fictional Species received its own Sovereign Omniverse (OMNI-001 to OMNI-100 + Ω-∞) and appointed a Level-1000 Background NPC Envoy under creatergame31@gmail.com.',
    chronicleScrollText: [
      'To prevent the supreme power of the Top 100 Fictional Species from collapsing a single reality, the Overvoid / Exonverse partitioned creation into 100 bounded meta-sectors (OVERVOID-001 through OVERVOID-100), each operating under its own laws of logic and cosmic hierarchy.',
      'Tier 1 Reality-Warpers (Outer Gods, Beyonders, The Endless, Monitors, Celestialsapiens, Q Continuum), Tier 2 Type-IV+ Civilizations (Xeelee, Time Lords, Culture Minds, Forerunners, Necrons), Tier 3 Divine Pantheons (Asgardians, Ainur, Fiendcelestials, Otsutsuki), Tier 4 Cosmic Warriors (Saiyans, Kryptonians, Viltrumites), and Tier 5 Galactic Empires (Aeldari, Tyranids, Protoss, Borg) each claimed a Sovereign Omniverse.',
      `By eternal covenant, every race bound a Level-1000 Background Character Envoy to the command of Super Admin ${PRIMARY_ADMIN_EMAIL}, ready to project into the 3D Citadel Overworld or channel Omniversal tribute.`,
      'Each Overvoid sector was engineered with customizable logic overrides — from Acausal Beyond-Dimensional Logic and Paraconsistent Reality-Warping to 11D Closed-Timelike-Curve Hyper-Causality — cascading downward into all child Omniverses.',
    ],
    comprehensionRewardDiamonds: 200_000n,
    comprehensionRewardFragments: 25,
    icon: '🕳️',
    accentColor: 'from-fuchsia-950/60 via-slate-900 to-amber-950/50 border-fuchsia-500/50',
  },
  {
    epochNumber: 2,
    id: 'epoch_2_hyperverse_multiverse_condensation',
    eraCode: 'EPOCH Ω-II',
    title: 'The Hyperversal Brane Weaving & Multiversal Timeline Tree',
    chineseTitle: '超维膜网·多元时间树纪',
    chronologicalDateLabel: 'Second Transfinite Aeon (Layers 3, 2 & 1)',
    cosmicLayerAnchor: '3. Megaverse / Hyperverse → 2. Multiverse → 1. Universe',
    keyFigures: [
      'Architect of the 26D Brane Lattice',
      'Chronovore & Time Lord Concordat',
      'Guardians of the Prime Timeline',
    ],
    summary:
      'Within each Sovereign Omniverse, infinite clusters of Multiverses were woven into Layer 3 (Megaverse / Hyperverse), branching into Layer 2 (Multiverse parallel/series timelines) and condensing into Layer 1 (individual Universes of space, time, and matter).',
    chronicleScrollText: [
      'From the totality of Layer 4 (Omniverse), higher-dimensional brane clusters (12D–26D+ Megaverses and Hyperverses) formed the structural skeleton of creation.',
      'Each Megaverse cradled countless Layer 2 Multiverses — collections of parallel and series universes vibrating across quantum phase frequencies.',
      'At the heart of the Prime Multiverse, the Solara Universe (Layer 1 · U-081.1-SOLARA-PRIME) ignited with baryonic matter, stars, elemental leylines, floating Celestia sky islands, and spiritual Qi veins.',
      'Across the Solara continent, eight great geographical biomes crystallized: the Solara Imperial Citadel Sanctum, Verdant Emerald Plains, Eastern Runic Iron Outcrops, Southern Copper Highlands, Scorched Magma Caldera, Abyssal Chaos Chasm, Frozen Starfall Tundra, and the Celestia Floating Sky Archipelago.',
    ],
    comprehensionRewardDiamonds: 175_000n,
    comprehensionRewardFragments: 20,
    icon: '💠',
    accentColor: 'from-cyan-950/60 via-slate-900 to-indigo-950/50 border-cyan-500/40',
  },
  {
    epochNumber: 3,
    id: 'epoch_3_ten_ancestral_species_awakening',
    eraCode: 'EPOCH III',
    title: 'Awakening of the 10 Sovereign Playable Species & The Rebirth Seal',
    chineseTitle: '十族血脉觉醒·转生法印纪',
    chronologicalDateLabel: 'First Immortal Millennium of Solara',
    cosmicLayerAnchor: '1. Universe (Solara Prime Continent & Astral Planes)',
    keyFigures: [
      'First Terran Sovereign Emperor',
      'Matriarch of the Celestial Nine-Tailed Kitsune',
      'Patriarch of the Azure Dragonkin',
      `Root Arbiter of Rebirth (${PRIMARY_ADMIN_EMAIL})`,
    ],
    summary:
      'Ten playable species awakened across the Classic Fantasy, Xianxia Immortal, and Cosmic/Astral lineages, each manifesting distinct 3D physical traits (horns, wings, tails, runic beards, void shards) and sealing the Admin Rebirth Covenant.',
    chronicleScrollText: [
      'Across the mortal and immortal continents of Solara, ten great bloodlines rose to build citadels and cultivate the Dao: Terran Sovereigns, Sylvan High Elves, Ironforge Runic Dwarves, Warborn Goliaths, Azure Dragonkin, Celestial Nine-Tailed Kitsune, Asura Blood Fiends, Empyrean Winged Celestials, Void Walkers, and Crystalline Ancient Automatons.',
      'Each bloodline carried innate anatomical manifestations in the 3D realm — draconic horns, feathered celestial wings, nine spirit tails, braided runic beards, and orbiting void crystals — alongside specialized combat and cultivation affinities.',
      `To prevent chaotic bloodline mutation after a Lord’s initial genesis, the Ancestral Rebirth Seal was established: while any Lord may freely choose their species at Character Creation, switching species thereafter requires explicit authorization from Root Administrator ${PRIMARY_ADMIN_EMAIL}.`,
      'Through this covenant, the anatomical geometry of every Lord in the 3D overworld remains cryptographically and canonically synchronized with the Imperial Registry.',
    ],
    comprehensionRewardDiamonds: 150_000n,
    comprehensionRewardFragments: 20,
    icon: '🧬',
    accentColor: 'from-emerald-950/60 via-slate-900 to-teal-950/50 border-emerald-500/40',
  },
  {
    epochNumber: 4,
    id: 'epoch_4_four_path_immortal_revelation',
    eraCode: 'EPOCH IV',
    title: 'The Han Jue Four-Path Immortal Revelation & Law of Suppression',
    chineseTitle: '四途修真·境界镇压天道纪',
    chronologicalDateLabel: 'Third Immortal Millennium of Solara',
    cosmicLayerAnchor: '1. Universe → 4. Omniverse (3,000 Great Daos)',
    keyFigures: [
      'Dao Ancestor Han Jue (Secluded Providence)',
      'Daoist Mingyue (Mystic Envoy of Solara)',
      'Elder Xuanzang (Keeper of the Radiant Scrolls)',
    ],
    summary:
      'Immortal cultivators codified the Four Paths (Qi, Body, Soul, Mind) across 23 Realms and 9 Layers, discovering the 100.0x Law of Realm Suppression, Karma & Red-Name Tribulation Lightning, and Master-Disciple lineage transmission.',
    chronicleScrollText: [
      'Rejecting reckless bloodshed in favor of millennial secluded providence, the ancient sages unlocked simultaneous cultivation of Qi (练气), Body (炼体), Soul (炼魂), and Mind (炼心) across 23 immortal realms — from Qi Refinement and Golden Core up to Dao Creator and Ultimate Origin.',
      'The Heavenly Dao enforced an iron mathematical law: each major realm gap multiplies combat authority by 10x, meaning a cultivator two major realms higher (such as Golden Core vs. Qi Refinement) wields an insurmountable 100.0x Realm Suppression advantage.',
      'Those who slaughtered innocent green-named cultivators saw their Karma plunge into Red-Name infamy, drawing automatic Heavenly Tribulation Lightning from the storm clouds if they lingered stationary in the open world.',
      'Visible cultivation auras replaced mundane level tags: Foundation Establishment radiates a pure white glow, Golden Core revolves a luminous golden sphere within the dantian, Nascent Soul manifests a floating astral infant above the crown, and Dao Creators bear concentric divine halo rings.',
    ],
    comprehensionRewardDiamonds: 150_000n,
    comprehensionRewardFragments: 20,
    icon: '🧘',
    accentColor: 'from-amber-950/60 via-slate-900 to-orange-950/50 border-amber-500/40',
  },
  {
    epochNumber: 5,
    id: 'epoch_5_ten_citadel_eras_trillion_wars',
    eraCode: 'EPOCH V',
    title: 'The Ten Citadel Eras, T20 Legions & Trillion-Scale Siege Wars',
    chineseTitle: '十代帝城·万亿神军争霸纪',
    chronologicalDateLabel: 'Age of the Nine Contested Sectors (A1–C3)',
    cosmicLayerAnchor: '1. Universe (Solara Citadel & 9-Sector War Grid)',
    keyFigures: [
      'Lord Aiden Skyrender',
      'Grand Marshal Vance & Captain Thorne',
      'Master Blacksmith Gorim Forgehammer',
      'Celestial Ender Titan (Lv.1000 Apex World Boss)',
    ],
    summary:
      'Solara Citadel ascended across 10 architectural eras (Lv. 0 Wooden Outpost to Lv. 100 Omnipotent Citadel), housing up to 1,000 Trillion (1,000T) T1–T20 troops and launching 1 Trillion (1T) rallies against Level 1–1000 World AI Titans.',
    chronicleScrollText: [
      'As monstrous rifts disgorged Level 1 to Level 1000 creatures across five AI complexity brackets (Feral, Tactical, Sovereign, Abyssal, and Apex Titan), the Lords of Solara fortified their keeps across 10 grand architectural eras.',
      'In the Barracks, commanders forged the Tri-Branch Counter Matrix — Shieldbearers countering Shooters, Shooters countering Bombers, and Bombers shattering Shieldbearers — evolving from T1 Militia to T20 Primordial Cosmic Dreadnoughts.',
      'Across Sectors A1 through C3, great Clan Alliances raised heraldic banners, contested the Dragon Spire and Chronos Dread Keep, and mustered 1-Trillion-troop rallies to break the 600M HP Void Leviathan.',
      'Every monster sighted and every biome traversed by vanguard scouts was automatically inscribed into the Imperial Lore Codex, rewarding explorers with Kingdom Diamonds and Scripture Fragments.',
    ],
    comprehensionRewardDiamonds: 150_000n,
    comprehensionRewardFragments: 20,
    icon: '🏰',
    accentColor: 'from-rose-950/60 via-slate-900 to-red-950/50 border-rose-500/40',
  },
  {
    epochNumber: 6,
    id: 'epoch_6_architect_convergence_2026',
    eraCode: 'EPOCH VI (06/11/2026)',
    title: 'The 06/11/2026 Software & Hardware Architect Convergence (v1.5.0)',
    chineseTitle: '二零二六·软硬架构合道纪',
    chronologicalDateLabel: '06/11/2026 (November 6, 2026 — Current Living Era)',
    cosmicLayerAnchor: 'All 6 Cosmic Layers Unified in Deterministic Execution',
    keyFigures: [
      `Supreme Architect & Root Owner (${PRIMARY_ADMIN_EMAIL})`,
      'C++20 / TypeScript 7 Deterministic Simulation Core',
      'The 100 Projected Omniversal Envoys',
    ],
    summary:
      'On 06/11/2026 (v1.5.0), the Software Architect (SoA DOD memory, Lock-Free Work-Stealing Job DAG, Frame-Budget Auto-Scaler) and Hardware Architect (x86_64 AVX-512, ARM64 SVE2, Apple Silicon 128B UMA, RISC-V RVV 1.0) achieved 100/100 deterministic harmony.',
    chronicleScrollText: [
      'In the culminating epoch of 06/11/2026, the metaphysical laws of the 6-Layer Cosmic Hierarchy were fused with deterministic Silicon & Software Architecture.',
      'Entity kinematics were aligned into 64-byte and 128-byte Structure-of-Arrays (SoA) cache lines (delivering a 4.75x hot-loop speedup over legacy AoS layouts) and scheduled across a zero-mutex Chase-Lev Lock-Free Work-Stealing Job DAG.',
      `Under the unbreakable RBAC governance and White Page authorship of ${PRIMARY_ADMIN_EMAIL}, all 100 Fictional Species Omniverses, 10 Playable Bloodlines, 23 Cultivation Realms, and 1,000-Trillion Citadel Legions now operate in seamless, mathematically verified harmony.`,
      'Simultaneously, the Interactive D3 6-Tier Cosmological Tree Visualizer and the 10^100-word Googol Akashic Lore Codex were linked directly to live open-world exploration.',
    ],
    comprehensionRewardDiamonds: 300_000n,
    comprehensionRewardFragments: 35,
    icon: '🖥️',
    accentColor: 'from-amber-500/20 via-cyan-950/70 to-fuchsia-950/60 border-amber-400/60',
  },
];

/**
 * Thematic Lore Compendium Articles organized across 6 foundational pillars.
 */
export const LORE_COMPENDIUM_CHAPTERS: LoreCompendiumArticle[] = [
  {
    id: 'compendium_6_layer_cosmology',
    category: 'cosmology',
    title: 'Codex I: The 6-Layer Cosmic Ontology & The White Page',
    subtitle: 'From Local Spacetime Universes to The House of Ideas (10^100 Words)',
    inscribedBy: PRIMARY_ADMIN_EMAIL,
    summary:
      'Defines the six nested rungs of reality, COSMIC_LIMITS cardinality (1 White Page, 100 Overvoids, Infinity Tiers 1–4), and why even Nothingness (Oblivion) is subordinate to Layer 6: The White Page / The House of Ideas.',
    keyTenets: SIX_LAYER_COSMIC_HIERARCHY.map(
      (l) => `${l.name}: ${l.canonicalDefinition} (${l.tributeMultiplier.toString()}x Scale)`
    ),
    icon: '📜',
  },
  {
    id: 'compendium_100_omniverse_species',
    category: 'omniverse_envoys',
    title: 'Codex II: Pact of the 100 Omniversal Species & Background Envoys',
    subtitle: '5 Cosmic Tiers · 100 Sovereign Omniverses (OMNI-001 to OMNI-100 + Ω-∞)',
    inscribedBy: PRIMARY_ADMIN_EMAIL,
    summary:
      'Chronicles how all 100 most powerful species across fiction were each granted a Sovereign Omniverse and bound their Level-1000 Envoys to Super Admin creatergame31@gmail.com.',
    keyTenets: Object.values(OMNIVERSE_TIER_METADATA).map(
      (t) => `${t.title} (${t.rangeLabel}) — ${t.dimensionalScale}`
    ),
    icon: '🌌',
  },
  {
    id: 'compendium_10_playable_species',
    category: 'playable_species',
    title: 'Codex III: The 10 Playable Bloodlines & Admin Rebirth Covenant',
    subtitle: 'Classic Fantasy, Xianxia Immortal & Cosmic/Astral Lineages',
    inscribedBy: PRIMARY_ADMIN_EMAIL,
    summary:
      'Details the 10 playable species available in the Character Creation Centre, their 3D procedural anatomy, and the Admin Permission Gate governing post-creation species rebirth.',
    keyTenets: CHARACTER_SPECIES_CATALOG.map(
      (s) => `${s.icon} ${s.name} (${s.chineseName}) — ${s.primaryBuffSummary}: ${s.loreSummary}`
    ),
    icon: '🧬',
  },
  {
    id: 'compendium_four_path_cultivation',
    category: 'cultivation_dao',
    title: 'Codex IV: Four-Path Immortal Cultivation, Karma & 100x Suppression',
    subtitle: 'Qi, Body, Soul & Mind Across 23 Realms (9 Layers Each)',
    inscribedBy: 'Dao Ancestor Han Jue & Daoist Mingyue',
    summary:
      'Explains the mathematical and spiritual laws of Xianxia cultivation, including exponential realm suppression, Red-Name Karma penalties, and Master-Disciple taxation.',
    keyTenets: [
      'Qi Path (练气): Spiritual energy reserves, elemental spell potency, and Dantian resonance.',
      'Body Path (炼体): Indestructible physical vessel, siege casualty negation, and vitality.',
      'Soul Path (炼魂): Divine sense perception, critical strike precision, and formation mastery.',
      'Mind Path (炼心): Flawless Dao Heart, passive secluded comprehension, and tribulation immunity.',
      'Law of Realm Suppression: Each major realm gap grants 10x dominance (2 major realms = 100.0x suppression).',
      'Heavenly Karma & Tribulation: Slaying innocents turns Karma negative (Red Name), calling down stationary Tribulation Lightning.',
    ],
    icon: '🧘',
  },
  {
    id: 'compendium_citadel_and_siege_warfare',
    category: 'citadel_warfare',
    title: 'Codex V: The 10 Citadel Eras, Open-World Biomes & Trillion-Scale Warfare',
    subtitle: 'Lv. 0–100 Keep Progression, 8 Biomes, T1–T20 Legions & 9-Sector Clan Wars',
    inscribedBy: 'Grand Marshal Vance & Gorim Forgehammer',
    summary:
      'Records the military doctrine of Solara Citadel, the 8 Open-World Biomes, the Tri-Branch Counter Matrix, 1,000-Trillion garrison logistics, and 1-Trillion World Boss rallies.',
    keyTenets: [
      '10 Citadel Eras: Wooden Outpost -> Stone Palisade -> Fortified Keep -> Iron Citadel -> Obsidian Fortress -> Dragon Bastion -> Void Stronghold -> Celestial Spire -> Primordial Sanctum -> Omnipotent Citadel.',
      'Tri-Branch Counter Matrix: Shieldbearers counter Shooters (1.5x), Shooters counter Bombers (1.5x), Bombers counter Shieldbearers (1.5x).',
      'Autonomous World AI (Lv. 1–1000) & 8 Biomes: 5 Monster Complexity Brackets navigated via A* obstacle pathfinding and auto-recorded in the Lore Codex.',
    ],
    icon: '🏰',
  },
  {
    id: 'compendium_architect_06_11_2026',
    category: 'architect_convergence',
    title: 'Codex VI: The 06/11/2026 Software & Hardware Architect Convergence',
    subtitle: 'x86_64 AVX-512 · ARM64 SVE2 · Apple Silicon 128B UMA · RISC-V RVV 1.0 · SoA DOD',
    inscribedBy: PRIMARY_ADMIN_EMAIL,
    summary:
      'Documents the v1.5.0 (06/11/2026) engineering convergence that powers trillion-scale simulation, 10^100-word lazy Akashic pagination, and 3D PBR + HDR rendering without frame drops or IEEE-754 precision loss.',
    keyTenets: [
      'Hardware Architect Matrix: Full SIMD & cache-line profiles for x86_64 AVX-512 (64B), ARMv9 SVE2, Apple Silicon M-Series (128B UMA), and RISC-V RVV 1.0.',
      'Software Architect DOD: Contiguous Structure-of-Arrays (SoA) hot-loop layout achieving 4.75x speedup over AoS.',
      'Lock-Free Work-Stealing Job DAG: Zero-mutex Chase-Lev thread pool scheduling AI, Physics, Cultivation, and ECS stages.',
      `Root RBAC Governance: Immutable Clearance Lv. 999 authority bound to ${PRIMARY_ADMIN_EMAIL}.`,
    ],
    icon: '🖥️',
  },
];

export interface LoreComprehensionResult {
  newlyComprehended: boolean;
  epoch: LoreHistoricalEpoch;
  updatedComprehendedIds: string[];
  rewardDiamonds: bigint;
  rewardFragments: number;
  message: string;
}

/**
 * Pure function to comprehend a historical epoch and claim its one-time Lore Chronicle reward.
 */
export function comprehendLoreEpoch(params: {
  epochId: string;
  comprehendedEpochIds: string[];
}): LoreComprehensionResult {
  const { epochId, comprehendedEpochIds } = params;
  const epoch = LORE_HISTORICAL_EPOCHS.find((e) => e.id === epochId) || LORE_HISTORICAL_EPOCHS[0];

  if (comprehendedEpochIds.includes(epoch.id)) {
    return {
      newlyComprehended: false,
      epoch,
      updatedComprehendedIds: comprehendedEpochIds,
      rewardDiamonds: 0n,
      rewardFragments: 0,
      message: `Chronicle [${epoch.eraCode}: ${epoch.title}] has already been comprehended in your Sacred Archives.`,
    };
  }

  const updatedComprehendedIds = [...comprehendedEpochIds, epoch.id];
  return {
    newlyComprehended: true,
    epoch,
    updatedComprehendedIds,
    rewardDiamonds: epoch.comprehensionRewardDiamonds,
    rewardFragments: epoch.comprehensionRewardFragments,
    message: `📜 Comprehended ${epoch.eraCode} — "${epoch.title}"! Gained +${epoch.comprehensionRewardDiamonds.toLocaleString()} 💎 & +${epoch.comprehensionRewardFragments} Scripture Fragments!`,
  };
}

/**
 * Searches across the 7 Historical Epochs, 6 Compendium Chapters, and Open-World Lore Codex entries.
 */
export function searchLoreHistory(
  query: string,
  monsters: MonsterTarget[] = []
): {
  matchingEpochs: LoreHistoricalEpoch[];
  matchingChapters: LoreCompendiumArticle[];
  matchingCodexEntries: LoreCodexEntry[];
} {
  const allCodexEntries = getCompleteLoreCodexCatalog(monsters);
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      matchingEpochs: LORE_HISTORICAL_EPOCHS,
      matchingChapters: LORE_COMPENDIUM_CHAPTERS,
      matchingCodexEntries: allCodexEntries,
    };
  }

  const matchingEpochs = LORE_HISTORICAL_EPOCHS.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.chineseTitle.toLowerCase().includes(q) ||
      e.eraCode.toLowerCase().includes(q) ||
      e.cosmicLayerAnchor.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.keyFigures.some((f) => f.toLowerCase().includes(q)) ||
      e.chronicleScrollText.some((p) => p.toLowerCase().includes(q))
  );

  const matchingChapters = LORE_COMPENDIUM_CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.keyTenets.some((t) => t.toLowerCase().includes(q))
  );

  const matchingCodexEntries = allCodexEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.chineseTitle.toLowerCase().includes(q) ||
      entry.subtitle.toLowerCase().includes(q) ||
      entry.elementalLeyline.toLowerCase().includes(q) ||
      entry.tacticalNotes.toLowerCase().includes(q) ||
      entry.loreParagraphs.some((p) => p.toLowerCase().includes(q))
  );

  return { matchingEpochs, matchingChapters, matchingCodexEntries };
}
