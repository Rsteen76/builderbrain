import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Expense } from '../types';
import { expenseService } from '../api';

// Query key for expenses
const EXPENSES_QUERY_KEY = 'expenses';

// Debug function to check for undefined values in expense data
function logExpenseData(method: string, expense: Record<string, unknown>) { // Changed 'any' to 'Record<string, unknown>'
  console.log(`[useExpenses] ${method} - Checking expense data structure:`);
  console.log('  - Has paymentDetails?', Object.prototype.hasOwnProperty.call(expense, 'paymentDetails'));
  // Accessing expense.paymentDetails might require a type assertion or check if expense is Record<string, unknown>
  console.log('  - paymentDetails value:', (expense as { paymentDetails?: unknown }).paymentDetails);
  console.log('  - paymentDetails type:', expense.paymentDetails !== undefined ? typeof expense.paymentDetails : 'undefined');
  
  // Check for undefined values in top-level fields
  const undefinedFields: string[] = []; // Explicitly type undefinedFields
  for (const [key, value] of Object.entries(expense)) {
    if (value === undefined) {
      undefinedFields.push(key);
    }
  }
  
  if (undefinedFields.length > 0) {
    console.warn('[useExpenses] Found undefined values in fields:', undefinedFields);
  }
}

/**
 * Hook to fetch expenses by project ID
 */
