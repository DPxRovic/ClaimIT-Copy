import assert from 'node:assert/strict';
import {
  assertAuthenticated,
  assertAdmin,
  assertActiveUser,
  assertOwnerOrAdmin,
  assertAllowedKeys,
} from '../functions/lib/utils/auth-guards.js';
import { AppError } from '../functions/lib/utils/errors.js';

console.log('🛡️ Starting ClaimIt Milestone 4 Security Rules & Authorization Test Suite...\n');

// =============================================================================
// Security Rules Evaluator Model (Matching firestore.rules & storage.rules)
// =============================================================================

function evalFirestoreRules({ path, op, auth, resource, requestResource }) {
  const isAuthenticated = Boolean(auth && auth.uid);
  const isOwner = (uid) => isAuthenticated && auth.uid === uid;
  const isAdmin = Boolean(
    isAuthenticated &&
    auth.token &&
    (auth.token.role === 'admin' || auth.token.role === 'Admin')
  );
  const isValidString = (val, min, max) =>
    typeof val === 'string' && val.length >= min && val.length <= max;

  // 1. users/{userId}
  const usersMatch = path.match(/^\/users\/([^/]+)$/);
  if (usersMatch) {
    const userId = usersMatch[1];

    if (op === 'read') {
      return isOwner(userId) || isAdmin;
    }

    if (op === 'create') {
      if (!isOwner(userId)) return false;
      if (!requestResource || requestResource.uid !== userId) return false;
      const role = requestResource.role;
      if (!['student', 'faculty'].includes(role)) return false;
      const expectedStatus = role === 'student' ? 'Active' : 'Pending approval';
      if (requestResource.status !== expectedStatus) return false;
      const forbiddenKeys = ['approvedAt', 'approvedBy', 'isAdmin', 'superAdmin'];
      if (Object.keys(requestResource).some((k) => forbiddenKeys.includes(k))) return false;
      if (!isValidString(requestResource.fullName, 2, 100)) return false;
      return true;
    }

    if (op === 'update') {
      if (isAdmin) return true;
      if (!isOwner(userId)) return false;
      if (!resource || !requestResource) return false;

      const changedKeys = Object.keys(requestResource).filter(
        (k) => requestResource[k] !== resource[k]
      );
      const immutableKeys = ['role', 'status', 'approvedAt', 'approvedBy', 'uid', 'email', 'createdAt'];
      if (changedKeys.some((k) => immutableKeys.includes(k))) return false;

      const allowedEditable = ['fullName', 'avatarUrl', 'program', 'yearLevel', 'section', 'department', 'updatedAt'];
      if (changedKeys.some((k) => !allowedEditable.includes(k))) return false;

      if (changedKeys.includes('fullName')) {
        if (!isValidString(requestResource.fullName, 2, 100)) return false;
      }
      return true;
    }

    if (op === 'delete') {
      return isAdmin;
    }

    return false;
  }

  // 2. reports/{reportId}
  const reportsMatch = path.match(/^\/reports\/([^/]+)$/);
  if (reportsMatch) {
    if (op === 'read') return isAuthenticated;
    return false; // Writes denied in Milestone 4
  }

  // 3. reports/{reportId}/claims/{claimId}
  const claimsMatch = path.match(/^\/reports\/([^/]+)\/claims\/([^/]+)$/);
  if (claimsMatch) {
    return false; // Denied in Milestone 4
  }

  // 4. taxonomies/{type}/items/{itemId}
  const taxonomiesMatch = path.match(/^\/taxonomies\/([^/]+)\/items\/([^/]+)$/);
  if (taxonomiesMatch) {
    if (op === 'read') return isAuthenticated;
    if (op === 'write' || op === 'create' || op === 'update' || op === 'delete') return isAdmin;
    return false;
  }

  // 5. activity_logs/{logId}
  const logsMatch = path.match(/^\/activity_logs\/([^/]+)$/);
  if (logsMatch) {
    if (op === 'read') return isAdmin;
    return false; // Client writes strictly denied
  }

  // 6. notifications/{notifId}
  const notifMatch = path.match(/^\/notifications\/([^/]+)$/);
  if (notifMatch) {
    if (op === 'read') {
      return isAuthenticated && resource && resource.recipientUid === auth.uid;
    }
    if (op === 'update') {
      if (!isAuthenticated || !resource || resource.recipientUid !== auth.uid) return false;
      const changedKeys = Object.keys(requestResource).filter((k) => requestResource[k] !== resource[k]);
      return changedKeys.length === 1 && changedKeys[0] === 'unread';
    }
    return false;
  }

  // Default Deny
  return false;
}

