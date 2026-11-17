# 🪟 Windows Platform Engineering & Optimization Guide (`Windows.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** [Apache-2.0](./LICENSE.md) / [EULA v1.5.0](./EULA.md)

---

## 1. Windows 11 / Windows 10 Architecture Overview

**Voxel Realms RPG** supports Windows 11 (`24H2+`) and Windows 10 (`22H2+`, `x86_64` and `ARM64` Snapdragon X Elite) across both the **WebGL2 / WebGPU Browser Client** (Chromium Edge, Chrome, Firefox) and the **Native C++20 Desktop Engine Target (`cpp/VoxelRealmsGuardrails.hpp`, `vcpkg.json`)**:

- **Graphics Backends (`src/game/architectOptimization.ts`, `src/game/graphicsEngine.ts`)**:
  - **DirectX 12 Ultimate (`dx12_ultimate`)**: Hardware-accelerated Direct3D 12 via ANGLE D3D11/D3D12 translation for WebGL2/WebGPU and native DX12 Ultimate command queues (`ExecuteIndirect`, Mesh Shaders, Sampler Feedback, Variable Rate Shading Tier 2, and DirectStorage `1.2` NVMe decompression).
  - **Vulkan 1.3 (`vulkan_1_3`)**: Cross-vendor native Windows Vulkan path supporting descriptor indexing, dynamic rendering, and asynchronous compute queues.
- **Texture Compression & PBR Pipeline (`PC_CONSOLE_IMPORT_OVERRIDES`)**:
  - Uses **`BC7` (`DXGI_FORMAT_BC7_UNORM_SRGB`)** block compression (`8 bpp`) for `1024×1024` Albedo/Roughness maps and **`BC5` (`DXGI_FORMAT_BC5_UNORM`)** for tangent-space normal maps with `16x` anisotropic filtering and `2048×2048` `PCFSoftShadowMap` cascades.

---

## 2. Windows Hardware Requirements & Telemetry Tiers

| Tier                    | OS Version                 | CPU Profile (`HARDWARE_ISA_PROFILES`)                  | GPU / VRAM                              | RAM      | Target Frame Rate & Preset                                         |
| :---------------------- | :------------------------- | :----------------------------------------------------- | :-------------------------------------- | :------- | :----------------------------------------------------------------- |
| **Minimum**             | Windows 10 64-bit (`22H2`) | 4-Core `x86_64` (`AVX2`)                               | DirectX 12 / WebGL2 GPU (`4 GB` VRAM)   | `8 GB`   | `1080p @ 60 FPS` (`Medium` / `512px` PBR)                          |
| **Recommended**         | Windows 11 64-bit (`24H2`) | 8-Core `x86_64 AVX-512F/BW` (`64B` cache line)         | RTX 3060 / RX 6700 XT (`8 GB+` VRAM)    | `16 GB`  | `1440p @ 120 FPS` (`Ultra` / `1024px` BC7)                         |
| **Enthusiast (`350W`)** | Windows 11 Pro (`24H2+`)   | 16-Core+ `x86_64 AVX-512` / `Snapdragon X Elite ARMv9` | RTX 4080+ / RX 7900 XTX (`16 GB+` VRAM) | `32 GB+` | `4K @ 120–240 FPS` (`Ultra` + HDR Bloom + `800` Instanced Foliage) |

---

## 3. Native Windows Build & Developer Setup (`MSVC` / `Clang-CL` + `vcpkg`)

```powershell
# 1. Install Node.js 22+ & dependencies for the Full-Stack Express + Vite + WebGL2 client
npm install
npm run dev          # Starts http://localhost:3000 with 20Hz /ws/siege WebSocket authority

# 2. Native C++20 Guardrail Compilation via Visual Studio 2022 / Clang-CL + vcpkg
vcpkg install --triplet x64-windows
cl /std:c++20 /EHsc /O2 /arch:AVX512 cpp\engine_guardrail_test.cpp
```

---

## 4. Input, Audio & Authoritative Security on Windows

- **Desktop Precision Controls**: Full `WASD` movement, right-click orbital camera pan (`@tweenjs/tween.js`), scroll-wheel zoom, `1–9` hotkey bar, and `O(log N)` pointer raycasting (`three-mesh-bvh`).
- **Windows Audio Session (`WASAPI`)**: Low-latency Web Audio API procedural synthesis (`src/game/audio.ts`) mapped through Windows `WASAPI` shared/exclusive output.
- **Server-Authoritative Anti-Cheat & Root Creator Governance**: All Windows clients connect to `/ws/siege` and `/api/online/*` under `AuthoritativeAntiCheatEngine` (`src/game/antiCheat.ts`), while Root Creator **`creatergame31@gmail.com`** retains immutable `Lv. 999` authority, 12-Domain All-Things Immunity, 100 Supreme Omni-Attributes (`src/game/godModeCharacter.ts`), and unrestricted access to all 100 Playable Races (`src/game/species.ts`).

---

## 5. Related Platform & Architecture Guides

- [`PC.md`](./PC.md) · [`mac.md`](./mac.md) · [`linux.md`](./linux.md) · [`playstation.md`](./playstation.md) · [`xbox.md`](./xbox.md) · [`iOS.md`](./iOS.md) · [`android.md`](./android.md) · [`Virtual Reality.md`](./Virtual%20Reality.md) · [`compatibility_matrix.md`](./compatibility_matrix.md)
