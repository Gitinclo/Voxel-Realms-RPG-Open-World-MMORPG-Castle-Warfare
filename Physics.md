# 3D Physics, Object Collision & Spatial Kinematics Specification (`Physics.md`)

> **Release Version**: `v1.5.0` · **Date**: `17/11/2026` (`2026-11-17`)  
> **Supreme Author, Root Game Master & Physics Authority**: `creatergame31@gmail.com`  
> **Core Engine Modules**: [`src/game/openWorld3DEngine.ts`](./src/game/openWorld3DEngine.ts) · [`src/game/godModeCharacter.ts`](./src/game/godModeCharacter.ts) · [`src/game/omniverse.ts`](./src/game/omniverse.ts) · [`src/components/GameCanvas.tsx`](./src/components/GameCanvas.tsx)  
> **Automated Test Suite**: [`src/game/openWorld3DEngine.test.ts`](./src/game/openWorld3DEngine.test.ts) · [`src/game/systemValidation.test.ts`](./src/game/systemValidation.test.ts)

---

## 1. Overview of Object Collisions & Physical Principles

An **object collision** occurs when two or more rigid or deformable bodies come into contact or attempt to occupy the same physical region in 3D space ($\mathbb{R}^3$), resulting in a short-duration impulsive interaction that exerts strong contact forces and alters their linear and angular motion.

In **Voxel Realms: Open-World MMORPG & Castle Warfare**, all physical collisions across siege artillery, player/monster colliders, and environmental structures obey two foundational physical laws:

1. **Conservation of Linear Momentum**:
   The total linear momentum $\vec{p}_{\text{total}}$ of an isolated two-body system is strictly conserved before and after a collision, regardless of whether mechanical kinetic energy is conserved or dissipated:
   $$\vec{p}_{\text{before}} = m_A \vec{v}_A + m_B \vec{v}_B = m_A \vec{v}_A' + m_B \vec{v}_B' = \vec{p}_{\text{after}}$$

2. **Newton's Third Law of Motion (Impulse-Momentum Symmetry)**:
   During contact duration $\Delta t$, the force $\vec{F}_{A \to B}$ exerted by Body $A$ on Body $B$ is equal in magnitude and opposite in direction to the force $\vec{F}_{B \to A}$ exerted by Body $B$ on Body $A$:
   $$\vec{F}_{A \to B} = -\vec{F}_{B \to A} \implies \vec{J}_B = \int_{t_0}^{t_1} \vec{F}_{A \to B}\,dt = -\vec{J}_A$$

---

## 2. Classification of Collisions by Kinetic Energy & Restitution ($e$)

Collisions in `resolveThreeDimensionalObjectCollision()` (`src/game/openWorld3DEngine.ts`) are categorized by the **Coefficient of Restitution** ($e \in [0.0, 1.0]$), defined as the ratio of post-collision relative normal speed to pre-collision relative normal speed along the unit contact normal $\hat{n}$:

$$e = -\frac{(\vec{v}_B' - \vec{v}_A') \cdot \hat{n}}{(\vec{v}_B - \vec{v}_A) \cdot \hat{n}}$$

| Collision Regime (`CollisionRegime`)                        | Restitution ($e$) |        Linear Momentum ($\vec{p}$)         |                     Total Kinetic Energy ($K$)                      | Post-Impact Behavior & Game Engine Examples                                                                                                                                                                                                                                                                       |
| :---------------------------------------------------------- | :---------------: | :----------------------------------------: | :-----------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Elastic Collision** (`'elastic'`)                         |     $e = 1.0$     | **Conserved** ($\Delta \vec{p} = \vec{0}$) |            **Conserved** ($\Delta K_{\text{lost}} = 0$)             | Colliding bodies rebound cleanly without losing mechanical energy to heat, sound, or deformation (e.g., ideal billiard spheres, Arcane Qi Barrier ricochets). For equal masses ($m_A = m_B$) in a head-on impact, the two bodies exchange normal velocities ($\vec{v}_A' = \vec{v}_B$, $\vec{v}_B' = \vec{v}_A$). |
| **Inelastic Collision** (`'inelastic'`)                     |   $0 < e < 1.0$   | **Conserved** ($\Delta \vec{p} = \vec{0}$) |       **Partially Dissipated** ($\Delta K_{\text{lost}} > 0$)       | Part of the initial kinetic energy converts into thermal energy, acoustic shockwaves, or structural damage (e.g., Shieldbearer phalanx collisions, Trebuchet boulder bounces against stone battlements).                                                                                                          |
| **Perfectly Inelastic Collision** (`'perfectly_inelastic'`) |     $e = 0.0$     | **Conserved** ($\Delta \vec{p} = \vec{0}$) | **Maximum Loss** ($\Delta K_{\text{lost}} = \Delta K_{\text{max}}$) | Colliding objects coalesce (stick together) after impact and move with a single common center-of-mass velocity $\vec{v}_{\text{common}}$, maximizing kinetic energy dissipation (e.g., Soulfire Tar Pitch projectiles, Sticky Talisman snares, Siege Ram latching).                                               |

