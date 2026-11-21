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

---

## 4. Android Client SDK & Open-Source Library Stack (`android/gradle/libs.versions.toml`)

The reference Android companion and native client dependency catalog is declared in [`android/gradle/libs.versions.toml`](./android/gradle/libs.versions.toml) and mirrored in [`src/game/androidDependencies.ts`](./src/game/androidDependencies.ts), [`dependency.md`](./dependency.md), [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md), and [`OPEN_SOURCE_LICENSES.md`](./OPEN_SOURCE_LICENSES.md). All libraries use permissive `Apache-2.0` or `MIT` licenses:

| Library                         | Maven / Platform Coordinate                 | Version  | License      | Role in Voxel Realms Android Client                                                                                 |
| :------------------------------ | :------------------------------------------ | :------- | :----------- | :------------------------------------------------------------------------------------------------------------------ |
| **AppAuth-Android**             | `net.openid:appauth`                        | `0.11.1` | `Apache-2.0` | RFC 8252 OAuth 2.0 / OpenID Connect (PKCE) sign-in and session bootstrap without embedded WebViews                  |
| **Apollo GraphQL Client**       | `com.apollographql.apollo:apollo-runtime`   | `4.1.1`  | `MIT`        | Strongly typed Kotlin GraphQL runtime and normalized cache for nested inventory, profile, and clan UI trees         |
| **Coil**                        | `io.coil-kt.coil3:coil`                     | `3.0.4`  | `Apache-2.0` | Coroutine-backed image loading with OkHttp transport and memory/disk caching for portraits, banners, and icons      |
| **android-gif-drawable**        | `pl.droidsonroids.gif:android-gif-drawable` | `1.2.29` | `MIT`        | JNI-accelerated animated GIF decoding and `Drawable` rendering for emote reactions, skill previews, and boss alerts |
| **AndroidSVG**                  | `com.caverock:androidsvg-aar`               | `1.4`    | `Apache-2.0` | Resolution-independent SVG 1.1 vector rendering for faction crests, clan emblems, and cosmological realm glyphs     |
| **jsoup: Java HTML Parser**     | `org.jsoup:jsoup`                           | `1.18.3` | `MIT`        | HTML5 DOM parsing and strict allowlist sanitization (`Safelist`) for patch notes, news, and in-game mail previews   |
| **PdfViewPager**                | `es.voghdev.pdfviewpager:library`           | `1.1.2`  | `Apache-2.0` | Paged in-app PDF viewer for offline lore codices, legal agreements (`EULA`/`PRIVACY`), and siege strategy guides    |
| **Lingver**                     | `com.github.YarikSOffice:lingver`           | `1.3.0`  | `Apache-2.0` | Runtime locale persistence and dynamic multi-language switching without restarting OS language settings             |
| **OkHttp**                      | `com.squareup.okhttp3:okhttp`               | `4.12.0` | `Apache-2.0` | HTTP/2, TLS 1.3 connection pooling, certificate pinning, and RFC 6455 WebSocket transport (`/ws/siege`)             |
| **Android Open Source Project** | `androidx.core:core-ktx` (`API 31–35`)      | `1.15.0` | `Apache-2.0` | Core Android OS APIs, AndroidX Jetpack compat/lifecycle utilities, Vulkan/NDK surfaces, and hardware Keystore       |
