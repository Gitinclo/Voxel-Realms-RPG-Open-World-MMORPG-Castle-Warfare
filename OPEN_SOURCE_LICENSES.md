# 📂 Open-Source Licenses Matrix (`OPEN_SOURCE_LICENSES.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `21/11/2026`) · **Supreme Author:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

Project source code is licensed under **Apache-2.0** ([`LICENSE`](./LICENSE), [`NOTICE`](./NOTICE)). All dependencies across [`package.json`](./package.json), [`vcpkg.json`](./vcpkg.json), and [`android/gradle/libs.versions.toml`](./android/gradle/libs.versions.toml) (summarized in [`dependency.md`](./dependency.md)) use permissive **MIT**, **Apache-2.0**, **BSD-3-Clause**, and **ISC** licenses with **zero copyleft conflicts**.

---

## 1. Platform License Summary

| Stack Layer                | Manifest                            | License Families Used                       | Apache-2.0 Compatible |
| :------------------------- | :---------------------------------- | :------------------------------------------ | :-------------------- |
| Web & Node.js Runtime      | `package.json`, `package-lock.json` | `MIT`, `Apache-2.0`, `BSD-3-Clause`, `ISC`  | Yes                   |
| C++20 Native Reference     | `vcpkg.json`                        | `MIT`, `BSD-3-Clause`, `Zlib`, `Apache-2.0` | Yes                   |
| Android Client SDK Catalog | `android/gradle/libs.versions.toml` | `Apache-2.0`, `MIT`                         | Yes                   |

---

## 2. Android Open-Source Library License Matrix

| Library                         | Maven / Platform Coordinate                 | SPDX Identifier | Apache-2.0 Compatible |
| :------------------------------ | :------------------------------------------ | :-------------- | :-------------------- |
| **AppAuth-Android**             | `net.openid:appauth`                        | `Apache-2.0`    | Yes                   |
| **Apollo GraphQL Client**       | `com.apollographql.apollo:apollo-runtime`   | `MIT`           | Yes                   |
| **Coil**                        | `io.coil-kt.coil3:coil`                     | `Apache-2.0`    | Yes                   |
| **android-gif-drawable**        | `pl.droidsonroids.gif:android-gif-drawable` | `MIT`           | Yes                   |
| **AndroidSVG**                  | `com.caverock:androidsvg-aar`               | `Apache-2.0`    | Yes                   |
| **jsoup: Java HTML Parser**     | `org.jsoup:jsoup`                           | `MIT`           | Yes                   |
| **PdfViewPager**                | `es.voghdev.pdfviewpager:library`           | `Apache-2.0`    | Yes                   |
| **Lingver**                     | `com.github.YarikSOffice:lingver`           | `Apache-2.0`    | Yes                   |
| **OkHttp**                      | `com.squareup.okhttp3:okhttp`               | `Apache-2.0`    | Yes                   |
| **Android Open Source Project** | `androidx.core:core-ktx` (`AOSP`)           | `Apache-2.0`    | Yes                   |

See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) for upstream copyright notices and attribution links.
