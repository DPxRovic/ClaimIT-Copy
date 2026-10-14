import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminStorage } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';
import { assertRequiredString } from '../utils/validation.js';
import {
  assertAuthenticated,
  assertActiveUser,
  assertAdmin,
  assertOwnerOrAdmin,
  assertAllowedKeys,
} from '../utils/auth-guards.js';

export interface CreateReportData {
  title?: string;
  itemName?: string;
  category: string;
  type?: string;
  reportType?: string;
  date: string;
  location: string;
  description: string;
  imageUrl?: string | null;
  imageStoragePath?: string | null;
}

export interface UpdateReportData {
  reportId: string;
  title?: string;
  itemName?: string;
  category?: string;
  date?: string;
  location?: string;
  description?: string;
  imageUrl?: string | null;
  imageStoragePath?: string | null;
}

export interface CloseReportData {
  reportId: string;
  reason?: string;
}

export interface DeleteReportData {
  reportId: string;
}

/**
 * Validates a YYYY-MM-DD date string and ensures it is not in the future.
 */
function assertValidReportDate(dateStr: unknown, fieldName = 'date'): string {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    throw new AppError('invalid-argument', `${fieldName} must be formatted as YYYY-MM-DD.`, { field: fieldName });
  }

  const trimmed = dateStr.trim();
  const parsedDate = new Date(trimmed + 'T00:00:00Z');
  if (isNaN(parsedDate.getTime())) {
    throw new AppError('invalid-argument', `${fieldName} is an invalid date.`, { field: fieldName });
  }

  // Ensure date is not in the future (allow current UTC day + 1 for timezones)
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  if (parsedDate > tomorrow) {
    throw new AppError('invalid-argument', `${fieldName} cannot be in the future.`, { field: fieldName });
  }

  return trimmed;
}

/**
 * Normalizes and validates the report type ('LOST' | 'FOUND').
 */
function assertValidReportType(typeVal: unknown): 'LOST' | 'FOUND' {
  if (typeof typeVal !== 'string') {
    throw new AppError('invalid-argument', 'Report type must be "lost" or "found".');
  }
  const normalized = typeVal.trim().toUpperCase();
  if (normalized !== 'LOST' && normalized !== 'FOUND') {
    throw new AppError('invalid-argument', `Invalid report type: "${typeVal}". Must be "lost" or "found".`);
  }
  return normalized;
}

/**
 * Generates a unique, collision-resistant campus ticket identifier (e.g. "R-1072").
 */
async function generateUniqueTicketNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidateTicket = `R-${randomSuffix}`;

    const existing = await adminDb
      .collection('reports')
      .where('ticketNumber', '==', candidateTicket)
      .limit(1)
      .get();

    if (existing.empty) {
      return candidateTicket;
    }
  }
  // Fallback with timestamp slice if collisions persist
  return `R-${String(Date.now()).slice(-5)}`;
}

/**
 * Callable Function: createReport
 * Creates a new Lost or Found listing.
 * Authenticated active students, active faculty, and administrators may create reports.
 */
