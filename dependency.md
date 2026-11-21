# 📦 Dependency Inventory & Supply-Chain Ledger (`dependency.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `21/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service) · **Engine:** Node.js `>=22.0.0`

This document tracks every runtime dependency, development tool, transitive security override, native C++20 package, and Android client library declared in [`package.json`](./package.json), [`vcpkg.json`](./vcpkg.json), and [`android/gradle/libs.versions.toml`](./android/gradle/libs.versions.toml).

---

## 1. Node.js & Runtime Dependencies (`package.json`)

| Package                  | Locked Version | Scope   | Architectural Purpose                                                                               |
| :----------------------- | :------------- | :------ | :-------------------------------------------------------------------------------------------------- |
| `@google/genai`          | `3.6.1`        | Runtime | Production dependency                                                                               |
| `@tailwindcss/vite`      | `4.3.5`        | Runtime | Production dependency                                                                               |
| `@tweenjs/tween.js`      | `25.0.0`       | Runtime | Production dependency                                                                               |
| `@types/canvas-confetti` | `1.9.0`        | Runtime | Production dependency                                                                               |
| `@types/d3`              | `7.4.3`        | Runtime | Production dependency                                                                               |
| `@types/pg`              | `8.23.1`       | Runtime | Production dependency                                                                               |
| `@types/three`           | `0.187.0`      | Runtime | Production dependency                                                                               |
| `@vitejs/plugin-react`   | `6.3.0`        | Runtime | Production dependency                                                                               |
| `cannon-es`              | `0.20.0`       | Runtime | Production dependency                                                                               |
| `canvas-confetti`        | `1.9.4`        | Runtime | Production dependency                                                                               |
| `d3`                     | `7.9.2`        | Runtime | Production dependency                                                                               |
| `dotenv`                 | `18.0.10`      | Runtime | Production dependency                                                                               |
| `drizzle-kit`            | `0.31.11`      | Runtime | Production dependency                                                                               |
| `drizzle-orm`            | `0.45.4`       | Runtime | Production dependency                                                                               |
| `express`                | `5.3.0`        | Runtime | Production dependency                                                                               |
| `firebase`               | `13.4.0`       | Runtime | Production dependency (modular client SDK; CI & Docker run on Node `26` LTS satisfying `>=24.12.0`) |
| `firebase-admin`         | `14.5.1`       | Runtime | Production dependency                                                                               |
| `lucide-react`           | `1.77.0`       | Runtime | Production dependency                                                                               |
| `motion`                 | `14.14.0`      | Runtime | Production dependency                                                                               |
| `pg`                     | `8.23.1`       | Runtime | Production dependency                                                                               |
| `react`                  | `19.3.1`       | Runtime | Production dependency                                                                               |
| `react-dom`              | `19.3.1`       | Runtime | Production dependency                                                                               |
| `simplex-noise`          | `4.0.3`        | Runtime | Production dependency                                                                               |
| `three`                  | `0.187.0`      | Runtime | Production dependency                                                                               |
| `three-mesh-bvh`         | `0.9.18`       | Runtime | Production dependency                                                                               |
| `tsx`                    | `4.23.15`      | Runtime | Production dependency                                                                               |
| `vite`                   | `8.3.8`        | Runtime | Production dependency                                                                               |

---

## 2. Development & Build Dependencies

| Package                                  | Locked Version | Scope       | Architectural Purpose                                              |
| :--------------------------------------- | :------------- | :---------- | :----------------------------------------------------------------- |
| `@firebase/eslint-plugin-security-rules` | `0.0.2`        | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `@types/express`                         | `5.0.6`        | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `@types/node`                            | `26.6.6`       | Dev / Build | Toolchain / Type checking (aligned with Docker Node 26 Alpine LTS) |
| `@types/react`                           | `19.3.0`       | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `@types/react-dom`                       | `19.3.0`       | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `autoprefixer`                           | `10.7.0`       | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `esbuild`                                | `0.28.2`       | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `eslint`                                 | `10.15.0`      | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `playwright`                             | `1.65.1`       | Dev / Build | Headless Chromium E2E & modal visual diff                          |
| `prettier`                               | `3.10.1`       | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `tailwindcss`                            | `4.3.5`        | Dev / Build | Toolchain / Type checking / Rules linting                          |
| `typescript`                             | `7.0.2`        | Dev / Build | Toolchain / Type checking / Rules linting                          |

