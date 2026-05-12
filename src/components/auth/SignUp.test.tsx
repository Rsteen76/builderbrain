import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignUp from './SignUp';
import { useAuth } from '../../contexts/AuthContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../config/devMode', () => ({
  isDevAuthBypassEnabled: false,
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const signUp = jest.fn();
const signInWithGoogle = jest.fn();
const authState = (overrides = {}) => ({
  signUp,
  signInWithGoogle,
  error: null,
  isAuthenticated: false,
  ...overrides,
} as unknown as ReturnType<typeof useAuth>);

const renderSignUp = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SignUp />
    </MemoryRouter>
  );

const passwordInput = () => document.querySelector('input[name="password"]') as HTMLInputElement;

describe('SignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue(authState());
  });

  test('blocks mismatched passwords with a visible error', async () => {
    const user = userEvent.setup();

    renderSignUp();

    await user.type(screen.getByLabelText(/email address/i), 'builder@example.com');
    await user.type(passwordInput(), 'first-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'second-password');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/confirm password/i));
    expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument();
  });

  test('submits matching signup credentials, then navigates after auth state is ready', async () => {
    signUp.mockResolvedValue(undefined);
    const user = userEvent.setup();

    const { rerender } = renderSignUp();

    await user.type(screen.getByLabelText(/email address/i), 'builder@example.com');
    await user.type(passwordInput(), 'matching-password');
    await user.type(screen.getByLabelText(/confirm password/i), 'matching-password');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(signUp).toHaveBeenCalledWith('builder@example.com', 'matching-password');
    expect(mockNavigate).not.toHaveBeenCalled();

    mockedUseAuth.mockReturnValue(authState({ isAuthenticated: true }));
    rerender(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SignUp />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('shows authentication errors from context', () => {
    mockedUseAuth.mockReturnValue(authState({ error: 'Email already in use' }));

    renderSignUp();

    expect(screen.getByText('Email already in use')).toBeInTheDocument();
  });

  test('starts Google sign-in and waits for auth state before navigating', async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderSignUp();

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(signInWithGoogle).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
