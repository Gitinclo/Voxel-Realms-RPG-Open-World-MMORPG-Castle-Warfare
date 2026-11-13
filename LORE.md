# 📜 Imperial Lore & Cosmological History Codex

> **Sovereign Author of Layer 6 (The White Page / The House of Ideas)**: `creatergame31@gmail.com`  
> **Engine Implementation**: `src/game/loreHistory.ts` · `src/components/LoreHistoryModal.tsx` · `src/game/omniverse.ts`

This document chronicles the canonical **Lore, Origin Mythos, and 7 Grand Historical Epochs** of **Sovereign Realms: Endless Era — Immortal Dominion**, from pre-existential genesis upon **The White Page / The House of Ideas** (`creatergame31@gmail.com`) down to the **100+∞ Sovereign Omniverses**, the **10 Sovereign Playable Species**, the **Han Jue Four-Path Immortal Cultivation Revelation**, the **Ten Citadel Eras**, and the **06/11/2026 Architect Convergence (`v1.5.0`)**.

---

## 🌌 The 6-Layer Cosmic Ontology & Cosmological Hierarchy

Every entity, realm, law of causality, and void in **Sovereign Realms** exists within a strict 6-layer ontological architecture:

| Layer | Cosmic Tier                                    | Cardinality (`COSMIC_LIMITS`) | Canonical Definition                                                                                                         | Historical & Ontological Role                                                                                                                                                                                                                  |
| :---: | :--------------------------------------------- | :---------------------------: | :--------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Universe** (`🌀`)                            |       `Infinity` (`∞`)        | _"A single reality with its own space, time, and matter, etc."_                                                              | The foundational mortal and immortal battleground where the Sovereign Citadel, 3D Overworld, and regional resource nodes manifest (`InfiniteCollection<Universe>`).                                                                            |
| **2** | **Multiverse** (`🪐`)                          |       `Infinity` (`∞`)        | _"A collection of parallel/series universes."_                                                                               | Infinite parallel and sequential timeline branches (`2^64` Timeline Nodes) woven around each Sovereign Universe (`InfiniteCollection<Multiverse>`).                                                                                            |
| **3** | **Megaverse / Hyperverse** (`🌌`)              |       `Infinity` (`∞`)        | _"A cluster of multiple multiverses."_                                                                                       | High-dimensional brane super-clusters (`11D – ∞D`) binding distinct multiverses and elemental tribulation weather fronts (`InfiniteCollection<Megaverse>`).                                                                                    |
| **4** | **Omniverse** (`♾️`)                           |       `Infinity` (`∞`)        | _"Every universe, multiverse, and reality that has ever existed or could exist."_                                            | Each of the **100 Fictional Species** rules its own dedicated **Sovereign Omniverse (`OMNIVERSE-001` through `OMNIVERSE-100` + `∞`)**, containing every reality that has ever existed or could exist (`InfiniteCollection<Omniverse>`).        |
| **5** | **The Overvoid / Exonverse** (`🕳️`)            |   `100` (Fixed Bounded Cap)   | _"A collection of multiple distinct omniverses that operate under completely different laws of logic and cosmic hierarchy."_ | Strictly bounded to **100** meta-containers (`index: 1..100`, `OVERVOID-001`..`OVERVOID-100`) where each Sovereign Omniverse floats under completely independent laws of logic, physics, and cosmic hierarchy.                                 |
| **6** | **The White Page / The House of Ideas** (`📄`) |    `1` (Strict Singleton)     | _"Only one — everything comes from here, even nothingness (Oblivion). `creatergame31@gmail.com`."_                           | The supreme pre-existential singleton canvas (`isSingleton: true`). Everything — creation, causality, the 3,000 Great Daos, all 100 Overvoids, and even Nothingness (`Oblivion`) itself — originates here under **`creatergame31@gmail.com`**. |

### Strict 6-Tier Nested Data Architecture & Cardinality (`src/types/game.ts`, `src/game/omniverse.ts`, `src/components/CosmologicalAdminModal.tsx`)

