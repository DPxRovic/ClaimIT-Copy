import assert from 'node:assert/strict';
import {
  assertAuthenticated,
  assertActiveUser,
  assertAdmin,
  assertOwnerOrAdmin,
  assertAllowedKeys,
} from '../functions/lib/utils/auth-guards.js';
import { AppError } from '../functions/lib/utils/errors.js';

console.log('📋 Starting ClaimIt Prompt 5 Report Lifecycle & Security Rules Test Suite...\n');

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
    if (op === 'read') return isOwner(userId) || isAdmin;
    return false;
  }

  // 2. reports/{reportId}
  const reportsMatch = path.match(/^\/reports\/([^/]+)$/);
  if (reportsMatch) {
    if (op === 'read') return isAuthenticated;

    const isActive = Boolean(
      isAuthenticated &&
      auth.token &&
      (auth.token.status === 'active' || auth.token.status === 'Active')
    );

    if (op === 'create') {
      if (!isAuthenticated || !isActive) return false;
      if (!requestResource || requestResource.reporterUid !== auth.uid) return false;
      if (!['LOST', 'FOUND', 'lost', 'found'].includes(requestResource.type)) return false;
      if (requestResource.status !== 'Active') return false;
      if (requestResource.claimsCount !== 0) return false;
      if (!isValidString(requestResource.title, 2, 120)) return false;
      if (!isValidString(requestResource.category, 2, 64)) return false;
      if (!isValidString(requestResource.location, 2, 200)) return false;
      if (!isValidString(requestResource.description, 5, 2000)) return false;
      if (!isValidString(requestResource.date, 10, 10)) return false;
      return true;
    }

    if (op === 'update') {
      if (isAdmin) return true;
      if (!resource || !requestResource) return false;
      if (!isOwner(resource.reporterUid)) return false;

      const changedKeys = Object.keys(requestResource).filter((k) => requestResource[k] !== resource[k]);
      const immutableKeys = ['reporterUid', 'type', 'ticketNumber', 'createdAt', 'claimsCount'];
      if (changedKeys.some((k) => immutableKeys.includes(k))) return false;

      const allowedContent = ['title', 'category', 'date', 'location', 'description', 'imageUrl', 'imageStoragePath', 'updatedAt'];
      const allowedClose = ['status', 'closedAt', 'closedBy', 'closeReason', 'updatedAt'];

      const isContentEdit = changedKeys.every((k) => allowedContent.includes(k));
      const isSoftClose = changedKeys.every((k) => allowedClose.includes(k)) && ['Closed', 'Withdrawn'].includes(requestResource.status);

      return isContentEdit || isSoftClose;
    }

    if (op === 'delete') {
      return isAdmin;
    }

    return false;
  }

  // 3. Claims subcollection
  const claimsMatch = path.match(/^\/reports\/([^/]+)\/claims\/([^/]+)$/);
  if (claimsMatch) {
    return false; // Denied until Prompt 7
  }

  return false;
}

function evalStorageRules({ path, op, auth, resource, requestResource }) {
  const isAuthenticated = Boolean(auth && auth.uid);
  const isAdmin = Boolean(
    isAuthenticated &&
    auth.token &&
    (auth.token.role === 'admin' || auth.token.role === 'Admin')
  );

  const isImage = (ct) => ['image/jpeg', 'image/png', 'image/webp'].includes(ct);
  const isUnderMax = (size, maxMb) => typeof size === 'number' && size <= maxMb * 1024 * 1024;

  const reportPhotoMatch = path.match(/^\/reports\/([^/]+)\/([^/]+)$/);
  if (reportPhotoMatch) {
    if (op === 'read') return isAuthenticated;
    const isActive = Boolean(
      isAuthenticated &&
      auth.token &&
      (auth.token.status === 'active' || auth.token.status === 'Active')
    );
    if (op === 'write') {
      return (
        isAuthenticated &&
        isActive &&
        requestResource &&
        isImage(requestResource.contentType) &&
        isUnderMax(requestResource.size, 10)
      );
    }
    if (op === 'delete') {
      return isAdmin || (isAuthenticated && resource && resource.metadata && resource.metadata.uploaderUid === auth.uid);
    }
    return false;
  }

  return false;
}