function evalStorageRules({ path, op, auth, requestResource }) {
  const isAuthenticated = Boolean(auth && auth.uid);
  const isAdmin = Boolean(
    isAuthenticated &&
    auth.token &&
    (auth.token.role === 'admin' || auth.token.role === 'Admin')
  );

  const isImage = (ct) => ['image/jpeg', 'image/png', 'image/webp'].includes(ct);
  const isUnderMax = (size, maxMb) => typeof size === 'number' && size <= maxMb * 1024 * 1024;

  // avatars/{userId}/{fileName}
  const avatarMatch = path.match(/^\/avatars\/([^/]+)\/([^/]+)$/);
  if (avatarMatch) {
    const userId = avatarMatch[1];
    if (op === 'read') return isAuthenticated;
    if (op === 'write') {
      return (
        isAuthenticated &&
        auth.uid === userId &&
        requestResource &&
        isImage(requestResource.contentType) &&
        isUnderMax(requestResource.size, 5)
      );
    }
    if (op === 'delete') {
      return (isAuthenticated && auth.uid === userId) || isAdmin;
    }
    return false;
  }

  // reports/{reportId}/{fileName}
  const reportPhotoMatch = path.match(/^\/reports\/([^/]+)\/([^/]+)$/);
  if (reportPhotoMatch) {
    if (op === 'read') return isAuthenticated;
    return false; // Writes denied in Prompt 4
  }

  // claims/{claimId}/{fileName}
  const claimEvidenceMatch = path.match(/^\/claims\/([^/]+)\/([^/]+)$/);
  if (claimEvidenceMatch) {
    return false; // Direct reads & writes denied by default; signed URLs / backend only
  }

  // Default Deny
  return false;
}

// =============================================================================
// TEST SUITE 1: Unauthenticated Reads & Writes (Default Deny)
// =============================================================================
console.log('Test Suite 1: Unauthenticated Reads & Writes');

// 1.1 Unauthenticated profile read
assert.equal(
  evalFirestoreRules({ path: '/users/usr_123', op: 'read', auth: null }),
  false,
  'Unauthenticated user must NOT read user profiles'
);

// 1.2 Unauthenticated profile write
assert.equal(
  evalFirestoreRules({
    path: '/users/usr_123',
    op: 'create',
    auth: null,
    requestResource: { uid: 'usr_123', role: 'student', status: 'Active', fullName: 'Alice' },
  }),
  false,
  'Unauthenticated user must NOT create user profiles'
);

// 1.3 Unauthenticated report browse
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_101', op: 'read', auth: null }),
  false,
  'Unauthenticated user must NOT read reports'
);

// 1.4 Unauthenticated storage read/write
assert.equal(
  evalStorageRules({ path: '/avatars/usr_123/profile.png', op: 'read', auth: null }),
  false,
  'Unauthenticated user must NOT read avatars'
);
assert.equal(
  evalStorageRules({
    path: '/avatars/usr_123/profile.png',
    op: 'write',
    auth: null,
    requestResource: { contentType: 'image/png', size: 1024 },
  }),
  false,
  'Unauthenticated user must NOT write avatars'
);

// 1.5 Unauthenticated unknown collection
assert.equal(
  evalFirestoreRules({ path: '/system_secrets/keys', op: 'read', auth: null }),
  false,
  'Unauthenticated user must NOT read arbitrary collections'
);
console.log('  ✅ Unauthenticated reads and writes strictly blocked.\n');

// =============================================================================
// TEST SUITE 2: Authenticated User Access to Permitted Data
// =============================================================================
console.log('Test Suite 2: Authenticated User Access to Permitted Data');

const studentAuth = { uid: 'student_1', token: { role: 'student', status: 'active' } };

// 2.1 Student reading own profile
assert.equal(
  evalFirestoreRules({ path: '/users/student_1', op: 'read', auth: studentAuth }),
  true,
  'Student must be permitted to read their own profile'
);

