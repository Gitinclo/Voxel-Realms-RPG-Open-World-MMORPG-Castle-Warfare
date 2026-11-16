/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let cachedAdminAuth: Auth | null = null;

export async function getAdminAuth(): Promise<Auth> {
  if (cachedAdminAuth) {
    return cachedAdminAuth;
  }
  const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
    import('firebase-admin/app'),
    import('firebase-admin/auth'),
  ]);
  if (!getApps().length) {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  cachedAdminAuth = getAuth();
  return cachedAdminAuth;
}
