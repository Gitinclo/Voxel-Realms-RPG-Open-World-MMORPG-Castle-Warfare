# OpenAPI 3.2 Agent Reference (Game / Real-Time Backends)

> Purpose: context file for an AI coding agent that writes, edits, or validates OpenAPI documents.
> Read fully before generating any `openapi.yaml`. Rules in sections 1 and 8 are mandatory.
> Project-specific stack & route bindings for **Voxel Realms RPG** are in Section 10.

---

## 1. Hard facts (do not contradict)

- Latest OAS version: **3.2.x**. Feature release **3.2.0** shipped September 2025. **3.2.1** is a patch: wording, cross-references and clarifications only, **no new features**.
- Patch versions never change the feature set. Tooling should treat 3.2.0 and 3.2.1 identically.
- 3.2 is a **minor** release on top of 3.1. It keeps JSON Schema **Draft 2020-12**. A valid 3.1 document should stay valid after changing the version string, because 3.2 adds opt-in features instead of removing old ones.
- Set `openapi: 3.2.0` in new documents (safest for tools that only list exact versions). Do not invent versions like `3.2` or `3.2.x`.
- Next planned minor (**3.3**) is aimed at security schemes and better integration with MCP / AI protocols. It is not released. Do not use 3.3 fields.
- Format: JSON or YAML. Prefer YAML 1.2 and avoid YAML values that do not round-trip to JSON.

---

## 2. What is new in 3.2 (feature map)

| Feature                             | New field / keyword                                                                                                                                                                       | Use it for                                                                   | Game-backend example                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Streaming media types               | `itemSchema`, `itemEncoding`, `prefixEncoding` on the Media Type Object; types `text/event-stream`, `application/jsonl`, `application/json-seq`, `multipart/mixed`                        | Describing each item/event in a stream instead of the whole body             | Live event feed, server notifications, streamed NPC / AI dialogue |
| Device authorization flow           | `flows.deviceAuthorization` with `deviceAuthorizationUrl` + `tokenUrl`                                                                                                                    | Login on input-limited devices: show a short code, user finishes on phone/PC | Console and smart-TV game login                                   |
| OAuth2 metadata                     | `oauth2MetadataUrl` on OAuth2 security schemes                                                                                                                                            | Point to the auth server's metadata document                                 | Central auth service discovery                                    |
| `QUERY` HTTP method                 | `query` operation on a Path Item                                                                                                                                                          | Safe, idempotent request that carries a **body**                             | Matchmaking filters, leaderboard queries, inventory search        |
| Arbitrary HTTP methods              | `additionalOperations` map on a Path Item                                                                                                                                                 | Methods OAS does not model natively (e.g. `LINK`)                            | Rare; only for non-standard verbs                                 |
| Hierarchical tags                   | Tag Object fields `summary`, `parent`, `kind`                                                                                                                                             | Nested navigation and grouping                                               | Economy > Storefront > Bundles                                    |
| Whole query string as one parameter | `in: querystring` (uses `content`)                                                                                                                                                        | Complex or non-standard query serialization                                  | Compact filter DSL in the URL                                     |
| Better examples                     | Example Object `dataValue` and `serializedValue`                                                                                                                                          | Separate the logical value from its on-the-wire form                         | Show object form and its encoded query string                     |
| Document identity                   | `$self` at root                                                                                                                                                                           | Stable base URI for resolving relative references                            | Multi-file specs                                                  |
| Smaller additions                   | `summary` on Response; `name` on Server; `mediaTypes` in Components; `deprecated` on Security Scheme; `defaultMapping` on Discriminator; `nodeType` on XML Object; cookie `style: cookie` | Cleaner reuse and modeling                                                   | Reusable stream media types                                       |

Verify any "smaller addition" against https://spec.openapis.org/oas/latest before relying on exact semantics.

---

## 3. Copy-ready examples

### 3.1 Skeleton

```yaml
openapi: 3.2.0
$self: https://api.example.com/openapi/game.yaml
info:
  title: Game Backend API
  version: 1.0.0
servers:
  - url: https://api.example.com
    name: production
```

### 3.2 Server-Sent Events (live event feed)

```yaml
paths:
  /events/stream:
    get:
      operationId: streamLiveEvents
      tags: [live-events]
      responses:
        '200':
          description: Continuous stream of game events
          content:
            text/event-stream:
              itemSchema:
                type: object
                required: [data]
                properties:
                  event: { type: string }
                  id: { type: string }
                  retry: { type: integer }
                  data:
                    type: string
                    contentMediaType: application/json
                    contentSchema:
                      $ref: '#/components/schemas/GameEvent'
```

