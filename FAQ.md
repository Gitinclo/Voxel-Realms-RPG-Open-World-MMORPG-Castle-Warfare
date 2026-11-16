# ❓ Frequently Asked Questions (`FAQ.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

### Why did Google Sign-In not prompt for Gmail scopes?

We use Dual-Tier OAuth (`src/lib/firebase.ts`): basic login requests only `openid email profile`. Gmail scopes are requested on-demand when opening the Gmail Dispatch Center.

### Why are Cloud SQL errors not blocking local `npm run dev`?

`src/db/index.ts` lazily initializes the PostgreSQL `pg.Pool` on actual `/api/db/*` queries, allowing offline/local Vite gameplay without a running Postgres socket.

### How can I switch my locked Species after creation?

Initial species lock prevents free abuse; an authorized `creatergame31@gmail.com` admin decree or approved `[SPECIES REBIRTH]` ticket unlocks species switching.
