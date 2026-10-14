import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './config.js';

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
    case 'already-exists':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid campus email address.';
    case 'auth/user-disabled':
      return 'This account has been suspended by campus administration. Please contact Student Affairs.';
    case 'auth/too-many-requests':
      return 'Access temporarily locked due to multiple failed login attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return error.message || 'Authentication failed. Please verify your details.';
  }
}

/**
 * Signs in a user with email and password, checks profile and active status.
 */
export async function loginUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const uid = userCredential.user.uid;

  // Retrieve user profile from Firestore
  const profileDoc = await getDoc(doc(db, 'users', uid));
  let profile = null;

  if (profileDoc.exists()) {
    profile = profileDoc.data();
    // Intercept suspended accounts immediately
    if (profile.status === 'Suspended') {
      await signOut(auth);
      const suspendedError = new Error('This account has been suspended by campus administration. Please contact Student Affairs.');
      suspendedError.code = 'auth/user-disabled';
      throw suspendedError;
    }
  } else {
    // If profile does not exist yet (e.g. created outside callable), initialize fallback profile
    profile = {
      uid,
      email: cleanEmail,
      fullName: userCredential.user.displayName || cleanEmail.split('@')[0],
      role: 'student',
      status: 'Active',
      avatarUrl: userCredential.user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', uid), profile, { merge: true });
    } catch (profileErr) {
      console.warn('Could not initialize fallback profile in Firestore:', profileErr);
    }
  }

  return { user: userCredential.user, profile };
}

/**
 * Registers a new user.
 * Attempts privileged Cloud Function `registerUser` first.
 * Falls back to client-side auth + Firestore setDoc if functions are not reachable.
 */
export async function registerUser(formData) {
  const cleanEmail = (formData.email || '').trim().toLowerCase();
  const fullName = (formData.fullName || '').trim();
  const role = formData.role || 'student';

  try {
    // 1. Preferred path: Callable Cloud Function
    const registerCallable = httpsCallable(functions, 'registerUser');
    const result = await registerCallable({
      ...formData,
      email: cleanEmail,
      fullName,
      role,
    });

    const response = result.data;

    // Automatically sign in students upon registration
    if (role === 'student' && formData.password) {
      await signInWithEmailAndPassword(auth, cleanEmail, formData.password);
    }

    return response;
  } catch (fnError) {
    // If callable fails because of functions not deployed or network issue, fallback to client-side
    const isCallableUnavailable =
      fnError.code === 'functions/unavailable' ||
      fnError.code === 'functions/not-found' ||
      fnError.message?.includes('network') ||
      fnError.message?.includes('internal');

    if (!isCallableUnavailable && fnError.code !== 'functions/internal') {
      // Re-throw genuine validation/already-exists errors from function
      throw fnError;
    }

    console.info('[Auth] Cloud Function unavailable, executing client-side registration fallback.');

    // 2. Fallback path: client-side Firebase Auth + Firestore
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
    const uid = userCredential.user.uid;

    if (fullName) {
      await updateProfile(userCredential.user, { displayName: fullName });
    }

    const initialStatus = role === 'student' ? 'Active' : 'Pending approval';
    const profile = {
      uid,
      email: cleanEmail,
      fullName,
      role,
      status: initialStatus,
      avatarUrl: null,
      ...(role === 'student'
        ? {
            studentId: formData.studentId || '',
            program: formData.program || '',
            yearLevel: formData.yearLevel || '1st Year',
            section: formData.section || '',
          }
        : {
            facultyId: formData.facultyId || '',
            department: formData.department || '',
          }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), profile);

    return {
      success: true,
      uid,
      role,
      status: initialStatus,
    };
  }
}

/**
 * Signs out the currently authenticated user.
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Dispatches a password reset email via Firebase Auth.
 */
export async function sendPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
}

/**
 * Fetches user profile from Firestore once.
 */
export async function fetchUserProfile(uid) {
  if (!uid) return null;
  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists() ? docSnap.data() : null;
}

/**
 * Subscribes to real-time changes of the user profile document.
 */
export function subscribeUserProfile(uid, onProfileUpdate, onError) {
  if (!uid) return () => {};
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (snapshot.exists()) {
        onProfileUpdate(snapshot.data());
      } else {
        onProfileUpdate(null);
      }
    },
    (err) => {
      console.warn('User profile subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Updates editable fields in the user's Firestore profile and Auth displayName.
 */
export async function updateUserProfile(uid, updates) {
  if (!uid) throw new Error('User ID is required to update profile.');

  // Whitelist editable fields
  const allowedUpdates = {};
  if (updates.fullName !== undefined) allowedUpdates.fullName = updates.fullName.trim();
  if (updates.avatarUrl !== undefined) allowedUpdates.avatarUrl = updates.avatarUrl;
  if (updates.program !== undefined) allowedUpdates.program = updates.program;
  if (updates.yearLevel !== undefined) allowedUpdates.yearLevel = updates.yearLevel;
  if (updates.section !== undefined) allowedUpdates.section = updates.section;
  if (updates.department !== undefined) allowedUpdates.department = updates.department;
  allowedUpdates.updatedAt = serverTimestamp();

  await updateDoc(doc(db, 'users', uid), allowedUpdates);

  // Update Auth displayName and photoURL if present
  if (auth.currentUser && (allowedUpdates.fullName || allowedUpdates.avatarUrl)) {
    const authUpdates = {};
    if (allowedUpdates.fullName) authUpdates.displayName = allowedUpdates.fullName;
    if (allowedUpdates.avatarUrl) authUpdates.photoURL = allowedUpdates.avatarUrl;
    await updateProfile(auth.currentUser, authUpdates);
  }

  // Update password if requested
  if (updates.newPassword && auth.currentUser) {
    await updatePassword(auth.currentUser, updates.newPassword);
  }

  return allowedUpdates;
}
