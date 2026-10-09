import React, { useState } from 'react';
import Login from './components/Login';
import AuthFlow from './components/AuthFlow';


export default function App() {
  const [currentView, setCurrentView] = useState('login');


  return (
    <div className="w-full min-h-screen">
      {/* 1. Login View */}
      {currentView === 'login' && (
        <Login
          onForgotPassword={() => setCurrentView('auth-flow')}
        />
      )}


      {/* 2. Password Reset Flow (Handles Forgot, Verify, Reset & Success) */}
      {currentView === 'auth-flow' && (
        <AuthFlow
          onNavigateToLogin={() => setCurrentView('login')}
        />
      )}
    </div>
  );
}

