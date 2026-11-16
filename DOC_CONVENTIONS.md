# Documentation Conventions (`DOC_CONVENTIONS.md`)

Formatting, linking, terminology, and accuracy standards governing every Markdown document in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Mandatory Accuracy Rules

1. **Zero Fabricated Metrics**: Every test count (`171` tests across `29` suites), invariant count (`103` checks across `9` pillars), endpoint path (`/ws/siege`, `/api/db/*`, `/api/ops/readiness`), and package version must match verified values on disk (`package.json`, `README.md`, `CHANGELOG.md`).
2. **Release Honest-Status Policy**: Never claim formal GitHub Releases or `v*` git tags exist while release history notes zero published GitHub Releases (`CHANGELOG.md`).
3. **Prettier Compliance**: Every `.md` file must pass `npm run format:check` (`prettier --check .`) cleanly:
   - Use `-` for unordered lists
   - Align Markdown tables consistently
   - Fence shell/TypeScript/YAML examples with explicit language tags (`bash`, `typescript`, `yaml`, `text`)

---

## 2. Cross-Linking & Discoverability

- Every top-level guide MUST be linked cleanly in `README.md` under its matching category.
- Filenames with spaces (`deployment validation.md`, `Four-Path Cultivation.md`) must be URL-encoded (`%20`) in relative Markdown links (`./Four-Path%20Cultivation.md`) so GitHub and static doc builders resolve links without breaking.
- Refer to `GLOSSARY.md` for canonical spelling of game systems (`WhitePageRoot`, `Overvoid`, `Omniverse`, `Solara Citadel`, `Avatar`, `Clone`, `Shadow`).
