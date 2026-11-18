/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURIO_SEVEN_DAY_PRICE_HISTORY,
  CurioPriceAlert,
  INITIAL_P2P_TRADE_LISTINGS,
  computeCurioArbitrageOpportunities,
  computeCurioSparklineD3,
  evaluateCurioPriceAlerts,
  settlePlayerToPlayerTrade,
} from './marketplaceSparklineD3';

describe('Marketplace Curio 7-Day D3 Sparkline, Price Alerts, P2P Trade & Arbitrage Engine', () => {
  it('computes valid D3 SVG linePath, areaPath, and 7-day trend metrics for all Curio items', () => {
    const itemIds = Object.keys(CURIO_SEVEN_DAY_PRICE_HISTORY);
    assert.equal(itemIds.length, 3);

    for (const itemId of itemIds) {
      const geo = computeCurioSparklineD3({ itemId, width: 240, height: 64 });
      assert.equal(geo.itemId, itemId);
      assert.equal(geo.points.length, 7);
      assert.ok(geo.linePath.startsWith('M'), `Expected valid SVG path for ${itemId}`);
      assert.ok(geo.areaPath.startsWith('M'), `Expected valid SVG area path for ${itemId}`);
      assert.ok(geo.minPrice <= geo.meanPrice && geo.meanPrice <= geo.maxPrice);
      assert.equal(geo.points[0].dayLabel, 'D-6');
      assert.equal(geo.points[6].dayLabel, 'Today');
      assert.equal(geo.points[6].isLatest, true);
    }
  });

  it('distinguishes bullish and bearish 7-day Curio price trends accurately', () => {
    const scrollSparkline = computeCurioSparklineD3({
      itemId: 'curio_veteran_scroll_bundle',
    });
    assert.equal(scrollSparkline.trendDirection, 'bullish');
    assert.ok(scrollSparkline.sevenDayDeltaPct > 0);

    const cofferSparkline = computeCurioSparklineD3({
      itemId: 'curio_spirit_stone_coffer',
    });
    assert.equal(cofferSparkline.trendDirection, 'bearish');
    assert.ok(cofferSparkline.sevenDayDeltaPct < 0);
  });

  it('applies session purchase demand pressure and targetAlertPrice Y-coordinate accurately', () => {
    const baseline = computeCurioSparklineD3({
      itemId: 'curio_imperial_war_crate',
      sessionPurchasesCount: 0,
      targetAlertPrice: 2050,
    });
    const afterPurchases = computeCurioSparklineD3({
      itemId: 'curio_imperial_war_crate',
      sessionPurchasesCount: 2,
      targetAlertPrice: 2050,
    });

    assert.ok(afterPurchases.latestPrice > baseline.latestPrice);
    assert.equal(afterPurchases.points[6].volume, baseline.points[6].volume + 2);
    assert.equal(typeof baseline.targetAlertY, 'number');
  });

  it('evaluates Curio Price Alerts and triggers when market trend reaches threshold', () => {
    const alerts: CurioPriceAlert[] = [
      {
        id: 'alert_1',
        itemId: 'curio_veteran_scroll_bundle',
        itemName: 'Immortal Veteran Scroll Folio (×3)',
        costResource: 'diamond',
        targetPrice: 1220,
        condition: 'at_or_above',
        triggered: false,
        createdAtMs: 1000,
      },
      {
        id: 'alert_2',
        itemId: 'curio_spirit_stone_coffer',
        itemName: 'Nine-Heavens Spirit Stone Coffer',
        costResource: 'copper',
        targetPrice: 118000,
        condition: 'at_or_below',
        triggered: false,
        createdAtMs: 1000,
      },
    ];

    const step1 = evaluateCurioPriceAlerts({
      alerts,
      livePricesByItemId: {
        curio_veteran_scroll_bundle: 1200,
        curio_spirit_stone_coffer: 120000,
      },
    });
    assert.equal(step1.newlyTriggered.length, 0);

    const step2 = evaluateCurioPriceAlerts({
      alerts: step1.updatedAlerts,
      livePricesByItemId: {
        curio_veteran_scroll_bundle: 1235,
        curio_spirit_stone_coffer: 117500,
      },
    });
    assert.equal(step2.newlyTriggered.length, 2);
    assert.equal(step2.updatedAlerts[0].triggered, true);
    assert.equal(step2.updatedAlerts[1].triggered, true);
  });

  it('settles Player-to-Player (P2P) trades accurately', () => {
    const initialResources = {
      wood: 200_000n,
      grain: 200_000n,
      steel: 100_000n,
      copper: 500_000n,
      oil: 100_000n,
      diamond: 5_000n,
    };

    const listing = INITIAL_P2P_TRADE_LISTINGS[0];
    const result = settlePlayerToPlayerTrade({
      resources: initialResources,
      listing,
      isGodImmune: false,
      buyerName: 'Aiden Skyrender',
    });

    assert.equal(result.success, true);
    assert.equal(result.updatedResources.wood, 105_000n);
    assert.equal(result.updatedResources.steel, 220_000n);
    assert.equal(result.updatedListing.status, 'completed');
    assert.equal(result.updatedListing.completedBy, 'Aiden Skyrender');
  });

  it('identifies positive price discrepancies across open-world NPC merchant nodes in Arbitrage Finder', () => {
    const opportunities = computeCurioArbitrageOpportunities();
    assert.equal(opportunities.length, 3);

    for (const opp of opportunities) {
      assert.equal(opp.quotes.length, 4);
      assert.ok(opp.bestBuyNode.isLowestBuy);
      assert.ok(opp.bestSellNode.isHighestSell);
      assert.ok(opp.netSpreadPerUnit > 0, `Expected positive spread for ${opp.itemId}`);
      assert.ok(opp.roiPct > 25, `Expected >25% arbitrage ROI for ${opp.itemId}`);
      assert.ok(opp.routeDistanceMeters > 0);
    }
  });
});
