import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  AccessTime as TimelineIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
// Keep necessary service imports for actions not yet refactored (delete, update, etc.)
import { ProjectService } from '../services/project'; // Needed for delete/update for now
import { ExpenseService } from '../services/expense'; // Needed for createExpense for now
import { formatCurrency, formatPercentage, safelyParseDate } from '../utils/formatters';
// Import the new hooks
import { useProject, useProjectPhases, useProjectBids, useProjectExpenses } from '../hooks';
import PageLayout from '../components/layout/PageLayout';
import { Project, Bid, ProjectPhase } from '../types';
import { Expense } from '../types/expense.types';
import { openBidDeleteDialog } from '../components/dialogs/BidDeletePortal';
import BidDeletePortal from '../components/dialogs/BidDeletePortal';

// Import bid operations
import { submitBid } from '../utils/bidOperations';

// Import newly modularized components
import TabNavigation from '../components/projects/detailTabs/TabNavigation';
import TabContent from '../components/projects/detailTabs/TabContent';
// Import metric cards component
import ProjectMetricCards from '../components/projects/ProjectMetricCards';
import BidFormDialog from '../components/dialogs/BidFormDialog';

// Interface for bid form data
interface BidFormData {
  id?: string;
  projectId: string;
  phaseId?: string;
  subcontractorId?: string;
  title: string;
  amount: number;
  description?: string;
  submissionDeadline?: Date;
  status?: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  paymentTerms?: {
    downPaymentPercent: number;
    installments: Array<{
      id: string;
      name: string;
      percent: number;
      milestoneDescription: string;
      phaseId?: string;
      phaseName?: string;
    }>;
  };
}

// Enhanced status indicators
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'planning': '#3f51b5',       // Indigo
    'in_progress': '#ff9800',    // Orange
    'completed': '#4caf50',      // Green
    'on_hold': '#f44336',        // Red
    'not_started': '#9e9e9e',    // Grey
    'delayed': '#d32f2f',        // Dark Red
  };
  
  return statusColors[status.toLowerCase()] || '#9e9e9e';
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return <CheckCircleIcon fontSize="small" />;
    case 'in_progress': return <TimelineIcon fontSize="small" />;
    case 'planning': return <ScheduleIcon fontSize="small" />;
    case 'on_hold': return <FlagIcon fontSize="small" />;
    case 'delayed': return <FlagIcon fontSize="small" color="error" />;
    default: return <ScheduleIcon fontSize="small" />;
  }
};

// Add the interface for QuickBid if not already defined
interface QuickBid {
  phaseId: string;
  contractorName: string;
  amount: number;
  description: string;
}

// Project detail page with phases, progress tracking, and expense breakdowns
// Add interface for quick expense creation
interface QuickExpense {
  phaseId: string;
  category: 'materials' | 'labor' | 'equipment' | 'permits' | 'other';
  amount: number;
  description: string;
  date: string;
  subcontractorId?: string;
  subcontractorName?: string;
  vendor?: string;
}

// Add a constant for construction specialties near the top of the file where other constants are defined
const CONSTRUCTION_SPECIALTIES = [
  'General Contractor',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Masonry',
  'Drywall',
  'Painting',
  'Roofing',
  'Flooring',
  'Concrete',
  'Excavation',
  'Demolition',
  'Landscaping',
  'Glass & Windows',
  'Insulation',
  'Site Work',
  'Steel & Metal',
  'Tile & Stone',
  'Other'
];

// Define EnhancedExpense locally to match the expected type within this file
// This interface needs to align with how findExpense is expected to work
interface EnhancedExpense extends Expense {
  bidId?: string;
  paymentStageId?: string;
}

