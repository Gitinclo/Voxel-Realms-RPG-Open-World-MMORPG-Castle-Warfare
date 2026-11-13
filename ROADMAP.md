# 🗺️ Project Roadmap (`ROADMAP.md`)

This document outlines the high-level vision, engineering milestones, and upcoming feature releases for **Voxel Realms RPG: Open World MMORPG & Castle Warfare**.

- **Project Lead / Supreme Administrator:** [creatergame31@gmail.com](mailto:creatergame31@gmail.com)
- **Current Production Release:** `v1.5.0` (`06/11/2026` / `November 6, 2026`)
- **Architecture Principle:** All roadmap milestones strictly follow the **Architect-First** and **Decoupled Pure-Logic (`src/game/*.ts`) + Unit-Tested (`src/game/*.test.ts`)** guardrails defined in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## 🌟 Long-Term Vision

**Voxel Realms RPG** bridges three genres into a single deterministic, cross-platform 3D experience:

1. **Grand Castle Warfare & Trillion-Scale Strategy**: Progression from a Level 0 Wooden Outpost to a Level 100 Celestial Imperium Citadel commanding up to **1,000 Trillion (`10^15`)** garrisoned troops and **1 Trillion (`10^12`)** cooperative rallies.
2. **Authentic Four-Path Immortal Cultivation (Xianxia)**: Simultaneous progression across **Qi, Body, Soul, and Mind** through 23 realms (9 layers each), featuring exponential `10^ΔRealm` suppression, Heavenly Tribulations, Karma & Red-Name justice mechanics, and Master-Disciple lineage trees.
3. **Autonomous Open-World Voxel Simulation**: Real-time Three.js PBR + HDR battlefields populated by Level 1–1000 AI monsters and role-based NPCs (Guards, Blacksmiths, Caravan Merchants, Mystics, and Elders) driven by A\* obstacle pathfinding and C++20 SIMD architecture blueprints.

---

## 📅 Milestone Timeline & Release Schedule

### ✅ Completed Milestones (`v1.0.0` – `v1.5.0` · `06/11/2026`)