---

## 3. Security & Engine Overrides (`npm audit --audit-level=high` = `0` Vulnerabilities)

| Package              | Forced Version                  | Mechanism           | Rationale                                                                               |
| :------------------- | :------------------------------ | :------------------ | :-------------------------------------------------------------------------------------- |
| `@grpc/grpc-js`      | `1.14.7`                        | Transitive Override | Mitigates upstream security advisories (`0` high vulns)                                 |
| `@tailwindcss/node`  | `4.3.5`                         | Transitive Override | Locks `@tailwindcss/node` to match `tailwindcss@4.3.5` & `@tailwindcss/vite@4.3.5`      |
| `@tailwindcss/oxide` | `4.3.5`                         | Transitive Override | Locks `@tailwindcss/oxide` Rust/WASM engine to `4.3.5`                                  |
| `@tailwindcss/vite`  | `4.3.5`                         | Transitive Override | Locks `@tailwindcss/vite` plugin to `4.3.5`                                             |
| `@tweenjs/tween.js`  | `25.0.0`                        | Transitive Override | Deduplicates `@types/three` nested `~23.1.3` dependency onto `@tweenjs/tween.js@25.0.0` |
| `esbuild`            | `0.28.2`                        | Transitive Override | Mitigates upstream security advisories (`0` high vulns)                                 |
| `minimatch`          | `11.0.8`                        | Transitive Override | Mitigates upstream security advisories (`0` high vulns)                                 |
| `picomatch`          | `npm:@ryotsu/picomatch@4.0.7-a` | Transitive Override | Mitigates `GHSA-fc5q-39xc-vjpf` single-branch extglob ReDoS (`0` high vulns)            |

---

## 4. C++20 Engine Dependencies (`vcpkg.json`)

