# 💰 Infrastructure & Cloud Cost Optimization (`cost_optimization.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- Zero external 3D/audio CDN egress via procedural Three.js, Canvas PBR & Web Audio synthesis.
- Lazy Cloud SQL `pg.Pool` avoids waking scale-to-zero databases for static/anonymous views.
- Delta `int16` WS compression shrinks siege bandwidth by `~58%–62%`.
