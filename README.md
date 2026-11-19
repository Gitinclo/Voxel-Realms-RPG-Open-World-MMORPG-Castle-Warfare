# 🏰 Voxel Realms RPG: Open World MMORPG & Castle Warfare

[![Maturity: Pre-Production / Prototype](https://img.shields.io/badge/Maturity-Pre--Production_%2F_Prototype-f59e0b?style=flat-square)](./badges.md#remaining-pre-production-launch-gates-honest-status)
[![CI](https://github.com/Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/actions/workflows/ci.yml/badge.svg)](https://github.com/Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/actions/workflows/ci.yml)
[![Build & Docker](https://github.com/Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/actions/workflows/build.yml/badge.svg)](https://github.com/Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/actions/workflows/build.yml)
[![Security Audit](https://github.com/Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/actions/workflows/security_audit.yml/badge.svg)](https://github.com/Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare/actions/workflows/security_audit.yml)
[![Unit & Security Tests](<https://img.shields.io/badge/Automated_Tests-202_Passing_(33_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](#testing-coverage--anti-spaghetti-guardrails)
[![Version](<https://img.shields.io/badge/Source_Version-1.5.0_(No_GitHub_Release_Yet)-f59e0b?style=flat-square>)](./CHANGELOG.md)
[![Observability: Prometheus /metrics](https://img.shields.io/badge/Observability-Prometheus_%2Fmetrics-e6522c?style=flat-square&logo=prometheus&logoColor=white)](./server.ts)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Node_24_Alpine_%2B_Nginx_Target-2496ed?style=flat-square&logo=docker&logoColor=white)](./DEPLOYMENT.md)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8b5cf6?style=flat-square)](./LICENSE.md)
[![Built With AI-Assisted Tooling](https://img.shields.io/badge/Built_with_%F0%9F%A4%96-AI--Assisted_Engineering_%26_Procedural_WebGL-ec4899?style=flat-square)](#steam--platform-content-disclosure)

> **Maturity & Release Status Notice (Pre-Production / Prototype):** There are currently **0 published GitHub Releases** and no pushed `v*` Git tags in this repository. Version `1.5.0` (`package.json`) reflects the active `main`-branch prototype milestone tracked in [`CHANGELOG.md`](./CHANGELOG.md), verified locally and in GitHub Actions via `npm run validate` (`202` unit/security tests + lockfile integrity verification), multi-stage Docker builds, `npm run verify:ops` (live `/healthz`, `/readyz`, Prometheus `/metrics`, production God-mode isolation, server-authoritative economy `/api/online/economy/events` validation + `403`/`400`/`429` anti-mint guards, multi-sector WebSocket sync, and `.bak` crash recovery), and `npm run verify:e2e` (headless Chromium E2E checks). Before public MMO launch or real-money billing, multi-instance PostgreSQL/Redis realm persistence, full gameplay-to-ledger migration, distributed soak testing, external security review, and legal review remain required (see [`badges.md`](./badges.md#remaining-pre-production-launch-gates-honest-status)). Formal GitHub Releases are created via [`.github/workflows/release.yml`](./.github/workflows/release.yml) when a `v*.*.*` tag is pushed.

A high-performance, full-featured 3D Open-World MMORPG, Castle Warfare Strategy, and Four-Path Immortal Cultivation game built with **React 19** (`React.lazy` code-split modals), **Three.js**, **D3.js**, **TypeScript**, **Tailwind CSS v4**, and **Vite 8**, backed by a full-stack **Express + RFC 6455 WebSocket** server, **Cloud SQL (PostgreSQL + Drizzle ORM)**, **Firebase Authentication & Cloud Firestore**, and **Google Workspace Gmail Dispatch**.

Designed for both desktop (WASD + mouse drag) and mobile/Android (virtual touch D-pad & gesture navigation) with live WebGL2 procedural `MeshPhysicalMaterial` PBR textures (`256px` / `512px` / `1024px`), `UnrealBloomPass` + custom GLSL color-graded post-processing, 4-tier `THREE.LOD` chains & `InstancedMesh` foliage scaling, **3D Open-World Spatial BVH Raycasting (`three-mesh-bvh`), Multi-Octave Simplex Biome Heightmaps (`simplex-noise`), 3D Rigid-Body & Object Collision Physics (`cannon-es`, [`Physics.md`](./Physics.md)) & Camera Interpolation (`@tweenjs/tween.js`) (`src/game/openWorld3DEngine.ts`)**, **Authoritative 20Hz 50v50 WebSocket Castle Siege Server, Server-Authoritative Anti-Cheat (`src/game/antiCheat.ts`, `/api/online/anti-cheat`) & Multi-Region Persistence (`server.ts`, `/ws/siege`, `/api/online/*`, `src/game/siegeNetProtocol.ts`)**, **Cloud SQL PostgreSQL + Drizzle ORM Persistence (`/api/db/*`, `src/db/`)**, **Firebase Auth Dual-Tier Google Sign-In & Real-Time Firestore Cloud Sync (`firestore.rules`, `firebase-blueprint.json`)**, **Gmail Dispatch Center (`src/lib/gmail.ts`, `GmailModal.tsx`)**, **10-Article End User License Agreement (`EULA.md`) & Complete 10-Agreement Legal Stack (`LEGAL.md`, `src/game/eula.ts`, `EulaModal.tsx`)**, **Server-Side HMAC-SHA256 Session Auth & Fail-Closed RBAC (`src/game/serverAuth.ts`, `/api/auth/*`, `/api/admin/*`)**, **100-Species / Race Character Creation, 3D Procedural Meshes & Admin (`creatergame31@gmail.com`) Permission Governance (`src/game/species.ts`, `CharacterCreationModal.tsx`)**, **6-Layer Cosmic Hierarchy & Cardinality Architecture (`COSMIC_LIMITS` & `InfiniteCollection<T>`: 1. Universe [`∞`] → 2. Multiverse [`∞`] → 3. Megaverse/Hyperverse [`∞`] → 4. Omniverse [`∞`] → 5. The Overvoid/Exonverse [`100` Fixed Cap] → 6. The White Page / The House of Ideas [`1` Singleton]), Interactive D3 Cosmological Tree Admin Visualizer (`CosmologicalAdminModal`) & Top 100 Fictional Species Background NPCs (`creatergame31@gmail.com`)**, **Auto-Populating Open-World Lore Codex (`Biomes` & `Lv. 1–1000 Monsters`), 12 Imperial Dynastic Annals, and `10^100`-Word (One Googol Words) Akashic Lore Stream**, **Software & Hardware Architect Compatibility & Optimization (`17/11/2026`)**, an explicit **Engineering Transparency Matrix (`6 Implemented`, `2 Simulated`, `0 Planned`)**, and full **Administration / GM / Moderator RBAC Control (`creatergame31@gmail.com`)**.

---

## 🎮 Key Features

### 1. 🌍 3D Procedural Voxel World & Studio PBR + HDR Engine ([`Physics.md`](./Physics.md))

- **Live WebGL2 Procedural PBR Materials & Dynamic CanvasTextures**: `MeshPhysicalMaterial` with clearcoat, IOR refraction, metallic reflections, and runtime-synthesized HTML5 `CanvasTexture` Albedo, Normal, Bump & AO maps (`256×256`, `512×512`, or `1024×1024`) for grass, masonry stone, timber bark, Damascus armor, and crystalline water ripples. Switching presets or platforms dynamically resizes canvas textures, updates anisotropy (`4x` / `8x` / `16x`), and mutates `normalScale` and `bumpScale` on active Three.js materials.
- **Real-Time HDR Post-Processing, `THREE.LOD` Chains & Platform Pipeline**: Multi-pass `EffectComposer` with `RenderPass`, `UnrealBloomPass`, custom `NextGenColorGradeShader`, and `OutputPass` (ACES Filmic Tone Mapping + dynamic `2048×2048` / `1024×1024` `PCFSoftShadowMap`), 4-tier `THREE.LOD` distance switching, dynamic `InstancedMesh` foliage scaling (`800` / `520` / `320` grass tufts), and small-prop shadow culling, paired with modeled cross-platform import overrides (`BC7` vs `ASTC`) and bundle size manifests (`src/game/graphicsEngine.ts`).
- **3D Open-World Spatial BVH Raycasting, Simplex Biome Heightmaps, Cannon-es Rigid-Body Physics, 3D Object Collision Solver & Camera Interpolation (`src/game/openWorld3DEngine.ts`, [`Physics.md`](./Physics.md))**: Accelerated `O(log N)` pointer picking across voxel terrain, keeps, monsters, and NPCs via **`three-mesh-bvh`** (`MeshBVH`, `acceleratedRaycast`), deterministic multi-octave fBm 2D/3D/4D biome & subterranean cavern synthesis via **`simplex-noise`**, 3D siege artillery ballistic trajectories, Citadel keep collision resolution & 3-Regime Object Collision (`resolveThreeDimensionalObjectCollision`: Elastic $e=1.0$, Inelastic $0<e<1.0$, Perfectly Inelastic $e=0.0$ with Conservation of Momentum & Newton's Third Law) via **`cannon-es`** (`SAPBroadphase`), and smooth camera orbit interpolation via **`@tweenjs/tween.js`**.
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

### 8. 👑 Imperial VIP Member Covenant, In-Game Economy & Marketplace (`src/game/vipSubscription.ts`, `src/game/marketplaceSparklineD3.ts`, [`in-game- economy -marketplace.md`](./in-game-%20economy%20-marketplace.md))

- **4 Tier Levels (`Free Sovereign`, `VIP 1 Silver Vanguard`, `VIP 2 Golden Immortal`, `VIP 3 Celestial Sovereign`)**:
  - Monthly (`30 Days`) and Annual (`365 Days`) in-game Diamond Covenant redemption (real-money Store Pass billing is disabled so no unverified charges or free bypasses occur), daily VIP Stipend Chests, Loyalty Level progression (`Lv. 1–15`), Castle Upgrade cost discounts (`-15%` to `-35%`), Extra Gathering March queues, and custom Realm Aura overrides.
- **8 Core Kingdom & Cultivation Currencies + Clan Honor Coins ([`in-game- economy -marketplace.md`](./in-game-%20economy%20-marketplace.md))**:
  - Lossless `BigInt` (`bigint`) treasury ledgers across **Wood**, **Steel**, **Copper**, **Grain**, **Oil**, **Kingdom Diamonds (`💎`)**, **Spirit Stones (`🔮`)**, **Scripture Fragments (`📜`)**, and **Clan Honor Coins**, supporting `1,000T` (`10^15`) garrisons and `~1Q` Creator reserves without IEEE-754 precision loss.
  - **Marketplace Bulk Trade Liquidity Score Matrix (`MarketplaceModal.tsx`, `src/game/marketplaceSparklineD3.ts`)**: Computes a `0–100` **Liquidity Score**, tier (`Instant`, `High`, `Moderate`, `Thin`, `Depleted`), and estimated execution speed from live NPC stock and average daily trade volume across **Commodity Exchange**, **Caravan Barter**, and **Scrolls & Curios**, with category filters, score sorting, and one-click bulk settlement.
  - **Caravan Barter & Sovereign Auction House ([`AUCTION_HOUSE_MECHANICS.md`](./AUCTION_HOUSE_MECHANICS.md))**: Server-authoritative `BigInt` escrow, `5%` Sovereign Auction Levy sink, `+45s` soft-close anti-sniping extensions, Master–Disciple `5%–20%` Spirit Stone lineage taxation, tradable Jade Skill Scrolls, and Root Creator Zero-Loss Economic Immunity (`creatergame31@gmail.com`).

### 9. 🛡️ Clan Alliances, 9-Sector Territory Wars, Authoritative 20Hz 50v50 WebSocket Siege Server & Multi-Region Persistence (`server.ts`, `src/game/siegeNetProtocol.ts`)

- **Heraldic Alliances & 9-Sector Territory War Map (`A1`–`C3`)**: Create and customize heraldic SVG clan emblems, manage membership hierarchies, battle across the 9-sector (`A1`–`C3`) Territory War Map, strike the 600M HP Void Leviathan Co-op Boss, and compete on global multi-trillion power rankings.
- **Authoritative 20Hz (`50ms`) Multi-Sector 50v50 WebSocket Siege Engine (`/ws/siege` & `src/game/siegeNetProtocol.ts`)**: Full-stack Express + RFC 6455 WebSocket upgrade server (`server.ts`) ticking all peer-subscribed sectors independently and broadcasting 20Hz bitmasked delta-compressed state updates (`CohortDirtyBit` / `S2C_DELTA_SIEGE_UPDATE` `0x11`) and periodic full snapshots (`S2C_FULL_SIEGE_SNAPSHOT` `0x10`), handling real-time `C2S_TROOP_POSITION_CMD` (`0x01`) formation directives (`SHIELD_WALL`, `PHALANX_ADVANCE`, `WEDGE_CHARGE`, `LOOSE_SKIRMISH`) and `C2S_RALLY_ACTION_CMD` (`0x02`) `1T` (`1,000,000,000,000`) War Rallies with `int16` spatial quantization (`0.01m` precision), lossless `BigInt` wire serialization up to `1,000T`, 128-frame Client-Side Prediction (CSP) ring buffer reconciliation (`ClientPredictionRingBuffer`), and 32-bit FNV-1a state hashing (`computeSectorStateHash`).
- **Atomic Disk Persistence, Crash Recovery & Containerized Production Deployment (`src/game/serverPersistence.ts`, `Dockerfile`, `.dockerignore`, `nginx.conf`, [`DEPLOYMENT.md`](./DEPLOYMENT.md))**: Saves use write-temp → `fsyncSync` → `.bak` promotion → atomic POSIX rename inside a SHA-256 checksum envelope (`schemaVersion: 2`) with automatic failover recovery from `.bak` on truncated/corrupted primary files and `SIGTERM`/`SIGINT` graceful shutdown draining. Multi-stage `node:24-alpine` containerization (`Dockerfile`) excludes `devDependencies`, runs as non-root `USER node` on port `3000`, exposes `/healthz` + `/readyz` + `/api/ops/readiness`, and includes an optional `--target nginx-runner` non-root Alpine/Nginx static edge stage.

### 10. ⚖️ Server-Enforced Administration, GM, Admin & Moderator RBAC Control & Supreme Creator God Character (`creatergame31@gmail.com`)

- **Server-Side Cryptographic, Global-State & WebSocket Hardening (`server.ts`, `src/game/serverAuth.ts`, `src/game/serverHardening.ts`)**:
  - **Fail-Closed Startup Secrets**: `server.ts` refuses to start (`process.exit(1)`) if `VOXEL_SESSION_SECRET` (`>= 32` chars in prod, `>= 16` in dev) or `VOXEL_ADMIN_PASSKEY` (`>= 12` chars) is missing, weak, or matches `.env.example` placeholders—zero ephemeral secret fallbacks.
  - **Global State Isolation & RBAC**: `GET /api/online/status?sector=` is strictly read-only; global `primaryClusterId` and `activeSector` mutations on `POST /api/online/sync` are restricted to GM/admin sessions (`canAccessGmConsole`); privileged `/api/admin/*` routes and `/api/online/siege/cmd` fail closed (`401`/`403`) without HMAC-SHA256 `HttpOnly` session cookies.
  - **WebSocket & HTTP Defenses**: Enforces browser `Origin` validation on `/ws/siege` (`403` CSWSH protection), rejects `?token=` query-string credentials (`400`), resolves real client IPs behind trusted proxies via `X-Forwarded-For` (`resolveClientIpFromHeaders`), enforces sliding-window API write rate limits (`120/min`), 5-attempt admin login brute-force lockouts (`429` + `Retry-After`), Same-Origin CSRF checks, recursive `__proto__` payload filtering (`400`), WS frame/flood caps (`32 KiB` frame / `30 msg/s`), slow-consumer backpressure drops, and hardened HTTP headers (`Content-Security-Policy` including `worker-src 'self' blob:`, `Strict-Transport-Security`, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Content-Type-Options`, `Referrer-Policy`).
- **Explicit Client Trust Boundary (`src/game/adminModeration.ts`, `AdminConsoleModal.tsx`)**: Client-side email switches, `localStorage` caches, and single-player canvas cheats are explicitly marked **`UNTRUSTED_CLIENT_PREVIEW`** and cannot escalate server permissions or spoof multiplayer state. Root account **`creatergame31@gmail.com`** retains immutable Clearance `Lv. 999` protection plus **Supreme Creator Max-Out God Character, 12-Domain All-Things Immunity & 100 Supreme Omni-Attributes (5 Divine Pillars)** (`src/game/godModeCharacter.ts`, strictly fail-closed for all other emails), with all security events persisted to `securityAuditLog` and verified end-to-end against a live server via `npm run verify:ops` (`scripts/verify-readiness.ts`). See [`SECURITY.md`](./SECURITY.md) for deployment hardening requirements.
- **Supreme Creator Max-Out God Character, 12-Domain All-Things Immunity & 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`, `AdminConsoleModal.tsx`, `CultivationModal.tsx`)**:
  - **Maxed-Out God Character Bundle (`buildMaxedGodCharacterBundle`)**: Exclusively bound to **`creatergame31@gmail.com`** (`Castle Lv. 100 Omnipotent Citadel`, `Armor Tier 20`, `1,000T` T20 troops across Shieldbearers/Shooters/Bombers, `999.999T` [`~1Q`] treasury reserves across Wood/Steel/Copper/Grain/Oil/Diamonds/Spirit Stones/Scripture Fragments, **Realm 22 `Ultimate Origin Supreme Realm` Layer 9** across Qi/Body/Soul/Mind, all 12 Ancient Manuals at `Lv. 10`, all 4 Mystical Skills, 12 Comprehended Great Daos, `100%` Chaos Spirit Root, Supreme Gold Justice Karma `+100,000`, `VIP 3 Celestial Sovereign` Loyalty `Lv. 15`, and `Lv. 999` Divine Heroes).
  - **12-Domain All-Things Immunity (`GOD_IMMUNITY_DOMAINS`, `evaluateGodCharacterImmunity`, `applyGodImmunityToIncomingEffect`)**: Strictly fail-closed for all non-root accounts (`isCreatorGodAccount && godmodeEnabled`):
    1. `damage_and_casualties` — Zero incoming HP damage (`0`) and `0` troop casualties across PvE, PvP, and `1T` Rallies.
    2. `realm_suppression` — Immune to hostile cultivation realm suppression (`0.0x` incoming multiplier vs. standard up to `100.0x`).
    3. `tribulation_lightning` — Complete immunity to Heavenly & Stationary Tribulation Lightning strikes.
    4. `judgment_and_loot_drop` — Zero equipment/loot drop risk (`0%` vs. `85%` Red-Name penalty) and immunity to Heavenly Judgment.
    5. `karma_degradation_and_bounty` — Immune to negative Karma shifts, Red-Name locking, and global Bounty broadcasting.
    6. `mind_demon_and_curse` — Immune to Inner Heart Demons, Soul Corruption, Qi Deviation, and hexes.
    7. `status_and_crowd_control` — Immune to stun, freeze, silence, knockback, slow, root, and weather penalties.
    8. `economic_drain_and_tax` — Zero-Loss Economic Immunity across upgrades, training, alchemy, manuals, VIP, and marketplace taxes ([`in-game- economy -marketplace.md`](./in-game-%20economy%20-marketplace.md)).
    9. `cooldown_and_phase_lock` — Zero skill/clone/shadow/decree cooldowns and immunity to spatial/dimensional locks.
    10. `moderation_and_quarantine` — Immutable `Lv. 999` Root Owner protection (`cannotSanctionRootAdmin`) and server `AntiCheatEngine` quarantine bypass.
    11. `breakthrough_failure` — Guaranteed `100%` breakthrough ascension probability with zero realm regression.
    12. `cosmic_oblivion_erase` — Anchored at Layer 6 (`THE_WHITE_PAGE` / `The House of Ideas`), immune to Tier 5 Overvoid logic erasure and Oblivion resets.
  - **100 Supreme Omni-Attributes Codex across 5 Divine Pillars (`GOD_OMNI_ATTRIBUTES`, `GOD_OMNI_PILLAR_SPECS`, `evaluateGodOmniAttribute` in `src/game/godModeCharacter.ts`)**: Strictly fail-closed for all accounts except **`creatergame31@gmail.com`**:
    - **Pillar 1 — Power, Authority & Creation (`20` Attributes)**:
      - **Omnipotent**: Possessing unlimited, absolute power and authority.
      - **Omnific**: Creating all things; having the power to bring everything into existence.
      - **Omnificent**: Unlimited in creative force and capacity.
      - **Omniregent**: Ruling as the supreme sovereign over all realms and beings.
      - **Omnicausal**: Serving as the ultimate first cause behind everything that exists.
      - **Omnicompetent**: Fully capable of governing, judging, and handling every cosmic matter.
      - **Omnidominant**: Holding total supremacy and dominance over all forces.
      - **Omniparent**: Acting as the ultimate creator, progenitor, or parent of all life.
      - **Omnipotentate**: A supreme ruler holding all power in the universe.
      - **Omnisovereign**: Exercising absolute kingship and dominion over all creation.
      - **Omniforce**: Embodying the entirety of all cosmic energy and strength.
      - **Omnimaster**: Having complete mastery over every element, law, and spirit.
      - **Omnivictorious**: Triumphant over all opposition, chaos, and darkness.
      - **Omnidirective**: Guiding and ordering the path of the entire universe.
      - **Omnimaker**: The sole architect and builder of all worlds.
      - **Omnipropulsive**: Providing the driving force behind all motion in the cosmos.
      - **Omnigoverning**: Maintaining total order and governance across all reality.
      - **Omnisustaining**: Continuously holding all of creation together so it does not cease to exist.
      - **Omnipotential**: Containing the infinite potential for anything that could ever be.
      - **Omniconquering**: Overcoming all evil, death, and cosmic adversaries.
    - **Pillar 2 — Knowledge, Wisdom & Vision (`20` Attributes)**:
      - **Omniscient**: Possessing complete, infinite knowledge of past, present, and future.
      - **Omnisapient**: Holding absolute, flawless wisdom and divine judgment.
      - **Omnivident**: All-seeing; perceiving every event across all dimensions simultaneously.
      - **Omnispective**: Able to observe everything in existence without blind spots.
      - **Omnipercipient**: Perceiving every thought, emotion, and physical detail in the universe.
      - **Omnivigilant**: Watching over all creation tirelessly without ever slumbering.
      - **Omnilingual**: Understanding and speaking every language, mortal or divine.
      - **Omnilegent**: Knowing the contents of every written, spoken, or unwritten truth.
      - **Omnicognizant**: Fully aware of all realities, timelines, and possibilities.
      - **Omniprohetic**: Foreknowing every future event before it occurs.
      - **Omnidiscernment**: Instantly distinguishing truth from falsehood in all hearts.
      - **Omniaware**: Conscious of every atom and soul in the cosmos at once.
      - **Omnilucent**: Radiating divine light and illumination that reveals all hidden things.
      - **Omnirevealing**: Unveiling all cosmic mysteries and truths to creation.
      - **Omnimemory**: Retaining perfect, eternal memory of everything that has ever happened.
      - **Omnisensor**: Sensing every vibration, prayer, and shift across reality.
      - **Omnitruth**: Embodying the absolute, unchanging truth of all existence.
      - **Omniclarity**: Seeing through all illusions and complexities with total clarity.
      - **Omniguiding**: Illuminating the righteous path for all seekers.
      - **Omniscrutinizing**: Examining every soul and action with perfect precision.
    - **Pillar 3 — Presence, Space & Time (`20` Attributes)**:
      - **Omnipresent**: Existing everywhere in the universe at the exact same moment.
      - **Omnitemporal**: Existing across all time—past, present, and future simultaneously.
      - **Omnilocal**: Occupying every physical and spiritual location at once.
      - **Omnidistance**: Spanning across infinite distances without boundary.
      - **Omniprevalent**: Prevailing and existing throughout every corner of reality.
      - **Omnisubstantial**: Comprising the fundamental essence and substance of all things.
      - **Omnicorporeal**: Capable of manifesting in any physical or divine form.
      - **Omniform**: Possessing every form, shape, and manifestation across creation.
      - **Omniphasic**: Existing across all states, dimensions, and planes of reality.
      - **Omnimobile**: Moving freely and instantaneously across all realms.
      - **Omniambient**: Surrounding and permeating every environment in existence.
      - **Omnibearing**: Extending infinitely in every conceivable direction.
      - **Omnidimensional**: Inhabiting every higher and lower dimension at once.
      - **Omnieternal**: Having no beginning and no end across all ages.
      - **Omniimmanent**: Indwelling within every part of the created world.
      - **Omnitranscendent**: Rising infinitely above and beyond all physical creation.
      - **Omnivagant**: Moving throughout the entirety of the cosmos without restriction.
      - **Omnicentric**: Serving as the true center of all existence.
      - **Omnispatial**: Encompassing the entirety of space itself.
      - **Omniabiding**: Remaining steadfast and present in all places forever.
    - **Pillar 4 — Goodness, Morality & Divine Nature (`20` Attributes)**:
      - **Omnibenevolent**: Possessing infinite, unconditional goodness and love.
      - **Omnimerciful**: Extending boundless compassion, grace, and forgiveness to all.
      - **Omnigracious**: Bestowing unlimited favor and blessings upon creation.
      - **Omnijust**: Executing perfect, incorruptible justice in every judgment.
      - **Omnipure**: Completely free from any flaw, stain, or corruption.
      - **Omniholy**: Supremely sacred, revered, and set apart above all else.
      - **Omnipacific**: Bringing ultimate peace and harmony to the cosmos.
      - **Omniloving**: Loving all beings infinitely and unconditionally.
      - **Omniforgiving**: Capable of absolving any transgression or sin.
      - **Omniblessed**: Eternally blessed and the source of all blessings.
      - **Omnisympathetic**: Feeling deep compassion for the suffering of every creature.
      - **Omnibountiful**: Giving generously and endlessly to sustain all life.
      - **Omnipatient**: Enduring with infinite patience and long-suffering.
      - **Omnifaithful**: Remaining completely true to every promise and covenant.
      - **Omnirighteous**: Always acting in total moral perfection.
      - **Omnisaving**: Offering redemption and salvation to all who seek it.
      - **Omnitolerant**: Bearing with all creation with boundless grace.
      - **Omniharmonious**: Uniting all opposing forces in divine balance.
      - **Omnicaring**: Watching over and tending to the needs of every living thing.
      - **Omnimoral**: Serving as the absolute foundation of all moral law.
    - **Pillar 5 — Cosmic Unity & Volition (Including Dark/Dualistic Deities) (`20` Attributes)**:
      - **Omnivolent**: Willing all things that come to pass.
      - **Omnisentient**: Experiencing total cosmic consciousness and awareness.
      - **Omnipathy**: Feeling the collective emotions and states of the entire universe.
      - **Omnisatisfying**: Fulfilling the deepest spiritual longing of every soul.
      - **Omnisubjective**: Encompassing every perspective and consciousness within itself.
      - **Omnipersonal**: Relating intimately to every individual being at once.
      - **Omnigenesis**: Serving as the singular origin point of all species and worlds.
      - **Omnisoul**: Acting as the great world-soul connecting all living spirits.
      - **Omniessence**: Being the core spiritual essence behind all matter.
      - **Omnimalevolent**: Possessing absolute malice toward all creation (used for dark or evil deities).
      - **Omnidestructive**: Capable of unmaking and annihilating all of existence (e.g., gods of destruction).
      - **Omniconsuming**: Devouring all worlds, time, and matter at the end of an age.
      - **Omniterrible**: Inspiring overwhelming awe, dread, and reverence in all mortals.
      - **Omnimysterious**: Remaining infinitely beyond full human comprehension.
      - **Omniimmutable**: Completely unchanging and unshakeable across eternity.
      - **Omniperfect**: Lacking nothing; complete in every conceivable attribute.
      - **Omnisufficient**: Needing nothing outside of itself to exist or thrive.
      - **Omniunifying**: Drawing all scattered creation back into cosmic oneness.
      - **Omnimajestic**: Clothed in infinite splendor, glory, and grandeur.
      - **Omnidivine**: Embodying the complete fullness of godhood.
  - **Sovereign Divine Flight & 3D Nine-Heavens Imperial Flying Sword (`GOD_FLIGHT_SPEC`, `evaluateGodFlightPermission`, `computeNextGodFlightKinematics` in `src/game/godModeCharacter.ts`, `GameCanvas.tsx`, `GameHUD.tsx`, `AdminConsoleModal.tsx`)**:
    - Exclusively authorized for Root Creator **`creatergame31@gmail.com`** (strictly fail-closed for all other emails), powered by the linked Omni-Attributes **`Omnimobile`**, **`Omnipropulsive`**, **`Omnitranscendent`**, and **`Omnivagant`**.
    - **3D Imperial Flying Sword & Astral Bagua Halo (`GodFlightMountGroup` in `src/game/proceduralWorld.ts`)**: Renders a golden-cyan Nine-Heavens Imperial Flying Sword and counter-rotating Astral Bagua Halo rings beneath the player avatar while airborne.
    - **Aerial Kinematics & Citadel Wall Bypass**: Grants **`2.5x` Flight Speed** (`35` world units/sec vs. `14` on ground), vertical elevation up to **`45.0m`** (soaring above the `18m` Citadel Spire and `28m–31m` Celestia Sky Islands), and automatic **Citadel Keep Wall Collision Bypass** when airborne (`y >= 2.5m`), controllable via hotkey **`[F]`** (Toggle Fly/Land), **`E` / `Space`** (Ascend), **`Q` / `Shift`** (Descend), the HUD Flight Badge & 3D Flight Control Pod (`+Alt` / `FLY` / `-Alt`), and the GM Console Altitude Presets (`0m`, `8.5m`, `18m`, `28m`, `45m`).
  - **Sovereign Divine Teleportation & 3D Spatial Warp Matrix (`GOD_TELEPORT_SPEC`, `evaluateGodTeleportPermission`, `executeGodTeleportJump` in `src/game/godModeCharacter.ts`, `GameCanvas.tsx`, `GameHUD.tsx`, `AdminConsoleModal.tsx`)**:
    - Exclusively authorized for Root Creator **`creatergame31@gmail.com`** (strictly fail-closed for all other emails), powered by the linked Omni-Attributes **`Omnipresent`**, **`Omnilocal`**, **`Omnidistance`**, **`Omnimobile`**, and **`Omnispatial`**.
    - **8 Sovereign Realm Waypoints (`0ms` Cooldown)**: One-click instantaneous warp across `Citadel South Gate (0, 0, 18)`, `Citadel Spire Zenith (0, 18.5, 0)`, `Celestia Sky Island (0, 29.0, 0)`, `Ender Titan Arena (0, 12.0, -34)`, `Magma Diamond Leyline (26, 8.5, 22)`, `Eastern Sakura Pavilion (24, 6.0, -16)`, `Northern Glacier Peak (-28, 14.0, -28)`, and `Apex Stratosphere (0, 45.0, 0)`.
    - **Forward Astral Blink (`+12m` `[T]`), Custom `(X, Y, Z)` Warp & `Shift + Click` 3D Scene**: Press **`[T]`** or click **Blink** in the HUD/GM Console to blink `+12.0m` along the avatar's facing vector, **`Shift + Click`** any terrain/structure in the 3D WebGL2 viewport to teleport directly to that coordinate, or enter exact `(X, Y, Z)` coordinates in the GM Console, accompanied by a 3D expanding cyan-gold **`GodTeleportWarpGroup`** torus burst.

### 11. 🖥️ Software Architect & Hardware Architect Compatibility & Optimization (`17/11/2026` — `v1.5.0`)

- **Hardware Architect Matrix (`src/game/architectOptimization.ts`)**: Full CPU ISA vector & cache-line profiles for **`x86_64 AVX-512F/BW`** (512-bit, 64B cache line), **`ARMv9-A NEON + SVE2`** (heterogeneous core pinning), **`Apple Silicon M-Series`** (128B cache line + zero-copy Unified Memory Architecture), and **`RISC-V RV64GC + RVV 1.0`**, paired with GPU tiers (`Vulkan 1.3`, `DX12 Ultimate`, `Metal 3`, `WebGPU`, `WebGL 2.0`, `Software Rasterizer`) and Thermal TDP envelopes (`350W Desktop` down to `8W Mobile Passive`).
- **Software Architect Engine Optimization**: Interactive **Structure-of-Arrays (`SoA`) vs Array-of-Structures (`AoS`)** memory layout profiler (`4.75x` hot-loop speedup), zero-mutex **Lock-Free Work-Stealing Job Scheduler** across 2–64 logical cores, and a deterministic **Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`)**.

### 12. 🧬 100-Species / Race Character Creation & Admin-Authorized Rebirth (`src/game/species.ts`, `CharacterCreationModal.tsx`)

- **All 100 Playable Species / Races (`CHARACTER_SPECIES_CATALOG.length === 100`, Ranks `#1–#100`)**:
  - **10 Core Solara Starter Lineages (`CORE_10_SPECIES_CATALOG`)**:
    - **Classic Fantasy (`fantasy_kingdom`)**: `human` (_Terran Sovereign / 人族·皇道苍生_, Rank `#81`), `sylvan_elf` (_Sylvan High-Elf / 精灵·苍翠星裔_, Rank `#99`), `ironforge_dwarf` (_Ironforge Runedwarf / 矮人·神炉符匠_, Rank `#100`), `warborn_orc` (_Warborn Berserker / 兽人·血怒狂战_, Rank `#85`).
    - **Xianxia Immortal (`xianxia_immortal`)**: `azure_dragonkin` (_Azure Dragonkin / 龙族·太古苍龙_, Rank `#50`), `celestial_kitsune` (_Celestial Nine-Tail Kitsune / 天狐·青丘九尾_, Rank `#53`), `asura_demon` (_Asura Bloodfiend / 修罗·冥河魔神_, Rank `#51`), `empyrean_angelic` (_Empyrean Seraph / 天人·六翼炽圣_, Rank `#12`).
    - **Cosmic / Primordial (`cosmic_primordial`)**: `void_walker` (_Nether Void-Walker / 虚空·归墟行者_, Rank `#22`), `crystalline_golem` (_Astral Crystal-Golem / 圣灵·星核泰坦_, Rank `#80`).
  - **90 Sovereign Omniverse Races (`OMNIVERSE_90_SPECIES_CATALOG`, `omniverse_species_001`..`omniverse_species_098`)**:
    - Spans every remaining race from the **Top 100 Fictional Species Omniverse (`#1` Outer Gods, `#2` The Beyonders, `#3` The Endless, `#6` Celestialsapiens, `#8` Q Continuum, `#21` Xeelee, `#23` Time Lords, `#25` Culture Minds, `#44` Asgardians, `#48` Otsutsuki Clan, `#61` Saiyans, `#62` Kryptonians, `#63` Viltrumites, ..., `#98` Vulcans)** across Omniverse Tiers `1–5`, filterable by Tier (`All 100`, `Core 10`, `T1 Cosmic`, `T2 Sci-Fi`, `T3 Divine`, `T4 Power`, `T5 Galactic`) and live search in `CharacterCreationModal.tsx`.
- **Full 3D Procedural Meshes & Innate Passives**: Real-time Three.js `SpeciesTraitGroup` attachments (pointed elven ears, fox spirit ears, braided dwarf runic beard, orc tusks, draconic/obsidian horns, feathered angelic/demonic wings, draconic/nine-tailed spirit tails, orbiting void crystals, and golem chest core reactors), 3-tuple body stature scaling (`bodyScale`), and innate combat/cultivation buffs across all 100 races.
- **Root Creator (`creatergame31@gmail.com`) & Admin Permission Gate (`evaluateSpeciesSwitchPermission`)**:
  - **Root Creator (`creatergame31@gmail.com`)**: Unrestricted access to choose and switch among **all 100 Playable Races (`#1–#100`)** at any time (`allowed: true`, `authorizedByEmail: 'creatergame31@gmail.com'`).
  - **Other Players with Admin (`creatergame31@gmail.com`) Permission (`adminSpeciesSwitchApproved: true`)**: Full access to choose and switch among **all 100 Playable Races (`#1–#100`)** via Admin Decree (`AdminConsoleModal.tsx` or `CharacterCreationModal.tsx`) or `[SPECIES REBIRTH]` support ticket.
  - **Other Players without Admin Permission**: Initial character creation (`speciesLocked: false`) allows free selection from the 10 Core Solara Starter Lineages, while selecting the 90 Sovereign Omniverse Races or switching species after lock requires Admin (`creatergame31@gmail.com`) permission.

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
  - **Epoch III — Awakening of the 100 Playable Species & Admin Rebirth Seal**: Chronicles the rise of the 10 Core Solara Starter Bloodlines, the 90 Sovereign Omniverse Races (`#1–#100`), and the Admin Rebirth Governance Seal (`creatergame31@gmail.com`).
  - **Epoch IV — The Han Jue Four-Path Immortal Revelation & 100x Realm Suppression**: Chronicles Han Jue's Secluded Providence doctrine, the 4 Cultivation Paths, and `100x` Realm Suppression.
  - **Epoch V — The Ten Citadel Eras & Trillion-Scale Siege Wars**: Chronicles the 10 Citadel Eras, T1–T20 Legions, and `1T` World Boss Rallies.
  - **Epoch VI — The `17/11/2026` Software & Hardware Architect Convergence (`v1.5.0`)**: Chronicles the unification of the Three.js PBR renderer with the C++20 SIMD/SoA Architect Engine.
- **Auto-Populating Open-World Lore Codex (`OPEN_WORLD_BIOME_CODEX_CATALOG` & `OPEN_WORLD_MONSTER_CODEX_CATALOG`)**:
  - Automatically unlocks and persists entries (`localStorage` key `voxel_realms_lore_codex_state_v1`) as the player explores Solara's **8 Spatial Biomes** (`resolveBiomeAtWorldPosition`) or encounters/selects/spawns **Canonical & Dynamic Lv. 1–1000 Monsters** (`evaluateOpenWorldLoreDiscovery`, `buildDynamicMonsterCodexEntry`), awarding one-time Kingdom Diamond (`💎`) and Scripture Fragment discovery bounties (`claimLoreCodexReward`).
- **12 Imperial Dynastic Annals & Legendary Artifact Histories (`LORE_DYNASTIC_ANNALS`)**:
  - Twelve multi-paragraph primary historical treatises spanning Layer 6 _The White Page Quill_, the _Overvoid Logic Schism War_, the _First Solara Dragon-Vein Concordat_, the _Crystalline Golem Foundry Oath_, and the _Void Leviathan Abyssal Siege_.
- **`10^100` Words Minimum (One Googol Words) Akashic Lore & History Stream (`GOOGOL_LORE_ARCHIVE_SPEC`)**:
  - Deterministically synthesizes **`1,000+` real English words per volume** across `10^97` `BigInt`-addressable coordinates (`1n` to `GOOGOL_MAX_VOLUME_INDEX = 10n ** 97n`, `generateGoogolScaleLoreScrollSlice`) without blocking RAM — achieving `10^97 × >=1,000 >= 10^100` (One Googol Words Minimum).
- **6 Sacred Compendium Codices, Epoch Comprehension & Full-Text Search (`LoreHistoryModal.tsx`)**: Full-text searchable lore archive (`searchLoreHistory`) spanning Epochs, Annals, Codex Biomes/Monsters, and Compendium chapters, paired with interactive Epoch Comprehension (`comprehendLoreEpoch`).

### 15. 🛡️ 9-Pillar Cross-System Validation & Integrity Engine (`src/game/systemValidation.ts`)

- **Deterministic 9-Pillar Engine Audit (`runFullSystemValidationReport`)**: Continuously validates **103 cross-module invariants** across:
  1. **Root RBAC, 12-Domain All-Things Creator God Immunity, 100 Supreme Omni-Attributes across 5 Divine Pillars, Sovereign Divine Flight & Sovereign Divine Teleportation (`src/game/godModeCharacter.ts`), 10-Article EULA v1.5.0, 10-Agreement Legal Stack Governance & Supreme Author Immutability (`creatergame31@gmail.com` · Clearance Lv. 999)**
  2. **6-Tier Nested Cosmological Tree (`WhitePageRoot` Singleton → `Universe` Leaf), Tier 5/Tier 1 Physics Overrides & 100+∞ Sovereign Omniverses**
  3. **Imperial Lore (7 Epochs), 12 Dynastic Annals, Auto-Populating Open-World Codex (8 Biomes & Monsters) & `10^100`-Word Akashic Stream**
  4. **100 Playable Species / Races (10 Core Solara Lineages + 90 Sovereign Omniverse Races `#1–#100`), 3D Procedural Anatomy & Admin (`creatergame31@gmail.com`) Rebirth Permission Gate**
  5. **`17/11/2026` Software & Hardware Architect Engine (`x86_64 AVX-512`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`, `SoA` `4.75x` speedup)**
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

| Agreement Type                      | Primary Focus                                       | Typical Context                             | Voxel Realms RPG Implementation (`v1.5.0 · 17/11/2026`)                                                                                        |
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
| **7. Trillion-Scale Warfare, 23 Realms, 6-Layer Cosmology & 100 Omniverses** (`src/game/math.ts`, `omniverse.ts`)                         |    **🟢 IMPLEMENTED (`BigInt` Engine + 3D Projection)**    | All castle capacities (up to `1,000T`), T1–T20 Tri-Branch battles, 23 cultivation realms (`100.0x` suppression), A\* keep pathfinding, 100 playable species 3D meshes (`10 Core + 90 Omniverse`), 7 Lore Epochs, and 6-Layer Cosmology / 100 Omniverse NPCs under `creatergame31@gmail.com` are fully implemented in TypeScript using exact 64-bit `BigInt` math and projected as 3D entities in the overworld.                                                                                                                                                                                      | Trillion-unit troop clashes and 100-Omniverse tributes are resolved analytically via deterministic `BigInt` combat/economy equations while rendering representative 3D hero/envoy/monster meshes in the viewport to maintain 60 FPS.                                                                                             | GPU instanced crowd impostor rendering for visualizing `100,000+` simultaneous march units during siege replays.                                    |
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
cp .env.example .env   # Mandatory: set non-placeholder VOXEL_SESSION_SECRET and VOXEL_ADMIN_PASSKEY (and optional SQL_*)
```

### Development Server

Run the full-stack Express + WebSocket + Vite development server on port `3000`:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3000/?autostart=1](http://localhost:3000/?autostart=1) to skip the title overlay directly into the 3D realm).

### Running Unit, Security & Integration Tests

Execute all **173 automated tests across 29 suites** (`27` engine/security/netcode/anti-cheat/3D-physics/avatar-clone-shadow/EULA-legal/god-mode suites in `src/game/*.test.ts`, `src/lib/gmail.test.ts`, and `firestore.rules.test.ts`):

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
│   ├── CODEOWNERS                     # Default Root Owner & Guardrail reviewers (creatergame31@gmail.com)
│   ├── CODE_OF_CONDUCT_ENFORCEMENT.md # Graduated enforcement ladder & escalation guide
│   ├── dependabot.yml                 # Weekly automated npm & GitHub Actions dependency updates
│   ├── FUNDING.yml                    # Maintainer contact & support funding metadata
│   ├── release.yml                    # Automated changelog category configuration
│   ├── DISCUSSION_TEMPLATE/           # announcements.yml, ideas.yml, q-and-a.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── config.yml                 # Contact links & private security disclosure redirect
│   │   ├── bug_report.md              # Bug report template
│   │   ├── feature_request.md         # Feature request template
│   │   ├── release_checklist.md       # Final release signoff checklist
│   │   ├── security_vulnerability.md  # Private security redirect notice
│   │   ├── performance_regression.md  # FPS / 20Hz tick overrun / bundle regression report
│   │   ├── incident_report.md         # SEV-1 to SEV-4 operational incident template
│   │   ├── lore_inconsistency.md      # Lore / Cosmology consistency report
│   │   ├── balance_feedback.md        # Combat / Cultivation / Clone balance proposal
│   │   ├── tech_debt.md               # Technical debt logging template
│   │   └── documentation_gap.md       # Documentation gap report template
│   ├── ISSUE_TEMPLATE.md              # Unified issue / bug / feature / moderation template
│   ├── PULL_REQUEST_TEMPLATE/         # hotfix.md, breaking_change.md, architecture_change.md, lore_addition.md
│   ├── PULL_REQUEST_TEMPLATE.md       # Pull Request validation & guardrail checklist
│   └── workflows/                     # 10 GitHub Actions pipelines (checkout@v7, setup-node@v7, upload-artifact@v7, stale@v11)
│       ├── build.yml                  # GitHub Actions CI (Web/TS + Rules ESLint + Live Ops + C++20)
│       ├── release.yml                # Tag-triggered v*.*.* checksummed GitHub Release pipeline
│       ├── ci.yml                     # Fast PR npm run validate workflow
│       ├── cd.yml                     # Manual / staging verification gate
│       ├── docs_deploy.yml            # Markdown Prettier formatting & README relative link check
│       ├── nightly_build.yml          # Daily validation + audit + verify:ops workflow
│       ├── security_audit.yml         # Weekly supply-chain audit + Firestore rules verification
│       ├── lint_and_format.yml        # TypeScript, ESLint Rules & Prettier PR check
│       ├── release_drafter.yml        # Release notes preview workflow
│       └── stale_issues.yml           # Scheduled stale issue & PR triage automation (actions/stale@v11)
├── docs/
│   ├── adr/
│   │   ├── 0001-record-architecture-decisions.md # ADR 0001: Functional Core / Imperative Shell separation
│   │   └── TEMPLATE.md                # Standard Architecture Decision Record (ADR) template
│   └── rfcs/
│       └── TEMPLATE.md                # Standard Architect-First RFC proposal template
├── cpp/
│   ├── VoxelRealmsGuardrails.hpp      # C++20 RAII smart-pointer & concept guardrail header
│   └── engine_guardrail_test.cpp      # C++20 CTest static_assert & RAII verification unit test
├── scripts/
│   └── verify-readiness.ts            # Live production server load, exploit, crash-recovery & SIGTERM suite
├── src/
│   ├── components/                    # React 19 UI Modals (lazy-loaded) & HUD Overlays
│   │   ├── AdminConsoleModal.tsx      # GM cheats, T20 spawner, RBAC, Species & Omniverse hub
│   │   ├── CastleModal.tsx            # Citadel Lv 0-100 upgrade & 10-Era progression UI
│   │   ├── CharacterCreationModal.tsx # 100-Species selector, Tier filters, 3D turntable & Admin permission gate
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
│   │   ├── HeroModal.tsx              # Hero ascension, tavern summons, skins & Avatar/Clones/Shadows console
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
│   ├── game/                          # Pure Decoupled Game Engine & 27 Unit Test Suites
│   │   ├── adminModeration.ts         # Root RBAC (creatergame31@gmail.com), moderation & tickets
│   │   ├── adminModeration.test.ts    # Admin, GM, Moderator & contact unit tests
│   │   ├── antiCheat.ts               # Authoritative multiplayer anti-cheat & movement/economy/siege auditor
│   │   ├── antiCheat.test.ts          # Speed-hack, teleport, economy inflation, sequence replay & quarantine tests
│   │   ├── architectOptimization.ts   # 17/11/2026 Software & Hardware Architect optimization engine
│   │   ├── architectOptimization.test.ts # CPU ISA, GPU, TDP, SoA memory & Lock-Free Job unit tests
│   │   ├── audio.ts                   # Procedural Web Audio API sound FX synthesizer
│   │   ├── avatarCloneShadow.ts       # MMORPG Avatar, Clone (Tactical/Combat/Cosmetic) & Shadow (Mimic/Echo/Boss) engine
│   │   ├── avatarCloneShadow.test.ts  # 4-row Comparison Matrix, Shadow Swap & 50-player Raid 200-entity delta tests
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
│   │   ├── godModeCharacter.ts        # Supreme Creator God Character, 12-Domain Immunity & 100 Omni-Attributes
│   │   ├── godModeCharacter.test.ts   # Fail-closed 12-Domain Immunity & 100 Omni-Attributes unit tests
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
│   │   ├── species.ts                 # 100-Species catalog (10 Core + 90 Omniverse), 3D mesh specs & Admin permission gate
│   │   ├── species.test.ts            # 100-Species catalog, 3D stature bounds & Admin permission unit tests
│   │   ├── systemValidation.ts        # 9-Pillar Cross-System Validation & Integrity Audit Engine (103 invariants)
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
├── .dockerignore                      # Excludes node_modules, dist, .git, .env, npm-debug.log & local artifacts
├── .editorconfig                      # Unified cross-IDE charset, LF endings, and indent defaults
├── .env.example                       # Environment variable template (safe placeholders; fail-closed in runtime)
├── .gitattributes                     # LF text normalization & binary file heuristics
├── .gitignore                         # Git ignore rules (node_modules, dist, build, data, .env, keystores)
├── .LOCAL_DEVELOPMENT.md              # Workstation boot sequence, Cloud SQL proxy & local QA loops
├── .pre-commit-config.yaml            # Pre-commit secret, YAML/JSON, Prettier, tsc & Firestore rule hooks
├── .prettierignore                    # Excluded paths for Prettier formatting checks
├── .prettierrc                        # Prettier code style configuration
├── Dockerfile                         # Multi-stage node:24-alpine build (non-root USER node) + optional nginx-runner
├── DEPLOYMENT.md                      # Docker build/run, fail-closed secrets & container verification guide
├── Justfile                           # Command runner shortcuts (just dev, just validate, just ops, just cpp-test)
├── ARCHITECTURE.md                    # System architecture & Functional Core / Imperative Shell guide
├── backups.md                         # Backup, Atomic .bak failover, Cloud SQL PITR & Firestore DR runbook
├── CHANGELOG.md                       # Chronological release history & v1.5.0 network spec
├── CMakeLists.txt                     # C++20 strict compiler flags & CTest configuration
├── CODE_OF_CONDUCT.md                 # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md                    # Developer setup, Guardrails, testing & PR guidelines
├── dependency.md                      # Full npm, devDependencies, security overrides & vcpkg.json ledger
├── deployment validation.md           # 4-Stage pre-deploy, verify:ops, Cloud SQL/Firestore & smoke gate
├── discipline.md                      # Engineering Discipline, Architect-First & Anti-Spaghetti Constitution
├── environment hardening.md           # Fail-closed secrets, HttpOnly cookies, CSRF, WS bounds & Firestore hardening
├── eslint.config.js                   # ESLint flat config enforcing @firebase/eslint-plugin-security-rules
├── EULA.md                            # End User License Agreement (EULA v1.5.0 · 17/11/2026)
├── firebase-applet-config.json        # Provisioned Firebase project & Firestore database identifiers
├── firebase-blueprint.json            # Canonical Firestore entity & collection JSON schemas
├── firestore.rules                    # Zero-trust default-deny Cloud Firestore security rules
├── firestore.rules.test.ts            # Firestore schema & Dirty Dozen #1–#12 adversarial security tests
├── Four-Path Cultivation.md           # Four-Path Cultivation guide, Getting Started & .env.example setup
├── GOVERNANCE.md                      # Project governance, RBAC hierarchy & RFC process
├── incident response.md               # SEV-1 to SEV-4 triage SLAs, quarantine pardons & recovery playbooks
├── in-game- economy -marketplace.md   # In-game Kingdom/Cultivation currencies, BigInt ledgers & Auction/Marketplace spec
├── index.html                         # HTML entry point & Google Fonts configuration
├── LEGAL.md                           # Complete 10-Agreement Legal Stack (ToS, Privacy/DPDP, Cookie, EULA, SaaS, OSS, AUP, SLA, DPA, MSA)
├── LICENSE                            # Apache License 2.0 (raw text)
├── LICENSE.md                         # Apache License 2.0 (formatted legal summary & full terms)
├── LORE.md                            # Imperial Lore, Auto-Populating Codex, 12 Annals & 10^100 Akashic Archive
├── metadata.json                      # Applet configuration & capabilities
├── monitoring.md                      # Live /healthz, /readyz, /api/ops/readiness & 20Hz latency SLO runbook
├── nginx.conf                         # Hardened non-root Nginx SPA configuration (port 8080, CSP, HSTS, /healthz)
├── NOTICE                             # Apache 2.0 Section 4(d) mandatory attribution notice
├── package.json                       # Project dependencies (pinned versions), metadata & npm scripts
├── Physics.md                         # 3D Physics, Object Collision (Elastic/Inelastic/Perfectly Inelastic), Momentum & Newton's 3rd Law spec
├── PRIVACY.md                         # User Privacy Policy (GDPR/CCPA/India DPDP Act 2023, localStorage, payments)
├── README.md                          # Project overview & documentation hub (this file)
├── real-world QA.md                   # Hardware GPU / Mobile ASTC / SwiftShader matrix & E2E QA scenarios
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

Every push and Pull Request automatically runs six strict Web/TypeScript/Security quality gates on Node.js `22` (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`):

1. **The Linter (`npm run lint` & `npm run lint:rules`)**: Runs `tsc --noEmit` with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled, plus `@firebase/eslint-plugin-security-rules` against `firestore.rules`.
2. **The Deprecation & Vulnerability Checker (`npm audit --audit-level=high`)**: Scans `package-lock.json` against known security vulnerabilities and outdated dependencies.
3. **The Formatter (`npx prettier --check .`)**: Enforces uniform formatting via `.prettierrc` so every file in the repository looks like it was written by a single author.
4. **The Regression & Security Test Suite (`npm test`)**: Runs all **187 unit, security, and regression tests across 30 decoupled TypeScript test files** (`src/game/*.test.ts`, `src/lib/*.test.ts`, and `firestore.rules.test.ts`).
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

### Automated Test Suites & Live Server Verification (`187/187 Passing` across 30 TypeScript Test Files + Live Ops Readiness + `CTest C++20`)

- **`adminModeration.test.ts`**: Verifies Root Administration, GM, Admin, Moderator & Official Contact RBAC privileges for `creatergame31@gmail.com`, explicit `UNTRUSTED_CLIENT_PREVIEW` trust boundary metadata, root immutability protection, player sanctions (`warn`, `mute`, `temp_ban`, `restore_active`, role grants), and support ticket routing.
- **`antiCheat.test.ts`**: Verifies authoritative multiplayer movement speed-hack & teleport rubberbanding, monotonic sequence replay rejection, resource/castle/realm delta inflation clamping, siege command cooldowns & `1T` rally caps, and automatic violation-score quarantine (`>=100` pts).
- **`avatarCloneShadow.test.ts`**: Verifies the 4-row `Clone` vs. `Shadow` vs. `Avatar` comparison matrix, Tactical Illusion / Combat Summon / Cosmetic Clone Avatar subtypes, Umbral Action Mimics, 3.0s Time Echoes, Dark Doppelgänger Bosses, instant Shadow Swap teleportation, per-Avatar duplication caps (`<=3` clones, `<=2` shadows), and 50-player Raid 200-entity `int16` delta-packet compression within the `20Hz` (`50ms`) server tick budget.
- **`openWorld3DEngine.test.ts`**: Verifies deterministic 2D/3D/4D `simplex-noise` multi-octave fBm biome & subterranean cavern synthesis, `three-mesh-bvh` (`MeshBVH`, `acceleratedRaycast`) O(log N) 3D picking & tree disposal, `cannon-es` rigid-body siege artillery trajectory & Citadel keep collision resolution, `@tweenjs/tween.js` camera orbit interpolation, and `resolveThreeDimensionalObjectCollision` (`Physics.md`: Conservation of Linear Momentum, Newton's Third Law Impulse symmetry, MTV collider separation, and Elastic / Inelastic / Perfectly Inelastic collision regimes).
- **`architectOptimization.test.ts`**: Verifies `17/11/2026` (`v1.5.0`) Hardware Architect CPU ISA profiles (`x86_64 AVX-512`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V RVV 1.0`), GPU compute backends, Thermal TDP envelopes, Software Architect `SoA` vs `AoS` cache efficiency, Lock-Free Work-Stealing Job DAG scaling, and Frame-Budget Auto-Scaler determinism.
- **`clanMath.test.ts`**: Validates clan level scaling, alliance vault donations (including bulk donation confirmation gate), territory war outpost assaults, and co-op boss damage milestones.
- **`cosmologicalTreeD3.test.ts`**: Verifies D3 hierarchy construction (`buildCosmologicalD3TreeData`) and Horizontal/Radial layout coordinate projection (`computeCosmologicalD3Layout`) from `THE_WHITE_PAGE` (`Tier 6`) and `OBLIVION_NOTHINGNESS` down through `Overvoid` (`Tier 5`) to leaf `Universe` (`Tier 1`) nodes.
- **`cultivationMath.test.ts`**: Verifies 4-path progression, `100.0x` Realm Suppression (Golden Core vs Qi Refinement), Karma degradation to Red Name, stationary Tribulation Lightning, disciple taxation, and aura visual states.
- **`dailyLogin.test.ts`**: Tests calendar day deltas, 7-day streak rollover, castle/realm reward scaling, and Veteran Lineage Scroll comprehension.
- **`eula.test.ts`**: Verifies the 10-article End User License Agreement (`EULA v1.5.0 · 17/11/2026`), the 10-Agreement Legal Compliance Stack (`LEGAL_DOCUMENT_STACK` & `LEGAL_QUICK_COMPARISON_MATRIX`), Dual-Layer `Apache-2.0` + Hosted Game Service scope, deterministic FNV-1a acceptance receipt hashing (`EULA-ACK-...`), compliance checks, and keyword/category filtering.
- **`godModeCharacter.test.ts`**: Verifies `creatergame31@gmail.com` fail-closed 12-Domain All-Things Immunity, all **100 Supreme Omni-Attributes across 5 Divine Pillars**, **Sovereign Divine Flight (`2.5x` speed, `45m` altitude, Citadel wall bypass)**, and **Sovereign Divine Teleportation (`8` Realm Waypoints, `+12m` Forward Astral Blink `[T]`, custom `(X, Y, Z)` coordinates)** (`GOD_OMNI_ATTRIBUTES`, `GOD_FLIGHT_SPEC`, `GOD_TELEPORT_SPEC`, `evaluateGodCharacterImmunity`, `evaluateGodFlightPermission`, `evaluateGodTeleportPermission`, `executeGodTeleportJump`), plus Max-Out God Character preset generation (`Castle Lv. 100`, `1,000T` T20 troops, Realm 22 L9 across all 4 Paths, VIP 3 Celestial Sovereign, `Lv. 999` Divine Heroes).
- **`graphicsEngine.test.ts`**: Validates PC/Console (`BC7 4K · LOD 0`) vs. Mobile (`ASTC · LOD Bias +1`) pipeline specs, shadow culling, addressable HD pack mounting, and the **Engineering Transparency Matrix (`6 Implemented / 2 Simulated / 0 Planned`)**.
- **`heroSkins.test.ts`**: Tests hero skin catalog lookups, stat bonuses, and particle aura application.
- **`loreHistory.test.ts`**: Verifies the 7 Grand Historical Epochs (`6+` sections each), 12 Imperial Dynastic Annals (`LORE_DYNASTIC_ANNALS`), Auto-Populating Open-World Lore Codex (8 spatial biomes + canonical/dynamic Lv. 1–1000 monster discovery & bounty claims), the `10^100`-Word Minimum Akashic Lore Stream (`generateGoogolScaleLoreScrollSlice` synthesizing `>= 1,000` real words/volume across `10^97` `BigInt` coordinates), 6 Sacred Compendium Codices, `comprehendLoreEpoch`, and full-text `searchLoreHistory`.
- **`marketplaceSparklineD3.test.ts`**: Verifies D3 market sparkline paths (`computeMarketplaceSparkline`) and **Bulk Trade Liquidity Score** calculations (`computeItemLiquidityScore`, `computeMarketplaceLiquidityRows`) across Depleted, Thin, Moderate, High, and Instant liquidity tiers from live NPC stock and average daily volume.
- **`math.test.ts`**: Validates 10-era transitions, multiplicative power rankings into the trillions, `1,000T` troop capacities, `1T` rallies, and T1–T20 troop balance.
- **`omniverse.test.ts`**: Verifies `COSMIC_LIMITS` (`WHITE_PAGE_COUNT: 1`, `OVERVOID_MAX_COUNT: 100`, `Infinity` for Tiers 1–4), `InfiniteCollection<T>`, the strict 6-Tier Nested Cosmological Tree (`WhitePageRoot` singleton → `100` bounded `Overvoid` instances → `Omniverse` → `Megaverse` / `Hyperverse` → `Multiverse` → `Universe` leaf), `attemptCreateOvervoid` hard cap enforcement (`> 100` rejected), `lazilyGenerateInfiniteTierSlice` procedural pagination, Tier 5 `Overvoid` logic overrides and Tier 1 `Universe` physics overrides (`evaluateEffectiveUniversePhysicsAndLogic`), all 100 Fictional Species Background NPCs (`TOP_100_OMNIVERSE_SPECIES_NPCS`), and Layer-6 White Page / House of Ideas authorial decrees.
- **`proceduralWorld.test.ts`**: Regression-tests 3D voxel terrain generation, castle era crystal upgrades, articulated NPC/Monster meshes, cultivator aura scene graphs, live `applyCrossPlatformPipeline` mutations (`THREE.LOD`, `InstancedMesh.count`, `normalScale`/`bumpScale`, small-prop shadow culling), and C++20 engine telemetry.
- **`serverAuth.test.ts`**: Verifies HMAC-SHA256 signed `HttpOnly` session cookies, timing-safe `VOXEL_ADMIN_PASSKEY` verification, fail-closed startup enforcement for missing/short/placeholder secrets in both production and development, `401`/`403` RBAC rejection, immediate role revocation re-evaluation, anti-tamper `/api/online/sync` field clamping, WebSocket command session binding, and email redaction on `/api/online/status`.
- **`serverHardening.test.ts`**: Verifies sliding-window rate limits, brute-force login lockout timers, Same-Origin CSRF checks, `verifyWebSocketOrigin` CSWSH protection, `resolveClientIpFromHeaders` trusted-proxy IP isolation, recursive prototype-pollution detection, fragmented/bounded RFC 6455 WebSocket decoding, 20Hz tick latency percentile tracking, and LRU/oldest commander pruning.
- **`serverPersistence.test.ts`**: Verifies SHA-256 signed save envelopes, atomic `fsync` + POSIX rename writes, automatic `.bak` failover recovery from truncated or checksum-tampered primary files, legacy v1 migration, and corrupt file quarantine.
- **`siegeNetProtocol.test.ts`**: Verifies `int16` spatial quantization (`0.01m` precision), `BigInt` wire serialization up to `1,000T`, 20Hz (`50ms`) `CohortDirtyBit` delta-compression and FNV-1a 32-bit state hash parity, `1T` War Rally assembly caps, 128-frame Client-Side Prediction (CSP) ring buffer reconciliation (Exact Match, Hermite Smoothing `<= 0.15m`, Hard Rollback `> 0.15m`), and 3-node Multi-Region Replication Quorum (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`).
- **`species.test.ts`**: Verifies all 100 playable species (`10 Core Solara Lineages + 90 Sovereign Omniverse Races #1–#100`) across Fantasy, Xianxia, and Cosmic lineages and Tiers 1–5, body scale bounds, `getSpeciesSpec` fallbacks, and `evaluateSpeciesSwitchPermission` Admin authorization (`creatergame31@gmail.com`).
- **`systemValidation.test.ts`**: Executes the 9-Pillar Cross-System Validation & Integrity Audit (`runFullSystemValidationReport`) verifying **103 invariants** across Root RBAC, 12-Domain Creator God Immunity, 100 Supreme Omni-Attributes across 5 Divine Pillars, Sovereign Divine Flight & Sovereign Divine Teleportation, EULA v1.5.0 & 10-Agreement Legal Stack (`creatergame31@gmail.com` + trust boundary tagging), 6-Tier Nested Cosmological Tree & 100 Omniverses, Imperial Lore (7 Epochs, 12 Annals, Auto-Populating Codex, `10^100` Akashic Corpus), 100 Playable Species / Races, `17/11/2026` Architect Matrix, `1,000T` Castle Math, `100.0x` Realm Suppression, Lv. 1–1000 World AI, and the Engineering Transparency Matrix, Server RBAC, 20Hz Siege Netcode, Anti-Cheat, Avatar/Clone/Shadow 200-Entity Raid Sync, 3D BVH/Simplex/Object Collision Engine (`Physics.md`) & Live WebGL2 Pipeline Mutations.
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
npm test                      # 4. Run all 187 TypeScript unit, liquidity, Gmail MIME, EULA/Legal & Firestore rule tests (30 test files)
clang-format --dry-run --Werror cpp/VoxelRealmsGuardrails.hpp cpp/engine_guardrail_test.cpp # 5. C++20 Format check
docker build -t my-app:prod . # 6. Build multi-stage non-root Node 24 Alpine production image (see DEPLOYMENT.md)
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
| **Source Code & Game Logic** | Developed with AI-assisted coding workflows; verified by strict TypeScript (`tsc --noEmit`) and 187 automated unit/rule tests | **No** (100% deterministic local simulation) |

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
- [x] `npm test` passes all 187 unit, liquidity, security, EULA/Legal, and Firestore rule tests across 30 TypeScript test files
- [x] `npm run validate` and `npm run verify:ops` pass cleanly against an isolated production server
- [x] `npm run build` succeeds with code-split chunks under `dist/`
- [x] Multi-stage non-root `Dockerfile`, `.dockerignore`, `nginx.conf`, and `DEPLOYMENT.md` are up to date
- [x] App runs in browser (`npm run dev`) with all core flows verified on desktop and mobile (`real-world QA.md`)
- [x] GitHub Actions CI Guardrails workflow (`.github/workflows/build.yml`), Release workflow (`.github/workflows/release.yml`), and Operational Runbooks (`discipline.md`, `deployment validation.md`, `monitoring.md`, `backups.md`, `environment hardening.md`, `incident response.md`) are up to date
- [x] Steam & Platform AI Disclosure documentation (`README.md`) is up to date
- [x] No `.env` secrets, API keys, OAuth tokens, or Android signing keystores (`*.jks`, `*.keystore`) are exposed

---

## 🛠️ Tech Stack

- **Framework**: React 19 (with `React.lazy` & `Suspense` on-demand modal code-splitting)
- **3D Graphics & Spatial Engine**: Three.js `0.187` (WebGL2 PBR + HDR Bloom + adaptive software fallback), `three-mesh-bvh` (`0.9.18` `MeshBVH` O(log N) raycasting), `simplex-noise` (`4.0.3` 2D/3D/4D procedural terrain/cavern synthesis), `cannon-es` (`0.20.0` 3D rigid-body physics, siege ballistics & 3-regime object collision solver [`Physics.md`](./Physics.md)), `@tweenjs/tween.js` (`25.0.0` camera & combat interpolation)
- **Hierarchy & Data Visualization**: D3.js (`d3-hierarchy`, `d3-zoom`, `d3-selection`)
- **Backend, Authoritative Anti-Cheat & Real-Time Networking**: Express 4 + Node.js HTTP & RFC 6455 WebSocket (`/ws/siege`) + Authoritative Anti-Cheat Engine (`src/game/antiCheat.ts`, `/api/online/anti-cheat`) + HMAC-SHA256 Sessions + Atomic `.bak` Persistence
- **Cloud Database & Auth**: Cloud SQL (PostgreSQL + Drizzle ORM), Firebase Authentication (`12.19.0`, Google Sign-In), Firebase Admin SDK (`14.5.1`), Cloud Firestore (`firestore.rules` + `firebase-blueprint.json`)
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

- **[International Open-World 3D MMORPG Standards (`3D-open-world-mmorgp-game-international-standard.md`)](./3D-open-world-mmorgp-game-international-standard.md)** — Cross-platform benchmark matrix (`Mobile 30–60 FPS`, `PC/Console 60–120 FPS`, `15–30 Hz` open-world server tick, `<120 ms` / `<80 ms` RTT, `5,000+` shard concurrency) and the 5 core international MMORPG pillars (`Network Architecture & Server Authority`, `3D World Streaming & Client Rendering`, `Gameplay Systems & Economy Design`, `International Legal/Security/Monetization Compliance`, and `LiveOps, Localization & Global Deployment`).
- **[3D Physics, Object Collision & Spatial Kinematics Specification (`Physics.md`)](./Physics.md)** — Conservation of Linear Momentum, Newton's Third Law Impulse symmetry, Elastic ($e=1.0$), Inelastic ($0<e<1.0$), and Perfectly Inelastic ($e=0.0$) collision regimes, Minimum Translation Vector (MTV) collider separation, `three-mesh-bvh` & `cannon-es` broadphase/narrowphase integration, and Sovereign Flight/Teleport collider bypass rules (`creatergame31@gmail.com`).
- **[Four-Path Immortal Cultivation & Local Dev Guide (`Four-Path Cultivation.md`)](./Four-Path%20Cultivation.md)** — Complete 23-Realm × 9-Layer matrix across Qi, Body, Soul, and Mind, `100.0x` Realm Suppression math, Karma & Red-Name justice, Master-Disciple lineage, Getting Started workflow, and `.env.example` environment variable guide.
- **[In-Game Economy & Marketplace Specification (`in-game- economy -marketplace.md`)](./in-game-%20economy%20-marketplace.md)** — Complete specification of the 8 core Kingdom & Cultivation currencies + Clan Honor Coins, lossless `BigInt` (`1,000T` troop / `1T` rally) ledger math, Marketplace & Auction House (`5%` escrow sink, soft-close anti-sniping, Jade Skill Scrolls), VIP discounts/stipends, and Root Creator Zero-Loss Economic Immunity (`creatergame31@gmail.com`).
- **[Imperial Lore & Cosmological History Codex (`LORE.md`)](./LORE.md)** — Complete 6-Layer Cosmic Ontology (`COSMIC_LIMITS`: `1` White Page Singleton → `100` Overvoids → `∞` Realities), 7 Grand Historical Epochs (`Epoch Ω-0`–`VI`), 12 Imperial Dynastic Annals, Auto-Populating Open-World Lore Codex (`Biomes` & `Monsters`), and `10^100`-Word Akashic Archive.
- **[Changelog (`CHANGELOG.md`)](./CHANGELOG.md)** — Curated, chronologically ordered log of notable features, fixes, and architecture schemas (`v1.0.0` – `v1.5.0` · `17/11/2026`).
- **[Project Roadmap (`ROADMAP.md`)](./ROADMAP.md)** — High-level vision and upcoming milestones (`v1.5.0` Software & Hardware Architect, `v1.5.1` 50v50 WebSocket Sieges, `v1.6.0` Secret Realms, `v1.7.0` WebGPU Flocking, `v2.0.0` Native C++20/Vulkan).

### Support & Technical Guidance

- **[Support Guide (`SUPPORT.md`)](./SUPPORT.md)** — Official Administration / GM / Moderator contact directory (`creatergame31@gmail.com`), in-app ticketing, and troubleshooting FAQ.
- **[Project Governance (`GOVERNANCE.md`)](./GOVERNANCE.md)** — Decision-making structure, RBAC clearance hierarchy (`Lv. 999` Root Owner down to `Lv. 1`), and Architect-First RFC workflow.
- **[System Architecture (`ARCHITECTURE.md`)](./ARCHITECTURE.md)** — Technical deep-dive into the Functional Core / Imperative Shell pattern, `BigInt` trillion-scale math, A\* pathfinding, and 3D PBR rendering.
- **[Contributing Guide (`CONTRIBUTING.md`)](./CONTRIBUTING.md)** — How to set up the repo, run tests, and submit Pull Requests.

### Operational Runbooks, Engineering Discipline & QA Playbooks

- **[Engineering Discipline & Anti-Spaghetti Constitution (`discipline.md`)](./discipline.md)** — Functional Core / Imperative Shell boundaries, Architect-First pre-flight rules, 3–4 feature refactor cadence, `BigInt` precision, Three.js WebGL2 disposal, and C++20 smart-pointer guardrails.
- **[Containerized Deployment Guide (`DEPLOYMENT.md`)](./DEPLOYMENT.md)** — Multi-stage `node:24-alpine` Docker build (`Dockerfile`, `.dockerignore`, optional `--target nginx-runner` with `nginx.conf`), mandatory fail-closed production secrets, persistent volume mounting, and `/healthz` + `/readyz` + security header verification.
- **[Deployment Validation Runbook (`deployment validation.md`)](./deployment%20validation.md)** — 4-stage pre-deploy, live ops harness (`npm run verify:ops`), Cloud SQL / Firestore rules sync, and post-deploy smoke & rollback criteria.
- **[Observability, Telemetry & Monitoring Runbook (`monitoring.md`)](./monitoring.md)** — Live `/healthz`, `/readyz`, `/api/ops/readiness`, `/api/online/status`, and `/api/online/anti-cheat` probes, Four Golden Signals, `20Hz` (`50ms`) siege tick latency SLOs, and `securityAuditLog` events.
- **[Backup, Persistence & Disaster Recovery Runbook (`backups.md`)](./backups.md)** — RPO/RTO matrix, `AtomicRealmPersistence` (`.tmp` → `fsync` → SHA-256 `.bak` → POSIX rename), Cloud SQL `pg_dump`/`pg_restore`, and Firestore GCS export/import drills.
- **[Environment, Runtime & Infrastructure Hardening (`environment hardening.md`)](./environment%20hardening.md)** — Fail-closed production secret validation (`VOXEL_SESSION_SECRET`, `VOXEL_ADMIN_PASSKEY`), `HttpOnly` HMAC-SHA256 cookies, CSRF/prototype-pollution defenses, global state isolation, RFC 6455 WebSocket Origin/proxy-IP/frame bounds, and zero-trust `firestore.rules`.
- **[Real-World QA & Acceptance Playbook (`real-world QA.md`)](./real-world%20QA.md)** — Hardware GPU vs. Mobile ASTC vs. Software WebGL2 device matrix, end-to-end functional scenarios (including Avatar/Clone/Shadow & 50v50 Siege), and adversarial/network-jitter playbooks.
- **[Incident Response, Quarantine & Recovery Runbook (`incident response.md`)](./incident%20response.md)** — `SEV-1`–`SEV-4` triage SLAs, live recovery playbooks, GM anti-cheat quarantine pardons, emergency secret rotation, and blameless post-mortem template.

### Automation & GitHub Templates (`.github/`)

- **[Pull Request Templates (`.github/PULL_REQUEST_TEMPLATE.md` & `.github/PULL_REQUEST_TEMPLATE/`)](./.github/PULL_REQUEST_TEMPLATE.md)** — Default PR checklist plus specialized [`hotfix.md`](./.github/PULL_REQUEST_TEMPLATE/hotfix.md), [`breaking_change.md`](./.github/PULL_REQUEST_TEMPLATE/breaking_change.md), [`architecture_change.md`](./.github/PULL_REQUEST_TEMPLATE/architecture_change.md), and [`lore_addition.md`](./.github/PULL_REQUEST_TEMPLATE/lore_addition.md).
- **[Issue & Discussion Templates (`.github/ISSUE_TEMPLATE/` & `.github/DISCUSSION_TEMPLATE/`)](./.github/ISSUE_TEMPLATE.md)** — Config redirect ([`config.yml`](./.github/ISSUE_TEMPLATE/config.yml)), [`bug_report.md`](./.github/ISSUE_TEMPLATE/bug_report.md), [`feature_request.md`](./.github/ISSUE_TEMPLATE/feature_request.md), [`release_checklist.md`](./.github/ISSUE_TEMPLATE/release_checklist.md), [`security_vulnerability.md`](./.github/ISSUE_TEMPLATE/security_vulnerability.md), [`performance_regression.md`](./.github/ISSUE_TEMPLATE/performance_regression.md), [`incident_report.md`](./.github/ISSUE_TEMPLATE/incident_report.md), [`lore_inconsistency.md`](./.github/ISSUE_TEMPLATE/lore_inconsistency.md), [`balance_feedback.md`](./.github/ISSUE_TEMPLATE/balance_feedback.md), [`tech_debt.md`](./.github/ISSUE_TEMPLATE/tech_debt.md), [`documentation_gap.md`](./.github/ISSUE_TEMPLATE/documentation_gap.md), and Discussions (`announcements.yml`, `ideas.yml`, `q-and-a.yml`).
- **[GitHub Configs & Workflows (`.github/workflows/`)](./.github/workflows/build.yml)** — [`CODEOWNERS`](./.github/CODEOWNERS), [`CODE_OF_CONDUCT_ENFORCEMENT.md`](./.github/CODE_OF_CONDUCT_ENFORCEMENT.md), [`FUNDING.yml`](./.github/FUNDING.yml), [`dependabot.yml`](./.github/dependabot.yml), [`.github/release.yml`](./.github/release.yml), and all 10 standardized workflows (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, `actions/stale@v11`): [`build.yml`](./.github/workflows/build.yml), [`release.yml`](./.github/workflows/release.yml), [`ci.yml`](./.github/workflows/ci.yml), [`cd.yml`](./.github/workflows/cd.yml), [`docs_deploy.yml`](./.github/workflows/docs_deploy.yml), [`nightly_build.yml`](./.github/workflows/nightly_build.yml), [`security_audit.yml`](./.github/workflows/security_audit.yml), [`lint_and_format.yml`](./.github/workflows/lint_and_format.yml), [`release_drafter.yml`](./.github/workflows/release_drafter.yml), and [`stale_issues.yml`](./.github/workflows/stale_issues.yml).

### Extended Engineering, SRE, QA, Security, Cultivation & Legal Suite

- **Core Repository & Governance (`25` Docs)**: [`VISION.md`](./VISION.md), [`MANIFESTO.md`](./MANIFESTO.md), [`PHILOSOPHY.md`](./PHILOSOPHY.md), [`PRINCIPLES.md`](./PRINCIPLES.md), [`AUTHORS.md`](./AUTHORS.md), [`MAINTAINERS.md`](./MAINTAINERS.md), [`CREDITS.md`](./CREDITS.md), [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md), [`ONBOARDING.md`](./ONBOARDING.md), [`.LOCAL_DEVELOPMENT.md`](./.LOCAL_DEVELOPMENT.md), [`CLI_REFERENCE.md`](./CLI_REFERENCE.md), [`DEBUGGING_GUIDE.md`](./DEBUGGING_GUIDE.md), [`STYLE_GUIDE.md`](./STYLE_GUIDE.md), [`CODING_STANDARDS.md`](./CODING_STANDARDS.md), [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md), [`COMMUNITY_GUIDELINES.md`](./COMMUNITY_GUIDELINES.md), [`GLOSSARY.md`](./GLOSSARY.md), [`FAQ.md`](./FAQ.md), [`RELEASE_NOTES.md`](./RELEASE_NOTES.md), [`MIGRATION.md`](./MIGRATION.md), [`DEPRECATION_POLICY.md`](./DEPRECATION_POLICY.md), [`UPGRADING.md`](./UPGRADING.md), [`DECISION_LOG.md`](./DECISION_LOG.md), [`COMMUNICATION_CHANNELS.md`](./COMMUNICATION_CHANNELS.md), [`MEETING_NOTES.md`](./MEETING_NOTES.md).
- **Architecture, Simulation, Physics, International MMORPG Standards, Tooling & RFCs (`36` Docs + Configs)**: [`3D-open-world-mmorgp-game-international-standard.md`](./3D-open-world-mmorgp-game-international-standard.md), [`Physics.md`](./Physics.md), [`dependency.md`](./dependency.md), [`BUILD_SYSTEM.md`](./BUILD_SYSTEM.md), [`FEATURE_FLAGS.md`](./FEATURE_FLAGS.md), [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md), [`DOMAIN_MODEL.md`](./DOMAIN_MODEL.md), [`DATA_DICTIONARY.md`](./DATA_DICTIONARY.md), [`DATA_PIPELINE.md`](./DATA_PIPELINE.md), [`SCHEMA_EVOLUTION.md`](./SCHEMA_EVOLUTION.md), [`API_SPEC.md`](./API_SPEC.md), [`PROTOCOL_SPEC.md`](./PROTOCOL_SPEC.md), [`STATE_MACHINE.md`](./STATE_MACHINE.md), [`EVENT_CATALOG.md`](./EVENT_CATALOG.md), [`EVENT_SCHEMA_REGISTRY.md`](./EVENT_SCHEMA_REGISTRY.md), [`ANALYTICS_TAXONOMY.md`](./ANALYTICS_TAXONOMY.md), [`RNG_AND_SEEDING.md`](./RNG_AND_SEEDING.md), [`SIMULATION_TICK_LOOP.md`](./SIMULATION_TICK_LOOP.md), [`AI_BEHAVIOR_TREES.md`](./AI_BEHAVIOR_TREES.md), [`PLUGIN_ARCHITECTURE.md`](./PLUGIN_ARCHITECTURE.md), [`MODDING_API.md`](./MODDING_API.md), [`CONCURRENCY_MODEL.md`](./CONCURRENCY_MODEL.md), [`MEMORY_MANAGEMENT.md`](./MEMORY_MANAGEMENT.md), [`CACHING_STRATEGY.md`](./CACHING_STRATEGY.md), [`NETWORK_TOPOLOGY.md`](./NETWORK_TOPOLOGY.md), [`STORAGE_ENGINE.md`](./STORAGE_ENGINE.md), [`DEPENDENCY_POLICY.md`](./DEPENDENCY_POLICY.md), [`PERFORMANCE_BENCHMARKS.md`](./PERFORMANCE_BENCHMARKS.md), [`TECH_DEBT.md`](./TECH_DEBT.md), [`SCALABILITY_MATRIX.md`](./SCALABILITY_MATRIX.md), [`RFC_PROCESS.md`](./RFC_PROCESS.md), [`docs/rfcs/TEMPLATE.md`](./docs/rfcs/TEMPLATE.md), [`docs/adr/0001-record-architecture-decisions.md`](./docs/adr/0001-record-architecture-decisions.md), [`docs/adr/TEMPLATE.md`](./docs/adr/TEMPLATE.md), [`Justfile`](./Justfile), [`.editorconfig`](./.editorconfig), [`.gitattributes`](./.gitattributes), [`.gitignore`](./.gitignore), [`.pre-commit-config.yaml`](./.pre-commit-config.yaml).
- **SRE, DevOps & Operational Discipline (`26` Docs)**: [`runbooks.md`](./runbooks.md), [`playbooks.md`](./playbooks.md), [`disaster_recovery.md`](./disaster_recovery.md), [`business_continuity.md`](./business_continuity.md), [`slo_sla_sli.md`](./slo_sla_sli.md), [`error_budgets.md`](./error_budgets.md), [`alerting_matrix.md`](./alerting_matrix.md), [`on_call_rotation.md`](./on_call_rotation.md), [`postmortem_template.md`](./postmortem_template.md), [`blameless_retrospective.md`](./blameless_retrospective.md), [`root_cause_analysis.md`](./root_cause_analysis.md), [`rollback_procedures.md`](./rollback_procedures.md), [`zero_downtime_migrations.md`](./zero_downtime_migrations.md), [`canary_deployments.md`](./canary_deployments.md), [`chaos_engineering.md`](./chaos_engineering.md), [`capacity_planning.md`](./capacity_planning.md), [`load_testing.md`](./load_testing.md), [`stress_testing.md`](./stress_testing.md), [`observability_pipeline.md`](./observability_pipeline.md), [`telemetry_spec.md`](./telemetry_spec.md), [`log_aggregation.md`](./log_aggregation.md), [`tracing.md`](./tracing.md), [`secrets_management.md`](./secrets_management.md), [`key_rotation.md`](./key_rotation.md), [`immutable_infrastructure.md`](./immutable_infrastructure.md), [`cost_optimization.md`](./cost_optimization.md).
- **Quality Assurance & Verification (`15` Docs)**: [`test_strategy.md`](./test_strategy.md), [`test_harness.md`](./test_harness.md), [`edge_cases.md`](./edge_cases.md), [`invariants.md`](./invariants.md), [`regression_suite.md`](./regression_suite.md), [`smoke_tests.md`](./smoke_tests.md), [`soak_testing.md`](./soak_testing.md), [`fuzz_testing.md`](./fuzz_testing.md), [`uat_checklist.md`](./uat_checklist.md), [`bug_triage_protocol.md`](./bug_triage_protocol.md), [`severity_definitions.md`](./severity_definitions.md), [`compatibility_matrix.md`](./compatibility_matrix.md), [`accessibility_qa.md`](./accessibility_qa.md), [`localization_qa.md`](./localization_qa.md), [`determinism_validation.md`](./determinism_validation.md).
- **Security, Threat Modeling & Cryptography (`18` Docs)**: [`THREAT_MODEL.md`](./THREAT_MODEL.md), [`ATTACK_SURFACE.md`](./ATTACK_SURFACE.md), [`TRUST_BOUNDARIES.md`](./TRUST_BOUNDARIES.md), [`ZERO_TRUST_POLICY.md`](./ZERO_TRUST_POLICY.md), [`VULNERABILITY_DISCLOSURE.md`](./VULNERABILITY_DISCLOSURE.md), [`BUG_BOUNTY.md`](./BUG_BOUNTY.md), [`PENETRATION_TESTING.md`](./PENETRATION_TESTING.md), [`CRYPTOGRAPHY_SPEC.md`](./CRYPTOGRAPHY_SPEC.md), [`ACCESS_CONTROL.md`](./ACCESS_CONTROL.md), [`RBAC_MATRIX.md`](./RBAC_MATRIX.md), [`AUTH_FLOWS.md`](./AUTH_FLOWS.md), [`AUDIT_LOGGING.md`](./AUDIT_LOGGING.md), [`SUPPLY_CHAIN_SECURITY.md`](./SUPPLY_CHAIN_SECURITY.md), [`SBOM.md`](./SBOM.md), [`SANDBOXING.md`](./SANDBOXING.md), [`DATA_CLASSIFICATION.md`](./DATA_CLASSIFICATION.md), [`DATA_RETENTION.md`](./DATA_RETENTION.md), [`INCIDENT_FORENSICS.md`](./INCIDENT_FORENSICS.md).
- **Cultivation, Worldbuilding, Economy & Game Systems (`40` Docs)**: [`COSMOLOGY.md`](./COSMOLOGY.md), [`CREATION_MYTH.md`](./CREATION_MYTH.md), [`TIMELINE_OF_ERAS.md`](./TIMELINE_OF_ERAS.md), [`WORLD_GEOGRAPHY.md`](./WORLD_GEOGRAPHY.md), [`REALMS_AND_TIERS.md`](./REALMS_AND_TIERS.md), [`BREAKTHROUGH_MECHANICS.md`](./BREAKTHROUGH_MECHANICS.md), [`TRIBULATION_SYSTEM.md`](./TRIBULATION_SYSTEM.md), [`ASCENSION_PROTOCOL.md`](./ASCENSION_PROTOCOL.md), [`QI_ECONOMY.md`](./QI_ECONOMY.md), [`in-game- economy -marketplace.md`](./in-game-%20economy%20-marketplace.md), [`AUCTION_HOUSE_MECHANICS.md`](./AUCTION_HOUSE_MECHANICS.md), [`SECLUSION_AND_MEDITATION.md`](./SECLUSION_AND_MEDITATION.md), [`DUAL_CULTIVATION_AND_BONDS.md`](./DUAL_CULTIVATION_AND_BONDS.md), [`DEMONIC_VS_RIGHTEOUS_PATHS.md`](./DEMONIC_VS_RIGHTEOUS_PATHS.md), [`FORBIDDEN_TECHNIQUES.md`](./FORBIDDEN_TECHNIQUES.md), [`POCKET_REALMS_AND_GROTTOES.md`](./POCKET_REALMS_AND_GROTTOES.md), [`CALAMITIES_AND_EXTINCTIONS.md`](./CALAMITIES_AND_EXTINCTIONS.md), [`LANGUAGE_AND_RUNES.md`](./LANGUAGE_AND_RUNES.md), [`MERIDIAN_SYSTEM.md`](./MERIDIAN_SYSTEM.md), [`SPIRIT_ROOTS.md`](./SPIRIT_ROOTS.md), [`SOUL_IMPRINTING.md`](./SOUL_IMPRINTING.md), [`MIND_DEMONS.md`](./MIND_DEMONS.md), [`KARMA_AND_DAO.md`](./KARMA_AND_DAO.md), [`HEAVENLY_LAWS.md`](./HEAVENLY_LAWS.md), [`BLOODLINE_INHERITANCE.md`](./BLOODLINE_INHERITANCE.md), [`PHYSIQUES.md`](./PHYSIQUES.md), [`SECT_HIERARCHY.md`](./SECT_HIERARCHY.md), [`FACTION_DIPLOMACY.md`](./FACTION_DIPLOMACY.md), [`REPUTATION_SYSTEM.md`](./REPUTATION_SYSTEM.md), [`ALCHEMY_AND_PILLS.md`](./ALCHEMY_AND_PILLS.md), [`ARTIFACT_FORGING.md`](./ARTIFACT_FORGING.md), [`FORMATION_ARRAYS.md`](./FORMATION_ARRAYS.md), [`TALISMAN_INSCRIPTION.md`](./TALISMAN_INSCRIPTION.md), [`BEAST_COMPENDIUM.md`](./BEAST_COMPENDIUM.md), [`HERBOLOGY_INDEX.md`](./HERBOLOGY_INDEX.md), [`RELICS_AND_TREASURES.md`](./RELICS_AND_TREASURES.md), [`COMBAT_FORMULAS.md`](./COMBAT_FORMULAS.md), [`TECHNIQUE_SYNERGIES.md`](./TECHNIQUE_SYNERGIES.md), [`DAMAGE_TAXONOMY.md`](./DAMAGE_TAXONOMY.md), [`BALANCE_PHILOSOPHY.md`](./BALANCE_PHILOSOPHY.md).
- **Legal, Compliance & Trust (`17` Docs)**: [`ACCEPTABLE_USE_POLICY.md`](./ACCEPTABLE_USE_POLICY.md), [`COOKIE_POLICY.md`](./COOKIE_POLICY.md), [`DATA_PROCESSING_AGREEMENT.md`](./DATA_PROCESSING_AGREEMENT.md), [`GDPR_COMPLIANCE.md`](./GDPR_COMPLIANCE.md), [`CCPA_COMPLIANCE.md`](./CCPA_COMPLIANCE.md), [`EXPORT_COMPLIANCE.md`](./EXPORT_COMPLIANCE.md), [`PATENTS.md`](./PATENTS.md), [`TRADEMARKS.md`](./TRADEMARKS.md), [`COPYRIGHT.md`](./COPYRIGHT.md), [`DMCA_POLICY.md`](./DMCA_POLICY.md), [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md), [`OPEN_SOURCE_LICENSES.md`](./OPEN_SOURCE_LICENSES.md), [`SUBPROCESSORS.md`](./SUBPROCESSORS.md), [`WAIVER.md`](./WAIVER.md), [`ETHICS.md`](./ETHICS.md), [`AI_USAGE_POLICY.md`](./AI_USAGE_POLICY.md), [`CONTENT_MODERATION_POLICY.md`](./CONTENT_MODERATION_POLICY.md).
- **Platform Engineering, Console, Mobile & Spatial VR Targets (`9` Docs)**: [`Windows.md`](./Windows.md), [`PC.md`](./PC.md), [`playstation.md`](./playstation.md), [`xbox.md`](./xbox.md), [`mac.md`](./mac.md), [`linux.md`](./linux.md), [`iOS.md`](./iOS.md), [`android.md`](./android.md), [`Virtual Reality.md`](./Virtual%20Reality.md).

#### Complete Repository Markdown Inventory (`226` Verified `.md` Files)

| Documentation Domain                                          | File Count | Verification Gate                                                                                                       |
| :------------------------------------------------------------ | :--------: | :---------------------------------------------------------------------------------------------------------------------- |
| **Primary Hub, Legal, History & Support Guides**              |    `16`    | `README.md`, `LEGAL.md`, `EULA.md`, `LORE.md`, `Four-Path Cultivation.md`, `CHANGELOG.md`, etc.                         |
| **Operational Runbooks, Container Deploy, Discipline & QA**   |    `8`     | `DEPLOYMENT.md`, `discipline.md`, `deployment validation.md`, `monitoring.md`, `backups.md`, `real-world QA.md`         |
| **GitHub Issue, PR & Code of Conduct Templates (`.github/`)** |    `17`    | `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE/*`, `CODE_OF_CONDUCT_ENFORCEMENT.md`                         |
| **Core Repository, Onboarding & Governance**                  |    `25`    | `VISION.md` – `MEETING_NOTES.md`, `.LOCAL_DEVELOPMENT.md`, `CLI_REFERENCE.md`, `DOC_CONVENTIONS.md`                     |
| **Architecture, Simulation, Physics, Tooling, ADRs & RFCs**   |    `34`    | `3D-open-world-mmorgp-game-international-standard.md`, `Physics.md`, `dependency.md`, `SYSTEM_DESIGN.md` – `docs/adr/*` |
| **SRE, DevOps & Operational Discipline**                      |    `26`    | `runbooks.md` – `cost_optimization.md`                                                                                  |
| **Quality Assurance & Verification**                          |    `15`    | `test_strategy.md` – `determinism_validation.md`, `invariants.md` (`103` invariants)                                    |
| **Security, Threat Modeling & Cryptography**                  |    `19`    | `THREAT_MODEL.md` – `INCIDENT_FORENSICS.md`, `security_spec.md`                                                         |
| **Cultivation, Worldbuilding, Economy & Game Systems**        |    `40`    | `COSMOLOGY.md` – `BALANCE_PHILOSOPHY.md`, `in-game- economy -marketplace.md`                                            |
| **Legal, Compliance & Trust**                                 |    `17`    | `ACCEPTABLE_USE_POLICY.md` – `CONTENT_MODERATION_POLICY.md`                                                             |
| **Platform Engineering, Console, Mobile & Spatial VR**        |    `9`     | `Windows.md`, `PC.md`, `playstation.md`, `xbox.md`, `mac.md`, `linux.md`, `iOS.md`, `android.md`, `Virtual Reality.md`  |
| **Total Tracked Markdown Files in Repository**                | **`226`**  | **100% Indexed in `README.md` · Verified by `.github/workflows/docs_deploy.yml` & Prettier**                            |

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
