# 🔐 Secrets Management Policy (`secrets_management.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- `.gitignore` excludes `.env`, `.env.*`, `*.pem`, `*.key`, `*.jks`, `*.keystore`.
- Production requires `VOXEL_SESSION_SECRET` (`>=32` chars) & `VOXEL_ADMIN_PASSKEY` (`>=12` chars).
- Server credentials (`GEMINI_API_KEY`, `SQL_PASSWORD`, Firebase Admin) never ship in `VITE_*` client bundles.
