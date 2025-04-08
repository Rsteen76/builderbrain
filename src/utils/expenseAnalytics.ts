import { Expense } from '../types'; // Adjust path if needed

/**
 * Represents data formatted for expense category charts.
 */
export interface ExpenseChartData {
  name: string; // Category name
  value: number; // Total amount
  color: string; // Color for the chart segment
}

/**
 * Represents a summary of expenses broken down by status.
 */
export interface ExpenseBreakdown {
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
}

/**
 * Represents expenses formatted for certain display components.
 */
export interface CombinedExpenseData {
    name: string;
    budget: number; // Currently placeholder
    actual: number;
}

// Define a set of colors for expense categories
const EXPENSE_CATEGORY_COLORS = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#795548', '#607d8b'];

/**
 * Transforms raw expenses into a format suitable for combined display.
 * 
 * @param expenses An array of expense objects.
 * @returns An array of CombinedExpenseData objects.
 */
export const calculateCombinedExpenses = (expenses: Expense[]): CombinedExpenseData[] => {
  return expenses.map((expense: Expense) => ({
    name: expense.description || 'Unnamed Expense', 
    budget: 0, // Placeholder - determine how to get budget per expense if needed
    actual: expense.amount || 0,
  }));
};

/**
 * Calculates expense totals grouped by category for chart display.
 * 
 * @param expenses An array of expense objects.
 * @returns An array of ExpenseChartData objects.
 */
export const calculateExpensesChartData = (expenses: Expense[]): ExpenseChartData[] => {
  const expensesByCategory = expenses.reduce((acc, expense: Expense) => {
    const category = expense.category || 'uncategorized';
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData: ExpenseChartData[] = Object.entries(expensesByCategory).map(([name, value], index) => ({
    name,
    value,
    color: EXPENSE_CATEGORY_COLORS[index % EXPENSE_CATEGORY_COLORS.length]
  }));
  return chartData;
};

/**
 * Calculates expense totals grouped by status.
 * 
 * @param expenses An array of expense objects.
 * @returns An ExpenseBreakdown object with totals for each status.
 */
export const calculateExpenseBreakdown = (expenses: Expense[]): ExpenseBreakdown => {
  const breakdown: ExpenseBreakdown = {
    pending: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
  };
  expenses.forEach((expense: Expense) => {
    const status = expense.status || 'pending'; // Default to pending if status is missing
    if (status in breakdown) {
      breakdown[status as keyof typeof breakdown] += (expense.amount || 0);
    }
  });
  return breakdown;
}; 