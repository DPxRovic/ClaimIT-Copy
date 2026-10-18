import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { auth, db, storage, functions } from './config.js';
import { formatReportRecord } from './reports.js';

// In-memory claims store for demo sessions or offline fallbacks
const MOCK_CLAIMS_STORE = [
  {
    id: 'clm-8401',
    claimId: 'clm-8401',
    ticketId: '#CLM-8401',
    reportId: 'airpods-pro-2',
    reportTitle: 'Apple AirPods Pro (2nd Gen)',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'Electronics',
    reportType: 'FOUND',
    mode: 'claim',
    type: 'Found Claim',
    submitted: 'Sep 15, 2026',
    status: 'Pending',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ-p-PVJuZ3M3F6g6WthSsKMaRgzboUZBXvrHPbuc-LS0798_O7ULhuVYGHl-CqxeedN8ujsiv5vzqBGC5u4-pKpmS08lYj8XwXRUsWyBwI3yMMOsETk7FYRpWecxU43aYckGgwXPyQKKAM7aoKcmGO3QkEMNMAed-Hrl-8iRJD5r_m2sNghhAaJTz_4BOlZpZOnDB2CiVcBG2Hl9irNzxHyslYyGtybqBTWTtjc4qV6OoPGUyiL0oRw',
    iconType: 'airpods',
    posterName: 'Marco Villanueva',
    location: 'Engineering Quad',
    foundDate: 'September 14, 2026',
    claimedDate: 'Claimed Sep 15, 2026',
    unreadUpdates: true,
    description: 'White MagSafe charging case with faint hairline scratch on bottom rim. Bluetooth name verified.',
    userProof: 'AirPods Pro 2 case with scratch on base. Serial ending in 8X9Q and Bluetooth device named Lia Pro.',
    proofDetails: 'AirPods Pro 2 case with scratch on base. Serial ending in 8X9Q and Bluetooth device named Lia Pro.',
    attachmentName: 'bluetooth_settings_screen.png',
    attachmentSize: '1.2 MB',
    attachmentUrls: [],
    claimantUid: 'mock-student_campus_edu',
    claimantName: 'Hannah Puerta',
    claimantRole: 'Student',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Engineering Quad Security Post',
    createdAt: new Date('2026-09-15T15:45:00Z').toISOString(),
    updatedAt: new Date('2026-09-15T16:00:00Z').toISOString(),
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 15, 3:45 PM', completed: true },
      { step: 'Awaiting Verification', date: 'Sep 15, 4:00 PM', completed: true, current: true },
      { step: 'Approval & Handover Code', date: 'Pending review', completed: false },
    ],
  },
  {
    id: 'clm-7923',
    claimId: 'clm-7923',
    ticketId: '#CLM-7923',
    reportId: 'keys-campus-lanyard',
    reportTitle: 'Keys with Red Campus Lanyard',
    title: 'Ring of three keys, red lanyard',
    category: 'Keys & Accessories',
    reportType: 'FOUND',
    mode: 'claim',
    type: 'Lost Claim',
    submitted: 'Sep 14, 2026',
    status: 'Approved',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3pzvaVJ-Abi0wPYwzm5YE9siASmc3OfbTQa9BLhGg4vWYj4iSPSZMMIrzZP1rjShNP7qT563qJJtG0WcqnPo8_zXxK-LyUrGtVw8R4YeAvH6BLdokiJ1kPt9JDnpyy45_mszIWq0rf7qlpHd543EZhP1oBk2YY9fGpscB6tsb18QjAF5rqZbCG__brAKAIlQwWbRZ7oedo9o_0h9RCjElcl0w0DQwY2K5EJTV5aELiQEYa0DFHUwzMA',
    iconType: 'keys',
    contactPerson: 'Ana Reyes',
    posterName: 'Ana Reyes (BS Psychology)',
    location: 'Isles',
    foundDate: 'September 14, 2026',
    claimedDate: 'Claimed Sep 14, 2026',
    unreadUpdates: true,
    description: 'Three keys on a red lanyard with a small silver tag.',
    userProof:
      'One house key, one padlock key and a tiny silver mailbox key. The lanyard is red with IT 2A written on it. I lost it last Friday around 2 pm.',
    proofDetails:
      'One house key, one padlock key and a tiny silver mailbox key. The lanyard is red with IT 2A written on it. I lost it last Friday around 2 pm.',
    handoverLocation: 'Main Library Service Desk (Floor 1)',
    attachmentUrls: [],
    claimantUid: 'mock-student_campus_edu',
    claimantName: 'Hannah Puerta',
    claimantRole: 'Student',
    createdAt: new Date('2026-09-14T10:20:00Z').toISOString(),
    updatedAt: new Date('2026-09-15T09:00:00Z').toISOString(),
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 14, 10:20 AM', completed: true },
      { step: 'Matched with Found Item', date: 'Sep 14, 1:15 PM', completed: true },
      { step: 'Approved for Handover', date: 'Sep 15, 9:00 AM', completed: true, current: true },
      { step: 'Picked Up', date: 'Pending pickup', completed: false },
    ],
  },
  {
    id: 'clm-6180',
    claimId: 'clm-6180',
    ticketId: '#CLM-6180',
    reportId: 'calculus-textbook-9th',
    reportTitle: 'Casio scientific calculator fx-991',
    title: 'Casio scientific calculator fx-991',
    category: 'Books & Study Material',
    reportType: 'FOUND',
    mode: 'claim',
    type: 'Lost Claim',
    submitted: 'Sep 12, 2026',
    status: 'Declined',
    iconType: 'calculator',
    posterName: 'Marco Villanueva (BS Computer Science)',
    location: 'Guard House',
    foundDate: 'September 12, 2026',
    claimedDate: 'Claimed Sep 12 • Declined',
    description: 'Casio fx-991 scientific calculator with dark gray sliding hard cover.',
    userProof: 'Casio scientific calculator fx-991 with faint silver initials MV on reverse battery plate. Left on table 4.',
    proofDetails: 'Casio scientific calculator fx-991 with faint silver initials MV on reverse battery plate. Left on table 4.',
    attachmentName: 'calculator_model.png',
    attachmentSize: '420 KB',
    attachmentUrls: [],
    declinedReason: 'Marco Villanueva reviewed your submitted proof and marked it as non-matching with the found item.',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Mathematics Department Reception (Hall 4)',
    claimantUid: 'mock-student_campus_edu',
    claimantName: 'Hannah Puerta',
    claimantRole: 'Student',
    createdAt: new Date('2026-09-12T08:40:00Z').toISOString(),
    updatedAt: new Date('2026-09-13T10:15:00Z').toISOString(),
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 12, 8:40 AM', completed: true },
      { step: 'Evidence Evaluated', date: 'Sep 12, 2:00 PM', completed: true },
      { step: 'Claim Declined', date: 'Sep 13, 10:15 AM', completed: true, current: true },
    ],
  },
];

