import React, { useEffect } from 'react';
import {
  X,
  Tag,
  Clock,
  MapPin,
  Calendar,
  Shield,
  FileText,
  AlertTriangle,
  Trash2,
  Check,
  Shirt,
  Umbrella,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Glasses,
  Key,
  HelpCircle,
  Package,
} from 'lucide-react';

/**
 * Returns a suitable icon component for an item based on its category / title
 */
const getItemIcon = (category = '', title = '') => {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes('hoodie') || text.includes('shirt') || text.includes('jacket') || text.includes('cloth')) {
    return Shirt;
  }
  if (text.includes('umbrella')) {
    return Umbrella;
  }
  if (text.includes('earbud') || text.includes('airpod') || text.includes('headphone') || text.includes('audio')) {
    return Headphones;
  }
  if (text.includes('laptop') || text.includes('macbook') || text.includes('dell')) {
    return Laptop;
  }
  if (text.includes('phone') || text.includes('iphone') || text.includes('ipad') || text.includes('tablet')) {
    return Smartphone;
  }
  if (text.includes('watch')) {
    return Watch;
  }
  if (text.includes('glass')) {
    return Glasses;
  }
  if (text.includes('key')) {
    return Key;
  }
  return Package;
};

/**
 * Helper to get reporter initials (skips titles like "Dr.")
 */
