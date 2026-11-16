# Data Pipeline & Persistence Flow (`DATA_PIPELINE.md`)

End-to-end flow describing how game state, authoritative siege frames, player profiles, and telemetry traverse the client runtime, Node.js server, disk snapshots, Firestore, and Cloud SQL PostgreSQL.

---

## 1. Pipeline Topology

```text
React Client (App.tsx)
 ├── Local Storage (voxel_realms_* keys) ──> Instant client reload / offline fallback
 ├── Firebase Auth + Firestore SDK       ──> Cloud profile, realm saves & tickets (firestore.rules)
 ├── Gmail REST v1 Client (in-memory)    ──> Workspace Dispatch Center (Bearer OAuth token)
 └── Express + WS (/api/*, /ws/siege)    ──> Authoritative server (server.ts)
       ├── Atomic Disk (data/online_realm_state.json + .bak SHA-256 envelope)
       ├── Multi-Region Replication Model (3 clusters: us-east, eu-central, ap-southeast)
       └── Cloud SQL PostgreSQL (src/db/ via Drizzle ORM + Firebase Admin verifyIdToken)
```

---

## 2. State Ingestion & Validation Stages

1. **Client Mutation Validation**: User commands (`C2S_TROOP_POSITION_CMD`, `C2S_RALLY_ACTION_CMD`, resource harvests) execute locally with 128-frame Client-Side Prediction while queueing monotonic `clientSeq` frames.
2. **Server Sanitization (`serverHardening.ts` & `antiCheat.ts`)**:
   - Rejects prototype-polluting keys (`__proto__`, `constructor`, `prototype`) with `HTTP 400`.
   - Clamps/strips untrusted client stats on `/api/online/sync` so clients cannot fabricate elevated realms, resources, or admin clearances.
   - Scores movement velocity, cooldowns, and rally totals inside `AuthoritativeAntiCheatEngine`.
3. **Durable Storage Commit (`serverPersistence.ts`)**:
   - Serializes authoritative state (`BigInt` normalized) into a `schemaVersion: 2` SHA-256 checksum envelope.
   - Writes to `.tmp` -> `fsyncSync` -> rotates verified primary to `.bak` -> POSIX atomic `renameSync`.
4. **Relational & Document Sync (`/api/db/*` & Firestore)**:
   - `/api/db/profile`, `/api/db/save`, and `/api/db/tickets` verify Firebase ID tokens via `requireAuth` (`src/middleware/auth.ts`) and key rows strictly by `req.uid`.
   - Firestore enforces matching field types and immutable ownership rules in `firestore.rules`.
