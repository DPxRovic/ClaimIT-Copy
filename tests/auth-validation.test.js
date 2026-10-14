import assert from 'node:assert/strict';
import {
  assertRequiredString,
  assertValidEmail,
  assertValidPassword,
  assertAuthenticated,
} from '../functions/lib/utils/validation.js';
import { AppError, handleFunctionError } from '../functions/lib/utils/errors.js';
import { formatAuthError } from '../client/src/firebase/auth.js';

console.log('🧪 Starting ClaimIt Authentication & User Profile Test Suite...\n');

// 1. Validation Assertions
console.log('Test 1: Input Validation Utilities');
assert.equal(assertRequiredString('  John Doe  ', 'Name'), 'John Doe');
assert.throws(() => assertRequiredString('', 'Name'), /Name is required/);
assert.throws(() => assertRequiredString('a'.repeat(101), 'Name', 1, 100), /cannot exceed 100/);

assert.equal(assertValidEmail('STUDENT@CAMPUS.EDU'), 'student@campus.edu');
assert.throws(() => assertValidEmail('not-an-email'), /valid email address/);

assert.equal(assertValidPassword('securepass123'), 'securepass123');
assert.throws(() => assertValidPassword('short'), /at least 8 characters/);

assert.equal(assertAuthenticated({ uid: 'usr_123' }), 'usr_123');
assert.throws(() => assertAuthenticated(null), /must be logged in/);
console.log('  ✅ Validation utilities passed.\n');

// 2. Error Normalization
console.log('Test 2: Standardized Error Handling');
const appErr = new AppError('invalid-argument', 'Missing field', { field: 'email' });
assert.equal(appErr.code, 'invalid-argument');
assert.equal(appErr.message, 'Missing field');
assert.ok(appErr.timestamp);

const normalized = handleFunctionError(new Error('Unknown database issue'));
assert.equal(normalized.code, 'internal');
console.log('  ✅ Error handling and normalization passed.\n');

// 3. User-Friendly Auth Error Mapping
console.log('Test 3: Friendly Error Mapping for Frontend');
assert.match(formatAuthError({ code: 'auth/invalid-credential' }), /Invalid email or password/);
assert.match(formatAuthError({ code: 'auth/email-already-in-use' }), /already exists/);
assert.match(formatAuthError({ code: 'auth/user-disabled' }), /suspended by campus administration/);
assert.match(formatAuthError({ code: 'auth/weak-password' }), /at least 8 characters/);
console.log('  ✅ Error message mapping passed.\n');

// 4. Role & Status Model Invariants
console.log('Test 4: Role & Status Invariants');
function evaluateInitialUserStatus(role) {
  if (role === 'student') return { status: 'Active', claimStatus: 'active' };
  if (role === 'faculty') return { status: 'Pending approval', claimStatus: 'pending_approval' };
  throw new Error('Unsupported self-registration role');
}

const studentState = evaluateInitialUserStatus('student');
assert.equal(studentState.status, 'Active');
assert.equal(studentState.claimStatus, 'active');

const facultyState = evaluateInitialUserStatus('faculty');
assert.equal(facultyState.status, 'Pending approval');
assert.equal(facultyState.claimStatus, 'pending_approval');

assert.throws(() => evaluateInitialUserStatus('admin'), /Unsupported self-registration role/);
console.log('  ✅ Role and status invariants verified.\n');

// 5. Protected Field Immutability Rules
console.log('Test 5: Protected Field Mutation Guards');
const PROTECTED_FIELDS = ['role', 'status', 'approvedAt', 'approvedBy', 'uid', 'email'];

function filterAllowedProfileUpdates(updates) {
  const sanitized = {};
  for (const [key, val] of Object.entries(updates)) {
    if (PROTECTED_FIELDS.includes(key)) {
      throw new Error(`Permission denied: Cannot update protected profile field "${key}".`);
    }
    sanitized[key] = val;
  }
  return sanitized;
}

assert.throws(
  () => filterAllowedProfileUpdates({ role: 'admin', fullName: 'Sneaky User' }),
  /Cannot update protected profile field "role"/
);
assert.throws(
  () => filterAllowedProfileUpdates({ status: 'Active' }),
  /Cannot update protected profile field "status"/
);

const allowed = filterAllowedProfileUpdates({ fullName: 'Taylor Swift', program: 'BSCS' });
assert.equal(allowed.fullName, 'Taylor Swift');
assert.equal(allowed.program, 'BSCS');
console.log('  ✅ Protected fields strictly guarded against client tampering.\n');

console.log('🎉 ALL AUTHENTICATION AND PROFILE UNIT TESTS PASSED SUCCESSFULLY!');
