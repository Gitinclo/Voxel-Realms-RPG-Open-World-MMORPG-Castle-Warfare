/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAtmosphericSkyParams,
  computeDeploymentBundleManifest,
  computeLightingStrategy,
  computeLodChainPolicy,
  computeMasterTextureImportOverride,
  computeMeshAndTextureBudget,
  computeSurfaceWetnessParams,
  computeUberShaderKeywords,
  getGraphicsPresetMetadata,
  getPostProcessProfile,
} from './graphicsEngine';

test('computeAtmosphericSkyParams calculates distinct Golden Hour, Noon, and Midnight scattering', () => {
  const noon = computeAtmosphericSkyParams(12, 'clear', 'ultra');
  const sunset = computeAtmosphericSkyParams(17.8, 'clear', 'ultra');
  const midnight = computeAtmosphericSkyParams(0, 'clear', 'ultra');

  // Noon has highest sun elevation and zero stars
  assert.ok(noon.sunElevationDeg > 75);
  assert.equal(noon.starfieldOpacity, 0);
  assert.ok(noon.sunLightIntensity > 2.8);

  // Golden hour sunset has elevated Rayleigh & turbidity for warm orange scattering and high god-rays
  assert.ok(sunset.rayleigh > noon.rayleigh);
  assert.ok(sunset.turbidity > noon.turbidity);
  assert.ok(sunset.godRayIntensity > noon.godRayIntensity);

  // Midnight has negative sun elevation and visible starfield
  assert.ok(midnight.sunElevationDeg < -40);
  assert.ok(midnight.starfieldOpacity > 0.8);
  assert.ok(midnight.sunLightIntensity < 0.8);
});

test('computeSurfaceWetnessParams increases specular clearcoat and lowers roughness in rain and storm (GTA V wet roads)', () => {
  const clear = computeSurfaceWetnessParams('clear');
  const rain = computeSurfaceWetnessParams('rain');
  const storm = computeSurfaceWetnessParams('storm');

  assert.ok(rain.roadRoughness < clear.roadRoughness);
  assert.ok(rain.roadClearcoat > clear.roadClearcoat);
  assert.ok(storm.roadRoughness <= rain.roadRoughness);
  assert.ok(storm.roadClearcoat >= rain.roadClearcoat);
  assert.ok(storm.waterWaveHeight > clear.waterWaveHeight);
  assert.ok(storm.windSwayStrength > clear.windSwayStrength);
});

test('getPostProcessProfile and getGraphicsPresetMetadata return calibrated presets', () => {
  const ultra = getPostProcessProfile('ultra');
  const high = getPostProcessProfile('high');
  const balanced = getPostProcessProfile('balanced');

  assert.equal(ultra.enableComposer, true);
  assert.ok(ultra.bloomStrength > high.bloomStrength);
  assert.ok(ultra.saturationBoost > high.saturationBoost);
  assert.ok(ultra.sharpenStrength > 0);
  assert.equal(balanced.enableComposer, false);

  const meta = getGraphicsPresetMetadata('ultra', 'pc_console');
  assert.ok(meta.shortBadge.includes('BC7 4K'));
  assert.ok(meta.shortBadge.includes('LOD 0'));
  assert.ok(meta.shortBadge.includes('245K POLY'));
});

test('computeMeshAndTextureBudget scales texture resolution, polygon tessellation, and anisotropy by preset', () => {
  const ultraBudget = computeMeshAndTextureBudget('ultra');
  const highBudget = computeMeshAndTextureBudget('high');
  const balancedBudget = computeMeshAndTextureBudget('balanced');

  assert.equal(ultraBudget.textureResolutionPx, 1024);
  assert.equal(ultraBudget.anisotropySamples, 16);
  assert.equal(ultraBudget.waterGridSegments, 96);
  assert.ok(ultraBudget.estimatedSceneTriangles > highBudget.estimatedSceneTriangles);
  assert.ok(highBudget.estimatedSceneTriangles > balancedBudget.estimatedSceneTriangles);
  assert.ok(ultraBudget.normalMapIntensity > highBudget.normalMapIntensity);
});

test('1. Master Asset Workflow: maintains single 4K master source with BC7 (PC/Console) vs ASTC (Mobile) overrides', () => {
  const pcUltra = computeMasterTextureImportOverride('pc_console', 'ultra', false);
  const pcHigh = computeMasterTextureImportOverride('pc_console', 'high', false);
  const mobileBase = computeMasterTextureImportOverride('mobile', 'balanced', false);
  const mobileHd = computeMasterTextureImportOverride('mobile', 'ultra', true);

  assert.equal(pcUltra.masterSourceResolutionPx, 4096);
  assert.equal(pcUltra.maxPlatformResolutionPx, 4096);
  assert.equal(pcUltra.compressionFormat, 'BC7');
  assert.equal(pcUltra.singleMasterSourceMaintained, true);

  assert.equal(pcHigh.maxPlatformResolutionPx, 2048);
  assert.equal(pcHigh.compressionFormat, 'BC7');

  assert.equal(mobileBase.masterSourceResolutionPx, 4096);
  assert.equal(mobileBase.maxPlatformResolutionPx, 512);
  assert.equal(mobileBase.compressionFormat, 'ASTC');
  assert.equal(mobileBase.singleMasterSourceMaintained, true);

  assert.equal(mobileHd.maxPlatformResolutionPx, 1024);
  assert.equal(mobileHd.compressionFormat, 'ASTC');
});

