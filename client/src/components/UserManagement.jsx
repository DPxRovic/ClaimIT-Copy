import React, { useState, useMemo } from 'react';

const INITIAL_ALL_USERS = [
  {
    id: 'u-1',
    name: 'Crystal Florano',
    email: 'florano.crystal@campus.edu',
    avatarBg: 'bg-[#e11d48]',
    role: 'Student',
    program: 'BS Nursing',
    section: '1st Year, Section 1C',
    status: 'Active',
    joined: 'Jul 26',
  },
  {
    id: 'u-2',
    name: 'Alyssa Cruz',
    email: 'cruz.alyssa@campus.edu',
    avatarBg: 'bg-[#ea580c]',
    role: 'Student',
    program: 'BS Education',
    section: '2nd Year, Section 2D',
    status: 'Active',
    joined: 'Aug 13',
  },
  {
    id: 'u-3',
    name: 'Aedri Mangulabnan',
    email: 'mangulaban.aedri@campus.edu',
    avatarBg: 'bg-[#9333ea]',
    role: 'Student',
    program: 'BS Psychology',
    section: '1st Year, Section 1B',
    status: 'Suspended',
    joined: 'Aug 3',
  },
  {
    id: 'u-4',
    name: 'Joshua Santiago',
    email: 'santiago.joshua@campus.edu',
    avatarBg: 'bg-[#2563eb]',
    role: 'Student',
    program: 'BS Accountancy',
    section: '2nd Year, Section 2B',
    status: 'Active',
    joined: 'Sep 01',
  },
  {
    id: 'u-5',
    name: 'Rovic Rosales',
    email: 'rosales.rovic@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Student',
    program: 'BS Computer Science',
    section: '3rd Year, Section 3B',
    status: 'Active',
    joined: 'Sep 10',
  },
  {
    id: 'u-6',
    name: 'Sam Aquino',
    email: 'aquino.sam@campus.edu',
    avatarBg: 'bg-[#4f46e5]',
    role: 'Staff',
    program: 'Campus Administration',
    section: 'Office of Student Affairs',
    status: 'Active',
    joined: 'Jun 15',
  },
  {
    id: 'u-7',
    name: 'Maria Santos',
    email: 'santos.maria@campus.edu',
    avatarBg: 'bg-[#0891b2]',
    role: 'Student',
    program: 'BS Information Technology',
    section: '2nd Year, Section 2A',
    status: 'Active',
    joined: 'Aug 22',
  },
  {
    id: 'u-8',
    name: 'Juan Dela Cruz',
    email: 'delacruz.juan@campus.edu',
    avatarBg: 'bg-[#b91c1c]',
    role: 'Student',
    program: 'BS Criminology',
    section: '4th Year, Section 4A',
    status: 'Suspended',
    joined: 'Jul 10',
  },
  {
    id: 'u-9',
    name: 'Patricia Gomez',
    email: 'gomez.patricia@campus.edu',
    avatarBg: 'bg-[#7c3aed]',
    role: 'Student',
    program: 'BA Communication',
    section: '1st Year, Section 1A',
    status: 'Active',
    joined: 'Aug 29',
  },
  {
    id: 'u-10',
    name: 'Prof. Mark Rhicky Raby',
    email: 'raby.mark@campus.edu',
    avatarBg: 'bg-[#059669]',
    role: 'Faculty',
    program: 'College of Arts and Sciences',
    section: 'Associate Professor',
    status: 'Active',
    joined: 'Sep 10',
  },
];

const INITIAL_PENDING_USERS = [
  {
    id: 'p-1',
    name: 'Dr. Miguel Aquino',
    email: 'miguel.aquino@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Nursing',
    section: 'Professor',
    status: 'Pending approval',
    joined: 'Sep 13, 2026',
    username: '@m.aquino',
  },
  {
    id: 'p-2',
    name: 'Ariana Grande',
    email: 'grande.ariana@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Engineering',
    section: 'Professor',
    status: 'Pending approval',
    joined: 'Sep 14, 2026',
    username: '@a.grande',
  },
  {
    id: 'p-3',
    name: 'Dr. Roberto Mendoza',
    email: 'mendoza.roberto@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Business',
    section: 'Assistant Professor',
    status: 'Pending approval',
    joined: 'Sep 15, 2026',
    username: '@r.mendoza',
  },
  {
    id: 'p-4',
    name: 'Engr. Teresa Lopez',
    email: 'lopez.teresa@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Engineering',
    section: 'Instructor I',
    status: 'Pending approval',
    joined: 'Sep 16, 2026',
    username: '@t.lopez',
  },
];