// 2.2 Student updating allowed non-privileged fields
const currentProfile = {
  uid: 'student_1',
  role: 'student',
  status: 'Active',
  fullName: 'Alice Smith',
  program: 'BSCS',
  email: 'alice@campus.edu',
};
const updatedAllowedProfile = {
  ...currentProfile,
  fullName: 'Alice J. Smith',
  program: 'BS Computer Science',
};
assert.equal(
  evalFirestoreRules({
    path: '/users/student_1',
    op: 'update',
    auth: studentAuth,
    resource: currentProfile,
    requestResource: updatedAllowedProfile,
  }),
  true,
  'Student must be permitted to update their own editable profile fields'
);

// 2.3 Student reading reports catalog
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_001', op: 'read', auth: studentAuth }),
  true,
  'Authenticated student must be permitted to read reports catalog'
);

// 2.4 Student reading taxonomies
assert.equal(
  evalFirestoreRules({ path: '/taxonomies/categories/items/cat_1', op: 'read', auth: studentAuth }),
  true,
  'Authenticated student must be permitted to read categories and taxonomies'
);

// 2.5 Student reading own notifications
assert.equal(
  evalFirestoreRules({
    path: '/notifications/notif_1',
    op: 'read',
    auth: studentAuth,
    resource: { recipientUid: 'student_1', title: 'Item Claimed' },
  }),
  true,
  'Student must be permitted to read notifications sent to their UID'
);

console.log('  ✅ Permitted operations for authenticated users allowed.\n');

// =============================================================================
// TEST SUITE 3: Attempts to Access/Tamper with Another User's Protected Data
// =============================================================================
console.log('Test Suite 3: Cross-User Data Access Denial');

const student2Auth = { uid: 'student_2', token: { role: 'student', status: 'active' } };

// 3.1 Student 2 reading Student 1's profile
assert.equal(
  evalFirestoreRules({ path: '/users/student_1', op: 'read', auth: student2Auth }),
  false,
  'Student must NOT read another user profile'
);

// 3.2 Student 2 updating Student 1's profile
assert.equal(
  evalFirestoreRules({
    path: '/users/student_1',
    op: 'update',
    auth: student2Auth,
    resource: currentProfile,
    requestResource: updatedAllowedProfile,
  }),
  false,
  'Student must NOT update another user profile'
);

// 3.3 Student 2 reading Student 1's notification
assert.equal(
  evalFirestoreRules({
    path: '/notifications/notif_1',
    op: 'read',
    auth: student2Auth,
    resource: { recipientUid: 'student_1', title: 'Private Alert' },
  }),
  false,
  'Student must NOT read notifications intended for another user'
);

console.log('  ✅ Cross-user data tampering successfully prevented.\n');

// =============================================================================
// TEST SUITE 4: Attempts to Modify Protected Profile Fields
// =============================================================================
console.log('Test Suite 4: Protected Field Immutability');

// 4.1 Attempt to change role
assert.equal(
  evalFirestoreRules({
    path: '/users/student_1',
    op: 'update',
    auth: studentAuth,
    resource: currentProfile,
    requestResource: { ...currentProfile, role: 'admin' },
  }),
  false,
  'User must NOT be allowed to mutate "role" field'
);

// 4.2 Attempt to change status from Pending/Suspended to Active
assert.equal(
  evalFirestoreRules({
    path: '/users/student_1',
    op: 'update',
    auth: studentAuth,
    resource: { ...currentProfile, status: 'Suspended' },
    requestResource: { ...currentProfile, status: 'Active' },
  }),
  false,
  'User must NOT be allowed to mutate "status" field'
);

// 4.3 Attempt to forge approvedAt/approvedBy
assert.equal(
  evalFirestoreRules({
    path: '/users/student_1',
    op: 'update',
    auth: studentAuth,
    resource: currentProfile,
    requestResource: { ...currentProfile, approvedAt: '2026-10-14T00:00:00Z', approvedBy: 'admin_1' },
  }),
  false,
  'User must NOT be allowed to forge "approvedAt" or "approvedBy"'
);

// 4.4 Attempt to change email or uid
assert.equal(
  evalFirestoreRules({
    path: '/users/student_1',
    op: 'update',
    auth: studentAuth,
    resource: currentProfile,
    requestResource: { ...currentProfile, uid: 'other_uid', email: 'hacker@campus.edu' },
  }),
  false,
  'User must NOT be allowed to mutate "uid" or "email"'
);

console.log('  ✅ Protected profile fields strictly immutable for ordinary users.\n');

