import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './config.js';

function isMockSession() {
  const currentUser = auth.currentUser;
  return (
    currentUser?.uid?.startsWith('mock-') ||
    auth.app.options.apiKey === 'demo-claimit-api-key'
  );
}

// -----------------------------------------------------------------------------
// Activity Logs
// -----------------------------------------------------------------------------

export function formatActivityLogRecord(docSnapOrData) {
  if (!docSnapOrData) return null;
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData;
  const id = docSnapOrData.id || data.id || `log-${Date.now()}`;

  let timestampStr = 'Recently';
  if (data.timestamp) {
    if (typeof data.timestamp.toDate === 'function') {
      const d = data.timestamp.toDate();
      timestampStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' · ' + d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (typeof data.timestamp === 'string') {
      const d = new Date(data.timestamp);
      if (!isNaN(d.getTime())) {
        timestampStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ' · ' + d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
      } else {
        timestampStr = data.timestamp;
      }
    }
  }

  const role = data.actorRole ? (data.actorRole.startsWith('(') ? data.actorRole : `(${data.actorRole})`) : '';

  return {
    id,
    actorUid: data.actorUid || '',
    actorName: data.actorName || 'System',
    actorRole: role,
    action: data.action || 'System action recorded',
    targetEntity: data.targetEntity || '',
    metadata: data.metadata || {},
    timestamp: timestampStr,
    rawTimestamp: data.timestamp || null,
  };
}

export function subscribeActivityLogs({ limitCount = 50, onUpdate, onError }) {
  if (isMockSession()) {
    onUpdate([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((d) => formatActivityLogRecord(d));
        onUpdate(logs);
      },
      (err) => {
        console.warn('[ActivityLogs] Firestore subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[ActivityLogs] onSnapshot setup error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

// -----------------------------------------------------------------------------
// User Management
// -----------------------------------------------------------------------------

export function formatUserRecord(docSnapOrData) {
  if (!docSnapOrData) return null;
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData;
  const id = docSnapOrData.id || data.uid || data.id || `u-${Date.now()}`;

  const roleNormalized = (data.role || 'student').toLowerCase();
  const displayRole =
    roleNormalized === 'admin' ? 'Admin' : roleNormalized === 'faculty' ? 'Faculty' : 'Student';

  let joinedStr = 'Recently';
  if (data.createdAt) {
    if (typeof data.createdAt.toDate === 'function') {
      joinedStr = data.createdAt.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (typeof data.createdAt === 'string') {
      const d = new Date(data.createdAt);
      if (!isNaN(d.getTime())) {
        joinedStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
  }

  return {
    id,
    uid: id,
    name: data.fullName || (data.email ? data.email.split('@')[0] : 'Campus User'),
    email: data.email || '',
    role: displayRole,
    rawRole: roleNormalized,
    status: data.status || 'Active',
    program: data.program || data.department || 'General',
    section: data.section || data.position || '',
    schoolId: data.studentId || data.facultyId || '',
    avatarUrl: data.avatarUrl || null,
    joined: joinedStr,
    approvedAt: data.approvedAt || null,
    statusReason: data.statusReason || null,
  };
}

export function subscribeUsers({ onUpdate, onError }) {
  if (isMockSession()) {
    onUpdate([]);
    return () => {};
  }

  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((d) => formatUserRecord(d));
        onUpdate(users);
      },
      (err) => {
        console.warn('[Users] Firestore subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Users] onSnapshot setup error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function manageAccountStatusService({ targetUid, action, reason = '' }) {
  if (!targetUid) throw new Error('Target User ID is required.');
  if (!action) throw new Error('Management action is required.');

  if (isMockSession()) {
    console.info(`[Demo Mode] Simulated manageAccountStatus: ${action} on ${targetUid}`);
    return {
      success: true,
      targetUid,
      action,
      newStatus: action === 'suspend_user' ? 'Suspended' : action === 'decline_faculty' ? 'Declined' : 'Active',
    };
  }

  const manageCallable = httpsCallable(functions, 'manageAccountStatus');
  const response = await manageCallable({
    targetUid,
    action,
    reason,
  });

  return response.data;
}

// -----------------------------------------------------------------------------
// Taxonomies
// -----------------------------------------------------------------------------

export function subscribeTaxonomies(taxonomyType, onUpdate, onError) {
  if (!taxonomyType) return () => {};

  if (isMockSession()) {
    onUpdate([]);
    return () => {};
  }

  try {
    const colRef = collection(db, 'taxonomies', taxonomyType, 'items');
    const q = query(colRef, orderBy('name', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        onUpdate(items);
      },
      (err) => {
        console.warn(`[Taxonomy] subscribeTaxonomies error for ${taxonomyType}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn(`[Taxonomy] onSnapshot error for ${taxonomyType}:`, err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function addTaxonomyItem(taxonomyType, { name, status = 'active' }) {
  const cleanName = (name || '').trim();
  if (!cleanName) throw new Error('Item name is required.');

  if (isMockSession()) {
    return { id: `mock-${Date.now()}`, name: cleanName, status };
  }

  const colRef = collection(db, 'taxonomies', taxonomyType, 'items');
  const docRef = doc(colRef);
  const data = {
    name: cleanName,
    status: status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, data);
  return { id: docRef.id, ...data };
}

export async function updateTaxonomyItem(taxonomyType, itemId, { name, status }) {
  if (!itemId) throw new Error('Item ID is required.');
  const updates = { updatedAt: serverTimestamp() };
  if (name !== undefined) updates.name = name.trim();
  if (status !== undefined) updates.status = status;

  if (isMockSession()) {
    return { id: itemId, ...updates };
  }

  const docRef = doc(db, 'taxonomies', taxonomyType, 'items', itemId);
  await updateDoc(docRef, updates);
  return { id: itemId, ...updates };
}

export async function deleteTaxonomyItem(taxonomyType, itemId) {
  if (!itemId) throw new Error('Item ID is required.');

  if (isMockSession()) {
    return { success: true, id: itemId };
  }

  const docRef = doc(db, 'taxonomies', taxonomyType, 'items', itemId);
  await deleteDoc(docRef);
  return { success: true, id: itemId };
}