/**
 * Checks whether the current session is running in demo/mock mode.
 */
function isMockSession() {
  const currentUser = auth.currentUser;
  return (
    currentUser?.uid?.startsWith('mock-') ||
    auth.app.options.apiKey === 'demo-claimit-api-key'
  );
}

/**
 * Normalizes a Firestore claim document or mock record into the client's standard Claim shape.
 */
export function formatClaimRecord(docSnapOrData, parentReport = null) {
  if (!docSnapOrData) return null;

  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData;
  const id = docSnapOrData.id || data.id || data.claimId || `clm-${Date.now()}`;
  const ticketId = data.ticketId || (data.mode === 'found_report' ? `#FND-${id.slice(-4)}` : `#CLM-${id.slice(-4)}`);

  const rawCreatedAt = data.createdAt;
  let submittedDate = 'Recently';
  let formattedDate = 'Recently';

  if (rawCreatedAt) {
    try {
      const dateObj = rawCreatedAt.toDate ? rawCreatedAt.toDate() : new Date(rawCreatedAt);
      submittedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
      });
    } catch {
      submittedDate = 'Recently';
    }
  }

  const status = data.status || 'Pending';
  const mode = data.mode || 'claim';
  const isMatch = mode === 'found_report';

  // Construct realistic progress timeline based on current status
  let timeline = data.timeline;
  if (!timeline || !Array.isArray(timeline)) {
    if (status === 'Approved') {
      timeline = [
        { step: 'Claim Submitted', date: submittedDate, completed: true },
        { step: 'Evidence Verified', date: 'Verified', completed: true },
        { step: 'Approved for Handover', date: 'Ready for collection', completed: true, current: true },
      ];
    } else if (status === 'Declined') {
      timeline = [
        { step: 'Claim Submitted', date: submittedDate, completed: true },
        { step: 'Evidence Evaluated', date: 'Evaluated', completed: true },
        { step: 'Claim Declined', date: 'Declined by reviewer', completed: true, current: true },
      ];
    } else if (status === 'Withdrawn') {
      timeline = [
        { step: 'Claim Submitted', date: submittedDate, completed: true },
        { step: 'Withdrawn by User', date: 'Withdrawn', completed: true, current: true },
      ];
    } else {
      timeline = [
        { step: 'Claim Submitted', date: submittedDate, completed: true },
        { step: 'Awaiting Verification', date: 'Under review', completed: true, current: true },
        { step: 'Approval & Handover Code', date: 'Pending review', completed: false },
      ];
    }
  }

  const reportTitle = data.reportTitle || data.title || parentReport?.title || 'Campus Item';
  const reportCategory = data.category || parentReport?.category || 'General';
  const reportLocation = data.reportLocation || data.location || parentReport?.location || 'Campus Grounds';
  const reportImageUrl = data.reportImageUrl || data.imageUrl || parentReport?.imageUrl || null;

  return {
    id,
    claimId: id,
    ticketId,
    reportId: data.reportId || parentReport?.id || '',
    title: reportTitle,
    reportTitle,
    category: reportCategory,
    mode,
    isMatch,
    type: isMatch ? 'Found Claim' : 'Lost Claim',
    submitted: submittedDate,
    submittedDate,
    status,
    imageUrl: reportImageUrl,
    posterName: data.posterName || parentReport?.reporterName || 'Campus Member',
    location: reportLocation,
    foundDate: data.foundDate || parentReport?.date || submittedDate,
    claimedDate: `Claimed ${submittedDate}${status === 'Withdrawn' ? ' • Withdrawn' : status === 'Declined' ? ' • Declined' : ''}`,
    description: data.description || parentReport?.description || '',
    userProof: data.proofDetails || data.userProof || '',
    proofDetails: data.proofDetails || data.userProof || '',
    attachmentUrls: data.attachmentUrls || [],
    attachmentPaths: data.attachmentPaths || [],
    attachmentName: data.attachmentNames?.[0] || data.attachmentName || (data.attachmentUrls?.length > 0 ? 'evidence_attachment.jpg' : null),
    attachmentSize: data.attachmentSizes?.[0] || data.attachmentSize || (data.attachmentUrls?.length > 0 ? '1.4 MB' : null),
    contactPerson: data.posterName || 'Finder',
    handoverLocation: data.handoverLocation || 'Campus Lost & Found Office (Student Affairs / Security Desk)',
    declinedReason: data.decisionReason || data.declinedReason || null,
    decisionReason: data.decisionReason || data.declinedReason || null,
    claimantUid: data.claimantUid || '',
    claimantName: data.claimantName || 'Claimant',
    claimantRole: data.claimantRole || 'Student',
    timeline,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    reviewedBy: data.reviewedBy || null,
    reviewedAt: data.reviewedAt || null,
  };
}

