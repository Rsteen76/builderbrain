import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Expense } from '../../../types';
import { ExpenseDashboardPanels } from './ExpenseDashboardPanels';

const theme = createTheme();

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Kitchen Remodel',
  category: 'materials',
  description: 'Concrete',
  amount: 100,
  date: new Date('2026-01-01'),
  status: 'pending',
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

function renderDashboard(props: Partial<React.ComponentProps<typeof ExpenseDashboardPanels>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ExpenseDashboardPanels
        expenses={[]}
        loading={false}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe('ExpenseDashboardPanels', () => {
  test('renders loading state for dashboard panels', () => {
    renderDashboard({ loading: true });

    expect(screen.getByText('Expense Breakdown by Category')).toBeInTheDocument();
    expect(screen.getByText('Expense Status Summary')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(2);
  });

  test('renders empty category state and zero total', () => {
    renderDashboard();

    expect(screen.getByText('No category data available')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  test('renders category, project, and status summaries', () => {
    renderDashboard({
      expenses: [
        expense({ amount: 100, projectName: 'Kitchen Remodel', category: 'materials', status: 'pending' }),
        expense({ id: 'expense-2', amount: 300, projectName: 'Garage Build', category: 'labor', status: 'paid' }),
      ],
    });

    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Labor')).toBeInTheDocument();
    expect(screen.getByText('Top Projects by Expense')).toBeInTheDocument();
    expect(screen.getByText('Garage Build')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('$400.00')).toBeInTheDocument();
  });

  test('hides top projects panel in project-specific context', () => {
    renderDashboard({
      projectId: 'project-1',
      expenses: [expense()],
    });

    expect(screen.queryByText('Top Projects by Expense')).not.toBeInTheDocument();
  });
});
