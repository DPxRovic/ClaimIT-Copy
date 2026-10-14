import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { auth, db, storage, functions } from './config.js';

// Seed initial mock store for offline/demo sessions
const SEED_REPORTS = [
  {
    id: 'airpods-pro-2',
    ticketNumber: 'R-1070',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: '2026-09-09',
    location: 'Congress Campus - Library',
    description: 'White apple AirPods Pro with scratches on the case.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC_O6MmcQqb46ZGcyzeTfXUwjVOrcA7pt-7KkZ4WHcZdRPV7BZmYaaYd6mtsib7Sc6PZVjQGxu46ep5UehnPK10IavovbjmraJxe04mEOIPuQmCE6uPsEjssyArCGewkghdRPgbVII2ykI6a_n-9lkrEE458d3HGJAYOwGIOtU_Stv4dDE5uLL3YiKWreMnUdg1N5-VsDRVQPLfWys_sSuTWOJE7hyn7CaBvbVjRoC1oS9ZdKzcIJSUQ',
    reporterUid: 'mock-student_campus_edu',
    reporterName: 'Hannah Puerta',
    reporterRole: 'Student',
    reporterProgramOrDept: 'BS Computer Science',
    claimsCount: 0,
    createdAt: new Date('2026-09-09T08:30:00Z').toISOString(),
    updatedAt: new Date('2026-09-09T08:30:00Z').toISOString(),
  },
  {
    id: 'black-leather-wallet',
    ticketNumber: 'R-1071',
    title: 'Black Leather Bifold Wallet',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: '2026-08-29',
    location: 'Bagong Silang Campus – Canteen',
    description: 'Black leather wallet. Please describe the items inside if you think this is yours.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCERDryOxxsewZHFZ_peWEfmLuoB7SbV9hy38LnUH474HsCCoEuZ9ZDjve1FiMPevRhRTK7ahcTnnv4IsidvjPNcYBUZZZo5dM8E7mdJow1mWJELVDrnJqf1ZT4Dv_xxlFWGYZlN18DOyhSS0JHxgONQcm4R2auBx8PCf5GiSthmZbISrgkx3SRnbv4S6mMRexNIX4pAINlXOODJRmeIiOOJB1TXfjZ8NCRe2Escodacliycd7CDSlLNQ',
    reporterUid: 'mock-paolo_dizon',
    reporterName: 'Paolo Dizon',
    reporterRole: 'Student',
    reporterProgramOrDept: 'BS Accountancy',
    claimsCount: 0,
    createdAt: new Date('2026-08-29T10:15:00Z').toISOString(),
    updatedAt: new Date('2026-08-29T10:15:00Z').toISOString(),
  },
  {
    id: 'hydro-flask-32oz',
    ticketNumber: 'R-1072',
    title: 'Hydro Flask 32oz Navy',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: '2025-10-24',
    location: 'Science Hall 104',
    description: 'Navy blue 32oz Hydro Flask with stainless steel loop cap. Minimal scuffs along bottom rim.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6tWbpguWrLQHmnQ5US7mPJsyaDaf1i1EtLNKM3N4SjSDL3GLeAwfJpAysAbXwT298AAVjM2m92xTZLqKMma1MaheYWENk6gglSc7ijOOAUY-CpIzLOk8NTedsZf2NX86uhT8oxy3k-Ar1RGkKAm53vMmMzRFNogKRF36lolbxkc8r4yKOkyHKeBvsvI0F73tb1EZTitfZPqBU57cGYthS87ANF3LRCHEsYKW2HZFk6zd_PQiX1-8g8w',
    reporterUid: 'mock-marcus_vance',
    reporterName: 'Marcus Vance',
    reporterRole: 'Student',
    reporterProgramOrDept: 'BS Biology',
    claimsCount: 0,
    createdAt: new Date('2025-10-24T14:20:00Z').toISOString(),
    updatedAt: new Date('2025-10-24T14:20:00Z').toISOString(),
  },
  {
    id: 'keys-campus-lanyard',
    ticketNumber: 'R-1073',
    title: 'Keys with Red Campus Lanyard',
    category: 'KEYS & ACCESSORIES',
    type: 'FOUND',
    status: 'Active',
    date: '2025-10-24',
    location: 'Rec Center Lockers',
    description: 'Ring with 3 brass door keys and campus red strap. Has a small metallic whistle attached.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2pQgqAU8FBvHs78Vmf5dmzkB1BAGM-MYGXLH2Hgt_DbzhwdKIzHbTr6f7BYypkR0gI56j_BNeU6LD74vor4EwrCWRhCGz3H9ZgQaJJ-2AciSYE1zJhQSGezfdvwEPfPfuJO8ps7hCtTp7aBVZRDF0hECAP1gV9m1ix5yg76FBcegCvp84ANyJmitk0vtyakOAnvCmaGJHGFZzq1CIANoTkyl-0NPjmOeoPEGzMXV0uZnXX9osJDFnNw',
    reporterUid: 'mock-coach_ramirez',
    reporterName: 'Coach Ramirez',
    reporterRole: 'Faculty',
    reporterProgramOrDept: 'Athletics Dept',
    claimsCount: 0,
    createdAt: new Date('2025-10-24T16:00:00Z').toISOString(),
    updatedAt: new Date('2025-10-24T16:00:00Z').toISOString(),
  },
  {
    id: 'calculus-textbook-9th',
    ticketNumber: 'R-1074',
    title: 'Calculus: Early Transcendentals 9th Ed',
    category: 'BOOKS & STUDY MATERIAL',
    type: 'LOST',
    status: 'Active',
    date: '2025-10-23',
    location: 'Math & Science Bldg',
    description: 'Hardcover Stewart Calculus 9th edition. Several sticky notes inside chapters 4 through 6.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-Q3IfZLJhrRk6SOdTvaKWt6ivPBXqkdK-2Ta6b2L0nuRL4JklkwR8Lu391niFdb2tAv4M7qemA5EiICfGNJ0bDgxqhpoYZ8QcLQNLsoiD862lol907_uXvKMQwz5o4FptAd01exC7K2j8wJj2ocJVYgvGDtQftNHARCy3MzR4fNQtnQbbeXNYet6UpxdBv_4i9bZ6jOwEPBL3rEo9cMZzawOwoUsJZCzqAxRHmDfAXaqN4gLux79_g',
    reporterUid: 'mock-chloe_chen',
    reporterName: 'Chloe Chen',
    reporterRole: 'Student',
    reporterProgramOrDept: 'BS Mathematics',
    claimsCount: 0,
    createdAt: new Date('2025-10-23T11:45:00Z').toISOString(),
    updatedAt: new Date('2025-10-23T11:45:00Z').toISOString(),
  },
  {
    id: 'sony-wh1000xm5',
    ticketNumber: 'R-1075',
    title: 'Sony WH-1000XM5 Headphones',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: '2025-10-23',
    location: 'Library 3rd Floor',
    description: 'Matte black Sony wireless noise cancelling headphones in matching zippered case with USB-C cable.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAULVMR8fNlyLIUxx6WBrHNN37i0AAoEgfKDzyZ4HzdND1KTUJQLMYemtvoTxX_D_AwQirC6i782wPmpEbP23267Tmy2QNS6eBkt6iu8algEnZ7DFuod_5fMMdWkBDMpkKiImiaKgmW0pJmr7WyHb9Rq_1aW0Q9bYrON4oqYm5j-U8Oq7XBGSEDV-GhjLBdIKE9NSmdaq2wUU5JuHWdKzYcZNP5qccx39s42-2tuw9i8nRHOchGui4bA',
    reporterUid: 'mock-david_kim',
    reporterName: 'David Kim',
    reporterRole: 'Student',
    reporterProgramOrDept: 'BS Mechanical Engineering',
    claimsCount: 0,
    createdAt: new Date('2025-10-23T15:10:00Z').toISOString(),
    updatedAt: new Date('2025-10-23T15:10:00Z').toISOString(),
  },
  {
    id: 'north-face-jacket',
    ticketNumber: 'R-1076',
    title: 'North Face Resolve Rain Jacket',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Active',
    date: '2025-10-21',
    location: 'Student Union Info Desk',
    description: 'Black waterproof North Face hooded jacket, medium size, left on dining booth seat.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRW-pbjHLqbjbsOXuj2JlZ34t2e5cnXaNiUSjMOV7BWQQ2i7zX3WNyd_LpVsstX0_UDd0nRzbSX1nXEPqSW4LeiV0TDpCKDaLdSUhdPdP6bmCG2MoVCuEulSSVPhjllFvMiK6s97F9lGz4nkZHvd8GdLuttc_e8IW1bataFbBGA-8VchgG9jnmRZiXsjzo9tMnjF3WKEbR1odgkWhhIIWpKb7CdsTvu2rTGWHNFtgfQJtcH3xNv_EvwA',
    reporterUid: 'mock-samantha_lee',
    reporterName: 'Samantha Lee',
    reporterRole: 'Student',
    reporterProgramOrDept: 'BA Communications',
    claimsCount: 0,
    createdAt: new Date('2025-10-21T09:00:00Z').toISOString(),
    updatedAt: new Date('2025-10-21T09:00:00Z').toISOString(),
  },
  {
    id: 'hp-laptop-charger',
    ticketNumber: 'R-1077',
    title: 'HP 65W USB-C Laptop Charger',
    category: 'ELECTRONICS',
    type: 'FOUND',
    status: 'Active',
    date: '2025-10-20',
    location: 'Engineering Hall 204',
    description: 'Black HP 65W USB-C power block charger left plugged in near lecture lectern.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeousHM6qo8qNrC8f44Uo50n7WOJKJsBqKrMGzOJ_n4abz4dUg5knGGDNKCgM7FiT38jekNjbYF62J1XfOmRCw1FkJbHnFu7-J5P6pIJndaXR_GoFpAODhfWAVVUCwqBN0oReOS9hrQ7g3Zsq2Hv4qRbIzJCIu7EkliaKGSy_loIq1acZppOEr8F3qXQrxnshh32Zk2aKrtUoOlkISpm3WfqzoxX0sx7gJ-QMJmohAiwGs6Fcs4Yj9Fg',
    reporterUid: 'mock-prof_santos',
    reporterName: 'Prof. Santos',
    reporterRole: 'Faculty',
    reporterProgramOrDept: 'College of Engineering',
    claimsCount: 0,
    createdAt: new Date('2025-10-20T17:30:00Z').toISOString(),
    updatedAt: new Date('2025-10-20T17:30:00Z').toISOString(),
  },
];