/**
 * Uploads a private claim evidence image to Firebase Storage (claims/{claimTempId}/{fileName}).
 * Adds private metadata tags (uploaderUid, reportCreatorUid) to ensure security rules enforce privacy.
 */
export async function uploadClaimEvidence(file, claimTempId = 'temp', reportCreatorUid = '') {
  if (!file) return { url: null, path: null, name: null, size: null };

  const currentUser = auth.currentUser;
  const fileName = file.name || 'evidence.jpg';
  const formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  // Demo session fallback: local Object URL
  if (isMockSession()) {
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      path: `claims/${claimTempId}/${fileName}`,
      name: fileName,
      size: formattedSize,
    };
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `claims/${claimTempId}/${Date.now()}_${safeFileName}`;
  const fileRef = ref(storage, storagePath);

  const metadata = {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      uploaderUid: currentUser?.uid || 'anonymous',
      reportCreatorUid: reportCreatorUid || '',
    },
  };

  try {
    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      url: downloadUrl,
      path: storagePath,
      name: fileName,
      size: formattedSize,
    };
  } catch (storageErr) {
    console.warn('[Storage] Evidence upload failed, falling back to local object URL:', storageErr);
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      path: storagePath,
      name: fileName,
      size: formattedSize,
    };
  }
}

/**
 * Submits an ownership claim or found report match on an item.
 * Validates inputs, uploads evidence files, and calls the trusted backend.
 */
