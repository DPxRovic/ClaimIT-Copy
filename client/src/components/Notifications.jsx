import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Search,
  ChevronRight,
} from 'lucide-react';

/**
 * Helper to render status badges matching the claims table status color scheme:
 * - Approved: emerald-50 / emerald-700 / border emerald-200 / dot emerald-500
 * - In Review: blue-50 / blue-700 / border blue-200 / dot blue-500
 * - Pending: amber-50 / amber-700 / border amber-200 / dot amber-500
 * - Declined: rose-50 / rose-700 / border rose-200 / dot rose-500
 * - Withdrawn: slate-100 / slate-600 / border slate-200 / dot slate-400
 */
export const renderClaimStatusBadge = (status) => {
  switch (status) {
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Approved
        </span>
      );
    case 'In Review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          In Review
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case 'Declined':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Declined
        </span>
      );
    case 'Withdrawn':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Withdrawn
        </span>
      );
    default:
      if (!status) return null;
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {status}
        </span>
      );
  }
};

/**
 * Single file Notifications UI for ClaimIt
 * Sized neither too small nor too big:
 * - Width: 380px to 420px max
 * - Height: max 500px with subtle scroll
 * - Styling: clean white surfaces, soft slate borders, rounded corners (rounded-2xl),
 *   blue-600 primary accents, 12-13px typography, subtle shadow, zero heavy animation.
 *
 * @param {{
 *   notifications?: Array<any>;
 *   isOpen?: boolean;
 *   onClose?: () => void;
 *   onMarkAllAsRead?: () => void;
 *   onMarkAsRead?: (id: string) => void;
 *   onSelectClaim?: (claimId: string) => void;
 * }} props
 */
export const Notifications = ({
  notifications = [],
  onClose,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectClaim,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return item.unread;
    return true;
  });

  // Close when clicking outside of the notifications popup
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  // Determine icon & container styling based on notification
  const getIcon = (notif) => {
    if (notif.status === 'Approved') {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }
    if (notif.status === 'In Review' || notif.type === 'match_alert') {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (notif.type === 'message' || notif.title?.toLowerCase().includes('message')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (notif.status === 'Declined') {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
          <X className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4 stroke-[2]" />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full mt-2.5 w-[380px] sm:w-[410px] max-w-[calc(100vw-24px)] bg-white rounded-2xl border border-slate-200 shadow-lg z-50 overflow-hidden text-left font-sans animate-in fade-in duration-150"
      role="dialog"
      aria-label="Notifications panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-slate-900 tracking-tight">
              Notifications
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
              <span>Mark all read</span>
            </button>
          ) : (
            <span className="text-[12px] text-slate-400 font-normal px-1">
              All caught up
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Filter (All / Unread) */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              filter === 'unread'
                ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            )}
          </button>
        </div>

        <span className="text-[11px] text-slate-400">ClaimIt Updates</span>
      </div>

      {/* Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
        {filteredNotifications.length === 0 ? (
          <div className="py-10 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <Bell className="w-5 h-5 stroke-[1.75]" />
            </div>
            <p className="text-[13px] font-semibold text-slate-800">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
            <p className="text-[12px] text-slate-500 mt-1 max-w-[240px]">
              {filter === 'unread'
                ? 'You are up to date with all recent claim and item updates.'
                : 'Updates about your claims and matching campus reports will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = notif.unread;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.claimId) {
                    onSelectClaim?.(notif.claimId);
                    onClose?.();
                  }
                  if (isUnread && onMarkAsRead) {
                    onMarkAsRead(notif.id);
                  }
                }}
                className={`group p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative ${
                  isUnread
                    ? 'bg-blue-50/30 hover:bg-blue-50/50'
                    : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                {/* Left status bar for unread */}
                {isUnread && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.75 bg-blue-600 rounded-r" />
                )}

                {/* Icon */}
                {getIcon(notif)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1.5 mb-0.5">
                    <h4
                      className={`text-[13px] leading-snug line-clamp-1 ${
                        isUnread
                          ? 'font-bold text-slate-900'
                          : 'font-semibold text-slate-800'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                      {notif.time}
                    </span>
                  </div>

                  <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>

                  {/* Status Badge + Claim ID */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Render status pill if present */}
                      {notif.status && renderClaimStatusBadge(notif.status)}

                      {/* Claim ID reference */}
                      {notif.claimId && (
                        <span className="text-[11px] font-medium text-slate-500 hover:text-blue-600 flex items-center gap-0.5">
                          <span>{notif.claimId}</span>
                          <ChevronRight className="w-3 h-3 stroke-[2.2] text-slate-400" />
                        </span>
                      )}
                    </div>

                    {/* Quick Mark Read button on hover for unread items */}
                    {isUnread && (
                      <button
                        type="button"
                        title="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead?.(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-opacity cursor-pointer shrink-0"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right unread dot indicator */}
                {isUnread && (
                  <div className="shrink-0 pt-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 block" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Showing {filteredNotifications.length} of {notifications.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Notifications;
