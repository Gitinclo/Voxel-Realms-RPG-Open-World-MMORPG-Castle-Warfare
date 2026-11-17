# 🤖 Android Mobile, Tablet & Handheld Platform Specification (`android.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. Android Hardware & Graphics Pipeline (`ARMv9 NEON/SVE2`, `Vulkan 1.3` & `ASTC`)

**Voxel Realms RPG** is built from the ground up for **Android 12 – Android 15+** smartphones, foldables, tablets, and dedicated Android gaming handhelds (Snapdragon 8 Gen 2/3/Elite, MediaTek Dimensity 9300+, Google Tensor G3/G4):

- **ARMv9 big.LITTLE / Heterogeneous Core Pinning (`arm64_neon_sve2` in `src/game/architectOptimization.ts`)**:
  - Pins hot-path `SoA` physics (`cannon-es`), `three-mesh-bvh` raycasting, and `20Hz` siege state reconciliation (`src/game/siegeNetProtocol.ts`) to Cortex-X Prime/Performance cores using 128-bit `NEON` / scalable `SVE2` SIMD lanes, while background telemetry and audio run on Efficiency cores.
- **Mobile `ASTC` Texture & LOD Pipeline (`MOBILE_IMPORT_OVERRIDES` in `src/game/graphicsEngine.ts`)**:
  - Uses **`ASTC 6x6` (`256×256` CanvasTexture PBR, `4x` Anisotropy)**, `1024×1024` shadow maps with small-prop shadow culling, and `320` instanced grass tufts to maintain a cool **`8W` Passive Thermal Envelope (`mobile_passive_8w`)** and **`<= 180 MB` APK/Bundle footprint**.

---

## 2. Touch D-Pad Ergonomics, Foldable Scaling & Security Rules

- **Touchscreen & Controller Support**:
  - Built-in virtual touch D-pad, quick-cast skill buttons, and responsive modal grids (`390×844` phone to `2208×1768` unfolded tablet) with automatic Bluetooth/USB gamepad detection (Xbox, DualSense, Backbone, Razer Kishi).
- **Keystore & Secret Hygiene (`.gitignore`)**:
  - `.gitignore` strictly excludes Android signing keystores (`*.jks`, `*.keystore`), and all privileged operations validate through server-side HMAC-SHA256 sessions (`src/game/serverAuth.ts`) and Firebase ID tokens (`src/middleware/auth.ts`).

---

## 3. Google Play Compliance, 100 Playable Races & Creator Authority (`creatergame31@gmail.com`)

- **Google Play Store Readiness**:
  - Complies with Google Play AI & Procedural Content Disclosure ([`README.md`](./README.md#steam--platform-content-disclosure)), GDPR/CCPA/DPDP Act data deletion/export rights ([`PRIVACY.md`](./PRIVACY.md)), and EULA v1.5.0 acceptance receipts ([`EULA.md`](./EULA.md)).
- **100 Playable Races & Root Creator God Character**:
  - Android players can select from the 10 Core Solara Starter Lineages—or unlock all **100 Playable Species / Races (`#1–#100`)** with Admin (`creatergame31@gmail.com`) permission (`src/game/species.ts`)—while Root Creator **`creatergame31@gmail.com`** commands the Maxed-Out God Character with 12-Domain All-Things Immunity and 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`).
