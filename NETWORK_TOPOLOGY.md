# 🌐 Network Topology & Regional Quorum (`NETWORK_TOPOLOGY.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

- **Ingress**: HTTPS / WSS termination at Cloud Run / Edge Nginx proxy forwarding to port `3000` (`server.ts`).
- **Logical Multi-Region Cluster Model**: `us-east-solara-1`, `eu-central-valhalla-1`, and `ap-southeast-celestia-1` verified via FNV-1a `stateHash` quorum checks in `siegeNetProtocol.ts`.
- **Cloud Database Routing**: Server uses private Cloud SQL Auth Proxy Unix socket (`/app/cloudsql/...`) + TLS Firestore channels.
