import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthProvider, useAuth } from './AuthContext';
import { UserService, User } from '../services/user';
import { getRedirectResult, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';

jest.mock('../config/firebase', () => ({
  auth: {},
}));

jest.mock('../config/devMode', () => ({
  devBypassAppUser: null,
  devBypassFirebaseUser: null,
  isDevAuthBypassEnabled: false,
}));

jest.mock('../services/devDataStore', () => ({
  ensureDevDataSeeded: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn(),
  })),
  createUserWithEmailAndPassword: jest.fn(),
  getRedirectResult: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithRedirect: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../services/user', () => ({
  UserService: {
    createUser: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

const mockedOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const mockedGetRedirectResult = getRedirectResult as jest.MockedFunction<typeof getRedirectResult>;
const mockedSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockedSignInWithPopup = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>;
const mockedSignInWithRedirect = signInWithRedirect as jest.MockedFunction<typeof signInWithRedirect>;
const mockedUserService = UserService as jest.Mocked<typeof UserService>;

let authStateCallback: ((user: FirebaseUser | null) => Promise<void>) | undefined;
const unsubscribe = jest.fn();

const firebaseUser = {
  uid: 'user-1',
  email: 'avery@example.com',
  displayName: 'Avery',
  photoURL: null,
} as FirebaseUser;

const appUser: User = {
  id: 'user-1',
  email: 'avery@example.com',
  displayName: 'Avery',
  role: 'project_manager',
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
};

const AuthStatus = () => {
  const { user, userData, loading, error, isAuthenticated, role } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="firebase-user">{user?.uid || 'none'}</div>
      <div data-testid="profile">{userData?.id || 'none'}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="role">{role}</div>
      <div data-testid="error">{error || 'none'}</div>
    </div>
  );
};

const SignInAction = () => {
  const { error, signIn, signInWithGoogle } = useAuth();

  return (
    <div>
      <button onClick={() => signIn('builder@example.com', 'password').catch(() => {})}>
        Sign In
      </button>
      <button onClick={() => signInWithGoogle().catch(() => {})}>
        Google
      </button>
      <div data-testid="error">{error || 'none'}</div>
    </div>
  );
};

const renderAuthProvider = () =>
  render(
    <AuthProvider>
      <AuthStatus />
    </AuthProvider>
  );

const renderAuthActionProvider = () =>
  render(
    <AuthProvider>
      <SignInAction />
    </AuthProvider>
  );

const sendAuthState = async (user: FirebaseUser | null) => {
  if (!authStateCallback) throw new Error('Auth listener was not registered');

  await act(async () => {
    await authStateCallback?.(user);
  });
};

describe('AuthProvider', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = undefined;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetRedirectResult.mockResolvedValue(null);
    mockedOnAuthStateChanged.mockImplementation(((_auth, callback) => {
      authStateCallback = callback as typeof authStateCallback;
      return unsubscribe;
    }) as typeof onAuthStateChanged);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('authenticates only after the Firestore profile is loaded', async () => {
    mockedUserService.getUser.mockResolvedValue(appUser);

    renderAuthProvider();
    await sendAuthState(firebaseUser);

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('firebase-user')).toHaveTextContent('user-1');
    expect(screen.getByTestId('profile')).toHaveTextContent('user-1');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('role')).toHaveTextContent('project_manager');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
  });

  test('blocks authentication when loading the Firestore profile fails', async () => {
    mockedUserService.getUser.mockRejectedValue(new Error('permission denied'));

    renderAuthProvider();
    await sendAuthState(firebaseUser);

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('firebase-user')).toHaveTextContent('none');
    expect(screen.getByTestId('profile')).toHaveTextContent('none');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent(
      'Unable to load your user profile. Please try signing in again. permission denied'
    );
  });

  test('blocks authentication when creating a missing Firestore profile fails', async () => {
    mockedUserService.getUser.mockResolvedValue(null);
    mockedUserService.createUser.mockRejectedValue(new Error('write failed'));

    renderAuthProvider();
    await sendAuthState(firebaseUser);

    expect(mockedUserService.createUser).toHaveBeenCalledWith(firebaseUser);
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('firebase-user')).toHaveTextContent('none');
    expect(screen.getByTestId('profile')).toHaveTextContent('none');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent(
      'Unable to load your user profile. Please try signing in again. write failed'
    );
  });

  test('shows a user-safe message for Firebase internal sign-in failures', async () => {
    mockedSignInWithEmailAndPassword.mockRejectedValue(
      Object.assign(new Error('Firebase: Error (auth/internal-error).'), {
        code: 'auth/internal-error',
      })
    );

    renderAuthActionProvider();
    await sendAuthState(null);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Firebase Auth could not complete email/password sign-in. Try Continue with Google, or reset your password if this account was not created with a password. Code: auth/internal-error.'
      )
    );
  });

  test('falls back to redirect when Google popup sign-in hits an internal error', async () => {
    mockedSignInWithPopup.mockRejectedValue(
      Object.assign(new Error('Firebase: Error (auth/internal-error).'), {
        code: 'auth/internal-error',
      })
    );
    mockedSignInWithRedirect.mockResolvedValue(undefined as never);

    renderAuthActionProvider();
    await sendAuthState(null);

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => expect(mockedSignInWithRedirect).toHaveBeenCalled());
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  test('lets the auth state listener hydrate the profile after Google popup sign-in succeeds', async () => {
    mockedSignInWithPopup.mockResolvedValue({ user: firebaseUser } as never);

    renderAuthActionProvider();
    await sendAuthState(null);

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => expect(mockedSignInWithPopup).toHaveBeenCalled());
    expect(mockedUserService.getUser).not.toHaveBeenCalled();
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  test('shows a Google-specific message when redirect fallback also fails', async () => {
    mockedSignInWithPopup.mockRejectedValue(
      Object.assign(new Error('Firebase: Error (auth/internal-error).'), {
        code: 'auth/internal-error',
      })
    );
    mockedSignInWithRedirect.mockRejectedValue(
      Object.assign(new Error('Firebase: Error (auth/unauthorized-domain).'), {
        code: 'auth/unauthorized-domain',
      })
    );

    renderAuthActionProvider();
    await sendAuthState(null);

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(
        'This domain is not authorized for Google sign-in.'
      )
    );
  });
});
