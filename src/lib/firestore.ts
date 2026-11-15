/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from 'firebase/auth';
import {
  Unsubscribe,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation constants synchronized verbatim with firebase-blueprint.json & firestore.rules
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const TAG_PATTERN = /^[A-Za-z0-9]{2,6}$/;
const WIRE_PATTERN = /^[0-9]{1,18}$/;

function sanitizeAllianceTag(raw: string): string {
  const stripped = raw
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  if (TAG_PATTERN.test(stripped)) return stripped;
  return 'SOL';
}

function sanitizeTroopsWire(raw: string): string {
  const cleaned = raw.trim();
  if (WIRE_PATTERN.test(cleaned)) return cleaned;
  return '0';
}

function sanitizeCommanderName(raw: string): string {
  const cleaned = raw.trim().slice(0, 48);
  return cleaned.length >= 1 ? cleaned : 'Sovereign Vanguard';
}

function sanitizeCodexIds(ids: string[]): string[] {
  return ids
    .filter((id) => typeof id === 'string' && id.trim().length >= 1)
    .slice(0, 64)
    .map((id) => id.trim().slice(0, 64));
}

export interface CommanderSyncPayload {
  commanderName: string;
  allianceTag: string;
  castleLevel: number;
  cultivationRealmIndex: number;
  vipRank: number;
  karmaValue: number;
  garrisonTroopsWire: string;
  discoveredCodexIds: string[];
}

export interface FirestoreCommanderSaveData {
  ownerId: string;
  saveId: string;
  castleLevel: number;
  cultivationRealmIndex: number;
  allianceTag: string;
  garrisonTroopsWire: string;
  discoveredCodexIds: string[];
  version: number;
}

export async function syncUserAccountDocuments(
  user: User,
  payload: CommanderSyncPayload
): Promise<void> {
  if (!ID_PATTERN.test(user.uid) || user.uid.length > 128) {
    throw new Error('Invalid authenticated user identifier.');
  }
  if (!user.emailVerified || !user.email) {
    throw new Error('A verified Google account email is required to sync progress.');
  }

  const commanderName = sanitizeCommanderName(payload.commanderName);
  const allianceTag = sanitizeAllianceTag(payload.allianceTag);
  const castleLevel = Math.max(0, Math.min(100, Math.trunc(payload.castleLevel)));
  const cultivationRealmIndex = Math.max(
    0,
    Math.min(22, Math.trunc(payload.cultivationRealmIndex))
  );
  const vipRank = Math.max(0, Math.min(3, Math.trunc(payload.vipRank)));
  const karmaValue = Math.max(-100000, Math.min(100000, Math.trunc(payload.karmaValue)));
  const garrisonTroopsWire = sanitizeTroopsWire(payload.garrisonTroopsWire);
  const discoveredCodexIds = sanitizeCodexIds(payload.discoveredCodexIds);

  const privatePath = `users/${user.uid}/private/account`;
  const privateRef = doc(db, 'users', user.uid, 'private', 'account');
  try {
    const existingPrivate = await getDoc(privateRef);
    if (!existingPrivate.exists()) {
      await setDoc(privateRef, {
        uid: user.uid,
        email: user.email.slice(0, 254),
        role: 'player',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(privateRef, {
        email: user.email.slice(0, 254),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }

  const publicPath = `users/${user.uid}/public/profile`;
  const publicRef = doc(db, 'users', user.uid, 'public', 'profile');
  try {
    const publicData = {
      uid: user.uid,
      commanderName,
      allianceTag,
      castleLevel,
      cultivationRealmIndex,
      vipRank,
      karmaValue,
      garrisonTroopsWire,
      discoveredCodexCount: discoveredCodexIds.length,
      updatedAt: serverTimestamp(),
    };
    const existingPublic = await getDoc(publicRef);
    if (!existingPublic.exists()) {
      await setDoc(publicRef, publicData);
    } else {
      await updateDoc(publicRef, {
        commanderName,
        allianceTag,
        castleLevel,
        cultivationRealmIndex,
        vipRank,
        karmaValue,
        garrisonTroopsWire,
        discoveredCodexCount: discoveredCodexIds.length,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  const savePath = `users/${user.uid}/saves/primary`;
  const saveRef = doc(db, 'users', user.uid, 'saves', 'primary');
  try {
    const existingSave = await getDoc(saveRef);
    if (!existingSave.exists()) {
      await setDoc(saveRef, {
        ownerId: user.uid,
        saveId: 'primary',
        castleLevel,
        cultivationRealmIndex,
        allianceTag,
        garrisonTroopsWire,
        discoveredCodexIds,
        version: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const currentVersion =
        typeof existingSave.data()?.version === 'number' ? existingSave.data()!.version : 1;
      await updateDoc(saveRef, {
        castleLevel,
        cultivationRealmIndex,
        allianceTag,
        garrisonTroopsWire,
        discoveredCodexIds,
        version: currentVersion + 1,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, savePath);
  }
}

export function subscribeToCommanderSave(
  uid: string,
  onSave: (save: FirestoreCommanderSaveData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const savePath = `users/${uid}/saves/primary`;
  const saveRef = doc(db, 'users', uid, 'saves', 'primary');
  return onSnapshot(
    saveRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onSave(null);
        return;
      }
      const data = snapshot.data();
      onSave({
        ownerId: String(data.ownerId ?? uid),
        saveId: String(data.saveId ?? 'primary'),
        castleLevel: typeof data.castleLevel === 'number' ? data.castleLevel : 1,
        cultivationRealmIndex:
          typeof data.cultivationRealmIndex === 'number' ? data.cultivationRealmIndex : 0,
        allianceTag: typeof data.allianceTag === 'string' ? data.allianceTag : 'SOL',
        garrisonTroopsWire:
          typeof data.garrisonTroopsWire === 'string' ? data.garrisonTroopsWire : '0',
        discoveredCodexIds: Array.isArray(data.discoveredCodexIds)
          ? data.discoveredCodexIds.map(String)
          : [],
        version: typeof data.version === 'number' ? data.version : 1,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, savePath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function createSupportTicketDocument(
  user: User,
  input: {
    category: string;
    subject: string;
    message: string;
  }
): Promise<string> {
  if (!ID_PATTERN.test(user.uid) || user.uid.length > 128) {
    throw new Error('Invalid authenticated user identifier.');
  }
  if (!user.emailVerified) {
    throw new Error('A verified Google account email is required to submit a cloud ticket.');
  }

  const allowedCategories = new Set(['general', 'bug', 'abuse', 'billing']);
  const mappedCategory = allowedCategories.has(input.category)
    ? input.category
    : input.category === 'moderation_report'
      ? 'abuse'
      : input.category === 'security_disclosure'
        ? 'bug'
        : 'general';

  const cleanSubject = input.subject.trim().slice(0, 120);
  const cleanMessage = input.message.trim().slice(0, 2000);
  if (cleanSubject.length < 3 || cleanMessage.length < 5) {
    throw new Error('Ticket subject (>=3 chars) and details (>=5 chars) are required.');
  }

  const rawId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g, '')
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const ticketId = `tkt_${rawId.slice(0, 32)}`;
  const ticketPath = `supportTickets/${ticketId}`;
  const ticketRef = doc(db, 'supportTickets', ticketId);

  try {
    await setDoc(ticketRef, {
      ticketId,
      ownerId: user.uid,
      category: mappedCategory,
      subject: cleanSubject,
      message: cleanMessage,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ticketPath);
  }
}