| Version    | Milestone                            | Key Deliverables                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |   Status   |
| :--------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------: |
| **v1.0.0** | Core Voxel RPG Foundation            | 3D Voxel terrain, Castle Levels 0–100, T1–T20 Tri-Branch Troops (`Shieldbearer`, `Shooter`, `Bomber`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ✅ Shipped |
| **v1.1.0** | Studio PBR + HDR & WebAudio          | Procedural 2D canvas normal/bump textures, `UnrealBloomPass` HDR pipeline, procedural WebAudio synthesizer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | ✅ Shipped |
| **v1.2.0** | Autonomous World AI (Lv 1–1000)      | 5 monster complexity brackets, A\* grid pathfinding around keep walls, 6 autonomous NPC roles & caravan barter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | ✅ Shipped |
| **v1.3.0** | Clan Territory Warfare & Rallies     | 9-sector (`A1`–`C3`) clan war map, heraldic SVG emblem editor, 600M HP Void Leviathan co-op boss                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Shipped |
| **v1.4.0** | Four-Path Cultivation & VIP Pass     | 23 Xianxia realms, Karma & Tribulation lightning, 7-day Daily Login Decrees, Veteran Scrolls, VIP Tiers 0–3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | ✅ Shipped |
| **v1.4.1** | Admin / GM / Moderator RBAC          | Root account binding (`creatergame31@gmail.com`), player moderation roster, global GM decrees, live support ticket queue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ✅ Shipped |
| **v1.5.0** | Architect, Species, Omniverse & Lore | `06/11/2026` CPU ISA (`x86_64`, `ARM64 SVE2`, `Apple Silicon 128B UMA`, `RISC-V`), `SoA` DOD, Live WebGL2 `applyCrossPlatformPipeline` (`CanvasTexture` 256/512/1024px resizing, PBR `normalScale`/`bumpScale`, instanced grass scaling), Engineering Transparency Matrix (`Implemented` vs `Simulated` vs `Planned`), 10 Playable Species, Strict 6-Tier Nested Cosmological Tree (`WhitePageRoot` Singleton → `Overvoid` → `Omniverse` → `Megaverse` → `Multiverse` → `Universe` Leaf + Tier 5/Tier 1 Physics Overrides), 100 Species Background NPCs (`creatergame31@gmail.com`), 7-Epoch Imperial Lore Codex & 9-Pillar Validation Engine (`72+` checks, `110` tests) | ✅ Shipped |

---

### 🚀 Upcoming Milestones (`v1.5.1` – `v2.0.0`)

#### Phase 1: `v1.5.1` — Real-Time 50v50 Multiplayer Castle Siege Engine (Q1 2027)

- **Authoritative 20Hz WebSocket Siege Server (`src/game/siegeNetProtocol.ts`)**:
  - Implementation of the binary/JSON `SiegeNetEnvelope` wire protocol specified in [`CHANGELOG.md`](./CHANGELOG.md).
  - Bitmask delta-compressed cohort updates (`CohortDirtyBit`) sustaining 100 concurrent lords and 300+ troop cohorts under `45 KB/s` per client.
  - Lossless string-serialized `BigInt` troop counts and casualty reconciliation across `1,000T` garrisons.
- **Client-Side Prediction (CSP) & 128-Frame Ring Buffer**:
  - Zero-latency local cohort march commands with Cubic Hermite positional smoothing and deterministic rollback on server state hash divergence.
- **Live Moderator & GM Siege Spectator Tools**:
  - Real-time sector freeze, rollback, and dispute resolution tools in `AdminConsoleModal` for `creatergame31@gmail.com` and appointed Game Masters.

#### Phase 2: `v1.6.0` — Procedural Immortal Secret Realms & Dungeon Delves (Q2 2027)

- **Seeded Voxel Secret Realms (`src/game/secretRealms.ts`)**:
  - Multi-floor procedural underground and astral pocket dimensions unlocked at Golden Core, Nascent Soul, and Dao Creator realms.
  - Ancient Dao Relic puzzles, elemental spirit vein capture nodes, and multi-phase Guardian Remnant bosses.
- **Expanded Sect & Lineage Diplomacy**:
  - Inter-clan alliances, tributary treaties, and cross-server Immortal Assembly tournaments.
  - Tradeable inscribed Skill Scrolls and Alchemy Pill auction house with anti-manipulation price floors.

#### Phase 3: `v1.7.0` — WebGPU Compute Shaders & 10,000-Unit Instanced Flocking (Q3 2027)

- **WebGPU Compute Pipeline with WebGL2 / Software Fallback**:
  - GPU-accelerated spatial hash grid and Boids flocking simulation for rendering 10,000+ individual soldiers during 1T rallies while maintaining a strict 1-draw-call-per-tier budget on software/mobile renderers.
- **Dynamic Seasonal & Celestial Events**:
  - Blood Moon Eclipse, Nine-Heavens Astral Tide, and Primordial Chaos Rifts that dynamically alter monster AI brackets and cultivation comprehension rates.

#### Phase 4: `v2.0.0` — Native C++20 / Vulkan Desktop & Mobile Addressable Release (Q4 2027)

- **Native C++20 SIMD Shared Simulation Core (`cpp/`)**:
  - Full WebAssembly (Wasm SIMD128) and native C++20 compilation of the ECS combat, A\* pathfinding, and cultivation suppression engines (`CMakeLists.txt` + `vcpkg.json`).
- **Steamworks, Google Play & iOS Production Distribution**:
  - Cloud save synchronization, cross-device account linking, and regional siege matchmaking clusters.

---

## 💡 Proposing Roadmap Features

Have an idea for a new Cultivation Path, Castle Era mechanic, or World AI behavior?

1. Open a **[Feature Request Issue](./.github/ISSUE_TEMPLATE/feature_request.md)** using our repository template.
2. Or dispatch an official proposal via the in-game **GM / Admin / Moderator Console (`Official Contact & Tickets`)** directly to **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**.
