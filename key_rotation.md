# 🔄 Cryptographic Key & Credential Rotation (`key_rotation.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

| Secret                 |     Cadence     | Procedure                                                             |
| :--------------------- | :-------------: | :-------------------------------------------------------------------- |
| `VOXEL_SESSION_SECRET` | `90d` / `SEV-1` | Rotate Secret Manager & redeploy (`<=12h` cookies expire gracefully). |
| `VOXEL_ADMIN_PASSKEY`  |      `90d`      | Update Secret Manager & test `POST /api/auth/admin-login`.            |
| `SQL_PASSWORD`         |     `180d`      | Rotate on Cloud SQL `ai-studio-416287a7` & redeploy.                  |
