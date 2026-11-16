# Event Schema Registry (`EVENT_SCHEMA_REGISTRY.md`)

Canonical schemas for RFC 6455 WebSocket Siege opcodes, anti-cheat security audit records, Firestore ticket events, and domain audit notifications in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Authoritative Siege WebSocket Opcodes (`src/game/siegeNetProtocol.ts`)

Every packet on `/ws/siege` wraps payloads inside `SiegeNetEnvelope<TPayload>`:

| Opcode | Name                       | Direction       | Payload Summary                                                                     | Validation Invariant                                            |
| :----- | :------------------------- | :-------------- | :---------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| `0x01` | `C2S_TROOP_POSITION_CMD`   | Client → Server | `commanderId`, `cohortId`, quantized `(qx, qz)` (`int16`), `formation`, `clientSeq` | Monotonic `clientSeq`, valid `SiegeFormationType`, speed clamp  |
| `0x02` | `C2S_RALLY_ACTION_CMD`     | Client → Server | `rallyId`, `action` (`JOIN`/`LAUNCH`/`RETREAT`), `troopCount` (`BigIntWireString`)  | Positive integer string `<= 1,000,000,000,000` (`1T`) per rally |
| `0x10` | `S2C_FULL_SIEGE_SNAPSHOT`  | Server → Client | Full sector entities, forts, rallies, `stateHash` (32-bit FNV-1a)                   | Broadcast on join or hard reconciliation recovery               |
| `0x11` | `S2C_DELTA_SIEGE_UPDATE`   | Server → Client | Bitmasked `CohortDirtyBit` array + quantized diffs                                  | Emitted every `50ms` (`20Hz`) for dirty cohorts only            |
| `0x12` | `S2C_RALLY_STATUS_SYNC`    | Server → Client | Authoritative contributor totals & impact countdown                                 | Deterministic `BigInt` summation                                |
| `0x13` | `S2C_RECONCILIATION_FAULT` | Server → Client | Authoritative state hash + rollback snapshot                                        | Emitted when client delta diverges `> 0.15m`                    |

---

## 2. Security & Anti-Cheat Audit Events (`securityAuditLog`)

Recorded server-side in `data/online_realm_state.json`:

- `AUTH_ADMIN_LOGIN_SUCCESS` / `AUTH_ADMIN_LOGIN_FAILED` / `AUTH_RATE_LIMIT_LOCKOUT`
- `RBAC_PRIVILEGED_DENIED` (`HTTP 401`/`403` access attempt on `/api/admin/*` or `/api/online/siege/cmd`)
- `CSRF_ORIGIN_MISMATCH` / `PROTO_POLLUTION_BLOCKED`
- `ANTI_CHEAT_VIOLATION` (`speed_hack`, `teleport_jump`, `economy_inflation`, `sequence_replay`)
- `ANTI_CHEAT_QUARANTINE_TRIGGERED` / `ANTI_CHEAT_PARDON_ISSUED` (signed by Root Admin `creatergame31@gmail.com`)

---

## 3. Avatar, Clone & Shadow Sync Events (`src/game/avatarCloneShadow.ts`)

- `RAID_ENTITY_DELTA_PACK` (`8-byte` compact offset record per unit: `ownerSlot`, entity slot `0..3` for 1 Avatar + up to 3 Clones/Shadows, quantized relative coordinates, posture bits) supporting `200` simultaneous raid entities for 50 players within the `50ms` tick envelope.
