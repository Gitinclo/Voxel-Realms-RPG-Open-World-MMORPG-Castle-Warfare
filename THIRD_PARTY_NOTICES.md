# 🧾 Third-Party Notices & Attributions (`THIRD_PARTY_NOTICES.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `21/11/2026`) · **Supreme Author:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

This document supplements the root [`NOTICE`](./NOTICE) file and enumerates open-source third-party software attributions across the Web/Node.js runtime (`package.json`), C++20 native reference stack (`vcpkg.json`), and Android companion/native client catalog ([`android/gradle/libs.versions.toml`](./android/gradle/libs.versions.toml)).

---

## 1. Web, Server & C++20 Third-Party Attributions

- **Web & Server Runtime (`package.json`):** React 19, Three.js, `three-mesh-bvh`, `cannon-es`, `simplex-noise`, D3.js, Drizzle ORM, Express, Tailwind CSS, Lucide React, Motion, `pg`, and Firebase SDKs.
- **Native C++20 Reference Stack (`vcpkg.json`):** EnTT, `{fmt}`, GLM, SDL2, Bullet3, FastNoise2, Recast Navigation, ENet, LZ4, and GoogleTest.

---

## 2. Android Client Open-Source Libraries & Platform Attributions (`android/gradle/libs.versions.toml`)

| Component                       | Upstream Repository / Project                                                     | Copyright / Maintainer                              | License      |
| :------------------------------ | :-------------------------------------------------------------------------------- | :-------------------------------------------------- | :----------- |
| **AppAuth-Android**             | [`openid/AppAuth-Android`](https://github.com/openid/AppAuth-Android)             | The AppAuth for Android Authors (OpenID Foundation) | `Apache-2.0` |
| **Apollo GraphQL Client**       | [`apollographql/apollo-kotlin`](https://github.com/apollographql/apollo-kotlin)   | Apollo Graph, Inc.                                  | `MIT`        |
| **Coil**                        | [`coil-kt/coil`](https://github.com/coil-kt/coil)                                 | Coil Contributors                                   | `Apache-2.0` |
| **android-gif-drawable**        | [`koral--/android-gif-drawable`](https://github.com/koral--/android-gif-drawable) | Karol Wrótniak (Droids On Roids)                    | `MIT`        |
| **AndroidSVG**                  | [`BigBadaboom/androidsvg`](https://github.com/BigBadaboom/androidsvg)             | Paul LeBeau (Cave Rock Software)                    | `Apache-2.0` |
| **jsoup: Java HTML Parser**     | [`jhy/jsoup`](https://github.com/jhy/jsoup)                                       | Jonathan Hedley                                     | `MIT`        |
| **PdfViewPager**                | [`voghDev/PdfViewPager`](https://github.com/voghDev/PdfViewPager)                 | Olmo Gallegos Hernández (voghDev)                   | `Apache-2.0` |
| **Lingver**                     | [`YarikSOffice/lingver`](https://github.com/YarikSOffice/lingver)                 | Yaroslav Berezanskyi (YarikSOffice)                 | `Apache-2.0` |
| **OkHttp**                      | [`square/okhttp`](https://github.com/square/okhttp)                               | Square, Inc.                                        | `Apache-2.0` |
| **Android Open Source Project** | [`source.android.com`](https://source.android.com/)                               | The Android Open Source Project (Google LLC)        | `Apache-2.0` |

All notices above are verified automatically by `src/game/androidDependencies.test.ts` and tracked in [`OPEN_SOURCE_LICENSES.md`](./OPEN_SOURCE_LICENSES.md) and [`dependency.md`](./dependency.md).
