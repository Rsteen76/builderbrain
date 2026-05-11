import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Expense } from '../../../types';
import { ExpenseActionMenu } from './ExpenseActionMenu';

const anchorEl = document.createElement('button');

const expense = (status: Expense['status']): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  category: 'materials',
  description: 'Concrete',
  amount: 100,
  date: new Date('2026-01-01'),
  status,
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const defaultProps = {
  anchorEl,
  selectedExpense: expense('pending'),
  onClose: jest.fn(),
  onEdit: jest.fn(),
  onPay: jest.fn(),
  onDelete: jest.fn(),
};

describe('ExpenseActionMenu', () => {
  test('shows payment action for unpaid expenses', () => {
    render(<ExpenseActionMenu {...defaultProps} />);

    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
    expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('hides payment action for paid expenses', () => {
    render(
      <ExpenseActionMenu
        {...defaultProps}
        selectedExpense={expense('paid')}
      />,
    );

    expect(screen.queryByText('Mark as Paid')).not.toBeInTheDocument();
  });

  test('does not show payment action without a selected expense', () => {
    render(
      <ExpenseActionMenu
        {...defaultProps}
        selectedExpense={null}
      />,
    );

    expect(screen.queryByText('Mark as Paid')).not.toBeInTheDocument();
  });
});
