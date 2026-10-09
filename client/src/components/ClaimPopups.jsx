import React, { useState } from 'react';
import { X, Send, MapPin, Calendar, CheckCircle2, AlertOctagon, AlertTriangle, MessageSquare } from 'lucide-react';

/**
 * View Details Popup Modal
 * @param {Object} props
 * @param {any} props.claim
 * @param {() => void} props.onClose
 * @param {(claim: any) => void} [props.onOpenMessage]
 * @param {(claim: any) => void} [props.onWithdraw]
 */
export const ViewDetailsModal = ({
  claim,
  onClose,
  onOpenMessage,
  onWithdraw,
}) => {
  if (!claim) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {claim.id}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                claim.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : claim.status === 'In Review'
                  ? 'bg-blue-100 text-blue-800'
                  : claim.status === 'Pending'
                  ? 'bg-amber-100 text-amber-800'
                  : claim.status === 'Declined'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {claim.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Item Highlight */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {claim.imageUrl ? (
              <div className="w-16 h-16 rounded-lg bg-emerald-50 border border-emerald-100 flex-shrink-0 flex items-center justify-center p-1 overflow-hidden shadow-xs">
                <img
                  alt={claim.title}
                  className="w-full h-full object-contain"
                  src={claim.imageUrl}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-blue-50 border border-blue-100 flex-shrink-0 flex items-center justify-center p-1 text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                {claim.type} · {claim.category}
              </span>
              <h3 id="modal-title" className="text-lg font-bold text-slate-900 leading-snug">
                {claim.title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Submitted: {claim.submitted}
              </p>
            </div>
          </div>

          {/* Description */}
          {claim.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Item Description & Verification Notes
              </h4>
              <p className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                {claim.description}
              </p>
            </div>
          )}

          {/* Declined reason */}
          {claim.status === 'Declined' && claim.declinedReason && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800">Reason for Declining</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{claim.declinedReason}</p>
              </div>
            </div>
          )}

          {/* Handover location */}
          {claim.handoverLocation && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Handover & Pickup Point</span>
              </div>
              <p className="text-sm text-slate-800 font-medium pl-5.5">
                {claim.handoverLocation}
              </p>
              <p className="text-[11px] text-slate-500 pl-5.5">
                Please bring a valid student ID card or official photo identification during desk hours.
              </p>
            </div>
          )}

          {/* Progress Timeline */}
          {claim.timeline && claim.timeline.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Claim Progress Timeline
              </h4>
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {claim.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <span
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        step.completed
                          ? 'border-emerald-500 text-emerald-600'
                          : step.current
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {step.completed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </span>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          step.completed
                            ? 'text-slate-900'
                            : step.current
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.step}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            {claim.status === 'Pending' && (
              <button
                onClick={() => {
                  onClose();
                  onWithdraw?.(claim);
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Withdraw this claim
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {claim.status === 'Approved' && claim.contactPerson && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMessage?.(claim);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message {claim.contactPerson}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Message / Chat Popup Modal
 * @param {Object} props
 * @param {any} props.claim
 * @param {Array} props.messages
 * @param {string} props.contactName
 * @param {string} [props.contactRole]
 * @param {(claimId: string, text: string) => void} props.onSendMessage
 * @param {() => void} props.onClose
 */
export const MessageModal = ({
  claim,
  messages = [],
  contactName,
  contactRole = 'Campus Coordinator',
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');

  if (!claim) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(claim.id, inputText.trim());
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col h-[560px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-heading"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
              {(contactName || 'C').charAt(0)}
            </div>
            <div>
              <h3 id="chat-heading" className="text-sm font-bold text-slate-900 leading-tight">
                {contactName}
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {contactRole} · Regarding {claim.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item context banner */}
        <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
          <span className="font-medium text-blue-900 truncate max-w-[300px]">
            {claim.title}
          </span>
          <span className="font-mono text-[11px] text-blue-600 font-semibold">{claim.id}</span>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]/50">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No previous messages. Send a message to coordinate handover!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 font-medium px-1 mb-1">
                    {msg.senderName} · {msg.timestamp}
                  </span>
                  <div
                    className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Reply to ${contactName}...`}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * Withdraw Claim Popup Modal
 * @param {Object} props
 * @param {any} props.claim
 * @param {(claimId: string, reason: string) => void} props.onConfirm
 * @param {() => void} props.onClose
 */
export const WithdrawModal = ({
  claim,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('Found the item on my own');

  if (!claim) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 id="withdraw-title" className="text-base font-bold text-slate-900">
              Withdraw Claim {claim.id}?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to withdraw your claim for{' '}
              <span className="font-semibold text-slate-800">{claim.title}</span>? Once withdrawn, campus coordinators will no longer process your verification.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Reason for withdrawal:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Found the item on my own">I found the item on my own</option>
              <option value="Filed duplicate claim">Filed a duplicate claim by mistake</option>
              <option value="Description did not match">Item description didn't match mine</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Keep Claim
          </button>
          <button
            onClick={() => onConfirm(claim.id, reason)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition cursor-pointer"
          >
            Confirm Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};
