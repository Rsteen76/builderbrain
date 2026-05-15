import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  devBypassAppUser,
  devBypassFirebaseUser,
  isDevAuthBypassEnabled,
} from '../config/devMode';
import { ensureDevDataSeeded } from '../services/devDataStore';
import { UserService, User, UserRole } from '../services/user';
import { getAuthErrorCode, getAuthErrorMessage, getGoogleAuthErrorMessage } from '../utils/authErrors';
import { logger } from '../utils/logger';

const PROFILE_AUTH_ERROR =
  'Unable to load your user profile. Please try signing in again.';

const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  role: 'team_member',
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
  changePassword: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDevAuthBypassEnabled) {
      ensureDevDataSeeded();
      setUser(devBypassFirebaseUser);
      setUserData(devBypassAppUser);
      setError(null);
      setLoading(false);
      return () => {};
    }

    getRedirectResult(auth).catch((err) => {
      logger.warn('Firebase Google redirect result failed', { code: getAuthErrorCode(err), error: err });
      setError(getGoogleAuthErrorMessage(err));
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.debug('Auth state changed', { signedIn: Boolean(firebaseUser), uid: firebaseUser?.uid });
      setLoading(true);
      setError(null);
      
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          let userDoc = await UserService.getUser(firebaseUser.uid);
          
          // If user document doesn't exist in Firestore yet, create it
          if (!userDoc) {
            logger.info('Creating missing user profile', { uid: firebaseUser.uid });
            userDoc = await UserService.createUser(firebaseUser);
          } else {
            logger.debug('Loaded existing user profile', { uid: firebaseUser.uid, role: userDoc.role });
          }
          
          setUser(firebaseUser);
          setUserData(userDoc);
        } catch (err) {
          logger.error('Error fetching user data', err);
          setUser(null);
          setUserData(null);
          setError(err instanceof Error ? `${PROFILE_AUTH_ERROR} ${err.message}` : PROFILE_AUTH_ERROR);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const normalizedEmail = email.trim();
      if (isDevAuthBypassEnabled) {
        setUser(devBypassFirebaseUser);
        setUserData({
          ...devBypassAppUser,
          email: normalizedEmail || devBypassAppUser.email,
          updatedAt: new Date(),
        });
        return;
      }
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (err) {
      logger.warn('Firebase email sign-in failed', { code: getAuthErrorCode(err), error: err });
      setError(getAuthErrorMessage(err, 'Unable to sign in. Please try again.'));
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      if (isDevAuthBypassEnabled) {
        setUser(devBypassFirebaseUser);
        setUserData({
          ...devBypassAppUser,
          email: email || devBypassAppUser.email,
          displayName: displayName || email.split('@')[0] || devBypassAppUser.displayName,
          updatedAt: new Date(),
        });
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await UserService.createUser(userCredential.user, { 
        displayName: displayName || email.split('@')[0],
        role: 'team_member' 
      });
    } catch (err) {
      logger.warn('Firebase email sign-up failed', { code: getAuthErrorCode(err), error: err });
      setError(getAuthErrorMessage(err, 'Unable to create your account. Please try again.'));
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      if (isDevAuthBypassEnabled) {
        setUser(devBypassFirebaseUser);
        setUserData(devBypassAppUser);
        return;
      }
      await signInWithPopup(auth, createGoogleProvider());
    } catch (err) {
      logger.warn('Firebase Google sign-in failed', { code: getAuthErrorCode(err), error: err });
      const code = getAuthErrorCode(err);

      if (code === 'auth/internal-error' || code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, createGoogleProvider());
          return;
        } catch (redirectErr) {
          logger.warn('Firebase Google redirect sign-in failed', {
            code: getAuthErrorCode(redirectErr),
            error: redirectErr,
          });
          setError(getGoogleAuthErrorMessage(redirectErr));
          throw redirectErr;
        }
      }

      setError(getGoogleAuthErrorMessage(err));
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (isDevAuthBypassEnabled) {
        setUser(null);
        setUserData(null);
        return;
      }
      await signOut(auth);
    } catch (err) {
      logger.warn('Firebase sign-out failed', { code: getAuthErrorCode(err), error: err });
      setError(getAuthErrorMessage(err, 'Unable to sign out. Please try again.'));
      throw err;
    }
  };
  
  const updateUserProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error('No user is authenticated');
      if (isDevAuthBypassEnabled) {
        setUserData((current) =>
          current
            ? {
                ...current,
                ...data,
                updatedAt: new Date(),
              }
            : current
        );
        return;
      }
      
      await UserService.updateUser(user.uid, data);
      
      // Refresh user data
      const updatedUserData = await UserService.getUser(user.uid);
      if (updatedUserData) {
        setUserData(updatedUserData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      if (isDevAuthBypassEnabled) return;
      if (!user || !user.email) throw new Error('No email/password user is authenticated');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (err) {
      logger.warn('Firebase password change failed', { code: getAuthErrorCode(err), error: err });
      setError(getAuthErrorMessage(err, 'Unable to change your password. Please try again.'));
      throw err;
    }
  };

  const value = {
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user && !!userData,
    role: userData?.role || 'team_member',
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    signOut: logout,
    updateUserProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
