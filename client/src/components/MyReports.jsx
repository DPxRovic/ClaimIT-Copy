import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export const DEFAULT_REPORTS = [
  {
    ticket: 'R-1070',
    title: 'Grey Foldable Umbrella',
    category: 'Others',
    type: 'FOUND',
    dateFiled: 'Sep 16, 2026',
    status: 'Active',
    claims: '—',
  },
  {
    ticket: 'R-1072',
    title: 'Silver Charm Bracelet',
    category: 'Clothing & Accessories',
    type: 'LOST',
    dateFiled: 'Sep 15, 2026',
    status: 'Pending Match',
    claims: '1 match',
  },
  {
    ticket: 'R-1042',
    title: 'Black Ray-Ban–style Wayfarer Sunglasses',
    category: 'Clothing & Accessories',
    type: 'FOUND',
    dateFiled: 'Sep 12, 2026',
    status: 'Pending Claim',
    claims: '2 claims',
  },
  {
    ticket: 'R-1039',
    title: 'Casio fx-991 Scientific Calculator',
    category: 'Books & School Supplies',
    type: 'LOST',
    dateFiled: 'Sep 10, 2026',
    status: 'Active',
    claims: '—',
  },
  {
    ticket: 'R-1021',
    title: 'Blue JanSport Backpack',
    category: 'Bags & Wallets',
    type: 'FOUND',
    dateFiled: 'Aug 29, 2026',
    status: 'Resolved',
    claims: '—',
  },
  {
    ticket: 'R-1073',
    title: 'Blue Stainless Water Bottle',
    category: 'Bags & Wallets',
    type: 'LOST',
    dateFiled: 'Aug 22, 2026',
    status: 'Resolved',
    claims: '1 match',
  },
  {
    ticket: 'R-1005',
    title: 'School ID — Juan Dela Cruz',
    category: 'IDs & Cards',
    type: 'LOST',
    dateFiled: 'Aug 15, 2026',
    status: 'Closed',
    claims: '—',
  },
  {
    ticket: 'R-1071',
    title: 'Used Chemistry Textbook',
    category: 'Books & School Supplies',
    type: 'FOUND',
    dateFiled: 'Aug 5, 2026',
    status: 'Closed',
    claims: '—',
  },
];

/**
 * @param {Object} [props]
 * @param {Array} [props.reports]
 * @param {((report: any) => void)} [props.onViewReport]
 * @param {string} [props.className]
 */
export const MyReports = ({
  reports = DEFAULT_REPORTS,
  onViewReport,
  className = '',
}) => {
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const statusOptions = [
    'All statuses',
    'Active',
    'Pending Match',
    'Pending Claim',
    'Resolved',
    'Closed',
  ];

  const filteredReports = useMemo(() => {
    if (selectedStatus === 'All statuses') {
      return reports;
    }
    return reports.filter((report) => report.status === selectedStatus);
  }, [reports, selectedStatus]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#4F46E5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" aria-hidden="true" />
            Active
          </span>
        );
      case 'Pending Match':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            Pending Match
          </span>
        );
      case 'Pending Claim':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFEDD5] text-[#9A3412]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" aria-hidden="true" />
            Pending Claim
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1D4ED8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" aria-hidden="true" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" aria-hidden="true" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const renderTypeBadge = (type) => {
    if (type === 'FOUND') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#0D6E6E] text-white">
          FOUND
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#881337] text-white">
        LOST
      </span>
    );
  };

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#23261F] font-headline tracking-tight">
            My Reports
          </h1>
          <p className="text-sm text-[#6E6858] font-headline mt-1">
            Items you&apos;ve reported as lost or found, and their current status.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-[#E8E4D8] rounded-lg text-sm text-[#23261F] hover:bg-gray-50 focus:outline-none font-headline transition-colors"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span className="text-xs sm:text-sm">{selectedStatus}</span>
              <ChevronDown className="w-4 h-4 text-[#6E6858]" aria-hidden="true" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute left-0 mt-1 w-44 bg-white border border-[#E8E4D8] rounded-lg shadow-lg py-1 z-30 font-headline"
                role="listbox"
              >
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-50 transition-colors ${
                      selectedStatus === option
                        ? 'text-[#23261F] font-semibold bg-gray-50'
                        : 'text-[#6E6858]'
                    }`}
                    role="option"
                    aria-selected={selectedStatus === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-headline">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 px-6" scope="col">
                  TICKET
                </th>
                <th className="py-3.5 px-6" scope="col">
                  ITEM
                </th>
                <th className="py-3.5 px-6" scope="col">
                  TYPE
                </th>
                <th className="py-3.5 px-6" scope="col">
                  DATE FILED
                </th>
                <th className="py-3.5 px-6" scope="col">
                  STATUS
                </th>
                <th className="py-3.5 px-6" scope="col">
                  CLAIMS
                </th>
                <th className="py-3.5 px-6 text-right" scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.ticket} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Ticket */}
                    <td className="py-4 px-6 text-[#23261F] font-sans font-medium text-xs sm:text-sm whitespace-nowrap">
                      {report.ticket}
                    </td>

                    {/* Item Title & Category */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#23261F]">{report.title}</div>
                      <div className="text-xs text-[#6E6858] mt-0.5">{report.category}</div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderTypeBadge(report.type)}
                    </td>

                    {/* Date Filed */}
                    <td className="py-4 px-6 text-[#23261F] whitespace-nowrap">
                      {report.dateFiled}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderStatusBadge(report.status)}
                    </td>

                    {/* Claims count */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {report.claims === '—' ? (
                        <span className="text-[#6E6858]">{report.claims}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-xs">
                          {report.claims}
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => onViewReport?.(report)}
                        className="inline-flex items-center justify-center px-3.5 py-1.5 border border-[#E8E4D8] rounded-lg text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        type="button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-sm text-[#6E6858]">
                    No reports found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyReports;
