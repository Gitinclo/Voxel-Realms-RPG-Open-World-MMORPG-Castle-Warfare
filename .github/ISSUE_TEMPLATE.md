---
name: 📋 General Issue / Bug Report / Feature Request
about: Pre-formatted template for filing bug reports, feature requests, or moderation/support inquiries
title: '[ISSUE] '
labels: ['triage']
---

## 📌 Issue Category

Please check one of the following:

- [ ] 🐛 **Bug Report** (Gameplay calculation error, UI defect, or 3D WebGL rendering glitch)
- [ ] ✨ **Feature Request** (New Castle Era mechanic, Cultivation Path feature, World AI behavior, or UI enhancement)
- [ ] ⚡ **Performance / Rendering Issue** (Frame rate drop, shader issue, or mobile layout overflow)
- [ ] 🛡️ **Administration / GM / Moderator Inquiry** (Note: For private security reports or account appeals, email **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** directly)

---

## 📝 Summary

Provide a clear and concise description of the issue or proposed enhancement.

---

## 🔄 Steps to Reproduce (For Bug Reports)

1. Launch the game (`http://localhost:3000` or `?autostart=1`)
2. Open modal or perform action `'...'`
3. Click on `'...'`
4. Observe behavior `'...'`

### 🎯 Expected Behavior

Describe what you expected to happen.

### 📸 Actual Behavior / Console Output

Paste any relevant browser console errors, screenshots, or stack traces here.

---

## 💻 System & Environment Specifications

- **Operating System:** (e.g., Windows 11, macOS Sequoia, Ubuntu 24.04, Android 15, iOS 19)
- **Browser & Version:** (e.g., Chrome 134, Firefox 135, Safari 18)
- **Graphics Quality Preset:** (`NEXT-GEN ULTRA` / `HIGH` / `BALANCED`)
- **Platform Override Mode:** (`PC/PS5 [BC7 · LOD 0]` / `MOBILE [ASTC · LOD BIAS +1]`)
- **Game Version / Commit:** (e.g., `v1.5.0` · `06/11/2026`)

---

## 🧩 Architectural Context (For Feature Requests & Contributors)

If proposing a new feature or code change, indicate which modules in [`ARCHITECTURE.md`](../ARCHITECTURE.md) are involved:

- [ ] `src/game/math.ts` (Castle Lv 0–100, T1–T20 Troops, 1000T Capacity)
- [ ] `src/game/cultivationMath.ts` (Four-Path Cultivation, 23 Realms, Karma, Disciples)
- [ ] `src/game/worldAI.ts` (Lv 1–1000 Monsters, A\* Pathfinding, Autonomous NPCs)
- [ ] `src/game/clanMath.ts` (Clan Territory Wars, Vault, Co-op Boss)
- [ ] `src/game/proceduralWorld.ts` / `src/components/GameCanvas.tsx` (3D Voxel PBR + HDR Engine)
- [ ] `src/game/adminModeration.ts` / `src/components/AdminConsoleModal.tsx` (GM, Admin & Moderator Control)
- [ ] `src/game/architectOptimization.ts` / `cpp/VoxelRealmsGuardrails.hpp` (Software & Hardware Architect SIMD & SoA Engine)
