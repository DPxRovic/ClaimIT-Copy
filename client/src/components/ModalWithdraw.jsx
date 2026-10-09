import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Package,
  Lightbulb,
  Check,
} from 'lucide-react';

/**
 * ModalWithdraw Component
 *
 * Implements:
 * - Step 1: "Withdraw Your Claim?" (Image 1)
 * - Step 2: "Claim Withdrawn Successfully" (Image 3)
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen]
 * @param {any} props.claim
 * @param {() => void} [props.onClose]
 * @param {((claimId: string, reason: string) => void)} [props.onWithdraw]
 * @param {((claimId: string, reason: string) => void)} [props.onConfirm]
 */
export const ModalWithdraw = ({
  isOpen = true,
  claim,
  onClose = () => {},
  onWithdraw = undefined,
  onConfirm = undefined,
}) => {
  const modalCardRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Focus and Escape key handling
  useEffect(() => {
    if (!isOpen || !claim) {
      setIsSuccess(false);
      setReason('');
      return;
    }

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

  const poster = claim.posterName || 'Marco Villanueva';
  const location = claim.location || 'Social Hall';

  const handleConfirm = () => {
    (onWithdraw || onConfirm)?.(claim.id, reason || 'Found the item on my own');
    setIsSuccess(true);
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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
      >
        {isSuccess ? (
          /* Step 2: "Claim Withdrawn Successfully" (Image 3) */
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    Claim Withdrawn Successfully
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Your claim for this item has been canceled. The poster has been notified and the item has returned to open status.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer ml-2"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Info Box with Withdrawn Pill */}
            <div className="bg-[#f4f7fc] border border-blue-50/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-700 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {claim.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Posted by {poster} • {location}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Withdrawn
              </span>
            </div>

            {/* Tip Box (Image 3) */}
            <div className="bg-[#f0f5fe] border border-blue-100/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-semibold">Made a mistake?</strong> If you still believe this item belongs to you, you can submit a new claim with updated proof from the Browse Items page at any time.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Browse Other Items
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Back to My Claims</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: "Withdraw Your Claim?" (Image 1) */
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    Withdraw Your Claim?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This action will cancel your pending claim request.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer ml-2"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Info Box with Pending Review Pill */}
            <div className="bg-[#f4f7fc] border border-blue-50/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-700 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {claim.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Posted by {poster} • {location}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#fef9c3]/70 text-[#a16207] border border-[#fef08a] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pending Review
              </span>
            </div>

            {/* Confirmation text */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to withdraw this claim? You can re-submit a claim later if this was a mistake.
            </p>

            {/* Reason Dropdown */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs sm:text-sm font-semibold text-slate-900 block">
                Reason for withdrawal (optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs sm:text-sm py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Select a reason...</option>
                <option value="Found the item on my own">I found the item on my own</option>
                <option value="Filed duplicate claim">Filed duplicate claim by mistake</option>
                <option value="Description did not match">Item description didn't match mine</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Never mind, keep claim
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#d92d20] hover:bg-[#b42318] rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Withdrawal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalWithdraw;
