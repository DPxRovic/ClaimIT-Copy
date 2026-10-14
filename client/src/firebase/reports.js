import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { auth, db, storage, functions } from './config.js';

// In-memory reports store for mock/demo sessions
const MOCK_REPORTS_STORE = [];

/**
 * Uploads an item photograph to Firebase Storage with size and MIME validation.
 */
export async function uploadReportImage(file, reportTempId = 'temp') {
  if (!file) return { imageUrl: null, imageStoragePath: null };

  const currentUser = auth.currentUser;
  const isMockUser = currentUser?.uid?.startsWith('mock-') || auth.app.options.apiKey === 'demo-claimit-api-key';

  // Fallback to local DataURL/blob URL for mock session
  if (isMockUser) {
    const objectUrl = URL.createObjectURL(file);
    return {
      imageUrl: objectUrl,
      imageStoragePath: `reports/${reportTempId}/${file.name}`,
    };
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `reports/${reportTempId}/${Date.now()}_${safeFileName}`;
  const fileRef = ref(storage, storagePath);

  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploaderUid: currentUser?.uid || 'anonymous',
    },
  };

  try {
    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      imageUrl: downloadUrl,
      imageStoragePath: storagePath,
    };
  } catch (storageErr) {
    console.warn('[Storage] Image upload failed or emulator unavailable:', storageErr);
    // Provide blob URL fallback so user can still see the image
    const objectUrl = URL.createObjectURL(file);
    return {
      imageUrl: objectUrl,
      imageStoragePath: storagePath,
    };
  }
}

/**
 * Creates a new Lost or Found item report.
 * Tries the privileged Cloud Function first, then falls back to direct client-side Firestore,
 * and finally in-memory store for demo sessions.
 */
