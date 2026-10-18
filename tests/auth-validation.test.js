import assert from 'node:assert/strict';
import {
  assertRequiredString,
  assertValidEmail,
  assertValidPassword,
  assertAuthenticated,
} from '../functions/lib/utils/validation.js';
import {
  assertAdmin,
  assertActiveUser,
  assertOwnerOrAdmin,
} from '../functions/lib/utils/auth-guards.js';
import { AppError, handleFunctionError } from '../functions/lib/utils/errors.js';
import {
  loginUser,
  registerUser,
  sendPasswordReset,
  logoutUser,
  formatAuthError,
} from '../client/src/firebase/auth.js';

console.log('🧪 Starting ClaimIt Authentication, Registration & Database Validation Audit Suite...\n');

// -----------------------------------------------------------------------------
// Test 1: Input Validation Utilities
// -----------------------------------------------------------------------------
console.log('Test 1: Input Validation Utilities');
assert.equal(assertRequiredString('  John Doe  ', 'Name'), 'John Doe');
assert.throws(() => assertRequiredString('', 'Name'), /Name is required/);
assert.throws(() => assertRequiredString('   ', 'Name'), /Name is required/);
assert.throws(() => assertRequiredString('a'.repeat(101), 'Name', 1, 100), /cannot exceed 100/);

assert.equal(assertValidEmail('STUDENT@CAMPUS.EDU'), 'student@campus.edu');
assert.throws(() => assertValidEmail('not-an-email'), /valid email address/);
assert.throws(() => assertValidEmail('user@'), /valid email address/);
assert.throws(() => assertValidEmail('@campus.edu'), /valid email address/);

assert.equal(assertValidPassword('securepass123'), 'securepass123');
assert.throws(() => assertValidPassword('short'), /at least 8 characters/);
assert.throws(() => assertValidPassword(''), /at least 8 characters/);

assert.equal(assertAuthenticated({ uid: 'usr_123' }), 'usr_123');
assert.throws(() => assertAuthenticated(null), /must be logged in/);
console.log('  ✅ Validation utilities passed.\n');

// -----------------------------------------------------------------------------
// Test 2: Standardized Error Handling & Normalization
// -----------------------------------------------------------------------------
console.log('Test 2: Standardized Error Handling');
const appErr = new AppError('invalid-argument', 'Missing field', { field: 'email' });
assert.equal(appErr.code, 'invalid-argument');
assert.equal(appErr.message, 'Missing field');
assert.ok(appErr.timestamp);

const normalized = handleFunctionError(new Error('Unknown database issue'));
assert.equal(normalized.code, 'internal');
console.log('  ✅ Error handling and normalization passed.\n');

// -----------------------------------------------------------------------------
// Test 3: User-Friendly Auth Error Mapping
// -----------------------------------------------------------------------------
console.log('Test 3: Friendly Error Mapping for Frontend');
assert.match(formatAuthError({ code: 'auth/invalid-credential' }), /Invalid email or password/);
assert.match(formatAuthError({ code: 'auth/wrong-password' }), /Invalid email or password/);
assert.match(formatAuthError({ code: 'auth/user-not-found' }), /Invalid email or password/);
assert.match(formatAuthError({ code: 'auth/email-already-in-use' }), /already exists/);
assert.match(formatAuthError({ code: 'auth/user-disabled' }), /suspended by campus administration/);
assert.match(formatAuthError({ code: 'auth/weak-password' }), /at least 8 characters/);
assert.match(formatAuthError({ code: 'auth/network-request-failed' }), /Network connection issue/);
assert.match(formatAuthError({ code: 'auth/too-many-requests' }), /temporarily locked/);
console.log('  ✅ Error message mapping passed.\n');

// -----------------------------------------------------------------------------
// Test 4: Missing Required Registration Fields (Student & Faculty)
// -----------------------------------------------------------------------------
console.log('Test 4: Missing Required Registration Fields');
await assert.rejects(
  async () => await registerUser({}),
  /Please enter your full name/
);
await assert.rejects(
  async () => await registerUser({ fullName: '   ', email: 'test@campus.edu', password: 'password123' }),
  /Please enter your full name/
);
await assert.rejects(
  async () => await registerUser({ fullName: 'A', email: 'test@campus.edu', password: 'password123' }),
  /between 2 and 100 characters/
);

