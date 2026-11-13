/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Clock,
  Globe,
  ScrollText,
  Sparkles,
  CheckCircle2,
  Search,
  Crown,
} from 'lucide-react';
import { LORE_HISTORICAL_EPOCHS, searchLoreHistory } from '../game/loreHistory';
import { SIX_LAYER_COSMIC_HIERARCHY, OMNIVERSE_TIER_METADATA } from '../game/omniverse';
import { CHARACTER_SPECIES_CATALOG } from '../game/species';
import { PRIMARY_ADMIN_EMAIL } from '../game/adminModeration';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface LoreHistoryModalProps {
  comprehendedEpochIds: string[];
  onComprehendEpoch: (epochId: string) => void;
  onOpenOmniverseMatrix?: () => void;
  onClose: () => void;
}

export const LoreHistoryModal: React.FC<LoreHistoryModalProps> = ({
  comprehendedEpochIds,
  onComprehendEpoch,
  onOpenOmniverseMatrix,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'cosmology' | 'compendium'>('timeline');
  const [selectedEpochId, setSelectedEpochId] = useState<string>(LORE_HISTORICAL_EPOCHS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedEpoch =
    LORE_HISTORICAL_EPOCHS.find((e) => e.id === selectedEpochId) || LORE_HISTORICAL_EPOCHS[0];
  const { matchingEpochs, matchingChapters } = searchLoreHistory(searchQuery);

  const totalPossibleDiamonds = LORE_HISTORICAL_EPOCHS.reduce(
    (acc, e) => acc + e.comprehensionRewardDiamonds,
    0n
  );
  const claimedDiamonds = LORE_HISTORICAL_EPOCHS.filter((e) =>
    comprehendedEpochIds.includes(e.id)
  ).reduce((acc, e) => acc + e.comprehensionRewardDiamonds, 0n);

  return (
    <div
      data-testid="lore-history-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-fuchsia-950/70 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black font-cinzel text-amber-300 tracking-wide">
                  IMPERIAL LORE &amp; COSMOLOGICAL HISTORY CODEX
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/40 text-amber-200 text-[10px] font-mono font-bold">
                  Origin: 6. The White Page / House of Ideas ({PRIMARY_ADMIN_EMAIL})
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chronicles from Pre-Genesis on The White Page through the 100 Sovereign Omniverses,
                10 Ancestral Bloodlines, Four-Path Immortal Dao, and the 06/11/2026 Architect
                Convergence.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playButton();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close Lore & History Codex"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Comprehension Progress Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="lore-tab-timeline"
              onClick={() => {
                sound.playButton();
                setActiveTab('timeline');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>⏳ 7 Grand Historical Epochs ({comprehendedEpochIds.length}/7)</span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-cosmology"
              onClick={() => {
                sound.playButton();
                setActiveTab('cosmology');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'cosmology'
                  ? 'bg-fuchsia-500 text-slate-950 shadow-lg shadow-fuchsia-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>🌌 6-Layer Cosmology &amp; 100 Omniverses Lore</span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-compendium"
              onClick={() => {
                sound.playButton();
                setActiveTab('compendium');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'compendium'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>📚 Sacred Compendium &amp; Search (6 Codices)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300">
              Chronicle Rewards Claimed: <strong>{formatBigInt(claimedDiamonds)}</strong> /{' '}
              {formatBigInt(totalPossibleDiamonds)} 💎
            </span>
          </div>
        </div>

        {/* Main Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: 7 GRAND HISTORICAL EPOCHS TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Chronological Epoch Selector (Epoch 0 -> Epoch VI) */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider px-1">
                  Chronological Epochs (Origin → 06/11/2026)
                </div>
                {LORE_HISTORICAL_EPOCHS.map((epoch) => {
                  const isSelected = epoch.id === selectedEpoch.id;
                  const isComprehended = comprehendedEpochIds.includes(epoch.id);
                  return (
                    <button
                      key={epoch.id}
                      type="button"
                      data-testid={`lore-epoch-btn-${epoch.epochNumber}`}
                      onClick={() => {
                        sound.playSwing();
                        setSelectedEpochId(epoch.id);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-fuchsia-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                          {epoch.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {epoch.eraCode}
                            </span>
                            <span className="text-[10px] font-mono text-fuchsia-300">
                              {epoch.chineseTitle}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white mt-1 line-clamp-1">
                            {epoch.title}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {epoch.chronologicalDateLabel}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                          isComprehended
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isComprehended
                          ? '✓ READ'
                          : `+${formatBigInt(epoch.comprehensionRewardDiamonds)} 💎`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Selected Historical Epoch Full Scroll & Comprehension Action */}
              <div className="lg:col-span-7">
                <div
                  className={`p-5 rounded-2xl bg-gradient-to-br ${selectedEpoch.accentColor} border space-y-4`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold">
                          {selectedEpoch.eraCode} · {selectedEpoch.chineseTitle}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400/40 text-cyan-200 text-[11px] font-mono">
                          Anchor: {selectedEpoch.cosmicLayerAnchor}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black font-cinzel text-white pt-1">
                        {selectedEpoch.icon} {selectedEpoch.title}
                      </h3>
                      <div className="text-xs font-mono text-amber-200">
                        Chronological Era: {selectedEpoch.chronologicalDateLabel}
                      </div>
                    </div>

                    {comprehendedEpochIds.includes(selectedEpoch.id) ? (
                      <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Chronicle Comprehended</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid="comprehend-lore-epoch-btn"
                        onClick={() => {
                          sound.playUpgradeFanfare();
                          onComprehendEpoch(selectedEpoch.id);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-fuchsia-400 hover:from-amber-300 hover:to-fuchsia-300 text-slate-950 text-xs font-mono font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          Comprehend Chronicle (+
                          {formatBigInt(selectedEpoch.comprehensionRewardDiamonds)} 💎 &amp; +
                          {selectedEpoch.comprehensionRewardFragments} Scrolls)
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-white/15 text-xs text-amber-100 font-medium leading-relaxed">
                    {selectedEpoch.summary}
                  </div>

                  {/* Full Sacred Scroll Paragraphs */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-mono font-bold text-cyan-300 uppercase">
                      📜 Inscribed Imperial Chronicle
                    </div>
                    {selectedEpoch.chronicleScrollText.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed"
                      >
                        <span className="text-amber-400 font-mono font-bold mr-2">
                          §{selectedEpoch.epochNumber}.{idx + 1}
                        </span>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Key Historical Figures */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-fuchsia-300 uppercase">
                      👑 Sovereign Figures &amp; Architects of {selectedEpoch.eraCode}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEpoch.keyFigures.map((fig) => (
                        <span
                          key={fig}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-amber-200"
                        >
                          {fig}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 6-LAYER COSMOLOGY & 100 OMNIVERSES LORE */}
          {activeTab === 'cosmology' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-white/10 via-fuchsia-950/60 to-amber-950/50 border border-white/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-mono font-black flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> SUPREME AUTHOR OF THE WHITE PAGE:{' '}
                      {PRIMARY_ADMIN_EMAIL}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 text-[11px] font-mono font-bold">
                      Layers 1–6 Ontological Stack
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-cinzel text-white">
                    The 6-Layer Cosmic Ontology &amp; Origin of Everything (Even Oblivion)
                  </h3>
                  <p className="text-xs text-slate-200">
                    All existence and non-existence flow downward from{' '}
                    <strong className="text-amber-300">
                      Layer 6: The White Page / The House of Ideas ({PRIMARY_ADMIN_EMAIL})
                    </strong>{' '}
                    into the Overvoid/Exoverse, the 100+∞ Sovereign Omniverses, Megaverses,
                    Multiverses, and individual Universes.
                  </p>
                </div>

                {onOpenOmniverseMatrix && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playButton();
                      onOpenOmniverseMatrix();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-mono font-bold text-xs shrink-0 cursor-pointer"
                  >
                    🌌 Open Interactive 100-Omniverse Matrix
                  </button>
                )}
              </div>

              {/* 6-Layer Cosmological Stack Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SIX_LAYER_COSMIC_HIERARCHY.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-4 rounded-xl bg-gradient-to-br ${layer.accentGradient} border ${layer.borderClass} space-y-2 flex flex-col justify-between`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{layer.icon}</span>
                          <span>{layer.name}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/90 text-amber-300 border border-amber-500/30">
                          {formatBigInt(layer.tributeMultiplier)}x Scale
                        </span>
                      </div>
                      <p className="text-xs font-bold text-amber-100">
                        “{layer.canonicalDefinition}”
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {layer.ontologicalScope}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[10px] font-mono space-y-0.5">
                      <div className="text-cyan-300">Law: {layer.dimensionalLogicLaw}</div>
                      <div className="text-amber-300 font-bold">
                        Authority: {layer.sovereignController}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 5 Tiers of Omniversal Species & 10 Playable Bloodlines Lore */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/90 border border-fuchsia-500/30 space-y-2.5">
                  <h4 className="text-sm font-bold font-cinzel text-fuchsia-300">
                    🌌 The 5 Tiers of the 100 Omniversal Species (Background NPC Envoys)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Each of the 100 most powerful species across fiction presides over its own
                    Sovereign Omniverse (
                    <span className="font-mono text-fuchsia-300">OMNI-001</span> to{' '}
                    <span className="font-mono text-fuchsia-300">OMNI-100</span> +{' '}
                    <span className="font-mono text-fuchsia-300">Ω-∞</span>) under{' '}
                    <span className="font-mono text-amber-300">{PRIMARY_ADMIN_EMAIL}</span>:
                  </p>
                  <div className="space-y-2">
                    {Object.values(OMNIVERSE_TIER_METADATA).map((tier) => (
                      <div
                        key={tier.tier}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-0.5"
                      >
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{tier.title}</span>
                          <span className="text-[10px] font-mono text-amber-300">
                            {tier.rangeLabel}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-cyan-300">
                          Scale: {tier.dimensionalScale} · Base Tribute: +
                          {formatBigInt(tier.baseTributeDiamonds)} 💎/hr
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5">
                  <h4 className="text-sm font-bold font-cinzel text-emerald-300">
                    🧬 The 10 Playable Solara Bloodlines &amp; Admin Rebirth Seal
                  </h4>
                  <p className="text-xs text-slate-300">
                    Awakened in Epoch III, these 10 playable species form the mortal and immortal
                    champions of Solara Citadel. Switching species after creation requires a decree
                    from <span className="font-mono text-amber-300">{PRIMARY_ADMIN_EMAIL}</span>:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {CHARACTER_SPECIES_CATALOG.map((spec) => (
                      <div
                        key={spec.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-0.5"
                      >
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{spec.icon}</span>
                          <span className="truncate">{spec.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-amber-300">
                          {spec.chineseName} · {spec.primaryBuffSummary}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2">
                          {spec.loreSummary}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SACRED COMPENDIUM & SEARCHABLE CODEX */}
          {activeTab === 'compendium' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    data-testid="lore-compendium-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search epochs, White Page, Oblivion, Overvoid, Han Jue, species, creatergame31@gmail.com..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
                <div className="text-xs font-mono text-slate-400 shrink-0">
                  Showing <strong className="text-cyan-300">{matchingChapters.length}</strong>{' '}
                  Codices &amp; <strong className="text-amber-300">{matchingEpochs.length}</strong>{' '}
                  Epochs
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchingChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold font-cinzel text-amber-300 flex items-center gap-2">
                          <span>{chapter.icon}</span>
                          <span>{chapter.title}</span>
                        </h4>
                        <div className="text-[11px] font-mono text-cyan-300">
                          {chapter.subtitle}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-200 shrink-0">
                        By: {chapter.inscribedBy}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{chapter.summary}</p>
                    <ul className="space-y-1 pt-1 border-t border-slate-800/80">
                      {chapter.keyTenets.slice(0, 6).map((tenet, i) => (
                        <li key={i} className="text-[11px] font-mono text-slate-300 flex gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{tenet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