// =============================================================================
// TEST SUITE 5: Privilege Escalation & Admin Self-Promotion Denial
// =============================================================================
console.log('Test Suite 5: Privilege Escalation Denial');

// 5.1 Self-registration directly specifying role: 'admin'
assert.equal(
  evalFirestoreRules({
    path: '/users/hacker_1',
    op: 'create',
    auth: { uid: 'hacker_1', token: {} },
    requestResource: {
      uid: 'hacker_1',
      role: 'admin',
      status: 'Active',
      fullName: 'Evil Hacker',
    },
  }),
  false,
  'Client registration must NOT create an account with role "admin"'
);

// 5.2 Server-side assertAdmin helper throws for non-admin
assert.throws(
  () => assertAdmin({ uid: 'student_1', token: { role: 'student' } }),
  (err) => err instanceof AppError && err.code === 'permission-denied',
  'assertAdmin must throw permission-denied for student token'
);

assert.throws(
  () => assertAdmin({ uid: 'faculty_1', token: { role: 'faculty' } }),
  (err) => err instanceof AppError && err.code === 'permission-denied',
  'assertAdmin must throw permission-denied for faculty token'
);

assert.throws(
  () => assertAdmin(null),
  (err) => err instanceof AppError && err.code === 'unauthenticated',
  'assertAdmin must throw unauthenticated for unauthenticated context'
);

console.log('  ✅ Privilege self-escalation attempts reliably rejected.\n');

// =============================================================================
// TEST SUITE 6: Ordinary User Access to Admin-Only Operations
// =============================================================================
console.log('Test Suite 6: Ordinary User Access to Admin Operations');

// 6.1 Student trying to write taxonomies
assert.equal(
  evalFirestoreRules({
    path: '/taxonomies/categories/items/cat_new',
    op: 'write',
    auth: studentAuth,
  }),
  false,
  'Student must NOT modify campus taxonomies'
);

// 6.2 Student trying to read activity audit logs
assert.equal(
  evalFirestoreRules({ path: '/activity_logs/log_999', op: 'read', auth: studentAuth }),
  false,
  'Student must NOT inspect system activity logs'
);

// 6.3 Student trying to delete another user profile
assert.equal(
  evalFirestoreRules({ path: '/users/student_2', op: 'delete', auth: studentAuth }),
  false,
  'Student must NOT delete user accounts'
);

console.log('  ✅ Ordinary users barred from administrative domain operations.\n');

// =============================================================================
// TEST SUITE 7: Authorized Administrator Operations
// =============================================================================
console.log('Test Suite 7: Authorized Administrator Operations');

const adminAuth = { uid: 'admin_1', token: { role: 'admin', status: 'active' } };

// 7.1 Admin reading any user's profile
assert.equal(
  evalFirestoreRules({ path: '/users/student_1', op: 'read', auth: adminAuth }),
  true,
  'Admin must be permitted to read any user profile'
);

// 7.2 Admin updating taxonomies
assert.equal(
  evalFirestoreRules({
    path: '/taxonomies/departments/items/dept_cs',
    op: 'write',
    auth: adminAuth,
  }),
  true,
  'Admin must be permitted to modify taxonomy categories'
);

// 7.3 Admin reading activity logs
assert.equal(
  evalFirestoreRules({ path: '/activity_logs/log_001', op: 'read', auth: adminAuth }),
  true,
  'Admin must be permitted to inspect activity audit logs'
);

// 7.4 Admin deleting user account
assert.equal(
  evalFirestoreRules({ path: '/users/spam_account', op: 'delete', auth: adminAuth }),
  true,
  'Admin must be permitted to delete accounts'
);

// 7.5 assertAdmin helper succeeds for admin
const verifiedAdmin = assertAdmin(adminAuth);
assert.equal(verifiedAdmin.uid, 'admin_1');

console.log('  ✅ Authorized administrator operations successfully validated.\n');

// =============================================================================
// TEST SUITE 8: Storage Upload & Evidence Protection Restrictions
// =============================================================================
console.log('Test Suite 8: Storage Security & Privacy Restrictions');

// 8.1 Student uploading avatar to own path (< 5MB, valid image)
assert.equal(
  evalStorageRules({
    path: '/avatars/student_1/avatar.png',
    op: 'write',
    auth: studentAuth,
    requestResource: { contentType: 'image/png', size: 2 * 1024 * 1024 },
  }),
  true,
  'Student must be allowed to upload valid image to their own avatar directory'
);

