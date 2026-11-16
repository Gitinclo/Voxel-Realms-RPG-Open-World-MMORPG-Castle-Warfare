# 🧠 Architectural Philosophy (`PHILOSOPHY.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

- **Functional Core / Imperative Shell**: Every system (`math.ts`, `cultivationMath.ts`, `avatarCloneShadow.ts`, `siegeNetProtocol.ts`, `omniverse.ts`, `eula.ts`) exposes pure TypeScript functions testable without DOM, WebGL, or live sockets.
- **Transparency Over Hype**: Maintain an explicit runtime catalog (`ENGINEERING_TRANSPARENCY_MATRIX` in `src/game/graphicsEngine.ts`) distinguishing live browser execution (`6 Implemented`) from analytical hardware/bundle models (`2 Simulated`).
- **Deterministic Proceduralism**: Terrain noise (`simplex-noise`), voxel keeps, PBR maps, and `10^100` Akashic lore volumes regenerate identically from deterministic seeds.
