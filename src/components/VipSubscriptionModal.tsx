/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle2,
  Gift,
  FastForward,
  ShieldCheck,
  RefreshCw,
  Award,
  Coins,
} from 'lucide-react';
import {
  BillingCycle,
  PersistedVipSubscriptionState,
  VIP_TIER_LIST,
  VipSubscriptionEvaluation,
  VipTierConfig,
  VipTierId,
} from '../game/vipSubscription';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface VipSubscriptionModalProps {
  vipState: PersistedVipSubscriptionState;
  evaluation: VipSubscriptionEvaluation;
  playerDiamonds: bigint;
  onActivateTier: (
    tierId: VipTierId,
    billingCycle: BillingCycle,
    paymentMethod: 'store_pass' | 'diamonds'
  ) => void;
  onClaimDailyStipend: () => void;
  onAdvanceSimulatedVipDay: () => void;
  onToggleAutoRenew: () => void;
  onCancelSubscription: () => void;
  onClose: () => void;
}

export const VipSubscriptionModal: React.FC<VipSubscriptionModalProps> = ({
  vipState,
  evaluation,
  playerDiamonds,
  onActivateTier,
  onClaimDailyStipend,
  onAdvanceSimulatedVipDay,
  onToggleAutoRenew,
  onCancelSubscription,
  onClose,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(vipState.billingCycle);

  const activeTierConfig = evaluation.tierConfig;
  const activeStipend = activeTierConfig.dailyStipend;

  const getTierBorderStyle = (tier: VipTierConfig, isCurrent: boolean) => {
    if (isCurrent) {
      return 'border-amber-400 bg-slate-900/95 shadow-lg shadow-amber-500/15';
    }
    switch (tier.accentColor) {
      case 'purple':
        return 'border-purple-500/40 bg-slate-950/90 hover:border-purple-400';
      case 'amber':
        return 'border-amber-500/40 bg-slate-950/90 hover:border-amber-400';
      case 'cyan':
        return 'border-cyan-500/40 bg-slate-950/90 hover:border-cyan-400';
      default:
        return 'border-slate-800 bg-slate-950/80 hover:border-slate-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-modal-title"
    >
      <div className="relative w-full max-w-6xl max-h-[95vh] flex flex-col rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="vip-modal-title"
                className="text-base sm:text-lg font-black font-cinzel tracking-wide text-amber-300"
              >
                IMPERIAL VIP MEMBER SUBSCRIPTION &amp; IMMORTAL COVENANT
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Active Status: {activeTierConfig.name}</span>
                <span aria-hidden="true">·</span>
                <span
                  className="font-mono tabular-nums text-amber-300"
                  data-testid="vip-active-badge"
                >
                  {activeTierConfig.badgeLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-cyan-300">
                  VIP Loyalty Lv.{evaluation.vipLoyaltyLevel} (+{evaluation.loyaltyCombatBonusPct}%
                  Might)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono tabular-nums flex items-center gap-2">
              <span className="text-slate-400">Treasury:</span>
              <span className="text-cyan-300 font-bold" data-testid="vip-modal-diamonds">
                💎 {formatBigInt(playerDiamonds)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playSwing();
                onClose();
              }}
              aria-label="Close VIP Member Subscription Modal"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {/* Top Summary Strip: Loyalty Progress + Daily VIP Stipend Chest */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* Left 5 Cols: Active Subscription Status & Loyalty Level */}
            <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Current Membership Privilege
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                    {evaluation.isActiveSubscriber
                      ? `${vipState.expiresAtDaysRemaining} Days Remaining`
                      : 'Permanent Free Tier'}
                  </span>
                </div>
                <div className="text-base font-bold font-cinzel text-white">
                  {activeTierConfig.name}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono tabular-nums">
                  <span>
                    Cultivation: {evaluation.totalEffectiveCultivationMultiplier.toFixed(2)}x
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Harvest: {evaluation.totalEffectiveGatherMultiplier.toFixed(2)}x</span>
                  <span aria-hidden="true">·</span>
                  <span>Might: {evaluation.totalEffectiveCombatMultiplier.toFixed(2)}x</span>
                  <span aria-hidden="true">·</span>
                  <span>Castle Cost: -{activeTierConfig.perks.castleUpgradeDiscountPct}%</span>
                </div>
              </div>

              {/* VIP Loyalty Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    VIP Loyalty Lv.{evaluation.vipLoyaltyLevel} / 15
                  </span>
                  <span className="text-slate-400">
                    {vipState.vipLoyaltyPoints.toLocaleString()} /{' '}
                    {evaluation.nextLevelPointsRequired.toLocaleString()} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${evaluation.currentLevelProgressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Loyalty points never expire and grant a permanent{' '}
                  <span className="text-emerald-300 font-mono tabular-nums">
                    +{evaluation.loyaltyCombatBonusPct}%
                  </span>{' '}
                  All-Troop Might bonus across all realms.
                </p>
              </div>
            </div>

            {/* Right 7 Cols: Daily VIP Imperial Stipend Chest */}
            <div className="lg:col-span-7 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 flex flex-col justify-between space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold font-cinzel text-amber-200 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    Daily VIP Imperial Stipend Chest ({activeTierConfig.name})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Claim once every calendar day for Diamonds, Spirit Stones, Veteran Scrolls, and
                    Kingdom Rations.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-300">
                  Total Stipends Claimed:{' '}
                  <strong className="text-amber-300" data-testid="vip-stipends-claimed">
                    {vipState.totalStipendsClaimed}
                  </strong>
                </span>
              </div>

              {/* Stipend Rewards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono tabular-nums">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Diamonds</div>
                  <div className="text-cyan-300 font-bold">
                    +{formatBigInt(activeStipend.diamonds)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Spirit Stones</div>
                  <div className="text-purple-300 font-bold">
                    +{formatBigInt(activeStipend.spiritStones)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Veteran Scrolls</div>
                  <div className="text-amber-300 font-bold">
                    +{activeStipend.veteranScrolls} Scroll
                    {activeStipend.veteranScrolls === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Secluded Years</div>
                  <div className="text-emerald-300 font-bold">+{activeStipend.secludedYears}y</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-slate-400 text-[10px]">Wood / Steel</div>
                  <div className="text-slate-200 font-bold">
                    +{formatBigInt(activeStipend.resources.wood)}
                  </div>
                </div>
              </div>

              {/* Claim & Simulate Next Day Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  data-testid="claim-vip-stipend-btn"
                  disabled={!evaluation.canClaimDailyStipend}
                  onClick={() => {
                    sound.playUpgradeFanfare();
                    onClaimDailyStipend();
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold font-cinzel flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    evaluation.canClaimDailyStipend
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {evaluation.canClaimDailyStipend ? (
                    <>
                      <Gift className="w-4 h-4" />
                      Claim Daily VIP Stipend (+{activeTierConfig.vipPointsPerDay} VIP Pts)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Daily Stipend Claimed Today
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-testid="simulate-next-vip-day-btn"
                  onClick={() => {
                    sound.playSwing();
                    onAdvanceSimulatedVipDay();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5 text-amber-400" />
                  Simulate Next Day (+1d)
                </button>
              </div>
            </div>
          </div>

          {/* Billing Cycle Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">
                01. Choose Billing Duration &amp; Covenant Tier
              </h3>
              <p className="text-xs text-slate-400">
                Activate instantly via Store Pass or exchange in-game Diamonds from your Citadel
                treasury.
              </p>
            </div>

            <div
              className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800"
              role="group"
              aria-label="Billing Cycle Selection"
            >
              <button
                type="button"
                data-testid="vip-cycle-monthly-btn"
                onClick={() => {
                  sound.playSwing();
                  setSelectedCycle('monthly');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCycle === 'monthly'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Monthly Pass (30 Days)
              </button>
              <button
                type="button"
                data-testid="vip-cycle-annual-btn"
                onClick={() => {
                  sound.playSwing();
                  setSelectedCycle('annual');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCycle === 'annual'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Annual Covenant (365 Days · Save 20% + 3x Bonus)
              </button>
            </div>
          </div>

          {/* 4-Column VIP Tier Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
            {VIP_TIER_LIST.map((tier) => {
              const isCurrent = activeTierConfig.id === tier.id;
              const diamondCost =
                selectedCycle === 'annual' ? tier.annualDiamondCost : tier.monthlyDiamondCost;
              const priceLabel =
                selectedCycle === 'annual'
                  ? `${tier.annualPriceUsd} / yr`
                  : `${tier.monthlyPriceUsd} / mo`;
              const instantBonus =
                selectedCycle === 'annual'
                  ? tier.instantActivationDiamonds * 3n
                  : tier.instantActivationDiamonds;
              const canAffordDiamonds = playerDiamonds >= diamondCost;

              return (
                <div
                  key={tier.id}
                  data-testid={`vip-tier-card-${tier.id}`}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ${getTierBorderStyle(
                    tier,
                    isCurrent
                  )}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {tier.badgeLabel}
                      </span>
                      {isCurrent && (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          ACTIVE PLAN
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold font-cinzel text-white">{tier.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{tier.subtitle}</p>
                    </div>

                    {/* Price & Instant Activation Bonus */}
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                      <div className="text-base font-black font-mono tabular-nums text-white">
                        {priceLabel}
                      </div>
                      {tier.id !== 'free' ? (
                        <div className="text-[11px] font-mono tabular-nums text-cyan-300">
                          Instant: +{formatBigInt(instantBonus)} 💎 &amp; +
                          {selectedCycle === 'annual'
                            ? tier.instantVipPoints * 3
                            : tier.instantVipPoints}{' '}
                          Pts
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-slate-400">
                          Included for all Citadel Lords
                        </div>
                      )}
                    </div>

                    {/* Key Multipliers Table */}
                    <div className="space-y-1 text-xs font-mono tabular-nums">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">4-Path Cultivation:</span>
                        <span className="text-amber-300 font-bold">
                          +{tier.perks.cultivationSpeedBonusPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Node Harvest Rate:</span>
                        <span className="text-emerald-300 font-bold">
                          +{tier.perks.gatherSpeedBonusPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">All-Troop Might:</span>
                        <span className="text-rose-300 font-bold">
                          +{tier.perks.combatMightBonusPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Rally Capacity:</span>
                        <span className="text-purple-300 font-bold">
                          +{tier.perks.rallyCapacityBonusPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Castle Upgrade Cost:</span>
                        <span className="text-cyan-300 font-bold">
                          -{tier.perks.castleUpgradeDiscountPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Daily Stipend:</span>
                        <span className="text-white font-bold">
                          {formatBigInt(tier.dailyStipend.diamonds)} 💎 +{' '}
                          {tier.dailyStipend.veteranScrolls} 📜
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {tier.id !== 'free' ? (
                    <div className="space-y-1.5 pt-1">
                      <button
                        type="button"
                        data-testid={`activate-vip-store-${tier.id}`}
                        onClick={() => {
                          sound.playUpgradeFanfare();
                          onActivateTier(tier.id, selectedCycle, 'store_pass');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isCurrent
                          ? `Extend ${selectedCycle === 'annual' ? '1 Year' : '30 Days'} (${priceLabel})`
                          : `Subscribe ${selectedCycle === 'annual' ? 'Annual' : 'Monthly'} (${priceLabel})`}
                      </button>

                      <button
                        type="button"
                        data-testid={`activate-vip-diamonds-${tier.id}`}
                        disabled={!canAffordDiamonds}
                        onClick={() => {
                          sound.playUpgradeFanfare();
                          onActivateTier(tier.id, selectedCycle, 'diamonds');
                        }}
                        className={`w-full py-1.5 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          canAffordDiamonds
                            ? 'bg-slate-900 hover:bg-slate-800 border-cyan-500/50 text-cyan-300'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Unlock with {formatBigInt(diamondCost)} 💎
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <div className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs font-mono text-slate-400">
                        {isCurrent ? 'Current Default Plan' : 'Always Included'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subscription Management, Auto-Renewal & Legal Terms Footer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Subscription Terms, Auto-Renewal &amp; 14-Day Refund Protection</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Per our Terms &amp; Conditions (TERMS.md) and Privacy Policy (PRIVACY.md), recurring
                VIP passes renew automatically at the end of each billing cycle unless auto-renewal
                is turned off. You may toggle auto-renewal or cancel your membership at any time
                below without penalty.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="toggle-vip-autorenew-btn"
                onClick={() => {
                  sound.playSwing();
                  onToggleAutoRenew();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Auto-Renew: {vipState.autoRenewEnabled ? 'ON' : 'OFF'}
              </button>

              {evaluation.isActiveSubscriber && (
                <button
                  type="button"
                  data-testid="cancel-vip-subscription-btn"
                  onClick={() => {
                    sound.playSwing();
                    onCancelSubscription();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/40 text-xs font-mono text-rose-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel Membership
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
