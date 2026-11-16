# 📜 Dependency Governance & Upgrade Policy (`DEPENDENCY_POLICY.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

- **Zero High/Critical CVEs**: `npm audit --audit-level=high` runs on every CI push and blocks merges on high/critical advisories.
- **Lockfile & Overrides**: Transitive fixes use `overrides` in `package.json` (`@grpc/grpc-js`, `esbuild`, `minimatch`). See [`dependency.md`](./dependency.md).
- **Major Upgrades**: Breaking majors (e.g., `express 5`, `motion 14`, `lucide-react 1`) require explicit migration testing across `server.ts`, `npm run validate`, and Playwright UI checks before bumping.
