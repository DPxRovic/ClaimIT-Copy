import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
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

// In-memory messages cache for demo sessions
const MOCK_MESSAGES_STORE = new Map();
const MOCK_MESSAGE_LISTENERS = new Map();

function notifyMockMessageListeners(conversationKey) {
  const list = MOCK_MESSAGES_STORE.get(conversationKey) || [];
  const listeners = MOCK_MESSAGE_LISTENERS.get(conversationKey);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb([...list]);
      } catch (err) {
        console.warn('Error in mock message listener:', err);
      }
    });
  }
}

export function formatMessageRecord(docSnapOrData) {
  if (!docSnapOrData) return null;
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData;
  const id = docSnapOrData.id || data.id || `msg-${Date.now()}`;

  let timeStr = 'Just now';
  if (data.timestamp) {
    let dateObj;
    if (typeof data.timestamp.toDate === 'function') {
      dateObj = data.timestamp.toDate();
    } else if (typeof data.timestamp === 'string') {
      dateObj = new Date(data.timestamp);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  return {
    id,
    senderUid: data.senderUid || '',
    senderName: data.senderName || 'Anonymous',
    senderRole: data.senderRole || '',
    text: data.text || '',
    timestamp: timeStr,
    rawTimestamp: data.timestamp || null,
  };
}

export function subscribeClaimMessages(reportId, claimId, onUpdate, onError) {
  if (!reportId || !claimId) return () => {};

  const conversationKey = `${reportId}_${claimId}`;

  if (isMockSession()) {
    if (!MOCK_MESSAGE_LISTENERS.has(conversationKey)) {
      MOCK_MESSAGE_LISTENERS.set(conversationKey, new Set());
    }
    MOCK_MESSAGE_LISTENERS.get(conversationKey).add(onUpdate);

    const list = MOCK_MESSAGES_STORE.get(conversationKey) || [];
    onUpdate([...list]);

    return () => {
      const listeners = MOCK_MESSAGE_LISTENERS.get(conversationKey);
      if (listeners) {
        listeners.delete(onUpdate);
      }
    };
  }

  try {
    const messagesCol = collection(db, 'reports', reportId, 'claims', claimId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => formatMessageRecord(d));
        onUpdate(msgs);
      },
      (err) => {
        console.warn(`[Messaging] Subscription error for ${reportId}/${claimId}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Messaging] onSnapshot error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function sendClaimMessage({
  reportId,
  claimId,
  text,
  senderUid,
  senderName,
  senderRole = 'Student',
}) {
  if (!reportId || !claimId) throw new Error('Report ID and Claim ID are required.');
  const cleanText = (text || '').trim();
  if (!cleanText) throw new Error('Message text cannot be empty.');
  if (cleanText.length > 1000) throw new Error('Message cannot exceed 1000 characters.');

  const effectiveSenderUid = senderUid || auth.currentUser?.uid || 'user';
  const effectiveSenderName = senderName || auth.currentUser?.displayName || 'Campus User';

  const conversationKey = `${reportId}_${claimId}`;

  if (isMockSession()) {
    const list = MOCK_MESSAGES_STORE.get(conversationKey) || [];
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderUid: effectiveSenderUid,
      senderName: effectiveSenderName,
      senderRole,
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    list.push(newMsg);
    MOCK_MESSAGES_STORE.set(conversationKey, list);
    notifyMockMessageListeners(conversationKey);
    return newMsg;
  }

  const messagesCol = collection(db, 'reports', reportId, 'claims', claimId, 'messages');
  const msgDocRef = doc(messagesCol);

  const messageData = {
    senderUid: effectiveSenderUid,
    senderName: effectiveSenderName,
    senderRole: senderRole || '',
    text: cleanText,
    timestamp: serverTimestamp(),
  };

  await setDoc(msgDocRef, messageData);
  return { id: msgDocRef.id, ...messageData };
}
