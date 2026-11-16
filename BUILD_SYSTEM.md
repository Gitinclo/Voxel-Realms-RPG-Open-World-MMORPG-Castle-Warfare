# Build System & Bundling Architecture (`BUILD_SYSTEM.md`)

Build pipeline specification covering **Vite 8 (Rolldown)** code-splitting, **TypeScript 7** strict compilation, **Express + `tsx`** server execution, and the **C++20 + CMake + `vcpkg`** native engine target.

---

## 1. Client Bundle Architecture (`vite.config.ts`)

- **Bundler**: Vite `^8.3.8` using `@vitejs/plugin-react` (`^6.3.0`) and `@tailwindcss/vite` (`^4.3.5`).
- **Route/Modal Lazy Loading (`src/App.tsx`)**: All 19 conditional overlay modals (`AdminConsoleModal`, `ClanModal`, `CultivationModal`, `GmailModal`, `EulaModal`, `CosmologicalAdminModal`, `LoreHistoryModal`, etc.) are dynamically imported via `React.lazy` inside `<Suspense fallback={null}>` so initial paint loads only `TitleScreen`, `GameCanvas`, and `GameHUD`.
- **Rolldown `manualChunks` Partitioning**:
  - `vendor-three`: Three.js core, post-processing passes, `three-mesh-bvh`, `cannon-es`
  - `vendor-firebase`: Firebase client SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`)
  - `vendor-d3`: `d3-hierarchy`, `d3-zoom`, `d3-selection`
  - `vendor-motion`: `motion`
  - `vendor-icons`: `lucide-react`
  - `vendor-react`: `react`, `react-dom`
- **Target Budgets**: Entry client JS chunk stays near `~475 kB` (`~151 kB` gzipped), eliminating monolithic bundle warnings.

---

## 2. TypeScript Configuration (`tsconfig.json`)

- **Compiler Flags**: Strict mode (`strict: true`), `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`, ESM module resolution compatible with Vite 8 and Node `>=20`.
- **Verification**: `npm run lint` executes `tsc --noEmit` across `src/`, `server.ts`, `scripts/`, and test suites with zero emitted JS artifacts.

---

## 3. Full-Stack Node.js Server (`server.ts`)

- Executed directly in TypeScript via `tsx server.ts` (`package.json` `"dev"` and `"start"` scripts).
- **Development Mode**: Serves Vite middleware inline while preserving Express `/api/*` and `/ws/siege` handlers on port `3000`.
- **Production Mode (`NODE_ENV=production`)**: Serves pre-built static assets from `dist/` with fail-closed secret verification.

---

## 4. Native C++20 Guardrail Build (`CMakeLists.txt` & `vcpkg.json`)

- **Standard**: C++20 (`CMAKE_CXX_STANDARD 20`, zero raw owning `new`/`delete`).
- **Locked Dependencies (`vcpkg.json`)**: `entt`, `fmt`, `glm`, `sdl2`, `bullet3`, `fastnoise2`, `recastnavigation`, `enet`, `lz4`, and `gtest`.
- **Validation**: `ctest` executes `cpp/engine_guardrail_test.cpp` verifying `constexpr` Realm Suppression (`100.0x`), `WhitePageRootSpec` bounds (`100` Overvoids), and `alignas(64)` Structure-of-Arrays cache-line layout.
