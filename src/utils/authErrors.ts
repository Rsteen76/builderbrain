export const getAuthErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

export const getAuthErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const code = getAuthErrorCode(error);

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account already exists for that email address.';
    case 'auth/weak-password':
      return 'Use a stronger password. It must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase Auth. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this app.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it completed.';
    case 'auth/internal-error':
      return 'Firebase Auth could not complete email/password sign-in. Try Continue with Google, or reset your password if this account was not created with a password. Code: auth/internal-error.';
    default:
      return code ? `Authentication failed. Please try again. Code: ${code}.` : fallbackMessage;
  }
};

export const getGoogleAuthErrorMessage = (error: unknown): string => {
  const code = getAuthErrorCode(error);

  switch (code) {
    case 'auth/internal-error':
      return 'Google sign-in could not complete in this browser. Refresh and try again, or use a different browser window. Code: auth/internal-error.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it completed.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase Auth. Check your connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this app.';
    default:
      return code ? `Google sign-in failed. Please try again. Code: ${code}.` : 'Unable to sign in with Google. Please try again.';
  }
};
