/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  X,
  ShoppingBag,
  ArrowLeftRight,
  ScrollText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Coins,
  TrendingUp,
  TrendingDown,
  BellPlus,
  BellRing,
  Users,
  Activity,
  Radar,
  MapPin,
  Gauge,
  ArrowUpDown,
} from 'lucide-react';
import { GameResources, NPC, NPCTradeOffer, ResourceType } from '../types/game';
import { formatBigInt } from '../game/math';
import { PRIMARY_ADMIN_EMAIL } from '../game/adminModeration';
import {
  BULK_EXCHANGE_LIQUIDITY_BASELINE,
  CARAVAN_DAILY_VOLUME_BASELINE,
  CurioArbitrageOpportunity,
  CurioPriceAlert,
  INITIAL_P2P_TRADE_LISTINGS,
  LiquidityScoreResult,
  LiquidityTier,
  PlayerToPlayerTradeListing,
  computeCurioArbitrageOpportunities,
  computeCurioSparklineD3,
  computeItemLiquidityScore,
  computeMarketplaceLiquidityRows,
  evaluateCurioPriceAlerts,
} from '../game/marketplaceSparklineD3';
import { sound } from '../game/audio';

export interface BulkExchangeOffer {
  id: string;
  title: string;
  subtitle: string;
  costResource: ResourceType;
  costAmount: bigint;
  rewardResource: ResourceType;
  rewardAmount: bigint;
}

export interface CurioMarketItem {
  id: string;
  name: string;
  description: string;
  costResource: 'copper' | 'diamond';
  costAmount: bigint;
  rewardType: 'veteran_scrolls' | 'spirit_stones' | 'imperial_supply_crate';
  rewardAmount: number;
  badgeText: string;
}

export const BULK_EXCHANGE_OFFERS: readonly BulkExchangeOffer[] = [
  {
    id: 'ex_wood_to_copper',
    title: 'Timber Consortium Liquidation',
    subtitle: 'Convert surplus lumber into Imperial Copper Coinage',
    costResource: 'wood',
    costAmount: 50_000n,
    rewardResource: 'copper',
    rewardAmount: 45_000n,
  },
  {
    id: 'ex_grain_to_steel',
    title: 'Ironforge Quartermaster Provision Swap',
    subtitle: 'Barter granary provisions for tempered Steel Ingots',
    costResource: 'grain',
    costAmount: 60_000n,
    rewardResource: 'steel',
    rewardAmount: 42_000n,
  },
  {
    id: 'ex_steel_to_oil',
    title: 'Alchemical Refinery Distillation',
    subtitle: 'Exchange forged steel for refined siege Oil barrels',
    costResource: 'steel',
    costAmount: 80_000n,
    rewardResource: 'oil',
    rewardAmount: 40_000n,
  },
  {
    id: 'ex_copper_to_diamond',
    title: 'Solara Royal Mint Gem Bullion',
    subtitle: 'Settle Copper reserves for pure Astral Diamonds',
    costResource: 'copper',
    costAmount: 250_000n,
    rewardResource: 'diamond',
    rewardAmount: 1_500n,
  },
  {
    id: 'ex_diamond_to_all_pack',
    title: 'Sovereign Diamond Liquidity Injection',
    subtitle: 'Redeem Diamonds for massive Refined Oil stockpiles',
    costResource: 'diamond',
    costAmount: 500n,
    rewardResource: 'oil',
    rewardAmount: 150_000n,
  },
  {
    id: 'ex_oil_to_diamond',
    title: 'Caravan Syndicate Fuel Arbitrage',
    subtitle: 'Export refined Oil reserves for high-purity Diamonds',
    costResource: 'oil',
    costAmount: 100_000n,
    rewardResource: 'diamond',
    rewardAmount: 900n,
  },
] as const;

export const CURIO_MARKET_ITEMS: readonly CurioMarketItem[] = [
  {
    id: 'curio_veteran_scroll_bundle',
    name: 'Immortal Veteran Scroll Folio (×3)',
    description:
      'Grants +3 Veteran Scrolls for instant comprehension in the Daily Decree & Cultivation Cave.',
    costResource: 'diamond',
    costAmount: 1_200n,
    rewardType: 'veteran_scrolls',
    rewardAmount: 3,
    badgeText: '+3 Scrolls',
  },
  {
    id: 'curio_spirit_stone_coffer',
    name: 'Nine-Heavens Spirit Stone Coffer',
    description:
      'Delivers +50,000 Spirit Stones directly into your Cultivation Dantian & Alchemy treasury.',
    costResource: 'copper',
    costAmount: 120_000n,
    rewardType: 'spirit_stones',
    rewardAmount: 50_000,
    badgeText: '+50K Spirit Stones',
  },
  {
    id: 'curio_imperial_war_crate',
    name: 'Imperial Command Centre Supply Crate',
    description:
      'Bolsters your fortress reserves with +250,000 Wood, +250,000 Grain, +150,000 Steel, and +100,000 Oil.',
    costResource: 'diamond',
    costAmount: 2_000n,
    rewardType: 'imperial_supply_crate',
    rewardAmount: 1,
    badgeText: 'Full Resource Crate',
  },
] as const;

const RESOURCE_LABELS: Record<ResourceType, { name: string; icon: string }> = {
  wood: { name: 'Wood', icon: '🌲' },
  grain: { name: 'Grain', icon: '🌾' },
  steel: { name: 'Steel', icon: '⚔️' },
  copper: { name: 'Copper', icon: '🪙' },
  oil: { name: 'Oil', icon: '🛢️' },
  diamond: { name: 'Diamond', icon: '💎' },
};

const PEER_LORDS = [
  { name: 'Lady Seraphina', clanTag: 'VALKYR', speciesIcon: '🐉' },
  { name: 'Lord Kaelen', clanTag: 'IRON', speciesIcon: '🛡️' },
  { name: 'Elder Zhao', clanTag: 'LOTUS', speciesIcon: '🦊' },
  { name: 'Vanguard Thorne', clanTag: 'ASTRAL', speciesIcon: '⚡' },
] as const;

const LIQUIDITY_TIER_STYLES: Record<LiquidityTier, { badge: string; bar: string; text: string }> = {
  Instant: {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
    bar: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  High: {
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    bar: 'bg-cyan-400',
    text: 'text-cyan-300',
  },
  Moderate: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    bar: 'bg-amber-400',
    text: 'text-amber-300',
  },
  Low: {
    badge: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
    bar: 'bg-orange-400',
    text: 'text-orange-300',
  },
  Illiquid: {
    badge: 'bg-rose-500/20 text-rose-300 border-rose-400/50',
    bar: 'bg-rose-500',
    text: 'text-rose-300',
  },
};

