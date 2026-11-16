# Pocket Realms, Secret Grottoes & Nested Instances (`POCKET_REALMS_AND_GROTTOES.md`)

Spatial instancing design linking Solara's `40x40` open-world chunk overworld with personal Seclusion Grottoes, timed Secret Realm raids, and Layer 1–6 cosmological sub-universes (`omniverse.ts`).

---

## 1. Pocket Realm Tiers

- **Personal Blessed Grotto**: Private sanctuary tethered to each commander's Citadel keep (`Lv. 0–100`) for herb alchemy, rune arrays, and uninterrupted meditation.
- **Guild Territory Secret Realms**: Contested resource pockets unlocked atop Sectors `A1`–`C3` (`ClanModal.tsx`), yielding high-density Spirit Stones and T20 dreadnought blueprints.
- **Cosmological Trial Universes (`Tier 1: Universe`)**: Procedurally synthesized sub-realities pulled on demand via `lazilyGenerateInfiniteTierSlice` (`src/game/omniverse.ts`) under localized Tier 5 `Overvoid` logic rules.

---

## 2. Instancing & Memory Discipline

- Only active pocket instances currently occupied by commanders allocate `THREE.InstancedMesh` terrain chunks and `cannon-es` physics worlds; idle grottoes persist compactly as deterministic seeds + JSON/`BigInt` deltas (`BUILD_SYSTEM.md`, `MEMORY_MANAGEMENT.md`).
- Disposing a pocket scene invokes full Three.js geometry, material, and HTML5 canvas texture cleanup (`discipline.md`).
