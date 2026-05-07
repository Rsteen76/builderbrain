import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  devBypassAppUser,
  devBypassFirebaseUser,
  isDevAuthBypassEnabled,
} from '../config/devMode';
import { ensureDevDataSeeded } from '../services/devDataStore';
import { UserService, User, UserRole } from '../services/user';

const PROFILE_AUTH_ERROR =
  'Unable to load your user profile. Please try signing in again.';

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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `User: ${firebaseUser.uid}` : "User signed out");
      setLoading(true);
      setError(null);
      
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          let userDoc = await UserService.getUser(firebaseUser.uid);
          
          // If user document doesn't exist in Firestore yet, create it
          if (!userDoc) {
            console.log(`Creating new user document for uid: ${firebaseUser.uid}`);
            userDoc = await UserService.createUser(firebaseUser);
          } else {
            console.log(`Found existing user data:`, userDoc);
          }
          
          setUser(firebaseUser);
          setUserData(userDoc);
        } catch (err) {
          console.error('Error fetching user data:', err);
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
      if (isDevAuthBypassEnabled) {
        setUser(devBypassFirebaseUser);
        setUserData({
          ...devBypassAppUser,
          email: email || devBypassAppUser.email,
          updatedAt: new Date(),
        });
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
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
      setError(err instanceof Error ? err.message : 'Failed to sign up');
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
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user exists, if not create a document
      const existingUser = await UserService.getUser(userCredential.user.uid);
      if (!existingUser) {
        await UserService.createUser(userCredential.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
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
      setError(err instanceof Error ? err.message : 'Failed to sign out');
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

  const value = {
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user && !!userData && !error,
    role: userData?.role || 'team_member',
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    signOut: logout,
    updateUserProfile,
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