const LiquidityScoreCell: React.FC<{ liquidity: LiquidityScoreResult; testId?: string }> = ({
  liquidity,
  testId,
}) => {
  const style = LIQUIDITY_TIER_STYLES[liquidity.tier];
  return (
    <div data-testid={testId} className="space-y-1 min-w-[165px]">
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono font-bold text-xs tabular-nums ${style.text}`}>
          {liquidity.score}/100
        </span>
        <span
          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${style.badge}`}
        >
          {liquidity.tier}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
          style={{ width: `${liquidity.score}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-400 leading-tight">{liquidity.bulkTradeAdvice}</div>
    </div>
  );
};

interface CurioSparklineCardProps {
  item: CurioMarketItem;
  sessionPurchasesCount: number;
  priceAdjustmentDelta: number;
  activeAlert?: CurioPriceAlert;
  onOpenAlertForItem: (item: CurioMarketItem, currentPrice: number) => void;
}

const CurioPriceSparkline: React.FC<CurioSparklineCardProps> = ({
  item,
  sessionPurchasesCount,
  priceAdjustmentDelta,
  activeAlert,
  onOpenAlertForItem,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const geometry = useMemo(
    () =>
      computeCurioSparklineD3({
        itemId: item.id,
        width: 240,
        height: 64,
        sessionPurchasesCount,
        priceAdjustmentDelta,
        targetAlertPrice: activeAlert ? activeAlert.targetPrice : null,
      }),
    [item.id, sessionPurchasesCount, priceAdjustmentDelta, activeAlert]
  );

  const costMeta = RESOURCE_LABELS[item.costResource];
  const isBullish = geometry.trendDirection === 'bullish';
  const strokeColor = isBullish ? '#f59e0b' : '#22d3ee';
  const gradientId = `sparkline-grad-${item.id}`;
  const inspectedPoint =
    selectedDayIndex !== null
      ? geometry.points[selectedDayIndex]
      : geometry.points[geometry.points.length - 1];

  return (
    <div
      data-testid={`curio-sparkline-${item.id}`}
      className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800 space-y-1.5"
    >
      <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono">
        <span className="text-slate-400 uppercase tracking-wider font-bold">7D D3 Price Trend</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid={`curio-create-alert-btn-${item.id}`}
            onClick={() => {
              sound.playSwing();
              onOpenAlertForItem(item, geometry.latestPrice);
            }}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
              activeAlert
                ? activeAlert.triggered
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/60'
                  : 'bg-amber-500/25 text-amber-200 border border-amber-400/60'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
            }`}
            title="Create or update a target price alert for this Curio item"
          >
            {activeAlert ? (
              <BellRing className="w-2.5 h-2.5" />
            ) : (
              <BellPlus className="w-2.5 h-2.5" />
            )}
            <span>
              {activeAlert
                ? `${activeAlert.condition === 'at_or_below' ? '≤' : '≥'}${formatBigInt(BigInt(activeAlert.targetPrice))}`
                : 'Alert'}
            </span>
          </button>

          <span
            data-testid={`curio-sparkline-delta-${item.id}`}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold tabular-nums ${
              isBullish
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {geometry.sevenDayDeltaPct > 0
              ? `+${geometry.sevenDayDeltaPct}%`
              : `${geometry.sevenDayDeltaPct}%`}
          </span>
        </div>
      </div>

      <svg
        data-testid={`curio-sparkline-svg-${item.id}`}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className="w-full h-16 overflow-visible select-none"
        role="img"
        aria-label={`7-day price trend sparkline for ${item.name}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* 7-Day Mean Reference Line */}
        <line
          x1={8}
          x2={geometry.width - 8}
          y1={geometry.meanY}
          y2={geometry.meanY}
          stroke="#475569"
          strokeDasharray="3 3"
          strokeWidth={1}
        />

        {/* Target Price Alert Threshold Line */}
        {geometry.targetAlertY !== null && (
          <line
            data-testid={`curio-sparkline-alert-line-${item.id}`}
            x1={8}
            x2={geometry.width - 8}
            y1={geometry.targetAlertY}
            y2={geometry.targetAlertY}
            stroke={activeAlert?.triggered ? '#10b981' : '#f43f5e'}
            strokeDasharray="4 2"
            strokeWidth={1.5}
          />
        )}

        {/* D3 Monotone Area Fill */}
        <path d={geometry.areaPath} fill={`url(#${gradientId})`} />

        {/* D3 Monotone Price Line */}
        <path
          data-testid={`curio-sparkline-path-${item.id}`}
          d={geometry.linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.25}
          strokeLinecap="round"
        />

        {/* Interactive 7-Day Data Nodes */}
        {geometry.points.map((pt) => {
          const isSelected = inspectedPoint?.dayIndex === pt.dayIndex;
          return (
            <g
              key={pt.dayIndex}
              className="cursor-pointer"
              onMouseEnter={() => setSelectedDayIndex(pt.dayIndex)}
              onMouseLeave={() => setSelectedDayIndex(null)}
              onClick={() =>
                setSelectedDayIndex((prev) => (prev === pt.dayIndex ? null : pt.dayIndex))
              }
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 4.5 : pt.isLatest ? 3.5 : 2.5}
                fill={isSelected ? '#ffffff' : strokeColor}
                stroke="#020617"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      {/* 7-Day Axis & Inspected Point Readout */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 tabular-nums pt-0.5 border-t border-slate-800/80">
        <span>
          {inspectedPoint.dayLabel}:{' '}
          <strong className="text-slate-200">
            {costMeta.icon} {formatBigInt(BigInt(inspectedPoint.price))}
          </strong>{' '}
          <span className="text-slate-500">({inspectedPoint.volume} vol)</span>
        </span>
        <span>
          7D Avg: {costMeta.icon} {formatBigInt(BigInt(geometry.meanPrice))}
        </span>
      </div>
    </div>
  );
};

interface MarketplaceModalProps {
  resources: GameResources;
  npcs: NPC[];
  isGodImmune?: boolean;
  activeAccountEmail?: string;
  playerName?: string;
  veteranScrollsOwned?: number;
  spiritStonesOwned?: bigint;
  onExecuteNPCTrade: (npcId: string, offer: NPCTradeOffer) => void;
  onExecuteBulkExchange: (offer: BulkExchangeOffer) => void;
  onPurchaseCurioItem: (item: CurioMarketItem) => void;
  onExecuteP2PTrade?: (
    giveResource: ResourceType,
    giveAmount: bigint,
    receiveResource: ResourceType,
    receiveAmount: bigint,
    counterpartyLabel: string
  ) => void;
  onExecuteArbitrageTrade?: (
    resource: 'copper' | 'diamond',
    netProfit: bigint,
    routeSummary: string
  ) => void;
  onNotifyToast?: (message: string) => void;
  onClose: () => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  resources,
  npcs,
  isGodImmune = false,
  activeAccountEmail = PRIMARY_ADMIN_EMAIL,
  playerName = 'Aiden Skyrender',
  veteranScrollsOwned = 0,
  spiritStonesOwned = 0n,
  onExecuteNPCTrade,
  onExecuteBulkExchange,
  onPurchaseCurioItem,
  onExecuteP2PTrade,
  onExecuteArbitrageTrade,
  onNotifyToast,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'exchange' | 'p2p' | 'caravan' | 'curios' | 'arbitrage'
  >('exchange');
  const [lastTransactionBanner, setLastTransactionBanner] = useState<string | null>(null);
  const [curioPurchaseCounts, setCurioPurchaseCounts] = useState<Record<string, number>>({});
  const [curioPriceAdjustments, setCurioPriceAdjustments] = useState<Record<string, number>>({});
  const [bulkExecutionCounts, setBulkExecutionCounts] = useState<Record<string, number>>({});
  const [liquidityCategoryFilter, setLiquidityCategoryFilter] = useState<
    'all' | 'Bulk Exchange' | 'Caravan Barter' | 'Curio Market'
  >('all');
  const [liquiditySortDesc, setLiquiditySortDesc] = useState<boolean>(true);
  const [arbitrageExecutionCounts, setArbitrageExecutionCounts] = useState<Record<string, number>>(
    {}
  );

  // Price Alerts State
  const [isPriceAlertPanelOpen, setIsPriceAlertPanelOpen] = useState(false);
  const [selectedAlertItemId, setSelectedAlertItemId] = useState<string>(CURIO_MARKET_ITEMS[0].id);
  const [alertTargetPriceInput, setAlertTargetPriceInput] = useState<string>('1220');
  const [alertCondition, setAlertCondition] = useState<'at_or_below' | 'at_or_above'>(
    'at_or_above'
  );
  const [priceAlerts, setPriceAlerts] = useState<CurioPriceAlert[]>([]);

  // Player-to-Player (P2P) Trade State
  const [p2pListings, setP2pListings] = useState<PlayerToPlayerTradeListing[]>(() => [
    ...INITIAL_P2P_TRADE_LISTINGS,
  ]);
  const [p2pPeerIndex, setP2pPeerIndex] = useState<number>(0);
  const [p2pOfferResource, setP2pOfferResource] = useState<ResourceType>('wood');
  const [p2pOfferAmount, setP2pOfferAmount] = useState<string>('75000');
  const [p2pRequestResource, setP2pRequestResource] = useState<ResourceType>('diamond');
  const [p2pRequestAmount, setP2pRequestAmount] = useState<string>('1000');

  const merchantNpc =
    npcs.find((n) => n.role === 'merchant' && n.tradeOffers && n.tradeOffers.length > 0) ||
    npcs.find((n) => n.tradeOffers && n.tradeOffers.length > 0);

  // Compute current live prices for all Curio items
  const liveCurioPrices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of CURIO_MARKET_ITEMS) {
      const geo = computeCurioSparklineD3({
        itemId: item.id,
        sessionPurchasesCount: curioPurchaseCounts[item.id] ?? 0,
        priceAdjustmentDelta: curioPriceAdjustments[item.id] ?? 0,
      });
      map[item.id] = geo.latestPrice;
    }
    return map;
  }, [curioPurchaseCounts, curioPriceAdjustments]);

  // Compute Open-World Arbitrage Opportunities across NPC Merchant Nodes
  const arbitrageOpportunities = useMemo(
    () =>
      computeCurioArbitrageOpportunities({
        npcs,
        executedCountByItemId: arbitrageExecutionCounts,
      }),
    [npcs, arbitrageExecutionCounts]
  );

  // Compute Liquidity Score Matrix across Bulk Exchange, Caravan Barter, and Curio Market
  const liquidityRows = useMemo(
    () =>
      computeMarketplaceLiquidityRows({
        bulkOffers: BULK_EXCHANGE_OFFERS,
        bulkExecutionsById: bulkExecutionCounts,
        caravanOffers: merchantNpc?.tradeOffers ?? [],
        curioItems: CURIO_MARKET_ITEMS,
        curioSessionPurchasesById: curioPurchaseCounts,
        arbitrageExecutionsById: arbitrageExecutionCounts,
      }),
    [bulkExecutionCounts, merchantNpc?.tradeOffers, curioPurchaseCounts, arbitrageExecutionCounts]
  );

  const visibleLiquidityRows = useMemo(() => {
    const filtered =
      liquidityCategoryFilter === 'all'
        ? liquidityRows
        : liquidityRows.filter((row) => row.category === liquidityCategoryFilter);
    return [...filtered].sort((a, b) =>
      liquiditySortDesc
        ? b.liquidity.score - a.liquidity.score
        : a.liquidity.score - b.liquidity.score
    );
  }, [liquidityRows, liquidityCategoryFilter, liquiditySortDesc]);

  const checkAndTriggerAlerts = (
    alertsToEvaluate: readonly CurioPriceAlert[],
    pricesMap: Readonly<Record<string, number>>
  ) => {
    const evalRes = evaluateCurioPriceAlerts({
      alerts: alertsToEvaluate,
      livePricesByItemId: pricesMap,
    });
    setPriceAlerts(evalRes.updatedAlerts);

    if (evalRes.newlyTriggered.length > 0) {
      const first = evalRes.newlyTriggered[0];
      const resourceLabel = RESOURCE_LABELS[first.costResource].name;
      const livePrice = pricesMap[first.itemId] ?? first.targetPrice;
      const msg = `🔔 Price Alert Reached: ${first.itemName} hit ${formatBigInt(BigInt(livePrice))} ${resourceLabel} (Target ${first.condition === 'at_or_below' ? '≤' : '≥'} ${formatBigInt(BigInt(first.targetPrice))})!`;
      sound.playLevelUp();
      setLastTransactionBanner(msg);
      onNotifyToast?.(msg);
    }
  };

  const handleOpenPriceAlertModal = (item?: CurioMarketItem, currentPrice?: number) => {
    const targetItem = item ?? CURIO_MARKET_ITEMS[0];
    const basePrice =
      currentPrice ?? liveCurioPrices[targetItem.id] ?? Number(targetItem.costAmount);
    setSelectedAlertItemId(targetItem.id);
    setAlertTargetPriceInput(String(basePrice));
    setAlertCondition('at_or_above');
    setIsPriceAlertPanelOpen(true);
    setActiveTab('curios');
  };

  const handleCreatePriceAlert = () => {
    const targetItem =
      CURIO_MARKET_ITEMS.find((i) => i.id === selectedAlertItemId) ?? CURIO_MARKET_ITEMS[0];
    const parsedTarget = Math.max(1, Math.round(Number(alertTargetPriceInput) || 0));

    const newAlert: CurioPriceAlert = {
      id: `alert_${targetItem.id}_${Date.now()}`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      costResource: targetItem.costResource,
      targetPrice: parsedTarget,
      condition: alertCondition,
      triggered: false,
      createdAtMs: Date.now(),
    };

    const nextAlerts = [...priceAlerts.filter((a) => a.itemId !== targetItem.id), newAlert];

    const resourceLabel = RESOURCE_LABELS[targetItem.costResource].name;
    const creationMsg = `🔔 Price Alert Armed for ${targetItem.name} at ${alertCondition === 'at_or_below' ? '≤' : '≥'} ${formatBigInt(BigInt(parsedTarget))} ${resourceLabel}!`;
    setLastTransactionBanner(creationMsg);
    onNotifyToast?.(creationMsg);

    checkAndTriggerAlerts(nextAlerts, liveCurioPrices);
  };

  const handleSimulateMarketTickTowardAlerts = () => {
    sound.playSwing();
    const nextAdjustments = { ...curioPriceAdjustments };

    if (priceAlerts.length > 0) {
      for (const alert of priceAlerts) {
        const currentLive = liveCurioPrices[alert.itemId] ?? alert.targetPrice;
        const deltaNeeded = alert.targetPrice - currentLive;
        nextAdjustments[alert.itemId] = (nextAdjustments[alert.itemId] ?? 0) + deltaNeeded;
      }
    } else {
      for (const item of CURIO_MARKET_ITEMS) {
        const bump = Math.round(Number(item.costAmount) * 0.03);
        nextAdjustments[item.id] = (nextAdjustments[item.id] ?? 0) + bump;
      }
    }

    setCurioPriceAdjustments(nextAdjustments);

    const updatedPrices: Record<string, number> = {};
    for (const item of CURIO_MARKET_ITEMS) {
      const geo = computeCurioSparklineD3({
        itemId: item.id,
        sessionPurchasesCount: curioPurchaseCounts[item.id] ?? 0,
        priceAdjustmentDelta: nextAdjustments[item.id] ?? 0,
      });
      updatedPrices[item.id] = geo.latestPrice;
    }

    checkAndTriggerAlerts(priceAlerts, updatedPrices);
  };

  const handleAcceptP2PListing = (listing: PlayerToPlayerTradeListing) => {
    if (listing.status !== 'open') return;
    const canAfford =
      isGodImmune || resources[listing.requestedResource] >= listing.requestedAmount;
    if (!canAfford) return;

    sound.playUpgradeFanfare();
    onExecuteP2PTrade?.(
      listing.requestedResource,
      listing.requestedAmount,
      listing.offeredResource,
      listing.offeredAmount,
      `[${listing.sellerClanTag}] ${listing.sellerName}`
    );

    setP2pListings((prev) =>
      prev.map((item) =>
        item.id === listing.id ? { ...item, status: 'completed', completedBy: playerName } : item
      )
    );

    const giveMeta = RESOURCE_LABELS[listing.requestedResource];
    const recvMeta = RESOURCE_LABELS[listing.offeredResource];
    const msg = `🤝 P2P Trade Settled with [${listing.sellerClanTag}] ${listing.sellerName}: Sent ${formatBigInt(listing.requestedAmount)} ${giveMeta.name} → Received +${formatBigInt(listing.offeredAmount)} ${recvMeta.name}!`;
    setLastTransactionBanner(msg);
    onNotifyToast?.(msg);
  };

  const handleExecuteDirectP2PTrade = (mode: 'instant' | 'orderbook') => {
    const giveAmt = BigInt(Math.max(1, Math.round(Number(p2pOfferAmount) || 1000)));
    const recvAmt = BigInt(Math.max(1, Math.round(Number(p2pRequestAmount) || 500)));
    const canAfford = isGodImmune || resources[p2pOfferResource] >= giveAmt;
    if (!canAfford) return;

    const peer = PEER_LORDS[p2pPeerIndex] ?? PEER_LORDS[0];
    const giveMeta = RESOURCE_LABELS[p2pOfferResource];
    const recvMeta = RESOURCE_LABELS[p2pRequestResource];

    sound.playUpgradeFanfare();
    onExecuteP2PTrade?.(
      p2pOfferResource,
      giveAmt,
      p2pRequestResource,
      recvAmt,
      `[${peer.clanTag}] ${peer.name}`
    );

    if (mode === 'orderbook') {
      const newListing: PlayerToPlayerTradeListing = {
        id: `p2p_player_${Date.now()}`,
        sellerName: playerName,
        sellerClanTag: 'VALOR',
        sellerSpeciesIcon: '👑',
        offeredResource: p2pOfferResource,
        offeredAmount: giveAmt,
        requestedResource: p2pRequestResource,
        requestedAmount: recvAmt,
        status: 'completed',
        isPlayerCreated: true,
        completedBy: `[${peer.clanTag}] ${peer.name}`,
      };
      setP2pListings((prev) => [newListing, ...prev]);
    }

    const msg = `🤝 Direct Player-to-Player Trade with [${peer.clanTag}] ${peer.name} Complete: +${formatBigInt(recvAmt)} ${recvMeta.name} for ${formatBigInt(giveAmt)} ${giveMeta.name}!`;
    setLastTransactionBanner(msg);
    onNotifyToast?.(msg);
  };

  const handleExecuteArbitrageOpportunity = (opp: CurioArbitrageOpportunity) => {
    const buyCost = BigInt(opp.bestBuyNode.buyPrice);
    const canAfford = isGodImmune || resources[opp.costResource] >= buyCost;
    if (!canAfford) return;

    sound.playUpgradeFanfare();
    const netProfitBigInt = BigInt(Math.max(1, opp.netSpreadPerUnit));
    const resMeta = RESOURCE_LABELS[opp.costResource];
    const routeSummary = `Buy @ ${opp.bestBuyNode.merchantName} (${opp.bestBuyNode.x}, ${opp.bestBuyNode.z}) → Sell @ ${opp.bestSellNode.merchantName} (${opp.bestSellNode.x}, ${opp.bestSellNode.z})`;

    onExecuteArbitrageTrade?.(opp.costResource, netProfitBigInt, routeSummary);
    setArbitrageExecutionCounts((prev) => ({
      ...prev,
      [opp.itemId]: (prev[opp.itemId] ?? 0) + 1,
    }));

    const msg = `⚡ Arbitrage Route Settled [${opp.itemName}]: ${routeSummary} · Net Profit +${formatBigInt(netProfitBigInt)} ${resMeta.name} (+${opp.roiPct}% ROI)!`;
    setLastTransactionBanner(msg);
    onNotifyToast?.(msg);
  };

  return (
    <div
      data-testid="marketplace-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:pt-16 sm:pr-24 bg-black/70 pointer-events-none animate-in fade-in duration-200"
    >
      <div className="pointer-events-auto relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-amber-100">
                Imperial Grand Marketplace &amp; Merchant Guild
              </h2>
              <p className="text-xs text-slate-400">
                Commodity Exchange · P2P Trade · 7-Day D3 Price Alerts · Open-World Arbitrage Finder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="marketplace-create-price-alert-btn"
              onClick={() => {
                sound.playSwing();
                handleOpenPriceAlertModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BellPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Create Price Alert</span>
              {priceAlerts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {priceAlerts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="marketplace-close-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Marketplace"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Treasury Summary Strip & Tax Immunity Status */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-200 tabular-nums">
            <span>🌲 {formatBigInt(resources.wood)}</span>
            <span className="text-slate-600">·</span>
            <span>🌾 {formatBigInt(resources.grain)}</span>
            <span className="text-slate-600">·</span>
            <span>⚔️ {formatBigInt(resources.steel)}</span>
            <span className="text-slate-600">·</span>
            <span>🪙 {formatBigInt(resources.copper)}</span>
            <span className="text-slate-600">·</span>
            <span>🛢️ {formatBigInt(resources.oil)}</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-300 font-bold">💎 {formatBigInt(resources.diamond)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isGodImmune
                ? `0% Escrow Tax (${activeAccountEmail} Marketplace Immunity)`
                : 'Standard Imperial Escrow Active'}
            </span>
          </div>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="px-6 pt-3 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            data-testid="marketplace-tab-exchange"
            onClick={() => {
              sound.playSwing();
              setActiveTab('exchange');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'exchange'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Commodity Exchange ({BULK_EXCHANGE_OFFERS.length})</span>
          </button>

          <button
            type="button"
            data-testid="marketplace-tab-p2p"
            onClick={() => {
              sound.playSwing();
              setActiveTab('p2p');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'p2p'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              Player-to-Player Trade ({p2pListings.filter((l) => l.status === 'open').length})
            </span>
          </button>

          <button
            type="button"
            data-testid="marketplace-tab-caravan"
            onClick={() => {
              sound.playSwing();
              setActiveTab('caravan');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'caravan'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Caravan Barter</span>
          </button>

          <button
            type="button"
            data-testid="marketplace-tab-curios"
            onClick={() => {
              sound.playSwing();
              setActiveTab('curios');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'curios'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Scrolls &amp; Curios (7D D3)</span>
          </button>

          <button
            type="button"
            data-testid="marketplace-tab-arbitrage"
            onClick={() => {
              sound.playSwing();
              setActiveTab('arbitrage');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'arbitrage'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Arbitrage Finder ({arbitrageOpportunities.length})</span>
          </button>
        </div>

        {/* Optional Transaction / Price Alert Confirmation Banner */}
        {lastTransactionBanner && (
          <div
            data-testid="marketplace-tx-banner"
            className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lastTransactionBanner}</span>
            </span>
            <button
              type="button"
              onClick={() => setLastTransactionBanner(null)}
              className="text-emerald-300 hover:text-white text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-200">
          {activeTab === 'exchange' && (
            <div className="space-y-5">
              {/* Bulk Trade Liquidity Score Matrix */}
              <div
                data-testid="marketplace-liquidity-panel"
                className="rounded-2xl bg-slate-950/90 border border-amber-500/35 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold font-cinzel text-amber-200 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-amber-400" />
                      <span>Bulk Trade Liquidity Score Matrix</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calculates execution speed from live NPC stock &amp; average daily trade
                      volume to guide bulk orders.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    {(['all', 'Bulk Exchange', 'Caravan Barter', 'Curio Market'] as const).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          data-testid={`liquidity-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => setLiquidityCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            liquidityCategoryFilter === cat
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {cat === 'all' ? 'All Items' : cat}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      data-testid="liquidity-sort-btn"
                      onClick={() => setLiquiditySortDesc((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>{liquiditySortDesc ? 'Highest Score' : 'Lowest Score'}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table
                    data-testid="marketplace-liquidity-table"
                    className="w-full text-left text-xs border-collapse"
                  >
                    <thead>
                      <tr className="bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-4">Item / Pair</th>
                        <th className="py-2.5 px-3 text-right">NPC Stock</th>
                        <th className="py-2.5 px-3 text-right">Avg Daily Vol</th>
                        <th className="py-2.5 px-3">Est. Speed</th>
                        <th className="py-2.5 px-3">Liquidity Score</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {visibleLiquidityRows.map((row) => {
                        const bulkMatch =
                          row.targetTab === 'exchange'
                            ? BULK_EXCHANGE_OFFERS.find((o) => o.id === row.id)
                            : undefined;
                        const canBulkExecute =
                          bulkMatch &&
                          row.liquidity.npcStock > 0 &&
                          (isGodImmune ||
                            resources[bulkMatch.costResource] >= bulkMatch.costAmount);

                        return (
                          <tr
                            key={`${row.targetTab}-${row.id}`}
                            data-testid={`liquidity-row-${row.id}`}
                            className="hover:bg-slate-900/50 transition-colors"
                          >
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-white">{row.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {row.category} · {row.pairSummary}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                              {row.liquidity.npcStock}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                              {row.liquidity.avgDailyVolume}/day
                            </td>
                            <td className="py-2.5 px-3 font-mono text-cyan-300 whitespace-nowrap">
                              {row.liquidity.estimatedTradeSpeed}
                            </td>
                            <td className="py-2.5 px-3">
                              <LiquidityScoreCell
                                liquidity={row.liquidity}
                                testId={`liquidity-score-${row.id}`}
                              />
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              {bulkMatch ? (
                                <button
                                  type="button"
                                  data-testid={`liquidity-quick-trade-${row.id}`}
                                  disabled={!canBulkExecute}
                                  onClick={() => {
                                    sound.playUpgradeFanfare();
                                    onExecuteBulkExchange(bulkMatch);
                                    setBulkExecutionCounts((prev) => ({
                                      ...prev,
                                      [bulkMatch.id]: (prev[bulkMatch.id] ?? 0) + 1,
                                    }));
                                    const rewardMeta = RESOURCE_LABELS[bulkMatch.rewardResource];
                                    const msg = `Settled ${bulkMatch.title}: +${formatBigInt(bulkMatch.rewardAmount)} ${rewardMeta.name}`;
                                    setLastTransactionBanner(msg);
                                    onNotifyToast?.(msg);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                    canBulkExecute
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {row.liquidity.npcStock <= 0 ? 'Depleted' : 'Bulk Trade'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  data-testid={`liquidity-goto-${row.id}`}
                                  onClick={() => {
                                    sound.playSwing();
                                    setActiveTab(row.targetTab);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-200 text-[11px] font-bold cursor-pointer"
                                >
                                  Open {row.targetTab === 'caravan' ? 'Caravan' : 'Curios'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BULK_EXCHANGE_OFFERS.map((offer) => {
                  const costMeta = RESOURCE_LABELS[offer.costResource];
                  const rewardMeta = RESOURCE_LABELS[offer.rewardResource];
                  const baseLiq = BULK_EXCHANGE_LIQUIDITY_BASELINE[offer.id] ?? {
                    npcStock: 20,
                    avgDailyVolume: 100,
                  };
                  const usedCount = bulkExecutionCounts[offer.id] ?? 0;
                  const liveStock = Math.max(0, baseLiq.npcStock - usedCount);
                  const liveLiquidity = computeItemLiquidityScore({
                    npcStock: liveStock,
                    avgDailyVolume: baseLiq.avgDailyVolume + usedCount,
                  });
                  const canAfford =
                    liveStock > 0 &&
                    (isGodImmune || resources[offer.costResource] >= offer.costAmount);
                  const tierStyle = LIQUIDITY_TIER_STYLES[liveLiquidity.tier];

                  return (
                    <div
                      key={offer.id}
                      data-testid={`marketplace-offer-${offer.id}`}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-white font-cinzel">
                            {offer.title}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{offer.subtitle}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold shrink-0 ${tierStyle.badge}`}
                        >
                          Liq {liveLiquidity.score}/100 · {liveLiquidity.estimatedTradeSpeed}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                        <span>NPC Stock: {liveLiquidity.npcStock}</span>
                        <span>Avg Daily Vol: {liveLiquidity.avgDailyVolume}/day</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/70">
                        <div className="text-xs font-mono tabular-nums">
                          <span className="text-slate-400">Pay: </span>
                          <span className="text-amber-300 font-bold">
                            {costMeta.icon} {formatBigInt(offer.costAmount)} {costMeta.name}
                          </span>
                          <span className="mx-1.5 text-slate-500">→</span>
                          <span className="text-emerald-300 font-bold">
                            {rewardMeta.icon} +{formatBigInt(offer.rewardAmount)} {rewardMeta.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          data-testid={`marketplace-buy-${offer.id}`}
                          disabled={!canAfford}
                          onClick={() => {
                            sound.playUpgradeFanfare();
                            onExecuteBulkExchange(offer);
                            setBulkExecutionCounts((prev) => ({
                              ...prev,
                              [offer.id]: (prev[offer.id] ?? 0) + 1,
                            }));
                            const msg = `Settled ${offer.title}: +${formatBigInt(offer.rewardAmount)} ${rewardMeta.name}`;
                            setLastTransactionBanner(msg);
                            onNotifyToast?.(msg);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {liveStock <= 0 ? 'Depleted' : 'Exchange'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'p2p' && (
            <div className="space-y-4" data-testid="marketplace-p2p-panel">
              {/* Direct Player-to-Player Trade & Order Book Composer */}
              <div
                data-testid="marketplace-p2p-composer"
                className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold font-cinzel text-amber-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Direct Player-to-Player (P2P) Escrow Desk</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Propose an instant peer-to-peer resource swap with online Realm Lords or match
                      open listings below.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                    0% Peer Escrow Fee
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <label className="space-y-1 block">
                    <span className="text-slate-400">Counterparty Player</span>
                    <select
                      data-testid="p2p-peer-select"
                      value={p2pPeerIndex}
                      onChange={(e) => setP2pPeerIndex(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100"
                    >
                      {PEER_LORDS.map((peer, idx) => (
                        <option key={peer.name} value={idx}>
                          {peer.speciesIcon} [{peer.clanTag}] {peer.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="space-y-1">
                    <span className="text-slate-400 block">You Send</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        data-testid="p2p-offer-resource-select"
                        value={p2pOfferResource}
                        onChange={(e) => setP2pOfferResource(e.target.value as ResourceType)}
                        className="px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-200"
                      >
                        {(Object.keys(RESOURCE_LABELS) as ResourceType[]).map((resKey) => (
                          <option key={resKey} value={resKey}>
                            {RESOURCE_LABELS[resKey].icon} {RESOURCE_LABELS[resKey].name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        data-testid="p2p-offer-amount-input"
                        min={1}
                        value={p2pOfferAmount}
                        onChange={(e) => setP2pOfferAmount(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block">You Receive</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        data-testid="p2p-request-resource-select"
                        value={p2pRequestResource}
                        onChange={(e) => setP2pRequestResource(e.target.value as ResourceType)}
                        className="px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-200"
                      >
                        {(Object.keys(RESOURCE_LABELS) as ResourceType[]).map((resKey) => (
                          <option key={resKey} value={resKey}>
                            {RESOURCE_LABELS[resKey].icon} {RESOURCE_LABELS[resKey].name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        data-testid="p2p-request-amount-input"
                        min={1}
                        value={p2pRequestAmount}
                        onChange={(e) => setP2pRequestAmount(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="marketplace-p2p-post-btn"
                    onClick={() => handleExecuteDirectP2PTrade('orderbook')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-200 text-xs font-bold cursor-pointer"
                  >
                    Post &amp; Match on Order Book
                  </button>
                  <button
                    type="button"
                    data-testid="marketplace-p2p-instant-btn"
                    onClick={() => handleExecuteDirectP2PTrade('instant')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Execute Instant P2P Trade
                  </button>
                </div>
              </div>

              {/* Open Peer-to-Peer Order Book Listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {p2pListings.map((listing) => {
                  const offerMeta = RESOURCE_LABELS[listing.offeredResource];
                  const reqMeta = RESOURCE_LABELS[listing.requestedResource];
                  const isOpen = listing.status === 'open';
                  const canAfford =
                    isOpen &&
                    (isGodImmune ||
                      resources[listing.requestedResource] >= listing.requestedAmount);

                  return (
                    <div
                      key={listing.id}
                      data-testid={`marketplace-p2p-listing-${listing.id}`}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{listing.sellerSpeciesIcon}</span>
                          <div>
                            <div className="text-sm font-bold text-white font-cinzel">
                              [{listing.sellerClanTag}] {listing.sellerName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {isOpen
                                ? 'Verified Realm Lord · Instant Escrow'
                                : `Settled with ${listing.completedBy ?? playerName}`}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isOpen ? 'OPEN P2P' : 'SETTLED'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/70">
                        <div className="text-xs font-mono tabular-nums">
                          <span className="text-slate-400">Send: </span>
                          <span className="text-amber-300 font-bold">
                            {reqMeta.icon} {formatBigInt(listing.requestedAmount)} {reqMeta.name}
                          </span>
                          <span className="mx-1.5 text-slate-500">→</span>
                          <span className="text-emerald-300 font-bold">
                            {offerMeta.icon} +{formatBigInt(listing.offeredAmount)} {offerMeta.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          data-testid={`marketplace-p2p-accept-${listing.id}`}
                          disabled={!canAfford}
                          onClick={() => handleAcceptP2PListing(listing)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            canAfford
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isOpen ? 'Accept Trade' : 'Completed'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'caravan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold font-cinzel text-amber-200">
                    {merchantNpc ? merchantNpc.name : 'Caravan Master Zane'} · Traveling Silk &amp;
                    Gem Convoy
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {merchantNpc?.dialogue?.[0] ||
                      'High-yield Caravan Barter desk directly linked to the Command Centre.'}
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 shrink-0 tabular-nums">
                  Pos: ({merchantNpc?.x ?? 10}, {merchantNpc?.z ?? 12})
                </span>
              </div>

              {/* Caravan Barter Liquidity Score Table */}
              <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/35 overflow-hidden">
                <div className="overflow-x-auto">
                  <table
                    data-testid="caravan-liquidity-table"
                    className="w-full text-left text-xs border-collapse"
                  >
                    <thead>
                      <tr className="bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-4">Caravan Barter Lot</th>
                        <th className="py-2.5 px-3 text-right">NPC Stock</th>
                        <th className="py-2.5 px-3 text-right">Avg Daily Vol</th>
                        <th className="py-2.5 px-3">Est. Speed</th>
                        <th className="py-2.5 px-4">Liquidity Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {(merchantNpc?.tradeOffers || []).map((offer) => {
                        const avgVol = CARAVAN_DAILY_VOLUME_BASELINE[offer.id] ?? 60;
                        const liq = computeItemLiquidityScore({
                          npcStock: offer.stock,
                          avgDailyVolume: avgVol,
                        });
                        return (
                          <tr key={offer.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-4 font-semibold text-white">{offer.label}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                              {offer.stock}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                              {avgVol}/day
                            </td>
                            <td className="py-2.5 px-3 font-mono text-cyan-300 whitespace-nowrap">
                              {liq.estimatedTradeSpeed}
                            </td>
                            <td className="py-2.5 px-4">
                              <LiquidityScoreCell
                                liquidity={liq}
                                testId={`caravan-liquidity-score-${offer.id}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(merchantNpc?.tradeOffers || []).map((offer) => {
                  const costMeta = RESOURCE_LABELS[offer.giveResource];
                  const rewardMeta = RESOURCE_LABELS[offer.receiveType];
                  const avgVol = CARAVAN_DAILY_VOLUME_BASELINE[offer.id] ?? 60;
                  const liq = computeItemLiquidityScore({
                    npcStock: offer.stock,
                    avgDailyVolume: avgVol,
                  });
                  const liqStyle = LIQUIDITY_TIER_STYLES[liq.tier];
                  const canTrade =
                    offer.stock > 0 &&
                    (isGodImmune || resources[offer.giveResource] >= offer.giveAmount);

                  return (
                    <div
                      key={offer.id}
                      data-testid={`marketplace-caravan-${offer.id}`}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-white">{offer.label}</div>
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${liqStyle.badge}`}
                          >
                            Liq {liq.score}/100
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 tabular-nums">
                          Stock: {offer.stock} · Avg Vol: {avgVol}/day
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-700/70">
                        <div className="text-xs font-mono tabular-nums">
                          <span className="text-amber-300">
                            {costMeta.icon} {formatBigInt(offer.giveAmount)}
                          </span>
                          <span className="mx-1.5 text-slate-500">→</span>
                          <span className="text-emerald-300 font-bold">
                            {rewardMeta.icon} +{formatBigInt(offer.receiveAmount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          data-testid={`marketplace-caravan-btn-${offer.id}`}
                          disabled={!canTrade}
                          onClick={() => {
                            if (!merchantNpc) return;
                            sound.playUpgradeFanfare();
                            onExecuteNPCTrade(merchantNpc.id, offer);
                            setLastTransactionBanner(`Executed Caravan Barter: ${offer.label}`);
                          }}
                          className={`w-full px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            canTrade
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {offer.stock <= 0 ? 'Sold Out' : 'Execute Barter'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'curios' && (
            <div className="space-y-4" data-testid="marketplace-curios-panel">
              {/* Price Alert Configurator Drawer */}
              {isPriceAlertPanelOpen && (
                <div
                  data-testid="marketplace-price-alert-panel"
                  className="p-4 rounded-2xl bg-slate-950/95 border border-amber-400/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold font-cinzel text-amber-200">
                        Configure Curio Market Price Alert
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPriceAlertPanelOpen(false)}
                      className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <label className="space-y-1 block">
                      <span className="text-slate-400">Curio Market Item</span>
                      <select
                        data-testid="price-alert-item-select"
                        value={selectedAlertItemId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          setSelectedAlertItemId(nextId);
                          setAlertTargetPriceInput(String(liveCurioPrices[nextId] ?? 1200));
                        }}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      >
                        {CURIO_MARKET_ITEMS.map((ci) => (
                          <option key={ci.id} value={ci.id}>
                            {ci.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-slate-400">Trigger Condition</span>
                      <select
                        data-testid="price-alert-condition-select"
                        value={alertCondition}
                        onChange={(e) =>
                          setAlertCondition(e.target.value as 'at_or_below' | 'at_or_above')
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-200"
                      >
                        <option value="at_or_above">At or Above (≥ Trend Breakout)</option>
                        <option value="at_or_below">At or Below (≤ Dip Threshold)</option>
                      </select>
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-slate-400">
                        Target Price (Current:{' '}
                        {formatBigInt(BigInt(liveCurioPrices[selectedAlertItemId] ?? 1200))})
                      </span>
                      <input
                        type="number"
                        data-testid="price-alert-target-input"
                        min={1}
                        value={alertTargetPriceInput}
                        onChange={(e) => setAlertTargetPriceInput(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white tabular-nums"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                      {priceAlerts.map((al) => (
                        <span
                          key={al.id}
                          data-testid={`active-price-alert-pill-${al.itemId}`}
                          className={`px-2 py-0.5 rounded-lg border ${
                            al.triggered
                              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                              : 'bg-slate-900 border-amber-500/40 text-amber-200'
                          }`}
                        >
                          {al.itemName.split(' ')[0]} {al.condition === 'at_or_below' ? '≤' : '≥'}
                          {formatBigInt(BigInt(al.targetPrice))}{' '}
                          {al.triggered ? '(TRIGGERED)' : '(ARMED)'}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="price-alert-simulate-trend-btn"
                        onClick={handleSimulateMarketTickTowardAlerts}
                        className="px-3 py-1.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/60 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Simulate Market Trend Tick</span>
                      </button>

                      <button
                        type="button"
                        data-testid="price-alert-submit-btn"
                        onClick={handleCreatePriceAlert}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Set Price Alert
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700 tabular-nums">
                <div className="flex flex-wrap items-center gap-4">
                  <span>📜 Veteran Scrolls Owned: {veteranScrollsOwned}</span>
                  <span>✨ Spirit Stones Owned: {formatBigInt(spiritStonesOwned)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-testid="curios-open-arbitrage-btn"
                    onClick={() => {
                      sound.playSwing();
                      setActiveTab('arbitrage');
                    }}
                    className="text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Radar className="w-3.5 h-3.5" />
                    <span>Open Arbitrage Finder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPriceAlertModal()}
                    className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <BellPlus className="w-3.5 h-3.5" />
                    <span>Configure Target Alerts ({priceAlerts.length})</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CURIO_MARKET_ITEMS.map((item) => {
                  const costMeta = RESOURCE_LABELS[item.costResource];
                  const canAfford = isGodImmune || resources[item.costResource] >= item.costAmount;
                  const purchasesCount = curioPurchaseCounts[item.id] ?? 0;
                  const priceAdjustment = curioPriceAdjustments[item.id] ?? 0;
                  const activeAlert = priceAlerts.find((a) => a.itemId === item.id);
                  const curioLiqRow = liquidityRows.find(
                    (r) => r.targetTab === 'curios' && r.id === item.id
                  );
                  const curioLiqStyle = curioLiqRow
                    ? LIQUIDITY_TIER_STYLES[curioLiqRow.liquidity.tier]
                    : null;

                  return (
                    <div
                      key={item.id}
                      data-testid={`marketplace-curio-${item.id}`}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white font-cinzel">
                            {item.name}
                          </span>
                          {curioLiqRow && curioLiqStyle && (
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${curioLiqStyle.badge}`}
                            >
                              Liq {curioLiqRow.liquidity.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{item.description}</p>
                        {curioLiqRow && (
                          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between tabular-nums">
                            <span>NPC Stock: {curioLiqRow.liquidity.npcStock}</span>
                            <span>
                              Avg Vol: {curioLiqRow.liquidity.avgDailyVolume}/d ·{' '}
                              {curioLiqRow.liquidity.estimatedTradeSpeed}
                            </span>
                          </div>
                        )}

                        {/* D3 7-Day Price Trend Sparkline + Target Alert Line */}
                        <CurioPriceSparkline
                          item={item}
                          sessionPurchasesCount={purchasesCount}
                          priceAdjustmentDelta={priceAdjustment}
                          activeAlert={activeAlert}
                          onOpenAlertForItem={handleOpenPriceAlertModal}
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-700/70">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="text-amber-300 font-bold">
                            {costMeta.icon} {formatBigInt(item.costAmount)} {costMeta.name}
                          </span>
                          <span className="text-cyan-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {item.badgeText}
                          </span>
                        </div>

                        <button
                          type="button"
                          data-testid={`marketplace-curio-buy-${item.id}`}
                          disabled={!canAfford}
                          onClick={() => {
                            sound.playUpgradeFanfare();
                            onPurchaseCurioItem(item);
                            const nextCount = (curioPurchaseCounts[item.id] ?? 0) + 1;
                            const nextCounts = {
                              ...curioPurchaseCounts,
                              [item.id]: nextCount,
                            };
                            setCurioPurchaseCounts(nextCounts);

                            const nextGeo = computeCurioSparklineD3({
                              itemId: item.id,
                              sessionPurchasesCount: nextCount,
                              priceAdjustmentDelta: curioPriceAdjustments[item.id] ?? 0,
                            });
                            const updatedPrices = {
                              ...liveCurioPrices,
                              [item.id]: nextGeo.latestPrice,
                            };
                            checkAndTriggerAlerts(priceAlerts, updatedPrices);

                            setLastTransactionBanner(`Purchased ${item.name} (${item.badgeText})!`);
                          }}
                          className={`w-full px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Purchase Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'arbitrage' && (
            <div className="space-y-4" data-testid="marketplace-arbitrage-panel">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold font-cinzel text-emerald-300 flex items-center gap-2">
                    <Radar className="w-4 h-4 text-emerald-400" />
                    <span>Open-World Curio Arbitrage Finder</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scans real-time Curio price discrepancies across all 4 open-world NPC merchant
                    nodes to highlight Buy-Low / Sell-High trade routes.
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-300 bg-amber-500/15 border border-amber-500/40 px-3 py-1 rounded-xl">
                  4 Active NPC Nodes Scanned
                </span>
              </div>

              <div className="space-y-4">
                {arbitrageOpportunities.map((opp) => {
                  const resMeta = RESOURCE_LABELS[opp.costResource];
                  const canAfford =
                    isGodImmune || resources[opp.costResource] >= BigInt(opp.bestBuyNode.buyPrice);

                  return (
                    <div
                      key={opp.itemId}
                      data-testid={`arbitrage-card-${opp.itemId}`}
                      className="p-4 rounded-2xl bg-slate-800/75 border border-slate-700 space-y-3"
                    >
                      {/* Top Header: Item Name + Optimal Spread Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
                        <div>
                          <div className="text-sm font-bold font-cinzel text-white flex items-center gap-2">
                            <span>{opp.itemName}</span>
                            <span className="text-[11px] font-mono text-cyan-300">
                              ({opp.badgeText})
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>
                              Optimal Route: Buy @{' '}
                              <strong className="text-emerald-300">
                                {opp.bestBuyNode.merchantName}
                              </strong>{' '}
                              ({opp.bestBuyNode.x}, {opp.bestBuyNode.z})
                            </span>
                            <span>→</span>
                            <span>
                              Sell @{' '}
                              <strong className="text-amber-300">
                                {opp.bestSellNode.merchantName}
                              </strong>{' '}
                              ({opp.bestSellNode.x}, {opp.bestSellNode.z})
                            </span>
                            <span className="text-slate-500">·</span>
                            <span>Distance: {opp.routeDistanceMeters}m</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            data-testid={`arbitrage-spread-${opp.itemId}`}
                            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-xs font-mono font-bold tabular-nums"
                          >
                            +{formatBigInt(BigInt(opp.netSpreadPerUnit))} {resMeta.icon} (+
                            {opp.roiPct}% ROI)
                          </span>

                          <button
                            type="button"
                            data-testid={`arbitrage-execute-btn-${opp.itemId}`}
                            disabled={!canAfford}
                            onClick={() => handleExecuteArbitrageOpportunity(opp)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                              canAfford
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Execute Arbitrage
                          </button>
                        </div>
                      </div>

                      {/* 4-Node NPC Price Discrepancy Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {opp.quotes.map((quote) => (
                          <div
                            key={quote.nodeId}
                            data-testid={`arbitrage-quote-${opp.itemId}-${quote.nodeId}`}
                            className={`p-2.5 rounded-xl border text-xs font-mono space-y-1 ${
                              quote.isLowestBuy
                                ? 'bg-emerald-950/60 border-emerald-400/80 text-emerald-100'
                                : quote.isHighestSell
                                  ? 'bg-amber-950/60 border-amber-400/80 text-amber-100'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate text-white">
                                {quote.merchantName}
                              </span>
                              {quote.isLowestBuy && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 text-[9px] font-black shrink-0">
                                  LOWEST BUY
                                </span>
                              )}
                              {quote.isHighestSell && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black shrink-0">
                                  HIGHEST SELL
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">
                                {quote.regionName} ({quote.x}, {quote.z})
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 tabular-nums text-[11px]">
                              <span>
                                Buy:{' '}
                                <strong
                                  className={
                                    quote.isLowestBuy ? 'text-emerald-300' : 'text-slate-200'
                                  }
                                >
                                  {resMeta.icon} {formatBigInt(BigInt(quote.buyPrice))}
                                </strong>
                              </span>
                              <span>
                                Sell:{' '}
                                <strong
                                  className={
                                    quote.isHighestSell ? 'text-amber-300' : 'text-slate-200'
                                  }
                                >
                                  {resMeta.icon} {formatBigInt(BigInt(quote.sellPrice))}
                                </strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
