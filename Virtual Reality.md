# 🥽 Virtual Reality (`WebXR` / `OpenXR`) Spatial Computing Specification (`Virtual Reality.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. Stereoscopic 3D Voxel Immersion (`WebXR Device API` & Native `OpenXR`)

**Voxel Realms RPG** is architected on a real-time **Three.js `0.187` WebGL2 scene graph (`src/game/proceduralWorld.ts`, `src/game/openWorld3DEngine.ts`)** with physically based `MeshPhysicalMaterial` surfaces, spatial `MeshBVH` raycasting (`three-mesh-bvh`), and `cannon-es` rigid-body physics, enabling seamless adaptation to **Stereoscopic Virtual Reality (`WebXR` / `OpenXR`)** across standalone and tethered headsets:

| Supported VR Headset Tier                                   | Runtime / API                                                                         | Target Stereoscopic Frame Rate                    | Rendering & Comfort Pipeline                                                                            |
| :---------------------------------------------------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------ |
| **Meta Quest 3 / Quest 3S / Pico 4 Ultra**                  | Standalone `WebXR` (Meta Quest Browser) / Android `OpenXR` (`Vulkan 1.3`)             | `90 Hz` – `120 Hz` (`8.33 ms` stereo budget)      | `ASTC` `512px` PBR, Fixed/Eye-Tracked Foveated Rendering (`FFR`), `4x` MSAA, 4-Tier `THREE.LOD`         |
| **PlayStation VR2 (`PS VR2`)**                              | Native Console `OpenXR` / `GNM` ([`playstation.md`](./playstation.md))                | `90 Hz` – `120 Hz` (`2000×2040` per eye OLED HDR) | Eye-Tracked Dynamic Foveated Rendering (`DFR`), `BC7` `1024px` PBR, Headset Haptics & Adaptive Triggers |
| **PC VR (`Valve Index`, `Bigscreen Beyond`, `Quest Link`)** | SteamVR `OpenXR` / Desktop `WebXR` ([`PC.md`](./PC.md), [`Windows.md`](./Windows.md)) | `90 Hz` – `144 Hz` (`6.94 ms` stereo budget)      | `BC7` `1024px` PBR, `16x` Anisotropy, `2048×2048` Shadows, `UnrealBloomPass`                            |
| **Apple Vision Pro (`visionOS`)**                           | Safari `WebXR` / `Metal 3` ([`mac.md`](./mac.md))                                     | `90 Hz` – `100 Hz` Micro-OLED                     | Dynamic Foveated Rendering, Gaze + Pinch raycasting via `three-mesh-bvh`                                |

---

## 2. Dual-Mode VR Camera & Motion Comfort Architecture

1. **Tabletop Sovereign War-Room Mode (Diorama Scale `1:50`)**:
   - Projects the entire `40×40` Solara Citadel, 8 Open-World Biomes, and 50v50 Territory Siege Battlefield (`ClanTerritoryMap.tsx`) as an interactive holographic war-table in front of the commander.
   - Zero motion sickness (`Comfort Rating: Comfortable`); players reach out with 6DoF motion controllers or hand-tracking pinch gestures (`three-mesh-bvh` `O(log N)` raycast) to command `1T` War Rallies, inspect Lv. 1–1000 Monsters, or rotate the 6-Tier Cosmological Tree (`CosmologicalAdminModal.tsx`).
2. **First-Person / Over-the-Shoulder Immortal Avatar Mode (`1:1` Scale)**:
   - Places the player directly inside their Lord avatar across all **100 Playable Races** (`src/game/species.ts`), with comfort vignette tunneling during movement, snap-turn (`30°`/`45°`), and teleport arc locomotion.

---

## 3. 6DoF Spatial Controller Mapping & Haptics

- **Right Hand 6DoF Controller**: Wields the active weapon (`broadsword`, `crossbow`, `siege_mortar`, `arcane_halberd`), aims `three-mesh-bvh` laser pointer for gathering/combat, and triggers Mystical Cultivation Skills.
- **Left Hand 6DoF Controller**: Summons the diegetic wrist-mounted **Solara Sovereign HUD** (Castle Upgrades, Troop Barracks, Four-Path Cultivation Meditations, and 3 Clone / 3 Shadow summons from `src/game/avatarCloneShadow.ts`).

---

## 4. Photosensitivity, Anti-Cheat & Root Creator Authority (`creatergame31@gmail.com`)

- **Photosensitivity & Comfort Safeguards**: Enforces Article 8 of [`EULA.md`](./EULA.md) with configurable bloom intensity and comfort vignettes for Heavenly Tribulation Lightning and Siege Mortar barrages.
- **Server-Authoritative Parity**: VR sessions connect to the same `20Hz` (`/ws/siege`) authoritative siege server and `AuthoritativeAntiCheatEngine` (`src/game/antiCheat.ts`), with Root Creator **`creatergame31@gmail.com`** retaining full 12-Domain All-Things Immunity, 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`), and unrestricted access across all 100 Playable Species / Races (`src/game/species.ts`).
