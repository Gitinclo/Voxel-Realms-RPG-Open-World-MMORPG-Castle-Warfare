/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Cpu, Terminal, Copy, Check, Zap, Shield, Layers } from 'lucide-react';
import { CPP_ENGINE_SPEC, getSimulatedEngineStats } from '../game/cppEngine';
import { sound } from '../game/audio';

interface CppArchitectureModalProps {
  onClose: () => void;
}

export const CppArchitectureModal: React.FC<CppArchitectureModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const stats = getSimulatedEngineStats();

  const handleCopy = () => {
    navigator.clipboard.writeText(CPP_ENGINE_SPEC.sourceCodeSample);
    setCopied(true);
    sound.playSwing();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-emerald-100 flex items-center gap-2">
                C++ 20+ High-Performance Engine Core
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono">
                  AVX-512 SIMD
                </span>
              </h2>
              <p className="text-xs text-emerald-200/70">
                Underlying C++20 architectural blueprint for 1,000 Trillion troop calculations and 1 Trillion rallies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {/* Real-time Simulated C++20 Profiler Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                <Zap className="w-4 h-4" /> SIMD Instructions
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">1.42 B / sec</div>
              <div className="text-[10px] text-slate-400">AVX-512 8-lane 64-bit</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-cyan-400 flex items-center gap-1.5 font-semibold">
                <Layers className="w-4 h-4" /> Cache Hit Rate
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">99.4% L1/L2</div>
              <div className="text-[10px] text-slate-400">Flat contiguous arrays</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-amber-400 flex items-center gap-1.5 font-semibold">
                <Cpu className="w-4 h-4" /> Worker Threads
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">16 Cores</div>
              <div className="text-[10px] text-slate-400">Lock-free SPMC queues</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700">
              <div className="text-xs text-purple-400 flex items-center gap-1.5 font-semibold">
                <Terminal className="w-4 h-4" /> Tick Simulation
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">60.0 Hz Fixed</div>
              <div className="text-[10px] text-slate-400">Sub-millisecond latency</div>
            </div>
          </div>

          {/* C++20 Features list */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              C++ 20+ Language Standards Utilized
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

          {/* Source Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> VoxelRealmsEngine.hpp (C++20 ISO/IEC 14882)
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied C++ Code' : 'Copy C++ Code'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-[300px] leading-relaxed">
              <code>{CPP_ENGINE_SPEC.sourceCodeSample}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
