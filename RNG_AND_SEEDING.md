# RNG, Deterministic Seeding & Procedural Generation (`RNG_AND_SEEDING.md`)

Deterministic pseudo-random generation, hash primitives, and reproducible seed hierarchies used across voxel terrain, `10^100`-word Akashic lore volumes, and 6-tier cosmological slices.

---

## 1. Core Deterministic Primitives

| Mechanism                            | Algorithm / Library                                       | Purpose                                                                         | Reproducibility Guarantee                                                    |
| :----------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------------------------------------------------------------------------- |
| **Biome & Cavern Heightmaps**        | `simplex-noise` (`4.0.3`, fBm 2D/3D/4D seeded)            | `openWorld3DEngine.ts` terrain elevation, moisture & ore veins                  | Identical chunk heights across browsers & C++ clients                        |
| **32-Bit State Checksums**           | FNV-1a (`0x811c9dc5`, prime `0x01000193`)                 | `computeSectorStateHash` (siege netcode) & EULA acceptance receipts (`eula.ts`) | Exact integer match on every node                                            |
| **Akashic Stream (`10^97` Volumes)** | `BigInt`-indexed SplitMix / seeded PRNG                   | `generateGoogolScaleLoreScrollSlice` (`loreHistory.ts`)                         | Random access to any volume `1n..10n**97n` yields identical `>= 1,000` words |
| **Lazy Cosmology Slicing**           | Deterministic `generatorSeed` per `InfiniteCollection<T>` | `lazilyGenerateInfiniteTierSlice` (`omniverse.ts`)                              | Paginating `Omniverse` → `Universe` slices never drifts between reloads      |

---

## 2. Why Non-Cryptographic vs. Cryptographic RNG Are Strictly Separated

- **Gameplay & Procedural Content (`Math`-derived / seeded PRNGs)**: Used solely for deterministic terrain variation, procedural lore text, visual particle jitter, and seeded dungeon/AI choices where reproducibility across tests and clients is required.
- **Security & Session Integrity (`node:crypto`)**: Ephemeral secret generation, CSRF tokens, and HMAC-SHA256 session cookies in `src/game/serverAuth.ts` ALWAYS use Node's CSPRNG (`crypto.randomBytes`) and timing-safe HMAC verification (`crypto.timingSafeEqual`)—never deterministic seeded PRNGs.

---

## 3. Anti-Tamper & Seed Audit Rules

- Automated unit tests (`loreHistory.test.ts`, `omniverse.test.ts`, `siegeNetProtocol.test.ts`, `openWorld3DEngine.test.ts`) assert deterministic seed stability for fixed inputs.
- Multiplayer drops, tribulation strikes, and siege hits are resolved on the **authoritative server** (`server.ts`) so client RNG manipulation cannot forge loot or combat crits.