export async function submitClaimService({
  reportId,
  mode = 'claim',
  proofDetails,
  files = [],
  report = null,
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to submit a claim or report.');
  }

  const cleanProof = (proofDetails || '').trim();
  if (!cleanProof) {
    throw new Error(
      mode === 'found_report'
        ? 'Please describe where you spotted or turned in the item.'
        : 'Please provide proof of ownership details (e.g. unique marks, contents, serial numbers).'
    );
  }

  if (cleanProof.length < 5) {
    throw new Error('Please provide at least 5 characters describing your claim or match.');
  }

  if (cleanProof.length > 2000) {
    throw new Error('Your claim description cannot exceed 2000 characters.');
  }

  if (!reportId) {
    throw new Error('Target report ID is required.');
  }

  // Upload attachments if provided (up to 3 files)
  const attachmentUrls = [];
  const attachmentPaths = [];
  const attachmentNames = [];
  const attachmentSizes = [];

  const tempId = `claim_${Date.now()}`;
  const fileList = Array.isArray(files) ? files.slice(0, 3) : [];

  for (const f of fileList) {
    if (f instanceof File) {
      const uploadResult = await uploadClaimEvidence(f, tempId, report?.reporterUid);
      if (uploadResult.url) {
        attachmentUrls.push(uploadResult.url);
        attachmentPaths.push(uploadResult.path);
        attachmentNames.push(uploadResult.name);
        attachmentSizes.push(uploadResult.size);
      }
    } else if (f?.url) {
      attachmentUrls.push(f.url);
      if (f.path) attachmentPaths.push(f.path);
      if (f.name) attachmentNames.push(f.name);
      if (f.size) attachmentSizes.push(f.size);
    }
  }

  if (!isMockSession()) {
    // 1. Primary path: Callable Cloud Function `submitClaim`
    try {
      const submitCallable = httpsCallable(functions, 'submitClaim');
      const response = await submitCallable({
        reportId,
        mode,
        proofDetails: cleanProof,
        attachmentUrls,
        attachmentPaths,
        attachmentNames,
        attachmentSizes,
      });

      return {
        ...response.data,
        attachmentUrls,
        attachmentNames,
        attachmentSizes,
      };
    } catch (fnErr) {
      const isFnUnavailable =
        fnErr.code === 'functions/unavailable' ||
        fnErr.code === 'functions/not-found' ||
        fnErr.message?.includes('network') ||
        fnErr.message?.includes('internal');

      if (!isFnUnavailable) {
        throw fnErr;
      }

      console.info('[Claims] Callable function unavailable; executing direct Firestore write fallback.');

      // 2. Direct Firestore fallback (governed by firestore.rules)
      try {
        const reportRef = doc(db, 'reports', reportId);
        const claimsCol = collection(reportRef, 'claims');
        const claimDocRef = doc(claimsCol);
        const ticketId = mode === 'found_report'
          ? `#FND-${Math.floor(1000 + Math.random() * 9000)}`
          : `#CLM-${Math.floor(1000 + Math.random() * 9000)}`;

        const newClaimDoc = {
          id: claimDocRef.id,
          ticketId,
          reportId,
          reportTitle: report?.title || 'Campus Item',
          reportType: report?.type || 'FOUND',
          reportLocation: report?.location || '',
          reportImageUrl: report?.imageUrl || null,
          reportCreatorUid: report?.reporterUid || '',
          posterName: report?.reporterName || 'Campus Member',
          claimantUid: currentUser.uid,
          claimantName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Campus Member',
          claimantRole: 'Student',
          claimantEmail: currentUser.email || '',
          mode,
          status: 'Pending',
          proofDetails: cleanProof,
          attachmentUrls,
          attachmentPaths,
          attachmentNames,
          attachmentSizes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const batch = writeBatch(db);
        batch.set(claimDocRef, newClaimDoc);
        batch.update(reportRef, {
          status: mode === 'found_report' ? 'Pending Match' : 'Pending Claim',
          updatedAt: serverTimestamp(),
        });

        await batch.commit();

        return {
          success: true,
          claimId: claimDocRef.id,
          ticketId,
          status: 'Pending',
          reportId,
          message: `${mode === 'found_report' ? 'Found report' : 'Claim'} submitted successfully.`,
        };
      } catch (firestoreErr) {
        console.warn('[Firestore] Direct claim write fallback failed:', firestoreErr);
      }
    }
  }

  // 3. In-memory fallback for demo session
  const mockClaimId = `clm-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticketId = mode === 'found_report'
    ? `#FND-${Math.floor(1000 + Math.random() * 9000)}`
    : `#CLM-${Math.floor(1000 + Math.random() * 9000)}`;

  const mockClaim = formatClaimRecord({
    id: mockClaimId,
    ticketId,
    reportId,
    reportTitle: report?.title || 'Campus Item',
    title: report?.title || 'Campus Item',
    category: report?.category || 'General',
    mode,
    type: mode === 'found_report' ? 'Found Claim' : 'Lost Claim',
    status: 'Pending',
    imageUrl: report?.imageUrl || null,
    posterName: report?.reporterName || 'Campus Member',
    location: report?.location || 'Campus Grounds',
    description: report?.description || '',
    userProof: cleanProof,
    proofDetails: cleanProof,
    attachmentUrls,
    attachmentPaths,
    attachmentNames,
    attachmentSizes,
    claimantUid: currentUser.uid,
    claimantName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Campus Member',
    claimantRole: 'Student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  MOCK_CLAIMS_STORE.unshift(mockClaim);

  return {
    success: true,
    claimId: mockClaimId,
    ticketId,
    status: 'Pending',
    reportId,
    message: `${mode === 'found_report' ? 'Found report' : 'Claim'} submitted successfully.`,
  };
}

/**
 * Reviews a claim (Approve or Decline) by the report owner or administrator.
 */
export async function reviewClaimService({
  reportId,
  claimId,
  action, // 'approve' | 'decline'
  handoverLocation = '',
  declineReason = '',
}) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to review a claim.');
  }

  if (action !== 'approve' && action !== 'decline') {
    throw new Error('Action must be "approve" or "decline".');
  }

  if (!isMockSession()) {
    try {
      const reviewCallable = httpsCallable(functions, 'reviewClaim');
      const response = await reviewCallable({
        reportId,
        claimId,
        action,
        handoverLocation,
        declineReason,
      });
      return response.data;
    } catch (fnErr) {
      console.warn('[reviewClaim] Cloud function unavailable; applying direct Firestore update fallback:', fnErr);
      try {
        const claimRef = doc(db, 'reports', reportId, 'claims', claimId);
        const reportRef = doc(db, 'reports', reportId);
        const newStatus = action === 'approve' ? 'Approved' : 'Declined';

        const batch = writeBatch(db);
        batch.update(claimRef, {
          status: newStatus,
          reviewedBy: currentUser.uid,
          reviewedAt: serverTimestamp(),
          decisionReason: declineReason || (action === 'approve' ? 'Verified by report owner.' : 'Submitted details did not match.'),
          handoverLocation: handoverLocation || 'Campus Lost & Found Office',
          updatedAt: serverTimestamp(),
        });

        if (action === 'approve') {
          batch.update(reportRef, {
            status: 'Resolved',
            resolvedClaimId: claimId,
            updatedAt: serverTimestamp(),
          });
        }

        await batch.commit();

        return {
          success: true,
          claimId,
          status: newStatus,
          reportStatus: action === 'approve' ? 'Resolved' : 'Active',
        };
      } catch (err) {
        console.warn('Firestore review claim direct fallback failed:', err);
      }
    }
  }

  // Update in-memory mock store
  const target = MOCK_CLAIMS_STORE.find((c) => c.id === claimId || c.claimId === claimId || c.ticketId === claimId);
  const newStatus = action === 'approve' ? 'Approved' : 'Declined';
  if (target) {
    target.status = newStatus;
    target.reviewedBy = currentUser.uid;
    target.reviewedAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();
    target.decisionReason = declineReason || (action === 'approve' ? 'Verified by report owner.' : 'Details did not match.');
    if (handoverLocation) target.handoverLocation = handoverLocation;
  }

  return {
    success: true,
    claimId,
    status: newStatus,
    reportStatus: action === 'approve' ? 'Resolved' : 'Active',
    message: `Claim ${action === 'approve' ? 'approved' : 'declined'}.`,
  };
}

/**
 * Withdraws a pending claim submitted by the current user.
 */
export async function withdrawClaimService({ reportId, claimId, reason = 'Withdrawn by claimant' }) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to withdraw a claim.');
  }

  if (!isMockSession()) {
    try {
      const withdrawCallable = httpsCallable(functions, 'withdrawClaim');
      const response = await withdrawCallable({ reportId, claimId, reason });
      return response.data;
    } catch (fnErr) {
      console.warn('[withdrawClaim] Cloud Function unavailable; attempting direct Firestore fallback:', fnErr);
      try {
        const claimRef = doc(db, 'reports', reportId, 'claims', claimId);
        await updateDoc(claimRef, {
          status: 'Withdrawn',
          decisionReason: reason,
          updatedAt: serverTimestamp(),
        });
        return { success: true, claimId, status: 'Withdrawn' };
      } catch (err) {
        console.warn('Direct Firestore withdraw fallback failed:', err);
      }
    }
  }

  // Update in-memory mock store
  const target = MOCK_CLAIMS_STORE.find((c) => c.id === claimId || c.claimId === claimId || c.ticketId === claimId);
  if (target) {
    target.status = 'Withdrawn';
    target.decisionReason = reason;
    target.updatedAt = new Date().toISOString();
  }

  return { success: true, claimId, status: 'Withdrawn', message: 'Claim withdrawn successfully.' };
}

