import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  IdCard,
  Ban,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import AdminAccountModals from './AdminAccountModals.jsx';
import AddAccountModal from './AddAccountModal.jsx';

/**
 * Initial Mock Data for Admin Dashboard Accounts
 * Matching Image 1 & Image 2 specifications:
 * Total: 10 accounts (7 Students, 2 Faculty, 1 Suspended)
 * With 1 Faculty pending approval initially.
 */
export const INITIAL_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Dr. Miguel Aquino',
    email: 'miguel.aquino@campus.edu',
    username: 'm.aquino',
    idNumber: '#FAC-2026-8812',
    role: 'Faculty',
    department: 'College of Nursing',
    position: 'Professor',
    campus: 'Congress Campus',
    status: 'Pending approval',
    joined: 'Sep 13, 2026',
    initials: 'MA',
    avatarColor: '#0d9488',
    stats: {
      reports: 0,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
  {
    id: 'acc-2',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@campus.edu',
    username: 'e.rostova',
    idNumber: '#FAC-2026-7241',
    role: 'Faculty',
    department: 'College of Arts & Sciences',
    position: 'Associate Professor',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 10, 2026',
    initials: 'ER',
    avatarColor: '#0284c7',
    stats: {
      reports: 2,
      claims: 1,
      resolved: 1,
      chats: 3,
    },
  },
  {
    id: 'acc-3',
    name: 'Hannah Puerta',
    email: 'hannah.puerta@campus.edu',
    username: 'h.puerta',
    idNumber: '#STU-2024-4912',
    role: 'Students',
    department: 'BS Computer Science',
    position: '3rd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 09, 2026',
    initials: 'HP',
    avatarColor: '#7c3aed',
    stats: {
      reports: 3,
      claims: 2,
      resolved: 2,
      chats: 4,
    },
  },
  {
    id: 'acc-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@campus.edu',
    username: 'm.vance',
    idNumber: '#STU-2025-6321',
    role: 'Students',
    department: 'BS Information Technology',
    position: '2nd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 08, 2026',
    initials: 'MV',
    avatarColor: '#2563eb',
    stats: {
      reports: 1,
      claims: 0,
      resolved: 0,
      chats: 1,
    },
  },
  {
    id: 'acc-5',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@campus.edu',
    username: 's.jenkins',
    idNumber: '#STU-2026-9041',
    role: 'Students',
    department: 'BA Psychology',
    position: '1st Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 06, 2026',
    initials: 'SJ',
    avatarColor: '#db2777',
    stats: {
      reports: 1,
      claims: 1,
      resolved: 0,
      chats: 2,
    },
  },
  {
    id: 'acc-6',
    name: 'Joshua Kim',
    email: 'joshua.kim@campus.edu',
    username: 'j.kim',
    idNumber: '#STU-2023-3108',
    role: 'Students',
    department: 'BS Business Administration',
    position: '4th Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Suspended',
    joined: 'Aug 28, 2026',
    initials: 'JK',
    avatarColor: '#dc2626',
    stats: {
      reports: 0,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
  {
    id: 'acc-7',
    name: 'Chloe Morales',
    email: 'chloe.morales@campus.edu',
    username: 'c.morales',
    idNumber: '#STU-2025-1192',
    role: 'Students',
    department: 'BS Nursing',
    position: '2nd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 02, 2026',
    initials: 'CM',
    avatarColor: '#059669',
    stats: {
      reports: 2,
      claims: 1,
      resolved: 1,
      chats: 1,
    },
  },
  {
    id: 'acc-8',
    name: 'David Chen',
    email: 'david.chen@campus.edu',
    username: 'd.chen',
    idNumber: '#STU-2024-8714',
    role: 'Students',
    department: 'BS Mechanical Engineering',
    position: '3rd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 01, 2026',
    initials: 'DC',
    avatarColor: '#4f46e5',
    stats: {
      reports: 0,
      claims: 1,
      resolved: 0,
      chats: 1,
    },
  },
  {
    id: 'acc-9',
    name: 'Mia Santos',
    email: 'mia.santos@campus.edu',
    username: 'm.santos',
    idNumber: '#STU-2026-4421',
    role: 'Students',
    department: 'BS Architecture',
    position: '1st Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Aug 30, 2026',
    initials: 'MS',
    avatarColor: '#ea580c',
    stats: {
      reports: 1,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
  {
    id: 'acc-10',
    name: 'Arthur Pendelton',
    email: 'arthur.pendelton@campus.edu',
    username: 'a.pendelton',
    idNumber: '#STU-2024-5510',
    role: 'Students',
    department: 'BS Civil Engineering',
    position: '3rd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Aug 25, 2026',
    initials: 'AP',
    avatarColor: '#0891b2',
    stats: {
      reports: 0,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
];

import { subscribeUsers, manageAccountStatusService } from '../firebase/admin.js';

const ITEMS_PER_PAGE = 4;

export default function Dashboard({
  initialUser,
  onSaveProfile,
  onSaveAccount,
  onLogout,
  onNavigate = () => {},
}) {
  // Master state for accounts
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal flow state
  // type can be: 'manage' | 'decline' | 'approved' | 'declined' | null
  const [modalState, setModalState] = useState(null);

  // Add Account modal state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Subscribe to real users from Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeUsers({
      onUpdate: (fetchedUsers) => {
        if (fetchedUsers && fetchedUsers.length > 0) {
          const mapped = fetchedUsers.map((u, idx) => {
            const role = u.role === 'Faculty' ? 'Faculty' : 'Students';
            const initials = u.name
              ? u.name
                  .replace(/Dr\.|Prof\.|Engr\./g, '')
                  .trim()
                  .split(' ')
                  .filter(Boolean)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'U';

            const colors = ['#0d9488', '#0284c7', '#7c3aed', '#2563eb', '#db2777', '#059669', '#4f46e5', '#ea580c', '#0891b2'];
            const avatarColor = colors[idx % colors.length];

            return {
              id: u.uid || u.id,
              name: u.name,
              email: u.email,
              username: u.email ? u.email.split('@')[0] : 'user',
              idNumber: u.schoolId || `#ID-${u.id.slice(0, 6)}`,
              role,
              department: u.program || 'Campus Member',
              position: u.section || (role === 'Faculty' ? 'Professor' : 'Undergraduate'),
              campus: 'Congress Campus',
              status: u.status || 'Active',
              joined: u.joined || 'Recently',
              initials,
              avatarColor,
              stats: {
                reports: 0,
                claims: 0,
                resolved: 0,
                chats: 0,
              },
            };
          });
          setAccounts(mapped);
        }
        setIsLoading(false);
      },
      onError: (err) => {
        console.warn('Dashboard subscribeUsers error:', err);
        setIsLoading(false);
      },
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Calculate live statistics
  const stats = useMemo(() => {
    const total = accounts.length;
    const students = accounts.filter((a) => a.role === 'Students' || a.role === 'Student').length;
    const faculty = accounts.filter((a) => a.role === 'Faculty').length;
    const awaitingFaculty = accounts.filter(
      (a) => a.role === 'Faculty' && a.status === 'Pending approval'
    ).length;
    const suspended = accounts.filter((a) => a.status === 'Suspended').length;

    return {
      total,
      students,
      faculty,
      awaitingFaculty,
      suspended,
    };
  }, [accounts]);

  // Filter accounts based on search query and dropdown selections
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        (acc.username && acc.username.toLowerCase().includes(q));

      const matchesRole =
        selectedRole === 'All Roles' || acc.role === selectedRole;

      const matchesStatus =
        selectedStatus === 'All Statuses' || acc.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, selectedRole, selectedStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAccounts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  // Modal Handlers (Step-by-step according to specifications)

  // 1. Click "Manage" on a row -> opens type 'manage'
  const handleOpenManage = (account) => {
    setModalState({
      type: 'manage',
      account,
    });
  };

  // 2. In 'manage', "Approve account" -> invoke manageAccountStatus, open 'approved'
  const handleApproveAccount = async (accountToApprove) => {
    try {
      await manageAccountStatusService({
        targetUid: accountToApprove.id,
        action: 'approve_faculty',
      });
    } catch (err) {
      console.warn('Dashboard approve faculty error:', err);
    }

    const updatedAccount = {
      ...accountToApprove,
      status: 'Active',
    };

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountToApprove.id ? updatedAccount : acc))
    );

    setModalState({
      type: 'approved',
      account: updatedAccount,
    });
  };

  // 3. In 'manage', "Decline request" -> open 'decline'
  const handleDeclineRequest = (account) => {
    setModalState({
      type: 'decline',
      account,
    });
  };

  // 4. In 'decline', "Cancel" -> back to 'manage'
  const handleCancelDecline = () => {
    if (modalState?.account) {
      setModalState({
        type: 'manage',
        account: modalState.account,
      });
    } else {
      setModalState(null);
    }
  };

  // 5. In 'decline', "Decline Account" -> invoke manageAccountStatus, open 'declined'
  const handleConfirmDecline = async ({ account, reason, note }) => {
    try {
      await manageAccountStatusService({
        targetUid: account.id,
        action: 'decline_faculty',
        reason: reason || note || 'Declined from Dashboard',
      });
    } catch (err) {
      console.warn('Dashboard decline faculty error:', err);
    }

    const updatedAccount = {
      ...account,
      status: 'Declined',
      declinedReason: reason,
      declinedNote: note,
    };

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === account.id ? updatedAccount : acc))
    );

    setModalState({
      type: 'declined',
      account: updatedAccount,
      reason,
    });
  };

  // 6. Close modal on X or Done
  const handleCloseModal = () => {
    setModalState(null);
  };

  // 7. "View Activity Log" -> close modal, then call onNavigate('activity-logs')
  const handleViewActivityLog = () => {
    setModalState(null);
    onNavigate('activity-logs');
  };

  // Add Account submission handler from AddAccountModal
  const handleAddAccount = (payload) => {
    const isStudent = payload.type === 'student';
    const initials = payload.name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

    const username = payload.email.split('@')[0];
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const newAcc = {
      id: `acc-${Date.now()}`,
      refNo: isStudent
        ? payload.schoolId
        : payload.facultyId,
      idNumber: isStudent ? payload.schoolId : payload.facultyId,
      name: payload.name,
      email: payload.email,
      username,
      role: isStudent ? 'Students' : 'Faculty',
      department: isStudent ? payload.program : payload.department,
      position: isStudent
        ? `${payload.yearLevel}, Section ${payload.section}`
        : '',
      campus: 'Congress Campus',
      status: isStudent ? 'Active' : 'Pending approval',
      joined: todayFormatted,
      joinedAt: new Date().toISOString(),
      initials,
      avatarColor: isStudent ? '#7c3aed' : '#0d9488',
      reportsFiled: 0,
      claimsSubmitted: 0,
      claimsResolved: 0,
      activeChats: 0,
      stats: {
        reports: 0,
        claims: 0,
        resolved: 0,
        chats: 0,
      },
    };

    setAccounts((prev) => [newAcc, ...prev]);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Role',
      'Department',
      'Position',
      'Status',
      'Joined',
    ];
    const rows = filteredAccounts.map((a) => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.role}"`,
      `"${a.department || ''}"`,
      `"${a.position || ''}"`,
      `"${a.status}"`,
      `"${a.joined}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `claimit_accounts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header: Dashboard Title, Subtitle & Add Account button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">
            Dashboard
          </h1>
          <p className="text-xs text-[#6E6858] mt-1">
            Manage student, faculty and staff accounts on ClaimIt.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5170ff] hover:bg-[#4361ee] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* 4 Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* Card 1: Total accounts */}
        <div className="bg-white rounded-2xl border border-[#E8E4D8]/80 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-extrabold text-[#0b1c30]">
              {stats.total}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#3b82f6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold text-[#0b1c30]">Total accounts</h3>
            <p className="text-[11px] text-[#6E6858] mt-0.5">
              Everyone on ClaimIt
            </p>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="bg-white rounded-2xl border border-[#E8E4D8]/80 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-extrabold text-[#0b1c30]">
              {stats.students}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#f3f0ff] text-[#7c3aed] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold text-[#0b1c30]">Students</h3>
            <p className="text-[11px] text-[#6E6858] mt-0.5">Student accounts</p>
          </div>
        </div>

        {/* Card 3: Faculty */}
        <div className="bg-white rounded-2xl border border-[#E8E4D8]/80 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-extrabold text-[#0b1c30]">
              {stats.faculty}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#fff1f2] text-[#e11d48] flex items-center justify-center shrink-0">
              <IdCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold text-[#0b1c30]">Faculty</h3>
            {stats.awaitingFaculty > 0 ? (
              <p className="text-[11px] text-[#dc2626] font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
                {stats.awaitingFaculty} awaiting approval
              </p>
            ) : (
              <p className="text-[11px] text-[#16a34a] font-semibold mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                All approved
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Suspended */}
        <div className="bg-white rounded-2xl border border-[#E8E4D8]/80 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-extrabold text-[#0b1c30]">
              {stats.suspended}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold text-[#0b1c30]">Suspended</h3>
            <p className="text-[11px] text-[#dc2626] font-medium mt-0.5">
              Cannot log in
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email or username"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/20 focus:border-[#5170ff] transition-all shadow-2xs"
          />
        </div>

        {/* Role select */}
        <div className="sm:w-44">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/20 focus:border-[#5170ff] shadow-2xs cursor-pointer"
          >
            <option value="All Roles">All Roles</option>
            <option value="Students">Students</option>
            <option value="Faculty">Faculty</option>
          </select>
        </div>

        {/* Status select */}
        <div className="sm:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/20 focus:border-[#5170ff] shadow-2xs cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Pending approval">Pending approval</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Section Header: MOST RECENT & Export CSV */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          MOST RECENT
        </span>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5170ff] hover:text-[#4361ee] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1]/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 tracking-wider uppercase min-w-[220px]">
                  ACCOUNT
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 tracking-wider uppercase min-w-[100px]">
                  ROLE
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 tracking-wider uppercase min-w-[180px]">
                  DETAILS
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 tracking-wider uppercase min-w-[150px]">
                  STATUS
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 tracking-wider uppercase min-w-[110px]">
                  JOINED
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 tracking-wider uppercase text-right min-w-[90px]">
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((account) => {
                  const roleStyle =
                    account.role === 'Faculty'
                      ? 'text-[#2563eb] bg-[#eff6ff]'
                      : 'text-[#7c3aed] bg-[#f5f3ff]';

                  const isPending = account.status === 'Pending approval';
                  const isActive = account.status === 'Active';
                  const isSuspended = account.status === 'Suspended';
                  const isDeclined = account.status === 'Declined';

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Account: Avatar, Name, Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
                            style={{ backgroundColor: account.avatarColor || '#0d9488' }}
                          >
                            {account.initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#0b1c30] truncate">
                              {account.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {account.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${roleStyle}`}
                        >
                          {account.role}
                        </span>
                      </td>

                      {/* Details: College & Position */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-xs font-medium text-slate-800 truncate">
                            {account.department}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {account.position}
                          </p>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-4 px-6">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50/90 text-[#dc2626] border border-rose-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
                            Pending approval
                          </span>
                        )}

                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#059669] border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                            Active
                          </span>
                        )}

                        {isSuspended && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-[#dc2626] border border-red-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                            Suspended
                          </span>
                        )}

                        {isDeclined && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Declined
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {account.joined}
                      </td>

                      {/* Action: Manage Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenManage(account)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="py-3.5 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <span className="text-xs text-slate-400">
            Showing{' '}
            {filteredAccounts.length === 0
              ? '0'
              : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredAccounts.length
                )}`}{' '}
            of {filteredAccounts.length} accounts
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              &lt; Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#5170ff] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Admin Popups (Reusable modal component for manage, decline, approved, declined) */}
      <AdminAccountModals
        modalState={modalState}
        onClose={handleCloseModal}
        onApprove={handleApproveAccount}
        onDeclineRequest={handleDeclineRequest}
        onCancelDecline={handleCancelDecline}
        onConfirmDecline={handleConfirmDecline}
        onViewActivityLog={handleViewActivityLog}
      />

      {/* Reusable Add Account / Registration Modal */}
      <AddAccountModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddAccount}
      />
    </div>
  );
}
