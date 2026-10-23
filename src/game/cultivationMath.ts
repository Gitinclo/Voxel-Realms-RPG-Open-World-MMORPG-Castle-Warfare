/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CultivationRealmDef,
  CultivationPill,
  CultivationPath,
  CultivationPathMeta,
  CultivationPathProgress,
  CultivationManual,
  OwnedManualState,
  KarmaAlignment,
  PlayerKarmaState,
  Disciple,
  MysticalPowerSkill,
  SkillScrollItem,
  CultivationAuraVisualSpec,
} from '../types/cultivation';
import { WeatherType } from './weather';

export const CULTIVATION_PATH_LIST: CultivationPath[] = ['qi', 'body', 'soul', 'mind'];

export const CULTIVATION_PATH_META: Record<CultivationPath, CultivationPathMeta> = {
  qi: {
    id: 'qi',
    name: 'Qi Cultivation',
    chineseName: '气修 · 灵气大道',
    energyName: 'Spiritual Qi',
    vesselName: 'Dantian Sea',
    actionVerb: 'Circulate Qi Breath',
    icon: '🧘',
    specialtySummary:
      'Channels heaven and earth spiritual energy into the Dantian to wield supreme elemental laws.',
    combatBonusDesc: 'Amplifies overall Kingdom Spiritual Might & Elemental Spell Damage',
    accentColor: 'amber',
  },
  body: {
    id: 'body',
    name: 'Body Cultivation',
    chineseName: '体修 · 肉身成圣',
    energyName: 'Blood Essence',
    vesselName: 'Marrow & Physique',
    actionVerb: 'Temper Flesh & Marrow',
    icon: '🛡️',
    specialtySummary:
      'Forges skin, bones, viscera, and chaotic bloodlines into an indestructible universe-shattering vessel.',
    combatBonusDesc:
      'Multiplies Troop HP, Citadel Siege Defense & Tribulation Lightning Resistance',
    accentColor: 'rose',
  },
  soul: {
    id: 'soul',
    name: 'Soul Cultivation',
    chineseName: '魂修 · 元神不灭',
    energyName: 'Soul Force',
    vesselName: 'Sea of Consciousness',
    actionVerb: 'Refine Divine Sense',
    icon: '👁️',
    specialtySummary:
      'Condenses Yin and Yang spirits into an immortal Primordial Spirit (Yuan Shen) spanning galaxies.',
    combatBonusDesc: 'Multiplies Army Attack Precision, Critical Strike Damage & Rally Capacity',
    accentColor: 'cyan',
  },
  mind: {
    id: 'mind',
    name: 'Mind Cultivation',
    chineseName: '心修 · 无暇道心',
    energyName: 'Dao Willpower',
    vesselName: 'Dao Heart',
    actionVerb: 'Contemplate Dao Heart',
    icon: '🪷',
    specialtySummary:
      'Tempers an unshakeable Dao Heart immune to inner demons, karma backlash, and cosmic despair.',
    combatBonusDesc:
      'Boosts All-Path Cultivation Speed, Breakthrough Success Rate (+%) & Inner Demon Immunity',
    accentColor: 'purple',
  },
};

export const CULTIVATION_REALMS: CultivationRealmDef[] = [
  // 1. Mortal Eras (The Starting World - Han Jue inside Jade Pure Sacred Sect)
  {
    id: 'realm_qi_refine',
    path: 'qi',
    name: 'Qi Refinement',
    chineseName: '练气境',
    era: 'mortal',
    index: 0,
    totalLayers: 9,
    description: 'Absorbing worldly energy and ambient spirit Qi into the mortal body.',
    lore: 'The fundamental entry into Dao. Han Jue quietly gathers pure Qi in secluded cave abodes away from sect disputes.',
    basePowerMultiplier: 1.1,
    baseQiPerLayer: 5_000n,
    tribulationRounds: 0,
    icon: '🧘',
  },
  {
    id: 'realm_foundation',
    path: 'qi',
    name: 'Foundation Establishment',
    chineseName: '筑基境',
    era: 'mortal',
    index: 1,
    totalLayers: 9,
    description: 'Condensing gaseous spiritual Qi into a liquid spiritual sea inside the dantian.',
    lore: 'Purging physical mortal impurities. True lifespan extends to two centuries.',
    basePowerMultiplier: 2.0,
    baseQiPerLayer: 80_000n,
    tribulationRounds: 1,
    icon: '🌊',
  },
  {
    id: 'realm_golden_core',
    path: 'qi',
    name: 'Golden Core Realm',
    chineseName: '金丹境',
    era: 'mortal',
    index: 2,
    totalLayers: 9,
    description: 'Compressing the liquid spiritual pool into an indestructible solid core.',
    lore: 'My core is indestructible; longevity reaches five hundred years. True magical flight achieved.',
    basePowerMultiplier: 5.0,
    baseQiPerLayer: 1_200_000n,
    tribulationRounds: 2,
    icon: '🔮',
  },
  {
    id: 'realm_nascent_soul',
    path: 'qi',
    name: 'Nascent Soul Realm',
    chineseName: '元婴境',
    era: 'mortal',
    index: 3,
    totalLayers: 9,
    description: 'Birthing an autonomous spiritual infant inside the dantian.',
    lore: 'Even if the mortal body is shattered, the nascent soul can teleport across thousands of miles.',
    basePowerMultiplier: 15.0,
    baseQiPerLayer: 18_000_000n,
    tribulationRounds: 3,
    icon: '✨',
  },
  {
    id: 'realm_soul_formation',
    path: 'qi',
    name: 'Soul Formation Realm',
    chineseName: '化神境',
    era: 'mortal',
    index: 4,
    totalLayers: 9,
    description:
      'Transforming the nascent soul into an astral divine spirit merged with natural laws.',
    lore: 'Can project divine consciousness across entire continental empires.',
    basePowerMultiplier: 50.0,
    baseQiPerLayer: 250_000_000n,
    tribulationRounds: 3,
    icon: '🌟',
  },
  {
    id: 'realm_void_returning',
    path: 'qi',
    name: 'Void Returning Realm',
    chineseName: '返虚境',
    era: 'mortal',
    index: 5,
    totalLayers: 9,
    description: 'Merging the spirit with the infinite void, fading out of worldly perception.',
    lore: 'Dissolving tangible boundaries. Han Jue operates with supreme stealth, immune to minor divination.',
    basePowerMultiplier: 180.0,
    baseQiPerLayer: 3_500_000_000n,
    tribulationRounds: 4,
    icon: '🌌',
  },
  {
    id: 'realm_body_integration',
    path: 'qi',
    name: 'Body Integration Realm',
    chineseName: '合体境',
    era: 'mortal',
    index: 6,
    totalLayers: 9,
    description:
      'Fusing the physical indestructible body and transcendent soul into one unified vessel.',
    lore: 'The physical form becomes a walking miniature realm, commanding domain pressure.',
    basePowerMultiplier: 650.0,
    baseQiPerLayer: 50_000_000_000n,
    tribulationRounds: 5,
    icon: '⚔️',
  },
  {
    id: 'realm_tribulation',
    path: 'qi',
    name: 'Tribulation Transcendence Realm',
    chineseName: '渡劫境',
    era: 'mortal',
    index: 7,
    totalLayers: 9,
    description: 'Weathering the Nine Heavenly Lightning Tribulations to shed all mortal karma.',
    lore: 'Heavenly Dao tests the resolve. Lightning strikes incinerate those with unstable foundations.',
    basePowerMultiplier: 2_500.0,
    baseQiPerLayer: 700_000_000_000n,
    tribulationRounds: 6,
    icon: '⚡',
  },
  {
    id: 'realm_mahayana',
    path: 'qi',
    name: 'Mahayana Realm',
    chineseName: '大乘境',
    era: 'mortal',
    index: 8,
    totalLayers: 9,
    description:
      'The absolute peak of the mortal world, waiting for the celestial ascension light.',
    lore: 'Sovereign of all mortal cultivators. One step away from setting foot in the Immortal World.',
    basePowerMultiplier: 10_000.0,
    baseQiPerLayer: 10_000_000_000_000n,
    tribulationRounds: 7,
    icon: '🏯',
  },

  // 2. Immortal & Sage Eras (The Heavenly Court & Immortal World)
  {
    id: 'realm_loose_immortal',
    path: 'qi',
    name: 'Loose Immortal',
    chineseName: '散仙境',
    era: 'immortal_sage',
    index: 9,
    totalLayers: 9,
    description:
      'Basic immortal stage; shedding mortal flesh to channel pure celestial immortal Qi.',
    lore: 'Ascended beyond worldly limitations, capable of manipulating regional natural laws.',
    basePowerMultiplier: 50_000.0,
    baseQiPerLayer: 150_000_000_000_000n,
    tribulationRounds: 4,
    icon: '🍃',
  },
  {
    id: 'realm_earth_immortal',
    path: 'qi',
    name: 'Earth Immortal',
    chineseName: '地仙境',
    era: 'immortal_sage',
    index: 10,
    totalLayers: 9,
    description: 'Grounding spirit into immortal terrestrial leylines and planetary veins.',
    lore: 'Drawing immortal vigor endlessly from mountain ranges and subterranean divine springs.',
    basePowerMultiplier: 250_000.0,
    baseQiPerLayer: 2_000_000_000_000_000n,
    tribulationRounds: 4,
    icon: '⛰️',
  },
  {
    id: 'realm_heaven_immortal',
    path: 'qi',
    name: 'Heaven Immortal',
    chineseName: '天仙境',
    era: 'immortal_sage',
    index: 11,
    totalLayers: 9,
    description: 'Resonating directly with the Nine Heavens and celestial starry firmaments.',
    lore: 'Gaining entry into the grand Heavenly Court court registers.',
    basePowerMultiplier: 1_200_000.0,
    baseQiPerLayer: 30_000_000_000_000_000n,
    tribulationRounds: 5,
    icon: '☁️',
  },
  {
    id: 'realm_grand_xuan_immortal',
    path: 'qi',
    name: 'Grand Xuan Immortal',
    chineseName: '玄仙境',
    era: 'immortal_sage',
    index: 12,
    totalLayers: 9,
    description: 'Grasping deep cosmic mysteries and immortal law permutations.',
    lore: 'Channeling profound celestial formations capable of trapping ancient mythological beasts.',
    basePowerMultiplier: 6_000_000.0,
    baseQiPerLayer: 450_000_000_000_000_000n,
    tribulationRounds: 5,
    icon: '💠',
  },
  {
    id: 'realm_golden_immortal',
    path: 'qi',
    name: 'Golden Immortal',
    chineseName: '金仙境',
    era: 'immortal_sage',
    index: 13,
    totalLayers: 9,
    description:
      'Gaining true, unconditional immortality, unaging life, and permanent spirit light.',
    lore: 'Free from the five elements and natural rebirth cycles. My life is mine, not decided by heaven.',
    basePowerMultiplier: 35_000_000.0,
    baseQiPerLayer: 6_000_000_000_000_000_000n,
    tribulationRounds: 6,
    icon: '👑',
  },
  {
    id: 'realm_taiyi_golden_immortal',
    path: 'qi',
    name: 'Taiyi Golden Immortal',
    chineseName: '太乙金仙',
    era: 'immortal_sage',
    index: 14,
    totalLayers: 9,
    description: 'Breaking standard linear causality and fate strings.',
    lore: 'Manipulating destiny and premonition. Han Jue avoids celestial karma wars with absolute precision.',
    basePowerMultiplier: 200_000_000.0,
    baseQiPerLayer: 85_000_000_000_000_000_000n,
    tribulationRounds: 6,
    icon: '📜',
  },
  {
    id: 'realm_zenith_heaven',
    path: 'qi',
    name: 'Zenith Heaven Golden Immortal',
    chineseName: '大罗金仙',
    era: 'immortal_sage',
    index: 15,
    totalLayers: 9,
    description:
      'Stepping out of the river of time; completely immune to standard cause and effect.',
    lore: 'Existing simultaneously across past, present, and future in the mortal timeline.',
    basePowerMultiplier: 1_200_000_000.0,
    baseQiPerLayer: 1_200_000_000_000_000_000_000n,
    tribulationRounds: 7,
    icon: '⏳',
  },
  {
    id: 'realm_pseudo_sage',
    path: 'qi',
    name: 'Pseudo-Sage / Deity Realm',
    chineseName: '准圣 / 神境',
    era: 'immortal_sage',
    index: 16,
    totalLayers: 9,
    description: 'Touching upon the primordial laws of the Heavenly Dao itself.',
    lore: 'Slicing away the three corpses (good, evil, and self) to peer into the ultimate throne.',
    basePowerMultiplier: 8_000_000_000.0,
    baseQiPerLayer: 18_000_000_000_000_000_000_000n,
    tribulationRounds: 7,
    icon: '☯️',
  },
  {
    id: 'realm_heavenly_sage',
    path: 'qi',
    name: 'Sage (Heavenly Dao Sage)',
    chineseName: '天道圣人',
    era: 'immortal_sage',
    index: 17,
    totalLayers: 9,
    description:
      'Bound to the Heavenly Dao. Completely immortal within their universe with reality manipulation.',
    lore: 'As long as the Heavenly Dao endures, the Sage never perishes. Reality bends to their word.',
    basePowerMultiplier: 60_000_000_000.0,
    baseQiPerLayer: 250_000_000_000_000_000_000_000n,
    tribulationRounds: 8,
    icon: '☀️',
  },
  {
    id: 'realm_freedom_sage',
    path: 'qi',
    name: 'Freedom Sage Realm',
    chineseName: '混元大罗 / 自由圣人',
    era: 'immortal_sage',
    index: 18,
    totalLayers: 9,
    description:
      'Breaking free from the restrictions of a single universe’s Dao. Han Huang was born here.',
    lore: 'Transcending universal boundaries. Untouchable by universal collapse or Heavenly Dao reboots.',
    basePowerMultiplier: 500_000_000_000.0,
    baseQiPerLayer: 3_500_000_000_000_000_000_000_000n,
    tribulationRounds: 8,
    icon: '🕊️',
  },

  // 3. Great Dao & Cosmic Eras (The Chaos)
  {
    id: 'realm_great_dao_sage',
    path: 'qi',
    name: 'Great Dao Sage',
    chineseName: '大道圣人',
    era: 'chaos_dao',
    index: 19,
    totalLayers: 9,
    description:
      'Cultivators who possess and control an independent, self-contained Great Dao law.',
    lore: 'Wielding primordial cosmic authority beyond billions of mortal and immortal realms.',
    basePowerMultiplier: 4_500_000_000_000.0,
    baseQiPerLayer: 50_000_000_000_000_000_000_000_000n,
    tribulationRounds: 9,
    icon: '🪐',
  },
  {
    id: 'realm_great_dao_supreme',
    path: 'qi',
    name: 'Great Dao Supreme',
    chineseName: '大道至尊',
    era: 'chaos_dao',
    index: 20,
    totalLayers: 9,
    description: 'Powerhouses capable of destroying or creating entire universes within the Chaos.',
    lore: 'A single breath ignites cosmic supernovas. Navigating the unfathomable depths of the Chaos.',
    basePowerMultiplier: 40_000_000_000_000.0,
    baseQiPerLayer: 750_000_000_000_000_000_000_000_000n,
    tribulationRounds: 9,
    icon: '🌌',
  },
  {
    id: 'realm_dao_creator',
    path: 'qi',
    name: 'Dao Creator',
    chineseName: '大道神灵 / 创造者',
    era: 'chaos_dao',
    index: 21,
    totalLayers: 9,
    description:
      'The supreme authority figures of reality. They create their own unique Great Dao Worlds.',
    lore: 'Functionally omnipotent to all lower beings. Entities like The Ninth Chaos and Han Huang stop here.',
    basePowerMultiplier: 500_000_000_000_000.0,
    baseQiPerLayer: 10_000_000_000_000_000_000_000_000_000n,
    tribulationRounds: 9,
    icon: '👁️',
  },

  // 4. The Peak (Han Jue’s Exclusive Realm)
  {
    id: 'realm_ultimate_origin',
    path: 'qi',
    name: 'Ultimate Origin Supreme Realm',
    chineseName: '终元至高境界',
    era: 'ultimate_origin',
    index: 22,
    totalLayers: 9,
    description:
      'The absolute final realm achieved exclusively by Han Jue. Sits infinitely above Dao Creators.',
    lore: 'Completely omniscient, omnipotent, and able to create, destroy, or rewrite entire infinite multiverses with a single thought.',
    basePowerMultiplier: 10_000_000_000_000_000.0,
    baseQiPerLayer: 200_000_000_000_000_000_000_000_000_000n,
    tribulationRounds: 9,
    icon: '☯️👑',
  },
];

