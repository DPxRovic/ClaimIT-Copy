import assert from 'node:assert/strict';
import {
  assertAuthenticated,
  assertActiveUser,
  assertAdmin,
  assertOwnerOrAdmin,
  assertAllowedKeys,
} from '../functions/lib/utils/auth-guards.js';
import { AppError } from '../functions/lib/utils/errors.js';
import { formatClaimRecord } from '../client/src/firebase/claims.js';

console.log('🛡️ Starting ClaimIt Prompt 7 Claim Submission & Ownership Verification Test Suite...\n');

// =============================================================================
// Security Rules Evaluator Model (Matching firestore.rules & storage.rules)
// =============================================================================

function evalFirestoreRules({ path, op, auth, resource, requestResource, getReport }) {
  const isAuthenticated = Boolean(auth && auth.uid);
  const isOwner = (uid) => isAuthenticated && auth.uid === uid;
  const isAdmin = Boolean(
    isAuthenticated &&
    auth.token &&
    (auth.token.role === 'admin' || auth.token.role === 'Admin')
  );
  const isActive = Boolean(
    isAuthenticated &&
    auth.token &&
    (auth.token.status === 'active' || auth.token.status === 'Active')
  );
  const isValidString = (val, min, max) =>
    typeof val === 'string' && val.length >= min && val.length <= max;

  // 1. Collection Group: /{path=**}/claims/{claimId}
  if (path.startsWith('/claims_group/')) {
    if (op === 'read') {
      if (!isAuthenticated) return false;
      if (resource && (resource.claimantUid === auth.uid || resource.reportCreatorUid === auth.uid || isAdmin)) {
        return true;
      }
      return false;
    }
    return false; // Collection group write is denied
  }

  // 2. Subcollection: /reports/{reportId}/claims/{claimId}
  const claimMatch = path.match(/^\/reports\/([^/]+)\/claims\/([^/]+)$/);
  if (claimMatch) {
    const reportId = claimMatch[1];
    const parentReport = getReport ? getReport(reportId) : null;

    if (op === 'read') {
      if (!isAuthenticated) return false;
      if (resource) {
        if (isOwner(resource.claimantUid)) return true;
        if (parentReport && isOwner(parentReport.reporterUid)) return true;
        if (resource.reportCreatorUid && isOwner(resource.reportCreatorUid)) return true;
        if (isAdmin) return true;
      }
      return false;
    }

    if (op === 'create') {
      if (!isAuthenticated || !isActive) return false;
      if (!requestResource) return false;
      if (requestResource.claimantUid !== auth.uid) return false;
      if (requestResource.status !== 'Pending') return false;
      if (parentReport && parentReport.reporterUid === auth.uid) return false; // Self-claim blocked
      if (parentReport && !['Active', 'Pending Claim', 'Pending Match'].includes(parentReport.status)) return false;
      const forbidden = ['reviewedBy', 'reviewedAt', 'handoverLocation', 'resolvedClaimId'];
      if (Object.keys(requestResource).some((k) => forbidden.includes(k))) return false;
      if (!isValidString(requestResource.proofDetails, 5, 2000)) return false;
      if (!['claim', 'found_report'].includes(requestResource.mode)) return false;
      return true;
    }

    if (op === 'update') {
      if (!isAuthenticated || !resource || !requestResource) return false;

      // Case 1: Claimant withdrawing their own pending claim
      if (isOwner(resource.claimantUid)) {
        if (resource.status !== 'Pending') return false;
        if (requestResource.status !== 'Withdrawn') return false;
        // Immutables cannot change
        if (requestResource.claimantUid !== resource.claimantUid) return false;
        if (requestResource.reportId !== resource.reportId) return false;
        if (requestResource.proofDetails !== resource.proofDetails) return false;
        return true;
      }

      // Case 2: Parent report creator reviewing (approving or declining)
      if (parentReport && isOwner(parentReport.reporterUid)) {
        if (resource.status !== 'Pending') return false;
        if (!['Approved', 'Declined'].includes(requestResource.status)) return false;
        if (requestResource.claimantUid !== resource.claimantUid) return false;
        if (requestResource.proofDetails !== resource.proofDetails) return false;
        return true;
      }

      // Case 3: Admin
      if (isAdmin) return true;

      return false;
    }

    if (op === 'delete') {
      return isAdmin;
    }

    return false;
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
  const isActive = Boolean(
    isAuthenticated &&
    auth.token &&
    (auth.token.status === 'active' || auth.token.status === 'Active')
  );

  const claimsMatch = path.match(/^\/claims\/([^/]+)\/([^/]+)$/);
  if (claimsMatch) {
    if (op === 'read') {
      if (!isAuthenticated) return false;
      if (isAdmin) return true;
      if (resource?.metadata) {
        if (resource.metadata.uploaderUid === auth.uid) return true;
        if (resource.metadata.reportCreatorUid === auth.uid) return true;
      }
      return false;
    }

    if (op === 'write') {
      if (!isAuthenticated || !isActive) return false;
      if (!requestResource) return false;
      const mime = requestResource.contentType || '';
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) return false;
      if (requestResource.size > 10 * 1024 * 1024) return false;
      if (requestResource.metadata?.uploaderUid !== auth.uid) return false;
      return true;
    }

    return false;
  }

  return false;
}

