import { useState, useCallback } from 'react';
import { Expense } from '../types'; // Use the existing Expense type
import { logger } from '../utils/logger';
// import { ExpenseService } from '../services'; // Might need for fetching full expense data

// Define options for the hook
interface UseExpenseDialogOptions {
  onSubmitSuccess?: (expense: Expense) => void; // Callback on successful save
  onError?: (error: string) => void;          // Callback on error
  projectId?: string;                         // Optional default project ID
}

// Define the return type for the hook
interface UseExpenseDialogReturn {
  isExpenseDialogOpen: boolean;
  editingExpenseId: string | null;
  initialExpenseData: Partial<Expense> | null; // Use Partial<Expense>
  openNewExpenseDialog: (defaultData?: Partial<Expense>) => void; // Use Partial<Expense>
  openEditExpenseDialog: (expense: Expense) => void; // Or ExpenseSummary if applicable
  closeExpenseDialog: () => void;
  // Potentially add loading/error state similar to useBidDialogs
}

/**
 * Hook to manage the state for an expense form dialog.
 */
export const useExpenseFormDialog = (userId?: string, options: UseExpenseDialogOptions = {}): UseExpenseDialogReturn => {
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [initialExpenseData, setInitialExpenseData] = useState<Partial<Expense> | null>(null); // Use Partial<Expense>
  // Add loading/error state if needed
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // TODO: Implement helper to format Expense -> ExpenseFormData if needed

  const openNewExpenseDialog = useCallback((defaultData?: Partial<Expense>) => { // Use Partial<Expense>
    setEditingExpenseId(null);
    setInitialExpenseData({ projectId: options.projectId, ...defaultData });
    setIsExpenseDialogOpen(true);
    // setError(null);
  }, [options.projectId]);

  const openEditExpenseDialog = useCallback((expense: Expense) => {
    // TODO: Fetch full data if expense is a summary type
    // Ensure ID exists before setting
    if (typeof expense.id === 'string') { 
      // Use the expense object itself as initial data, assuming the form uses Expense fields
      setInitialExpenseData({ ...expense }); 
      setEditingExpenseId(expense.id);
      setIsExpenseDialogOpen(true);
    } else {
      logger.error('Cannot edit expense without a valid ID', expense);
      // Optionally call onError callback
      if (options.onError) {
        options.onError('Cannot edit expense without a valid ID.');
      }
    }
  }, [options.onError]);

  const closeExpenseDialog = useCallback(() => {
    setIsExpenseDialogOpen(false);
    setEditingExpenseId(null);
    setInitialExpenseData(null);
    // setError(null);
  }, []);
  
  // TODO: Add handler for successful submission (similar to useBidDialogs)

  return {
    isExpenseDialogOpen,
    editingExpenseId,
    initialExpenseData,
    openNewExpenseDialog,
    openEditExpenseDialog,
    closeExpenseDialog,
  };
};
