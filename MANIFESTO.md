# 📜 The Engineering Manifesto (`MANIFESTO.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

1. **Plan Before Coding (Architect-First)**: Domain types (`src/types/`), pure logic (`src/game/`), and unit tests (`*.test.ts`) precede UI hooks or Three.js shaders.
2. **Pure Core, Thin Shell**: Keep React 19 components and Express routes free of entangled combat/cultivation formulas.
3. **Fail Closed Always**: Any missing credential, forged Bearer token, tampered save checksum, or unauthenticated admin call returns `401`/`403`/`503`—never permissive fallbacks.
4. **Measure What Matters**: Claiming performance or security requires live verification via `npm run verify:ops` and real Chromium inspection.
5. **Respect Precision**: Use `BigInt` for economy/troops above `9e15` and `int16` fixed-point quantization (`0.01m`) for network coordinates.
