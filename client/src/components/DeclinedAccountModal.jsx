import React from 'react';
import { X, Ban, Mail } from 'lucide-react';

/**
 * DeclinedAccountModal
 * Displays feedback card after an account request has been declined,
 * detailing the applicant name, reason cited, and activity log navigation.
 */
export default function DeclinedAccountModal({
  isOpen,
  account,
  reason,
  onClose,
  onViewActivityLog,
}) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Admin Popup - Request Declined
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Request Declined
              </h3>
              <p className="text-xs text-slate-500">
                Applicant has been notified
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The registration request for{' '}
            <strong className="text-slate-900 font-semibold">
              {account.name}
            </strong>{' '}
            has been declined. An email has been sent informing them of the
            decision with instructions on how to appeal or re-apply.
          </p>

          {/* Account Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Applicant
              </span>
              <span className="text-xs font-bold text-slate-800">
                {account.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Role & Department
              </span>
              <span className="text-xs font-medium text-slate-700">
                {account.role} • {account.department || 'College of Nursing'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                Reason Cited
              </span>
              <span className="text-xs font-medium text-slate-700 text-right">
                {reason || 'Unverified campus affiliation'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Declined
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Email Notification
              </span>
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                Sent to {account.email}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onViewActivityLog}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            View Activity Log
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5170ff] hover:bg-[#4361ee] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
