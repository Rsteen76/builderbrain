import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/layout/MainLayout', () => {
  const React = require('react');
  const { Outlet } = require('react-router-dom');

  return {
    __esModule: true,
    default: () => React.createElement(
      'div',
      { 'data-testid': 'main-layout' },
      React.createElement(Outlet)
    ),
  };
});

jest.mock('./components/auth/ProtectedRoute', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => React.createElement(
      'div',
      { 'data-testid': 'protected-route' },
      children
    ),
  };
});

jest.mock('./contexts/AuthContext', () => {
  const React = require('react');

  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({ user: null }),
  };
});

jest.mock('./contexts/QueryContext', () => {
  const React = require('react');

  return {
    QueryProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('./pages/SharedReportView', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: () => React.createElement('div', null, 'Shared report route'),
  };
});

jest.mock('./pages/ProjectDetailPage', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: () => React.createElement('div', null, 'Project detail route'),
  };
});

jest.mock('./components/project-wizard/ProjectWizard', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: () => React.createElement('div', null, 'Project wizard route'),
  };
});

jest.mock('./components/dialogs/BidDeletePortal', () => ({
  __esModule: true,
  default: () => null,
}));

describe('App routes', () => {
  it('renders shared reports without the authenticated app layout or protected route', () => {
    window.history.pushState({}, '', '/shared-reports/share-1');

    render(<App />);

    expect(screen.getByText('Shared report route')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
  });
});
