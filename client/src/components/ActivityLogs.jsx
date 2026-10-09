import React, { useState, useMemo } from 'react';

const INITIAL_LOGS = [
  {
    id: 1,
    timestamp: 'Sep 17, 2026 · 4:02 PM',
    actorName: 'Sam Aquino',
    actorRole: '(Admin)',
    action: 'Suspended account: Juan Dela Cruz (policy violation)',
  },
  {
    id: 2,
    timestamp: 'Sep 16, 2026 · 10:15 AM',
    actorName: 'System',
    actorRole: '',
    action: 'Report R-1042 status changed to Pending Claim',
  },
  {
    id: 3,
    timestamp: 'Sep 15, 2026 · 8:40 AM',
    actorName: 'System',
    actorRole: '',
    action: 'New registration: Joshua Santiago (Student)',
  },
  {
    id: 4,
    timestamp: 'Sep 12, 2026 · 2:30 PM',
    actorName: 'System',
    actorRole: '',
    action: 'Report R-1021 marked Resolved',
  },
  {
    id: 5,
    timestamp: 'Sep 10, 2026 · 11:05 AM',
    actorName: 'System',
    actorRole: '',
    action: 'New registration: Prof. Mark Rhicky Raby (Faculty)',
  },
  {
    id: 6,
    timestamp: 'Sep 5, 2026 · 3:47 PM',
    actorName: 'Sam Aquino',
    actorRole: '(Admin)',
    action: 'Removed listing: Old Charger Cable (R-1880, reported as duplicate)',
  },
];

export default function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 6;

  // Filter logs based on search query and actor type
  const filteredLogs = useMemo(() => {
    return INITIAL_LOGS.filter((log) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        log.actorName.toLowerCase().includes(query) ||
        log.actorRole.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.timestamp.toLowerCase().includes(query);

      const matchesActor =
        actorFilter === 'all' ||
        (actorFilter === 'admin' && log.actorRole.includes('Admin')) ||
        (actorFilter === 'system' && log.actorName === 'System');

      return matchesSearch && matchesActor;
    });
  }, [searchQuery, actorFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title & Description Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#23261F] font-headline-lg tracking-tight">
              Activity Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#5170ff] border border-[#d3e4fe]">
              System Audit
            </span>
          </div>
          <p className="text-sm text-[#6E6858]">
            Track system events, administrative changes, report updates, and user verifications across ClaimIt.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0"></div>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col gap-5">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#6E6858] pointer-events-none">
                search
              </span>
              <input
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#23261F] placeholder-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                placeholder="Search activity logs, admins, or item IDs..."
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[#6E6858] hover:text-[#23261F] text-xs font-semibold cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#444655] hover:bg-[#eff4ff] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
              >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                <span>
                  {actorFilter === 'all'
                    ? 'All Actors'
                    : actorFilter === 'admin'
                    ? 'Admin Only'
                    : 'System Only'}
                </span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white border border-[#E8E4D8] rounded-lg shadow-lg py-1 z-30 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActorFilter('all');
                      setIsFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      actorFilter === 'all'
                        ? 'bg-[#eff4ff] text-[#5170ff] font-semibold'
                        : 'text-[#444655] hover:bg-[#eff4ff]/60'
                    }`}
                  >
                    All Actors
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActorFilter('admin');
                      setIsFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      actorFilter === 'admin'
                        ? 'bg-[#eff4ff] text-[#5170ff] font-semibold'
                        : 'text-[#444655] hover:bg-[#eff4ff]/60'
                    }`}
                  >
                    Admin Actions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActorFilter('system');
                      setIsFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      actorFilter === 'system'
                        ? 'bg-[#eff4ff] text-[#5170ff] font-semibold'
                        : 'text-[#444655] hover:bg-[#eff4ff]/60'
                    }`}
                  >
                    System Events
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-[#6E6858] text-xs uppercase font-semibold border-b border-[#E8E4D8]">
                <tr>
                  <th className="py-3.5 px-6 whitespace-nowrap">Timestamp</th>
                  <th className="py-3.5 px-6 whitespace-nowrap">Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-[#6E6858]">
                      No activity logs found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#eff4ff]/40 transition-colors"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap text-[#6E6858] text-sm">
                        {log.timestamp}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap text-sm text-[#23261F]">
                        <span className="font-bold text-[#23261F]">{log.actorName}</span>{' '}
                        {log.actorRole && (
                          <span className="text-[#6E6858]">{log.actorRole}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-sm text-[#23261F]">{log.action}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="p-3.5 px-6 bg-[#eff4ff]/50 border-t border-[#E8E4D8] flex items-center justify-between text-xs text-[#6E6858]">
            <div className="font-medium">
              Showing {paginatedLogs.length} of {filteredLogs.length === INITIAL_LOGS.length ? '142' : filteredLogs.length} events
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#444655] hover:bg-[#eff4ff] transition-colors disabled:opacity-50 font-medium cursor-pointer disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-[#23261F]">{currentPage}</span>
              <button
                className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#444655] hover:bg-[#eff4ff] transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ActivityLogs };