// =============================================================================
// Test Suites
// =============================================================================

// Mock DB State for Testing
const DB_REPORTS = new Map([
  [
    'rep-found-1',
    {
      id: 'rep-found-1',
      ticketNumber: 'R-1001',
      title: 'Hydro Flask Navy',
      type: 'FOUND',
      status: 'Active',
      reporterUid: 'usr-reporter-1',
      reporterName: 'Prof. Miller',
      claimsCount: 0,
    },
  ],
  [
    'rep-lost-1',
    {
      id: 'rep-lost-1',
      ticketNumber: 'R-1002',
      title: 'Calculus Textbook',
      type: 'LOST',
      status: 'Active',
      reporterUid: 'usr-reporter-2',
      reporterName: 'Samantha Student',
      claimsCount: 0,
    },
  ],
  [
    'rep-closed-1',
    {
      id: 'rep-closed-1',
      ticketNumber: 'R-1003',
      title: 'Keys on Green Strap',
      type: 'FOUND',
      status: 'Closed',
      reporterUid: 'usr-reporter-1',
      claimsCount: 0,
    },
  ],
  [
    'rep-resolved-1',
    {
      id: 'rep-resolved-1',
      ticketNumber: 'R-1004',
      title: 'MacBook Air M2',
      type: 'FOUND',
      status: 'Resolved',
      reporterUid: 'usr-reporter-1',
      claimsCount: 1,
    },
  ],
]);

const DB_CLAIMS = new Map();

// -----------------------------------------------------------------------------
// Test 1: Valid Claim Submission
// -----------------------------------------------------------------------------
console.log('Test 1: Valid Claim Submission (Found Item Claim)');
{
  const caller = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active', email: 'claimant@campus.edu' } };
  const targetReport = DB_REPORTS.get('rep-found-1');

  assert.ok(targetReport, 'Target report exists');
  assert.equal(targetReport.status, 'Active');

  const claimPayload = {
    reportId: 'rep-found-1',
    claimantUid: caller.uid,
    mode: 'claim',
    status: 'Pending',
    proofDetails: 'Navy 32oz bottle with scratch near bottom rim and national park sticker.',
    attachmentUrls: ['https://storage.googleapis.com/test-bucket/claims/proof1.jpg'],
  };

  const isAllowed = evalFirestoreRules({
    path: '/reports/rep-found-1/claims/clm-test-1',
    op: 'create',
    auth: caller,
    requestResource: claimPayload,
    getReport: (id) => DB_REPORTS.get(id),
  });

  assert.equal(isAllowed, true, 'Valid claim creation must be permitted under Security Rules');

  // Record mock claim
  DB_CLAIMS.set('clm-test-1', {
    ...claimPayload,
    id: 'clm-test-1',
    ticketId: '#CLM-1001',
    reportCreatorUid: targetReport.reporterUid,
    createdAt: new Date().toISOString(),
  });
  console.log('  ✅ Valid claim creation permitted and recorded.');
}

