import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Tag,
  ImageOff,
  Lock,
  Send,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import ConversationMessage from './ConversationMessage.jsx';
import { subscribeClaimMessages, sendClaimMessage } from '../firebase/messaging.js';

/**
 * ClaimMatchVerificationModal Component
 *
 * Reusable modal for verifying item claims and matches.
 * Uses lucide-react vector icons so icons never render as raw text.
 * Matches Stitch AI ClaimIt design system with cohesive color scheme (#E8E4D8, #284bdc, #23261F).
 */
export default function ClaimMatchVerificationModal({
  isOpen = true,
  onClose,
  onBack,
  verification,
  onApprove,
  onDecline,
  onSendMessage,
  onInspectDetails,
  currentUser = { name: 'You' },
  className = '',
}) {
  const [replyText, setReplyText] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const reportId = verification?.reportId || verification?.reportTicket;
  const claimId = verification?.claimId || verification?.id;

  // Real-time Firestore subscription to conversation thread
  useEffect(() => {
    if (!isOpen || !verification) return;
    if (!reportId || !claimId) return;

    const unsubscribe = subscribeClaimMessages(
      reportId,
      claimId,
      (msgs) => {
        if (msgs && msgs.length > 0) {
          setLocalMessages(msgs);
        }
      },
      (err) => {
        console.warn('ClaimMatchVerificationModal subscription warning:', err);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isOpen, verification, reportId, claimId]);

  // Sync incoming verification messages with local state if no live messages yet
  useEffect(() => {
    if (verification?.messages && verification.messages.length > 0) {
      setLocalMessages((prev) => (prev.length > 0 ? prev : verification.messages));
    }
  }, [verification?.messages]);


  // Scroll to bottom of conversation on message update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !verification) {
    return null;
  }

  const isMatch =
    verification.type === 'match' ||
    verification.isMatch === true ||
    (verification.title && verification.title.toLowerCase().includes('match'));

  const modalTitle = isMatch ? 'Item Match Verification' : 'Item Claim Verification';
  const approveButtonText = isMatch ? 'Approve Match' : 'Approve Claim';

  const status = verification.status || 'Pending';
  const isClosed =
    Boolean(verification.isClosed) ||
    status === 'Approved' ||
    status === 'Declined' ||
    status === 'Resolved' ||
    status === 'Closed';

  const submitterFirstName = verification.submitterName
    ? verification.submitterName.split(' ')[0]
    : 'User';

  const renderStatusBadge = () => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Pending
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        );
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setReplyText('');

    if (reportId && claimId) {
      try {
        await sendClaimMessage({
          reportId,
          claimId,
          text: trimmed,
          senderUid: currentUser?.uid,
          senderName: currentUser?.name || 'You',
          senderRole: currentUser?.role || 'Reporter',
        });
      } catch (err) {
        console.warn('Failed to send persistent message:', err);
      }
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderName: currentUser.name || 'You',
      timestamp: 'Just now',
      text: trimmed,
      isCurrentUser: true,
    };

    setLocalMessages((prev) => [...prev, newMsg]);

    if (onSendMessage) {
      onSendMessage(trimmed);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-dialog-title"
    >
      {/* Modal Card matching ClaimIt & ReportDetailsModal specifications */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[540px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 animate-in zoom-in-95 border border-[#E8E4D8] font-sans ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#E8E4D8] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2
              id="verification-dialog-title"
              className="text-[17px] font-bold text-[#0F172A] tracking-tight"
            >
              {modalTitle}
            </h2>
            {verification.id && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#284bdc] border border-[#dbe6fd] font-mono">
                {verification.id}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* 1. Item Summary Blue Bar */}
          <div className="bg-[#eff4ff] border border-[#dbe6fd] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-[#0b1c30]">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Tag className="w-4 h-4 text-[#284bdc] shrink-0" />
              <span className="font-semibold truncate">
                Item: {verification.itemTitle || 'Unspecified Item'}
              </span>
            </div>
            {verification.reportTicket && (
              <span className="text-[#444655] font-medium shrink-0">
                • Report {verification.reportTicket.replace(/^Report\s*/i, '')}
              </span>
            )}
          </div>

          {/* 2. Submitter Info & Status Row */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              <span className="font-bold text-sm text-[#23261F] truncate">
                {verification.submitterName || 'Claimant'}'s {isMatch ? 'match' : 'claim'}
              </span>
              {verification.submittedDate && (
                <span className="text-xs text-[#6E6858]">
                  Submitted {verification.submittedDate}
                </span>
              )}
            </div>

            <div className="shrink-0">{renderStatusBadge()}</div>
          </div>

          {/* 3. Evidence / Submission Preview Card */}
          <div className="rounded-xl border border-[#E8E4D8] bg-[#FAF9F5]/50 p-3 flex items-center gap-3.5">
            {/* Thumbnail or No Photo Attached box */}
            {verification.imageUrl ? (
              <div className="w-28 h-20 rounded-lg overflow-hidden border border-[#E8E4D8] shrink-0 bg-[#e5eeff]">
                <img
                  src={verification.imageUrl}
                  alt={verification.itemTitle || 'Evidence photograph'}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-28 h-20 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-2 shrink-0">
                <ImageOff className="w-5 h-5 text-[#94A3B8]" />
                <span className="text-[10px] font-medium mt-1 leading-tight text-[#6E6858]">
                  No photo attached
                </span>
              </div>
            )}

            {/* Quote message and inspect details button */}
            <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
              <div className="relative pl-3.5 border-l-2 border-[#CBD5E1]">
                <p className="text-xs text-[#23261F] line-clamp-3 leading-relaxed italic">
                  "{verification.messagePreview ||
                    verification.description ||
                    'No additional description provided with this submission.'}"
                </p>
              </div>

              <div className="pt-2 pl-3.5">
                <button
                  type="button"
                  onClick={() => onInspectDetails?.(verification)}
                  className="text-[#284bdc] text-xs font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Inspect details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Conversation Log Section */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Conversation Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-[#6E6858] uppercase tracking-wider">
                CONVERSATION LOG
              </span>
              <span className="text-xs text-[#6E6858] font-medium">
                {isClosed ? 'Closed Thread' : 'Active Thread'}
              </span>
            </div>

            {/* Scrollable Messages Thread */}
            <div className="rounded-xl border border-[#E8E4D8] bg-[#F8FAFC]/50 p-3.5 max-h-56 overflow-y-auto space-y-3">
              {localMessages.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#6E6858]">
                  No messages yet. Start the conversation below.
                </div>
              ) : (
                localMessages.map((msg) => (
                  <ConversationMessage key={msg.id} message={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Closed Notice or Reply Input Form */}
            {isClosed ? (
              <div className="rounded-xl p-3 bg-[#eff4ff] border border-[#dbe6fd] text-xs text-[#284bdc] font-medium flex items-center justify-center gap-2 mt-1">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  This {isMatch ? 'match' : 'claim'} is {status.toLowerCase()} — messaging is closed.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="mt-1">
                <div className="flex items-center gap-2 border border-[#CBD5E1] rounded-xl px-3 py-1.5 bg-white focus-within:border-[#284bdc] focus-within:ring-2 focus-within:ring-[#284bdc]/15 transition-all">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Write a reply to ${submitterFirstName}...`}
                    className="flex-1 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#284bdc] hover:bg-[#1f3bb0] disabled:bg-[#CBD5E1] disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
                  >
                    <span>Reply</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E8E4D8] flex items-center justify-between shrink-0">
          {/* Back button on left */}
          <button
            type="button"
            onClick={onBack || onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-[#23261F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Action buttons on right (Approve / Decline) if active */}
          {!isClosed && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onDecline?.(verification)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-200 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline</span>
              </button>

              <button
                type="button"
                onClick={() => onApprove?.(verification)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{approveButtonText}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ClaimMatchVerificationModal };
