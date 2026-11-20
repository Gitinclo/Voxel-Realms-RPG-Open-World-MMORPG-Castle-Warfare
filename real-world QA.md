# 🧪 Real-World Quality Assurance & Acceptance Playbook (`real-world QA.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)
- **QA Sign-Off Authority**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Automated + Manual Coverage**: `218` Unit/Security Tests (`37` Test Files) + `109` System Invariants + Live `verify:ops` Harness + Headless Chromium `verify:e2e` (`6` Modal Baselines) + Cross-Device Browser Matrix

---

## 1. Real-World Device, Browser & GPU Test Matrix

Verify gameplay, HUD layout, and 3D rendering across these four real-world hardware profiles:

| Profile ID          | Target Device / Viewport                                    | GPU / Renderer Tier                              | Target Preset & Pipeline Behavior                                                                                                                                                                                    |
| :------------------ | :---------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **QA-PC-ULTRA**     | Desktop `1920×1080` / `2560×1440` (Chrome / Firefox / Edge) | Dedicated GPU (`Vulkan 1.3` / `DX12` / `WebGL2`) | `ULTRA` Preset · `PC/Console [BC7 4K · LOD 0]` · `1024×1024` procedural PBR `CanvasTexture`, `800` instanced grass tufts, `2048px` `PCFSoftShadowMap`, `UnrealBloomPass` + ACES Filmic tone mapping at `60–120 FPS`. |
| **QA-MAC-UMA**      | Apple Silicon MacBook (`1512×982` Retina)                   | Apple Metal 3 (`128B` Cache Line UMA)            | `HIGH` / `ULTRA` Preset · Smooth trackpad orbit, `16x` anisotropic filtering, zero shader compilation stutter.                                                                                                       |
| **QA-MOBILE-TOUCH** | Android / iOS Portrait (`390×844`) & Landscape (`844×390`)  | Mobile Tile-Based GPU (`ASTC` profile)           | `BALANCED` Preset · `MOBILE [ASTC · LOD BIAS +1]` · `256×256` textures, `320` grass tufts, small-prop shadow culling, virtual on-screen D-pad & responsive 5-tab bottom Command Dock with zero horizontal overflow.  |
| **QA-SWIFTSHADER**  | Cloud VM / Headless Chromium (`1280×800`)                   | Software WebGL2 (`SwiftShader` / `llvmpipe`)     | Automatic software-renderer detection (`isSoftwareRenderer`): bypasses heavy `EffectComposer` bloom passes, caps `devicePixelRatio` to `1.0`, and maintains interactive frame times.                                 |

---

## 2. End-to-End Functional QA Scenarios

### Scenario 1 — Onboarding, EULA v1.5.0 & 10-Species Character Creation

1. Load `http://localhost:3000`. Confirm the **Title Screen** displays the **EULA & Legal Compliance (`v1.5.0 · 17/11/2026`)** badge and Google Sign-In button.
2. Open the **EULA Modal (`EulaModal.tsx`)**, filter across the **10-Agreement Legal Stack (`ToS`, `Privacy/DPDP`, `Cookie`, `EULA`, `SaaS`, `OSS Apache-2.0`, `AUP`, `SLA`, `DPA`, `MSA`)**, click **Accept EULA**, and verify a deterministic `EULA-ACK-...` FNV-1a receipt hash is generated and persisted.
3. Open **Character Creation (`CharacterCreationModal.tsx`)**, cycle through all **10 Playable Species** (`human`, `sylvan_elf`, `ironforge_dwarf`, `warborn_orc`, `azure_dragonkin`, `celestial_kitsune`, `asura_demon`, `empyrean_angelic`, `void_walker`, `crystalline_golem`), and verify 3D procedural traits (wings, horns, tails, runic beards, void shards, chest cores) update live on the 3D turntable.
4. Confirm that after initial creation (`speciesLocked: true`), switching species is blocked for standard accounts and unlocked when authenticated as **`creatergame31@gmail.com`** or granted a GM Rebirth Decree.

### Scenario 2 — 3D Open-World Navigation, BVH Picking, Cannon-es Physics & Lore Codex

