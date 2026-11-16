# Plugin & Extension Architecture (`PLUGIN_ARCHITECTURE.md`)

Extension points, isolation boundaries, and sandboxing model for community mods, custom cultivation manuals, biome generators, and server-verified extensions in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Extension Philosophy

Extensions must integrate along the **Functional Core / Imperative Shell** seam (`ARCHITECTURE.md`) without mutating authoritative server security boundaries (`serverAuth.ts`), RBAC tables (`creatergame31@gmail.com`), or `firestore.rules`.

---

## 2. Supported Extension Surfaces

| Layer                           | Extension Hook                                                                     | Sandboxing Mechanism                                                          |
| :------------------------------ | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Pure Data Packs**             | Custom cultivation manuals, species flavor lore, alchemy recipes, monster brackets | Declarative JSON validated against `src/types/` schemas at load time          |
| **Procedural Generators**       | Custom 2D/3D `simplex-noise` biome height profiles & Three.js palette themes       | Pure functions constrained to bounding boxes + disposable GPU resources       |
| **Custom HUD Panels**           | Lazy-loaded modal overlays wrapped in `React.lazy` + error boundary                | Read-only props view; cannot bypass `/api/online/anti-cheat` or `serverAuth`  |
| **Cosmological Overvoid Packs** | Custom Tier 5 `Overvoid` logic rules & Tier 1 `Universe` physics constants         | Bounded strictly by `COSMIC_LIMITS.OVERVOID_MAX_COUNT = 100` (`omniverse.ts`) |

---

## 3. Isolation & Failure Containment

- Plugins never receive raw DOM cookie access, Firebase Admin credentials, or direct PostgreSQL `pg.Pool` handles.
- Third-party biome or HUD extensions execute inside declarative registries checked by `runFullSystemValidationReport()` (`src/game/systemValidation.ts`) so invalid data fails gracefully without crashing the `60Hz` Three.js loop.
