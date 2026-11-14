# Changelog

All notable changes to the **Voxel Realms RPG** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned (`v1.6.0+` Roadmap)

- Procedural dungeon delves with ancient Dao relics and heavenly tribulations (`src/game/dungeons.ts` & `src/game/dungeons.test.ts`).
- WebGPU compute shader upgrade for 10,000+ simultaneous flocking entities.

### Implemented Specification — `v1.5.0` Authoritative 20Hz 50v50 Castle Siege WebSocket Network Protocol & Multi-Region Persistence (`src/game/siegeNetProtocol.ts` & `server.ts`)

In accordance with the **Architect-First** guardrail in `CONTRIBUTING.md` (which **• helps prevent early design flaws**), this specification defines the deterministic client-server WebSocket protocol implemented in `src/game/siegeNetProtocol.ts`, `src/game/siegeNetProtocol.test.ts`, `server.ts` (`/ws/siege` & `/api/online/*`), and `src/components/ClanTerritoryMap.tsx` for 50v50 clan territory castle sieges (`TerritoryGridSector` `A1`–`C3`), reconciling up to `1,000T` (`10^15`) total troops and `1T` (`10^12`) coordinated rallies without IEEE-754 floating-point precision loss.

#### 1. Transport Layer & Tick Topology

- **Authoritative Server Tick (`20 Hz` / `50 ms`)**: The siege authority evaluates combat resolution, troop counter-matrix multipliers (`shieldbearer` > `shooter` > `bomber` > `shieldbearer`), cultivation realm suppression (`10^ΔRealm`), and fortification damage every `50 ms`.
- **Client Command Stream (`60 Hz` Local Prediction)**: Clients sample movement and formation directives locally, tagging each outgoing command with a monotonically increasing `seq` ID and local `clientTick`.
- **Trillion-Scale `BigInt` Wire Serialization**: All troop counts, HP pools, and power ratings (`bigint` in `src/types/game.ts`) are serialized over JSON/MessagePack frames as unsigned decimal or hex string literals (`BigIntWireString`, e.g. `"1000000000000"` for `1T`) to prevent `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`) truncation.
- **Spatial Quantization**: World coordinates `(x, z)` across the `40×40` procedural chunk grid are quantized to signed 16-bit fixed-point integers (`int16`, `0.01` world-unit precision, range `[-327.68, +327.67]`) during delta transmission.

#### 2. Wire Envelope & Opcode Registry

Every WebSocket frame is wrapped in a deterministic `SiegeNetEnvelope` header containing sequence tracking and an FNV-1a / CRC32 state digest for desync detection:

```typescript
export type SiegeNetOpcode =
  | 0x01 // C2S_TROOP_POSITION_CMD   (Client -> Server: Cohort waypoint / formation command)
  | 0x02 // C2S_RALLY_ACTION_CMD     (Client -> Server: Initiate, join, or launch 1T siege rally)
  | 0x10 // S2C_FULL_SIEGE_SNAPSHOT  (Server -> Client: Keyframe baseline state on join / resync)
  | 0x11 // S2C_DELTA_SIEGE_UPDATE   (Server -> Client: 20Hz bitmask delta-compressed tick frame)
  | 0x12 // S2C_RALLY_STATUS_SYNC    (Server -> Client: Authoritative 1T rally state & contributors)
  | 0x13; // S2C_RECONCILIATION_FAULT (Server -> Client: State hash mismatch / forced rollback)

export type TerritorySectorCode = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';

export interface SiegeNetEnvelope<TPayload> {
  v: 1; // Protocol schema version (v1.5.0 = 1)
  op: SiegeNetOpcode; // Packet opcode
  tick: number; // Authoritative server simulation tick (uint32)
  ts: number; // Server monotonic epoch timestamp in ms
  seq: number; // Packet sequence number (uint32)
  ack: number; // Last processed client command sequence ID (for CSP reconciliation)
  sector: TerritorySectorCode; // Contested territory sector (e.g., 'B2' Dragon Spire, 'C3' Chronos Dread Keep)
  stateHash: number; // 32-bit FNV-1a checksum of authoritative sector state at `tick`
  payload: TPayload;
}
```

#### 3. Packet Structure I: Troop Positioning & Cohort Kinematics (`0x01` / Snapshot Cohort State)

Represents client movement intents (`C2S_TROOP_POSITION_CMD`) and authoritative cohort kinematics within a contested sector. Supports tactical formations introduced in v1.3.0 (`SHIELD_WALL`, `PHALANX_ADVANCE`, `WEDGE_CHARGE`, `LOOSE_SKIRMISH`).

