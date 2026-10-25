# 🏰 Voxel Realms RPG: Open World MMORPG & Castle Warfare

[![Build, Test & Package](https://img.shields.io/badge/CI_Workflow-Build_%26_Test_Passing-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/build.yml)
[![Unit & Regression Tests](<https://img.shields.io/badge/Regression_Tests-55_Passing_(6_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](#testing-coverage--anti-spaghetti-architecture)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![Three.js WebGL2](https://img.shields.io/badge/Graphics-Three.js_PBR_%2B_HDR_Bloom-f59e0b?style=flat-square&logo=threedotjs&logoColor=white)](./src/game/proceduralWorld.ts)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8b5cf6?style=flat-square)](./LICENSE)
[![Built With AI-Assisted Tooling](https://img.shields.io/badge/Built_with_%F0%9F%A4%96-AI--Assisted_Engineering_%26_Procedural_WebGL-ec4899?style=flat-square)](#steam--platform-content-disclosure)

A high-performance, full-featured 3D Open-World MMORPG, Castle Warfare Strategy, and Four-Path Immortal Cultivation game built with **React 19**, **Three.js**, **TypeScript**, **Tailwind CSS**, and **Vite**.

Designed for both desktop (WASD + mouse drag) and mobile/Android (virtual touch D-pad & gesture navigation) with support for Studio PBR materials, `UnrealBloomPass` HDR10+ tone-mapped post-processing, and SIMD C++20 engine architectures.

---

## 🎮 Key Features

### 1. 🌍 3D Procedural Voxel World & Studio PBR + HDR Engine

- **Studio PBR Materials & Procedural Maps**: `MeshPhysicalMaterial` with clearcoat, IOR refraction, metallic reflections, and runtime-synthesized 2D canvas Albedo & Bump/Roughness maps for grass, masonry stone, timber bark, and crystalline water ripples.
- **Real-Time HDR Post-Processing**: Multi-pass `EffectComposer` with `RenderPass`, `UnrealBloomPass`, and `OutputPass` (ACES Filmic Tone Mapping + 2048×2048 PCFSoftShadowMap cascades), plus an interactive in-HUD **Graphics Quality Toggle (`ULTRA HDR` / `HIGH` / `BALANCED`)**.
- **Cross-Platform Input**: Full keyboard/mouse controls for PC/Mac, and responsive virtual on-screen D-pad and action buttons for Android and touchscreen devices.

### 2. 🏰 Castle Progression & 10 Eras (Lv. 0 – 100)

- **Multiplicative Scaling**: Expands from a primitive wooden outpost to an omnipotent cosmic citadel.
  - **10 Distinct Eras**: Wooden Outpost, Stone Palisade, Fortified Keep, Iron Citadel, Obsidian Fortress, Dragon Bastion, Void Stronghold, Celestial Spire, Primordial Sanctum, and Omnipotent Citadel.
  - **Massive Troop Capacities**: Scales up to **1,000 Trillion (1,000T)** garrisoned troops.
  - **World Rallies**: Rally armies up to **1 Trillion (1T)** against colossal world raid bosses.
- **Kingdom Economy**: Strategic resource gathering and management for Gold, Wood, Stone, Iron, Crystals, Diamonds, Spirit Stones, and Scripture Fragments.

### 3. ⚔️ Troop Barracks & T1–T20 Tri-Branch Combat

- **Tri-Type Strategic Counter Matrix**:
  - 🛡️ **Shieldbearers** (Defensive frontline tanks; counter Shooters, vulnerable to Bombers)
  - 🏹 **Shooters** (Long-range precision DPS; counter Bombers, vulnerable to Shieldbearers)
  - 💣 **Bombers** (Siege artillery & explosive splash; counter Shieldbearers, vulnerable to Shooters)
- **20 Tiers of Power**: Progression ranging from T1 Militia recruits up to T20 Primordial Cosmic Dreadnoughts.

### 4. 🧘 Four-Path Immortal Cultivation & Han Jue Progression

- **Four Distinct Paths**:
  - **Qi Path**: Spiritual energy, spell potency, and elemental affinity.
  - **Body Path**: Physical constitution, HP scaling, and blunt damage negation.
  - **Soul Path**: Divine sense, mental fortitude, and spiritual perception.
  - **Mind Path**: Enlightenment, breakthrough chance, and insight comprehension.
- **Immortal Realms**: Qi Refinement, Foundation Establishment, Golden Core, Nascent Soul, Soul Formation, Void Refining, Body Integration, Great Vehicle, Tribulation Transcending, and Dao Creator.
- **Realm Suppression**: Authentic xianxia power differentials where higher realms effortlessly suppress lower realms (e.g. Golden Core deals 100x damage to Qi Refinement).
- **The Karma System**:
  - Attacking innocent low-level players turns Karma negative, triggering **Red Name** status.
  - **Tribulation Lightning**: Strikes red-name players with instant-kill heavenly lightning if they linger in one place.
  - **Justice Bounties & Full Loot Drop**: Red names are marked globally on the map and drop equipped gear upon defeat.
- **Master & Disciple Hierarchy**:
  - Proximity cultivation speed buffs for disciples.
  - Resource funneling (master receives a percentage of disciple earnings).
  - Skill Transmission: Masters can transcribe rare mystical powers (e.g. _Heaven Earth Sleeve_) into tradeable Skill Scrolls.
- **Visualizing Power (Aura System)**:
  - Dynamic visual cues: Faint white glow (Foundation), rotating Golden Core, floating infant avatar (Nascent Soul), and divine halo rings scaling with mastered Great Daos (Dao Creator).
- **Secluded Cultivation**: Fast-forward secluded meditation inside personal cave abodes.

### 5. 🧠 Advanced World AI (Monsters Lv. 1–1000 & Role-Based NPCs)

- **Monster Complexity Scaling**:
  - **Tier 1 (Lv. 1–50)**: Basic instincts, direct aggro, and territorial roaming.
  - **Tier 2 (Lv. 51–200)**: Pack coordination, flanking maneuvers, and tactical retreats.
  - **Tier 3 (Lv. 201–500)**: Dynamic spell-casting rotations, enrage phases, and environmental interactions.
  - **Tier 4 (Lv. 501–800)**: Battlefield domain control, aura summons, and elemental resistances.
  - **Tier 5 (Lv. 801–1000)**: Reality distortion, spatial rifts, and complex multi-phase raid boss mechanics.
- **A\* Grid Pathfinding**: Real-time obstacle avoidance navigating around keeps, cliffs, and environmental barriers.
- **NPC Archetypes**:
  - **Guards**: Perimeter patrol, aggressive threat suppression, and defense alerts.
  - **Traders**: Dynamic pricing, buy/sell exchange, and resource arbitrage.
  - **Blacksmiths**: Equipment repair, weapon forging, and scrap dismantling.
  - **Mystics**: Spiritual attunement, karma cleansing, and fortune divination.
  - **Quest-Givers**: Dynamic procedural bounties and storyline decrees.
- **C++20 SIMD Engine**: Architecture blueprint for high-throughput mobile multithreading and low-latency ECS.

### 6. 🌦️ Dynamic Weather System

- Dynamic atmospheric cycle: **Clear**, **Rain**, **Snow**, and **Storm**.
- Weather modifiers impact resource gathering (e.g. rain increases timber and grain harvests, snow boosts diamond yields, storms accelerate oil extraction) and battle unit performance.

### 7. 🎁 Daily Login Rewards & Veteran Scrolls

- **7-Day Consecutive Decree Cycle**: Daily scaling rewards of diamonds, spirit stones, resources, and scripture fragments.
- **Realm & Castle Scaling**: Yields dynamically scale with both Citadel Level and Cultivation Realm.
- **Veteran Scroll Sanctum**: Imbue sacred scrolls across all cultivation paths for permanent lineage mastery buffs.

### 8. 🛡️ Clan Alliances & Global Leaderboards

- Create and customize clan emblems, manage membership hierarchies, coordinate world boss rallies, and compete on the global multi-trillion power rankings.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20+ (Node.js 22 recommended)
- **Package Manager**: `npm`

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### Development Server

Run the local Vite development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit Tests

Execute the unit test suite covering cultivation math, castle scaling, clan mechanics, weather modifiers, and world AI:

```bash
npm test
```

### Type Checking & Linting

Validate TypeScript code without emitting output:

```bash
npm run lint
```

### Production Build

Build the optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```text
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md           # Bug report template
│   │   ├── feature_request.md      # Feature request template
│   │   └── release_checklist.md    # Final release signoff issue template
│   ├── PULL_REQUEST_TEMPLATE.md    # Pull Request verification checklist
│   └── workflows/
│       └── build.yml               # GitHub Actions CI/CD (lint, test, build, artifact upload)
├── cpp/
│   ├── VoxelRealmsGuardrails.hpp   # C++20 RAII smart-pointer & concept guardrail header
│   └── engine_guardrail_test.cpp   # C++20 CTest static_assert & RAII verification unit test
├── src/
│   ├── components/                 # React UI Modals & HUD Overlays
│   │   ├── AdminConsoleModal.tsx   # GM / Admin dev console
│   │   ├── CastleModal.tsx         # Citadel upgrade & era progression UI
│   │   ├── CharacterCreationModal.tsx # Character creation & customization
│   │   ├── ClanEmblemView.tsx      # SVG clan banner & insignia renderer
│   │   ├── ClanModal.tsx           # Clan management & alliances
│   │   ├── CppArchitectureModal.tsx# C++20 engine blueprint, Guardrails & SIMD viewer
│   │   ├── CultivationModal.tsx    # 4-path cultivation & realm ascension
│   │   ├── DailyLoginModal.tsx     # 7-day login rewards & Veteran Scroll UI
│   │   ├── GameCanvas.tsx          # Three.js 3D viewport & voxel renderer
│   │   ├── GameHUD.tsx             # Main game HUD & status displays
│   │   ├── HeroModal.tsx           # Hero equipment & talent tree
│   │   ├── LeaderboardModal.tsx    # Global power rankings
│   │   ├── ResourceGatherModal.tsx # Resource node collection
│   │   ├── TitleScreen.tsx         # Game startup & save slot selection
│   │   ├── TroopBarracksModal.tsx  # T1-T20 troop recruitment & counters
│   │   ├── WeatherModal.tsx        # Weather forecasts & atmospheric buffs
│   │   ├── WorldAIDirectorModal.tsx# Monster scaling & NPC behavior director
│   │   └── WorldBossRallyModal.tsx # 1T troop world boss rally coordination
│   ├── game/                       # Core Game Engine & Simulation Logic
│   │   ├── audio.ts                # Web Audio sound FX synthesizer
│   │   ├── clanMath.ts             # Clan buffs & territorial calculations
│   │   ├── clanMath.test.ts        # Clan math unit tests
│   │   ├── cppEngine.ts            # C++20 SIMD engine blueprint & Guardrail code generators
│   │   ├── cultivationMath.ts      # 4 paths, suppression, karma, master-disciple logic
│   │   ├── cultivationMath.test.ts # Cultivation math unit tests
│   │   ├── dailyLogin.ts           # Daily login streak & reward scaling logic
│   │   ├── dailyLogin.test.ts      # Daily login system unit tests
│   │   ├── initialData.ts          # Default game state, heroes, and configurations
│   │   ├── math.ts                 # Castle level, eras, T1-T20 troop math
│   │   ├── math.test.ts            # Castle progression unit tests
│   │   ├── proceduralWorld.ts      # Voxel PBR terrain, castle, NPC, monster & aura meshes
│   │   ├── proceduralWorld.test.ts # 3D scene-graph, aura & engine telemetry regression tests
│   │   ├── weather.ts              # Weather engine & environmental multipliers
│   │   ├── weather.test.ts         # Weather unit tests
│   │   ├── worldAI.ts              # A* pathfinding, Lv 1-1000 monsters, NPC behaviors
│   │   └── worldAI.test.ts         # World AI unit tests
│   ├── types/                      # TypeScript definitions & data models
│   ├── App.tsx                     # Main application container & state provider
│   ├── index.css                   # Tailwind CSS styling
│   └── main.tsx                    # Application entry point
├── .clang-format                   # C++20 LLVM code formatter rules (IndentWidth: 4, ColumnLimit: 100)
├── .clang-tidy                     # C++20 static analyzer rules (enforces std::unique_ptr/std::shared_ptr)
├── .env.example                    # Environment variable template (safe placeholders)
├── .gitignore                      # Git ignore rules (node_modules, dist, build, .env, keystores)
├── .prettierignore                 # Excluded paths for Prettier formatting checks
├── .prettierrc                     # Prettier code style configuration
├── CHANGELOG.md                    # Chronological release history
├── CMakeLists.txt                  # C++20 strict compiler flags & CTest configuration
├── CODE_OF_CONDUCT.md              # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md                 # Developer setup, Guardrails, testing & PR guidelines
├── LICENSE                         # Apache License 2.0
├── NOTICE                          # Apache 2.0 Section 4(d) mandatory attribution & indexing notice
├── PRIVACY.md                      # User Privacy Policy (GDPR/CCPA, localStorage, payments, ads)
├── SECURITY.md                     # Private vulnerability disclosure policy
├── TERMS.md                        # Terms and Conditions of use
├── metadata.json                   # Applet configuration & metadata
├── package.json                    # Project dependencies, metadata & npm scripts
├── tsconfig.json                   # Strict TypeScript configuration (noUnusedLocals/Parameters)
├── vcpkg.json                      # Declarative C++20 package manager manifest & baseline lock
└── vite.config.ts                  # Vite build configuration
```

---

## 🧪 Testing Coverage & Anti-Spaghetti Guardrails

To solve the **"Spaghetti Code" risk** across both TypeScript/WebGL and C++20 engine layers (preventing duplicated logic, memory leaks, raw pointers, unused variables, deprecated packages, inconsistent formatting, or silent regressions), Voxel Realms RPG combines **Automated Technical Guardrails** with a disciplined **AI Supervision Process**:

### Part 1A: TypeScript / WebGL Guardrails (`.github/workflows/build.yml` -> `quality-check`)

Every push and Pull Request automatically runs four strict Web/TypeScript quality gates:

1. **The Linter (`npm run lint`)**: Runs `tsc --noEmit` with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled—screaming immediately if an unused variable, dead import, or type error is introduced.
2. **The Deprecation & Vulnerability Checker (`npm audit --audit-level=high`)**: Scans `package-lock.json` against known security vulnerabilities and outdated dependencies.
3. **The Formatter (`npx prettier --check .`)**: Enforces uniform formatting via `.prettierrc` so every file in the repository looks like it was written by a single author.
4. **The Regression Test Suite (`npm test`)**: Runs all **55 unit and regression tests across 6 decoupled test suites** (`src/game/*.test.ts`) to ensure new features never break existing systems.

### Part 1B: The C++20 Guardrail Stack (`.github/workflows/build.yml` -> `cpp20-guardrails`)

In C++20, messy code can cause memory leaks, slow compilation, and undefined crashes. Our automated C++20 pipeline enforces three core guardrails at the repository root:

1. **Linter / Static Analyzer (`clang-tidy` via `.clang-tidy`)**: Catches complex bugs, forbids raw owning pointers in favor of modern C++20 smart pointers (`std::unique_ptr`, `std::shared_ptr`, `std::make_unique`, `std::make_shared`), and treats warnings as errors (`WarningsAsErrors: '*'`).
2. **Formatter (`clang-format` via `.clang-format`)**: Enforces standardized LLVM formatting (`BasedOnStyle: LLVM`, `IndentWidth: 4`, `Standard: Latest`, `ColumnLimit: 100`).
3. **Package Manager (`vcpkg` via `vcpkg.json` & `CMakeLists.txt`)**: Tracks C++20 engine libraries (`entt`, `fmt`, `glm`, `sdl2`, `gtest`) against a pinned `builtin-baseline` commit so outdated or insecure C++ libraries are never introduced.

### Part 2: The Process Fix (AI Supervision & Prompting Strategy)

- **The "Architect First" Rule**: Never prompt to _"just write the code"_. Always require an architectural plan first that audits `src/game/` and `cpp/` for existing reusable functions before modifying files.
- **The Refactor Session (Every 3–4 Features)**: Pause feature development every 3–4 features to audit modified modules for duplicate logic, raw pointers, unused state, or deprecated APIs, refactoring cleanly while keeping all unit tests green.

### Automated Test Suites (`55/55 Passing` + `CTest C++20 Passing`)

- **`cultivationMath.test.ts`**: Verifies 4-path progression, 100x Realm Suppression (Golden Core vs Qi Refinement), Karma degradation to Red Name, stationary Tribulation Lightning, disciple taxation, and aura visual states.
- **`math.test.ts`**: Validates 10-era transitions, multiplicative power rankings into the trillions, 1,000T troop capacities, 1T rallies, and T1–T20 troop balance.
- **`worldAI.test.ts`**: Validates Lv. 1–1000 monster tier scaling, A* obstacle pathfinding around keep structures, and distinct state machines for Guards, Traders, Blacksmiths, Mystics, and Quest-Givers.
- **`weather.test.ts`**: Confirms cyclical weather transitions and dynamic resource/combat/cultivation multipliers.
- **`dailyLogin.test.ts`**: Tests calendar day deltas, 7-day streak rollover, castle/realm reward scaling, and Veteran Lineage Scroll comprehension.
- **`proceduralWorld.test.ts`**: Regression-tests 3D voxel terrain generation, castle era crystal upgrades, articulated NPC/Monster meshes, cultivator aura scene graphs (Foundation Glow, Golden Core, Nascent Soul Baby, Divine Halos, Red-Name Ring), and C++20 engine telemetry.
- **`cpp/engine_guardrail_test.cpp`**: Validates C++20 `constexpr` 100.0x Realm Suppression `static_assert` and RAII `std::unique_ptr` / `std::shared_ptr` ownership in `SectHierarchyManager`.

Run all Guardrail checks locally:

```bash
npm run lint                  # 1. Check TypeScript for messy code & unused variables
npm audit --audit-level=high  # 2. Check npm packages for vulnerabilities
npx prettier --check .        # 3. Check formatting style (or run `npm run format`)
npm test                      # 4. Run all 55 TypeScript unit & regression tests
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
| **Source Code & Game Logic** | Developed with AI-assisted coding workflows; verified by strict TypeScript (`tsc --noEmit`) and 55 automated unit tests | **No** (100% deterministic local simulation) |

### 2. Steamworks AI Disclosure Form Guide

When completing the **Steamworks Content Survey -> AI Disclosure Section** during game submission, select the following options:

- **Pre-Generated Content: YES**
  - _Disclosure Text for Steam Review_:
    > "AI-assisted software engineering tools were used during development to assist with drafting TypeScript/C++20 game systems, UI layouts, and unit test suites. All 3D voxel models, PBR surface textures, and sound effects are generated deterministically via mathematical procedural algorithms (Three.js geometry primitives, HTML5 Canvas 2D patterns, and Web Audio API oscillators). All code and game content have been human-reviewed, tested, and verified for originality and licensing compliance."
- **Live-Generated Content: NO**
  - _Explanation_: The game executes 100% locally in the client runtime using deterministic math, A* pathfinding, and procedural WebGL/WebAudio synthesis. It does not connect to any generative AI servers or generate unmoderated AI text/images/audio during live gameplay.

---

## ✅ Final Pre-Release Gate Checklist

Before tagging or publishing a release, confirm all release gates pass:

- [x] `npm install` completes cleanly with consistent `package-lock.json`
- [x] `npm run lint` (`tsc --noEmit` with unused-variable guardrails) passes with zero errors
- [x] `npm audit --audit-level=high` reports 0 high/critical vulnerabilities
- [x] `npx prettier --check .` verifies 100% consistent code formatting across all files
- [x] `npm test` passes all 55 unit & regression tests across 6 test suites
- [x] `npm run build` succeeds and outputs production bundle under `dist/`
- [x] App runs in browser (`npm run dev`) with all core flows verified on desktop and mobile
- [x] GitHub Actions CI Guardrails workflow (`.github/workflows/build.yml`) is green
- [x] Steam & Platform AI Disclosure documentation (`README.md`) is up to date
- [x] No `.env` secrets, API keys, or Android signing keystores (`*.jks`, `*.keystore`) are exposed

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **3D Graphics**: Three.js (WebGL with software fallback support)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript & C++20
- **Bundler**: Vite 8
- **Icons**: Lucide React
- **Audio**: Web Audio API Procedural Synthesizer
- **CI/CD**: GitHub Actions

---

## 📚 Documentation, Community & Legal

- **[Contributing Guide](./CONTRIBUTING.md)** — How to set up the repo, run tests, and submit Pull Requests.
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Community standards and expectations.
- **[Changelog](./CHANGELOG.md)** — Version history and release notes (`v1.0.0` – `v1.2.0`).
- **[Security Policy](./SECURITY.md)** — How to privately report security vulnerabilities (`creatergame31@gmail.com`).
- **[Privacy Policy](./PRIVACY.md)** — How user data, `localStorage`, accounts, payments, and ads are handled.
- **[Terms & Conditions](./TERMS.md)** — Rules of conduct, virtual goods policy, subscriptions, and liability disclaimers.
- **[Apache-2.0 License](./LICENSE)** & **[Mandatory Attribution Notice](./NOTICE)** — Full license text and Section 4(d) attribution requirements.

---

## 📜 License & Public Code Index Attribution Policy

Licensed under the **[Apache License 2.0](./LICENSE)** with mandatory attribution terms defined in **[NOTICE](./NOTICE)**.

### Public Code Index / Reference Hub Compliance (e.g., XERJ / Copus Hub)

This repository is verified compliant for open-source reference indexing under **Apache License 2.0**:

1. **License & Notice Verification**: Root [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE) files are present and require preservation of copyright notices (`Copyright 2026 Voxel Realms RPG Studio Contributors (Gitinclo)`), `SPDX-License-Identifier: Apache-2.0` headers, and repository attribution under Apache-2.0 Sections 4(a)–4(d).
2. **Third-Party Dependency & Asset Audit**: All dependencies in `package.json` and `vcpkg.json` use permissive open-source licenses compatible with Apache-2.0, and all 3D geometry, PBR textures, and audio are 100% procedurally generated in-engine.
3. **Zero Secrets Exposed**: `.gitignore` enforces strict exclusion of `.env*`, `*.jks`, `*.keystore`, `*.pem`, and `*.key` files.
4. **Non-Endorsement (Section 6)**: Indexing or redistributing code under Apache-2.0 does not grant trademark rights or imply endorsement by the project authors.

#### Ready-to-Use Maintainer Response Templates

- **Option A — Approve with Apache-2.0 Conditions:**
  > "Thanks for reaching out. This repository is licensed under Apache License 2.0. You may include it in your public reference index provided that full attribution to the repository and author (`Gitinclo`) is retained, the Apache-2.0 `LICENSE` and `NOTICE` files and per-file copyright headers are preserved intact, no code is relicensed under different terms, and inclusion is not presented as an official endorsement."
- **Option B — Decline / Opt Out:**
  > "No thank you — please do not include this repository in your public code index."
