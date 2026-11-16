# Modding API & Content Pack Contract (`MODDING_API.md`)

Public schemas, deterministic registration helpers, and validation rules for community content creators building custom monsters, biomes, cosmetic hero skins, and cultivation scrolls for **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Authoritative Content Registries

All community mods map cleanly onto typed descriptors inside `src/types/` and pure catalogs under `src/game/`:

1. **Monster Blueprints (`src/game/worldAI.ts`)**: Declare `id`, `name`, `level` (`1..1000`), `complexityBracket` (`bracket_1_feral` .. `bracket_5_apex_titan`), and elemental telegraph tags.
2. **Hero Cosmetic Skins (`src/game/heroSkins.ts`)**: Declare particle aura hex colors, emissive intensity (`<= 2.5`), and **Cosmetic Clone Avatar** compatibility metadata (`src/game/avatarCloneShadow.ts`).
3. **Open-World Biome Codex Entries (`src/game/loreHistory.ts`)**: Register spatial biome bounds, ambient weather affinities (`weather.ts`), and discovery Diamond rewards.
4. **Tier 1 Universe Physics Overrides (`src/game/omniverse.ts`)**: Override localized gravity, Qi density multiplier, and combat coefficients inside authorized single-player/admin realms (`overrideUniversePhysicsConstants`).

---

## 2. Hard Invariants & Anti-Cheat Rejection

Mods attempting to violate server invariants are deterministically rejected:

- Resource balances and troop caps cannot exceed `1,000T` (`10n ** 15n`) in ranked realms.
- Species rebirth overrides remain locked behind `creatergame31@gmail.com` (`evaluateSpeciesSwitchPermission`).
- Prototype pollution keys (`__proto__`, `constructor`, `prototype`) in uploaded JSON packs fail with `HTTP 400`.
