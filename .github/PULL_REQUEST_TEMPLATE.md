## 📋 Summary

Briefly describe the changes introduced in this Pull Request and the problem they solve.

- **Related Issue(s):** Fixes #

---

## 🛠️ Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation / Legal / Repository configuration update
- [ ] ⚡ Performance / 3D Rendering / C++20 SIMD optimization

---

## ✅ Pre-Merge Validation Checklist

Please confirm all items below before requesting a review or merging:

### 1. Build & Test Gate

- [ ] `npm install` completes cleanly with no dependency conflicts
- [ ] `npm run lint` (`tsc --noEmit`) & `npm run lint:rules` (`eslint firestore.rules`) pass with zero errors
- [ ] `npm test` passes all **171 automated tests across 29 suites** (`27` `src/game/*.test.ts` suites + `src/lib/gmail.test.ts` + `firestore.rules.test.ts`)
- [ ] `npm run validate`, `npm run verify:ops` & `npm run build` succeed cleanly

### 2. Runtime Smoke Test

- [ ] App starts cleanly via `npm run dev` on `http://localhost:3000`
- [ ] Title screen, 3D voxel world, and HUD render without console crashes
- [ ] Core gameplay flows affected by this PR work on both desktop and mobile viewports ([`real-world QA.md`](../real-world%20QA.md))

### 3. Architecture, Security & Hygiene

- [ ] Follows the **Architect-First** rule (which **helps prevent early design flaws**): pure calculations and state transitions are decoupled into `src/game/` with unit tests per [`ARCHITECTURE.md`](../ARCHITECTURE.md), [`discipline.md`](../discipline.md), and [`GOVERNANCE.md`](../GOVERNANCE.md)
- [ ] No `.env` files, API keys, tokens, or Android signing keystores (`*.jks`, `*.keystore`) are included
- [ ] `README.md`, `ROADMAP.md`, and `CHANGELOG.md` are updated if user-facing features or setup steps changed