Every entity exists within a strict 6-tier parent-child tree rooted in the Tier 6 `WhitePageRoot` singleton (`getWhitePageSingletonRoot()`), which spawns both all `100` bounded `Overvoid` instances (`overvoids: Overvoid[]`, `index: 1..100`) and non-existence (`oblivionState: { exists: true, description: 'Absolute nothingness originating from The White Page' }`), while modeling infinite Tiers 1–4 via `InfiniteCollection<T>` (`lazilyGenerateInfiniteTierSlice()`) and allowing custom logic and physics overrides at **Tier 5 (`Overvoid`)** and **Tier 1 (`Universe`)**:

```typescript
export const COSMIC_LIMITS = {
  WHITE_PAGE_COUNT: 1,
  OVERVOID_MAX_COUNT: 100,
  OMNIVERSE_COUNT: Infinity,
  MEGAVERSE_COUNT: Infinity,
  MULTIVERSE_COUNT: Infinity,
  UNIVERSE_COUNT: Infinity,
} as const;

interface InfiniteCollection<T> {
  totalCount: typeof Infinity;
  generatorSeed: string;
  loadedNodes: T[]; // Dynamically fetched or procedurally generated slice
}

interface Universe {
  id: string;
  name: string;
  tier: 1;
  spacetimeConfig: Record<string, unknown>;
  matterConstants: Record<string, unknown>;
}

interface Multiverse {
  id: string;
  name: string;
  tier: 2;
  topology: 'parallel' | 'series' | 'hybrid';
  universes: InfiniteCollection<Universe>;
}

interface Megaverse {
  id: string;
  name: string;
  tier: 3;
  alias: 'Megaverse' | 'Hyperverse';
  multiverses: InfiniteCollection<Multiverse>;
}

interface Omniverse {
  id: string;
  name: string;
  tier: 4;
  temporalScope: 'past' | 'present' | 'potential' | 'all';
  megaverses: InfiniteCollection<Megaverse>;
}

interface Overvoid {
  id: string;
  index: number; // Strictly bounded: 1 to 100
  name: string;
  tier: 5;
  alias: 'The Overvoid' | 'Exonverse';
  logicSystem: string;
  cosmicHierarchyRules: Record<string, unknown>;
  omniverses: InfiniteCollection<Omniverse>;
}

interface WhitePageRoot {
  id: 'THE_WHITE_PAGE';
  tier: 6;
  isSingleton: true;
  alias: 'The House of Ideas';
  creatorEmail: 'creatergame31@gmail.com';
  oblivionState: {
    exists: true;
    description: 'Absolute nothingness originating from The White Page';
  };
  overvoids: Overvoid[]; // Validation rule: length must equal exactly 100
}
```

---

## ⏳ The 7 Grand Historical Epochs

### 1. 📄 Epoch Ω-0 — Pre-Genesis: The White Page & The House of Ideas (`Before Time, Space & Oblivion`)

- **Cosmic Layer**: Layer 6 — _The White Page / The House of Ideas_
- **Sovereign Author**: `creatergame31@gmail.com`
- **Historical Chronicle**:
  Before the first spark of Spirit Qi, before the 3,000 Great Daos, and even before the concept of Nothingness (`Oblivion`) existed, there was only **The White Page / The House of Ideas**.
  Here dwells the Supreme Creator (`creatergame31@gmail.com`), whose pen inscribes both existence and non-existence. Every law of causality, every mathematical constant, and even the void of Oblivion itself was drafted as a single stroke upon the White Page.
  - **First Inscription**: The White Page defines the dual boundary between Being and Oblivion (`Nothingness`), establishing that even emptiness owes its origin to the House of Ideas (`creatergame31@gmail.com`).
  - **The Four Authorial Decrees**: The Supreme Creator (`creatergame31@gmail.com`) seals the Four Authorial Decrees — _White Page Genesis (`×2` All Omniverse Power)_, _Oblivion Reset_, _Cosmic Elevation (`+1` Cultivation Tier)_, and _House of Ideas Synthesis (`+10,000` Stash Loot)_ — into the foundational root of reality.
  - **The Primordial Inkwell**: From the ink of the House of Ideas, the 3,000 Great Daos and the primordial blueprint of the 6-Layer Cosmic Ontology are cast forth.

