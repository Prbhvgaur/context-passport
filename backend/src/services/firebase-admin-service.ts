import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env, isTest } from '../config/env.js';

const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export const hasFirebaseCredentials = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && privateKey,
);

const firebaseApp =
  hasFirebaseCredentials && getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    : getApps()[0];

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;

export const requireFirebase = () => {
  if (!firebaseAuth || !firestore) {
    if (isTest) {
      throw new Error('Firebase should be mocked during tests.');
    }

    throw new Error('Firebase credentials are missing.');
  }

  return { firebaseAuth, firestore };
};

