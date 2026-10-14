import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import {
  loginUser,
  registerUser as registerUserService,
  logoutUser,
  sendPasswordReset,
  verifyResetCode,
  confirmNewPassword,
  updateUserProfile as updateUserProfileService,
  subscribeUserProfile,
  formatAuthError,
} from '../firebase/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous profile subscription
      unsubscribeProfile();

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // Subscribe in real-time to user's profile document in Firestore
        unsubscribeProfile = subscribeUserProfile(
          firebaseUser.uid,
          (profileData) => {
            if (profileData) {
              setUserProfile(profileData);
            } else {
              // Fallback profile if Firestore document is still syncing
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
                role: 'student',
                status: 'Active',
                avatarUrl: firebaseUser.photoURL || null,
              });
            }
            setLoading(false);
          },
          (err) => {
            console.warn('[AuthContext] Profile sync warning:', err);
            setLoading(false);
          }
        );
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const result = await loginUser(email, password);
      if (result?._isMock) {
        setCurrentUser(result.user);
        setUserProfile(result.profile);
      }
      return result;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const register = async (formData) => {
    setAuthError(null);
    try {
      const result = await registerUserService(formData);
      if (result?._isMock) {
        setCurrentUser(result.user);
        setUserProfile(result.profile);
      }
      return result;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      const result = await sendPasswordReset(email);
      return result;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const verifyCode = async (actionCode) => {
    setAuthError(null);
    try {
      const email = await verifyResetCode(actionCode);
      return email;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const confirmPassword = async (actionCode, newPassword) => {
    setAuthError(null);
    try {
      const result = await confirmNewPassword(actionCode, newPassword);
      return result;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const updateProfile = async (updates) => {
    if (!currentUser) throw new Error('No authenticated user to update.');
    setAuthError(null);
    try {
      const result = await updateUserProfileService(currentUser.uid, updates);
      setUserProfile((prev) => ({ ...prev, ...result }));
      return result;
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const role = (userProfile?.role || '').toLowerCase();
  const status = userProfile?.status || 'Active';

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    setAuthError,
    isAuthenticated: !!currentUser && !!userProfile,
    isAdmin: role === 'admin',
    isFaculty: role === 'faculty',
    isStudent: role === 'student',
    isPendingApproval: status === 'Pending approval',
    isSuspended: status === 'Suspended',
    login,
    register,
    logout,
    resetPassword,
    verifyCode,
    confirmPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
