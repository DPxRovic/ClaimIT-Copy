import React, { useState, useEffect, useRef } from 'react';

const TAB_CONFIGS = {
  report_categories: {
    title: 'Edit Category',
    subtitle: 'Changes apply immediately to report forms and browse filters.',
    fieldLabel: 'Category Name',
  },
  programs: {
    title: 'Edit Program',
    subtitle: "Update this program's details.",
    fieldLabel: 'Program Name',
  },
  departments: {
    title: 'Edit Department',
    subtitle: "Changes apply to the registration form's department selector.",
    fieldLabel: 'Department Name',
  },
};

export default function EditModalManageLists({
  isOpen,
  onClose,
  onSave,
  category,
  item,
  activeTab = 'report_categories',
  tabType,
}) {
  const currentItem = item || category;
  const currentTab = tabType || activeTab || 'report_categories';
  const config = TAB_CONFIGS[currentTab] || TAB_CONFIGS.report_categories;

  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentItem) {
      setName(currentItem.name || '');
      setStatus(currentItem.status || 'active');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, currentItem]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(`Please enter a ${config.fieldLabel.toLowerCase()}`);
      return;
    }
    onSave({
      ...currentItem,
      name: trimmed,
      status: status,
    });
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
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
          <div className="flex flex-col gap-1 pr-4">
            <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
              {config.title}
            </h2>
            <p className="text-[13px] text-[#64748B] leading-relaxed">
              {config.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px] block leading-none">
              close
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-5">
            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#1E293B]">
                {config.fieldLabel} <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:outline-none ${
                  error
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-[#E2E8F0] focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/15'
                }`}
              />
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>

            {/* Status Radio Pills */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#1E293B]">
                Initial Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 p-1 rounded-xl border border-[#E2E8F0] bg-white gap-1">
                {/* Active Option */}
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-[#EEF4FF] text-[#1E293B] font-semibold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      status === 'active' ? 'bg-[#2563EB]' : 'bg-[#94A3B8]'
                    }`}
                  />
                  <span>Active</span>
                </button>

                {/* Inactive Option */}
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    status === 'inactive'
                      ? 'bg-[#F1F5F9] text-[#1E293B] font-semibold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      status === 'inactive' ? 'bg-[#64748B]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>Inactive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-white border-t border-[#F1F5F9] flex items-center justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-[#1E293B] bg-[#F0F5FF] hover:bg-[#E2EDFF] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#4361EE] hover:bg-[#3651DC] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { EditModalManageLists };