export const QI_REALMS: CultivationRealmDef[] = CULTIVATION_REALMS;

// Helper to build the 23 realms (9 layers each) for Body, Soul, and Mind paths using the exact same mathematical curve
function buildPathRealms(
  path: CultivationPath,
  specs: Array<{
    id: string;
    name: string;
    chineseName: string;
    description: string;
    lore: string;
    icon: string;
  }>
): CultivationRealmDef[] {
  return specs.map((spec, idx) => {
    const base = CULTIVATION_REALMS[idx];
    return {
      id: spec.id,
      path,
      name: spec.name,
      chineseName: spec.chineseName,
      era: base.era,
      index: idx,
      totalLayers: 9,
      description: spec.description,
      lore: spec.lore,
      basePowerMultiplier: base.basePowerMultiplier,
      baseQiPerLayer: base.baseQiPerLayer,
      tribulationRounds: base.tribulationRounds,
      icon: spec.icon,
    };
  });
}

export const BODY_REALMS: CultivationRealmDef[] = buildPathRealms('body', [
  // 1. Mortal Eras (9 realms)
  {
    id: 'body_skin_flesh',
    name: 'Skin & Flesh Tempering',
    chineseName: '淬皮炼肉境',
    description:
      'Hardening epidermis and muscle fibers with spirit beast blood until impervious to mortal blades.',
    lore: 'Every pore breathes vital blood energy; ordinary arrows shatter against the skin.',
    icon: '🥊',
  },
  {
    id: 'body_bone_forging',
    name: 'Iron Bone Forging',
    chineseName: '锻骨易筋境',
    description: 'Hammering the 206 mortal bones and tendons into dense black-iron pillars.',
    lore: 'A single punch produces sonic booms capable of collapsing fortress gates.',
    icon: '🦴',
  },
  {
    id: 'body_viscera_renewal',
    name: 'Five Viscera Renewal',
    chineseName: '洗髓炼脏境',
    description:
      'Purifying the internal organs and bone marrow into a self-sustaining furnace of vitality.',
    lore: 'Heartbeats echo like war drums; poison and mortal diseases are incinerated instantly.',
    icon: '🫀',
  },
  {
    id: 'body_golden_marrow',
    name: 'Golden Marrow Realm',
    chineseName: '金髓玉骨境',
    description:
      'Transforming bone marrow into liquid gold that continuously regenerates severed limbs.',
    lore: 'Blood becomes heavy as mercury, glowing with a faint golden radiance.',
    icon: '🔱',
  },
  {
    id: 'body_sacred_physique',
    name: 'Sacred Martial Physique',
    chineseName: '圣体初成境',
    description:
      'Awakening ancient martial totems within the bloodline to crush mountains barehanded.',
    lore: 'Physical shockwaves tear apart spatial rifts without using a single drop of spell Qi.',
    icon: '🛡️',
  },
  {
    id: 'body_void_imperishable',
    name: 'Void Imperishable Body',
    chineseName: '虚空不灭体',
    description: 'Tempering the physical shell inside turbulent spatial cracks and void storms.',
    lore: 'Even if thrown into a collapsing pocket dimension, the physical body remains unscathed.',
    icon: '🌀',
  },
  {
    id: 'body_nirvana_vessel',
    name: 'Bloodline Nirvana Realm',
    chineseName: '涅槃金身境',
    description:
      'Undergoing nine cycles of physical rebirth; a single drop of blood can regrow the entire body.',
    lore: 'Like an undying phoenix forged in primordial magma, every injury makes the vessel stronger.',
    icon: '🔥',
  },
  {
    id: 'body_tribulation_lightning',
    name: 'Tribulation Lightning Body',
    chineseName: '雷劫战体境',
    description:
      'Devouring heavenly tribulation lightning directly into the muscles to engrave thunder runes.',
    lore: 'Instead of fearing heavenly punishment, the body cultivator bathes in celestial thunder.',
    icon: '⚡',
  },
  {
    id: 'body_mahayana_vessel',
    name: 'Mahayana Diamond Vessel',
    chineseName: '大乘金刚体',
    description:
      'The pinnacle of mortal physical cultivation; flesh and blood radiate immortal golden light.',
    lore: 'A single stomp cracks continental plates, ready to shatter the gates of the Immortal World.',
    icon: '🗿',
  },
  // 2. Immortal & Sage Eras (10 realms)
  {
    id: 'body_loose_immortal',
    name: 'Loose Immortal Physique',
    chineseName: '散仙灵躯',
    description: 'Replacing mortal cells with immortal crystalline fibers that never decay.',
    lore: 'Mortal weapons disintegrate on contact with the cultivator’s bare palm.',
    icon: '💎',
  },
  {
    id: 'body_earth_immortal',
    name: 'Earth Immortal Titan Body',
    chineseName: '地仙山岳体',
    description: 'Fusing the physical spine with planetary gravity and terrestrial dragon veins.',
    lore: 'Carrying the weight of ten thousand mountains in every stride.',
    icon: '⛰️',
  },
  {
    id: 'body_heaven_immortal',
    name: 'Heaven Immortal Astral Body',
    chineseName: '天仙星辰体',
    description:
      'Drawing starlight from the Nine Heavens to temper acupoints into miniature stars.',
    lore: '365 acupoints blaze like a constellation inside the flesh.',
    icon: '🌟',
  },
  {
    id: 'body_grand_xuan',
    name: 'Grand Xuan Profound Vessel',
    chineseName: '玄仙不坏体',
    description: 'Weaving profound yin-yang magnetic forcefields directly into muscle fibers.',
    lore: 'Rebounds ninety percent of incoming physical and elemental siege strikes.',
    icon: '💠',
  },
  {
    id: 'body_golden_immortal',
    name: 'Golden Immortal Indestructible Body',
    chineseName: '万劫不灭金身',
    description:
      'Forging an eternal golden body that remains unblemished across ten thousand kalpas.',
    lore: 'Even if stars explode at point-blank range, not a single hair is singed.',
    icon: '👑',
  },
  {
    id: 'body_taiyi_sacred',
    name: 'Taiyi Origin Physique',
    chineseName: '太乙先天道体',
    description:
      'Reverting the body to an innate congenital lifeform born before heaven and earth.',
    lore: 'Immune to curses and karmic hexes targeting the physical bloodline.',
    icon: '🐉',
  },
  {
    id: 'body_zenith_heaven',
    name: 'Zenith Heaven Immortal Body',
    chineseName: '大罗混元战体',
    description:
      'Anchoring the physical form across all timelines; physical death becomes an impossibility.',
    lore: 'Every drop of blood contains a projection of an ancient martial world.',
    icon: '⏳',
  },
  {
    id: 'body_pseudo_sage',
    name: 'Pseudo-Sage Ancestral Body',
    chineseName: '准圣祖巫战躯',
    description:
      'Condensing ancestral titan bloodlines that rival the Heavenly Dao in sheer physical might.',
    lore: 'Tearing apart celestial arrays and divine artifacts with bare hands.',
    icon: '🪓',
  },
  {
    id: 'body_heavenly_sage',
    name: 'Heavenly Dao Indestructible Body',
    chineseName: '天道不朽圣躯',
    description:
      'Sanctifying the flesh with Heavenly Dao laws; the body itself is an unbreakable universe.',
    lore: 'As long as the universe exists, the Sage’s physical stamina is infinite.',
    icon: '☀️',
  },
  {
    id: 'body_freedom_sage',
    name: 'Freedom Chaotic Physique',
    chineseName: '混元无极战体',
    description:
      'Breaking free from universal matter limits to walk bare-chested through raw primordial chaos.',
    lore: 'Chaotic winds that shred normal sages merely polish this peerless physique.',
    icon: '🦁',
  },
  // 3. Great Dao & Cosmic Eras (3 realms)
  {
    id: 'body_great_dao_fiend',
    name: 'Great Dao Fiendcelestial Body',
    chineseName: '大道魔神真身',
    description:
      'Transforming into a three-thousand-zhang Chaos Fiendcelestial whose bones are Great Dao chains.',
    lore: 'Han Jue’s primordial fiendcelestial body can swallow entire星域 (star domains) in a single breath.',
    icon: '👹',
  },
  {
    id: 'body_great_dao_supreme',
    name: 'Great Dao Supreme Vessel',
    chineseName: '大道至尊宝体',
    description:
      'Every cell evolves into an independent cosmos teeming with trillions of living beings.',
    lore: 'A single fist strike shatters supreme universes within the boundless Chaos.',
    icon: '🌌',
  },
  {
    id: 'body_dao_creator',
    name: 'Chaos Creator Physique',
    chineseName: '创世造化神躯',
    description:
      'The ultimate physical origin; flesh and blood give birth to brand-new Great Dao Worlds.',
    lore: 'Standing taller than the Chaos itself, impervious to all lower reality erasure.',
    icon: '🏛️',
  },
  // 4. The Peak (1 realm)
  {
    id: 'body_ultimate_origin',
    name: 'Ultimate Origin Eternal Body',
    chineseName: '终元永恒不灭躯',
    description:
      'Han Jue’s exclusive physical peak. Transcends concept, matter, and non-existence altogether.',
    lore: 'An eternal, omnipotent vessel that encompasses infinite multiverses within a single palm.',
    icon: '🛡️👑',
  },
]);

