import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';
import { assertRequiredString } from '../utils/validation.js';
import {
  assertActiveUser,
  assertAllowedKeys,
} from '../utils/auth-guards.js';

export interface SubmitClaimData {
  reportId: string;
  mode: 'claim' | 'found_report';
  proofDetails: string;
  attachmentUrls?: string[];
  attachmentPaths?: string[];
  attachmentNames?: string[];
  attachmentSizes?: string[];
}

export interface ReviewClaimData {
  reportId: string;
  claimId: string;
  action: 'approve' | 'decline';
  handoverLocation?: string;
  reason?: string;
  declineReason?: string;
}

export interface WithdrawClaimData {
  reportId: string;
  claimId: string;
  reason?: string;
}

/**
 * Validates the claim submission mode.
 */
function assertValidClaimMode(modeVal: unknown): 'claim' | 'found_report' {
  if (typeof modeVal !== 'string') {
    throw new AppError('invalid-argument', 'Claim mode must be "claim" or "found_report".', { field: 'mode' });
  }
  const clean = modeVal.trim().toLowerCase();
  if (clean !== 'claim' && clean !== 'found_report') {
    throw new AppError('invalid-argument', `Invalid claim mode: "${modeVal}". Must be "claim" or "found_report".`, { field: 'mode' });
  }
  return clean as 'claim' | 'found_report';
}

/**
 * Generates a unique, collision-resistant ticket identifier (#CLM-xxxx or #FND-xxxx).
 */
async function generateUniqueClaimTicket(reportId: string, mode: 'claim' | 'found_report'): Promise<string> {
  const prefix = mode === 'found_report' ? '#FND' : '#CLM';
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidateTicket = `${prefix}-${randomSuffix}`;

    const existing = await adminDb
      .collection('reports')
      .doc(reportId)
      .collection('claims')
      .where('ticketId', '==', candidateTicket)
      .limit(1)
      .get();

    if (existing.empty) {
      return candidateTicket;
    }
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}

/**
 * Submits a new ownership claim or found match on an active campus listing.
 * Enforces authentication, active account status, report eligibility, non-empty proof,
 * duplicate claim prevention, and atomic execution inside a Firestore transaction.
 */
