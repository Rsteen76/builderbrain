import { Expense, ExpenseCategory, ExpenseStatus } from '../../../types';
import { formatExpenseCategory } from '../list/expenseListUtils';

export const EXPENSE_STATUS_ORDER: ExpenseStatus[] = [
  'pending',
  'approved',
  'partially_paid',
  'paid',
  'rejected',
];

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percentage: number;
}

export interface TopProjectExpenseItem {
  projectName: string;
  amount: number;
  percentage: number;
}

export interface StatusSummaryItem {
  status: ExpenseStatus;
  label: string;
  count: number;
  amount: number;
  percentage: number;
  startPercentage: number;
}

export function calculateTotalExpenseAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function getCategoryBreakdownItems(expenses: Expense[]): CategoryBreakdownItem[] {
  const total = calculateTotalExpenseAmount(expenses);
  const breakdown = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  return Object.entries(breakdown).map(([category, amount]) => ({
    category: category as ExpenseCategory,
    label: formatExpenseCategory(category),
    amount,
    percentage: total > 0 ? (amount / total) * 100 : 0,
  }));
}

export function getTopProjectExpenseItems(expenses: Expense[], limit = 5): TopProjectExpenseItem[] {
  const total = calculateTotalExpenseAmount(expenses);
  const projectTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    const projectName = expense.projectName || 'Unknown Project';
    acc[projectName] = (acc[projectName] || 0) + expense.amount;
    return acc;
  }, {});

  return Object.entries(projectTotals)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, limit)
    .map(([projectName, amount]) => ({
      projectName,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));
}

export function getStatusSummaryItems(expenses: Expense[]): StatusSummaryItem[] {
  const total = calculateTotalExpenseAmount(expenses);
  let startPercentage = 0;

  return EXPENSE_STATUS_ORDER.map(status => {
    const matchingExpenses = expenses.filter(expense => expense.status === status);
    const amount = matchingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    const item = {
      status,
      label: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      count: matchingExpenses.length,
      amount,
      percentage,
      startPercentage,
    };
    startPercentage += percentage;
    return item;
  });
}
