import React, { useState } from 'react';
import ForgotPassword from './ForgotPassword.jsx';
import VerifyCode from './VerifyCode.jsx';
import ResetPassword from './ResetPassword.jsx';
import PasswordResetSuccess from './PasswordResetSuccess.jsx';

/**
 * AuthFlow manages the account recovery and password reset screens.
 * Supports both link-based reset (Firebase action links) and manual code entry.
 *
 * @param {Object} props
 * @param {() => void} props.onNavigateToLogin
 * @param {'forgot' | 'verify' | 'reset' | 'success'} [props.initialStep='forgot']
 * @param {string|null} [props.initialCode=null] - Action code from URL parameter
 */
export default function AuthFlow({
  onNavigateToLogin,
  initialStep = 'forgot',
  initialCode = null,
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [userEmail, setUserEmail] = useState('');
  const [activeActionCode, setActiveActionCode] = useState(initialCode);

  const handleProceedToCode = (email) => {
    setUserEmail(email);
    setCurrentStep('verify');
  };

  const handleCodeVerified = (code) => {
    setActiveActionCode(code);
    setCurrentStep('reset');
  };

  return (
    <div>
      {/* Step 1: Request Password Reset */}
      {currentStep === 'forgot' && (
        <ForgotPassword
          onBackToLogin={onNavigateToLogin}
          onProceedToCode={handleProceedToCode}
        />
      )}

      {/* Step 2: Verification Code Input (Fallback for manual code entry) */}
      {currentStep === 'verify' && (
        <VerifyCode
          email={userEmail}
          onBackToLogin={onNavigateToLogin}
          onCodeVerified={handleCodeVerified}
        />
      )}

      {/* Step 3: Set New Password (Firebase verifyPasswordResetCode & confirmPasswordReset) */}
      {currentStep === 'reset' && (
        <ResetPassword
          actionCode={activeActionCode}
          email={userEmail}
          onSuccess={() => setCurrentStep('success')}
          onCancel={onNavigateToLogin}
        />
      )}

      {/* Step 4: Password Reset Success */}
      {currentStep === 'success' && (
        <PasswordResetSuccess
          onBackToLogin={onNavigateToLogin}
        />
      )}
    </div>
  );
}