---

### 2. 🕳️ Epoch Ω-I — The Overvoid Divergence & 100+∞ Sovereign Omniverses (`Aeon of Infinite Omniversal Genesis`)

- **Cosmic Layer**: Layer 5 (_The Overvoid / Exoverse_) & Layer 4 (_Omniverse_)
- **Historical Chronicle**:
  As the first decrees rippled outward from the White Page, **The Overvoid / Exoverse** unfurled — a meta-existential expanse capable of hosting multiple distinct Omniverses that operate under completely different laws of logic and cosmic hierarchy.
  Within this Overvoid, the Supreme Creator (`creatergame31@gmail.com`) forged **`100 + ∞` Sovereign Omniverses** (`OMNIVERSE-001` through `OMNIVERSE-100` and beyond), granting each of the **100 Greatest Species in All Fiction** its own sovereign Omniverse containing every universe, multiverse, and reality that has ever existed or could exist for that race.
  - **Tier I — 10 Apex Cosmic Gods (Ranks #1–#10)**: The Beyonders (`OMNIVERSE-001`), Celestial Sapiens (`OMNIVERSE-002`), The Endless (`OMNIVERSE-003`), The Monitors (`OMNIVERSE-004`), The Fifth Dimension Imps (`OMNIVERSE-005`), The Q (`OMNIVERSE-006`), The Celestials (`OMNIVERSE-007`), Great Old Ones / Outer Gods (`OMNIVERSE-008`), Time Lords (`OMNIVERSE-009`), and New Gods (`OMNIVERSE-010`) establish the Outer Omniversal Thrones.
  - **Tiers II–X — Ranks #11–#100**: Across 90 additional Sovereign Omniverses, the Abstract & Reality Shapers (Downstreamers, Xeelee, Culture Minds), Precursors (Forerunners, Necrons, Old Ones), Warrior Bloodlines (Kryptonians, Saiyans, Viltrumites, Asgardians, Otsutsuki), Psionic Empires (Eldar, Protoss), Hive Swarms (Tyranids, Flood, Zerg), Cybernetic Collectives (Borg, Cybertronians, Daleks), High-Fantasy Immortals (Ainur, Valar, True Dragons), Galactic Civilizations, and Mythic Ancestors awaken under the Root Governance of `creatergame31@gmail.com`.
  - **The Six Envoy Projection Protocol**: Six iconic Omniversal Envoys (#1 Beyonder, #2 Celestial Sapien, #8 Great Old One, #9 Time Lord, #31 Kryptonian, #32 Saiyan) are projected directly into the Mortal Overworld as living Autonomous World AI ambassadors.

---

### 3. 🌌 Epoch Ω-II — Hyperversal Brane Weaving & The Multiversal Timeline Tree (`Aeon of Dimensional Architecture`)

- **Cosmic Layer**: Layer 3 (_Megaverse / Hyperverse_), Layer 2 (_Multiverse_), & Layer 1 (_Universe_)
- **Historical Chronicle**:
  Within each Sovereign Omniverse, higher-dimensional **Megaverses / Hyperverses** (`11D – ∞D` brane super-clusters) coalesced around **Multiverses** (`2^64` parallel and sequential timeline branches), which in turn crystallized into individual **Universes** — single realities with their own space, time, and matter.
  At the heart of the Prime Sovereign Universe (`Layer 1`), the Dragon-Vein Leylines converged to form the Central Immortal Continent, where the Five Elemental Weather Fronts (Clear Sky, Spirit Rain, Blood Moon, Thunder Tribulation, and Void Blizzard) began their eternal cycle.

---

### 4. 🧬 Epoch III — Awakening of the 10 Sovereign Playable Species & The Admin Rebirth Seal (`Age of Primordial Bloodlines`)

- **Cosmic Layer**: Layer 1 — _Prime Sovereign Universe_
- **Historical Chronicle**:
  Upon the Prime Sovereign Continent, **Ten Sovereign Playable Species** emerged from the primordial Dragon-Veins to contend for dominion: **Human** (`人族`), **Immortal / Celestial** (`仙族`), **Demon / Fiend** (`魔族`), **Dragonkin** (`龙族`), **Phoenix Bloodline** (`凤族`), **Void Walker** (`虚空族`), **Dwarf Forge-Kin** (`矮人灵匠`), **Titan Giant** (`泰坦巨神`), **Beastkin** (`妖兽万族`), and **Nether Spirit** (`幽冥鬼族`).
  To prevent catastrophic bloodline instability across timelines, the Supreme Creator (`creatergame31@gmail.com`) enacted the **Species Governance Covenant**: every Lord chooses their initial bloodline freely at creation, while any future Species Rebirth requires verified Super Admin authorization.

---

### 5. ☯️ Epoch IV — The Han Jue Four-Path Immortal Revelation & 100x Realm Suppression (`Age of Secluded Providence & Dao Synthesis`)

- **Cosmic Layer**: Layer 1–6 — _All 20 Realms of Cultivation_
- **Historical Chronicle**:
  When reckless immortals triggered the Great Karmic Cataclysm by slaughtering across the continent, the legendary ancestor **Han Jue** (_Top Tier Providence, Secretly Cultivate for a Thousand Years_) demonstrated the supreme truth of Secluded Cultivation: remaining inside one's Abode to accumulate Millennium Providence while cultivating all **Four Independent Paths** (**Spirit Qi**, **Fleshly Body**, **Soul & Divine Sense**, and **Dao Heart**) simultaneously.
  During this epoch, the **20 Canonical Cultivation Realms** were codified — from _Mortal Body_ and _Qi Condensation_ up to _Creator God_, _Omniverse Sovereign_, and _Eternal Dao Lord_ — governed by the absolute law of **100x (`100^ΔRealm`) Realm Suppression**.

---

### 6. 🏰 Epoch V — The Ten Citadel Eras & Trillion-Scale Siege Wars (`Age of Imperial Fortresses`)

- **Cosmic Layer**: Layer 1 — _Prime Sovereign Universe_
- **Historical Chronicle**:
  As Secluded Cultivators emerged as Sovereign Lords, they raised great fortresses that evolved across **10 Architectural Citadel Eras**: from _Nomadic War Camp_ and _Timber Palisade_ through _Stone Keep_, _bastion Star-Fortress_, _Imperial Citadel_, _Arcane Sky-Spire_, _Void-Forged Bastion_, and _Celestial Stronghold_ to the **Omniversal Throne Citadel**.
  Using 64-bit `BigInt` military logistics, Lords marshaled **T1–T20 Legions** across four combat doctrines (Infantry, Ranged, Cavalry, Siege) to besiege the **Ender Titan World Boss** and clash in multi-billion and multi-trillion troop campaigns.

---

### 7. ⚙️ Epoch VI — The `06/11/2026` Software & Hardware Architect Convergence (`v1.5.0` — `Present Era`)

- **Cosmic Layer**: Layer 1–6 — _Unified Client/Engine Convergence_
- **Historical Chronicle**:
  On the canonical convergence date **`06/11/2026`**, the Software & Hardware Architects unified the **3D WebGL / Three.js Stylized Teyvat PBR Renderer** with the **C++20 / Rust Engine Core Architecture**.
  PC/Console (`BC7 4K Master Override · LOD 0 Hero Meshes · Hybrid Real-Time GI`) and Mobile (`ASTC 6x6 1024px · LOD Bias +1 · 640 MB Base Build + 3.85 GB Optional HD Pack`) pipelines were synchronized alongside the **7-Day Daily Login Cycle (Veteran Scrolls)** and **4-Tier VIP Imperial Covenant**.