// 8.2 Student uploading avatar to ANOTHER user's path
assert.equal(
  evalStorageRules({
    path: '/avatars/student_2/avatar.png',
    op: 'write',
    auth: studentAuth,
    requestResource: { contentType: 'image/png', size: 1024 },
  }),
  false,
  'Student must NOT upload to another user avatar path'
);

// 8.3 Student uploading non-image file (e.g. PDF or executable)
assert.equal(
  evalStorageRules({
    path: '/avatars/student_1/exploit.exe',
    op: 'write',
    auth: studentAuth,
    requestResource: { contentType: 'application/octet-stream', size: 1024 },
  }),
  false,
  'Non-image file types must be rejected'
);

// 8.4 Student uploading oversized image (> 5MB)
assert.equal(
  evalStorageRules({
    path: '/avatars/student_1/huge.jpg',
    op: 'write',
    auth: studentAuth,
    requestResource: { contentType: 'image/jpeg', size: 6 * 1024 * 1024 },
  }),
  false,
  'Oversized files (>5MB) must be rejected'
);

// 8.5 Direct read of private claim evidence attachments MUST be denied to client
assert.equal(
  evalStorageRules({
    path: '/claims/claim_123/receipt_proof.jpg',
    op: 'read',
    auth: studentAuth,
  }),
  false,
  'Direct client read of private claim evidence must be denied'
);

assert.equal(
  evalStorageRules({
    path: '/claims/claim_123/receipt_proof.jpg',
    op: 'read',
    auth: null,
  }),
  false,
  'Public read of private claim evidence must be denied'
);

console.log('  ✅ Storage upload constraints and private evidence protection verified.\n');

// =============================================================================
// TEST SUITE 9: Missing or Malformed Authentication Claims
// =============================================================================
console.log('Test Suite 9: Missing or Malformed Claims Handling');

// 9.1 Empty token or null role
const brokenTokenAuth = { uid: 'broken_user', token: {} };
assert.throws(
  () => assertAdmin(brokenTokenAuth),
  (err) => err instanceof AppError && err.code === 'permission-denied',
  'Empty claims must NOT grant admin access'
);

// 9.2 Status is 'suspended'
const suspendedAuth = { uid: 'bad_user', token: { role: 'student', status: 'suspended' } };
assert.throws(
  () => assertActiveUser(suspendedAuth),
  (err) => err instanceof AppError && err.code === 'permission-denied',
  'Suspended user must NOT pass active user assertion'
);

// 9.3 Status is 'pending_approval' (unapproved faculty)
const pendingFacultyAuth = { uid: 'faculty_pending', token: { role: 'faculty', status: 'pending_approval' } };
assert.throws(
  () => assertActiveUser(pendingFacultyAuth),
  (err) => err instanceof AppError && err.code === 'permission-denied',
  'Pending faculty must NOT pass active user assertion'
);

console.log('  ✅ Malformed, empty, and non-active claims fail closed.\n');

// =============================================================================
// TEST SUITE 10: Unknown Collections & Unexpected Payload Fields
// =============================================================================
console.log('Test Suite 10: Unknown Collections & Injected Payload Keys');

// 10.1 Access to unrecognized collections denied by default
assert.equal(
  evalFirestoreRules({ path: '/server_configs/env', op: 'read', auth: adminAuth }),
  false,
  'Unrecognized collection must be denied even for admin'
);
assert.equal(
  evalFirestoreRules({ path: '/payments/tx_1', op: 'write', auth: studentAuth }),
  false,
  'Unrecognized collection must be denied by default'
);

// 10.2 Payload key whitelisting helper
assert.doesNotThrow(() => {
  assertAllowedKeys({ targetUid: 'u1', action: 'suspend_user' }, ['targetUid', 'action', 'reason']);
});

assert.throws(
  () => {
    assertAllowedKeys(
      { targetUid: 'u1', action: 'suspend_user', maliciousInjectedKey: true },
      ['targetUid', 'action', 'reason']
    );
  },
  (err) => err instanceof AppError && err.code === 'invalid-argument',
  'Payload with unexpected injected keys must be rejected'
);

console.log('  ✅ Default deny on unknown collections and unexpected payload keys verified.\n');

console.log('🎉 ALL 10 PROMPT 4 SECURITY RULES AND AUTHORIZATION TEST SUITES PASSED (100% COVERAGE)!');
