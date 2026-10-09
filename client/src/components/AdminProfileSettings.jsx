import React, { useState, useRef } from 'react';
import { User, Lock, LogOut, Camera, Check } from 'lucide-react';

const DEFAULT_ADMIN = {
  name: 'Sabrina Carpenter',
  email: 'sabrina@gmail.com',
  fullname: 'crystal2',
  contactNumber: '09878475879',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

/**
 * AdminProfileSettings component
 *
 * Dedicated admin settings page matching ClaimIt administrator designs.
 *
 * @param {Object} [props]
 * @param {Object} [props.initialUser]
 * @param {((data: any) => void)} [props.onSaveProfile]
 * @param {((data: any) => void)} [props.onSaveAccount]
 * @param {(() => void)} [props.onLogout]
 * @param {string} [props.className]
 */
export const AdminProfileSettings = ({
  initialUser = DEFAULT_ADMIN,
  onSaveProfile,
  onSaveAccount,
  onLogout,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'account'
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef(null);

  // Admin Profile State
  const [profileData, setProfileData] = useState({
    name: initialUser.name || 'Sabrina Carpenter',
    fullname: initialUser.fullname || 'crystal2',
    contactNumber: initialUser.contactNumber || '09878475879',
    avatarUrl: initialUser.avatarUrl || DEFAULT_ADMIN.avatarUrl,
  });

  // Admin Account Settings State
  const [accountData, setAccountData] = useState({
    email: initialUser.email || 'sabrina@gmail.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const triggerToast = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile(profileData);
    }
    triggerToast();
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (onSaveAccount) {
      onSaveAccount(accountData);
    }
    triggerToast();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfileData((prev) => ({ ...prev, avatarUrl: previewUrl }));
    }
  };

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Profile &amp; Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your administrator account details and security settings.
        </p>
      </div>

      {/* Main Container: 2 Columns */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column: Sidebar Card */}
        <aside className="w-full md:w-64 lg:w-72 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col shrink-0">
          {/* User Preview */}
          <div className="flex items-center gap-3.5 pb-5">
            <img
              src={profileData.avatarUrl}
              alt={profileData.name}
              className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-100"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 leading-snug truncate">
                {profileData.name}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {accountData.email}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#e0e7ff] text-[#2563eb] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-[#e0e7ff] text-[#2563eb] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Account Settings</span>
            </button>
          </nav>

          {/* Divider & Log Out */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onLogout?.()}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Right Column: Content Card */}
        <main className="flex-1 w-full bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-xs">
          {activeTab === 'profile' ? (
            /* ================= ADMIN PROFILE VIEW ================= */
            <form onSubmit={handleProfileSubmit} className="flex flex-col">
              {/* Header */}
              <div className="pb-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Profile</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  This is how other students see you on your reports and claims.
                </p>
              </div>

              <div className="flex flex-col gap-6 pt-6">
                {/* Profile Picture */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    PROFILE PICTURE
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={profileData.avatarUrl}
                      alt={profileData.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      <span>Change photo</span>
                    </button>
                  </div>
                </div>

                {/* Fullname & Contact Number (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Fullname */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="fullname"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      FULLNAME
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      value={profileData.fullname}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, fullname: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-[#f8f9ff]/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contactNumber"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      CONTACT NUMBER
                    </label>
                    <input
                      id="contactNumber"
                      type="text"
                      value={profileData.contactNumber}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          contactNumber: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-[#f8f9ff]/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#4c6bf6] hover:bg-[#3b5ae8] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ================= ACCOUNT SETTINGS VIEW ================= */
            <form onSubmit={handleAccountSubmit} className="flex flex-col">
              {/* Header */}
              <div className="pb-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Account Settings</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Update your sign-in email and password.
                </p>
              </div>

              <div className="flex flex-col gap-6 pt-6">
                {/* Email Section */}
                <div className="flex flex-col gap-1.5 max-w-lg">
                  <label
                    htmlFor="email"
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-700"
                  >
                    EMAIL
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) =>
                      setAccountData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-[#f8f9ff]/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                  />
                </div>

                {/* Change Password Subsection */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-4 max-w-lg">
                  <h3 className="text-base font-bold text-slate-900">Change Password</h3>

                  {/* Current Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="currentPassword"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      CURRENT PASSWORD
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={accountData.currentPassword}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-[#f8f9ff]/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    />
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="newPassword"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      NEW PASSWORD
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={accountData.newPassword}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-[#f8f9ff]/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    />
                    <span className="text-xs text-slate-500">At least 8 characters.</span>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      CONFIRM PASSWORD
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-[#f8f9ff]/70 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#4c6bf6] hover:bg-[#3b5ae8] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Floating Success Feedback Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b1c30] text-white px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>Changes applied successfully!</span>
        </div>
      )}
    </div>
  );
};

export default AdminProfileSettings;
