# 🧪 Verification & Test Strategy (`test_strategy.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. **Static & Rules Gate**: `tsc --noEmit`, `eslint firestore.rules`, `prettier --check .`, C++20 `clang-tidy`/`clang-format`.
2. **Unit & Rules Gate (`npm test`)**: **`168` tests across `28` suites** + C++20 `ctest`.
3. **Live Ops & Chaos Gate (`npm run verify:ops`)**: Isolated server load, exploits, `.bak` failover & `SIGTERM`.
4. **Browser Gate**: Playwright Chromium verification on desktop (`1440x900`) & mobile (`390x844`).
