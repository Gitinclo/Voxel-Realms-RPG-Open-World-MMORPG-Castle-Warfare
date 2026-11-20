# 🧪 Verification & Test Strategy (`test_strategy.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. **Static, Lockfile & Rules Gate**: `npm run lockfile:verify`, `tsc --noEmit`, `eslint firestore.rules`, `prettier --check .`, C++20 `clang-tidy`/`clang-format`.
2. **Unit & Rules Gate (`npm test`)**: **`217` tests across `37` TypeScript test files** (`109` cross-system architectural invariants) + C++20 `ctest`.
3. **Live Ops & Chaos Gate (`npm run verify:ops`)**: Isolated server load (`50` live `20Hz` WS peers), authoritative economy mutations, exploits, `.bak` failover & `SIGTERM`.
4. **Browser E2E & Visual Regression Gate (`npm run verify:e2e`)**: Playwright headless Chromium verification on desktop (`1440x900`) & mobile (`390x844`) + 6 key modal visual baselines (`e2e/baselines/`).