export const createReport = onCall(async (request: CallableRequest<CreateReportData>) => {
  // 1. Enforce authentication and active account status
  const authContext = assertAuthenticated(request.auth);
  assertActiveUser(request.auth);

  const data = request.data;
  if (!data || typeof data !== 'object') {
    throw new AppError('invalid-argument', 'Request data payload is required.');
  }

  // 2. Reject unexpected or protected fields
  assertAllowedKeys(
    data as unknown as Record<string, unknown>,
    [
      'title',
      'itemName',
      'category',
      'type',
      'reportType',
      'date',
      'location',
      'description',
      'imageUrl',
      'imageStoragePath',
    ],
    'createReport'
  );

  // 3. Field validation
  const rawTitle = data.title ?? data.itemName;
  const title = assertRequiredString(rawTitle, 'Item Title / Name', 2, 120);
  const category = assertRequiredString(data.category, 'Category', 2, 64);
  const rawType = data.type ?? data.reportType;
  const reportType = assertValidReportType(rawType);
  const date = assertValidReportDate(data.date, 'date');
  const location = assertRequiredString(data.location, 'Location', 2, 200);
  const description = assertRequiredString(data.description, 'Description', 5, 2000);

  // Optional image metadata
  let imageUrl: string | null = null;
  let imageStoragePath: string | null = null;

  if (data.imageUrl && typeof data.imageUrl === 'string') {
    const trimmedUrl = data.imageUrl.trim();
    if (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('data:image/')) {
      imageUrl = trimmedUrl;
    } else {
      throw new AppError('invalid-argument', 'Invalid image URL provided.');
    }
  }

  if (data.imageStoragePath && typeof data.imageStoragePath === 'string') {
    const trimmedPath = data.imageStoragePath.trim();
    if (trimmedPath.length <= 500) {
      imageStoragePath = trimmedPath;
    }
  }

  // 4. Fetch reporter profile to reliably denormalize author info
  const userDoc = await adminDb.collection('users').doc(authContext.uid).get();
  const userProfile = userDoc.data() || {};

  const reporterName =
    userProfile.fullName ||
    authContext.token?.email?.split('@')[0] ||
    'Campus Member';

  const roleLower = (userProfile.role || authContext.token?.role || 'student').toLowerCase();
  const reporterRole: 'Student' | 'Faculty' | 'Admin' =
    roleLower === 'admin' ? 'Admin' : roleLower === 'faculty' ? 'Faculty' : 'Student';

  const reporterProgramOrDept =
    userProfile.program ||
    userProfile.department ||
    '';

  // 5. Generate ticket number and create Firestore document
  const ticketNumber = await generateUniqueTicketNumber();
  const reportsCollection = adminDb.collection('reports');
  const newReportRef = reportsCollection.doc();

  const reportDocument = {
    id: newReportRef.id,
    ticketNumber,
    title,
    category,
    type: reportType,
    status: 'Active',
    date,
    location,
    description,
    imageUrl,
    imageStoragePath,
    reporterUid: authContext.uid,
    reporterName,
    reporterRole,
    reporterProgramOrDept,
    claimsCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await newReportRef.set(reportDocument);

  return {
    success: true,
    reportId: newReportRef.id,
    ticketNumber,
    status: 'Active',
    type: reportType,
    title,
    message: `${reportType === 'LOST' ? 'Lost' : 'Found'} item report submitted successfully.`,
  };
});

/**
 * Callable Function: updateReport
 * Updates permitted fields on an existing report.
 * Only the report owner or an administrator can update the report.
 */
export const updateReport = onCall(async (request: CallableRequest<UpdateReportData>) => {
  assertAuthenticated(request.auth);
  assertActiveUser(request.auth);

  const data = request.data;
  if (!data || typeof data !== 'object') {
    throw new AppError('invalid-argument', 'Request data payload is required.');
  }

  assertAllowedKeys(
    data as unknown as Record<string, unknown>,
    [
      'reportId',
      'title',
      'itemName',
      'category',
      'date',
      'location',
      'description',
      'imageUrl',
      'imageStoragePath',
    ],
    'updateReport'
  );

  const reportId = assertRequiredString(data.reportId, 'Report ID', 1, 128);

  const reportRef = adminDb.collection('reports').doc(reportId);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) {
    throw new AppError('not-found', `Report with ID "${reportId}" does not exist.`);
  }

  const existingReport = reportSnap.data() || {};
  assertOwnerOrAdmin(request.auth, existingReport.reporterUid);

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  const rawTitle = data.title ?? data.itemName;
  if (rawTitle !== undefined) {
    updates.title = assertRequiredString(rawTitle, 'Title', 2, 120);
  }

  if (data.category !== undefined) {
    updates.category = assertRequiredString(data.category, 'Category', 2, 64);
  }

  if (data.date !== undefined) {
    updates.date = assertValidReportDate(data.date, 'date');
  }

  if (data.location !== undefined) {
    updates.location = assertRequiredString(data.location, 'Location', 2, 200);
  }

  if (data.description !== undefined) {
    updates.description = assertRequiredString(data.description, 'Description', 5, 2000);
  }

  if (data.imageUrl !== undefined) {
    if (data.imageUrl === null || data.imageUrl === '') {
      updates.imageUrl = null;
    } else if (typeof data.imageUrl === 'string') {
      const trimmedUrl = data.imageUrl.trim();
      if (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('data:image/')) {
        updates.imageUrl = trimmedUrl;
      } else {
        throw new AppError('invalid-argument', 'Invalid image URL provided.');
      }
    }
  }

  if (data.imageStoragePath !== undefined) {
    updates.imageStoragePath = data.imageStoragePath ? String(data.imageStoragePath).trim() : null;
  }

  await reportRef.update(updates);

  return {
    success: true,
    reportId,
    message: 'Report updated successfully.',
  };
});

