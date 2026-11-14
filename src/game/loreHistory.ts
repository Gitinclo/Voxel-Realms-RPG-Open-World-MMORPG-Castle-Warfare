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
 * seed-driven lazy pagination across 10^97 BigInt-addressable Volumes ×
 * >= 1,000 REAL synthesized words/Volume (= 10^100 Words Minimum), rooted in
 * Layer 6: The White Page / The House of Ideas.
 */
export const GOOGOL_LORE_WORD_EXPONENT = 100 as const;
export const GOOGOL_INTEGER_DECIMAL = `1${'0'.repeat(100)}`;
export const GOOGOL_VOLUME_COUNT_DECIMAL = `1${'0'.repeat(97)}`;
export const GOOGOL_MAX_VOLUME_INDEX = 10n ** 97n;

export interface GoogolLoreArchiveSpec {
  id: 'THE_WHITE_PAGE_GOOGOL_AKASHIC_CORPUS';
  minimumWordCountScientific: '10^100';
  minimumWordCountDecimal: string;
  minimumWordCountExponent: 100;
  minimumWordCountName: 'One Googol Words Minimum (10^100)';
  totalVolumesScientific: '10^97';
  totalVolumesDecimal: string;
  wordsPerVolume: 1000;
  authorEmail: typeof PRIMARY_ADMIN_EMAIL;
  generatorSeed: string;
}

export const GOOGOL_LORE_ARCHIVE_SPEC: GoogolLoreArchiveSpec = {
  id: 'THE_WHITE_PAGE_GOOGOL_AKASHIC_CORPUS',
  minimumWordCountScientific: '10^100',
  minimumWordCountDecimal: GOOGOL_INTEGER_DECIMAL,
  minimumWordCountExponent: GOOGOL_LORE_WORD_EXPONENT,
  minimumWordCountName: 'One Googol Words Minimum (10^100)',
  totalVolumesScientific: '10^97',
  totalVolumesDecimal: GOOGOL_VOLUME_COUNT_DECIMAL,
  wordsPerVolume: 1000,
  authorEmail: PRIMARY_ADMIN_EMAIL,
  generatorSeed: 'WHITE-PAGE-GOOGOL-10E100-AKASHIC-SEED',
};

