# 📦 Dependency Inventory & Supply-Chain Ledger (`dependency.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

This document tracks every runtime dependency, development tool, transitive security override, and native C++20 package declared in [`package.json`](./package.json) and [`vcpkg.json`](./vcpkg.json).

---

## 1. Node.js & Runtime Dependencies (`package.json`)

| Package                  | Version Range | Scope   | Architectural Purpose |
| :----------------------- | :------------ | :------ | :-------------------- |
| `@google/genai`          | `^2.32.0`     | Runtime | Production dependency |
| `@tailwindcss/vite`      | `^4.3.5`      | Runtime | Production dependency |
| `@tweenjs/tween.js`      | `^25.0.0`     | Runtime | Production dependency |
| `@types/canvas-confetti` | `^1.9.0`      | Runtime | Production dependency |
| `@types/d3`              | `^7.4.3`      | Runtime | Production dependency |
| `@types/pg`              | `^8.23.1`     | Runtime | Production dependency |
| `@types/three`           | `^0.187.0`    | Runtime | Production dependency |
| `@vitejs/plugin-react`   | `^6.3.0`      | Runtime | Production dependency |
| `cannon-es`              | `^0.20.0`     | Runtime | Production dependency |
| `canvas-confetti`        | `^1.9.4`      | Runtime | Production dependency |
| `d3`                     | `^7.9.2`      | Runtime | Production dependency |
| `dotenv`                 | `^17.2.3`     | Runtime | Production dependency |
| `drizzle-kit`            | `^0.31.11`    | Runtime | Production dependency |
| `drizzle-orm`            | `^0.45.4`     | Runtime | Production dependency |
| `express`                | `^4.21.2`     | Runtime | Production dependency |
| `firebase`               | `^13.3.0`     | Runtime | Production dependency |
| `firebase-admin`         | `^14.5.1`     | Runtime | Production dependency |
| `lucide-react`           | `^0.546.0`    | Runtime | Production dependency |
| `motion`                 | `^12.23.24`   | Runtime | Production dependency |
| `pg`                     | `^8.23.1`     | Runtime | Production dependency |
| `react`                  | `^19.0.1`     | Runtime | Production dependency |
| `react-dom`              | `^19.0.1`     | Runtime | Production dependency |
| `simplex-noise`          | `^4.0.3`      | Runtime | Production dependency |
| `three`                  | `^0.187.0`    | Runtime | Production dependency |
| `three-mesh-bvh`         | `^0.9.18`     | Runtime | Production dependency |
| `tsx`                    | `^4.21.0`     | Runtime | Production dependency |
| `vite`                   | `^8.3.8`      | Runtime | Production dependency |

---

## 2. Development & Build Dependencies

| Package                                  | Version Range | Scope       | Architectural Purpose                     |
| :--------------------------------------- | :------------ | :---------- | :---------------------------------------- |
| `@firebase/eslint-plugin-security-rules` | `^0.0.2`      | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/express`                         | `^4.17.21`    | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/node`                            | `^22.14.0`    | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/react`                           | `^19.3.0`     | Dev / Build | Toolchain / Type checking / Rules linting |
| `@types/react-dom`                       | `^19.3.0`     | Dev / Build | Toolchain / Type checking / Rules linting |
| `autoprefixer`                           | `^10.6.2`     | Dev / Build | Toolchain / Type checking / Rules linting |
| `esbuild`                                | `^0.28.2`     | Dev / Build | Toolchain / Type checking / Rules linting |
| `eslint`                                 | `^10.15.0`    | Dev / Build | Toolchain / Type checking / Rules linting |
| `prettier`                               | `^3.10.1`     | Dev / Build | Toolchain / Type checking / Rules linting |
| `tailwindcss`                            | `^4.3.5`      | Dev / Build | Toolchain / Type checking / Rules linting |
| `typescript`                             | `^7.0.2`      | Dev / Build | Toolchain / Type checking / Rules linting |

---

## 3. Security Overrides (`npm audit --audit-level=high` = `0` Vulnerabilities)

| Package         | Forced Range | Mechanism           | Rationale                                               |
| :-------------- | :----------- | :------------------ | :------------------------------------------------------ |
| `@grpc/grpc-js` | `^1.14.7`    | Transitive Override | Mitigates upstream security advisories (`0` high vulns) |
| `esbuild`       | `^0.28.2`    | Transitive Override | Mitigates upstream security advisories (`0` high vulns) |
| `minimatch`     | `^11.0.8`    | Transitive Override | Mitigates upstream security advisories (`0` high vulns) |

---

## 4. C++20 Engine Dependencies (`vcpkg.json`)

| Library           | Version / Baseline                                  | Scope        | Manifest                        |
| :---------------- | :-------------------------------------------------- | :----------- | :------------------------------ |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |
| `[object Object]` | Baseline `b1b19307e2d2ec1eefbdb7ea069de7d4bcd31f01` | Native C++20 | `vcpkg.json` / `CMakeLists.txt` |

---

## 5. Verification Commands

```bash
npm audit --audit-level=high   # Verify 0 high/critical CVEs
npm outdated                   # Inspect minor/major drift safely
npm run validate               # Verify tsc --noEmit, firestore.rules lint, Prettier, 168 tests & Vite build
```