export const useProjectExpenses = (
  projectId: string,
  filters?: {
    category?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  },
  enabled = true
) => {
  return useQuery(
    [EXPENSES_QUERY_KEY, 'project', projectId, filters],
    async () => {
      const response = await expenseService.getExpensesByProject(projectId, filters);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!projectId && enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook to fetch expenses by phase ID
 */
export const usePhaseExpenses = (phaseId: string, enabled = true) => {
  return useQuery(
    [EXPENSES_QUERY_KEY, 'phase', phaseId],
    async () => {
      const response = await expenseService.getExpensesByPhase(phaseId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!phaseId && enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook to fetch expenses by vendor
 */
export const useVendorExpenses = (vendor: string, enabled = true) => {
  return useQuery(
    [EXPENSES_QUERY_KEY, 'vendor', vendor],
    async () => {
      const response = await expenseService.getExpensesByVendor(vendor);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!vendor && enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook to fetch expenses by subcontractor ID
 */
export const useSubcontractorExpenses = (subcontractorId: string, enabled = true) => {
  return useQuery(
    [EXPENSES_QUERY_KEY, 'subcontractor', subcontractorId],
    async () => {
      const response = await expenseService.getExpensesBySubcontractor(subcontractorId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!subcontractorId && enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook to fetch a single expense by ID
 */
export const useExpense = (expenseId: string, enabled = true) => {
  return useQuery(
    [EXPENSES_QUERY_KEY, expenseId],
    async () => {
      const response = await expenseService.getById(expenseId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!expenseId && enabled,
    }
  );
};

/**
 * Hook to create a new expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Add debugging before sending to API
      logExpenseData('createExpense - before API call', expense);
      
      // Explicitly ensure paymentDetails is never undefined
      if (expense.paymentDetails === undefined) {
        console.log('[useExpenses] Setting undefined paymentDetails to null before API call');
        // Cast to Partial<Expense> to allow setting an optional property
        (expense as Partial<Expense>).paymentDetails = null; 
      }
      
      const now = new Date();
      const response = await expenseService.create({
        ...expense,
        createdAt: now,
        updatedAt: now,
      });
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to create expense'); // Ensure error message exists
      }
      return response.data;
    },
    {
      onSuccess: (newExpense) => {
        if (!newExpense) return;

        queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'project', newExpense.projectId]);
        
        if (newExpense.phaseId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'phase', newExpense.phaseId]);
        }
        
        if (newExpense.vendor) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'vendor', newExpense.vendor]);
        }
        
        if (newExpense.subcontractorId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'subcontractor', newExpense.subcontractorId]);
        }
        
        // Add the new expense to the cache
        queryClient.setQueryData([EXPENSES_QUERY_KEY, newExpense.id], newExpense);
      },
    }
  );
};

/**
 * Hook to update an existing expense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, expense }: { id: string; expense: Partial<Expense> }) => {
      // Add debugging before sending to API
      logExpenseData('updateExpense - before API call', expense);
      
      // Explicitly ensure paymentDetails is never undefined
      if (expense.paymentDetails === undefined) {
        console.log('[useExpenses] Setting undefined paymentDetails to null before API call');
        // Cast to Partial<Expense> to allow setting an optional property
        (expense as Partial<Expense>).paymentDetails = null;
      }
      
      // Assuming expenseService.update is typed to accept Partial<Expense>
      // where JS Dates are acceptable (service handles conversion).
      const response = await expenseService.update(id, expense);
      if (response.status === 'error') {
        throw new Error(response.error || `Failed to update expense ${id}`); // Ensure error message exists
      }
      return response.data;
    },
    {
      onSuccess: (updatedExpense) => {
        if (!updatedExpense) return;

        // Update the cache for this specific expense
        queryClient.setQueryData([EXPENSES_QUERY_KEY, updatedExpense.id], updatedExpense);
        
        // Invalidate relevant expense queries
        queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'project', updatedExpense.projectId]);
        
        if (updatedExpense.phaseId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'phase', updatedExpense.phaseId]);
        }
        
        if (updatedExpense.vendor) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'vendor', updatedExpense.vendor]);
        }
        
        if (updatedExpense.subcontractorId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'subcontractor', updatedExpense.subcontractorId]);
        }
      },
    }
  );
};

/**
 * Hook to approve an expense
 */
export const useApproveExpense = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ expenseId, approvedBy }: { expenseId: string; approvedBy: string }) => {
      const response = await expenseService.approveExpense(expenseId, approvedBy);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: (approvedExpense) => {
        if (!approvedExpense) return;

        // Update the cache for this specific expense
        queryClient.setQueryData([EXPENSES_QUERY_KEY, approvedExpense.id], approvedExpense);
        
        // Invalidate relevant expense queries
        queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'project', approvedExpense.projectId]);
        
        if (approvedExpense.phaseId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'phase', approvedExpense.phaseId]);
        }
        
        if (approvedExpense.vendor) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'vendor', approvedExpense.vendor]);
        }
        
        if (approvedExpense.subcontractorId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'subcontractor', approvedExpense.subcontractorId]);
        }
      },
    }
  );
};

/**
 * Hook to delete an expense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (expenseId: string) => {
      // Get the expense first so we can invalidate related queries
      const expenseResponse = await expenseService.getById(expenseId);
      const expense = expenseResponse.data;
      
      const response = await expenseService.delete(expenseId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      
      return expense;
    },
    {
      onSuccess: (expense) => {
        if (!expense) return;

        // Remove from the cache
        queryClient.removeQueries([EXPENSES_QUERY_KEY, expense.id]);
        
        // Invalidate relevant expense queries
        queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'project', expense.projectId]);
        
        if (expense.phaseId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'phase', expense.phaseId]);
        }
        
        if (expense.vendor) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'vendor', expense.vendor]);
        }
        
        if (expense.subcontractorId) {
          queryClient.invalidateQueries([EXPENSES_QUERY_KEY, 'subcontractor', expense.subcontractorId]);
        }
      },
    }
  );
}; 

// New Comprehensive Hook for fetching expenses with various filters
export interface UseExpensesFilters {
  status?: Expense['status'] | Expense['status'][];
  category?: Expense['category'];
  projectId?: string;
  phaseId?: string;
  subcontractorId?: string;
  // Add other filters as supported by expenseService.getExpenses
  // dateFrom?: Date;
  // dateTo?: Date;
}

export const useGetExpenses = (
  userId: string,
  filters?: UseExpensesFilters,
  enabled: boolean = true
) => {
  return useQuery<Expense[], Error>( // Explicitly type the return data and error
    [EXPENSES_QUERY_KEY, 'list', userId, filters], // Add 'list' for better key specificity
    async () => {
      // Assuming expenseService.getExpenses is the intended service method
      // This method should be part of your API client (e.g., ../api/expenseService)
      // and internally call the Firestore ExpenseService.getExpenses
      const response = await expenseService.getExpenses(userId, filters); 
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch expenses');
      }
      return response.data;
    },
    {
      enabled: !!userId && enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Consider adding onError for centralized error handling if desired
    }
  );
};
