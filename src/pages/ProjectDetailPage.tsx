// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, CircularProgress, Alert, Tab, Tabs, Box,
  Button, /* Menu, MenuItem, */ Snackbar, /* IconButton, */ LinearProgress // Removed Menu, MenuItem, IconButton
} from '@mui/material';
import { AlertColor } from '@mui/material/Alert';
// Removed MoreVertIcon import
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { CheckCircle, ErrorOutline, Schedule, PlayCircleOutline, Block, HelpOutline } from '@mui/icons-material';

// Context
import { ProjectDetailProvider, useProjectDetail } from '../contexts/ProjectDetailContext';

// Components
import ProjectDetailHeader from '../components/projects/ProjectDetailHeader';
import ProjectMetricCards from '../components/projects/ProjectMetricCards';
import TabNavigation from '../components/projects/detailTabs/TabNavigation';
import TabContent from '../components/projects/detailTabs/TabContent';
import BidFormDialog from '../components/dialogs/BidFormDialog';
// import BidDeletePortal from '../components/dialogs/BidDeletePortal'; // TODO: Implement/Uncomment
import QuickAddSubcontractorDialog from '../components/dialogs/QuickAddSubcontractorDialog';

// Hooks & Services
import { useAuth } from '../hooks/useAuth';
// Removed direct service imports, now handled by operation hooks
// import { BidService } from '../services/bid';
// import { ExpenseService } from '../services/expense';
// Import Operation Hooks
import { 
  useBidOperations, 
  useProjectOperations, 
  useBidFormDialog,
  useQuickAddSubcontractorDialog,
  useNotification
} from '../hooks';

// Types & Utils
import { ProjectPhase, Bid, Expense, Subcontractor, Project, Phase, ExpenseCategory, BidSummary, ExpenseBreakdown } from '../types';
import { calculateBudgetData } from '../utils/projectMetrics';
import { calculateExpenseBreakdown, calculateExpensesChartData, calculateCombinedExpenses, ExpenseChartData, CombinedExpenseData } from '../utils/expenseAnalytics';
import { calculateProjectProgress, calculatePhaseProposedCosts, calculatePhaseActualCosts } from '../utils/phaseCalculations';
import { calculateTimelineData, TimelineData } from '../utils/timelineUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';

