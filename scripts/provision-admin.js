#!/usr/bin/env node

/**
 * ClaimIt — Trusted Administrator Provisioning CLI Script
 * 
 * Usage:
 *   node scripts/provision-admin.js <email_or_uid> [--revoke]
 * 
 * Examples:
 *   node scripts/provision-admin.js admin@campus.edu
 *   node scripts/provision-admin.js usr_abc123 --revoke
 * 
 * Security:
 *   - Must be executed only by authorized DevOps or System Administrators with access to service account credentials.
 *   - Never exposed through client routes, URLs, or frontend buttons.
 *   - Updates both Firebase Auth Custom Claims (source of truth) and Cloud Firestore profile.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const target = args[0];
const isRevoke = args.includes('--revoke');

if (!target || target === '--help' || target === '-h') {
  console.log(`
ClaimIt — Administrator Provisioning Tool

Usage:
  node scripts/provision-admin.js <email_or_uid> [--revoke]

Options:
  --revoke    Revokes admin role, setting user role back to student/faculty.
`);
  process.exit(1);
}

// Initialize Admin SDK if not already initialized
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'claimit-campus',
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

async function run() {
  console.log(`🔍 Looking up target user: "${target}"...`);

  let userRecord;
  try {
    if (target.includes('@')) {
      userRecord = await adminAuth.getUserByEmail(target.trim().toLowerCase());
    } else {
      userRecord = await adminAuth.getUser(target.trim());
    }
  } catch (err) {
    console.error(`❌ User lookup failed: ${err.message}`);
    process.exit(1);
  }

  const uid = userRecord.uid;
  const email = userRecord.email;
  const currentClaims = userRecord.customClaims || {};

  console.log(`Found account: ${email || uid} (UID: ${uid})`);
  console.log(`Current Claims:`, currentClaims);

  const newRole = isRevoke ? 'student' : 'admin';
  const newStatus = 'active';

  // 1. Assign or revoke Custom Claims
  await adminAuth.setCustomUserClaims(uid, {
    ...currentClaims,
    role: newRole,
    status: newStatus,
  });
  console.log(`✅ Set Custom Claims: { role: '${newRole}', status: '${newStatus}' }`);

  // 2. Update Firestore user profile
  const userDocRef = adminDb.collection('users').doc(uid);
  const userDoc = await userDocRef.get();

  const profileUpdate = {
    role: newRole,
    status: 'Active',
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!userDoc.exists) {
    console.log(`ℹ️ User profile document does not exist yet. Creating profile document...`);
    await userDocRef.set({
      uid,
      email: email || '',
      fullName: userRecord.displayName || (email ? email.split('@')[0] : 'Administrator'),
      ...profileUpdate,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    await userDocRef.update(profileUpdate);
  }
  console.log(`✅ Firestore profile users/${uid} updated with role: '${newRole}'.`);

  // 3. Record audit log entry
  try {
    await adminDb.collection('activity_logs').add({
      actorUid: 'cli-system-admin',
      actorName: 'System Console / CLI',
      actorRole: 'admin',
      action: `${isRevoke ? 'Revoked' : 'Provisioned'} administrator privileges for ${email || uid}`,
      targetEntity: `user:${uid}`,
      timestamp: FieldValue.serverTimestamp(),
    });
    console.log(`✅ Activity log recorded in activity_logs collection.`);
  } catch (logErr) {
    console.warn(`⚠️ Warning: could not write activity log:`, logErr.message);
  }

  console.log(`\n🎉 Successfully ${isRevoke ? 'revoked' : 'provisioned'} administrator role for ${email || uid}!`);
}

run().catch((err) => {
  console.error('Fatal provisioning error:', err);
  process.exit(1);
});