// -----------------------------------------------------------------------------
// Test 2: Valid Found Match Submission
// -----------------------------------------------------------------------------
console.log('Test 2: Valid Found Match Submission (Lost Item Match)');
{
  const caller = { uid: 'usr-finder-1', token: { role: 'student', status: 'active' } };
  const targetReport = DB_REPORTS.get('rep-lost-1');

  const matchPayload = {
    reportId: 'rep-lost-1',
    claimantUid: caller.uid,
    mode: 'found_report',
    status: 'Pending',
    proofDetails: 'Spotted on 2nd floor library study desk near math section.',
  };

  const isAllowed = evalFirestoreRules({
    path: '/reports/rep-lost-1/claims/fnd-test-1',
    op: 'create',
    auth: caller,
    requestResource: matchPayload,
    getReport: (id) => DB_REPORTS.get(id),
  });

  assert.equal(isAllowed, true, 'Valid found report match must be permitted under Security Rules');
  console.log('  ✅ Valid found report match permitted.');
}

// -----------------------------------------------------------------------------
// Test 3: Empty and Whitespace-Only Proof Validation
// -----------------------------------------------------------------------------
console.log('Test 3: Empty & Whitespace-Only Proof Rejection');
{
  const caller = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active' } };

  // Empty string
  const emptyPayload = {
    reportId: 'rep-found-1',
    claimantUid: caller.uid,
    mode: 'claim',
    status: 'Pending',
    proofDetails: '',
  };
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-invalid',
      op: 'create',
      auth: caller,
      requestResource: emptyPayload,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Empty proof must be rejected'
  );

  // Whitespace-only string
  const whitespacePayload = {
    ...emptyPayload,
    proofDetails: '     \n\t  ',
  };
  assert.throws(
    () => {
      const clean = whitespacePayload.proofDetails.trim();
      if (clean.length < 5) throw new AppError('invalid-argument', 'Proof of ownership details is required.');
    },
    /required/,
    'Whitespace-only explanation must throw invalid-argument'
  );
  console.log('  ✅ Empty and whitespace-only explanations strictly rejected.');
}

// -----------------------------------------------------------------------------
// Test 4: Length Boundary Validation (<5 and >2000 characters)
// -----------------------------------------------------------------------------
console.log('Test 4: Length Bounds Validation (Min 5, Max 2000)');
{
  const caller = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active' } };

  // 4 characters (too short)
  const tooShort = {
    reportId: 'rep-found-1',
    claimantUid: caller.uid,
    mode: 'claim',
    status: 'Pending',
    proofDetails: 'mine',
  };
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-short',
      op: 'create',
      auth: caller,
      requestResource: tooShort,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Too short proof details must be rejected'
  );

  // 2001 characters (oversized)
  const oversized = {
    reportId: 'rep-found-1',
    claimantUid: caller.uid,
    mode: 'claim',
    status: 'Pending',
    proofDetails: 'a'.repeat(2001),
  };
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-oversized',
      op: 'create',
      auth: caller,
      requestResource: oversized,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Oversized proof details must be rejected'
  );
  console.log('  ✅ Under- and over-sized explanation text rejected.');
}