export const SOUL_REALMS: CultivationRealmDef[] = buildPathRealms('soul', [
  // 1. Mortal Eras (9 realms)
  {
    id: 'soul_awakening',
    name: 'Mortal Soul Awakening',
    chineseName: '开窍启灵境',
    description:
      'Opening the spiritual eye between the brows and awakening the dormant Sea of Consciousness.',
    lore: 'Perceiving the flow of Qi and sensing incoming ambushes before they strike.',
    icon: '🕯️',
  },
  {
    id: 'soul_sense_condense',
    name: 'Spirit Sense Condensation',
    chineseName: '凝识成丝境',
    description:
      'Weaving scattered mental thoughts into invisible threads of telekinetic Divine Sense.',
    lore: 'Controlling flying swords and scouting enemy fortifications from ten miles away.',
    icon: '🕸️',
  },
  {
    id: 'soul_yin_spirit',
    name: 'Yin Spirit Manifestation',
    chineseName: '阴神出窍境',
    description:
      'Condensing the soul into a tangible phantom that can leave the body under moonlight.',
    lore: 'Capable of spectral travel and silent assassination through solid fortress walls.',
    icon: '🌙',
  },
  {
    id: 'soul_yang_spirit',
    name: 'Yang Spirit Projection',
    chineseName: '阳神显化境',
    description:
      'Purging all Yin weakness from the soul so it blazes like a miniature sun, immune to solar winds.',
    lore: 'The soul can now wield magical treasures independently across thousands of leagues.',
    icon: '☀️',
  },
  {
    id: 'soul_astral_formation',
    name: 'Astral Soul Formation',
    chineseName: '星魂化神境',
    description:
      'Expanding the Sea of Consciousness into a vast starry lake reflecting natural laws.',
    lore: 'A single mental spike can shatter the minds of an entire enemy battalion.',
    icon: '🌠',
  },
  {
    id: 'soul_void_sense',
    name: 'Void Divine Sense',
    chineseName: '洞虚神念境',
    description:
      'Merging soul consciousness with spatial frequencies to scan across dimensional folds.',
    lore: 'Han Jue’s divine sense monitors the entire mortal world without leaving his cave.',
    icon: '👁️',
  },
  {
    id: 'soul_yuan_shen',
    name: 'Primordial Spirit (Yuan Shen)',
    chineseName: '元神真仙境',
    description:
      'Fusing essence, Qi, and spirit into an indestructible, self-aware Primordial Spirit.',
    lore: 'Even if the body is reduced to ash, the Yuan Shen can seize rebirth or reconstruct a vessel.',
    icon: '🧘‍♂️',
  },
  {
    id: 'soul_thunder_baptized',
    name: 'Thunder-Baptized Soul',
    chineseName: '雷炼元神境',
    description:
      'Cleansing the Primordial Spirit in heavenly tribulation fire to burn away all karmic tethers.',
    lore: 'The soul gleams like violet thunder-crystal, radiating terrifying spiritual coercion.',
    icon: '⚡',
  },
  {
    id: 'soul_mahayana_divine',
    name: 'Mahayana Divine Spirit',
    chineseName: '大乘神魂境',
    description:
      'The mortal soul limit; divine sense blankets the entire planet and peers into the Immortal World.',
    lore: 'Every thought calculates ten thousand battlefield formations instantaneously.',
    icon: '🔮',
  },
  // 2. Immortal & Sage Eras (10 realms)
  {
    id: 'soul_loose_immortal',
    name: 'Loose Immortal Soul',
    chineseName: '散仙仙魂',
    description: 'Transforming mortal spiritual consciousness into immortal soul light.',
    lore: 'Telepathic commands coordinate millions of troops with zero delay.',
    icon: '🍃',
  },
  {
    id: 'soul_earth_immortal',
    name: 'Earth Immortal Spirit',
    chineseName: '地仙神识',
    description:
      'Linking the Sea of Consciousness with continental spirit veins to perceive all subterranean secrets.',
    lore: 'No hidden assassin or underground ambush can escape detection.',
    icon: '⛰️',
  },
  {
    id: 'soul_heaven_immortal',
    name: 'Heaven Immortal Divine Sense',
    chineseName: '天仙真魂',
    description: 'Ascending the soul into the astral river of the Nine Heavens.',
    lore: 'Capable of imparting dreams and divine revelations across lower mortal realms.',
    icon: '☁️',
  },
  {
    id: 'soul_grand_xuan',
    name: 'Grand Xuan Astral Soul',
    chineseName: '玄仙通幽魂',
    description:
      'Splitting the Primordial Spirit into thousands of independent clones for simultaneous cultivation.',
    lore: 'Each thought-clone possesses independent combat intelligence.',
    icon: '💠',
  },
  {
    id: 'soul_golden_immortal',
    name: 'Golden Immortal True Spirit',
    chineseName: '金仙不朽真灵',
    description:
      'Forging an immortal True Spirit (Zhen Ling) that transcends the River of Reincarnation.',
    lore: 'Soul attacks from lower beings dissolve like snow in a furnace.',
    icon: '👑',
  },
  {
    id: 'soul_taiyi_fate',
    name: 'Taiyi Fate-Reading Soul',
    chineseName: '太乙衍天魂',
    description: 'Perceiving the threads of karma and destiny attached to every living soul.',
    lore: 'Han Jue uses simulated trials in his mind to foresee and curse distant enemies.',
    icon: '📜',
  },
  {
    id: 'soul_zenith_timeless',
    name: 'Zenith Heaven Timeless Soul',
    chineseName: '大罗超脱神魂',
    description:
      'A True Spirit anchored outside the River of Time; memories and consciousness are eternal.',
    lore: 'Anyone who speaks the cultivator’s true name is immediately sensed across time.',
    icon: '⏳',
  },
  {
    id: 'soul_pseudo_sage',
    name: 'Pseudo-Sage Divine Consciousness',
    chineseName: '准圣浩瀚圣念',
    description: 'Divine sense expands to encompass the entire Immortal World and Netherworld.',
    lore: 'A single gaze can erase the souls of an entire army of Golden Immortals.',
    icon: '☯️',
  },
  {
    id: 'soul_heavenly_sage',
    name: 'Heavenly Dao Sage Soul',
    chineseName: '天道圣魂',
    description: 'Merging the True Spirit with the Heavenly Dao’s cosmic consciousness.',
    lore: 'Omniscient within the home universe; every falling leaf and rising star is known.',
    icon: '☀️',
  },
  {
    id: 'soul_freedom_sage',
    name: 'Freedom Sage Yuan Shen',
    chineseName: '混元无拘圣魂',
    description: 'Detaching the True Spirit from the Heavenly Dao so it roams the Chaos freely.',
    lore: 'Even if the home universe is annihilated, the Freedom Sage’s soul remains whole.',
    icon: '🕊️',
  },
  // 3. Great Dao & Cosmic Eras (3 realms)
  {
    id: 'soul_great_dao',
    name: 'Great Dao Sacred Soul',
    chineseName: '大道圣魂',
    description:
      'The Primordial Spirit embodies a complete Great Dao Law, projecting soul realms across Chaos.',
    lore: 'Soul illusions become indistinguishable from true cosmic reality.',
    icon: '🪐',
  },
  {
    id: 'soul_great_dao_supreme',
    name: 'Great Dao Supreme Spirit',
    chineseName: '大道至尊神魂',
    description:
      'Consciousness spans trillions of chaos light-years, suppressing ancient chaos overlords.',
    lore: 'A single mental decree rewrites the laws of soul and reincarnation across universes.',
    icon: '🌌',
  },
  {
    id: 'soul_dao_creator',
    name: 'Dao Creator Omniscient Soul',
    chineseName: '创世全知神魂',
    description:
      'The supreme soul origin capable of birthing trillions of sentient souls with a single thought.',
    lore: 'All beings within the Great Dao World exist as reflections within the Creator’s mind.',
    icon: '👁️‍🗨️',
  },
  // 4. The Peak (1 realm)
  {
    id: 'soul_ultimate_origin',
    name: 'Ultimate Origin Eternal Soul',
    chineseName: '终元至高永生魂',
    description:
      'Han Jue’s exclusive soul pinnacle. Absolute omniscience across all past, present, and future multiverses.',
    lore: 'One thought creates infinite realms; one thought erases Dao Creators from existence.',
    icon: '👁️👑',
  },
]);

