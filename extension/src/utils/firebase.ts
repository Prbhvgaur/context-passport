import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getGoogleAccessToken } from './chrome';

let firebaseApp: FirebaseApp | null = null;

const readEnv = (key: string) => {
  const value: unknown = import.meta.env[key];
  return typeof value === 'string' ? value : undefined;
};

const config = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

const getFirebaseApp = () => {
  firebaseApp ??= initializeApp(config);
  return firebaseApp;
};

export const signInWithGoogle = async () => {
  const accessToken = await getGoogleAccessToken();
  const auth = getAuth(getFirebaseApp());
  const credential = GoogleAuthProvider.credential(null, accessToken);
  const userCredential = await signInWithCredential(auth, credential);
  const idToken = await userCredential.user.getIdToken();

  return {
    idToken,
    profile: {
      userId: userCredential.user.uid,
      email: userCredential.user.email ?? '',
      displayName: userCredential.user.displayName ?? userCredential.user.email ?? 'Unknown user',
      photoURL: userCredential.user.photoURL ?? '',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalSessions: 0,
      totalResumes: 0,
      preferences: {
        autoCapture: true,
        autoInject: true,
        compressionLevel: 'balanced',
        autoCaptureTrigger: 'limit-detected',
        autoInjectBehavior: 'ask-first',
        sessionExpiryDays: 30,
        theme: 'dark',
      },
    },
  };
};
