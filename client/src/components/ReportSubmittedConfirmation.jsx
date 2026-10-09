
import React, { useEffect } from 'react';

export default function ReportSubmittedConfirmation({
  isOpen = false,
  onClose,
  onViewReports,
  reportId = 'R-1102',
  reportType = 'lost',
  title = 'Report Submitted',
  subtitle,
  statusLabel = 'Active Listing',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultSubtitle =
    reportType?.toLowerCase() === 'found'
      ? 'Your found item is now on the board.'
      : 'Your lost item is now on the board.';

  const displaySubtitle = subtitle || defaultSubtitle;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-submitted-confirmation-title"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative flex w-full max-w-[390px] flex-col overflow-hidden rounded-2xl border border-[#E8E4D8] bg-white font-sans shadow-2xl ${className}`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close confirmation"
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Confirmation Content */}
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF]">
            <svg
              className="h-6 w-6 text-[#4F6BF6]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2
            id="report-submitted-confirmation-title"
            className="text-[22px] font-bold tracking-tight text-[#0F172A]"
          >
            {title}
          </h2>

          <p className="mt-1.5 text-sm leading-relaxed text-[#6E6858]">
            {displaySubtitle}
          </p>

          {/* Report ID and Status */}
          <div className="mt-6 flex w-full items-center justify-between rounded-xl border border-[#E8E4D8] bg-[#FAF9F5] p-4 text-left">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6858]">
                REPORT ID
              </span>

              <span className="mt-0.5 text-lg font-bold tracking-tight text-[#0F172A]">
                {reportId}
              </span>
            </div>

            <span className="rounded-lg border border-[#E8E4D8] bg-white px-3 py-1 text-xs font-medium text-[#444655]">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#E8E4D8] bg-[#FAF9F5] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E8E4D8] bg-white px-4 py-2 text-xs font-medium text-[#23261F] transition-colors hover:bg-slate-100 sm:text-sm"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onViewReports || onClose}
            className="rounded-xl bg-[#4B6BFA] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#3D5EE8] sm:text-sm"
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}

export { ReportSubmittedConfirmation };
