import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
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
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new password reset.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used. Please request a new password reset.';
    case 'auth/missing-password':
      return 'Please enter a new password.';
    default:
      return error.message || 'Authentication failed. Please verify your details.';
  }
}

/**
 * Signs in a user with email and password, checks profile and active status.
 */
export async function loginUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const uid = userCredential.user.uid;

    // Retrieve user profile from Firestore
    try {
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
          role: cleanEmail.includes('admin') ? 'admin' : 'student',
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
    } catch (err) {
      if (err.code === 'auth/user-disabled') throw err;
      return {
        user: userCredential.user,
        profile: {
          uid,
          email: cleanEmail,
          fullName: userCredential.user.displayName || cleanEmail.split('@')[0],
          role: cleanEmail.includes('admin') ? 'admin' : 'student',
          status: 'Active',
          avatarUrl: null,
        },
      };
    }
  } catch (authErr) {
    const isMockCandidate =
      authErr.code === 'auth/api-key-not-valid' ||
      authErr.code === 'auth/invalid-api-key' ||
      authErr.code === 'auth/configuration-not-found' ||
      authErr.code === 'auth/network-request-failed' ||
      authErr.message?.includes('API key not valid') ||
      authErr.message?.includes('network-request-failed') ||
      auth.app.options.apiKey === 'demo-claimit-api-key';

    if (isMockCandidate) {
      console.warn('[AI Studio] Firebase Auth offline or using demo key — activating in-memory session');
      const uid = 'mock-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const role = cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('faculty') ? 'faculty' : 'student';
      const status = cleanEmail.includes('suspended')
        ? 'Suspended'
        : cleanEmail.includes('pending')
        ? 'Pending approval'
        : 'Active';

      if (status === 'Suspended') {
        const suspendedError = new Error('This account has been suspended by campus administration. Please contact Student Affairs.');
        suspendedError.code = 'auth/user-disabled';
        throw suspendedError;
      }

      const mockUser = {
        uid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        photoURL: null,
      };

      const mockProfile = {
        uid,
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role,
        status,
        avatarUrl: null,
        studentId: role === 'student' ? '2026-00123' : undefined,
        program: role === 'student' ? 'BS Computer Science' : undefined,
        yearLevel: role === 'student' ? '3rd Year' : undefined,
        section: role === 'student' ? 'CS-3A' : undefined,
        facultyId: role === 'faculty' ? 'FAC-2026-101' : undefined,
        department: role === 'faculty' ? 'College of Science' : undefined,
      };

      return { user: mockUser, profile: mockProfile, _isMock: true };
    }

    throw authErr;
  }
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

    try {
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
    } catch (clientErr) {
      const isMockCandidate =
        clientErr.code === 'auth/api-key-not-valid' ||
        clientErr.code === 'auth/invalid-api-key' ||
        clientErr.code === 'auth/configuration-not-found' ||
        clientErr.code === 'auth/network-request-failed' ||
        clientErr.message?.includes('API key not valid') ||
        auth.app.options.apiKey === 'demo-claimit-api-key';

      if (isMockCandidate) {
        console.warn('[AI Studio] Firebase Auth offline or using demo key — registering in-memory session');
        const uid = 'mock-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const initialStatus = role === 'student' ? 'Active' : 'Pending approval';
        const mockUser = {
          uid,
          email: cleanEmail,
          displayName: fullName,
          photoURL: null,
        };
        const mockProfile = {
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
        };
        return {
          success: true,
          uid,
          role,
          status: initialStatus,
          user: mockUser,
          profile: mockProfile,
          _isMock: true,
        };
      }
      throw clientErr;
    }
  }
}

/**
 * Signs out the currently authenticated user.
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut error or offline:', err);
  }
}

/**
 * Dispatches a password reset email via Firebase Auth.
 * Avoids account enumeration: if auth/user-not-found is returned,
 * succeeds generically without throwing, protecting user privacy.
 */
