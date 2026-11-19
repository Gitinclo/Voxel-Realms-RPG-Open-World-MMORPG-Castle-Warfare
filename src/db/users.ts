/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { commanderProfiles, realmSaves, supportTickets, users } from './schema.ts';

export interface CommanderProfilePatch {
  commanderName?: string;
  allianceTag?: string;
  castleLevel?: number;
  cultivationRealmIndex?: number;
  vipTier?: number;
  karma?: number;
  garrisonTroopsWire?: string;
  discoveredCodexCount?: number;
  preferredRegion?: string;
  activeSector?: string;
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase() || `${uid}@voxelrealms.local`;
    const cleanName = (displayName || '').trim().slice(0, 64) || 'Sovereign Vanguard';
    const result = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        displayName: cleanName,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
          displayName: cleanName,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getCommanderProfileForUid(uid: string) {
  try {
    const rows = await db
      .select({
        profile: commanderProfiles,
        user: {
          id: users.id,
          uid: users.uid,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
        },
      })
      .from(commanderProfiles)
      .innerJoin(users, eq(commanderProfiles.userId, users.id))
      .where(eq(users.uid, uid))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed in getCommanderProfileForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertCommanderProfileForUid(
  uid: string,
  email: string,
  displayName: string | undefined,
  patch: CommanderProfilePatch
) {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    const now = new Date();
    const values = {
      userId: user.id,
      commanderName: (patch.commanderName || user.displayName || 'Sovereign Vanguard').slice(0, 48),
      allianceTag: (patch.allianceTag || 'SOL').slice(0, 6).toUpperCase(),
      castleLevel: Math.max(0, Math.min(100, Math.trunc(patch.castleLevel ?? 1))),
      cultivationRealmIndex: Math.max(
        0,
        Math.min(15, Math.trunc(patch.cultivationRealmIndex ?? 0))
      ),
      vipTier: Math.max(0, Math.min(15, Math.trunc(patch.vipTier ?? 0))),
      karma: Math.max(-100000, Math.min(100000, Math.trunc(patch.karma ?? 0))),
      garrisonTroopsWire: /^\d{1,18}$/.test(patch.garrisonTroopsWire || '')
        ? String(patch.garrisonTroopsWire)
        : '0',
      discoveredCodexCount: Math.max(
        0,
        Math.min(100000, Math.trunc(patch.discoveredCodexCount ?? 0))
      ),
      preferredRegion: (patch.preferredRegion || 'us-east-solara-1').slice(0, 48),
      activeSector: (patch.activeSector || 'B2').slice(0, 8),
      updatedAt: now,
    };

    const result = await db
      .insert(commanderProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: commanderProfiles.userId,
        set: {
          commanderName: values.commanderName,
          allianceTag: values.allianceTag,
          castleLevel: values.castleLevel,
          cultivationRealmIndex: values.cultivationRealmIndex,
          vipTier: values.vipTier,
          karma: values.karma,
          garrisonTroopsWire: values.garrisonTroopsWire,
          discoveredCodexCount: values.discoveredCodexCount,
          preferredRegion: values.preferredRegion,
          activeSector: values.activeSector,
          updatedAt: now,
        },
      })
      .returning();

    return { user, profile: result[0] };
  } catch (error) {
    console.error('Database query failed in upsertCommanderProfileForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getRealmSaveForUid(uid: string) {
  try {
    const rows = await db
      .select({
        save: realmSaves,
      })
      .from(realmSaves)
      .innerJoin(users, eq(realmSaves.userId, users.id))
      .where(eq(users.uid, uid))
      .limit(1);

    return rows[0]?.save ?? null;
  } catch (error) {
    console.error('Database query failed in getRealmSaveForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertRealmSaveForUid(
  uid: string,
  email: string,
  displayName: string | undefined,
  snapshotJson: string,
  version: number = 1
) {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    const now = new Date();
    const result = await db
      .insert(realmSaves)
      .values({
        userId: user.id,
        snapshotJson,
        version: Math.max(1, Math.trunc(version)),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: realmSaves.userId,
        set: {
          snapshotJson,
          version: Math.max(1, Math.trunc(version)),
          updatedAt: now,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in upsertRealmSaveForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function listSupportTicketsForUid(uid: string) {
  try {
    const rows = await db
      .select({
        ticket: supportTickets,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(desc(supportTickets.createdAt))
      .limit(50);

    return rows.map((row) => row.ticket);
  } catch (error) {
    console.error('Database query failed in listSupportTicketsForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createSupportTicketForUid(
  uid: string,
  email: string,
  displayName: string | undefined,
  input: { category: string; subject: string; message: string }
) {
  try {
    const user = await getOrCreateUser(uid, email, displayName);
    const result = await db
      .insert(supportTickets)
      .values({
        userId: user.id,
        category: input.category.trim().slice(0, 40) || 'general',
        subject: input.subject.trim().slice(0, 120),
        message: input.message.trim().slice(0, 2000),
        status: 'open',
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in createSupportTicketForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteUserDataForUid(uid: string): Promise<{ deleted: boolean }> {
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.uid, uid))
        .limit(1);
      if (existing.length === 0) {
        return { deleted: false };
      }
      const userId = existing[0].id;
      await tx.delete(supportTickets).where(eq(supportTickets.userId, userId));
      await tx.delete(realmSaves).where(eq(realmSaves.userId, userId));
      await tx.delete(commanderProfiles).where(eq(commanderProfiles.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
      return { deleted: true };
    });
  } catch (error) {
    console.error('Database query failed in deleteUserDataForUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
