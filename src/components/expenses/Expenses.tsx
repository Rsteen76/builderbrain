import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  alpha,
  Tooltip,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
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
  DeleteOutline as DeleteOutlineIcon,
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from '@mui/icons-material';
import { ExpenseService } from '../../services/expense';
import { ProjectService } from '../../services/project';
import { Expense, Project, ProjectPhase } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ExpenseFormModal from './ExpenseFormModal';
import PaymentFormModal from './PaymentFormModal';
import { BidService } from '../../services/bid';
import { BidPaymentStage } from '../../types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
  
  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
      fetchExpenses();
    }
  }, [user, tabValue, submitting, projectId]);
  
  // Calculate summary data based on expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const needsPaymentExpenses = expenses.filter(e => e.status !== 'paid').reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  
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

  // --- Helper function to map raw phase data to ProjectPhase ---
  // Ensures all required fields are present according to types/index.ts
  const mapToProjectPhase = (phaseData: any): ProjectPhase => {
    const id = phaseData.id!;
    const name = phaseData.name!;

    // *** USER TODO: YOU MUST ADD ALL OTHER REQUIRED FIELDS FROM src/types/index.ts ProjectPhase HERE ***
    // Provide default values if necessary.
    // Example defaults (VERIFY AGAINST YOUR ACTUAL TYPE DEFINITION):
    const startDate = phaseData.startDate ? new Date(phaseData.startDate) : new Date();
    const endDate = phaseData.endDate ? new Date(phaseData.endDate) : new Date();
    const status = phaseData.status || 'Planned'; 
    const progress = typeof phaseData.progress === 'number' ? phaseData.progress : 0; 
    const budget = typeof phaseData.budget === 'number' ? phaseData.budget : 0; 
    const actualCost = typeof phaseData.actualCost === 'number' ? phaseData.actualCost : 0; 

    return {
      id,
      name,
      startDate, // TODO: Verify field name and type
      endDate,   // TODO: Verify field name and type
      status,    // TODO: Verify field name and type
      progress,  // TODO: Verify field name and type
      budget,    // TODO: Verify field name and type
      actualCost,// TODO: Verify field name and type
      // ... add ALL OTHER required fields from ProjectPhase in src/types/index.ts
    };
  };
  // --- End Helper Function ---

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
      setLoading(true);
      ExpenseService.deleteExpense(selectedExpenseId)
        .then(() => {
          setExpenses(expenses.filter(exp => exp.id !== selectedExpenseId));
          // Show success message if needed
          setSnackbar({
            open: true,
            message: 'Expense deleted successfully',
            severity: 'success'
          });
        })
        .catch((err: any) => {
          console.error('Error deleting expense:', err);
          setError('Failed to delete expense. Please try again.');
          setSnackbar({
            open: true,
            message: 'Failed to delete expense',
            severity: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
    handleMenuClose();
  };
  
  const fetchProjects = async () => {
    if (!user?.uid) return;
    
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
      console.error('Error fetching projects:', err);
    }
  };
  
  const fetchExpenses = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build filters based on tab and explicit filters
      const filters: any = {};
      
      // Tab filters - simplified to just paid or needs payment
      if (tabValue === 1) {
        // Needs Payment tab shows all non-paid expenses
        filters.status = ['pending', 'approved']; // Using array to match multiple statuses
      } else if (tabValue === 2) {
        // Paid tab
        filters.status = 'paid';
      }
      
      // Detailed filters (if set)
      if (categoryFilter) filters.category = categoryFilter;
      
      // If we have a projectId prop, use it - this takes precedence over projectFilter
      if (projectId) {
        filters.projectId = projectId;
        console.log(`Expenses: Filtering expenses for project ID: ${projectId}`);
      } else if (projectFilter) {
        filters.projectId = projectFilter;
      }
      
      // Fetch projects first - Apply same validation/mapping as fetchProjects
      let validatedProjects = projects;
      if (validatedProjects.length === 0) { 
          const fetched = await ProjectService.getProjects(user.uid);
          validatedProjects = fetched.map(proj => ({
              ...proj,
              phases: (proj.phases || [])
                        .filter(p => !!p?.id && !!p?.name)
                        .map(mapToProjectPhase)
          }));
          setProjects(validatedProjects); 
      }
      
      const projectMap = validatedProjects.reduce((map, project) => {
        map[project.id] = project.name;
        return map;
      }, {} as Record<string, string>);
      
      const fetchedExpenses = await ExpenseService.getExpenses(user.uid, filters);
      
      const enhancedExpenses = fetchedExpenses.map(expense => {
        return {
          ...expense,
          projectName: projectMap[expense.projectId] || 'Unknown Project',
          vendor: expense.vendor || '', 
        } as Expense;
      });
      
      setExpenses(enhancedExpenses);
      
      // Apply filter/map directly before setting state
      const currentProjectIdForFilter = projectId || projectFilter;
      if (currentProjectIdForFilter) {
        const currentProject = validatedProjects.find(p => p.id === currentProjectIdForFilter);
        const phases: ProjectPhase[] = (currentProject?.phases || [])
            .filter(p => !!p?.id && !!p?.name)
            .map(mapToProjectPhase);
        setSelectedProjectPhases(phases);
      } else {
          setSelectedProjectPhases([]);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleRefresh = () => {
    fetchProjects();
    fetchExpenses();
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
      
      console.log('handleAddExpense (Project Context): Initializing with:', initialExpenseData, 'Phases:', projectPhases);
      setSelectedExpense(initialExpenseData); 
    } else {
      console.log('handleAddExpense (General Context): Resetting');
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
  
  const handleMarkAsPaid = async (expenseId: string, actualAmountPaid: number, paymentDetails?: any) => {
    if (!user?.uid) return;
    
    console.log(`[handleMarkAsPaid START] ID: ${expenseId}, Amount Paid Now: ${actualAmountPaid}`, paymentDetails);
    setSubmitting(true);
    
    try {
      const expenseToUpdate = expenses.find(e => e.id === expenseId);
      if (!expenseToUpdate) {
        throw new Error('Expense not found locally');
      }
      console.log(`[handleMarkAsPaid] Found local expense before update:`, JSON.parse(JSON.stringify(expenseToUpdate))); // Log initial local state
      
      await ExpenseService.markAsPaid(expenseId, actualAmountPaid, paymentDetails);
      console.log(`[handleMarkAsPaid] Service call success. Firestore should be updated.`);

      // --- Start Bid Payment Schedule Adjustment Logic ---
      const paymentStageId = expenseToUpdate.paymentStageId; // Assuming this field exists
      const projectId = expenseToUpdate.projectId;
      const bidId = expenseToUpdate.bidId; // Get the specific bid ID from the expense

      if (paymentStageId && projectId) {
        console.log(`[handleMarkAsPaid][BidAdjust] Starting adjustment for stage ${paymentStageId} in project ${projectId}.`);
        try {
          // Fetch the full Bid associated with the project using getBids with a filter
          console.log(`[handleMarkAsPaid][BidAdjust] Fetching bids for project ${projectId}...`);
          const bids = await BidService.getBids(user.uid, { projectId: projectId });
          
          if (!bids || bids.length === 0) {
            console.warn(`[handleMarkAsPaid][BidAdjust] No Bid found for project ${projectId}. Skipping adjustment.`);
            // Update local state for the expense list (since Firestore update succeeded)
            setExpenses(prev => prev.map(e => 
              e.id === expenseId 
                ? { ...e, status: 'paid', amount: actualAmountPaid, paymentDetails: paymentDetails }
                : e
            ));
            return; // Exit if no bid found
          }
          
          // If we have a specific bidId from the expense, use that to find the correct bid
          let bid;
          if (bidId) {
            bid = bids.find(b => b.id === bidId);
            if (bid) {
              console.log(`[handleMarkAsPaid][BidAdjust] Found specific Bid ID: ${bid.id} from expense`);
            } else {
              console.warn(`[handleMarkAsPaid][BidAdjust] Bid ID ${bidId} from expense not found. Using first bid.`);
              bid = bids[0];
            }
          } else {
            // If no bidId in expense, use the first bid (with warning)
            if (bids.length > 1) {
              console.warn(`[handleMarkAsPaid][BidAdjust] Multiple bids found for project ${projectId}. Using the first one. Consider implications.`);
            }
            bid = bids[0];
          }
          
          console.log(`[handleMarkAsPaid][BidAdjust] Using Bid ID: ${bid.id}`);

          if (!bid.paymentSchedule || !bid.paymentProgress) {
            console.warn(`[handleMarkAsPaid][BidAdjust] Bid ${bid.id} is missing paymentSchedule or paymentProgress. Skipping adjustment.`);
          } else {
            console.log(`[handleMarkAsPaid][BidAdjust] Bid has schedule and progress. Processing stage ${paymentStageId}.`);
            const schedule = [...bid.paymentSchedule]; // Work with a copy
            const progress = { ...bid.paymentProgress }; // Work with a copy
            
            const stageIndex = schedule.findIndex(stage => stage.id === paymentStageId);
            
            if (stageIndex === -1) {
              console.warn(`[handleMarkAsPaid][BidAdjust] Payment Stage ${paymentStageId} not found in Bid's schedule. Skipping adjustment.`);
            } else {
              const paidStage = schedule[stageIndex];
              const originalStageAmount = paidStage.amount;
              
              console.log(`[handleMarkAsPaid][BidAdjust] Found Stage ${paidStage.id} ('${paidStage.name}') with original amount ${originalStageAmount}.`);

              // Update the paid stage status & details
              paidStage.status = 'paid';
              paidStage.paymentDate = new Date(); // Set payment date
              paidStage.expenseId = expenseId; // Ensure link
              // **CRITICAL:** Update the stage amount to the actual amount paid
              paidStage.amount = actualAmountPaid;
              console.log(`[handleMarkAsPaid][BidAdjust] Updated paid stage ${paidStage.id} status to 'paid' and amount to actual: ${paidStage.amount}`);

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
              console.log(`[handleMarkAsPaid][BidAdjust] Recalculated Bid Progress: Paid=${progress.paid}, Remaining=${progress.remaining}, Pending=${progress.pending}`);
              
              // Check if adjustment is needed for subsequent stages based on the difference *for this stage*
              const difference = actualAmountPaid - originalStageAmount; 
              console.log(`[handleMarkAsPaid][BidAdjust] Payment difference for this stage: ${difference} (Actual: ${actualAmountPaid}, Scheduled Original: ${originalStageAmount})`);

              if (Math.abs(difference) > 0.001) { // Use a small tolerance for float comparison
                 console.log(`[handleMarkAsPaid][BidAdjust] Adjustment needed due to difference.`);
                 // Find the *last* pending stage
                 let lastPendingStageIndex = -1;
                 for (let i = schedule.length - 1; i >= 0; i--) {
                   if (schedule[i].status !== 'paid') {
                     lastPendingStageIndex = i;
                     break;
                   }
                 }
                 console.log(`[handleMarkAsPaid][BidAdjust] Found last pending stage index: ${lastPendingStageIndex}`);

                 if (lastPendingStageIndex !== -1 && lastPendingStageIndex !== stageIndex) {
                   const lastPendingStage = schedule[lastPendingStageIndex];
                   console.log(`[handleMarkAsPaid][BidAdjust] Adjusting last pending stage: ${lastPendingStage.id} ('${lastPendingStage.name}')`);
                   // Adjust the amount of the last pending stage
                   // The difference needs to be SUBTRACTED from the last stage 
                   lastPendingStage.amount -= difference; 
                   console.log(`[handleMarkAsPaid][BidAdjust] Adjusted last pending stage amount to: ${lastPendingStage.amount}`);
                   
                   // Update the final payment expense if it exists
                   if (lastPendingStage.expenseId) {
                     console.log(`[handleMarkAsPaid][BidAdjust] Updating final payment expense: ${lastPendingStage.expenseId}`);
                     try {
                       // Update the expense amount to match the new stage amount
                       await ExpenseService.updateExpense(lastPendingStage.expenseId, {
                         amount: lastPendingStage.amount,
                         updatedAt: new Date()
                       });
                       console.log(`[handleMarkAsPaid][BidAdjust] Final payment expense updated successfully`);
                     } catch (expenseUpdateError) {
                       console.error(`[handleMarkAsPaid][BidAdjust] Error updating final payment expense:`, expenseUpdateError);
                     }
                   } else {
                     console.log(`[handleMarkAsPaid][BidAdjust] No expense ID found for final payment stage`);
                   }
                 } else if (lastPendingStageIndex === stageIndex) {
                    // The stage being paid IS the last pending stage. Its amount is already updated above.
                    console.log(`[handleMarkAsPaid][BidAdjust] The paid stage was the last pending stage. Amount already updated to actual paid.`);
                 } else {
                    console.warn('[handleMarkAsPaid][BidAdjust] No pending stages left to adjust. Difference recorded in overall progress.');
                 }
              } else {
                 console.log(`[handleMarkAsPaid][BidAdjust] No adjustment needed for other stages (difference is negligible).`);
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
              
              // Update the bid with the modified schedule and progress
              console.log('[handleMarkAsPaid][BidAdjust] Preparing to update Bid with final schedule:', JSON.stringify(cleanedSchedule));
              console.log('[handleMarkAsPaid][BidAdjust] Preparing to update Bid with final progress:', JSON.stringify(cleanedProgress));
              
              // Create a clean update payload
              const updatePayload = {
                paymentSchedule: cleanedSchedule,
                paymentProgress: cleanedProgress,
                updatedAt: new Date()
              };
              
              await BidService.updateBid(bid.id, updatePayload);
              console.log(`[handleMarkAsPaid][BidAdjust] Bid ${bid.id} update successful.`);

              // Refresh the expenses list to ensure all data is up to date
              fetchExpenses();

              // Show success message
              setSnackbar({
                open: true,
                message: 'Expense marked as paid successfully',
                severity: 'success'
              });
            }
          }
        } catch (bidUpdateError) {
          console.error('[handleMarkAsPaid][BidAdjust] Error during Bid update:', bidUpdateError);
          // Decide if we should notify the user about this secondary failure
          setSnackbar({
            open: true,
            message: 'Expense marked as paid, but failed to update Bid schedule.',
            severity: 'warning'
          });
        }
      } else {
         console.log('[handleMarkAsPaid] Expense not linked to a Payment Stage or Project ID. No Bid adjustment needed.');
      }
      // --- End Bid Payment Schedule Adjustment Logic ---

      // --- Update Local State Correctly ---
      const originalExpense = expenses.find(e => e.id === expenseId);
      if (originalExpense) {
        const originalTotalAmount = originalExpense.amount;
        const currentPaid = originalExpense.amountPaid || 0;
        const newTotalPaid = currentPaid + actualAmountPaid;
        const newStatus = (newTotalPaid >= originalTotalAmount - 0.001) ? 'paid' : 'partially_paid';
        
        console.log(`[handleMarkAsPaid LOCAL UPDATE] Expense ID: ${expenseId}, Original Amt: ${originalTotalAmount}, Current Paid (Local): ${currentPaid}, Amount Paid Now: ${actualAmountPaid}, New Total Paid: ${newTotalPaid}, New Status: ${newStatus}`);
        
        setExpenses(prev => prev.map(e => 
          e.id === expenseId 
            ? { 
                ...e, 
                status: newStatus, 
                amountPaid: newTotalPaid, 
                paymentDetails: paymentDetails
              } 
            : e
        ));
        console.log(`[handleMarkAsPaid LOCAL UPDATE] setExpenses called.`);
      } else {
        console.warn(`[handleMarkAsPaid] Expense ${expenseId} not found in local state for update.`);
        fetchExpenses(); 
      }
      
      setSnackbar({ open: true, message: 'Expense payment recorded!', severity: 'success' });
      
    } catch (err: any) {
      console.error("[handleMarkAsPaid] Error marking expense as paid:", err);
      setError(err.message || 'Failed to mark expense as paid. Please try again.');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to record payment',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
      handleClosePaymentModal(); // Close the payment modal
    }
  };
  
  // Create a properly typed expense object
  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    if (!user?.uid) return;
    
    // DEBUGGING: Add detailed logging for paymentDetails
    console.log('======= EXPENSE SAVE DEBUGGING =======');
    console.log('Raw expense data received by Expenses component:', expenseData);
    console.log('PaymentDetails value:', expenseData.paymentDetails);
    console.log('PaymentDetails type:', expenseData.paymentDetails !== undefined ? 
      typeof expenseData.paymentDetails : 'undefined');
    console.log('PaymentDetails stringified:', 
      expenseData.paymentDetails !== undefined ? 
      JSON.stringify(expenseData.paymentDetails) : 'undefined');
    console.log('Full expense data JSON stringified:', JSON.stringify(expenseData));
    
    // Fix paymentDetails if it exists but might cause issues
    if (expenseData.paymentDetails === undefined) {
      console.log('Setting undefined paymentDetails to null before save');
      (expenseData as any).paymentDetails = null;
    }
    
    setSubmitting(true);
    let savedExpense: Expense;
    
    try {
      if (expenseData.id) {
        // Update existing expense
        console.log('Before update - expense data:', expenseData);
        console.log('Before update - existing expense:', expenses.find(e => e.id === expenseData.id));
        
        await ExpenseService.updateExpense(expenseData.id, expenseData);
        
        // Instead of complex local state updates that can cause inconsistencies,
        // trigger a complete refresh of the expenses data from the server
        // This ensures we always have the latest data directly from the database
        await fetchExpenses();
        
        console.log('Updated expense in the database and refreshed all expense data');
        savedExpense = { ...expenseData } as Expense;
        
        // Show success message
        setSnackbar({
          open: true,
          message: 'Expense updated successfully',
          severity: 'success'
        });
        
        // Check if this expense is being marked as paid and has payment details
        if (expenseData.status === 'paid' && expenseData.paymentDetails && 
            expenseData.paymentStageId && expenseData.bidId) {
          console.log('Expense is being marked as paid with payment details. Triggering bid adjustment...');
          
          // Extract the actual amount paid from the expense data
          const actualAmountPaid = expenseData.amount || 0;
          
          // Call the bid adjustment logic directly
          try {
            // Get the expense data
            const expenseToUpdate = expenses.find(e => e.id === expenseData.id);
            if (!expenseToUpdate) {
              throw new Error('Expense not found locally');
            }
            
            console.log(`[handleSaveExpense][BidAdjust] Expense ${expenseData.id} - Actual Amount Paid: ${actualAmountPaid}`);
            
            // --- Start Bid Payment Schedule Adjustment Logic ---
            const paymentStageId = expenseToUpdate.paymentStageId;
            const projectId = expenseToUpdate.projectId;
            const bidId = expenseToUpdate.bidId;
            
            if (paymentStageId && projectId) {
              console.log(`[handleSaveExpense][BidAdjust] Starting adjustment for stage ${paymentStageId} in project ${projectId}.`);
              
              // Fetch the full Bid associated with the project using getBids with a filter
              console.log(`[handleSaveExpense][BidAdjust] Fetching bids for project ${projectId}...`);
              const bids = await BidService.getBids(user.uid, { projectId: projectId });
              
              if (!bids || bids.length === 0) {
                console.warn(`[handleSaveExpense][BidAdjust] No Bid found for project ${projectId}. Skipping adjustment.`);
                return;
              }
              
              // If we have a specific bidId from the expense, use that to find the correct bid
              let bid;
              if (bidId) {
                bid = bids.find(b => b.id === bidId);
                if (bid) {
                  console.log(`[handleSaveExpense][BidAdjust] Found specific Bid ID: ${bid.id} from expense`);
                } else {
                  console.warn(`[handleSaveExpense][BidAdjust] Bid ID ${bidId} from expense not found. Using first bid.`);
                  bid = bids[0];
                }
              } else {
                // If no bidId in expense, use the first bid (with warning)
                if (bids.length > 1) {
                  console.warn(`[handleSaveExpense][BidAdjust] Multiple bids found for project ${projectId}. Using the first one. Consider implications.`);
                }
                bid = bids[0];
              }
              
              console.log(`[handleSaveExpense][BidAdjust] Using Bid ID: ${bid.id}`);
              
              if (!bid.paymentSchedule || !bid.paymentProgress) {
                console.warn(`[handleSaveExpense][BidAdjust] Bid ${bid.id} is missing paymentSchedule or paymentProgress. Skipping adjustment.`);
              } else {
                console.log(`[handleSaveExpense][BidAdjust] Bid has schedule and progress. Processing stage ${paymentStageId}.`);
                const schedule = [...bid.paymentSchedule]; // Work with a copy
                const progress = { ...bid.paymentProgress }; // Work with a copy
                
                const stageIndex = schedule.findIndex(stage => stage.id === paymentStageId);
                
                if (stageIndex === -1) {
                  console.warn(`[handleSaveExpense][BidAdjust] Payment Stage ${paymentStageId} not found in Bid's schedule. Skipping adjustment.`);
                } else {
                  const paidStage = schedule[stageIndex];
                  const originalStageAmount = paidStage.amount;
                  
                  console.log(`[handleSaveExpense][BidAdjust] Found Stage ${paidStage.id} ('${paidStage.name}') with original amount ${originalStageAmount}.`);
                  
                  // Update the paid stage status & details
                  paidStage.status = 'paid';
                  paidStage.paymentDate = new Date(); // Set payment date
                  paidStage.expenseId = expenseData.id; // Ensure link
                  // **CRITICAL:** Update the stage amount to the actual amount paid
                  paidStage.amount = actualAmountPaid;
                  console.log(`[handleSaveExpense][BidAdjust] Updated paid stage ${paidStage.id} status to 'paid' and amount to actual: ${paidStage.amount}`);
                  
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
                  console.log(`[handleSaveExpense][BidAdjust] Recalculated Bid Progress: Paid=${progress.paid}, Remaining=${progress.remaining}, Pending=${progress.pending}`);
                  
                  // Check if adjustment is needed for subsequent stages based on the difference *for this stage*
                  const difference = actualAmountPaid - originalStageAmount; 
                  console.log(`[handleSaveExpense][BidAdjust] Payment difference for this stage: ${difference} (Actual: ${actualAmountPaid}, Scheduled Original: ${originalStageAmount})`);
                  
                  if (Math.abs(difference) > 0.001) { // Use a small tolerance for float comparison
                    console.log(`[handleSaveExpense][BidAdjust] Adjustment needed due to difference.`);
                    // Find the *last* pending stage
                    let lastPendingStageIndex = -1;
                    for (let i = schedule.length - 1; i >= 0; i--) {
                      if (schedule[i].status !== 'paid') {
                        lastPendingStageIndex = i;
                        break;
                      }
                    }
                    console.log(`[handleSaveExpense][BidAdjust] Found last pending stage index: ${lastPendingStageIndex}`);
                    
                    if (lastPendingStageIndex !== -1 && lastPendingStageIndex !== stageIndex) {
                      const lastPendingStage = schedule[lastPendingStageIndex];
                      console.log(`[handleSaveExpense][BidAdjust] Adjusting last pending stage: ${lastPendingStage.id} ('${lastPendingStage.name}')`);
                      // Adjust the amount of the last pending stage
                      // The difference needs to be SUBTRACTED from the last stage 
                      lastPendingStage.amount -= difference; 
                      console.log(`[handleSaveExpense][BidAdjust] Adjusted last pending stage amount to: ${lastPendingStage.amount}`);
                      
                      // Update the final payment expense if it exists
                      if (lastPendingStage.expenseId) {
                        console.log(`[handleSaveExpense][BidAdjust] Updating final payment expense: ${lastPendingStage.expenseId}`);
                        try {
                          // Update the expense amount to match the new stage amount
                          await ExpenseService.updateExpense(lastPendingStage.expenseId, {
                            amount: lastPendingStage.amount,
                            updatedAt: new Date()
                          });
                          console.log(`[handleSaveExpense][BidAdjust] Final payment expense updated successfully`);
                        } catch (expenseUpdateError) {
                          console.error(`[handleSaveExpense][BidAdjust] Error updating final payment expense:`, expenseUpdateError);
                        }
                      } else {
                        console.log(`[handleSaveExpense][BidAdjust] No expense ID found for final payment stage`);
                      }
                    } else if (lastPendingStageIndex === stageIndex) {
                      // The stage being paid IS the last pending stage. Its amount is already updated above.
                      console.log(`[handleSaveExpense][BidAdjust] The paid stage was the last pending stage. Amount already updated to actual paid.`);
                    } else {
                      console.warn('[handleSaveExpense][BidAdjust] No pending stages left to adjust. Difference recorded in overall progress.');
                    }
                  } else {
                    console.log(`[handleSaveExpense][BidAdjust] No adjustment needed for other stages (difference is negligible).`);
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
                  console.log(`[handleSaveExpense][BidAdjust] Bid ${bid.id} update successful.`);

                  // Refresh the expenses list to ensure all data is up to date
                  fetchExpenses();

                  // Show success message
                  setSnackbar({
                    open: true,
                    message: 'Expense marked as paid successfully',
                    severity: 'success'
                  });
                }
              }
            } else {
              console.log('[handleSaveExpense] Expense not linked to a Payment Stage or Project ID. No Bid adjustment needed.');
            }
            // --- End Bid Payment Schedule Adjustment Logic ---
          } catch (bidUpdateError) {
            console.error('[handleSaveExpense][BidAdjust] Error during Bid update:', bidUpdateError);
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
        
        // Find project name from projects array
        const projectName = projects.find(p => p.id === savedExpense.projectId)?.name || 'Unknown Project';
        
        // Add to local state right away with project name
        const enhancedExpense = {
          ...savedExpense,
          projectName,
        };
        
        console.log('Adding new expense to local state:', enhancedExpense);
        
        // Check if the expense should be visible in the current tab view
        const shouldShowInCurrentTab = 
          tabValue === 0 || // All expenses tab
          (tabValue === 1 && savedExpense.status !== 'paid') || // Needs payment tab
          (tabValue === 2 && savedExpense.status === 'paid'); // Paid tab
        
        if (shouldShowInCurrentTab) {
          setExpenses(prevExpenses => [enhancedExpense, ...prevExpenses]);
        } else {
          // If the expense doesn't match the current tab filter, show a note to the user
          console.log('New expense added but not visible in current tab view');
          setSnackbar({
            open: true,
            message: 'Expense created successfully. Switch tabs to view it.',
            severity: 'info'
          });
          // Still update the expenses array for when the user switches tabs
          setExpenses(prevExpenses => [enhancedExpense, ...prevExpenses]);
        }
      }
      
      // Close modal
      handleCloseModal();
      
      // Show success message (only if we didn't already show the tab-specific message)
      if (!(expenseData.id === undefined && tabValue !== 0 && 
           ((tabValue === 1 && expenseData.status === 'paid') || 
            (tabValue === 2 && expenseData.status !== 'paid')))) {
        setSnackbar({
          open: true,
          message: `Expense ${expenseData.id ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      
      // Extract more meaningful error messages for Firebase errors
      let errorMessage = `Failed to ${expenseData.id ? 'update' : 'create'} expense`;
      
      if (err instanceof Error) {
        // Add more specific error details if available
        if (err.message.includes('invalid data')) {
          errorMessage += ': Invalid data format';
        } else if (err.message.includes('permission-denied')) {
          errorMessage += ': Permission denied';
        } else if (err.message) {
          errorMessage += `: ${err.message}`;
        }
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
    const remainingAmount = expense.amount - amountPaid;
    
    // Add log inside render function
    console.log(`[renderExpenseRow] ID: ${expense.id}, Status: ${expense.status}, Amount: ${expense.amount}, AmountPaid: ${amountPaid}, Remaining: ${remainingAmount}`);

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
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Total Expenses</Typography>
              <MoneyIcon />
            </Box>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Typography variant="h4" fontWeight="bold">{formatCurrency(totalExpenses)}</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Needs Payment</Typography>
              <AccountBalanceIcon />
            </Box>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Typography variant="h4" fontWeight="bold">{formatCurrency(needsPaymentExpenses)}</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Paid</Typography>
              <PaidIcon />
            </Box>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Typography variant="h4" fontWeight="bold">{formatCurrency(paidExpenses)}</Typography>
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
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* Only show project filter when not viewing project-specific expenses */}
          {!projectId && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '200px' } }}>
              <InputLabel id="project-filter-label">Project</InputLabel>
              <Select
                labelId="project-filter-label"
                value={projectFilter || ''}
                onChange={(e) => setProjectFilter(e.target.value === '' ? null : e.target.value)}
                label="Project"
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Category filter */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '150px' } }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter || ''}
              onChange={(e) => setCategoryFilter(e.target.value === '' ? null : e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="materials">Materials</MenuItem>
              <MenuItem value="labor">Labor</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="permits">Permits</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '150px' } }}>
            <InputLabel id="group-by-label">Group By</InputLabel>
            <Select
              labelId="group-by-label"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              label="Group By"
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="none">No Grouping</MenuItem>
              <MenuItem value="project">Project</MenuItem>
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
              <MenuItem value="subcontractor">Subcontractor</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh expenses">
            <IconButton onClick={handleRefresh} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Expenses table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : sortedExpenses.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', mt: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No expenses found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search' : 'Click "Add Expense" to create your first expense'}
          </Typography>
        </Box>
      ) : (
        <>
          {Object.entries(groupedExpenses).map(([groupName, groupItems]) => (
            <Box key={groupName} sx={{ mb: 4 }}>
              {/* Group header - only shown when grouping is enabled */}
              {groupBy !== 'none' && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h6" color="text.primary">
                    {groupName}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {formatCurrency(groupTotals[groupName])}
                  </Typography>
                </Box>
              )}
              
              {/* Table */}
              <TableContainer 
                component={Paper} 
                sx={{ 
                  boxShadow: 3,
                  ...(groupBy !== 'none' && {
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  })
                }}
              >
                <Table aria-label="expenses table">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                      <TableCell>Description</TableCell>
                      <TableCell 
                        align="right" 
                        onClick={() => handleSortClick('amount')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { color: theme.palette.primary.main }
                        }}
                      >
                        <Tooltip title={`Sort by amount (${sortField === 'amount' && sortDirection === 'asc' ? 'lowest first' : 'highest first'})`}>
                          <span>
                            Amount
                            {sortField === 'amount' && (
                              <span style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                                {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                              </span>
                            )}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSortClick('date')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { color: theme.palette.primary.main }
                        }}
                      >
                        Date
                        {sortField === 'date' && (
                          <Tooltip title={`Sort by date (${sortDirection === 'asc' ? 'oldest first' : 'newest first'})`}>
                            <span style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                              {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>Status</TableCell>
                      {groupBy !== 'project' && <TableCell>Project</TableCell>}
                      {groupBy !== 'category' && <TableCell>Category</TableCell>}
                      {groupBy !== 'vendor' && <TableCell>Vendor</TableCell>}
                      {groupBy !== 'subcontractor' && <TableCell>Subcontractor</TableCell>}
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupItems.map((expense) => renderExpenseRow(expense))}
                    
                    {/* Group total row */}
                    {groupBy !== 'none' && (
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
                        <TableCell component="th" scope="row">
                          <Typography variant="subtitle2">Group Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {formatCurrency(groupTotals[groupName])}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={7} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </>
      )}

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
        onSave={(actualAmountPaid, paymentDetails) => { 
          console.log(`[Expenses] PaymentFormModal onSave callback triggered. Actual Amount Received: ${actualAmountPaid}`, paymentDetails); // LOG A
          if (fullExpenseForPayment?.id) { 
            console.log(`[Expenses] fullExpenseForPayment ID is valid (${fullExpenseForPayment.id}). Calling handleMarkAsPaid...`); // LOG B
            handleMarkAsPaid(fullExpenseForPayment.id, actualAmountPaid, paymentDetails);
          } else {
            console.error('[Expenses] PaymentFormModal onSave called, BUT fullExpenseForPayment or its ID is missing! Cannot call handleMarkAsPaid.', { 
              fullExpenseForPayment: fullExpenseForPayment,
              id: fullExpenseForPayment?.id 
            }); // LOG C
          }
        }}
      />
      
      {/* Add Snackbar for notifications */}
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