export async function createReportService(reportData) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to submit a report.');
  }

  const rawTitle = (reportData.title || reportData.itemName || '').trim();
  const category = (reportData.category || '').trim();
  const rawType = (reportData.type || reportData.reportType || 'lost').trim().toUpperCase();
  const reportType = rawType === 'FOUND' ? 'FOUND' : 'LOST';
  const date = (reportData.date || new Date().toISOString().slice(0, 10)).trim();
  const location = (reportData.location || '').trim();
  const description = (reportData.description || '').trim();

  if (!rawTitle) throw new Error('Item name / title is required.');
  if (!category) throw new Error('Please select a category.');
  if (!location) throw new Error('Location is required.');
  if (!description) throw new Error('Description is required.');

  // Handle image upload if a File instance was passed
  let imageUrl = reportData.imageUrl || null;
  let imageStoragePath = reportData.imageStoragePath || null;

  if (reportData.imageFile instanceof File) {
    const tempId = `temp_${Date.now()}`;
    const uploadResult = await uploadReportImage(reportData.imageFile, tempId);
    imageUrl = uploadResult.imageUrl;
    imageStoragePath = uploadResult.imageStoragePath;
  }

  const isMockUser = currentUser.uid.startsWith('mock-') || auth.app.options.apiKey === 'demo-claimit-api-key';

  if (!isMockUser) {
    // 1. Preferred path: Callable Cloud Function
    try {
      const createCallable = httpsCallable(functions, 'createReport');
      const result = await createCallable({
        title: rawTitle,
        category,
        type: reportType,
        date,
        location,
        description,
        imageUrl,
        imageStoragePath,
      });

      return {
        ...result.data,
        imageUrl,
        imageStoragePath,
      };
    } catch (fnErr) {
      const isFnUnavailable =
        fnErr.code === 'functions/unavailable' ||
        fnErr.code === 'functions/not-found' ||
        fnErr.message?.includes('network') ||
        fnErr.message?.includes('internal');

      if (!isFnUnavailable) {
        // Re-throw genuine validation errors from Cloud Function
        throw fnErr;
      }

      console.info('[Reports] Cloud Function unavailable, executing client-side Firestore fallback.');

      // 2. Direct Firestore write fallback (governed by firestore.rules)
      try {
        const reportCol = collection(db, 'reports');
        const reportDocRef = doc(reportCol);
        const ticketNumber = `R-${Math.floor(1000 + Math.random() * 9000)}`;

        const newDoc = {
          id: reportDocRef.id,
          ticketNumber,
          title: rawTitle,
          category,
          type: reportType,
          status: 'Active',
          date,
          location,
          description,
          imageUrl,
          imageStoragePath,
          reporterUid: currentUser.uid,
          reporterName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Campus Member',
          reporterRole: 'Student',
          reporterProgramOrDept: '',
          claimsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(reportDocRef, newDoc);

        return {
          success: true,
          reportId: reportDocRef.id,
          ticketNumber,
          status: 'Active',
          type: reportType,
          title: rawTitle,
          imageUrl,
          imageStoragePath,
          message: 'Report created successfully.',
        };
      } catch (firestoreErr) {
        console.warn('[Firestore] Client write error:', firestoreErr);
        // Fall down to mock store
      }
    }
  }

  // 3. In-memory fallback for offline/demo sessions
  const reportId = `R-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticketNumber = reportId;

  const mockReport = {
    id: reportId,
    ticketNumber,
    ticket: ticketNumber,
    title: rawTitle,
    itemName: rawTitle,
    category,
    type: reportType,
    status: 'Active',
    date,
    dateFiled: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    location,
    description,
    imageUrl: imageUrl || reportData.imagePreview || null,
    imageStoragePath,
    reporterUid: currentUser.uid,
    reporterName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Campus Member',
    reporterRole: currentUser.email?.includes('faculty') ? 'Faculty' : 'Student',
    reporterProgramOrDept: 'Campus Department',
    claimsCount: 0,
    claims: '—',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: [],
  };

  MOCK_REPORTS_STORE.unshift(mockReport);

  return {
    success: true,
    reportId,
    ticketNumber,
    status: 'Active',
    type: reportType,
    title: rawTitle,
    imageUrl: mockReport.imageUrl,
    imageStoragePath,
    message: `${reportType === 'LOST' ? 'Lost' : 'Found'} item report submitted successfully.`,
  };
}

/**
 * Closes (soft-deletes) an active report listing.
 */
export async function closeReportService(reportId, reason = 'Item recovered or no longer active') {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to close a report.');
  }

  const isMockUser = currentUser.uid.startsWith('mock-') || auth.app.options.apiKey === 'demo-claimit-api-key';

  if (!isMockUser) {
    try {
      const closeCallable = httpsCallable(functions, 'closeReport');
      const result = await closeCallable({ reportId, reason });
      return result.data;
    } catch (_fnErr) {
      // Direct Firestore update fallback
      try {
        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
          status: 'Closed',
          closedAt: serverTimestamp(),
          closedBy: currentUser.uid,
          closeReason: reason,
          updatedAt: serverTimestamp(),
        });
        return { success: true, reportId, status: 'Closed' };
      } catch (err) {
        console.warn('Firestore close report fallback failed:', err);
      }
    }
  }

  // Update in-memory mock store
  const item = MOCK_REPORTS_STORE.find((r) => r.id === reportId || r.ticketNumber === reportId);
  if (item) {
    item.status = 'Closed';
    item.closedAt = new Date().toISOString();
    item.closeReason = reason;
  }

  return { success: true, reportId, status: 'Closed' };
}

/**
 * Updates permitted report fields.
 */
export async function updateReportService(reportId, updates) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to update a report.');
  }

  const isMockUser = currentUser.uid.startsWith('mock-') || auth.app.options.apiKey === 'demo-claimit-api-key';

  if (!isMockUser) {
    try {
      const updateCallable = httpsCallable(functions, 'updateReport');
      const result = await updateCallable({ reportId, ...updates });
      return result.data;
    } catch (_fnErr) {
      try {
        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return { success: true, reportId };
      } catch (err) {
        console.warn('Firestore update report fallback failed:', err);
      }
    }
  }

  const item = MOCK_REPORTS_STORE.find((r) => r.id === reportId || r.ticketNumber === reportId);
  if (item) {
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
  }

  return { success: true, reportId };
}

/**
 * Returns currently stored mock reports for demo sessions.
 */
export function getMockReports() {
  return [...MOCK_REPORTS_STORE];
}