1. Enter the 3D realm (`http://localhost:3000/?autostart=1`). Move across the terrain using **`WASD` / Arrow Keys** (or the on-screen touch D-pad).
2. Click terrain tiles, resource nodes, NPCs, and monsters to verify $O(\log N)$ **`three-mesh-bvh` raycasting** selects targets accurately.
3. Traverse into a new biome (e.g., Scorched Magma Caldera at `(20, 18)`) or approach a monster; open **Imperial Lore (`LoreHistoryModal.tsx`) → Open-World Codex** and verify the biome/monster entry auto-unlocked and its one-time Diamond (`💎`) + Scripture Fragment bounty can be claimed.
4. Open the **`10^100`-Word Akashic Stream** tab, jump to Volume `10^97` (`GOOGOL_MAX_VOLUME_INDEX`), and verify `>= 1,000` real synthesized words render instantaneously without memory spikes.

### Scenario 3 — Four-Path Cultivation, `100.0x` Suppression, Karma Lightning & Avatars/Clones/Shadows

1. Open **Cultivate (`CultivationModal.tsx`)**, channel Spirit Stones / Pills across **Qi, Body, Soul, and Mind**, and verify breakthrough progression across the 23 Realms (9 layers each) updates the 3D cultivator aura in `GameCanvas.tsx`.
2. Verify **Realm Suppression**: a Golden Core (`Realm 2`) cultivator deals **`100.0x` damage** and takes **`99%` reduced damage** against Qi Refinement (`Realm 0`).
3. Trigger negative Karma (`Red Name` status) and remain stationary for `> 3.5 seconds`; verify **Heavenly Tribulation Lightning** strikes the stationary Red-Name avatar.
4. Open **Hall of Champions (`HeroModal.tsx`) → Avatar, Clones & Shadows**:
   - Inspect the **Key Differences Matrix (`Clone` vs. `Shadow` vs. `Avatar`)**.
   - Toggle the **Cosmetic Clone Avatar (`+12%` Cultivation Speed / `+8%` ATK)**.
   - Spawn up to **3 Clones** (_Mirage Decoy Clone_ & _Primordial Spirit Combat Clone_) and **2 Shadows** (_Umbral Action Mimic_ & _3.0s Chrono-Ruin Shadow Echo_).
   - Click **Execute Shadow Swap Teleport** and verify the Primary Avatar exchanges world coordinates with the active Shadow marker.
   - Verify the **50-Player Raid Network Telemetry** (`50 Avatars + 150 Clones = 200 Entities`) stays within the `50ms` (`20Hz`) server tick budget (`7.55 ms`, `-58.3%` delta packet bandwidth).

### Scenario 4 — Castle Lv. 0–100 (`1,000T`), T1–T20 Barracks & 20Hz 50v50 Territory Siege

1. Upgrade the Citadel across the **10 Castle Eras** (`Lv. 0` Wooden Outpost → `Lv. 100` Omnipotent Citadel) and verify garrison capacity scales to **`1,000 Trillion` (`1,000,000,000,000,000`)** with lossless `BigInt` formatting.
2. Train **T1–T20 Shieldbearers, Shooters, and Bombers** in `TroopBarracksModal.tsx` and test partial mobilization and speed-ups.
3. Open **Clan Alliance (`ClanModal.tsx`) → 9-Sector Territory Map (`A1`–`C3`)**, issue formation commands (`SHIELD_WALL`, `WEDGE_CHARGE`) over the live `/ws/siege` WebSocket, and verify `20Hz` delta state hashes (`FNV-1a`) stay in sync across all 3 regional clusters.

---

## 3. Adversarial & Network-Degradation QA Playbook

1. **Packet Jitter & Client-Side Prediction (CSP) Rollback Test**:
   - Using Chrome DevTools (`Network → Slow 4G / 150ms RTT`), issue cohort march commands on the Territory Siege Map.
   - Confirm small drifts (`<= 0.15m`) blend smoothly over 3 frames via Cubic Hermite interpolation, while large forced state divergences (`> 0.15m`) snap cleanly to the authoritative server tick.
2. **Adversarial Anti-Cheat & RBAC Penetration Check**:
   - Run `npm run verify:ops` and `npm run test:rules` to execute automated penetration checks against `/api/admin/*`, `/api/online/sync`, `/ws/siege`, `/api/db/*`, and all 12 Dirty Dozen Firestore attack vectors.
