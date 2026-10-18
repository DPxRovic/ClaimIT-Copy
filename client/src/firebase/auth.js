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

// Pre-seeded verified demo accounts for offline / unprovisioned environments
const DEMO_ACCOUNTS = new Map([
  [
    'student@campus.edu',
    {
      password: 'demo123456',
      user: {
        uid: 'demo-student-uid',
        email: 'student@campus.edu',
        displayName: 'Campus Student',
        photoURL: null,
      },
      profile: {
        uid: 'demo-student-uid',
        email: 'student@campus.edu',
        fullName: 'Campus Student',
        role: 'student',
        status: 'Active',
        avatarUrl: null,
        studentId: '2026-00123',
        program: 'BS Computer Science',
        yearLevel: '3rd Year',
        section: 'CS-3A',
      },
    },
  ],
  [
    'faculty@campus.edu',
    {
      password: 'demo123456',
      user: {
        uid: 'demo-faculty-uid',
        email: 'faculty@campus.edu',
        displayName: 'Prof. Santos',
        photoURL: null,
      },
      profile: {
        uid: 'demo-faculty-uid',
        email: 'faculty@campus.edu',
        fullName: 'Prof. Santos',
        role: 'faculty',
        status: 'Active',
        avatarUrl: null,
        facultyId: 'FAC-2026-101',
        department: 'College of Science',
      },
    },
  ],
  [
    'admin@campus.edu',
    {
      password: 'demo123456',
      user: {
        uid: 'demo-admin-uid',
        email: 'admin@campus.edu',
        displayName: 'Campus Admin',
        photoURL: null,
      },
      profile: {
        uid: 'demo-admin-uid',
        email: 'admin@campus.edu',
        fullName: 'Campus Admin',
        role: 'admin',
        status: 'Active',
        avatarUrl: null,
      },
    },
  ],
  [
    'suspended@campus.edu',
    {
      password: 'demo123456',
      user: {
        uid: 'demo-suspended-uid',
        email: 'suspended@campus.edu',
        displayName: 'Suspended User',
        photoURL: null,
      },
      profile: {
        uid: 'demo-suspended-uid',
        email: 'suspended@campus.edu',
        fullName: 'Suspended User',
        role: 'student',
        status: 'Suspended',
        avatarUrl: null,
      },
    },
  ],
]);

/**
 * Signs in a user with email and password, checks profile and active status.
 */
export async function loginUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // 1. Pre-flight validation: reject empty or whitespace-only inputs
  if (!cleanEmail) {
    const err = new Error('Please enter your username or campus email.');
    err.code = 'auth/invalid-email';
    throw err;
  }

  if (!cleanPassword) {
    const err = new Error('Please enter your password.');
    err.code = 'auth/missing-password';
    throw err;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
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
        // Safe default profile: NEVER assign 'admin' role automatically
        profile = {
          uid,
          email: cleanEmail,
          fullName: userCredential.user.displayName || cleanEmail.split('@')[0],
          role: 'student', // SAFE DEFAULT
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
          role: 'student', // SAFE DEFAULT - NEVER 'admin'
          status: 'Active',
          avatarUrl: null,
        },
      };
    }
  } catch (authErr) {
    // If genuine authentication failure, re-throw immediately
    if (
      authErr.code === 'auth/invalid-credential' ||
      authErr.code === 'auth/wrong-password' ||
      authErr.code === 'auth/user-not-found' ||
      authErr.code === 'auth/user-disabled' ||
      authErr.code === 'auth/too-many-requests' ||
      authErr.code === 'auth/network-request-failed'
    ) {
      throw authErr;
    }

    const isUnprovisionedKey =
      authErr.code === 'auth/api-key-not-valid' ||
      authErr.code === 'auth/invalid-api-key' ||
      authErr.code === 'auth/configuration-not-found' ||
      auth.app.options.apiKey === 'demo-claimit-api-key';

    if (isUnprovisionedKey) {
      // In offline/demo environment: authenticate against verified demo store
      const demoAccount = DEMO_ACCOUNTS.get(cleanEmail);
      if (!demoAccount) {
        const notFoundErr = new Error('Invalid email or password. Please check your credentials and try again.');
        notFoundErr.code = 'auth/user-not-found';
        throw notFoundErr;
      }

      if (demoAccount.password !== cleanPassword) {
        const wrongPwErr = new Error('Invalid email or password. Please check your credentials and try again.');
        wrongPwErr.code = 'auth/wrong-password';
        throw wrongPwErr;
      }

      if (demoAccount.profile.status === 'Suspended') {
        const suspendedError = new Error('This account has been suspended by campus administration. Please contact Student Affairs.');
        suspendedError.code = 'auth/user-disabled';
        throw suspendedError;
      }

      return {
        user: demoAccount.user,
        profile: demoAccount.profile,
        _isMock: true,
      };
    }

    throw authErr;
  }
}

/**
 * Registers a new user.
 * Attempts privileged Cloud Function `registerUser` first.
 * Falls back to client-side auth + Firestore setDoc if functions are not reachable.
 * Implements strict input validation, role boundaries, and partial failure rollback.
 */
