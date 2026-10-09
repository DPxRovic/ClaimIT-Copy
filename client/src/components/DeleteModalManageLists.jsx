import React, { useEffect } from 'react';

const TAB_CONFIGS = {
  report_categories: {
    title: 'Delete this category?',
    subtitle: "This category will be permanently deleted. This can't be undone.",
  },
  programs: {
    title: 'Delete this program?',
    subtitle:
      "Students already registered under this program keep their record, but it will no longer appear as an option for new registrations. This can't be undone.",
  },
  departments: {
    title: 'Delete this department?',
    subtitle: "This department will be permanently deleted. This can't be undone.",
  },
};

export default function DeleteModalManageLists({
  isOpen,
  onClose,
  onConfirm,
  category,
  item,
  activeTab = 'report_categories',
  tabType,
}) {
  const currentItem = item || category;
  const currentTab = tabType || activeTab || 'report_categories';
  const config = TAB_CONFIGS[currentTab] || TAB_CONFIGS.report_categories;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentItem) return null;

  const handleConfirm = () => {
    onConfirm(currentItem.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Body Content */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* Red Trash Badge Icon */}
            <div className="w-11 h-11 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] shadow-xs">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="14" y2="15" />
                <line x1="14" y1="11" x2="10" y2="15" />
              </svg>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px] block leading-none">
                close
              </span>
            </button>
          </div>

          {/* Delete Prompt */}
          <div className="mt-4">
            <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
              {config.title}
            </h2>
            <p className="text-[13.5px] text-[#475569] mt-2 leading-relaxed">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#F1F5F9] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-[#1E293B] bg-[#F0F5FF] hover:bg-[#E2EDFF] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span>Yes, delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { DeleteModalManageLists };