// In-memory reports store for mock/demo sessions
const MOCK_REPORTS_STORE = [...SEED_REPORTS];

/**
 * Normalizes Firestore document snapshot or mock object to standard client Report shape.
 */
export function formatReportRecord(docSnapOrData, idOverride = null) {
  if (!docSnapOrData) return null;

  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData;
  const id = idOverride || docSnapOrData.id || data.id || data.reportId || `R-${Date.now()}`;
  const ticketNumber = data.ticketNumber || data.ticket || id;

  const rawType = (data.type || data.reportType || 'LOST').toString().toUpperCase();
  const normalizedType = rawType === 'FOUND' ? 'FOUND' : 'LOST';

  const reporterName = data.reporterName || 'Campus Member';
  const reporterProgramOrDept = data.reporterProgramOrDept || data.program || '';
  const postedBy = reporterProgramOrDept ? `${reporterName} (${reporterProgramOrDept})` : reporterName;

  // Format date display
  const rawDate = data.date || data.dateFiled || '';
  let formattedDate = rawDate;
  if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    try {
      const [year, month, day] = rawDate.split('-');
      const dateObj = new Date(year, month - 1, day);
      formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      formattedDate = rawDate;
    }
  }

  // Format time ago / relative time
  let reportedTime = 'Recently reported';
  if (data.createdAt) {
    try {
      const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const diffMs = Date.now() - createdDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        reportedTime = 'Reported today';
      } else if (diffDays === 1) {
        reportedTime = 'Reported 1 day ago';
      } else if (diffDays < 7) {
        reportedTime = `Reported ${diffDays} days ago`;
      } else {
        reportedTime = `Reported ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      }
    } catch {
      reportedTime = 'Recently reported';
    }
  }

  return {
    id,
    reportId: id,
    ticket: ticketNumber,
    ticketNumber,
    title: data.title || data.itemName || 'Untitled Item',
    itemName: data.title || data.itemName || 'Untitled Item',
    category: data.category || 'OTHER',
    type: normalizedType,
    status: data.status || 'Active',
    date: formattedDate,
    rawDate,
    dateFiled: formattedDate,
    location: data.location || 'Campus Landmark',
    description: data.description || '',
    imageUrl: data.imageUrl || null,
    imageStoragePath: data.imageStoragePath || null,
    imageAlt: `${data.title || 'Item'} photograph`,
    reporterUid: data.reporterUid || '',
    reporterName,
    reporterRole: data.reporterRole || 'Student',
    reporterProgramOrDept,
    postedBy,
    reportedTime,
    claimsCount: typeof data.claimsCount === 'number' ? data.claimsCount : 0,
    claims: (data.claimsCount || 0) > 0 ? `${data.claimsCount} claim${data.claimsCount === 1 ? '' : 's'}` : '—',
    entries: data.entries || [],
    entriesType: data.entriesType || (normalizedType === 'LOST' ? 'matches' : 'claims'),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    closedAt: data.closedAt || null,
    closeReason: data.closeReason || null,
  };
}

/**
 * Checks whether active session is a mock demo session.
 */
function isMockSession() {
  const currentUser = auth.currentUser;
  return (
    currentUser?.uid?.startsWith('mock-') ||
    auth.app.options.apiKey === 'demo-claimit-api-key'
  );
}

/**
 * Uploads an item photograph to Firebase Storage with size and MIME validation.
 */
export async function uploadReportImage(file, reportTempId = 'temp') {
  if (!file) return { imageUrl: null, imageStoragePath: null };

  const currentUser = auth.currentUser;

  // Fallback to local DataURL/blob URL for mock session
  if (isMockSession()) {
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
    const objectUrl = URL.createObjectURL(file);
    return {
      imageUrl: objectUrl,
      imageStoragePath: storagePath,
    };
  }
}

/**
 * Creates a new Lost or Found item report.
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

  if (!isMockSession()) {
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
      }
    }
  }

  // 3. In-memory fallback for offline/demo sessions
  const reportId = `R-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticketNumber = reportId;

  const mockReport = formatReportRecord({
    id: reportId,
    ticketNumber,
    title: rawTitle,
    category,
    type: reportType,
    status: 'Active',
    date,
    location,
    description,
    imageUrl: imageUrl || reportData.imagePreview || null,
    imageStoragePath,
    reporterUid: currentUser.uid,
    reporterName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Campus Member',
    reporterRole: currentUser.email?.includes('faculty') ? 'Faculty' : 'Student',
    reporterProgramOrDept: 'Campus Member',
    claimsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

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

  if (!isMockSession()) {
    try {
      const closeCallable = httpsCallable(functions, 'closeReport');
      const result = await closeCallable({ reportId, reason });
      return result.data;
    } catch (_fnErr) {
      // Direct Firestore update fallback governed by firestore.rules
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

  if (!isMockSession()) {
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
 * Fetches reports for the public Campus Directory (Browse Items).
 * Supports category filter, type filter (LOST/FOUND), sorting, and cursor pagination.
 */
export async function fetchBrowseReports({
  category = 'ALL',
  type = 'ALL',
  sortBy = 'NEWEST',
  pageSize = 8,
  lastDoc = null,
} = {}) {
  // If in demo session without backend, query from in-memory store
  if (isMockSession()) {
    let results = MOCK_REPORTS_STORE.filter((r) => r.status === 'Active');

    if (type !== 'ALL') {
      results = results.filter((r) => r.type === type);
    }
    if (category !== 'ALL') {
      results = results.filter((r) => r.category.toUpperCase() === category.toUpperCase());
    }

    if (sortBy === 'NEWEST') {
      results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'OLDEST') {
      results.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'TITLE_ASC') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    }

    const totalCount = results.length;
    // Paginate slice
    const startIndex = lastDoc && typeof lastDoc === 'number' ? lastDoc : 0;
    const paginatedItems = results.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems.map((r) => formatReportRecord(r)),
      totalCount,
      hasMore: startIndex + pageSize < totalCount,
      nextCursor: startIndex + pageSize < totalCount ? startIndex + pageSize : null,
    };
  }

  // Real Firestore Query
  try {
    const reportsCol = collection(db, 'reports');
    const constraints = [where('status', '==', 'Active')];

    if (type !== 'ALL') {
      constraints.push(where('type', '==', type));
    }

    if (category !== 'ALL') {
      constraints.push(where('category', '==', category));
    }

    if (sortBy === 'NEWEST') {
      constraints.push(orderBy('createdAt', 'desc'));
    } else if (sortBy === 'OLDEST') {
      constraints.push(orderBy('createdAt', 'asc'));
    } else if (sortBy === 'TITLE_ASC') {
      constraints.push(orderBy('title', 'asc'));
    }

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(pageSize));

    const q = query(reportsCol, ...constraints);
    const querySnapshot = await getDocs(q);

    const items = querySnapshot.docs.map((docSnap) => formatReportRecord(docSnap));
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return {
      items,
      totalCount: items.length, // Firestore count or page length
      hasMore: querySnapshot.docs.length === pageSize,
      nextCursor: newLastDoc,
    };
  } catch (err) {
    console.error('[Firestore] fetchBrowseReports failed:', err);
    throw new Error(err.message || 'Failed to retrieve campus listings from database.');
  }
}

/**
 * Subscribes to or fetches reports filed by a specific user (My Reports).
 */
export async function fetchUserReports(uid, statusFilter = 'All statuses') {
  if (!uid) return [];

  if (isMockSession()) {
    let list = MOCK_REPORTS_STORE.filter((r) => r.reporterUid === uid);
    if (statusFilter !== 'All statuses') {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list.map((r) => formatReportRecord(r));
  }

  try {
    const reportsCol = collection(db, 'reports');
    const constraints = [where('reporterUid', '==', uid)];

    if (statusFilter && statusFilter !== 'All statuses') {
      constraints.push(where('status', '==', statusFilter));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(reportsCol, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => formatReportRecord(d));
  } catch (err) {
    console.error('[Firestore] fetchUserReports failed:', err);
    throw new Error(err.message || 'Failed to retrieve your filed reports.');
  }
}

/**
 * Subscribes to real-time changes in the current user's filed reports.
 */
export function subscribeUserReports(uid, onUpdate, onError, statusFilter = 'All statuses') {
  if (!uid) return () => {};

  if (isMockSession()) {
    let list = MOCK_REPORTS_STORE.filter((r) => r.reporterUid === uid);
    if (statusFilter !== 'All statuses') {
      list = list.filter((r) => r.status === statusFilter);
    }
    onUpdate(list.map((r) => formatReportRecord(r)));
    return () => {};
  }

  try {
    const reportsCol = collection(db, 'reports');
    const constraints = [where('reporterUid', '==', uid)];

    if (statusFilter && statusFilter !== 'All statuses') {
      constraints.push(where('status', '==', statusFilter));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    const q = query(reportsCol, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => formatReportRecord(docSnap));
        onUpdate(items);
      },
      (err) => {
        console.warn('[Firestore] subscribeUserReports listener error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] onSnapshot error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Fetches a single report record by document ID.
 */
export async function fetchReportById(reportId) {
  if (!reportId) return null;

  if (isMockSession()) {
    const found = MOCK_REPORTS_STORE.find((r) => r.id === reportId || r.ticketNumber === reportId);
    return found ? formatReportRecord(found) : null;
  }

  try {
    const docRef = doc(db, 'reports', reportId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return formatReportRecord(docSnap);
  } catch (err) {
    console.error('[Firestore] fetchReportById error:', err);
    throw new Error(err.message || `Unable to load report details for #${reportId}.`);
  }
}

/**
 * Fetches recently reported active items for the home page feed.
 */
export async function fetchRecentlyReported(count = 4) {
  if (isMockSession()) {
    const active = MOCK_REPORTS_STORE.filter((r) => r.status === 'Active');
    active.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return active.slice(0, count).map((r) => formatReportRecord(r));
  }

  try {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => formatReportRecord(d));
  } catch (err) {
    console.warn('[Firestore] fetchRecentlyReported error:', err);
    return [];
  }
}

/**
 * Fetches recently resolved items for the home page feed.
 */
export async function fetchRecentlyResolved(count = 4) {
  if (isMockSession()) {
    const resolved = MOCK_REPORTS_STORE.filter((r) => r.status === 'Resolved');
    return resolved.slice(0, count).map((r) => formatReportRecord(r));
  }

  try {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'Resolved'),
      orderBy('updatedAt', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => formatReportRecord(d));
  } catch (err) {
    console.warn('[Firestore] fetchRecentlyResolved error:', err);
    return [];
  }
}

/**
 * Returns currently stored mock reports for demo sessions.
 */
export function getMockReports() {
  return [...MOCK_REPORTS_STORE];
}