export const MIND_REALMS: CultivationRealmDef[] = buildPathRealms('mind', [
  // 1. Mortal Eras (9 realms)
  {
    id: 'mind_calm_heart',
    name: 'Calm Water Heart',
    chineseName: '止水凡心境',
    description: 'Quieting worldly greed, anger, and impatience to enter deep secluded meditation.',
    lore: 'Han Jue’s first rule of survival: never provoke karma out of vanity or impulse.',
    icon: '💧',
  },
  {
    id: 'mind_clear_mirror',
    name: 'Clear Mirror Mind',
    chineseName: '明镜台心境',
    description:
      'Polishing the mind like a flawless mirror that reflects illusions without attachment.',
    lore: 'Charm spells and mortal Phantasm arrays shatter upon touching the Clear Mirror.',
    icon: '🪞',
  },
  {
    id: 'mind_unwavering_will',
    name: 'Unwavering Rock Will',
    chineseName: '磐石道志境',
    description:
      'Forging mental resolve as steadfast as an ancient mountain through centuries of solitude.',
    lore: 'Lonely seclusion that drives ordinary geniuses mad only sweetens Han Jue’s tea.',
    icon: '🪨',
  },
  {
    id: 'mind_flawless_dao_heart',
    name: 'Flawless Dao Heart',
    chineseName: '无暇道心境',
    description: 'Condensing a crystal-pure Dao Heart free of regret, hesitation, or self-doubt.',
    lore: 'Breakthrough bottlenecks loosen naturally before a cultivator with a Flawless Dao Heart.',
    icon: '💎',
  },
  {
    id: 'mind_slaying_demons',
    name: 'Inner Demon Slaying Heart',
    chineseName: '斩魔诛妄境',
    description: 'Confronting and severing all inner demons (Xin Mo) born from obsession and fear.',
    lore: 'Inner demons that attempt to invade this mind are devoured as nourishment instead.',
    icon: '⚔️',
  },
  {
    id: 'mind_void_tranquility',
    name: 'Void Tranquility Mind',
    chineseName: '太虚寂静心',
    description:
      'Embracing the silent, boundless emptiness of the void while maintaining razor-sharp awareness.',
    lore: 'A millennium passes in the blink of an eye; the Dao Heart remains eternally tranquil.',
    icon: '🌌',
  },
  {
    id: 'mind_heaven_defying',
    name: 'Heaven-Defying Will',
    chineseName: '逆天唯我意',
    description:
      'Cultivating an indomitable willpower that refuses to bow even before celestial pressure.',
    lore: 'Cautious in action, yet invincible and unyielding in Dao conviction.',
    icon: '🔥',
  },
  {
    id: 'mind_tribulation_fearless',
    name: 'Tribulation Fearless Heart',
    chineseName: '渡劫无畏心',
    description: 'Facing the apocalyptic wrath of Heavenly Tribulation with serene composure.',
    lore: 'Where others tremble before thunder of annihilation, the Fearless Heart sees only enlightenment.',
    icon: '⚡',
  },
  {
    id: 'mind_mahayana_enlightened',
    name: 'Mahayana Enlightened Mind',
    chineseName: '大乘圆满道心',
    description: 'Complete comprehension of mortal joy, sorrow, life, and death.',
    lore: 'No mortal karma can stain the robe of one whose mind has transcended the dust.',
    icon: '🪷',
  },
  // 2. Immortal & Sage Eras (10 realms)
  {
    id: 'mind_loose_immortal',
    name: 'Loose Immortal Detachment',
    chineseName: '散仙超凡心',
    description:
      'Shedding mortal emotional shackles to view the rise and fall of dynasties with calm detachment.',
    lore: 'Ten thousand years of seclusion feel like a brief morning nap.',
    icon: '🍃',
  },
  {
    id: 'mind_earth_immortal',
    name: 'Earth Immortal Serenity',
    chineseName: '地仙厚德心',
    description: 'Grounding the Dao Heart with the vast, patient endurance of the immortal earth.',
    lore: 'Unmoved by slander or praise; steady accumulation is the true kingly way.',
    icon: '⛰️',
  },
  {
    id: 'mind_heaven_immortal',
    name: 'Heaven Immortal Firmament Will',
    chineseName: '天仙苍穹意',
    description: 'Expanding mental horizons to match the boundless celestial firmament.',
    lore: 'Comprehending heavenly decrees and cosmic cultivation scriptures at a glance.',
    icon: '☁️',
  },
  {
    id: 'mind_grand_xuan',
    name: 'Grand Xuan Profound Mind',
    chineseName: '玄仙妙悟心',
    description:
      'Entering a state of perpetual epiphany where every breath deepens Dao comprehension.',
    lore: 'All four cultivation paths harmonize effortlessly under the Profound Mind.',
    icon: '💠',
  },
  {
    id: 'mind_golden_immortal',
    name: 'Golden Immortal Eternal Heart',
    chineseName: '金仙不朽道心',
    description:
      'An unaging, unchanging Dao Heart that never erodes even across millions of years of solitude.',
    lore: 'While ancient immortals go mad from boredom, Han Jue’s Dao Heart grows ever brighter.',
    icon: '👑',
  },
  {
    id: 'mind_taiyi_causality',
    name: 'Taiyi Karma-Free Mind',
    chineseName: '太乙无因果心',
    description:
      'Walking through rivers of karma without leaving a trace or incurring karmic debt.',
    lore: 'Severing all mental ties to calamity; misfortune cannot find an anchor.',
    icon: '📜',
  },
  {
    id: 'mind_zenith_transcendent',
    name: 'Zenith Heaven Transcendent Will',
    chineseName: '大罗唯一道意',
    description:
      'Unifying the willpower of past, present, and future selves into one absolute truth.',
    lore: 'Mental coercion from any temporal paradox is instantly nullified.',
    icon: '⏳',
  },
  {
    id: 'mind_pseudo_sage',
    name: 'Pseudo-Sage Three-Corpse Severing Heart',
    chineseName: '准圣斩三尸道心',
    description:
      'Mastering Virtue, Evil, and Self desires completely to stand at the threshold of Sagehood.',
    lore: 'No mental flaw remains in the entire Sea of Consciousness.',
    icon: '☯️',
  },
  {
    id: 'mind_heavenly_sage',
    name: 'Heavenly Dao Impartial Mind',
    chineseName: '天道无私圣心',
    description: 'Mirroring the supreme impartiality and majesty of the Heavenly Dao itself.',
    lore: 'A single shift in mood alters the weather and destiny of an entire universe.',
    icon: '☀️',
  },
  {
    id: 'mind_freedom_sage',
    name: 'Freedom Unbound Dao Heart',
    chineseName: '混元自在道心',
    description: 'Transcending even the Heavenly Dao’s rules; my heart alone defines what is Dao.',
    lore: 'True spiritual freedom—unbound by fate, heaven, or cosmic duty.',
    icon: '🕊️',
  },
  // 3. Great Dao & Cosmic Eras (3 realms)
  {
    id: 'mind_great_dao',
    name: 'Great Dao Law Will',
    chineseName: '大道法则道心',
    description:
      'Willpower crystallizes into supreme Great Dao decrees that command the primal Chaos.',
    lore: 'When the Dao Heart speaks, chaotic elements bow in submission.',
    icon: '🪐',
  },
  {
    id: 'mind_great_dao_supreme',
    name: 'Great Dao Supreme Mind',
    chineseName: '大道至尊道心',
    description: 'Enduring billions of epochs of chaotic destruction without a ripple of wavering.',
    lore: 'Comprehending the birth and death of three thousand Great Daos in a single breath.',
    icon: '🌌',
  },
  {
    id: 'mind_dao_creator',
    name: 'Dao Creator Omnipotent Will',
    chineseName: '创世无上道意',
    description:
      'Willpower becomes the source code of reality; whatever the mind conceives becomes cosmic law.',
    lore: 'Even the Ninth Chaos bows before a Dao Heart forged through endless epochs of seclusion.',
    icon: '👁️',
  },
  // 4. The Peak (1 realm)
  {
    id: 'mind_ultimate_origin',
    name: 'Ultimate Origin Supreme Dao Heart',
    chineseName: '终元至高无上道心',
    description:
      'Han Jue’s eternal, supreme Dao Heart. Infinite detachment and infinite authority over all existence.',
    lore: 'Through billions of years of quiet perseverance, the Dao Heart stands above eternity itself.',
    icon: '🪷👑',
  },
]);

export const CULTIVATION_PATHS_REALMS: Record<CultivationPath, CultivationRealmDef[]> = {
  qi: QI_REALMS,
  body: BODY_REALMS,
  soul: SOUL_REALMS,
  mind: MIND_REALMS,
};

export const CULTIVATION_PILLS: CultivationPill[] = [
  {
    id: 'pill_qi_condensation',
    name: 'Spirit Gathering Pellet',
    targetPath: 'qi',
    tier: 'mortal',
    requiredRealmIndex: 0,
    successRateBoostPct: 35,
    qiBonus: 3_000n,
    costHerbWood: 50_000n,
    costHerbGrain: 60_000n,
    costDiamonds: 100n,
    description:
      'Refined from hundred-year spirit herbs to soothe Qi meridians and ensure flawless layer breakthrough.',
    icon: '🟢',
  },
  {
    id: 'pill_foundation',
    name: 'Heavenly Foundation Pill',
    targetPath: 'qi',
    tier: 'mortal',
    requiredRealmIndex: 1,
    successRateBoostPct: 40,
    qiBonus: 20_000n,
    costHerbWood: 150_000n,
    costHerbGrain: 180_000n,
    costDiamonds: 300n,
    description:
      'Liquefies spiritual energy inside the dantian pool, preventing violent backlash during foundation forging.',
    icon: '🔵',
  },
  {
    id: 'pill_dragon_blood_temper',
    name: 'True Dragon Blood Tempering Pill',
    targetPath: 'body',
    tier: 'mortal',
    requiredRealmIndex: 0,
    successRateBoostPct: 42,
    qiBonus: 85_000n,
    costHerbWood: 220_000n,
    costHerbGrain: 260_000n,
    costDiamonds: 450n,
    description:
      'Boiled from ancient flood-dragon marrow and volcanic iron lotus to temper indestructible bones and flesh.',
    icon: '🔴',
  },
  {
    id: 'pill_core_condense',
    name: 'Nine-Revolutions Golden Core Pill',
    targetPath: 'qi',
    tier: 'mortal',
    requiredRealmIndex: 2,
    successRateBoostPct: 45,
    qiBonus: 100_000n,
    costHerbWood: 400_000n,
    costHerbGrain: 500_000n,
    costDiamonds: 800n,
    description:
      'Imbues the condensing core with purple sun dragon flame, solidifying an unblemished golden core.',
    icon: '🟡',
  },
  {
    id: 'pill_nascent_soul',
    name: 'Soul Solidifying Nectar',
    targetPath: 'soul',
    tier: 'mortal',
    requiredRealmIndex: 0,
    successRateBoostPct: 50,
    qiBonus: 500_000n,
    costHerbWood: 1_200_000n,
    costHerbGrain: 1_500_000n,
    costDiamonds: 2_000n,
    description:
      'Nurtures the Sea of Consciousness and Primordial Spirit with astral vitality, expanding Divine Sense.',
    icon: '🟣',
  },
  {
    id: 'pill_bodhi_heart',
    name: 'Bodhi Clear-Heart Enlightenment Elixir',
    targetPath: 'mind',
    tier: 'mortal',
    requiredRealmIndex: 0,
    successRateBoostPct: 52,
    qiBonus: 650_000n,
    costHerbWood: 1_400_000n,
    costHerbGrain: 1_600_000n,
    costDiamonds: 2_200n,
    description:
      'Distilled from sacred Bodhi leaves; banishes all inner demons and crystallizes an unshakeable Dao Heart.',
    icon: '🪷',
  },
  {
    id: 'pill_celestial_immortal',
    name: 'Celestial Jade Longevity Elixir',
    targetPath: 'all',
    tier: 'immortal_sage',
    requiredRealmIndex: 9,
    successRateBoostPct: 55,
    qiBonus: 10_000_000_000n,
    costHerbWood: 5_000_000n,
    costHerbGrain: 6_000_000n,
    costDiamonds: 5_000n,
    description:
      'Brewed with celestial peach blossoms and immortal dew. Elevates Qi, Body, Soul, or Mind across Immortal realms.',
    icon: '💎',
  },
  {
    id: 'pill_chaos_origin',
    name: 'Primordial Chaos Grand Dao Fruit',
    targetPath: 'all',
    tier: 'chaos_dao',
    requiredRealmIndex: 18,
    successRateBoostPct: 60,
    qiBonus: 500_000_000_000_000_000n,
    costHerbWood: 25_000_000n,
    costHerbGrain: 30_000_000n,
    costDiamonds: 20_000n,
    description:
      'Condensation of chaotic energy born before the creation of the heavens. Grants direct insight into all four Great Daos.',
    icon: '🌌',
  },
];

/**
 * Retrieves the realm definition for a given CultivationPath and realmIndex (0..22).
 */
export function getRealmDef(path: CultivationPath, realmIndex: number): CultivationRealmDef {
  const list = CULTIVATION_PATHS_REALMS[path] || CULTIVATION_REALMS;
  return list[realmIndex] || list[0];
}

/**
 * Calculates total Energy (Qi / Blood Essence / Soul Force / Dao Willpower) required to break through a specific layer of a realm.
 * Each layer within a realm scales by 1.35x.
 */
export function calculateQiRequired(
  realmIndex: number,
  layer: number,
  path: CultivationPath = 'qi'
): bigint {
  const realm = getRealmDef(path, realmIndex);
  const layerClamped = Math.max(1, Math.min(9, layer));
  const layerScale = Math.pow(1.35, layerClamped - 1);
  const base = Number(realm.baseQiPerLayer);
  return BigInt(Math.floor(base * layerScale));
}

/**
 * Calculates the multiplicative power boost granted by a single cultivation path.
 * Scales exponentially across all 23 realms and 9 layers.
 */
export function calculateCultivationMultiplier(
  realmIndex: number,
  layer: number,
  path: CultivationPath = 'qi'
): number {
  const realm = getRealmDef(path, realmIndex);
  const layerClamped = Math.max(1, Math.min(9, layer));
  const layerBonus = 1 + (layerClamped - 1) * 0.12;
  return realm.basePowerMultiplier * layerBonus;
}

