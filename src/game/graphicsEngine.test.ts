/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAtmosphericSkyParams,
  computeSurfaceWetnessParams,
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

test('getPostProcessProfile and getGraphicsPresetMetadata return calibrated GTA V + Genshin presets', () => {
  const ultra = getPostProcessProfile('ultra');
  const high = getPostProcessProfile('high');
  const balanced = getPostProcessProfile('balanced');

  assert.equal(ultra.enableComposer, true);
  assert.ok(ultra.bloomStrength > high.bloomStrength);
  assert.ok(ultra.saturationBoost > high.saturationBoost);
  assert.ok(ultra.sharpenStrength > 0);
  assert.equal(balanced.enableComposer, false);

  const meta = getGraphicsPresetMetadata('ultra');
  assert.ok(meta.shortBadge.includes('GTA V'));
  assert.ok(meta.shortBadge.includes('GENSHIN'));
});
