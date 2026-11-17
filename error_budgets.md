# 📉 Error Budgets Policy (`error_budgets.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- At `99.9%` monthly SLO, the rolling 30-day error budget is **`43.2 minutes`**.
- **Green (`> 50%` remaining)**: Normal feature velocity.
- **Yellow (`10%–50%`)**: Freeze risky schema changes; run full `npm run verify:ops` soak before tagging.
- **Red (`< 10%`)**: Feature freeze enforced by `creatergame31@gmail.com`; priority shifts to [`TECH_DEBT.md`](./TECH_DEBT.md) reliability fixes.