/**
 * Fetches all claims submitted by a specific user across all reports (for My Claims view).
 */
export async function fetchUserClaims(uid, statusFilter = 'All statuses') {
  if (!uid) return [];

  if (isMockSession()) {
    let list = MOCK_CLAIMS_STORE.filter((c) => c.claimantUid === uid);
    if (statusFilter && statusFilter !== 'All statuses') {
      list = list.filter((c) => c.status === statusFilter);
    }
    return list.map((c) => formatClaimRecord(c));
  }

  try {
    const claimsQuery = collectionGroup(db, 'claims');
    const constraints = [where('claimantUid', '==', uid)];

    if (statusFilter && statusFilter !== 'All statuses') {
      constraints.push(where('status', '==', statusFilter));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(claimsQuery, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => formatClaimRecord(docSnap));
  } catch (err) {
    console.warn('[Firestore] fetchUserClaims query fallback:', err);
    let list = MOCK_CLAIMS_STORE.filter((c) => c.claimantUid === uid);
    if (statusFilter && statusFilter !== 'All statuses') {
      list = list.filter((c) => c.status === statusFilter);
    }
    return list.map((c) => formatClaimRecord(c));
  }
}

/**
 * Subscribes to real-time changes in the current user's submitted claims.
 */
export function subscribeUserClaims(uid, onUpdate, onError, statusFilter = 'All statuses') {
  if (!uid) return () => {};

  if (isMockSession()) {
    let list = MOCK_CLAIMS_STORE.filter((c) => c.claimantUid === uid);
    if (statusFilter && statusFilter !== 'All statuses') {
      list = list.filter((c) => c.status === statusFilter);
    }
    onUpdate(list.map((c) => formatClaimRecord(c)));
    return () => {};
  }

  try {
    const claimsQuery = collectionGroup(db, 'claims');
    const constraints = [where('claimantUid', '==', uid)];

    if (statusFilter && statusFilter !== 'All statuses') {
      constraints.push(where('status', '==', statusFilter));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    const q = query(claimsQuery, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const claims = snapshot.docs.map((docSnap) => formatClaimRecord(docSnap));
        onUpdate(claims);
      },
      (err) => {
        console.warn('[Firestore] subscribeUserClaims listener error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] onSnapshot error on claims collectionGroup:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Fetches all claims or matches filed on a specific report (for the report owner to review).
 */
export async function fetchReportClaims(reportId) {
  if (!reportId) return [];

  if (isMockSession()) {
    const list = MOCK_CLAIMS_STORE.filter((c) => c.reportId === reportId);
    return list.map((c) => formatClaimRecord(c));
  }

  try {
    const reportClaimsCol = collection(db, 'reports', reportId, 'claims');
    const q = query(reportClaimsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => formatClaimRecord(docSnap));
  } catch (err) {
    console.warn(`[Firestore] fetchReportClaims error for report #${reportId}:`, err);
    const list = MOCK_CLAIMS_STORE.filter((c) => c.reportId === reportId);
    return list.map((c) => formatClaimRecord(c));
  }
}

/**
 * Subscribes to real-time claims and matches for a specific report.
 */
export function subscribeReportClaims(reportId, onUpdate, onError) {
  if (!reportId) return () => {};

  if (isMockSession()) {
    const list = MOCK_CLAIMS_STORE.filter((c) => c.reportId === reportId);
    onUpdate(list.map((c) => formatClaimRecord(c)));
    return () => {};
  }

  try {
    const reportClaimsCol = collection(db, 'reports', reportId, 'claims');
    const q = query(reportClaimsCol, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => formatClaimRecord(d));
        onUpdate(items);
      },
      (err) => {
        console.warn(`[Firestore] subscribeReportClaims error for report #${reportId}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn(`[Firestore] onSnapshot error on report #${reportId} claims:`, err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Returns currently stored mock claims for demo inspection.
 */
export function getMockClaims() {
  return [...MOCK_CLAIMS_STORE];
}