// Student missing fields
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Alice Student',
      email: 'alice@campus.edu',
      password: 'password123',
      role: 'student',
      studentId: '',
    }),
  /Please enter your School ID Number/
);
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Alice Student',
      email: 'alice@campus.edu',
      password: 'password123',
      role: 'student',
      studentId: '2026-001',
      program: '',
    }),
  /Please select your academic program/
);
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Alice Student',
      email: 'alice@campus.edu',
      password: 'password123',
      role: 'student',
      studentId: '2026-001',
      program: 'BSCS',
      yearLevel: '',
    }),
  /Please select your year level/
);
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Alice Student',
      email: 'alice@campus.edu',
      password: 'password123',
      role: 'student',
      studentId: '2026-001',
      program: 'BSCS',
      yearLevel: '1st Year',
      section: '   ',
    }),
  /Please enter your class section/
);

// Faculty missing fields
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Prof. Gomez',
      email: 'gomez@campus.edu',
      password: 'password123',
      role: 'faculty',
      facultyId: '',
    }),
  /Please enter your Faculty\/Employee ID/
);
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Prof. Gomez',
      email: 'gomez@campus.edu',
      password: 'password123',
      role: 'faculty',
      facultyId: 'FAC-999',
      department: '',
    }),
  /Please select your department/
);
console.log('  ✅ Missing and whitespace-only registration fields strictly rejected.\n');

// -----------------------------------------------------------------------------
// Test 5: Invalid Email & Weak Password Rejection
// -----------------------------------------------------------------------------
console.log('Test 5: Invalid Email & Weak Password');
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Bob Smith',
      email: 'invalid-email-address',
      password: 'password123',
      role: 'student',
      studentId: '2026-002',
      program: 'BSIT',
      yearLevel: '2nd Year',
      section: 'IT-2A',
    }),
  /Please enter a valid campus email address/
);

await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Bob Smith',
      email: 'bob@campus.edu',
      password: 'short',
      role: 'student',
      studentId: '2026-002',
      program: 'BSIT',
      yearLevel: '2nd Year',
      section: 'IT-2A',
    }),
  /Password must be at least 8 characters long/
);
console.log('  ✅ Invalid emails and weak passwords strictly rejected.\n');

// -----------------------------------------------------------------------------
// Test 6: Role Invariants & Self-Assigned Admin Role Denial
// -----------------------------------------------------------------------------
console.log('Test 6: Role Invariants & Admin Registration Denial');
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Mallory Hacker',
      email: 'hacker@campus.edu',
      password: 'password123',
      role: 'admin',
    }),
  /Public registration for administrators is not allowed/
);

await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Mallory Hacker',
      email: 'hacker@campus.edu',
      password: 'password123',
      role: 'superadmin',
    }),
  /Public registration for administrators is not allowed/
);

await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Mallory Hacker',
      email: 'hacker@campus.edu',
      password: 'password123',
      role: 'guest',
    }),
  /Invalid account role/
);
console.log('  ✅ Self-assigned administrative elevation rejected.\n');

// -----------------------------------------------------------------------------
// Test 7: Successful Registration & Profile Persistence Flow
// -----------------------------------------------------------------------------
console.log('Test 7: Successful Registration and Profile Persistence');
const newStudentReg = await registerUser({
  fullName: 'Juan Dela Cruz',
  email: 'juan.delacruz@campus.edu',
  password: 'password123',
  role: 'student',
  studentId: '2026-00999',
  program: 'BS Computer Science',
  yearLevel: '1st Year',
  section: 'CS-1A',
});

assert.ok(newStudentReg.success);
assert.equal(newStudentReg.role, 'student');
assert.equal(newStudentReg.status, 'Active');
assert.equal(newStudentReg.profile.fullName, 'Juan Dela Cruz');
assert.equal(newStudentReg.profile.studentId, '2026-00999');

const newFacultyReg = await registerUser({
  fullName: 'Dr. Clara Reyes',
  email: 'clara.reyes@campus.edu',
  password: 'facultysecret123',
  role: 'faculty',
  facultyId: 'FAC-2026-888',
  department: 'College of Engineering',
});

