/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as d3 from 'd3';
import { GameResources, NPC, ResourceType } from '../types/game';

export interface CurioPriceHistoryPoint {
  dayIndex: number; // 0..6 (0 = 6 days ago, 6 = Today)
  dayLabel: string; // 'D-6' .. 'Today'
  price: number;
  volume: number;
}

export interface PositionedCurioSparklinePoint extends CurioPriceHistoryPoint {
  x: number;
  y: number;
  isMin: boolean;
  isMax: boolean;
  isLatest: boolean;
}

export interface CurioSparklineD3Geometry {
  itemId: string;
  width: number;
  height: number;
  linePath: string;
  areaPath: string;
  meanY: number;
  targetAlertY: number | null;
  minPrice: number;
  maxPrice: number;
  meanPrice: number;
  startPrice: number;
  latestPrice: number;
  sevenDayDeltaPct: number;
  trendDirection: 'bullish' | 'bearish' | 'stable';
  points: PositionedCurioSparklinePoint[];
}

export interface CurioPriceAlert {
  id: string;
  itemId: string;
  itemName: string;
  costResource: 'copper' | 'diamond';
  targetPrice: number;
  condition: 'at_or_below' | 'at_or_above';
  triggered: boolean;
  createdAtMs: number;
}

export interface PlayerToPlayerTradeListing {
  id: string;
  sellerName: string;
  sellerClanTag: string;
  sellerSpeciesIcon: string;
  offeredResource: ResourceType;
  offeredAmount: bigint;
  requestedResource: ResourceType;
  requestedAmount: bigint;
  status: 'open' | 'completed';
  isPlayerCreated?: boolean;
  completedBy?: string;
}

export interface CurioMerchantNodeQuote {
  nodeId: string;
  merchantName: string;
  merchantRole: string;
  regionName: string;
  x: number;
  z: number;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  isLowestBuy: boolean;
  isHighestSell: boolean;
}

export interface CurioArbitrageOpportunity {
  itemId: string;
  itemName: string;
  costResource: 'copper' | 'diamond';
  badgeText: string;
  quotes: CurioMerchantNodeQuote[];
  bestBuyNode: CurioMerchantNodeQuote;
  bestSellNode: CurioMerchantNodeQuote;
  netSpreadPerUnit: number;
  roiPct: number;
  routeDistanceMeters: number;
  totalPotentialProfit: number;
}

export const INITIAL_P2P_TRADE_LISTINGS: readonly PlayerToPlayerTradeListing[] = [
  {
    id: 'p2p_seraphina_steel_wood',
    sellerName: 'Lady Seraphina',
    sellerClanTag: 'VALKYR',
    sellerSpeciesIcon: '🐉',
    offeredResource: 'steel',
    offeredAmount: 120_000n,
    requestedResource: 'wood',
    requestedAmount: 95_000n,
    status: 'open',
  },
  {
    id: 'p2p_kaelen_diamond_copper',
    sellerName: 'Lord Kaelen',
    sellerClanTag: 'IRON',
    sellerSpeciesIcon: '🛡️',
    offeredResource: 'diamond',
    offeredAmount: 2_500n,
    requestedResource: 'copper',
    requestedAmount: 300_000n,
    status: 'open',
  },
  {
    id: 'p2p_zhao_oil_grain',
    sellerName: 'Elder Zhao',
    sellerClanTag: 'LOTUS',
    sellerSpeciesIcon: '🦊',
    offeredResource: 'oil',
    offeredAmount: 180_000n,
    requestedResource: 'grain',
    requestedAmount: 140_000n,
    status: 'open',
  },
  {
    id: 'p2p_thorne_copper_diamond',
    sellerName: 'Vanguard Thorne',
    sellerClanTag: 'ASTRAL',
    sellerSpeciesIcon: '⚡',
    offeredResource: 'copper',
    offeredAmount: 400_000n,
    requestedResource: 'diamond',
    requestedAmount: 1_800n,
    status: 'open',
  },
] as const;

export const CURIO_SEVEN_DAY_PRICE_HISTORY: Readonly<
  Record<string, readonly CurioPriceHistoryPoint[]>
