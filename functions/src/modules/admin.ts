import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';
import { assertRequiredString } from '../utils/validation.js';
import { assertAdmin, assertAllowedKeys } from '../utils/auth-guards.js';

export type AccountAction =
  | 'approve_faculty'
  | 'decline_faculty'
  | 'suspend_user'
  | 'activate_user';

interface ManageAccountStatusData {
  targetUid: string;
  action: AccountAction;
  reason?: string;
}

interface SetAdminRoleData {
  targetUid: string;
  enabled: boolean;
}

/**
 * Administrative Cloud Function to manage user account lifecycle and approval states.
 * Requires caller to have 'admin' role in custom claims.
 */
export const manageAccountStatus = onCall(async (request: CallableRequest<ManageAccountStatusData>) => {
  // 1. Verify caller has administrative privileges
  const adminContext = assertAdmin(request.auth);

  const data = request.data;
  if (!data) {
    throw new AppError('invalid-argument', 'Request data payload is required.');
  }

  assertAllowedKeys(data as unknown as Record<string, unknown>, ['targetUid', 'action', 'reason'], 'manageAccountStatus');

  const targetUid = assertRequiredString(data.targetUid, 'Target User ID', 1, 128);
  const action = data.action;
  const reason = data.reason ? String(data.reason).trim() : '';

  const ALLOWED_ACTIONS: AccountAction[] = [
    'approve_faculty',
    'decline_faculty',
    'suspend_user',
    'activate_user',
  ];

  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new AppError('invalid-argument', `Invalid action: ${action}. Allowed: ${ALLOWED_ACTIONS.join(', ')}`);
  }

  // 2. Prevent self-suspension or modifying own account through this endpoint
  if (targetUid === adminContext.uid && (action === 'suspend_user' || action === 'decline_faculty')) {
    throw new AppError('failed-precondition', 'Administrators cannot suspend or decline their own account.');
  }

  // 3. Fetch target user profile
  const userDocRef = adminDb.collection('users').doc(targetUid);
  const userSnapshot = await userDocRef.get();

  if (!userSnapshot.exists) {
    throw new AppError('not-found', `Target user with UID ${targetUid} was not found.`);
  }

  const userProfile = userSnapshot.data() || {};
  const currentRole = (userProfile.role || 'student').toLowerCase();
  const currentStatus = userProfile.status || 'Active';

  let newStatus: string;
  let newClaimStatus: string;
  let actionDescription: string;

  switch (action) {
    case 'approve_faculty':
      if (currentRole !== 'faculty') {
        throw new AppError('failed-precondition', 'Cannot approve non-faculty account.');
      }
      if (currentStatus === 'Active') {
        throw new AppError('failed-precondition', 'Faculty account is already approved and active.');
      }
      newStatus = 'Active';
      newClaimStatus = 'active';
      actionDescription = `Approved faculty account for ${userProfile.fullName || targetUid}`;
      break;

    case 'decline_faculty':
      if (currentRole !== 'faculty') {
        throw new AppError('failed-precondition', 'Cannot decline non-faculty account.');
      }
      newStatus = 'Declined';
      newClaimStatus = 'declined';
      actionDescription = `Declined faculty account for ${userProfile.fullName || targetUid}. Reason: ${reason || 'Unspecified'}`;
      break;

    case 'suspend_user':
      if (currentStatus === 'Suspended') {
        throw new AppError('failed-precondition', 'User account is already suspended.');
      }
      newStatus = 'Suspended';
      newClaimStatus = 'suspended';
      actionDescription = `Suspended user ${userProfile.fullName || targetUid}. Reason: ${reason || 'Policy compliance'}`;
      break;

    case 'activate_user':
      if (currentStatus === 'Active') {
        throw new AppError('failed-precondition', 'User account is already active.');
      }
      newStatus = 'Active';
      newClaimStatus = 'active';
      actionDescription = `Re-activated user ${userProfile.fullName || targetUid}`;
      break;

    default:
      throw new AppError('invalid-argument', 'Unknown account management action.');
  }

  // 4. Update custom claims in Firebase Authentication
  const existingUserRecord = await adminAuth.getUser(targetUid);
  const existingClaims = existingUserRecord.customClaims || {};

  await adminAuth.setCustomUserClaims(targetUid, {
    ...existingClaims,
    status: newClaimStatus,
  });

  // 5. Update Firestore user profile
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (action === 'approve_faculty') {
    updateData.approvedAt = FieldValue.serverTimestamp();
    updateData.approvedBy = adminContext.uid;
  }
  if (reason) {
    updateData.statusReason = reason;
  }

  await userDocRef.update(updateData);

  // 6. Record immutable activity log
  await adminDb.collection('activity_logs').add({
    actorUid: adminContext.uid,
    actorName: adminContext.token?.email || 'Administrator',
    actorRole: 'admin',
    action: actionDescription,
    targetEntity: `user:${targetUid}`,
    metadata: {
      action,
      targetUid,
      previousStatus: currentStatus,
      newStatus,
      reason: reason || null,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  // 7. If account was declined or suspended, revoke active Firebase refresh tokens
  if (action === 'suspend_user' || action === 'decline_faculty') {
    try {
      await adminAuth.revokeRefreshTokens(targetUid);
    } catch (revokeErr) {
      console.warn('Could not revoke refresh tokens:', revokeErr);
    }
  }

  return {
    success: true,
    targetUid,
    previousStatus: currentStatus,
    newStatus,
    action,
  };
});

/**
 * Administrative Cloud Function to grant or revoke the 'admin' role.
 * Requires caller to be an existing administrator.
 * Ordinary users cannot elevate themselves or other users.
 */
export const setAdminRole = onCall(async (request: CallableRequest<SetAdminRoleData>) => {
  // 1. Verify caller has administrative privileges
  const adminContext = assertAdmin(request.auth);

  const data = request.data;
  if (!data) {
    throw new AppError('invalid-argument', 'Request data payload is required.');
  }

  assertAllowedKeys(data as unknown as Record<string, unknown>, ['targetUid', 'enabled'], 'setAdminRole');

  const targetUid = assertRequiredString(data.targetUid, 'Target User ID', 1, 128);
  const enabled = Boolean(data.enabled);

  // 2. Prevent admin from revoking their own admin privileges to avoid platform lockout
  if (targetUid === adminContext.uid && !enabled) {
    throw new AppError('failed-precondition', 'Administrators cannot revoke their own administrative role.');
  }

  // 3. Verify target user exists
  const targetUserRecord = await adminAuth.getUser(targetUid);
  const userDocRef = adminDb.collection('users').doc(targetUid);
  const userSnapshot = await userDocRef.get();

  if (!userSnapshot.exists) {
    throw new AppError('not-found', `Target user with UID ${targetUid} was not found in Firestore.`);
  }

  const existingClaims = targetUserRecord.customClaims || {};
  const newRole = enabled ? 'admin' : (existingClaims.role === 'admin' ? 'faculty' : existingClaims.role || 'student');

  // 4. Update custom claims
  await adminAuth.setCustomUserClaims(targetUid, {
    ...existingClaims,
    role: newRole,
    status: 'active',
  });

  // 5. Update Firestore profile
  await userDocRef.update({
    role: newRole,
    status: 'Active',
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 6. Record activity log
  await adminDb.collection('activity_logs').add({
    actorUid: adminContext.uid,
    actorName: adminContext.token?.email || 'Administrator',
    actorRole: 'admin',
    action: `${enabled ? 'Granted' : 'Revoked'} administrator role for ${targetUserRecord.email || targetUid}`,
    targetEntity: `user:${targetUid}`,
    metadata: {
      targetUid,
      targetEmail: targetUserRecord.email || null,
      enabled,
      assignedRole: newRole,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    targetUid,
    role: newRole,
    isAdmin: enabled,
  };
});
