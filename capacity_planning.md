# 📊 Capacity Planning & Growth Forecasting (`capacity_planning.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `17/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **Single-Pod Envelope**: `250` WS siege peers, `5,000` LRU commanders, `~1,115 HTTP req/s`.
- **50-Player Raid Fanout**: `50` Avatars + `150` Clones = `200` entities (`~7.55ms` of `50ms` tick).
- **Scale Trigger**: Shard sectors & add Redis pub/sub above `180` concurrent sector peers.