export default function UserManagement() {
  const [activeSubtab, setActiveSubtab] = useState('all'); // 'all' | 'pending'
  const [allUsers, setAllUsers] = useState(INITIAL_ALL_USERS);
  const [pendingUsers, setPendingUsers] = useState(INITIAL_PENDING_USERS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Manage Action Modal / Dialog state
  const [managingUser, setManagingUser] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Student');
  const [newUserProgram, setNewUserProgram] = useState('');
  const [newUserSection, setNewUserSection] = useState('');

  // Subtabs configuration matching ManageLists design cohesiveness
  const subtabs = [
    {
      id: 'all',
      label: 'All Users',
      icon: 'group',
      count: allUsers.length,
    },
    {
      id: 'pending',
      label: 'Pending Approvals',
      icon: 'hourglass_top',
      count: pendingUsers.length,
    },
  ];

  // Current active dataset
  const activeDataset = activeSubtab === 'all' ? allUsers : pendingUsers;

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return activeDataset.filter((user) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.program.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'All Roles' || user.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeDataset, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleApprovePending = (userId) => {
    const userToApprove = pendingUsers.find((u) => u.id === userId);
    if (!userToApprove) return;
    const approvedUser = {
      ...userToApprove,
      status: 'Active',
      joined: 'Today',
    };
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    setAllUsers((prev) => [approvedUser, ...prev]);
    setManagingUser(null);
  };

  const handleDeclinePending = (userId) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    setManagingUser(null);
  };

  const handleToggleUserStatus = (userId) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    setManagingUser(null);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Program / Details', 'Status', 'Joined'];
    const rows = filteredUsers.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.program} - ${u.section}"`,
      `"${u.status}"`,
      `"${u.joined}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `claimit_${activeSubtab}_users.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const initials = newUserName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newUser = {
      id: `u-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      avatarBg: 'bg-[#2563eb]',
      role: newUserRole,
      program: newUserProgram.trim() || 'General Enrollment',
      section: newUserSection.trim() || 'Section 1A',
      status: 'Active',
      joined: 'Today',
    };

    setAllUsers([newUser, ...allUsers]);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserProgram('');
    setNewUserSection('');
  };

  const getInitials = (name) => {
    const parts = name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] font-headline-lg tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-[#6E6858]">
            Manage student, faculty and staff accounts on ClaimIt.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar: Styled EXACTLY like ManageLists for full cohesiveness */}
      <div className="flex items-center justify-between border-b border-[#E8E4D8] pb-1">
        <div className="flex items-center gap-2 overflow-x-auto">
          {subtabs.map((tab) => {
            const isActive = activeSubtab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubtab(tab.id);
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'font-semibold border-b-2 border-[#5170ff] text-[#5170ff] bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.02)]'
                    : 'text-[#6E6858] hover:text-[#23261F] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? 'font-bold bg-[#5170ff] text-white'
                      : 'font-medium bg-[#E8E4D8]/60 text-[#444655]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex items-center flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#6E6858] pointer-events-none">
            search
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#23261F] placeholder-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            placeholder="Search by name, email or username"
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
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Roles Filter Dropdown */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#444655] font-medium focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
            >
              <option value="All Roles">All Roles</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Staff">Staff</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-[#6E6858] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#444655] font-medium focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending approval">Pending approval</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[18px] text-[#6E6858] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Metadata strip: Account Count and Export CSV */}
      <div className="flex items-center justify-between text-xs text-[#6E6858] font-bold tracking-wider pt-1">
        <span>{filteredUsers.length} ACCOUNTS</span>
        <button
          onClick={handleExportCSV}
          type="button"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5170ff] hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table: Unified Table Format for both All Users and Pending Approvals */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-[#6E6858] text-xs uppercase font-semibold border-b border-[#E8E4D8]">
              <tr>
                <th className="py-3.5 px-6 whitespace-nowrap">Account</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Role</th>
                <th className="py-3.5 px-6">Details</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Joined</th>
                <th className="py-3.5 px-6 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6E6858]">
                    No accounts found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#eff4ff]/40 transition-colors"
                  >
                    {/* Account: Avatar + Name + Email */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full ${user.avatarBg || 'bg-[#2563eb]'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#23261F]">
                            {user.name}
                          </span>
                          <span className="text-xs text-[#6E6858]">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role: Pill badge */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#eff4ff] text-[#5170ff] border border-[#d3e4fe]">
                        {user.role}
                      </span>
                    </td>

                    {/* Details: Program & Section / Position */}
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-[#23261F]">
                          {user.program}
                        </span>
                        <span className="text-[11px] text-[#6E6858]">{user.section}</span>
                      </div>
                    </td>

                    {/* Status: Dot badge */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {user.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : user.status === 'Suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pending approval
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-[#6E6858]">
                      {user.joined}
                    </td>

                    {/* Action: Manage button */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setManagingUser(user)}
                        className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#eff4ff] text-xs font-medium text-[#23261F] transition-colors shadow-xs cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 px-6 bg-[#eff4ff]/50 border-t border-[#E8E4D8] flex items-center justify-between text-xs text-[#6E6858]">
          <div className="font-medium">
            Showing{' '}
            <span className="font-semibold text-[#23261F]">
              {filteredUsers.length === 0
                ? '0'
                : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                    currentPage * itemsPerPage,
                    filteredUsers.length
                  )}`}
            </span>{' '}
            of <span className="font-semibold text-[#23261F]">{filteredUsers.length}</span>{' '}
            accounts
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#444655] hover:bg-[#eff4ff] transition-colors disabled:opacity-40 font-medium cursor-pointer disabled:cursor-not-allowed"
            >
              &lt; Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#5170ff] text-white font-bold shadow-xs'
                    : 'border border-[#CBD5E1] bg-white text-[#23261F] hover:bg-[#eff4ff]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#444655] hover:bg-[#eff4ff] transition-colors disabled:opacity-40 font-medium cursor-pointer disabled:cursor-not-allowed"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Manage User Modal Dialog */}
      {managingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-[#CBD5E1]/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#E2E8F0]/80 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${managingUser.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                >
                  {getInitials(managingUser.name)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a] leading-tight">
                    {managingUser.name}
                  </h3>
                  <p className="text-xs text-[#64748b]">{managingUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingUser(null)}
                className="text-[#64748b] hover:text-[#0f172a] transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Account Details Body */}
            <div className="px-6 py-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f8f9ff] p-3 rounded-xl border border-[#CBD5E1]/60">
                <div>
                  <span className="text-[#64748b] block font-medium">Role</span>
                  <span className="font-semibold text-[#0f172a] text-sm mt-0.5 inline-block">
                    {managingUser.role}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block font-medium">Status</span>
                  <span className="font-semibold text-[#0f172a] text-sm mt-0.5 inline-block">
                    {managingUser.status}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#CBD5E1]/50">
                  <span className="text-[#64748b] block font-medium">Department / Program</span>
                  <span className="font-semibold text-[#0f172a]">
                    {managingUser.program} ({managingUser.section})
                  </span>
                </div>
              </div>

              {managingUser.status === 'Pending approval' ? (
                <div className="p-3 bg-[#eff4ff] border border-[#d3e4fe] rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#5170ff] shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="text-[11px] text-[#444655] leading-relaxed">
                    Approving grants permissions to verify, log, and return items campus-wide.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-[#E2E8F0]/80 flex items-center justify-end gap-2.5 bg-white">
              <button
                type="button"
                onClick={() => setManagingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0f172a] bg-[#eff4ff] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
              >
                Close
              </button>

              {managingUser.status === 'Pending approval' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDeclinePending(managingUser.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ba1a1a] bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovePending(managingUser.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5170ff] hover:bg-[#4767f6] transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Approve account</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(managingUser.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    managingUser.status === 'Active'
                      ? 'bg-red-50 text-[#b91c1c] hover:bg-red-100 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {managingUser.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-[#CBD5E1]/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#E2E8F0]/80 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] font-headline tracking-tight">
                  Add Account
                </h2>
                <p className="text-xs text-[#64748b] mt-1">
                  Create a new student, faculty, or staff profile on ClaimIt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-[#64748b] hover:text-[#0f172a] transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateAccount}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Full Name <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Juan Dela Cruz"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Email Address <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. delacruz.juan@campus.edu"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0f172a] focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 shadow-xs cursor-pointer"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Program / Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BS Nursing"
                      value={newUserProgram}
                      onChange={(e) => setNewUserProgram(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Section / Position
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Year, Sec 1A"
                      value={newUserSection}
                      onChange={(e) => setNewUserSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#E2E8F0]/80 flex items-center justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#0f172a] bg-[#eff4ff] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#5170ff] hover:bg-[#4767f6] transition-colors shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { UserManagement };