```typescript
export type SiegeFormationType =
  | 'SHIELD_WALL' // +35% frontal defense, -25% march speed
  | 'PHALANX_ADVANCE' // Balanced anti-charge formation
  | 'WEDGE_CHARGE' // +30% breakthrough impact vs gates/lines
  | 'LOOSE_SKIRMISH'; // -40% AoE trebuchet/cataclysm vulnerability

export type CohortCombatPosture =
  'MARCHING' | 'ENGAGING_MELEE' | 'VOLLEY_FIRING' | 'BOMBARDING_WALL' | 'ROUTED_RETREAT';

/**
 * Client-to-Server command packet (Opcode 0x01) for predictive cohort positioning.
 */
export interface TroopPositionCommandPacket {
  clientCmdSeq: number; // Monotonic client input sequence ID
  clientTick: number; // Client tick when command was issued
  cohortId: string; // Unique cohort UUID (e.g., "cohort_alpha_01")
  lordId: string; // Issuing player UUID
  originQ: [number, number]; // Quantized start [x_int16, z_int16] (1 unit = 0.01m)
  waypointsQ: [number, number][]; // Up to 8 quantized A* path waypoints
  formation: SiegeFormationType;
  targetEntityId?: string; // Optional enemy cohort ID, gate ID, or outpost obelisk ID
}

/**
 * Authoritative cohort positioning state inside S2C snapshots (0x10) and delta frames (0x11).
 */
export interface AuthoritativeCohortState {
  cohortId: string;
  lordId: string;
  lordName: string;
  clanTag: string;
  controller: 'player_clan' | 'enemy_clan';
  troopType: 'shieldbearer' | 'shooter' | 'bomber';
  tier: number; // T1 to T20
  unitCount: string; // BigInt serialized string (up to "1000000000000000" / 1000T)
  powerRating: string; // Multiplicative BigInt power serialized string
  cultivationRealmId: number; // 0 (Qi Refinement) .. 22 (Ultimate Origin) for 10^ΔRealm suppression
  posQ: [number, number]; // Quantized [x_int16, z_int16]
  velQ: [number, number]; // Quantized velocity vector [vx_int16, vz_int16]
  headingMillirad: number; // Facing angle in milliradians (-3142 to +3142)
  formation: SiegeFormationType;
  posture: CohortCombatPosture;
  moraleBps: number; // Morale in basis points (0 .. 10000 = 0.00% .. 100.00%)
  targetEntityId: string | null;
}
```

#### 4. Packet Structure II: Rally Status & 1-Trillion Siege Assembly (`0x02` / `0x12`)

Synchronizes multi-lord war rallies (`ActiveRally` in `src/types/game.ts`) targeting enemy citadels, sector obelisks, or World Titans. Enforces the `1,000,000,000,000` (`1T`) rally cap, contributor troop composition breakdown, and attached siege engines.

```typescript
export type SiegeRallyPhase =
  | 'PREPARING' // Gathering contributor legions inside muster window
  | 'MARCHING' // En route across sector causeways
  | 'SIEGE_CLASH' // Actively bombarding gates / clashing with garrison
  | 'BREACHED' // Outer fortification destroyed; inner sanctum assault
  | 'RESOLVED' // Victory or repulsion finalized
  | 'CANCELLED'; // Aborted by rally leader or leader disconnected

export interface SiegeWeaponAttachment {
  batteringRams: number; // 1000T gate-crushing force units
  trebuchets: number; // Long-range AoE stone wall artillery
  ballistas: number; // Armor-piercing anti-titan/anti-shield ballistas
  siegeTowers: number; // Wall-scaling infantry deployment towers
}

export interface RallyContributorSlot {
  lordId: string;
  lordName: string;
  heroId: string;
  cultivationRealmId: number;
  troopType: 'shieldbearer' | 'shooter' | 'bomber';
  tier: number; // 1..20
  committedTroops: string; // BigInt string (e.g., "125000000000")
  rallyBonusPct: number; // Hero + Clan Tech rally bonus percentage
  joinedAtTick: number;
}

/**
 * Server-to-Client authoritative rally state broadcast (Opcode 0x12).
 */
export interface RallyStatusSyncPacket {
  rallyId: string;
  sectorCode: TerritorySectorCode;
  targetOutpostId: string; // e.g., "outpost_chronos_dreadkeep" or monster ID
  initiatorLordId: string;
  initiatorName: string;
  clanId: string;
  clanTag: string;
  phase: SiegeRallyPhase;
  currentTroops: string; // BigInt string sum of all contributors
  maxRallyCapacity: string; // BigInt string (up to "1000000000000" / 1 Trillion)
  compositeAttackPower: string; // Aggregate BigInt strike power including realm & counter bonuses
  launchTick: number; // Server tick when march initiates
  impactTick: number; // Predicted server tick of gate contact
  timeLeftMs: number; // Remaining muster or march countdown in ms
  siegeEngines: SiegeWeaponAttachment;
  contributors: RallyContributorSlot[];
}
```

