# 🎯 Edge Cases & Boundary Conditions (`edge_cases.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **Precision Boundary**: `BigInt` troops capped at `1,000T` (`10n**15n`); rallies capped at `1T`.
- **Overvoid Cap**: `attemptCreateOvervoid` rejects Overvoid index `>100`.
- **Clone/Shadow Caps**: `<=3` clones and `<=2` shadows per Avatar.
- **Save Failover**: Truncated primary save automatically recovers from `.bak`.
