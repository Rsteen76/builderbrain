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
import { BidService } from '../../services/bid';
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
    const processedExpenseData = {
      ...expenseData,
      paymentDetails: expenseData.paymentDetails === undefined ? null : expenseData.paymentDetails,
    };

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

        // Check if this expense is being marked as paid and has payment details
        if (expenseData.status === 'paid' && expenseData.paymentDetails &&
            expenseData.paymentStageId && expenseData.bidId) {
          logger.log('Expense is being marked as paid with payment details. Triggering bid adjustment...');

          // Extract the actual amount paid from the expense data
          const actualAmountPaid = expenseData.amount || 0;

          // Call the bid adjustment logic directly
          try {
            // Get the expense data
            const expenseToUpdate = expenses.find(e => e.id === expenseData.id);
            if (!expenseToUpdate) {
              throw new Error('Expense not found locally');
            }

            logger.log(`[handleSaveExpense][BidAdjust] Expense ${expenseData.id} - Actual Amount Paid: ${actualAmountPaid}`);

            // --- Start Bid Payment Schedule Adjustment Logic ---
            const paymentStageId = expenseToUpdate.paymentStageId;
            const projectId = expenseToUpdate.projectId;
            const bidId = expenseToUpdate.bidId;

            if (paymentStageId && projectId) {
              logger.log(`[handleSaveExpense][BidAdjust] Starting adjustment for stage ${paymentStageId} in project ${projectId}.`);

              // Fetch the full Bid associated with the project using getBids with a filter
              logger.log(`[handleSaveExpense][BidAdjust] Fetching bids for project ${projectId}...`);
              const bids = await BidService.getBids(user.uid, { projectId: projectId });

              if (!bids || bids.length === 0) {
                logger.warn(`[handleSaveExpense][BidAdjust] No Bid found for project ${projectId}. Skipping adjustment.`);
                return;
              }

              // If we have a specific bidId from the expense, use that to find the correct bid
              let bid;
              if (bidId) {
                bid = bids.find(b => b.id === bidId);
                if (bid) {
                  logger.log(`[handleSaveExpense][BidAdjust] Found specific Bid ID: ${bid.id} from expense`);
                } else {
                  logger.warn(`[handleSaveExpense][BidAdjust] Bid ID ${bidId} from expense not found. Using first bid.`);
                  bid = bids[0];
                }
              } else {
                // If no bidId in expense, use the first bid (with warning)
                if (bids.length > 1) {
                  logger.warn(`[handleSaveExpense][BidAdjust] Multiple bids found for project ${projectId}. Using the first one. Consider implications.`);
                }
                bid = bids[0];
              }

              logger.log(`[handleSaveExpense][BidAdjust] Using Bid ID: ${bid.id}`);

              if (!bid.paymentSchedule || !bid.paymentProgress) {
                logger.warn(`[handleSaveExpense][BidAdjust] Bid ${bid.id} is missing paymentSchedule or paymentProgress. Skipping adjustment.`);
              } else {
                logger.log(`[handleSaveExpense][BidAdjust] Bid has schedule and progress. Processing stage ${paymentStageId}.`);
                const schedule = [...bid.paymentSchedule]; // Work with a copy
                const progress = { ...bid.paymentProgress }; // Work with a copy

                const stageIndex = schedule.findIndex(stage => stage.id === paymentStageId);

                if (stageIndex === -1) {
                  logger.warn(`[handleSaveExpense][BidAdjust] Payment Stage ${paymentStageId} not found in Bid's schedule. Skipping adjustment.`);
                } else {
                  const paidStage = schedule[stageIndex];
                  const originalStageAmount = paidStage.amount;

                  logger.log(`[handleSaveExpense][BidAdjust] Found Stage ${paidStage.id} ('${paidStage.name}') with original amount ${originalStageAmount}.`);

                  // Update the paid stage status & details
                  paidStage.status = 'paid';
                  paidStage.paymentDate = new Date(); // Set payment date
                  paidStage.expenseId = expenseData.id; // Ensure link
                  // **CRITICAL:** Update the stage amount to the actual amount paid
                  paidStage.amount = actualAmountPaid;
                  logger.log(`[handleSaveExpense][BidAdjust] Updated paid stage ${paidStage.id} status to 'paid' and amount to actual: ${paidStage.amount}`);

                  // Recalculate overall payment progress based on ACTUAL amounts of ALL paid stages
                  let calculatedTotalPaid = 0;
                  schedule.forEach(stage => {
                    if (stage.status === 'paid') {
                      calculatedTotalPaid += stage.amount; // Use the updated actual amount for the current stage
                    }
                  });

                  const newTotalPaid = calculatedTotalPaid; // Use the recalculated total
                  const newRemaining = bid.totalAmount - newTotalPaid;

                  progress.paid = newTotalPaid;
                  progress.remaining = newRemaining;
                  // Recalculate pending amount
                  progress.pending = bid.totalAmount - newTotalPaid;
                  logger.log(`[handleSaveExpense][BidAdjust] Recalculated Bid Progress: Paid=${progress.paid}, Remaining=${progress.remaining}, Pending=${progress.pending}`);

                  // Check if adjustment is needed for subsequent stages based on the difference *for this stage*
                  const difference = actualAmountPaid - originalStageAmount;
                  logger.log(`[handleSaveExpense][BidAdjust] Payment difference for this stage: ${difference} (Actual: ${actualAmountPaid}, Scheduled Original: ${originalStageAmount})`);

                  if (Math.abs(difference) > 0.001) { // Use a small tolerance for float comparison
                    logger.log(`[handleSaveExpense][BidAdjust] Adjustment needed due to difference.`);
                    // Find the *last* pending stage
                    let lastPendingStageIndex = -1;
                    for (let i = schedule.length - 1; i >= 0; i--) {
                      if (schedule[i].status !== 'paid') {
                        lastPendingStageIndex = i;
                        break;
                      }
                    }
                    logger.log(`[handleSaveExpense][BidAdjust] Found last pending stage index: ${lastPendingStageIndex}`);

                    if (lastPendingStageIndex !== -1 && lastPendingStageIndex !== stageIndex) {
                      const lastPendingStage = schedule[lastPendingStageIndex];
                      logger.log(`[handleSaveExpense][BidAdjust] Adjusting last pending stage: ${lastPendingStage.id} ('${lastPendingStage.name}')`);
                      // Adjust the amount of the last pending stage
                      // The difference needs to be SUBTRACTED from the last stage
                      lastPendingStage.amount -= difference;
                      logger.log(`[handleSaveExpense][BidAdjust] Adjusted last pending stage amount to: ${lastPendingStage.amount}`);

                      // Update the final payment expense if it exists
                      if (lastPendingStage.expenseId) {
                        logger.log(`[handleSaveExpense][BidAdjust] Updating final payment expense: ${lastPendingStage.expenseId}`);
                        try {
                          // Update the expense amount to match the new stage amount
                          await ExpenseService.updateExpense(lastPendingStage.expenseId, {
                            amount: lastPendingStage.amount,
                            updatedAt: new Date()
                          });
                          logger.log(`[handleSaveExpense][BidAdjust] Final payment expense updated successfully`);
                        } catch (expenseUpdateError) {
                          logger.error(`[handleSaveExpense][BidAdjust] Error updating final payment expense:`, expenseUpdateError);
                        }
                      } else {
                        logger.log(`[handleSaveExpense][BidAdjust] No expense ID found for final payment stage`);
                      }
                    } else if (lastPendingStageIndex === stageIndex) {
                      // The stage being paid IS the last pending stage. Its amount is already updated above.
                      logger.log(`[handleSaveExpense][BidAdjust] The paid stage was the last pending stage. Amount already updated to actual paid.`);
                    } else {
                      logger.warn('[handleSaveExpense][BidAdjust] No pending stages left to adjust. Difference recorded in overall progress.');
                    }
                  } else {
                    logger.log(`[handleSaveExpense][BidAdjust] No adjustment needed for other stages (difference is negligible).`);
                  }

                  // Clean up the schedule and progress objects to ensure no undefined values
                  const cleanedSchedule = schedule.map(stage => {
                    // Create a clean copy of each stage
                    const cleanStage = { ...stage };

                    // Ensure all required fields are present and not undefined
                    if (cleanStage.paymentDate) {
                      // Convert to Firestore Timestamp if it's a Date
                      if (cleanStage.paymentDate instanceof Date) {
                        cleanStage.paymentDate = cleanStage.paymentDate;
                      }
                    }

                    if (cleanStage.createdAt) {
                      // Convert to Firestore Timestamp if it's a Date
                      if (cleanStage.createdAt instanceof Date) {
                        cleanStage.createdAt = cleanStage.createdAt;
                      }
                    }

                    if (cleanStage.updatedAt) {
                      // Convert to Firestore Timestamp if it's a Date
                      if (cleanStage.updatedAt instanceof Date) {
                        cleanStage.updatedAt = cleanStage.updatedAt;
                      }
                    }

                    if (cleanStage.dueDate) {
                      // Convert to Firestore Timestamp if it's a Date
                      if (cleanStage.dueDate instanceof Date) {
                        cleanStage.dueDate = cleanStage.dueDate;
                      }
                    }

                    // Remove any undefined values
                    Object.keys(cleanStage).forEach(key => {
                      if (cleanStage[key as keyof typeof cleanStage] === undefined) {
                        delete cleanStage[key as keyof typeof cleanStage];
                      }
                    });

                    return cleanStage;
                  });

                  // Clean up the progress object
                  const cleanedProgress = { ...progress };
                  Object.keys(cleanedProgress).forEach(key => {
                    if (cleanedProgress[key as keyof typeof cleanedProgress] === undefined) {
                      delete cleanedProgress[key as keyof typeof cleanedProgress];
                    }
                  });

                  // Create a clean update payload
                  const updatePayload = {
                    paymentSchedule: cleanedSchedule,
                    paymentProgress: cleanedProgress,
                    updatedAt: new Date()
                  };

                  await BidService.updateBid(bid.id, updatePayload);
                  logger.log(`[handleSaveExpense][BidAdjust] Bid ${bid.id} update successful.`);

                  // Refresh the expenses list to ensure all data is up to date
                  refetchExpenses();

                  // Show success message
                  setSnackbar({
                    open: true,
                    message: 'Expense marked as paid successfully',
                    severity: 'success'
                  });
                }
              }
            } else {
              logger.log('[handleSaveExpense] Expense not linked to a Payment Stage or Project ID. No Bid adjustment needed.');
            }
            // --- End Bid Payment Schedule Adjustment Logic ---
          } catch (bidUpdateError) {
            logger.error('[handleSaveExpense][BidAdjust] Error during Bid update:', bidUpdateError);
            // Decide if we should notify the user about this secondary failure
            setSnackbar({
              open: true,
              message: 'Expense marked as paid, but failed to update Bid schedule.',
              severity: 'warning'
            });
          }
        }
      } else {
        // Create new expense with required fields
        const newExpenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
          projectId: expenseData.projectId || '',
          category: expenseData.category || 'other',
          description: expenseData.description || '',
          amount: expenseData.amount || 0,
          date: expenseData.date || new Date(),
          status: expenseData.status || 'pending',
          vendor: expenseData.vendor || null,
          subcontractorId: expenseData.subcontractorId || null,
          subcontractorName: expenseData.subcontractorName || null,
          notes: expenseData.notes,
          phaseId: expenseData.phaseId || undefined,
          phaseName: expenseData.phaseName || undefined,
          tags: expenseData.tags || [],
          lineItems: expenseData.lineItems || undefined,
          paymentDetails: expenseData.paymentDetails || undefined,
        };

        savedExpense = await ExpenseService.createExpense(user.uid, newExpenseData);

        // Check if the expense should be visible in the current tab view
        const shouldShowInCurrentTab =
          tabValue === 0 || // All expenses tab
          (tabValue === 1 && savedExpense.status !== 'paid') || // Needs payment tab
          (tabValue === 2 && savedExpense.status === 'paid'); // Paid tab

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
      if (!(processedExpenseData.id === undefined && tabValue !== 0 &&
           ((tabValue === 1 && processedExpenseData.status === 'paid') ||
            (tabValue === 2 && processedExpenseData.status !== 'paid')))) {
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
