import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  useTheme,
} from '@mui/material';
import { logger } from '../../utils/logger';
import { ExpenseSummaryCards } from "./ExpenseSummaryCards";
import { ExpenseTable } from "./ExpenseTable";
import { ExpenseService } from '../../services/expense'; // Will be indirectly used via useGetExpenses
import { ProjectService } from '../../services/project';
import { Expense, PaymentDetails, Project, ProjectPhase } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useGetExpenses } from '../../hooks/use-expenses'; // Import the new hook
import { mapToProjectPhase } from '../../utils/projectUtils'; // Import mapToProjectPhase
import { useExpensePayment } from '../../hooks/useExpensePayment'; // Import the hook
import { ExpenseRow } from './list/ExpenseRow';
import {
  ExpenseGroupBy,
  ExpenseSortDirection,
  ExpenseSortField,
  addProjectNames,
  buildExpenseHookFilters,
  calculateGroupTotals,
  filterExpensesBySearch,
  getNextSortState,
  groupExpenses,
  sortExpenses,
} from './list/expenseListUtils';
import { ExpenseActionMenu } from './page/ExpenseActionMenu';
import { ExpenseDashboardPanels } from './page/ExpenseDashboardPanels';
import { ExpensePageDialogs } from './page/ExpensePageDialogs';
import { ExpensePageHeader } from './page/ExpensePageHeader';
import {
  ExpensePageNotifications,
  ExpenseSnackbarState,
} from './page/ExpensePageNotifications';
import { ExpenseTabsAndControls } from './page/ExpenseTabsAndControls';
import { adjustPaidExpenseBidSchedule } from './page/expenseBidAdjustment';
import {
  buildNewExpenseData,
  normalizeExpensePaymentDetails,
  shouldShowCreatedExpenseInCurrentTab,
  shouldShowDefaultSaveSuccess,
} from './page/expenseSaveFlow';