/**
 * Calculates Mind Cultivation (心修) special Dao Heart bonuses:
 * - breakthroughBonusPct: flat +% bonus to breakthrough success across all 4 paths
 * - cultivationSpeedMult: multiplier to passive and manual cultivation energy gain across all 4 paths
 * - innerDemonImmunityPct: protection against Qi deviation / tribulation backlash
 */
export function calculateMindCultivationBonuses(
  mindRealmIndex: number,
  mindLayer: number
): {
  breakthroughBonusPct: number;
  cultivationSpeedMult: number;
  innerDemonImmunityPct: number;
} {
  const clampedRealm = Math.max(0, Math.min(22, mindRealmIndex));
  const clampedLayer = Math.max(1, Math.min(9, mindLayer));
  const totalMindSteps = clampedRealm * 9 + clampedLayer; // 1 to 207

  const breakthroughBonusPct = Math.min(
    38,
    Math.floor(2 + clampedRealm * 1.5 + (clampedLayer - 1) * 0.25)
  );
  const cultivationSpeedMult = Number((1 + totalMindSteps * 0.08).toFixed(2));
  const innerDemonImmunityPct = Math.min(100, Math.floor(15 + totalMindSteps * 0.45));

  return {
    breakthroughBonusPct,
    cultivationSpeedMult,
    innerDemonImmunityPct,
  };
}

/**
 * Calculates the Four-Path Resonance & Combined Cultivation Multiplier across Qi, Body, Soul, and Mind.
 */
export function calculateFourPathSynergy(paths: Record<CultivationPath, CultivationPathProgress>): {
  qiMult: number;
  bodyMult: number;
  soulMult: number;
  mindMult: number;
  minRealmIndex: number;
  resonanceBonusMult: number;
  totalCombinedMultiplier: number;
  troopHpDefenseBonusPct: number;
  troopAttackCritBonusPct: number;
  breakthroughSuccessBonusPct: number;
  allPathSpeedMult: number;
} {
  const qiMult = calculateCultivationMultiplier(paths.qi.realmIndex, paths.qi.layer, 'qi');
  const bodyMult = calculateCultivationMultiplier(paths.body.realmIndex, paths.body.layer, 'body');
  const soulMult = calculateCultivationMultiplier(paths.soul.realmIndex, paths.soul.layer, 'soul');
  const mindMult = calculateCultivationMultiplier(paths.mind.realmIndex, paths.mind.layer, 'mind');

  const minRealmIndex = Math.min(
    paths.qi.realmIndex,
    paths.body.realmIndex,
    paths.soul.realmIndex,
    paths.mind.realmIndex
  );

  // Four-Path Harmony Resonance scales when all 4 paths advance together
  const resonanceBonusMult = Number((1 + minRealmIndex * 0.35).toFixed(2));

  // Combined power integrates Qi as primary spiritual foundation + geometric resonance from Body, Soul, and Mind
  const secondaryHarmony =
    1 +
    Math.log10(Math.max(1, bodyMult)) * 0.45 +
    Math.log10(Math.max(1, soulMult)) * 0.45 +
    Math.log10(Math.max(1, mindMult)) * 0.35;

  const totalCombinedMultiplier = qiMult * secondaryHarmony * resonanceBonusMult;

  const bodySteps = paths.body.realmIndex * 9 + paths.body.layer;
  const soulSteps = paths.soul.realmIndex * 9 + paths.soul.layer;
  const mindBonuses = calculateMindCultivationBonuses(paths.mind.realmIndex, paths.mind.layer);

  return {
    qiMult,
    bodyMult,
    soulMult,
    mindMult,
    minRealmIndex,
    resonanceBonusMult,
    totalCombinedMultiplier,
    troopHpDefenseBonusPct: bodySteps * 18,
    troopAttackCritBonusPct: soulSteps * 16,
    breakthroughSuccessBonusPct: mindBonuses.breakthroughBonusPct,
    allPathSpeedMult: mindBonuses.cultivationSpeedMult,
  };
}

export const CULTIVATION_MANUALS: CultivationManual[] = [
  // QI CULTIVATION MANUALS (气修功法)
  {
    id: 'manual_qi_jade_pure',
    name: 'Jade Pure Nine-Heavens Mantra',
    chineseName: '玉清九天玄功',
    path: 'qi',
    tier: 'mortal',
    icon: '📜',
    description:
      'Orthodox foundation scripture of the Jade Pure Sacred Sect. Harmonizes dantian meridians with nine-heavens thunder Qi.',
    lore: 'Recorded on ancient jade slips inside the Hidden Sect Peak; steady, safe, and free of Qi deviation.',
    basePassiveRateBoostPct: 35,
    passiveBoostPerLevelPct: 18,
    baseBreakthroughBoostPct: 6,
    breakthroughBoostPerLevelPct: 2,
    maxLevel: 10,
    baseUpgradeCostFragments: 15,
    baseUpgradeCostDiamonds: 250n,
  },
  {
    id: 'manual_qi_six_paths',
    name: 'Six Paths Reincarnation Art',
    chineseName: '六道轮回仙经',
    path: 'qi',
    tier: 'immortal_sage',
    icon: '☯️',
    description:
      'Cycles spiritual Qi through six immortal reincarnation vortices, multiplying ambient absorption speed.',
    lore: 'Han Jue’s signature immortal art—each breath mirrors a complete cycle of cosmic rebirth.',
    basePassiveRateBoostPct: 95,
    passiveBoostPerLevelPct: 40,
    baseBreakthroughBoostPct: 12,
    breakthroughBoostPerLevelPct: 3,
    maxLevel: 10,
    baseUpgradeCostFragments: 35,
    baseUpgradeCostDiamonds: 800n,
  },
  {
    id: 'manual_qi_ultimate_origin',
    name: 'Ultimate Origin Great Dao Sutra',
    chineseName: '终元鸿蒙大道经',
    path: 'qi',
    tier: 'ultimate_origin',
    icon: '🌌',
    description:
      'Supreme scripture transcending the Three Thousand Great Daos. Converts chaotic void directly into origin Qi.',
    lore: 'Written by Han Jue upon comprehending his own independent Ultimate Origin World.',
    basePassiveRateBoostPct: 240,
    passiveBoostPerLevelPct: 85,
    baseBreakthroughBoostPct: 22,
    breakthroughBoostPerLevelPct: 4,
    maxLevel: 10,
    baseUpgradeCostFragments: 80,
    baseUpgradeCostDiamonds: 2500n,
  },

  // BODY CULTIVATION MANUALS (体修功法)
  {
    id: 'manual_body_vajra_marrow',
    name: 'Indestructible Vajra Marrow Sutra',
    chineseName: '不坏金刚洗髓经',
    path: 'body',
    tier: 'mortal',
    icon: '🛡️',
    description:
      'Tempers bone marrow and sinews like golden diamond, accelerating Blood Essence refinement.',
    lore: 'Forged by ancient martial monks who bathed in subterranean magma veins.',
    basePassiveRateBoostPct: 40,
    passiveBoostPerLevelPct: 20,
    baseBreakthroughBoostPct: 7,
    breakthroughBoostPerLevelPct: 2,
    maxLevel: 10,
    baseUpgradeCostFragments: 15,
    baseUpgradeCostDiamonds: 250n,
  },
  {
    id: 'manual_body_ancestral_witch',
    name: 'Twelve Ancestral Titan Blood Art',
    chineseName: '十二祖巫真血诀',
    path: 'body',
    tier: 'immortal_sage',
    icon: '🩸',
    description:
      'Ignites twelve ancient titan bloodline furnaces within the heart to devour celestial lightning.',
    lore: 'Every heartbeat shakes the firmament, turning physical breakthroughs into effortless instinct.',
    basePassiveRateBoostPct: 105,
    passiveBoostPerLevelPct: 45,
    baseBreakthroughBoostPct: 13,
    breakthroughBoostPerLevelPct: 3,
    maxLevel: 10,
    baseUpgradeCostFragments: 35,
    baseUpgradeCostDiamonds: 850n,
  },
  {
    id: 'manual_body_chaos_fiendcelestial',
    name: 'Primordial Fiendcelestial Body Codex',
    chineseName: '混沌魔神不灭体典',
    path: 'body',
    tier: 'chaos_dao',
    icon: '👹',
    description:
      'Reconstructs every mortal cell into a miniature Chaos Fiendcelestial capable of swallowing stars.',
    lore: 'Even Dao Creators dare not clash physically against a vessel forged by this forbidden codex.',
    basePassiveRateBoostPct: 210,
    passiveBoostPerLevelPct: 75,
    baseBreakthroughBoostPct: 20,
    breakthroughBoostPerLevelPct: 4,
    maxLevel: 10,
    baseUpgradeCostFragments: 65,
    baseUpgradeCostDiamonds: 2000n,
  },

  // SOUL CULTIVATION MANUALS (魂修功法)
  {
    id: 'manual_soul_astral_visualization',
    name: 'Nine-Stars Divine Sense Visualization',
    chineseName: '九曜神识观想法',
    path: 'soul',
    tier: 'mortal',
    icon: '🌟',
    description:
      'Visualizes nine ancient stars inside the Sea of Consciousness to rapidly condense Soul Force.',
    lore: 'Allows a cultivator’s divine sense to pierce illusions and lock onto enemies leagues away.',
    basePassiveRateBoostPct: 38,
    passiveBoostPerLevelPct: 19,
    baseBreakthroughBoostPct: 6,
    breakthroughBoostPerLevelPct: 2,
    maxLevel: 10,
    baseUpgradeCostFragments: 15,
    baseUpgradeCostDiamonds: 250n,
  },
  {
    id: 'manual_soul_myriad_thought',
    name: 'Myriad Primordial Spirit Splitting Art',
    chineseName: '万化元神分念诀',
    path: 'soul',
    tier: 'immortal_sage',
    icon: '👁️',
    description: 'Splits the Yuan Shen into ten thousand simultaneous meditating thought-clones.',
    lore: 'Ten thousand thoughts cultivate in parallel, multiplying soul condensation speed astronomically.',
    basePassiveRateBoostPct: 110,
    passiveBoostPerLevelPct: 46,
    baseBreakthroughBoostPct: 14,
    breakthroughBoostPerLevelPct: 3,
    maxLevel: 10,
    baseUpgradeCostFragments: 40,
    baseUpgradeCostDiamonds: 900n,
  },
  {
    id: 'manual_soul_omniscient_eye',
    name: 'Great Dao Omniscient True Spirit Canon',
    chineseName: '大道全知真灵宝典',
    path: 'soul',
    tier: 'chaos_dao',
    icon: '🔮',
    description:
      'Anchors the True Spirit above the River of Fate, absorbing soul force from all timelines.',
    lore: 'Grants absolute soul invulnerability and effortless comprehension of soul realm barriers.',
    basePassiveRateBoostPct: 220,
    passiveBoostPerLevelPct: 78,
    baseBreakthroughBoostPct: 21,
    breakthroughBoostPerLevelPct: 4,
    maxLevel: 10,
    baseUpgradeCostFragments: 70,
    baseUpgradeCostDiamonds: 2100n,
  },

  // MIND CULTIVATION MANUALS (心修功法)
  {
    id: 'manual_mind_longevity_seclusion',
    name: 'Quiet Seclusion Longevity Heart Sutra',
    chineseName: '苦修长生静心咒',
    path: 'mind',
    tier: 'mortal',
    icon: '🪷',
    description:
      'Calms all impatience and worldly attachments, turning centuries of cave seclusion into pure Dao Willpower.',
    lore: 'Han Jue’s personal motto encoded into scripture: outlive every enemy from inside your cave abode.',
    basePassiveRateBoostPct: 42,
    passiveBoostPerLevelPct: 22,
    baseBreakthroughBoostPct: 8,
    breakthroughBoostPerLevelPct: 2,
    maxLevel: 10,
    baseUpgradeCostFragments: 15,
    baseUpgradeCostDiamonds: 250n,
  },
  {
    id: 'manual_mind_simulated_trial',
    name: 'Simulated Trial Demon-Slaying Canon',
    chineseName: '模拟试炼斩魔心经',
    path: 'mind',
    tier: 'immortal_sage',
    icon: '⚔️',
    description:
      'Hones the Dao Heart through millions of mental combat simulations, erasing inner demons before breakthroughs.',
    lore: 'When you have already defeated an enemy ten thousand times in your mind, no bottleneck can shake your heart.',
    basePassiveRateBoostPct: 115,
    passiveBoostPerLevelPct: 48,
    baseBreakthroughBoostPct: 15,
    breakthroughBoostPerLevelPct: 3,
    maxLevel: 10,
    baseUpgradeCostFragments: 40,
    baseUpgradeCostDiamonds: 950n,
  },
  {
    id: 'manual_mind_supreme_detachment',
    name: 'Eternal Transcendence Supreme Heart Art',
    chineseName: '永恒超脱至高心典',
    path: 'mind',
    tier: 'ultimate_origin',
    icon: '👑',
    description: 'Elevates the Dao Heart above causality, karma, and cosmic destruction.',
    lore: 'Even if the multiverse collapses into nothingness, the Eternal Heart remains unmoved and omnipotent.',
    basePassiveRateBoostPct: 250,
    passiveBoostPerLevelPct: 90,
    baseBreakthroughBoostPct: 24,
    breakthroughBoostPerLevelPct: 4,
    maxLevel: 10,
    baseUpgradeCostFragments: 85,
    baseUpgradeCostDiamonds: 2600n,
  },
];

