/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, type MutableRefObject } from 'react';
import {
  GOD_FLIGHT_SPEC,
  type GodTeleportWaypointId,
  evaluateGodFlightPermission,
  evaluateGodTeleportPermission,
  executeGodTeleportJump,
} from '../game/godModeCharacter';
import { PRIMARY_ADMIN_EMAIL } from '../game/adminModeration';

export interface TeleportCommandState {
  seq: number;
  x: number;
  y: number;
  z: number;
}

export interface UseSovereignFlightAndTeleportOptions {
  activeAccountEmail: string;
  godmode: boolean;
  playerWorldPosRef: MutableRefObject<{ x: number; z: number }>;
  setHudPlayerCoords: (coords: { x: number; z: number }) => void;
  setToastMessage: (msg: string | null) => void;
}

export function useSovereignFlightAndTeleport({
  activeAccountEmail,
  godmode,
  playerWorldPosRef,
  setHudPlayerCoords,
  setToastMessage,
}: UseSovereignFlightAndTeleportOptions) {
  const [isFlying, setIsFlying] = useState<boolean>(true);
  const [flightAltitude, setFlightAltitude] = useState<number>(
    GOD_FLIGHT_SPEC.defaultCruiseAltitude
  );
  const [teleportCommand, setTeleportCommand] = useState<TeleportCommandState | null>(null);

  const godFlightPermission = evaluateGodFlightPermission(activeAccountEmail, godmode);
  const godTeleportPermission = evaluateGodTeleportPermission(activeAccountEmail, godmode);

  const handleToggleFlight = useCallback(() => {
    const perm = evaluateGodFlightPermission(activeAccountEmail, godmode);
    if (!perm.allowed) {
      setIsFlying(false);
      setFlightAltitude(0);
      setToastMessage(`🔒 ${perm.reason}`);
      return;
    }
    setIsFlying((prev) => {
      const next = !prev;
      if (next) {
        setFlightAltitude((alt) =>
          alt >= GOD_FLIGHT_SPEC.minAirborneAltitude ? alt : GOD_FLIGHT_SPEC.defaultCruiseAltitude
        );
        setToastMessage(
          `🕊️ Sovereign Divine Flight: AIRBORNE (${GOD_FLIGHT_SPEC.defaultCruiseAltitude}m · ${perm.flightSpeedMultiplier}x Speed · Citadel Wall Bypass) for ${PRIMARY_ADMIN_EMAIL}!`
        );
      } else {
        setToastMessage(`🕊️ Sovereign Divine Flight: LANDED (0.0m) for ${PRIMARY_ADMIN_EMAIL}.`);
      }
      return next;
    });
  }, [activeAccountEmail, godmode, setToastMessage]);

  const handleAdjustFlightAltitude = useCallback(
    (deltaMeters: number) => {
      const perm = evaluateGodFlightPermission(activeAccountEmail, godmode);
      if (!perm.allowed) {
        setToastMessage(`🔒 ${perm.reason}`);
        return;
      }
      setIsFlying(true);
      setFlightAltitude((prev) => {
        const base = prev > 0 ? prev : perm.defaultCruiseAltitude;
        const clamped = Math.max(
          GOD_FLIGHT_SPEC.minAirborneAltitude,
          Math.min(perm.maxAltitude, Number((base + deltaMeters).toFixed(1)))
        );
        setToastMessage(
          `🕊️ Sovereign Flight Altitude: ${clamped.toFixed(1)}m (${perm.flightSpeedMultiplier}x Speed · ${PRIMARY_ADMIN_EMAIL})`
        );
        return clamped;
      });
    },
    [activeAccountEmail, godmode, setToastMessage]
  );

  const handleSetFlightAltitude = useCallback(
    (targetAlt: number) => {
      const perm = evaluateGodFlightPermission(activeAccountEmail, godmode);
      if (!perm.allowed) {
        setToastMessage(`🔒 ${perm.reason}`);
        return;
      }
      if (targetAlt <= 0) {
        setIsFlying(false);
        setFlightAltitude(0);
        setToastMessage(`🕊️ Sovereign Divine Flight: LANDED (0.0m) for ${PRIMARY_ADMIN_EMAIL}.`);
        return;
      }
      const clamped = Math.max(
        GOD_FLIGHT_SPEC.minAirborneAltitude,
        Math.min(perm.maxAltitude, Number(targetAlt.toFixed(1)))
      );
      setIsFlying(true);
      setFlightAltitude(clamped);
      setToastMessage(
        `🕊️ Sovereign Flight Altitude Set: ${clamped.toFixed(1)}m (${perm.flightSpeedMultiplier}x Speed · ${PRIMARY_ADMIN_EMAIL})`
      );
    },
    [activeAccountEmail, godmode, setToastMessage]
  );

  const handleTeleportToWaypoint = useCallback(
    (waypointId: GodTeleportWaypointId) => {
      const perm = evaluateGodTeleportPermission(activeAccountEmail, godmode);
      const jump = executeGodTeleportJump({
        currentX: playerWorldPosRef.current.x,
        currentY: isFlying ? flightAltitude : 0,
        currentZ: playerWorldPosRef.current.z,
        mode: 'waypoint',
        waypointId,
        permission: perm,
      });
      if (!jump.teleported) {
        setToastMessage(`🔒 ${jump.reason}`);
        return;
      }
      playerWorldPosRef.current = { x: jump.nextX, z: jump.nextZ };
      setHudPlayerCoords({ x: jump.nextX, z: jump.nextZ });
      if (jump.nextY > 0) {
        setIsFlying(true);
        setFlightAltitude(jump.nextY);
      } else {
        setIsFlying(false);
        setFlightAltitude(0);
      }
      setTeleportCommand((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        x: jump.nextX,
        y: jump.nextY,
        z: jump.nextZ,
      }));
      setToastMessage(`⚡ ${jump.reason}`);
    },
    [
      activeAccountEmail,
      godmode,
      isFlying,
      flightAltitude,
      playerWorldPosRef,
      setHudPlayerCoords,
      setToastMessage,
    ]
  );

  const handleTeleportToCoordinates = useCallback(
    (targetX: number, targetY: number, targetZ: number) => {
      const perm = evaluateGodTeleportPermission(activeAccountEmail, godmode);
      const jump = executeGodTeleportJump({
        currentX: playerWorldPosRef.current.x,
        currentY: isFlying ? flightAltitude : 0,
        currentZ: playerWorldPosRef.current.z,
        mode: 'coordinates',
        targetX,
        targetY,
        targetZ,
        permission: perm,
      });
      if (!jump.teleported) {
        setToastMessage(`🔒 ${jump.reason}`);
        return;
      }
      playerWorldPosRef.current = { x: jump.nextX, z: jump.nextZ };
      setHudPlayerCoords({ x: jump.nextX, z: jump.nextZ });
      if (jump.nextY > 0) {
        setIsFlying(true);
        setFlightAltitude(jump.nextY);
      } else {
        setIsFlying(false);
        setFlightAltitude(0);
      }
      setTeleportCommand((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        x: jump.nextX,
        y: jump.nextY,
        z: jump.nextZ,
      }));
      setToastMessage(`⚡ ${jump.reason}`);
    },
    [
      activeAccountEmail,
      godmode,
      isFlying,
      flightAltitude,
      playerWorldPosRef,
      setHudPlayerCoords,
      setToastMessage,
    ]
  );

  const handleForwardBlink = useCallback(
    (facingAngleRad = Math.PI) => {
      const perm = evaluateGodTeleportPermission(activeAccountEmail, godmode);
      const jump = executeGodTeleportJump({
        currentX: playerWorldPosRef.current.x,
        currentY: isFlying ? flightAltitude : 0,
        currentZ: playerWorldPosRef.current.z,
        facingAngleRad,
        mode: 'forward_blink',
        permission: perm,
      });
      if (!jump.teleported) {
        setToastMessage(`🔒 ${jump.reason}`);
        return;
      }
      playerWorldPosRef.current = { x: jump.nextX, z: jump.nextZ };
      setHudPlayerCoords({ x: jump.nextX, z: jump.nextZ });
      setTeleportCommand((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        x: jump.nextX,
        y: jump.nextY,
        z: jump.nextZ,
      }));
      setToastMessage(`⚡ ${jump.reason}`);
    },
    [
      activeAccountEmail,
      godmode,
      isFlying,
      flightAltitude,
      playerWorldPosRef,
      setHudPlayerCoords,
      setToastMessage,
    ]
  );

  return {
    isFlying,
    setIsFlying,
    flightAltitude,
    setFlightAltitude,
    teleportCommand,
    godFlightPermission,
    godTeleportPermission,
    handleToggleFlight,
    handleAdjustFlightAltitude,
    handleSetFlightAltitude,
    handleTeleportToWaypoint,
    handleTeleportToCoordinates,
    handleForwardBlink,
  };
}
