# 💾 Backup, Persistence & Disaster Recovery Runbook (`backups.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)
- **Data Controller & Custodian**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Persistence Tiers**:
  1. **Tier 1 — Authoritative Real-Time Siege & Realm Disk Store** (`src/game/serverPersistence.ts` → `data/online_realm_state.json` + `.bak`)
  2. **Tier 2 — Cloud SQL PostgreSQL Relational Database** (`ai-studio-416287a7` in `asia-southeast1` → `src/db/schema.ts`)
  3. **Tier 3 — Cloud Firestore Document Database** (`ai-studio-voxelrealmsrpgop-416287a7-e9eb-4cc3-b431-b5f2455f192b` in `dev-ivy-6v0ns`)

---

## 1. Recovery Point Objective (RPO) & Recovery Time Objective (RTO) Matrix

| Storage Tier                       | Primary Artifact / Instance                        | Backup Mechanism                                                                |                RPO (Max Data Loss)                 |   RTO (Target Restore Time)   |
| :--------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------: | :---------------------------: |
| **Tier 1: Local Realm Store**      | `data/online_realm_state.json`                     | Atomic SHA-256 `.bak` failover + `SIGTERM` flush (`AtomicRealmPersistence`)     |     `<= 30 seconds` (`0s` on graceful restart)     | `< 50 ms` (Automatic on boot) |
| **Tier 2: Cloud SQL (PostgreSQL)** | `ai-studio-416287a7` (`asia-southeast1`)           | Automated daily snapshots + Write-Ahead Log (WAL) Point-in-Time Recovery (PITR) |               `<= 5 minutes` (PITR)                |        `< 15 minutes`         |
| **Tier 3: Cloud Firestore**        | `dev-ivy-6v0ns` (`ai-studio-voxelrealmsrpgop-...`) | Multi-region synchronous replication + scheduled GCS exports                    | `<= 24 hours` (GCS export) / `0s` replica failover |        `< 10 minutes`         |

---

## 2. Tier 1 — Atomic Local Realm Persistence & Automatic `.bak` Failover (`src/game/serverPersistence.ts`)

### A. How `AtomicRealmPersistence` Prevents Save Corruption

Plain `fs.writeFileSync('online_realm_state.json', ...)` can truncate or corrupt the save file if the process crashes or runs out of disk space mid-write. `AtomicRealmPersistence` enforces a 5-step atomic commit protocol:

1. **Envelope Wrapping & SHA-256 Checksum**:
   - Computes `sha256Hex = SHA-256(JSON.stringify(data))` and wraps the payload in a versioned envelope (`schemaVersion: 2`, `savedAtIso`, `sha256`, `data`).
2. **Write & Flush Temporary File (`.tmp`)**:
   - Writes the serialized envelope to `data/online_realm_state.json.<pid>.tmp` and calls `fs.fsyncSync(fd)` so bytes are physically committed to disk before metadata changes.
3. **Verified Backup Promotion (`.bak`)**:
   - If the existing primary file `data/online_realm_state.json` has a valid SHA-256 checksum, copies it to `data/online_realm_state.json.bak`. (An already-corrupted primary file is **never** promoted over a healthy `.bak`!)
4. **Atomic POSIX Rename**:
   - Calls `fs.renameSync(tempPath, primaryPath)` to atomically replace `online_realm_state.json`.
5. **Graceful `SIGTERM` / `SIGINT` Drain**:
   - On container stop or restart, `server.ts` halts the 20Hz loop, closes WebSocket peers (`1001`), and performs a final atomic flush before exiting.

### B. Automatic Crash Recovery & Quarantine Flow

On server boot (`persistence.loadWithBackupRecovery(createDefaultStore)`):

- If `online_realm_state.json` passes SHA-256 and structural validation (`isValidPersistedStore`), it loads normally.
- If `online_realm_state.json` is truncated or tampered:
  1. The corrupted file is quarantined to `data/online_realm_state.json.corrupt-<timestamp>` for forensic inspection.
  2. The server automatically verifies and restores `data/online_realm_state.json.bak`, heals the primary file on disk, and sets `recoveredFromBackup: true` on `/readyz` and `/api/ops/readiness`.

---

## 3. Tier 2 — Cloud SQL PostgreSQL Backups (`src/db/schema.ts`)

Cloud SQL instance `ai-studio-416287a7` stores four relational tables:

- `users` (`uid`, `email`, `display_name`, `photo_url`, `created_at`, `updated_at`)
- `commander_profiles` (`uid`, `commander_name`, `species`, `castle_level`, `cultivation_realm`, `vip_tier`, `karma`, `alliance_tag`)
- `realm_saves` (`uid`, `schema_version`, `save_payload_json`, `client_seq`, `updated_at`)
- `support_tickets` (`id`, `uid`, `category`, `subject`, `message`, `status`, `created_at`)

### Manual Logical Backup (`pg_dump`) & Restore (`pg_restore`)

```bash
# Export a compressed, consistent snapshot of all 4 tables
pg_dump --host="$SQL_HOST" --username="$SQL_USER" --dbname="$SQL_DB_NAME" \
  --format=custom --no-owner --no-acl \
  --file="voxel_realms_sql_$(date -u +%Y%m%dT%H%M%SZ).dump"

# Verify dump archive contents without restoring
pg_restore --list "voxel_realms_sql_<timestamp>.dump"

# Restore into a staging or recovery database
pg_restore --host="$SQL_HOST" --username="$SQL_USER" --dbname="$SQL_DB_NAME" \
  --clean --if-exists --no-owner --no-acl \
  "voxel_realms_sql_<timestamp>.dump"
```

---

## 4. Tier 3 — Cloud Firestore Export & Import (`dev-ivy-6v0ns`)

Firestore collections (`users/{uid}`, `playerProfiles/{uid}`, `gameSaves/{uid}`, `supportTickets/{ticketId}`, `systemDecrees/{decreeId}`) are backed up to Google Cloud Storage:

```bash
# Export all Firestore collections to a timestamped GCS prefix
gcloud firestore export gs://dev-ivy-6v0ns-voxelrealms-backups/firestore-$(date -u +%Y%m%dT%H%M%SZ) \
  --database="ai-studio-voxelrealmsrpgop-416287a7-e9eb-4cc3-b431-b5f2455f192b" \
  --project="dev-ivy-6v0ns"

# Import from a verified GCS backup prefix
gcloud firestore import gs://dev-ivy-6v0ns-voxelrealms-backups/firestore-<timestamp> \
  --database="ai-studio-voxelrealmsrpgop-416287a7-e9eb-4cc3-b431-b5f2455f192b" \
  --project="dev-ivy-6v0ns"
```

---

## 5. Automated Backup & Recovery Verification Drill

Every commit and CI run executes automated corruption and `.bak` failover tests:

```bash
# 1. Run unit tests for SHA-256 envelope signing, .bak promotion, and corrupt file quarantine
npx tsx --test src/game/serverPersistence.test.ts

# 2. Run live server crash-recovery drill (truncates primary save and verifies live .bak failover)
npm run verify:ops
```
