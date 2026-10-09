import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Shield, MapPin, Send, Trash2 } from 'lucide-react';

/**
 * Reusable Action Modal:
 * - "Found Item Report" when viewing a LOST item (Image 2)
 * - "Claim this item" when viewing a FOUND item (Image 4)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.item
 * @param {'claim' | 'found_report'} props.mode
 * @param {() => void} props.onClose
 * @param {((submission: any) => void)} props.onSubmitSuccess
 */
export const BrowseItemActionModal = ({
  isOpen,
  item,
  mode = 'claim',
  onClose,
  onSubmitSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setInputText('');
      setUploadedFiles([]);
      setError('');
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isFoundReport = mode === 'found_report';
  const posterName = item.postedBy || 'Hannah Puerta (BS Computer Science)';

  // Shorten name e.g. "Paolo D."
  const nameParts = posterName.replace(/\(.*?\)/, '').trim().split(' ');
  const contactShortName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1][0]}.`
      : nameParts[0] || 'Finder';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 3));
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError(
        isFoundReport
          ? 'Please provide where you spotted or turned in the item.'
          : 'Please provide proof of ownership details.'
      );
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = isFoundReport ? `#FND-${randomNum}` : `#CLM-${randomNum}`;

    onSubmitSuccess({
      item,
      mode,
      ticketId,
      inputText,
      uploadedFiles,
      submittedAt: 'Just now',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        {isFoundReport ? (
          <div>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-slate-900">Found Item Report</h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer -mt-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader Badges & Reporter */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#831843] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  LOST
                </span>
                <span className="bg-[#eff6ff] text-[#3b82f6] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  Active
                </span>
              </div>
              <span className="text-xs text-slate-500 font-normal">
                Reported by <span className="font-semibold text-slate-700">{contactShortName}</span> (Student)
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-slate-900">Claim this item</h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer -mt-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              {contactShortName} will compare your answers with the item before approving. Be specific.
            </p>
          </div>
        )}

        {/* Mini Item Card Preview */}
        <div className="bg-[#f0f5ff] border border-blue-100/80 rounded-2xl p-3 flex items-center justify-between mt-3.5 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white shadow-2xs"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{item.location}</span>
              </p>
            </div>
          </div>

          <span className="bg-[#e0e7ff] text-[#3730a3] text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0">
            Found Item
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Main Question Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="details-input"
                className="text-xs font-bold text-slate-800"
              >
                {isFoundReport
                  ? 'Where did you spot/find it?'
                  : 'How can you prove it is yours?'}
              </label>
              <span className="text-xs font-semibold text-rose-500">*Required</span>
            </div>

            <textarea
              id="details-input"
              rows={3}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                isFoundReport
                  ? 'e.g. Covered Court bleachers, Student Center bench, Library 2F'
                  : 'Marks, contents, stickers, serial numbers'
              }
              className={`w-full rounded-2xl border p-3.5 text-xs text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 resize-none transition ${
                error
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />

            <p className="text-[11px] text-slate-400 mt-1">
              Describe details only the owner would know.
            </p>

            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          {/* Upload supporting photos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800">
                Upload supporting photos <span className="font-normal text-slate-400">(Optional)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Max 3 files</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center bg-white cursor-pointer transition group"
            >
              <div className="w-9 h-9 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-blue-600 group-hover:underline">
                Click to browse or drag and drop files
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG up to 10MB (receipts, past photos wearing it, marks)
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700"
                  >
                    <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{file.size}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-0.5 transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy / Security Notice */}
          <div className="bg-[#eff6ff] rounded-2xl p-3 flex items-center gap-2.5 border border-blue-100/70">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-[11px] text-slate-600 leading-snug">
              Claim submissions are protected and only shared with the verified campus finder.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-[#3b82f6] hover:bg-[#2563eb] active:bg-blue-700 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>{isFoundReport ? 'Submit Found Report' : 'Submit claim'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrowseItemActionModal;
