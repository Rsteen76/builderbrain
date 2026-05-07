import { useState, useEffect, useCallback } from 'react';
import { ExpenseService } from '../services/expense';
import { Expense } from '../types/expense.types'; // Ensure correct path
import { useAuth } from '../contexts/AuthContext';

interface ExpenseChartData {
  name: string; // Category name
  value: number; // Total amount
  color: string; // Color for the chart segment
}

interface UseProjectExpensesResult {
  expenses: Expense[];
  expensesChartData: ExpenseChartData[];
  loading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

// Define a set of colors for expense categories
const EXPENSE_CATEGORY_COLORS = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#795548', '#607d8b'];

/**
 * Custom hook to fetch and manage project expenses and related chart data.
 * Also handles real-time updates when expense statuses change via a global event.
 * @param projectId The ID of the project whose expenses are to be fetched.
 * @returns An object containing expenses, chart data, loading state, error state, and a refetch function.
 */
export const useProjectExpenses = (projectId: string | undefined): UseProjectExpensesResult => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesChartData, setExpensesChartData] = useState<ExpenseChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!projectId || !user?.uid) {
      setExpenses([]);
      setExpensesChartData([]);
      setLoading(false);
      setError(projectId ? 'User not authenticated' : 'Project ID is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const expenseData = await ExpenseService.getProjectExpenses(user.uid, projectId);
      // Use type assertion if necessary, though ideally the service returns the correct type
      setExpenses(expenseData as Expense[]);

      // Process expense data for charts - group by category
      const expensesByCategory = expenseData.reduce((acc, expense) => {
        const category = expense.category || 'uncategorized'; // Handle potential missing category
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      // Convert to chart format
      const chartData = Object.entries(expensesByCategory).map(([name, value], index) => ({
        name,
        value,
        color: EXPENSE_CATEGORY_COLORS[index % EXPENSE_CATEGORY_COLORS.length]
      }));
      setExpensesChartData(chartData);

    } catch (err) {
      console.error('useProjectExpenses: Error fetching expenses:', err);
      setError('Failed to load project expenses');
      setExpenses([]); // Clear expenses on error
      setExpensesChartData([]); // Clear chart data on error
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.uid]); // useCallback dependencies

  // Effect for initial fetch
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]); // useEffect depends on the memoized fetchExpenses

  // Effect for handling 'expense-status-changed' events
  useEffect(() => {
    const handleExpenseStatusChanged = (event: Event) => {
      // Check if this is our custom event and if it's for this project
      const customEvent = event as CustomEvent<{ projectId: string; [key: string]: any }>;

      if (customEvent.detail && customEvent.detail.projectId === projectId) {
        // Refetch expenses to get the updated status and potentially recalculate totals
        fetchExpenses();
      }
    };

    // Add event listener
    window.addEventListener('expense-status-changed', handleExpenseStatusChanged);

    // Cleanup: remove event listener
    return () => {
      window.removeEventListener('expense-status-changed', handleExpenseStatusChanged);
    };
  }, [projectId, fetchExpenses]); // Re-run if projectId or fetchExpenses changes

  return { expenses, expensesChartData, loading, error, fetchExpenses, setExpenses };
};
