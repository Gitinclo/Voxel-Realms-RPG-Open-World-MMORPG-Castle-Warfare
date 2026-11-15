/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BASIC_IDENTITY_SCOPES, GMAIL_SCOPES, SCOPES } from './gmail';

export { BASIC_IDENTITY_SCOPES, GMAIL_SCOPES, SCOPES };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export const basicGoogleAuthProvider = new GoogleAuthProvider();
basicGoogleAuthProvider.addScope('email');
basicGoogleAuthProvider.addScope('profile');

for (const scope of GMAIL_SCOPES) {
  googleAuthProvider.addScope(scope);
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