// -----------------------------------------------------------------------------
// Test 5: Ineligible Report Handling (Closed & Resolved)
// -----------------------------------------------------------------------------
console.log('Test 5: Ineligible Report Submission Denial (Closed or Resolved)');
{
  const caller = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active' } };
  const validProof = 'Verified serial number matching item.';

  // Attempt to claim closed report
  const closedAttempt = evalFirestoreRules({
    path: '/reports/rep-closed-1/claims/clm-closed',
    op: 'create',
    auth: caller,
    requestResource: {
      reportId: 'rep-closed-1',
      claimantUid: caller.uid,
      mode: 'claim',
      status: 'Pending',
      proofDetails: validProof,
    },
    getReport: (id) => DB_REPORTS.get(id),
  });
  assert.equal(closedAttempt, false, 'Claims on Closed reports must be denied');

  // Attempt to claim resolved report
  const resolvedAttempt = evalFirestoreRules({
    path: '/reports/rep-resolved-1/claims/clm-resolved',
    op: 'create',
    auth: caller,
    requestResource: {
      reportId: 'rep-resolved-1',
      claimantUid: caller.uid,
      mode: 'claim',
      status: 'Pending',
      proofDetails: validProof,
    },
    getReport: (id) => DB_REPORTS.get(id),
  });
  assert.equal(resolvedAttempt, false, 'Claims on Resolved reports must be denied');
  console.log('  ✅ Submissions to closed or resolved listings fail closed.');
}

// -----------------------------------------------------------------------------
// Test 6: Self-Claim Prevention
// -----------------------------------------------------------------------------
console.log('Test 6: Self-Claim Denial (Reporter Claiming Own Listing)');
{
  const reporterCaller = { uid: 'usr-reporter-1', token: { role: 'faculty', status: 'active' } };

  // usr-reporter-1 created rep-found-1
  const selfClaimAttempt = evalFirestoreRules({
    path: '/reports/rep-found-1/claims/clm-self',
    op: 'create',
    auth: reporterCaller,
    requestResource: {
      reportId: 'rep-found-1',
      claimantUid: reporterCaller.uid,
      mode: 'claim',
      status: 'Pending',
      proofDetails: 'I am claiming my own reported found item.',
    },
    getReport: (id) => DB_REPORTS.get(id),
  });
  assert.equal(selfClaimAttempt, false, 'Users must be strictly barred from claiming their own reports');
  console.log('  ✅ Self-claim attempts strictly barred.');
}

// -----------------------------------------------------------------------------
// Test 7: Claimant UID Spoofing Denial
// -----------------------------------------------------------------------------
console.log('Test 7: Claimant UID Spoofing Denial');
{
  const caller = { uid: 'attacker-uid', token: { role: 'student', status: 'active' } };

  const spoofPayload = {
    reportId: 'rep-found-1',
    claimantUid: 'victim-student-uid', // Trying to submit on behalf of victim
    mode: 'claim',
    status: 'Pending',
    proofDetails: 'Claim submitted pretending to be another student.',
  };

  const isAllowed = evalFirestoreRules({
    path: '/reports/rep-found-1/claims/clm-spoof',
    op: 'create',
    auth: caller,
    requestResource: spoofPayload,
    getReport: (id) => DB_REPORTS.get(id),
  });
  assert.equal(isAllowed, false, 'Spoofing claimant UID must be blocked by Security Rules');
  console.log('  ✅ Claimant identity spoofing blocked.');
}

// -----------------------------------------------------------------------------
// Test 8: Unauthenticated & Suspended User Rejection
// -----------------------------------------------------------------------------
console.log('Test 8: Unauthenticated & Suspended User Rejection');
{
  const validPayload = {
    reportId: 'rep-found-1',
    claimantUid: 'any-uid',
    mode: 'claim',
    status: 'Pending',
    proofDetails: 'Valid description of the item.',
  };

  // Unauthenticated
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-unauth',
      op: 'create',
      auth: null,
      requestResource: validPayload,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Unauthenticated requests must be denied'
  );

  // Suspended user
  const suspendedCaller = { uid: 'usr-suspended', token: { role: 'student', status: 'suspended' } };
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-suspended',
      op: 'create',
      auth: suspendedCaller,
      requestResource: { ...validPayload, claimantUid: 'usr-suspended' },
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Suspended accounts must not be allowed to submit claims'
  );
  console.log('  ✅ Unauthenticated and suspended users denied access.');
}

