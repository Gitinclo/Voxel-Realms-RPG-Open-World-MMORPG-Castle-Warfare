# AI Behavior Trees & Pathfinding (`AI_BEHAVIOR_TREES.md`)

Design specification for Lv. 1–1000 monster escalation brackets, role-based NPC archetypes, **Avatar/Clone/Shadow** AI summons, and **A\* Obstacle Pathfinding** (`src/game/worldAI.ts`, `src/game/avatarCloneShadow.ts`).

---

## 1. Monster Complexity Scaling (5 Evolutionary Brackets)

| Bracket                    | Level Span       | Tactical Capabilities                                                            |
| :------------------------- | :--------------- | :------------------------------------------------------------------------------- |
| **`bracket_1_feral`**      | `Lv. 1 – 50`     | Basic aggro radius, pack swarming, idle biome node foraging                      |
| **`bracket_2_tactical`**   | `Lv. 51 – 200`   | Shielded frontal charges, flanked approach angles, seismic AoE ground telegraphs |
| **`bracket_3_sovereign`**  | `Lv. 201 – 500`  | Orbiting strafe patterns, leyline Qi siphoning, elemental cone breaths           |
| **`bracket_4_abyssal`**    | `Lv. 501 – 800`  | Short-range blink interception, void implosion gravity zones, domain debuffs     |
| **`bracket_5_apex_titan`** | `Lv. 801 – 1000` | Multi-phase Sovereign Tempest transitions, summon waves, world boss mechanics    |

---

## 2. Autonomous NPC Role Machines (`src/game/worldAI.ts`)

- **Guard**: Patrols Solara Citadel perimeter, engages hostile beasts near gates, coordinates alert propagation.
- **Caravan Trader**: Routes between resource biomes and central markets, accumulating trade stashes and bartering Wood/Steel/Grain/Diamonds.
- **Runic Blacksmith**: Enhances equipment durability and weapon affinities when visited by players.
- **Daoist Mystic**: Grants temporary cultivation enlightenment resonance and divines tribulation timing.
- **High Marshal & Lorekeeper Elder**: Assigns radiant world quests, tactical directives, and ancient historical decrees.

---

## 3. A\* Grid Pathfinding & Clone/Shadow AI

- **Grid Obstacle Avoidance**: `computeAStarPath(start, goal, obstacles)` routes mobile entities cleanly around the Solara Citadel keep footprint (`[-9, +9]` world units) and terrain cliffs without clipping masonry.
- **Clone & Shadow AI (`avatarCloneShadow.ts`)**:
  - _Tactical Illusion Decoys_ broadcast high-priority aggro signals (`3.5x`) with `0%` damage output to pull boss focus.
  - _Combat Clones_ run autonomous melee/ranged target-tracking AI (`35%` PvE / `20%` PvP damage).
  - _Action Mimics & Time Echoes_ mirror recorded or delayed avatar vectors cleanly without requiring independent A\* pathfinding passes.
