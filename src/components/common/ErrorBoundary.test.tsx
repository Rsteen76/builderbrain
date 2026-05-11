import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { captureException } from '../../utils/monitoring';

jest.mock('../../utils/monitoring', () => ({
  captureException: jest.fn(),
}));

const ThrowingChild = () => {
  throw new Error('render failed');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders fallback UI and reports render errors', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
        source: 'react.error_boundary',
      })
    );
  });

  it('resets when the route reset key changes', async () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="first">
        <ThrowingChild />
      </ErrorBoundary>
    );

    rerender(
      <ErrorBoundary resetKey="second">
        <div>Recovered route</div>
      </ErrorBoundary>
    );

    expect(await screen.findByText('Recovered route')).toBeInTheDocument();
  });
});