> = {
  curio_veteran_scroll_bundle: [
    { dayIndex: 0, dayLabel: 'D-6', price: 1050, volume: 42 },
    { dayIndex: 1, dayLabel: 'D-5', price: 1080, volume: 51 },
    { dayIndex: 2, dayLabel: 'D-4', price: 1120, volume: 64 },
    { dayIndex: 3, dayLabel: 'D-3', price: 1095, volume: 48 },
    { dayIndex: 4, dayLabel: 'D-2', price: 1150, volume: 73 },
    { dayIndex: 5, dayLabel: 'D-1', price: 1180, volume: 85 },
    { dayIndex: 6, dayLabel: 'Today', price: 1200, volume: 96 },
  ],
  curio_spirit_stone_coffer: [
    { dayIndex: 0, dayLabel: 'D-6', price: 132000, volume: 110 },
    { dayIndex: 1, dayLabel: 'D-5', price: 129500, volume: 124 },
    { dayIndex: 2, dayLabel: 'D-4', price: 126000, volume: 138 },
    { dayIndex: 3, dayLabel: 'D-3', price: 128000, volume: 119 },
    { dayIndex: 4, dayLabel: 'D-2', price: 124500, volume: 145 },
    { dayIndex: 5, dayLabel: 'D-1', price: 122000, volume: 162 },
    { dayIndex: 6, dayLabel: 'Today', price: 120000, volume: 180 },
  ],
  curio_imperial_war_crate: [
    { dayIndex: 0, dayLabel: 'D-6', price: 1890, volume: 28 },
    { dayIndex: 1, dayLabel: 'D-5', price: 1920, volume: 34 },
    { dayIndex: 2, dayLabel: 'D-4', price: 1875, volume: 31 },
    { dayIndex: 3, dayLabel: 'D-3', price: 1940, volume: 45 },
    { dayIndex: 4, dayLabel: 'D-2', price: 1965, volume: 52 },
    { dayIndex: 5, dayLabel: 'D-1', price: 1980, volume: 60 },
    { dayIndex: 6, dayLabel: 'Today', price: 2000, volume: 68 },
  ],
};

/**
 * Computes D3 SVG sparkline paths, scales, and 7-day statistical metrics
 * for a Curio Market Item over the last 7 days.
 */
