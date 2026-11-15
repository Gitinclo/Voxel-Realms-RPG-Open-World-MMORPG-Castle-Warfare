/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export async function verifyFirebaseBearerToken(
  authHeader: string | undefined
): Promise<{ ok: true; decoded: DecodedIdToken } | { ok: false; error: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Unauthorized: Missing token' };
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return { ok: false, error: 'Unauthorized: Empty token' };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded?.uid) {
      return { ok: false, error: 'Unauthorized: Invalid token subject' };
    }
    return { ok: true, decoded };
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return { ok: false, error: 'Unauthorized: Invalid token' };
  }
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const verified = await verifyFirebaseBearerToken(req.headers.authorization);
  if (!verified.ok) {
    return res.status(401).json({ error: verified.error });
  }
  req.user = verified.decoded;
  next();
};