export const submitClaim = onCall(async (request: CallableRequest<SubmitClaimData>) => {
  const authCtx = assertActiveUser(request.auth);
  const data = request.data;

  assertAllowedKeys(
    data as unknown as Record<string, unknown>,
    ['reportId', 'mode', 'proofDetails', 'attachmentUrls', 'attachmentPaths', 'attachmentNames', 'attachmentSizes'],
    'submitClaim'
  );

  const reportId = assertRequiredString(data.reportId, 'reportId', 1, 100);
  const mode = assertValidClaimMode(data.mode);
  const proofDetails = assertRequiredString(
    data.proofDetails,
    mode === 'found_report' ? 'Location found details' : 'Proof of ownership explanation',
    5,
    2000
  );

  // Validate optional attachments arrays (max 3 files)
  const attachmentUrls = Array.isArray(data.attachmentUrls) ? data.attachmentUrls.slice(0, 3) : [];
  const attachmentPaths = Array.isArray(data.attachmentPaths) ? data.attachmentPaths.slice(0, 3) : [];
  const attachmentNames = Array.isArray(data.attachmentNames) ? data.attachmentNames.slice(0, 3) : [];
  const attachmentSizes = Array.isArray(data.attachmentSizes) ? data.attachmentSizes.slice(0, 3) : [];

  for (const url of attachmentUrls) {
    if (typeof url !== 'string' || url.length > 2000) {
      throw new AppError('invalid-argument', 'Attachment URLs must be valid strings up to 2000 characters.');
    }
  }

  const reportRef = adminDb.collection('reports').doc(reportId);
  const ticketId = await generateUniqueClaimTicket(reportId, mode);

  return await adminDb.runTransaction(async (transaction) => {
    // -------------------------------------------------------------------------
    // 1. All Transaction Reads First (Must precede any writes in Firestore)
    // -------------------------------------------------------------------------
    const reportSnap = await transaction.get(reportRef);

    if (!reportSnap.exists) {
      throw new AppError('not-found', `Target report #${reportId} does not exist.`);
    }

    const reportData = reportSnap.data() || {};

    // Verify report is eligible for claims
    const currentReportStatus = reportData.status || 'Active';
    if (currentReportStatus === 'Closed' || currentReportStatus === 'Resolved') {
      throw new AppError(
        'failed-precondition',
        `This report is ${currentReportStatus.toLowerCase()} and cannot accept new claims or matches.`
      );
    }

    // Prevent self-claim (cannot claim or match one's own report)
    if (reportData.reporterUid === authCtx.uid) {
      throw new AppError(
        'failed-precondition',
        'You cannot submit an ownership claim or match on your own report listing.'
      );
    }

    // Prevent duplicate active claims by the same claimant on this report
    const existingClaimQuery = await reportRef
      .collection('claims')
      .where('claimantUid', '==', authCtx.uid)
      .where('status', 'in', ['Pending', 'Approved'])
      .limit(1)
      .get();

    if (!existingClaimQuery.empty) {
      throw new AppError(
        'already-exists',
        'You have already submitted an active claim or found report for this item. Please track it in My Claims.'
      );
    }

    // Resolve claimant profile
    const token = authCtx.token || {};
    let claimantName = token.email ? (token.email as string).split('@')[0] : 'Campus Member';
    let claimantRole = ((token.role as string) || 'student').toLowerCase();
    claimantRole = claimantRole === 'admin' ? 'Admin' : claimantRole === 'faculty' ? 'Faculty' : 'Student';
    let claimantEmail = (token.email as string) || '';

    try {
      const userSnap = await transaction.get(adminDb.collection('users').doc(authCtx.uid));
      if (userSnap.exists) {
        const userData = userSnap.data() || {};
        claimantName = userData.fullName || claimantName;
        claimantRole = userData.role ? (userData.role.charAt(0).toUpperCase() + userData.role.slice(1)) : claimantRole;
        claimantEmail = userData.email || claimantEmail;
      }
    } catch (err) {
      console.warn('[submitClaim] User profile lookup non-blocking warning:', err);
    }

    // -------------------------------------------------------------------------
    // 2. All Transaction Writes (Follow all completed reads)
    // -------------------------------------------------------------------------
    const claimRef = reportRef.collection('claims').doc();
    const claimId = claimRef.id;

    const claimDocument = {
      id: claimId,
      ticketId,
      reportId,
      reportTitle: reportData.title || reportData.itemName || 'Untitled Item',
      reportType: reportData.type || 'FOUND',
      reportLocation: reportData.location || '',
      reportImageUrl: reportData.imageUrl || null,
      reportCreatorUid: reportData.reporterUid,
      posterName: reportData.reporterName || 'Campus Member',
      claimantUid: authCtx.uid,
      claimantName,
      claimantRole,
      claimantEmail,
      mode,
      status: 'Pending',
      proofDetails,
      attachmentUrls,
      attachmentPaths,
      attachmentNames,
      attachmentSizes,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // A. Create claim document
    transaction.set(claimRef, claimDocument);

    // B. Increment parent report claimsCount and advance status if Active
    const reportUpdates: Record<string, unknown> = {
      claimsCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (currentReportStatus === 'Active') {
      reportUpdates.status = mode === 'found_report' ? 'Pending Match' : 'Pending Claim';
    }

    transaction.update(reportRef, reportUpdates);

    // C. Dispatch notification to parent report creator
    const notificationRef = adminDb.collection('notifications').doc();
    transaction.set(notificationRef, {
      id: notificationRef.id,
      recipientUid: reportData.reporterUid,
      title: mode === 'found_report' ? 'New Found Item Match' : 'New Ownership Claim',
      description: `${claimantName} submitted a ${mode === 'found_report' ? 'match report' : 'claim'} on your listing "${reportData.title || 'Item'}" (${ticketId}).`,
      ticketId,
      reportId,
      claimId,
      unread: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      claimId,
      ticketId,
      status: 'Pending',
      reportId,
      message: `${mode === 'found_report' ? 'Found report' : 'Claim'} submitted successfully.`,
    };
  });
});

/**
 * Reviews an active claim or match (Approve or Decline).
 * Only the parent report creator or an authorized administrator can review.
 * When approved, atomically transitions report to Resolved, target claim to Approved,
 * and marks any competing pending claims as Declined.
 * All reads strictly precede all writes to maintain transaction consistency.
 */
export const reviewClaim = onCall(async (request: CallableRequest<ReviewClaimData>) => {
  const authCtx = assertActiveUser(request.auth);
  const data = request.data;

  assertAllowedKeys(
    data as unknown as Record<string, unknown>,
    ['reportId', 'claimId', 'action', 'handoverLocation', 'reason', 'declineReason'],
    'reviewClaim'
  );

  const reportId = assertRequiredString(data.reportId, 'reportId', 1, 100);
  const claimId = assertRequiredString(data.claimId, 'claimId', 1, 100);

  if (data.action !== 'approve' && data.action !== 'decline') {
    throw new AppError('invalid-argument', 'Action must be "approve" or "decline".', { field: 'action' });
  }

  const action = data.action;
  const declineReason = (data.reason || data.declineReason || '').trim();
  const handoverLocation = (data.handoverLocation || '').trim();

  const reportRef = adminDb.collection('reports').doc(reportId);
  const claimRef = reportRef.collection('claims').doc(claimId);

  return await adminDb.runTransaction(async (transaction) => {
    // -------------------------------------------------------------------------
    // 1. All Transaction Reads First (Must precede any writes in Firestore)
    // -------------------------------------------------------------------------
    const [reportSnap, claimSnap] = await Promise.all([
      transaction.get(reportRef),
      transaction.get(claimRef),
    ]);

    if (!reportSnap.exists) {
      throw new AppError('not-found', `Target report #${reportId} does not exist.`);
    }

    if (!claimSnap.exists) {
      throw new AppError('not-found', `Target claim #${claimId} does not exist.`);
    }

    const reportData = reportSnap.data() || {};
    const claimData = claimSnap.data() || {};

    // Authorization: caller must be report creator or administrator
    const isOwner = reportData.reporterUid === authCtx.uid;
    const token = authCtx.token || {};
    const isAdmin = ((token.role as string) || '').toLowerCase() === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('permission-denied', 'Only the report owner or an administrator can review this claim.');
    }

    // Target claim must be in 'Pending' status
    if (claimData.status !== 'Pending') {
      throw new AppError(
        'failed-precondition',
        `Cannot review claim #${claimId} because it is already "${claimData.status}".`
      );
    }

    // Read all other pending claims on this report BEFORE any updates
    const pendingClaimsSnap = await reportRef
      .collection('claims')
      .where('status', '==', 'Pending')
      .get();

    // -------------------------------------------------------------------------
    // 2. All Transaction Writes (Follow all completed reads)
    // -------------------------------------------------------------------------
    if (action === 'approve') {
      // Ensure report is not already resolved
      if (reportData.status === 'Resolved') {
        throw new AppError('failed-precondition', 'This report listing has already been resolved.');
      }

      const defaultHandover = handoverLocation || 'Campus Lost & Found Office (Student Affairs / Security Desk)';

      // A. Approve target claim
      transaction.update(claimRef, {
        status: 'Approved',
        reviewedBy: authCtx.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        handoverLocation: defaultHandover,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // B. Resolve parent report
      transaction.update(reportRef, {
        status: 'Resolved',
        resolvedClaimId: claimId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // C. Update competing pending claims and send notifications
      for (const compDoc of pendingClaimsSnap.docs) {
        if (compDoc.id !== claimId) {
          transaction.update(compDoc.ref, {
            status: 'Declined',
            decisionReason: 'Another claim was verified and approved for this item.',
            reviewedBy: authCtx.uid,
            reviewedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Competing claimant notification
          const compData = compDoc.data();
          const compNotifRef = adminDb.collection('notifications').doc();
          transaction.set(compNotifRef, {
            id: compNotifRef.id,
            recipientUid: compData.claimantUid,
            title: 'Claim Update',
            description: `Another claim was verified and approved for listing "${reportData.title || 'Item'}". Your claim (${compData.ticketId}) was closed.`,
            ticketId: compData.ticketId,
            reportId,
            claimId: compDoc.id,
            unread: true,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // D. Send approval notification to winning claimant
      const approvedNotifRef = adminDb.collection('notifications').doc();
      transaction.set(approvedNotifRef, {
        id: approvedNotifRef.id,
        recipientUid: claimData.claimantUid,
        title: 'Claim Approved!',
        description: `Your claim (${claimData.ticketId}) for "${reportData.title || 'Item'}" was approved! Pickup location: ${defaultHandover}.`,
        ticketId: claimData.ticketId,
        reportId,
        claimId,
        unread: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      // E. Activity log entry
      const logRef = adminDb.collection('activity_logs').doc();
      transaction.set(logRef, {
        id: logRef.id,
        type: 'CLAIM_APPROVED',
        reportId,
        claimId,
        ticketId: claimData.ticketId,
        reviewerUid: authCtx.uid,
        claimantUid: claimData.claimantUid,
        timestamp: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        claimId,
        ticketId: claimData.ticketId,
        status: 'Approved',
        reportStatus: 'Resolved',
        message: `Claim ${claimData.ticketId} approved. Listing marked as Resolved.`,
      };
    } else {
      // Action: Decline
      const defaultDecline = declineReason || 'Submitted proof did not match the item details.';

      // A. Decline target claim
      transaction.update(claimRef, {
        status: 'Declined',
        decisionReason: defaultDecline,
        reviewedBy: authCtx.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // B. Check remaining pending claims from earlier read. If none remain, revert report to 'Active'
      const remainingPending = pendingClaimsSnap.docs.filter((d) => d.id !== claimId);
      let newReportStatus = reportData.status;

      if (remainingPending.length === 0 && (reportData.status === 'Pending Claim' || reportData.status === 'Pending Match')) {
        newReportStatus = 'Active';
        transaction.update(reportRef, {
          status: 'Active',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // C. Send notification to claimant
      const declineNotifRef = adminDb.collection('notifications').doc();
      transaction.set(declineNotifRef, {
        id: declineNotifRef.id,
        recipientUid: claimData.claimantUid,
        title: 'Claim Declined',
        description: `Your claim (${claimData.ticketId}) for "${reportData.title || 'Item'}" was declined. Reason: ${defaultDecline}`,
        ticketId: claimData.ticketId,
        reportId,
        claimId,
        unread: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        claimId,
        ticketId: claimData.ticketId,
        status: 'Declined',
        reportStatus: newReportStatus,
        message: `Claim ${claimData.ticketId} declined.`,
      };
    }
  });
});

/**
 * Withdraws a pending claim.
 * Only the claimant (or administrator) can withdraw their own pending claim.
 * Reverts report status to Active if no other pending claims remain.
 * Decrements report claimsCount without ever falling below 0.
 * All reads strictly precede all writes to maintain transaction consistency.
 */
export const withdrawClaim = onCall(async (request: CallableRequest<WithdrawClaimData>) => {
  const authCtx = assertActiveUser(request.auth);
  const data = request.data;

  assertAllowedKeys(
    data as unknown as Record<string, unknown>,
    ['reportId', 'claimId', 'reason'],
    'withdrawClaim'
  );

  const reportId = assertRequiredString(data.reportId, 'reportId', 1, 100);
  const claimId = assertRequiredString(data.claimId, 'claimId', 1, 100);
  const reason = (data.reason || 'Withdrawn by claimant').trim();

  const reportRef = adminDb.collection('reports').doc(reportId);
  const claimRef = reportRef.collection('claims').doc(claimId);

  return await adminDb.runTransaction(async (transaction) => {
    // -------------------------------------------------------------------------
    // 1. All Transaction Reads First (Must precede any writes in Firestore)
    // -------------------------------------------------------------------------
    const [reportSnap, claimSnap] = await Promise.all([
      transaction.get(reportRef),
      transaction.get(claimRef),
    ]);

    if (!reportSnap.exists) {
      throw new AppError('not-found', `Target report #${reportId} does not exist.`);
    }

    if (!claimSnap.exists) {
      throw new AppError('not-found', `Target claim #${claimId} does not exist.`);
    }

    const reportData = reportSnap.data() || {};
    const claimData = claimSnap.data() || {};

    // Authorization: claimant or administrator
    const isClaimant = claimData.claimantUid === authCtx.uid;
    const token = authCtx.token || {};
    const isAdmin = ((token.role as string) || '').toLowerCase() === 'admin';

    if (!isClaimant && !isAdmin) {
      throw new AppError('permission-denied', 'You are not authorized to withdraw this claim.');
    }

    if (claimData.status !== 'Pending') {
      throw new AppError(
        'failed-precondition',
        `Cannot withdraw claim #${claimId} because it is already "${claimData.status}".`
      );
    }

    // Read other pending claims BEFORE any writes
    const otherPendingQuery = await reportRef
      .collection('claims')
      .where('status', '==', 'Pending')
      .get();

    // -------------------------------------------------------------------------
    // 2. All Transaction Writes (Follow all completed reads)
    // -------------------------------------------------------------------------
    // A. Mark claim as Withdrawn
    transaction.update(claimRef, {
      status: 'Withdrawn',
      decisionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // B. Decrement claimsCount on report and check remaining pending claims
    const currentClaimsCount = Math.max(0, (Number(reportData.claimsCount) || 1) - 1);
    const remainingPending = otherPendingQuery.docs.filter((d) => d.id !== claimId);
    const reportUpdates: Record<string, unknown> = {
      claimsCount: currentClaimsCount,
      updatedAt: FieldValue.serverTimestamp(),
    };

    let newReportStatus = reportData.status;
    if (remainingPending.length === 0 && (reportData.status === 'Pending Claim' || reportData.status === 'Pending Match')) {
      newReportStatus = 'Active';
      reportUpdates.status = 'Active';
    }

    transaction.update(reportRef, reportUpdates);

    // C. Dispatch notification to parent report creator
    if (reportData.reporterUid) {
      const withdrawNotifRef = adminDb.collection('notifications').doc();
      transaction.set(withdrawNotifRef, {
        id: withdrawNotifRef.id,
        recipientUid: reportData.reporterUid,
        title: 'Claim Withdrawn',
        description: `Claim (${claimData.ticketId}) on listing "${reportData.title || 'Item'}" was withdrawn by the claimant.`,
        ticketId: claimData.ticketId,
        reportId,
        claimId,
        unread: true,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      claimId,
      ticketId: claimData.ticketId,
      status: 'Withdrawn',
      reportStatus: newReportStatus,
      message: 'Claim withdrawn successfully.',
    };
  });
});
