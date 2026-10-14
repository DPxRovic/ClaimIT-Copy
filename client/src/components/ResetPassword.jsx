import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ResetPassword component for ClaimIt
 * Connected to Firebase Authentication verifyPasswordResetCode and confirmPasswordReset APIs.
 * 
 * @param {Object} props
 * @param {string} [props.actionCode] - Action code (oobCode) from email link or verification step
 * @param {string} [props.email] - Optional pre-verified user email
 * @param {() => void} [props.onSuccess] - Callback when password is reset successfully
 * @param {() => void} [props.onCancel] - Callback when clicking Cancel or requesting a new link
 */
export default function ResetPassword({
  actionCode: propActionCode,
  email: propEmail,
  onSuccess,
  onCancel,
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState(propEmail || '');
  const [imageError, setImageError] = useState(false);

  const { verifyCode, confirmPassword: confirmPasswordService } = useAuth();

  // Determine the effective action code (prop or URL query parameter oobCode)
  const resolvedCode =
    propActionCode ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('oobCode')
      : null);

  // Validate the reset code on mount if code is available
  useEffect(() => {
    if (!resolvedCode) {
      // If no code provided at all and not in mock session, show instruction
      return;
    }

    let isMounted = true;
    setIsValidatingCode(true);
    setCodeError(null);

    verifyCode(resolvedCode)
      .then((accountEmail) => {
        if (isMounted) {
          if (accountEmail) setVerifiedEmail(accountEmail);
          setIsValidatingCode(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[ResetPassword] Code verification notice:', err.message);
          setCodeError(
            err.message || 'This password reset link is invalid or has expired.'
          );
          setIsValidatingCode(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedCode, verifyCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    const codeToUse = resolvedCode || 'demo-reset-code';

    setIsSubmitting(true);

    try {
      await confirmPasswordService(codeToUse, newPassword);
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to update password. Please try again.');
    }
  };

  const handlePasswordChange = (setter) => (e) => {
    setter(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex items-center justify-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#5170ff]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-[#5170ff]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <main className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 sm:p-10 relative transition-all duration-300">
        <div className="flex justify-center mb-6 h-10 items-center">
          {!imageError ? (
            <img
              alt="ClaimIt Logo"
              className="h-9 w-auto object-contain select-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs6hrNmoOIOn7UzqRwxgwRPKx7mvDkcrEBTFfkttlfv7tgyFVb_Yl5Npr3s8hxTRRMyNCawWDyBvixVyqvY1phXAIzgay94F0SF3pDBH22A47ktoPrziVy0Cy_IkCldfERBUImJhedCoZhXfL-S-B17rrFlYH8C_smsIuHSEHkHBkcNV69odi-Yts_e8bhFwgX9oH0QGJOhQ0j1vb_x0Nj9NIOLuaSEziF8m-HEWgzpmL20lvAOKB-0K6a98WSCzkaKpc"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center text-[30px] font-extrabold tracking-tight select-none">
              <span className="relative flex items-center justify-center mr-0.5">
                <svg className="w-7 h-7 text-[#23261F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3" />
                </svg>
              </span>
              <span className="text-[#23261F] -ml-4 pl-4">laim</span>
              <span className="text-[#5170ff]">it</span>
            </div>
          )}
        </div>

        {isValidatingCode ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-8 h-8 border-3 border-[#5170ff] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#6E6858] font-heading font-medium">
              Verifying your reset link...
            </p>
          </div>
        ) : codeError ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#1a1c20] tracking-tight">
              Link Expired or Invalid
            </h1>
            <p className="text-sm text-[#6E6858] leading-relaxed">
              {codeError}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full h-11 bg-[#5170ff] hover:bg-[#3d5cee] text-white font-medium text-sm rounded-lg shadow-sm transition-all cursor-pointer font-heading"
              >
                Request a new password reset
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1a1c20] tracking-tight">
                Create new password
              </h1>
              <p className="text-sm text-[#6E6858] mt-2 leading-relaxed">
                {verifiedEmail
                  ? `Enter a new secure password for ${verifiedEmail}.`
                  : 'You can now set a new password for your account.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="flex flex-col gap-0" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col text-left">
                <label
                  className="text-xs font-semibold tracking-wider uppercase text-[#23261F] mb-1.5 block font-heading"
                  htmlFor="new-password"
                >
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="new-password"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={handlePasswordChange(setNewPassword)}
                    disabled={isSubmitting}
                    required
                    className={`w-full h-11 px-4 pr-11 bg-white text-sm text-[#1a1c20] placeholder-[#6E6858]/70 rounded-lg outline-none transition duration-150 border ${
                      errorMessage
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3.5 flex items-center justify-center text-[#6E6858] hover:text-[#23261F] transition-colors p-1 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col text-left mt-4">
                <label
                  className="text-xs font-semibold tracking-wider uppercase text-[#23261F] mb-1.5 block font-heading"
                  htmlFor="confirm-password"
                >
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={handlePasswordChange(setConfirmPassword)}
                    disabled={isSubmitting}
                    required
                    className={`w-full h-11 px-4 pr-11 bg-white text-sm text-[#1a1c20] placeholder-[#6E6858]/70 rounded-lg outline-none transition duration-150 border ${
                      errorMessage
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 flex items-center justify-center text-[#6E6858] hover:text-[#23261F] transition-colors p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#6E6858] mt-2">
                Must be at least 8 characters long.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#5170ff] hover:bg-[#3f5fe8] disabled:opacity-60 active:scale-[0.99] text-white font-medium text-sm rounded-lg shadow-sm transition-all mt-6 flex items-center justify-center gap-2 cursor-pointer select-none font-heading"
              >
                {isSubmitting ? (
                  <span>Updating password...</span>
                ) : (
                  <span>Set New Password</span>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="mt-4 text-center text-sm font-medium text-[#6E6858] hover:text-[#5170ff] transition-colors block cursor-pointer font-heading"
              >
                Cancel
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export { ResetPassword };