import React, { useState } from 'react';
import ForgotPassword from './ForgotPassword.jsx';
import VerifyCode from './VerifyCode.jsx';
import ResetPassword from './ResetPassword.jsx';
import PasswordResetSuccess from './PasswordResetSuccess.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthFlow({ onNavigateToLogin }) {
  const [currentStep, setCurrentStep] = useState('forgot');
  const [userEmail, setUserEmail] = useState('');
  const { resetPassword } = useAuth();

  const handleProceedToCode = async (email) => {
    setUserEmail(email);
    try {
      if (email && email.includes('@')) {
        await resetPassword(email);
      }
    } catch (err) {
      console.warn('[AuthFlow] Password reset email trigger note:', err.message);
    }
    setCurrentStep('verify');
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

      {/* Step 2: Verification Code Input */}
      {currentStep === 'verify' && (
        <VerifyCode
          email={userEmail}
          onBackToLogin={onNavigateToLogin}
          onCodeVerified={() => setCurrentStep('reset')}
        />
      )}

      {/* Step 3: Set New Password */}
      {currentStep === 'reset' && (
        <ResetPassword
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