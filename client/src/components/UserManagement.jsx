import React, { useState, useMemo, useEffect } from 'react';
import { subscribeUsers, manageAccountStatusService } from '../firebase/admin.js';

export default function UserManagement() {
  const [activeSubtab, setActiveSubtab] = useState('all'); // 'all' | 'pending'
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Manage Action Modal / Dialog state
  const [managingUser, setManagingUser] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Student');
  const [newUserProgram, setNewUserProgram] = useState('');
  const [newUserSection, setNewUserSection] = useState('');

  // Subscribe to real users from Firestore
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeUsers({
      onUpdate: (fetchedUsers) => {
        setUsersList(fetchedUsers);
        setIsLoading(false);
      },
      onError: (err) => {
        console.warn('Failed to subscribe users:', err);
        setError(err.message || 'Permission denied or failed to load users from database.');
        setIsLoading(false);
      },
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Partition users into All vs Pending Approvals
  const allUsers = useMemo(() => {
    return usersList.filter((u) => u.status !== 'Pending approval');
  }, [usersList]);

  const pendingUsers = useMemo(() => {
    return usersList.filter((u) => u.status === 'Pending approval');
  }, [usersList]);

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
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.program && user.program.toLowerCase().includes(q));

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

  // Administrative Actions wired to Cloud Function manageAccountStatus
  const handleApprovePending = async (userId) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await manageAccountStatusService({
        targetUid: userId,
        action: 'approve_faculty',
      });
      setActionSuccessMessage(`Faculty account approved successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setManagingUser(null);
    } catch (err) {
      console.error('Failed to approve faculty:', err);
      setError(err.message || 'Failed to approve faculty account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclinePending = async (userId) => {
    setIsProcessing(true);
    setError(null);
    try {
      await manageAccountStatusService({
        targetUid: userId,
        action: 'decline_faculty',
        reason: 'Declined during administrative review',
      });
      setActionSuccessMessage(`Faculty account declined.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setManagingUser(null);
    } catch (err) {
      console.error('Failed to decline faculty:', err);
      setError(err.message || 'Failed to decline faculty account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    if (!managingUser) return;
    const isSuspending = managingUser.status === 'Active';
    setIsProcessing(true);
    setError(null);
    try {
      await manageAccountStatusService({
        targetUid: userId,
        action: isSuspending ? 'suspend_user' : 'activate_user',
        reason: isSuspending ? 'Suspended by campus administrator' : 'Reactivated by administrator',
      });
      setActionSuccessMessage(
        `Account ${isSuspending ? 'suspended' : 'activated'} successfully.`
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setManagingUser(null);
    } catch (err) {
      console.error('Failed to update account status:', err);
      setError(err.message || 'Failed to update account status.');
    } finally {
      setIsProcessing(false);
    }
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
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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

    // For manual local demo insertion
    const newUser = {
      id: `u-${Date.now()}`,
      uid: `u-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      rawRole: newUserRole.toLowerCase(),
      program: newUserProgram.trim() || 'General Enrollment',
      section: newUserSection.trim() || 'Section 1A',
      status: 'Active',
      joined: 'Today',
    };

    setUsersList((prev) => [newUser, ...prev]);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserProgram('');
    setNewUserSection('');
    setActionSuccessMessage('Account recorded.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Toast Success Message */}
      {actionSuccessMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-all">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{actionSuccessMessage}</span>
        </div>
      )}

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

      {/* Error Feedback */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex items-center gap-1 border-b border-[#E8E4D8] overflow-x-auto">
        {subtabs.map((tab) => {
          const isActive = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubtab(tab.id);
                setCurrentPage(1);
              }}
              type="button"
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#5170ff] text-[#5170ff] font-semibold'
                  : 'border-transparent text-[#6E6858] hover:text-[#23261F] hover:border-[#CBD5E1]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-[#5170ff]/10 text-[#5170ff]'
                    : 'bg-slate-100 text-[#6E6858]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#6E6858] pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search user by name, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#23261F] placeholder-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#444655] focus:outline-none focus:border-[#5170ff] cursor-pointer"
          >
            <option value="All Roles">All Roles</option>
            <option value="Student">Students</option>
            <option value="Faculty">Faculty</option>
            <option value="Admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#444655] focus:outline-none focus:border-[#5170ff] cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            {activeSubtab === 'pending' && <option value="Pending approval">Pending</option>}
          </select>
        </div>

        {/* Export CSV Button */}
        <div>
          <button
            onClick={handleExportCSV}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#444655] bg-white border border-[#CBD5E1] rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8f9ff] text-[#6E6858] text-xs uppercase font-semibold border-b border-[#E8E4D8]">
              <tr>
                <th className="py-3.5 px-6 whitespace-nowrap">User</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Role</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Program / Department</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Joined</th>
                <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6E6858]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#5170ff] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading real accounts from database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6E6858]">
                    {searchQuery || roleFilter !== 'All Roles' || statusFilter !== 'All Statuses'
                      ? 'No users match the search and filter criteria.'
                      : activeSubtab === 'pending'
                      ? 'No faculty registration requests awaiting approval.'
                      : 'No users registered yet.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f8f9ff]/70 transition-colors">
                    {/* User Profile Cell */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#5170ff] text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0f172a]">{user.name}</span>
                          <span className="text-xs text-[#64748b]">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                    </td>

                    {/* Program / Department */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-[#444655]">
                      <div>{user.program}</div>
                      {user.section && <div className="text-[11px] text-[#6E6858]">{user.section}</div>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'Pending approval'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'Active'
                              ? 'bg-emerald-500'
                              : user.status === 'Pending approval'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-xs text-[#6E6858]">
                      {user.joined}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setManagingUser(user)}
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-[#5170ff] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
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
        <div className="p-3.5 px-6 bg-[#f8f9ff] border-t border-[#E8E4D8] flex items-center justify-between text-xs text-[#6E6858]">
          <div className="font-medium">
            Showing {paginatedUsers.length} of {filteredUsers.length} accounts
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#444655] hover:bg-slate-50 transition-colors disabled:opacity-50 font-medium cursor-pointer disabled:cursor-not-allowed"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-[#23261F]">{currentPage}</span>
            <button
              className="px-2.5 py-1 rounded border border-[#CBD5E1] bg-white text-[#444655] hover:bg-slate-50 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Manage User Modal */}
      {managingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-[#CBD5E1]/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#E2E8F0]/80 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] font-headline tracking-tight">
                  Manage Account
                </h2>
                <p className="text-xs text-[#64748b] mt-1">
                  Inspect and modify permissions or account status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingUser(null)}
                className="text-[#64748b] hover:text-[#0f172a] transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-[#5170ff] text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {managingUser.avatarUrl ? (
                    <img src={managingUser.avatarUrl} alt={managingUser.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(managingUser.name)
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-[#0f172a]">{managingUser.name}</span>
                  <span className="text-xs text-[#64748b]">{managingUser.email}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800">
                      {managingUser.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        managingUser.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : managingUser.status === 'Pending approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {managingUser.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200">
                  <span className="text-[#64748b] block font-medium">Program / Dept:</span>
                  <span className="text-[#0f172a] font-semibold mt-0.5 block">{managingUser.program}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <span className="text-[#64748b] block font-medium">Section / Position:</span>
                  <span className="text-[#0f172a] font-semibold mt-0.5 block">
                    {managingUser.section || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-[#E2E8F0]/80 flex items-center justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setManagingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0f172a] bg-white border border-[#CBD5E1] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Close
              </button>

              {managingUser.status === 'Pending approval' ? (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDeclinePending(managingUser.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ba1a1a] bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Decline'}
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprovePending(managingUser.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5170ff] hover:bg-[#4767f6] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>{isProcessing ? 'Approving...' : 'Approve account'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleToggleUserStatus(managingUser.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                    managingUser.status === 'Active'
                      ? 'bg-red-50 text-[#b91c1c] hover:bg-red-100 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {isProcessing
                    ? 'Updating...'
                    : managingUser.status === 'Active'
                    ? 'Suspend Account'
                    : 'Activate Account'}
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