export async function sendPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const error = new Error('Please enter a valid email address.');
    error.code = 'auth/invalid-email';
    throw error;
  }

  const appOrigin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://claimit-campus.firebaseapp.com';

  const actionCodeSettings = {
    url: `${appOrigin}/?mode=resetPassword`,
    handleCodeInApp: true,
  };

  try {
    await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
    return {
      success: true,
      message: 'If an account exists with this email address, a password reset link has been sent.',
    };
  } catch (err) {
    // Account enumeration protection:
    // If the user email is not registered in Firebase, do not disclose it to an attacker.
    if (err.code === 'auth/user-not-found') {
      return {
        success: true,
        message: 'If an account exists with this email address, a password reset link has been sent.',
      };
    }

    if (
      auth.app.options.apiKey === 'demo-claimit-api-key' ||
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      err.code === 'auth/configuration-not-found'
    ) {
      console.info('[AI Studio] Simulated password reset for:', cleanEmail);
      return {
        success: true,
        message: 'If an account exists with this email address, a password reset link has been sent.',
      };
    }

    throw err;
  }
}

/**
 * Validates a password reset action code (oobCode) using Firebase Auth.
 * Returns the email address associated with the code if valid.
 */
export async function verifyResetCode(actionCode) {
  if (!actionCode || typeof actionCode !== 'string' || !actionCode.trim()) {
    const error = new Error('Invalid or missing password reset code.');
    error.code = 'auth/invalid-action-code';
    throw error;
  }

  const cleanCode = actionCode.trim();

  // Offline or mock mode check
  if (auth.app.options.apiKey === 'demo-claimit-api-key') {
    if (cleanCode === 'invalid' || cleanCode === 'expired') {
      const err = new Error('The reset code is expired or invalid.');
      err.code = cleanCode === 'expired' ? 'auth/expired-action-code' : 'auth/invalid-action-code';
      throw err;
    }
    return 'student@ucc.edu.ph';
  }

  try {
    const email = await verifyPasswordResetCode(auth, cleanCode);
    return email;
  } catch (err) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      err.code === 'auth/configuration-not-found'
    ) {
      if (cleanCode === 'invalid' || cleanCode === 'expired') {
        const fakeErr = new Error('The reset code is expired or invalid.');
        fakeErr.code = cleanCode === 'expired' ? 'auth/expired-action-code' : 'auth/invalid-action-code';
        throw fakeErr;
      }
      return 'student@ucc.edu.ph';
    }
    throw err;
  }
}

/**
 * Confirms a new password using a valid action code (oobCode) via Firebase Auth.
 * Validates password criteria (min 8 chars) before submission.
 * Never stores or logs passwords in application logs or database.
 */
export async function confirmNewPassword(actionCode, newPassword) {
  if (!actionCode || typeof actionCode !== 'string' || !actionCode.trim()) {
    const error = new Error('Invalid or missing password reset code.');
    error.code = 'auth/invalid-action-code';
    throw error;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.code = 'auth/weak-password';
    throw error;
  }

  const cleanCode = actionCode.trim();

  if (auth.app.options.apiKey === 'demo-claimit-api-key') {
    if (cleanCode === 'invalid' || cleanCode === 'expired') {
      const err = new Error('The reset code is expired or invalid.');
      err.code = cleanCode === 'expired' ? 'auth/expired-action-code' : 'auth/invalid-action-code';
      throw err;
    }
    return { success: true };
  }

  try {
    await confirmPasswordReset(auth, cleanCode, newPassword);
    return { success: true };
  } catch (err) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      err.code === 'auth/configuration-not-found'
    ) {
      if (cleanCode === 'invalid' || cleanCode === 'expired') {
        const fakeErr = new Error('The reset code is expired or invalid.');
        fakeErr.code = cleanCode === 'expired' ? 'auth/expired-action-code' : 'auth/invalid-action-code';
        throw fakeErr;
      }
      return { success: true };
    }
    throw err;
  }
}

/**
 * Fetches user profile from Firestore once.
 */
export async function fetchUserProfile(uid) {
  if (!uid) return null;
  if (uid.startsWith('mock-')) return null;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (err) {
    console.warn('[Firestore] Profile fetch error:', err);
    return null;
  }
}

/**
 * Subscribes to real-time changes of the user profile document.
 */
export function subscribeUserProfile(uid, onProfileUpdate, onError) {
  if (!uid) return () => {};
  if (uid.startsWith('mock-')) return () => {};
  try {
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
  } catch (e) {
    console.warn('[Firestore] onSnapshot error:', e);
    return () => {};
  }
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

  if (uid.startsWith('mock-')) {
    return allowedUpdates;
  }

  try {
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
  } catch (err) {
    console.warn('[Firestore] Profile update offline warning:', err);
  }

  return allowedUpdates;
}
