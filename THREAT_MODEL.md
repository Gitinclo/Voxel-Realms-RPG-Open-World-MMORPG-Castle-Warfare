# 🛡️ STRIDE Threat Model (`THREAT_MODEL.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

| STRIDE Threat       | Vector                                      | Defense & Test Suite                                                        |
| :------------------ | :------------------------------------------ | :-------------------------------------------------------------------------- |
| **Spoofing**        | Forged Firebase Bearer / fake admin login   | `firebase-admin` check + `serverAuth.ts` timing-safe passkey (`verify:ops`) |
| **Tampering**       | Speed-hack, stat inflation, save corruption | `antiCheat.ts`, `/api/online/sync` clamping, SHA-256 save envelope          |
| **Repudiation**     | Disputed bans/pardons                       | Persistent `securityAuditLog` bound to verified server actor                |
| **Info Disclosure** | Leaked emails / OAuth tokens                | Redacted public roster; Gmail token in React memory only                    |
| **DoS**             | WS floods, huge JSON, brute force           | `serverHardening.ts` rate/frame limits & brute-force lockouts               |
| **Elevation**       | Firestore/API role escalation               | Default-deny `firestore.rules` (`Dirty Dozen`) + `/api/admin/*` `403`       |
