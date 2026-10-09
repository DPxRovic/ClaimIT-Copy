import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, SlidersHorizontal, CheckCircle, X } from 'lucide-react';
import ItemCard from './ItemCard.jsx';
import { BrowseItemDetailsModal } from './BrowseItemDetailsModal.jsx';
import { BrowseItemActionModal } from './BrowseItemActionModal.jsx';

export const DEFAULT_BROWSE_ITEMS = [
  {
    id: 'airpods-pro-2',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Sep 09, 2026',
    location: 'Congress Campus - Library',
    reportedTime: 'Reported 2 days ago',
    postedBy: 'Hannah Puerta (BS Computer Science)',
    description: 'White apple AirPods Pro with scratches.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC_O6MmcQqb46ZGcyzeTfXUwjVOrcA7pt-7KkZ4WHcZdRPV7BZmYaaYd6mtsib7Sc6PZVjQGxu46ep5UehnPK10IavovbjmraJxe04mEOIPuQmCE6uPsEjssyArCGewkghdRPgbVII2ykI6a_n-9lkrEE458d3HGJAYOwGIOtU_Stv4dDE5uLL3YiKWreMnUdg1N5-VsDRVQPLfWys_sSuTWOJE7hyn7CaBvbVjRoC1oS9ZdKzcIJSUQ',
    imageAlt: 'Apple AirPods Pro second generation with charging case',
  },
  {
    id: 'black-leather-wallet',
    title: 'Black Leather Bifold Wallet',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Aug 29, 2026',
    location: 'Bagong Silang Campus – Canteen',
    reportedTime: 'Reported 1 week ago',
    postedBy: 'Paolo Dizon (BS Accountancy)',
    description: 'LV wallet. Please describe the items inside if you think this is yours.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCERDryOxxsewZHFZ_peWEfmLuoB7SbV9hy38LnUH474HsCCoEuZ9ZDjve1FiMPevRhRTK7ahcTnnv4IsidvjPNcYBUZZZo5dM8E7mdJow1mWJELVDrnJqf1ZT4Dv_xxlFWGYZlN18DOyhSS0JHxgONQcm4R2auBx8PCf5GiSthmZbISrgkx3SRnbv4S6mMRexNIX4pAINlXOODJRmeIiOOJB1TXfjZ8NCRe2Escodacliycd7CDSlLNQ',
    imageAlt: 'Black grain leather bifold wallet',
  },
  {
    id: 'hydro-flask-32oz',
    title: 'Hydro Flask 32oz Navy',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Science Hall 104',
    reportedTime: 'Reported 3 days ago',
    postedBy: 'Marcus Vance (BS Biology)',
    description: 'Navy blue 32oz Hydro Flask with stainless steel loop cap. Minimal scuffs along bottom rim.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6tWbpguWrLQHmnQ5US7mPJsyaDaf1i1EtLNKM3N4SjSDL3GLeAwfJpAysAbXwT298AAVjM2m92xTZLqKMma1MaheYWENk6gglSc7ijOOAUY-CpIzLOk8NTedsZf2NX86uhT8oxy3k-Ar1RGkKAm53vMmMzRFNogKRF36lolbxkc8r4yKOkyHKeBvsvI0F73tb1EZTitfZPqBU57cGYthS87ANF3LRCHEsYKW2HZFk6zd_PQiX1-8g8w',
    imageAlt: 'Navy Hydro Flask bottle outdoors with climbing gear',
  },
  {
    id: 'keys-campus-lanyard',
    title: 'Keys with Red Campus Lanyard',
    category: 'KEYS & ACCESSORIES',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Rec Center Lockers',
    reportedTime: 'Reported 3 days ago',
    postedBy: 'Coach Ramirez (Athletics Dept)',
    description: 'Ring with 3 brass door keys and campus red strap. Has a small metallic whistle attached.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2pQgqAU8FBvHs78Vmf5dmzkB1BAGM-MYGXLH2Hgt_DbzhwdKIzHbTr6f7BYypkR0gI56j_BNeU6LD74vor4EwrCWRhCGz3H9ZgQaJJ-2AciSYE1zJhQSGezfdvwEPfPfuJO8ps7hCtTp7aBVZRDF0hECAP1gV9m1ix5yg76FBcegCvp84ANyJmitk0vtyakOAnvCmaGJHGFZzq1CIANoTkyl-0NPjmOeoPEGzMXV0uZnXX9osJDFnNw',
    imageAlt: 'Keys with red campus strap and fob',
  },
  {
    id: 'calculus-textbook-9th',
    title: 'Calculus: Early Transcendentals 9th Ed',
    category: 'BOOKS & STUDY MATERIAL',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 23, 2025',
    location: 'Math & Science Bldg',
    reportedTime: 'Reported 4 days ago',
    postedBy: 'Chloe Chen (BS Mathematics)',
    description: 'Hardcover Stewart Calculus 9th edition. Several sticky notes inside chapters 4 through 6.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-Q3IfZLJhrRk6SOdTvaKWt6ivPBXqkdK-2Ta6b2L0nuRL4JklkwR8Lu391niFdb2tAv4M7qemA5EiICfGNJ0bDgxqhpoYZ8QcLQNLsoiD862lol907_uXvKMQwz5o4FptAd01exC7K2j8wJj2ocJVYgvGDtQftNHARCy3MzR4fNQtnQbbeXNYet6UpxdBv_4i9bZ6jOwEPBL3rEo9cMZzawOwoUsJZCzqAxRHmDfAXaqN4gLux79_g',
    imageAlt: 'Calculus Early Transcendentals textbook',
  },
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Headphones',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 23, 2025',
    location: 'Library 3rd Floor',
    reportedTime: 'Reported 4 days ago',
    postedBy: 'David Kim (BS Mechanical Engineering)',
    description: 'Matte black Sony wireless noise cancelling headphones in matching zippered case with USB-C cable.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAULVMR8fNlyLIUxx6WBrHNN37i0AAoEgfKDzyZ4HzdND1KTUJQLMYemtvoTxX_D_AwQirC6i782wPmpEbP23267Tmy2QNS6eBkt6iu8algEnZ7DFuod_5fMMdWkBDMpkKiImiaKgmW0pJmr7WyHb9Rq_1aW0Q9bYrON4oqYm5j-U8Oq7XBGSEDV-GhjLBdIKE9NSmdaq2wUU5JuHWdKzYcZNP5qccx39s42-2tuw9i8nRHOchGui4bA',
    imageAlt: 'Matte black Sony wireless headphones',
  },
  {
    id: 'north-face-jacket',
    title: 'North Face Resolve Rain Jacket',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 21, 2025',
    location: 'Student Union Info Desk',
    reportedTime: 'Reported 6 days ago',
    postedBy: 'Samantha Lee (BA Communications)',
    description: 'Black waterproof North Face hooded jacket, medium size, left on dining booth seat.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRW-pbjHLqbjbsOXuj2JlZ34t2e5cnXaNiUSjMOV7BWQQ2i7zX3WNyd_LpVsstX0_UDd0nRzbSX1nXEPqSW4LeiV0TDpCKDaLdSUhdPdP6bmCG2MoVCuEulSSVPhjllFvMiK6s97F9lGz4nkZHvd8GdLuttc_e8IW1bataFbBGA-8VchgG9jnmRZiXsjzo9tMnjF3WKEbR1odgkWhhIIWpKb7CdsTvu2rTGWHNFtgfQJtcH3xNv_EvwA',
    imageAlt: 'North Face hooded rain jacket',
  },
  {
    id: 'hp-laptop-charger',
    title: 'HP 65W USB-C Laptop Charger',
    category: 'ELECTRONICS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 20, 2025',
    location: 'Engineering Hall 204',
    reportedTime: 'Reported 1 week ago',
    postedBy: 'Prof. Santos (College of Engineering)',
    description: 'Black HP 65W USB-C power block charger left plugged in near lecture lectern.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeousHM6qo8qNrC8f44Uo50n7WOJKJsBqKrMGzOJ_n4abz4dUg5knGGDNKCgM7FiT38jekNjbYF62J1XfOmRCw1FkJbHnFu7-J5P6pIJndaXR_GoFpAODhfWAVVUCwqBN0oReOS9hrQ7g3Zsq2Hv4qRbIzJCIu7EkliaKGSy_loIq1acZppOEr8F3qXQrxnshh32Zk2aKrtUoOlkISpm3WfqzoxX0sx7gJ-QMJmohAiwGs6Fcs4Yj9Fg',
    imageAlt: 'Black HP laptop power adapter charger',
  },
  {
    id: 'campus-onecard-sarah',
    title: 'Campus OneCard ID (Sarah M.)',
    category: 'IDS & CARDS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 19, 2025',
    location: 'Dining Commons Register 2',
    reportedTime: 'Reported Oct 19',
    postedBy: 'Dining Commons Staff',
    description: 'Student campus identification card in transparent lanyard sleeve.',
    imageUrl:
      'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'University student identification OneCard held in lanyard',
  },
  {
    id: 'ti-84-calculator',
    title: 'TI-84 Plus CE Graphing Calculator',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 19, 2025',
    location: 'Engineering Hall 110',
    reportedTime: 'Reported Oct 19',
    postedBy: 'Alex Rivera (BS Civil Engineering)',
    description: 'Black TI-84 Plus CE graphing calculator with initials AR etched on back slide case.',
    imageUrl:
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Black TI-84 Plus CE graphing calculator on grid notebook paper',
  },
  {
    id: 'tortoise-sunglasses',
    title: 'Tortoise Shell Sunglasses',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 18, 2025',
    location: 'North Quad Courtyard',
    reportedTime: 'Reported Oct 18',
    postedBy: 'Campus Grounds Crew',
    description: 'Round tortoise shell sunglasses found on concrete bench near courtyard oak tree.',
    imageUrl:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Tortoise shell sunglasses resting on boulder stone',
  },
  {
    id: 'fjallraven-backpack',
    title: 'Fjallraven Kanken Ochre Backpack',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 18, 2025',
    location: 'Rec Center Gym Area',
    reportedTime: 'Reported Oct 18',
    postedBy: 'Mia Torres (BS Nursing)',
    description: 'Ochre yellow Fjallraven daypack backpack with two campus enamel pins on front pocket.',
    imageUrl:
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Ochre yellow Fjallraven Kanken square daypack backpack',
  },
];