### 3.3 JSON Lines (streamed NPC / AI dialogue)

```yaml
paths:
  /npc/{npcId}/dialogue:
    post:
      operationId: streamNpcDialogue
      parameters:
        - name: npcId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/DialogueRequest' }
      responses:
        '200':
          description: Dialogue chunks, one JSON object per line
          content:
            application/jsonl:
              itemSchema:
                $ref: '#/components/schemas/DialogueChunk'
```

### 3.4 QUERY method (matchmaking / leaderboard filters)

```yaml
paths:
  /matches/search:
    query:
      operationId: searchMatches
      summary: Search matches with a structured filter (safe, idempotent)
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/MatchFilter' }
      responses:
        '200':
          description: Matching results
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/Match' }
```

### 3.5 `additionalOperations` (non-standard methods only)

```yaml
paths:
  /items/{id}:
    additionalOperations:
      LINK:
        operationId: linkItem
        responses:
          '204': { description: Linked }
```

### 3.6 Device authorization flow (console / TV login)

```yaml
components:
  securitySchemes:
    deviceLogin:
      type: oauth2
      oauth2MetadataUrl: https://auth.example.com/.well-known/oauth-authorization-server
      flows:
        deviceAuthorization:
          deviceAuthorizationUrl: https://auth.example.com/oauth/device/code
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            profile: Read the player profile
            inventory: Read the inventory
security:
  - deviceLogin: [profile]
```

### 3.7 Hierarchical tags

```yaml
tags:
  - name: economy
    summary: Economy
    kind: nav
  - name: storefront
    summary: Storefront
    parent: economy
    kind: nav
  - name: bundles
    summary: Bundles
    parent: storefront
    kind: nav
```

### 3.8 `querystring` parameter

```yaml
parameters:
  - name: filter
    in: querystring
    content:
      application/x-www-form-urlencoded:
        schema:
          type: object
          properties:
            region: { type: string }
            mode: { type: string }
```

### 3.9 Examples with `dataValue` / `serializedValue`

```yaml
examples:
  rankedEu:
    summary: Ranked matches in EU
    dataValue: { region: eu, mode: ranked }
    serializedValue: region=eu&mode=ranked
```

---

## 4. Mapping features to game systems

| Game system                                      | Best 3.2 feature                                         |
| ------------------------------------------------ | -------------------------------------------------------- |
| Live world events, global announcements          | `text/event-stream` + `itemSchema`                       |
| Streamed NPC / AI dialogue                       | `application/jsonl` + `itemSchema`                       |
| Bulk telemetry upload or export                  | `application/json-seq` or `application/jsonl`            |
| Console / TV / handheld login                    | OAuth2 `deviceAuthorization` flow                        |
| Matchmaking, server browser, leaderboard filters | `query` method (or `in: querystring`)                    |
| Large multi-domain backend docs                  | Hierarchical tags (`parent`, `kind`, `summary`)          |
| Multipart mixed payloads (assets + metadata)     | `multipart/mixed` with `prefixEncoding` / `itemEncoding` |

Note: for real-time bidirectional traffic (WebSockets, game state sync), OpenAPI is still the wrong tool. Describe that with AsyncAPI and keep OpenAPI for the HTTP surface.

---

## 5. Migration 3.1 -> 3.2 checklist

1. Change `openapi: 3.1.x` to `openapi: 3.2.0`.
2. Run a validator that explicitly supports 3.2. Fix errors.
3. Replace vendor extensions with native fields where one exists (e.g. tag grouping extensions -> `parent` / `kind`; custom streaming extensions -> `itemSchema`).
4. Convert "search via POST" endpoints to `query` **only if** your clients, gateways, proxies and CDN accept the `QUERY` method.
5. Add `deviceAuthorization` only if you actually run an OAuth2 device endpoint.
6. Re-generate SDKs and docs. Diff the output. If a generator breaks, see section 7.

---

## 6. Mistakes to avoid (agent must check each)

