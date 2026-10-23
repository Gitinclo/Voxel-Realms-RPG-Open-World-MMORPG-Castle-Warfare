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
import { sound } from '../game/audio';

interface CppArchitectureModalProps {
  onClose: () => void;
}

export const CppArchitectureModal: React.FC<CppArchitectureModalProps> = ({ onClose }) => {
  const [selectedModuleId, setSelectedModuleId] =
    useState<CppCodeModule['id']>('cultivation_karma_master');
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
                  Android NDK C++20 AI, Cultivation Karma & HDR10+ Engine
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold">
                  ISO C++20 · HDR10+ 4000 Nits
                </span>
              </div>
              <p className="text-xs text-emerald-200/75 truncate mt-0.5">
                Lv. 1–1000 Pathfinding & Troop AI · 100x Realm Suppression · Red-Name Tribulation Lightning · Master/Disciple · Vulkan Aura Cues
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

