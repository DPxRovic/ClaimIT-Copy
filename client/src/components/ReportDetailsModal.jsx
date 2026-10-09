import React, { useEffect } from 'react';
import ClaimOrMatchCard from './ClaimOrMatchCard.jsx';

/**
 * ReportDetailsModal Component
 * Reusable modal matching the exact Stitch design.
 * Auto-injects Material Symbols Outlined font to ensure icons never appear as text.
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen=true] - Controls visibility of the modal
 * @param {Function} [props.onClose] - Callback when modal is closed
 * @param {Object} props.report - Dynamic report data
 * @param {boolean} [props.canCloseReport=false] - Whether "Close this report" action is visible
 * @param {Function} [props.onCloseReport] - Callback when "Close this report" is clicked
 * @param {Function} [props.onViewClaimOrMatch] - Callback when "View →" is clicked on a claim/match
 * @param {string} [props.className] - Additional classes
 */
export const ReportDetailsModal = ({
  isOpen = true,
  onClose,
  report,
  canCloseReport = false,
  onCloseReport,
  onViewClaimOrMatch,
  className = '',
}) => {
  // Ensure Material Symbols font is loaded in document head
  useEffect(() => {
    const linkId = 'material-symbols-outlined-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !report) {
    return null;
  }

  const isLost = report.type === 'LOST';
  const entries = report.entries || [];
  const entriesCount = entries.length;
  const isMatches = report.entriesType === 'matches' || (isLost && report.entriesType !== 'claims');
  const sectionTitle = isMatches ? 'Matches on this item' : 'Claims on this item';
  const locationLabel = isLost ? 'Lost Location' : 'Found Location';

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#4F46E5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" aria-hidden="true" />
            Active
          </span>
        );
      case 'Pending Match':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            Pending Match
          </span>
        );
      case 'Pending Claim':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFEDD5] text-[#9A3412]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" aria-hidden="true" />
            Pending Claim
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1D4ED8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" aria-hidden="true" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" aria-hidden="true" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const renderTypeBadge = (type) => {
    if (type === 'FOUND') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#0D6E6E] text-white tracking-wider">
          FOUND
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#881337] text-white tracking-wider">
        LOST
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-details-dialog-title"
    >
      {/* Modal Card matching exact Stitch max-w-[500px] outline #E8E4D8 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[500px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 animate-in zoom-in-95 ${className}`}
        style={{ outline: '1px solid #E8E4D8' }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-3 bg-white shrink-0"
          style={{ borderBottom: '1px solid #E8E4D8' }}
        >
          <div className="flex items-center gap-2">
            <span
              id="report-details-dialog-title"
              className="text-[18px] tracking-tight text-[#23261F] font-bold"
            >
              Report Details
            </span>
            {report.ticket && (
              <span className="text-[11px] px-2 py-0.5 rounded text-[#444655] bg-[#e5eeff] tracking-wider font-semibold font-mono">
                {report.ticket}
              </span>
            )}
          </div>

          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 font-sans">
          {/* Badges and Title */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {renderTypeBadge(report.type)}
              {renderStatusBadge(report.status)}
            </div>
            <h2 className="text-[18px] text-[#23261F] font-bold leading-tight tracking-tight">
              {report.title}
            </h2>
          </div>

          {/* Item Image */}
          {report.imageUrl && (
            <div
              className="w-full h-32 rounded-xl overflow-hidden relative bg-[#e5eeff]"
              style={{ border: '1px solid #E8E4D8' }}
            >
              <img
                alt={report.title}
                className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-300"
                src={report.imageUrl}
              />
            </div>
          )}

          {/* Category & Date Filed Grid */}
          <div
            className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-[#eff4ff]/60"
            style={{ border: '1px solid #E8E4D8' }}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
                Category
              </span>
              <div className="flex items-center gap-1.5 text-[#23261F]">
                <span className="text-sm font-medium">{report.category || '—'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
                Date Filed
              </span>
              <div className="flex items-center gap-1.5 text-[#23261F]">
                <span className="material-symbols-outlined text-[16px] text-[#6E6858]">
                  calendar_today
                </span>
                <span className="text-sm font-medium">{report.dateFiled || '—'}</span>
              </div>
            </div>
          </div>

          {/* Location Box */}
          {report.location && (
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold flex items-center gap-1">
                <span>{locationLabel}</span>
              </label>
              <div
                className="flex items-start gap-2 p-2 rounded-lg bg-white text-[#23261F]"
                style={{ border: '1px solid #E8E4D8' }}
              >
                <span className="material-symbols-outlined text-[#284bdc] text-[18px] mt-0.5 flex-shrink-0">
                  location_on
                </span>
                <div>
                  <p className="text-sm font-medium text-[#23261F]">{report.location}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description & Notes */}
          {report.description && (
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold">
                Description &amp; Notes
              </label>
              <div
                className="p-2 rounded-lg bg-white text-[#23261F]"
                style={{ border: '1px solid #E8E4D8' }}
              >
                <p className="text-sm leading-relaxed text-[#23261F]">{report.description}</p>
              </div>
            </div>
          )}

          {/* Matches / Claims Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#23261F]">
                  {sectionTitle}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#6E6858]">
                  {entriesCount}
                </span>
              </div>
              <span className="text-[11px] text-[#6E6858] uppercase tracking-wider">
                Verification Ready
              </span>
            </div>

            {/* List of matches/claims or Empty State */}
            {entriesCount > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {entries.map((entry, index) => (
                  <ClaimOrMatchCard
                    key={entry.id || index}
                    entry={entry}
                    onView={onViewClaimOrMatch}
                  />
                ))}
              </div>
            ) : (
              /* Empty state from Stitch AI */
              <div
                className="rounded-lg px-3 py-1.5 flex items-center gap-2 bg-white"
                style={{ border: '1px dashed #E8E4D8' }}
              >
                <span className="material-symbols-outlined text-[16px] text-[#6E6858] flex-shrink-0">
                  assignment_late
                </span>
                <p className="text-sm text-[#6E6858]">
                  {isMatches
                    ? 'No one has said they found this yet.'
                    : 'No claims have been submitted yet.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="px-5 py-3 bg-white flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid rgb(232, 228, 216)' }}
        >
          {canCloseReport ? (
            <button
              type="button"
              onClick={() => onCloseReport?.(report)}
              className="text-sm font-medium hover:underline cursor-pointer transition-colors focus:outline-none flex items-center gap-1"
              style={{ color: 'rgb(220, 38, 38)' }}
            >
              <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span>
              <span>Close this report</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-white hover:bg-[#e5eeff] text-[#23261F] text-xs font-medium transition-colors focus:outline-none cursor-pointer"
            style={{ border: '1px solid #E8E4D8' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;
