import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

const DEFAULT_USER = {
  name: 'Taylor Swift',
  email: 'taylorswift@gmail.com',
  role: 'Student',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
};

/**
 * LogoutConfirmation Modal Component
 *
 * @param {Object} [props]
 * @param {boolean} [props.isOpen=true] - Controls visibility of the modal
 * @param {Function} [props.onCancel] - Callback when user cancels or clicks close/backdrop
 * @param {Function} [props.onConfirm] - Callback when user confirms logout
 * @param {Function} [props.onClose] - Alternative callback alias for onCancel
 * @param {Function} [props.onLogout] - Alternative callback alias for onConfirm
 * @param {Object} [props.user] - User details to display
 * @param {string} [props.className] - Additional classes for the modal container
 */
export const LogoutConfirmation = ({
  isOpen = true,
  onCancel,
  onConfirm,
  onClose,
  onLogout,
  user = DEFAULT_USER,
  className = '',
}) => {
  const handleCancel = onCancel || onClose;
  const handleConfirm = onConfirm || onLogout;

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && handleCancel) {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) {
    return null;
  }

  const userData = {
    ...DEFAULT_USER,
    ...user,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[420px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-6 sm:p-7 flex flex-col transition-all animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Top Bar: Logout Icon & Close Button */}
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-[#DC2626]" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Header & Subtitle */}
        <div className="mt-5 flex flex-col">
          <h2
            id="logout-modal-title"
            className="font-headline text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight leading-snug"
          >
            Log out of ClaimIt?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mt-2 font-normal">
            You&apos;ll need to sign back in to report items, browse, or check your claims.
          </p>
        </div>

        {/* User Profile Info Card */}
        <div className="mt-5 bg-[#FAF9F5] border border-[#EFECE6] rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={userData.avatarUrl}
              alt={userData.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-stone-200"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 leading-snug truncate">
                {userData.name}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {userData.email}
              </span>
            </div>
          </div>

          {/* Role Pill Badge */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#2563eb] border border-[#DBEAFE]/70 shrink-0">
            {userData.role}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors text-center cursor-pointer shadow-2xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-sm transition-colors text-center cursor-pointer shadow-xs"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;
