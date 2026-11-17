# 🧰 Test Harnesses Specification (`test_harness.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- `tsx --test` executes all `28` suites in `~4s`.
- `scripts/verify-readiness.ts` spawns an isolated production server, drives 50-way HTTP & 12 WS peers, injects attacks/truncation, and asserts `0` tick overruns.
- `playwright-cli` validates real WebGL rendering, Hero Clones/Shadows UI, and zero console errors.
