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
  Compass,
  Infinity as InfinityIcon,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import {
  LORE_HISTORICAL_EPOCHS,
  LORE_DYNASTIC_ANNALS,
  GOOGOL_LORE_ARCHIVE_SPEC,
  GOOGOL_MAX_VOLUME_INDEX,
  OPEN_WORLD_BIOME_CODEX_CATALOG,
  LoreCodexEntry,
  PersistedLoreCodexState,
  INITIAL_LORE_CODEX_STATE,
  getCompleteLoreCodexCatalog,
  generateGoogolScaleLoreScrollSlice,
  searchLoreHistory,
} from '../game/loreHistory';
import { SIX_LAYER_COSMIC_HIERARCHY, OMNIVERSE_TIER_METADATA } from '../game/omniverse';
import { CHARACTER_SPECIES_CATALOG } from '../game/species';
import { PRIMARY_ADMIN_EMAIL } from '../game/adminModeration';
import { MonsterTarget } from '../types/game';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface LoreHistoryModalProps {
  comprehendedEpochIds: string[];
  onComprehendEpoch: (epochId: string) => void;
  loreCodexState?: PersistedLoreCodexState;
  monsters?: MonsterTarget[];
  onScoutDiscoverCodexEntry?: (entry: LoreCodexEntry) => void;
  onClaimCodexBounty?: (entryId: string) => void;
  onOpenOmniverseMatrix?: () => void;
  onClose: () => void;
}

