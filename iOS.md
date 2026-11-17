# 📱 iOS & iPadOS (`Apple A-Series` & `M-Series`) Platform Specification (`iOS.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. iOS & iPadOS Architecture (`Metal 3`, `ASTC` & TBDR GPU Optimization)

**Voxel Realms RPG** is engineered for responsive mobile and tablet play across **iOS 17 / iOS 18+** (iPhone 13 through iPhone 16 Pro Max) and **iPadOS 17 / iPadOS 18+** (iPad Air / iPad Pro `M1`–`M4`):

- **Tile-Based Deferred Rendering (`TBDR`) & `ASTC` Compression (`MOBILE_IMPORT_OVERRIDES` in `src/game/graphicsEngine.ts`)**:
  - Uses **`ASTC 6x6` (`256×256` / `512×512`)** block compression (`3.56 bpp`) to minimize mobile VRAM bandwidth (`~64 MB` total texture budget) and stay comfortably within the **`8W` Mobile Passive Thermal Envelope (`mobile_passive_8w`)** in `src/game/architectOptimization.ts`.
  - Dynamically scales `InstancedMesh` foliage (`320` tufts on iPhone, `520–800` on M-Series iPad Pro), switches 4-tier `THREE.LOD` distances earlier, and culls small-prop shadow casters to sustain **`60 FPS` / `120 Hz` ProMotion** without thermal throttling.

---

## 2. Touch Controls, Responsive Safe-Area HUD & PWA Support

- **Virtual On-Screen D-Pad & Action Cluster (`GameHUD.tsx`, `GameCanvas.tsx`)**:
  - Responsive multi-touch virtual joystick/D-pad for 3D overworld exploration, tap-to-raycast (`three-mesh-bvh`) on resource nodes, keeps, and monsters, and pinch-to-zoom camera control (`@tweenjs/tween.js`).
  - Full viewport layout tested down to `390×844` mobile viewports (`real-world QA.md`) with zero horizontal overflow across all 19 lazy-loaded modals (`React.lazy` in `src/App.tsx`).
- **Web Audio Unlock on iOS WebKit**:
  - Automatically resumes the procedural `AudioContext` (`src/game/audio.ts`) on first user touch gesture per WebKit autoplay policies.

---

## 3. Cross-Progression, 100 Playable Races & Root Creator Governance (`creatergame31@gmail.com`)

- **Cloud Sync & Dual-Tier Sign-In**: Seamless cross-progression with PC, Mac, Console, and Android via Firebase Authentication (`src/contexts/AuthContext.tsx`), Cloud Firestore (`src/lib/firestore.ts`), and Cloud SQL (`/api/db/*`).
- **All 100 Playable Races & Creator God Authority**:
  - Mobile players can browse, search, and preview all **100 Playable Species / Races** (`10 Core Solara Lineages + 90 Sovereign Omniverse Races #1–#100`) on the 3D WebGL turntable in `CharacterCreationModal.tsx`, governed by Admin (`creatergame31@gmail.com`) permission, while **`creatergame31@gmail.com`** retains full 12-Domain All-Things Immunity and 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`).
