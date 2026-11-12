# 🏰 Voxel Realms RPG: Open World MMORPG & Castle Warfare

[![Build, Test & Package](https://img.shields.io/badge/CI_Workflow-Build_%26_Test_Passing-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/build.yml)
[![Unit & Regression Tests](<https://img.shields.io/badge/Regression_Tests-98_Passing_(15_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](#testing-coverage--anti-spaghetti-guardrails)
[![Version](<https://img.shields.io/badge/Release-v1.5.0_(06%2F11%2F2026)-amber?style=flat-square>)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![Three.js WebGL2](https://img.shields.io/badge/Graphics-Three.js_PBR_%2B_HDR_Bloom-f59e0b?style=flat-square&logo=threedotjs&logoColor=white)](./src/game/proceduralWorld.ts)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8b5cf6?style=flat-square)](./LICENSE.md)
[![Built With AI-Assisted Tooling](https://img.shields.io/badge/Built_with_%F0%9F%A4%96-AI--Assisted_Engineering_%26_Procedural_WebGL-ec4899?style=flat-square)](#steam--platform-content-disclosure)

A high-performance, full-featured 3D Open-World MMORPG, Castle Warfare Strategy, and Four-Path Immortal Cultivation game built with **React 19**, **Three.js**, **TypeScript**, **Tailwind CSS v4**, and **Vite 8**.

Designed for both desktop (WASD + mouse drag) and mobile/Android (virtual touch D-pad & gesture navigation) with support for Studio PBR materials, `UnrealBloomPass` HDR10+ tone-mapped post-processing, adaptive PC/Console (`BC7 4K · LOD 0`) vs. Mobile (`ASTC · LOD Bias +1`) rendering pipelines, **10-Species / Race Character Creation & 3D Procedural Meshes**, **Infinite Omniverse & Top 100 Fictional Species Background NPCs (`creatergame31@gmail.com`)**, **Software & Hardware Architect Compatibility & Optimization (`06/11/2026` — `x86_64 AVX-512`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`, `SoA` DOD memory, Lock-Free Job DAG)**, and full **Administration / GM / Moderator RBAC Control (`creatergame31@gmail.com`)**.

---

## 🎮 Key Features

### 1. 🌍 3D Procedural Voxel World & Studio PBR + HDR Engine

- **Studio PBR Materials & Procedural Maps**: `MeshPhysicalMaterial` with clearcoat, IOR refraction, metallic reflections, and runtime-synthesized 2D canvas Albedo & Bump/Roughness maps for grass, masonry stone, timber bark, and crystalline water ripples.
- **Real-Time HDR Post-Processing & Platform Overrides**: Multi-pass `EffectComposer` with `RenderPass`, `UnrealBloomPass`, and `OutputPass` (ACES Filmic Tone Mapping + 2048×2048 `PCFSoftShadowMap` cascades), plus in-HUD **Graphics Quality (`NEXT-GEN ULTRA` / `HIGH` / `BALANCED`)** and **Platform Override (`PC/PS5 [BC7 · LOD 0]` / `MOBILE [ASTC · LOD BIAS +1]`)** toggles.
- **Cross-Platform Input**: Full keyboard/mouse controls for PC/Mac, and responsive virtual on-screen D-pad and action buttons for Android and touchscreen devices.

### 2. 🏰 Castle Progression & 10 Eras (Lv. 0 – 100)

- **Multiplicative Scaling**: Expands from a primitive wooden outpost to an omnipotent cosmic citadel.
  - **10 Distinct Eras**: Wooden Outpost, Stone Palisade, Fortified Keep, Iron Citadel, Obsidian Fortress, Dragon Bastion, Void Stronghold, Celestial Spire, Primordial Sanctum, and Omnipotent Citadel.
  - **Massive Troop Capacities**: Scales up to **1,000 Trillion (`1,000T`)** garrisoned troops.
  - **World Rallies**: Rally armies up to **1 Trillion (`1T`)** against colossal world raid bosses.
- **Kingdom Economy**: Strategic resource gathering and management for Wood, Steel, Copper, Grain, Oil, Diamonds, Spirit Stones, and Scripture Fragments.

### 3. ⚔️ Troop Barracks, Real-Time Training Queue & T1–T20 Tri-Branch Combat

- **Tri-Type Strategic Counter Matrix**:
  - 🛡️ **Shieldbearers** (Defensive frontline tanks; counter Shooters, vulnerable to Bombers)
  - 🏹 **Shooters** (Long-range precision DPS; counter Bombers, vulnerable to Shieldbearers)
  - 💣 **Bombers** (Siege artillery & explosive splash; counter Shieldbearers, vulnerable to Shooters)
- **20 Tiers of Power & Active Mobilization Queue**: Progression ranging from T1 Militia recruits up to T20 Primordial Cosmic Dreadnoughts, with real-time batch training progress, partial mobilization, and speed-up acceleration (`src/game/troopTraining.ts`).

### 4. 🧘 Four-Path Immortal Cultivation & Han Jue Progression

- **Four Distinct Paths (23 Realms, 9 Layers Each)**:
  - **Qi Path (练气)**: Spiritual energy, spell potency, and elemental affinity.
  - **Body Path (炼体)**: Physical constitution, HP scaling, and blunt damage negation.
  - **Soul Path (炼魂)**: Divine sense, mental fortitude, and spiritual perception.
  - **Mind Path (炼心)**: Enlightenment, passive cultivation speed, and tribulation resistance.
- **Immortal Realms**: Qi Refinement, Foundation Establishment, Golden Core, Nascent Soul, Soul Formation, Void Refining, Body Integration, Great Vehicle, Tribulation Transcending, Dao Creator, and beyond up to Ultimate Origin.
- **Realm Suppression**: Authentic Xianxia power differentials where higher realms effortlessly suppress lower realms (e.g. Golden Core deals `100.0x` damage to Qi Refinement).
- **The Karma System**:
  - Attacking innocent low-level players turns Karma negative, triggering **Red Name** status.
  - **Tribulation Lightning**: Strikes stationary Red-Name players with heavenly lightning.
  - **Justice Bounties & Full Loot Drop**: Red names are marked globally on the map and suffer equipment drop penalties upon defeat.
- **Master & Disciple Hierarchy**:
  - Proximity cultivation speed buffs for disciples, configurable Spirit Stone taxation (`5%–20%`), and Skill Scroll transmission.
- **Visualizing Power (3D Aura System & Hero Skins)**:
  - Dynamic 3D scene-graph cues: Foundation White Glow, revolving Golden Core, floating Nascent Soul avatar, and Dao Creator halo rings, plus customizable Hero Skins & Particle Auras (`src/game/heroSkins.ts`).

### 5. 🧠 Advanced World AI (Monsters Lv. 1–1000 & Role-Based NPCs)

- **Monster Complexity Scaling (5 Brackets)**:
  - **Bracket 1 — Feral (Lv. 1–50)**: Basic instincts, pack swarming, and node foraging.
  - **Bracket 2 — Tactical (Lv. 51–200)**: Shielded chargers, flanking maneuvers, and seismic AoE telegraphs.
  - **Bracket 3 — Sovereign (Lv. 201–500)**: Flanking orbiters, leyline siphoning, and elemental cone breaths.
  - **Bracket 4 — Abyssal (Lv. 501–800)**: Blink interception, void implosion fields, and domain control.
  - **Bracket 5 — Apex Titan (Lv. 801–1000)**: Multi-phase world boss cataclysms and Sovereign Tempest auras.
- **A\* Grid Pathfinding**: Real-time obstacle avoidance navigating around central castle keeps, cliffs, and environmental barriers.
- **Autonomous NPC Archetypes**:
  - **Guards**, **Caravan Traders**, **Runic Blacksmiths**, **Daoist Mystics**, **High Marshals**, and **Lorekeeper Elders** with interactive directives, stash collection, radiant quests, and caravan resource bartering.

### 6. 🌦️ Dynamic Weather System

- Dynamic atmospheric cycle: **Clear**, **Rain**, **Snow**, and **Storm**.
- Weather modifiers impact resource gathering (e.g. rain increases timber and grain harvests, snow boosts diamond yields, storms accelerate oil extraction) and battle unit performance.

### 7. 🎁 Daily Login Rewards & Veteran Scrolls

- **7-Day Consecutive Decree Cycle**: Daily scaling rewards of diamonds, spirit stones, resources, and scripture fragments scaled by both Citadel Level and Cultivation Realm.
- **Veteran Scroll Sanctum**: Imbue sacred scrolls across individual or all cultivation paths for permanent lineage mastery buffs.

### 8. 👑 Imperial VIP Member Covenant (`src/game/vipSubscription.ts`)

- **4 Tier Levels (`Free Sovereign`, `VIP 1 Silver Archon`, `VIP 2 Golden Sovereign`, `VIP 3 Celestial Emperor`)**:
  - Monthly and Annual billing cycles (activatable via Store Pass or Kingdom Diamonds), daily VIP Stipend Chests, Loyalty Level progression (`Lv. 1–15`), Castle Upgrade cost discounts, Extra Gathering March queues, and custom Realm Aura overrides.

### 9. 🛡️ Clan Alliances, 9-Sector Territory Wars & Global Leaderboards

- Create and customize heraldic SVG clan emblems, manage membership hierarchies, battle across the 9-sector (`A1`–`C3`) Territory War Map, strike the 600M HP Void Leviathan Co-op Boss, and compete on global multi-trillion power rankings.

### 10. ⚖️ Administration, GM, Admin & Moderator RBAC Control (`creatergame31@gmail.com`)

- **Root Account Binding (`src/game/adminModeration.ts`)**: Pre-authenticates **`creatergame31@gmail.com`** at Clearance Level `999` with full `Administration`, `Game Master (GM)`, `Admin`, `Moderator`, and `Official Contact` permissions and immutable root protection guardrails.
- **Live Moderation & Support Hub (`AdminConsoleModal.tsx`)**: Issue warnings, mute chat, apply temporary bans, restore active status, grant `+Moderator` / `+Admin` roles, broadcast server-wide GM decrees to Clan/World chat, and triage live player support/security tickets routed to `creatergame31@gmail.com`.

### 11. 🖥️ Software Architect & Hardware Architect Compatibility & Optimization (`06/11/2026` — `v1.5.0`)

- **Hardware Architect Matrix (`src/game/architectOptimization.ts`)**: Full CPU ISA vector & cache-line profiles for **`x86_64 AVX-512F/BW`** (512-bit, 64B cache line), **`ARMv9-A NEON + SVE2`** (heterogeneous core pinning), **`Apple Silicon M-Series`** (128B cache line + zero-copy Unified Memory Architecture), and **`RISC-V RV64GC + RVV 1.0`**, paired with GPU tiers (`Vulkan 1.3`, `DX12 Ultimate`, `Metal 3`, `WebGPU`, `WebGL 2.0`, `Software Rasterizer`) and Thermal TDP envelopes (`350W Desktop` down to `8W Mobile Passive`).
- **Software Architect Engine Optimization**: Interactive **Structure-of-Arrays (`SoA`) vs Array-of-Structures (`AoS`)** memory layout profiler (`4.75x` hot-loop speedup), zero-mutex **Lock-Free Work-Stealing Job Scheduler** across 2–64 logical cores, and a deterministic **Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`)**.

### 12. 🧬 10-Species / Race Character Creation & Admin-Authorized Rebirth (`src/game/species.ts`)

- **All 10 Playable Species across 3 Lineages**:
  - **Classic Fantasy**: `human` (_Terran Sovereign / 人族皇裔_), `sylvan_elf` (_Sylvan High Elf / 森罗灵族_), `ironforge_dwarf` (_Ironforge Runic Dwarf / 矮人神匠_), `warborn_orc` (_Warborn Goliath / 蛮荒巨灵_).
  - **Xianxia Immortal**: `azure_dragonkin` (_Azure Dragonkin / 太古龙族_), `celestial_kitsune` (_Celestial Nine-Tailed Kitsune / 九尾天狐_), `asura_demon` (_Asura Blood Fiend / 修罗魔族_), `empyrean_angelic` (_Empyrean Winged Celestial / 九天羽族_).
  - **Cosmic / Astral**: `void_walker` (_Void Walker / 虚空神族_), `crystalline_golem` (_Crystalline Ancient Automaton / 古神机关族_).
- **Full 3D Procedural Meshes & Innate Passives**: Real-time Three.js `SpeciesTraitGroup` attachments (pointed elven ears, fox spirit ears, braided dwarf runic beard, orc tusks, draconic/obsidian horns, feathered angelic/demonic wings, draconic/nine-tailed spirit tails, orbiting void crystals, and golem chest core reactors), body stature scaling (`bodyScale`), and innate combat/cultivation buffs.
- **Admin Permission Gate (`creatergame31@gmail.com`)**: Initial creation allows free selection of any species; switching species after creation (`speciesLocked: true`) requires authorization from Root Administrator **`creatergame31@gmail.com`** via live GM decree or `[SPECIES REBIRTH]` support ticket.

### 13. 🌌 Infinite Omniverse & Top 100 Fictional Species Background NPCs (`src/game/omniverse.ts`)

- **All 100 Iconic Species & Races Across 5 Tiers (Ranks 1–100)**:
  - **Tier 1 (1–20)**: _Omniversal, Cosmic & Reality-Warping Entities_ (Outer Gods, Beyonders, The Endless, Monitors, The Gentry, Celestialsapiens, Zeno's Race, Q Continuum, Downstreamers, Fifth-Dimensional Imps, Celestials, Angels, Chronovores, Naljians, Great Old Ones, Spiral Races, Eternals, Watchers, Guardians of the Universe, Chaos Gods).
  - **Tier 2 (21–40)**: _Type IV+ Civilizations & Hyper-Advanced Sci-Fi Races_ (Xeelee, Photino Birds, Time Lords, Daleks, Culture Minds, Precursors, Forerunners, The Qu, Necrons, C'tan, Old Ones, The Vex, The Hive, The Ancients / Alterans, The Ori, Reapers, Protheans, Cybertronians, Coluans, Firstborn).
  - **Tier 3 (41–60)**: _Divine, Mythic & Metaphysical Pantheons_ (Gods / Deities, Old Gods, New Gods, Asgardians, Olympians, Ainur, Fiendcelestials, Otsutsuki Clan, Soul Reapers / Shinigami, Dragons, Demons / Archfiends, Phoenix, Qilin / Kirin, Anodites, Glind / Core People, Titans, Daedra, Witchers, Vampires, True Fae / Fair Folk).
  - **Tier 4 (61–80)**: _Planet-Busting Warriors & Biological Powerhouses_ (Saiyans, Kryptonians, Viltrumites, Rognarrs, Martians, Frieza's Race, Namekians, Majins, Atomix's Species, To'kustars, Chronosapiens, Eternals, Symbiotes / Klyntar, Daxamites, Czarnians, Tamaraneans, Strontians, Eleos, Gourmet Cell Demons, Gems).
  - **Tier 5 (81–100)**: _Iconic Galactic Empires, Hives & Fantasy Archetypes_ (Humans, Mutants, Inhumans, Aeldari / Eldar, Orks / Krorks, Tyranids, The Flood, Zerg, Protoss, Xenomorphs, Yautja / Predators, Kree, Skrulls, Shi'ar, The Borg, Species 8472 / Undine, Klingons, Vulcans, Elves, Dwarves).
- **Sovereign Omniverse Per Race + Infinite Transfinite Continuum (`Ω-001` to `Ω-∞`)**: Every race owns its own Sovereign Omniverse (`OMNI-001`..`OMNI-100`), and `resolveInfiniteOmniverseByIndex` resolves any arbitrary omniverse coordinate from `1` to `∞`.
- **Background Characters (NPCs) Under Exclusive Control of Super Admin `creatergame31@gmail.com`**: All 100 Level-1000 Background NPC Envoys are bound to `creatergame31@gmail.com`, who can project/recall them into the 3D Voxel Overworld, set their directives (`channel_tribute`, `patrol_citadel`, `hunt_realm_threats`, `guard_dimensional_gate`, `enforce_admin_decree`), and harvest cosmic tribute across all 100 Omniverses.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20+ (Node.js 22 LTS recommended)
- **Package Manager**: `npm`

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### Development Server

Run the local Vite development server on port `3000`:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3000/?autostart=1](http://localhost:3000/?autostart=1) to skip the title overlay directly into the 3D realm).

### Running Unit & Regression Tests

Execute all **98 unit and regression tests across 15 decoupled test suites**:

```bash
npm test
```

### Type Checking, Formatting & Production Build

```bash
npm run lint          # Validate strict TypeScript (tsc --noEmit)
npm run format:check  # Check code formatting with Prettier
npm run build         # Build production bundle into dist/
npm run preview       # Preview production build locally
```

---

## 📁 Project Structure

```text
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # Bug report template
│   │   ├── feature_request.md         # Feature request template
│   │   └── release_checklist.md       # Final release signoff checklist
│   ├── ISSUE_TEMPLATE.md              # Unified issue / bug / feature / moderation template
│   ├── PULL_REQUEST_TEMPLATE.md       # Pull Request validation & guardrail checklist
│   └── workflows/
│       └── build.yml                  # GitHub Actions CI/CD (Web/TS + C++20 Guardrails)
├── cpp/
│   ├── VoxelRealmsGuardrails.hpp      # C++20 RAII smart-pointer & concept guardrail header
│   └── engine_guardrail_test.cpp      # C++20 CTest static_assert & RAII verification unit test
├── src/
│   ├── components/                    # React 19 UI Modals & HUD Overlays
│   │   ├── AdminConsoleModal.tsx      # GM cheats, T20 spawner, RBAC, Species & Omniverse hub
│   │   ├── CastleModal.tsx            # Citadel Lv 0-100 upgrade & 10-Era progression UI
│   │   ├── CharacterCreationModal.tsx # 10-Species selector, 3D turntable & Admin permission gate
│   │   ├── ClanEmblemView.tsx         # Heraldic SVG clan banner & insignia renderer
│   │   ├── ClanModal.tsx              # Clan vault, roster, chat, buffs & co-op boss
│   │   ├── ClanTerritoryMap.tsx       # Interactive 9-sector (A1-C3) clan war map
│   │   ├── CppArchitectureModal.tsx   # C++20 engine blueprint, Guardrails & SIMD viewer
│   │   ├── CultivationModal.tsx       # 4-path cultivation, manuals, pills & tribulations
│   │   ├── DailyLoginModal.tsx        # 7-day login decrees & Veteran Scroll sanctum
│   │   ├── GameCanvas.tsx             # Three.js 3D viewport, voxel renderer & raycaster
│   │   ├── GameHUD.tsx                # Consolidated top bar, D-pad & 5-tab command dock
│   │   ├── HeroModal.tsx              # Hero ascension, tavern summons & aesthetic skins
│   │   ├── LeaderboardModal.tsx       # Global lord & clan power rankings
│   │   ├── ResourceGatherModal.tsx    # Lv 1-10 resource node extraction & march queues
│   │   ├── TitleScreen.tsx            # Game startup overlay & quick access triggers
│   │   ├── TroopBarracksModal.tsx     # T1-T20 troop recruitment & live training queue
│   │   ├── VipSubscriptionModal.tsx   # VIP Tiers 0-3, daily stipends & loyalty perks
│   │   ├── WeatherModal.tsx           # Atmospheric observatory & weather ritual controls
│   │   ├── WorldAIDirectorModal.tsx   # Lv 1-1000 monster AI, NPC roles & 100-Omniverse Matrix
│   │   └── WorldBossRallyModal.tsx    # 1T troop world boss rally coordination
│   ├── game/                          # Pure Decoupled Game Engine & Unit Test Suites
│   │   ├── adminModeration.ts         # Root RBAC (creatergame31@gmail.com), moderation & tickets
│   │   ├── adminModeration.test.ts    # Admin, GM, Moderator & contact unit tests
│   │   ├── architectOptimization.ts   # 06/11/2026 Software & Hardware Architect optimization engine
│   │   ├── architectOptimization.test.ts # CPU ISA, GPU, TDP, SoA memory & Lock-Free Job unit tests
│   │   ├── audio.ts                   # Procedural Web Audio API sound FX synthesizer
│   │   ├── clanMath.ts                # Clan buffs, vault rations & outpost assault math
│   │   ├── clanMath.test.ts           # Clan math unit tests
│   │   ├── cppEngine.ts               # C++20 SIMD engine blueprint & Guardrail generators
│   │   ├── cultivationMath.ts         # 4 paths, 100x suppression, karma & disciple logic
│   │   ├── cultivationMath.test.ts    # Cultivation math unit tests
│   │   ├── dailyLogin.ts              # Daily login streak & Veteran Scroll scaling logic
│   │   ├── dailyLogin.test.ts         # Daily login system unit tests
│   │   ├── graphicsEngine.ts          # PC/Console BC7 vs Mobile ASTC LOD pipeline logic
│   │   ├── graphicsEngine.test.ts     # Graphics pipeline unit tests
│   │   ├── heroSkins.ts               # Hero aesthetic skins & particle aura catalog
│   │   ├── heroSkins.test.ts          # Hero skins unit tests
│   │   ├── initialData.ts             # Deterministic seed data for heroes, clans, AI & nodes
│   │   ├── math.ts                    # Castle eras, 1000T cap & T1-T20 troop combat math
│   │   ├── math.test.ts               # Castle & combat math unit tests
│   │   ├── omniverse.ts               # Top 100 Species Background NPCs & Infinite Omniverse Engine
│   │   ├── omniverse.test.ts          # 100-Species Omniverse & Super Admin control unit tests
│   │   ├── proceduralWorld.ts         # Voxel PBR terrain, castle, NPC, monster, species & aura meshes
│   │   ├── proceduralWorld.test.ts    # 3D scene-graph, aura & engine telemetry regression tests
│   │   ├── species.ts                 # 10-Species catalog, 3D mesh specs & Admin switch permission gate
│   │   ├── species.test.ts            # 10-Species catalog, 3D attachments & Admin permission unit tests
│   │   ├── troopTraining.ts           # Real-time troop training timer & speedup math
│   │   ├── troopTraining.test.ts      # Troop training queue unit tests
│   │   ├── vipSubscription.ts         # VIP membership tiers, discounts & feature access gates
│   │   ├── vipSubscription.test.ts    # VIP subscription unit tests
│   │   ├── weather.ts                 # Weather cycle & gathering/combat multipliers
│   │   ├── weather.test.ts            # Weather system unit tests
│   │   ├── worldAI.ts                 # A* pathfinding, Lv 1-1000 monsters & NPC state machines
│   │   └── worldAI.test.ts            # World AI & pathfinding unit tests
│   ├── types/                         # TypeScript definitions & domain models
│   ├── App.tsx                        # Root application state container
│   ├── index.css                      # Tailwind CSS v4 styling
│   └── main.tsx                       # Application entry point
├── .clang-format                      # C++20 LLVM code formatter rules (IndentWidth: 4, ColumnLimit: 100)
├── .clang-tidy                        # C++20 static analyzer rules (enforces smart pointers)
├── .env.example                       # Environment variable template (safe placeholders)
├── .gitignore                         # Git ignore rules (node_modules, dist, build, .env, keystores)
├── .prettierignore                    # Excluded paths for Prettier formatting checks
├── .prettierrc                        # Prettier code style configuration
├── ARCHITECTURE.md                    # System architecture & Functional Core / Imperative Shell guide
├── CHANGELOG.md                       # Chronological release history & v1.5.0 network spec
├── CMakeLists.txt                     # C++20 strict compiler flags & CTest configuration
├── CODE_OF_CONDUCT.md                 # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md                    # Developer setup, Guardrails, testing & PR guidelines
├── GOVERNANCE.md                      # Project governance, RBAC hierarchy & RFC process
├── LICENSE                            # Apache License 2.0 (raw text)
├── LICENSE.md                         # Apache License 2.0 (formatted legal summary & full terms)
├── NOTICE                             # Apache 2.0 Section 4(d) mandatory attribution notice
├── PRIVACY.md                         # User Privacy Policy (GDPR/CCPA, localStorage, payments, ads)
├── README.md                          # Project overview & documentation hub (this file)
├── ROADMAP.md                         # Long-term product vision & v1.5.0–v2.0.0 milestones
├── SECURITY.md                        # Private vulnerability disclosure policy
├── SUPPORT.md                         # Official support channels (creatergame31@gmail.com) & FAQ
├── TERMS.md                           # Terms and Conditions of use
├── metadata.json                      # Applet configuration & metadata
├── package.json                       # Project dependencies, metadata & npm scripts
├── tsconfig.json                      # Strict TypeScript configuration (noUnusedLocals/Parameters)
├── vcpkg.json                         # Declarative C++20 package manager manifest & baseline lock
└── vite.config.ts                     # Vite build configuration
```

---

## 🧪 Testing Coverage & Anti-Spaghetti Guardrails

To solve the **"Spaghetti Code" risk** across both TypeScript/WebGL and C++20 engine layers (preventing duplicated logic, memory leaks, raw pointers, unused variables, deprecated packages, inconsistent formatting, or silent regressions), Voxel Realms RPG combines **Automated Technical Guardrails** with a disciplined **AI Supervision Process** (detailed in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`GOVERNANCE.md`](./GOVERNANCE.md)):

### Part 1A: TypeScript / WebGL Guardrails (`.github/workflows/build.yml` -> `quality-check`)

Every push and Pull Request automatically runs four strict Web/TypeScript quality gates:

1. **The Linter (`npm run lint`)**: Runs `tsc --noEmit` with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled—failing immediately if an unused variable, dead import, or type error is introduced.
2. **The Deprecation & Vulnerability Checker (`npm audit --audit-level=high`)**: Scans `package-lock.json` against known security vulnerabilities and outdated dependencies.
3. **The Formatter (`npx prettier --check .`)**: Enforces uniform formatting via `.prettierrc` so every file in the repository looks like it was written by a single author.
4. **The Regression Test Suite (`npm test`)**: Runs all **98 unit and regression tests across 15 decoupled test suites** (`src/game/*.test.ts`) to ensure new features never break existing systems.

### Part 1B: The C++20 Guardrail Stack (`.github/workflows/build.yml` -> `cpp20-guardrails`)

Our automated C++20 pipeline enforces three core guardrails at the repository root:

1. **Linter / Static Analyzer (`clang-tidy` via `.clang-tidy`)**: Catches complex bugs, forbids raw owning pointers in favor of modern C++20 smart pointers (`std::unique_ptr`, `std::shared_ptr`, `std::make_unique`, `std::make_shared`), and treats warnings as errors (`WarningsAsErrors: '*'`).
2. **Formatter (`clang-format` via `.clang-format`)**: Enforces standardized LLVM formatting (`BasedOnStyle: LLVM`, `IndentWidth: 4`, `Standard: Latest`, `ColumnLimit: 100`).
3. **Package Manager (`vcpkg` via `vcpkg.json` & `CMakeLists.txt`)**: Tracks C++20 engine libraries (`entt`, `fmt`, `glm`, `sdl2`, `gtest`) against a pinned `builtin-baseline` commit.

### Automated Test Suites (`98/98 Passing` across 15 TypeScript Suites + `CTest C++20 Passing`)

- **`adminModeration.test.ts`**: Verifies Root Administration, GM, Admin, Moderator & Official Contact RBAC privileges for `creatergame31@gmail.com`, root immutability protection, player sanctions (`warn`, `mute`, `temp_ban`, `restore_active`, role grants), and support ticket routing.
- **`architectOptimization.test.ts`**: Verifies `06/11/2026` (`v1.5.0`) Hardware Architect CPU ISA profiles (`x86_64 AVX-512`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`), GPU compute backends, Thermal TDP envelopes, Software Architect `SoA` vs `AoS` cache efficiency, Lock-Free Work-Stealing Job DAG scaling, and Frame-Budget Auto-Scaler determinism.
- **`clanMath.test.ts`**: Validates clan level scaling, alliance vault donations, territory war outpost assaults, and co-op boss damage milestones.
- **`cultivationMath.test.ts`**: Verifies 4-path progression, `100.0x` Realm Suppression (Golden Core vs Qi Refinement), Karma degradation to Red Name, stationary Tribulation Lightning, disciple taxation, and aura visual states.
- **`dailyLogin.test.ts`**: Tests calendar day deltas, 7-day streak rollover, castle/realm reward scaling, and Veteran Lineage Scroll comprehension.
- **`graphicsEngine.test.ts`**: Validates PC/Console (`BC7 4K · LOD 0`) vs. Mobile (`ASTC · LOD Bias +1`) texture compression, shadow culling, and addressable HD pack mounting.
- **`heroSkins.test.ts`**: Tests hero skin catalog lookups, stat bonuses, and particle aura application.
- **`math.test.ts`**: Validates 10-era transitions, multiplicative power rankings into the trillions, `1,000T` troop capacities, `1T` rallies, and T1–T20 troop balance.
- **`omniverse.test.ts`**: Verifies all 100 Fictional Species Background NPCs (`TOP_100_OMNIVERSE_SPECIES_NPCS`) across Tiers 1–5, their 100 Sovereign Omniverses, infinite transfinite Omniverse coordinate resolution (`resolveInfiniteOmniverseByIndex`), 3D Overworld NPC projection, and strict Super Admin (`creatergame31@gmail.com`) command enforcement.
- **`proceduralWorld.test.ts`**: Regression-tests 3D voxel terrain generation, castle era crystal upgrades, articulated NPC/Monster meshes, cultivator aura scene graphs, and C++20 engine telemetry.
- **`species.test.ts`**: Verifies all 10 playable species across Fantasy, Xianxia, and Cosmic lineages, `createPlayerMesh` 3D procedural attachments (`SpeciesTraitGroup`) and stature scaling, and `evaluateSpeciesSwitchPermission` Admin authorization (`creatergame31@gmail.com`).
- **`troopTraining.test.ts`**: Validates batch training duration scaling, castle/VIP speed bonuses, partial troop mobilization, and instant completion math.
- **`vipSubscription.test.ts`**: Verifies VIP Tiers 0–3, Monthly/Annual activation, daily VIP stipends, loyalty level progression (`Lv. 1–15`), castle upgrade discounts, and feature access locks.
- **`weather.test.ts`**: Confirms cyclical weather transitions and dynamic resource/combat/cultivation multipliers.
- **`worldAI.test.ts`**: Validates Lv. 1–1000 monster complexity brackets, A\* obstacle pathfinding around keep structures, and distinct state machines for Guards, Traders, Blacksmiths, Mystics, and Quest-Givers.
- **`cpp/engine_guardrail_test.cpp`**: Validates C++20 `constexpr` `100.0x` Realm Suppression `static_assert`, `alignas(64)` `SoaEntityKinematicChunk`, and RAII `std::unique_ptr` / `std::shared_ptr` ownership in `SectHierarchyManager`.

Run all Guardrail checks locally:

```bash
npm run lint                  # 1. Check TypeScript for messy code & unused variables
npm audit --audit-level=high  # 2. Check npm packages for vulnerabilities
npx prettier --check .        # 3. Check formatting style (or run `npm run format`)
npm test                      # 4. Run all 98 TypeScript unit & regression tests
clang-format --dry-run --Werror cpp/VoxelRealmsGuardrails.hpp cpp/engine_guardrail_test.cpp # 5. C++20 Format check
```

---

## 🤖 Steam & Platform Content Disclosure

> **Built with 🤖 AI-Assisted Engineering & Procedural WebGL/WebAudio Synthesis**

If you are publishing or distributing **Voxel Realms RPG** on **Steam (Steamworks)**, **Google Play**, or **itch.io**, platform holders require transparent disclosure regarding how AI tools and procedural generation are used in the project.

### 1. Asset & Code Provenance Summary

| Category                     | Implementation Method                                                                                                   | Runtime External AI Calls?                   |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **3D Models & Voxel World**  | 100% deterministic procedural geometry (`Three.js` instanced meshes & math primitives in `src/game/proceduralWorld.ts`) | **No** (Zero external model assets)          |
| **Textures & Materials**     | 100% runtime mathematical 2D canvas synthesis (Albedo, Masonry, Bark, Water Normal/Bump maps)                           | **No**                                       |
| **Audio & Sound Effects**    | 100% procedural Web Audio API waveform synthesis (`OscillatorNode` & `BiquadFilterNode` in `src/game/audio.ts`)         | **No**                                       |
| **Source Code & Game Logic** | Developed with AI-assisted coding workflows; verified by strict TypeScript (`tsc --noEmit`) and 98 automated unit tests | **No** (100% deterministic local simulation) |

### 2. Steamworks AI Disclosure Form Guide

When completing the **Steamworks Content Survey -> AI Disclosure Section** during game submission, select the following options:

- **Pre-Generated Content: YES**
  - _Disclosure Text for Steam Review_:
    > "AI-assisted software engineering tools were used during development to assist with drafting TypeScript/C++20 game systems, UI layouts, and unit test suites. All 3D voxel models, PBR surface textures, and sound effects are generated deterministically via mathematical procedural algorithms (Three.js geometry primitives, HTML5 Canvas 2D patterns, and Web Audio API oscillators). All code and game content have been human-reviewed, tested, and verified for originality and licensing compliance."
- **Live-Generated Content: NO**
  - _Explanation_: The game executes 100% locally in the client runtime using deterministic math, A\* pathfinding, and procedural WebGL/WebAudio synthesis. It does not connect to any generative AI servers or generate unmoderated AI text/images/audio during live gameplay.

---

## ✅ Final Pre-Release Gate Checklist

Before tagging or publishing a release, confirm all release gates pass:

- [x] `npm install` completes cleanly with consistent `package-lock.json`
- [x] `npm run lint` (`tsc --noEmit` with unused-variable guardrails) passes with zero errors
- [x] `npm audit --audit-level=high` reports 0 high/critical vulnerabilities
- [x] `npx prettier --check .` verifies 100% consistent code formatting across all files
- [x] `npm test` passes all 98 unit & regression tests across 15 test suites
- [x] `npm run build` succeeds and outputs production bundle under `dist/`
- [x] App runs in browser (`npm run dev`) with all core flows verified on desktop and mobile
- [x] GitHub Actions CI Guardrails workflow (`.github/workflows/build.yml`) is green
- [x] Steam & Platform AI Disclosure documentation (`README.md`) is up to date
- [x] No `.env` secrets, API keys, or Android signing keystores (`*.jks`, `*.keystore`) are exposed

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **3D Graphics**: Three.js (WebGL2 with adaptive software fallback support)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript 7 & C++20
- **Bundler**: Vite 8
- **Icons**: Lucide React
- **Audio**: Web Audio API Procedural Synthesizer
- **CI/CD**: GitHub Actions

---

## 📚 Documentation, Community & Legal

### Legal & Compliance

- **[Apache-2.0 License (`LICENSE.md`)](./LICENSE.md)** & **[Raw `LICENSE`](./LICENSE)** / **[`NOTICE`](./NOTICE)** — Full Apache 2.0 terms, permissions, and Section 4(d) attribution requirements.
- **[Code of Conduct (`CODE_OF_CONDUCT.md`)](./CODE_OF_CONDUCT.md)** — Community standards, acceptable behavior, and enforcement rules (`creatergame31@gmail.com`).
- **[Privacy Policy (`PRIVACY.md`)](./PRIVACY.md)** — How user data, `localStorage`, accounts, payments, cookies, and GDPR/CCPA requests are handled.
- **[Terms & Conditions (`TERMS.md`)](./TERMS.md)** — Rules of conduct, virtual goods policy, subscriptions, and liability disclaimers.
- **[Security Policy (`SECURITY.md`)](./SECURITY.md)** — Private vulnerability disclosure policy (`creatergame31@gmail.com`).

### Project Tracking & History

- **[Changelog (`CHANGELOG.md`)](./CHANGELOG.md)** — Curated, chronologically ordered log of notable features, fixes, and architecture schemas (`v1.0.0` – `v1.5.0` · `06/11/2026`).
- **[Project Roadmap (`ROADMAP.md`)](./ROADMAP.md)** — High-level vision and upcoming milestones (`v1.5.0` Software & Hardware Architect, `v1.5.1` 50v50 WebSocket Sieges, `v1.6.0` Secret Realms, `v1.7.0` WebGPU Flocking, `v2.0.0` Native C++20/Vulkan).

### Support & Technical Guidance

- **[Support Guide (`SUPPORT.md`)](./SUPPORT.md)** — Official Administration / GM / Moderator contact directory (`creatergame31@gmail.com`), in-app ticketing, and troubleshooting FAQ.
- **[Project Governance (`GOVERNANCE.md`)](./GOVERNANCE.md)** — Decision-making structure, RBAC clearance hierarchy (`Lv. 999` Root Owner down to `Lv. 1`), and Architect-First RFC workflow.
- **[System Architecture (`ARCHITECTURE.md`)](./ARCHITECTURE.md)** — Technical deep-dive into the Functional Core / Imperative Shell pattern, `BigInt` trillion-scale math, A\* pathfinding, and 3D PBR rendering.
- **[Contributing Guide (`CONTRIBUTING.md`)](./CONTRIBUTING.md)** — How to set up the repo, run tests, and submit Pull Requests.

### Automation & GitHub Templates (`.github/`)

- **[Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)](./.github/PULL_REQUEST_TEMPLATE.md)** — Pre-merge validation checklist for build, test, and architectural guardrails.
- **[Issue Template (`.github/ISSUE_TEMPLATE.md`)](./.github/ISSUE_TEMPLATE.md)** — Pre-formatted form for filing bug reports, feature requests, and system specifications (alongside [`.github/ISSUE_TEMPLATE/bug_report.md`](./.github/ISSUE_TEMPLATE/bug_report.md), [`feature_request.md`](./.github/ISSUE_TEMPLATE/feature_request.md), and [`release_checklist.md`](./.github/ISSUE_TEMPLATE/release_checklist.md)).

---

## 📜 License & Public Code Index Attribution Policy

Licensed under the **[Apache License 2.0](./LICENSE.md)** with mandatory attribution terms defined in **[NOTICE](./NOTICE)**.

### Public Code Index / Reference Hub Compliance (e.g., XERJ / Copus Hub)

This repository is verified compliant for open-source reference indexing under **Apache License 2.0**:

1. **License & Notice Verification**: Root [`LICENSE`](./LICENSE), [`LICENSE.md`](./LICENSE.md), and [`NOTICE`](./NOTICE) files are present and require preservation of copyright notices (`Copyright 2026 Voxel Realms RPG Studio Contributors (Gitinclo)`), `SPDX-License-Identifier: Apache-2.0` headers, and repository attribution under Apache-2.0 Sections 4(a)–4(d).
2. **Third-Party Dependency & Asset Audit**: All dependencies in `package.json` and `vcpkg.json` use permissive open-source licenses compatible with Apache-2.0, and all 3D geometry, PBR textures, and audio are 100% procedurally generated in-engine.
3. **Zero Secrets Exposed**: `.gitignore` enforces strict exclusion of `.env*`, `*.jks`, `*.keystore`, `*.pem`, and `*.key` files.
4. **Non-Endorsement (Section 6)**: Indexing or redistributing code under Apache-2.0 does not grant trademark rights or imply endorsement by the project authors.

#### Ready-to-Use Maintainer Response Templates

- **Option A — Approve with Apache-2.0 Conditions:**
  > "Thanks for reaching out. This repository is licensed under Apache License 2.0. You may include it in your public reference index provided that full attribution to the repository and author (`Gitinclo` / `creatergame31@gmail.com`) is retained, the Apache-2.0 `LICENSE` and `NOTICE` files and per-file copyright headers are preserved intact, no code is relicensed under different terms, and inclusion is not presented as an official endorsement."
- **Option B — Decline / Opt Out:**
  > "No thank you — please do not include this repository in your public code index."
