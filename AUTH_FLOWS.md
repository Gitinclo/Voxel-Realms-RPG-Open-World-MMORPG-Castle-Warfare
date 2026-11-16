# 🔄 Authentication & Token Flows (`AUTH_FLOWS.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

1. **Firebase Identity**: Basic OAuth -> Firebase ID Token -> Bearer `/api/db/*`.
2. **Gmail OAuth**: On-demand `GMAIL_SCOPES` -> in-memory token only.
3. **Server Session**: `/api/auth/*` -> `HttpOnly; SameSite=Lax` HMAC-SHA256 cookie.
