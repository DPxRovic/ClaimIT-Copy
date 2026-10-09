import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Ban,
  GraduationCap,
  Building,
  Mail,
  FileText,
  Tag,
  MessageSquare,
  Info,
  Check,
  ChevronRight,
} from 'lucide-react';

/**
 * Reusable Admin Account Modals for ClaimIt
 *
 * Supports 4 popup variants matching the UI specifications:
 * 1. 'manage'   - Account review with Approve and Decline triggers
 * 2. 'decline'  - Reason selection and note textarea for rejection
 * 3. 'approved' - Success summary card with link to Activity Logs
 * 4. 'declined' - Declined summary card with cited reason and link to Activity Logs
 */

export const DECLINE_REASONS = [
  'Unverified campus affiliation / Not found in faculty directory',
  'Incorrect department or role selected',
  'Duplicate registration',
  'Other reason',
];

/**
 * 1. Manage Modal ('manage')
 */
export function ManageAccountModal({
  isOpen,
  account,
  onClose,
  onApprove,
  onDeclineRequest,
}) {
  if (!isOpen || !account) return null;

  const roleBadgeColor =
    account.role === 'Faculty'
      ? 'bg-blue-50 text-blue-600 border-blue-100'
      : account.role === 'Staff'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-purple-50 text-purple-700 border-purple-100';

  const statusBadge =
    account.status === 'Pending approval' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending approval
      </span>
    ) : account.status === 'Active' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    ) : account.status === 'Declined' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Declined
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        {account.status}
      </span>
    );

  const initials =
    account.initials ||
    account.name
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'US';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top subtle blue accent bar */}
        <div className="h-1.5 w-full bg-[#5170ff]" />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Row: Role & Status Tags + Close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleBadgeColor}`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                {account.role}
              </span>
              {statusBadge}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 pt-1">
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-full bg-[#0d9488] text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-white">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {account.name}
                </h2>
                {account.idNumber && (
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                    {account.idNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{account.email}</span>
              </p>
            </div>
          </div>

          {/* Info Details Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                USERNAME
              </span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                {account.username || 'm.aquino'}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                DEPARTMENT
              </span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                {account.department || account.details || 'College of Nursing'}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                POSITION
              </span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                {account.position || 'Professor'}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                JOINED
              </span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                {account.joined || 'Sep 14, 2026'}
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CAMPUS
              </span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                {account.campus || 'Congress Campus'}
              </span>
            </div>
          </div>

          {/* 3 Stat Counters */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900">
                  {account.stats?.reports ?? 0}
                </span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                Reports filed
              </p>
              <p className="text-[11px] text-slate-400">Lost &amp; found items</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900">
                  {account.stats?.claims ?? 0}
                </span>
                <Tag className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                Claims submitted
              </p>
              <p className="text-[11px] text-slate-400">
                Resolved {account.stats?.resolved ?? 0}
              </p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900">
                  {account.stats?.chats ?? 0}
                </span>
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                Active chats
              </p>
              <p className="text-[11px] text-slate-400">Campus inquiries</p>
            </div>
          </div>

          {/* Warning banner for pending accounts */}
          {account.status === 'Pending approval' && (
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold">Waiting for approval.</strong>{' '}
                This {account.role.toLowerCase()} account can&apos;t log in until
                you approve it.
              </p>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onApprove?.(account)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#5170ff] hover:bg-[#4361ee] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              Approve account
            </button>

            <button
              type="button"
              onClick={() => onDeclineRequest?.(account)}
              className="py-2.5 px-4 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold cursor-pointer transition-colors"
            >
              Decline request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Decline Modal ('decline')
 */
export function DeclineAccountModal({
  isOpen,
  account,
  onClose,
  onCancel,
  onConfirmDecline,
}) {
  const [selectedReason, setSelectedReason] = useState(DECLINE_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  if (!isOpen || !account) return null;

  const handleDecline = () => {
    onConfirmDecline?.({
      account,
      reason: selectedReason,
      note: customNote,
      sendEmail,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 sm:p-7 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Decline {account.role} Registration
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                REASON FOR DECLINING <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2">
                {DECLINE_REASONS.map((reason) => {
                  const isChecked = selectedReason === reason;
                  return (
                    <label
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#5170ff] bg-blue-50/40 text-slate-900 ring-1 ring-[#5170ff]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'border-[#5170ff] bg-[#5170ff]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="leading-snug">{reason}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                ADDITIONAL NOTE TO APPLICANT (OPTIONAL)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Provide additional feedback or instructions for re-applying..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/20 focus:border-[#5170ff] resize-none"
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#5170ff] rounded border-slate-300 focus:ring-[#5170ff] cursor-pointer"
              />
              <span className="text-xs text-slate-600 leading-tight">
                Send email notification explaining the decline decision to{' '}
                <strong className="text-slate-900 font-medium font-mono text-[11px]">
                  {account.email}
                </strong>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDecline}
              className="py-2.5 px-5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
              Decline Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Approved Modal ('approved')
 */
export function ApprovedAccountModal({
  isOpen,
  account,
  onClose,
  onViewActivityLog,
}) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 text-center space-y-4">
          {/* Centered emerald checkmark circle */}
          <div className="w-14 h-14 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mx-auto shadow-xs ring-4 ring-emerald-50">
            <CheckCircle className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {account.role} Account Approved
            </h2>
          </div>

          {/* Details Card */}
          <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-4.5 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                {account.role.toUpperCase()} MEMBER
              </span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                {account.name}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                DEPARTMENT
              </span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                {account.department || account.details || 'College of Nursing'}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                GRANTED ROLE
              </span>
              <span className="font-medium text-slate-800 text-right">
                {account.role}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                STATUS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onViewActivityLog}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
            >
              View Activity Log
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-7 rounded-xl bg-[#5170ff] hover:bg-[#4361ee] text-white text-xs font-semibold shadow-xs cursor-pointer transition active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Declined Modal ('declined')
 */
export function DeclinedAccountModal({
  isOpen,
  account,
  reason,
  onClose,
  onViewActivityLog,
}) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 text-center space-y-4">
          {/* Centered red prohibition circle */}
          <div className="w-14 h-14 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mx-auto shadow-xs ring-4 ring-rose-50">
            <Ban className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {account.role} Registration Declined
            </h2>
          </div>

          {/* Details Card */}
          <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-4.5 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                APPLICANT
              </span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                {account.name}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                DEPARTMENT
              </span>
              <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                {account.department || account.details || 'College of Nursing'}
              </span>
            </div>

            <div className="flex items-start justify-between border-t border-slate-200/60 pt-2.5 gap-2">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] shrink-0">
                REASON CITED
              </span>
              <span className="font-medium text-slate-800 text-right text-[11px] max-w-[220px] leading-tight">
                {reason || account.declinedReason || DECLINE_REASONS[0]}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                NOTIFICATION
              </span>
              <span className="font-mono text-slate-700 text-right text-[11px] truncate max-w-[200px]">
                {account.email}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                STATUS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Declined
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onViewActivityLog}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
            >
              View Activity Log
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-7 rounded-xl bg-[#5170ff] hover:bg-[#4361ee] text-white text-xs font-semibold shadow-xs cursor-pointer transition active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Combined Admin Account Modals Controller
 */
export default function AdminAccountModals({
  modalState,
  onClose,
  onApprove,
  onDeclineRequest,
  onCancelDecline,
  onConfirmDecline,
  onViewActivityLog,
}) {
  if (!modalState || !modalState.type || !modalState.account) return null;

  const { type, account, reason } = modalState;

  if (type === 'manage') {
    return (
      <ManageAccountModal
        isOpen={true}
        account={account}
        onClose={onClose}
        onApprove={onApprove}
        onDeclineRequest={onDeclineRequest}
      />
    );
  }

  if (type === 'decline') {
    return (
      <DeclineAccountModal
        isOpen={true}
        account={account}
        onClose={onClose}
        onCancel={onCancelDecline}
        onConfirmDecline={onConfirmDecline}
      />
    );
  }

  if (type === 'approved') {
    return (
      <ApprovedAccountModal
        isOpen={true}
        account={account}
        onClose={onClose}
        onViewActivityLog={onViewActivityLog}
      />
    );
  }

  if (type === 'declined') {
    return (
      <DeclinedAccountModal
        isOpen={true}
        account={account}
        reason={reason}
        onClose={onClose}
        onViewActivityLog={onViewActivityLog}
      />
    );
  }

  return null;
}
