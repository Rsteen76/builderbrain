import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Table, TableBody } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Expense } from '../../../types';
import { ExpenseRow } from './ExpenseRow';

const theme = createTheme();

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Project One',
  category: 'materials',
  description: 'Concrete',
  amount: 100,
  amountPaid: 25,
  date: new Date('2026-01-01'),
  status: 'partially_paid',
  vendor: 'Vendor One',
  subcontractorName: 'Sub One',
  tags: ['site'],
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const defaultProps: React.ComponentProps<typeof ExpenseRow> = {
  expense: expense(),
  groupBy: 'none',
  sortField: null,
  sortDirection: 'desc',
  onView: jest.fn(),
  onSort: jest.fn(),
  onEdit: jest.fn(),
  onPay: jest.fn(),
  onMenuOpen: jest.fn(),
};

function renderRow(props: Partial<React.ComponentProps<typeof ExpenseRow>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <Table>
        <TableBody>
          <ExpenseRow {...defaultProps} {...props} />
        </TableBody>
      </Table>
    </ThemeProvider>,
  );
}

describe('ExpenseRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders core expense fields and partially paid remaining amount', () => {
    renderRow();

    expect(screen.getByText('Concrete')).toBeInTheDocument();
    expect(screen.getByText('$75.00')).toBeInTheDocument();
    expect(screen.getByText('Paid: $25.00')).toBeInTheDocument();
    expect(screen.getByText('Partially Paid')).toBeInTheDocument();
    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Vendor One')).toBeInTheDocument();
    expect(screen.getByText('Sub One')).toBeInTheDocument();
    expect(screen.getByText('site')).toBeInTheDocument();
  });

  test('hides the grouped column', () => {
    renderRow({ groupBy: 'project' });

    expect(screen.queryByText('Project One')).not.toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
  });

  test('routes clicks to view, sort, and action callbacks', () => {
    renderRow();

    fireEvent.click(screen.getByText('Concrete'));
    expect(defaultProps.onView).toHaveBeenCalledWith(defaultProps.expense);

    fireEvent.click(screen.getByText('$75.00'));
    expect(defaultProps.onSort).toHaveBeenCalledWith('amount');
    expect(defaultProps.onView).toHaveBeenCalledTimes(1);

    const row = screen.getByRole('row');
    const buttons = within(row).getAllByRole('button');

    fireEvent.click(buttons[0]);
    expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.expense);

    fireEvent.click(buttons[1]);
    expect(defaultProps.onPay).toHaveBeenCalledWith(defaultProps.expense);

    fireEvent.click(buttons[2]);
    expect(defaultProps.onMenuOpen).toHaveBeenCalledWith(expect.any(Object), 'expense-1');
  });

  test('does not render pay action for paid expenses', () => {
    renderRow({ expense: expense({ status: 'paid' }) });

    expect(within(screen.getByRole('row')).getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
});
