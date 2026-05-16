import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
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
const signIn = jest.fn();
const signInWithGoogle = jest.fn();
const authState = (overrides = {}) => ({
  signIn,
  signInWithGoogle,
  error: null,
  isAuthenticated: false,
  ...overrides,
} as unknown as ReturnType<typeof useAuth>);

const renderLogin = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue(authState());
  });

  test('submits email and password login, then navigates after auth state is ready', async () => {
    signIn.mockResolvedValue(undefined);
    const user = userEvent.setup();

    const { rerender } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'builder@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(signIn).toHaveBeenCalledWith('builder@example.com', 'correct horse battery staple');
    expect(mockNavigate).not.toHaveBeenCalled();

    mockedUseAuth.mockReturnValue(authState({ isAuthenticated: true }));
    rerender(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Login />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('trims email before submitting password login', async () => {
    signIn.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), '  builder@example.com  ');
    await user.type(screen.getByLabelText(/password/i), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(signIn).toHaveBeenCalledWith('builder@example.com', 'correct horse battery staple');
  });

  test('shows authentication errors from context', () => {
    mockedUseAuth.mockReturnValue(authState({ error: 'Invalid login credentials' }));

    renderLogin();

    expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
  });

  test('starts Google sign-in and waits for auth state before navigating', async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderLogin();

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(signInWithGoogle).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
