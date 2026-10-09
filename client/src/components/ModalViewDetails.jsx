import React, { useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Paperclip,
  Clock,
  FileText,
  Package,
} from 'lucide-react';

/**
 * ModalViewDetails Component
 *
 * Implements Image 4 & Image 5 UI design:
 * - Edited pills / status accordingly (Type & Status pill)
 * - Dark photo box with centered item visual
 * - 2x2 metadata grid (Location, Found, Category, Posted by)
 * - Status alerts (Pending waiting notice, Declined finder explanation, Approved)
 * - Blue submitted proof container with attachment pill
 * - Footer bar with date and actions
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen]
 * @param {any} props.claim
 * @param {() => void} [props.onClose]
 * @param {((type: string, claim: any) => void)} [props.onSwitchModal]
 * @param {((claim: any) => void)} [props.onOpenMessage]
 * @param {((claim: any) => void)} [props.onWithdraw]
 */
export const ModalViewDetails = ({
  isOpen = true,
  claim,
  onClose = () => {},
  onSwitchModal = undefined,
  onOpenMessage = undefined,
  onWithdraw = undefined,
}) => {
  const modalCardRef = useRef(null);
  const previousFocusRef = useRef(null);

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

  const posterName = claim.posterName || claim.contactPerson || 'Marco Villanueva (BS Computer Science)';
  const location = claim.location || claim.handoverLocation || 'Guard House';
  const foundDate = claim.foundDate || 'September 15, 2026';
  const claimedDate = claim.claimedDate || 'Claimed 4 days ago';
  const contactFirstName = (claim.contactPerson || claim.posterName || 'Finder').split(' ')[0];

  const handleMessageAction = () => {
    if (onSwitchModal) {
      onSwitchModal('message', claim);
    } else if (onOpenMessage) {
      onOpenMessage(claim);
    }
  };

  const handleWithdrawAction = () => {
    if (onSwitchModal) {
      onSwitchModal('withdraw', claim);
    } else if (onWithdraw) {
      onWithdraw(claim);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Status pill renderer for Details Header
  const renderStatusPill = () => {
    switch (claim.status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Approved
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Declined
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Review
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            In Review
          </span>
        );
      case 'Withdrawn':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Withdrawn
          </span>
        );
    }
  };

  const cleanType = (claim.type || 'FOUND').toUpperCase().replace(' CLAIM', '');

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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 focus:outline-none flex flex-col max-h-[90vh]"
      >
        {/* Header Info */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            {/* Type Badge: Dark teal rectangular pill */}
            <span className="bg-[#0f766e] text-white font-bold text-xs uppercase px-2.5 py-1 rounded-md tracking-wider">
              {cleanType}
            </span>
            {/* Status Badge */}
            {renderStatusPill()}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {/* Dark Photo Container */}
          <div className="bg-[#0f172a] rounded-2xl overflow-hidden flex items-center justify-center h-52 relative shadow-xs">
            {claim.imageUrl ? (
              <img
                alt={claim.title}
                className="max-h-48 w-auto object-contain rounded-lg p-2"
                src={claim.imageUrl}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Package className="w-16 h-16 stroke-1 text-slate-500" />
                <span className="text-xs mt-2 text-slate-400 font-medium">Original Item Reference</span>
              </div>
            )}
          </div>

          {/* Item Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {claim.title}
            </h2>
          </div>

          {/* 2x2 Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 pt-1">
            <div>
              <p className="text-xs text-slate-400 font-medium">Location</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Found</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{foundDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Category</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{claim.category}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Posted by</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{posterName}</p>
            </div>
          </div>

          {/* Description */}
          {claim.description && (
            <p className="text-sm text-slate-600 leading-relaxed pt-1">
              {claim.description}
            </p>
          )}

          {/* Status Notices */}
          {claim.status === 'Pending' || claim.status === 'In Review' ? (
            <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#92400e]">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You claimed this item. Waiting for {contactFirstName} to review your proof.</span>
            </div>
          ) : claim.status === 'Declined' ? (
            <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-xl p-4 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Claim Declined by Finder</span>
              </div>
              <p className="text-rose-800 leading-relaxed pl-6 mt-1">
                {claim.declinedReason ||
                  `${posterName} reviewed your submitted proof and marked it as non-matching with the found item.`}
              </p>
              <p className="text-rose-600/90 leading-relaxed pl-6">
                If this was a misunderstanding, you may contact the finder or submit an appeal with additional photos or identifiers.
              </p>
            </div>
          ) : claim.status === 'Approved' ? (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Claim verified &amp; approved. For campus safety, meet in public campus zones.</span>
            </div>
          ) : null}

          {/* Your Submitted Proof Box */}
          <div className="bg-[#f0f5fe]/80 border border-blue-100 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Your submitted proof</span>
              </div>
              <span className="font-mono text-xs text-slate-400">Claim ID {claim.id}</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              "{claim.userProof || claim.description || 'Submitted proof details on file.'}"
            </p>

            {claim.attachmentName && (
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 shadow-xs">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">{claim.attachmentName}</span>
                <span className="text-slate-400 font-normal">({claim.attachmentSize || '840 KB'})</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {claimedDate}
          </span>

          <div className="flex items-center gap-2">
            {/* Withdraw button for Pending or In Review claims */}
            {(claim.status === 'Pending' || claim.status === 'In Review') && (
              <button
                onClick={handleWithdrawAction}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                type="button"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Withdraw claim</span>
              </button>
            )}

            {/* Message button for Approved claims */}
            {claim.status === 'Approved' && (
              <button
                onClick={handleMessageAction}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                type="button"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message {contactFirstName}</span>
              </button>
            )}

            

            {/* Close button always visible in the footer */}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalViewDetails;
