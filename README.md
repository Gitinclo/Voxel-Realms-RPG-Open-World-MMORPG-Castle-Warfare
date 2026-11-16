# 🏰 Voxel Realms RPG: Open World MMORPG & Castle Warfare

[![Build, Test & Package](https://img.shields.io/badge/CI_Workflow-Build_%26_Test_Passing-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/build.yml)
[![Unit & Security Tests](<https://img.shields.io/badge/Automated_Tests-168_Passing_(28_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](#testing-coverage--anti-spaghetti-guardrails)
[![Version](<https://img.shields.io/badge/Source_Version-1.5.0_(No_GitHub_Release_Yet)-amber?style=flat-square>)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![Three.js WebGL2](https://img.shields.io/badge/Graphics-Three.js_0.187_%2B_BVH_%2B_Cannon_Physics-f59e0b?style=flat-square&logo=threedotjs&logoColor=white)](./src/game/openWorld3DEngine.ts)
[![Cloud Persistence](https://img.shields.io/badge/Cloud_Data-Cloud_SQL_%2B_Firestore-6366f1?style=flat-square&logo=firebase&logoColor=white)](#16-️-cloud-sql-postgresql-firebase-auth-hardened-firestore--gmail-dispatch-center)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8b5cf6?style=flat-square)](./LICENSE.md)
[![EULA: v1.5.0](<https://img.shields.io/badge/EULA-v1.5.0_(15%2F11%2F2026)-14b8a6?style=flat-square>)](./EULA.md)
[![Built With AI-Assisted Tooling](https://img.shields.io/badge/Built_with_%F0%9F%A4%96-AI--Assisted_Engineering_%26_Procedural_WebGL-ec4899?style=flat-square)](#steam--platform-content-disclosure)

> **Release Status Notice:** There are currently **0 published GitHub Releases** and no pushed `v*` Git tags in this repository. Version `1.5.0` (`package.json`) reflects the active `main`-branch source milestone tracked in [`CHANGELOG.md`](./CHANGELOG.md), validated by CI (`npm run validate` + `npm audit` + `npm run verify:ops` uploading temporary workflow artifacts). Formal GitHub Releases are created via [`.github/workflows/release.yml`](./.github/workflows/release.yml) when a `v*.*.*` tag is pushed.

A high-performance, full-featured 3D Open-World MMORPG, Castle Warfare Strategy, and Four-Path Immortal Cultivation game built with **React 19** (`React.lazy` code-split modals), **Three.js**, **D3.js**, **TypeScript**, **Tailwind CSS v4**, and **Vite 8**, backed by a full-stack **Express + RFC 6455 WebSocket** server, **Cloud SQL (PostgreSQL + Drizzle ORM)**, **Firebase Authentication & Cloud Firestore**, and **Google Workspace Gmail Dispatch**.

Designed for both desktop (WASD + mouse drag) and mobile/Android (virtual touch D-pad & gesture navigation) with live WebGL2 procedural `MeshPhysicalMaterial` PBR textures (`256px` / `512px` / `1024px`), `UnrealBloomPass` + custom GLSL color-graded post-processing, 4-tier `THREE.LOD` chains & `InstancedMesh` foliage scaling, **3D Open-World Spatial BVH Raycasting (`three-mesh-bvh`), Multi-Octave Simplex Biome Heightmaps (`simplex-noise`), 3D Rigid-Body Physics (`cannon-es`) & Camera Interpolation (`@tweenjs/tween.js`) (`src/game/openWorld3DEngine.ts`)**, **Authoritative 20Hz 50v50 WebSocket Castle Siege Server, Server-Authoritative Anti-Cheat (`src/game/antiCheat.ts`, `/api/online/anti-cheat`) & Multi-Region Persistence (`server.ts`, `/ws/siege`, `/api/online/*`, `src/game/siegeNetProtocol.ts`)**, **Cloud SQL PostgreSQL + Drizzle ORM Persistence (`/api/db/*`, `src/db/`)**, **Firebase Auth Dual-Tier Google Sign-In & Real-Time Firestore Cloud Sync (`firestore.rules`, `firebase-blueprint.json`)**, **Gmail Dispatch Center (`src/lib/gmail.ts`, `GmailModal.tsx`)**, **10-Article End User License Agreement (`EULA.md`) & Complete 10-Agreement Legal Stack (`LEGAL.md`, `src/game/eula.ts`, `EulaModal.tsx`)**, **Server-Side HMAC-SHA256 Session Auth & Fail-Closed RBAC (`src/game/serverAuth.ts`, `/api/auth/*`, `/api/admin/*`)**, **10-Species / Race Character Creation & 3D Procedural Meshes**, **6-Layer Cosmic Hierarchy & Cardinality Architecture (`COSMIC_LIMITS` & `InfiniteCollection<T>`: 1. Universe [`∞`] → 2. Multiverse [`∞`] → 3. Megaverse/Hyperverse [`∞`] → 4. Omniverse [`∞`] → 5. The Overvoid/Exonverse [`100` Fixed Cap] → 6. The White Page / The House of Ideas [`1` Singleton]), Interactive D3 Cosmological Tree Admin Visualizer (`CosmologicalAdminModal`) & Top 100 Fictional Species Background NPCs (`creatergame31@gmail.com`)**, **Auto-Populating Open-World Lore Codex (`Biomes` & `Lv. 1–1000 Monsters`), 12 Imperial Dynastic Annals, and `10^100`-Word (One Googol Words) Akashic Lore Stream**, **Software & Hardware Architect Compatibility & Optimization (`15/11/2026`)**, an explicit **Engineering Transparency Matrix (`6 Implemented`, `2 Simulated`, `0 Planned`)**, and full **Administration / GM / Moderator RBAC Control (`creatergame31@gmail.com`)**.

---

## 🎮 Key Features

### 1. 🌍 3D Procedural Voxel World & Studio PBR + HDR Engine

- **Live WebGL2 Procedural PBR Materials & Dynamic CanvasTextures**: `MeshPhysicalMaterial` with clearcoat, IOR refraction, metallic reflections, and runtime-synthesized HTML5 `CanvasTexture` Albedo, Normal, Bump & AO maps (`256×256`, `512×512`, or `1024×1024`) for grass, masonry stone, timber bark, Damascus armor, and crystalline water ripples. Switching presets or platforms dynamically resizes canvas textures, updates anisotropy (`4x` / `8x` / `16x`), and mutates `normalScale` and `bumpScale` on active Three.js materials.
- **Real-Time HDR Post-Processing, `THREE.LOD` Chains & Platform Pipeline**: Multi-pass `EffectComposer` with `RenderPass`, `UnrealBloomPass`, custom `NextGenColorGradeShader`, and `OutputPass` (ACES Filmic Tone Mapping + dynamic `2048×2048` / `1024×1024` `PCFSoftShadowMap`), 4-tier `THREE.LOD` distance switching, dynamic `InstancedMesh` foliage scaling (`800` / `520` / `320` grass tufts), and small-prop shadow culling, paired with modeled cross-platform import overrides (`BC7` vs `ASTC`) and bundle size manifests (`src/game/graphicsEngine.ts`).
- **3D Open-World Spatial BVH Raycasting, Simplex Biome Heightmaps, Cannon-es Rigid-Body Physics & Camera Interpolation (`src/game/openWorld3DEngine.ts`)**: Accelerated `O(log N)` pointer picking across voxel terrain, keeps, monsters, and NPCs via **`three-mesh-bvh`** (`MeshBVH`, `acceleratedRaycast`), deterministic multi-octave fBm 2D/3D/4D biome & subterranean cavern synthesis via **`simplex-noise`**, 3D siege artillery ballistic trajectories & Citadel keep collision resolution via **`cannon-es`** (`SAPBroadphase`), and smooth camera orbit interpolation via **`@tweenjs/tween.js`**.
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

### 4. 🧘 Four-Path Immortal Cultivation & Han Jue Progression ([`Four-Path Cultivation.md`](./Four-Path%20Cultivation.md))

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
- **Visualizing Power (3D Aura System, Hero Skins & MMORPG Avatars, Clones & Shadows)**:
  - Dynamic 3D scene-graph cues: Foundation White Glow, revolving Golden Core, floating Nascent Soul avatar, and Dao Creator halo rings, plus customizable Hero Skins & Particle Auras (`src/game/heroSkins.ts`).
  - **Open-World MMORPG Avatars, Clones & Shadows (`src/game/avatarCloneShadow.ts`, `HeroModal.tsx`)**: Full implementation of the 4-row **Key Differences Matrix (`Clone` vs. `Shadow` vs. `Avatar`)**, **3 Clone Subtypes** (_Tactical Illusion Decoys_ [`0%` DMG, `3.5x` aggro, cyan `#38bdf8` silhouette], _Primordial Spirit Combat Clones_ [`35%` PvE / `20%` PvP DMG, `40%` HP], and _Cosmetic Clone Avatars_ [`+12%` Cultivation Speed & `+8%` Troop ATK while adopting another outfit's look]), **3 Shadow Subtypes** (_Umbral Action Mimics & Teleport Markers_, _3.0s Chrono-Ruin Time Echoes_, and _Heart-Demon Dark Doppelgänger Bosses_ with smoky `#7c3aed` silhouettes), and **50-Player Raid Network Guardrails** (`<= 3` clones/avatar = `200` total tracked entities using `8-byte` relative `int16` delta packets inside the `20Hz` / `50ms` tick budget).

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

### 9. 🛡️ Clan Alliances, 9-Sector Territory Wars, Authoritative 20Hz 50v50 WebSocket Siege Server & Multi-Region Persistence (`server.ts`, `src/game/siegeNetProtocol.ts`)

- **Heraldic Alliances & 9-Sector Territory War Map (`A1`–`C3`)**: Create and customize heraldic SVG clan emblems, manage membership hierarchies, battle across the 9-sector (`A1`–`C3`) Territory War Map, strike the 600M HP Void Leviathan Co-op Boss, and compete on global multi-trillion power rankings.
- **Authoritative 20Hz (`50ms`) 50v50 WebSocket Siege Engine (`/ws/siege` & `src/game/siegeNetProtocol.ts`)**: Full-stack Express + RFC 6455 WebSocket upgrade server (`server.ts`) broadcasting 20Hz bitmasked delta-compressed state updates (`CohortDirtyBit` / `S2C_DELTA_SIEGE_UPDATE` `0x11`) and periodic full snapshots (`S2C_FULL_SIEGE_SNAPSHOT` `0x10`), handling real-time `C2S_TROOP_POSITION_CMD` (`0x01`) formation directives (`SHIELD_WALL`, `PHALANX_ADVANCE`, `WEDGE_CHARGE`, `LOOSE_SKIRMISH`) and `C2S_RALLY_ACTION_CMD` (`0x02`) `1T` (`1,000,000,000,000`) War Rallies with `int16` spatial quantization (`0.01m` precision), lossless `BigInt` wire serialization up to `1,000T`, 128-frame Client-Side Prediction (CSP) ring buffer reconciliation (`ClientPredictionRingBuffer`), and 32-bit FNV-1a state hashing (`computeSectorStateHash`).
- **Atomic Disk Persistence, Crash Recovery & Single-Instance Bounds (`src/game/serverPersistence.ts`, `/readyz`, `/api/ops/readiness`)**: Saves use write-temp → `fsyncSync` → `.bak` promotion → atomic POSIX rename inside a SHA-256 checksum envelope (`schemaVersion: 2`) with automatic failover recovery from `.bak` on truncated/corrupted primary files and `SIGTERM`/`SIGINT` graceful shutdown draining. Live capacity bounds (`<=250` WS peers, `<=5,000` cached commanders) apply to this single-instance architecture; horizontal multi-pod clustering requires an external DB and Redis pub/sub adapter.

### 10. ⚖️ Server-Enforced Administration, GM, Admin & Moderator RBAC Control (`creatergame31@gmail.com`)

- **Server-Side Cryptographic & Exploit Hardening (`server.ts`, `src/game/serverAuth.ts`, `src/game/serverHardening.ts`)**: Privileged RBAC actions (`GET /api/admin/state`, `POST /api/admin/moderation`, `POST /api/admin/tickets/resolve`, `POST /api/admin/decree`, `POST /api/admin/species-rebirth`) and online mutations (`/api/online/sync`, `/api/online/siege/cmd`, WebSocket `C2S_*`) fail closed (`401`/`403`) without an HMAC-SHA256 `HttpOnly` session cookie, guarded by sliding-window API write rate limits (`120/min`), 5-attempt admin login brute-force lockouts (`429` + `Retry-After`), Same-Origin CSRF checks, recursive `__proto__` payload filtering (`400`), WS frame/flood caps (`32 KiB` frame / `30 msg/s`), and slow-consumer backpressure disconnects.
- **Explicit Client Trust Boundary (`src/game/adminModeration.ts`, `AdminConsoleModal.tsx`)**: Client-side email switches, `localStorage` caches, and single-player canvas cheats are explicitly marked **`UNTRUSTED_CLIENT_PREVIEW`** and cannot escalate server permissions or spoof multiplayer state. Root account **`creatergame31@gmail.com`** retains immutable Clearance `Lv. 999` protection on the server, with all security events persisted to `securityAuditLog` and verified end-to-end against a live server via `npm run verify:ops` (`scripts/verify-readiness.ts`). See [`SECURITY.md`](./SECURITY.md) for deployment hardening requirements.

### 11. 🖥️ Software Architect & Hardware Architect Compatibility & Optimization (`15/11/2026` — `v1.5.0`)

- **Hardware Architect Matrix (`src/game/architectOptimization.ts`)**: Full CPU ISA vector & cache-line profiles for **`x86_64 AVX-512F/BW`** (512-bit, 64B cache line), **`ARMv9-A NEON + SVE2`** (heterogeneous core pinning), **`Apple Silicon M-Series`** (128B cache line + zero-copy Unified Memory Architecture), and **`RISC-V RV64GC + RVV 1.0`**, paired with GPU tiers (`Vulkan 1.3`, `DX12 Ultimate`, `Metal 3`, `WebGPU`, `WebGL 2.0`, `Software Rasterizer`) and Thermal TDP envelopes (`350W Desktop` down to `8W Mobile Passive`).
- **Software Architect Engine Optimization**: Interactive **Structure-of-Arrays (`SoA`) vs Array-of-Structures (`AoS`)** memory layout profiler (`4.75x` hot-loop speedup), zero-mutex **Lock-Free Work-Stealing Job Scheduler** across 2–64 logical cores, and a deterministic **Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`)**.

### 12. 🧬 10-Species / Race Character Creation & Admin-Authorized Rebirth (`src/game/species.ts`)

- **All 10 Playable Species across 3 Lineages**:
  - **Classic Fantasy**: `human` (_Terran Sovereign / 人族皇裔_), `sylvan_elf` (_Sylvan High Elf / 森罗灵族_), `ironforge_dwarf` (_Ironforge Runic Dwarf / 矮人神匠_), `warborn_orc` (_Warborn Goliath / 蛮荒巨灵_).
  - **Xianxia Immortal**: `azure_dragonkin` (_Azure Dragonkin / 太古龙族_), `celestial_kitsune` (_Celestial Nine-Tailed Kitsune / 九尾天狐_), `asura_demon` (_Asura Blood Fiend / 修罗魔族_), `empyrean_angelic` (_Empyrean Winged Celestial / 九天羽族_).
  - **Cosmic / Astral**: `void_walker` (_Void Walker / 虚空神族_), `crystalline_golem` (_Crystalline Ancient Automaton / 古神机关族_).
- **Full 3D Procedural Meshes & Innate Passives**: Real-time Three.js `SpeciesTraitGroup` attachments (pointed elven ears, fox spirit ears, braided dwarf runic beard, orc tusks, draconic/obsidian horns, feathered angelic/demonic wings, draconic/nine-tailed spirit tails, orbiting void crystals, and golem chest core reactors), body stature scaling (`bodyScale`), and innate combat/cultivation buffs.
- **Admin Permission Gate (`creatergame31@gmail.com`)**: Initial creation allows free selection of any species; switching species after creation (`speciesLocked: true`) requires authorization from Root Administrator **`creatergame31@gmail.com`** via live GM decree or `[SPECIES REBIRTH]` support ticket.

### 13. 🌌 6-Layer Cosmic Hierarchy, Cardinality (`COSMIC_LIMITS`), Interactive D3 Tree & Top 100 Fictional Species Background NPCs (`src/game/omniverse.ts`, `src/game/cosmologicalTreeD3.ts`)

#### A. The 6-Layer Cosmic Ontology, Cardinality & Cosmological Hierarchy (`SIX_LAYER_COSMIC_HIERARCHY` & `COSMIC_LIMITS`)

| Layer | Cosmological Tier                             | Cardinality (`COSMIC_LIMITS`) | Canonical Definition                                                                                                            | Contained Realities & Lazy Pagination Scope                                                                                                  | Scale Multiplier | Sovereign Authority                            |
| :---: | :-------------------------------------------- | :---------------------------: | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- | :--------------: | :--------------------------------------------- |
| **1** | **🪐 1. Universe**                            |       `Infinity` (`∞`)        | _A single reality with its own space, time, and matter, etc._                                                                   | Individual `3+1D` to `11D` spacetime continuum, galaxies, mortal continents & immortal planes (`InfiniteCollection<Universe>`)               |       `1x`       | Local Monarchs / `creatergame31@gmail.com`     |
| **2** | **🌀 2. Multiverse**                          |       `Infinity` (`∞`)        | _A collection of parallel/series universes._                                                                                    | `∞` quantum-branching parallel timelines, mirror realms, and sequential/cyclic universe series (`InfiniteCollection<Multiverse>`)            |      `10x`       | Timeline Nexus (`creatergame31@gmail.com`)     |
| **3** | **💠 3. Megaverse / Hyperverse**              |       `Infinity` (`∞`)        | _A cluster of multiple multiverses._                                                                                            | Higher-dimensional brane clusters (`12D–26D+` Hyperversal manifolds) binding multiple distinct Multiverses (`InfiniteCollection<Megaverse>`) |      `100x`      | Brane Lattice (`creatergame31@gmail.com`)      |
| **4** | **🌌 4. Omniverse**                           |       `Infinity` (`∞`)        | _Every universe, multiverse, and reality that has ever existed or could exist._                                                 | Complete aggregate of all Universes, Multiverses, Megaverses, and realities (`OMNI-001` through `OMNI-∞`, `InfiniteCollection<Omniverse>`)   |     `1,000x`     | 100 Species Envoys (`creatergame31@gmail.com`) |
| **5** | **🕳️ 5. The Overvoid / Exonverse**            |   `100` (Fixed Bounded Cap)   | _A collection of multiple distinct omniverses that operate under completely different laws of logic and cosmic hierarchy._      | Strictly bounded meta-container (`index: 1..100`, `OVERVOID-001`..`OVERVOID-100`) where each child Omniverse runs under alien logic          |    `10,000x`     | Meta-Director (`creatergame31@gmail.com`)      |
| **6** | **📜 6. The White Page / The House of Ideas** |    `1` (Strict Singleton)     | _Only one — everything comes from here, even nothingness (Oblivion). Sovereign Supreme Creator: **`creatergame31@gmail.com`**._ | Singleton pre-existential origin engine (`isSingleton: true`) spawning all `100` Overvoids and absolute nothingness (`Oblivion`)             |    `100,000x`    | **`creatergame31@gmail.com` (Supreme Author)** |

#### B. Top 100 Fictional Species as Super-Admin Background NPCs (`TOP_100_OMNIVERSE_SPECIES_NPCS`)

| Cosmic Tier | Rank Range | Tier Classification                                    | Canonical Species & Races (20 per Tier · 100 Total)                                                                                                                                                                                                                        | Base Tribute / hr |
| :---------: | :--------: | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------: |
| **Tier 1**  |   `1–20`   | _Omniversal, Cosmic & Reality-Warping Entities_        | Outer Gods, Beyonders, The Endless, Monitors, The Gentry, Celestialsapiens, Zeno's Race, Q Continuum, Downstreamers, Fifth-Dimensional Imps, Celestials, Angels, Chronovores, Naljians, Great Old Ones, Spiral Races, Eternals (Timeless), Watchers, Guardians, Chaos Gods |   `500,000+ 💎`   |
| **Tier 2**  |  `21–40`   | _Type IV+ Civilizations & Hyper-Advanced Sci-Fi Races_ | Xeelee, Photino Birds, Time Lords, Daleks, Culture Minds, Precursors, Forerunners, The Qu, Necrons, C'tan, Old Ones (Webway), The Vex, The Hive, The Ancients / Alterans, The Ori, Reapers, Protheans, Cybertronians, Coluans, Firstborn                                   |   `250,000+ 💎`   |
| **Tier 3**  |  `41–60`   | _Divine, Mythic & Metaphysical Pantheons_              | Gods / Deities, Old Gods (Urgrund), New Gods, Asgardians, Olympians, Ainur (Valar & Maiar), Fiendcelestials, Otsutsuki Clan, Soul Reapers / Shinigami, Dragons, Demons / Archfiends, Phoenix, Qilin / Kirin, Anodites, Glind, Titans, Daedra, Witchers, Vampires, True Fae |   `150,000+ 💎`   |
| **Tier 4**  |  `61–80`   | _Planet-Busting Warriors & Biological Powerhouses_     | Saiyans, Kryptonians, Viltrumites, Rognarrs, Martians, Frieza's Race / Frost Demons, Namekians, Majins, Atomix's Species, To'kustars, Chronosapiens, Eternals (Uni-Mind), Symbiotes / Klyntar, Daxamites, Czarnians, Tamaraneans, Strontians, Eleos, Gourmet Demons, Gems  |   `100,000+ 💎`   |
| **Tier 5**  |  `81–100`  | _Iconic Galactic Empires, Hives & Fantasy Archetypes_  | Humans (All Fiction), Mutants / Homo Superior, Inhumans, Aeldari / Eldar, Orks / Krorks, Tyranids, The Flood, Zerg, Protoss, Xenomorphs, Yautja / Predators, Kree, Skrulls, Shi'ar, The Borg, Species 8472 / Undine, Klingons, Vulcans, Elves, Dwarves                     |   `50,000+ 💎`    |

- **Sovereign Omniverse Per Race + Infinite Transfinite Continuum (`Ω-001` to `Ω-∞`)**: Every race owns its own Sovereign Overvoid (`OVERVOID-001`..`OVERVOID-100`) and Sovereign Omniverse (`OMNI-001`..`OMNI-100`) with full 6-Layer Cosmological Lineage (`resolveSpeciesSixLayerCosmology`), and `resolveInfiniteOmniverseByIndex` resolves any arbitrary omniverse coordinate from `1` to `∞`.
- **Background Characters (NPCs) & Layer-6 White Page Decrees Under `creatergame31@gmail.com`**: All 100 Level-1000 Background NPC Envoys are bound to `creatergame31@gmail.com`, who can project/recall them into the 3D Voxel Overworld, set their directives, and issue Layer-6 **White Page / House of Ideas Authorial Decrees** (`inscribe_creation`, `realign_overvoid_logic`, `invoke_oblivion_reset`, `channel_house_of_ideas_harvest`).

#### C. Strict 6-Tier Nested Cosmological Tree, Cardinality (`COSMIC_LIMITS`) & Infinite Lazy Pagination (`src/types/game.ts`, `src/game/omniverse.ts`, `src/components/CosmologicalAdminModal.tsx`)

Every entity in the realm is anchored inside a strict 6-tier parent-child tree where **Tier 6 (`WhitePageRoot`)** is the singleton root node (`getWhitePageSingletonRoot()`), **Tier 5 (`Overvoid`)** is strictly bounded to `100` instances (`index: 1..100`), and **Tiers 1–4 (`Universe`, `Multiverse`, `Megaverse`, `Omniverse`)** have `Infinity` cardinality represented via `InfiniteCollection<T>` with deterministic seeds and on-demand lazy pagination (`lazilyGenerateInfiniteTierSlice()`):

```typescript
export const COSMIC_LIMITS = {
  WHITE_PAGE_COUNT: 1,
  OVERVOID_MAX_COUNT: 100,
  OMNIVERSE_COUNT: Infinity,
  MEGAVERSE_COUNT: Infinity,
  MULTIVERSE_COUNT: Infinity,
  UNIVERSE_COUNT: Infinity,
} as const;

// Infinite tiers use procedural seeds and paginated/lazy streams to prevent memory overflow
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

- **Rule 1 — Singleton Enforcement (`Tier 6: WhitePageRoot`)**: `getWhitePageSingletonRoot()` enforces the Singleton pattern (`id: 'THE_WHITE_PAGE'`, `tier: 6`, `isSingleton: true`, `alias: 'The House of Ideas'`, `creatorEmail: 'creatergame31@gmail.com'`), spawning both all `100` `Overvoid` instances and `oblivionState: { exists: true, description: 'Absolute nothingness originating from The White Page' }`.
- **Rule 2 — Bounded Array Enforcement (`Tier 5: Overvoid` = `100`)**: `overvoids` maintains a hard validation cap of `100` distinct `Overvoid` instances (`index: 1..100`, `OVERVOID-001`..`OVERVOID-100`). `attemptCreateOvervoid()` and `setWhitePageSingletonRoot()` deterministically reject any creation or mutation request exceeding `COSMIC_LIMITS.OVERVOID_MAX_COUNT` (`100`).
- **Rule 3 — Infinite Tier Handling & Lazy Procedural Pagination (`Tiers 1–4` = `Infinity`)**: `Omniverse`, `Megaverse`, `Multiverse`, and `Universe` collections never run unbounded loops; instead they use `InfiniteCollection<T>` (`totalCount: Infinity`, deterministic `generatorSeed`, and `loadedNodes: T[]`) paired with `lazilyGenerateInfiniteTierSlice(root, tier, parentNodeId, count)` to procedurally synthesize and append child nodes on demand.
- **Rule 4 — Interactive D3 Cosmological Tree Visualizer (`CosmologicalAdminModal.tsx` & `cosmologicalTreeD3.ts`)**: Renders the live 6-tier hierarchy from `THE_WHITE_PAGE` (`Tier 6`) and `OBLIVION_NOTHINGNESS` down through `Overvoid` (`Tier 5`) → `Omniverse` (`Tier 4`) → `Megaverse` (`Tier 3`) → `Multiverse` (`Tier 2`) → leaf `Universe` (`Tier 1`) using `d3-hierarchy` (`d3.hierarchy` + `d3.tree`) and `d3-zoom` in both Horizontal (`Left → Right`) and Radial (`360° Cosmic Mandala`) layouts, complete with live Tier 5 logic / Tier 1 physics override sliders, 100-Overvoid cap testing, and on-demand lazy pagination buttons.

### 14. 📜 Imperial Lore, Auto-Populating Open-World Codex, 12 Dynastic Annals & `10^100`-Word Akashic Stream (`src/game/loreHistory.ts`, [`LORE.md`](./LORE.md))

- **7 Grand Historical Epochs (`LORE_HISTORICAL_EPOCHS`, 6–7 Sections Each)**:
  - **Epoch Ω-0 — Pre-Genesis: The White Page & The House of Ideas (`creatergame31@gmail.com`)**: Chronicles how everything — including Nothingness (`Oblivion`), the 3,000 Great Daos, and the Four Authorial Decrees — was inscribed upon the pre-existential White Page by `creatergame31@gmail.com`.
  - **Epoch Ω-I — The Overvoid Divergence & 100+∞ Sovereign Omniverses**: Chronicles the unfurling of Layer 5 (_The Overvoid / Exonverse_) and the creation of `OMNI-001` through `OMNI-100+∞` for the 100 Fictional Species.
  - **Epoch Ω-II — Hyperversal Brane Weaving & Multiversal Timeline Tree**: Chronicles the condensation of Megaverses/Hyperverses (`Layer 3`), Multiverses (`Layer 2`), and the Prime Sovereign Universe (`Layer 1`).
  - **Epoch III — Awakening of the 10 Playable Species & Admin Rebirth Seal**: Chronicles the rise of the 10 Sovereign Playable Bloodlines and the Admin Rebirth Governance Seal (`creatergame31@gmail.com`).
  - **Epoch IV — The Han Jue Four-Path Immortal Revelation & 100x Realm Suppression**: Chronicles Han Jue's Secluded Providence doctrine, the 4 Cultivation Paths, and `100x` Realm Suppression.
  - **Epoch V — The Ten Citadel Eras & Trillion-Scale Siege Wars**: Chronicles the 10 Citadel Eras, T1–T20 Legions, and `1T` World Boss Rallies.
  - **Epoch VI — The `15/11/2026` Software & Hardware Architect Convergence (`v1.5.0`)**: Chronicles the unification of the Three.js PBR renderer with the C++20 SIMD/SoA Architect Engine.
- **Auto-Populating Open-World Lore Codex (`OPEN_WORLD_BIOME_CODEX_CATALOG` & `OPEN_WORLD_MONSTER_CODEX_CATALOG`)**:
  - Automatically unlocks and persists entries (`localStorage` key `voxel_realms_lore_codex_state_v1`) as the player explores Solara's **8 Spatial Biomes** (`resolveBiomeAtWorldPosition`) or encounters/selects/spawns **Canonical & Dynamic Lv. 1–1000 Monsters** (`evaluateOpenWorldLoreDiscovery`, `buildDynamicMonsterCodexEntry`), awarding one-time Kingdom Diamond (`💎`) and Scripture Fragment discovery bounties (`claimLoreCodexReward`).
- **12 Imperial Dynastic Annals & Legendary Artifact Histories (`LORE_DYNASTIC_ANNALS`)**:
  - Twelve multi-paragraph primary historical treatises spanning Layer 6 _The White Page Quill_, the _Overvoid Logic Schism War_, the _First Solara Dragon-Vein Concordat_, the _Crystalline Golem Foundry Oath_, and the _Void Leviathan Abyssal Siege_.
- **`10^100` Words Minimum (One Googol Words) Akashic Lore & History Stream (`GOOGOL_LORE_ARCHIVE_SPEC`)**:
  - Deterministically synthesizes **`1,000+` real English words per volume** across `10^97` `BigInt`-addressable coordinates (`1n` to `GOOGOL_MAX_VOLUME_INDEX = 10n ** 97n`, `generateGoogolScaleLoreScrollSlice`) without blocking RAM — achieving `10^97 × >=1,000 >= 10^100` (One Googol Words Minimum).
- **6 Sacred Compendium Codices, Epoch Comprehension & Full-Text Search (`LoreHistoryModal.tsx`)**: Full-text searchable lore archive (`searchLoreHistory`) spanning Epochs, Annals, Codex Biomes/Monsters, and Compendium chapters, paired with interactive Epoch Comprehension (`comprehendLoreEpoch`).

### 15. 🛡️ 9-Pillar Cross-System Validation & Integrity Engine (`src/game/systemValidation.ts`)

- **Deterministic 9-Pillar Engine Audit (`runFullSystemValidationReport`)**: Continuously validates **97 cross-module invariants** across:
  1. **Root RBAC, 10-Article EULA v1.5.0, 10-Agreement Legal Stack Governance & Supreme Author Immutability (`creatergame31@gmail.com` · Clearance Lv. 999)**
  2. **6-Tier Nested Cosmological Tree (`WhitePageRoot` Singleton → `Universe` Leaf), Tier 5/Tier 1 Physics Overrides & 100+∞ Sovereign Omniverses**
  3. **Imperial Lore (7 Epochs), 12 Dynastic Annals, Auto-Populating Open-World Codex (8 Biomes & Monsters) & `10^100`-Word Akashic Stream**
  4. **10 Playable Species, 3D Procedural Anatomy & Admin Rebirth Permission Gate**
  5. **`15/11/2026` Software & Hardware Architect Engine (`x86_64 AVX-512`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`, `SoA` `4.75x` speedup)**
  6. **Castle Lv. 0–100 (`1,000T` Cap), `1T` World Boss Rally & T1–T20 Tri-Branch Counter Matrix (`1.5x`)**
  7. **Four-Path Cultivation (`23` Realms × `9` Layers) & `100.0x` Realm Suppression**
  8. **Autonomous World AI (Lv. 1–1000), A\* Keep Avoidance, Dynamic Weather & VIP Covenant**
  9. **Engineering Transparency (`6 Implemented / 2 Simulated / 0 Planned`), Authoritative 20Hz 50v50 Siege Netcode (`src/game/siegeNetProtocol.ts`), Authoritative Anti-Cheat (`src/game/antiCheat.ts`), 3D Open-World BVH/Simplex/Cannon Engine (`src/game/openWorld3DEngine.ts`) & Live WebGL2 Pipeline Mutations**
- **Live In-App Validation Diagnostics**: Viewable in real time inside the **C++20 / Software & Hardware Architect Studio (`CppArchitectureModal.tsx`)** alongside C++20 `static_assert` compile-time checks (`cpp/VoxelRealmsGuardrails.hpp`).

### 16. ☁️ Cloud SQL PostgreSQL, Firebase Auth, Hardened Firestore & Gmail Dispatch Center

- **Cloud SQL (PostgreSQL + Drizzle ORM, `src/db/` & `/api/db/*`)**: Uses `pg.Pool` configured via `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, and `SQL_DB_NAME` (`drizzle-orm/node-postgres`) backing `users`, `commander_profiles`, `realm_saves`, and `support_tickets` (`drizzle.config.ts`). All `/api/db/*` endpoints (`GET/PUT /api/db/profile`, `GET/PUT /api/db/save`, `GET/POST /api/db/tickets`) fail closed (`HTTP 401`) without a verified Firebase ID token checked by `requireAuth` (`src/middleware/auth.ts` + `src/lib/firebase-admin.ts`).
- **Firebase Auth, Dual-Tier Google OAuth & Hardened Cloud Firestore (`src/lib/firebase.ts`, `src/lib/firestore.ts`, `firestore.rules`, `firebase-blueprint.json`, `security_spec.md`)**:
  - **Default Sovereign Identity (`creatergame31@gmail.com`) & Dual-Tier OAuth (`basicGoogleAuthProvider` vs `googleAuthProvider`)**: The client session (`App.tsx`) and Sovereign Admin Console (`AdminConsoleModal.tsx`) default to `creatergame31@gmail.com` (`PRIMARY_ADMIN_EMAIL`) with a one-click `Bind creatergame31@gmail.com` toggle. Standard Commander & Admin Console Google Sign-In uses non-restricted `BASIC_IDENTITY_SCOPES` (`openid`, `email`, `profile`) so login never triggers Google's restricted-scope warning screen, while real-time `onSnapshot` realm save synchronization pairs with split public/private user collections (`/users/{userId}/public/profile` non-PII vs. `/users/{userId}/private/account` PII-isolated).
  - Zero-trust default-deny `firestore.rules` audited via `@firebase/eslint-plugin-security-rules` (`npm run lint:rules`) and adversarial "Dirty Dozen" rule tests (`firestore.rules.test.ts`).
- **Google Workspace Gmail Dispatch Center (`src/lib/gmail.ts`, `src/components/GmailModal.tsx`)**:
  - Dedicated Gmail OAuth token exchange (`signInWithGoogle({ includeGmailScopes: true })`) via Firebase `GoogleAuthProvider` (`GMAIL_SCOPES`), storing the Google Workspace `accessToken` strictly in React memory (`AuthContext.tsx`, cleared on sign-out or expiry), complete with an in-modal **Google Cloud Testing Mode OAuth Consent Guide (`dev-ivy-6v0ns` / `creatergame31@gmail.com`)**.
  - Supports mailbox browsing (`INBOX`, `SENT`, `DRAFT`, `STARRED`, `TRASH`, custom labels), search queries, alliance dispatch templates, draft saving, label creation, mark-read/unread, and trashing—with a **mandatory explicit user confirmation dialog** before any mutating or destructive Gmail API call executes.

### 17. 📜 End User License Agreement (`EULA.md`) & 10-Document Legal Compliance Stack (`LEGAL.md`, `src/game/eula.ts`, `EulaModal.tsx`)

- **Complete 10-Agreement Software, Cloud & Enterprise Legal Stack ([`LEGAL.md`](./LEGAL.md))**: Because **Voxel Realms RPG** is simultaneously a 3D video game, a cloud-synchronized SaaS multiplayer platform, and an authenticated data & subscription processor under **`creatergame31@gmail.com`**, it implements all 10 agreements across 3 categories:
  1. **Core User & Website Agreements (`core_user_website`)**: **Terms of Service (`TERMS.md`)**, **Privacy Policy (`PRIVACY.md` — GDPR, CCPA/CPRA & India's DPDP Act 2023)**, and **Cookie & LocalStorage Policy (`LEGAL.md §3`)**.
  2. **Software & Licensing Variations (`software_licensing`)**: **End User License Agreement (`EULA.md`)**, **Software as a Service (`SaaS`) Cloud Subscription Agreement (`LEGAL.md §4`)**, **Open-Source Software (`OSS`) License (`LICENSE.md` / `Apache-2.0`)**, and **Acceptable Use Policy (`AUP`, `LEGAL.md §5`)**.
  3. **Enterprise & Service Commitments (`enterprise_service`)**: **Service Level Agreement (`SLA`, `LEGAL.md §6` — `>=99.5%` uptime & `20Hz` tick budget)**, **Data Processing Agreement (`DPA`, `LEGAL.md §7` — Cloud SQL & Firestore sub-processors)**, and **Master Services Agreement & SOW Framework (`MSA`, `LEGAL.md §8`)**.
- **Quick Comparison Matrix (`LEGAL_QUICK_COMPARISON_MATRIX` in `src/game/eula.ts` & [`LEGAL.md`](./LEGAL.md))**:

| Agreement Type                      | Primary Focus                                       | Typical Context                             | Voxel Realms RPG Implementation (`v1.5.0 · 15/11/2026`)                                                                                        |
| :---------------------------------- | :-------------------------------------------------- | :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **EULA**                            | Software installation and usage rights              | Desktop apps, mobile apps, video games      | [`EULA.md`](./EULA.md) & `EulaModal.tsx` (10 articles, FNV-1a receipt `EULA-ACK-...`, anti-cheat consent)                                      |
| **Terms of Service (ToS)**          | General rules for platform access and conduct       | Websites, social networks, e-commerce       | [`TERMS.md`](./TERMS.md) (13+ age gate, clan/chat rules, virtual goods, binding arbitration)                                                   |
| **SaaS Agreement**                  | Cloud software access and subscription terms        | Web-based business tools, cloud apps        | [`LEGAL.md §4`](./LEGAL.md) (Cloud SQL/Firestore sync, Monthly 30d & Annual 365d VIP Sovereign Pass)                                           |
| **SLA**                             | Uptime guarantees and support benchmarks            | Enterprise software, cloud hosting          | [`LEGAL.md §6`](./LEGAL.md) (`>=99.5%` monthly uptime, `20Hz` [`50ms`] siege tick budget, `<24h`–`<72h` ticket SLA)                            |
| **Privacy Policy**                  | Personal data collection and handling               | Any app or website collecting user data     | [`PRIVACY.md`](./PRIVACY.md) (**GDPR**, **CCPA/CPRA**, **India DPDP Act 2023**, Google OAuth Least-Privilege)                                  |
| **Cookie Policy**                   | Tracking technologies & browser storage disclosure  | Websites, web apps, SPAs                    | [`LEGAL.md §3`](./LEGAL.md) (Zero 3P ad trackers; strictly necessary `HttpOnly` HMAC cookie & `localStorage` save keys)                        |
| **OSS License**                     | Source code viewing, modification, and distribution | Open-source repositories & libraries        | [`LICENSE.md`](./LICENSE.md) & [`NOTICE`](./NOTICE) (**Apache License 2.0** for source code; live brand/DB under EULA)                         |
| **Acceptable Use Policy (AUP)**     | Strictly prohibited network & system actions        | Cloud platforms, multiplayer networks       | [`LEGAL.md §5`](./LEGAL.md) (Anti-DDoS, `<=30 msg/s` WS cap, `AntiCheatGuard` speed/teleport/replay enforcement)                               |
| **Data Processing Agreement (DPA)** | Controller–Processor data security binding          | Cloud infrastructure & B2B sub-processors   | [`LEGAL.md §7`](./LEGAL.md) (Controller `creatergame31@gmail.com`; Sub-processors: Cloud SQL `ai-studio-416287a7` & Firestore `dev-ivy-6v0ns`) |
| **Master Services Agreement (MSA)** | Overarching B2B commercial & SOW relationship       | Enterprise licensing & custom realm hosting | [`LEGAL.md §8`](./LEGAL.md) (Dedicated 50v50 tournament shards, custom guild realms & modular SOWs)                                            |

- **Deterministic FNV-1a Receipt & In-App EULA + Legal Stack Modal**: `src/game/eula.ts` exports `EULA_ARTICLES`, `LEGAL_DOCUMENT_STACK`, `LEGAL_QUICK_COMPARISON_MATRIX`, and deterministic 32-bit FNV-1a acceptance receipts (`EULA-ACK-...`), while `src/components/EulaModal.tsx` provides two interactive tabs (**`EULA Articles (10)`** and **`Complete 10-Agreement Legal Stack`**) accessible from both the Title Screen (`data-testid="title-eula-btn"`) and the Game HUD (`data-testid="hud-eula-btn"`).

---

## 🔍 Engineering Transparency Matrix: Implemented vs. Simulated vs. Planned Scope

To ensure complete engineering clarity and prevent over-claiming what runs inside a browser WebGL2 sandbox versus what is modeled for cross-platform/native builds, **Voxel Realms RPG** maintains a first-class, unit-tested **Engineering Transparency Matrix** (`ENGINEERING_TRANSPARENCY_MATRIX` in `src/game/graphicsEngine.ts`, viewable in-app inside `CppArchitectureModal.tsx`):

| Domain                                                                                                                                    |                       Classification                       | What Runs Live in Browser Now (Implemented)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | What Is Analytically / Metadata Modeled (Simulated)                                                                                                                                                                                                                                                                              | Planned Native / Cloud Target (Planned)                                                                                                             |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Procedural PBR Textures & Materials** (`src/game/proceduralWorld.ts`)                                                                |              **🟢 IMPLEMENTED (Live WebGL2)**              | Dynamically generates & resizes HTML5 `CanvasTexture` maps (`256×256`, `512×512`, `1024×1024`) for grass, stone masonry, wood bark, armor, water, and AO lightmaps; mutates `anisotropy` (`4x`/`8x`/`16x`), `minFilter`, `normalScale`, `bumpScale`, and `clearcoat` on Three.js `MeshPhysicalMaterial`s.                                                                                                                                                                                                                                                                                            | GPU hardware block compression formats (`BC7 8bpp` vs `ASTC 6×6`) and `4096px` offline Master Source asset import overrides are modeled as cross-platform build metadata because browser `CanvasTexture` uploads RGBA8 buffers to WebGL2.                                                                                        | Basis Universal (`.ktx2`) supercompressed texture streaming transcoded to native `BC7` (Desktop) or `ASTC` (Mobile) GPU memory.                     |
| **2. Geometry, 4-Tier `THREE.LOD` & `InstancedMesh` Foliage** (`src/game/proceduralWorld.ts`)                                             |              **🟢 IMPLEMENTED (Live WebGL2)**              | Builds real 4-level `THREE.LOD` hierarchies (`Icosahedron` detail `2 → 1 → 0` → `Octahedron` proxy), chamfered `ExtrudeGeometry` terrain tiles, and `LatheGeometry` torsos; dynamically mutates `THREE.LOD` distance tables, visibility, and `InstancedMesh.count` (`800 → 520 → 320` grass tufts) on preset/platform switch.                                                                                                                                                                                                                                                                        | The `75k–245k` scene polygon budget figures and MB of RAM saved on Mobile (`-68 MB` / `-92.4 MB`) are deterministic analytical estimates derived from the active preset and LOD bias.                                                                                                                                            | GPU-driven meshlet / cluster culling via WebGPU compute shaders and `glTF meshopt` decompression.                                                   |
| **3. Atmospheric Sky, Dynamic Shadows & AO Lightmaps** (`src/components/GameCanvas.tsx`)                                                  |              **🟢 IMPLEMENTED (Live WebGL2)**              | Runs Three.js Preetham `Sky` shader (Rayleigh/Mie scattering across 24h cycle & 4 weather states), `DirectionalLight` `PCFSoftShadowMap` (resized between `2048×2048` and `1024×1024` or disabled on Mobile), `HemisphereLight`, `FogExp2`, canvas AO lightmap intensity, and per-mesh small-prop `castShadow` culling.                                                                                                                                                                                                                                                                              | The `realtime_gi_hybrid` mode uses a Three.js `PMREMGenerator` `RoomEnvironment` probe + `HemisphereLight` + directional rim light + canvas AO map rather than hardware ray-traced global illumination (RTGI).                                                                                                                   | Voxel cone tracing / screen-space global illumination (SSGI) and cascaded shadow maps (CSM) in WebGPU.                                              |
| **4. Custom GLSL Shaders & HDR Post-Processing** (`src/game/proceduralWorld.ts`, `GameCanvas.tsx`)                                        |              **🟢 IMPLEMENTED (Live WebGL2)**              | Injects custom GLSL vertex/fragment code via `Material.onBeforeCompile` (wind foliage sway, Fresnel rim light, wrap subsurface approximation, Gerstner water waves); runs `EffectComposer` (`RenderPass → UnrealBloomPass → NextGenColorGradeShader → OutputPass`) and toggles shader uniforms (`uUseRimLight`, `uUseDetailNormals`, `uUseParallax`, `uUseSubsurface`) live.                                                                                                                                                                                                                         | Platform shader macro defines (`USE_RIM_LIGHT`, `USE_PARALLAX_OCCLUSION`) are evaluated via uniform branches (`uUseRimLight > 0.5`) in WebGL2 GLSL rather than offline HLSL/SPIR-V preprocessor variant stripping.                                                                                                               | WGSL pipeline-overridable constants (`override`) in WebGPU for zero-branch hardware shader specialization.                                          |
| **5. Cross-Platform Bundle & Install Size Manifest** (`src/game/graphicsEngine.ts`)                                                       |          **🟡 SIMULATED (Build Metadata Model)**           | Interactive cross-platform configuration selector in the Architect Studio & HUD that couples platform selection (`PC/Console` vs `Mobile` + `Optional HD Pack`) to live WebGL2 `THREE.LOD` bias, shadow culling, canvas texture resolution (`256px`–`1024px`), and shader uniform switches.                                                                                                                                                                                                                                                                                                          | The `68.4 GB` PC/Console install size, `640 MB` Mobile base build size, and `3.85 GB` `HighDefinition_4K_LOD0_Pack` download toggle are simulated deployment manifests for architectural planning; no multi-gigabyte binary pack is downloaded over the network.                                                                 | Cloud CDN chunked asset streaming with Service Worker cache quotas and native iOS/Android On-Demand Resources (ODR).                                |
| **6. C++20 SIMD ISA, SoA Memory & Lock-Free Job DAG** (`src/game/architectOptimization.ts`, `cpp/`)                                       |     **🟡 SIMULATED (Analytical Model + C++20 Header)**     | Executes deterministic TypeScript hardware/memory analytical models (`x86_64 AVX-512`, `ARMv9 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`, `SoA` `4.75x` speedup over `AoS`, Chase-Lev work-stealing frame budgets) and provides a standalone C++20 header & CTest suite in `cpp/VoxelRealmsGuardrails.hpp` and `cpp/engine_guardrail_test.cpp`.                                                                                                                                                                                                                                               | The browser runtime executes the game loop in TypeScript/JavaScript on the main thread; the C++20 files in `cpp/` are reference native guardrails verified by C++20 `static_assert` / CTest and are not compiled into a live WebAssembly module in the Vite dev server.                                                          | Compile `cpp/VoxelRealmsGuardrails.hpp` via Emscripten (`-msimd128 -pthread`) into a WebAssembly SIMD128 worker pool backed by `SharedArrayBuffer`. |
| **7. Trillion-Scale Warfare, 23 Realms, 6-Layer Cosmology & 100 Omniverses** (`src/game/math.ts`, `omniverse.ts`)                         |    **🟢 IMPLEMENTED (`BigInt` Engine + 3D Projection)**    | All castle capacities (up to `1,000T`), T1–T20 Tri-Branch battles, 23 cultivation realms (`100.0x` suppression), A\* keep pathfinding, 10 playable species 3D meshes, 7 Lore Epochs, and 6-Layer Cosmology / 100 Omniverse NPCs under `creatergame31@gmail.com` are fully implemented in TypeScript using exact 64-bit `BigInt` math and projected as 3D entities in the overworld.                                                                                                                                                                                                                  | Trillion-unit troop clashes and 100-Omniverse tributes are resolved analytically via deterministic `BigInt` combat/economy equations while rendering representative 3D hero/envoy/monster meshes in the viewport to maintain 60 FPS.                                                                                             | GPU instanced crowd impostor rendering for visualizing `100,000+` simultaneous march units during siege replays.                                    |
| **8. Authoritative 20Hz 50v50 WebSocket Siege, Server RBAC, Cloud SQL & Firestore Sync** (`server.ts`, `src/db/`, `src/lib/firestore.ts`) | **🟢 IMPLEMENTED (Live 20Hz WS + Server RBAC + Cloud DB)** | Runs a full-stack Express + RFC 6455 WebSocket server (`/ws/siege` on port 3000) enforcing HMAC-SHA256 `HttpOnly` session cookies (`/api/auth/*`), fail-closed `401`/`403` RBAC (`/api/admin/*`), Firebase ID token verification on `/api/db/*` (Cloud SQL PostgreSQL + Drizzle ORM), hardened `firestore.rules` cloud sync, Gmail Dispatch Center (`GmailModal.tsx`), anti-tamper sync clamping (`/api/online/sync`), 20Hz (`50ms`) bitmasked delta-compression (`CohortDirtyBit`), FNV-1a hashing, 128-frame CSP ring buffer, and atomic `.bak` disk persistence (`data/online_realm_state.json`). | Single-player canvas/`localStorage` state remains an untrusted client preview; the 3 regional cluster nodes (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`) replicate 20Hz sector ticks within the Node.js process while user profiles, saves, and tickets persist to Cloud SQL PostgreSQL & Firestore. | Geo-distributed Kubernetes Agones dedicated game server fleet with Redis pub/sub shard Fan-out across Cloud Run pods.                               |

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
cp .env.example .env   # Optional: configure VOXEL_SESSION_SECRET, VOXEL_ADMIN_PASSKEY, SQL_*
```

### Development Server

Run the full-stack Express + WebSocket + Vite development server on port `3000`:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3000/?autostart=1](http://localhost:3000/?autostart=1) to skip the title overlay directly into the 3D realm).

### Running Unit, Security & Integration Tests

Execute all **162 automated tests across 27 suites** (`25` engine/security/netcode/anti-cheat/3D-physics/EULA-legal suites in `src/game/*.test.ts`, `src/lib/gmail.test.ts`, and `firestore.rules.test.ts`):

```bash
npm test
npm run test:rules    # Run Firestore security rule & Dirty Dozen adversarial tests standalone
```

### Unified Validation, Type Checking, Rules Linting, Formatting & Production Build

```bash
npm run validate      # Run full 5-stage gate (lint + lint:rules + format:check + test + build)
npm run verify:ops    # Run live production server load, exploit, crash-recovery & SIGTERM harness
npm run lint          # Validate strict TypeScript (tsc --noEmit)
npm run lint:rules    # Validate firestore.rules via @firebase/eslint-plugin-security-rules
npm run format:check  # Check code formatting with Prettier
npm run build         # Build code-split production bundle into dist/
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
│       ├── build.yml                  # GitHub Actions CI (Web/TS + Rules ESLint + Live Ops + C++20)
│       └── release.yml                # Tag-triggered v*.*.* checksummed GitHub Release pipeline
├── cpp/
│   ├── VoxelRealmsGuardrails.hpp      # C++20 RAII smart-pointer & concept guardrail header
│   └── engine_guardrail_test.cpp      # C++20 CTest static_assert & RAII verification unit test
├── scripts/
│   └── verify-readiness.ts            # Live production server load, exploit, crash-recovery & SIGTERM suite
├── src/
│   ├── components/                    # React 19 UI Modals (lazy-loaded) & HUD Overlays
│   │   ├── AdminConsoleModal.tsx      # GM cheats, T20 spawner, RBAC, Species & Omniverse hub
│   │   ├── CastleModal.tsx            # Citadel Lv 0-100 upgrade & 10-Era progression UI
│   │   ├── CharacterCreationModal.tsx # 10-Species selector, 3D turntable & Admin permission gate
│   │   ├── ClanEmblemView.tsx         # Heraldic SVG clan banner & insignia renderer
│   │   ├── ClanModal.tsx              # Clan vault, roster, chat, buffs & co-op boss
│   │   ├── ClanTerritoryMap.tsx       # Interactive 9-sector (A1-C3) clan war map
│   │   ├── CosmologicalAdminModal.tsx # D3-based interactive 6-tier cosmological tree visualizer
│   │   ├── CppArchitectureModal.tsx   # C++20 engine blueprint, Guardrails & SIMD viewer
│   │   ├── CultivationModal.tsx       # 4-path cultivation, manuals, pills & tribulations
│   │   ├── DailyLoginModal.tsx        # 7-day login decrees & Veteran Scroll sanctum
│   │   ├── EulaModal.tsx              # Interactive End User License Agreement (EULA v1.5.0) & receipt viewer
│   │   ├── GameCanvas.tsx             # Three.js 3D viewport, voxel renderer & raycaster
│   │   ├── GameHUD.tsx                # Consolidated top bar, D-pad & 5-tab command dock
│   │   ├── GmailModal.tsx             # Gmail Dispatch Center (inbox, labels, compose & confirm gates)
│   │   ├── GoogleSignInButton.tsx     # Official Google Identity Material Sign-In button
│   │   ├── HeroModal.tsx              # Hero ascension, tavern summons & aesthetic skins
│   │   ├── LeaderboardModal.tsx       # Global lord & clan power rankings
│   │   ├── LoreHistoryModal.tsx       # 7 Epochs, 12 Dynastic Annals, Auto-Populating Codex & 10^100 Akashic Stream
│   │   ├── ResourceGatherModal.tsx    # Lv 1-10 resource node extraction & march queues
│   │   ├── TitleScreen.tsx            # Game startup overlay & quick access triggers
│   │   ├── TroopBarracksModal.tsx     # T1-T20 troop recruitment & live training queue
│   │   ├── VipSubscriptionModal.tsx   # VIP Tiers 0-3, daily stipends & loyalty perks
│   │   ├── WeatherModal.tsx           # Atmospheric observatory & weather ritual controls
│   │   ├── WorldAIDirectorModal.tsx   # Lv 1-1000 monster AI, NPC roles & 100-Omniverse Matrix
│   │   └── WorldBossRallyModal.tsx    # 1T troop world boss rally coordination
│   ├── contexts/
│   │   └── AuthContext.tsx            # Firebase Auth + in-memory Google Workspace OAuth token state
│   ├── db/                            # Cloud SQL PostgreSQL + Drizzle ORM Persistence Layer
│   │   ├── drizzle.config.ts          # Drizzle Kit schema & migration config
│   │   ├── index.ts                   # Lazy singleton pg.Pool (SQL_* env) & Drizzle client
│   │   ├── schema.ts                  # PostgreSQL tables (users, commander_profiles, realm_saves, support_tickets)
│   │   └── users.ts                   # Server-side parameterized queries & bounds sanitization
│   ├── game/                          # Pure Decoupled Game Engine & 25 Unit Test Suites
│   │   ├── adminModeration.ts         # Root RBAC (creatergame31@gmail.com), moderation & tickets
│   │   ├── adminModeration.test.ts    # Admin, GM, Moderator & contact unit tests
│   │   ├── antiCheat.ts               # Authoritative multiplayer anti-cheat & movement/economy/siege auditor
│   │   ├── antiCheat.test.ts          # Speed-hack, teleport, economy inflation, sequence replay & quarantine tests
│   │   ├── architectOptimization.ts   # 15/11/2026 Software & Hardware Architect optimization engine
│   │   ├── architectOptimization.test.ts # CPU ISA, GPU, TDP, SoA memory & Lock-Free Job unit tests
│   │   ├── audio.ts                   # Procedural Web Audio API sound FX synthesizer
│   │   ├── clanMath.ts                # Clan buffs, vault rations & outpost assault math
│   │   ├── clanMath.test.ts           # Clan math unit tests
│   │   ├── cosmologicalTreeD3.ts      # Pure D3 hierarchy layout & radial/horizontal projection engine
│   │   ├── cosmologicalTreeD3.test.ts # D3 6-tier cosmological tree layout unit tests
│   │   ├── cppEngine.ts               # C++20 SIMD engine blueprint & Guardrail generators
│   │   ├── cultivationMath.ts         # 4 paths, 100x suppression, karma & disciple logic
│   │   ├── cultivationMath.test.ts    # Cultivation math unit tests
│   │   ├── dailyLogin.ts              # Daily login streak & Veteran Scroll scaling logic
│   │   ├── dailyLogin.test.ts         # Daily login system unit tests
│   │   ├── eula.ts                    # End User License Agreement (EULA v1.5.0), FNV-1a receipts & compliance
│   │   ├── eula.test.ts               # EULA 10 articles, FNV-1a receipt hashing & compliance unit tests
│   │   ├── graphicsEngine.ts          # PC/Console BC7 vs Mobile ASTC LOD pipeline logic
│   │   ├── graphicsEngine.test.ts     # Graphics pipeline unit tests
│   │   ├── heroSkins.ts               # Hero aesthetic skins & particle aura catalog
│   │   ├── heroSkins.test.ts          # Hero skins unit tests
│   │   ├── initialData.ts             # Deterministic seed data for heroes, clans, AI & nodes
│   │   ├── loreHistory.ts             # 7 Epochs, 12 Annals, Auto-Populating Codex & 10^100 Akashic Archive
│   │   ├── loreHistory.test.ts        # Lore Codex, Dynastic Annals & 10^100 Akashic unit tests
│   │   ├── math.ts                    # Castle eras, 1000T cap & T1-T20 troop combat math
│   │   ├── math.test.ts               # Castle & combat math unit tests
│   │   ├── omniverse.ts               # 6-Layer Cosmology, White Page, 100 Species NPCs & Infinite Omniverse
│   │   ├── omniverse.test.ts          # 6-Layer Cosmology, White Page & 100-Species Omniverse unit tests
│   │   ├── openWorld3DEngine.ts       # Three.js BVH raycasting, Simplex noise biomes, Cannon-es physics & Tween camera
│   │   ├── openWorld3DEngine.test.ts  # 3D BVH, Simplex fBm terrain, Cannon-es artillery/collision & Tween unit tests
│   │   ├── proceduralWorld.ts         # Voxel PBR terrain, castle, NPC, monster, species & aura meshes
│   │   ├── proceduralWorld.test.ts    # 3D scene-graph, aura & engine telemetry regression tests
│   │   ├── serverAuth.ts              # Server-only HMAC-SHA256 session auth, fail-closed RBAC & anti-tamper engine
│   │   ├── serverAuth.test.ts         # HMAC token signing, 401/403 RBAC & sync sanitization unit tests
│   │   ├── serverHardening.ts         # Rate limiters, brute-force lockout, CSRF, __proto__ & WS frame limits
│   │   ├── serverHardening.test.ts    # Exploit defense & bounded WS decoding unit tests
│   │   ├── serverPersistence.ts       # Atomic fsync+rename + SHA-256 envelope + .bak failover saves
│   │   ├── serverPersistence.test.ts  # Atomic save corruption recovery & migration unit tests
│   │   ├── siegeNetProtocol.ts        # Authoritative 20Hz 50v50 WebSocket Siege, Delta, CSP & Multi-Region Engine
│   │   ├── siegeNetProtocol.test.ts   # 20Hz Siege Protocol, BigInt wire, 128-frame CSP & Quorum unit tests
│   │   ├── species.ts                 # 10-Species catalog, 3D mesh specs & Admin switch permission gate
│   │   ├── species.test.ts            # 10-Species catalog, 3D stature bounds & Admin permission unit tests
│   │   ├── systemValidation.ts        # 9-Pillar Cross-System Validation & Integrity Audit Engine (97 invariants)
│   │   ├── systemValidation.test.ts   # Cross-System Validation & Integrity unit tests
│   │   ├── troopTraining.ts           # Real-time troop training timer & speedup math
│   │   ├── troopTraining.test.ts      # Troop training queue unit tests
│   │   ├── vipSubscription.ts         # VIP membership tiers, discounts & feature access gates
│   │   ├── vipSubscription.test.ts    # VIP subscription unit tests
│   │   ├── weather.ts                 # Weather cycle & gathering/combat multipliers
│   │   ├── weather.test.ts            # Weather system unit tests
│   │   ├── worldAI.ts                 # A* pathfinding, Lv 1-1000 monsters & NPC state machines
│   │   └── worldAI.test.ts            # World AI & pathfinding unit tests
│   ├── lib/                           # Firebase, Firestore, Admin SDK & Gmail Workspace Clients
│   │   ├── firebase-admin.ts          # Firebase Admin ID token verifier for Express /api/db/*
│   │   ├── firebase.ts                # Firebase App, Auth (Google + Gmail scopes) & Firestore init
│   │   ├── firestore.ts               # Sanitized account/save sync & onSnapshot real-time listeners
│   │   ├── gmail.ts                   # Gmail REST v1 client + MIME/UTF-8 base64url helpers
│   │   └── gmail.test.ts              # Gmail MIME encoding, header injection & HTML parsing unit tests
│   ├── middleware/
│   │   └── auth.ts                    # Express requireAuth Bearer Firebase ID token middleware
│   ├── types/                         # TypeScript definitions & domain models
│   ├── App.tsx                        # Root application state container & Suspense modal router
│   ├── index.css                      # Tailwind CSS v4 styling
│   └── main.tsx                       # Application entry point wrapped in AuthProvider
├── .clang-format                      # C++20 LLVM code formatter rules (IndentWidth: 4, ColumnLimit: 100)
├── .clang-tidy                        # C++20 static analyzer rules (enforces smart pointers)
├── .env.example                       # Environment variable template (safe placeholders)
├── .gitignore                         # Git ignore rules (node_modules, dist, build, data, .env, keystores)
├── .prettierignore                    # Excluded paths for Prettier formatting checks
├── .prettierrc                        # Prettier code style configuration
├── ARCHITECTURE.md                    # System architecture & Functional Core / Imperative Shell guide
├── CHANGELOG.md                       # Chronological release history & v1.5.0 network spec
├── CMakeLists.txt                     # C++20 strict compiler flags & CTest configuration
├── CODE_OF_CONDUCT.md                 # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md                    # Developer setup, Guardrails, testing & PR guidelines
├── eslint.config.js                   # ESLint flat config enforcing @firebase/eslint-plugin-security-rules
├── EULA.md                            # End User License Agreement (EULA v1.5.0 · 15/11/2026)
├── firebase-applet-config.json        # Provisioned Firebase project & Firestore database identifiers
├── firebase-blueprint.json            # Canonical Firestore entity & collection JSON schemas
├── firestore.rules                    # Zero-trust default-deny Cloud Firestore security rules
├── firestore.rules.test.ts            # Firestore schema & Dirty Dozen #1–#12 adversarial security tests
├── Four-Path Cultivation.md           # Four-Path Cultivation guide, Getting Started & .env.example setup
├── GOVERNANCE.md                      # Project governance, RBAC hierarchy & RFC process
├── index.html                         # HTML entry point & Google Fonts configuration
├── LEGAL.md                           # Complete 10-Agreement Legal Stack (ToS, Privacy/DPDP, Cookie, EULA, SaaS, OSS, AUP, SLA, DPA, MSA)
├── LICENSE                            # Apache License 2.0 (raw text)
├── LICENSE.md                         # Apache License 2.0 (formatted legal summary & full terms)
├── LORE.md                            # Imperial Lore, Auto-Populating Codex, 12 Annals & 10^100 Akashic Archive
├── metadata.json                      # Applet configuration & capabilities
├── NOTICE                             # Apache 2.0 Section 4(d) mandatory attribution notice
├── package.json                       # Project dependencies, metadata & npm scripts
├── PRIVACY.md                         # User Privacy Policy (GDPR/CCPA/India DPDP Act 2023, localStorage, payments)
├── README.md                          # Project overview & documentation hub (this file)
├── ROADMAP.md                         # Long-term product vision & v1.5.0–v2.0.0 milestones
├── SECURITY.md                        # Server-side enforcement, Firebase/Cloud SQL trust boundaries & disclosure
├── security_spec.md                   # Firestore data invariants & Dirty Dozen threat matrix
├── server.ts                          # Full-stack Express + RFC 6455 WS (/ws/siege) + /api/db/* server
├── SUPPORT.md                         # Official support channels (creatergame31@gmail.com) & FAQ
├── TERMS.md                           # Terms and Conditions of use
├── tsconfig.json                      # Strict TypeScript configuration (noUnusedLocals/Parameters)
├── vcpkg.json                         # Declarative C++20 package manager manifest & baseline lock
└── vite.config.ts                     # Vite 8 build & Rolldown vendor chunk-splitting configuration
```

---

## 🧪 Testing Coverage & Anti-Spaghetti Guardrails

To solve the **"Spaghetti Code" risk** across TypeScript/WebGL, Cloud Firestore rules, and C++20 engine layers (preventing duplicated logic, memory leaks, raw pointers, unused variables, rule regressions, or silent failures), Voxel Realms RPG combines **Automated Technical Guardrails** with a disciplined **AI Supervision Process** (detailed in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`GOVERNANCE.md`](./GOVERNANCE.md)):

### Part 1A: TypeScript, Security Rules & WebGL Guardrails (`.github/workflows/build.yml` -> `quality-check`)

Every push and Pull Request automatically runs six strict Web/TypeScript/Security quality gates:

1. **The Linter (`npm run lint` & `npm run lint:rules`)**: Runs `tsc --noEmit` with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled, plus `@firebase/eslint-plugin-security-rules` against `firestore.rules`.
2. **The Deprecation & Vulnerability Checker (`npm audit --audit-level=high`)**: Scans `package-lock.json` against known security vulnerabilities and outdated dependencies.
3. **The Formatter (`npx prettier --check .`)**: Enforces uniform formatting via `.prettierrc` so every file in the repository looks like it was written by a single author.
4. **The Regression & Security Test Suite (`npm test`)**: Runs all **168 unit, security, and regression tests across 28 decoupled TypeScript suites** (`src/game/*.test.ts`, `src/lib/*.test.ts`, and `firestore.rules.test.ts`).
5. **The Production Bundle Check (`npm run build`)**: Compiles code-split Vite 8 chunks into `dist/` with strict size checks.
6. **Live Operational Readiness Verification (`npm run verify:ops`)**: Spawns an isolated production `server.ts` instance and verifies HTTP/WS load (`0` tick overruns), fail-closed RBAC + Firebase ID token checks, exploit defenses, truncated `.bak` recovery, and clean `SIGTERM` drain.

### Part 1B: The C++20 Guardrail Stack (`.github/workflows/build.yml` -> `cpp20-guardrails`)

Our automated C++20 pipeline enforces three core guardrails at the repository root:

1. **Linter / Static Analyzer (`clang-tidy` via `.clang-tidy`)**: Catches complex bugs, forbids raw owning pointers in favor of modern C++20 smart pointers (`std::unique_ptr`, `std::shared_ptr`, `std::make_unique`, `std::make_shared`), and treats warnings as errors (`WarningsAsErrors: '*'`).
2. **Formatter (`clang-format` via `.clang-format`)**: Enforces standardized LLVM formatting (`BasedOnStyle: LLVM`, `IndentWidth: 4`, `Standard: Latest`, `ColumnLimit: 100`).
3. **Package Manager (`vcpkg` via `vcpkg.json` & `CMakeLists.txt`)**: Tracks C++20 3D Open-World MMORPG engine libraries (`entt`, `fmt`, `glm`, `sdl2`, `bullet3`, `fastnoise2`, `recastnavigation`, `enet`, `lz4`, `gtest`) against a pinned `builtin-baseline` commit.

### Part 2: The Process Fix — "Architect-First" & Refactor Sessions

Tools catch syntax and formatting issues, while disciplined engineering process **helps prevent early design flaws**:

1. **The "Architect-First" Rule**:
   - **Helps prevent early design flaws** by requiring data structures, pure domain functions (`src/game/*.ts`), and existing module reuse to be planned and verified before writing UI or rendering code.
   - **Bad Prompt**: _"Make the character jump."_
   - **Good Prompt**: _"Plan the logic for the character jump. Check `src/game/` for existing physics or movement functions we can reuse. Don't write code yet—just give me the plan."_
2. **The Refactor Session (Every 3–4 Features)**:
   - Pause feature development every 3–4 features to eliminate duplicated logic, unused variables, raw pointers, or deprecated methods across modified modules, then verify via `npm run validate`.

### Automated Test Suites & Live Server Verification (`168/168 Passing` across 28 TypeScript Suites + Live Ops Readiness + `CTest C++20`)

- **`adminModeration.test.ts`**: Verifies Root Administration, GM, Admin, Moderator & Official Contact RBAC privileges for `creatergame31@gmail.com`, explicit `UNTRUSTED_CLIENT_PREVIEW` trust boundary metadata, root immutability protection, player sanctions (`warn`, `mute`, `temp_ban`, `restore_active`, role grants), and support ticket routing.
- **`antiCheat.test.ts`**: Verifies authoritative multiplayer movement speed-hack & teleport rubberbanding, monotonic sequence replay rejection, resource/castle/realm delta inflation clamping, siege command cooldowns & `1T` rally caps, and automatic violation-score quarantine (`>=100` pts).
- **`avatarCloneShadow.test.ts`**: Verifies the 4-row `Clone` vs. `Shadow` vs. `Avatar` comparison matrix, Tactical Illusion / Combat Summon / Cosmetic Clone Avatar subtypes, Umbral Action Mimics, 3.0s Time Echoes, Dark Doppelgänger Bosses, instant Shadow Swap teleportation, per-Avatar duplication caps (`<=3` clones, `<=2` shadows), and 50-player Raid 200-entity `int16` delta-packet compression within the `20Hz` (`50ms`) server tick budget.
- **`openWorld3DEngine.test.ts`**: Verifies deterministic 2D/3D/4D `simplex-noise` multi-octave fBm biome & subterranean cavern synthesis, `three-mesh-bvh` (`MeshBVH`, `acceleratedRaycast`) O(log N) 3D picking & tree disposal, `cannon-es` rigid-body siege artillery trajectory & Citadel keep collision resolution, and `@tweenjs/tween.js` camera orbit interpolation.
- **`architectOptimization.test.ts`**: Verifies `15/11/2026` (`v1.5.0`) Hardware Architect CPU ISA profiles (`x86_64 AVX-512`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`), GPU compute backends, Thermal TDP envelopes, Software Architect `SoA` vs `AoS` cache efficiency, Lock-Free Work-Stealing Job DAG scaling, and Frame-Budget Auto-Scaler determinism.
- **`clanMath.test.ts`**: Validates clan level scaling, alliance vault donations, territory war outpost assaults, and co-op boss damage milestones.
- **`cosmologicalTreeD3.test.ts`**: Verifies D3 hierarchy construction (`buildCosmologicalD3TreeData`) and Horizontal/Radial layout coordinate projection (`computeCosmologicalD3Layout`) from `THE_WHITE_PAGE` (`Tier 6`) and `OBLIVION_NOTHINGNESS` down through `Overvoid` (`Tier 5`) to leaf `Universe` (`Tier 1`) nodes.
- **`cultivationMath.test.ts`**: Verifies 4-path progression, `100.0x` Realm Suppression (Golden Core vs Qi Refinement), Karma degradation to Red Name, stationary Tribulation Lightning, disciple taxation, and aura visual states.
- **`dailyLogin.test.ts`**: Tests calendar day deltas, 7-day streak rollover, castle/realm reward scaling, and Veteran Lineage Scroll comprehension.
- **`eula.test.ts`**: Verifies the 10-article End User License Agreement (`EULA v1.5.0 · 15/11/2026`), the 10-Agreement Legal Compliance Stack (`LEGAL_DOCUMENT_STACK` & `LEGAL_QUICK_COMPARISON_MATRIX`), Dual-Layer `Apache-2.0` + Hosted Game Service scope, deterministic FNV-1a acceptance receipt hashing (`EULA-ACK-...`), compliance checks, and keyword/category filtering.
- **`graphicsEngine.test.ts`**: Validates PC/Console (`BC7 4K · LOD 0`) vs. Mobile (`ASTC · LOD Bias +1`) pipeline specs, shadow culling, addressable HD pack mounting, and the **Engineering Transparency Matrix (`6 Implemented / 2 Simulated / 0 Planned`)**.
- **`heroSkins.test.ts`**: Tests hero skin catalog lookups, stat bonuses, and particle aura application.
- **`loreHistory.test.ts`**: Verifies the 7 Grand Historical Epochs (`6+` sections each), 12 Imperial Dynastic Annals (`LORE_DYNASTIC_ANNALS`), Auto-Populating Open-World Lore Codex (8 spatial biomes + canonical/dynamic Lv. 1–1000 monster discovery & bounty claims), the `10^100`-Word Minimum Akashic Lore Stream (`generateGoogolScaleLoreScrollSlice` synthesizing `>= 1,000` real words/volume across `10^97` `BigInt` coordinates), 6 Sacred Compendium Codices, `comprehendLoreEpoch`, and full-text `searchLoreHistory`.
- **`math.test.ts`**: Validates 10-era transitions, multiplicative power rankings into the trillions, `1,000T` troop capacities, `1T` rallies, and T1–T20 troop balance.
- **`omniverse.test.ts`**: Verifies `COSMIC_LIMITS` (`WHITE_PAGE_COUNT: 1`, `OVERVOID_MAX_COUNT: 100`, `Infinity` for Tiers 1–4), `InfiniteCollection<T>`, the strict 6-Tier Nested Cosmological Tree (`WhitePageRoot` singleton → `100` bounded `Overvoid` instances → `Omniverse` → `Megaverse` / `Hyperverse` → `Multiverse` → `Universe` leaf), `attemptCreateOvervoid` hard cap enforcement (`> 100` rejected), `lazilyGenerateInfiniteTierSlice` procedural pagination, Tier 5 `Overvoid` logic overrides and Tier 1 `Universe` physics overrides (`evaluateEffectiveUniversePhysicsAndLogic`), all 100 Fictional Species Background NPCs (`TOP_100_OMNIVERSE_SPECIES_NPCS`), and Layer-6 White Page / House of Ideas authorial decrees.
- **`proceduralWorld.test.ts`**: Regression-tests 3D voxel terrain generation, castle era crystal upgrades, articulated NPC/Monster meshes, cultivator aura scene graphs, live `applyCrossPlatformPipeline` mutations (`THREE.LOD`, `InstancedMesh.count`, `normalScale`/`bumpScale`, small-prop shadow culling), and C++20 engine telemetry.
- **`serverAuth.test.ts`**: Verifies HMAC-SHA256 signed `HttpOnly` session cookies, timing-safe `VOXEL_ADMIN_PASSKEY` verification, ephemeral fallback + fail-closed operator login, `401`/`403` RBAC rejection, immediate role revocation re-evaluation, anti-tamper `/api/online/sync` field clamping, WebSocket command session binding, and email redaction on `/api/online/status`.
- **`serverHardening.test.ts`**: Verifies sliding-window rate limits, brute-force login lockout timers, Same-Origin CSRF checks, recursive prototype-pollution detection, fragmented/bounded RFC 6455 WebSocket decoding, 20Hz tick latency percentile tracking, and LRU/oldest commander pruning.
- **`serverPersistence.test.ts`**: Verifies SHA-256 signed save envelopes, atomic `fsync` + POSIX rename writes, automatic `.bak` failover recovery from truncated or checksum-tampered primary files, legacy v1 migration, and corrupt file quarantine.
- **`siegeNetProtocol.test.ts`**: Verifies `int16` spatial quantization (`0.01m` precision), `BigInt` wire serialization up to `1,000T`, 20Hz (`50ms`) `CohortDirtyBit` delta-compression and FNV-1a 32-bit state hash parity, `1T` War Rally assembly caps, 128-frame Client-Side Prediction (CSP) ring buffer reconciliation (Exact Match, Hermite Smoothing `<= 0.15m`, Hard Rollback `> 0.15m`), and 3-node Multi-Region Replication Quorum (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`).
- **`species.test.ts`**: Verifies all 10 playable species across Fantasy, Xianxia, and Cosmic lineages, body scale bounds, `getSpeciesSpec` fallbacks, and `evaluateSpeciesSwitchPermission` Admin authorization (`creatergame31@gmail.com`).
- **`systemValidation.test.ts`**: Executes the 9-Pillar Cross-System Validation & Integrity Audit (`runFullSystemValidationReport`) verifying **100 invariants** across Root RBAC, EULA v1.5.0 & 10-Agreement Legal Stack (`creatergame31@gmail.com` + trust boundary tagging), 6-Tier Nested Cosmological Tree & 100 Omniverses, Imperial Lore (7 Epochs, 12 Annals, Auto-Populating Codex, `10^100` Akashic Corpus), 10 Playable Species, `15/11/2026` Architect Matrix, `1,000T` Castle Math, `100.0x` Realm Suppression, Lv. 1–1000 World AI, and the Engineering Transparency Matrix, Server RBAC, 20Hz Siege Netcode, Anti-Cheat, Avatar/Clone/Shadow 200-Entity Raid Sync, 3D BVH/Simplex Engine & Live WebGL2 Pipeline Mutations.
- **`troopTraining.test.ts`**: Validates batch training duration scaling, castle/VIP speed bonuses, partial troop mobilization, and instant completion math.
- **`vipSubscription.test.ts`**: Verifies VIP Tiers 0–3, Monthly/Annual activation, daily VIP stipends, loyalty level progression (`Lv. 1–15`), castle upgrade discounts, and feature access locks.
- **`weather.test.ts`**: Confirms cyclical weather transitions and dynamic resource/combat/cultivation multipliers.
- **`worldAI.test.ts`**: Validates Lv. 1–1000 monster complexity brackets, A\* obstacle pathfinding around keep structures, and distinct state machines for Guards, Traders, Blacksmiths, Mystics, and Quest-Givers.
- **`src/lib/gmail.test.ts`**: Verifies UTF-8 base64url MIME encoding/decoding round-trips, CRLF header-injection sanitization, HTML script/style tag stripping, multipart email plain-text extraction, and Dual-Tier OAuth scope isolation (`BASIC_IDENTITY_SCOPES` vs 14 `GMAIL_SCOPES` for `creatergame31@gmail.com`).
- **`firestore.rules.test.ts` (`npm run test:rules`)**: Verifies zero-trust default-deny `firestore.rules` coverage matching `firebase-blueprint.json` and rejects all **Dirty Dozen #1–#12** adversarial payloads (`PERMISSION_DENIED`).
- **`scripts/verify-readiness.ts` (`npm run verify:ops`)**: Launches an isolated live production `server.ts` process and verifies 50-way concurrent HTTP load (`200` requests + `12` live 20Hz WS peers with `0` tick overruns), HTTP/WebSocket exploit resistance (`401`/`403` across `/api/admin/*`, `/api/online/siege/cmd`, and Firebase-protected `/api/db/*` endpoints, CSRF, `__proto__`, brute-force `429`, oversized/flood WS drops), truncated primary save failover recovery from `.bak`, and clean `SIGTERM` graceful shutdown.
- **`cpp/engine_guardrail_test.cpp`**: Validates C++20 `constexpr` `100.0x` Realm Suppression `static_assert`, `100,000x` Layer-6 `TheWhitePage_HouseOfIdeas` Cosmological Scale `static_assert`, `WhitePageRootSpec` (`tier5OvervoidCount == 100U`, `tier4OmniverseCount == 100U`), `kGoogolLoreWordExponent == 100U`, `kCanonicalDynasticAnnalsCount == 12U`, `kCanonicalOpenWorldBiomeCount == 8U`, `computeCascadedUniverseQiMultiplier`, `alignas(64)` `SoaEntityKinematicChunk`, and RAII `std::unique_ptr` / `std::shared_ptr` ownership in `SectHierarchyManager`.

Run all Guardrail & Operational Readiness checks locally:

```bash
npm run validate              # Unified 5-stage check (lint + lint:rules + format:check + test + build)
npm run verify:ops            # Live production server load, exploit, crash-recovery & SIGTERM harness
npm run lint                  # 1a. Check TypeScript for messy code & unused variables
npm run lint:rules            # 1b. Lint firestore.rules with @firebase/eslint-plugin-security-rules
npm audit --audit-level=high  # 2. Check npm packages for vulnerabilities
npx prettier --check .        # 3. Check formatting style (or run `npm run format`)
npm test                      # 4. Run all 168 TypeScript unit, Gmail MIME, EULA/Legal & Firestore rule tests (28 suites)
clang-format --dry-run --Werror cpp/VoxelRealmsGuardrails.hpp cpp/engine_guardrail_test.cpp # 5. C++20 Format check
```

---

## 🤖 Steam & Platform Content Disclosure

> **Built with 🤖 AI-Assisted Engineering & Procedural WebGL/WebAudio Synthesis**

If you are publishing or distributing **Voxel Realms RPG** on **Steam (Steamworks)**, **Google Play**, or **itch.io**, platform holders require transparent disclosure regarding how AI tools and procedural generation are used in the project.

### 1. Asset & Code Provenance Summary

| Category                     | Implementation Method                                                                                                         | Runtime External AI Calls?                   |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **3D Models & Voxel World**  | 100% deterministic procedural geometry (`Three.js` instanced meshes & math primitives in `src/game/proceduralWorld.ts`)       | **No** (Zero external model assets)          |
| **Textures & Materials**     | 100% runtime mathematical 2D canvas synthesis (Albedo, Masonry, Bark, Water Normal/Bump maps)                                 | **No**                                       |
| **Audio & Sound Effects**    | 100% procedural Web Audio API waveform synthesis (`OscillatorNode` & `BiquadFilterNode` in `src/game/audio.ts`)               | **No**                                       |
| **Source Code & Game Logic** | Developed with AI-assisted coding workflows; verified by strict TypeScript (`tsc --noEmit`) and 168 automated unit/rule tests | **No** (100% deterministic local simulation) |

### 2. Steamworks AI Disclosure Form Guide

When completing the **Steamworks Content Survey -> AI Disclosure Section** during game submission, select the following options:

- **Pre-Generated Content: YES**
  - _Disclosure Text for Steam Review_:
    > "AI-assisted software engineering tools were used during development to assist with drafting TypeScript/C++20 game systems, UI layouts, and unit test suites. All 3D voxel models, PBR surface textures, and sound effects are generated deterministically via mathematical procedural algorithms (Three.js geometry primitives, HTML5 Canvas 2D patterns, and Web Audio API oscillators). All code and game content have been human-reviewed, tested, and verified for originality and licensing compliance."
- **Live-Generated Content: NO**
  - _Explanation_: The game executes 100% locally in the client runtime using deterministic math, A\* pathfinding, and procedural WebGL/WebAudio synthesis. It does not generate unmoderated AI text, images, or audio during live gameplay.

---

## ✅ Final Pre-Release Gate Checklist

Before tagging or publishing a release, confirm all release gates pass:

- [x] `npm install` completes cleanly with consistent `package-lock.json`
- [x] `npm run lint` (`tsc --noEmit`) and `npm run lint:rules` (`eslint firestore.rules`) pass with zero errors
- [x] `npm audit --audit-level=high` reports 0 high/critical vulnerabilities
- [x] `npx prettier --check .` verifies 100% consistent code formatting across all files
- [x] `npm test` passes all 168 unit, security, EULA/Legal, and Firestore rule tests across 28 TypeScript test suites
- [x] `npm run validate` and `npm run verify:ops` pass cleanly against an isolated production server
- [x] `npm run build` succeeds with code-split chunks under `dist/`
- [x] App runs in browser (`npm run dev`) with all core flows verified on desktop and mobile
- [x] GitHub Actions CI Guardrails workflow (`.github/workflows/build.yml`) and Release workflow (`.github/workflows/release.yml`) are up to date
- [x] Steam & Platform AI Disclosure documentation (`README.md`) is up to date
- [x] No `.env` secrets, API keys, OAuth tokens, or Android signing keystores (`*.jks`, `*.keystore`) are exposed

---

## 🛠️ Tech Stack

- **Framework**: React 19 (with `React.lazy` & `Suspense` on-demand modal code-splitting)
- **3D Graphics & Spatial Engine**: Three.js `0.187` (WebGL2 PBR + HDR Bloom + adaptive software fallback), `three-mesh-bvh` (`0.9.18` `MeshBVH` O(log N) raycasting), `simplex-noise` (`4.0.3` 2D/3D/4D procedural terrain/cavern synthesis), `cannon-es` (`0.20.0` 3D rigid-body physics & siege ballistics), `@tweenjs/tween.js` (`25.0.0` camera & combat interpolation)
- **Hierarchy & Data Visualization**: D3.js (`d3-hierarchy`, `d3-zoom`, `d3-selection`)
- **Backend, Authoritative Anti-Cheat & Real-Time Networking**: Express 4 + Node.js HTTP & RFC 6455 WebSocket (`/ws/siege`) + Authoritative Anti-Cheat Engine (`src/game/antiCheat.ts`, `/api/online/anti-cheat`) + HMAC-SHA256 Sessions + Atomic `.bak` Persistence
- **Cloud Database & Auth**: Cloud SQL (PostgreSQL + Drizzle ORM), Firebase Authentication (Google Sign-In), Firebase Admin SDK, Cloud Firestore (`firestore.rules` + `firebase-blueprint.json`)
- **Workspace Integration**: Google Workspace Gmail REST v1 API (`src/lib/gmail.ts` + confirmation-gated `GmailModal.tsx`)
- **Styling**: Tailwind CSS v4 (`4.3.5`)
- **Language**: TypeScript 7 (Strict) & C++20 (`vcpkg.json`: `entt`, `fmt`, `glm`, `sdl2`, `bullet3`, `fastnoise2`, `recastnavigation`, `enet`, `lz4`, `gtest`)
- **Bundler**: Vite 8 (`8.3.8` Rolldown vendor chunk splitting)
- **Icons**: Lucide React
- **Audio**: Web Audio API Procedural Synthesizer
- **CI/CD & Security Linting**: GitHub Actions (`build.yml`, `release.yml`), ESLint (`@firebase/eslint-plugin-security-rules`), Prettier, `clang-tidy`, `clang-format`

---

## 📚 Documentation, Community & Legal

### Legal, Security & Cloud Schemas

- **[Complete 10-Agreement Legal & Compliance Stack (`LEGAL.md`)](./LEGAL.md)** — Unified hub for ToS, Privacy (GDPR/CCPA/DPDP Act), Cookie Policy, EULA, SaaS Agreement, Apache-2.0 OSS License, AUP, SLA (`>=99.5%` uptime), DPA (Cloud SQL & Firestore sub-processors), and Enterprise MSA/SOW.
- **[End User License Agreement (`EULA.md`)](./EULA.md)** — Dual-layer EULA + Apache-2.0 relationship, authoritative anti-cheat consent, virtual goods, photosensitivity warning, and cryptographic acceptance receipt (`EulaModal.tsx`).
- **[Apache-2.0 License (`LICENSE.md`)](./LICENSE.md)** & **[Raw `LICENSE`](./LICENSE)** / **[`NOTICE`](./NOTICE)** — Full Apache 2.0 terms, permissions, and Section 4(d) attribution requirements.
- **[Code of Conduct (`CODE_OF_CONDUCT.md`)](./CODE_OF_CONDUCT.md)** — Community standards, acceptable behavior, and enforcement rules (`creatergame31@gmail.com`).
- **[Privacy Policy (`PRIVACY.md`)](./PRIVACY.md)** — How user data, `localStorage`, accounts, payments, cookies, and GDPR, CCPA/CPRA, and India DPDP Act (2023) requests are handled.
- **[Terms & Conditions (`TERMS.md`)](./TERMS.md)** — Rules of conduct, virtual goods policy, subscriptions, and liability disclaimers.
- **[Security Policy (`SECURITY.md`)](./SECURITY.md)** — Server-side RBAC, Cloud SQL / Firebase trust boundaries & private vulnerability disclosure (`creatergame31@gmail.com`).
- **[Firestore Security Spec (`security_spec.md`)](./security_spec.md)** & **[Blueprint (`firebase-blueprint.json`)](./firebase-blueprint.json)** — Data invariants, PII isolation, and Dirty Dozen adversarial threat matrix.

### Project Tracking & History

- **[Four-Path Immortal Cultivation & Local Dev Guide (`Four-Path Cultivation.md`)](./Four-Path%20Cultivation.md)** — Complete 23-Realm × 9-Layer matrix across Qi, Body, Soul, and Mind, `100.0x` Realm Suppression math, Karma & Red-Name justice, Master-Disciple lineage, Getting Started workflow, and `.env.example` environment variable guide.
- **[Imperial Lore & Cosmological History Codex (`LORE.md`)](./LORE.md)** — Complete 6-Layer Cosmic Ontology (`COSMIC_LIMITS`: `1` White Page Singleton → `100` Overvoids → `∞` Realities), 7 Grand Historical Epochs (`Epoch Ω-0`–`VI`), 12 Imperial Dynastic Annals, Auto-Populating Open-World Lore Codex (`Biomes` & `Monsters`), and `10^100`-Word Akashic Archive.
- **[Changelog (`CHANGELOG.md`)](./CHANGELOG.md)** — Curated, chronologically ordered log of notable features, fixes, and architecture schemas (`v1.0.0` – `v1.5.0` · `15/11/2026`).
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
