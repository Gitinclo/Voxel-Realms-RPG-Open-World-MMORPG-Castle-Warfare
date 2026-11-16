# Simulation Tick Loop Architecture (`SIMULATION_TICK_LOOP.md`)

Execution cadence and timing budgets separating the **60Hz–240Hz WebGL2 client render loop**, **UI state cadence**, and **20Hz (`50ms`) authoritative server siege loop**.

---

## 1. Multi-Rate Loop Separation

| Loop                                | Frequency                             | Period          | Owner Module                        | Responsibility                                                                     |
| :---------------------------------- | :------------------------------------ | :-------------- | :---------------------------------- | :--------------------------------------------------------------------------------- |
| **Server Authoritative Siege Tick** | `20 Hz`                               | `50.0 ms`       | `server.ts` + `siegeNetProtocol.ts` | Resolve cohort moves, `1T` rallies, combat deltas, FNV-1a state hash, WS broadcast |
| **Client Three.js Render Loop**     | `60–240 Hz` (`requestAnimationFrame`) | `4.16–16.67 ms` | `GameCanvas.tsx`                    | Interpolate Hermite positions, step `cannon-es` physics, update LODs & composer    |
| **World AI & Resource Tick**        | `1–4 Hz`                              | `250–1,000 ms`  | `App.tsx` + `worldAI.ts`            | Advance Lv. 1–1000 monster patrolling, NPC caravan bartering, passive Qi gain      |
| **Disk Persistence Flush**          | Interval + Graceful `SIGTERM`         | Configurable    | `serverPersistence.ts`              | Atomic `.tmp` -> `fsyncSync` -> `.bak` -> POSIX rename snapshots                   |

---

## 2. Client-Side Prediction (CSP) & Server Reconciliation (`siegeNetProtocol.ts`)

1. Client captures input on the render frame (`dt` clamped to prevent tab-switch spikes), updates local cohorts smoothly, and pushes `{ clientSeq, position, velocity }` into `ClientPredictionRingBuffer` (`128` frames capacity).
2. Server consumes validated `C2S_TROOP_POSITION_CMD` packets on its next `50ms` boundary and emits `S2C_DELTA_SIEGE_UPDATE` (`0x11`) with the last acknowledged `ack` sequence.
3. On receipt, the client discards acknowledged frames and measures spatial delta:
   - **`== 0`**: Exact match—zero visual correction.
   - **`<= 0.15 m`**: Applies Cubic Hermite smoothing without jarring pops.
   - **`> 0.15 m`**: Emits hard reconciliation snap to authoritative server position.

---

## 3. Tick Budget Monitoring & Auto-Scaling

- `serverHardening.ts` records `p50`, `p95`, and `max` durations for every `50ms` server tick; any overrun above `50ms` increments the slow-tick telemetry counter checked by `/api/ops/readiness` and `npm run verify:ops`.
- On the client, `architectOptimization.ts` drives a Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`) alongside a lock-free work-stealing job DAG model for Structure-of-Arrays (`SoA`) entity batches.