// Project detail page with phases, progress tracking, and expense breakdowns
const ProjectDetailPage: React.FC = () => {
  console.log('--- Rendering ProjectDetailPage ---'); // Test edit
  const { projectId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // Auth context for user information
  const { user } = useAuth();
  
  // --- Data Fetching Hooks ---
  const {
    project,
    loading: projectLoading,
    error: projectError,
    fetchProject,
  } = useProject(projectId);
  const {
    phases,
    loading: phasesLoading,
    error: phasesError,
    fetchPhases,
    setPhases,
  } = useProjectPhases(projectId);
  const {
    bids,
    loading: bidsLoading,
    error: bidsError,
    fetchBids,
  } = useProjectBids(projectId);
  const {
    expenses,
    expensesChartData,
    loading: expensesLoading,
    error: expensesError,
    fetchExpenses,
  } = useProjectExpenses(projectId);

  // Combined loading and error states
  const loading = projectLoading || phasesLoading || bidsLoading || expensesLoading;
  const error = projectError || phasesError || bidsError || expensesError;
  
  // State variables (excluding those managed by hooks)
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuickAddSubcontractor, setShowQuickAddSubcontractor] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [currentPhaseForBid, setCurrentPhaseForBid] = useState<string | null>(null);
  
  // State for quick bid dialog
  const [newBidDialogOpen, setNewBidDialogOpen] = useState(false);
  
  // == Memoized Service Instances ==
  const projectService = useMemo(() => new ProjectService(), []);

  // == Memoized Calculations == 
  const budgetData = useMemo(() => {
    // Handle potential object type for project.budget
    let numericBudget = 0;
    if (typeof project?.budget === 'number') {
      numericBudget = project.budget;
    } else if (project?.budget && typeof project.budget === 'object' && 'total' in project.budget && typeof project.budget.total === 'number') {
      numericBudget = project.budget.total;
    }
    
    const totalActual = expenses.reduce((sum, e) => sum + e.amount, 0);
    const difference = numericBudget - totalActual; // Use the extracted numeric value
    const percentUsed = numericBudget > 0 ? (totalActual / numericBudget) * 100 : 0; // Use the extracted numeric value
    return {
      totalBudget: numericBudget, // Ensure this is always a number
      totalActual,
      difference,
      percentUsed,
    };
  }, [project?.budget, expenses]);

  const combinedExpenses = useMemo(() => {
    // Example transformation - adapt if structure needs differ
    return expenses.map(expense => ({
      name: expense.description || 'Unnamed Expense', 
      budget: 0, // Placeholder - determine how to get budget per expense if needed
      actual: expense.amount
    }));
  }, [expenses]);

  const phaseProposedCosts = useMemo(() => {
    // Create a mapping of phaseId -> sum of proposed costs
    const proposedCosts: Record<string, number> = {};
    
    // Initialize all phases with 0
    phases.forEach(phase => {
      proposedCosts[phase.id] = 0;
    });
    
    // Add up bid amounts by phase with type assertion
    bids.forEach(bid => {
      if (bid.phaseId && bid.status === 'accepted') {
        // Use type assertion to access amount property
        const bidAmount = (bid as any).amount || 0; // If your Bid type doesn't have amount, use type assertion
        proposedCosts[bid.phaseId] = (proposedCosts[bid.phaseId] || 0) + bidAmount;
      }
    });
    
    return proposedCosts;
  }, [phases, bids]);

  const phaseActualCosts = useMemo(() => {
    // Create a mapping of phaseId -> sum of actual costs
    const actualCosts: Record<string, number> = {};
    
    // Initialize all phases with 0
    phases.forEach(phase => {
      actualCosts[phase.id] = 0;
    });
    
    // Add up expense amounts by phase
    expenses.forEach(expense => {
      if (expense.phaseId) {
        actualCosts[expense.phaseId] = (actualCosts[expense.phaseId] || 0) + expense.amount;
      }
    });
    
    return actualCosts;
  }, [phases, expenses]);

  // Add placeholder calculations for other required ProjectMetricCards props
  const projectProgress = useMemo(() => {
    const totalPhases = phases.length;
    if (totalPhases === 0) return 0;
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    return Math.round((completedPhases / totalPhases) * 100);
  }, [phases]);

  // Recalculate expenseBreakdown based on status
  const expenseBreakdown = useMemo(() => {
    const breakdown: { pending: number; approved: number; paid: number; rejected: number } = {
      pending: 0,
      approved: 0,
      paid: 0,
      rejected: 0,
    };
    expenses.forEach(expense => {
      const status = expense.status || 'pending'; // Default to pending if status is missing
      if (status in breakdown) {
        breakdown[status as keyof typeof breakdown] += expense.amount;
      }
    });
    return breakdown;
  }, [expenses]);

  // Adjust timeline calculation to match expected structure
  const timeline = useMemo(() => {
    // Pass null to safelyParseDate if undefined
    const startDate = safelyParseDate(project?.startDate ?? null);
    const endDate = safelyParseDate(project?.endDate ?? null);
    const today = new Date();
    
    let totalDays = 0;
    let elapsedDays = 0;
    let percentComplete = 0;

    if (startDate && endDate && startDate < endDate) {
      // Calculate total duration in days
      totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      
      // Calculate elapsed days from start date until today (or end date if past)
      const effectiveToday = today > endDate ? endDate : today;
      if (effectiveToday > startDate) {
        elapsedDays = Math.round((effectiveToday.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      }
      
      // Calculate percentage complete
      if (totalDays > 0) {
        percentComplete = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
      }
    }

    return {
      startDate: startDate, // Return Date object or null
      endDate: endDate,     // Return Date object or null
      elapsedDays: elapsedDays,
      totalDays: totalDays,
      percentComplete: percentComplete,
    };
  }, [project?.startDate, project?.endDate]);

  // == Callback Helper Functions ==
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    console.log(`${severity.toUpperCase()}: ${message}`);
    if (severity === 'error') {
      setActionError(message);
    }
  }, [setActionError]);

  // --- Status Update Handler ---
  const handleUpdatePhaseStatus = useCallback(async (phaseId: string, status: ProjectPhase['status']) => {
    if (!projectId) return;

    // --- Capture Current State & Check Existence --- 
    const currentStateBeforeUpdate = phases; // Capture the current state from the hook
    const phaseIndexBeforeUpdate = currentStateBeforeUpdate.findIndex(p => p.id === phaseId);
    
    if (phaseIndexBeforeUpdate === -1) {
      console.error("Phase not found before update attempt:", phaseId);
      showNotification('Phase not found.', 'error');
      return; // Don't proceed if phase doesn't exist
    }
    
    // --- Optimistic UI Update --- 
    setPhases(prevPhases => {
      const updatedPhases = JSON.parse(JSON.stringify(prevPhases)); // Deep copy
      const phaseIndex = updatedPhases.findIndex((p: ProjectPhase) => p.id === phaseId);
      
      if (phaseIndex !== -1) {
        updatedPhases[phaseIndex].status = status;
        return updatedPhases; // Return the optimistically updated state
      } else {
        // Should not happen due to the check above, but good to handle
        console.error("Phase disappeared during optimistic update? ID:", phaseId);
        return prevPhases; 
      }
    });

    // --- Backend Update --- 
    setIsSaving(true);
    setActionError(null);
    try {
      // Construct the phases array to send to the backend
      // Create a copy of the state *before* the update and apply the change
      const phasesToUpdateBackend = JSON.parse(JSON.stringify(currentStateBeforeUpdate));
      phasesToUpdateBackend[phaseIndexBeforeUpdate].status = status;
      
      await ProjectService.updateProject(projectId, { phases: phasesToUpdateBackend });
      showNotification('Phase status updated successfully', 'success');
      // UI is already updated optimistically
    } catch (err: any) {
      console.error("Error updating phase status:", err);
      setActionError(err.message || 'Failed to update phase status.');
      showNotification('Failed to update phase status.', 'error');
      // --- Rollback Optimistic Update --- 
      console.log("Rolling back optimistic state update due to error.");
      setPhases(currentStateBeforeUpdate); // Rollback using the captured state
    } finally {
      setIsSaving(false);
    }
  }, [projectId, phases, setPhases, showNotification, setActionError, setIsSaving]);

  // --- Other Handlers ---
  const handleProjectUpdate = useCallback(async (updatedProjectData: Partial<Project>) => {
     // Potentially call a specific update method from useProject hook if it exists
     // Or, more likely, just refetch after an external update action
     await fetchProject();
  }, [fetchProject]);

  const handleSubmitBid = useCallback(async (bidFormData: any) => {
    if (!user?.uid || !project?.id) return;
    setIsSaving(true);
    setActionError(null);
    try {
      const result = await submitBid(user.uid, bidFormData, editingBidId, project.id, project.name);
      if (result) {
        await fetchBids();
        setRecentBids((prev: Bid[]) => [result, ...prev].slice(0, 5));
        await fetchExpenses();
        showNotification(editingBidId ? 'Bid updated' : 'Bid added', 'success');
      }
    } catch (error: any) {
      setActionError(error.message || 'Failed to save bid.');
      showNotification('Failed to save bid.', 'error');
    } finally { setIsSaving(false); }
  }, [user, project, editingBidId, fetchBids, fetchExpenses, showNotification, setActionError, setIsSaving]);

  const handleAddQuickExpense = useCallback(async (expenseData: Partial<Expense>) => {
    if (!user?.uid || !project?.id) {
      showNotification('Cannot add expense: Missing user or project ID.', 'error');
      return;
    }
    const newExpense: Omit<EnhancedExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      projectId: project.id,
      phaseId: expenseData.phaseId || '',
      phaseName: phases?.find(p => p.id === expenseData.phaseId)?.name || '',
      status: expenseData.status || 'pending',
      amount: expenseData.amount || 0,
      description: expenseData.description || '',
      category: expenseData.category || 'other',
      date: expenseData.date || new Date(),
      vendor: expenseData.vendor || '',
      notes: expenseData.notes || '',
      subcontractorId: expenseData.subcontractorId,
      subcontractorName: expenseData.subcontractorName,
      receiptUrl: expenseData.receiptUrl,
    };

    setIsSaving(true);
    setActionError(null);
    try {
      await ExpenseService.createExpense(user.uid, newExpense as any);
      await fetchExpenses();
      await fetchPhases();
      showNotification('Expense added successfully', 'success');
    } catch (error: any) {
      setActionError(error.message || 'Failed to add expense.');
      showNotification('Failed to add expense.', 'error');
    } finally { setIsSaving(false); }
  }, [user, project?.id, phases, fetchExpenses, fetchPhases, showNotification, setActionError, setIsSaving]);

  // Define handleMenuClose BEFORE handleDelete
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, [setMenuAnchorEl]);

  const handleDelete = useCallback(async () => {
    if (!project?.id || !window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await ProjectService.deleteProject(project.id);
      showNotification('Project deleted successfully', 'success');
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      showNotification('Failed to delete project.', 'error');
    }
    handleMenuClose(); // Now correctly defined before use
  }, [project?.id, navigate, showNotification, handleMenuClose]); // Dependency is valid
  
  const refreshAllProjectData = useCallback(async () => {
    if (!projectId || !user?.uid) return;
    await Promise.all([fetchProject(), fetchPhases(), fetchBids(), fetchExpenses()]);
    showNotification('Project data refreshed', 'success');
  }, [projectId, user?.uid, fetchProject, fetchPhases, fetchBids, fetchExpenses, showNotification]);

  // Add handlers needed by tabs, potentially passed down through TabContent
  const handleEditBid = useCallback((bidId: string) => {
    setEditingBidId(bidId);
    setNewBidDialogOpen(true); // Open the same dialog for editing
  }, [setEditingBidId, setNewBidDialogOpen]);

  const handleDeleteBid = useCallback((bidId: string) => {
    const bidToDelete = bids.find(b => b.id === bidId);
    if (bidToDelete) {
      console.log(`Dispatching delete dialog event for bid: ${bidId}`);
      // Call the dispatcher with the bid object (or just ID if that's how portal expects it)
      // Assuming BidDeletePortal needs the full bid object based on search result type hint
      openBidDeleteDialog(bidToDelete); 
    } else {
      console.error("Attempted to delete non-existent bid:", bidId);
      showNotification('Could not find bid to delete', 'error');
    }
    // The actual deletion and subsequent actions are handled by BidDeletePortal via onBidDeleted prop
  }, [bids, showNotification]); // Removed fetchBids, setRecentBids from dependencies

  const handleAddBid = useCallback((phaseId?: string) => {
    setEditingBidId(null); // Ensure not in editing mode
    setCurrentPhaseForBid(phaseId || null); // Set phase context if provided
    setNewBidDialogOpen(true);
  }, [setEditingBidId, setCurrentPhaseForBid, setNewBidDialogOpen]);

  const handleEditExpense = useCallback((expense: Expense) => {
    // Logic to open an expense editing dialog/form
    console.log("Editing expense:", expense);
    showNotification('Expense editing functionality to be implemented', 'info');
  }, [showNotification]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    // Logic to delete an expense
    console.log("Deleting expense:", expenseId);
    showNotification('Expense deletion functionality to be implemented', 'info');
  }, [showNotification]);

  // Modify handleAddPhase signature: remove parameter and async
  const handleAddPhase = useCallback(() => {
    console.log("Triggering add phase process (e.g., open dialog)");
    // Placeholder: Open a dialog or navigate to a form to collect phase details
    // Example: setAddPhaseDialogOpen(true);
    showNotification('Add phase functionality not yet implemented.', 'info');
  }, [showNotification]); // Removed dependencies related to phaseData and setIsSaving

  // == Effects ==
  useEffect(() => {
    const handleBidDeletedEvent = (event: CustomEvent<{ bidId: string }>) => {
      fetchBids();
      setRecentBids((prev: Bid[]) => prev.filter(b => b.id !== event.detail.bidId));
      showNotification('Bid deleted', 'success');
    };
  }, [fetchBids, showNotification]);

  useEffect(() => {
    const handleExpenseStatusChanged = (event: Event) => {
      refreshAllProjectData();
    };
  }, [projectId, refreshAllProjectData]);

  // == Conditional Returns ==
  if (loading) {
    return (
      <PageLayout title="Loading Project">
        <CircularProgress />
      </PageLayout>
    );
  }
  if (error || !project) {
    return (
      <PageLayout title="Error Loading Project" icon={BusinessIcon}>
        <Alert severity="error" sx={{ mt: 3 }}>{error || 'Project not found or access denied.'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </PageLayout>
    );
  }

  // == Component Render ==
  return (
    <>
      <PageLayout title={project.name}>
        {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>} 
        
        {/* Add ProjectMetricCards back with all required props */}
        <ProjectMetricCards
          project={project}
          budgetData={budgetData}
          projectProgress={projectProgress}
          expenseBreakdown={expenseBreakdown}
          timeline={timeline}
          theme={theme}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
        
        <TabNavigation 
            tabValue={tabValue} 
            onTabChange={(event, newValue) => setTabValue(newValue)} 
        />
        <TabContent
          tabValue={tabValue}
          project={project}
          phases={phases}
          bids={bids}
          expenses={expenses}
          recentBids={recentBids}
          combinedExpenses={combinedExpenses}
          budgetData={budgetData}
          expensesData={expensesChartData}
          phaseProposedCosts={phaseProposedCosts}
          phaseActualCosts={phaseActualCosts}
          theme={theme}
          userId={user?.uid || ''}
          getStatusColor={getStatusColor}
          handleAddPhase={handleAddPhase}
          onUpdatePhaseStatus={handleUpdatePhaseStatus}
          handleEditBid={handleEditBid}
          handleDeleteBid={handleDeleteBid}
          handleAddBid={handleAddBid}
          handleEditExpense={handleEditExpense}
          handleDeleteExpense={handleDeleteExpense}
          isLoading={loading}
          error={error}
          onRefreshData={refreshAllProjectData}
          tasks={[]}
          subcontractors={[]}
          documents={[]}
          onAddTask={() => showNotification('Task functionality TBD', 'info')}
          onUpdateTask={() => showNotification('Task functionality TBD', 'info')}
          onDeleteTask={() => showNotification('Task functionality TBD', 'info')}
          onAddDocument={() => showNotification('Document functionality TBD', 'info')}
          onDeleteDocument={() => showNotification('Document functionality TBD', 'info')}
          onAddSubcontractor={() => setShowQuickAddSubcontractor(true)}
          onEditSubcontractor={() => showNotification('Subcontractor edit TBD', 'info')}
          onDeleteSubcontractor={() => showNotification('Subcontractor delete TBD', 'info')}
        />
      </PageLayout>
      {/* Dialogs */} 
      { project &&
          <BidFormDialog
            open={newBidDialogOpen}
            onClose={() => setNewBidDialogOpen(false)}
            onSubmitSuccess={(savedBid) => { fetchBids(); /* Consider updating recent bids */ }}
            projectId={project.id}
            phases={phases}
            initialBidData={editingBidId 
              ? (() => {
                  const bid = bids.find(b => b.id === editingBidId);
                  if (!bid) return undefined;
                  
                  // --- Payment Terms Transformation ---
                  let transformedPaymentTerms: BidFormData['paymentTerms'] = undefined;
                  
                  // Check for valid payment terms structure
                  if (bid.paymentTerms && 
                      typeof bid.paymentTerms === 'object' && 
                      !Array.isArray(bid.paymentTerms)) 
                  {
                      // Type assertion to help TypeScript
                      type PaymentTermsType = {
                        downPaymentPercent: number;
                        installments: Array<{
                          id: string;
                          name: string;
                          percent: number;
                          milestoneDescription: string;
                          phaseId?: string;
                          phaseName?: string;
                        }>;
                      };
                      
                      // Further narrow down the type
                      const paymentObj = bid.paymentTerms as any;
                      
                      if (paymentObj &&
                          typeof paymentObj.downPaymentPercent === 'number' &&
                          Array.isArray(paymentObj.installments)) 
                      {
                        transformedPaymentTerms = paymentObj as PaymentTermsType;
                      }
                  }

                  // --- Status Transformation ---
                  // Define allowed statuses
                  const allowedStatuses = ['draft', 'submitted', 'accepted', 'rejected', 'expired'] as const;
                  type AllowedStatus = typeof allowedStatuses[number];
                  
                  let transformedStatus: AllowedStatus | undefined = undefined;
                  
                  if (bid.status && allowedStatuses.includes(bid.status as AllowedStatus)) {
                    transformedStatus = bid.status as AllowedStatus;
                  }

                  // --- Assemble Transformed Data ---
                  return {
                    // Spread properties, explicitly excluding those handled manually
                    ...(bid as Omit<Bid, 'paymentTerms' | 'submissionDeadline' | 'status'>), 
                    submissionDeadline: bid.submissionDeadline ?? undefined,
                    paymentTerms: transformedPaymentTerms,
                    status: transformedStatus,
                  } as Partial<BidFormData>;
                })()
              : undefined
            }
            editingBidId={editingBidId}
            onAddSubcontractor={() => setShowQuickAddSubcontractor(true)}
          />
      }
      
      <BidDeletePortal 
        userId={user?.uid || ''} // Pass userId
        onBidDeleted={(deletedBidId) => { // Handle actions after successful deletion
          console.log(`BidDeletePortal confirmed deletion for: ${deletedBidId}`);
          fetchBids(); // Refetch bids list
          setRecentBids((prev: Bid[]) => prev.filter(b => b.id !== deletedBidId)); // Update recent bids
          showNotification('Bid deleted successfully', 'success'); // Show confirmation
        }}
      /> 
    </>
  );
};

export default ProjectDetailPage;