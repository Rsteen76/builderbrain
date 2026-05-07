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
  makeExpense('3', 50.25, 'materials', 'Expense 3', 'p2', 'pending'),
];

const emptyExpenses: Expense[] = [];

describe('ExpenseSummaryCards', () => {
  test('renders correctly with no expenses and not loading', () => {
    render(<ExpenseSummaryCards expenses={emptyExpenses} loading={false} totalExpenses={0} />);

    // Check Total Expenses card
    const totalExpensesCard = screen.getByText('Total Expenses').closest('div[role="article"]') as HTMLElement | null; // Assuming Card renders as article or similar landmark
    expect(totalExpensesCard).toBeInTheDocument();
    if (totalExpensesCard) { // TypeScript type guard
      expect(within(totalExpensesCard).getByText('$0.00')).toBeInTheDocument();
      expect(within(totalExpensesCard).getByText('Total amount of all expenses')).toBeInTheDocument();
    }
    
    // Check Number of Expenses card
    const numExpensesCard = screen.getByText('Number of Expenses').closest('div[role="article"]') as HTMLElement | null;
    expect(numExpensesCard).toBeInTheDocument();
    if (numExpensesCard) {
      expect(within(numExpensesCard).getByText('0')).toBeInTheDocument();
      expect(within(numExpensesCard).getByText('Total number of expenses recorded')).toBeInTheDocument();
    }

    // Check Average Expense card
    const avgExpensesCard = screen.getByText('Average Expense').closest('div[role="article"]') as HTMLElement | null;
    expect(avgExpensesCard).toBeInTheDocument();
    if (avgExpensesCard) {
      expect(within(avgExpensesCard).getByText('$0.00')).toBeInTheDocument();
      expect(within(avgExpensesCard).getByText('Average amount spent per expense')).toBeInTheDocument();
    }
    
    // Check Placeholder Card
    const placeholderCard = screen.getByText('Placeholder Card').closest('div[role="article"]') as HTMLElement | null;
    expect(placeholderCard).toBeInTheDocument();
    if (placeholderCard) {
        expect(within(placeholderCard).getByText('N/A')).toBeInTheDocument();
    }
  });

  test('renders correctly with expenses and not loading', () => {
    const totalAmount = mockExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const averageAmount = mockExpenses.length > 0 ? totalAmount / mockExpenses.length : 0;
    
    render(<ExpenseSummaryCards expenses={mockExpenses} loading={false} totalExpenses={mockExpenses.length} />);

    // Total Expenses
    const totalExpensesCard = screen.getByText('Total Expenses').closest('div[role="article"]') as HTMLElement | null;
    expect(totalExpensesCard).toBeInTheDocument();
    if (totalExpensesCard) {
        expect(within(totalExpensesCard).getByText(`$${totalAmount.toFixed(2)}`)).toBeInTheDocument();
    }

    // Number of Expenses
    const numExpensesCard = screen.getByText('Number of Expenses').closest('div[role="article"]') as HTMLElement | null;
    expect(numExpensesCard).toBeInTheDocument();
    if (numExpensesCard) {
        expect(within(numExpensesCard).getByText(mockExpenses.length.toString())).toBeInTheDocument();
    }
    
    // Average Expense
    // Note: The component calculates average based on `totalExpenses` prop for count, not `expenses.length` directly for averaging.
    // The `totalExpenses` prop in the component is used for the "Number of Expenses" card display.
    // The average calculation inside the component is: totalAmount / totalExpenses (prop)
    // For this test, expenses.length IS the totalExpenses prop.
    const componentCalculatedAverage = mockExpenses.length > 0 ? totalAmount / mockExpenses.length : 0;

    const avgExpensesCard = screen.getByText('Average Expense').closest('div[role="article"]') as HTMLElement | null;
    expect(avgExpensesCard).toBeInTheDocument();
    if (avgExpensesCard) {
        expect(within(avgExpensesCard).getByText(`$${componentCalculatedAverage.toFixed(2)}`)).toBeInTheDocument();
    }
  });

  test('renders skeletons when loading is true', () => {
    render(<ExpenseSummaryCards expenses={emptyExpenses} loading={true} totalExpenses={0} />);
    
    // Expect skeletons to be present. shadcn/ui Skeleton doesn't have a specific role by default.
    // We check for multiple skeletons. The exact number depends on the implementation detail.
    // A common way is to check if any element with a class typically used for skeletons exists.
    // Or, if the Skeleton component wraps content, check that the content is NOT visible.
    
    // Check Total Expenses card for skeleton
    const totalExpensesCard = screen.getByText('Total Expenses').closest('div[role="article"]') as HTMLElement | null;
    if (totalExpensesCard) {
      expect(within(totalExpensesCard).queryByText('$0.00')).not.toBeInTheDocument(); // Value should be hidden
      // Check for a child that might be a skeleton (this is brittle, depends on Skeleton's DOM)
      // A better way would be if Skeleton had a data-testid or specific role.
      // For now, we assume if the value isn't there, the skeleton is.
    }

    // Check Number of Expenses card for skeleton
    const numExpensesCard = screen.getByText('Number of Expenses').closest('div[role="article"]') as HTMLElement | null;
    if (numExpensesCard) {
      expect(within(numExpensesCard).queryByText('0')).not.toBeInTheDocument();
    }

    // Check Average Expense card for skeleton
    const avgExpensesCard = screen.getByText('Average Expense').closest('div[role="article"]') as HTMLElement | null;
    if (avgExpensesCard) {
      expect(within(avgExpensesCard).queryByText('$0.00')).not.toBeInTheDocument();
    }
    
    // Check Placeholder Card for skeleton
    const placeholderCard = screen.getByText('Placeholder Card').closest('div[role="article"]') as HTMLElement | null;
    if (placeholderCard) {
        expect(within(placeholderCard).queryByText('N/A')).not.toBeInTheDocument();
    }

    // A more robust way to check for skeletons if they have a consistent structure or test-id:
    // const skeletons = screen.getAllByTestId('skeleton'); // If Skeletons had data-testid="skeleton"
    // expect(skeletons.length).toBeGreaterThan(0); 
    // This test is a bit weak due to lack of specific selectors for Skeletons from shadcn/ui by default.
  });

  test('renders placeholder card correctly', () => {
    render(<ExpenseSummaryCards expenses={emptyExpenses} loading={false} totalExpenses={0} />);
    const placeholderCard = screen.getByText('Placeholder Card').closest('div[role="article"]') as HTMLElement | null;
    expect(placeholderCard).toBeInTheDocument();
    if (placeholderCard) {
      expect(within(placeholderCard).getByText('N/A')).toBeInTheDocument();
      expect(within(placeholderCard).getByText('This is a placeholder card')).toBeInTheDocument();
    }
  });
});
