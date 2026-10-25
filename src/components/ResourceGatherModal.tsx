/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Pickaxe, MapPin, Sparkles, ArrowRight, Lock, Crown } from 'lucide-react';
import { ResourceNode, ResourceType } from '../types/game';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { formatBigInt } from '../game/math';
import { sound } from '../game/audio';

interface ResourceGatherModalProps {
  nodes: ResourceNode[];
  weather?: WeatherType;
  maxGatherMarches?: number;
  vipBadgeLabel?: string;
  onOpenVipSubscription?: () => void;
  onDispatchGather: (nodeId: string, troopsAmount: bigint) => void;
  onHarvestCollect: (nodeId: string) => void;
  onFocusNode: (x: number, z: number) => void;
  onClose: () => void;
}

export const ResourceGatherModal: React.FC<ResourceGatherModalProps> = ({
  nodes,
  weather = 'clear',
  maxGatherMarches = 1,
  vipBadgeLabel = 'VIP 0',
  onOpenVipSubscription,
  onDispatchGather,
  onHarvestCollect,
  onFocusNode,
  onClose,
}) => {
  const weatherConfig = WEATHER_CONFIGS[weather] || WEATHER_CONFIGS.clear;
  const activeGatheringCount = nodes.filter((n) => n.assignedTroops > 0n).length;
  const isMarchQueueFull = activeGatheringCount >= maxGatherMarches;

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'wood':
        return '🌲';
      case 'steel':
        return '⚔️';
      case 'copper':
        return '🪙';
      case 'diamond':
        return '💎';
      case 'grain':
        return '🌾';
      case 'oil':
        return '🛢️';
      default:
        return '📦';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
              <Pickaxe className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-emerald-100 flex items-center gap-2 flex-wrap">
                Open World Resource Points
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono">
                  Level 1 - 10 Nodes
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                  Active Marches: {activeGatheringCount} / {maxGatherMarches} ({vipBadgeLabel})
                </span>
              </h2>
              <p className="text-xs text-emerald-200/70">
                Harvest Wood, Steel, Copper, Diamond, Grain, and Oil across the voxel map
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-200">
          {/* Dynamic Weather Harvesting Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                {weatherConfig.icon}
              </span>
              <div>
                <div className="text-xs font-bold text-white font-cinzel flex items-center gap-2">
                  <span>Atmospheric Yield Condition: {weatherConfig.name}</span>
                </div>
                <div className="text-xs text-emerald-200/90 mt-0.5">
                  {weatherConfig.gatherFlavorText}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
              <span className="text-slate-400">Atmosphere:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {weatherConfig.name}
              </span>
            </div>
          </div>

          {/* VIP March Queue Access Control Banner */}
          {isMarchQueueFull && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200 font-mono">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                March Queue Limit Reached ({activeGatheringCount}/{maxGatherMarches}). Extra
                simultaneous gathering marches require an active VIP 1+ subscription.
              </span>
              {onOpenVipSubscription && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVipSubscription();
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Crown className="w-3 h-3" /> Upgrade VIP
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.map((node) => {
              const isGathering = node.assignedTroops > 0n;
              const harvestAvailable = isGathering
                ? BigInt(
                    Math.min(
                      Number(node.totalCapacity - node.remainingCapacity + 25000n),
                      Number(node.totalCapacity)
                    )
                  )
                : 0n;
              const nodeYieldMult = weatherConfig.gatherYieldMultipliers[node.type] ?? 1.0;

              return (
                <div
                  key={node.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                        {getResourceIcon(node.type)}
                      </span>
                      <div>
                        <div className="text-base font-bold text-white capitalize flex items-center gap-2">
                          {node.type} Deposit
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                            Level {node.level} / 10
                          </span>
                          {nodeYieldMult > 1.0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold">
                              +{Math.round((nodeYieldMult - 1) * 100)}% Surge
                            </span>
                          ) : nodeYieldMult < 1.0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/50 text-rose-300 font-mono font-bold">
                              -{Math.round((1 - nodeYieldMult) * 100)}%
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          Coords: [{node.x}, {node.z}]
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onFocusNode(node.x, node.z);
                        onClose();
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      Locate <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Capacity Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Yield Capacity</span>
                      <span className="text-white font-bold">
                        {formatBigInt(node.remainingCapacity)} / {formatBigInt(node.totalCapacity)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Number((node.remainingCapacity * 100n) / (node.totalCapacity || 1n))
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Speed: {formatBigInt(node.gatherRatePerSec)}/sec</span>
                      {isGathering && (
                        <span className="text-amber-400 font-bold">
                          ⛏️ {formatBigInt(node.assignedTroops)} Troops Mining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-3">
                    {isGathering ? (
                      <button
                        onClick={() => {
                          sound.playGather();
                          onHarvestCollect(node.id);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Collect Harvest (+{formatBigInt(harvestAvailable)})
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playSwing();
                          onDispatchGather(node.id, 2500n);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          isMarchQueueFull
                            ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-500/40'
                            : 'bg-slate-700 hover:bg-slate-600 text-emerald-300 border-emerald-500/30 active:scale-95'
                        }`}
                      >
                        {isMarchQueueFull ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            March Slot Locked [VIP 1+] ({activeGatheringCount}/{maxGatherMarches})
                          </>
                        ) : (
                          <>
                            <Pickaxe className="w-3.5 h-3.5" />
                            Dispatch 2,500 Troops to Gather
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