// --- Inner Content Component (Defined BEFORE ProjectDetailPage) ---
const ProjectDetailContent: React.FC = () => {
  const {
    // Core data
    project, phases, bids, expenses, subcontractors, loading, error, projectId,
    // Context Functions
    refreshAllProjectData, showNotification, NotificationComponent,
    // Bid Dialog state & actions
    isBidModalOpen, bidInitialData, editingBidId, 
    openNewBidDialog, openEditBidDialog, closeBidDialog, handleBidSubmitSuccess, 
    isBidSubmitting, bidDialogError,
    // Bid Operations
    requestDeleteBid, duplicateBid, isBidOperating,
    // Expense Dialog State & Actions
    isExpenseDialogOpen, editingExpenseId, initialExpenseData,
    openNewExpenseDialog, openEditExpenseDialog, closeExpenseDialog,
    // Phase Operations State & Actions
    isUpdatingPhase,
    updatePhaseStatus,
    // Expense Operations State & Actions
    isExpenseOperating,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useProjectDetail();
  
  const { user } = useAuth();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Keep Quick Add Subcontractor Dialog hook local
  const { setSubcontractors: setContextSubcontractors } = useProjectDetail();
  const quickAddSubDialog = useQuickAddSubcontractorDialog({
    onSubmitSuccess: (newSub) => {
      setContextSubcontractors(prev => [...prev, newSub]);
    }
  });

  // Update combined loading state
  const isProcessing = loading || isUpdatingPhase || isBidOperating || isExpenseOperating || quickAddSubDialog.isSavingSub || isBidSubmitting;

  // --- Memoized Calculations ---
  // (Ensure these calculations handle potentially null project)
  const budgetData = useMemo(() => {
    if (!project || !expenses) return { totalBudget: 0, totalActual: 0, difference: 0, percentUsed: 0 };
    return calculateBudgetData(project, expenses);
  }, [project, expenses]);

  const projectProgress = useMemo(() => {
    if (!phases || phases.length === 0) return 0;
    return calculateProjectProgress(phases);
  }, [phases]);
  
  const expenseBreakdownData: ExpenseBreakdown = useMemo(() => {
    if (!expenses) return { pending: 0, approved: 0, paid: 0, rejected: 0 };
    return calculateExpenseBreakdown(expenses);
  }, [expenses]);

  const timelineData: TimelineData = useMemo(() => {
    const defaultTimeline: TimelineData = { startDate: new Date(0), endDate: new Date(0), elapsedDays: 0, totalDays: 0, percentComplete: 0 };
    if (!project || !project.startDate) return defaultTimeline;
    try { return calculateTimelineData(project) || defaultTimeline; } catch (error) { return defaultTimeline; }
  }, [project]);

  const expensesChartData: ExpenseChartData[] = useMemo(() => calculateExpensesChartData(expenses || []), [expenses]);
  const combinedExpensesData: CombinedExpenseData[] = useMemo(() => calculateCombinedExpenses(expenses || []), [expenses]);
  const phaseProposedCosts: Record<string, number> = useMemo(() => calculatePhaseProposedCosts(phases || [], bids || []), [phases, bids]);
  const phaseActualCosts: Record<string, number> = useMemo(() => calculatePhaseActualCosts(phases || [], expenses || []), [phases, expenses]);
  const recentBids: Bid[] = useMemo(() => (bids || []).slice(0, 5), [bids]);

  // --- Event Handlers ---
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // Use updatePhaseStatus from context
  const handleUpdatePhaseStatus = useCallback(async (phaseId: string, status: Phase['status']) => {
    if (!status || !['not_started', 'in_progress', 'completed', 'on_hold'].includes(status)) {
      showNotification(`Invalid phase status: ${status}`, 'error');
      return; 
    }
    // Use function directly from context
    await updatePhaseStatus(phaseId, status as 'not_started' | 'in_progress' | 'completed' | 'on_hold'); 
    // Refresh is handled by the hook callback within the context provider
  }, [updatePhaseStatus, showNotification]); // Dependency is the function from context

  // Use addExpense from context
  const handleAddQuickExpense = useCallback(async (description: string, amount: number, category: string, phaseId?: string) => {
    const newExpenseData: Partial<Expense> = {
        description, amount, category: category as Expense['category'],
        status: 'pending', date: format(new Date(), 'yyyy-MM-dd'),
        phaseId: phaseId || undefined, projectId: projectId ?? undefined, 
    };
    // Use function directly from context
    await addExpense(newExpenseData);
    // Refresh is handled by the hook callback within the context provider
  }, [addExpense, projectId]);

  // Bid actions use context functions
  const handleAddBid = useCallback(() => {
    openNewBidDialog({ projectId: projectId ?? undefined }); 
  }, [openNewBidDialog, projectId]);
  
  const handleEditBid = useCallback((bidId: string) => {
    const bidToEdit = bids.find((b: Bid | BidSummary) => b.id === bidId);
    if (bidToEdit) {
      openEditBidDialog(bidToEdit); 
    } else {
      showNotification("Bid not found for editing.", "error");
    }
  }, [bids, openEditBidDialog, showNotification]);

  const handleDeleteBid = useCallback(async (bidId: string) => {
    const bidToDelete = bids.find((b: Bid | BidSummary) => b.id === bidId);
    if (bidToDelete) {
      requestDeleteBid(bidToDelete); 
      } else {
       showNotification("Bid not found for deletion.", "error");
    }
  }, [bids, requestDeleteBid, showNotification]);

  // --- Rendering ---
  if (loading && !project) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  if (error && !project) return <Container><Alert severity="error">Error loading project data: {error}</Alert></Container>;
  if (!project) return <Container><Alert severity="warning">Project not found or you may not have access.</Alert></Container>;

  return (
    <Box sx={{ mt: 4, mb: 4 }}> 
      <ProjectDetailHeader project={project} onEdit={() => {}} onArchive={() => {}} />
      <NotificationComponent /> 
        <ProjectMetricCards 
          project={project}
          budgetData={budgetData}
        projectProgress={projectProgress}
        expenseBreakdown={expenseBreakdownData}
        timeline={timelineData}
          theme={theme}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        getStatusColor={(status: string) => {
          if (status?.includes('complete')) return theme.palette.success.main;
          if (status?.includes('progress')) return theme.palette.info.main;
          if (status?.includes('delayed') || status?.includes('hold')) return theme.palette.warning.main;
          if (status?.includes('reject') || status?.includes('cancel')) return theme.palette.error.main;
          return theme.palette.grey[500]; // Default
        }}
        getStatusIcon={(status: string) => {
          if (status?.includes('complete')) return <CheckCircle fontSize="small" />;
          if (status?.includes('progress')) return <PlayCircleOutline fontSize="small" />;
          if (status?.includes('planning')) return <Schedule fontSize="small" />;
          if (status?.includes('delayed') || status?.includes('hold')) return <Block fontSize="small" />;
          if (status?.includes('reject') || status?.includes('cancel')) return <ErrorOutline fontSize="small" />;
          return <HelpOutline fontSize="small" />; // Default
        }}
      />
      <TabNavigation tabValue={tabValue} onTabChange={handleTabChange} /> 
      <TabContent tabValue={tabValue} />
      {isBidModalOpen && (
        <BidFormDialog
          open={isBidModalOpen}
          onClose={closeBidDialog} 
          onSubmitSuccess={handleBidSubmitSuccess} 
          initialBidData={bidInitialData || undefined} 
          editingBidId={editingBidId}
          projectId={projectId ?? undefined}
          phases={phases}
          subcontractors={subcontractors}
          onAddSubcontractor={quickAddSubDialog.openQuickAddSubDialog}
        />
      )}
      {quickAddSubDialog.isQuickAddSubDialogOpen && (
        <QuickAddSubcontractorDialog 
          open={quickAddSubDialog.isQuickAddSubDialogOpen}
          onClose={quickAddSubDialog.closeQuickAddSubDialog}
          onSubmit={quickAddSubDialog.handleDialogSubmit}
          isSaving={quickAddSubDialog.isSavingSub}
        />
      )}
    </Box>
  );
};

// --- Main Page Component (Sets up Provider) ---
// Now defined AFTER ProjectDetailContent
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <Alert severity="error">Project ID is missing.</Alert>;
  }

  return (
    <ProjectDetailProvider projectId={projectId}>
      <ProjectDetailContent />
    </ProjectDetailProvider>
  );
};

export default ProjectDetailPage;