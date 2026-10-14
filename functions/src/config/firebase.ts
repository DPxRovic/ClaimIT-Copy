import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

/**
 * Singleton Firebase Admin SDK initialization.
 * Automatically picks up GOOGLE_APPLICATION_CREDENTIALS or emulator environment variables.
 * Initialized exactly once across the serverless container runtime.
 */
export const adminApp: App = getApps().length > 0 ? getApp() : initializeApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminStorage: Storage = getStorage(adminApp);
