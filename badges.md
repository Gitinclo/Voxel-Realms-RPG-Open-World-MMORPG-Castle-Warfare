# 🏷️ Repository Badges & Status Reference

Centralized badge catalog for **Voxel Realms RPG: Open World MMORPG & Castle Warfare** (`v1.5.0`). All badges use the `flat-square` Shields.io specification so documentation, release notes, and pull requests maintain a unified visual style.

---

## Live Badge Strip

[![CI Workflow](https://img.shields.io/badge/CI_Workflow-Build_%26_Test_Passing-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/ci.yml)
[![Automated Tests](<https://img.shields.io/badge/Automated_Tests-192_Passing_(30_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](./test_strategy.md)
[![Source Version](<https://img.shields.io/badge/Source_Version-1.5.0_(main)-f59e0b?style=flat-square>)](./CHANGELOG.md)
[![TypeScript 7.0](https://img.shields.io/badge/TypeScript-7.0_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19.3-61dafb?style=flat-square&logo=react&logoColor=0f172a)](./package.json)
[![Three.js WebGL2](https://img.shields.io/badge/Three.js-0.187_%2B_BVH_%2B_Cannon_Physics-f59e0b?style=flat-square&logo=threedotjs&logoColor=white)](./Physics.md)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white)](./vite.config.ts)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-4.3-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](./src/index.css)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Node_24_Alpine_%2B_Nginx_Target-2496ed?style=flat-square&logo=docker&logoColor=white)](./DEPLOYMENT.md)
[![Cloud Persistence](https://img.shields.io/badge/Cloud_Data-PostgreSQL_%2B_Firestore-6366f1?style=flat-square&logo=firebase&logoColor=white)](./firebase-blueprint.json)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8b5cf6?style=flat-square)](./LICENSE.md)
[![EULA: v1.5.0](<https://img.shields.io/badge/EULA-v1.5.0_(17%2F11%2F2026)-14b8a6?style=flat-square>)](./EULA.md)

---

## 1. Build, CI/CD & Quality Gates

| Badge                                                                                                                                                                                          | Verification Target                                                       | Command / Workflow                                                                 |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------- |
| [![CI Pipeline](https://img.shields.io/badge/CI-Validate_%26_Audit-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/ci.yml)                                   | Type-check, rules lint, Prettier, unit tests, production build            | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) / `npm run validate`      |
| [![Build & Package](https://img.shields.io/badge/Build-Vite_8_%2B_Docker-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/build.yml)                          | Client bundle & container packaging validation                            | [`.github/workflows/build.yml`](./.github/workflows/build.yml) / `npm run build`   |
| [![Lint & Format](https://img.shields.io/badge/Lint_%26_Format-TS_%2B_ESLint_%2B_Prettier-0ea5e9?style=flat-square&logo=prettier&logoColor=white)](./.github/workflows/lint_and_format.yml)    | `tsc --noEmit`, `eslint firestore.rules`, `prettier --check .`            | [`.github/workflows/lint_and_format.yml`](./.github/workflows/lint_and_format.yml) |
| [![Automated Tests](<https://img.shields.io/badge/Tests-192_Passing_(30_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](./package.json)                                       | `node:test` pure logic, server auth/hardening, and Firestore rules suites | `npm test`                                                                         |
| [![Ops Readiness](https://img.shields.io/badge/Ops_Readiness-Live_Probe_Verified-22c55e?style=flat-square)](./deployment%20validation.md)                                                      | Live `/healthz`, `/readyz`, RBAC, CSRF, WS origin & rate-limit probe      | `npm run verify:ops`                                                               |
| [![Security Audit](https://img.shields.io/badge/Security_Audit-Dependency_%26_Rules_Scan-ef4444?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/security_audit.yml) | Dependency audit & Firestore security rule checks                         | [`.github/workflows/security_audit.yml`](./.github/workflows/security_audit.yml)   |
| [![Nightly Build](https://img.shields.io/badge/Nightly-Scheduled_Verification-6366f1?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/nightly_build.yml)             | Scheduled nightly build & regression verification                         | [`.github/workflows/nightly_build.yml`](./.github/workflows/nightly_build.yml)     |
| [![Release Workflow](https://img.shields.io/badge/Release-Tag_Triggered_v*.*.*-f59e0b?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/release.yml)                  | Automated GitHub Release creation on `v*.*.*` tag push                    | [`.github/workflows/release.yml`](./.github/workflows/release.yml)                 |

### Copy-Paste Markdown (CI/CD)

```markdown
[![CI Workflow](https://img.shields.io/badge/CI_Workflow-Build_%26_Test_Passing-10b981?style=flat-square&logo=githubactions&logoColor=white)](./.github/workflows/ci.yml)
[![Automated Tests](<https://img.shields.io/badge/Automated_Tests-192_Passing_(30_Suites)-38bdf8?style=flat-square&logo=node.js&logoColor=white>)](./test_strategy.md)
[![Ops Readiness](https://img.shields.io/badge/Ops_Readiness-Live_Probe_Verified-22c55e?style=flat-square)](./deployment%20validation.md)
```

---

## 2. Technology Stack & Runtime

| Badge                                                                                                                                                                  | Layer                                                     | Version / Reference                                        |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- | :--------------------------------------------------------- |
| [![React 19](https://img.shields.io/badge/React-19.3-61dafb?style=flat-square&logo=react&logoColor=0f172a)](./package.json)                                            | UI Framework (`React.lazy` code-split modals)             | `react@19.3.1`                                             |
| [![TypeScript 7.0](https://img.shields.io/badge/TypeScript-7.0_Strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](./tsconfig.json)                      | Language & Static Type Checking                           | `typescript@7.0.2`                                         |
| [![Three.js 0.187](https://img.shields.io/badge/Three.js-0.187_WebGL2_PBR-f59e0b?style=flat-square&logo=threedotjs&logoColor=white)](./Physics.md)                     | 3D Engine, `three-mesh-bvh`, `cannon-es`, `simplex-noise` | `three@0.187.0`                                            |
| [![D3.js 7.9](https://img.shields.io/badge/D3.js-7.9_Data_Viz-f97316?style=flat-square&logo=d3dotjs&logoColor=white)](./package.json)                                  | Cosmological Tree & Marketplace Sparklines                | `d3@7.9.2`                                                 |
| [![Vite 8.3](https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white)](./vite.config.ts)                                              | Bundler & Dev Server Middleware                           | `vite@8.3.8`                                               |
| [![Tailwind CSS 4.3](https://img.shields.io/badge/Tailwind_CSS-4.3-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](./src/index.css)                        | Utility-First Styling (`@tailwindcss/vite`)               | `tailwindcss@4.3.5`                                        |
| [![Node.js >=20](<https://img.shields.io/badge/Node.js-%3E%3D20_(Docker_24_Alpine)-339933?style=flat-square&logo=node.js&logoColor=white>)](./Dockerfile)              | Runtime & Authoritative 20Hz WebSocket Server             | `engines.node >=20.0.0`, `node:24-alpine`                  |
| [![Express 4.22](https://img.shields.io/badge/Express-4.22_%2B_RFC_6455_WS-475569?style=flat-square&logo=express&logoColor=white)](./server.ts)                        | HTTP API, HMAC Auth & `/ws/siege` Real-Time Engine        | `express@4.22.3`                                           |
| [![PostgreSQL + Drizzle](https://img.shields.io/badge/Cloud_SQL-PostgreSQL_%2B_Drizzle_0.45-336791?style=flat-square&logo=postgresql&logoColor=white)](./package.json) | Relational Persistence & Schema Migrations                | `pg@8.23.1`, `drizzle-orm@0.45.4`                          |
| [![Firebase 12](https://img.shields.io/badge/Firebase-12.19_Auth_%2B_Firestore-ffca28?style=flat-square&logo=firebase&logoColor=0f172a)](./firestore.rules)            | Google Sign-In & Real-Time Commander Cloud Sync           | `firebase@12.19.0`, `firebase-admin@14.5.1`                |
| [![Docker Multi-Stage](https://img.shields.io/badge/Docker-Multi--Stage_Non--Root-2496ed?style=flat-square&logo=docker&logoColor=white)](./DEPLOYMENT.md)              | Production Container (`runner` + optional `nginx-runner`) | [`Dockerfile`](./Dockerfile), [`nginx.conf`](./nginx.conf) |
| [![C++20 SIMD](https://img.shields.io/badge/C%2B%2B20-SIMD_Architecture_Spec-00599c?style=flat-square&logo=cplusplus&logoColor=white)](./CMakeLists.txt)               | Reference Native Engine Spec & Build Configuration        | [`CMakeLists.txt`](./CMakeLists.txt), [`cpp/`](./cpp)      |

---

## 3. Security, Governance & Legal Compliance

| Badge                                                                                                                                                                       | Scope                                                                | Reference Document                                         |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- | :--------------------------------------------------------- |
| [![Auth: Fail-Closed HMAC](https://img.shields.io/badge/Auth-Fail--Closed_HMAC--SHA256-0f766e?style=flat-square)](./SECURITY.md)                                            | Timing-safe session cookies, brute-force lockout, Origin/CSRF checks | [`SECURITY.md`](./SECURITY.md)                             |
| [![Firestore Rules](https://img.shields.io/badge/Firestore_Rules-Default_Deny_%2B_Tested-16a34a?style=flat-square&logo=firebase&logoColor=white)](./firestore.rules)        | Default-deny security rules linted and unit-tested                   | [`firestore.rules`](./firestore.rules)                     |
| [![HTTP Headers](https://img.shields.io/badge/Headers-CSP_%2B_HSTS_%2B_X--Frame--Options-2563eb?style=flat-square)](./environment%20hardening.md)                           | Hardened Express & Nginx response security headers                   | [`environment hardening.md`](./environment%20hardening.md) |
| [![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8b5cf6?style=flat-square)](./LICENSE.md)                                                            | Open-source software license                                         | [`LICENSE`](./LICENSE), [`LICENSE.md`](./LICENSE.md)       |
| [![EULA: v1.5.0](<https://img.shields.io/badge/EULA-v1.5.0_(17%2F11%2F2026)-14b8a6?style=flat-square>)](./EULA.md)                                                          | 10-Article End User License Agreement & 10-Agreement Legal Stack     | [`EULA.md`](./EULA.md), [`LEGAL.md`](./LEGAL.md)           |
| [![AI-Assisted Tooling](https://img.shields.io/badge/Built_with_%F0%9F%A4%96-AI--Assisted_Engineering_%26_Procedural_WebGL-ec4899?style=flat-square)](./AI_USAGE_POLICY.md) | Transparent platform & procedural content disclosure                 | [`AI_USAGE_POLICY.md`](./AI_USAGE_POLICY.md)               |

---

## 4. Badge Style & Maintenance Conventions

- **Style Standard**: Always append `?style=flat-square` to Shields.io URLs for visual consistency across `README.md`, `badges.md`, and release documentation.
- **Color Palette**:
  - Passing / Verified / Healthy: `#10b981` (emerald) or `#22c55e` (green)
  - Test & Coverage Metrics: `#38bdf8` (sky) or `#0ea5e9` (cyan)
  - Versions / Releases / Warnings: `#f59e0b` (amber)
  - Security / Audit Gates: `#ef4444` (red) or `#0f766e` (teal)
  - Legal & Licensing: `#8b5cf6` (violet) or `#14b8a6` (teal)
- **Sync Checklist**:
  1. When bumping `version` in [`package.json`](./package.json), update the `Source_Version` badge here and in [`README.md`](./README.md).
  2. When adding or modifying automated test suites, run `npm test` and keep the `Automated_Tests` count synchronized with the exact passing count (`192` tests across `30` suites).
  3. After publishing the first `v*.*.*` Git tag via [`.github/workflows/release.yml`](./.github/workflows/release.yml), replace the `Source_Version` static badge with the dynamic GitHub Release badge.