export const LoreHistoryModal: React.FC<LoreHistoryModalProps> = ({
  comprehendedEpochIds,
  onComprehendEpoch,
  loreCodexState = INITIAL_LORE_CODEX_STATE,
  monsters = [],
  onScoutDiscoverCodexEntry,
  onClaimCodexBounty,
  onOpenOmniverseMatrix,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'timeline' | 'codex' | 'annals' | 'googol' | 'cosmology' | 'compendium'
  >('timeline');
  const [selectedEpochId, setSelectedEpochId] = useState<string>(LORE_HISTORICAL_EPOCHS[0].id);
  const [selectedAnnalId, setSelectedAnnalId] = useState<string>(LORE_DYNASTIC_ANNALS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lore Codex Filter & Selection State
  const allCodexEntries = getCompleteLoreCodexCatalog(monsters);
  const [codexFilter, setCodexFilter] = useState<'all' | 'biome' | 'monster' | 'discovered'>('all');
  const [selectedCodexId, setSelectedCodexId] = useState<string>(
    loreCodexState.lastVisitedBiomeId || OPEN_WORLD_BIOME_CODEX_CATALOG[0].id
  );

  // 10^100 Googol Akashic Archive State
  const [googolExponent, setGoogolExponent] = useState<number>(100);
  const [googolScrollCount, setGoogolScrollCount] = useState<number>(3);
  const [googolVolumeOffset, setGoogolVolumeOffset] = useState<bigint>(1n);
  const [expandedGoogolScrolls, setExpandedGoogolScrolls] = useState<Record<string, boolean>>({});

  const selectedEpoch =
    LORE_HISTORICAL_EPOCHS.find((e) => e.id === selectedEpochId) || LORE_HISTORICAL_EPOCHS[0];
  const selectedAnnal =
    LORE_DYNASTIC_ANNALS.find((a) => a.id === selectedAnnalId) || LORE_DYNASTIC_ANNALS[0];
  const { matchingEpochs, matchingChapters, matchingCodexEntries, matchingAnnals } =
    searchLoreHistory(searchQuery, monsters);

  const filteredCodexEntries = allCodexEntries.filter((entry) => {
    if (codexFilter === 'biome') return entry.kind === 'biome';
    if (codexFilter === 'monster') return entry.kind === 'monster';
    if (codexFilter === 'discovered') return Boolean(loreCodexState.discoveredRecords[entry.id]);
    return true;
  });

  const selectedCodexEntry =
    allCodexEntries.find((e) => e.id === selectedCodexId) ||
    filteredCodexEntries[0] ||
    allCodexEntries[0];
  const selectedCodexRecord = loreCodexState.discoveredRecords[selectedCodexEntry.id];

  const discoveredBiomeCount = allCodexEntries.filter(
    (e) => e.kind === 'biome' && Boolean(loreCodexState.discoveredRecords[e.id])
  ).length;
  const totalBiomeCount = allCodexEntries.filter((e) => e.kind === 'biome').length;

  const discoveredMonsterCount = allCodexEntries.filter(
    (e) => e.kind === 'monster' && Boolean(loreCodexState.discoveredRecords[e.id])
  ).length;
  const totalMonsterCount = allCodexEntries.filter((e) => e.kind === 'monster').length;

  const googolScrolls = generateGoogolScaleLoreScrollSlice({
    exponentTier: googolExponent,
    scrollOffset: googolVolumeOffset,
    sliceCount: googolScrollCount,
  });

  const totalActualWordsRendered = googolScrolls.reduce((acc, s) => acc + s.actualWordCount, 0);

  const totalPossibleDiamonds = LORE_HISTORICAL_EPOCHS.reduce(
    (acc, e) => acc + e.comprehensionRewardDiamonds,
    0n
  );
  const claimedDiamonds = LORE_HISTORICAL_EPOCHS.filter((e) =>
    comprehendedEpochIds.includes(e.id)
  ).reduce((acc, e) => acc + e.comprehensionRewardDiamonds, 0n);

  const nextUndiscoveredEntry = allCodexEntries.find(
    (e) => !loreCodexState.discoveredRecords[e.id]
  );

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
                <span
                  data-testid="lore-googol-capacity-badge"
                  className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold"
                >
                  ♾️ Akashic Corpus: {GOOGOL_LORE_ARCHIVE_SPEC.minimumWordCountScientific} Words Min
                  (1 Googol)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chronicles from Pre-Genesis on The White Page through the 100 Sovereign Omniverses,
                Auto-Populating Open-World Biome &amp; Monster Lore Codex, and the 10^100-Word
                Akashic History Stream.
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
        <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="lore-tab-timeline"
              onClick={() => {
                sound.playButton();
                setActiveTab('timeline');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>⏳ 7 Epochs ({comprehendedEpochIds.length}/7)</span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-codex"
              onClick={() => {
                sound.playButton();
                setActiveTab('codex');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'codex'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>
                🧭 Lore Codex ({discoveredBiomeCount + discoveredMonsterCount}/
                {allCodexEntries.length})
              </span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-annals"
              onClick={() => {
                sound.playButton();
                setActiveTab('annals');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'annals'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>🏛️ Annals &amp; Relics ({LORE_DYNASTIC_ANNALS.length})</span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-googol"
              onClick={() => {
                sound.playButton();
                setActiveTab('googol');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'googol'
                  ? 'bg-indigo-400 text-slate-950 shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <InfinityIcon className="w-4 h-4" />
              <span>♾️ 10^100 Words Akashic Stream</span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-cosmology"
              onClick={() => {
                sound.playButton();
                setActiveTab('cosmology');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'cosmology'
                  ? 'bg-fuchsia-500 text-slate-950 shadow-lg shadow-fuchsia-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>🌌 6-Layer Cosmology</span>
            </button>

            <button
              type="button"
              data-testid="lore-tab-compendium"
              onClick={() => {
                sound.playButton();
                setActiveTab('compendium');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'compendium'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>📚 Compendium &amp; Search</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300">
              Biomes: <strong>{discoveredBiomeCount}</strong>/{totalBiomeCount} · Monsters:{' '}
              <strong>{discoveredMonsterCount}</strong>/{totalMonsterCount}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300">
              Epoch Rewards: <strong>{formatBigInt(claimedDiamonds)}</strong> /{' '}
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

          {/* TAB 2: OPEN-WORLD AUTO-POPULATING LORE CODEX (BIOMES & MONSTER BESTIARY) */}
          {activeTab === 'codex' && (
            <div data-testid="lore-codex-section" className="space-y-4">
              {/* Top Discovery Banner & Quick Expedition Controls */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/70 border border-emerald-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-mono font-black">
                      🧭 AUTO-POPULATING OPEN-WORLD LORE CODEX
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono">
                      Biomes Visited: {discoveredBiomeCount}/{totalBiomeCount} · Monsters Sighted:{' '}
                      {discoveredMonsterCount}/{totalMonsterCount}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-cinzel text-white">
                    Solara Field Gazetteer &amp; Autonomous Bestiary Chronicles
                  </h3>
                  <p className="text-xs text-slate-300">
                    Entries automatically unlock as you traverse different biomes in the 3D open
                    world or encounter/spawn Level 1–1000 monsters. You can also dispatch a field
                    scout below to chart any unexplored region or monster lair.
                  </p>
                </div>

                {nextUndiscoveredEntry && onScoutDiscoverCodexEntry && (
                  <button
                    type="button"
                    data-testid="auto-scout-next-codex-btn"
                    onClick={() => {
                      sound.playUpgradeFanfare();
                      onScoutDiscoverCodexEntry(nextUndiscoveredEntry);
                      setSelectedCodexId(nextUndiscoveredEntry.id);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-mono font-black text-xs shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Scout Next Uncharted: {nextUndiscoveredEntry.title.split(' (')[0]}</span>
                  </button>
                )}
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: `All Codex Entries (${allCodexEntries.length})` },
                    { id: 'biome', label: `🗺️ Open-World Biomes (${totalBiomeCount})` },
                    { id: 'monster', label: `🐉 Monster Bestiary (${totalMonsterCount})` },
                    {
                      id: 'discovered',
                      label: `✓ Unlocked (${discoveredBiomeCount + discoveredMonsterCount})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`codex-filter-${tab.id}`}
                      onClick={() => {
                        sound.playButton();
                        setCodexFilter(tab.id as typeof codexFilter);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        codexFilter === tab.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Total Discovery Events Logged:{' '}
                  <strong className="text-emerald-300">
                    {loreCodexState.totalDiscoveryEvents}
                  </strong>
                </div>
              </div>

              {/* Master-Detail Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Biome & Monster Entry List */}
                <div className="lg:col-span-5 space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {filteredCodexEntries.map((entry) => {
                    const record = loreCodexState.discoveredRecords[entry.id];
                    const isDiscovered = Boolean(record);
                    const isSelected = entry.id === selectedCodexEntry.id;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        data-testid={`lore-codex-item-${entry.id}`}
                        onClick={() => {
                          sound.playSwing();
                          setSelectedCodexId(entry.id);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500/20 via-slate-900 to-cyan-500/15 border-emerald-400 shadow-lg'
                            : isDiscovered
                              ? 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/40'
                              : 'bg-slate-950/50 border-slate-800/60 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                            {entry.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                  entry.kind === 'biome'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {entry.kind}
                              </span>
                              <span className="text-[10px] font-mono text-amber-200 truncate">
                                {entry.chineseTitle}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-white mt-1 line-clamp-1">
                              {entry.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                              {entry.regionCoordinatesLabel}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                            !isDiscovered
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : record.rewardClaimed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                          }`}
                        >
                          {!isDiscovered
                            ? '🔒 UNCHARTED'
                            : record.rewardClaimed
                              ? '✓ CATALOGED'
                              : `+${formatBigInt(entry.discoveryRewardDiamonds)} 💎`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Selected Lore Codex Entry Detail */}
                <div className="lg:col-span-7">
                  <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold uppercase">
                            {selectedCodexEntry.kind === 'biome'
                              ? '🗺️ Open-World Biome Chronicle'
                              : '🐉 Autonomous Monster Bestiary'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-amber-400/40 text-amber-200 text-xs font-mono">
                            {selectedCodexEntry.chineseTitle}
                          </span>
                        </div>
                        <h3
                          data-testid="selected-codex-entry-title"
                          className="text-lg sm:text-xl font-black font-cinzel text-white pt-1"
                        >
                          {selectedCodexEntry.icon} {selectedCodexEntry.title}
                        </h3>
                        <div className="text-xs font-mono text-cyan-300">
                          {selectedCodexEntry.subtitle}
                        </div>
                      </div>

                      {/* Discovery / Bounty Action Button */}
                      {!selectedCodexRecord ? (
                        <button
                          type="button"
                          data-testid="scout-discover-codex-btn"
                          onClick={() => {
                            if (onScoutDiscoverCodexEntry) {
                              sound.playUpgradeFanfare();
                              onScoutDiscoverCodexEntry(selectedCodexEntry);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 text-xs font-mono font-black shadow-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Compass className="w-4 h-4" />
                          <span>
                            Scout &amp; Auto-Populate Entry (+
                            {formatBigInt(selectedCodexEntry.discoveryRewardDiamonds)} 💎 Bounty)
                          </span>
                        </button>
                      ) : !selectedCodexRecord.rewardClaimed ? (
                        <button
                          type="button"
                          data-testid="claim-codex-bounty-btn"
                          onClick={() => {
                            if (onClaimCodexBounty) {
                              sound.playUpgradeFanfare();
                              onClaimCodexBounty(selectedCodexEntry.id);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 text-xs font-mono font-black shadow-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            Claim Codex Bounty (+
                            {formatBigInt(selectedCodexEntry.discoveryRewardDiamonds)} 💎 &amp; +
                            {selectedCodexEntry.discoveryRewardFragments} Scrolls)
                          </span>
                        </button>
                      ) : (
                        <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Discovered &amp; Bounty Claimed</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Telemetry Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" /> World Coordinates &amp;
                          Danger
                        </div>
                        <div className="text-xs font-mono text-white font-bold">
                          {selectedCodexEntry.regionCoordinatesLabel}
                        </div>
                        <div className="text-[11px] font-mono text-amber-300">
                          {selectedCodexEntry.dangerLevelLabel}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-400" /> Elemental Leyline
                          &amp; Status
                        </div>
                        <div className="text-xs font-mono text-fuchsia-200 font-bold">
                          {selectedCodexEntry.elementalLeyline}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-300">
                          {selectedCodexRecord
                            ? `✓ Auto-Populated via ${selectedCodexRecord.discoveredVia.replace(/_/g, ' ').toUpperCase()}`
                            : '⏳ Awaiting Open-World Traversal or Field Scout'}
                        </div>
                      </div>
                    </div>

                    {/* Tactical Counter-Matrix Notes */}
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-100 leading-relaxed">
                      <strong className="text-amber-300 font-mono uppercase mr-1.5">
                        ⚔️ Tactical &amp; Ecological Intelligence:
                      </strong>
                      {selectedCodexEntry.tacticalNotes}
                    </div>

                    {/* Lore Paragraphs */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-mono font-bold text-emerald-300 uppercase">
                        📜 Field Archive &amp; Historical Lore Inscription
                      </div>
                      {selectedCodexEntry.loreParagraphs.map((para, idx) => (
                        <p
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed"
                        >
                          <span className="text-emerald-400 font-mono font-bold mr-2">
                            ¶{idx + 1}
                          </span>
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2B: 12 DYNASTIC ANNALS, TREATIES & LEGENDARY RELICS */}
          {activeTab === 'annals' && (
            <div
              data-testid="lore-annals-section"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5"
            >
              <div className="lg:col-span-5 space-y-2 max-h-[580px] overflow-y-auto pr-1">
                <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider px-1">
                  12 Imperial Dynastic Annals &amp; Artifact Histories
                </div>
                {LORE_DYNASTIC_ANNALS.map((annal) => {
                  const isSelected = annal.id === selectedAnnal.id;
                  return (
                    <button
                      key={annal.id}
                      type="button"
                      data-testid={`lore-annal-btn-${annal.id}`}
                      onClick={() => {
                        sound.playSwing();
                        setSelectedAnnalId(annal.id);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-cyan-500/15 border-amber-400 shadow-lg'
                          : 'bg-slate-950/85 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                        {annal.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {annal.scrollCode}
                          </span>
                          <span className="text-[10px] font-mono text-fuchsia-300 truncate">
                            {annal.chineseTitle}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white mt-1 line-clamp-1">
                          {annal.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {annal.eraReference} · Chronicler: {annal.chronicler}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-black">
                        {selectedAnnal.scrollCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono">
                        {selectedAnnal.cosmicLayer}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black font-cinzel text-white pt-1">
                      {selectedAnnal.icon} {selectedAnnal.title}
                    </h3>
                    <div className="text-xs font-mono text-fuchsia-300">
                      {selectedAnnal.chineseTitle} · {selectedAnnal.eraReference}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 text-xs text-amber-100 leading-relaxed">
                    {selectedAnnal.summary}
                  </div>

                  <div className="space-y-2.5">
                    {selectedAnnal.fullTextParagraphs.map((para, i) => (
                      <p
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed"
                      >
                        <span className="text-amber-400 font-mono font-bold mr-2">§{i + 1}</span>
                        {para}
                      </p>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                    <span className="text-slate-400">
                      Inscribed by:{' '}
                      <strong className="text-amber-300">{selectedAnnal.chronicler}</strong>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnnal.relatedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-cyan-300"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 10^100 GOOGOL-SCALE AKASHIC LORE & HISTORY STREAM */}
          {activeTab === 'googol' && (
            <div data-testid="googol-lore-archive-section" className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-fuchsia-950/80 border border-indigo-400/50 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-400 text-slate-950 text-xs font-mono font-black">
                        ♾️ 10^100 WORDS MINIMUM (ONE GOOGOL WORDS) AKASHIC ARCHIVE
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold">
                        Live Rendered: {totalActualWordsRendered.toLocaleString()} Real Words
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-amber-400/50 text-amber-300 text-xs font-mono">
                        Seed: {GOOGOL_LORE_ARCHIVE_SPEC.generatorSeed}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-cinzel text-white">
                      Layer 6 White Page Procedural Lore Stream (
                      {GOOGOL_LORE_ARCHIVE_SPEC.totalVolumesScientific} BigInt Volumes × 1,000+ Real
                      Words = 10^100 Words Minimum)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Every synthesized volume produces{' '}
                      <strong className="text-emerald-300">1,000+ real English words</strong> across
                      7 structural chapters (The White Page, Overvoid Meta-Logic, Hyperversal
                      Branes, Solara Biomes, 4-Path Cultivation, Citadel Legions, and 06/11/2026
                      Silicon Architecture). Address any volume from{' '}
                      <span className="font-mono text-amber-300">Vol. #1</span> up to{' '}
                      <span className="font-mono text-amber-300">Vol. #10^97</span> for a guaranteed
                      corpus floor of <strong className="text-amber-300">10^100 words</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="googol-load-more-btn"
                    onClick={() => {
                      sound.playButton();
                      setGoogolScrollCount((prev) => Math.min(12, prev + 3));
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-400 hover:bg-indigo-300 text-slate-950 font-mono font-black text-xs shrink-0 cursor-pointer"
                  >
                    + Synthesize Next 3 Googol Volumes ({googolScrollCount}/12 Loaded)
                  </button>
                </div>

                {/* Exponent Coordinate Dial (10^0 to 10^100) + BigInt Volume Jump Bar */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor="googol-exponent-range"
                        className="text-xs font-mono font-bold text-indigo-300 flex items-center justify-between"
                      >
                        <span>Akashic Word Coordinate Horizon: 10^{googolExponent} Words</span>
                        <span className="text-amber-300">
                          Minimum Corpus Bound: 10^100 Words (1 Googol)
                        </span>
                      </label>
                      <input
                        id="googol-exponent-range"
                        type="range"
                        min={0}
                        max={100}
                        value={googolExponent}
                        onChange={(e) => setGoogolExponent(Number(e.target.value))}
                        className="w-full accent-indigo-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[10, 25, 50, 80, 100].map((exp) => (
                        <button
                          key={exp}
                          type="button"
                          data-testid={`googol-exp-btn-${exp}`}
                          onClick={() => {
                            sound.playButton();
                            setGoogolExponent(exp);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                            googolExponent === exp
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          10^{exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BigInt Volume Address Jumps (1 .. 10^97) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400">
                      Current BigInt Volume Cursor:{' '}
                      <strong className="text-cyan-300">
                        {googolScrolls[0]?.volumeCoordinateLabel}
                      </strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: 'Vol #1', offset: 1n },
                        { label: 'Vol #10^25', offset: 10n ** 25n },
                        { label: 'Vol #10^50', offset: 10n ** 50n },
                        { label: 'Vol #10^97 (10^100th Word)', offset: GOOGOL_MAX_VOLUME_INDEX },
                        {
                          label: '+3 Volumes →',
                          offset:
                            googolVolumeOffset + 3n <= GOOGOL_MAX_VOLUME_INDEX
                              ? googolVolumeOffset + 3n
                              : 1n,
                        },
                      ].map((jump) => (
                        <button
                          key={jump.label}
                          type="button"
                          onClick={() => {
                            sound.playButton();
                            setGoogolVolumeOffset(jump.offset);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-[11px] font-mono text-indigo-200 cursor-pointer"
                        >
                          {jump.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Synthesized Googol Lore Scroll Volumes */}
              <div className="grid grid-cols-1 gap-4">
                {googolScrolls.map((scroll) => {
                  const isExpanded = Boolean(expandedGoogolScrolls[scroll.scrollId]);
                  const visibleParagraphs = isExpanded
                    ? scroll.paragraphs
                    : scroll.paragraphs.slice(0, 3);
                  return (
                    <div
                      key={scroll.scrollId}
                      data-testid={`googol-scroll-card-${scroll.scrollId}`}
                      className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[11px] font-mono font-bold">
                              {scroll.volumeCoordinateLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold">
                              {scroll.actualWordCount.toLocaleString()} Real Words
                            </span>
                            <span className="text-xs font-mono text-fuchsia-300">
                              {scroll.chineseSubtitle}
                            </span>
                            <span className="text-[11px] font-mono text-cyan-300">
                              Anchor: {scroll.cosmicLayerAnchor}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold font-cinzel text-amber-300 mt-1">
                            📜 {scroll.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playButton();
                            setExpandedGoogolScrolls((prev) => ({
                              ...prev,
                              [scroll.scrollId]: !prev[scroll.scrollId],
                            }));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-400/40 text-indigo-200 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          {isExpanded
                            ? 'Collapse Sections (3/7)'
                            : `Read Full ${scroll.actualWordCount.toLocaleString()}-Word Volume (7 Sections)`}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {visibleParagraphs.map((p, idx) => (
                          <p
                            key={idx}
                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed"
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 6-LAYER COSMOLOGY & 100 OMNIVERSES LORE */}
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

          {/* TAB 5: SACRED COMPENDIUM & SEARCHABLE CODEX */}
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
                    placeholder="Search epochs, biomes, monsters, White Page, Oblivion, Overvoid, Han Jue, creatergame31@gmail.com..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>
                <div className="text-xs font-mono text-slate-400 shrink-0">
                  Showing <strong className="text-cyan-300">{matchingChapters.length}</strong>{' '}
                  Codices, <strong className="text-amber-300">{matchingEpochs.length}</strong>{' '}
                  Epochs, <strong className="text-fuchsia-300">{matchingAnnals.length}</strong>{' '}
                  Annals &amp;{' '}
                  <strong className="text-emerald-300">{matchingCodexEntries.length}</strong> Field
                  Entries
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
