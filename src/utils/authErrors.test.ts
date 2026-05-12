import { getAuthErrorCode, getAuthErrorMessage } from './authErrors';

const firebaseError = (code: string) => Object.assign(new Error(`Firebase: Error (${code}).`), { code });

describe('authErrors', () => {
  test('extracts Firebase auth error codes', () => {
    expect(getAuthErrorCode(firebaseError('auth/internal-error'))).toBe('auth/internal-error');
    expect(getAuthErrorCode(new Error('plain error'))).toBeNull();
  });

  test('maps common email/password errors to user-safe copy', () => {
    expect(getAuthErrorMessage(firebaseError('auth/invalid-credential'), 'fallback')).toBe(
      'Email or password is incorrect.'
    );
    expect(getAuthErrorMessage(firebaseError('auth/email-already-in-use'), 'fallback')).toBe(
      'An account already exists for that email address.'
    );
  });

  test('maps internal Firebase errors to an actionable support message', () => {
    expect(getAuthErrorMessage(firebaseError('auth/internal-error'), 'fallback')).toBe(
      'Firebase Auth could not complete the request. Please try again. If it keeps happening, contact support with code auth/internal-error.'
    );
  });

  test('keeps unknown Firebase codes visible without exposing raw exception text', () => {
    expect(getAuthErrorMessage(firebaseError('auth/unexpected-new-code'), 'fallback')).toBe(
      'Authentication failed. Please try again. Code: auth/unexpected-new-code.'
    );
    expect(getAuthErrorMessage(new Error('raw firebase stack'), 'fallback')).toBe('fallback');
  });
});
