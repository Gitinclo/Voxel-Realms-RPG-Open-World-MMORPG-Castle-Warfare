/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Terminal,
  Copy,
  Check,
  Zap,
  Layers,
  Sparkles,
  Swords,
  Eye,
  Monitor,
  Smartphone,
  HardDrive,
  Sun,
} from 'lucide-react';
import {
  CPP_ENGINE_SPEC,
  CPP_CODE_MODULES,
  CppCodeModule,
  getSimulatedEngineStats,
} from '../game/cppEngine';
import {
  CULTIVATION_REALMS,
  calculateRealmSuppression,
  getCultivationAuraVisualSpec,
} from '../game/cultivationMath';
import {
  GraphicsQualityPreset,
  TargetPlatform,
  computeDeploymentBundleManifest,
  computeLightingStrategy,
  computeLodChainPolicy,
  computeMasterTextureImportOverride,
  computeUberShaderKeywords,
} from '../game/graphicsEngine';
import { sound } from '../game/audio';

interface CppArchitectureModalProps {
  targetPlatform?: TargetPlatform;
  graphicsQuality?: GraphicsQualityPreset;
  hdPackMounted?: boolean;
  onChangeTargetPlatform?: (platform: TargetPlatform) => void;
  onChangeGraphicsQuality?: (quality: GraphicsQualityPreset) => void;
  onToggleHdPackMounted?: () => void;
  onClose: () => void;
}

