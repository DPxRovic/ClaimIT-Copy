import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config.js';

function isMockSession() {
  const currentUser = auth.currentUser;
  return (
    currentUser?.uid?.startsWith('mock-') ||
    auth.app.options.apiKey === 'demo-claimit-api-key'
  );
}

export function formatNotificationRecord(docSnapOrData) {
  if (!docSnapOrData) return null;
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData;
  const id = docSnapOrData.id || data.id || `notif-${Date.now()}`;

  let timeAgo = 'Just now';
  if (data.createdAt) {
    let dateObj;
    if (typeof data.createdAt.toDate === 'function') {
      dateObj = data.createdAt.toDate();
    } else if (typeof data.createdAt === 'string') {
      dateObj = new Date(data.createdAt);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const diffMs = Date.now() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
      else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
      else if (diffDays === 1) timeAgo = 'Yesterday';
      else timeAgo = `${diffDays}d ago`;
    }
  }

  return {
    id,
    recipientUid: data.recipientUid || '',
    title: data.title || 'Notification',
    description: data.description || '',
    ticketId: data.ticketId || '',
    reportId: data.reportId || '',
    claimId: data.claimId || '',
    unread: Boolean(data.unread),
    createdAt: data.createdAt || null,
    time: timeAgo,
    dateGroup: 'Recent',
  };
}

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipientUid: 'current',
    title: 'Claim Approved',
    description: 'Your claim for "Gray zip-up hoodie" (#CLM-8492) was approved by the coordinator.',
    ticketId: '#CLM-8492',
    status: 'Approved',
    unread: true,
    time: '10m ago',
    dateGroup: 'Today',
  },
  {
    id: 'notif-2',
    recipientUid: 'current',
    title: 'Match Alert',
    description: 'A newly found item matches your lost report "Silver Charm Bracelet" (#R-1072).',
    ticketId: 'R-1072',
    status: 'In Review',
    type: 'match_alert',
    unread: true,
    time: '1h ago',
    dateGroup: 'Today',
  },
  {
    id: 'notif-3',
    recipientUid: 'current',
    title: 'New Message',
    description: 'Paolo Dizon sent a message regarding claim #CLM-8492.',
    ticketId: '#CLM-8492',
    type: 'message',
    unread: false,
    time: 'Yesterday',
    dateGroup: 'Earlier',
  },
];

const MOCK_NOTIFICATIONS_STORE = new Map(
  DEFAULT_NOTIFICATIONS.map((n) => [n.id, { ...n }])
);
const MOCK_NOTIF_LISTENERS = new Set();

function notifyMockListeners() {
  const list = Array.from(MOCK_NOTIFICATIONS_STORE.values());
  MOCK_NOTIF_LISTENERS.forEach((cb) => {
    try {
      cb(list);
    } catch (err) {
      console.warn('Error in mock notification listener:', err);
    }
  });
}

export function subscribeUserNotifications(uid, onUpdate, onError) {
  if (!uid) return () => {};

  if (isMockSession()) {
    MOCK_NOTIF_LISTENERS.add(onUpdate);
    onUpdate(Array.from(MOCK_NOTIFICATIONS_STORE.values()));
    return () => {
      MOCK_NOTIF_LISTENERS.delete(onUpdate);
    };
  }

  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => formatNotificationRecord(d));
        if (notifs.length === 0) {
          // If no notifications in Firestore yet, provide sample notifications
          onUpdate(DEFAULT_NOTIFICATIONS);
        } else {
          onUpdate(notifs);
        }
      },
      (err) => {
        console.warn('[Notifications] Firestore subscription error, using fallbacks:', err);
        onUpdate(DEFAULT_NOTIFICATIONS);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Notifications] onSnapshot error:', err);
    onUpdate(DEFAULT_NOTIFICATIONS);
    if (onError) onError(err);
    return () => {};
  }
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;

  if (isMockSession() || notificationId.startsWith('notif-')) {
    const item = MOCK_NOTIFICATIONS_STORE.get(notificationId);
    if (item) {
      item.unread = false;
      MOCK_NOTIFICATIONS_STORE.set(notificationId, item);
      notifyMockListeners();
    }
    return;
  }

  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      unread: false,
    });
  } catch (err) {
    console.warn('[Notifications] markNotificationAsRead error:', err);
  }
}

export async function markAllNotificationsAsRead(notifications = []) {
  if (!notifications.length) return;

  if (isMockSession() || notifications.some((n) => n.id?.startsWith('notif-'))) {
    MOCK_NOTIFICATIONS_STORE.forEach((item, id) => {
      item.unread = false;
      MOCK_NOTIFICATIONS_STORE.set(id, item);
    });
    notifyMockListeners();
    return;
  }

  const unreadItems = notifications.filter((n) => n.unread);
  await Promise.all(
    unreadItems.map((n) => {
      const notifRef = doc(db, 'notifications', n.id);
      return updateDoc(notifRef, { unread: false }).catch((err) =>
        console.warn(`[Notifications] Failed to mark ${n.id} as read:`, err)
      );
    })
  );
}

