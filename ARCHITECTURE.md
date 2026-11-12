# 🏗️ System Architecture (`ARCHITECTURE.md`)

This document provides a technical deep-dive into the architecture, design patterns, data flow, rendering pipeline, and anti-spaghetti guardrails of **Voxel Realms RPG: Open World MMORPG & Castle Warfare**.

---

## 1. High-Level Architectural Pattern: Functional Core, Imperative Shell

To prevent state entanglement and make complex RPG math 100% deterministic and unit-testable in milliseconds, the codebase is strictly partitioned into two layers:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                     IMPERATIVE SHELL (React 19 + Three.js)                 │
│  • src/App.tsx (Top-level state orchestration & modal routing)             │
│  • src/components/GameCanvas.tsx (WebGL2 renderer, camera, input loop)     │
│  • src/components/GameHUD.tsx & *Modal.tsx (Accessible DOM overlays)       │
│  • src/game/audio.ts (Procedural Web Audio API oscillator synthesis)       │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │ Pure, typed function calls & immutable state
                                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   FUNCTIONAL CORE (Pure TypeScript & C++20)                │
│  • src/game/math.ts              (Castle Lv 0-100, 1000T cap, T1-T20 math) │
│  • src/game/cultivationMath.ts   (4 Paths, 23 Realms, 100x suppression)    │
│  • src/game/worldAI.ts           (Lv 1-1000 AI brackets, A* pathfinding)   │
│  • src/game/clanMath.ts          (9-sector territory wars, co-op boss)     │
│  • src/game/weather.ts           (Clear/Rain/Snow/Storm yield modifiers)   │
│  • src/game/dailyLogin.ts        (7-day streak & Veteran Scroll scaling)   │
│  • src/game/vipSubscription.ts   (VIP Tiers 0-3, stipends, feature gates)  │
│  • src/game/adminModeration.ts   (RBAC for creatergame31@gmail.com & mods) │
│  • src/game/architectOptimization.ts (CPU ISA, GPU, TDP, SoA & Job DAG)    │
│  • src/game/species.ts           (10 Species catalog, 3D specs & Admin gate)│
│  • src/game/omniverse.ts         (100 Species NPCs & Infinite Omniverse)   │
│  • src/game/proceduralWorld.ts   (Deterministic 3D mesh & PBR builders)    │
│  • cpp/VoxelRealmsGuardrails.hpp (C++20 concepts, RAII, 64B/128B SoA)      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Why This Separation Matters

- **Zero DOM/Browser Coupling in Core Logic**: None of the modules in `src/game/` (except `audio.ts`) depend on React or browser globals, allowing `npm test` (`tsx --test src/game/*.test.ts`) to execute **98 unit and regression tests across 15 suites** in ~1.5 seconds.
- **No 60Hz React Re-Renders**: `GameCanvas.tsx` mounts the Three.js `WebGLRenderer` and scene graph once (`useEffect(..., [])`), reading latest React callbacks and props through `useRef` so HUD updates never tear down the WebGL context or reset player coordinates.

---

## 2. Directory & Module Map

```text
/
├── cpp/
│   ├── VoxelRealmsGuardrails.hpp    # C++20 concepts, constexpr suppression math, RAII SectHierarchyManager
│   └── engine_guardrail_test.cpp    # CTest static_assert & smart-pointer verification
├── src/
│   ├── components/
│   │   ├── GameCanvas.tsx           # Three.js viewport, raycasting, WASD/touch movement, EffectComposer
│   │   ├── GameHUD.tsx              # Consolidated top bar, virtual joystick, 5-tab bottom command dock
│   │   ├── TitleScreen.tsx          # Entry screen (?autostart=1 bypass supported for automated testing)
│   │   ├── AdminConsoleModal.tsx    # GM cheats, T20 spawner, RBAC, Species & Omniverse hub
│   │   ├── CharacterCreationModal.tsx # 10-Species selector, 3D turntable & Admin permission gate
│   │   ├── CastleModal.tsx          # Citadel Lv 0-100 upgrade & 10-Era visualization
│   │   ├── TroopBarracksModal.tsx   # T1-T20 recruitment, real-time training queue & counter matrix
│   │   ├── CultivationModal.tsx     # Four-Path Dantian, manuals, alchemy pills, Heavenly Tribulations
│   │   ├── WorldAIDirectorModal.tsx # Lv 1-1000 monster telemetry, A* waypoints & 100-Omniverse Matrix
│   │   ├── ClanModal.tsx            # Alliance vault, 9-sector war map, co-op boss, emblem studio
│   │   ├── VipSubscriptionModal.tsx # VIP Covenant tiers, daily stipends & loyalty progression
│   │   └── ...                      # HeroModal, DailyLoginModal, WeatherModal, LeaderboardModal, etc.
│   ├── game/                        # Decoupled domain logic & co-located *.test.ts suites
│   ├── types/
│   │   ├── game.ts                  # Core domain interfaces (BigInt resources, troops, AI, species)
│   │   └── cultivation.ts           # Four-Path realms, manuals, disciples, karma types
│   └── App.tsx                      # Root state container & simulation timers
```

