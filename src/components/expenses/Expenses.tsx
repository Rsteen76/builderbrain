import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  // Card, // Removed, was used by old summary cards
  // CardContent, // Removed
  // CardActions, // Removed
  Tabs,
  Tab,
  // TextField, // Removed, used in ExpenseControls
  // InputAdornment, // Removed, used in ExpenseControls
  IconButton,
  Chip,
  Paper, // Still used for remaining summary sections
  Divider,
  Stack,
  CircularProgress, // Still used for remaining summary sections
  Alert,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  Snackbar,
  // FormControl, // Removed, used in ExpenseControls
  // InputLabel, // Removed, used in ExpenseControls
  // Select, // Removed, used in ExpenseControls
  // TableContainer, // Removed, used in ExpenseTable
  // Table, // Removed, used in ExpenseTable
  // TableHead, // Removed, used in ExpenseTable
  // TableBody, // Removed, used in ExpenseTable
  TableRow,
  TableCell,
  alpha, // Used by renderExpenseRow and ::-webkit-scrollbar
  Tooltip, // Used by renderExpenseRow
  LinearProgress, // Used in remaining summary section
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { logger } from '../../utils/logger';
import {
  Add as AddIcon,
  // Search as SearchIcon, // Removed, used in ExpenseControls
  // FilterList as FilterListIcon, // Removed, used in ExpenseControls
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Paid as PaidIcon,
  CalendarToday as CalendarIcon,
  Business as VendorIcon,
  Assignment as ProjectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  // DeleteOutline as DeleteOutlineIcon, // Removed, used in ExpenseControls
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from '@mui/icons-material';
import { ExpenseSummaryCards } from "./ExpenseSummaryCards";
import { ExpenseControls } from "./ExpenseControls";
import { ExpenseTable } from "./ExpenseTable";
import { ExpenseService } from '../../services/expense'; // Will be indirectly used via useGetExpenses
import { ProjectService } from '../../services/project';
import { Expense, Project, ProjectPhase, ExpenseCategory, ExpenseStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useGetExpenses, UseExpensesFilters } from '../../hooks/use-expenses'; // Import the new hook
import { formatCurrency, formatDate } from '../../utils/formatters';
import ExpenseFormModal from './ExpenseFormModal';
import PaymentFormModal from './PaymentFormModal';
import { BidService } from '../../services/bid';
import { BidPaymentStage } from '../../types';
import { mapToProjectPhase } from '../../utils/projectUtils'; // Import mapToProjectPhase
import { useExpensePayment } from '../../hooks/useExpensePayment'; // Import the hook

// Category icons mapping
const CATEGORY_ICONS = {
  labor: <Avatar sx={{ bgcolor: '#E1F5FE', color: '#0288D1' }}><BusinessIcon /></Avatar>,
  materials: <Avatar sx={{ bgcolor: '#E8F5E9', color: '#388E3C' }}><CategoryIcon /></Avatar>,
  equipment: <Avatar sx={{ bgcolor: '#FFF8E1', color: '#FFA000' }}><CategoryIcon /></Avatar>,
  permits: <Avatar sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2' }}><ReceiptIcon /></Avatar>,
  other: <Avatar sx={{ bgcolor: '#ECEFF1', color: '#607D8B' }}><DescriptionIcon /></Avatar>,
};

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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // NEW: Add sort state
  const [sortField, setSortField] = useState<'amount' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // NEW: Grouping functionality
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'category' | 'vendor' | 'subcontractor'>('none');
  // Hook for processing payments
  const { isProcessing: isPaymentProcessing, error: paymentError, processExpensePayment } = useExpensePayment();

  // Prepare filters for useGetExpenses hook
  const expenseHookFilters = React.useMemo(() => {
    const filters: UseExpensesFilters = {};
    if (tabValue === 1) filters.status = ['pending', 'approved'] as ExpenseStatus[];
    else if (tabValue === 2) filters.status = 'paid';
    if (categoryFilter) filters.category = categoryFilter as ExpenseCategory;
    if (projectId) filters.projectId = projectId; // If component has projectId prop, it takes precedence
    else if (projectFilter) filters.projectId = projectFilter;
    return filters;
  }, [tabValue, categoryFilter, projectFilter, projectId]);

  const {
    data: rawFetchedExpenses,
    isLoading: expensesListIsLoading,
    isError: expensesListIsError,
    error: expensesListError,
    refetch: refetchExpenses
  } = useGetExpenses(user?.uid || '', expenseHookFilters, !!user?.uid);

  // Process fetched expenses to add project names and handle undefined data
  const expenses = React.useMemo(() => {
    if (!rawFetchedExpenses) return [];
    return rawFetchedExpenses.map(exp => ({
      ...exp,
      projectName: projects.find(p => p.id === exp.projectId)?.name || 'Unknown Project',
    }));
  }, [rawFetchedExpenses, projects]);

  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
      // fetchExpenses(); // Removed, react-query handles this via useGetExpenses based on key changes
    }
  // Key dependencies for fetching projects.
  // useGetExpenses handles its own dependencies via its query key (userId, filters).
  // `submitting` is removed; refetchExpenses will be called explicitly in mutation onSuccess.
  }, [user]);

  // Calculate summary data based on processed expenses
  const totalExpensesValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const needsPaymentExpensesValue = expenses.filter(e => e.status !== 'paid').reduce((sum, e) => sum + e.amount, 0);
  const paidExpensesValue = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

  // Calculate category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

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

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => {
    if (!searchTerm) return true;

    return (
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.subcontractorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // NEW: Add sorting function
  const sortedExpenses = React.useMemo(() => {
    if (!sortField) return filteredExpenses;

    return [...filteredExpenses].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  }, [filteredExpenses, sortField, sortDirection]);

  // NEW: Handle sort click
  const handleSortClick = (field: 'amount' | 'date') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending (newest/highest first)
      setSortField(field);
      setSortDirection('desc');
    }
    // Clear any grouping when sorting
    if (groupBy !== 'none') {
      setGroupBy('none');
    }
  };

  // Group expenses based on selected grouping
  const groupedExpenses = React.useMemo(() => {
    // Use the sorted expenses list instead of filtered
    if (groupBy === 'none') {
      return { 'All Expenses': sortedExpenses };
    }

    const groups: Record<string, any[]> = {};

    sortedExpenses.forEach(expense => {
      let groupKey = '';

      switch (groupBy) {
        case 'project':
          groupKey = expense.projectName || 'No Project';
          break;
        case 'category':
          groupKey = expense.category ?
            expense.category.charAt(0).toUpperCase() + expense.category.slice(1) :
            'Other';
          break;
        case 'vendor':
          groupKey = expense.vendor || 'No Vendor';
          break;
        case 'subcontractor':
          groupKey = expense.subcontractorName || 'No Subcontractor';
          break;
        default:
          groupKey = 'All Expenses';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(expense);
    });

    return groups;
  }, [sortedExpenses, groupBy, expenses]);

  // Calculate group totals
  const groupTotals = React.useMemo(() => {
    const totals: Record<string, number> = {};

    Object.entries(groupedExpenses).forEach(([groupName, groupExpenses]) => {
      totals[groupName] = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    });

    return totals;
  }, [groupedExpenses, expenses]);

  const renderExpenseRow = (expense: Expense) => {
    const amountPaid = expense.amountPaid || 0;
    // When an expense is paid, we should use the original amount, not the remaining amount
    const remainingAmount = expense.status === 'paid' ? expense.amount : expense.amount - amountPaid;

    // Add log inside render function
    logger.log(`[renderExpenseRow] ID: ${expense.id}, Status: ${expense.status}, Amount: ${expense.amount}, AmountPaid: ${amountPaid}, Remaining: ${remainingAmount}`);

    let statusLabel: string;
    let statusColor: 'success' | 'warning' | 'info' | 'error' | 'default' = 'warning';

    switch (expense.status) {
      case 'paid':
        statusLabel = 'Paid';
        statusColor = 'success';
        break;
      case 'partially_paid':
        statusLabel = 'Partially Paid';
        statusColor = 'info';
        break;
      case 'pending':
        statusLabel = 'Pending';
        statusColor = 'warning';
        break;
      case 'approved':
        statusLabel = 'Approved';
        statusColor = 'default'; // Use default color for approved
        break;
      case 'rejected':
        statusLabel = 'Rejected';
        statusColor = 'error';
        break;
      default:
        statusLabel = expense.status; // Fallback
    }

    return (
      <TableRow
        key={expense.id}
        hover
        onClick={() => handleViewExpense(expense)}
        sx={{
          cursor: 'pointer',
          '&:last-child td, &:last-child th': { border: 0 },
          // Optional: different styling for partially paid?
          ...(expense.status === 'paid' && {
            bgcolor: alpha(theme.palette.success.light, 0.08),
          }),
          ...(expense.status === 'partially_paid' && {
            bgcolor: alpha(theme.palette.info.light, 0.08),
          }),
        }}
      >
        <TableCell component="th" scope="row">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other}
            <Typography sx={{ ml: 1.5, fontWeight: 'medium' }}>
              {expense.description}
            </Typography>

            {/* Display tags if they exist */}
            {expense.tags && expense.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {expense.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      '& .MuiChip-label': {
                        px: 1,
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
          {expense.lineItems && expense.lineItems.length > 0 && (
            <Chip
              size="small"
              label={`${expense.lineItems.length} item${expense.lineItems.length > 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </TableCell>

        {/* Amount Cell - Show Paid / Remaining */}
        <TableCell
          align="right"
          onClick={(e) => {
            e.stopPropagation();
            handleSortClick('amount');
          }}
          sx={{
            cursor: 'pointer',
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          <Tooltip title={`Total: ${formatCurrency(expense.amount)}`}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight="medium">
                {formatCurrency(remainingAmount)}
              </Typography>
              {expense.status === 'partially_paid' && (
                <Typography variant="caption" color="text.secondary">
                  Paid: {formatCurrency(amountPaid)}
                </Typography>
              )}
              {/* Sorting Indicator */}
              {sortField === 'amount' && (
                <span style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                  {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                </span>
              )}
            </Box>
          </Tooltip>
        </TableCell>

        {/* Date Cell - Unchanged */}
        <TableCell
          onClick={(e) => {
            e.stopPropagation();
            handleSortClick('date');
          }}
          sx={{
            cursor: 'pointer',
            '&:hover': { color: theme.palette.primary.main }
          }}
        >
          {formatDate(expense.date)}
          {/* Sorting Indicator */}
          {sortField === 'date' && (
            <Tooltip title={`Sort by date (${sortDirection === 'asc' ? 'oldest first' : 'newest first'})`}>
              <span style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
              </span>
            </Tooltip>
          )}
        </TableCell>

        {/* Status Cell - Updated */}
        <TableCell>
          <Chip
            label={statusLabel}
            size="small"
            color={statusColor}
            // Optional: Add variant for different statuses?
            // variant={expense.status === 'partially_paid' ? 'outlined' : 'filled'}
          />
        </TableCell>

        {/* Other Cells (Project, Category, Vendor, Subcontractor) - Unchanged */}
        {groupBy !== 'project' && <TableCell>{expense.projectName}</TableCell>}
        {groupBy !== 'category' && <TableCell>{expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</TableCell>}
        {groupBy !== 'vendor' && <TableCell>{expense.vendor || '-'}</TableCell>}
        {groupBy !== 'subcontractor' && <TableCell>{expense.subcontractorName || '-'}</TableCell>}

        {/* Actions Cell - Unchanged */}
        <TableCell align="center">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExpense(expense);
                setExpenseModalOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            {expense.status !== 'paid' && (
              <IconButton
                size="small"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExpense(expense);
                  setPaymentModalOpen(true);
                }}
              >
                <PaidIcon fontSize="small" />
              </IconButton>
            )}

            <IconButton
              size="small"
              color="default"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, expense.id || '');
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  // Find the full expense object for the Payment Modal when rendering
  const fullExpenseForPayment = React.useMemo(() => {
      if (!selectedExpense?.id) return null;
      // Find the full object from the main expenses list
      return expenses.find(e => e.id === selectedExpense.id) || null;
  }, [selectedExpense, expenses]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Expenses & Payments
        </Typography>

        <Button
          variant="contained"
          size="medium"
          startIcon={<AddIcon />}
          onClick={handleAddExpense}
          sx={{
            backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
            }
          }}
        >
          Add Expense
        </Button>
      </Box>

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

      {/* The following Grid is the "Expense Breakdown by Category", "Top Projects by Expense", and "Expense Status Summary" */}
      {/* This content should remain as it's part of a different display section. */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Category breakdown row */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Expense Breakdown by Category</Typography>

            <Grid container spacing={2}>
              {expensesListIsLoading ? ( // Use hook's loading state
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Grid>
              ) : Object.keys(categoryBreakdown).length === 0 ? (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">No category data available</Typography>
                </Grid>
              ) : (
                Object.entries(categoryBreakdown).map(([category, amount]) => {
                  // Calculate percentage of the total
                  const percentage = totalExpensesValue > 0 ? (amount / totalExpensesValue) * 100 : 0;
                  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

                  return (
                    <Grid item xs={12} key={category}>
                      <Box sx={{ mb: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other}
                            <Typography variant="body2" sx={{ ml: 1 }}>{categoryName}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" fontWeight="medium">{formatCurrency(amount)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(percentage)}% of total
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.light, 0.2),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: category === 'materials' ? theme.palette.success.main :
                                      category === 'labor' ? theme.palette.info.main :
                                      category === 'equipment' ? theme.palette.warning.main :
                                      category === 'permits' ? theme.palette.error.main :
                                      theme.palette.primary.main
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Project breakdown */}
        {!projectId && expenses.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Top Projects by Expense</Typography>

              {expensesListIsLoading ? ( // Use hook's loading state
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                (() => {
                  // Calculate project totals
                  const projectTotals = expenses.reduce((acc, expense) => {
                    const projectName = expense.projectName || 'Unknown Project';
                    acc[projectName] = (acc[projectName] || 0) + expense.amount;
                    return acc;
                  }, {} as Record<string, number>);

                  // Sort projects by expense amount and take top 5
                  const topProjects = Object.entries(projectTotals)
                    .sort(([, amountA], [, amountB]) => amountB - amountA)
                    .slice(0, 5);

                  return (
                    <Box>
                      {topProjects.map(([projectName, amount], index) => {
                        const percentage = totalExpensesValue > 0 ? (amount / totalExpensesValue) * 100 : 0;

                        return (
                          <Box key={projectName} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem', bgcolor: `hsl(${index * 50}, 70%, 50%)` }}>
                                  {projectName.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" sx={{ ml: 1 }}>{projectName}</Typography>
                              </Box>
                              <Typography variant="body2" fontWeight="medium">{formatCurrency(amount)}</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.primary.light, 0.15),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: `hsl(${index * 50}, 70%, 50%)`
                                }
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })()
              )}
            </Paper>
          </Grid>
        )}

        {/* Status breakdown */}
        <Grid item xs={12} md={projectId ? 12 : 6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Expense Status Summary</Typography>

            {expensesListIsLoading ? ( // Use hook's loading state
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {/* Status counts */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {['pending', 'approved', 'partially_paid', 'paid', 'rejected'].map((status) => {
                      const statusCount = expenses.filter(e => e.status === status).length;
                      const statusAmount = expenses.filter(e => e.status === status).reduce((sum, e) => sum + e.amount, 0);
                      const statusLabel = status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                      // Skip if no expenses with this status
                      if (statusCount === 0) return null;

                      // Determine color based on status
                      let color: string;
                      let icon: JSX.Element;
                      switch(status) {
                        case 'paid':
                          color = theme.palette.success.main;
                          icon = <PaidIcon fontSize="small" />;
                          break;
                        case 'partially_paid':
                          color = theme.palette.info.main;
                          icon = <PaidIcon fontSize="small" />;
                          break;
                        case 'pending':
                          color = theme.palette.warning.main;
                          icon = <DescriptionIcon fontSize="small" />;
                          break;
                        case 'approved':
                          color = theme.palette.primary.main;
                          icon = <CheckCircleIcon fontSize="small" />;
                          break;
                        case 'rejected':
                          color = theme.palette.error.main;
                          icon = <DeleteIcon fontSize="small" />;
                          break;
                        default:
                          color = theme.palette.text.secondary;
                          icon = <DescriptionIcon fontSize="small" />;
                      }

                      return (
                        <Box key={status} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(color, 0.2),
                              color: color,
                              mr: 1.5
                            }}
                          >
                            {icon}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">{statusLabel}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {statusCount} {statusCount === 1 ? 'expense' : 'expenses'}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(statusAmount)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>

                {/* Visualization */}
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {(() => {
                    const statuses = ['pending', 'approved', 'partially_paid', 'paid', 'rejected'];
                    const statusAmounts = statuses.map(status =>
                      expenses.filter(e => e.status === status).reduce((sum, e) => sum + e.amount, 0)
                    );

                    // Calculate percentages
                    const total = statusAmounts.reduce((a, b) => a + b, 0);
                    let startPercentage = 0;

                    return (
                      <Box sx={{ position: 'relative', width: '100%', maxWidth: 200 }}>
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '100%',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            bgcolor: '#f5f5f5',
                          }}
                        >
                          {statusAmounts.map((amount, index) => {
                            if (amount === 0) return null;

                            const percentage = total > 0 ? (amount / total) * 100 : 0;
                            const color = index === 0 ? theme.palette.warning.main :
                                        index === 1 ? theme.palette.primary.main :
                                        index === 2 ? theme.palette.info.main :
                                        index === 3 ? theme.palette.success.main :
                                        theme.palette.error.main;

                            const slice = (
                              <Box
                                key={statuses[index]}
                                sx={{
                                  position: 'absolute',
                                  width: '100%',
                                  height: '100%',
                                  top: 0,
                                  left: 0,
                                  background: `conic-gradient(
                                    ${color} ${startPercentage}%,
                                    ${color} ${startPercentage + percentage}%,
                                    transparent ${startPercentage + percentage}%,
                                    transparent 100%
                                  )`,
                                }}
                              />
                            );

                            startPercentage += percentage;
                            return slice;
                          })}

                          {/* Center circle to create donut */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '60%',
                              height: '60%',
                              borderRadius: '50%',
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">Total</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatCurrency(total)}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })()}
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs, search, and group controls */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
        <Box sx={{ flexGrow: 1 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            aria-label="expense tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Expenses" />
            <Tab label="Needs Payment" />
            <Tab label="Paid" />
          </Tabs>
        </Box>

        <ExpenseControls
          theme={theme}
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
          projectId={projectId} // Pass the projectId prop from Expenses
        />
      </Box>

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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Expense
        </MenuItem>

        {selectedExpenseId && expenses.find(e => e.id === selectedExpenseId)?.status !== 'paid' && (
          <MenuItem onClick={handlePayFromMenu}>
            <PaidIcon fontSize="small" sx={{ mr: 1 }} />
            Mark as Paid
          </MenuItem>
        )}

        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Expense Form Modal - Props should be correct now */}
      <ExpenseFormModal
        key={`expense-form-${selectedExpense?.id || 'new'}`}
        open={expenseModalOpen}
        onClose={handleCloseModal}
        expense={selectedExpense || undefined}
        onSave={handleSaveExpense}
        projects={projects}
        projectPhases={selectedProjectPhases}
      />

      {/* Payment Modal - Pass the full expense object or null */}
      <PaymentFormModal
        key={`payment-form-${fullExpenseForPayment?.id || 'none'}`}
        open={paymentModalOpen}
        onClose={handleClosePaymentModal}
        expense={fullExpenseForPayment} // Pass the full object or null
        onSave={async (actualAmountPaid, paymentDetails) => { // Make async
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
        }}
      />

      {/* Add Snackbar for notifications */}
      {/* Snackbar for paymentError from the hook */}
      {paymentError && (
        <Snackbar
          open={!!paymentError}
          autoHideDuration={6000}
          onClose={() => { /* setError(null) might be needed if error state is managed in hook */ }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MuiAlert elevation={6} variant="filled" severity="error" onClose={() => { /* setError(null) */ }}>
            Payment Error: {paymentError}
          </MuiAlert>
        </Snackbar>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Expenses;