- Do **not** use `nullable: true` (3.0 only). Use `type: [string, 'null']`.
- Do **not** combine `in: querystring` with any `in: query` parameter on the same operation, and use at most one `querystring` parameter.
- Do **not** put side effects behind `query`. It is safe and idempotent by definition.
- Do **not** use `additionalOperations` for methods that already have a field (`get`, `put`, `post`, `delete`, `options`, `head`, `patch`, `trace`, `query`).
- Do **not** describe streams with only `schema`. Use `itemSchema` for the per-item shape.
- Do **not** claim a feature works in a tool without checking that tool's 3.2 support.
- Do **not** invent fields. If unsure, look it up in the spec.
- Keep `operationId` values unique across the whole document.
- Keep secrets (client secrets, real tokens) out of `examples`.

---

## 7. Tooling guidance

- Spec support and tool support are different things. Support for 3.2 is still rolling out and uneven across linters, code generators, mock servers and gateways.
- Swagger has announced 3.2.0 support across its UI/editor tooling. Check each other tool (Redocly, openapi-generator, Spectral, gateways) individually.
- Safe workflow when tooling lags:
  1. Author in 3.2.
  2. Validate with a 3.2-aware tool.
  3. If a downstream tool rejects 3.2, keep a **3.1 downlevel copy** without the 3.2-only features (`query`, `itemSchema`, `deviceAuthorization`, hierarchical tags) and document what was dropped.
- Always state in your answer which tool versions you verified.

---

## 8. Agent behavior rules

1. Before writing any spec, confirm the target version. Default to `3.2.0` for new work unless the toolchain forbids it.
2. Prefer native 3.2 fields over `x-` extensions when a native field exists.
3. When a request needs a 3.2-only feature but the toolchain is unknown, ask once, or generate 3.2 and note the 3.1 fallback.
4. Validate output before presenting it. Report validator name and version.
5. Never state that a library or gateway "supports 3.2" without evidence.
6. Keep examples realistic for the project's domain (game economy, matchmaking, auth, live events).

---

## 9. Sources (verify here)

- Specification: https://spec.openapis.org/oas/latest
- v3.2.0 announcement (OpenAPI Initiative): https://www.openapis.org/blog/2025/09/23/announcing-openapi-v3-2
- Migration guide: https://learn.openapis.org
- Swagger 3.2.0 support: https://swagger.io/blog/swagger-launches-support-for-openapi-3-2-0/
- Overview articles: https://nordicapis.com/whats-new-in-openapi-specification-v3-2-0/ and https://redocly.com/blog/openapi-3-2

---

## 10. Voxel Realms RPG Project Stack & Live Endpoint Binding

### 10.1 Verified Runtime Stack

- **HTTP API Framework:** Express `5.3.0` on Node.js `>=22.0.0` (`server.ts` -> `src/server/createApp.ts` + `src/server/routes/*`)
- **Primary OpenAPI Contract:** [`docs/openapi.yaml`](./docs/openapi.yaml) (`openapi: 3.2.0`)
- **Downlevel Fallback Contract:** [`docs/openapi.3.1.yaml`](./docs/openapi.3.1.yaml) (`openapi: 3.1.0` — omits `$self`, server `name`, hierarchical tag `summary`/`parent`/`kind`, response `summary`, and `dataValue`/`serializedValue`)
- **Authentication & Sessions:**
  - `SessionCookie`: HMAC-SHA256 signed `HttpOnly` cookie (`voxel_session`) issued by `/api/auth/player-session`, `/api/auth/firebase-exchange`, and `/api/auth/admin-login`, with revocation via `InMemory` or `REDIS_REST_URL`
  - `FirebaseBearer`: Firebase Auth ID token (`Authorization: Bearer <jwt>`) verified server-side via `firebase-admin`
- **Databases & Persistence:**
  - Cloud SQL PostgreSQL + Drizzle ORM (`src/db/schema.ts`, 7 tables: `users`, `commander_profiles`, `realm_saves`, `support_tickets`, `economy_accounts`, `economy_ledger_entries`, `economy_idempotency_keys`) with `SELECT ... FOR UPDATE` ACID economy transactions
  - Atomic SHA-256 disk persistence (`.bak` failover) when PostgreSQL is disabled/disk-isolated