/**
 * @param {Object} [props]
 * @param {Array} [props.items]
 * @param {((item: any) => void)} [props.onItemClick]
 * @param {(() => void)} [props.onNavigateToClaims]
 * @param {string} [props.className]
 */
export const BrowseItems = ({
  items = DEFAULT_BROWSE_ITEMS,
  onItemClick,
  onNavigateToClaims,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [activeItemDetails, setActiveItemDetails] = useState(null);
  const [actionModalConfig, setActionModalConfig] = useState(null); // { item, mode: 'claim' | 'found_report' }
  const [notification, setNotification] = useState(null); // { id, title, description, ticketId }

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.category)));
    return ['ALL', ...list];
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (item) => item.category.toUpperCase() === selectedCategory.toUpperCase()
      );
    }

    // Type filter (LOST / FOUND)
    if (selectedType !== 'ALL') {
      result = result.filter((item) => item.type === selectedType);
    }

    // Sort order
    if (sortBy === 'NEWEST') {
      // Items are listed newest first by default in dataset
    } else if (sortBy === 'OLDEST') {
      result.reverse();
    } else if (sortBy === 'TITLE_ASC') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [items, searchQuery, selectedCategory, selectedType, sortBy]);

  const totalItemsCount = 48; // Preserved nominal total from original campus directory design

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
        <div className="text-xs text-slate-500 pt-0.5 font-normal">
          Showing <span className="font-semibold text-slate-700">{filteredItems.length}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalItemsCount}</span> items
        </div>
      </div>

      {/* Grid of Item Cards using reusable ItemCard */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-slate-700 font-medium text-sm">No items match your filter criteria.</p>
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
        </div>
      )}

      {/* Bottom Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-2 text-xs text-slate-500">
        <div>
          Showing listings 1–{filteredItems.length} of {totalItemsCount} items across 4 campuses
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

          {[1, 2, 3, 4].map((page) => (
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
            onClick={() => setCurrentPage((p) => Math.min(4, p + 1))}
            disabled={currentPage === 4}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
          >
            Next ›
          </button>
        </div>
      </div>

      {/* 1. Item Details Modal (Image 1 & Image 3) */}
      {activeItemDetails && (
        <BrowseItemDetailsModal
          isOpen={Boolean(activeItemDetails)}
          item={activeItemDetails}
          onClose={() => setActiveItemDetails(null)}
          onOpenAction={handleOpenAction}
        />
      )}

      {/* 2. Action Form Modal (Image 2 & Image 4) */}
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