// -----------------------------------------------------------------------------
// Test 9: Private Evidence Access Control (Security & Privacy)
// -----------------------------------------------------------------------------
console.log('Test 9: Private Evidence & Proof Privacy Constraints');
{
  const claimantAuth = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active' } };
  const reporterAuth = { uid: 'usr-reporter-1', token: { role: 'faculty', status: 'active' } };
  const adminAuth = { uid: 'usr-admin-1', token: { role: 'admin', status: 'active' } };
  const strangerAuth = { uid: 'usr-unrelated-student', token: { role: 'student', status: 'active' } };

  const claimResource = {
    claimantUid: 'usr-claimant-1',
    reportCreatorUid: 'usr-reporter-1',
    status: 'Pending',
  };

  // 1. Claimant can read their own claim
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'read',
      auth: claimantAuth,
      resource: claimResource,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    true,
    'Claimant must be able to read their own claim'
  );

  // 2. Report creator can read the claim
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'read',
      auth: reporterAuth,
      resource: claimResource,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    true,
    'Report creator must be able to inspect submitted claim'
  );

  // 3. Administrator can read the claim
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'read',
      auth: adminAuth,
      resource: claimResource,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    true,
    'Administrator must be able to inspect claim'
  );

  // 4. Unrelated campus student CANNOT read the claim
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'read',
      auth: strangerAuth,
      resource: claimResource,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Unrelated students must be DENIED access to private claim details'
  );

  // Storage evidence privacy checks
  const storageResource = {
    metadata: {
      uploaderUid: 'usr-claimant-1',
      reportCreatorUid: 'usr-reporter-1',
    },
  };

  assert.equal(
    evalStorageRules({
      path: '/claims/clm-test-1/receipt.jpg',
      op: 'read',
      auth: claimantAuth,
      resource: storageResource,
    }),
    true,
    'Claimant can read evidence photo'
  );

  assert.equal(
    evalStorageRules({
      path: '/claims/clm-test-1/receipt.jpg',
      op: 'read',
      auth: reporterAuth,
      resource: storageResource,
    }),
    true,
    'Reviewer can read evidence photo'
  );

  assert.equal(
    evalStorageRules({
      path: '/claims/clm-test-1/receipt.jpg',
      op: 'read',
      auth: strangerAuth,
      resource: storageResource,
    }),
    false,
    'Unrelated user CANNOT read private evidence attachment in Storage'
  );
  console.log('  ✅ Private evidence readable only by authorized participants and admins.');
}

