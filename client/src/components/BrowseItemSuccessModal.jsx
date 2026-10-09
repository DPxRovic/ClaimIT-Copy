import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock, MapPin, X } from 'lucide-react';

/**
 * Success modal shown after submitting a claim or found item report
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.data
 * @param {() => void} props.onClose
 * @param {() => void} [props.onNavigateToClaims]
 */
export const BrowseItemSuccessModal = ({
  isOpen,
  data,
  onClose,
  onNavigateToClaims,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const { item, mode, ticketId, inputText } = data;
  const isFoundReport = mode === 'found_report';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 border border-emerald-100 shadow-xs">
          <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* Status Ticket Pill */}
        <span className="inline-block font-mono text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 mb-2">
          {ticketId || '#CLM-8492'}
        </span>

        {/* Modal Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {isFoundReport
            ? 'Found Item Report Submitted!'
            : 'Claim Submitted Successfully!'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-xs mx-auto">
          {isFoundReport
            ? 'Thank you for reporting this item! The owner has been notified and will review your location details.'
            : 'Your claim has been submitted to the finder for review. You can track this verification in your Claims dashboard.'}
        </p>

        {/* Item Summary Card */}
        <div className="bg-[#f0f5ff] border border-blue-100/80 rounded-2xl p-3.5 my-4.5 text-left flex items-center gap-3">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-13 h-13 rounded-xl object-cover shrink-0 border border-white shadow-2xs"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
              {item.category}
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {item.title}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{item.location}</span>
            </p>
          </div>
        </div>

        {/* Timeline / Next Steps */}
        <div className="bg-slate-50 rounded-2xl p-3.5 text-left text-xs border border-slate-200/70 space-y-2 mb-5">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
              1
            </div>
            <div>
              <p className="font-bold text-slate-800">Verification in progress</p>
              <p className="text-[11px] text-slate-500">
                {isFoundReport
                  ? 'Campus coordinators and the item owner will review your report.'
                  : 'The finder will match your proof description against the physical item.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
              2
            </div>
            <div>
              <p className="font-bold text-slate-800">Campus Handover Station</p>
              <p className="text-[11px] text-slate-500">
                Upon approval, pick up or hand over your item safely at the verified campus desk.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {onNavigateToClaims && (
            <button
              onClick={() => {
                onClose();
                onNavigateToClaims();
              }}
              className="w-full sm:w-auto flex-1 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span>View in My Claims</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowseItemSuccessModal;
