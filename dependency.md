# 📦 Dependency Inventory & Supply-Chain Ledger (`dependency.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

This document tracks every runtime dependency, development tool, transitive security override, and native C++20 package declared in [`package.json`](./package.json) and [`vcpkg.json`](./vcpkg.json).

---

## 1. Node.js & Runtime Dependencies (`package.json`)

| Package                  | Locked Version | Scope   | Architectural Purpose |
| :----------------------- | :------------- | :------ | :-------------------- |
| `@google/genai`          | `2.32.0`       | Runtime | Production dependency |
| `@tailwindcss/vite`      | `4.3.5`        | Runtime | Production dependency |
| `@tweenjs/tween.js`      | `25.0.0`       | Runtime | Production dependency |
| `@types/canvas-confetti` | `1.9.0`        | Runtime | Production dependency |
| `@types/d3`              | `7.4.3`        | Runtime | Production dependency |
| `@types/pg`              | `8.23.1`       | Runtime | Production dependency |
| `@types/three`           | `0.187.0`      | Runtime | Production dependency |
| `@vitejs/plugin-react`   | `6.3.0`        | Runtime | Production dependency |
| `cannon-es`              | `0.20.0`       | Runtime | Production dependency |
| `canvas-confetti`        | `1.9.4`        | Runtime | Production dependency |
| `d3`                     | `7.9.2`        | Runtime | Production dependency |
| `dotenv`                 | `17.4.2`       | Runtime | Production dependency |
| `drizzle-kit`            | `0.31.11`      | Runtime | Production dependency |
| `drizzle-orm`            | `0.45.4`       | Runtime | Production dependency |
| `express`                | `4.22.3`       | Runtime | Production dependency |
| `firebase`               | `12.19.0`      | Runtime | Production dependency |
| `firebase-admin`         | `14.5.1`       | Runtime | Production dependency |
| `lucide-react`           | `0.546.0`      | Runtime | Production dependency |
| `motion`                 | `12.43.0`      | Runtime | Production dependency |
| `pg`                     | `8.23.1`       | Runtime | Production dependency |
| `react`                  | `19.3.1`       | Runtime | Production dependency |
| `react-dom`              | `19.3.1`       | Runtime | Production dependency |
| `simplex-noise`          | `4.0.3`        | Runtime | Production dependency |
| `three`                  | `0.187.0`      | Runtime | Production dependency |
| `three-mesh-bvh`         | `0.9.18`       | Runtime | Production dependency |
| `tsx`                    | `4.23.15`      | Runtime | Production dependency |
| `vite`                   | `8.3.8`        | Runtime | Production dependency |

---

## 2. Development & Build Dependencies

| Package                                  | Locked Version | Scope       | Architectural Purpose                     |
| :--------------------------------------- | :------------- | :---------- | :---------------------------------------- |
| `@firebase/eslint-plugin-security-rules` | `0.0.2`        | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/express`                         | `4.17.25`      | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/node`                            | `22.20.5`      | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/react`                           | `19.3.0`       | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/react-dom`                       | `19.3.0`       | Dev / Build | Toolchain / Type checking / Rules linting |
| `autoprefixer`                           | `10.6.2`       | Dev / Build | Toolchain / Type checking / Rules linting |
| `esbuild`                                | `0.28.2`       | Dev / Build | Toolchain / Type checking / Rules linting |
| `eslint`                                 | `10.15.0`      | Dev / Build | Toolchain / Type checking / Rules linting |
| `prettier`                               | `3.10.1`       | Dev / Build | Toolchain / Type checking / Rules linting |
| `tailwindcss`                            | `4.3.5`        | Dev / Build | Toolchain / Type checking / Rules linting |
| `typescript`                             | `7.0.2`        | Dev / Build | Toolchain / Type checking / Rules linting |

---

## 3. Security & Engine Overrides (`npm audit --audit-level=high` = `0` Vulnerabilities)

| Package                     | Forced Version                  | Mechanism           | Rationale                                                                    |
| :-------------------------- | :------------------------------ | :------------------ | :--------------------------------------------------------------------------- |
| `@firebase/app`             | `0.16.2`                        | Transitive Override | Locks Node 22 compatible `@firebase/*` engine (`0` `EBADENGINE` warnings)    |
| `@firebase/app-compat`      | `0.5.18`                        | Transitive Override | Locks Node 22 compatible `@firebase/*` engine (`0` `EBADENGINE` warnings)    |
| `@firebase/database`        | `1.1.5`                         | Transitive Override | Locks Node 22 compatible `@firebase/*` engine (`0` `EBADENGINE` warnings)    |
| `@firebase/database-compat` | `2.1.7`                         | Transitive Override | Locks Node 22 compatible `@firebase/*` engine (`0` `EBADENGINE` warnings)    |
| `@grpc/grpc-js`             | `1.14.7`                        | Transitive Override | Mitigates upstream security advisories (`0` high vulns)                      |
| `esbuild`                   | `0.28.2`                        | Transitive Override | Mitigates upstream security advisories (`0` high vulns)                      |
| `minimatch`                 | `11.0.8`                        | Transitive Override | Mitigates upstream security advisories (`0` high vulns)                      |
| `picomatch`                 | `npm:@ryotsu/picomatch@4.0.7-a` | Transitive Override | Mitigates `GHSA-fc5q-39xc-vjpf` single-branch extglob ReDoS (`0` high vulns) |

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

## 5. GitHub Actions & CI/CD Workflow Dependencies (`.github/workflows/*.yml`)

All 10 automated workflows under `.github/workflows/` are tracked by [`.github/dependabot.yml`](./.github/dependabot.yml) (`package-ecosystem: "github-actions"`) and standardized on Node.js `22`:

| GitHub Action             | Version | Workflows Using Action                                                                                                                                     | Architectural Purpose                                                     |
| :------------------------ | :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `actions/checkout`        | `@v7`   | `build.yml`, `cd.yml`, `ci.yml`, `docs_deploy.yml`, `lint_and_format.yml`, `nightly_build.yml`, `release.yml`, `release_drafter.yml`, `security_audit.yml` | Checks out repository source & release tags across CI/CD jobs             |
| `actions/setup-node`      | `@v7`   | `build.yml`, `cd.yml`, `ci.yml`, `docs_deploy.yml`, `lint_and_format.yml`, `nightly_build.yml`, `release.yml`, `security_audit.yml`                        | Provisions Node.js `22` runtime with deterministic `npm` lockfile cache   |
| `actions/upload-artifact` | `@v7`   | `build.yml`                                                                                                                                                | Uploads verified `dist/` production bundle artifact (`14`-day retention)  |
| `actions/stale`           | `@v11`  | `stale_issues.yml`                                                                                                                                         | Automated 60-day inactive issue/PR triage (exempting `security`, `SEV-1`) |

---

## 6. Verification Commands

```bash
npm audit --audit-level=high   # Verify 0 high/critical CVEs
npm outdated                   # Inspect minor/major drift safely
npm run validate               # Verify tsc --noEmit, firestore.rules lint, Prettier, 171 tests & Vite build
```