### Exact Impulse & Energy Equations

Given two bodies $A$ and $B$ with masses $m_A, m_B$ (and inverse masses $w_A = m_A^{-1}, w_B = m_B^{-1}$, where $w = 0$ represents an immovable static fortress wall of infinite effective mass):

1. **Unit Contact Normal ($\hat{n}$) & Penetration Depth ($\delta$)**:
   $$\vec{d} = \vec{x}_B - \vec{x}_A, \quad d = \|\vec{d}\|, \quad \hat{n} = \frac{\vec{d}}{d}, \quad \delta = \max\bigl(0, (r_A + r_B) - d\bigr)$$

2. **Minimum Translation Vector (MTV) Positional Separation**:
   To ensure colliding objects never occupy the same physical space, overlapping colliders ($\delta > 0$) are immediately separated proportional to their inverse masses:
   $$\vec{x}_A^{\text{sep}} = \vec{x}_A - \left(\frac{w_A}{w_A + w_B}\right)\delta \hat{n}, \quad \vec{x}_B^{\text{sep}} = \vec{x}_B + \left(\frac{w_B}{w_A + w_B}\right)\delta \hat{n}$$

3. **Normal Impulse Scalar ($j$) & Post-Impact Velocities**:
   When the bodies are approaching each other ($v_{\text{rel}, n} = (\vec{v}_B - \vec{v}_A) \cdot \hat{n} < 0$):
   $$j = \frac{-(1 + e)\bigl((\vec{v}_B - \vec{v}_A) \cdot \hat{n}\bigr)}{w_A + w_B}$$
   $$\vec{v}_A' = \vec{v}_A - w_A j \hat{n}, \quad \vec{v}_B' = \vec{v}_B + w_B j \hat{n}$$

4. **Perfectly Inelastic Common Velocity ($e = 0$) & Maximum Energy Loss**:
   $$\vec{v}_{\text{common}} = \frac{m_A \vec{v}_A + m_B \vec{v}_B}{m_A + m_B}, \quad \Delta K_{\text{max}} = \frac{1}{2}\left(\frac{m_A m_B}{m_A + m_B}\right)\|\vec{v}_B - \vec{v}_A\|^2$$

---

## 3. Colliders, Spatial Broadphase & Three.js WebGL2 Integration

### 3.1 Broadphase & Narrowphase Collision Architecture

| Pipeline Stage                         | Technology / Module                                                                   |   Complexity    | Responsibility                                                                                                                              |
| :------------------------------------- | :------------------------------------------------------------------------------------ | :-------------: | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Raycast & Terrain Picking BVH**   | `three-mesh-bvh` (`MeshBVH`, `acceleratedRaycast`) in `src/game/openWorld3DEngine.ts` |   $O(\log N)$   | Accelerates 3D pointer picking, `Shift + Click` ground teleportation raycasts, and terrain height queries across high-polygon voxel chunks. |
| **2. Rigid-Body Broadphase**           | `cannon-es` (`CANNON.SAPBroadphase`) in `src/game/openWorld3DEngine.ts`               |  $O(N \log N)$  | Sweep-and-Prune axis-aligned bounding box (AABB) sorting for siege projectiles, boulders, and fortress colliders.                           |
| **3. Narrowphase Collider Solver**     | `resolveThreeDimensionalObjectCollision()` & `resolvePlayerCitadelCollisionCannon()`  | $O(1)$ per pair | Computes exact sphere-sphere and sphere-AABB contact normals, MTV positional push-out, and elastic/inelastic impulse responses.             |
| **4. Authoritative Server Anti-Cheat** | `AntiCheatGuard` (`src/game/antiCheat.ts`)                                            | $O(1)$ per tick | Validates movement speed envelopes, sequence numbers, and collider bounds on the 20Hz (`50ms`) authoritative siege tick.                    |

### 3.2 Three.js 3D Scene, Composite Procedural Models & 60fps Loop Discipline

In [`src/components/GameCanvas.tsx`](./src/components/GameCanvas.tsx) and [`src/game/proceduralWorld.ts`](./src/game/proceduralWorld.ts), the 3D physics and collision loop is paired with studio-grade Three.js rendering:

