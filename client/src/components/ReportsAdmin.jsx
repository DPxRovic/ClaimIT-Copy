import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Archive,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  Check,
} from 'lucide-react';
import ItemDetailsModal from './ItemDetailsModal.jsx';

/**
 * EXACT 15 ROWS OF TABLE DATA
 * Format: Ticket | Item | Category | Type | Status | Reported by | Role | Submitted | Claims
 * (Notice: NO location column in the table, exactly as in the reference screenshot)
 */
export const TABLE_DATA = [
  {
    ticketId: '#CLM-8492',
    itemTitle: 'Gray zip-up hoodie',
    category: 'Clothing & Apparel',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Paolo Dizon',
    role: 'Student',
    submitted: 'Sep 15, 2026',
    claims: 'None',
    // Fields for Item Details popup
    location: 'Bleachers, main oval',
    locationFound: 'Bleachers, main oval',
    locationSub: 'Near North Concession Stand',
    date: 'Sep 15, 2026',
    reportedDateSubtitle: 'Today, 10:24 AM',
    dateReportedFull: 'Today, Sep 15, 2026',
    dateReportedSub: 'Approx. 4 hours ago',
    description: 'Size M, gray, with a small embroidered logo on the chest. Slightly damp when found.',
  },
  {
    ticketId: '#CLM-4819',
    itemTitle: 'Clear umbrella with green trim',
    category: 'Others',
    type: 'Lost',
    status: 'Pending claim',
    reportedBy: 'Ana Reyes',
    role: 'Student',
    submitted: 'Sep 14, 2026',
    claims: '1 pending',
    location: 'Near guard house / oval walkway',
    locationFound: 'Near guard house / oval walkway',
    locationSub: 'Reported near campus gate 1',
    date: 'Sep 14, 2026',
    reportedDateSubtitle: 'Sep 14, 2026',
    dateReportedFull: 'Monday, Sep 14, 2026',
    dateReportedSub: 'Approx. 2 days ago',
    description: 'Clear folding umbrella with green trim, one rib is bent near edge. Left near the guard House / oval walkway.',
  },
  {
    ticketId: '#CLM-6631',
    itemTitle: 'Silver earbuds case',
    category: 'Electronics',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Lia Mendoza',
    role: 'Student',
    submitted: 'Sep 14, 2026',
    claims: '2 pendings',
    location: 'Cafeteria, near water station',
    locationFound: 'Cafeteria, near water station',
    locationSub: 'Main Student Commons Hall',
    date: 'Sep 14, 2026',
    reportedDateSubtitle: 'Sep 14, 2026',
    dateReportedFull: 'Sep 14, 2026',
    dateReportedSub: 'Approx. 1 day ago',
    description: 'Metallic silver earbuds case. Minor hairline scuff on the hinge. Turned over to Guard House / Campus Security Lockbox #B-04.',
  },
  {
    ticketId: '#CLM-9014',
    itemTitle: 'Sony WH-1000XM4 Noise Canceling',
    category: 'Electronics',
    type: 'Found',
    status: 'Resolved',
    reportedBy: 'Dr. Miguel Aquino',
    role: 'Faculty',
    submitted: 'Sep 12, 2026',
    claims: '1 verified',
    location: 'Library 2F, silent cubicle',
    locationFound: 'Library 2F, silent cubicle',
    locationSub: 'Near South Study Wing',
    date: 'Sep 12, 2026',
    reportedDateSubtitle: 'Sep 12, 2026',
    dateReportedFull: 'Sep 12, 2026',
    dateReportedSub: 'Resolved on Sep 13, 2026',
    resolvedDateSub: 'Resolved on Sep 13, 2026',
    description: 'Sony WH-1000XM4 black over-ear headphones with travel case. Verified via serial number match and student ID.',
  },
  {
    ticketId: '#CLM-7720',
    itemTitle: 'Navy blue backpack',
    category: 'Bags & Luggage',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Carlo Santos',
    role: 'Student',
    submitted: 'Sep 11, 2026',
    claims: 'None',
    location: 'Student Lounge 2F',
    locationFound: 'Student Lounge 2F',
    locationSub: 'Left near couches',
    date: 'Sep 11, 2026',
    reportedDateSubtitle: 'Sep 11, 2026',
    dateReportedFull: 'Sep 11, 2026',
    dateReportedSub: 'Approx. 4 days ago',
    description: 'Navy blue canvas backpack containing notebooks and pencil pouch.',
  },
  {
    ticketId: '#CLM-3358',
    itemTitle: 'Black leather wallet',
    category: 'Wallets & Cards',
    type: 'Lost',
    status: 'Pending claim',
    reportedBy: 'Maria Cruz',
    role: 'Student',
    submitted: 'Sep 11, 2026',
    claims: '1 pending',
    location: 'Cafeteria cashier line',
    locationFound: 'Cafeteria cashier line',
    locationSub: 'East Dining Area',
    date: 'Sep 11, 2026',
    reportedDateSubtitle: 'Sep 11, 2026',
    dateReportedFull: 'Sep 11, 2026',
    dateReportedSub: 'Approx. 4 days ago',
    description: 'Black bi-fold leather wallet with campus card and transit pass inside.',
  },
  {
    ticketId: '#CLM-5102',
    itemTitle: 'Student ID lanyard',
    category: 'IDs & Documents',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Joel Ramirez',
    role: 'Staff',
    submitted: 'Sep 10, 2026',
    claims: '1 pending',
    location: 'Administration Lobby',
    locationFound: 'Administration Lobby',
    locationSub: 'Visitor registration desk',
    date: 'Sep 10, 2026',
    reportedDateSubtitle: 'Sep 10, 2026',
    dateReportedFull: 'Sep 10, 2026',
    dateReportedSub: 'Approx. 5 days ago',
    description: 'Blue university lanyard with transparent ID card sleeve holder.',
  },
  {
    ticketId: '#CLM-2946',
    itemTitle: 'Casio fx-991 calculator',
    category: 'Electronics',
    type: 'Lost',
    status: 'Active',
    reportedBy: 'Kyle Bautista',
    role: 'Student',
    submitted: 'Sep 9, 2026',
    claims: 'None',
    location: 'Engineering Building Rm 204',
    locationFound: 'Engineering Building Rm 204',
    locationSub: 'Left in second row desk',
    date: 'Sep 9, 2026',
    reportedDateSubtitle: 'Sep 9, 2026',
    dateReportedFull: 'Sep 9, 2026',
    dateReportedSub: 'Approx. 6 days ago',
    description: 'Casio scientific calculator with silver hard sliding cover.',
  },
  {
    ticketId: '#CLM-8073',
    itemTitle: 'Blue water tumbler',
    category: 'Others',
    type: 'Found',
    status: 'Resolved',
    reportedBy: 'Prof. Elena Santos',
    role: 'Faculty',
    submitted: 'Sep 9, 2026',
    claims: '1 verified',
    location: 'Faculty Hall Rm 310',
    locationFound: 'Faculty Hall Rm 310',
    locationSub: 'Conference room table',
    date: 'Sep 9, 2026',
    reportedDateSubtitle: 'Sep 9, 2026',
    dateReportedFull: 'Sep 9, 2026',
    dateReportedSub: 'Resolved on Sep 10, 2026',
    resolvedDateSub: 'Resolved on Sep 10, 2026',
    description: 'Cobalt blue metallic flask with flip spout. Returned to faculty member.',
  },
  {
    ticketId: '#CLM-1685',
    itemTitle: 'House keys with red tag',
    category: 'Keys',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Ramon Villanueva',
    role: 'Staff',
    submitted: 'Sep 8, 2026',
    claims: 'None',
    location: 'Maintenance Gate B',
    locationFound: 'Maintenance Gate B',
    locationSub: 'Security checkpoint guard box',
    date: 'Sep 8, 2026',
    reportedDateSubtitle: 'Sep 8, 2026',
    dateReportedFull: 'Sep 8, 2026',
    dateReportedSub: 'Approx. 1 week ago',
    description: 'Set of two keys with red plastic label tag attached.',
  },
  {
    ticketId: '#CLM-4417',
    itemTitle: 'Prescription eyeglasses',
    category: 'Personal Items',
    type: 'Lost',
    status: 'Pending claim',
    reportedBy: 'Bea Navarro',
    role: 'Student',
    submitted: 'Sep 7, 2026',
    claims: '1 pending',
    location: 'Science Library 1F',
    locationFound: 'Science Library 1F',
    locationSub: 'Corner reading desk',
    date: 'Sep 7, 2026',
    reportedDateSubtitle: 'Sep 7, 2026',
    dateReportedFull: 'Sep 7, 2026',
    dateReportedSub: 'Approx. 8 days ago',
    description: 'Tortoiseshell frame prescription reading glasses.',
  },
  {
    ticketId: '#CLM-9261',
    itemTitle: 'White AirPods Pro',
    category: 'Electronics',
    type: 'Found',
    status: 'Resolved',
    reportedBy: 'Noel Garcia',
    role: 'Student',
    submitted: 'Sep 6, 2026',
    claims: '1 verified',
    location: 'Gymnasium Bleachers',
    locationFound: 'Gymnasium Bleachers',
    locationSub: 'Under row 4 seats',
    date: 'Sep 6, 2026',
    reportedDateSubtitle: 'Sep 6, 2026',
    dateReportedFull: 'Sep 6, 2026',
    dateReportedSub: 'Resolved on Sep 7, 2026',
    resolvedDateSub: 'Resolved on Sep 7, 2026',
    description: 'AirPods Pro charging case with earbuds inside. Returned to owner.',
  },
  {
    ticketId: '#CLM-6039',
    itemTitle: 'Green hardbound notebook',
    category: 'Books & Stationery',
    type: 'Lost',
    status: 'Active',
    reportedBy: 'Trisha Lim',
    role: 'Student',
    submitted: 'Sep 5, 2026',
    claims: 'None',
    location: 'Education Hall 102',
    locationFound: 'Education Hall 102',
    locationSub: 'Back row desk',
    date: 'Sep 5, 2026',
    reportedDateSubtitle: 'Sep 5, 2026',
    dateReportedFull: 'Sep 5, 2026',
    dateReportedSub: 'Approx. 10 days ago',
    description: 'Dark green A5 hardcover notebook with handwritten lecture notes.',
  },
  {
    ticketId: '#CLM-2874',
    itemTitle: 'Black umbrella',
    category: 'Others',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Dr. Rosa Mercado',
    role: 'Faculty',
    submitted: 'Sep 4, 2026',
    claims: '2 pendings',
    location: 'Main Amphitheater Lobby',
    locationFound: 'Main Amphitheater Lobby',
    locationSub: 'Entrance umbrella stand',
    date: 'Sep 4, 2026',
    reportedDateSubtitle: 'Sep 4, 2026',
    dateReportedFull: 'Sep 4, 2026',
    dateReportedSub: 'Approx. 11 days ago',
    description: 'Standard black automatic folding umbrella with wooden handle.',
  },
  {
    ticketId: '#CLM-5590',
    itemTitle: 'Adidas gym bag',
    category: 'Bags & Luggage',
    type: 'Lost',
    status: 'Resolved',
    reportedBy: 'Miko Tan',
    role: 'Student',
    submitted: 'Sep 2, 2026',
    claims: '1 verified',
    location: 'Swimming Pool Locker Area',
    locationFound: 'Swimming Pool Locker Area',
    locationSub: 'Men\'s locker room bench',
    date: 'Sep 2, 2026',
    reportedDateSubtitle: 'Sep 2, 2026',
    dateReportedFull: 'Sep 2, 2026',
    dateReportedSub: 'Resolved on Sep 3, 2026',
    resolvedDateSub: 'Resolved on Sep 3, 2026',
    description: 'Black and white striped Adidas duffle gym bag. Returned to owner.',
  },
];

