import React, {
  useState,
  useRef,
  useEffect,
  lazy,
  Suspense,
} from 'react';

import ReportItemModal from './ReportItemModal.jsx';
import { UserProfileModal } from './UserProfileModal.jsx';
import LogoutConfirmation from './LogoutConfirmation.jsx';

import HomePage from './Home.jsx';

// Load other pages only when needed.
const BrowseItems = lazy(() => import('./BrowseItems.jsx'));
const MyReports = lazy(() => import('./MyReports.jsx'));
const MyClaims = lazy(() => import('./MyClaims.jsx'));
const ProfileSettings = lazy(() => import('./ProfileSettings.jsx'));

/**
 * MainForm_User layout component for ClaimIt
 *
 * Main layout shell consisting of Navbar, main content container, and Footer.
 * Handles navigation between user pages and modal interactions.
 */

export default function MainForm_User({
  onNavigate,
  onReportItem,
  onProfileSettings,
  onLogout,
  user,
}) {
  // Home is the default page.
  const [currentTab, setCurrentTab] = useState('home');

  const [imageError, setImageError] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] =
    useState(false);

  const profileRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'browse-items', label: 'Browse Items' },
    { id: 'my-reports', label: 'My Reports' },
    { id: 'my-claims', label: 'My Claims' },
  ];

  // Close profile dropdown when clicking outside.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setIsProfileModalOpen(false);
      }
    };

    if (isProfileModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileModalOpen]);

  // Handle navbar navigation.
  const handleTabClick = (e, path) => {
    e.preventDefault();

    setCurrentTab(path);

    if (onNavigate) {
      onNavigate(path);
    }
  };

  // Open Report Item modal.
  const handleReportItemClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsReportModalOpen(true);

    if (onReportItem) {
      onReportItem();
    }
  };

  const handleCloseModal = () => {
    setIsReportModalOpen(false);
  };

  const handleModalSubmit = (payload) => {
    console.log('Report submitted successfully:', payload);
    setIsReportModalOpen(false);
  };

  // Open Profile & Settings page.
  const handleProfileSettings = () => {
    setIsProfileModalOpen(false);
    setCurrentTab('profile-settings');

    if (onProfileSettings) {
      onProfileSettings();
    }
  };

  // Open Logout Confirmation instead of immediately logging out.
  const handleLogout = () => {
    setIsProfileModalOpen(false);
    setIsLogoutConfirmationOpen(true);
  };

  // Cancel logout.
  const handleCancelLogout = () => {
    setIsLogoutConfirmationOpen(false);
  };

  // Confirm logout.
  const handleConfirmLogout = () => {
    setIsLogoutConfirmationOpen(false);

    if (onLogout) {
      onLogout();
    }
  };

  // Navigate from Home to Browse Items.
  const handleBrowseAllClick = () => {
    setCurrentTab('browse-items');

    if (onNavigate) {
      onNavigate('browse-items');
    }
  };

  // Loading fallback for lazy-loaded pages.
  const PageLoading = ({ label }) => (
    <div className="w-full flex items-center justify-center py-20">
      <p className="text-sm text-slate-500">
        Loading {label}...
      </p>
    </div>
  );

  // Render the selected page.
  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomePage
            onBrowseAllClick={handleBrowseAllClick}
          />
        );

      case 'browse-items':
        return (
          <Suspense fallback={<PageLoading label="Browse Items" />}>
            <BrowseItems />
          </Suspense>
        );

      case 'my-reports':
        return (
          <Suspense fallback={<PageLoading label="My Reports" />}>
            <MyReports />
          </Suspense>
        );

      case 'my-claims':
        return (
          <Suspense fallback={<PageLoading label="My Claims" />}>
            <MyClaims />
          </Suspense>
        );

      case 'profile-settings':
        return (
          <Suspense
            fallback={
              <PageLoading label="Profile & Settings" />
            }
          >
            <ProfileSettings />
          </Suspense>
        );

      default:
        return (
          <HomePage
            onBrowseAllClick={handleBrowseAllClick}
          />
        );
    }
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] antialiased flex flex-col min-h-screen font-sans relative">

      {/* =========================
          HEADER / NAVBAR
      ========================== */}
      <header className="w-full backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] bg-white border-b border-[#dce9ff] shrink-0 z-10">

        <div
          className="h-16 max-w-7xl mx-auto flex items-center justify-between"
          style={{
            paddingLeft: '22px',
            paddingRight: '22px',
          }}
        >

          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">

            {/* Logo */}
            <a
              className="flex items-center focus:outline-none shrink-0"
              data-path="home"
              href="#home"
              onClick={(e) => handleTabClick(e, 'home')}
            >
              {!imageError ? (
                <img
                  alt="ClaimIt Logo"
                  className="h-8 w-auto object-contain select-none"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNd2kKAy611ZAiDZzEnrENDlpP2SNj5UKDlhXChAJBo8X9ZmQUkGURH1GTMgj5294lZZOORyDc9ff9Bp7adnyJDAKUOTBtM8z3PM34Ggk_wJZeVsLlOQnoGSCt5HaT8MBN3KBMaaPnm-erb8lE84t6g8i03uARXSyrAwTKflKbzM2uEoW_Yb29LqoV2fDSlcpM-F2AbPqn5Nau2bv0XJx95TY1D0NWceGcTK07E3mDLgiHWM7baKGrv44T2Sjm0F896js"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center text-[26px] font-extrabold tracking-tight select-none">

                  <span className="relative flex items-center justify-center mr-0.5">
                    <svg
                      className="w-6 h-6 text-[#0b1c30]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />

                      <line
                        x1="21"
                        y1="21"
                        x2="16.65"
                        y2="16.65"
                        strokeWidth="3"
                      />
                    </svg>
                  </span>

                  <span className="text-[#0b1c30] -ml-3 pl-3 font-heading">
                    laim
                  </span>

                  <span className="text-[#5170ff] font-heading">
                    it
                  </span>

                </div>
              )}
            </a>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-4 h-full">

              {navItems.map((item) => {
                const isActive = currentTab === item.id;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    data-path={item.id}
                    aria-current={
                      isActive ? 'page' : undefined
                    }
                    onClick={(e) =>
                      handleTabClick(e, item.id)
                    }
                    className={`inline-flex items-center px-1 py-1 text-sm transition-colors ${
                      isActive
                        ? 'text-[#5170ff] font-semibold border-b-2 border-[#5170ff]'
                        : 'text-[#444655] hover:text-[#0b1c30] border-b-2 border-transparent font-medium'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}

            </nav>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-4 shrink-0">

            {/* Report Item Button */}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#5170ff] hover:bg-[#4362ea] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer border-0"
              onClick={handleReportItemClick}
            >
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>

              <span>
                Report Item
              </span>
            </button>

            {/* Notifications Button */}
            <button
              aria-label="Notifications"
              className="relative flex items-center justify-center p-2 rounded-lg text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30] transition-colors cursor-pointer"
              type="button"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>

              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
            </button>

            {/* User Profile */}
            <div
              className="relative inline-block"
              ref={profileRef}
            >
              <button
                aria-label="User Profile"
                onClick={() =>
                  setIsProfileModalOpen(
                    (prev) => !prev
                  )
                }
                className="flex items-center justify-center focus:outline-none rounded-full cursor-pointer ring-2 ring-transparent hover:ring-[#5170ff]/30 transition-all"
                type="button"
              >
                <div className="w-8 h-8 rounded-full bg-[#5170ff] flex items-center justify-center overflow-hidden">

                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={
                        user.name || 'User profile'
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-[18px] h-[18px] text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  )}

                </div>
              </button>

              {/* User Profile Popover */}
              {isProfileModalOpen && (
                <div className="absolute right-0 top-full mt-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <UserProfileModal
                    user={user}
                    onProfileSettings={
                      handleProfileSettings
                    }
                    onLogout={handleLogout}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="w-full bg-[#f8f9ff] min-h-[calc(100vh-4rem)] flex-1 flex flex-col items-center">

        <div className="flex flex-col w-full flex-1">

          {/* Shared page container */}
          <div
            className="max-w-7xl mx-auto w-full py-10 flex-1"
            style={{
              paddingLeft: '22px',
              paddingRight: '22px',
            }}
          >
            {renderContent()}
          </div>

        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="w-full bg-white py-6 shadow-[0_-1px_8px_rgba(0,0,0,0.02)] shrink-0 mt-auto border-t border-[#c4c5d7]/20">

        <div
          className="max-w-7xl mx-auto flex justify-end"
          style={{
            paddingLeft: '22px',
            paddingRight: '22px',
          }}
        >
          <p className="text-sm text-[#444655] text-right font-normal">
            © 2026 ClaimIt. All rights reserved.
          </p>
        </div>

      </footer>

      {/* =========================
          REPORT ITEM MODAL
      ========================== */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        onClose={handleCloseModal}
        onCancel={handleCloseModal}
        onSubmit={handleModalSubmit}
      />

      {/* =========================
          LOGOUT CONFIRMATION
      ========================== */}
      <LogoutConfirmation
        isOpen={isLogoutConfirmationOpen}
        user={user}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />

    </div>
  );
}

export { MainForm_User };