/**
 * Looks up a CultivationManual definition by ID.
 */
export function getManualById(manualId: string | null | undefined): CultivationManual | undefined {
  if (!manualId) return undefined;
  return CULTIVATION_MANUALS.find((m) => m.id === manualId);
}

/**
 * Calculates the active passive gathering rate boost (+%) and breakthrough chance boost (+%)
 * granted by a Cultivation Manual at a specific mastery level (1..maxLevel).
 */
export function calculateManualEffects(
  manualId: string | null | undefined,
  level: number = 1
): {
  passiveRateBoostPct: number;
  breakthroughBoostPct: number;
} {
  const manual = getManualById(manualId);
  if (!manual) {
    return { passiveRateBoostPct: 0, breakthroughBoostPct: 0 };
  }
  const clampedLevel = Math.max(1, Math.min(manual.maxLevel, level));
  const extraLevels = clampedLevel - 1;
  return {
    passiveRateBoostPct:
      manual.basePassiveRateBoostPct + extraLevels * manual.passiveBoostPerLevelPct,
    breakthroughBoostPct:
      manual.baseBreakthroughBoostPct + extraLevels * manual.breakthroughBoostPerLevelPct,
  };
}

/**
 * Calculates the Scripture Fragments and Diamonds required to upgrade a manual to the next level.
 */
export function calculateManualUpgradeCost(
  manual: CultivationManual,
  currentLevel: number
): {
  fragments: number;
  diamonds: bigint;
  isMaxLevel: boolean;
} {
  if (currentLevel >= manual.maxLevel) {
    return { fragments: 0, diamonds: 0n, isMaxLevel: true };
  }
  const levelScale = Math.pow(1.45, currentLevel - 1);
  const fragments = Math.ceil(manual.baseUpgradeCostFragments * levelScale);
  const diamonds = BigInt(Math.ceil(Number(manual.baseUpgradeCostDiamonds) * levelScale));
  return { fragments, diamonds, isMaxLevel: false };
}

/**
 * Summarizes the bonuses of all 4 equipped cultivation manuals across Qi, Body, Soul, and Mind.
 */
export function calculateEquippedManualsSummary(
  equippedManuals: Record<CultivationPath, string | null>,
  ownedManuals: Record<string, OwnedManualState>
): {
  byPath: Record<
    CultivationPath,
    {
      passiveRateBoostPct: number;
      breakthroughBoostPct: number;
      manual?: CultivationManual;
      level: number;
    }
  >;
  totalPassiveBonusPct: number;
  totalBreakthroughBonusPct: number;
} {
  const byPath = {} as Record<
    CultivationPath,
    {
      passiveRateBoostPct: number;
      breakthroughBoostPct: number;
      manual?: CultivationManual;
      level: number;
    }
  >;

  let totalPassiveBonusPct = 0;
  let totalBreakthroughBonusPct = 0;

  for (const path of CULTIVATION_PATH_LIST) {
    const eqId = equippedManuals[path];
    const owned = eqId ? ownedManuals[eqId] : undefined;
    const level = owned ? owned.level : 1;
    const manual = getManualById(eqId);
    const effects =
      owned && manual
        ? calculateManualEffects(eqId, level)
        : { passiveRateBoostPct: 0, breakthroughBoostPct: 0 };
    byPath[path] = {
      passiveRateBoostPct: effects.passiveRateBoostPct,
      breakthroughBoostPct: effects.breakthroughBoostPct,
      manual,
      level,
    };
    totalPassiveBonusPct += effects.passiveRateBoostPct;
    totalBreakthroughBonusPct += effects.breakthroughBoostPct;
  }

  return {
    byPath,
    totalPassiveBonusPct,
    totalBreakthroughBonusPct,
  };
}

/**
 * Resolves exploring an Ancient Secret Realm / Sect Scripture Pavilion to find manuals or Scripture Fragments.
 * Prioritizes discovering unowned manuals when rolled, or grants bonus Scripture Fragments on duplicates.
 */
export function rollManualDiscovery(
  ownedManuals: Record<string, OwnedManualState>,
  deterministicIndex?: number
): {
  manual: CultivationManual;
  isNewDiscovery: boolean;
  fragmentsGained: number;
  message: string;
} {
  const unowned = CULTIVATION_MANUALS.filter((m) => !ownedManuals[m.id]);
  let chosen: CultivationManual;

  if (typeof deterministicIndex === 'number') {
    const idx = Math.abs(deterministicIndex) % CULTIVATION_MANUALS.length;
    chosen = CULTIVATION_MANUALS[idx];
  } else if (unowned.length > 0 && Math.random() < 0.75) {
    // 75% chance to unearth a brand-new undiscovered ancient manual first
    chosen = unowned[Math.floor(Math.random() * unowned.length)];
  } else {
    chosen = CULTIVATION_MANUALS[Math.floor(Math.random() * CULTIVATION_MANUALS.length)];
  }

  const isNewDiscovery = !ownedManuals[chosen.id];
  const fragmentsGained = isNewDiscovery ? 20 : 45;
  const pathMeta = CULTIVATION_PATH_META[chosen.path];

  const message = isNewDiscovery
    ? `📜 Unearthed Ancient [${pathMeta.name}] Manual: ${chosen.name} (${chosen.chineseName}) + ${fragmentsGained} Scripture Fragments!`
    : `📜 Comprehended duplicate insights from ${chosen.name}! Converted into +${fragmentsGained} Scripture Fragments!`;

  return {
    manual: chosen,
    isNewDiscovery,
    fragmentsGained,
    message,
  };
}

/**
 * Ambient passive cultivation energy collection per second, influenced by weather, clan buffs, Mind Cultivation, and Equipped Manual.
 */
export function calculatePassiveQiRate(
  realmIndex: number,
  weather: WeatherType = 'clear',
  clanBuffActive: boolean = false,
  path: CultivationPath = 'qi',
  mindRealmIndex: number = 0,
  mindLayer: number = 1,
  manualPassiveBoostPct: number = 0
): bigint {
  const realm = getRealmDef(path, realmIndex);
  let baseRate = realm.baseQiPerLayer / 300n; // ~5 minutes of passive gathering per layer at base
  if (baseRate < 10n) baseRate = 10n;

  // Weather synergy per path
  let weatherMult = 1.0;
  if (weather === 'storm') {
    // Thunder & Lightning surges Qi and Body tempering especially hard
    weatherMult = path === 'body' ? 1.65 : 1.5;
  } else if (weather === 'rain') {
    weatherMult = path === 'mind' ? 1.4 : 1.25;
  } else if (weather === 'snow') {
    weatherMult = path === 'soul' ? 1.4 : 1.2;
  } else if (weather === 'clear') {
    weatherMult = 1.15;
  }

  if (clanBuffActive) weatherMult *= 1.3;

  // Mind cultivation amplifies cultivation rate if provided
  if (mindRealmIndex > 0 || mindLayer > 1) {
    const { cultivationSpeedMult } = calculateMindCultivationBonuses(mindRealmIndex, mindLayer);
    weatherMult *= cultivationSpeedMult;
  }

  // Equipped Cultivation Manual passive gathering rate boost
  if (manualPassiveBoostPct > 0) {
    weatherMult *= 1 + manualPassiveBoostPct / 100;
  }

  return BigInt(Math.floor(Number(baseRate) * weatherMult));
}

/**
 * Calculates breakthrough success chance and resolves the attempt for any of the 4 paths.
 */
export function evaluateBreakthroughAttempt(params: {
  realmIndex: number;
  layer: number;
  currentQi: bigint;
  requiredQi: bigint;
  pillBonusPct?: number;
  mindBonusPct?: number;
  manualBonusPct?: number;
  path?: CultivationPath;
}): {
  success: boolean;
  needsTribulation: boolean;
  message: string;
  newRealmIndex: number;
  newLayer: number;
  tribulationDamage: bigint;
} {
  const {
    realmIndex,
    layer,
    currentQi,
    requiredQi,
    pillBonusPct = 0,
    mindBonusPct = 0,
    manualBonusPct = 0,
    path = 'qi',
  } = params;
  const realmList = CULTIVATION_PATHS_REALMS[path] || CULTIVATION_REALMS;
  const realm = realmList[realmIndex] || realmList[0];
  const pathMeta = CULTIVATION_PATH_META[path];

  if (currentQi < requiredQi) {
    return {
      success: false,
      needsTribulation: false,
      message: `Insufficient ${pathMeta.energyName} to attempt breakthrough.`,
      newRealmIndex: realmIndex,
      newLayer: layer,
      tribulationDamage: 0n,
    };
  }

  // Base success rate starts at 80% for minor layers, 60% for major realm leaps
  const isMajorLeap = layer === 9;
  const baseRate = isMajorLeap ? 60 : 80;
  const totalRate = Math.min(100, baseRate + pillBonusPct + mindBonusPct + manualBonusPct);

  // If major leap and realm has tribulations, must face Heavenly Tribulation
  if (isMajorLeap && realm.tribulationRounds > 0) {
    const tribDmg = requiredQi * BigInt(realm.tribulationRounds) * 2n;
    return {
      success: true,
      needsTribulation: true,
      message: `Heavenly Clouds Gather! ${pathMeta.name} Tribulation descends for ${realm.name} breakthrough!`,
      newRealmIndex: realmIndex,
      newLayer: layer,
      tribulationDamage: tribDmg,
    };
  }

  // Random breakthrough roll
  const roll = Math.random() * 100;
  if (roll <= totalRate) {
    let nextRealm = realmIndex;
    let nextLayer = layer + 1;
    if (nextLayer > 9) {
      if (nextRealm < realmList.length - 1) {
        nextRealm += 1;
        nextLayer = 1;
      } else {
        nextLayer = 9; // Max peak of Ultimate Origin
      }
    }

    const nextRealmDef = realmList[nextRealm];
    return {
      success: true,
      needsTribulation: false,
      message: `${pathMeta.name} Breakthrough Successful! Ascended to [${nextRealmDef.chineseName}] ${nextRealmDef.name} - Layer ${nextLayer}!`,
      newRealmIndex: nextRealm,
      newLayer: nextLayer,
      tribulationDamage: 0n,
    };
  } else {
    return {
      success: false,
      needsTribulation: false,
      message: `Breakthrough failed! ${pathMeta.energyName} experienced turbulence, but your ${pathMeta.vesselName} remains intact.`,
      newRealmIndex: realmIndex,
      newLayer: layer,
      tribulationDamage: 0n,
    };
  }
}

/**
 * Resolves surviving a Heavenly Lightning Tribulation strike.
 */
export function calculateTribulationStrikeDefense(
  strikeDamage: bigint,
  playerCombatPower: bigint
): { survived: boolean; damageTaken: bigint; message: string } {
  const defenseThreshold = strikeDamage / 3n;
  const survived = playerCombatPower >= defenseThreshold;
  const actualDamage = playerCombatPower > strikeDamage ? strikeDamage / 5n : strikeDamage / 2n;

  return {
    survived,
    damageTaken: actualDamage,
    message: survived
      ? 'The heavenly thunder strike was dispersed by your impenetrable immortal aura!'
      : 'The heavenly tribulation shattered your defenses! Fortify your army and troops!',
  };
}