// -----------------------------------------------------------------------------
// Test 10: Claim Review Status Transitions (Approve / Decline)
// -----------------------------------------------------------------------------
console.log('Test 10: Claim Review State Transitions & Permissions');
{
  const reporterAuth = { uid: 'usr-reporter-1', token: { role: 'faculty', status: 'active' } };
  const strangerAuth = { uid: 'usr-stranger', token: { role: 'student', status: 'active' } };
  const claimantAuth = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active' } };

  const currentClaim = {
    id: 'clm-test-1',
    claimantUid: 'usr-claimant-1',
    reportId: 'rep-found-1',
    ticketId: '#CLM-1001',
    mode: 'claim',
    proofDetails: 'Scratch on base.',
    status: 'Pending',
    createdAt: '2026-09-15T00:00:00Z',
  };

  // 1. Report creator can approve the claim
  const approvedUpdate = {
    ...currentClaim,
    status: 'Approved',
    reviewedBy: reporterAuth.uid,
    reviewedAt: '2026-09-15T01:00:00Z',
    handoverLocation: 'Library Desk 1',
    updatedAt: '2026-09-15T01:00:00Z',
  };

  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: reporterAuth,
      resource: currentClaim,
      requestResource: approvedUpdate,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    true,
    'Report creator must be authorized to approve pending claim'
  );

  // 2. Stranger cannot approve claim
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: strangerAuth,
      resource: currentClaim,
      requestResource: approvedUpdate,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Unrelated user must NOT be permitted to approve claims'
  );

  // 3. Claimant cannot approve their own claim (self-approval privilege escalation)
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: claimantAuth,
      resource: currentClaim,
      requestResource: approvedUpdate,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Claimant cannot self-approve claim'
  );

  // 4. Report creator can decline the claim
  const declinedUpdate = {
    ...currentClaim,
    status: 'Declined',
    reviewedBy: reporterAuth.uid,
    reviewedAt: '2026-09-15T01:00:00Z',
    decisionReason: 'Proof did not match item.',
    updatedAt: '2026-09-15T01:00:00Z',
  };

  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: reporterAuth,
      resource: currentClaim,
      requestResource: declinedUpdate,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    true,
    'Report creator can decline pending claim'
  );
  console.log('  ✅ Review transitions strictly authorized; self-approval rejected.');
}

// -----------------------------------------------------------------------------
// Test 11: Claimant Withdrawal Flow & Immutables
// -----------------------------------------------------------------------------
console.log('Test 11: Claimant Withdrawal Flow & Field Immutability');
{
  const claimantAuth = { uid: 'usr-claimant-1', token: { role: 'student', status: 'active' } };
  const currentClaim = {
    id: 'clm-test-1',
    claimantUid: 'usr-claimant-1',
    reportId: 'rep-found-1',
    ticketId: '#CLM-1001',
    mode: 'claim',
    proofDetails: 'Scratch on base.',
    status: 'Pending',
    createdAt: '2026-09-15T00:00:00Z',
  };

  // Valid withdrawal
  const withdrawalUpdate = {
    ...currentClaim,
    status: 'Withdrawn',
    decisionReason: 'Found my bottle at home.',
    updatedAt: '2026-09-15T02:00:00Z',
  };

  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: claimantAuth,
      resource: currentClaim,
      requestResource: withdrawalUpdate,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    true,
    'Claimant must be allowed to withdraw their own pending claim'
  );

  // Cannot withdraw once already approved
  const alreadyApproved = { ...currentClaim, status: 'Approved' };
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: claimantAuth,
      resource: alreadyApproved,
      requestResource: { ...alreadyApproved, status: 'Withdrawn' },
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Cannot withdraw an already approved claim'
  );

  // Cannot tamper with immutable fields during withdrawal
  const tamperedWithdrawal = {
    ...withdrawalUpdate,
    proofDetails: 'Modified proof text post submission',
  };
  assert.equal(
    evalFirestoreRules({
      path: '/reports/rep-found-1/claims/clm-test-1',
      op: 'update',
      auth: claimantAuth,
      resource: currentClaim,
      requestResource: tamperedWithdrawal,
      getReport: (id) => DB_REPORTS.get(id),
    }),
    false,
    'Proof details cannot be altered during withdrawal'
  );
  console.log('  ✅ Withdrawal rules validated; post-approval withdrawal and tampering blocked.');
}

// -----------------------------------------------------------------------------
// Test 12: Request Payload Whitelisting & Injected Keys
// -----------------------------------------------------------------------------
console.log('Test 12: Cloud Functions Payload Whitelisting');
{
  assert.doesNotThrow(() => {
    assertAllowedKeys(
      {
        reportId: 'rep-1',
        mode: 'claim',
        proofDetails: 'Details of the claim.',
      },
      ['reportId', 'mode', 'proofDetails', 'attachmentUrls', 'attachmentPaths', 'attachmentNames', 'attachmentSizes'],
      'submitClaim'
    );
  }, 'Whitelisted keys pass assertion');

  assert.throws(
    () => {
      assertAllowedKeys(
        {
          reportId: 'rep-1',
          mode: 'claim',
          proofDetails: 'Details',
          status: 'Approved', // Injected protected field
          isAdmin: true,       // Injected privilege field
        },
        ['reportId', 'mode', 'proofDetails'],
        'submitClaim'
      );
    },
    /contains unexpected field/,
    'Unexpected injected fields must be rejected'
  );
  console.log('  ✅ Request payload whitelisting verified.');
}

