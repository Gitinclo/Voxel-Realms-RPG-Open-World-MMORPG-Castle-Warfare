# Auction House & Inter-Sect Economy Mechanics (`AUCTION_HOUSE_MECHANICS.md`)

Specification for high-value immortal treasure trading, Kingdom Diamond & Spirit Stone escrow, `BigInt` bid arithmetic, and anti-manipulation controls in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Supported Tradable Assets

- **Rare Cultivation Manuals & Dao Scriptures** (`ALCHEMY_AND_PILLS.md`, `RELICS_AND_TREASURES.md`)
- **Unbound Talisman Inscriptions & Formation Blueprints**
- **Cosmetic Clone Avatar Outfits** (tradeable visual skins separate from soul-bound combat avatars)
- **Raw Bulk Alliance Supplies**: Wood, Steel, Copper, Grain, and Oil lotes scaled via `bigint`.

---

## 2. Escrow, Bidding & Anti-Sniping Rules

1. **Authoritative Server Escrow (`BigInt`)**: Submitting a bid locks the exact Spirit Stone or Kingdom Diamond stake server-side using lossless `bigint` balances—never client floats—preventing integer overflow (`Number.MAX_SAFE_INTEGER`) and double-spend races.
2. **Soft-Close Anti-Sniping**: Any valid bid placed inside the final **30 seconds** extends the listing timer by **+45 seconds** (capped at 10 extensions per lot).
3. **5% Sovereign Auction Levy**: Settled sales deduct a `5%` treasury sink to curb unbounded Spirit Stone inflation (`QI_ECONOMY.md`).
4. **Wash-Trading & RMT Detection**: Repeated cross-transfers between linked IPs or accounts at `>5x` floor price trigger `AuthoritativeAntiCheatEngine` economy flags (`antiCheat.ts`) for moderator review by `creatergame31@gmail.com`.
