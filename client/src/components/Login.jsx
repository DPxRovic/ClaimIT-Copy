import React, { useState } from 'react';
import RegFormStudent from './RegFormStudent.jsx';
import RegFormFaculty from './RegFormFaculty.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import MainForm_User from './MainForm_User.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Login component for ClaimIt
 * 
 * Supports both controlled navigation (via props) and self-contained standalone navigation.
 * Integrated with Firebase Authentication and AuthContext.
 */
export default function Login({ onForgotPassword, onRegister, onLoginSuccess }) {
  // Internal view state for standalone usage when props are not provided
  const [internalView, setInternalView] = useState('login'); // 'login' | 'register-student' | 'register-faculty' | 'forgot-password' | 'main-user'
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { login, register, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your username or campus email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(usernameOrEmail.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(result?.user?.displayName || usernameOrEmail);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setInternalView('forgot-password');
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (onRegister) {
      onRegister();
    } else {
      setInternalView('register-student');
    }
  };

  // Render MainForm_User if internalView is manually set to 'main-user'
  if (internalView === 'main-user') {
    return <MainForm_User onLogout={() => setInternalView('login')} />;
  }

  // Student registration view
  if (internalView === 'register-student') {
    return (
      <RegFormStudent
        onLogin={() => setInternalView('login')}
        onSwitchToFaculty={() => setInternalView('register-faculty')}
        onSubmit={async (formData) => {
          await register(formData);
          setSubmittedMessage(`Account created for ${formData.fullName}! You are now logged in.`);
          setInternalView('login');
          setTimeout(() => setSubmittedMessage(null), 5000);
        }}
      />
    );
  }

  // Faculty registration view
  if (internalView === 'register-faculty') {
    return (
      <RegFormFaculty
        onLogin={() => setInternalView('login')}
        onSwitchToStudent={() => setInternalView('register-student')}
        onSubmit={async (formData) => {
          const res = await register(formData);
          setSubmittedMessage(res?.message || `Faculty account registered for ${formData.fullName}! Awaiting admin approval.`);
          setInternalView('login');
          setTimeout(() => setSubmittedMessage(null), 6000);
        }}
      />
    );
  }

  // Forgot password view
  if (internalView === 'forgot-password') {
    return (
      <ForgotPassword
        onBackToLogin={() => setInternalView('login')}
        onProceedToCode={async (email) => {
          try {
            await resetPassword(email);
            setSubmittedMessage(`Password reset link dispatched to ${email}. Please check your inbox.`);
            setInternalView('login');
            setTimeout(() => setSubmittedMessage(null), 5000);
          } catch (resetErr) {
            setSubmittedMessage(resetErr.message || 'Could not send reset email.');
            setInternalView('login');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex items-center justify-center p-4 sm:p-6 select-none font-sans w-full">
      {/* Toast Notification */}
      {submittedMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#23261F] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-all">
          <svg className="w-4 h-4 text-[#5170ff] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{submittedMessage}</span>
          <button
            type="button"
            onClick={() => setSubmittedMessage(null)}
            className="ml-2 text-white/60 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Login Card Container */}
      <main className="w-full max-w-[480px] bg-white rounded-[20px] border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 sm:p-10">
        {/* Header Content with System Logo */}
        <div className="flex flex-col items-center text-center">
          {/* System Logo */}
          <div className="mb-5 flex items-center justify-center">
            {!imageError ? (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCofUCFiKIJMG8R1lT7DHnPy95BWe5T72_xknGoZPASqWXk5OZAKkzJjhNR87Tg18UEpi3tZLXYfq3PvwBd3e0tO8yaPlENvLY2eUzdaYmTHiSJVYRfhTmHmZZ5n5-rjx8hOCDEm3xQRjGzHP2lO1KxPqRwblHdmX-AB7XWFry6apXTfUqntk-eG4P2Z3kH4seu_U1zRgswQYWWtFT27IrMkYdJyQ7jD4XfabK76w1K4CiPn_tohZvxZD-lonTMkBhv1MQ"
                alt="ClaimIt Logo"
                className="h-14 w-auto object-contain max-w-[240px]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center text-[34px] font-extrabold tracking-tight select-none">
                <span className="relative flex items-center justify-center mr-0.5">
                  <svg className="w-8 h-8 text-[#23261F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3" />
                  </svg>
                </span>
                <span className="text-[#23261F] -ml-5 pl-5 font-heading">laim</span>
                <span className="text-[#5170ff] font-heading">it</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#23261F] font-heading">
            Log in
          </h1>

          <p className="mt-2 text-base text-[#6E6858] leading-relaxed max-w-[340px]">
            Log in to report, browse, and manage your claims.
          </p>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Username or Email Field */}
          <div>
            <label
              htmlFor="username_or_email"
              className="block text-[15px] font-semibold text-[#23261F] mb-2 font-heading"
            >
              Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                id="username_or_email"
                name="username_or_email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter your username or email"
                disabled={isSubmitting}
                className="w-full h-12 px-4 text-base bg-white border border-[#E8E4D8] text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/30 focus:border-[#5170ff] transition-colors rounded-lg disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-[15px] font-semibold text-[#23261F] mb-2 font-heading"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className="w-full h-12 pl-4 pr-12 text-base bg-white border border-[#E8E4D8] text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/30 focus:border-[#5170ff] transition-colors rounded-lg disabled:opacity-50"
              />
              <button
                type="button"
                id="togglePassword"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6E6858] hover:text-[#23261F] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm font-medium text-[#5170ff] hover:text-[#3d5cee] hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Forgot Password
              </button>
            </div>
          </div>

          {/* Log in Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 px-5 bg-[#5170ff] hover:bg-[#3d5cee] text-white font-medium text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center font-heading active:scale-[0.99] rounded-lg cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log in'
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="pt-2 text-center">
            <span className="text-base text-[#6E6858]">Don't have an account? </span>
            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-base font-semibold text-[#5170ff] hover:text-[#3d5cee] hover:underline transition-colors font-heading cursor-pointer bg-transparent border-0 p-0 inline"
            >
              Register
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export { Login };