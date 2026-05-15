import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuickActions from './QuickActions';
import RecentProjects from './RecentProjects';
import { PROJECT_WIZARD_ROUTE } from '../../constants/projectRoutes';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('../../services/project', () => ({
  ProjectService: {
    getProjects: jest.fn(),
  },
}));

jest.mock('../../services/expense', () => ({
  ExpenseService: {
    createExpense: jest.fn(),
  },
}));

jest.mock('../expenses/ExpenseFormModal', () => () => null);

describe('project creation navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('QuickActions New Project routes to the project wizard by default', async () => {
    render(<QuickActions />);

    fireEvent.click(screen.getByText('New Project'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(
        new RegExp(`^${PROJECT_WIZARD_ROUTE}\\?new=\\d+$`)
      ));
    });
  });

  test('RecentProjects empty state create action routes to the project wizard', () => {
    render(<RecentProjects projects={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /create new project/i }));

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(
      new RegExp(`^${PROJECT_WIZARD_ROUTE}\\?new=\\d+$`)
    ));
  });
});
