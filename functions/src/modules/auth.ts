import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';
import {
  assertRequiredString,
  assertValidEmail,
  assertValidPassword,
} from '../utils/validation.js';

interface RegisterUserData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'faculty';
  studentId?: string;
  program?: string;
  yearLevel?: string;
  section?: string;
  facultyId?: string;
  department?: string;
}

/**
 * Server-side trusted user registration callable function.
 * Provisions Firebase Auth user, assigns Custom Claims, and writes Firestore profile.
 */
export const registerUser = onCall(async (request: CallableRequest<RegisterUserData>) => {
  const data = request.data;
  if (!data) {
    throw new AppError('invalid-argument', 'Registration data payload is required.');
  }

  // 1. Validate common fields
  const email = assertValidEmail(data.email);
  const password = assertValidPassword(data.password, 8);
  const fullName = assertRequiredString(data.fullName, 'Full Name', 2, 100);
  const role = data.role;

  if (role !== 'student' && role !== 'faculty') {
    throw new AppError('invalid-argument', 'Role must be either student or faculty.', { field: 'role' });
  }

  // 2. Validate role-specific fields
  let studentId: string | null = null;
  let program: string | null = null;
  let yearLevel: string | null = null;
  let section: string | null = null;
  let facultyId: string | null = null;
  let department: string | null = null;

  if (role === 'student') {
    studentId = assertRequiredString(data.studentId, 'Student ID', 2, 50);
    program = assertRequiredString(data.program, 'Program', 2, 100);
    yearLevel = data.yearLevel ? String(data.yearLevel) : '1st Year';
    section = data.section ? String(data.section) : '';
  } else {
    facultyId = assertRequiredString(data.facultyId, 'Faculty / Employee ID', 2, 50);
    department = assertRequiredString(data.department, 'Department', 2, 100);
  }

  const initialStatus = role === 'student' ? 'Active' : 'Pending approval';
  const customClaims = {
    role,
    status: role === 'student' ? 'active' : 'pending_approval',
  };

  let createdUid: string | null = null;

  try {
    // 3. Create Firebase Authentication account
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
    });
    createdUid = userRecord.uid;

    // 4. Set custom claims for role-based security rules evaluation
    await adminAuth.setCustomUserClaims(createdUid, customClaims);

    // 5. Create Firestore user profile document
    const userDocRef = adminDb.collection('users').doc(createdUid);
    const profileData = {
      uid: createdUid,
      email,
      fullName,
      role,
      status: initialStatus,
      avatarUrl: null,
      ...(role === 'student'
        ? { studentId, program, yearLevel, section }
        : { facultyId, department }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userDocRef.set(profileData);

    // 6. Log system activity
    await adminDb.collection('activity_logs').add({
      actorUid: createdUid,
      actorName: 'System',
      actorRole: '',
      action: `New registration: ${fullName} (${role === 'student' ? 'Student' : 'Faculty'})`,
      targetEntity: `user:${createdUid}`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      uid: createdUid,
      role,
      status: initialStatus,
      message:
        role === 'faculty'
          ? 'Faculty registration received. Account is pending administrator approval.'
          : 'Registration successful! You may now log in.',
    };
  } catch (error: unknown) {
    // Rollback auth user creation if Firestore profile creation fails
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (cleanupErr) {
        console.error('Failed to cleanup user after registration failure:', cleanupErr);
      }
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'auth/email-already-exists') {
      throw new AppError('already-exists', 'An account with this email address already exists.', { field: 'email' });
    }
    if (firebaseError.code === 'auth/invalid-password') {
      throw new AppError('invalid-argument', 'The password provided is too weak or invalid.', { field: 'password' });
    }

    console.error('Registration error:', error);
    throw new AppError('internal', 'Registration failed. Please verify your information and try again.');
  }
});