const getReporterInitials = (name = '') => {
  if (!name) return '??';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Format Claims section info
 */
const getClaimsDetails = (claimsRaw = '', isResolved = false) => {
  const c = (claimsRaw || '').toLowerCase();

  if (c.includes('verified') || isResolved || c.includes('closed') || c.includes('handover')) {
    return {
      value: '1 Verified Claim',
      subLine: 'Handover Complete',
      badgeLabel: 'Claim Closed',
      badgeBg: 'bg-[#E7F8EF]',
      badgeText: 'text-[#12945A]',
    };
  }

  if (c.includes('2') || c.includes('pendings')) {
    const match = c.match(/\d+/);
    const count = match ? match[0] : '2';
    return {
      value: `${count} pendings`,
      subLine: 'Awaiting claimant review',
      badgeLabel: 'Needs Review',
      badgeBg: 'bg-[#FFF1DF]',
      badgeText: 'text-[#D9740B]',
    };
  }

  if (c.includes('1') || c.includes('pending')) {
    return {
      value: '1 pending claim',
      subLine: 'Awaiting staff confirmation',
      badgeLabel: '1 Pending',
      badgeBg: 'bg-[#FFF4D6]',
      badgeText: 'text-[#B7791F]',
    };
  }

  // Default: None
  return {
    value: 'None yet',
    subLine: '0 open student claims',
    badgeLabel: 'Available to Claim',
    badgeBg: 'bg-[#E7F8EF]',
    badgeText: 'text-[#12945A]',
  };
};

/**
 * ItemDetailsModal
 * 
 * Reusable modal popup opened by "View" on any row in the Reports table.
 * Exactly matches specification layout, typography, colors, borders, and spacing.
 */
export default function ItemDetailsModal({ item, onClose, onDeleteListing }) {
  if (!item) return null;

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isFound = (item.type || '').toLowerCase() === 'found';
  const isResolved =
    (item.status || '').toLowerCase().includes('resolved') ||
    (item.statusBadge?.label || '').toLowerCase().includes('resolved');
  const isPending =
    (item.status || '').toLowerCase().includes('pending') ||
    (item.statusBadge?.label || '').toLowerCase().includes('pending');

  const IconComponent = getItemIcon(item.category, item.itemTitle);
  const initials = item.reportedBy?.initials || getReporterInitials(item.reportedBy?.name);
  const claimsInfo = getClaimsDetails(item.claims, isResolved);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#E8ECF3] overflow-hidden text-[#111827] relative my-auto animate-in zoom-in-95 duration-150 font-['Inter',sans-serif]"
      >
        {/* ========================================================================= */}
        {/* 1. HEADER / CHIP ROW                                                      */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#EEF1F6]">
          {/* Chips on left */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Chip */}
            {isFound ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E7F8EF] text-[#12945A]">
                <span className="text-[12px] leading-none">●</span>
                <span>Found Item</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FFF1DF] text-[#D9740B]">
                <span className="text-[12px] leading-none">●</span>
                <span>Lost Item</span>
              </span>
            )}

            {/* Status Chip */}
            {isResolved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E7F8EF] text-[#12945A]">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Resolved</span>
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FFF4D6] text-[#B7791F]">
                <span className="text-[12px] leading-none">●</span>
                <span>Pending claim</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E6EEFF] text-[#2F5FE8]">
                <span className="text-[12px] leading-none">●</span>
                <span>Active Listing</span>
              </span>
            )}

            {/* Ticket Chip */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#F0F2F6] text-[#6B7280] border border-[#E8ECF3]">
              {item.ticketId}
            </span>
          </div>

          {/* Close "X" Icon on far right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="text-[#9AA3B2] hover:text-[#111827] p-1 rounded-lg hover:bg-[#F5F7FB] transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE BODY                                                           */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* 2. TITLE ROW */}
          <div className="flex items-start gap-3.5">
            {/* 48px rounded-square icon tile */}
            <div
              className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 border ${
                isFound
                  ? 'bg-[#E7F8EF] border-[#c8eed8] text-[#12945A]'
                  : 'bg-[#FFF1DF] border-[#fedcb2] text-[#D9740B]'
              }`}
            >
              <IconComponent className="w-6 h-6 stroke-[1.75]" />
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] sm:text-[22px] font-bold text-[#111827] leading-tight tracking-tight">
                {item.itemTitle}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-[#9AA3B2] shrink-0" />
                <span className="font-semibold text-[#4B5563]">{item.category}</span>
                <span className="text-[#9AA3B2]">•</span>
                <Clock className="w-3.5 h-3.5 text-[#9AA3B2] shrink-0" />
                <span>Reported {item.reportedDateSubtitle || item.date}</span>
              </div>
            </div>
          </div>

          {/* 3. INFO GRID (2 cols × 2 rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Row 1, Left: LOCATION FOUND / LOST */}
            <div className="p-3.5 bg-[#F8F9FC] rounded-[11px] border border-[#E8ECF3] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3B2]">
                    {isFound ? 'LOCATION FOUND' : 'LOCATION LOST'}
                  </span>
                </div>
                <p className="font-bold text-[#111827] text-xs leading-snug">
                  {item.locationFound || item.location}
                </p>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1.5">
                {item.locationSub || item.locationDetail || 'Reported on campus premises'}
              </p>
            </div>

            {/* Row 1, Right: DATE REPORTED */}
            <div className="p-3.5 bg-[#F8F9FC] rounded-[11px] border border-[#E8ECF3] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#2F5FE8] shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3B2]">
                    DATE REPORTED
                  </span>
                </div>
                <p className="font-bold text-[#111827] text-xs leading-snug">
                  {item.dateReportedFull || item.date}
                </p>
              </div>
              <p
                className={`text-[11px] mt-1.5 ${
                  isResolved && item.resolvedDateSub
                    ? 'text-[#12945A] font-medium'
                    : 'text-[#6B7280]'
                }`}
              >
                {item.dateReportedSub || 'Approx. recently'}
              </p>
            </div>

            {/* Row 2, Left: REPORTED BY */}
            <div className="p-3.5 bg-[#F8F9FC] rounded-[11px] border border-[#E8ECF3] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#4F46E5] text-[9px] font-bold">
                    ●
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3B2]">
                    REPORTED BY
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#3B5BDB] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[#111827] text-xs leading-tight">
                        {item.reportedBy?.name}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium bg-[#E8ECF3] text-[#6B7280]">
                        Verified
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B7280] block mt-0.5 truncate">
                      {item.reportedBy?.roleDetail || item.reportedBy?.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2, Right: CLAIMS */}
            <div className="p-3.5 bg-[#F8F9FC] rounded-[11px] border border-[#E8ECF3] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3B2]">
                    CLAIMS
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-bold text-[#111827] text-xs leading-snug">
                      {claimsInfo.value}
                    </p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {claimsInfo.subLine}
                    </p>
                  </div>
                  {/* Status Badge centered at right */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${claimsInfo.badgeBg} ${claimsInfo.badgeText}`}
                  >
                    {claimsInfo.badgeLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. DESCRIPTION CARD */}
          <div className="p-3.5 bg-white rounded-[11px] border border-[#E8ECF3] space-y-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#9AA3B2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3B2]">
                ITEM DESCRIPTION &amp; PHYSICAL CONDITION
              </span>
            </div>

            <div
              className={`p-3 bg-[#F6F7FB] rounded-[8px] text-[13px] text-[#475569] leading-relaxed italic border-l-[3px] ${
                isFound ? 'border-l-[#2F5FE8]' : 'border-l-[#F5B301]'
              }`}
            >
              &ldquo;{item.description}&rdquo;
            </div>
          </div>

          {/* 5. ADMIN MODERATION BOX */}
          <div className="p-3.5 bg-[#FFF5F5] rounded-[11px] border border-[#F8C9C9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-[#DC2626]">
                  ADMIN MODERATION &amp; LISTING CONTROLS
                </h4>
                <p className="text-[10.5px] text-[#6B7280] mt-0.5 leading-snug">
                  Remove invalid reports, duplicates, or returned property from the active campus registry.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onDeleteListing) onDeleteListing(item);
                onClose();
              }}
              className="px-3 py-1.5 rounded-full bg-white border border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors text-[11px] font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs self-end sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Listing</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. FOOTER                                                                 */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 bg-[#F8F9FC] border-t border-[#EEF1F6] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2F5FE8] hover:bg-[#254fc7] text-white text-xs font-bold rounded-[10px] transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