- **Composite 3–12 Part Procedural Models (`THREE.Group`)**: Characters, monsters, Solara Citadel keeps, and resource nodes are assembled from multi-part `THREE.Group` hierarchies across primary silhouettes, secondary armor/wings/turrets, and emissive accents—grounded at bottom-center with soft radial contact shadows.
- **Studio PBR Lighting & Environment Reflections**: Uses `ACESFilmicToneMapping`, `SRGBColorSpace`, warm directional key lighting with tight orthographic shadow frustums, cool `HemisphereLight` sky/ground fill, horizon-matched `FogExp2`, and procedural `CanvasTexture` surface maps with zero external 404 assets.
- **Zero-GC Render & Physics Loop**: Pre-allocates reusable math vectors and matrices outside the `requestAnimationFrame` loop, batches repeated foliage/voxel elements via `THREE.InstancedMesh`, and interpolates camera orbit/altitude transitions with frame-rate independent exponential damping (`THREE.MathUtils.damp`).

---

## 4. Sovereign Divine Flight & Teleportation Collider Bypass (`creatergame31@gmail.com`)

The physics engine enforces a strict **fail-closed RBAC boundary** for Root Creator **`creatergame31@gmail.com`** (`src/game/godModeCharacter.ts`):

- **Sovereign Divine Flight (`computeNextGodFlightKinematics`)**:
  - When `creatergame31@gmail.com` activates Sovereign Divine Flight (`[F]` or HUD Flight Controls) and ascends to altitude $Y \ge 2.5\text{m}$ (`citadelWallBypassAltitude`), `bypassesCitadelWalls` evaluates to `true`, allowing the Root Creator to fly seamlessly over Solara Citadel walls and fortress keeps at `2.5x` horizontal speed up to $45.0\text{m}$ altitude.
  - All non-root accounts (`email !== 'creatergame31@gmail.com'`) fail closed (`allowed: false`, `maxAltitude: 0`, `bypassesCitadelWalls: false`) and remain subject to standard ground AABB keep collision (`resolvePlayerCitadelCollisionCannon`).
- **Sovereign Divine Teleportation (`executeGodTeleportJump`)**:
  - Grants `creatergame31@gmail.com` instantaneous `0ms` spatial warp across **8 Sovereign Realm Waypoints**, **`+12m` Forward Astral Blink (`[T]`)**, **`Shift + Click` 3D Raycast Ground/Air Teleport**, and custom **`(X, Y, Z)` coordinates**.
  - If teleporting to ground level ($Y < 2.5\text{m}$) inside the central Citadel Keep footprint ($|X| < 5.9, |Z| < 5.9$), the solver automatically pushes the arrival coordinate cleanly outside the South Gate ($Z = 6.2\text{m}$) so the character never clips inside static masonry.

---

## 5. Verification & Automated Unit Tests

Run the physics and collision verification suite at any time via:

```bash
npx tsx --test src/game/openWorld3DEngine.test.ts
```

Verified invariants in `src/game/openWorld3DEngine.test.ts` and Pillar 9 of `src/game/systemValidation.ts`:

1. **Multi-Octave Simplex fBm Terrain**: Flat $0\text{m}$ Citadel basin ($r \le 22\text{m}$) and deterministic outer frontier voxel terraces.
2. **BVH Raycasting (`three-mesh-bvh`)**: $O(\log N)$ `MeshBVH` construction, intersection accuracy, and clean memory disposal.
3. **Siege Artillery Ballistics (`cannon-es`)**: Parabolic 3D trajectory under $-9.81\text{m/s}^2$ gravity, wind drag, and kinetic impact MegaJoules.
4. **3D Object Collision (`resolveThreeDimensionalObjectCollision`)**:
   - **Elastic ($e = 1.0$)**: Exact velocity exchange for equal-mass head-on impact, $\Delta \vec{p} = \vec{0}$, $\vec{J}_A = -\vec{J}_B$, and $\Delta K_{\text{lost}} = 0$.
   - **Inelastic ($e = 0.5$)**: $\Delta \vec{p} = \vec{0}$, $\vec{J}_A = -\vec{J}*B$, and $0 < K*{\text{after}} < K_{\text{before}}$.
   - **Perfectly Inelastic ($e = 0.0$)**: Post-impact coalescence at $\vec{v}_{\text{common}} = \frac{m_A \vec{v}_A + m_B \vec{v}_B}{m_A + m_B}$ and maximum kinetic energy loss.
