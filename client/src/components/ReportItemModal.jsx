import React, { useState, useRef } from 'react';

/**
 * ReportItemModal component for ClaimIt
 * 
 * Standalone modal card for reporting lost or found items on campus.
 * 
 * @param {Object} props
 * @param {boolean} [props.isOpen=true] Controls modal visibility
 * @param {() => void} [props.onClose] Callback when clicking close (X) or Cancel
 * @param {() => void} [props.onCancel] Secondary callback for Cancel button
 * @param {(reportData: any) => void} [props.onSubmit] Callback when submitting the report
 * @param {string} [props.initialType='lost'] Initial report type ('lost' | 'found')
 */
export default function ReportItemModal({
  isOpen = true,
  onClose,
  onCancel,
  onSubmit,
  initialType = 'lost',
}) {
  const [reportType, setReportType] = useState(initialType);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      reportType,
      itemName,
      category,
      date,
      location,
      description,
      fileName: selectedFileName,
      imagePreview,
      createdAt: new Date().toISOString(),
    };

    if (onSubmit) {
      onSubmit(payload);
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
        className="relative z-10 w-full max-w-[580px] bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] border-[#E8E4D8] font-sans text-slate-800"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-3.5 border-b bg-white rounded-t-2xl shrink-0 border-[#E8E4D8]">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-bold text-[#0f172a]" id="modal-title">
              Report an Item
            </h2>
            <p className="text-xs text-[#6E6858]">
              Provide details to help reunite this item with its rightful owner.
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto space-y-3 flex-1 text-left">
          {/* Report Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#23261F] font-heading">
              Report Type *
            </label>
            <div className="flex gap-3">
              {/* Option: Lost Something */}
              <div
                onClick={() => setReportType('lost')}
                className={`flex-1 min-w-0 flex flex-col p-2.5 rounded-xl cursor-pointer transition-all ${
                  reportType === 'lost'
                    ? 'border-2 border-[#5170ff] bg-[#f0f4ff]'
                    : 'border border-[#E8E4D8] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      reportType === 'lost' ? 'bg-[#5170ff]/15 text-[#5170ff]' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>

                  {reportType === 'lost' ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-[#5170ff] flex items-center justify-center text-white shrink-0">
                      <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>
                <span className={`font-semibold text-xs sm:text-sm ${reportType === 'lost' ? 'text-[#5170ff]' : 'text-slate-700'}`}>
                  Lost Something
                </span>
                <span className="text-[11px] text-[#6E6858] mt-0.5">
                  I'm looking for an item I lost
                </span>
              </div>

              {/* Option: Found Something */}
              <div
                onClick={() => setReportType('found')}
                className={`flex-1 min-w-0 flex flex-col p-2.5 rounded-xl cursor-pointer transition-all ${
                  reportType === 'found'
                    ? 'border-2 border-[#5170ff] bg-[#f0f4ff]'
                    : 'border border-[#E8E4D8] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      reportType === 'found' ? 'bg-[#5170ff]/15 text-[#5170ff]' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6 3V4a1.5 1.5 0 013 0v3.5m0 0V4a1.5 1.5 0 013 0v4.5" />
                    </svg>
                  </div>

                  {reportType === 'found' ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-[#5170ff] flex items-center justify-center text-white shrink-0">
                      <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>
                <span className={`font-semibold text-xs sm:text-sm ${reportType === 'found' ? 'text-[#5170ff]' : 'text-slate-700'}`}>
                  Found Something
                </span>
                <span className="text-[11px] text-[#6E6858] mt-0.5">
                  I found an item on campus
                </span>
              </div>
            </div>
          </div>

          {/* Item Name */}
          <div className="space-y-1.5">
            <label htmlFor="report-item-name" className="block text-sm font-medium text-[#23261F]">
              Item Name *
            </label>
            <input
              id="report-item-name"
              name="itemName"
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Matte Black Hydro Flask 32oz"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E4D8] placeholder-[#6E6858]/70 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] transition-all bg-white text-slate-900 h-9"
            />
          </div>

          {/* Category & Date Row */}
          <div className="flex gap-4">
            {/* Category */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <label htmlFor="report-category" className="block text-sm font-medium text-[#23261F]">
                Category *
              </label>
              <div className="relative flex items-center">
                <select
                  id="report-category"
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-sm rounded-lg border border-[#E8E4D8] text-slate-700 bg-white focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] transition-all appearance-none h-9 cursor-pointer"
                >
                  <option value="" disabled className="text-[#6E6858]/70">
                    Select a category...
                  </option>
                  <option value="electronics">Electronics</option>
                  <option value="personal-items">Personal Items</option>
                  <option value="keys">Keys & Accessories</option>
                  <option value="books">Books & Study Material</option>
                  <option value="apparel">Apparel</option>
                  <option value="bags">Bags & Backpacks</option>
                  <option value="ids">IDs & Cards</option>
                </select>
                <span className="absolute right-3 pointer-events-none text-[#6E6858]/70 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <label htmlFor="report-date" className="block text-sm font-medium text-[#23261F]">
                {reportType === 'lost' ? 'Date Lost *' : 'Date Found *'}
              </label>
              <div className="relative flex items-center">
                <input
                  id="report-date"
                  name="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-sm rounded-lg border border-[#E8E4D8] text-slate-700 bg-white focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] transition-all h-9 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6E6858]/70 flex items-center justify-center w-4 h-4 shrink-0">
                  <svg
                    className="w-4 h-4 shrink-0 block"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label htmlFor="report-location" className="block text-sm font-medium text-[#23261F]">
              {reportType === 'lost' ? 'Where did you last have it? *' : 'Where did you find it? *'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6858]/70 flex items-center justify-center pointer-events-none">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </span>
              <input
                id="report-location"
                name="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Science Hall 104 or Student Union 2nd floor"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E8E4D8] placeholder-[#6E6858]/70 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] transition-all bg-white text-slate-900 h-9"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="report-description" className="block text-sm font-medium text-[#23261F]">
              Description *
            </label>
            <textarea
              id="report-description"
              name="description"
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide identifying marks, stickers, color details, or distinct characteristics..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E4D8] placeholder-[#6E6858]/70 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] transition-all bg-white text-slate-900 resize-none h-[64px]"
            />
          </div>

          {/* Photo Upload (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#23261F]">
              Photo <span className="text-[#6E6858] font-normal">(Optional)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E8E4D8] hover:border-[#5170ff]/50 rounded-xl py-2.5 px-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/60 transition-all group"
            >
              {imagePreview ? (
                <div className="flex items-center gap-2">
                  <img src={imagePreview} alt="Preview" className="w-8 h-8 rounded object-cover border" />
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[240px]">
                    {selectedFileName}
                  </span>
                  <span className="text-xs text-[#5170ff] underline">Change</span>
                </div>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-[#5170ff]/10 flex items-center justify-center text-[#5170ff] mb-1 group-hover:scale-110 transition-transform shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    Drop an image here or <span className="text-[#5170ff] underline underline-offset-2">click to browse</span>
                  </span>
                  <span className="text-[11px] text-[#6E6858]">PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
          </div>

          {/* Modal Action Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-3 border-t rounded-b-2xl shrink-0 border-[#E8E4D8] -mx-6 -mb-4 mt-3"
            style={{ backgroundColor: '#FAF9F5' }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors focus:outline-none h-9 flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-[#5170ff] hover:bg-[#4362ea] text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 focus:outline-none h-9 cursor-pointer"
            >
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ReportItemModal };