/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import confetti from 'canvas-confetti';
import type { GameResources, MonsterTarget } from '../types/game';
import type { PlayerCultivationState } from '../types/cultivation';
import { sound } from '../game/audio';
import { PRIMARY_ADMIN_EMAIL } from '../game/adminModeration';
import {
  EULA_STORAGE_KEY,
  EulaAcceptanceState,
  acceptEulaVersion,
  createInitialEulaAcceptanceState,
  revokeEulaAcceptance,
} from '../game/eula';
import {
  INITIAL_LORE_CODEX_STATE,
  LORE_CODEX_STORAGE_KEY,
  LoreCodexEntry,
  PersistedLoreCodexState,
  claimLoreCodexReward,
  comprehendLoreEpoch,
  unlockLoreCodexEntry,
} from '../game/loreHistory';

export interface UseLoreAndEulaParams {
  activeAccountEmail: string;
  monsters: MonsterTarget[];
  setResources: Dispatch<SetStateAction<GameResources>>;
  setCultivation: Dispatch<SetStateAction<PlayerCultivationState>>;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
}

export function useLoreAndEula({
  activeAccountEmail,
  monsters,
  setResources,
  setCultivation,
  setToastMessage,
}: UseLoreAndEulaParams) {
  const [eulaState, setEulaState] = useState<EulaAcceptanceState>(() => {
    try {
      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(EULA_STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<EulaAcceptanceState>;
        if (typeof parsed.accepted === 'boolean' && typeof parsed.acceptedByEmail === 'string') {
          return {
            accepted: parsed.accepted,
            acceptedVersion: parsed.acceptedVersion ?? null,
            acceptedAtIso: parsed.acceptedAtIso ?? null,
            acceptedByEmail: parsed.acceptedByEmail,
            receiptHash: parsed.receiptHash ?? null,
          };
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    return createInitialEulaAcceptanceState(PRIMARY_ADMIN_EMAIL);
  });

  const [comprehendedEpochIds, setComprehendedEpochIds] = useState<string[]>([]);
  const [loreCodexState, setLoreCodexState] = useState<PersistedLoreCodexState>(() => {
    try {
      const saved =
        typeof window !== 'undefined' ? window.localStorage.getItem(LORE_CODEX_STORAGE_KEY) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.discoveredRecords === 'object' && parsed.discoveredRecords) {
          return {
            discoveredRecords: parsed.discoveredRecords,
            lastVisitedBiomeId:
              parsed.lastVisitedBiomeId ?? INITIAL_LORE_CODEX_STATE.lastVisitedBiomeId,
            totalDiscoveryEvents:
              typeof parsed.totalDiscoveryEvents === 'number'
                ? parsed.totalDiscoveryEvents
                : Object.keys(parsed.discoveredRecords).length,
          };
        }
      }
    } catch {
      // Fallback to initial state
    }
    return INITIAL_LORE_CODEX_STATE;
  });

  const lastCodexEvalPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  useEffect(() => {
    try {
      window.localStorage.setItem(LORE_CODEX_STORAGE_KEY, JSON.stringify(loreCodexState));
    } catch {
      // Ignore storage quota errors
    }
  }, [loreCodexState]);

  const handleComprehendLoreEpoch = (epochId: string) => {
    const res = comprehendLoreEpoch({ epochId, comprehendedEpochIds });
    if (!res.newlyComprehended) {
      setToastMessage(`📜 ${res.message}`);
      return;
    }
    sound.playLevelUp();
    setComprehendedEpochIds(res.updatedComprehendedIds);
    setResources((prev) => ({
      ...prev,
      diamond: prev.diamond + res.rewardDiamonds,
    }));
    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: prev.scriptureFragments + res.rewardFragments,
    }));
    confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
    setToastMessage(`📜 ${res.message}`);
  };

  const handleScoutDiscoverCodexEntry = (entry: LoreCodexEntry) => {
    const result = unlockLoreCodexEntry({
      currentState: loreCodexState,
      entry,
      discoveredVia: 'expedition_scout',
    });
    setLoreCodexState(result.updatedState);
    if (result.newlyDiscovered) {
      sound.playLevelUp();
      setToastMessage(
        `🧭 Lore Codex Auto-Populated: ${entry.icon} ${entry.title} (${entry.kind === 'biome' ? 'Biome Surveyed' : 'Monster Bestiary Recorded'})!`
      );
    } else {
      setToastMessage(`🧭 ${entry.title} is already inscribed in your Lore Codex.`);
    }
  };

  const handleClaimCodexBounty = (entryId: string) => {
    const res = claimLoreCodexReward({
      currentState: loreCodexState,
      entryId,
      monsters,
    });
    if (!res.claimed) {
      setToastMessage(`📜 ${res.message}`);
      return;
    }
    sound.playLevelUp();
    setLoreCodexState(res.updatedState);
    setResources((prev) => ({
      ...prev,
      diamond: prev.diamond + res.rewardDiamonds,
    }));
    setCultivation((prev) => ({
      ...prev,
      scriptureFragments: prev.scriptureFragments + res.rewardFragments,
    }));
    confetti({ particleCount: 50, spread: 65, origin: { y: 0.6 } });
    setToastMessage(res.message);
  };

  const handleAcceptEula = () => {
    const next = acceptEulaVersion(activeAccountEmail);
    setEulaState(next);
    try {
      window.localStorage.setItem(EULA_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage write errors
    }
    sound.playUpgradeFanfare();
    setToastMessage(`📜 EULA Accepted (${next.receiptHash}) for ${next.acceptedByEmail}`);
  };

  const handleRevokeEula = () => {
    const next = revokeEulaAcceptance(activeAccountEmail);
    setEulaState(next);
    try {
      window.localStorage.setItem(EULA_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage write errors
    }
    setToastMessage('⚠️ EULA Acceptance Reset — Review & Accept EULA');
  };

  return {
    eulaState,
    setEulaState,
    comprehendedEpochIds,
    loreCodexState,
    setLoreCodexState,
    lastCodexEvalPosRef,
    handleComprehendLoreEpoch,
    handleScoutDiscoverCodexEntry,
    handleClaimCodexBounty,
    handleAcceptEula,
    handleRevokeEula,
  };
}