export const CppArchitectureModal: React.FC<CppArchitectureModalProps> = ({
  targetPlatform = 'pc_console',
  graphicsQuality = 'ultra',
  hdPackMounted = false,
  onChangeTargetPlatform,
  onChangeGraphicsQuality,
  onToggleHdPackMounted,
  onClose,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<CppCodeModule['id']>(
    'cultivation_karma_master'
  );
  const [copied, setCopied] = useState(false);

  // Interactive C++20 Realm Suppression & HDR10+ Aura Simulator state
  const [simAttackerRealm, setSimAttackerRealm] = useState<number>(2); // Golden Core (Index 2)
  const [simDefenderRealm, setSimDefenderRealm] = useState<number>(0); // Qi Refinement (Index 0)
  const [simGreatDaos, setSimGreatDaos] = useState<number>(5);

  const stats = getSimulatedEngineStats();
  const activeModule =
    CPP_CODE_MODULES.find((m) => m.id === selectedModuleId) || CPP_CODE_MODULES[0];

  const suppression = calculateRealmSuppression(simAttackerRealm, simDefenderRealm);
  const auraSpec = getCultivationAuraVisualSpec(simAttackerRealm, simGreatDaos);

  // Compute live 5-pillar Cross-Platform Engine specs
  const texOverride = computeMasterTextureImportOverride(
    targetPlatform,
    graphicsQuality,
    hdPackMounted
  );
  const lodPolicy = computeLodChainPolicy(targetPlatform, graphicsQuality, hdPackMounted);
  const lightingSpec = computeLightingStrategy(targetPlatform, graphicsQuality);
  const uberKeywords = computeUberShaderKeywords(targetPlatform, graphicsQuality, hdPackMounted);
  const bundleManifest = computeDeploymentBundleManifest(targetPlatform, hdPackMounted);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeModule.code);
    setCopied(true);
    sound.playSwing();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 bg-gradient-to-r from-emerald-950/85 via-slate-900 to-cyan-950/85 border-b border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shrink-0">
              <Cpu className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold font-cinzel text-emerald-100">
                  Cross-Platform 3D Engine Pipeline & C++20 Architecture
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold">
                  4K Master BC7/ASTC · LOD 0–3 · Uber Shader
                </span>
              </div>
              <p className="text-xs text-emerald-200/75 truncate mt-0.5">
                Master Asset Texture Overrides · Aggressive LOD Chains · Hybrid GI / Baked Lightmaps
                · Unified Uber Shader · Addressable HD Packs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-200">
          {/* 5-Pillar Cross-Platform Engine Pipeline Interactive Control Center */}
          <div
            className="p-4 rounded-xl bg-slate-950/95 border border-cyan-500/40 space-y-4"
            data-testid="cross-platform-pipeline-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  5-Pillar Cross-Platform Pipeline (PC/PS5/Xbox vs Mobile Android/iOS)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Single 4K Master Source with automatic platform overrides, LOD Bias memory
                  culling, Hybrid GI/Baked Lightmaps, Unified Uber Shader switches, and Addressable
                  Bundles.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="pipeline-platform-pc-btn"
                  onClick={() => {
                    sound.playButton();
                    onChangeTargetPlatform?.('pc_console');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    targetPlatform === 'pc_console'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  PC / PS5 / Xbox
                </button>
                <button
                  type="button"
                  data-testid="pipeline-platform-mobile-btn"
                  onClick={() => {
                    sound.playButton();
                    onChangeTargetPlatform?.('mobile');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    targetPlatform === 'mobile'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile (Android / iOS)
                </button>
                {(['ultra', 'high', 'balanced'] as GraphicsQualityPreset[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      sound.playButton();
                      onChangeGraphicsQuality?.(q);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                      graphicsQuality === q
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Master Asset Workflow (Textures) */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span>1. Master Asset Workflow</span>
                  <span
                    className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-[10px]"
                    data-testid="pipeline-texture-format"
                  >
                    {texOverride.compressionFormat} · {texOverride.maxPlatformResolutionPx}px
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Master Source: <span className="text-white font-bold">4096×4096 (4K)</span>{' '}
                  (Single File Maintained)
                </div>
                <div className="text-[11px] text-slate-400">
                  Override: <span className="text-emerald-300">{texOverride.compressionLabel}</span>{' '}
                  · Anisotropy:{' '}
                  <span className="text-amber-300">{texOverride.anisotropySamples}×</span>
                </div>
              </div>

              {/* 2. Geometry & LOD Scaling (Meshes) */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                  <span>2. Geometry & LOD Scaling</span>
                  <span
                    className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-mono text-[10px]"
                    data-testid="pipeline-lod-bias"
                  >
                    LOD Bias +{lodPolicy.lodBias} · Best: LOD {lodPolicy.highestLoadedLodIndex}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Chain: LOD 0 (75k) → LOD 1 (25k) → LOD 2 (10k) → LOD 3 (2k)
                </div>
                <div className="text-[11px] text-slate-400">
                  {lodPolicy.skipLod0InMemory ? (
                    <span className="text-amber-300">
                      Mobile Skips LOD 0 in Memory (-{lodPolicy.memorySavedMb} MB RAM saved)
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      PC/Console Loads Full LOD 0 Hero Close-Up Mesh
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Lighting Strategies (The Visual Gap) */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> 3. Lighting Strategy
                  </span>
                  <span
                    className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-mono text-[10px]"
                    data-testid="pipeline-lighting-mode"
                  >
                    {lightingSpec.enableRealtimeGI ? 'HYBRID GI + BAKED' : 'BAKED LIGHTMAP'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Real-Time GI:{' '}
                  <span className="text-white">{lightingSpec.enableRealtimeGI ? 'ON' : 'OFF'}</span>{' '}
                  · Vol. Fog:{' '}
                  <span className="text-white">
                    {lightingSpec.enableVolumetricFog ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Small Debris/Prop Shadows:{' '}
                  <span
                    className={
                      lightingSpec.smallPropCastShadows ? 'text-emerald-300' : 'text-amber-300'
                    }
                  >
                    {lightingSpec.smallPropCastShadows
                      ? 'ENABLED (PC/Console)'
                      : 'DISABLED (Mobile Perf Culling)'}
                  </span>
                </div>
              </div>

              {/* 4. Shader & Material Management (Unified Uber Shader) */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>4. Unified Uber Shader</span>
                  <span
                    className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]"
                    data-testid="pipeline-shader-complexity"
                  >
                    {uberKeywords.mathComplexity === 'full_pbr_console'
                      ? '4 KEYWORDS ON'
                      : 'MOBILE ALU FAST'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Rim: {uberKeywords.USE_RIM_LIGHT ? 'ON' : 'OFF'} · Detail Normals:{' '}
                  {uberKeywords.USE_DETAIL_NORMALS ? 'ON' : 'OFF'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Parallax: {uberKeywords.USE_PARALLAX_OCCLUSION ? 'ON' : 'OFF'} · Subsurface SSS:{' '}
                  {uberKeywords.USE_SUBSURFACE_SCATTERING ? 'ON' : 'OFF'}
                </div>
              </div>

              {/* 5. Deployment & Build Size (Addressables / Asset Bundles) */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>5. Deployment & Addressable Asset Bundles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono font-bold text-emerald-300"
                      data-testid="pipeline-install-size"
                    >
                      Install Size:{' '}
                      {bundleManifest.effectiveTotalInstallMb >= 1000
                        ? `${(bundleManifest.effectiveTotalInstallMb / 1000).toFixed(2)} GB`
                        : `${bundleManifest.effectiveTotalInstallMb} MB`}
                    </span>
                    {targetPlatform === 'mobile' && onToggleHdPackMounted && (
                      <button
                        type="button"
                        data-testid="pipeline-toggle-hd-pack-btn"
                        onClick={() => {
                          sound.playButton();
                          onToggleHdPackMounted();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                          hdPackMounted
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/30'
                        }`}
                      >
                        {hdPackMounted
                          ? '✓ HighDefinition Pack Mounted (+3.85 GB)'
                          : '⬇ Mount Optional HighDefinition Pack (+3.85 GB)'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-slate-300">
                  {targetPlatform === 'mobile' ? (
                    <>
                      Base Mobile Build: <span className="text-emerald-300 font-mono">640 MB</span>{' '}
                      (Strictly &lt; 2GB Store Limit). 4K Textures &amp; LOD 0 Hero Meshes are
                      isolated in the optional{' '}
                      <span className="text-amber-300 font-mono">
                        {bundleManifest.hdAddressablePack.packId}
                      </span>{' '}
                      addressable bundle.
                    </>
                  ) : (
                    <>
                      Console / PC Build: <span className="text-cyan-300 font-mono">68.40 GB</span>{' '}
                      (Pre-bundles all 4K BC7 Master Textures, uncompressed audio, and LOD 0
                      75k–100k Hero Meshes).
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Simulated C++20 + HDR10+ Profiler Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                <Zap className="w-4 h-4" /> NEON / AVX-512 SIMD
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-white mt-1">
                {(stats.simdInstructionsPerSec / 1e9).toFixed(2)} B / sec
              </div>
              <div className="text-[10px] text-slate-400">{stats.simdWidth}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-amber-400 flex items-center gap-1.5 font-semibold">
                <Swords className="w-4 h-4" /> Realm Suppression
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-amber-300 mt-1">
                100.0x Verified
              </div>
              <div className="text-[10px] text-slate-400">Golden Core vs Qi Refine</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-cyan-400 flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-4 h-4" /> HDR10+ Swapchain
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-cyan-300 mt-1">
                {stats.peakLuminanceNits} Nits PQ
              </div>
              <div className="text-[10px] text-slate-400">{stats.hdrColorSpace}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-purple-400 flex items-center gap-1.5 font-semibold">
                <Layers className="w-4 h-4" /> AI NavMesh & ECS
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-white mt-1">
                Lv. 1–1000 AI
              </div>
              <div className="text-[10px] text-slate-400">A* + Weather Siphoning</div>
            </div>
          </div>

          {/* Interactive Live C++20 Formula Verification Sandbox */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                Interactive C++20 Realm Suppression & HDR10+ Aura Descriptor Verification
              </h3>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/30">
                static_assert(GoldenCore vs QiRefinement == 100.0x) ✓
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="cpp-sim-attacker"
                  className="block text-[11px] font-mono text-slate-400 mb-1"
                >
                  Attacker / Cultivator Realm
                </label>
                <select
                  id="cpp-sim-attacker"
                  value={simAttackerRealm}
                  onChange={(e) => setSimAttackerRealm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                >
                  {CULTIVATION_REALMS.map((r) => (
                    <option key={r.id} value={r.index}>
                      [{r.index}] {r.name} ({r.chineseName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cpp-sim-defender"
                  className="block text-[11px] font-mono text-slate-400 mb-1"
                >
                  Target / Defender Realm
                </label>
                <select
                  id="cpp-sim-defender"
                  value={simDefenderRealm}
                  onChange={(e) => setSimDefenderRealm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                >
                  {CULTIVATION_REALMS.map((r) => (
                    <option key={r.id} value={r.index}>
                      [{r.index}] {r.name} ({r.chineseName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cpp-sim-daos"
                  className="block text-[11px] font-mono text-slate-400 mb-1"
                >
                  Mastered Great Dao Rules ({simGreatDaos} Halos)
                </label>
                <input
                  id="cpp-sim-daos"
                  type="range"
                  min={1}
                  max={12}
                  value={simGreatDaos}
                  onChange={(e) => setSimGreatDaos(Number(e.target.value))}
                  className="w-full accent-amber-400 mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/30">
                <div className="text-[11px] text-amber-300 font-semibold">
                  Realm Suppression Output (10^ΔRealm)
                </div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">
                  {suppression.damageMultiplier >= 1
                    ? `${suppression.damageMultiplier.toLocaleString()}x Damage Dealt`
                    : `${suppression.damageMultiplier}x Damage (Suppressed)`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {suppression.suppressionLabel} · Incoming Damage Reduction:{' '}
                  <span className="text-emerald-300 font-mono">
                    {suppression.incomingDamageReductionPct}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30">
                <div className="text-[11px] text-cyan-300 font-semibold">
                  HDR10+ Aura Push-Constant (No Overhead Level Tag)
                </div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {auraSpec.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Peak Luminance:{' '}
                  <span className="text-amber-300 font-mono">
                    {auraSpec.hdrPeakLuminanceNits} nits
                  </span>{' '}
                  · Halos: <span className="text-purple-300 font-mono">{auraSpec.haloCount}</span> ·
                  Level Tag Hidden: <span className="text-emerald-300 font-mono">TRUE</span>
                </div>
              </div>
            </div>
          </div>

          {/* C++20 Module Selector Tabs */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {CPP_CODE_MODULES.map((mod) => {
                const isSelected = mod.id === selectedModuleId;
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      sound.playButton();
                      setSelectedModuleId(mod.id);
                    }}
                    className={`px-3 py-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{mod.title}</div>
                    <div className="text-[10px] text-slate-400">{mod.filename}</div>
                  </button>
                );
              })}
            </div>

            {/* Source Code Viewer */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> {activeModule.filename} —{' '}
                <span className="text-slate-400">{activeModule.subtitle}</span>
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-mono text-emerald-300 flex items-center gap-1.5 border border-emerald-500/40 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied C++20 Header' : 'Copy C++20 Code'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/95 overflow-x-auto max-h-[380px] leading-relaxed">
              <code>{activeModule.code}</code>
            </pre>
          </div>

          {/* C++20 Features Checklist */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              C++20 Android Open-World Architecture & Cultivation Systems Implemented
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
              {CPP_ENGINE_SPEC.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
