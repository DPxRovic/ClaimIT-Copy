import React, { useEffect } from 'react';
import { X, Info, ShieldCheck } from 'lucide-react';

/**
 * Reusable modal popup displaying details of a clicked item card (Lost or Found)
 * Matches Image 1 (Lost item) and Image 3 (Found item) exactly.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.item
 * @param {() => void} props.onClose
 * @param {((item: any, actionType: 'claim' | 'found_report') => void)} props.onOpenAction
 */
export const BrowseItemDetailsModal = ({
  isOpen,
  item,
  onClose,
  onOpenAction,
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

  if (!isOpen || !item) return null;

  const isFound = item.type === 'FOUND';
  const posterName = item.postedBy || 'Hannah Puerta (BS Computer Science)';
  const contactFirstName = posterName.split(' ')[0] || 'Finder';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Badges & Close Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFound ? (
              <span className="bg-[#0f766e] text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                FOUND
              </span>
            ) : (
              <span className="bg-[#831843] text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                LOST
              </span>
            )}

            <span className="bg-[#eff6ff] text-[#3b82f6] text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-blue-100/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
              Active
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Item Picture */}
        <div className="mt-3.5 w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100/80 shadow-inner flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.imageAlt || item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.classList.add('bg-slate-50');
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {item.category || 'Item'} Photo
              </span>
              <p className="text-xs text-slate-400">No photograph attached by reporter</p>
            </div>
          )}
        </div>

        {/* Title & Listing Eyebrow / Reported Time */}
        {isFound ? (
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
              LISTING DETAILS
            </span>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {item.title}
            </h2>
          </div>
        ) : (
          <div className="mt-4">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {item.title}
            </h2>
            <p className="text-xs font-semibold text-blue-600 mt-1">
              {item.reportedTime || 'Reported 2 days ago'}
            </p>
          </div>
        )}

        {/* Details Box */}
        <div className="bg-[#f0f5ff] rounded-2xl p-4 mt-3.5 space-y-2.5 text-xs border border-blue-100/70">
          <div className="flex items-start">
            <span className="text-slate-500 w-24 shrink-0 font-normal">Location</span>
            <span className="font-bold text-slate-900 flex-1">{item.location}</span>
          </div>
          <div className="flex items-start">
            <span className="text-slate-500 w-24 shrink-0 font-normal">
              {isFound ? 'Found' : 'Lost'}
            </span>
            <span className="font-bold text-slate-900 flex-1">{item.date}</span>
          </div>
          <div className="flex items-start">
            <span className="text-slate-500 w-24 shrink-0 font-normal">Category</span>
            <span className="font-bold text-slate-900 flex-1 capitalize">
              {item.category?.toLowerCase()}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-slate-500 w-24 shrink-0 font-normal">Posted by</span>
            <span className="font-bold text-slate-900 flex-1">{posterName}</span>
          </div>
        </div>

        {/* Description Text */}
        <p className="text-xs sm:text-sm text-slate-700 mt-3.5 leading-relaxed font-normal">
          {item.description ||
            (isFound
              ? 'Item found on campus grounds. Please describe the items inside or distinctive marks if you think this is yours.'
              : 'Lost item left on campus. Looking for anyone who may have spotted or turned it in.')}
        </p>

        {/* Info Callout Box */}
        {isFound ? (
          <div className="bg-[#eff6ff] rounded-2xl p-3.5 mt-3.5 border border-blue-100/80 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Proof of Ownership Required</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                Think this is yours? Submit a claim with details only the owner would know.{' '}
                {contactFirstName} will review it.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#eff6ff] rounded-2xl p-3.5 mt-3.5 border border-blue-100/80 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-700 leading-snug">
              <span className="font-semibold text-slate-900">
                Lost items are open to matching.
              </span>{' '}
              If you found this, post it as a Found item so the owner can claim it.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-5 pt-1">
          <button
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            type="button"
          >
            {isFound ? 'Close' : 'Dismiss'}
          </button>

          {isFound ? (
            <button
              onClick={() => onOpenAction(item, 'claim')}
              className="bg-[#3b82f6] hover:bg-[#2563eb] active:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
              type="button"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Claim this item</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAction(item, 'found_report')}
              className="bg-[#3b82f6] hover:bg-[#2563eb] active:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
              type="button"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>I found this item</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseItemDetailsModal;
