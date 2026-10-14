import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ChevronDown, SlidersHorizontal, CheckCircle, X, AlertCircle, RefreshCw } from 'lucide-react';
import ItemCard from './ItemCard.jsx';
import { BrowseItemDetailsModal } from './BrowseItemDetailsModal.jsx';
import { BrowseItemActionModal } from './BrowseItemActionModal.jsx';
import { fetchBrowseReports } from '../firebase/reports.js';

/**
 * Campus Directory (Browse Items) Component
 *
 * Connects to Cloud Firestore to retrieve, filter, and paginate real campus reports.
 * Includes text search over title, category, location, and description.
 * Displays clean loading, error, and empty states without silently falling back to mock data.
 *
 * @param {Object} [props]
 * @param {Array} [props.items] - Optional controlled items override (e.g. for unit tests)
 * @param {((item: any) => void)} [props.onItemClick]
 * @param {(() => void)} [props.onNavigateToClaims]
 * @param {string} [props.className]
 */
export const BrowseItems = ({
  items: propItems,
  onItemClick,
  onNavigateToClaims,
  className = '',
}) => {
  const [rawItems, setRawItems] = useState(propItems || []);
  const [isLoading, setIsLoading] = useState(!propItems);
  const [errorMessage, setErrorMessage] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [activeItemDetails, setActiveItemDetails] = useState(null);
  const [actionModalConfig, setActionModalConfig] = useState(null); // { item, mode: 'claim' | 'found_report' }
  const [notification, setNotification] = useState(null); // { id, title, description, ticketId }

  // Load real reports from Firestore when propItems is not provided
  const loadReports = useCallback(async () => {
    if (propItems) {
      setRawItems(propItems);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchBrowseReports({
        category: selectedCategory,
        type: selectedType,
        sortBy,
        pageSize: 100, // Fetch active listings for catalog browsing
      });
      setRawItems(response.items || []);
    } catch (err) {
      console.error('[BrowseItems] Failed to fetch reports:', err);
      setErrorMessage(err.message || 'Unable to connect to campus listings. Please try again.');
      setRawItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [propItems, selectedCategory, selectedType, sortBy]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Extract unique categories dynamically from database results
  const categories = useMemo(() => {
    const defaultCategories = [
      'ELECTRONICS',
      'PERSONAL ITEMS',
      'KEYS & ACCESSORIES',
      'BOOKS & STUDY MATERIAL',
      'APPAREL & BAGS',
      'IDS & CARDS',
    ];
    const itemCategories = rawItems.map((i) => (i.category || '').toUpperCase()).filter(Boolean);
    const combined = Array.from(new Set([...defaultCategories, ...itemCategories]));
    return ['ALL', ...combined];
  }, [rawItems]);

  // Filter and sort items client-side
  const filteredItems = useMemo(() => {
    let result = [...rawItems];

    // Keyword search filter (substring match across title, category, location, and description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.ticket && item.ticket.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (item) => (item.category || '').toUpperCase() === selectedCategory.toUpperCase()
      );
    }

    // Type filter (LOST / FOUND)
    if (selectedType !== 'ALL') {
      result = result.filter((item) => item.type === selectedType);
    }

    // Sort order
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'OLDEST') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'TITLE_ASC') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [rawItems, searchQuery, selectedCategory, selectedType, sortBy]);

  // Paginated items for current page view
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handle card click
  const handleCardClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
    setActiveItemDetails(item);
  };

  // Switch from details modal to action modal (Claim or Found Report)
  const handleOpenAction = (item, actionType) => {
    setActiveItemDetails(null);
    setActionModalConfig({ item, mode: actionType });
  };

  // Submit action modal -> trigger success toast notification
  const handleActionSuccess = (submissionData) => {
    setActionModalConfig(null);
    const isFoundReport = submissionData?.mode === 'found_report';
    const ticketId = submissionData?.ticketId || (isFoundReport ? '#FND-5912' : '#CLM-8492');
    const title = submissionData?.item?.title || 'item';
    setNotification({
      id: Date.now(),
      title: isFoundReport ? 'Report submitted successfully!' : 'Claim submitted successfully!',
      description: isFoundReport
        ? `Found report logged for "${title}" (${ticketId})`
        : `Claim verification submitted for "${title}" (${ticketId})`,
      ticketId,
    });
  };

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Page Title & Eyebrow Header */}
      <div className="flex flex-col">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] mb-1 block">
          CAMPUS DIRECTORY • EXPLORE LISTINGS
        </span>
        <h1 className="font-headline text-[32px] sm:text-[36px] font-bold text-slate-900 tracking-tight leading-tight">
          Browse Items
        </h1>
        <p className="text-[15px] sm:text-[16px] text-slate-600 max-w-2xl leading-relaxed mt-1">
          Find lost belongings or report items found across campus. Filter by type, category,
          building, and date to reconnect with your valuables.
        </p>
      </div>

      {/* Search and Filters Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
        {/* Full-width Search Input */}
        <div className="relative w-full">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search listings by keywords (e.g., AirPods, Hydro Flask, Student ID, North Face jacket)..."
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
          />
        </div>

        {/* Filters and Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5">
          {/* Category Dropdown */}
          <div className="relative inline-block">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full sm:w-auto bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 pr-9 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] cursor-pointer transition-all"
            >
              <option value="ALL">All Categories</option>
              {categories
                .filter((c) => c !== 'ALL')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Type Dropdown (LOST / FOUND) */}
          <div className="relative inline-block">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full sm:w-auto bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 pr-9 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] cursor-pointer transition-all"
            >
              <option value="ALL">All Types</option>
              <option value="LOST">Lost Only</option>
              <option value="FOUND">Found Only</option>
            </select>
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative inline-block">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full sm:w-auto bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 pr-9 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] cursor-pointer transition-all"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="TITLE_ASC">Alphabetical (A-Z)</option>
            </select>
            <SlidersHorizontal
              className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Showing Items Count indicator */}
        <div className="text-xs text-slate-500 pt-0.5 font-normal flex items-center justify-between">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredItems.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{rawItems.length}</span> active listings
          </div>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing with campus database...
            </span>
          )}
        </div>
      </div>

      {/* Error State Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={loadReports}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && rawItems.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-3 animate-pulse shadow-xs"
            >
              <div className="w-full h-44 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mt-1" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        /* Grid of Item Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-slate-700 font-medium text-sm">
            {searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL'
              ? 'No items match your filter criteria.'
              : 'No active reports filed in the campus directory yet.'}
          </p>
          {(searchQuery || selectedCategory !== 'ALL' || selectedType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedType('ALL');
              }}
              className="text-xs text-[#2563eb] hover:underline font-semibold mt-1 cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Bottom Pagination */}
      {filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-2 text-xs text-slate-500">
          <div>
            Showing listings {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
            >
              ‹ Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* 1. Item Details Modal */}
      {activeItemDetails && (
        <BrowseItemDetailsModal
          isOpen={Boolean(activeItemDetails)}
          item={activeItemDetails}
          onClose={() => setActiveItemDetails(null)}
          onOpenAction={handleOpenAction}
        />
      )}

      {/* 2. Action Form Modal */}
      {actionModalConfig && (
        <BrowseItemActionModal
          isOpen={Boolean(actionModalConfig)}
          item={actionModalConfig.item}
          mode={actionModalConfig.mode}
          onClose={() => setActionModalConfig(null)}
          onSubmitSuccess={handleActionSuccess}
        />
      )}

      {/* Clean Success Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-slate-800 text-left animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-sm sm:max-w-md"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-sm font-semibold text-white leading-tight">
              {notification.title}
            </p>
            <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">
              {notification.description}
            </p>
            {onNavigateToClaims && (
              <button
                type="button"
                onClick={() => {
                  setNotification(null);
                  onNavigateToClaims();
                }}
                className="inline-block mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                Track in My Claims →
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0 -mr-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseItems;
