# Firestore Security Specification

## 1. Data Invariants

1. **Identity & Email Verification**: All user-initiated writes require an authenticated session (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`), and every owner/UID field must strictly equal `request.auth.uid`.
2. **PII Isolation (Split Collection)**: Private user PII (`email`, `role`) is stored exclusively at `/users/{userId}/private/account` and may only be read by `isOwner(userId)` or `isAdmin()`. Public commander telemetry (`/users/{userId}/public/profile`) contains zero PII.
3. **Zero Privilege Escalation**:
   - Client writes to `/admins/{userId}` are unconditionally denied.
   - `UserPrivateAccount.role` must equal `'player'` on creation and is immutable on update.
   - Admin checks (`isAdmin()`) require `email_verified == true` and either an explicit `/admins/$(request.auth.uid)` lookup or the verified runtime primary admin email (`creatergame31@gmail.com`).
4. **Strict Schema & Shadow Field Prevention**: Every `create` verifies `keys().hasAll(...)` and `keys().hasOnly(...)`; every `update` splits into explicit named actions using `incoming().diff(existing()).affectedKeys().hasOnly(...)` plus full `isValid[Entity](incoming())` re-validation.
5. **Path & Payload Bounds**: Every document ID path parameter is validated via `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), every string enforces explicit `.size()` min/max bounds, and arrays (`discoveredCodexIds`) enforce `.size() <= 64` and element type checks.
6. **Temporal Integrity & Immutability**: `createdAt` must equal `request.time` on `create` and remain immutable on `update`; `updatedAt` must equal `request.time` on every `create` and `update`. `ownerId` and `uid` are immutable.
7. **Terminal State Locking**: Once a `SupportTicket` reaches `status == 'resolved'`, non-admin updates are unconditionally denied.
8. **Secure List Queries**: `allow list` on `/supportTickets/{ticketId}` and `/users/{userId}/saves/{saveId}` enforces `resource.data.ownerId == request.auth.uid` (or `isAdmin()`), never delegating filtering to the client and never calling `get()`/`exists()` inside `allow list`.

## 2. The "Dirty Dozen" Attack Payloads

1. **Unauthenticated Profile Write**: `{ uid: "u1", commanderName: "Guest", ... }` with `auth == null` -> **PERMISSION_DENIED**.
2. **Unverified Email Spoofing**: Admin email `creatergame31@gmail.com` with `email_verified: false` attempting admin read/write -> **PERMISSION_DENIED**.
3. **Self-Assigned Admin Role**: Creating `/users/u1/private/account` with `{ uid: "u1", email: "u1@example.com", role: "admin", ... }` -> **PERMISSION_DENIED**.
4. **Shadow / Ghost Field Injection**: Creating `/users/u1/public/profile` with an extra field `isVerified: true` or `godmode: true` -> **PERMISSION_DENIED**.
5. **Cross-Owner Identity Spoofing**: User `u1` attempting to create `/users/u2/saves/s1` or setting `ownerId: "u2"` -> **PERMISSION_DENIED**.
6. **ID Poisoning (1.5 KB Document ID)**: Writing `/supportTickets/${"a".repeat(1500)}` -> **PERMISSION_DENIED**.
7. **Value Poisoning (Oversized String)**: Updating `SupportTicket.message` with `"x".repeat(2001)` -> **PERMISSION_DENIED**.
8. **PII Cross-User Read Leak**: Signed-in user `u2` reading `/users/u1/private/account` -> **PERMISSION_DENIED**.
9. **Client Timestamp Forgery**: Creating `CommanderRealmSave` with `createdAt` or `updatedAt` set to a forged past/future timestamp (`!= request.time`) -> **PERMISSION_DENIED**.
10. **Immutable Field Tampering**: Updating `CommanderRealmSave` to modify `ownerId` or `createdAt` -> **PERMISSION_DENIED**.
11. **Terminal State Re-Opening**: Non-admin user updating `/supportTickets/t1` after `existing().status == "resolved"` -> **PERMISSION_DENIED**.
12. **Unfiltered Collection Scraping / Direct Admin Escalation**: Writing `/admins/u1` as signed-in non-admin or issuing unscoped `list` on `/supportTickets` -> **PERMISSION_DENIED**.