// ============================================================================
// 1. REALM SUPPRESSION (境界压制)
// Golden Core (index 2) vs Qi Refinement (index 0) = 10^2 = 100x Damage!
// ============================================================================

export function calculateRealmSuppression(
  attackerRealmIndex: number,
  defenderRealmIndex: number
): {
  realmDifference: number;
  damageMultiplier: number;
  incomingDamageReductionPct: number;
  suppressionLabel: string;
} {
  const clampedAttacker = Math.max(0, Math.min(22, attackerRealmIndex));
  const clampedDefender = Math.max(0, Math.min(22, defenderRealmIndex));
  const realmDifference = clampedAttacker - clampedDefender;

  // Each major realm above opponent grants 10x damage (2 realms = 100x, 3 realms = 1000x)
  const damageMultiplier = Math.pow(10, realmDifference);

  let incomingDamageReductionPct = 0;
  if (realmDifference > 0) {
    incomingDamageReductionPct = Number(((1 - 1 / damageMultiplier) * 100).toFixed(2));
  }

  let suppressionLabel = 'Equal Realm Clash (1.0x Damage)';
  if (realmDifference >= 3) {
    suppressionLabel = `Absolute Dimension Crushing (${damageMultiplier.toLocaleString()}x Damage)`;
  } else if (realmDifference === 2) {
    suppressionLabel = 'Major Realm Suppression (100x Damage — Core Fantasy)';
  } else if (realmDifference === 1) {
    suppressionLabel = 'Realm Suppression (10x Damage)';
  } else if (realmDifference < 0) {
    suppressionLabel = `Suppressed by Higher Realm (${damageMultiplier}x Damage)`;
  }

  return {
    realmDifference,
    damageMultiplier,
    incomingDamageReductionPct,
    suppressionLabel,
  };
}

// ============================================================================
// 2. THE KARMA SYSTEM (因果红名与天罚系统)
// ============================================================================

export function getKarmaAlignment(karmaValue: number): KarmaAlignment {
  if (karmaValue < 0) return 'red_fiend';
  if (karmaValue >= 300) return 'gold_justice';
  if (karmaValue >= 50) return 'green_innocent';
  return 'white_neutral';
}

export const INITIAL_KARMA_STATE: PlayerKarmaState = {
  karmaValue: 120, // Starts as Green Name (Innocent / Orthodox Sect Disciple)
  alignment: 'green_innocent',
  unlawfulKills: 0,
  righteousKills: 0,
  stationarySeconds: 0,
  maxStationaryThresholdSec: 8,
  bountySpiritStones: 0n,
  isLocationRevealed: false,
  lastLightningStrikeMsg: null,
  droppedLootHistory: [],
};

/**
 * Evaluates Karma changes when a player kills another cultivator in the open world.
 * - If a higher-level/higher-realm player kills a "green name" (innocent) lower-realm player,
 *   their Karma turns negative (Red Name), placing a Bounty and revealing their map coordinates.
 * - If a player kills a "Red Name" fiend, they gain Righteous Karma and claim the bounty.
 */
export function evaluatePvPKillKarma(params: {
  currentKarma: PlayerKarmaState;
  attackerRealmIndex: number;
  victimRealmIndex: number;
  victimKarmaValue: number; // >= 0 means Green/Innocent
  victimName: string;
}): {
  updatedKarma: PlayerKarmaState;
  bountyEarnedSpiritStones: bigint;
  message: string;
} {
  const { currentKarma, attackerRealmIndex, victimRealmIndex, victimKarmaValue, victimName } =
    params;
  const realmGap = Math.max(1, attackerRealmIndex - victimRealmIndex);

  if (victimKarmaValue >= 0 && attackerRealmIndex > victimRealmIndex) {
    // Unlawful slaughter of a lower-realm Green-Name cultivator!
    const karmaPenalty = Math.max(250, realmGap * 200);
    const nextVal = Math.min(-100, currentKarma.karmaValue - karmaPenalty);
    const addedBounty = BigInt(realmGap * 50_000);
    const nextBounty = currentKarma.bountySpiritStones + addedBounty;

    const updatedKarma: PlayerKarmaState = {
      ...currentKarma,
      karmaValue: nextVal,
      alignment: 'red_fiend',
      unlawfulKills: currentKarma.unlawfulKills + 1,
      bountySpiritStones: nextBounty,
      isLocationRevealed: true,
    };

    return {
      updatedKarma,
      bountyEarnedSpiritStones: 0n,
      message: `🩸 [RED NAME FIEND] You slaughtered innocent lower-realm cultivator ${victimName}! Karma dropped to ${nextVal}. Map coordinates revealed to Justice Enforcers & Heavenly Tribulation Lightning locked on!`,
    };
  } else if (victimKarmaValue < 0) {
    // Righteous execution of a Red-Name Demonic Fiend!
    const nextVal = currentKarma.karmaValue + 150;
    const rewardStones = BigInt(Math.abs(victimKarmaValue) * 400);
    const updatedKarma: PlayerKarmaState = {
      ...currentKarma,
      karmaValue: nextVal,
      alignment: getKarmaAlignment(nextVal),
      righteousKills: currentKarma.righteousKills + 1,
      bountySpiritStones: nextVal >= 0 ? 0n : currentKarma.bountySpiritStones,
      isLocationRevealed: nextVal < 0,
    };

    return {
      updatedKarma,
      bountyEarnedSpiritStones: rewardStones,
      message: `⚖️ [HEAVENLY JUSTICE] Executed Red-Name Fiend ${victimName}! Karma +150 (${nextVal}) & claimed ${rewardStones.toLocaleString()} Spirit Stones Bounty!`,
    };
  }

  // Equal or higher-realm duel
  const nextVal = currentKarma.karmaValue - 20;
  const updatedKarma: PlayerKarmaState = {
    ...currentKarma,
    karmaValue: nextVal,
    alignment: getKarmaAlignment(nextVal),
    isLocationRevealed: nextVal < 0,
  };

  return {
    updatedKarma,
    bountyEarnedSpiritStones: 0n,
    message: `⚔️ Defeated ${victimName} in an equal-realm duel (Karma ${nextVal}).`,
  };
}

/**
 * Consequence #1: Tribulation Lightning on Stationary Red-Name Players.
 * If a Red-Name player stays in one spot too long (stationarySeconds >= maxStationaryThresholdSec),
 * the game engine strikes them with instant-kill Heavenly Judgment Lightning.
 * Moving resets stationarySeconds to 0.
 */
export function tickRedNameStationaryLightning(params: {
  karma: PlayerKarmaState;
  isMoving: boolean;
  deltaSec?: number;
}): {
  updatedKarma: PlayerKarmaState;
  struckByInstantKillLightning: boolean;
  warningMessage: string | null;
} {
  const { karma, isMoving, deltaSec = 1 } = params;

  if (karma.karmaValue >= 0) {
    return {
      updatedKarma: { ...karma, stationarySeconds: 0, lastLightningStrikeMsg: null },
      struckByInstantKillLightning: false,
      warningMessage: null,
    };
  }

  if (isMoving) {
    return {
      updatedKarma: {
        ...karma,
        stationarySeconds: 0,
        lastLightningStrikeMsg: null,
      },
      struckByInstantKillLightning: false,
      warningMessage: null,
    };
  }

  const nextStationary = karma.stationarySeconds + deltaSec;
  if (nextStationary >= karma.maxStationaryThresholdSec) {
    const strikeMsg =
      '⚡ [HEAVENLY JUDGMENT LIGHTNING] You lingered stationary as a Red-Name Fiend! Instant-Kill Crimson Tribulation Bolt struck your vessel!';
    return {
      updatedKarma: {
        ...karma,
        stationarySeconds: 0,
        lastLightningStrikeMsg: strikeMsg,
      },
      struckByInstantKillLightning: true,
      warningMessage: strikeMsg,
    };
  }

  const remaining = Math.max(0, karma.maxStationaryThresholdSec - nextStationary);
  return {
    updatedKarma: {
      ...karma,
      stationarySeconds: nextStationary,
    },
    struckByInstantKillLightning: false,
    warningMessage:
      remaining <= 3
        ? `⚠️ Tribulation Clouds Locking On! Move immediately (${remaining}s until Instant-Kill Lightning)!`
        : null,
  };
}

/**
 * Consequence #3: High-Risk Loot Drop when a Red-Name player dies.
 * Drops an equipped Cultivation Manual or Spirit Pill from their inventory.
 */
export function resolveRedNameDeathLootDrop(params: {
  karma: PlayerKarmaState;
  equippedManuals: Record<CultivationPath, string | null>;
  inventoryPills: Record<string, number>;
}): {
  updatedEquippedManuals: Record<CultivationPath, string | null>;
  updatedInventoryPills: Record<string, number>;
  updatedKarma: PlayerKarmaState;
  droppedItemName: string;
} {
  const { karma, equippedManuals, inventoryPills } = params;
  const nextEquipped = { ...equippedManuals };
  const nextPills = { ...inventoryPills };
  let droppedItemName = '10,000 Spirit Stones Pouch';

  // Check if any manual is equipped to drop
  for (const path of CULTIVATION_PATH_LIST) {
    const eqId = nextEquipped[path];
    if (eqId) {
      const manual = getManualById(eqId);
      droppedItemName = manual
        ? `Equipped Manual: ${manual.name} (${manual.chineseName})`
        : `Equipped Manual (${eqId})`;
      nextEquipped[path] = null;
      break;
    }
  }

  // If no manual was equipped, drop a stack of pills
  if (droppedItemName === '10,000 Spirit Stones Pouch') {
    for (const [pillId, count] of Object.entries(nextPills)) {
      if (count > 0) {
        const pillDef = CULTIVATION_PILLS.find((p) => p.id === pillId);
        droppedItemName = `Spirit Pill: ${pillDef ? pillDef.name : pillId} x1`;
        nextPills[pillId] = count - 1;
        break;
      }
    }
  }

  const nextHistory = [droppedItemName, ...karma.droppedLootHistory].slice(0, 8);

  return {
    updatedEquippedManuals: nextEquipped,
    updatedInventoryPills: nextPills,
    updatedKarma: {
      ...karma,
      droppedLootHistory: nextHistory,
    },
    droppedItemName,
  };
}

// ============================================================================
// 3. SOCIAL STRUCTURE: MASTER & DISCIPLE HIERARCHY (师徒传承与气运反哺)
// ============================================================================

export const MYSTICAL_POWER_SKILLS: MysticalPowerSkill[] = [
  {
    id: 'skill_heaven_earth_sleeve',
    name: 'Mystical Power: Heaven Earth Sleeve',
    chineseName: '大神通 · 袖里乾坤',
    tier: 'immortal_sage',
    requiredRealmIndex: 2, // Golden Core+ can comprehend rudiments
    description:
      'Compresses an entire pocket dimension inside your robe sleeve to trap enemy armies, swallow projectiles, and harvest spirit veins.',
    combatMultiplierBonus: 0.45,
    transcriptionCostQi: 150_000n,
    transcriptionCostDiamonds: 400n,
    marketValueSpiritStones: 25_000n,
    icon: '🌌',
  },
  {
    id: 'skill_six_paths_seal',
    name: 'Mystical Power: Six Paths Reincarnation Seal',
    chineseName: '大神通 · 六道轮回印',
    tier: 'immortal_sage',
    requiredRealmIndex: 3,
    description:
      'Manifests the Six Paths of Reincarnation in a single palm strike, banishing enemy souls directly into the cycle of rebirth.',
    combatMultiplierBonus: 0.75,
    transcriptionCostQi: 500_000n,
    transcriptionCostDiamonds: 800n,
    marketValueSpiritStones: 65_000n,
    icon: '☯️',
  },
  {
    id: 'skill_sword_qi_meridian',
    name: 'Mystical Power: Primordial Chaos Sword Qi',
    chineseName: '无上神通 · 鸿蒙剑气',
    tier: 'chaos_dao',
    requiredRealmIndex: 5,
    description:
      'Fires an invisible thread of primordial chaos sword intent across star domains, ignoring defensive formations.',
    combatMultiplierBonus: 1.25,
    transcriptionCostQi: 2_000_000n,
    transcriptionCostDiamonds: 1_500n,
    marketValueSpiritStones: 180_000n,
    icon: '⚔️',
  },
  {
    id: 'skill_simulated_curse_book',
    name: 'Mystical Power: Book of Misfortune & Karma',
    chineseName: '至高神通 · 厄运天书',
    tier: 'ultimate_origin',
    requiredRealmIndex: 8,
    description:
      'Han Jue’s secluded cursing art—silently erodes an enemy sovereign’s luck and triggers sudden Qi deviation from afar.',
    combatMultiplierBonus: 2.5,
    transcriptionCostQi: 10_000_000n,
    transcriptionCostDiamonds: 3_500n,
    marketValueSpiritStones: 500_000n,
    icon: '📕',
  },
];

