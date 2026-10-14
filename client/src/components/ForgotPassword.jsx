import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ForgotPassword component for ClaimIt
 * Connected directly to Firebase Authentication password reset API.
 * 
 * @param {Object} props
 * @param {() => void} [props.onBackToLogin] - Handler to navigate back to login screen
 * @param {(email: string) => void} [props.onProceedToCode] - Handler when proceeding to enter verification code
 */
export default function ForgotPassword({ onBackToLogin, onProceedToCode }) {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  const { resetPassword } = useAuth();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(cleanEmail);
      setIsSubmitted(true);
      setConfirmationMessage(
        result?.message ||
          'If an account exists with this email address, a password reset link has been sent.'
      );
    } catch (err) {
      setErrorMessage(err.message || 'Unable to request password reset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <main className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 sm:p-12 relative transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-[#6E6858] hover:text-[#5170ff] transition-colors text-sm font-semibold group cursor-pointer font-heading"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Login</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-5 flex items-center justify-center h-14">
            {!imageError ? (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs6hrNmoOIOn7UzqRwxgwRPKx7mvDkcrEBTFfkttlfv7tgyFVb_Yl5Npr3s8hxTRRMyNCawWDyBvixVyqvY1phXAIzgay94F0SF3pDBH22A47ktoPrziVy0Cy_IkCldfERBUImJhedCoZhXfL-S-B17rrFlYH8C_smsIuHSEHkHBkcNV69odi-Yts_e8bhFwgX9oH0QGJOhQ0j1vb_x0Nj9NIOLuaSEziF8m-HEWgzpmL20lvAOKB-0K6a98WSCzkaKpc"
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
                <span className="text-[#23261F] -ml-5 pl-5">laim</span>
                <span className="text-[#5170ff]">it</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#23261F] font-heading">
            Reset your password
          </h1>
          <p className="mt-2 text-base text-[#6E6858] leading-relaxed max-w-[340px]">
            Enter the email linked to your account — we'll send a link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <svg className="w-7 h-7 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-semibold text-lg text-[#23261F]">
                Check your inbox
              </h3>
              <p className="text-sm text-[#6E6858] leading-relaxed">
                {confirmationMessage}
              </p>
              <p className="text-xs text-[#6E6858]/80 mt-1">
                Be sure to check your spam or junk folder if you don't see it within a few minutes.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full h-12 px-5 bg-[#5170ff] hover:bg-[#3d5cee] text-white font-medium text-base rounded-lg shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 font-heading active:scale-[0.99] cursor-pointer"
              >
                <span>Back to Login</span>
              </button>

              {onProceedToCode && (
                <button
                  type="button"
                  onClick={() => onProceedToCode(email.trim().toLowerCase())}
                  className="w-full text-center text-sm font-medium text-[#6E6858] hover:text-[#5170ff] transition-colors py-2 cursor-pointer font-heading"
                >
                  I have a reset code
                </button>
              )}
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
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

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="ucc-email"
                className="block text-[15px] font-semibold text-[#23261F] mb-2 font-heading"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="ucc-email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isSubmitting}
                  placeholder="Enter your email address"
                  className={`w-full h-12 pl-4 pr-4 text-base bg-white border text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none rounded-lg transition-colors shadow-xs ${
                    errorMessage
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E8E4D8] focus:ring-2 focus:ring-[#5170ff]/30 focus:border-[#5170ff]'
                  }`}
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 px-5 bg-[#5170ff] hover:bg-[#3d5cee] disabled:opacity-60 text-white font-medium text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 font-heading active:scale-[0.99] rounded-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Sending request...</span>
                ) : (
                  <>
                    <span>Confirm Email</span>
                    <svg
                      className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export { ForgotPassword };