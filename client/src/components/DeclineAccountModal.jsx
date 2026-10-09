import React, { useState } from 'react';
import { X, Ban, Mail } from 'lucide-react';

export const DECLINE_REASONS = [
  'Unverified campus affiliation / Not found in faculty directory',
  'Incorrect department or role selected',
  'Duplicate registration',
  'Other reason',
];

/**
 * DeclineAccountModal
 * Allows admin to select reason and add internal notes before declining an account request.
 */
export default function DeclineAccountModal({
  isOpen,
  account,
  onClose,
  onCancel,
  onConfirmDecline,
}) {
  const [selectedReason, setSelectedReason] = useState(DECLINE_REASONS[0]);
  const [note, setNote] = useState('');

  if (!isOpen || !account) return null;

  const handleConfirm = () => {
    onConfirmDecline(selectedReason, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Admin Popup - Decline Request
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
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Decline Account Request
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to decline this request?
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Declining will notify the applicant and prevent this account from
            accessing ClaimIt. They will need to re-apply with valid credentials.
          </p>

          {/* Applicant mini pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                APPLICANT
              </span>
              <span className="text-xs font-bold text-slate-800">
                {account.name}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {account.department || account.role}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                EMAIL
              </span>
              <span className="text-xs font-medium text-slate-700">
                {account.email}
              </span>
            </div>
          </div>

          {/* Reason Radio Group */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Reason for declining
            </label>
            <div className="space-y-2">
              {DECLINE_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedReason === r
                      ? 'border-rose-400 bg-rose-50/40 text-slate-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50/80 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="decline-reason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Internal note (optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add details for the audit log..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel || onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Confirm & decline
          </button>
        </div>
      </div>
    </div>
  );
}
