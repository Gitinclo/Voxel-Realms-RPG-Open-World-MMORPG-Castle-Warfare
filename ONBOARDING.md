# 🧭 Developer Onboarding Guide (`ONBOARDING.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

## Day-1 Setup (< 5 Minutes)

1. **Requirements**: Node.js `>=20.0.0` (Node 22 LTS recommended) & `npm >=10`.
2. **Install & Env**:
   ```bash
   npm install
   cp .env.example .env
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev   # Starts Express + /ws/siege + Vite on http://localhost:3000
   ```
4. **Verify Everything Works**:
   ```bash
   npm run validate     # lint + lint:rules + format:check + 171 tests + build
   npm run verify:ops   # live load, security & crash-recovery verification
   ```
5. **Required Reading Order**: [`README.md`](./README.md) → [`discipline.md`](./discipline.md) → [`ARCHITECTURE.md`](./ARCHITECTURE.md) → [`CONTRIBUTING.md`](./CONTRIBUTING.md) → [`Four-Path Cultivation.md`](./Four-Path%20Cultivation.md).