export function computeCurioSparklineD3(params: {
  itemId: string;
  history?: readonly CurioPriceHistoryPoint[];
  width?: number;
  height?: number;
  paddingX?: number;
  paddingY?: number;
  sessionPurchasesCount?: number;
  priceAdjustmentDelta?: number;
  targetAlertPrice?: number | null;
}): CurioSparklineD3Geometry {
  const {
    itemId,
    width = 240,
    height = 64,
    paddingX = 8,
    paddingY = 8,
    sessionPurchasesCount = 0,
    priceAdjustmentDelta = 0,
    targetAlertPrice = null,
  } = params;

  const baseSeries =
    params.history && params.history.length > 0
      ? params.history
      : CURIO_SEVEN_DAY_PRICE_HISTORY[itemId] || [
          { dayIndex: 0, dayLabel: 'D-6', price: 1000, volume: 10 },
          { dayIndex: 1, dayLabel: 'D-5', price: 1020, volume: 12 },
          { dayIndex: 2, dayLabel: 'D-4', price: 1010, volume: 11 },
          { dayIndex: 3, dayLabel: 'D-3', price: 1040, volume: 15 },
          { dayIndex: 4, dayLabel: 'D-2', price: 1060, volume: 18 },
          { dayIndex: 5, dayLabel: 'D-1', price: 1080, volume: 20 },
          { dayIndex: 6, dayLabel: 'Today', price: 1100, volume: 25 },
        ];

  const series: CurioPriceHistoryPoint[] = baseSeries.map((pt, idx) => {
    if (idx === baseSeries.length - 1) {
      const demandBump =
        sessionPurchasesCount > 0 ? Math.round(pt.price * 0.015 * sessionPurchasesCount) : 0;
      const adjustedPrice = Math.max(1, Math.round(pt.price + demandBump + priceAdjustmentDelta));
      return {
        ...pt,
        price: adjustedPrice,
        volume: pt.volume + sessionPurchasesCount,
      };
    }
    return { ...pt };
  });

  const seriesMin = d3.min(series, (d) => d.price) ?? 0;
  const seriesMax = d3.max(series, (d) => d.price) ?? 1;
  const minPrice =
    typeof targetAlertPrice === 'number' && targetAlertPrice > 0
      ? Math.min(seriesMin, targetAlertPrice)
      : seriesMin;
  const maxPrice =
    typeof targetAlertPrice === 'number' && targetAlertPrice > 0
      ? Math.max(seriesMax, targetAlertPrice)
      : seriesMax;

  const meanPrice = d3.mean(series, (d) => d.price) ?? seriesMin;
  const domainSpan = Math.max(1, maxPrice - minPrice);

  const xScale = d3
    .scaleLinear()
    .domain([0, Math.max(1, series.length - 1)])
    .range([paddingX, width - paddingX]);

  const yScale = d3
    .scaleLinear()
    .domain([minPrice - domainSpan * 0.12, maxPrice + domainSpan * 0.12])
    .range([height - paddingY, paddingY]);

  const lineGenerator = d3
    .line<CurioPriceHistoryPoint>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.price))
    .curve(d3.curveMonotoneX);

  const areaGenerator = d3
    .area<CurioPriceHistoryPoint>()
    .x((_, i) => xScale(i))
    .y0(height - paddingY)
    .y1((d) => yScale(d.price))
    .curve(d3.curveMonotoneX);

  const linePath = lineGenerator(series) ?? '';
  const areaPath = areaGenerator(series) ?? '';

  const startPrice = series[0]?.price ?? 1;
  const latestPrice = series[series.length - 1]?.price ?? startPrice;
  const sevenDayDeltaPct =
    startPrice > 0 ? Number((((latestPrice - startPrice) / startPrice) * 100).toFixed(1)) : 0;

  const trendDirection: 'bullish' | 'bearish' | 'stable' =
    sevenDayDeltaPct > 0.2 ? 'bullish' : sevenDayDeltaPct < -0.2 ? 'bearish' : 'stable';

  const points: PositionedCurioSparklinePoint[] = series.map((pt, idx) => ({
    ...pt,
    x: Number(xScale(idx).toFixed(2)),
    y: Number(yScale(pt.price).toFixed(2)),
    isMin: pt.price === seriesMin,
    isMax: pt.price === seriesMax,
    isLatest: idx === series.length - 1,
  }));

  const targetAlertY =
    typeof targetAlertPrice === 'number' && targetAlertPrice > 0
      ? Number(yScale(targetAlertPrice).toFixed(2))
      : null;

  return {
    itemId,
    width,
    height,
    linePath,
    areaPath,
    meanY: Number(yScale(meanPrice).toFixed(2)),
    targetAlertY,
    minPrice: seriesMin,
    maxPrice: seriesMax,
    meanPrice: Math.round(meanPrice),
    startPrice,
    latestPrice,
    sevenDayDeltaPct,
    trendDirection,
    points,
  };
}

/**
 * Evaluates active Curio Price Alerts against current live market prices
 * and returns updated alerts plus any newly triggered alerts.
 */
export function evaluateCurioPriceAlerts(params: {
  alerts: readonly CurioPriceAlert[];
  livePricesByItemId: Readonly<Record<string, number>>;
}): {
  updatedAlerts: CurioPriceAlert[];
  newlyTriggered: CurioPriceAlert[];
} {
  const { alerts, livePricesByItemId } = params;
  const newlyTriggered: CurioPriceAlert[] = [];

  const updatedAlerts = alerts.map((alert) => {
    if (alert.triggered) return alert;
    const currentPrice = livePricesByItemId[alert.itemId];
    if (typeof currentPrice !== 'number') return alert;

    const reached =
      alert.condition === 'at_or_below'
        ? currentPrice <= alert.targetPrice
        : currentPrice >= alert.targetPrice;

    if (reached) {
      const triggeredAlert: CurioPriceAlert = { ...alert, triggered: true };
      newlyTriggered.push(triggeredAlert);
      return triggeredAlert;
    }
    return alert;
  });

  return { updatedAlerts, newlyTriggered };
}

/**
 * Executes a Player-to-Player (P2P) resource trade with escrow validation.
 */
