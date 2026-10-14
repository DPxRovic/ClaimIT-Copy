import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * Public client-side Firebase configuration.
 * Loaded from Vite environment variables (VITE_FIREBASE_*).
 * According to Firebase security model, these public identifiers identify
 * the Firebase project, while access is governed by Authentication & Security Rules.
 */
const getEnv = (key, fallback = '') => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.[key]) {
      return import.meta.env[key];
    }
  } catch {
    // Non-ESM or Node test runner fallback
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'demo-claimit-api-key'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'claimit-campus.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'claimit-campus'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'claimit-campus.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '1234567890'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:1234567890:web:abcdef123456'),
};

// Singleton safe initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Guard to prevent connecting to emulators multiple times across re-renders/HMR
let emulatorsConnected = false;

/**
 * Connects the Firebase Web SDK instances to local Firebase Emulators.
 * Only triggers if VITE_USE_FIREBASE_EMULATOR is enabled or explicitly requested.
 */
export function initializeEmulators({
  authHost = 'http://localhost:9099',
  firestoreHost = 'localhost',
  firestorePort = 8080,
  storageHost = 'localhost',
  storagePort = 9199,
  functionsHost = 'localhost',
  functionsPort = 5001,
} = {}) {
  if (emulatorsConnected) return;

  const shouldUseEmulator =
    getEnv('VITE_USE_FIREBASE_EMULATOR') === 'true' ||
    (typeof window !== 'undefined' && window.location?.hostname === 'localhost' && getEnv('DEV') && getEnv('VITE_USE_FIREBASE_EMULATOR') !== 'false');

  if (shouldUseEmulator) {
    try {
      connectAuthEmulator(auth, authHost, { disableWarnings: true });
      connectFirestoreEmulator(db, firestoreHost, firestorePort);
      connectStorageEmulator(storage, storageHost, storagePort);
      connectFunctionsEmulator(functions, functionsHost, functionsPort);
      emulatorsConnected = true;
      if (typeof console !== 'undefined') {
        console.info('[Firebase] Connected to local Firebase Emulator Suite.');
      }
    } catch (err) {
      console.warn('[Firebase] Warning while connecting to emulators:', err.message);
    }
  }
}

// Auto-run emulator connection in dev if flag is present
if (typeof window !== 'undefined' && getEnv('VITE_USE_FIREBASE_EMULATOR') === 'true') {
  initializeEmulators();
}

export { app, auth, db, storage, functions };
