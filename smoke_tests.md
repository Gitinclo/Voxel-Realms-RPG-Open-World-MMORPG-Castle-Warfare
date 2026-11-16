# 💨 Smoke Test Checklist (`smoke_tests.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. `GET /healthz` & `GET /readyz` return `HTTP 200`.
2. Title screen renders `VOXEL REALMS` & `EulaModal` opens cleanly.
3. `/?autostart=1` enters 3D world; **Heroes -> Avatar, Clones & Shadows** spawns clones/shadows & Shadow Swap with `0` console errors.