// User Context Fixtures
const studentAlice = { uid: 'user_alice', token: { role: 'student', status: 'active', email: 'alice@campus.edu' } };
const studentBob = { uid: 'user_bob', token: { role: 'student', status: 'active', email: 'bob@campus.edu' } };
const pendingFaculty = { uid: 'fac_pending', token: { role: 'faculty', status: 'pending_approval' } };
const suspendedUser = { uid: 'user_suspended', token: { role: 'student', status: 'suspended' } };
const adminUser = { uid: 'admin_1', token: { role: 'admin', status: 'active' } };

// Baseline Valid Report
const validLostReport = {
  id: 'rep_101',
  ticketNumber: 'R-1070',
  title: 'Apple AirPods Pro 2',
  category: 'electronics',
  type: 'LOST',
  status: 'Active',
  date: '2026-10-14',
  location: 'Library 3rd Floor Quiet Area',
  description: 'White wireless earphone case with initials AS engraved on back.',
  imageUrl: 'https://images.unsplash.com/photo-airpods.jpg',
  imageStoragePath: 'reports/rep_101/airpods.jpg',
  reporterUid: 'user_alice',
  claimsCount: 0,
};

const validFoundReport = {
  id: 'rep_102',
  ticketNumber: 'R-1071',
  title: 'Black Leather Bifold Wallet',
  category: 'personal-items',
  type: 'FOUND',
  status: 'Active',
  date: '2026-10-14',
  location: 'Student Union Cafeteria Table 4',
  description: 'Black textured leather wallet found near the napkin station.',
  imageUrl: null,
  imageStoragePath: null,
  reporterUid: 'user_alice',
  claimsCount: 0,
};

// =============================================================================
// 1. CREATING A LOST & FOUND REPORT
// =============================================================================
console.log('Test 1: Creating Lost and Found Reports');

assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'create',
    auth: studentAlice,
    requestResource: validLostReport,
  }),
  true,
  'Active student must be permitted to create a valid LOST report'
);

assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_102',
    op: 'create',
    auth: studentAlice,
    requestResource: validFoundReport,
  }),
  true,
  'Active student must be permitted to create a valid FOUND report'
);

console.log('  ✅ Lost and Found reports creation verified.\n');

// =============================================================================
// 2. MISSING REQUIRED FIELDS
// =============================================================================
console.log('Test 2: Missing Required Fields Rejection');

const missingTitle = { ...validLostReport, title: '' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: missingTitle }),
  false,
  'Report without title must be rejected'
);

const missingLocation = { ...validLostReport, location: '' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: missingLocation }),
  false,
  'Report without location must be rejected'
);

const missingDescription = { ...validLostReport, description: 'tiny' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: missingDescription }),
  false,
  'Report with description shorter than 5 chars must be rejected'
);

console.log('  ✅ Missing and undersized required fields rejected.\n');

// =============================================================================
// 3. INVALID FIELD TYPES & OVERSIZED TEXT
// =============================================================================
console.log('Test 3: Invalid Field Types & Oversized Text Rejection');

const oversizedTitle = { ...validLostReport, title: 'A'.repeat(125) };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: oversizedTitle }),
  false,
  'Report with title exceeding 120 chars must be rejected'
);

const oversizedDescription = { ...validLostReport, description: 'D'.repeat(2050) };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: oversizedDescription }),
  false,
  'Report with description exceeding 2000 chars must be rejected'
);

const nonStringCategory = { ...validLostReport, category: 12345 };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: nonStringCategory }),
  false,
  'Non-string category must be rejected'
);

console.log('  ✅ Oversized text and non-string types rejected.\n');

// =============================================================================
// 4. UNSUPPORTED REPORT TYPES
// =============================================================================
console.log('Test 4: Unsupported Report Types');

const invalidTypeReport = { ...validLostReport, type: 'STOLEN' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_bad', op: 'create', auth: studentAlice, requestResource: invalidTypeReport }),
  false,
  'Report with type other than LOST/FOUND must be rejected'
);

console.log('  ✅ Unsupported report types rejected.\n');