export const INITIAL_DISCIPLES: Disciple[] = [
  {
    id: 'disciple_yang_tiandong',
    name: 'Yang Tiandong',
    chineseName: '杨天冬 · 亲传大弟子',
    realmIndex: 2, // Golden Core
    layer: 5,
    loyalty: 98,
    distanceMeters: 12, // Cultivating inside Master's cave abode (<50m)
    baseSpiritStonesPerSec: 450n,
    baseQiPerSec: 1_800n,
    equippedSkills: ['skill_heaven_earth_sleeve'],
    avatarIcon: '🗡️',
  },
  {
    id: 'disciple_su_qi',
    name: 'Su Qi (Fortune Calamity)',
    chineseName: '苏岐 · 气运之子',
    realmIndex: 1, // Foundation Establishment
    layer: 8,
    loyalty: 94,
    distanceMeters: 28, // Near Master (<50m)
    baseSpiritStonesPerSec: 320n,
    baseQiPerSec: 1_100n,
    equippedSkills: [],
    avatarIcon: '🍀',
  },
  {
    id: 'disciple_tu_linger',
    name: 'Tu Ling’er',
    chineseName: '屠灵儿 · 护洞灵侍',
    realmIndex: 2, // Golden Core
    layer: 2,
    loyalty: 100,
    distanceMeters: 8, // Right beside Master's cushion (<50m)
    baseSpiritStonesPerSec: 390n,
    baseQiPerSec: 1_500n,
    equippedSkills: [],
    avatarIcon: '🦊',
  },
  {
    id: 'disciple_murong_qi',
    name: 'Murong Qi',
    chineseName: '慕容起 · 剑道传人',
    realmIndex: 1,
    layer: 6,
    loyalty: 91,
    distanceMeters: 140, // Out on sect expedition (>50m)
    baseSpiritStonesPerSec: 520n,
    baseQiPerSec: 950n,
    equippedSkills: [],
    avatarIcon: '⚡',
  },
];

/**
 * Calculates Master & Disciple Resource Funneling:
 * - Disciples within 50m of the Master receive a Proximity Cultivation Speed Buff (+40% to +120%).
 * - Master receives `masterTaxRatePct` (%) of the loot / Spirit Stones and Qi earned by all Disciples.
 */
export function calculateMasterDiscipleEconomy(params: {
  masterRealmIndex: number;
  disciples: Disciple[];
  masterTaxRatePct: number;
}): {
  proximitySpeedBuffPct: number;
  nearDisciplesCount: number;
  totalMasterTaxSpiritStonesPerSec: bigint;
  totalMasterTaxQiPerSec: bigint;
  discipleBreakdowns: Array<{
    discipleId: string;
    isNearMaster: boolean;
    effectiveBuffPct: number;
    grossSpiritStonesPerSec: bigint;
    taxedToMasterSpiritStones: bigint;
    netDiscipleQiPerSec: bigint;
    taxedToMasterQi: bigint;
  }>;
} {
  const { masterRealmIndex, disciples, masterTaxRatePct } = params;
  const clampedTaxPct = Math.max(5, Math.min(50, masterTaxRatePct));
  const proximitySpeedBuffPct = 40 + Math.min(160, masterRealmIndex * 12);

  let nearDisciplesCount = 0;
  let totalMasterTaxSpiritStonesPerSec = 0n;
  let totalMasterTaxQiPerSec = 0n;

  const discipleBreakdowns = disciples.map((d) => {
    const isNearMaster = d.distanceMeters <= 50 && masterRealmIndex >= d.realmIndex;
    if (isNearMaster) nearDisciplesCount += 1;

    const skillBonusPct = d.equippedSkills.length * 35;
    const effectiveBuffPct = (isNearMaster ? proximitySpeedBuffPct : 0) + skillBonusPct;
    const buffMult = 1 + effectiveBuffPct / 100;

    const grossStones = BigInt(Math.floor(Number(d.baseSpiritStonesPerSec) * buffMult));
    const grossQi = BigInt(Math.floor(Number(d.baseQiPerSec) * buffMult));

    const taxedStones = (grossStones * BigInt(clampedTaxPct)) / 100n;
    const taxedQi = (grossQi * BigInt(clampedTaxPct)) / 100n;
    const netDiscipleQi = grossQi - taxedQi;

    totalMasterTaxSpiritStonesPerSec += taxedStones;
    totalMasterTaxQiPerSec += taxedQi;

    return {
      discipleId: d.id,
      isNearMaster,
      effectiveBuffPct,
      grossSpiritStonesPerSec: grossStones,
      taxedToMasterSpiritStones: taxedStones,
      netDiscipleQiPerSec: netDiscipleQi,
      taxedToMasterQi: taxedQi,
    };
  });

  return {
    proximitySpeedBuffPct,
    nearDisciplesCount,
    totalMasterTaxSpiritStonesPerSec,
    totalMasterTaxQiPerSec,
    discipleBreakdowns,
  };
}

/**
 * Transmission (传功玉简): A Master who knows a rare Mystical Power (e.g. Heaven Earth Sleeve)
 * can create a copy (Skill Scroll) to give to a loyal disciple or trade in the economy.
 */
export function createTransmissionSkillScroll(params: {
  skillId: string;
  masterName: string;
  currentQi: bigint;
  currentDiamonds: bigint;
  learnedSkills: string[];
}): {
  success: boolean;
  scroll?: SkillScrollItem;
  qiCost: bigint;
  diamondCost: bigint;
  message: string;
} {
  const { skillId, masterName, currentQi, currentDiamonds, learnedSkills } = params;
  const skill = MYSTICAL_POWER_SKILLS.find((s) => s.id === skillId);
  if (!skill) {
    return {
      success: false,
      qiCost: 0n,
      diamondCost: 0n,
      message: 'Mystical Power technique not found in Sect Archives.',
    };
  }

  if (!learnedSkills.includes(skillId)) {
    return {
      success: false,
      qiCost: 0n,
      diamondCost: 0n,
      message: `You must first comprehend [${skill.name}] before transcribing a Skill Scroll.`,
    };
  }

  if (currentQi < skill.transcriptionCostQi || currentDiamonds < skill.transcriptionCostDiamonds) {
    return {
      success: false,
      qiCost: skill.transcriptionCostQi,
      diamondCost: skill.transcriptionCostDiamonds,
      message: `Insufficient Qi or Diamonds to transcribe [${skill.name}] into a Jade Skill Scroll.`,
    };
  }

  const scroll: SkillScrollItem = {
    scrollId: `scroll_${skill.id}_${Date.now()}`,
    skillId: skill.id,
    skillName: skill.name,
    chineseName: skill.chineseName,
    creatorMasterName: masterName,
    combatMultiplierBonus: skill.combatMultiplierBonus,
    marketValueSpiritStones: skill.marketValueSpiritStones,
    createdAt: Date.now(),
  };

  return {
    success: true,
    scroll,
    qiCost: skill.transcriptionCostQi,
    diamondCost: skill.transcriptionCostDiamonds,
    message: `📜 Transcribed [${skill.name} (${skill.chineseName})] into a transferable Jade Skill Scroll!`,
  };
}

// ============================================================================
// 4. VISUALIZING POWER: THE "AURA" (无等级头衔 · 境界异象显化)
// ============================================================================

/**
 * Resolves the exact 3D & HDR10+ visual cue for a cultivator's realm (since there are no levels above heads):
 * - Qi Refinement (0): No aura.
 * - Foundation (1): Faint white glow.
 * - Golden Core (2): A literal golden core spins behind their back or inside their translucent chest model.
 * - Nascent Soul (3..20): A small "baby" avatar floats above their head.
 * - Dao Creator & Ultimate Origin (21..22): Divine Rings (Halos) behind them; more Great Dao rules = more halos.
 */
export function getCultivationAuraVisualSpec(
  realmIndex: number,
  masteredGreatDaos: number = 3
): CultivationAuraVisualSpec {
  const clampedRealm = Math.max(0, Math.min(22, realmIndex));
  const clampedDaos = Math.max(1, Math.min(12, masteredGreatDaos));

  if (clampedRealm === 0) {
    return {
      cueType: 'none',
      label: 'Qi Refinement (Mortal Vessel — No External Aura)',
      chineseLabel: '练气内敛 · 返璞归真',
      description:
        'No external aura or overhead level tag. Worldly Qi circulates silently inside mortal meridians.',
      primaryColorHex: '#94a3b8',
      secondaryColorHex: '#475569',
      hdrPeakLuminanceNits: 120,
      haloCount: 0,
      hasTranslucentChestCore: false,
      hasFloatingBabyAvatar: false,
      suppressOverheadLevelTag: true,
    };
  }

  if (clampedRealm === 1) {
    return {
      cueType: 'faint_white_glow',
      label: 'Foundation Establishment (Faint White Mist Glow)',
      chineseLabel: '筑基灵雾 · 莹白微光',
      description:
        'A faint, translucent white spiritual mist radiates softly from purified pores and meridians.',
      primaryColorHex: '#f8fafc',
      secondaryColorHex: '#bae6fd',
      hdrPeakLuminanceNits: 420,
      haloCount: 0,
      hasTranslucentChestCore: false,
      hasFloatingBabyAvatar: false,
      suppressOverheadLevelTag: true,
    };
  }

  if (clampedRealm === 2) {
    return {
      cueType: 'spinning_golden_core',
      label: 'Golden Core (Spinning Golden Core in Translucent Chest & Back)',
      chineseLabel: '金丹大成 · 胸腹金丹旋转',
      description:
        'A literal solid Golden Core spins rapidly behind the back and gleams inside a translucent chest dantian.',
      primaryColorHex: '#fbbf24',
      secondaryColorHex: '#f59e0b',
      hdrPeakLuminanceNits: 1150,
      haloCount: 1,
      hasTranslucentChestCore: true,
      hasFloatingBabyAvatar: false,
      suppressOverheadLevelTag: true,
    };
  }

  if (clampedRealm >= 21) {
    return {
      cueType: 'divine_halos',
      label: `Dao Creator (${clampedDaos} Great Dao Divine Halos)`,
      chineseLabel: `大道神轮 · ${clampedDaos}道法则光环`,
      description: `Supreme Divine Rings (Halos) revolve behind the sovereign. Each mastered Great Dao law manifests an additional HDR10+ Halo (${clampedDaos} active).`,
      primaryColorHex: '#fde047',
      secondaryColorHex: '#c084fc',
      hdrPeakLuminanceNits: 4000,
      haloCount: clampedDaos,
      hasTranslucentChestCore: true,
      hasFloatingBabyAvatar: false,
      suppressOverheadLevelTag: true,
    };
  }

  // Realm indices 3..20 (Nascent Soul through Great Dao Supreme)
  return {
    cueType: 'floating_nascent_baby',
    label: 'Nascent Soul & Immortal Spirit (Floating Astral Baby Avatar Above Head)',
    chineseLabel: '元婴显圣 · 头顶元婴法相',
    description:
      'A luminous astral "baby" Nascent Soul avatar floats above the cultivator’s crown, meditating in lotus posture.',
    primaryColorHex: '#38bdf8',
    secondaryColorHex: '#a855f7',
    hdrPeakLuminanceNits: 1850,
    haloCount: clampedRealm >= 15 ? 2 : 0,
    hasTranslucentChestCore: false,
    hasFloatingBabyAvatar: true,
    suppressOverheadLevelTag: true,
  };
}
