import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExpenseSummaryCards } from './ExpenseSummaryCards';
import { Expense } from '../../types';

const makeExpense = (
  id: string,
  amount: number,
  category: Expense['category'],
  description: string,
  projectId: string,
  status: Expense['status'],
): Expense => ({
  id,
  amount,
  category,
  description,
  projectId,
  status,
  userId: 'u1',
  createdBy: 'u1',
  date: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Mock data for expenses
const mockExpenses: Expense[] = [
  makeExpense('1', 100.00, 'materials', 'Expense 1', 'p1', 'pending'),
  makeExpense('2', 200.50, 'labor', 'Expense 2', 'p1', 'paid'),
  {
    ...makeExpense('3', 50.25, 'materials', 'Expense 3', 'p2', 'partially_paid'),
    amountPaid: 20,
  },
  makeExpense('4', 300, 'subcontractor', 'Expense 4', 'p2', 'approved'),
];

const emptyExpenses: Expense[] = [];

describe('ExpenseSummaryCards', () => {
  test('renders correctly with no expenses and not loading', () => {
    render(<ExpenseSummaryCards expenses={emptyExpenses} loading={false} totalExpenses={0} />);

    const totalExpensesCard = screen.getByText('Total Actual Cost').closest('div[role="article"]') as HTMLElement | null;
    expect(totalExpensesCard).toBeInTheDocument();
    if (totalExpensesCard) {
      expect(within(totalExpensesCard).getByText('$0.00')).toBeInTheDocument();
      expect(within(totalExpensesCard).getByText('Recorded job cost across transactions')).toBeInTheDocument();
    }
    
    const paidCard = screen.getByText('Paid').closest('div[role="article"]') as HTMLElement | null;
    expect(paidCard).toBeInTheDocument();
    if (paidCard) {
      expect(within(paidCard).getByText('$0.00')).toBeInTheDocument();
      expect(within(paidCard).getByText('Vendor and subcontractor costs paid')).toBeInTheDocument();
    }

    const approvedUnpaidCard = screen.getByText('Approved Unpaid').closest('div[role="article"]') as HTMLElement | null;
    expect(approvedUnpaidCard).toBeInTheDocument();
    if (approvedUnpaidCard) {
      expect(within(approvedUnpaidCard).getByText('$0.00')).toBeInTheDocument();
      expect(within(approvedUnpaidCard).getByText('Pending approval: $0.00')).toBeInTheDocument();
    }
    
    const transactionsCard = screen.getByText('Transactions').closest('div[role="article"]') as HTMLElement | null;
    expect(transactionsCard).toBeInTheDocument();
    if (transactionsCard) {
      expect(within(transactionsCard).getByText('0')).toBeInTheDocument();
      expect(within(transactionsCard).getByText('Average transaction: $0.00')).toBeInTheDocument();
    }
  });

  test('renders correctly with expenses and not loading', () => {
    const totalAmount = mockExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const paidAmount = 200.50 + 20;
    const approvedUnpaidAmount = 30.25 + 300;
    const pendingAmount = 100;
    
    render(<ExpenseSummaryCards expenses={mockExpenses} loading={false} totalExpenses={mockExpenses.length} />);

    const totalExpensesCard = screen.getByText('Total Actual Cost').closest('div[role="article"]') as HTMLElement | null;
    expect(totalExpensesCard).toBeInTheDocument();
    if (totalExpensesCard) {
        expect(within(totalExpensesCard).getByText(`$${totalAmount.toFixed(2)}`)).toBeInTheDocument();
    }

    const paidCard = screen.getByText('Paid').closest('div[role="article"]') as HTMLElement | null;
    expect(paidCard).toBeInTheDocument();
    if (paidCard) {
        expect(within(paidCard).getByText(`$${paidAmount.toFixed(2)}`)).toBeInTheDocument();
    }

    const approvedUnpaidCard = screen.getByText('Approved Unpaid').closest('div[role="article"]') as HTMLElement | null;
    expect(approvedUnpaidCard).toBeInTheDocument();
    if (approvedUnpaidCard) {
        expect(within(approvedUnpaidCard).getByText(`$${approvedUnpaidAmount.toFixed(2)}`)).toBeInTheDocument();
        expect(within(approvedUnpaidCard).getByText(`Pending approval: $${pendingAmount.toFixed(2)}`)).toBeInTheDocument();
    }

    const transactionsCard = screen.getByText('Transactions').closest('div[role="article"]') as HTMLElement | null;
    expect(transactionsCard).toBeInTheDocument();
    if (transactionsCard) {
        expect(within(transactionsCard).getByText(mockExpenses.length.toString())).toBeInTheDocument();
        expect(within(transactionsCard).getByText(`Average transaction: $${(totalAmount / mockExpenses.length).toFixed(2)}`)).toBeInTheDocument();
    }
  });

  test('renders skeletons when loading is true', () => {
    render(<ExpenseSummaryCards expenses={emptyExpenses} loading={true} totalExpenses={0} />);
    
    // Expect skeletons to be present. shadcn/ui Skeleton doesn't have a specific role by default.
    // We check for multiple skeletons. The exact number depends on the implementation detail.
    // A common way is to check if any element with a class typically used for skeletons exists.
    // Or, if the Skeleton component wraps content, check that the content is NOT visible.
    
    const totalExpensesCard = screen.getByText('Total Actual Cost').closest('div[role="article"]') as HTMLElement | null;
    if (totalExpensesCard) {
      expect(within(totalExpensesCard).queryByText('$0.00')).not.toBeInTheDocument(); // Value should be hidden
      // Check for a child that might be a skeleton (this is brittle, depends on Skeleton's DOM)
      // A better way would be if Skeleton had a data-testid or specific role.
      // For now, we assume if the value isn't there, the skeleton is.
    }

    const paidCard = screen.getByText('Paid').closest('div[role="article"]') as HTMLElement | null;
    if (paidCard) {
      expect(within(paidCard).queryByText('$0.00')).not.toBeInTheDocument();
    }

    const approvedUnpaidCard = screen.getByText('Approved Unpaid').closest('div[role="article"]') as HTMLElement | null;
    if (approvedUnpaidCard) {
      expect(within(approvedUnpaidCard).queryByText('$0.00')).not.toBeInTheDocument();
    }
    
    const transactionsCard = screen.getByText('Transactions').closest('div[role="article"]') as HTMLElement | null;
    if (transactionsCard) {
        expect(within(transactionsCard).queryByText('0')).not.toBeInTheDocument();
    }

    // A more robust way to check for skeletons if they have a consistent structure or test-id:
    // const skeletons = screen.getAllByTestId('skeleton'); // If Skeletons had data-testid="skeleton"
    // expect(skeletons.length).toBeGreaterThan(0); 
    // This test is a bit weak due to lack of specific selectors for Skeletons from shadcn/ui by default.
  });

  test('does not render placeholder content', () => {
    render(<ExpenseSummaryCards expenses={emptyExpenses} loading={false} totalExpenses={0} />);
    expect(screen.queryByText('Placeholder Card')).not.toBeInTheDocument();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
    expect(screen.queryByText('This is a placeholder card')).not.toBeInTheDocument();
  });
});