export async function registerUser(formData) {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Registration data is required.');
  }

  const cleanEmail = (formData.email || '').trim().toLowerCase();
  const fullName = (formData.fullName || '').trim();
  const password = formData.password || '';
  const role = formData.role || 'student';

  // 1. Comprehensive input validation
  if (!fullName) {
    throw new Error('Please enter your full name.');
  }
  if (fullName.length < 2 || fullName.length > 100) {
    throw new Error('Full Name must be between 2 and 100 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    const emailErr = new Error('Please enter a valid campus email address.');
    emailErr.code = 'auth/invalid-email';
    throw emailErr;
  }

  if (!password || password.length < 8) {
    const pwErr = new Error('Password must be at least 8 characters long.');
    pwErr.code = 'auth/weak-password';
    throw pwErr;
  }

  // Prevent self-registration of privileged roles
  if (role === 'admin' || (formData.role && String(formData.role).toLowerCase().includes('admin'))) {
    throw new Error('Public registration for administrators is not allowed.');
  }

  if (role !== 'student' && role !== 'faculty') {
    throw new Error('Invalid account role. Must be student or faculty.');
  }

  // Role-specific required fields
  if (role === 'student') {
    const studentId = (formData.studentId || '').trim();
    const program = (formData.program || '').trim();
    const yearLevel = (formData.yearLevel || '').trim();
    const section = (formData.section || '').trim();
    if (!studentId) throw new Error('Please enter your School ID Number.');
    if (!program) throw new Error('Please select your academic program.');
    if (!yearLevel) throw new Error('Please select your year level.');
    if (!section) throw new Error('Please enter your class section.');
  } else {
    const facultyId = (formData.facultyId || '').trim();
    const department = (formData.department || '').trim();
    if (!facultyId) throw new Error('Please enter your Faculty/Employee ID Number.');
    if (!department) throw new Error('Please select your department.');
  }

  try {
    // 2. Preferred path: Callable Cloud Function
    const registerCallable = httpsCallable(functions, 'registerUser');
    const result = await registerCallable({
      ...formData,
      email: cleanEmail,
      fullName,
      role,
    });

    const response = result.data;

    // Automatically sign in students upon registration
    if (role === 'student' && password) {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
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
      // 3. Fallback path: client-side Firebase Auth + Firestore
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = userCredential.user.uid;

      if (fullName) {
        try {
          await updateProfile(userCredential.user, { displayName: fullName });
        } catch (profileErr) {
          console.warn('[Auth] Display name update warning:', profileErr);
        }
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
              studentId: (formData.studentId || '').trim(),
              program: (formData.program || '').trim(),
              yearLevel: (formData.yearLevel || '').trim() || '1st Year',
              section: (formData.section || '').trim(),
            }
          : {
              facultyId: (formData.facultyId || '').trim(),
              department: (formData.department || '').trim(),
            }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Attempt to save profile to Firestore with retry
      let profileSaved = false;
      try {
        await setDoc(doc(db, 'users', uid), profile);
        profileSaved = true;
      } catch (firstErr) {
        console.warn('[Auth] First profile write attempt failed, retrying once...', firstErr);
        try {
          await setDoc(doc(db, 'users', uid), profile);
          profileSaved = true;
        } catch (retryErr) {
          console.error('[Auth] Profile write retry also failed:', retryErr);
        }
      }

      // Handle partial failure: roll back auth account if profile write fails
      if (!profileSaved) {
        console.error('[Auth] Partial failure: Auth account created but Firestore profile write failed. Rolling back auth user...');
        try {
          await userCredential.user.delete();
        } catch (deleteErr) {
          console.warn('[Auth] Could not delete user during rollback, signing out:', deleteErr);
          await signOut(auth);
        }
        const partialErr = new Error('Database profile creation failed. Registration was safely rolled back. Please try again.');
        partialErr.code = 'firestore/profile-failed';
        throw partialErr;
      }

      return {
        success: true,
        uid,
        role,
        status: initialStatus,
      };
    } catch (clientErr) {
      if (clientErr.code === 'firestore/profile-failed' || clientErr.code === 'auth/email-already-in-use') {
        throw clientErr;
      }

      const isUnprovisionedKey =
        clientErr.code === 'auth/api-key-not-valid' ||
        clientErr.code === 'auth/invalid-api-key' ||
        clientErr.code === 'auth/configuration-not-found' ||
        auth.app.options.apiKey === 'demo-claimit-api-key';

      if (isUnprovisionedKey) {
        // Check duplicate registration in demo store
        if (DEMO_ACCOUNTS.has(cleanEmail)) {
          const dupErr = new Error('An account with this email address already exists. Please log in instead.');
          dupErr.code = 'auth/email-already-in-use';
          throw dupErr;
        }

        console.warn('[AI Studio] Firebase Auth offline or using demo key — registering in verified demo store');
        const uid = 'demo-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
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
                studentId: (formData.studentId || '').trim(),
                program: (formData.program || '').trim(),
                yearLevel: (formData.yearLevel || '').trim() || '1st Year',
                section: (formData.section || '').trim(),
              }
            : {
                facultyId: (formData.facultyId || '').trim(),
                department: (formData.department || '').trim(),
              }),
        };

        // Record registered user so subsequent logins with this email/password succeed
        DEMO_ACCOUNTS.set(cleanEmail, {
          password,
          user: mockUser,
          profile: mockProfile,
        });

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