---

## 3. Core Subsystem Deep-Dives

### A. Trillion-Scale `BigInt` Economy & Combat Math (`src/game/math.ts`)

Standard IEEE-754 double-precision floats lose integer precision above `Number.MAX_SAFE_INTEGER` (`9.007 × 10^15`). Because Voxel Realms RPG scales Castle Troop Capacity to **1,000 Trillion (`10^15`)** and multiplicative Kingdom Power into the **Quadrillions (`10^18+`)**, all resource balances, troop counts, monster HP pools, and power ratings use native JavaScript `bigint` (and `int64_t` / `uint64_t` in C++20).

- **Formatting**: `formatBigInt(value)` deterministically formats arbitrary-precision integers into human-readable suffixes (`K`, `M`, `B`, `T`, `Qa`).
- **Tri-Branch Counter Matrix**:
  - `Shieldbearer` counters `Shooter` (`1.5x` damage advantage)
  - `Shooter` counters `Bomber` (`1.5x` damage advantage)
  - `Bomber` counters `Shieldbearer` (`1.5x` damage advantage)

### B. Four-Path Immortal Cultivation & Realm Suppression (`src/game/cultivationMath.ts`)

Players cultivate four complementary paths simultaneously:

1. **Qi Path (练气)**: Spiritual energy reserves and elemental spell potency.
2. **Body Path (炼体)**: Physical constitution, siege survivability, and casualty reduction.
3. **Soul Path (炼魂)**: Divine sense, crit precision, and formation perception.
4. **Mind Path (炼心)**: Dao heart stability, passive cultivation speed, and tribulation resistance.

- **Realm Suppression Formula**: When a higher-realm cultivator engagements a lower-realm target, the suppression multiplier scales exponentially (`100.0x` across a 2-major-realm gap, such as Golden Core vs. Qi Refinement), matching the C++20 `constexpr calculateRealmSuppressionMultiplier` verified by `static_assert` in `cpp/VoxelRealmsGuardrails.hpp`.
- **Karma & Heavenly Tribulation**: Unprovoked attacks lower Karma into **Red Name** territory (`karmaValue < 0`), activating a red scene-graph ring and triggering stationary Tribulation Lightning strikes if the player camps in one location.

### C. Autonomous World AI & A\* Obstacle Pathfinding (`src/game/worldAI.ts`)

- **Monster Complexity Brackets (Lv. 1 – 1000)**:
  - `bracket_1_feral` (Lv. 1–50): Pack swarming and node foraging.
  - `bracket_2_tactical` (Lv. 51–200): Shielded charges and seismic AoE telegraphs.
  - `bracket_3_sovereign` (Lv. 201–500): Flanking orbiters and leyline siphoning.
  - `bracket_4_abyssal` (Lv. 501–800): Blink interception and void implosion fields.
  - `bracket_5_apex_titan` (Lv. 801–1000): Supreme arbiter multi-phase world boss cataclysms.
- **A\* Spatial Pathfinding**: `computeAStarPath(start, goal, obstacles)` routes NPCs and monsters around the central Solara Citadel keep footprint (`[-9, +9]` world coordinates) without clipping through castle masonry.

### D. 3D Voxel Rendering & Adaptive Software-WebGL Pipeline (`src/game/proceduralWorld.ts` & `src/components/GameCanvas.tsx`)

- **100% Procedural Geometry & PBR Textures**: Terrain chunks are batched using `THREE.InstancedMesh` (1 draw call per biome block type), while Albedo, Masonry, Timber Bark, and Water Normal maps are synthesized deterministically at runtime via 2D HTML5 Canvas generators.
- **Hardware vs. Software WebGL Detection**:
  - On dedicated GPUs (`pc_console` / `ultra` preset), `EffectComposer` runs `RenderPass` + `UnrealBloomPass` + `OutputPass` with ACES Filmic tone mapping and `PCFSoftShadowMap` cascades.
  - On headless browsers (SwiftShader / llvmpipe) or `balanced` / `mobile` overrides, the renderer automatically bypasses heavy post-processing passes and caps pixel ratio to `1.0` to guarantee responsive frame times.

### E. Administration, GM & Moderator RBAC (`src/game/adminModeration.ts`)

- Binds **`creatergame31@gmail.com`** as the Root Owner (`owner_admin`, Clearance Level `999`) with full `Administration`, `Game Master (GM)`, `Admin`, `Moderator`, and `Official Contact` permissions.
- Enforces immutable root protection (`isPrimaryAdminAccount`) so the root account can never be sanctioned or demoted, while providing pure state transitions for player warnings, chat mutes, temporary/permanent bans, role grants, and support ticket triage.