export function settlePlayerToPlayerTrade(params: {
  resources: GameResources;
  listing: PlayerToPlayerTradeListing;
  isGodImmune: boolean;
  buyerName: string;
}): {
  success: boolean;
  updatedResources: GameResources;
  updatedListing: PlayerToPlayerTradeListing;
  message: string;
} {
  const { resources, listing, isGodImmune, buyerName } = params;

  if (listing.status !== 'open') {
    return {
      success: false,
      updatedResources: resources,
      updatedListing: listing,
      message: 'This P2P trade listing has already been settled.',
    };
  }

  if (!isGodImmune && resources[listing.requestedResource] < listing.requestedAmount) {
    return {
      success: false,
      updatedResources: resources,
      updatedListing: listing,
      message: `Insufficient ${listing.requestedResource.toUpperCase()} to settle P2P trade with ${listing.sellerName}.`,
    };
  }

  const nextResources: GameResources = {
    ...resources,
    [listing.requestedResource]: isGodImmune
      ? resources[listing.requestedResource]
      : resources[listing.requestedResource] - listing.requestedAmount,
    [listing.offeredResource]: resources[listing.offeredResource] + listing.offeredAmount,
  };

  const nextListing: PlayerToPlayerTradeListing = {
    ...listing,
    status: 'completed',
    completedBy: buyerName,
  };

  return {
    success: true,
    updatedResources: nextResources,
    updatedListing: nextListing,
    message: `🤝 P2P Trade Settled with [${listing.sellerClanTag}] ${listing.sellerName}: Received +${listing.offeredAmount.toLocaleString()} ${listing.offeredResource.toUpperCase()}!`,
  };
}