/**
 * Orange icon: magnifier with small dot/x
 */
const MagnifierDotIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
    <circle cx="11" cy="11" r="1.5" fill="currentColor" />
  </svg>
);

export default function ReportsAdmin({
  initialUser,
  onSaveProfile,
  onSaveAccount,
  onLogout,
  onNavigate = () => {},
}) {
  const [selectedRow, setSelectedRow] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');

  // Dropdown open states
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Available categories
  const categoriesList = useMemo(() => {
    const set = new Set(TABLE_DATA.map((d) => d.category));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = TABLE_DATA.filter((item) => {
      // Search by item, location, ticket ID or reporter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.itemTitle.toLowerCase().includes(q) ||
        item.ticketId.toLowerCase().includes(q) ||
        item.reportedBy.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      // Type filter
      const matchesType =
        typeFilter === 'All' || item.type.toLowerCase() === typeFilter.toLowerCase();

      // Status filter
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && item.status.toLowerCase().includes('active')) ||
        (statusFilter === 'Pending' && item.status.toLowerCase().includes('pending')) ||
        (statusFilter === 'Resolved' && item.status.toLowerCase().includes('resolved'));

      // Category filter
      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortOrder === 'Newest') {
        return TABLE_DATA.indexOf(a) - TABLE_DATA.indexOf(b);
      }
      if (sortOrder === 'Oldest') {
        return TABLE_DATA.indexOf(b) - TABLE_DATA.indexOf(a);
      }
      if (sortOrder === 'A-Z') {
        return a.itemTitle.localeCompare(b.itemTitle);
      }
      return 0;
    });

    return result;
  }, [searchQuery, typeFilter, statusFilter, categoryFilter, sortOrder]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Ticket ID',
      'Item',
      'Category',
      'Type',
      'Status',
      'Reported By',
      'Role',
      'Submitted',
      'Claims',
    ];
    const rows = filteredData.map((d) => [
      d.ticketId,
      `"${d.itemTitle.replace(/"/g, '""')}"`,
      `"${d.category.replace(/"/g, '""')}"`,
      d.type,
      d.status,
      `"${d.reportedBy.replace(/"/g, '""')}"`,
      d.role,
      d.submitted,
      d.claims,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `claimit_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSortOrder('Newest');
  };

  const closeAllMenus = () => {
    setTypeMenuOpen(false);
    setStatusMenuOpen(false);
    setCategoryMenuOpen(false);
    setSortMenuOpen(false);
  };

  return (
    <div
      onClick={closeAllMenus}
      className="w-full flex flex-col font-['Inter',sans-serif] text-[#374151]"
    >
      {/* ========================================================================= */}
      {/* PAGE HEADER: "Items", Subtitle, "Export CSV"                              */}
      {/* ========================================================================= */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] leading-tight tracking-[-0.01em]">
            Items
          </h1>
          <p className="text-[13px] leading-[17px] text-[#6B7280] mt-1.5 max-w-[555px]">
            Every lost and found report on ClaimIt. This list is read-only. Claims
            and chats stay private between students.
          </p>
        </div>

        {/* Export CSV button: white, no border, soft shadow, radius 10px, h ~27px */}
        <button
          type="button"
          onClick={handleExportCSV}
          title="Export CSV of current reports"
          className="h-[27px] px-3 bg-white rounded-[10px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex items-center gap-1.5 text-[13px] font-bold text-[#374151] hover:bg-[#FAFBFD] transition-colors cursor-pointer shrink-0 mt-0.5 active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-[#6B7280] stroke-[1.75]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 25px gap to stat cards */}
      <div className="h-[25px]" />

      {/* ========================================================================= */}
      {/* STAT CARDS (4 columns, 13px gap, 220×117px each, radius 14px, p-17px)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[13px]">
        {/* Card 1: TOTAL POSTED */}
        <div className="h-[117px] bg-white rounded-[14px] p-[17px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[#6B7280] tracking-[0.08em] uppercase">
              TOTAL POSTED
            </span>
            <div className="w-[26px] h-[26px] rounded-[8px] bg-[#EEF1F6] flex items-center justify-center text-[#6B7280]">
              <Archive className="w-3.5 h-3.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[#0F172A] leading-none">
              9
            </span>
            <span className="text-[12px] text-[#9CA3AF]">records</span>
          </div>
          <span className="text-[12px] text-[#6B7280] leading-none">
            All lost and found reports
          </span>
        </div>

        {/* Card 2: LOST */}
        <div className="h-[117px] bg-white rounded-[14px] p-[17px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[#D97706] tracking-[0.08em] uppercase">
              LOST
            </span>
            <div className="w-[26px] h-[26px] rounded-[8px] bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <MagnifierDotIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[28px] font-bold text-[#0F172A] leading-none">
              2
            </span>
            <span className="text-[11.5px] font-semibold text-[#B45309] bg-[#FEF3C7] rounded-full px-2 py-[2px] leading-none">
              4 still open
            </span>
          </div>
          <span className="text-[12px] text-[#6B7280] leading-none">
            Missing personal belongings
          </span>
        </div>

        {/* Card 3: FOUND */}
        <div className="h-[117px] bg-white rounded-[14px] p-[17px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[#059669] tracking-[0.08em] uppercase">
              FOUND
            </span>
            <div className="w-[26px] h-[26px] rounded-[8px] bg-[#DCFCE7] flex items-center justify-center text-[#059669]">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[28px] font-bold text-[#0F172A] leading-none">
              6
            </span>
            <span className="text-[11.5px] font-semibold text-[#047857] bg-[#DCFCE7] rounded-full px-2 py-[2px] leading-none">
              8 still open
            </span>
          </div>
          <span className="text-[12px] text-[#6B7280] leading-none">
            Recovered across campus
          </span>
        </div>

        {/* Card 4: RETURNED */}
        <div className="h-[117px] bg-white rounded-[14px] p-[17px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[#475569] tracking-[0.08em] uppercase">
              RETURNED
            </span>
            <div className="w-[26px] h-[26px] rounded-[8px] bg-[#E6EEFF] flex items-center justify-center text-[#2F5FE8]">
              <ClipboardCheck className="w-3.5 h-3.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[28px] font-bold text-[#0F172A] leading-none">
              2
            </span>
            <span className="text-[11.5px] font-semibold text-[#374151] bg-[#E5E7EB] rounded-full px-2 py-[2px] leading-none">
              Marked Resolved
            </span>
          </div>
          <span className="text-[12px] text-[#6B7280] leading-none">
            Handed over to verified owner
          </span>
        </div>
      </div>

      {/* 35px gap below stat cards */}
      <div className="h-[35px]" />

      {/* ========================================================================= */}
      {/* FILTER BAR: 50px tall, radius 14px, p-10px, 7px gaps                      */}
      {/* ========================================================================= */}
      <div className="h-[50px] bg-white rounded-[14px] p-[10px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex items-center gap-[7px]">
        {/* Search input (flex-1, h-30px, bg #F3F5F9, radius 10px) */}
        <div className="flex-1 h-[30px] bg-[#F3F5F9] rounded-[10px] flex items-center px-[10px] gap-2">
          <Search className="w-4 h-4 text-[#9CA3AF] stroke-[1.75] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item, location, ticket ID or reporter…"
            className="w-full bg-transparent border-none text-[12px] text-[#0F172A] placeholder:text-[#9CA3AF] focus:outline-none"
          />
        </div>

        {/* Dropdown 1: All Types (~73px) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setTypeMenuOpen(!typeMenuOpen);
              setStatusMenuOpen(false);
              setCategoryMenuOpen(false);
              setSortMenuOpen(false);
            }}
            className="h-[30px] px-3 bg-[#F3F5F9] rounded-[10px] text-[12px] text-[#374151] flex items-center gap-1 shrink-0 hover:bg-[#ECEFF5] transition-colors cursor-pointer"
          >
            <span>{typeFilter === 'All' ? 'All Types' : typeFilter}</span>
            <ChevronDown className="w-3 h-3 text-[#9CA3AF] stroke-[1.75]" />
          </button>

          {typeMenuOpen && (
            <div className="absolute right-0 top-[34px] z-50 w-32 bg-white rounded-[10px] shadow-lg border border-[#E8ECF3] py-1 text-xs text-[#374151] animate-in fade-in duration-100">
              {['All', 'Found', 'Lost'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t);
                    setTypeMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left hover:bg-[#F3F5F9] flex items-center justify-between cursor-pointer ${
                    typeFilter === t ? 'font-semibold text-[#2F5FE8]' : ''
                  }`}
                >
                  <span>{t === 'All' ? 'All Types' : t}</span>
                  {typeFilter === t && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown 2: All Statuses (~86px) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setStatusMenuOpen(!statusMenuOpen);
              setTypeMenuOpen(false);
              setCategoryMenuOpen(false);
              setSortMenuOpen(false);
            }}
            className="h-[30px] px-3 bg-[#F3F5F9] rounded-[10px] text-[12px] text-[#374151] flex items-center gap-1 shrink-0 hover:bg-[#ECEFF5] transition-colors cursor-pointer"
          >
            <span>
              {statusFilter === 'All'
                ? 'All Statuses'
                : statusFilter === 'Pending'
                ? 'Pending claim'
                : statusFilter}
            </span>
            <ChevronDown className="w-3 h-3 text-[#9CA3AF] stroke-[1.75]" />
          </button>

          {statusMenuOpen && (
            <div className="absolute right-0 top-[34px] z-50 w-36 bg-white rounded-[10px] shadow-lg border border-[#E8ECF3] py-1 text-xs text-[#374151] animate-in fade-in duration-100">
              {['All', 'Active', 'Pending', 'Resolved'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s);
                    setStatusMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left hover:bg-[#F3F5F9] flex items-center justify-between cursor-pointer ${
                    statusFilter === s ? 'font-semibold text-[#2F5FE8]' : ''
                  }`}
                >
                  <span>
                    {s === 'All' ? 'All Statuses' : s === 'Pending' ? 'Pending claim' : s}
                  </span>
                  {statusFilter === s && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown 3: All Categories (~96px) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setCategoryMenuOpen(!categoryMenuOpen);
              setTypeMenuOpen(false);
              setStatusMenuOpen(false);
              setSortMenuOpen(false);
            }}
            className="h-[30px] px-3 bg-[#F3F5F9] rounded-[10px] text-[12px] text-[#374151] flex items-center gap-1 shrink-0 hover:bg-[#ECEFF5] transition-colors cursor-pointer"
          >
            <span>{categoryFilter === 'All' ? 'All Categories' : categoryFilter}</span>
            <ChevronDown className="w-3 h-3 text-[#9CA3AF] stroke-[1.75]" />
          </button>

          {categoryMenuOpen && (
            <div className="absolute right-0 top-[34px] z-50 w-44 bg-white rounded-[10px] shadow-lg border border-[#E8ECF3] py-1 text-xs text-[#374151] max-h-56 overflow-y-auto animate-in fade-in duration-100">
              {categoriesList.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(c);
                    setCategoryMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left hover:bg-[#F3F5F9] flex items-center justify-between cursor-pointer ${
                    categoryFilter === c ? 'font-semibold text-[#2F5FE8]' : ''
                  }`}
                >
                  <span className="truncate">{c === 'All' ? 'All Categories' : c}</span>
                  {categoryFilter === c && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown 4: Sort:Newest (~88px, interactive sorting) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setSortMenuOpen(!sortMenuOpen);
              setTypeMenuOpen(false);
              setStatusMenuOpen(false);
              setCategoryMenuOpen(false);
            }}
            className="h-[30px] px-3 bg-[#F3F5F9] rounded-[10px] text-[12px] text-[#374151] flex items-center gap-0.5 shrink-0 hover:bg-[#ECEFF5] transition-colors cursor-pointer"
          >
            <span className="text-[#9CA3AF]">Sort:</span>
            <span className="text-[#0F172A] font-medium">{sortOrder}</span>
            <ChevronDown className="w-3 h-3 text-[#9CA3AF] stroke-[1.75] ml-0.5" />
          </button>

          {sortMenuOpen && (
            <div className="absolute right-0 top-[34px] z-50 w-32 bg-white rounded-[10px] shadow-lg border border-[#E8ECF3] py-1 text-xs text-[#374151] animate-in fade-in duration-100">
              {['Newest', 'Oldest', 'A-Z'].map((order) => (
                <button
                  key={order}
                  type="button"
                  onClick={() => {
                    setSortOrder(order);
                    setSortMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left hover:bg-[#F3F5F9] flex items-center justify-between cursor-pointer ${
                    sortOrder === order ? 'font-semibold text-[#2F5FE8]' : ''
                  }`}
                >
                  <span>{order}</span>
                  {sortOrder === order && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 24px gap below filter bar */}
      <div className="h-[24px]" />

      {/* ========================================================================= */}
      {/* TABLE CARD: White, radius 14px, shadow, full width                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] overflow-hidden">
        {/* Card Header: 47px tall, px-20px */}
        <div className="h-[47px] px-[20px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase text-[#374151]">
              {filteredData.length === 15 ? '15 ITEMS' : `${filteredData.length} ITEMS`}
            </span>
            <span className="w-[5px] h-[5px] rounded-full bg-[#CBD5E1]" />
            <span className="text-[12px] text-[#9CA3AF]">
              Campus Registry Sync
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[12px] font-medium text-[#2F5FE8] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Column Header Row & Table (Exact 8 data columns + leading empty space, NO LOCATION COLUMN) */}
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: '8.4%' }} />
              <col style={{ width: '9.5%' }} />
              <col style={{ width: '17.5%' }} />
              <col style={{ width: '7.7%' }} />
              <col style={{ width: '12.4%' }} />
              <col style={{ width: '11.5%' }} />
              <col style={{ width: '9.7%' }} />
              <col style={{ width: '10.1%' }} />
              <col style={{ width: '13.2%' }} />
            </colgroup>

            <thead>
              <tr className="h-[51px] bg-[#F7F9FC] text-[10.5px] font-bold uppercase text-[#475569] tracking-[0.08em]">
                {/* Empty leading space */}
                <th className="p-0" />
                <th className="py-2 pr-2">
                  <div>TICKET</div>
                  <div>ID</div>
                </th>
                <th className="py-2 pr-2">ITEM</th>
                <th className="py-2 pr-2">TYPE</th>
                <th className="py-2 pr-2">STATUS</th>
                <th className="py-2 pr-2">REPORTED BY</th>
                <th className="py-2 pr-2">SUBMITTED</th>
                <th className="py-2 pr-2">CLAIMS</th>
                <th className="py-2 pr-4">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[#9CA3AF]">
                    No matching reports found. Click "Reset Filters" to show all.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isFound = row.type === 'Found';
                  const isResolved = row.status === 'Resolved';
                  const isPending = row.status === 'Pending claim';

                  return (
                    <tr
                      key={row.ticketId}
                      className="min-h-[63px] border-b border-[#F0F2F6] hover:bg-[#FAFBFD] transition-colors"
                    >
                      {/* Empty leading space */}
                      <td className="p-0" />

                      {/* Ticket ID: monospace, 11.5px, #2F5FE8, breaks after hyphen */}
                      <td className="py-3 pr-2 align-middle font-mono text-[11.5px] text-[#2F5FE8] leading-tight">
                        <div>#CLM-</div>
                        <div>{row.ticketId.replace('#CLM-', '')}</div>
                      </td>

                      {/* Item: title (13px semi-bold #0F172A) + category (11.5px #9CA3AF) */}
                      <td className="py-3 pr-2 align-middle">
                        <div className="text-[13px] font-semibold text-[#0F172A] leading-snug">
                          {row.itemTitle}
                        </div>
                        <div className="text-[11.5px] text-[#9CA3AF] leading-tight mt-0.5">
                          {row.category}
                        </div>
                      </td>

                      {/* Type: pill radius 6px, 12px semi-bold, px-2 py-0.5 */}
                      <td className="py-3 pr-2 align-middle">
                        <span
                          className={`inline-block rounded-[6px] px-2 py-[2px] text-[12px] font-semibold leading-none ${
                            isFound
                              ? 'bg-[#E7F8EF] text-[#047857]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>

                      {/* Status: fully rounded pill with 6px dot on left */}
                      <td className="py-3 pr-2 align-middle">
                        <span
                          className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[3px] text-[12px] font-medium leading-none ${
                            isResolved
                              ? 'bg-[#DCFCE7] text-[#16A34A]'
                              : isPending
                              ? 'bg-[#FEF3C7] text-[#D97706]'
                              : 'bg-[#EAF0FF] text-[#2F5FE8]'
                          }`}
                        >
                          <span
                            className={`w-[6px] h-[6px] rounded-full shrink-0 ${
                              isResolved
                                ? 'bg-[#16A34A]'
                                : isPending
                                ? 'bg-[#D97706]'
                                : 'bg-[#2F5FE8]'
                            }`}
                          />
                          <span>{row.status}</span>
                        </span>
                      </td>

                      {/* Reported By: name (13px semi-bold #0F172A) + role (11.5px #9CA3AF) */}
                      <td className="py-3 pr-2 align-middle">
                        <div className="text-[13px] font-semibold text-[#0F172A] leading-snug">
                          {row.reportedBy}
                        </div>
                        <div className="text-[11.5px] text-[#9CA3AF] leading-tight mt-0.5">
                          {row.role}
                        </div>
                      </td>

                      {/* Submitted: 13px #6B7280 */}
                      <td className="py-3 pr-2 align-middle text-[13px] text-[#6B7280] leading-snug">
                        {row.submitted}
                      </td>

                      {/* Claims: None is plain gray text; others are pills */}
                      <td className="py-3 pr-2 align-middle">
                        {row.claims === 'None' ? (
                          <span className="text-[13px] text-[#9CA3AF]">None</span>
                        ) : (
                          <span
                            className={`inline-block rounded-[6px] px-2 py-[3px] text-[12px] font-medium leading-tight ${
                              row.claims === '1 verified'
                                ? 'bg-[#DCFCE7] text-[#16A34A]'
                                : row.claims === '2 pendings'
                                ? 'bg-[#E6EEFF] text-[#2F5FE8]'
                                : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}
                          >
                            {row.claims}
                          </span>
                        )}
                      </td>

                      {/* Actions: View button (bg #EEF1F6, radius 8px, 13px medium #374151) */}
                      <td className="py-3 pr-4 align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(row)}
                          className="h-[26px] px-4 rounded-[8px] bg-[#EEF1F6] hover:bg-[#E2E6EE] text-[13px] font-medium text-[#374151] transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trailing space for below-the-fold feel */}
      <div className="h-12" />

      {/* Item Details Modal */}
      {selectedRow && (
        <ItemDetailsModal
          item={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