### F. Software Architect & Hardware Architect Compatibility & Optimization (`src/game/architectOptimization.ts` · `06/11/2026`)

- **Hardware Architect ISA & Cache-Line Alignment**: Profiles `x86_64 AVX-512F/BW` (512-bit, 16× float32, 64B cache lines), `ARMv9-A NEON + SVE2` (heterogeneous Prime/Performance/Efficiency core pinning), `Apple Silicon M-Series` (`alignas(128)` 128B cache lines + zero-copy Unified Memory Architecture), and `RISC-V RV64GC + RVV 1.0`.
- **GPU Compute & Thermal TDP Envelopes**: Evaluates `Vulkan 1.3`, `DirectX 12 Ultimate`, `Apple Metal 3`, `WebGPU`, `WebGL 2.0`, and `CPU Software Rasterizer (SwiftShader)` alongside thermal governors (`350W Desktop`, `200W Console`, `25W Handheld`, `8W Mobile Passive`).
- **Software Architect DOD (`SoA` vs `AoS`) & Lock-Free Job DAG**: Benchmarks contiguous Structure-of-Arrays (`SoA`, `32B` hot-loop stride, `<2.5%` L1/L2 cache miss rate, `4.75x` speedup) against legacy Array-of-Structures (`AoS`), schedules 5 engine stages across a zero-mutex Chase-Lev work-stealing thread pool, and drives a deterministic Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`).

### G. 10-Species / Race System & Admin Rebirth Gate (`src/game/species.ts`)

- **10 Playable Species across 3 Lineages**: Defines `CHARACTER_SPECIES_CATALOG` across Classic Fantasy (`human`, `sylvan_elf`, `ironforge_dwarf`, `warborn_orc`), Xianxia Immortal (`azure_dragonkin`, `celestial_kitsune`, `asura_demon`, `empyrean_angelic`), and Cosmic / Astral (`void_walker`, `crystalline_golem`).
- **3D Scene-Graph Attachments**: `createPlayerMesh` constructs a dedicated `SpeciesTraitGroup` with procedural horns, ears, wings, tails, tusks, runic beards, orbiting void shards, and golem core reactors while applying per-species stature scaling (`bodyScale`).
- **Admin Permission Gate (`evaluateSpeciesSwitchPermission`)**: Once a character's initial species is locked (`speciesLocked: true`), switching to a different species requires authorization from **`creatergame31@gmail.com`** (via active Admin/GM privileges or an approved `adminSpeciesSwitchApproved` decree).

### H. Infinite Omniverse & Top 100 Fictional Species Background NPCs (`src/game/omniverse.ts`)

- **100 Canonical Fictional Species (`TOP_100_OMNIVERSE_SPECIES_NPCS`)**: Catalogs all 100 species across 5 Tiers (`1–20` Omniversal Entities, `21–40` Type IV+ Sci-Fi Civilizations, `41–60` Divine & Xianxia Pantheons, `61–80` Planet-Busting Warriors, `81–100` Galactic Empires & Fantasy Archetypes).
- **Sovereign Omniverse Per Race + Infinite Transfinite Generator (`resolveInfiniteOmniverseByIndex`)**: Assigns each race a dedicated Sovereign Omniverse (`OMNI-001`..`OMNI-100`) and deterministically resolves any omniverse coordinate from `1` to `∞`.
- **Super Admin Background NPC Command (`executeOmniverseSuperAdminCommand`)**: Enforces that only Super Admin **`creatergame31@gmail.com`** controls the 100 Background NPCs, projects them into the 3D Overworld (`projectOmniverseNpcToWorldNPC`), sets their directives, and harvests their cosmic tributes.

---

## 4. Anti-Spaghetti Engineering Guardrails

Every commit is validated against five automated gates (see [`.github/workflows/build.yml`](./.github/workflows/build.yml)):

1. **Strict TypeScript Linter (`npm run lint`)**: `tsc --noEmit` with `strict: true`, `noUnusedLocals: true`, and `noUnusedParameters: true`.
2. **Decoupled Unit Test Suite (`npm test`)**: 98 deterministic unit tests across 15 suites in `src/game/*.test.ts`.
3. **Code Formatting (`npm run format:check`)**: Enforced across all `.ts`, `.tsx`, `.md`, and `.json` files via Prettier.
4. **C++20 Static Analysis & Formatting (`.clang-tidy` & `.clang-format`)**: Forbids raw owning `new`/`delete` pointers (`cppcoreguidelines-owning-memory`) in favor of `std::unique_ptr` and `std::shared_ptr`, and verifies `alignas(64)` / `alignas(128)` `SoA` cache-line alignment.
5. **Zero External Secret Exposure**: Verified via `.gitignore` and `.env.example`.