interface RawMerchantPricingSpec {
  nodeId: string;
  defaultName: string;
  defaultRole: string;
  regionName: string;
  defaultX: number;
  defaultZ: number;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

const CURIO_MERCHANT_NODE_PRICING: Readonly<
  Record<
    string,
    {
      itemName: string;
      costResource: 'copper' | 'diamond';
      badgeText: string;
      nodes: readonly RawMerchantPricingSpec[];
    }
  >
> = {
  curio_veteran_scroll_bundle: {
    itemName: 'Immortal Veteran Scroll Folio (×3)',
    costResource: 'diamond',
    badgeText: '+3 Scrolls',
    nodes: [
      {
        nodeId: 'npc_elder',
        defaultName: 'Arch-Mage Eldrin',
        defaultRole: 'elder',
        regionName: 'Arcane Observatory',
        defaultX: 10,
        defaultZ: 14,
        buyPrice: 1020,
        sellPrice: 1080,
        stock: 6,
      },
      {
        nodeId: 'npc_merchant_zane',
        defaultName: 'Caravan Master Zane',
        defaultRole: 'merchant',
        regionName: 'Solara Trade Road',
        defaultX: -6,
        defaultZ: 18,
        buyPrice: 1200,
        sellPrice: 1240,
        stock: 5,
      },
      {
        nodeId: 'npc_blacksmith',
        defaultName: 'Gorim Forgehammer',
        defaultRole: 'blacksmith',
        regionName: 'Runic Forge Outcrop',
        defaultX: -10,
        defaultZ: 14,
        buyPrice: 1260,
        sellPrice: 1190,
        stock: 4,
      },
      {
        nodeId: 'npc_marshal',
        defaultName: 'High Marshal Valerius',
        defaultRole: 'marshal',
        regionName: 'Citadel Inner Keep',
        defaultX: 0,
        defaultZ: 9,
        buyPrice: 1390,
        sellPrice: 1350,
        stock: 8,
      },
    ],
  },
  curio_spirit_stone_coffer: {
    itemName: 'Nine-Heavens Spirit Stone Coffer',
    costResource: 'copper',
    badgeText: '+50K Spirit Stones',
    nodes: [
      {
        nodeId: 'npc_blacksmith',
        defaultName: 'Gorim Forgehammer',
        defaultRole: 'blacksmith',
        regionName: 'Runic Forge Outcrop',
        defaultX: -10,
        defaultZ: 14,
        buyPrice: 98000,
        sellPrice: 102000,
        stock: 7,
      },
      {
        nodeId: 'npc_merchant_zane',
        defaultName: 'Caravan Master Zane',
        defaultRole: 'merchant',
        regionName: 'Solara Trade Road',
        defaultX: -6,
        defaultZ: 18,
        buyPrice: 120000,
        sellPrice: 125000,
        stock: 5,
      },
      {
        nodeId: 'npc_marshal',
        defaultName: 'High Marshal Valerius',
        defaultRole: 'marshal',
        regionName: 'Citadel Inner Keep',
        defaultX: 0,
        defaultZ: 9,
        buyPrice: 128000,
        sellPrice: 122000,
        stock: 4,
      },
      {
        nodeId: 'npc_elder',
        defaultName: 'Arch-Mage Eldrin',
        defaultRole: 'elder',
        regionName: 'Arcane Observatory',
        defaultX: 10,
        defaultZ: 14,
        buyPrice: 142000,
        sellPrice: 138000,
        stock: 6,
      },
    ],
  },
  curio_imperial_war_crate: {
    itemName: 'Imperial Command Centre Supply Crate',
    costResource: 'diamond',
    badgeText: 'Full Resource Crate',
    nodes: [
      {
        nodeId: 'npc_merchant_zane',
        defaultName: 'Caravan Master Zane',
        defaultRole: 'merchant',
        regionName: 'Solara Trade Road',
        defaultX: -6,
        defaultZ: 18,
        buyPrice: 1720,
        sellPrice: 1790,
        stock: 5,
      },
      {
        nodeId: 'npc_elder',
        defaultName: 'Arch-Mage Eldrin',
        defaultRole: 'elder',
        regionName: 'Arcane Observatory',
        defaultX: 10,
        defaultZ: 14,
        buyPrice: 2000,
        sellPrice: 1940,
        stock: 4,
      },
      {
        nodeId: 'npc_blacksmith',
        defaultName: 'Gorim Forgehammer',
        defaultRole: 'blacksmith',
        regionName: 'Runic Forge Outcrop',
        defaultX: -10,
        defaultZ: 14,
        buyPrice: 2080,
        sellPrice: 2020,
        stock: 4,
      },
      {
        nodeId: 'npc_marshal',
        defaultName: 'High Marshal Valerius',
        defaultRole: 'marshal',
        regionName: 'Citadel Inner Keep',
        defaultX: 0,
        defaultZ: 9,
        buyPrice: 2290,
        sellPrice: 2240,
        stock: 6,
      },
    ],
  },
};

/**
 * Computes open-world Arbitrage Finder opportunities across NPC merchant nodes
 * for all Curio Market Items, highlighting the lowest buy node, highest sell node,
 * net spread per unit, ROI %, and real-time route distance.
 */
export function computeCurioArbitrageOpportunities(params?: {
  npcs?: readonly NPC[];
  executedCountByItemId?: Readonly<Record<string, number>>;
}): CurioArbitrageOpportunity[] {
  const npcs = params?.npcs ?? [];
  const executedMap = params?.executedCountByItemId ?? {};

  return Object.entries(CURIO_MERCHANT_NODE_PRICING).map(([itemId, spec]) => {
    const executions = executedMap[itemId] ?? 0;

    // Resolve live NPC coordinates if present
    const rawQuotes = spec.nodes.map((nodeSpec) => {
      const liveNpc = npcs.find((n) => n.id === nodeSpec.nodeId);
      const x = liveNpc ? Math.round(liveNpc.x) : nodeSpec.defaultX;
      const z = liveNpc ? Math.round(liveNpc.z) : nodeSpec.defaultZ;
      const merchantName = liveNpc ? liveNpc.name : nodeSpec.defaultName;

      // Slight spread tightening as arbitrage is executed
      const buyBump = executions > 0 ? Math.round(nodeSpec.buyPrice * 0.01 * executions) : 0;
      return {
        nodeId: nodeSpec.nodeId,
        merchantName,
        merchantRole: nodeSpec.defaultRole,
        regionName: nodeSpec.regionName,
        x,
        z,
        buyPrice: nodeSpec.buyPrice + buyBump,
        sellPrice: nodeSpec.sellPrice,
        stock: Math.max(1, nodeSpec.stock - executions),
      };
    });

    const minBuy = d3.min(rawQuotes, (q) => q.buyPrice) ?? 0;
    const maxSell = d3.max(rawQuotes, (q) => q.sellPrice) ?? 0;

    const quotes: CurioMerchantNodeQuote[] = rawQuotes.map((q) => ({
      ...q,
      isLowestBuy: q.buyPrice === minBuy,
      isHighestSell: q.sellPrice === maxSell,
    }));

    const bestBuyNode = quotes.find((q) => q.isLowestBuy) ?? quotes[0];
    const bestSellNode = quotes.find((q) => q.isHighestSell) ?? quotes[quotes.length - 1];

    const netSpreadPerUnit = Math.max(0, bestSellNode.sellPrice - bestBuyNode.buyPrice);
    const roiPct =
      bestBuyNode.buyPrice > 0
        ? Number(((netSpreadPerUnit / bestBuyNode.buyPrice) * 100).toFixed(1))
        : 0;
    const routeDistanceMeters = Math.round(
      Math.hypot(bestSellNode.x - bestBuyNode.x, bestSellNode.z - bestBuyNode.z)
    );

    return {
      itemId,
      itemName: spec.itemName,
      costResource: spec.costResource,
      badgeText: spec.badgeText,
      quotes,
      bestBuyNode,
      bestSellNode,
      netSpreadPerUnit,
      roiPct,
      routeDistanceMeters,
      totalPotentialProfit: netSpreadPerUnit * bestBuyNode.stock,
    };
  });
}

export type LiquidityTier = 'Instant' | 'High' | 'Moderate' | 'Low' | 'Illiquid';

export interface LiquidityScoreResult {
  score: number; // 0..100
  tier: LiquidityTier;
  npcStock: number;
  avgDailyVolume: number;
  turnoverRatio: number;
  clearanceDays: number | null;
  estimatedTradeSpeed: string;
  bulkTradeAdvice: string;
}

export interface MarketplaceLiquidityRow {
  id: string;
  name: string;
  category: 'Bulk Exchange' | 'Caravan Barter' | 'Curio Market';
  targetTab: 'exchange' | 'caravan' | 'curios';
  pairSummary: string;
  liquidity: LiquidityScoreResult;
}

export const BULK_EXCHANGE_LIQUIDITY_BASELINE: Readonly<
  Record<string, { npcStock: number; avgDailyVolume: number }>
> = {
  ex_wood_to_copper: { npcStock: 42, avgDailyVolume: 210 },
  ex_grain_to_steel: { npcStock: 36, avgDailyVolume: 175 },
  ex_steel_to_oil: { npcStock: 28, avgDailyVolume: 130 },
  ex_copper_to_diamond: { npcStock: 18, avgDailyVolume: 92 },
  ex_diamond_to_all_pack: { npcStock: 22, avgDailyVolume: 115 },
  ex_oil_to_diamond: { npcStock: 12, avgDailyVolume: 48 },
};

export const CARAVAN_DAILY_VOLUME_BASELINE: Readonly<Record<string, number>> = {
  trade_wood_for_diamonds: 85,
  trade_grain_for_oil: 96,
  trade_steel_for_diamonds: 58,
};

/**
 * Computes a 0-100 Liquidity Score indicating how quickly an item can be traded
 * based on current NPC stock and average daily trade volume, helping users
 * decide on bulk trades.
 */
export function computeItemLiquidityScore(params: {
  npcStock: number;
  avgDailyVolume: number;
}): LiquidityScoreResult {
  const npcStock = Math.max(0, Math.floor(Number.isFinite(params.npcStock) ? params.npcStock : 0));
  const avgDailyVolume = Math.max(
    0,
    Math.round(Number.isFinite(params.avgDailyVolume) ? params.avgDailyVolume : 0)
  );

  if (npcStock <= 0 || avgDailyVolume <= 0) {
    return {
      score: 0,
      tier: 'Illiquid',
      npcStock,
      avgDailyVolume,
      turnoverRatio: 0,
      clearanceDays: null,
      estimatedTradeSpeed: npcStock <= 0 ? 'Out of Stock' : 'No Volume',
      bulkTradeAdvice:
        npcStock <= 0
          ? 'NPC stock depleted — wait for caravan restock'
          : 'Insufficient daily trade volume for bulk orders',
    };
  }

  const volumeDepthScore = 55 * (avgDailyVolume / (avgDailyVolume + 40));
  const stockDepthScore = 30 * (npcStock / (npcStock + 5));
  const turnoverRatio = Number((avgDailyVolume / Math.max(1, npcStock)).toFixed(2));
  const velocityScore = 15 * Math.min(1, turnoverRatio / 10);

  const score = Math.max(
    1,
    Math.min(100, Math.round(volumeDepthScore + stockDepthScore + velocityScore))
  );
  const clearanceDays = Number((npcStock / avgDailyVolume).toFixed(2));

  let tier: LiquidityTier;
  let estimatedTradeSpeed: string;
  let bulkTradeAdvice: string;

  if (score >= 80) {
    tier = 'Instant';
    estimatedTradeSpeed = '< 5 min';
    bulkTradeAdvice = 'Optimal for full bulk trades (minimal slippage)';
  } else if (score >= 60) {
    tier = 'High';
    estimatedTradeSpeed = '~15 min';
    bulkTradeAdvice = 'Bulk friendly — clears rapidly across NPC desks';
  } else if (score >= 40) {
    tier = 'Moderate';
    estimatedTradeSpeed = '~1–2 hrs';
    bulkTradeAdvice = 'Split large bulk orders into 2–3 batches';
  } else {
    tier = 'Low';
    estimatedTradeSpeed = '~6+ hrs';
    bulkTradeAdvice = 'Thin NPC stock — execute small lots only';
  }

  return {
    score,
    tier,
    npcStock,
    avgDailyVolume,
    turnoverRatio,
    clearanceDays,
    estimatedTradeSpeed,
    bulkTradeAdvice,
  };
}

/**
 * Builds unified Marketplace Liquidity rows across Bulk Exchange offers,
 * Caravan Barter NPC offers, and Curio Market items.
 */
export function computeMarketplaceLiquidityRows(params: {
  bulkOffers: readonly {
    id: string;
    title: string;
    costResource: ResourceType;
    costAmount: bigint;
    rewardResource: ResourceType;
    rewardAmount: bigint;
  }[];
  bulkExecutionsById?: Readonly<Record<string, number>>;
  caravanOffers?: readonly {
    id: string;
    label: string;
    stock: number;
  }[];
  curioItems: readonly {
    id: string;
    name: string;
    costResource: 'copper' | 'diamond';
    costAmount: bigint;
  }[];
  curioSessionPurchasesById?: Readonly<Record<string, number>>;
  arbitrageExecutionsById?: Readonly<Record<string, number>>;
}): MarketplaceLiquidityRow[] {
  const bulkExec = params.bulkExecutionsById ?? {};
  const curioPurch = params.curioSessionPurchasesById ?? {};
  const arbExec = params.arbitrageExecutionsById ?? {};

  const rows: MarketplaceLiquidityRow[] = [];

  for (const offer of params.bulkOffers) {
    const base = BULK_EXCHANGE_LIQUIDITY_BASELINE[offer.id] ?? {
      npcStock: 20,
      avgDailyVolume: 100,
    };
    const used = bulkExec[offer.id] ?? 0;
    const npcStock = Math.max(0, base.npcStock - used);
    const avgDailyVolume = base.avgDailyVolume + used;
    rows.push({
      id: offer.id,
      name: offer.title,
      category: 'Bulk Exchange',
      targetTab: 'exchange',
      pairSummary: `${offer.costResource.toUpperCase()} → ${offer.rewardResource.toUpperCase()}`,
      liquidity: computeItemLiquidityScore({ npcStock, avgDailyVolume }),
    });
  }

  for (const caravan of params.caravanOffers ?? []) {
    const avgDailyVolume = CARAVAN_DAILY_VOLUME_BASELINE[caravan.id] ?? 60;
    rows.push({
      id: caravan.id,
      name: caravan.label,
      category: 'Caravan Barter',
      targetTab: 'caravan',
      pairSummary: 'NPC Caravan Stock',
      liquidity: computeItemLiquidityScore({
        npcStock: caravan.stock,
        avgDailyVolume,
      }),
    });
  }

  for (const curio of params.curioItems) {
    const history = CURIO_SEVEN_DAY_PRICE_HISTORY[curio.id] ?? [];
    const baseAvgVol = d3.mean(history, (h) => h.volume) ?? 50;
    const extraPurchases = curioPurch[curio.id] ?? 0;
    const arbCount = arbExec[curio.id] ?? 0;

    const nodeSpec = CURIO_MERCHANT_NODE_PRICING[curio.id];
    const totalNodeStock = nodeSpec
      ? nodeSpec.nodes.reduce((sum, n) => sum + Math.max(1, n.stock - arbCount), 0)
      : 12;
    const npcStock = Math.max(0, totalNodeStock - extraPurchases);
    const avgDailyVolume = Math.round(baseAvgVol + extraPurchases / 7);

    rows.push({
      id: curio.id,
      name: curio.name,
      category: 'Curio Market',
      targetTab: 'curios',
      pairSummary: `${curio.costResource.toUpperCase()} Curio`,
      liquidity: computeItemLiquidityScore({ npcStock, avgDailyVolume }),
    });
  }

  return rows;
}