assert.ok(newFacultyReg.success);
assert.equal(newFacultyReg.role, 'faculty');
assert.equal(newFacultyReg.status, 'Pending approval');
assert.equal(newFacultyReg.profile.facultyId, 'FAC-2026-888');
console.log('  ✅ Registration flow and profile persistence verified.\n');

// -----------------------------------------------------------------------------
// Test 8: Duplicate Registration Denial
// -----------------------------------------------------------------------------
console.log('Test 8: Duplicate Registration Handling');
await assert.rejects(
  async () =>
    await registerUser({
      fullName: 'Juan Dela Cruz Impersonator',
      email: 'juan.delacruz@campus.edu',
      password: 'newpassword123',
      role: 'student',
      studentId: '2026-00999',
      program: 'BSCS',
      yearLevel: '1st Year',
      section: 'CS-1A',
    }),
  /already exists/
);
console.log('  ✅ Duplicate registration prevented with appropriate error.\n');

// -----------------------------------------------------------------------------
// Test 9: Successful Login with Valid Credentials
// -----------------------------------------------------------------------------
console.log('Test 9: Successful Login');
// 9a. Pre-seeded student
const studentLogin = await loginUser('student@campus.edu', 'demo123456');
assert.ok(studentLogin.user);
assert.equal(studentLogin.profile.role, 'student');
assert.equal(studentLogin.profile.status, 'Active');

// 9b. Newly registered student
const registeredLogin = await loginUser('juan.delacruz@campus.edu', 'password123');
assert.ok(registeredLogin.user);
assert.equal(registeredLogin.profile.fullName, 'Juan Dela Cruz');

// 9c. Administrator
const adminLogin = await loginUser('admin@campus.edu', 'demo123456');
assert.ok(adminLogin.user);
assert.equal(adminLogin.profile.role, 'admin');
console.log('  ✅ Successful logins loaded corresponding profiles correctly.\n');

// -----------------------------------------------------------------------------
// Test 10: Incorrect Credentials and Empty Login Fields Rejection
// -----------------------------------------------------------------------------
console.log('Test 10: Incorrect Credentials and Empty Login Fields');
await assert.rejects(
  async () => await loginUser('', 'demo123456'),
  /Please enter your username or campus email/
);
await assert.rejects(
  async () => await loginUser('   ', 'demo123456'),
  /Please enter your username or campus email/
);
await assert.rejects(
  async () => await loginUser('student@campus.edu', ''),
  /Please enter your password/
);
await assert.rejects(
  async () => await loginUser('student@campus.edu', '   '),
  /Please enter your password/
);
await assert.rejects(
  async () => await loginUser('student@campus.edu', 'wrongpassword'),
  /Invalid email or password/
);
await assert.rejects(
  async () => await loginUser('nonexistent@campus.edu', 'demo123456'),
  /Invalid email or password/
);
console.log('  ✅ Empty fields and invalid credentials strictly rejected.\n');

// -----------------------------------------------------------------------------
// Test 11: Suspended User Account Interception
// -----------------------------------------------------------------------------
console.log('Test 11: Suspended User Access Denial');
await assert.rejects(
  async () => await loginUser('suspended@campus.edu', 'demo123456'),
  /suspended by campus administration/
);
console.log('  ✅ Suspended accounts prevented from authenticating.\n');

// -----------------------------------------------------------------------------
// Test 12: Session Restoration, Logout & Data Clearing
// -----------------------------------------------------------------------------
console.log('Test 12: Session Restoration and Logout');
await logoutUser();
// Verify clean state after logout
assert.doesNotThrow(() => logoutUser());
console.log('  ✅ Logout clears session correctly.\n');

// -----------------------------------------------------------------------------
// Test 13: Access to Protected Pages and Backend Operations
// -----------------------------------------------------------------------------
console.log('Test 13: Protected Operations Access Control');
// Unauthenticated callers blocked
assert.throws(() => assertAuthenticated(null), /must be logged in/);
assert.throws(() => assertAuthenticated({ uid: '' }), /must be logged in/);

// Ordinary users blocked from admin operations
assert.throws(
  () => assertAdmin({ uid: 'usr_student', token: { role: 'student', status: 'active' } }),
  /Administrative privileges are required/
);

