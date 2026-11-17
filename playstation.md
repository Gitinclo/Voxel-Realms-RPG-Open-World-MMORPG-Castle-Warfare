# 🎮 PlayStation 5 & PlayStation 5 Pro Platform Specification (`playstation.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. PlayStation 5 / PS5 Pro Target Architecture (`GNM` / `GNMX` & C++20 Blueprint)

**Voxel Realms RPG** models console-grade rendering and memory pipelines in `src/game/graphicsEngine.ts` (`PC_CONSOLE_IMPORT_OVERRIDES`), `src/game/architectOptimization.ts`, and the C++20 engine specification (`src/game/cppEngine.ts`, `cpp/VoxelRealmsGuardrails.hpp`) for **PlayStation 5** and **PlayStation 5 Pro**:

- **CPU & SIMD Profile**: 8-Core / 16-Thread AMD Zen 2 (`x86_64` `AVX2`, `64-byte` cache-line aligned `SoaEntityKinematicChunk` structures) running the lock-free Chase-Lev work-stealing job scheduler across 14 worker threads (`2` threads reserved for OS/audio).
- **GPU & Unified GDDR6 Memory (`16 GB` @ `448–576 GB/s`)**:
  - Uses **`BC7`** high-fidelity block compression (`1024×1024` PBR textures, `16x` anisotropy) and **`BC5`** normal maps.
  - Supports **Quality Mode** (`4K @ 60 FPS` with full `UnrealBloomPass`, `2048×2048` shadows, and `800` instanced foliage tufts) and **Performance / VRR Mode** (`1440p–4K Upscaled @ 120 Hz` within an `8.33 ms` frame budget).
- **Hardware Krone / Oodle I/O Decompression**: Fast streaming of procedural chunk seeds, 4-tier `THREE.LOD` voxel keep meshes, and `10^100`-Word Akashic Lore slices (`src/game/loreHistory.ts`) with zero frame-time stalls.

---

## 2. DualSense Wireless Controller Integration

| DualSense Feature                   | Voxel Realms RPG Mapping                                                                                                                                      |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Left / Right Analog Sticks**      | 360° Lord locomotion (`Left Stick`) & smooth `@tweenjs/tween.js` orbital camera control (`Right Stick`)                                                       |
| **Adaptive Triggers (`L2` / `R2`)** | Dynamic bowstring tension for **Shooters** (`L2`) and recoil resistance for **Bomber Siege Mortars** (`R2`)                                                   |
| **HD Haptic Voice-Coil Actuators**  | Directional waveform feedback for **Heavenly Tribulation Lightning**, **Castle Siege Artillery Impacts** (`cannon-es`), and **Realm Breakthrough Shockwaves** |
| **DualSense Speaker & Lightbar**    | Jade/Gold lightbar shifts for **Justice Karma** vs. Crimson pulse for **Red-Name Status** (`< 0` Karma); speaker chimes on Spirit Stone & Daily Login decrees |

---

## 3. Cross-Play, Cross-Save & Account Governance (`creatergame31@gmail.com`)

- **20Hz 50v50 Cross-Play Sieges (`/ws/siege`)**: Deterministic `int16` spatial quantization (`0.01m`) and `BigIntWireString` serialization (`src/game/siegeNetProtocol.ts`) ensure bit-exact parity between PlayStation, Xbox, PC, and Mobile commanders across all 9 Territory Sectors (`A1`–`C3`).
- **Cloud SQL & Firestore Cross-Progression**: Unified account state synced via `/api/db/save` and Cloud Firestore (`src/lib/firestore.ts`), preserving all **100 Playable Races** (`src/game/species.ts`) and Root Creator **`creatergame31@gmail.com`** privileges (12-Domain All-Things Immunity & 100 Supreme Omni-Attributes).
- **PlayStation VR2 (`PS VR2`) Compatibility**: See [`Virtual Reality.md`](./Virtual%20Reality.md) for eye-tracked foveated rendering and Sense controller bindings.
