import React, { useState } from 'react';
import Login from './components/Login.jsx';
import AuthFlow from './components/AuthFlow.jsx';
import MainForm_User from './components/MainForm_User.jsx';
import AdminMainForm from './components/AdminMainForm.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

function AppContent() {
  const [currentView, setCurrentView] = useState('login');
  const {
    currentUser,
    userProfile,
    loading,
    logout,
    isAdmin,
    isPendingApproval,
    isSuspended,
    updateProfile,
  } = useAuth();

  // 1. Loading screen during session verification
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E4D8] shadow-sm flex items-center justify-center animate-pulse">
            <svg
              className="w-7 h-7 text-[#5170ff] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-bold text-[#23261F] font-heading">
              ClaimIt
            </h2>
            <p className="text-xs text-[#6E6858]">
              Verifying campus credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated views
  if (!currentUser) {
    return (
      <div className="w-full min-h-screen">
        {currentView === 'login' && (
          <Login onForgotPassword={() => setCurrentView('auth-flow')} />
        )}

        {currentView === 'auth-flow' && (
          <AuthFlow onNavigateToLogin={() => setCurrentView('login')} />
        )}
      </div>
    );
  }

  // 3. Authenticated but Suspended
  if (isSuspended) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 select-none font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-sm p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714zm0 14.036a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#23261F] font-heading mb-2">
            Account Suspended
          </h1>
          <p className="text-sm text-[#6E6858] leading-relaxed mb-6">
            Your ClaimIt account has been suspended by campus administration due to policy compliance or account review. Please visit the Office of Student Affairs for assistance.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // 4. Authenticated but Pending Approval (Faculty)
  if (isPendingApproval) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 select-none font-sans">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
            Pending Approval
          </span>
          <h1 className="text-2xl font-bold text-[#23261F] font-heading mb-2">
            Faculty Account Verification
          </h1>
          <p className="text-sm text-[#6E6858] leading-relaxed mb-6">
            Welcome, <strong className="text-[#23261F]">{userProfile?.fullName}</strong>! Your faculty registration credentials are currently awaiting review by campus administration. Once verified, full reporting and claiming capabilities will be enabled for your account.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full h-11 px-5 bg-[#5170ff] hover:bg-[#3d5cee] text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // 5. Authenticated Admin
  if (isAdmin) {
    const adminUser = {
      name: userProfile?.fullName || 'Administrator',
      email: userProfile?.email || currentUser.email,
      role: 'Admin',
      avatarUrl:
        userProfile?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    };

    return <AdminMainForm initialUser={adminUser} onLogout={logout} />;
  }

  // 6. Authenticated Student or Active Faculty
  const formattedUser = {
    name: userProfile?.fullName || currentUser.displayName || 'Campus Member',
    email: userProfile?.email || currentUser.email,
    role: userProfile?.role === 'faculty' ? 'Faculty' : 'Student',
    schoolId: userProfile?.studentId || userProfile?.facultyId || '',
    program: userProfile?.program || userProfile?.department || '',
    section: userProfile?.section || '',
    schoolYear: userProfile?.yearLevel || '2026',
    avatarUrl:
      userProfile?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  };

  const handleSaveProfile = async (formData) => {
    try {
      await updateProfile({
        fullName: formData.name,
        program: formData.program,
        section: formData.section,
        avatarUrl: formData.avatarUrl,
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleSaveAccount = async (accountData) => {
    try {
      if (accountData.newPassword) {
        await updateProfile({
          newPassword: accountData.newPassword,
        });
      }
    } catch (err) {
      console.error('Failed to update account:', err);
    }
  };

  return (
    <MainForm_User
      user={formattedUser}
      onLogout={logout}
      onSaveProfile={handleSaveProfile}
      onSaveAccount={handleSaveAccount}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
