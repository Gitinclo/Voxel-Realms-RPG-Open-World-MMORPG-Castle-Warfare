# ⬆️ Upgrading Voxel Realms RPG (`UPGRADING.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

## Upgrading From `v1.4.x` to `v1.5.0`

1. **Dependencies**: Run `npm install` (Three.js `0.187.0`, `three-mesh-bvh`, `cannon-es`, `simplex-noise`, Drizzle ORM, Firebase Admin).
2. **Environment Secrets**: In `NODE_ENV=production`, set `VOXEL_SESSION_SECRET` (`>=32` chars) and `VOXEL_ADMIN_PASSKEY` (`>=12` chars) per [`.env.example`](./.env.example).
3. **Database & Rules**: Ensure `SQL_HOST`/`SQL_USER`/`SQL_PASSWORD`/`SQL_DB_NAME` are provisioned if using `/api/db/*`, and run `npm run lint:rules && npm run test:rules`.
4. **Verify**: Run `npm run validate && npm run verify:ops`.
