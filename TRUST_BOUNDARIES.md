# 🚧 Explicit Trust Boundaries (`TRUST_BOUNDARIES.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **Browser Sandbox vs. Server**: Browser state, `localStorage`, and `UNTRUSTED_CLIENT_PREVIEW` checks never authorize server actions.
- **Server vs. Cloud SQL / Firestore**: Authenticated exclusively via verified Firebase UIDs (`requireAuth`) and parameterized Drizzle SQL.