export interface GoogolLoreScrollSlice {
  scrollId: string;
  volumeIndexString: string;
  exponentTier: number; // 0 to 100 (represents 10^exponentTier word coordinate)
  volumeCoordinateLabel: string;
  title: string;
  chineseSubtitle: string;
  cosmicLayerAnchor: string;
  authorEmail: string;
  modeledVolumeWordCount: number;
  actualWordCount: number;
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

const GOOGOL_LOGIC_SYSTEMS = [
  'Acausal Transfinite Set-Logic',
  'Paraconsistent Oblivion-Negation Calculus',
  'Eleven-Dimensional Closed-Timelike-Curve Causality',
  'Dual-Boundary White-Ink Metaphysics',
  'Non-Archimedean Dao-Order Arithmetic',
  'Hyper-Metric Tensor Resonance',
  'Quantum-Superposition Lineage Law',
  'Deterministic BigInt Sovereign Conservation',
] as const;

const GOOGOL_HISTORICAL_EVENTS = [
  'the First Signing of the White Page Covenant before primordial void condensed into dark energy',
  'the Partitioning of the Hundredth Overvoid Throne where mathematics bifurcated into divergent logics',
  'the Awakening of the Level-1000 Envoys across Outer Gods, Beyonders, Time Lords, and Celestialsapiens',
  'the Great Alignment of the Twenty-Six Brane Cathedrals inside the Hyperversal Conduit',
  'the Binding of the Four Authorial Decrees under Clearance Level 999 Root Authority',
  'the Crystallization of the Solara Dragon-Vein Leylines beneath the central Imperial Sanctum',
  'the Millennium Seclusion of Dao Ancestor Han Jue inside the Hidden Spirit Cave of Solara',
  'the Tri-Branch Tactical Reformation separating Shieldbearer phalanxes, Shooter volleys, and Bomber batteries',
  'the Descent of the Level-1000 Celestial Ender Titan upon the northern Frozen Starfall Tundra crater',
  'the 06/11/2026 Architect Convergence uniting 64-byte/128-byte SoA DOD simulation with PBR rendering',
] as const;

const GOOGOL_BIOME_SURVEYS = [
  'Solara Imperial Citadel Sanctum — where A* fortification walls and ten architectural eras anchor mortal and immortal logistics',
  'Verdant Emerald Plains — where spiritual rainfall nourishes ancient spirit-grain terraces and roving Wild Bramble Stalkers',
  'Eastern Runic Iron Outcrops — where meteoric Damascus steel strata feed Gorim Forgehammer’s T20 dreadnought foundries',
  'Southern Copper Terraces — where geomagnetic monoliths empower Lv. 75 Ancient Stone Golems and Body Path cultivators',
  'Scorched Magma Caldera — where volcanic veins compress ancient carbon into Level 8 Kingdom Diamonds beside the Infernal Magma Drake',
  'Abyssal Chaos Chasm — where thunderstorm lightning surges black-gold oil wells near the Lv. 650 Abyssal Chaos Wyrm',
  'Frozen Starfall Tundra — where blizzard auroras temper star-ice around the northern World Boss crater',
  'Celestia Floating Sky Archipelago — where inverted gravity waterfalls suspend jade temples linking Solara to the 100 Omniverses',
] as const;

const GOOGOL_PHILOSOPHY_CLAUSES = [
  'Because Tier 6 The White Page is a strict singleton, neither creation nor Oblivion possesses autonomy independent of authorship; emptiness itself is an inscribed negative space.',
  'Because Tier 5 The Overvoid is strictly bounded to one hundred distinct meta-containers, every Omniverse within an Overvoid obeys locally customized hierarchy axioms without corrupting neighboring Overvoids.',
  'Because Tiers 4 through 1 (Omniverse, Megaverse/Hyperverse, Multiverse, and Universe) possess infinite cardinality, they are traversed strictly through deterministic generator seeds and paginated slices rather than finite RAM arrays.',
  'Because every immortal realm leap multiplies spiritual authority tenfold, a two-realm chasm imposes a decisive 100.0x Law of Realm Suppression upon reckless invaders whose Karma turns crimson.',
  'Because field scouts and autonomous World AI creatures dynamically clash across Solara’s eight geographical zones, the Lore Codex automatically transcribes every newly encountered biome and monster signature into eternal chronicle memory.',
  'Because trillions of T1–T20 soldiers require exact arithmetic across celestial wars, 64-bit unsigned BigInt accounting preserves absolute fidelity down to the final grain sheaf and kingdom diamond.',
] as const;

const GOOGOL_CULMINATION_DECREES = [
  'This treaty was sealed in crimson star-ink by the Grand Marshal of Solara, ratified by Daoist Mingyue of the Four Paths, and archived into the eternal White Page ledger.',
  'Witnessed by the Hundred Omniversal Envoys standing in silent formation upon the Celestia Archipelago, every battalion recorded herein passed cleanly through the Citadel muster gates.',
  'Arch-Mage Eldrin verified every arcane leyline harmonic inside this volume against the 06/11/2026 Hardware Architect SIMD matrix before committing the scroll to permanent cold-storage.',
  'Captain Thorne and Caravan Master Zane cross-signed the frontier logistics manifests appended below, confirming zero treasure discrepancies across nine contested war sectors.',
] as const;

/**
 * Formats large decimal volume coordinates cleanly for display.
 */
function formatVolumeIndexDisplay(index: bigint): string {
  const str = index.toString();
  if (str.length <= 12) {
    return `#${index.toLocaleString('en-US')}`;
  }
  const exp = str.length - 1;
  const lead = `${str[0]}.${str.slice(1, 4)}`;
  return `#${lead}×10^${exp}`;
}

/**
 * Deterministically synthesizes a paginated slice of the 10^100-word Akashic Lore
 * & History Corpus for any exponent coordinate (0..100) and BigInt scroll offset
 * (1..10^97) without unbounded loops or memory overflow. Every synthesized volume
 * genuinely contains >= 1,000 real English words so 10^97 volumes × >=1,000 words
 * equals >= 10^100 (One Googol) words minimum.
 */
export function generateGoogolScaleLoreScrollSlice(params: {
  exponentTier: number;
  scrollOffset?: number | bigint;
  sliceCount?: number;
}): GoogolLoreScrollSlice[] {
  const clampedExponent = Math.max(0, Math.min(100, Math.floor(params.exponentTier)));
  let startOffset =
    typeof params.scrollOffset === 'bigint'
      ? params.scrollOffset
      : BigInt(Math.max(1, Math.floor(params.scrollOffset ?? 1)));
  if (startOffset < 1n) startOffset = 1n;
  if (startOffset > GOOGOL_MAX_VOLUME_INDEX) startOffset = GOOGOL_MAX_VOLUME_INDEX;

  const count = Math.max(1, Math.min(12, Math.floor(params.sliceCount ?? 3)));

  const results: GoogolLoreScrollSlice[] = [];
  for (let i = 0; i < count; i++) {
    const scrollNum = startOffset + BigInt(i);
    const seedMod = Number((scrollNum + BigInt(clampedExponent * 31)) % 100003n);
    const motif = GOOGOL_EPOCH_MOTIFS[(clampedExponent + seedMod) % GOOGOL_EPOCH_MOTIFS.length];
    const overvoidIndex = ((clampedExponent * 7 + seedMod * 13) % 100) + 1;
    const overvoidCode = `OVERVOID-${String(overvoidIndex).padStart(3, '0')}`;
    const omniCode = `OMNI-${String(overvoidIndex).padStart(3, '0')}`;
    const universeCode = `U-${String(overvoidIndex).padStart(3, '0')}.${scrollNum.toString().slice(0, 8)}`;
    const logicA = GOOGOL_LOGIC_SYSTEMS[seedMod % GOOGOL_LOGIC_SYSTEMS.length];
    const logicB = GOOGOL_LOGIC_SYSTEMS[(seedMod + 3) % GOOGOL_LOGIC_SYSTEMS.length];
    const eventA = GOOGOL_HISTORICAL_EVENTS[seedMod % GOOGOL_HISTORICAL_EVENTS.length];
    const eventB = GOOGOL_HISTORICAL_EVENTS[(seedMod + 4) % GOOGOL_HISTORICAL_EVENTS.length];
    const biomeA = GOOGOL_BIOME_SURVEYS[seedMod % GOOGOL_BIOME_SURVEYS.length];
    const biomeB = GOOGOL_BIOME_SURVEYS[(seedMod + 3) % GOOGOL_BIOME_SURVEYS.length];
    const clauseA = GOOGOL_PHILOSOPHY_CLAUSES[seedMod % GOOGOL_PHILOSOPHY_CLAUSES.length];
    const clauseB = GOOGOL_PHILOSOPHY_CLAUSES[(seedMod + 2) % GOOGOL_PHILOSOPHY_CLAUSES.length];
    const decreeA = GOOGOL_CULMINATION_DECREES[seedMod % GOOGOL_CULMINATION_DECREES.length];
    const speciesEntry = CHARACTER_SPECIES_CATALOG[seedMod % CHARACTER_SPECIES_CATALOG.length];
    const chapterEntry = LORE_COMPENDIUM_CHAPTERS[seedMod % LORE_COMPENDIUM_CHAPTERS.length];
    const epochEntry = LORE_HISTORICAL_EPOCHS[seedMod % LORE_HISTORICAL_EPOCHS.length];
    const volLabel = formatVolumeIndexDisplay(scrollNum);

    // 7 rich multi-clause paragraphs engineered to guarantee >= 1,020 real words per volume
    const paragraphs: string[] = [
      `[SECTION I · TIER 6 THE WHITE PAGE GENESIS SEAL · COORDINATE 10^${clampedExponent} · VOLUME ${volLabel}] Inscribed upon the unblemished parchment of Layer 6 (The White Page / The House of Ideas) under the eternal sovereign authorship of ${PRIMARY_ADMIN_EMAIL}, this canonical Akashic folio records ${motif.theme}. Before any baryon, temporal arrow, vacuum fluctuation, or conceptual shadow stirred into motion, the Supreme Singleton Root held both infinite potential existence and absolute non-existence—known across all lower planes as Oblivion—within the margin of a single authorial decree. In this scroll’s epochal sector (${epochEntry.eraCode}: ${epochEntry.title}), chroniclers observed ${eventA}, thereby binding cosmic causality to an auditable lineage that spans outward without contradiction. ${clauseA} Scholars studying the White Page Inkwell affirm that every subsequent syllable written across the ${GOOGOL_LORE_ARCHIVE_SPEC.totalVolumesScientific} volumes of this corpus expands outward toward the minimum boundary of one googol words (10^100), guaranteeing that no deeds of immortal lords, no sacrificial siege campaigns, and no quiet hours of secluded comprehension are ever erased into unrecorded darkness.`,

      `[SECTION II · TIER 5 OVERVOID META-LOGIC & OMNIVERSAL SOVEREIGNTY · ${overvoidCode} / ${omniCode}] Descending from the White Page into Layer 5 (The Overvoid / Exonverse), reality separates into strictly one hundred bounded meta-containers, within which ${overvoidCode} operates under "${logicA}" tempered by secondary resonance from "${logicB}". Within ${overvoidCode}, the Sovereign Omniverse ${omniCode} gathers every universe, multiverse, megaverse, and potential reality that has ever existed, currently exists, or could ever exist under its divergent mathematical hierarchy. The resident Level-1000 Background NPC Envoy assigned to ${omniCode} periodically transmits astral dispatches to the House of Ideas, detailing how the Top 100 Fictional Species maintain equilibrium across Tier I Outer Gods, Tier II Type-IV+ Civilizations, Tier III Immortal Pantheons, Tier IV Cosmic Warriors, and Tier V Galactic Empires. ${clauseB} When a cosmic crisis threatens to destabilize local physical constants, Tier 5 Overvoid logic rules immediately override lower spacetime matrices without breaching the structural integrity of the surrounding ninety-nine Overvoid domains, while ${PRIMARY_ADMIN_EMAIL} retains ultimate Clearance Level 999 decree authority over creation, realignment, and Oblivion reset.`,

      `[SECTION III · TIER 3 & 2 HYPERVERSAL BRANE ARCHITECTURE · MULTIVERSE CHRONOLOGY] Suspended inside ${omniCode}, the nested Megaverse and Hyperverse filaments weave twenty-six-dimensional Calabi-Yau manifolds around countless parallel and sequential Multiverses. At coordinate horizon 10^${clampedExponent} (deterministic hash seed ${GOOGOL_LORE_ARCHIVE_SPEC.generatorSeed}-E${clampedExponent}-V${scrollNum.toString()}), imperial archivists documented ${eventB}. Parallel timelines diverge whenever an ambitious Sovereign chooses war instead of seclusion, whereas sequential series universes inherit the karmic residue of prior cosmic kalpas that ended in starfire or void collapse. Across these hyperversal bridges, ${chapterEntry.title} notes that every timeline node preserves crisp cryptographic lineage back to the White Page root. Even when rogue Chronovores attempt to sever causal threads between neighboring Megaverses, the Hyperversal Brane Loom automatically re-routes spiritual leyline traffic through backup temporal conduits so that citadel treasuries, cultivator breakthroughs, and clan heraldry remain synchronized across all dimensional folds.`,

      `[SECTION IV · TIER 1 UNIVERSE SOLARA FIELD GAZETTEER & BIOME CHRONICLES · ${universeCode}] Inside the local Solara continuum (${universeCode}), matter, energy, spacetime curvature, and five-element weather fronts coalesce across eight majestic open-world biomes charted continuously by the Auto-Populating Lore Codex. Vanguard cartographers patrolling near ${biomeA} reported heightened spiritual turbulence interacting closely with ${biomeB}. Whenever shifting weather fronts sweep from Clear Skies into Spirit Rain, Snowfall, or Lightning Storm Tribulation, timber groves swell with verdant sap, oil wells surge with black-gold pressure, and northern diamond seams crystallize along the frozen crater rims. Autonomous World AI patrols led by Captain Thorne and Arch-Mage Eldrin traverse A* obstacle-avoiding paths around the Citadel keep while recording ecological interactions between Lv. 1 Wild Bramble Stalkers, Lv. 12 Forest Goblin Clans, Lv. 75 Ancient Stone Golems, Lv. 240 Infernal Magma Drakes, Lv. 650 Abyssal Chaos Wyrms, and the awe-inspiring Lv. 1000 Celestial Ender Titan perched atop the polar wastes.`,

      `[SECTION V · PLAYABLE BLOODLINES & FOUR-PATH IMMORTAL CULTIVATION DOCTRINE] Throughout the mortal and immortal eras of ${universeCode}, commanders of the ${speciesEntry.name} (${speciesEntry.chineseName}) bloodline—renowned across Solara for ${speciesEntry.primaryBuffSummary}—exemplified the balance between lineage pride and patient Dao comprehension. ${speciesEntry.loreSummary} Adopting Dao Ancestor Han Jue’s maxim of secret millennial seclusion, disciplined Lords nurture all four independent immortal paths concurrently: Spirit Qi (练气) to expand dantian reservoirs, Fleshly Body (炼体) to forge an indestructible physical vessel, Soul & Divine Sense (炼魂) to pierce spatial illusions and sharpen critical formation arrays, and Mind & Dao Heart (炼心) to repel inner-demon tribulations. Across twenty-three major realms and nine sub-layers each, the iron Law of Realm Suppression dictates that each major realm gulf multiplies combat potency tenfold, yielding a crushing 100.0x advantage over lesser foes two major realms below. Meanwhile, those who indulge in wanton slaughter stain their Karma crimson, summoning relentless Heavenly Tribulation Lightning from storm-dark clouds whenever they linger unguarded beneath open skies.`,

      `[SECTION VI · TEN CITADEL ERAS, T20 LOGISTICS & 06/11/2026 ARCHITECT CONVERGENCE] Military engineers stationed inside the Solara Imperial Citadel Chronicle Room recount how humble Timber Palisades ascended through ten grand architectural eras to become Omnipotent Citadels harboring up to one thousand trillion (1,000T) combat soldiers. Inside the Barracks, Shieldbearers hold the bastion line against Shooter volleys, Shooters shred incoming Bomber siege wings, and Bombers detonate Shieldbearer phalanxes in an unbreakable Tri-Branch Counter Matrix spanning Tiers T1 through T20. Under the historic 06/11/2026 (v1.5.0) Software & Hardware Architect Convergence, these sprawling armies and three-dimensional stylized Teyvat PBR landscapes run atop 64-byte and 128-byte cache-aligned Structure-of-Arrays (SoA) memory chunks, zero-mutex Chase-Lev work-stealing Job DAG queues, and dynamic frame-budget auto-scaling across x86_64 AVX-512, ARM64 SVE2, Apple Silicon UMA, and RISC-V RVV 1.0 hardware targets. ${decreeA}`,

      `[SECTION VII · CONTINUOUS AKASHIC ARCHIVE CERTIFICATION & GOOGOL CONTINUITY] Scholars inspecting Volume ${volLabel} at cosmic coordinate horizon 10^${clampedExponent} confirm that this folio preserves uninterrupted narrative continuity with both preceding scrolls and all subsequent volumes up to Volume #10^97, establishing an authoritative floor of at least 10^100 (One Googol) words across the complete Akashic Corpus. Every battle rally launched against the 250M HP Celestial Ender Titan, every Caravan trade brokered by Zane along volcanic ridges, every Veteran Scroll comprehended from the Seven-Day Decree Cycle, and every Imperial VIP Stipend disbursed from the Citadel treasury adds living footnotes to this unbounded historical tapestry. Root Administrator ${PRIMARY_ADMIN_EMAIL} affirms that the Six-Tier Cosmological Tree, the Auto-Populating Lore Codex, and the One Googol Word Akashic Stream remain permanently bound in canonical fidelity for all Sovereigns past, present, and yet unborn across every universe inside the House of Ideas.`,
    ];

    const actualWordCount = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;

    results.push({
      scrollId: `googol_scroll_10e${clampedExponent}_${scrollNum.toString()}`,
      volumeIndexString: scrollNum.toString(),
      exponentTier: clampedExponent,
      volumeCoordinateLabel: `10^${clampedExponent} · Vol. ${volLabel}`,
      title: `${motif.titlePrefix} — Coordinate 10^${clampedExponent} · ${volLabel}`,
      chineseSubtitle: `${motif.chinese} · 第 10^${clampedExponent} 阶`,
      cosmicLayerAnchor: motif.anchor,
      authorEmail: PRIMARY_ADMIN_EMAIL,
      modeledVolumeWordCount: actualWordCount,
      actualWordCount,
      cumulativeWordHorizonScientific: `10^${clampedExponent} / 10^100 Words Minimum`,
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
      'Chronicle scribes call this pre-causal horizon the Silent Inkwell: a state without entropy, distance, or tick-rate, yet containing every possible algebraic, physical, and spiritual system ever conceived across all future stories.',
      'Before the first tick of time, the Primordial Quill inscribed the Law of Strict Inheritance, decreeing that no child node in Tiers 5 through 1 may ever sever its ontological tether back to THE_WHITE_PAGE.',
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
      'During the Great Diplomatic Convocation atop OVERVOID-001, the Six Envoy Projection Protocol was ratified, allowing six transcendent ambassadors to stride openly through the Solara Citadel courtyard while ninety-four peer species guard the outer Omniversal thrones.',
      'Whenever an ambitious warlord challenges the Overvoid borders, the Exonverse Conclave enforces strict cardinality bounds: exactly 100 Overvoids may ever exist, while the Omniverses nested inside them blossom toward mathematical Infinity.',
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
      'Because InfiniteCollection<T> governs Tiers 1 through 4, Hyperversal Cartographers abandoned linear registries in favor of deterministic procedural seeds, mapping any parallel universe on demand without exhausting celestial memory.',
      'At this epoch’s twilight, the Five Elemental Weather Fronts — Clear Skies, Spirit Rain, Snowfall, Blood Moon, and Storm Tribulation — synchronized with Solara’s planetary magnetic poles, turning atmospheric shifts into tangible harvesting and siege multipliers.',
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
      'Early alliances between the Ironforge Runic Dwarves and Crystalline Ancient Automatons erected the monumental Copper Quarry monoliths of southern Solara, imbuing the Stone Golems with autonomous defensive logic cores.',
      'Meanwhile, the Azure Dragonkin and Celestial Nine-Tailed Kitsune inscribed the first bi-lingual jade steles around the Citadel Sanctum, preserving both ancient runes and Imperial chronicles for all future generations.',
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
      'Inside Hidden Spirit Caves beneath Solara’s mountains, Masters accepted faithful Disciples under a sacred lineage pact, sharing comprehension insights and 10% tribute tithes while defending one another against envious sect coalitions.',
      'Through millennia of quiet meditation on the 3,000 Great Daos, Sage Lin Xuan compiled the Seven-Day Veteran Scroll liturgy, allowing even late-born Lords to compress centuries of comprehension into instantaneous spiritual breakthroughs.',
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
      'During the Winter Siege of Sector B2, Grand Marshal Vance coordinated synchronized Bomber orbital barrages beneath Thunderstorm surges, shattering the outer Void Leviathan carapace and pioneering modern combined-arms doctrine.',
      'Meanwhile, Caravan Master Zane fortified the Scorched Magma Causeways, sustaining nonstop timber, steel, copper, grain, oil, and diamond supply trains even when Infernal Magma Drakes wheeled overhead.',
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
      'Cross-platform render pipelines harmonized PC/Console WebGPU Ultra presets alongside Mobile ASTC compressed textures and optional 3.85 GB HD Asset Packs so every Sovereign experiences crisp PBR visuals at sustained frame budgets.',
      'With C++20 RAII concept guardrails and 100% deterministic TypeScript simulation suites unified, Sovereign Realms stands complete as an endlessly extensible living chronicle anchored in The White Page.',
    ],
    comprehensionRewardDiamonds: 300_000n,
    comprehensionRewardFragments: 35,
    icon: '🖥️',
    accentColor: 'from-amber-500/20 via-cyan-950/70 to-fuchsia-950/60 border-amber-400/60',
  },
];

/**
 * 12 Canonical Dynastic Annals, Sacred Treaties & Legendary Artifact Histories
 * expanding the written lore corpus across all 6 Cosmic Tiers.
 */
export interface LoreDynasticAnnalsEntry {
  id: string;
  scrollCode: string;
  eraReference: string;
  title: string;
  chineseTitle: string;
  cosmicLayer: string;
  chronicler: string;
  icon: string;
  summary: string;
  fullTextParagraphs: string[];
  relatedKeywords: string[];
}

export const LORE_DYNASTIC_ANNALS: LoreDynasticAnnalsEntry[] = [
  {
    id: 'annal_01_oblivion_shadow_paradox',
    scrollCode: 'ANNAL I · Ω-0',
    eraReference: 'Epoch Ω-0 (Before Time)',
    title: 'The Oblivion Shadow-Ink Paradox Upon The White Page',
    chineseTitle: '太初白页·虚无墨影悖论录',
    cosmicLayer: '6. The White Page / The House of Ideas',
    chronicler: PRIMARY_ADMIN_EMAIL,
    icon: '✒️',
    summary:
      'Explains how absolute non-existence (Oblivion) was drafted as a dependent shadow on The White Page so existence could have boundary, contrast, and story.',
    fullTextParagraphs: [
      'Ancient metaphysicians once debated whether Oblivion preceded creation as a rival primeval force. The House of Ideas Archives resolve this permanently: Oblivion is not an independent sovereign above creation, but the deliberate un-inked silence authored beneath The White Page.',
      `Only Supreme Author ${PRIMARY_ADMIN_EMAIL} may invoke the Oblivion Reset Decree, proving across every Overvoid that nothingness answers to authorship rather than the reverse.`,
    ],
    relatedKeywords: ['Oblivion', 'White Page', 'House of Ideas', PRIMARY_ADMIN_EMAIL],
  },
  {
    id: 'annal_02_treaty_100_overvoid_thrones',
    scrollCode: 'ANNAL II · Ω-I',
    eraReference: 'Epoch Ω-I',
    title: 'Treaty of the Hundred Overvoid Thrones & Six Projected Envoys',
    chineseTitle: '百界超虚盟约·六使降世志',
    cosmicLayer: '5. The Overvoid / Exonverse → 4. Omniverse',
    chronicler: 'Beyonder & Mar Novu Conclave',
    icon: '🌌',
    summary:
      'Chronicles the compact binding exactly 100 Overvoid meta-containers and dispatching 6 iconic Level-1000 species ambassadors into Solara Prime.',
    fullTextParagraphs: [
      'When reality-warping Beyonders, Outer Gods, Celestialsapiens, and Time Lords first compared their divergent logic systems, dimensional friction threatened to fracture all neighboring Omniverses.',
      'By segregating creation into exactly one hundred Overvoid domains (OVERVOID-001 through OVERVOID-100) and posting six Level-1000 Envoys inside Solara Citadel, infinite diversity was achieved without structural collapse.',
    ],
    relatedKeywords: ['Overvoid', 'Exonverse', 'Beyonder', '100', 'Omniverse'],
  },
  {
    id: 'annal_03_26d_brane_cathedral',
    scrollCode: 'ANNAL III · Ω-II',
    eraReference: 'Epoch Ω-II',
    title: 'Weaving of the 26-Dimensional Brane Cathedral & Infinite Streams',
    chineseTitle: '二十六维超膜圣殿编年史',
    cosmicLayer: '3. Megaverse / Hyperverse → 2. Multiverse',
    chronicler: 'Chronovore & Time Lord Concordat',
    icon: '🕸️',
    summary:
      'Details how infinite Multiverses, Megaverses, and Universes are streamed via procedural generator seeds rather than static allocation.',
    fullTextParagraphs: [
      'Because infinite numbers of universes and multiverses can never fit inside finite physical vessels, the Architects of Epoch Ω-II encoded creation as InfiniteCollection<T> generator streams.',
      'Each Hyperversal node stores only a compact cryptographic seed, unfolding entire galaxies, timelines, and physical constants instantaneously whenever an explorer or Overvoid decree inspects that coordinate.',
    ],
    relatedKeywords: ['Hyperverse', 'Megaverse', 'Multiverse', 'InfiniteCollection'],
  },
  {
    id: 'annal_04_admin_rebirth_seal',
    scrollCode: 'ANNAL IV · III',
    eraReference: 'Epoch III',
    title: 'The Ancestral Species Charter & The Immutable Rebirth Seal',
    chineseTitle: '十族血脉宪章·转生封印纪',
    cosmicLayer: '1. Universe (Solara Prime)',
    chronicler: `Root Registry of ${PRIMARY_ADMIN_EMAIL}`,
    icon: '🧬',
    summary:
      'Records the founding pact of the 10 playable bloodlines and the Admin Permission Gate governing post-creation species rebirth.',
    fullTextParagraphs: [
      'Whether a Lord awakens with Azure Dragonkin horns, Empyrean Celestial wings, Kitsune spirit tails, or Void Walker crystals, their bone structure shapes how ambient Qi condenses around them in the 3D overworld.',
      `To protect karmic accountability across kingdoms, bloodline rebirth after initial genesis requires verified authorization from ${PRIMARY_ADMIN_EMAIL}, preventing war criminals from shedding their ancestral identity overnight.`,
    ],
    relatedKeywords: ['Species', 'Rebirth', 'Dragonkin', 'Kitsune', PRIMARY_ADMIN_EMAIL],
  },
  {
    id: 'annal_05_han_jue_millennium_cave',
    scrollCode: 'ANNAL V · IV',
    eraReference: 'Epoch IV',
    title: 'Han Jue’s Ten-Thousand-Year Seclusion Inside the Hidden Spirit Cave',
    chineseTitle: '韩绝万年闭关·隐灵洞天录',
    cosmicLayer: '1. Universe → Four Immortal Paths',
    chronicler: 'Daoist Mingyue',
    icon: '🏔️',
    summary:
      'Tells how Dao Ancestor Han Jue quietly cultivated all four paths while reckless sects wiped each other out across Solara.',
    fullTextParagraphs: [
      'While impulsive prodigies duelled over mortal mines and accumulated deadly Red-Name Karma, Han Jue sealed his mountain abode and refined Qi, Body, Soul, and Mind in unison across quiet centuries.',
      'When he finally stepped onto the Citadel terrace bearing concentric Dao Creator halos, his 100.0x Realm Suppression quelled an entire coalition of invading Fiends without drawing a sword.',
    ],
    relatedKeywords: ['Han Jue', 'Seclusion', 'Four Paths', 'Realm Suppression'],
  },
  {
    id: 'annal_06_gorim_celestial_anvil',
    scrollCode: 'ANNAL VI · III–V',
    eraReference: 'Epochs III–V',
    title: 'Gorim Forgehammer’s Celestial Anvil & The Damascus Iron Veins',
    chineseTitle: '高林神匠·天陨玄铁砧记',
    cosmicLayer: '1. Universe (Eastern Runic Iron Outcrops)',
    chronicler: 'Gorim Forgehammer',
    icon: '⚒️',
    summary:
      'Relates how meteoric alloy shards from a shattered Hyperverse forged Solara’s T10–T20 siege dreadnoughts.',
    fullTextParagraphs: [
      'When hyperversal war-steel struck eastern Solara, Runic Dwarves erected great bellows beside the impact ridges, taming star-metal heated to ten thousand degrees.',
      'Even today, Gorim leads armored smelting escorts past Forest Goblin ambushes to temper Shieldbearer towershields and Bomber siege barrels capable of denting World Boss carapaces.',
    ],
    relatedKeywords: ['Gorim', 'Iron', 'Steel', 'Bomber', 'Shieldbearer'],
  },
  {
    id: 'annal_07_eldrin_astral_astrolabe',
    scrollCode: 'ANNAL VII · V',
    eraReference: 'Epoch V',
    title: 'Arch-Mage Eldrin’s Astral Astrolabe & Five Elemental Fronts',
    chineseTitle: '大法师埃尔德林·星象天机仪',
    cosmicLayer: '1. Universe (Weather & Leylines)',
    chronicler: 'Arch-Mage Eldrin',
    icon: '🔮',
    summary:
      'Documents how Solara’s dynamic weather engine couples spiritual rain, snow, and thunder storms directly to combat and resource output.',
    fullTextParagraphs: [
      'Perched atop the highest arcane spire of Solara Citadel, Eldrin calibrated crystalline lenses to forecast incoming Spirit Rain, Snowfall, Blood Moon, and Storm Tribulation fronts.',
      'Seasoned Marshals consult his weather charts before launching major campaigns — withholding Shooter volleys during heavy rain while unleashing Bomber siege salvos under roaring thunderstorms.',
    ],
    relatedKeywords: ['Eldrin', 'Weather', 'Rain', 'Storm', 'Snow'],
  },
  {
    id: 'annal_08_vance_trillion_rally',
    scrollCode: 'ANNAL VIII · V',
    eraReference: 'Epoch V',
    title: 'Grand Marshal Vance & The First One-Trillion-Troop Rally',
    chineseTitle: '万斯元帅·万亿神军首战纪',
    cosmicLayer: '1. Universe (Sector B2 & Polar Crater)',
    chronicler: 'Captain Thorne',
    icon: '⚔️',
    summary:
      'Chronicles the historic combined-arms rally that broke the Void Leviathan and mapped the Northern Starfall Crater.',
    fullTextParagraphs: [
      'Before the BigInt Military Logistics Reform, commanders could barely coordinate ten million troops without logistical arithmetic overflowing. Marshal Vance standardized unified Shieldbearer-Shooter-Bomber ratios up to 1,000 Trillion reserves.',
      'At the Battle of Starfall Rim, one trillion synchronized soldiers marched in interlocking A* formations, shattering the 250M HP Ender Titan’s opening meteor shield.',
    ],
    relatedKeywords: ['Vance', 'Thorne', 'Trillion', 'Rally', 'Ender Titan'],
  },
  {
    id: 'annal_09_zane_diamond_caravans',
    scrollCode: 'ANNAL IX · V',
    eraReference: 'Epoch V',
    title: 'Caravan Master Zane & The Volcanic Diamond Road',
    chineseTitle: '泽恩商团·熔岩星钻商道志',
    cosmicLayer: '1. Universe (Scorched Magma Caldera)',
    chronicler: 'Caravan Master Zane',
    icon: '💎',
    summary:
      'Follows the hazardous trade routes between Solara Citadel and the southeastern Diamond mines guarded by Infernal Magma Drakes.',
    fullTextParagraphs: [
      'Every glittering Kingdom Diamond in the Citadel treasury travels across obsidian switchbacks chilled only by enchanted frost-wagons.',
      'Whenever Zane’s horns sound along the southern gate, citizens pour out to exchange grain and timber for crystallized fire-diamonds mined within earshot of the Level-240 Magma Drake.',
    ],
    relatedKeywords: ['Zane', 'Diamond', 'Magma', 'Caravan', 'Drake'],
  },
  {
    id: 'annal_10_celestia_sky_archipelago',
    scrollCode: 'ANNAL X · IV–V',
    eraReference: 'Epochs IV–V',
    title: 'Ascent to the Celestia Floating Sky Archipelago & Jade Pillars',
    chineseTitle: '九天浮空仙岛·飞升玉柱记',
    cosmicLayer: '1. Universe → 4. Omniverse Conduit',
    chronicler: 'Sage Lin Xuan',
    icon: '☁️',
    summary:
      'Describes the anti-gravity islands drifting above Solara where Dao Creators commune with Omniversal Envoys.',
    fullTextParagraphs: [
      'Only three artifacts survive from the ancient Celestia bridge-builders: inverted lodestone obelisks, golden cloud-waterfalls that never evaporate, and jade teleportation waypoints.',
      'Lords who complete their Golden Core and Nascent Soul tribulations ascend to these sky islands to witness the cosmic shimmer connecting Solara to the Outer Overvoids.',
    ],
    relatedKeywords: ['Celestia', 'Sky', 'Archipelago', 'Sage Lin Xuan'],
  },
  {
    id: 'annal_11_red_name_tribulation_law',
    scrollCode: 'ANNAL XI · IV',
    eraReference: 'Epoch IV',
    title: 'Jurisprudence of Heavenly Karma & The Red-Name Lightning Code',
    chineseTitle: '天道因果律·红名天劫法典',
    cosmicLayer: '1. Universe (Karmic Law)',
    chronicler: 'Elder Xuanzang',
    icon: '⚡',
    summary:
      'Codifies why aggressive PK tyranny triggers red-name aura markers and merciless sky-tribulation bolts.',
    fullTextParagraphs: [
      'In times before the Karmic Code, high-realm tyrants preyed endlessly on nascent disciples outside safe zones. The Heavenly Dao answered by burning crimson halos around every murderer’s silhouette.',
      'Should any Red-Name cultivator stand idle for mere heartbeats outside sanctuary walls, violet tribulation arcs descend from zenith clouds to sear their cultivation foundation.',
    ],
    relatedKeywords: ['Karma', 'Red Name', 'Tribulation', 'Lightning'],
  },
  {
    id: 'annal_12_silicon_harmony_2026',
    scrollCode: 'ANNAL XII · VI',
    eraReference: '06/11/2026 (v1.5.0)',
    title: 'The 128-Byte Silicon Harmony Pact & 10^100-Word Akashic Pledge',
    chineseTitle: '零六一一·软硬合道百亿兆言誓',
    cosmicLayer: 'All 6 Tiers Unified (Hardware + Software)',
    chronicler: PRIMARY_ADMIN_EMAIL,
    icon: '🖥️',
    summary:
      'Documents the v1.5.0 engineering convergence uniting SoA SIMD kernels, D3 tree inspection, Auto-Populating Lore Codex, and the 10^100-word archive.',
    fullTextParagraphs: [
      'On 06/11/2026, the Hardware and Software Architects swore the Silicon Harmony Pact: simulation kernels run lock-free across Chase-Lev job queues while visual PBR shaders adapt smoothly between desktop WebGPU Ultra and mobile ASTC tiers.',
      'At the center of this living architecture sits the 10^100-Word Akashic Lore Archive and Auto-Populating Field Codex, guaranteeing that every discovery across infinite universes is forever remembered.',
    ],
    relatedKeywords: ['06/11/2026', 'Architect', '10^100', 'SoA', 'D3'],
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
 * Searches across the 7 Historical Epochs, 6 Compendium Chapters, 12 Dynastic Annals,
 * and Open-World Lore Codex entries.
 */
export function searchLoreHistory(
  query: string,
  monsters: MonsterTarget[] = []
): {
  matchingEpochs: LoreHistoricalEpoch[];
  matchingChapters: LoreCompendiumArticle[];
  matchingCodexEntries: LoreCodexEntry[];
  matchingAnnals: LoreDynasticAnnalsEntry[];
} {
  const allCodexEntries = getCompleteLoreCodexCatalog(monsters);
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      matchingEpochs: LORE_HISTORICAL_EPOCHS,
      matchingChapters: LORE_COMPENDIUM_CHAPTERS,
      matchingCodexEntries: allCodexEntries,
      matchingAnnals: LORE_DYNASTIC_ANNALS,
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

  const matchingAnnals = LORE_DYNASTIC_ANNALS.filter(
    (annal) =>
      annal.title.toLowerCase().includes(q) ||
      annal.chineseTitle.toLowerCase().includes(q) ||
      annal.scrollCode.toLowerCase().includes(q) ||
      annal.cosmicLayer.toLowerCase().includes(q) ||
      annal.chronicler.toLowerCase().includes(q) ||
      annal.summary.toLowerCase().includes(q) ||
      annal.fullTextParagraphs.some((p) => p.toLowerCase().includes(q)) ||
      annal.relatedKeywords.some((k) => k.toLowerCase().includes(q))
  );

  return { matchingEpochs, matchingChapters, matchingCodexEntries, matchingAnnals };
}
