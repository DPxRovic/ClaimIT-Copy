import React from 'react';

/**
 * ClaimOrMatchCard Component
 * Reusable card matching the exact Stitch design screenshot:
 * - Avatar initials circle
 * - Reporter/Claimant name and metadata
 * - Status pill badge (Pending, Approved, Declined, etc.)
 * - Enclosed light blue-gray quoted message container
 * - Outlined white "View →" action button on bottom-right
 *
 * @param {Object} props
 * @param {Object} props.entry - The match or claim record
 * @param {string} [props.entry.name] - Name of person reporting/claiming
 * @param {string} [props.entry.submitterName] - Alternate name field
 * @param {string} [props.entry.avatarUrl] - Optional avatar image URL
 * @param {string} [props.entry.role] - e.g. "Reported Found" or "Claimant"
 * @param {string} [props.entry.date] - Date string, e.g. "Sep 16, 2026"
 * @param {string} [props.entry.submittedDate] - Alternate date field
 * @param {string} [props.entry.status] - Status, e.g. "Pending", "Approved"
 * @param {string} [props.entry.message] - Quote message
 * @param {string} [props.entry.messagePreview] - Alternate quote message field
 * @param {Function} [props.onView] - Callback when "View →" is clicked
 * @param {string} [props.className]
 */
export const ClaimOrMatchCard = ({ entry, onView, className = '' }) => {
  if (!entry) return null;

  const displayName = entry.name || entry.submitterName || 'Anonymous';
  const displayDate = entry.date || entry.submittedDate || '';
  const displayMessage = entry.message || entry.messagePreview || '';
  const displayStatus = entry.status || 'Pending';

  // Generate 2-letter initials from name if no avatarUrl provided
  const initials = displayName
    ? displayName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??';

  const renderStatusBadge = () => {
    switch (displayStatus) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Approved
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
            Declined
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            {displayStatus}
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 transition-all ${className}`}
      style={{ border: '1px solid #E8E4D8' }}
    >
      {/* Top Row: User identity & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-[#e5eeff] text-[#2563eb] font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100/60"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-[#0f172a] leading-tight truncate">
              {displayName}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 truncate">
              {entry.role ? `${entry.role} · ` : ''}
              {displayDate}
            </span>
          </div>
        </div>

        {/* Status Pill Badge with border and dot */}
        {renderStatusBadge()}
      </div>

      {/* Enclosed Quote Message Box */}
      {displayMessage && (
        <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs sm:text-[13px] text-slate-700 italic leading-relaxed">
          &ldquo;{displayMessage}&rdquo;
        </div>
      )}

      {/* Bottom Action: Outlined "View →" Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onView?.(entry)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors shadow-2xs cursor-pointer"
        >
          <span>View</span>
          <span className="text-xs leading-none">→</span>
        </button>
      </div>
    </div>
  );
};

export default ClaimOrMatchCard;
