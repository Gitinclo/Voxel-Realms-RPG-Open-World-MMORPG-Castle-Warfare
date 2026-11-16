# 🧊 Immutable Infrastructure & Reproducible Builds (`immutable_infrastructure.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- Client bundles compile to hashed artifacts under `dist/assets/*` via `vite build`.
- CI locks Node `22`, npm lockfiles, and `vcpkg.json` `builtin-baseline`.
