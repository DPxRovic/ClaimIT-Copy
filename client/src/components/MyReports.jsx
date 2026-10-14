import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import ReportDetailsModal from './ReportDetailsModal.jsx';
import ClaimMatchVerificationModal from './ClaimMatchVerificationModal.jsx';
import CloseThisReportModal from './CloseThisReportModal.jsx';
import { closeReportService } from '../firebase/reports.js';

export const DEFAULT_REPORTS = [
  {
    ticket: 'R-1070',
    title: 'Grey Foldable Umbrella',
    category: 'Others',
    type: 'FOUND',
    dateFiled: 'Sep 16, 2026',
    status: 'Active',
    claims: '—',
    location: 'Main Building Lobby',
    description: 'Found a grey foldable umbrella with a wooden handle near the entrance.',
    imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=80',
    entries: [],
  },
  {
    ticket: 'R-1072',
    title: 'Silver Charm Bracelet',
    category: 'Clothing & Accessories',
    type: 'LOST',
    dateFiled: 'Sep 15, 2026',
    status: 'Pending Match',
    claims: '1 match',
    location: 'Gymnasium Bleachers',
    description: 'Lost my silver chain bracelet with 3 charms (star, heart, moon).',
    imageUrl: 'https://images.unsplash.com/photo-1611591475870-070df16bfe64?auto=format&fit=crop&w=600&q=80',
    entriesType: 'matches',
    entries: [
      {
        id: 'M-301',
        type: 'match',
        isMatch: true,
        name: 'Maria Santos',
        submitterName: 'Maria Santos',
        role: 'Reported Found',
        date: 'Sep 15, 6:30 PM',
        submittedDate: 'Sep 15, 6:30 PM',
        status: 'Pending',
        imageUrl: 'https://images.unsplash.com/photo-1611591475870-070df16bfe64?auto=format&fit=crop&w=600&q=80',
        message: 'I found a silver bracelet matching this description near the bench.',
        messagePreview: 'I found a silver bracelet matching this description near the bench.',
        messages: [
          {
            id: 'm1',
            senderName: 'Maria Santos',
            timestamp: 'Sep 15, 6:35 PM',
            text: 'Hello! I found a silver bracelet with 3 charms by bleacher #4 after volleyball practice.',
            isCurrentUser: false,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1042',
    title: 'Black Ray-Ban–style Wayfarer Sunglasses',
    category: 'Clothing & Accessories',
    type: 'FOUND',
    dateFiled: 'Sep 12, 2026',
    status: 'Pending Claim',
    claims: '2 claims',
    location: 'University Library - 2nd Floor',
    description: 'Black classic style sunglasses found on table #14 in the quiet study area.',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    entriesType: 'claims',
    entries: [
      {
        id: 'C-512',
        type: 'claim',
        isMatch: false,
        name: 'Joshua Santiago',
        submitterName: 'Joshua Santiago',
        role: 'Claimant',
        date: 'Sep 15, 2026',
        submittedDate: 'Sep 15, 2026',
        status: 'Pending',
        imageUrl: null, // "No photo attached" state
        message:
          'Mine has a tiny chip on the bottom left corner of the frame and came with a brown case,...',
        messagePreview:
          'Mine has a tiny chip on the bottom left corner of the frame and came with a brown case,...',
        messages: [
          {
            id: 'm-512-1',
            senderName: 'Joshua Santiago',
            timestamp: 'Sep 15, 9:12 AM',
            text:
              'Hey, I lost sunglasses around the library too — mine has a tiny chip on the bottom left corner of the frame. Was there a brown case nearby?.',
            isCurrentUser: false,
          },
        ],
      },
      {
        id: 'C-513',
        type: 'claim',
        isMatch: false,
        name: 'Alex Rivera',
        submitterName: 'Alex Rivera',
        role: 'Claimant',
        date: 'Sep 14, 2026',
        submittedDate: 'Sep 14, 2026',
        status: 'Pending',
        imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80',
        message: 'Black sunglasses with polarized lenses left on the desk.',
        messagePreview: 'Black sunglasses with polarized lenses left on the desk.',
        messages: [
          {
            id: 'm-513-1',
            senderName: 'Alex Rivera',
            timestamp: 'Sep 14, 3:20 PM',
            text: 'Hi! I left my black sunglasses there during my afternoon study session.',
            isCurrentUser: false,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1039',
    title: 'Casio fx-991 Scientific Calculator',
    category: 'Books & School Supplies',
    type: 'LOST',
    dateFiled: 'Sep 10, 2026',
    status: 'Active',
    claims: '—',
    location: 'Engineering Building Room 302',
    description: 'Black and silver scientific calculator with my initials (JD) carved inside the cover.',
    entries: [],
  },
  {
    ticket: 'R-1021',
    title: 'Blue JanSport Backpack',
    category: 'Bags & Wallets',
    type: 'FOUND',
    dateFiled: 'Aug 29, 2026',
    status: 'Resolved',
    claims: '1 claim',
    location: 'Student Activity Center',
    description: 'Navy blue JanSport backpack with a grey bottom patch.',
    entriesType: 'claims',
    entries: [
      {
        id: 'C-480',
        type: 'claim',
        isMatch: false,
        submitterName: 'Mark Gonzales',
        submittedDate: 'Aug 30, 11:15 AM',
        status: 'Approved',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
        messagePreview: 'Contains notebooks and a blue spiral binder.',
        isClosed: true,
        messages: [
          {
            id: 'm-480-1',
            senderName: 'Mark Gonzales',
            timestamp: 'Aug 30, 11:20 AM',
            text: 'Hello, I left my blue JanSport backpack in the student lounge yesterday.',
            isCurrentUser: false,
          },
          {
            id: 'm-480-2',
            senderName: 'You',
            timestamp: 'Aug 30, 1:45 PM',
            text: 'Verified! All items inside match your description. Meet me at SAC security desk.',
            isCurrentUser: true,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1073',
    title: 'Blue Stainless Water Bottle',
    category: 'Bags & Wallets',
    type: 'LOST',
    dateFiled: 'Aug 22, 2026',
    status: 'Resolved',
    claims: '1 match',
    location: 'Covered Court',
    description: 'Blue steel insulated bottle with UCC organization sticker and small dent on bottom.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    entriesType: 'matches',
    entries: [
      {
        id: 'C-495',
        type: 'match',
        isMatch: true,
        name: 'Crystal Florano',
        submitterName: 'Crystal Florano',
        role: 'Reported Found',
        date: 'Aug 22, 5:02 PM',
        submittedDate: 'Aug 22, 5:02 PM',
        status: 'Approved',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80',
        message:
          'Found a blue steel water bottle at the Covered Court, dent on the bottom, UCC org sticker on...',
        messagePreview:
          'Found a blue steel water bottle at the Covered Court, dent on the bottom, UCC org sticker on...',
        isClosed: true,
        messages: [
          {
            id: 'm-495-1',
            senderName: 'Crystal Florano',
            timestamp: 'Aug 22, 5:10 PM',
            text:
              'Hi, I think I found your water bottle at the Covered Court — blue, dented bottom, UCC sticker.',
            isCurrentUser: false,
          },
          {
            id: 'm-495-2',
            senderName: 'You',
            timestamp: 'Aug 22, 6:10 PM',
            text:
              'That sounds exactly like mine! Thank you so much — approving this. Would you mind if we switch to Messenger so we can arrange the meetup details more easily?',
            isCurrentUser: true,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1005',
    title: 'School ID — Juan Dela Cruz',
    category: 'IDs & Cards',
    type: 'LOST',
    dateFiled: 'Aug 15, 2026',
    status: 'Closed',
    claims: '—',
    location: 'Cafeteria cashier',
    description: 'Lost ID card in transparent plastic case with blue lanyard.',
    entries: [],
  },
  {
    ticket: 'R-1071',
    title: 'Used Chemistry Textbook',
    category: 'Books & School Supplies',
    type: 'FOUND',
    dateFiled: 'Aug 5, 2026',
    status: 'Closed',
    claims: '—',
    location: 'Science Lab 101',
    description: 'Organic Chemistry 9th Edition hardcover book found on front counter.',
    entries: [],
  },
];

/**
 * MyReports Component with built-in modal verification flow
 */
export const MyReports = ({
  reports: propReports,
  userReports = [],
  className = '',
}) => {
  const initialData = useMemo(() => {
    if (propReports) return propReports;
    return [...userReports, ...DEFAULT_REPORTS];
  }, [propReports, userReports]);

  const [reportList, setReportList] = useState(initialData);
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modal Flow States
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reportToClose, setReportToClose] = useState(null);

  useEffect(() => {
    if (propReports) {
      setReportList(propReports);
    } else {
      setReportList([...userReports, ...DEFAULT_REPORTS]);
    }
  }, [propReports, userReports]);

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
      return reportList;
    }
    return reportList.filter((report) => report.status === selectedStatus);
  }, [reportList, selectedStatus]);

  const handleOpenReport = (report) => {
    setSelectedReport(report);
  };

  const handleOpenVerification = (entry) => {
    if (!selectedReport) return;

    setSelectedVerification({
      id: entry.id,
      type: entry.type || (selectedReport.type === 'LOST' ? 'match' : 'claim'),
      itemTitle: selectedReport.title,
      reportTicket: selectedReport.ticket,
      submitterName: entry.name || entry.submitterName,
      submittedDate: entry.date || entry.submittedDate,
      status: entry.status || 'Pending',
      imageUrl: entry.imageUrl,
      messagePreview: entry.message || entry.messagePreview,
      messages: entry.messages || [],
      isClosed: entry.isClosed,
    });
  };

  const handleApprove = (ver) => {
    alert(`Approved ${ver.type === 'match' ? 'Match' : 'Claim'} ${ver.id} for ${ver.submitterName}!`);
    setSelectedVerification((prev) => (prev ? { ...prev, status: 'Approved', isClosed: true } : null));
  };

  const handleDecline = (ver) => {
    alert(`Declined ${ver.type === 'match' ? 'Match' : 'Claim'} ${ver.id}.`);
    setSelectedVerification((prev) => (prev ? { ...prev, status: 'Declined', isClosed: true } : null));
  };

  const handleSendMessage = (text) => {
    console.log('Sending message to conversation:', text);
  };

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
              className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-[#E8E4D8] rounded-lg text-sm text-[#23261F] hover:bg-gray-50 focus:outline-none font-headline transition-colors cursor-pointer"
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
                    className={`w-full text-left px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
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
                        onClick={() => handleOpenReport(report)}
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

      {/* ================= MODAL CONNECTIONS ================= */}

      {/* 1. Report Details Modal */}
      <ReportDetailsModal
        isOpen={Boolean(selectedReport) && !selectedVerification && !reportToClose}
        report={selectedReport}
        canCloseReport={selectedReport?.status === 'Active'}
        onCloseReport={(rep) => setReportToClose(rep)}
        onClose={() => setSelectedReport(null)}
        onViewClaimOrMatch={handleOpenVerification}
      />

      {/* 2. Claim / Match Verification Modal */}
      <ClaimMatchVerificationModal
        isOpen={Boolean(selectedVerification)}
        verification={selectedVerification}
        onClose={() => {
          setSelectedVerification(null);
          setSelectedReport(null);
        }}
        onBack={() => {
          // Returning back to ReportDetailsModal
          setSelectedVerification(null);
        }}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onSendMessage={handleSendMessage}
        onInspectDetails={(ver) => {
          alert(`Inspecting full submission details for ${ver.id} (${ver.submitterName})`);
        }}
      />

      {/* 3. Close This Report Modal */}
      <CloseThisReportModal
        isOpen={Boolean(reportToClose)}
        report={reportToClose}
        itemTitle={reportToClose?.title || reportToClose?.itemName}
        ticket={reportToClose?.ticket || reportToClose?.ticketNumber}
        onCancel={() => setReportToClose(null)}
        onConfirm={async (rep) => {
          const reportId = rep?.ticket || rep?.id || reportToClose?.ticket || reportToClose?.id;
          try {
            await closeReportService(reportId);
            setReportList((prev) =>
              prev.map((r) =>
                r.ticket === reportId || r.id === reportId ? { ...r, status: 'Closed' } : r
              )
            );
            if (selectedReport && (selectedReport.ticket === reportId || selectedReport.id === reportId)) {
              setSelectedReport((prev) => (prev ? { ...prev, status: 'Closed' } : null));
            }
          } catch (err) {
            console.error('Failed to close report:', err);
          } finally {
            setReportToClose(null);
          }
        }}
      />
    </div>
  );
};

export default MyReports;
