# 🟢 Xbox Series X|S Platform Engineering & GDK Specification (`xbox.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. Xbox Series X & Xbox Series S Hardware Architecture (`Microsoft GDK` & `DirectX 12 Ultimate`)

**Voxel Realms RPG** supports the **Xbox Series X|S** family through its **DirectX 12 Ultimate (`dx12_ultimate`)** hardware profile (`src/game/architectOptimization.ts`), **Console `BC7` Asset Pipeline (`PC_CONSOLE_IMPORT_OVERRIDES` in `src/game/graphicsEngine.ts`)**, and C++20 SIMD Guardrails (`cpp/VoxelRealmsGuardrails.hpp`):

| Console Target    | GPU Compute & Memory                         | Resolution & Refresh Target                      | Voxel Realms RPG Graphics Preset                                                                                           |
| :---------------- | :------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Xbox Series X** | `52 CUs` RDNA 2 (`12 TFLOPS`), `16 GB` GDDR6 | `4K UHD @ 60–120 Hz` (VRR + Dolby Vision Gaming) | `Ultra` (`1024×1024` `BC7` PBR, `16x` Anisotropy, `2048×2048` Shadows, `800` Instanced Foliage)                            |
| **Xbox Series S** | `20 CUs` RDNA 2 (`4 TFLOPS`), `10 GB` GDDR6  | `1440p @ 60 Hz` / `1080p @ 120 Hz`               | `High / Balanced` (`512×512` `BC7` PBR, `8x` Anisotropy, `1024×1024` Shadows, `520` Instanced Foliage, 4-Tier `THREE.LOD`) |

---

## 2. Xbox Velocity Architecture & Quick Resume

- **DirectStorage & Sampler Feedback Streaming**: Streams procedural PBR material mipmaps (`BC7` / `BC5`) and 4-tier `THREE.LOD` geometry on demand without saturating the Xbox Series S `10 GB` memory pool.
- **Quick Resume State Serialization**: Compatible with `AtomicRealmPersistence` (`src/game/serverPersistence.ts`) and deterministic 128-frame Client-Side Prediction (`ClientPredictionRingBuffer` in `src/game/siegeNetProtocol.ts`), gracefully re-handshaking `/ws/siege` WebSocket sessions upon waking from Xbox Quick Resume.

---

## 3. Xbox Wireless Controller & Impulse Triggers

- **Gamepad Navigation & Radial HUD**: Full D-Pad modal navigation, Left/Right Stick movement and camera orbit (`@tweenjs/tween.js`), and Impulse Trigger rumble for **T1–T20 Bomber Siege Mortar** salvos (`cannon-es`), **Void Leviathan** boss strikes, and **Four-Path Cultivation Breakthroughs**.
- **Keyboard & Mouse Support on Console**: Native USB/wireless keyboard and mouse pass-through supported identically to [`Windows.md`](./Windows.md) and [`PC.md`](./PC.md).

---

## 4. Cross-Network Play, Anti-Cheat & Root Creator Governance (`creatergame31@gmail.com`)

- **Cross-Play & Cloud Saves**: Full cross-progression across Xbox Series X|S, Windows PC ([`Windows.md`](./Windows.md)), PlayStation ([`playstation.md`](./playstation.md)), macOS, Linux, iOS, and Android via Cloud SQL (`/api/db/*`) and Cloud Firestore (`firestore.rules`).
- **100 Playable Races & Creator Authority**: Supports all **100 Playable Species / Races** (`src/game/species.ts`) with Admin (`creatergame31@gmail.com`) permission governance, and enforces `creatergame31@gmail.com` Root Creator 12-Domain All-Things Immunity and 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`).
