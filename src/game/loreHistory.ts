/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRIMARY_ADMIN_EMAIL } from './adminModeration';
import { SIX_LAYER_COSMIC_HIERARCHY, OMNIVERSE_TIER_METADATA } from './omniverse';
import { CHARACTER_SPECIES_CATALOG } from './species';

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
      `From the House of Ideas, ${PRIMARY_ADMIN_EMAIL} inscribed the six-fold ontological architecture: 1. Universe, 2. Multiverse, 3. Megaverse/Hyperverse, 4. Omniverse, 5. The Overvoid/Exoverse, and 6. The White Page itself.`,
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
      'Across Layer 5 (The Overvoid / Exoverse), distinct laws of logic and cosmic hierarchies crystallized into Layer 4 (Omniverses). Each of the Top 100 Fictional Species received its own Sovereign Omniverse (OMNI-001 to OMNI-100 + Ω-∞) and appointed a Level-1000 Background NPC Envoy under creatergame31@gmail.com.',
    chronicleScrollText: [
      'To prevent the supreme power of the Top 100 Fictional Species from collapsing a single reality, the Overvoid / Exoverse partitioned creation into distinct Omniverses, each operating under its own laws of logic and cosmic hierarchy.',
      'Tier 1 Reality-Warpers (Outer Gods, Beyonders, The Endless, Monitors, Celestialsapiens, Q Continuum), Tier 2 Type-IV+ Civilizations (Xeelee, Time Lords, Culture Minds, Forerunners, Necrons), Tier 3 Divine Pantheons (Asgardians, Ainur, Fiendcelestials, Otsutsuki), Tier 4 Cosmic Warriors (Saiyans, Kryptonians, Viltrumites), and Tier 5 Galactic Empires (Aeldari, Tyranids, Protoss, Borg) each claimed a Sovereign Omniverse.',
      `By eternal covenant, every race bound a Level-1000 Background Character Envoy to the command of Super Admin ${PRIMARY_ADMIN_EMAIL}, ready to project into the 3D Citadel Overworld or channel Omniversal tribute.`,
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
      'Within each Sovereign Omniverse, clusters of multiple Multiverses were woven into Layer 3 (Megaverse / Hyperverse), branching into Layer 2 (Multiverse parallel/series timelines) and condensing into Layer 1 (individual Universes of space, time, and matter).',
    chronicleScrollText: [
      'From the totality of Layer 4 (Omniverse), higher-dimensional brane clusters (12D–26D+ Megaverses and Hyperverses) formed the structural skeleton of creation.',
      'Each Megaverse cradled countless Layer 2 Multiverses — collections of parallel and series universes vibrating across quantum phase frequencies.',
      'At the heart of the Prime Multiverse, the Solara Universe (Layer 1) ignited with baryonic matter, stars, elemental leylines, floating Celestia sky islands, and spiritual Qi veins.',
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
    subtitle: 'From Local Spacetime Universes to The House of Ideas',
    inscribedBy: PRIMARY_ADMIN_EMAIL,
    summary:
      'Defines the six nested rungs of reality and why even Nothingness (Oblivion) is subordinate to Layer 6: The White Page / The House of Ideas.',
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
    title: 'Codex V: The 10 Citadel Eras & Trillion-Scale Siege Warfare',
    subtitle: 'Lv. 0–100 Keep Progression, T1–T20 Legions & 9-Sector Clan Wars',
    inscribedBy: 'Grand Marshal Vance & Gorim Forgehammer',
    summary:
      'Records the military doctrine of Solara Citadel, the Tri-Branch Counter Matrix, 1,000-Trillion garrison logistics, and 1-Trillion World Boss rallies.',
    keyTenets: [
      '10 Citadel Eras: Wooden Outpost -> Stone Palisade -> Fortified Keep -> Iron Citadel -> Obsidian Fortress -> Dragon Bastion -> Void Stronghold -> Celestial Spire -> Primordial Sanctum -> Omnipotent Citadel.',
      'Tri-Branch Counter Matrix: Shieldbearers counter Shooters (1.5x), Shooters counter Bombers (1.5x), Bombers counter Shieldbearers (1.5x).',
      'Autonomous World AI (Lv. 1–1000): 5 Monster Complexity Brackets navigated via A* obstacle pathfinding.',
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
      'Documents the v1.5.0 (06/11/2026) engineering convergence that powers trillion-scale simulation and 3D PBR + HDR rendering without frame drops or IEEE-754 precision loss.',
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
 * Searches across both the 7 Historical Epochs and the 6 Compendium Chapters.
 */
export function searchLoreHistory(query: string): {
  matchingEpochs: LoreHistoricalEpoch[];
  matchingChapters: LoreCompendiumArticle[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      matchingEpochs: LORE_HISTORICAL_EPOCHS,
      matchingChapters: LORE_COMPENDIUM_CHAPTERS,
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

  return { matchingEpochs, matchingChapters };
}