- **Real-Time Bidirectional & Multi-Layer MMORPG Protocol Stack:**
  | Layer                                   | Spec & File                                                                                                             | Status                                                                         | Scope in Voxel Realms RPG                                                                                                                             |
  | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
  | **1. Real-Time World & Combat**         | FlatBuffers [`schemas/flatbuffers/voxel_siege_protocol.fbs`](./schemas/flatbuffers/voxel_siege_protocol.fbs)            | **Binary Wire Spec** (Planned UDP / ENet / KCP / WebTransport & C++20 upgrade) | Zero-copy quantized int16/uint16 kinematics, `CohortDirtyBit` bitmasked deltas, and `SiegeNetPacket` frames mirroring `src/game/siegeNetProtocol.ts`. |
  | **2. Persistent WebSockets & Events**   | AsyncAPI `3.0.0` [`docs/asyncapi.yaml`](./docs/asyncapi.yaml)                                                           | **Implemented Live** (`/ws/siege` RFC 6455 20Hz gateway)                       | Authoritative 20Hz troop/rally commands, delta updates, keyframes, presence, and anti-cheat/rate-limit control frames (`src/server/wsGateway.ts`).    |
  | **3. Internal Microservices**           | gRPC / `proto3` [`schemas/proto/voxel_realm_internal.proto`](./schemas/proto/voxel_realm_internal.proto)                | **Planned Multi-Shard Contract** (for GKE multi-pod scaling)                   | `ZoneHandoffService`, `EconomyLedgerService`, `AntiCheatTelemetryService`, and `GuildStorageLockService`.                                             |
  | **4. Web, Auth, Economy & Persistence** | OpenAPI `3.2.0` [`docs/openapi.yaml`](./docs/openapi.yaml) + `3.1.0` [`docs/openapi.3.1.yaml`](./docs/openapi.3.1.yaml) | **Implemented Live** (34 Express 5 HTTP operations)                            | Health/metrics, HMAC & Firebase auth, realm sync, hash-chained economy/castle/troops/market, DSR privacy, RBAC admin, and Cloud SQL Drizzle APIs.     |
- **Automated Contract Verification:**
  - `src/server/openapiContract.test.ts`, `src/server/protocolStackContract.test.ts`, and `src/server/serverIntegration.test.ts` assert bidirectional 100% HTTP method+path parity against `createVoxelServerRuntime()`, 100% `SiegeNetOpcode` parity across AsyncAPI 3.0.0 and FlatBuffers `.fbs`, and gRPC `proto3` service integrity on every `npm test` / `npm run validate`.

### 10.2 Implemented HTTP Surface (34 Operations)

| Domain / Tag Hierarchy            | Route Module                         | Operations                                                                                                                                                                      |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operations`                      | `src/server/routes/healthRoutes.ts`  | `GET /healthz`, `GET /api/health`, `GET /readyz`, `GET /metrics`, `GET /api/ops/readiness`                                                                                      |
| `auth`                            | `src/server/routes/authRoutes.ts`    | `GET /api/auth/session`, `POST /api/auth/firebase-exchange`, `POST /api/auth/player-session`, `POST /api/auth/admin-login`, `POST /api/auth/logout`                             |
| `realm`                           | `src/server/routes/onlineRoutes.ts`  | `GET /api/online/status`, `POST /api/online/sync`, `POST /api/online/siege/cmd`                                                                                                 |
| `economy` > `economy-ledger`      | `src/server/routes/economyRoutes.ts` | `GET /api/online/economy/balance`, `POST /api/online/economy/transact`, `POST /api/online/economy/events`, `POST /api/online/economy/claim-action`                              |
| `economy` > `economy-progression` | `src/server/routes/economyRoutes.ts` | `POST /api/online/economy/castle-upgrade`, `POST /api/online/economy/purchase-troops`                                                                                           |
| `economy` > `economy-marketplace` | `src/server/routes/economyRoutes.ts` | `POST /api/online/economy/market-trade`                                                                                                                                         |
| `persistence`                     | `src/server/routes/dbRoutes.ts`      | `GET /api/db/profile`, `PUT /api/db/profile`, `GET /api/db/save`, `PUT /api/db/save`, `GET /api/db/tickets`, `POST /api/db/tickets`                                             |
| `governance` > `privacy`          | `src/server/routes/privacyRoutes.ts` | `GET /api/online/account/export`, `DELETE /api/online/account`                                                                                                                  |
| `governance` > `admin-rbac`       | `src/server/routes/adminRoutes.ts`   | `GET /api/admin/state`, `POST /api/admin/moderation`, `POST /api/admin/tickets`, `POST /api/admin/tickets/resolve`, `POST /api/admin/decree`, `POST /api/admin/species-rebirth` |