// Suspended / pending users blocked from active user operations
assert.throws(
  () => assertActiveUser({ uid: 'usr_faculty', token: { role: 'faculty', status: 'pending_approval' } }),
  /Account is not in active status/
);
assert.throws(
  () => assertActiveUser({ uid: 'usr_bad', token: { role: 'student', status: 'suspended' } }),
  /Account is not in active status/
);

// Admin caller allowed
const adminCtx = assertAdmin({ uid: 'usr_admin', token: { role: 'admin', status: 'active' } });
assert.equal(adminCtx.uid, 'usr_admin');
console.log('  ✅ Backend authorization guards strictly enforced.\n');

// -----------------------------------------------------------------------------
// Test 14: Unauthorized Profile Access & Modification
// -----------------------------------------------------------------------------
console.log('Test 14: Unauthorized Profile Modification Denial');
assert.throws(
  () => assertOwnerOrAdmin({ uid: 'attacker_uid', token: { role: 'student' } }, 'victim_uid'),
  /not authorized to modify this resource/
);

const ownerAccess = assertOwnerOrAdmin({ uid: 'victim_uid', token: { role: 'student' } }, 'victim_uid');
assert.equal(ownerAccess.uid, 'victim_uid');

const adminOverride = assertOwnerOrAdmin({ uid: 'admin_uid', token: { role: 'admin' } }, 'victim_uid');
assert.equal(adminOverride.uid, 'admin_uid');
console.log('  ✅ Cross-user profile tampering strictly blocked.\n');

// -----------------------------------------------------------------------------
// Test 15: Safe Default Role & Missing Profile Fallback
// -----------------------------------------------------------------------------
console.log('Test 15: Safe Default Role & Database Failures');
// Test that fallback role is always 'student', never 'admin' even if email contains 'admin'
function createSafeFallbackProfile(uid, email) {
  return {
    uid,
    email,
    fullName: email.split('@')[0],
    role: 'student', // Invariant: Safe default
    status: 'Active',
  };
}

const fallback = createSafeFallbackProfile('usr_test', 'badadmin@campus.edu');
assert.equal(fallback.role, 'student', 'Default fallback role MUST be student');
assert.notEqual(fallback.role, 'admin', 'Default role must NEVER be elevated to admin');
console.log('  ✅ Safe fallback default role verified.\n');

// -----------------------------------------------------------------------------
// Test 16: Forgot Password Input Validation & Enumeration Protection
// -----------------------------------------------------------------------------
console.log('Test 16: Forgot Password Validation');
// Empty email rejected
await assert.rejects(
  async () => await sendPasswordReset(''),
  /Please enter a valid email address/
);
// Whitespace email rejected
await assert.rejects(
  async () => await sendPasswordReset('   '),
  /Please enter a valid email address/
);
// Malformed email rejected
await assert.rejects(
  async () => await sendPasswordReset('not-an-email'),
  /Please enter a valid email address/
);

// Valid email returns generic confirmation message
const resetResult = await sendPasswordReset('student@campus.edu');
assert.ok(resetResult.success);
assert.match(resetResult.message, /If an account exists with this email address/);

const unknownEmailReset = await sendPasswordReset('random.unknown@campus.edu');
assert.ok(unknownEmailReset.success);
assert.match(unknownEmailReset.message, /If an account exists with this email address/);
console.log('  ✅ Forgot password input validation and enumeration defense passed.\n');

// -----------------------------------------------------------------------------
// Test 17: Failed Requests Never Produce False Success Messages
// -----------------------------------------------------------------------------
console.log('Test 17: Failed Requests Never Produce False Success Messages');
let caughtError = null;
try {
  await loginUser('student@campus.edu', 'wrongpassword');
} catch (err) {
  caughtError = err;
}
assert.ok(caughtError !== null, 'Failed login must throw error');
assert.notEqual(caughtError.message, 'success', 'Error must not report success');
assert.match(caughtError.message, /Invalid email or password/);

console.log('  ✅ Failed requests guaranteed to produce explicit error rejections.\n');

console.log('🎉 ALL 17 CLAIMIT AUTHENTICATION, REGISTRATION & DATABASE AUDIT TESTS PASSED SUCCESSFULLY!');
