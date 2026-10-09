import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';

/**
 * ModalMessage Component
 *
 * Implements Image 2 UI design:
 * - Blue theme for boxes (both incoming & outgoing)
 * - Removed "finder of the.." text in header
 * - Avatar with initials and green online status dot
 * - Campus safety notice
 * - Bottom input with paperclip and send button
 *
 * Props:
 * - isOpen: boolean
 * - claim: Claim object
 * - messages: Array of chat messages
 * - onSendMessage: (claimId: string, text: string) => void
 * - onClose: () => void
 */
export const ModalMessage = ({
  isOpen = true,
  claim,
  messages = [],
  onSendMessage,
  onClose,
}) => {
  const modalCardRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [inputText, setInputText] = useState('');

  // Focus and Escape key handling
  useEffect(() => {
    if (!isOpen || !claim) return;

    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (modalCardRef.current) {
        modalCardRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, claim, onClose]);

  if (!isOpen || !claim) return null;

  const contactName = claim.contactPerson || claim.posterName || 'Ana Reyes';
  const contactFirstName = contactName.split(' ')[0];

  const initials = contactName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const displayMessages =
    messages.length > 0
      ? messages
      : [
          {
            id: 'm1',
            sender: 'contact',
            senderName: contactName,
            text: `Hi Lia! I saw your claim was approved with the exact description of the '${claim.title}'. I have it with me on campus today!`,
            timestamp: '10:24 AM',
          },
          {
            id: 'm2',
            sender: 'contact',
            senderName: contactName,
            text: `I'm at the Social Hall until 4:00 PM if you want to meet up there, or I can turn it over to MIS.`,
            timestamp: '10:25 AM',
          },
        ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage?.(claim.id, inputText.trim());
    setInputText('');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalCardRef}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 focus:outline-none flex flex-col h-[580px]"
      >
        {/* Header (No 'finder of...' subtitle, clean header as requested) */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#047857] text-white font-bold text-sm flex items-center justify-center relative shrink-0">
              {initials || 'AR'}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {contactName}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Claim Approved
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Pill Separator */}
        <div className="flex justify-center pt-3 pb-1 bg-white">
          <span className="bg-[#f1f5f9] text-slate-600 text-xs px-3 py-1 rounded-full font-medium">
            Today, 10:24 AM
          </span>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 px-5 py-2 overflow-y-auto space-y-3 bg-white">
          {displayMessages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-[#047857] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                    {initials || 'AR'}
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[82%]`}>
                  {/* Blue theme boxes for both incoming and outgoing as requested */}
                  <div
                    className={`p-3.5 text-sm leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-xs'
                        : 'bg-[#edf3fc] border border-blue-100/70 text-slate-800 rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[11px] text-slate-400 px-1 mt-1">
                    {msg.timestamp || '10:25 AM'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Campus Safety Warning Banner */}
          <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#92400e] mt-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-900">
              Claim verified. For campus safety, meet in public campus zones .
            </span>
          </div>
        </div>

        {/* Bottom Message Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 -rotate-45" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type a message to ${contactFirstName} to arrange pickup...`}
            className="flex-1 bg-[#f0f4fa] text-slate-800 placeholder-slate-400 text-sm px-4 py-2.5 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white p-2.5 rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalMessage;