#### 5. Packet Structure III: Delta-Compressed State Updates (`0x11` `S2C_DELTA_SIEGE_UPDATE`)

To sustain 50v50 battles (`100` active lords, `300+` autonomous cohorts, and destructible fortifications) within `< 45 KB/s` per client at `20 Hz`, the server transmits delta frames referenced against the client's last acknowledged `baseTick`. Unchanged fields are omitted via a 16-bit `dirtyMask`.

```typescript
/**
 * Bitmask flags indicating which properties are present in a CohortDeltaRecord.
 */
export const enum CohortDirtyBit {
  POS_DELTA = 1 << 0, // 0x0001: dxQ, dzQ varint offsets present
  VEL_DELTA = 1 << 1, // 0x0002: dvxQ, dvzQ velocity deltas present
  HEADING_DELTA = 1 << 2, // 0x0004: dHeadingMillirad present
  UNIT_COUNT_DELTA = 1 << 3, // 0x0008: deltaUnits (signed BigInt string) & new unitCount present
  FORMATION_CHANGE = 1 << 4, // 0x0010: formation updated
  POSTURE_CHANGE = 1 << 5, // 0x0020: posture updated
  MORALE_DELTA = 1 << 6, // 0x0040: moraleBps updated
  TARGET_CHANGE = 1 << 7, // 0x0080: targetEntityId updated
  SUPPRESSION_AURA = 1 << 8, // 0x0100: active realm suppression multiplier shift
}

export interface CohortDeltaRecord {
  cohortId: string;
  dirtyMask: number; // Bitwise OR of CohortDirtyBit flags (uint16)
  dxQ?: number; // Signed int16 offset from baseTick posQ[0]
  dzQ?: number; // Signed int16 offset from baseTick posQ[1]
  dvxQ?: number; // Signed int16 offset from baseTick velQ[0]
  dvzQ?: number; // Signed int16 offset from baseTick velQ[1]
  dHeadingMillirad?: number;
  deltaUnits?: string; // Signed BigInt casualty/reinforcement delta (e.g., "-45000000")
  unitCount?: string; // Authoritative post-casualty BigInt string
  formation?: SiegeFormationType;
  posture?: CohortCombatPosture;
  moraleBps?: number;
  targetEntityId?: string | null;
  activeSuppressionMult?: number; // e.g., 100.0 for Golden Core vs Qi Refinement
}

export interface FortificationDeltaRecord {
  structureId: string; // e.g., "gate_north_c3", "wall_east_02", "citadel_core_c3"
  segmentType: 'GATE' | 'WALL_SEGMENT' | 'ARCHER_TOWER' | 'CITADEL_CORE';
  hpDelta: string; // Signed BigInt damage/repair delta
  remainingHp: string; // Authoritative remaining HP (BigInt string)
  maxHp: string;
  isBreached: boolean;
  controlledBy: 'player_clan' | 'enemy_clan' | 'neutral';
  captureProgressBps: number; // 0 .. 10000 (100.00% triggers sector flip)
}

/**
 * 20Hz Delta-Compressed Broadcast Packet (Opcode 0x11).
 */
export interface SiegeDeltaUpdatePacket {
  baseTick: number; // Reference tick the delta is computed against
  deltaTicks: number; // Tick offset (targetTick = baseTick + deltaTicks)
  sectorControlScore: {
    playerClanScore: number;
    enemyClanScore: number;
    playerPointsPerMin: number;
    enemyPointsPerMin: number;
  };
  spawnedCohorts: AuthoritativeCohortState[]; // Newly deployed cohorts since baseTick
  updatedCohorts: CohortDeltaRecord[]; // Bitmask-compressed active cohort updates
  despawnedCohortIds: string[]; // Routed, wiped, or recalled cohort IDs
  fortificationDeltas: FortificationDeltaRecord[];
  combatEventDigests: {
    attackerCohortId: string;
    defenderEntityId: string;
    counterAdvantage: 'ADVANTAGE' | 'NEUTRAL' | 'DISADVANTAGE';
    realmSuppressionMult: number;
    casualtiesInflicted: string; // BigInt string
  }[];
}
```

#### 6. Client-Side Prediction (CSP) & State Reconciliation Pipeline

1. **Local Prediction & Ring Buffer (`128` Frames)**:
   - On player march or formation input, the client immediately advances its local cohort using pure kinematic functions and records `{ seq, tick, inputCmd, predictedState }` into a 128-slot circular history buffer.
