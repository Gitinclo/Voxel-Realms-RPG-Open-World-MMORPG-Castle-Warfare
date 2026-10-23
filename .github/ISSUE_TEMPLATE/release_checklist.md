---
name: 🚀 Release Readiness Checklist
about: Track final pre-release validation, smoke tests, security audit, and signoff before tagging a release
title: "Release v1.x.x Readiness Checklist"
labels: ["release"]
---

## 📦 Release Candidate Overview

- **Target Version:** `v1.2.0`
- **Target Branch:** `main`
- **Release Type:** Web App / GitHub Release / Android Build

---

## 1. 📋 Project Metadata & Package Health
- [ ] Confirm `package.json` has final values (`name`, `version`, `description`, `author`, `license`, `engines`)
- [ ] Confirm dependencies are valid and install cleanly
- [ ] Confirm Node.js version requirement (`>=20.0.0`, CI on Node 22) matches target environment

## 2. 🏗️ Install & Build Validation
- [ ] `npm install` passes cleanly
- [ ] `npm run lint` passes with 0 TypeScript errors
- [ ] `npm test` passes all unit test suites
- [ ] `npm run build` succeeds and generates output under `dist/`

## 3. 🎮 Runtime Smoke Test (`npm run dev`)
- [ ] Title screen loads and save slot / character creation works
- [ ] 3D Voxel world, HDR lighting, and dynamic weather render smoothly
- [ ] Castle progression (Lv. 0–100) and T1–T20 Troop Barracks function properly
- [ ] Four-Path Cultivation, Realm Suppression (100x Golden Core vs Qi Refinement), Karma/Tribulation Lightning, and Master/Disciple systems work
- [ ] Daily Login Reward modal and Veteran Scroll comprehension work
- [ ] World AI Director (Lv. 1–1000 monsters, A* pathfinding, NPC roles) and C++20 SIMD Architecture viewer work
- [ ] No console crashes across major user flows on desktop or mobile viewports

## 4. 🔐 Environment, Secrets & Security Review
- [ ] `.env.example` is complete with placeholder values only
- [ ] `.env` is not committed to Git
- [ ] API keys and Android keystore files (`*.jks`, `*.keystore`, `*.pem`) are ignored in `.gitignore`
- [ ] No sensitive tokens or credentials exist in repository files or commit history

## 5. 📚 Git Hygiene & Documentation Readiness
- [ ] `README.md` reflects actual setup, features, and project structure
- [ ] `CHANGELOG.md` is updated with release notes (new features, bug fixes, known issues)
- [ ] Legal & community docs are in place (`LICENSE`, `PRIVACY.md`, `TERMS.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`)

## 6. ⚙️ CI/CD & Final Signoff Gate
- [ ] GitHub Actions workflow (`.github/workflows/build.yml`) is green on `push` / `pull_request`
- [ ] Production build artifact (`voxel-realms-rpg-dist`) uploads cleanly
- [ ] Tag release commit (`git tag -a v1.2.0 -m "Release v1.2.0"`)
