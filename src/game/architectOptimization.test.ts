/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHITECT_RELEASE_DATE_DISPLAY,
  ARCHITECT_RELEASE_DATE_ISO,
  ARCHITECT_RELEASE_VERSION,
  GPU_BACKEND_COMPATIBILITY,
  HARDWARE_ISA_PROFILES,
  THERMAL_TDP_ENVELOPES,
  computeFrameBudgetAutoScaler,
  computeLockFreeJobSchedule,
  evaluateSoaVsAosMemoryLayout,
  generateArchitectCompatibilityDiagnostic,
} from './architectOptimization';

test('Architect Release metadata is synchronized to 06/11/2026 (2026-11-06) and v1.5.0', () => {
  assert.equal(ARCHITECT_RELEASE_VERSION, 'v1.5.0');
  assert.equal(ARCHITECT_RELEASE_DATE_DISPLAY, '06/11/2026');
  assert.equal(ARCHITECT_RELEASE_DATE_ISO, '2026-11-06');
});

test('Hardware Architect ISA profiles cover x86_64 AVX-512, ARM64 SVE2, Apple Silicon 128B UMA, and RISC-V RVV 1.0', () => {
  assert.equal(HARDWARE_ISA_PROFILES.x86_64_avx512.simdRegisterWidthBits, 512);
  assert.equal(HARDWARE_ISA_PROFILES.x86_64_avx512.float32LanesPerRegister, 16);
  assert.equal(HARDWARE_ISA_PROFILES.x86_64_avx512.cacheLineSizeBytes, 64);

  assert.equal(HARDWARE_ISA_PROFILES.apple_silicon_m.cacheLineSizeBytes, 128);
  assert.equal(HARDWARE_ISA_PROFILES.apple_silicon_m.unifiedMemoryArchitecture, true);

  assert.equal(HARDWARE_ISA_PROFILES.arm64_sve2.architectureFamily, 'ARMv9-A / ARM64');
  assert.equal(HARDWARE_ISA_PROFILES.riscv_rvv1.architectureFamily, 'RISC-V RV64GC');
});

test('Software Architect SoA contiguous layout outperforms legacy AoS in cache misses, bandwidth, and frame time', () => {
  const soa = evaluateSoaVsAosMemoryLayout(100_000, 'soa_contiguous', 'x86_64_avx512');
  const aos = evaluateSoaVsAosMemoryLayout(100_000, 'aos_legacy', 'x86_64_avx512');

  assert.ok(soa.bytesPerEntityTransformHotLoop < aos.bytesPerEntityTransformHotLoop);
  assert.ok(soa.estimatedCacheMissRatePct < 5);
  assert.ok(aos.estimatedCacheMissRatePct > 30);
  assert.ok(soa.memoryBandwidthGbPerSecAt60Hz < aos.memoryBandwidthGbPerSecAt60Hz);
  assert.ok(soa.hotLoopFrameTimeMs < aos.hotLoopFrameTimeMs);
  assert.ok(soa.speedupVsAosMultiplier > 4.0);
});

test('Software Architect Lock-Free Work-Stealing Job System scales with logical CPU cores with zero mutex stalls', () => {
  const quadCore = computeLockFreeJobSchedule(4, 100_000, 'arm64_sve2');
  const sixteenCore = computeLockFreeJobSchedule(16, 100_000, 'x86_64_avx512');

  assert.equal(quadCore.mutexContentionStallMs, 0);
  assert.equal(sixteenCore.mutexContentionStallMs, 0);
  assert.equal(quadCore.stages.length, 5);
  assert.ok(sixteenCore.totalFrameExecutionMs < quadCore.totalFrameExecutionMs);
  assert.ok(sixteenCore.parallelEfficiencyPct > quadCore.parallelEfficiencyPct);
});

test('Frame-Budget Auto-Scaler dynamically adjusts LOD bias, shadow cascades, and DRS under tight frame or thermal budgets', () => {
  const desktopHeadroom = computeFrameBudgetAutoScaler(60, 4.2, 'enthusiast_desktop_350w');
  assert.equal(desktopHeadroom.withinBudget, true);
  assert.equal(desktopHeadroom.recommendedLodBias, 0);
  assert.equal(desktopHeadroom.recommendedShadowCascades, 4);
  assert.equal(desktopHeadroom.dynamicResolutionScalePct, 100);

  const mobileThermal = computeFrameBudgetAutoScaler(120, 11.5, 'mobile_passive_8w');
  assert.equal(mobileThermal.withinBudget, false);
  assert.equal(mobileThermal.recommendedLodBias, 2);
  assert.equal(mobileThermal.recommendedShadowCascades, 1);
  assert.equal(mobileThermal.dynamicResolutionScalePct, 75);
});

test('Composite Architect Compatibility Diagnostic achieves 100/100 optimization score on SoA + Vulkan 1.3 + x86_64 AVX-512', () => {
  const report = generateArchitectCompatibilityDiagnostic({
    isaId: 'x86_64_avx512',
    gpuBackendId: 'vulkan_1_3',
    thermalEnvelopeId: 'enthusiast_desktop_350w',
    memoryLayout: 'soa_contiguous',
    entityCount: 100_000,
    logicalCores: 16,
    targetRefreshHz: 60,
  });

  assert.equal(report.releaseDateDisplay, '06/11/2026');
  assert.equal(report.overallOptimizationScore, 100);
  assert.equal(GPU_BACKEND_COMPATIBILITY.vulkan_1_3.fallbackBackendId, 'webgl2');
  assert.equal(THERMAL_TDP_ENVELOPES.handheld_25w.sustainedTdpWatts, 25);
});