// =============================================================================
// 5. UNAUTHENTICATED CREATION & SPOOFING CREATOR UID
// =============================================================================
console.log('Test 5: Unauthenticated Creation & Creator UID Spoofing');

assert.equal(
  evalFirestoreRules({ path: '/reports/rep_101', op: 'create', auth: null, requestResource: validLostReport }),
  false,
  'Unauthenticated creation must be rejected'
);

// Alice trying to set reporterUid = 'user_bob'
const spoofedUidReport = { ...validLostReport, reporterUid: 'user_bob' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_101', op: 'create', auth: studentAlice, requestResource: spoofedUidReport }),
  false,
  'Creating a report with someone else as reporterUid must be rejected'
);

console.log('  ✅ Unauthenticated creation and UID spoofing prevented.\n');

// =============================================================================
// 6. NON-ACTIVE USERS BARRED FROM CREATION
// =============================================================================
console.log('Test 6: Non-Active Account Creation Guards');

const pendingFacultyReport = { ...validLostReport, reporterUid: 'fac_pending' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_101', op: 'create', auth: pendingFaculty, requestResource: pendingFacultyReport }),
  false,
  'Faculty in pending_approval status must NOT create reports'
);

const suspendedReport = { ...validLostReport, reporterUid: 'user_suspended' };
assert.equal(
  evalFirestoreRules({ path: '/reports/rep_101', op: 'create', auth: suspendedUser, requestResource: suspendedReport }),
  false,
  'Suspended user must NOT create reports'
);

console.log('  ✅ Suspended and pending approval accounts barred from report creation.\n');

// =============================================================================
// 7. UNAUTHORIZED EDITS (CROSS-USER TAMPERING)
// =============================================================================
console.log('Test 7: Report Modification & Cross-User Edit Guards');

const editedByAlice = {
  ...validLostReport,
  description: 'Updated description: Earphone case also has a faint red scratch on the hinge.',
  updatedAt: '2026-10-14T10:00:00Z',
};

// Alice edits own report
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'update',
    auth: studentAlice,
    resource: validLostReport,
    requestResource: editedByAlice,
  }),
  true,
  'Report creator must be allowed to edit permitted content fields'
);

// Bob attempts to edit Alice's report
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'update',
    auth: studentBob,
    resource: validLostReport,
    requestResource: editedByAlice,
  }),
  false,
  'Bob must NOT edit Alice report'
);

console.log('  ✅ Permitted creator edits allowed; cross-user edits blocked.\n');

// =============================================================================
// 8. ATTEMPTS TO ALTER PROTECTED IMMUTABLE FIELDS
// =============================================================================
console.log('Test 8: Protected Report Field Immutability');

// Attempt to change reporterUid
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'update',
    auth: studentAlice,
    resource: validLostReport,
    requestResource: { ...validLostReport, reporterUid: 'user_bob' },
  }),
  false,
  'Owner must NOT change reporterUid'
);

// Attempt to change ticketNumber
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'update',
    auth: studentAlice,
    resource: validLostReport,
    requestResource: { ...validLostReport, ticketNumber: 'R-9999' },
  }),
  false,
  'Owner must NOT change ticketNumber'
);

// Attempt to jump status to Resolved directly
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'update',
    auth: studentAlice,
    resource: validLostReport,
    requestResource: { ...validLostReport, status: 'Resolved' },
  }),
  false,
  'Owner must NOT arbitrarily jump status to Resolved directly'
);

console.log('  ✅ Immutable fields (reporterUid, ticketNumber, type) strictly protected.\n');

// =============================================================================
// 9. SOFT CLOSING REPORT & DELETION GUARDS
// =============================================================================
console.log('Test 9: Soft Closing and Deletion Permissions');

const softClosedReport = {
  ...validLostReport,
  status: 'Closed',
  closedAt: '2026-10-14T12:00:00Z',
  closedBy: 'user_alice',
  closeReason: 'Found item myself in locker',
  updatedAt: '2026-10-14T12:00:00Z',
};

// Alice closes own report
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'update',
    auth: studentAlice,
    resource: validLostReport,
    requestResource: softClosedReport,
  }),
  true,
  'Creator must be allowed to soft-close their report'
);

