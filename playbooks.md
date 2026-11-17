# 🛠️ Rapid Mitigation Playbooks (`playbooks.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

| Playbook                      | Trigger Signal               | Immediate Action                                                                                      |
| :---------------------------- | :--------------------------- | :---------------------------------------------------------------------------------------------------- |
| **WS Flood Spike**            | `wsFloodDisconnects` surging | Verify IP cap (`20` peers/IP) in `serverHardening.ts`; block abusive CIDRs at edge.                   |
| **Save Corruption**           | `recoveredFromBackup: true`  | Inspect `.corrupt` quarantined save under `data/`; verify active `.bak` snapshot.                     |
| **Anti-Cheat False Positive** | Player dispute ticket        | Audit `GET /api/admin/state`; issue `POST /api/admin/anti-cheat/pardon` as `creatergame31@gmail.com`. |
| **20Hz Tick Overrun**         | `tickLatency.p95Ms > 40`     | Check active entity density (`<=200` per 50-player raid); rebalance or restart standby pod.           |