const Expenses: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const theme = useTheme();
  const { user } = useAuth();
  // Removed: const [loading, setLoading] = useState(true);
  // Removed: const [error, setError] = useState<string | null>(null);
  // Removed: const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Partial<Expense> | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProjectPhases, setSelectedProjectPhases] = useState<ProjectPhase[]>([]);
  const [snackbar, setSnackbar] = useState<ExpenseSnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // NEW: Add sort state
  const [sortField, setSortField] = useState<ExpenseSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<ExpenseSortDirection>('desc');

  // NEW: Grouping functionality
  const [groupBy, setGroupBy] = useState<ExpenseGroupBy>('none');
  // Hook for processing payments
  const { isProcessing: isPaymentProcessing, error: paymentError, processExpensePayment } = useExpensePayment();

  // Prepare filters for useGetExpenses hook
  const expenseHookFilters = React.useMemo(
    () => buildExpenseHookFilters(tabValue, categoryFilter, projectFilter, projectId),
    [tabValue, categoryFilter, projectFilter, projectId],
  );

  const {
    data: rawFetchedExpenses,
    isLoading: expensesListIsLoading,
    isError: expensesListIsError,
    error: expensesListError,
    refetch: refetchExpenses
  } = useGetExpenses(user?.uid || '', expenseHookFilters, !!user?.uid);

  // Process fetched expenses to add project names and handle undefined data
  const expenses = React.useMemo(() => {
    return addProjectNames(rawFetchedExpenses, projects);
  }, [rawFetchedExpenses, projects]);

  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
      // Expense data is loaded by useGetExpenses based on its query key.
    }
  // Key dependencies for fetching projects.
  // useGetExpenses handles its own dependencies via its query key (userId, filters).
  // `submitting` is removed; refetchExpenses will be called explicitly in mutation onSuccess.
  }, [user]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expenseId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedExpenseId(expenseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpenseId(null);
  };

  const handleEditFromMenu = () => {
    if (selectedExpenseId) {
      const expenseToEdit = expenses.find(exp => exp.id === selectedExpenseId);
      if (expenseToEdit) {
        setSelectedExpense(expenseToEdit);
        const project = projects.find(p => p.id === expenseToEdit.projectId);
        // Apply filter/map directly before setting state
        const phases: ProjectPhase[] = (project?.phases || [])
            .filter(p => !!p?.id && !!p?.name)
            .map(mapToProjectPhase);
        setSelectedProjectPhases(phases);
        setExpenseModalOpen(true);
      }
    }
    handleMenuClose();
  };

  const handlePayFromMenu = () => {
    if (selectedExpenseId) {
      const expenseToEdit = expenses.find(exp => exp.id === selectedExpenseId);
      if (expenseToEdit) {
        setSelectedExpense(expenseToEdit);
        setPaymentModalOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedExpenseId && user?.uid) {
      ExpenseService.deleteExpense(selectedExpenseId) // This still uses ExpenseService directly, consider useDeleteExpense hook later
        .then(() => {
          // setExpenses(expenses.filter(exp => exp.id !== selectedExpenseId)); // Optimistic update, or rely on refetch
          refetchExpenses(); // Refetch after delete
          setSnackbar({
            open: true,
            message: 'Expense deleted successfully',
            severity: 'success'
          });
        })
        .catch((err: unknown) => {
          logger.error('Error deleting expense:', err);
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          setSnackbar({
            open: true,
            message: 'Failed to delete expense: ' + errorMessage,
            severity: 'error'
          });
        })
        .finally(() => {
          // setLoading(false); // Handled by useQuery's isLoading
        });
    }
    handleMenuClose();
  };

  const fetchProjects = async () => { // This remains as projects are fetched separately
    if (!user?.uid) return;
    // Consider moving project fetching to its own hook if it becomes complex
    try {
      const fetchedProjects = await ProjectService.getProjects(user.uid);
      const validatedProjects = fetchedProjects.map(proj => ({
        ...proj,
        phases: (proj.phases || [])
                  .filter(p => !!p?.id && !!p?.name)
                  .map(mapToProjectPhase)
      }));
      setProjects(validatedProjects);
    } catch (err) {
      logger.error('Error fetching projects:', err);
      // Optionally set a specific project error state if needed
    }
  };

  // Removed fetchExpenses function as its logic is now in useGetExpenses hook

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue); // This will trigger a refetch in useGetExpenses due to query key change
  };

  const handleRefresh = () => {
    fetchProjects(); // Still fetch projects if they can be updated
    refetchExpenses(); // Refetch expenses using the hook's function
    setSnackbar({
      open: true,
      message: 'Expenses refreshed',
      severity: 'info'
    });
  };

  const handleAddExpense = () => {
    if (projectId) {
      const currentProject = projects.find(p => p.id === projectId);
      // Apply filter/map directly before setting state
      const projectPhases: ProjectPhase[] = (currentProject?.phases || [])
            .filter(p => !!p?.id && !!p?.name)
            .map(mapToProjectPhase);
      setSelectedProjectPhases(projectPhases);

      const initialExpenseData: Partial<Expense> = {
        projectId: projectId,
        ...(projectPhases.length === 1 && projectPhases[0].id ? {
            phaseId: projectPhases[0].id,
            phaseName: projectPhases[0].name
        } : {})
      };

      logger.log('handleAddExpense (Project Context): Initializing with:', initialExpenseData, 'Phases:', projectPhases);
      setSelectedExpense(initialExpenseData);
    } else {
      logger.log('handleAddExpense (General Context): Resetting');
      setSelectedExpense(null);
      setSelectedProjectPhases([]);
    }

    setExpenseModalOpen(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    const project = projects.find(p => p.id === expense.projectId);
    // Apply filter/map directly before setting state
    const phases: ProjectPhase[] = (project?.phases || [])
            .filter(p => !!p?.id && !!p?.name)
            .map(mapToProjectPhase);
    setSelectedProjectPhases(phases);
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseModalOpen(true);
  };

  const handlePayExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setPaymentModalOpen(true);
  };

  const handleCloseModal = () => {
    setExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
  };

  // Removed handleMarkAsPaid and adjustBidPaymentSchedule as their logic is now in useExpensePayment hook

  // Create a properly typed expense object
  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    if (!user?.uid) return;

    // DEBUGGING: Add detailed logging for paymentDetails
    logger.log('======= EXPENSE SAVE DEBUGGING =======');
    logger.log('Raw expense data received by Expenses component:', expenseData);
    logger.log('PaymentDetails value:', expenseData.paymentDetails);
    logger.log('PaymentDetails type:', expenseData.paymentDetails !== undefined ?
      typeof expenseData.paymentDetails : 'undefined');
    logger.log('PaymentDetails stringified:',
      expenseData.paymentDetails !== undefined ?
      JSON.stringify(expenseData.paymentDetails) : 'undefined');
    logger.log('Full expense data JSON stringified:', JSON.stringify(expenseData));

    // Ensure paymentDetails is either a valid object or null, not undefined.
    const processedExpenseData = normalizeExpensePaymentDetails(expenseData);

    setSubmitting(true);
    let savedExpense: Expense;

    try {
      if (processedExpenseData.id) {
        // Update existing expense
        logger.log('Before update - expense data:', processedExpenseData);
        logger.log('Before update - existing expense:', expenses.find(e => e.id === processedExpenseData.id));

        await ExpenseService.updateExpense(processedExpenseData.id, processedExpenseData);

        // Instead of complex local state updates that can cause inconsistencies,
        // trigger a complete refresh of the expenses data from the server
        // This ensures we always have the latest data directly from the database
        // await fetchExpenses(); // Replaced by refetchExpenses or query invalidation
        refetchExpenses();

        logger.log('Updated expense in the database and refreshed all expense data');
        savedExpense = { ...processedExpenseData } as Expense; // Use processedExpenseData

        // Show success message
        setSnackbar({
          open: true,
          message: 'Expense updated successfully',
          severity: 'success'
        });

        const bidAdjustment = await adjustPaidExpenseBidSchedule({
          userId: user.uid,
          expenseData,
          expenses,
          refetchExpenses,
          showSnackbar: setSnackbar,
        });

        if (bidAdjustment.shouldStopSaveFlow) {
          return;
        }
      } else {
        // Create new expense with required fields
        const newExpenseData = buildNewExpenseData(expenseData);

        savedExpense = await ExpenseService.createExpense(user.uid, newExpenseData);

        // Check if the expense should be visible in the current tab view
        const shouldShowInCurrentTab = shouldShowCreatedExpenseInCurrentTab(savedExpense, tabValue);

        refetchExpenses();

        if (!shouldShowInCurrentTab) {
          // If the expense doesn't match the current tab filter, show a note to the user
          logger.log('New expense added but not visible in current tab view');
          setSnackbar({
            open: true,
            message: 'Expense created successfully. Switch tabs to view it.',
            severity: 'info'
          });
        }
      }

      // Close modal
      handleCloseModal();

      // Show success message (only if we didn't already show the tab-specific message)
      if (shouldShowDefaultSaveSuccess(processedExpenseData, tabValue)) {
        setSnackbar({
          open: true,
          message: `Expense ${processedExpenseData.id ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
      }
    } catch (err: unknown) {
      logger.error('Error saving expense:', err);

      let errorMessage = `Failed to ${processedExpenseData.id ? 'update' : 'create'} expense`;
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage += `: ${err}`;
      } else {
        errorMessage += ': An unknown error occurred.';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = React.useMemo(
    () => filterExpensesBySearch(expenses, searchTerm),
    [expenses, searchTerm],
  );

  // NEW: Add sorting function
  const sortedExpenses = React.useMemo(() => {
    return sortExpenses(filteredExpenses, sortField, sortDirection);
  }, [filteredExpenses, sortField, sortDirection]);

  // NEW: Handle sort click
  const handleSortClick = (field: ExpenseSortField) => {
    const nextSortState = getNextSortState(sortField, sortDirection, field);
    setSortField(nextSortState.sortField);
    setSortDirection(nextSortState.sortDirection);

    // Clear any grouping when sorting
    if (groupBy !== 'none') {
      setGroupBy('none');
    }
  };

  // Group expenses based on selected grouping
  const groupedExpenses = React.useMemo(() => {
    return groupExpenses(sortedExpenses, groupBy);
  }, [sortedExpenses, groupBy]);

  // Calculate group totals
  const groupTotals = React.useMemo(() => {
    return calculateGroupTotals(groupedExpenses);
  }, [groupedExpenses]);

  const renderExpenseRow = (expense: Expense) => {
    return (
      <ExpenseRow
        key={expense.id}
        expense={expense}
        groupBy={groupBy}
        sortField={sortField}
        sortDirection={sortDirection}
        onView={handleViewExpense}
        onSort={handleSortClick}
        onEdit={handleEditExpense}
        onPay={handlePayExpense}
        onMenuOpen={handleMenuOpen}
      />
    );
  };

  // Find the full expense object for the Payment Modal when rendering
  const fullExpenseForPayment = React.useMemo(() => {
      if (!selectedExpense?.id) return null;
      // Find the full object from the main expenses list
      return expenses.find(e => e.id === selectedExpense.id) || null;
  }, [selectedExpense, expenses]);

  const handleSavePayment = async (actualAmountPaid: number, paymentDetails: PaymentDetails) => {
    if (fullExpenseForPayment?.id && user) { // Ensure user is available
      setSubmitting(true); // Use submitting state from Expenses.tsx for general feedback if desired
      const result = await processExpensePayment(
        user,
        fullExpenseForPayment, // Pass the full expense object
        actualAmountPaid,
        paymentDetails
      );
      setSubmitting(false);
      if (result.success) {
        refetchExpenses(); // Refresh expenses list
        setSnackbar({ open: true, message: result.message, severity: 'success' });
        if (result.updatedBid) {
          logger.log("Bid was updated as part of payment processing:", result.updatedBid);
          // Optionally, could also trigger a refresh/update of bids list if displayed elsewhere
        }
      } else {
        setSnackbar({ open: true, message: result.message, severity: 'error' });
        // Display paymentError from hook if needed, though snackbar might be enough
        if (paymentError) logger.error("Payment Processing Error:", paymentError);
      }
      handleClosePaymentModal(); // Close modal regardless of success/failure for now
    } else {
      logger.error('[Expenses] PaymentFormModal onSave called, but required data (expense ID or user) is missing.', {
        fullExpenseForPaymentId: fullExpenseForPayment?.id, // Corrected logging variable name
        userId: user?.uid,
      });
      setSnackbar({ open: true, message: 'Error: Missing expense data or user information.', severity: 'error'});
    }
  };

  const selectedMenuExpense = React.useMemo(() => {
    if (!selectedExpenseId) return null;
    return expenses.find(e => e.id === selectedExpenseId) || null;
  }, [selectedExpenseId, expenses]);

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <ExpensePageHeader onAddExpense={handleAddExpense} />

      {/* Error message */}
      {expensesListIsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {expensesListError instanceof Error ? expensesListError.message : 'An unknown error occurred while fetching expenses.'}
        </Alert>
      )}

      {/* Summary cards */}
      <Box sx={{ mb: 4 }}>
        <ExpenseSummaryCards
          expenses={expenses} // Processed expenses
          loading={expensesListIsLoading} // Use hook's loading state
          totalExpenses={expenses.length}
        />
      </Box>

      <ExpenseDashboardPanels
        expenses={expenses}
        loading={expensesListIsLoading}
        projectId={projectId}
      />

      <ExpenseTabsAndControls
        theme={theme}
        tabValue={tabValue}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projects={projects}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        onRefresh={handleRefresh}
        projectId={projectId}
      />

      {/* Expenses table */}
      <ExpenseTable
        theme={theme}
        loading={expensesListIsLoading} // Use hook's loading state
        sortedExpenses={sortedExpenses} // This is derived from processed 'expenses'
        groupedExpenses={groupedExpenses} // This is derived from processed 'expenses'
        groupBy={groupBy}
        groupTotals={groupTotals}
        renderExpenseRow={renderExpenseRow}
        handleSortClick={handleSortClick}
        sortField={sortField}
        sortDirection={sortDirection}
        searchTerm={searchTerm}
      />

      <ExpenseActionMenu
        anchorEl={anchorEl}
        selectedExpense={selectedMenuExpense}
        onClose={handleMenuClose}
        onEdit={handleEditFromMenu}
        onPay={handlePayFromMenu}
        onDelete={handleDeleteFromMenu}
      />

      <ExpensePageDialogs
        expenseModalOpen={expenseModalOpen}
        paymentModalOpen={paymentModalOpen}
        selectedExpense={selectedExpense}
        fullExpenseForPayment={fullExpenseForPayment}
        projects={projects}
        projectPhases={selectedProjectPhases}
        onCloseExpenseModal={handleCloseModal}
        onClosePaymentModal={handleClosePaymentModal}
        onSaveExpense={handleSaveExpense}
        onSavePayment={handleSavePayment}
      />

      <ExpensePageNotifications
        paymentError={paymentError}
        snackbar={snackbar}
        onSnackbarClose={handleSnackbarClose}
      />
    </Box>
  );
};

export default Expenses;