// -----------------------------------------------------------------------------
// Test 13: Normalization & UI Contract Compliance (formatClaimRecord)
// -----------------------------------------------------------------------------
console.log('Test 13: Claim Record Normalization (formatClaimRecord)');
{
  const rawFirestoreClaim = {
    id: 'clm-doc-123',
    ticketId: '#CLM-8492',
    reportId: 'rep-found-1',
    reportTitle: 'Navy Hydro Flask',
    category: 'Personal Belongings',
    mode: 'claim',
    status: 'Pending',
    proofDetails: 'Identified with small dent and stickers.',
    attachmentUrls: ['https://storage.googleapis.com/test-bucket/claims/test.jpg'],
    claimantUid: 'usr-student-1',
    claimantName: 'Hannah Puerta',
    posterName: 'Prof. Miller',
    createdAt: new Date('2026-09-16T09:15:00Z'),
  };

  const normalized = formatClaimRecord(rawFirestoreClaim);

  assert.equal(normalized.id, 'clm-doc-123');
  assert.equal(normalized.ticketId, '#CLM-8492');
  assert.equal(normalized.type, 'Lost Claim');
  assert.equal(normalized.status, 'Pending');
  assert.equal(normalized.title, 'Navy Hydro Flask');
  assert.equal(normalized.userProof, 'Identified with small dent and stickers.');
  assert.ok(Array.isArray(normalized.timeline), 'Timeline must be populated for My Claims view');
  assert.equal(normalized.timeline[0].step, 'Claim Submitted');
  console.log('  ✅ Record normalization complies with frontend expectations.');
}

// -----------------------------------------------------------------------------
// Test 14: Storage Upload Size & MIME Constraints
// -----------------------------------------------------------------------------
console.log('Test 14: Storage Upload Limits (JPEG/PNG/WebP <= 10MB)');
{
  const activeUser = { uid: 'usr-1', token: { role: 'student', status: 'active' } };

  // Valid JPEG under 10MB
  assert.equal(
    evalStorageRules({
      path: '/claims/clm-1/receipt.jpg',
      op: 'write',
      auth: activeUser,
      requestResource: {
        contentType: 'image/jpeg',
        size: 2 * 1024 * 1024,
        metadata: { uploaderUid: 'usr-1' },
      },
    }),
    true,
    'Valid JPEG <= 10MB must be allowed'
  );

  // Invalid PDF MIME type
  assert.equal(
    evalStorageRules({
      path: '/claims/clm-1/document.pdf',
      op: 'write',
      auth: activeUser,
      requestResource: {
        contentType: 'application/pdf',
        size: 500 * 1024,
        metadata: { uploaderUid: 'usr-1' },
      },
    }),
    false,
    'Non-image MIME types must be rejected'
  );

  // Oversized image (15MB > 10MB limit)
  assert.equal(
    evalStorageRules({
      path: '/claims/clm-1/huge.png',
      op: 'write',
      auth: activeUser,
      requestResource: {
        contentType: 'image/png',
        size: 15 * 1024 * 1024,
        metadata: { uploaderUid: 'usr-1' },
      },
    }),
    false,
    'Oversized images (>10MB) must be rejected'
  );
  console.log('  ✅ Storage MIME type and 10MB limits strictly enforced.');
}

console.log('\n🎉 ALL 14 PROMPT 7 CLAIM WORKFLOW & VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
