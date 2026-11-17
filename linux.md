# 🐧 Linux Desktop, SteamOS & Production Container Specification (`linux.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. Linux Dual Role: Client Gaming Platform & Authoritative Production Server

Linux is both a primary **Client Gaming Platform** (Ubuntu `24.04 LTS`, Fedora `41+`, Arch Linux, and **SteamOS 3.x / Steam Deck**) and the canonical **Authoritative Production Server Runtime** (`server.ts`, `/ws/siege`, `AtomicRealmPersistence` in `src/game/serverPersistence.ts`):

- **Client Graphics & CPU ISA (`src/game/architectOptimization.ts`)**:
  - **Vulkan 1.3 (`vulkan_1_3`) & Mesa RADV / NVIDIA Proprietary Drivers**: Hardware-accelerated WebGL2/WebGPU and native C++20 Vulkan rendering on X11 and Wayland.
  - **Multi-ISA Support**: Supports **`x86_64 AVX-512F/BW`** (`x86_64_avx512`), **`ARMv9-A NEON + SVE2`** (`arm64_neon_sve2`), and **`RISC-V RV64GC + RVV 1.0`** (`riscv64_rvv`) vector profiles.
  - **Headless CI / Software Rasterizer Fallback (`software_rasterizer`)**: Automatically detects Mesa `llvmpipe` / `SwiftShader` in headless Linux containers (`detectWebGLSoftwareRenderer` in `src/game/graphicsEngine.ts`) and scales down shadow maps and particle counts so automated Playwright browser verification (`real-world QA.md`) runs at `60 FPS` without a physical GPU.

---

## 2. Linux POSIX Server Persistence & Kernel Tuning (`server.ts`)

- **Atomic POSIX File Durability (`src/game/serverPersistence.ts`)**:
  - Leverages Linux POSIX filesystem semantics: writes to `.tmp`, flushes kernel page caches to NVMe via `fs.fsyncSync`, promotes the verified primary save to `.bak`, and executes an atomic POSIX `fs.renameSync` within a SHA-256 integrity envelope (`schemaVersion: 2`).
- **Graceful Signal Draining (`SIGTERM` / `SIGINT`)**:
  - On container stop or systemd restart, `server.ts` intercepts `SIGTERM`/`SIGINT`, flushes all active commander states and `securityAuditLog` entries, closes `/ws/siege` WebSocket peers cleanly, and exits with code `0` (verified by `npm run verify:ops` in `scripts/verify-readiness.ts`).

---

## 3. Linux Build, Validation & C++20 Guardrail Commands

```bash
# 1. Install dependencies & run the full 5-stage validation pipeline on Linux
npm ci
npm run validate

# 2. Run the live production server load, exploit & crash-recovery harness
npm run verify:ops

# 3. Compile & execute C++20 SIMD/RAII Guardrails using GCC 13+ or Clang 17+
g++ -std=c++20 -O3 -mavx512f -pthread cpp/engine_guardrail_test.cpp -o /tmp/engine_guardrail_test && /tmp/engine_guardrail_test
```

---

## 4. Steam Deck (`SteamOS 3.x`) & Account Governance (`creatergame31@gmail.com`)

- **Steam Deck (`1280×800` @ `60/90 Hz` OLED)**: Automatically adapts between touch/gamepad D-pad overlays and trackpad/mouse picking (`three-mesh-bvh`), operating within the `15W–28W` thermal envelope (`ultrabook_28w`).
- **100 Playable Races & Creator Authority**: Full support for all **100 Playable Species / Races** (`src/game/species.ts`) with Admin (`creatergame31@gmail.com`) permission governance, plus Root Creator **`creatergame31@gmail.com`** 12-Domain All-Things Immunity and 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`).
