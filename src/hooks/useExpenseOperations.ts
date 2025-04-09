import { useCallback, useState } from 'react';
import { ExpenseService } from '../services/expense';
import { Expense } from '../types';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

// Define options/arguments for the hook
interface UseExpenseOperationsOptions {
  projectId: string; // Still useful for context, even if not passed to all service methods
  // Callback after a successful operation
  onExpenseUpdate?: (affectedExpense: Expense, operation: 'add' | 'update') => void;
  onExpenseDelete?: (deletedExpenseId: string) => void;
}

// Define the return type of the hook
interface UseExpenseOperationsReturn {
  isOperating: boolean;
  addExpense: (expenseData: Partial<Expense>) => Promise<Expense | null>; // Return created expense or null
  updateExpense: (expenseId: string, expenseData: Partial<Expense>) => Promise<void>; // Returns void
  deleteExpense: (expenseId: string) => Promise<void>;
}

/**
 * Hook to manage CRUD operations for expenses.
 */
export const useExpenseOperations = ({
  projectId, // Keep for potential future use or context checks
  onExpenseUpdate,
  onExpenseDelete,
}: UseExpenseOperationsOptions): UseExpenseOperationsReturn => {
  const { user } = useAuth();
  const [isOperating, setIsOperating] = useState(false);

  // Add Expense
  const addExpense = useCallback(async (expenseData: Partial<Expense>): Promise<Expense | null> => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return null;
    }
    // Optional: Check if projectId from options matches expenseData.projectId if present

    setIsOperating(true);
    let newExpense: Expense | null = null;
    try {
      // Ensure required fields for createExpense are present (adjust based on service needs)
      const dataToSave = { 
        ...expenseData, 
        projectId: expenseData.projectId || projectId, // Ensure projectId is set
        // userId is handled by createExpense 
      } as Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'>; 
      
      // Use the correct service method: createExpense
      newExpense = await ExpenseService.createExpense(user.uid, dataToSave);
      toast.success('Expense added successfully!');
      if (onExpenseUpdate && newExpense) {
        onExpenseUpdate(newExpense, 'add');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense.');
    } finally {
      setIsOperating(false);
    }
    return newExpense;
  }, [user?.uid, projectId, onExpenseUpdate]);

  // Update Expense
  const updateExpense = useCallback(async (expenseId: string, expenseData: Partial<Expense>) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }
    // Service method only needs id and data

    setIsOperating(true);
    try {
      // Use the correct service method: updateExpense(id, data)
      await ExpenseService.updateExpense(expenseId, expenseData);
      toast.success('Expense updated successfully!');
      // Since updateExpense returns void, we might need to fetch the updated expense
      // or rely on the caller to update state based on the input `expenseData`
      // For now, let's assume the caller handles the UI update optimistically or refetches.
      // Example: if (onExpenseUpdate) { onExpenseUpdate({id: expenseId, ...expenseData} as Expense, 'update'); }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense.');
    } finally {
      setIsOperating(false);
    }
  }, [user?.uid /* Removed projectId, onExpenseUpdate from deps if not used directly */]);

  // Delete Expense
  const deleteExpense = useCallback(async (expenseId: string) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }
    // Service method only needs id

    setIsOperating(true);
    try {
      // Use the correct service method: deleteExpense(id)
      await ExpenseService.deleteExpense(expenseId);
      toast.success('Expense deleted successfully!');
      if (onExpenseDelete) {
        onExpenseDelete(expenseId);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense.');
    } finally {
      setIsOperating(false);
    }
  }, [user?.uid, onExpenseDelete /* Removed projectId from deps */]);

  return {
    isOperating,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}; 