| Library            | Version Constraint (`>=`) | Baseline Commit                            | Architectural Purpose                                         |
| :----------------- | :------------------------ | :----------------------------------------- | :------------------------------------------------------------ |
| `entt`             | `>=3.14.0`                | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Entity-Component-System (ECS) sparse-set registry (`SoA`)     |
| `fmt`              | `>=11.0.2`                | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Fast type-safe C++20 string & telemetry formatting            |
| `glm`              | `>=1.0.1`                 | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | SIMD-aligned 3D vector, quaternion & matrix math              |
| `sdl2`             | `>=2.30.9`                | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Cross-platform desktop/mobile windowing & gamepad input       |
| `bullet3`          | `>=3.25`                  | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native 3D rigid-body physics & siege ballistics               |
| `fastnoise2`       | `>=0.10.0-alpha`          | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | SIMD-accelerated 2D/3D/4D Simplex & fBm terrain generation    |
| `recastnavigation` | `>=1.6.0`                 | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | 3D NavMesh generation & A\* crowd pathfinding around keeps    |
| `enet`             | `>=1.3.18`                | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Reliable/unreliable UDP transport for native 20Hz siege ticks |
| `lz4`              | `>=1.10.0`                | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | High-speed frame & snapshot delta compression                 |
| `gtest`            | `>=1.15.2`                | `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | C++20 CTest guardrail unit test framework                     |

---

## 5. Android Client Dependencies (`android/gradle/libs.versions.toml`)

All 10 Android open-source libraries declared in [`android/gradle/libs.versions.toml`](./android/gradle/libs.versions.toml) and validated by `src/game/androidDependencies.test.ts` use Apache-2.0-compatible permissive licenses (`Apache-2.0` / `MIT`):

| Library                         | Maven / Platform Coordinate                 | Version  | License      | Architectural Purpose                                                                                   |
| :------------------------------ | :------------------------------------------ | :------- | :----------- | :------------------------------------------------------------------------------------------------------ |
| **AppAuth-Android**             | `net.openid:appauth`                        | `0.11.1` | `Apache-2.0` | RFC 8252 OAuth 2.0 / OpenID Connect (PKCE) sign-in and session bootstrap on Android                     |
| **Apollo GraphQL Client**       | `com.apollographql.apollo:apollo-runtime`   | `4.1.1`  | `MIT`        | Typed Kotlin GraphQL client and normalized cache for nested RPG inventory, profile, and clan UIs        |
| **Coil**                        | `io.coil-kt.coil3:coil`                     | `3.0.4`  | `Apache-2.0` | Coroutine-backed Android image loading with OkHttp networking and memory/disk caching                   |
| **android-gif-drawable**        | `pl.droidsonroids.gif:android-gif-drawable` | `1.2.29` | `MIT`        | JNI-accelerated animated GIF decoding and `Drawable` rendering for emotes, skills, and world alerts     |
| **AndroidSVG**                  | `com.caverock:androidsvg-aar`               | `1.4`    | `Apache-2.0` | Resolution-independent SVG 1.1 vector rendering for faction crests, clan emblems, and glyphs            |
| **jsoup: Java HTML Parser**     | `org.jsoup:jsoup`                           | `1.18.3` | `MIT`        | Safe HTML5 DOM parsing and `Safelist` sanitization for patch notes, news, and in-game mail previews     |
| **PdfViewPager**                | `es.voghdev.pdfviewpager:library`           | `1.1.2`  | `Apache-2.0` | Paged in-app PDF viewer for offline lore codices, legal agreements, and siege strategy guides           |
| **Lingver**                     | `com.github.YarikSOffice:lingver`           | `1.3.0`  | `Apache-2.0` | Runtime locale persistence and dynamic multi-language switching on Android                              |
| **OkHttp**                      | `com.squareup.okhttp3:okhttp`               | `4.12.0` | `Apache-2.0` | HTTP/2, TLS 1.3 connection pooling, certificate pinning, and RFC 6455 WebSocket transport (`/ws/siege`) |
| **Android Open Source Project** | `androidx.core:core-ktx` (`API 31–35`)      | `1.15.0` | `Apache-2.0` | Core Android OS APIs, AndroidX Jetpack libraries, Vulkan/NDK surface lifecycle, and Keystore primitives |

---

## 6. GitHub Actions & CI/CD Workflow Dependencies (`.github/workflows/*.yml`)

All 15 automated workflows under `.github/workflows/` declare explicit top-level least-privilege `permissions:`, are tracked by [`.github/dependabot.yml`](./.github/dependabot.yml) (`npm`, `github-actions`, and `docker`), and are standardized on Node.js `26` LTS with Node-24-compatible actions:

| GitHub Action                           | Version | Workflows Using Action                                                                                                                                                                                                                                                              | Architectural Purpose                                                                    |
| :-------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `actions/checkout`                      | `@v7`   | All checkout workflows (`build.yml`, `cd.yml`, `ci.yml`, `codeql.yml`, `deploy-staging.yml`, `docs_deploy.yml`, `lint_and_format.yml`, `nightly_build.yml`, `pages-webgl.yml`, `release-gates.yml`, `release.yml`, `release_drafter.yml`, `security_audit.yml`, `staging-soak.yml`) | Checks out repository source & release tags across CI/CD jobs                            |
| `actions/setup-node`                    | `@v7`   | `build.yml`, `cd.yml`, `ci.yml`, `docs_deploy.yml`, `lint_and_format.yml`, `nightly_build.yml`, `pages-webgl.yml`, `release-gates.yml`, `release.yml`, `security_audit.yml`, `staging-soak.yml`                                                                                     | Provisions Node.js `26` LTS runtime with deterministic `npm` lockfile cache              |
| `actions/upload-artifact`               | `@v7`   | `build.yml`, `ci.yml`, `deploy-staging.yml`, `release-gates.yml`, `staging-soak.yml`                                                                                                                                                                                                | Uploads verified build, coverage, E2E, SBOM, rollout, and soak evidence artifacts        |
| `github/codeql-action/init` & `analyze` | `@v4`   | `codeql.yml`                                                                                                                                                                                                                                                                        | Static security scanning for `javascript-typescript` and `actions` (`security-extended`) |
| `actions/stale`                         | `@v11`  | `stale_issues.yml`                                                                                                                                                                                                                                                                  | Automated inactive issue/PR triage (exempting `security`, `sev-1`, `sev-2`)              |

---

## 7. Verification Commands

```bash
npm audit --audit-level=high   # Verify 0 high/critical CVEs
npm outdated                   # Verify 0 outdated direct dependencies
npm run validate               # Verify lockfile:verify, tsc --noEmit, firestore.rules lint, Prettier, 258 tests (49 suites) & Vite build
```