/**
 * Callable Function: closeReport
 * Soft-deletes / retires a listing from active circulation.
 * Permitted for the report creator or an administrator.
 */
export const closeReport = onCall(async (request: CallableRequest<CloseReportData>) => {
  const authContext = assertAuthenticated(request.auth);

  const data = request.data;
  if (!data || typeof data !== 'object') {
    throw new AppError('invalid-argument', 'Request data payload is required.');
  }

  assertAllowedKeys(data as unknown as Record<string, unknown>, ['reportId', 'reason'], 'closeReport');

  const reportId = assertRequiredString(data.reportId, 'Report ID', 1, 128);
  const reason = data.reason ? String(data.reason).trim() : 'Item recovered or no longer active';

  const reportRef = adminDb.collection('reports').doc(reportId);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) {
    throw new AppError('not-found', `Report with ID "${reportId}" does not exist.`);
  }

  const existingReport = reportSnap.data() || {};
  assertOwnerOrAdmin(request.auth, existingReport.reporterUid);

  if (existingReport.status === 'Closed' || existingReport.status === 'Resolved') {
    throw new AppError(
      'failed-precondition',
      `Cannot close report with current status: "${existingReport.status}".`
    );
  }

  const isAdminCaller = (authContext.token?.role || '').toLowerCase() === 'admin';

  await reportRef.update({
    status: 'Closed',
    closedAt: FieldValue.serverTimestamp(),
    closedBy: authContext.uid,
    closeReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Log administrative close actions
  if (isAdminCaller && existingReport.reporterUid !== authContext.uid) {
    await adminDb.collection('activity_logs').add({
      actorUid: authContext.uid,
      actorName: authContext.token?.email || 'Administrator',
      actorRole: 'admin',
      action: `Closed listing ${existingReport.ticketNumber || reportId} ("${existingReport.title || 'Untitled'}"). Reason: ${reason}`,
      targetEntity: `report:${reportId}`,
      metadata: {
        reportId,
        ticketNumber: existingReport.ticketNumber || null,
        reporterUid: existingReport.reporterUid,
        reason,
      },
      timestamp: FieldValue.serverTimestamp(),
    });
  }

  return {
    success: true,
    reportId,
    ticketNumber: existingReport.ticketNumber || null,
    status: 'Closed',
    message: 'Report closed successfully.',
  };
});

/**
 * Callable Function: deleteReport
 * Permanently removes a report and cleans up its stored image.
 * Administrator-only operation to preserve audit trail and data integrity.
 */
export const deleteReport = onCall(async (request: CallableRequest<DeleteReportData>) => {
  const adminContext = assertAdmin(request.auth);

  const data = request.data;
  if (!data || typeof data !== 'object') {
    throw new AppError('invalid-argument', 'Request data payload is required.');
  }

  assertAllowedKeys(data as unknown as Record<string, unknown>, ['reportId'], 'deleteReport');

  const reportId = assertRequiredString(data.reportId, 'Report ID', 1, 128);
  const reportRef = adminDb.collection('reports').doc(reportId);
  const reportSnap = await reportRef.get();

  if (!reportSnap.exists) {
    throw new AppError('not-found', `Report with ID "${reportId}" was not found.`);
  }

  const existingReport = reportSnap.data() || {};

  // Clean up associated image in Storage if exists
  if (existingReport.imageStoragePath) {
    try {
      const bucket = adminStorage.bucket();
      await bucket.file(existingReport.imageStoragePath).delete({ ignoreNotFound: true });
    } catch (storageErr) {
      console.warn(`Could not delete storage image for report ${reportId}:`, storageErr);
    }
  }

  await reportRef.delete();

  // Audit log entry for deletion
  await adminDb.collection('activity_logs').add({
    actorUid: adminContext.uid,
    actorName: adminContext.token?.email || 'Administrator',
    actorRole: 'admin',
    action: `Deleted report listing ${existingReport.ticketNumber || reportId} ("${existingReport.title || 'Untitled'}")`,
    targetEntity: `report:${reportId}`,
    metadata: {
      reportId,
      ticketNumber: existingReport.ticketNumber || null,
      reporterUid: existingReport.reporterUid,
      title: existingReport.title || null,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    reportId,
    message: 'Report listing permanently deleted.',
  };
});