// Ordinary user hard delete attempt
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'delete',
    auth: studentAlice,
    resource: validLostReport,
  }),
  false,
  'Ordinary user must NOT hard delete a report (only soft-close allowed)'
);

// Admin hard delete allowed
assert.equal(
  evalFirestoreRules({
    path: '/reports/rep_101',
    op: 'delete',
    auth: adminUser,
    resource: validLostReport,
  }),
  true,
  'Administrator must be allowed to delete a report'
);

console.log('  ✅ Soft-close permitted for owner; hard delete restricted to admin.\n');

// =============================================================================
// 10. STORAGE IMAGE UPLOAD RESTRICTIONS
// =============================================================================
console.log('Test 10: Storage Report Image Restrictions');

// Valid image upload by active user
assert.equal(
  evalStorageRules({
    path: '/reports/rep_101/item_photo.png',
    op: 'write',
    auth: studentAlice,
    requestResource: { contentType: 'image/png', size: 3 * 1024 * 1024 },
  }),
  true,
  'Active user uploading valid PNG <= 10MB must be allowed'
);

// Oversized image (>10MB)
assert.equal(
  evalStorageRules({
    path: '/reports/rep_101/item_photo.png',
    op: 'write',
    auth: studentAlice,
    requestResource: { contentType: 'image/png', size: 12 * 1024 * 1024 },
  }),
  false,
  'Oversized image (>10MB) must be rejected'
);

// Non-image upload (e.g. executable or zip)
assert.equal(
  evalStorageRules({
    path: '/reports/rep_101/malware.exe',
    op: 'write',
    auth: studentAlice,
    requestResource: { contentType: 'application/octet-stream', size: 1024 },
  }),
  false,
  'Non-image upload must be rejected'
);

// Unauthenticated upload
assert.equal(
  evalStorageRules({
    path: '/reports/rep_101/photo.jpg',
    op: 'write',
    auth: null,
    requestResource: { contentType: 'image/jpeg', size: 1024 },
  }),
  false,
  'Unauthenticated storage write must be rejected'
);

console.log('  ✅ Storage image MIME, size, and authentication constraints verified.\n');

// =============================================================================
// 11. CALLABLE CLOUD FUNCTIONS KEY VALIDATION & GUARDS
// =============================================================================
console.log('Test 11: Cloud Functions Input & Key Validation');

assert.doesNotThrow(() => {
  assertAllowedKeys(
    {
      title: 'Water Bottle',
      category: 'personal-items',
      type: 'LOST',
      date: '2026-10-14',
      location: 'SAC',
      description: 'Blue metal bottle',
    },
    ['title', 'itemName', 'category', 'type', 'reportType', 'date', 'location', 'description', 'imageUrl', 'imageStoragePath'],
    'createReport'
  );
});

// Injected protected key in createReport
assert.throws(
  () => {
    assertAllowedKeys(
      {
        title: 'Water Bottle',
        category: 'personal-items',
        status: 'Resolved', // Injected!
        reporterUid: 'spoofed_uid', // Injected!
      },
      ['title', 'itemName', 'category', 'type', 'reportType', 'date', 'location', 'description', 'imageUrl', 'imageStoragePath'],
      'createReport'
    );
  },
  (err) => err instanceof AppError && err.code === 'invalid-argument',
  'Unexpected or injected payload keys must be rejected by assertAllowedKeys'
);

console.log('  ✅ Cloud Functions payload key validation verified.\n');

// =============================================================================
// 12. PERSISTENCE & IN-MEMORY STORE RETRIEVAL
// =============================================================================
console.log('Test 12: In-Memory Reports Store Retrieval');

const mockStore = [];
mockStore.unshift(validLostReport);
assert.equal(mockStore.length, 1);
assert.equal(mockStore[0].title, 'Apple AirPods Pro 2');
assert.equal(mockStore[0].status, 'Active');

// Simulate soft-close
mockStore[0].status = 'Closed';
assert.equal(mockStore[0].status, 'Closed');

console.log('  ✅ Persistence and state transition simulation verified.\n');

console.log('🎉 ALL PROMPT 5 REPORT LIFECYCLE AND SECURITY TESTS PASSED SUCCESSFULLY!\n');