test('2. Geometry & LOD Scaling: PC favors LOD 0/1 while Mobile LOD Bias skips LOD 0 in memory', () => {
  const pcLod = computeLodChainPolicy('pc_console', 'ultra', false);
  const mobileLod = computeLodChainPolicy('mobile', 'high', false);
  const mobileBalancedLod = computeLodChainPolicy('mobile', 'balanced', false);

  assert.equal(pcLod.lodBias, 0);
  assert.equal(pcLod.skipLod0InMemory, false);
  assert.equal(pcLod.highestLoadedLodIndex, 0);
  assert.equal(pcLod.activeChain.length, 4);
  assert.equal(pcLod.activeChain[0].lodIndex, 0);
  assert.equal(pcLod.activeChain[0].targetPolygonBudget, 75_000);

  // Mobile skips LOD 0 completely so the phone never loads the 75k mesh into memory
  assert.equal(mobileLod.skipLod0InMemory, true);
  assert.equal(mobileLod.lodBias, 1);
  assert.equal(mobileLod.highestLoadedLodIndex, 1);
  assert.equal(mobileLod.activeChain[0].lodIndex, 1);
  assert.ok(mobileLod.memorySavedMb > 0);

  // Balanced Mobile skips LOD 0 and LOD 1, starting at LOD 2 (10k standard mobile mesh)
  assert.equal(mobileBalancedLod.lodBias, 2);
  assert.equal(mobileBalancedLod.highestLoadedLodIndex, 2);
  assert.equal(mobileBalancedLod.activeChain[0].lodIndex, 2);
  assert.equal(mobileBalancedLod.activeChain[0].targetPolygonBudget, 10_000);
});

test('3. Lighting Strategies: PC uses Hybrid Real-Time GI + Soft Shadows while Mobile uses Baked Lightmaps & disables small prop shadows', () => {
  const pcLight = computeLightingStrategy('pc_console', 'ultra');
  const mobileLight = computeLightingStrategy('mobile', 'high');

  assert.equal(pcLight.mode, 'realtime_gi_hybrid');
  assert.equal(pcLight.enableRealtimeGI, true);
  assert.equal(pcLight.enableDynamicSoftShadows, true);
  assert.equal(pcLight.enableVolumetricFog, true);
  assert.equal(pcLight.useBakedLightmaps, true);
  assert.equal(pcLight.smallPropCastShadows, true);

  assert.equal(mobileLight.mode, 'baked_lightmap_mobile');
  assert.equal(mobileLight.enableRealtimeGI, false);
  assert.equal(mobileLight.useBakedLightmaps, true);
  assert.equal(mobileLight.smallPropCastShadows, false);
});

test('4. Uber Shader Management: automatically toggles Rim Light, Detail Normals, Parallax, and SSS keywords by platform', () => {
  const pcShader = computeUberShaderKeywords('pc_console', 'ultra', false);
  const mobileShader = computeUberShaderKeywords('mobile', 'high', false);

  assert.equal(pcShader.USE_RIM_LIGHT, true);
  assert.equal(pcShader.USE_DETAIL_NORMALS, true);
  assert.equal(pcShader.USE_PARALLAX_OCCLUSION, true);
  assert.equal(pcShader.USE_SUBSURFACE_SCATTERING, true);
  assert.equal(pcShader.mathComplexity, 'full_pbr_console');

  assert.equal(mobileShader.USE_RIM_LIGHT, false);
  assert.equal(mobileShader.USE_DETAIL_NORMALS, false);
  assert.equal(mobileShader.USE_PARALLAX_OCCLUSION, false);
  assert.equal(mobileShader.USE_SUBSURFACE_SCATTERING, false);
  assert.equal(mobileShader.mathComplexity, 'simplified_mobile_alu');
});

test('5. Deployment & Build Size: Mobile base build stays under 2GB with optional HighDefinition Addressable Content Pack', () => {
  const pcBuild = computeDeploymentBundleManifest('pc_console', true);
  const mobileBaseBuild = computeDeploymentBundleManifest('mobile', false);
  const mobileWithHdPack = computeDeploymentBundleManifest('mobile', true);

  assert.ok(pcBuild.effectiveTotalInstallMb > 50_000);
  assert.equal(mobileBaseBuild.baseBuildSizeMb, 640);
  assert.equal(mobileBaseBuild.exceedsMobile2GbThreshold, false);
  assert.equal(mobileBaseBuild.hdAddressablePack.isOptionalDownloadOnMobile, true);
  assert.equal(mobileBaseBuild.hdAddressablePack.isMounted, false);
  assert.equal(mobileBaseBuild.effectiveTotalInstallMb, 640);

  assert.equal(mobileWithHdPack.hdAddressablePack.isMounted, true);
  assert.equal(
    mobileWithHdPack.effectiveTotalInstallMb,
    mobileBaseBuild.baseBuildSizeMb + mobileWithHdPack.hdAddressablePack.sizeMb
  );
});