2. **Delta Application & Acknowledgment Pruning**:
   - Upon receiving `S2C_DELTA_SIEGE_UPDATE` (`0x11`), the client discards all history buffer entries with `seq <= envelope.ack`, applies `updatedCohorts` deltas to the `baseTick` snapshot, and computes the authoritative state at `envelope.tick`.
3. **Divergence Evaluation & Replay**:
   - For player-owned cohorts, the client compares the reconstructed server state at `envelope.tick` against the historical predicted state:
     - **Position Tolerance (`<= 15` quantized units / `0.15m`)**: Smoothly blended over `3` render frames via Cubic Hermite interpolation.
     - **Hard Rollback (`> 0.15m` position drift, formation mismatch, or `unitCount` casualty divergence)**: Snaps the simulation state to the authoritative `envelope.tick` state and deterministically replays all unacknowledged client commands (`seq > envelope.ack`) up to the current `clientTick`.
     - **State Hash Verification**: After applying the delta, the client computes `fnv1a32(sectorState)`. If it mismatches `envelope.stateHash`, the client dispatches a resync request and awaits an authoritative `S2C_FULL_SIEGE_SNAPSHOT` (`0x10`).

---

## [1.5.0] - 2026-11-06 (06/11/2026)

### Added

- **Software Architect & Hardware Architect Compatibility & Optimization Engine (`src/game/architectOptimization.ts`)**:
  - **Hardware Architect ISA & SIMD Matrix**: Added deterministic hardware profiles for `x86_64 AVX-512F/BW` (512-bit, 16× float32 lanes, 64B cache line), `ARMv9-A NEON + SVE2` (heterogeneous Prime/Performance/Efficiency core pinning), `Apple Silicon M-Series` (`alignas(128)` 128B cache line + zero-copy Unified Memory Architecture), and `RISC-V RV64GC + RVV 1.0` (Vector-Length Agnostic strip-mining).
  - **GPU Compute & Thermal TDP Envelopes**: Added compatibility tiers across `Vulkan 1.3`, `DirectX 12 Ultimate`, `Apple Metal 3`, `WebGPU`, `WebGL 2.0`, and `CPU Software Rasterizer (SwiftShader)` alongside sustained Thermal TDP governors (`350W Desktop`, `200W Console`, `25W Handheld APU`, and `8W Mobile Passive`).
  - **Software Architect Data-Oriented Design (DOD) & Lock-Free Job DAG**: Implemented interactive `SoA` (Structure-of-Arrays) vs `AoS` (Array-of-Structures) cache-miss and memory-bandwidth profiler (`4.75x` hot-loop speedup), a zero-mutex Lock-Free Work-Stealing Job Scheduler across 2–64 logical cores, and a deterministic Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`).
  - **C++20 Cache-Line Aligned Guardrails (`cpp/VoxelRealmsGuardrails.hpp`)**: Added `alignas(64)` `SoaEntityKinematicChunk` and `constexpr computeCacheLineBytesForIsa` verified via `static_assert` in `cpp/engine_guardrail_test.cpp`.
  - **Interactive Architect Studio UI (`src/components/CppArchitectureModal.tsx`)**: Added live CPU ISA, GPU backend, Thermal TDP, SoA/AoS memory layout, and Lock-Free Job Pool controls with a composite `100/100` Optimization Score badge.
- **10-Species / Race Character Creation & Admin-Governed Rebirth (`src/game/species.ts`, `src/game/species.test.ts`)**:
  - **10 Playable Species across 3 Lineages**: Added `human` (Terran Sovereign), `sylvan_elf` (Sylvan High Elf), `ironforge_dwarf` (Ironforge Runic Dwarf), `warborn_orc` (Warborn Goliath), `azure_dragonkin` (Azure Dragonkin), `celestial_kitsune` (Celestial Nine-Tailed Kitsune), `asura_demon` (Asura Blood Fiend), `empyrean_angelic` (Empyrean Winged Celestial), `void_walker` (Void Walker), and `crystalline_golem` (Crystalline Ancient Automaton).
  - **3D Procedural Species Meshes & Stature Scaling**: Updated `createPlayerMesh` in `src/game/proceduralWorld.ts` to attach `SpeciesTraitGroup` geometry (pointed/fox ears, braided dwarf beard, orc tusks, draconic/obsidian horns, feathered wings, draconic/spirit tails, orbiting void crystals, and golem core reactors) and apply per-species `[scaleX, scaleY, scaleZ]` stature scaling.
  - **Admin Permission Gate (`creatergame31@gmail.com`)**: Enforced `evaluateSpeciesSwitchPermission` so switching species after initial character creation (`speciesLocked: true`) requires authorization from Root Administrator `creatergame31@gmail.com` via live GM decree in `AdminConsoleModal.tsx` or `[SPECIES REBIRTH]` support ticket.
- **6-Layer Cosmic Hierarchy, Infinite Omniverse & Top 100 Fictional Species Background NPCs (`src/game/omniverse.ts`, `src/game/omniverse.test.ts`)**:
  - **6-Layer Cosmic Ontology & Cosmological Hierarchy (`SIX_LAYER_COSMIC_HIERARCHY`)**: Implemented the 6-layer cosmological model: **1. Universe** (_a single reality with its own space, time, and matter_), **2. Multiverse** (_a collection of parallel/series universes_), **3. Megaverse / Hyperverse** (_a cluster of multiple multiverses_), **4. Omniverse** (_every universe, multiverse, and reality that has ever existed or could exist_), **5. The Overvoid / Exoverse** (_a collection of multiple distinct omniverses that operate under completely different laws of logic and cosmic hierarchy_), and **6. The White Page / The House of Ideas** (_everything comes from here, even nothingness / Oblivion, under Supreme Author `creatergame31@gmail.com`_).
  - **All 100 Species Across 5 Tiers (`TOP_100_OMNIVERSE_SPECIES_NPCS`)**: Added all 100 iconic species/races across Tier 1 (Outer Gods, Beyonders, Endless, Monitors, Celestialsapiens, Zeno's Race, Q Continuum, etc.), Tier 2 (Xeelee, Time Lords, Culture Minds, Forerunners, Necrons, C'tan, Vex, Reapers, etc.), Tier 3 (Deities, New Gods, Asgardians, Ainur, Fiendcelestials, Otsutsuki, Shinigami, Dragons, etc.), Tier 4 (Saiyans, Kryptonians, Viltrumites, Martians, Frost Demons, Namekians, Majins, To'kustars, etc.), and Tier 5 (Humans, Mutants, Eldar, Krorks, Tyranids, Flood, Zerg, Protoss, Borg, etc.).
  - **Dedicated Sovereign Omniverse Per Race + Infinite Transfinite Dial (`Ω-001` to `Ω-∞`)**: Assigned each species its own Sovereign Omniverse (`OMNI-001`..`OMNI-100`), full 6-Layer Cosmological Breakdown (`resolveSpeciesSixLayerCosmology`), and `resolveInfiniteOmniverseByIndex` for arbitrary transfinite omniverse indices (`1` to `∞`).
  - **Super Admin Background NPC Command & Layer-6 White Page Decrees (`creatergame31@gmail.com`)**: Bound all 100 Level-1000 Background NPC Envoys and Layer-6 White Page / House of Ideas Authorial Decrees (`executeWhitePageAuthorDecree`) exclusively to `creatergame31@gmail.com`.
- **Imperial Lore, Auto-Populating Open-World Codex, 12 Dynastic Annals & `10^100`-Word Akashic Corpus (`src/game/loreHistory.ts`, `src/game/loreHistory.test.ts`, `src/components/LoreHistoryModal.tsx`, `LORE.md`)**:
  - **7 Grand Historical Epochs (`LORE_HISTORICAL_EPOCHS`, 6–7 Sections Each)**: Chronicles `Epoch Ω-0: Pre-Genesis: The White Page & The House of Ideas` (`creatergame31@gmail.com`), `Epoch Ω-I: The Overvoid Divergence & 100+∞ Sovereign Omniverses`, `Epoch Ω-II: Hyperversal Brane Weaving & Multiversal Timeline Tree`, `Epoch III: Awakening of the 10 Sovereign Playable Species & Admin Rebirth Seal`, `Epoch IV: The Han Jue Four-Path Immortal Revelation & 100x Realm Suppression`, `Epoch V: The Ten Citadel Eras & Trillion-Scale Siege Wars`, and `Epoch VI: The 06/11/2026 Software & Hardware Architect Convergence (v1.5.0)`.
  - **Auto-Populating Open-World Lore Codex (`OPEN_WORLD_BIOME_CODEX_CATALOG`, `OPEN_WORLD_MONSTER_CODEX_CATALOG`, `evaluateOpenWorldLoreDiscovery`, `buildDynamicMonsterCodexEntry`)**: Automatically unlocks and persists Codex entries in `localStorage` (`voxel_realms_lore_codex_state_v1`) as players explore Solara's 8 spatial biomes (`resolveBiomeAtWorldPosition`) or encounter/select/spawn Lv. 1–1000 monsters, complete with one-time Diamond & Scripture Fragment discovery bounties (`claimLoreCodexReward`).
  - **12 Imperial Dynastic Annals & Legendary Relic Histories (`LORE_DYNASTIC_ANNALS`)**: Added the **`🏛️ Annals & Relics (12)`** tab in `LoreHistoryModal.tsx` with 12 multi-paragraph primary historical chronicles indexed by unified `searchLoreHistory`.
  - **`10^100` Words Minimum (One Googol Words) Procedural Akashic Stream (`GOOGOL_LORE_ARCHIVE_SPEC`, `generateGoogolScaleLoreScrollSlice`)**: Synthesizes `>= 1,000` real English words per volume across `10^97` `BigInt`-addressable volume coordinates (`1n` to `10n ** 97n`) with zero RAM overflow.
  - **6 Sacred Compendium Codices (`LORE_COMPENDIUM_CHAPTERS`) & Interactive Chronicle Comprehension**: Added full-text lore search (`searchLoreHistory`) and one-time epoch comprehension (`comprehendLoreEpoch`) granting Kingdom Diamonds (`💎`) and Scripture Fragments, accessible from both `TitleScreen.tsx` and `GameHUD.tsx`.
- **Authoritative 20Hz 50v50 WebSocket Siege Server & Multi-Region Persistence (`server.ts`, `src/game/siegeNetProtocol.ts`, `src/game/siegeNetProtocol.test.ts`, `src/components/ClanTerritoryMap.tsx`)**:
  - **20Hz RFC 6455 WebSocket Siege Server (`/ws/siege` & `/api/online/*`)**: Implemented full-stack Express + WebSocket upgrade server (`server.ts`) broadcasting 20Hz (`50ms`) `S2C_DELTA_SIEGE_UPDATE` frames and periodic `S2C_FULL_SIEGE_SNAPSHOT` keyframes, processing `C2S_TROOP_POSITION_CMD` (`0x01`) and `C2S_RALLY_ACTION_CMD` (`0x02`), and persisting multi-region realm state (`data/online_realm_state.json`) across 3 regional clusters (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`).
  - **128-Frame Client-Side Prediction (CSP) & Bitmasked Delta Compression**: Implemented `CohortDirtyBit`, `quantizeCoordInt16` (`0.01m` precision), `serializeBigIntWire` (up to `1,000T`), FNV-1a 32-bit state hashing (`computeSectorStateHash`), and `ClientPredictionRingBuffer` (`reconcileClientPrediction`).
- **9-Pillar Cross-System Validation, Cardinality (`COSMIC_LIMITS`) & D3 Cosmological Tree Visualizer (`src/game/systemValidation.ts`, `src/game/cosmologicalTreeD3.ts`, `src/components/CosmologicalAdminModal.tsx`, `cpp/VoxelRealmsGuardrails.hpp`)**:
  - **Deterministic 9-Pillar Audit (`runFullSystemValidationReport`)**: Audits **88 invariants across all 9 foundational pillars**: Root RBAC (`creatergame31@gmail.com`), 6-Tier Nested Cosmological Tree (`WhitePageRoot` Singleton → `Universe` Leaf) & 100 Omniverses, Imperial Lore (7 Epochs, 12 Dynastic Annals, Auto-Populating Open-World Codex, `10^100` Akashic Corpus), 10 Playable Species, `06/11/2026` Architect Matrix, `1,000T` Castle Math, `100.0x` Realm Suppression, Lv. 1–1000 World AI, and **Pillar 9: Engineering Transparency, 20Hz 50v50 Siege Netcode & Live WebGL2 Pipeline Execution**.
  - **Strict 6-Tier Cosmological Cardinality (`COSMIC_LIMITS`), `InfiniteCollection<T>` & Physics/Logic Override Engine (`src/types/game.ts`, `src/game/omniverse.ts`, `src/components/WorldAIDirectorModal.tsx`)**: Implemented `COSMIC_LIMITS` (`WHITE_PAGE_COUNT: 1`, `OVERVOID_MAX_COUNT: 100`, `Infinity` for Tiers 1–4), `WhitePageRoot` (`THE_WHITE_PAGE` / `The House of Ideas` singleton with `isSingleton: true` spawning both `overvoids: Overvoid[]` [`100` bounded instances, `index: 1..100`, guarded by `attemptCreateOvervoid()`] and `oblivionState: { exists: true, description: 'Absolute nothingness originating from The White Page' }`), and `InfiniteCollection<T>` with on-demand lazy procedural pagination (`lazilyGenerateInfiniteTierSlice()`) plus Tier 5 logic and Tier 1 physics override resolution (`evaluateEffectiveUniversePhysicsAndLogic`).
  - **Interactive D3 6-Tier Cosmological Tree Visualizer (`src/components/CosmologicalAdminModal.tsx`, `src/game/cosmologicalTreeD3.ts`, `src/game/cosmologicalTreeD3.test.ts`)**: Added an interactive `d3-hierarchy` + `d3-zoom` tree visualizer in both Horizontal (`Left → Right`) and Radial (`360° Mandala`) layouts showing parent-child links from `THE_WHITE_PAGE` (`Tier 6`) and `OBLIVION_NOTHINGNESS` down through `Overvoid` (`Tier 5`) to leaf `Universe` (`Tier 1`) nodes, with live Tier 5/Tier 1 physics override sliders, 100-Overvoid cap testing, and on-demand lazy slice pagination.
  - **Live WebGL2 `applyCrossPlatformPipeline` Mutations (`src/game/proceduralWorld.ts`, `src/game/graphicsEngine.ts`)**: Upgraded `applyCrossPlatformPipeline` to dynamically resize and redraw procedural HTML5 `CanvasTexture` resolutions (`1024×1024`, `512×512`, `256×256`), mutate `normalScale` and `bumpScale` across all 16 PBR `voxelMaterials`, scale `VoxelGrassTuftsInstanced.count` (`800` / `520` / `320`), reconfigure `THREE.LOD` hysteresis distances, resize `sunLight.shadow.mapSize` (`2048` vs `1024`), and return a verifiable `AppliedPipelineExecutionSummary`.
  - **Engineering Transparency Matrix (`ENGINEERING_TRANSPARENCY_MATRIX`)**: Added explicit classification of `Implemented` (`6`), `Simulated` (`2`), and `Planned` (`0`) features in `src/game/graphicsEngine.ts` and `src/components/CppArchitectureModal.tsx` (`data-testid="engineering-transparency-panel"`).
  - **C++20 Compile-Time Cosmological & Lore Guardrails (`cpp/VoxelRealmsGuardrails.hpp`, `cpp/engine_guardrail_test.cpp`)**: Added `CosmicOntologyLayer` (`1..6`), `WhitePageRootSpec` (`tier5OvervoidCount = 100U`, `tier4OmniverseCount = 100U`), `kCanonicalDynasticAnnalsCount = 12U`, `kCanonicalOpenWorldBiomeCount = 8U`, `kGoogolLoreWordExponent = 100U`, `computeCascadedUniverseQiMultiplier`, and `constexpr computeCosmicLayerScaleMultiplier` verified via `static_assert` (`100,000x` at Layer 6: `TheWhitePage_HouseOfIdeas`).
  - **Unified Validation Command (`npm run validate`)**: Added one-command 4-stage validation gate (`lint` + `format:check` + `test` [122 tests across 18 TypeScript suites] + `build`).

---

## [1.4.1] - 2026-11-05

### Added

- **Administration, GM, Admin & Moderator RBAC Control System (`src/game/adminModeration.ts`)**:
  - Bound root account **`creatergame31@gmail.com`** at Clearance Level 999 with full `Administration`, `Game Master (GM)`, `Admin`, `Moderator`, and `Official Contact` privileges.
  - Added immutable root protection guardrails preventing `creatergame31@gmail.com` from being sanctioned, muted, banned, or demoted.
  - Added **Admin & Moderator Control** tab in `AdminConsoleModal` with Server-Wide GM/Moderator Decree broadcasts and live player moderation actions (`Warn`, `Mute Chat`, `Temp Ban`, `Restore`, `+Moderator`, `+Admin`).
  - Added **Official Contact & Support Tickets** tab routing all Administration, GM Live-Ops, Moderation, Appeal, and Security tickets directly to `creatergame31@gmail.com`.
- **Comprehensive Legal, Governance & Technical Documentation Suite**:
  - Added [`LICENSE.md`](./LICENSE.md), [`ROADMAP.md`](./ROADMAP.md), [`SUPPORT.md`](./SUPPORT.md), [`GOVERNANCE.md`](./GOVERNANCE.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), and [`.github/ISSUE_TEMPLATE.md`](./.github/ISSUE_TEMPLATE.md).

---

## [1.4.0] - 2026-03-20

### Added

- **Cultivation Realm & Suppression System**:
  - Implemented 4 cultivation paths: _Sword Immortal_, _Demonic Fiend_, _Heavenly Dao Priest_, and _Void Walker_.
  - Added 5 distinct cultivation realms: _Qi Refinement_, _Foundation Establishment_, _Golden Core_, _Nascent Soul_, and _Dao Creator_.
  - Realm suppression mathematical engine: higher realm cultivators deal up to 100x damage against lower realm cultivators (e.g. Golden Core vs Qi Refinement).
  - Distinctive visual aura indicators for each realm: faint white glow (Foundation), revolving golden core (Golden Core), miniature floating nascent soul avatar (Nascent Soul), and divine Great Dao halos (Dao Creator).
- **The Karma System (Justice vs Evil)**:
  - Dynamic Karma tracking with White/Green (Innocent), Yellow (Neutral), and Red (Sinful) states.
  - Slaying innocent green-name players turns karma negative, marking the offender with a Red Name.
  - _Tribulation Lightning_: Game engine randomly summons instant-death heavenly lightning upon static Red Name players who stay in place too long.
  - _Bounty Hunter Broadcasting_: Red Name coordinates are broadcast across realms to high-level Justice players.
  - _Loot Drop Penalty_: Red Name players suffer an 85% equipment drop risk upon defeat.
- **Social Structure: Master & Disciple**:
  - Replaced generic parties with hierarchical Master-Disciple bonds.
  - Proximity cultivation speed boost (+25% EXP gain) when disciples cultivate near their Master.
  - Configurable spirit stone taxation (5%–20%) funneled automatically from disciples to Masters.
  - Skill Transmission mechanic: Masters transcribe mastered rare skills (e.g. _Heaven Earth Sleeve_, _Nine Heavens Thunder_) into tradable Skill Scrolls.
- **Daily Login Reward System**:
  - 7-day cyclical login rewards calendar with guaranteed spirit stones, refinement diamonds, breakthrough pills, and celestial forge vouchers.
  - Special **Veteran Scroll** milestone reward on Day 7 granting permanent +15% cultivation speed.
  - Streak protection and local timestamp persistence.
- **C++20 High-Performance AI Architecture Reference**:
  - Authored clean C++20 engine reference implementation (`cpp20_realm_ai_system.hpp`) featuring `std::span`, concepts, memory pools, AVX2 SIMD pathfinding, and HDR10+ luminance metadata output.

### Changed

- Refactored HUD overlays into modular React 19 components with smooth Framer Motion transitions.
- Upgraded test suite to 50 comprehensive unit tests covering karma, cultivation suppression, master-disciple economy, and siege math.

---

## [1.3.0] - 2026-03-18

### Added

- **1000T Castle Warfare Engine**:
  - Heavy siege weapons: Battering Rams (1000T crushing force against gates), Trebuchets (long-range AOE wall bombardment), Ballistas (armor-piercing ballistics), and Siege Towers (infantry wall scaling).
  - Fortification physics: Castle Gates with 50,000 HP, Stone Wall segments with 35,000 HP, and Archer Towers with garrison defensive buffs.
  - Destructible debris physics simulated with WebGL particle bursts upon structure collapse.
  - Tactical troop formation commands: Shield Wall, Phalanx Advance, Wedge Charge, and Loose Skirmish.

### Changed

- Enhanced sound synthesis engine with positional acoustic feedback for siege impacts, boulder crashes, and horn signals.

---

## [1.2.0] - 2026-03-15

### Added

- **Infinite Lv 1–1000 Monster Ecosystem**:
  - Procedural stat scaling algorithm balancing HP, physical/magical attack, defense, and elemental affinities across 1000 levels.
  - Hierarchical monster classes: Minions, Elites, Champions, World Bosses, and Calamity Titans.
  - Dynamic AI Behavior Trees with states: `IDLE_GRAZE`, `PATROL`, `ALERT_STALK`, `TACTICAL_ENGAGE`, `FLEE_CALL_PACK`, and `ENRAGED_ULTIMATE`.
  - Environmental interaction: Monsters use cover, ambush from brush, and gain elemental buffs when submerged in water or near lava.

### Fixed

- Fixed bug where high-level elite mobs would tether incorrectly across chunk boundaries.

---

## [1.1.0] - 2026-03-12

### Added

- **Dual-Engine Interactive Architecture**:
  - Real-time Three.js 3D WebGL isometric battlefield rendered alongside high-density 2D tactical HUD overlays.
  - Procedural voxel terrain generation with biomes: Verdant Plains, Scorched Crags, Frozen Tundra, and Void Chasm.
  - Dynamic day/night illumination cycle with HDR tone mapping and bloom post-processing.
- **Web Audio API Sound Engine**:
  - Pure synthesizer-based sound effects with zero external MP3 dependencies (sword slashes, spell casting, level-up fanfares, siege impacts).

---

## [1.0.0] - 2026-03-10

### Added

- Initial public release of **Voxel Realms RPG**.
- Core player stat progression system (Vitality, Strength, Spirit, Agility, Luck).
- Grid inventory system with equipment slots, rarity tiers, and drag-and-drop tooltips.
- Real-time battle calculations and floating combat text.
- Full responsive interface built with React 19 and Tailwind CSS.
