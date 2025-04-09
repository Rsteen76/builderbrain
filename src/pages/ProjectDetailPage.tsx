// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useMemo, useCallback } from 'react';
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
  usePhaseOperations, 
  useBidOperations, 
  useExpenseOperations, 
  useProjectOperations, 
  useBidFormDialog,
  useQuickAddSubcontractorDialog,
  useNotification
} from '../hooks';

// Types & Utils
import { ProjectPhase, Bid, Expense, Subcontractor, Project, Phase, ExpenseCategory, BidSummary } from '../types';
import { calculateBudgetData } from '../utils/projectMetrics';
import { calculateExpenseBreakdown, calculateExpensesChartData, calculateCombinedExpenses, ExpenseChartData, CombinedExpenseData, ExpenseBreakdown } from '../utils/expenseAnalytics';
import { calculateProjectProgress, calculatePhaseProposedCosts, calculatePhaseActualCosts } from '../utils/phaseCalculations';
import { calculateTimelineData, TimelineData } from '../utils/timelineUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';

// --- Main Page Component ---
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  // Render Provider and the main content component
  return (
    <ProjectDetailProvider projectId={projectId}>
      <ProjectDetailContent />
    </ProjectDetailProvider>
  );
};

// --- Inner Content Component (Consumes Context) ---
const ProjectDetailContent: React.FC = () => {
  const {
    project, phases, bids, expenses, loading, error,
    refreshAllProjectData, setPhases, setBids, setExpenses, // Get setters from context
    projectId
  } = useProjectDetail();
  const { user } = useAuth();
  const theme = useTheme();

  // == Local UI State ==
  const [tabValue, setTabValue] = useState(0);
  // Removed state for old menu
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); 
  const [isSaving, setIsSaving] = useState(false); // Maybe rename or use hook's loading state
  const [actionError, setActionError] = useState<string | null>(null); // Maybe rename or use hook's error state

  // == Instantiate Notification Hook ==
  const { showNotification, NotificationComponent } = useNotification();

  // Define Callbacks BEFORE hook instantiation
  const handleSubmitBidSuccess = useCallback((savedBid: Bid) => {
     console.log('Bid saved successfully (via Dialog): ', savedBid.id);
      refreshAllProjectData();
     showNotification(editingBidId ? 'Bid updated successfully!' : 'Bid added successfully!', 'success');
  }, [refreshAllProjectData, showNotification /* Add editingBidId dependency later if needed */]);
  
  // == Instantiate Operation Hooks ==
  const { 
    isUpdatingPhase, 
    updatePhaseStatus 
  } = usePhaseOperations({ 
    projectId: projectId ?? '', 
    onPhaseUpdate: (updatedPhase) => { 
      setPhases(currentPhases => 
        currentPhases.map(p => p.id === updatedPhase.id ? (updatedPhase as ProjectPhase) : p)
      );
    }
  });

  const { 
    isOperating: isBidOperating, 
    requestDeleteBid, 
    duplicateBid 
  } = useBidOperations({ 
    projectId: projectId ?? '', 
    onBidUpdate: (affectedBidId, operation) => {
      // Refetch all data after delete/duplicate
      showNotification(`Bid ${operation} successful!`, 'success');
      refreshAllProjectData(); 
    } 
  });

  const { 
    isOperating: isExpenseOperating, 
    addExpense, 
    // updateExpense, // Not used directly here yet
    deleteExpense 
  } = useExpenseOperations({ 
    projectId: projectId ?? '',
    onExpenseUpdate: (newExpense, operation) => {
      showNotification(`Expense ${operation} successful!`, 'success');
      refreshAllProjectData();
    },
    onExpenseDelete: (deletedExpenseId) => {
      showNotification('Expense deleted successfully!', 'success');
      refreshAllProjectData();
    }
  });

  const { 
    isOperating: isProjectOperating, 
    updateProjectDetails, 
    deleteProject 
  } = useProjectOperations({
    onProjectUpdate: (updatedProject) => {
      showNotification('Project details updated!', 'success');
      refreshAllProjectData();
    },
  });

  // == Instantiate Dialog Hooks ==
  const bidFormDialog = useBidFormDialog(user?.uid, {
    projectId: projectId ?? '',
    onSubmitSuccess: handleSubmitBidSuccess, // Now defined
    onError: (msg) => showNotification(msg, 'error'),
  });
  const { editingBidId } = bidFormDialog; // Get editingBidId from hook state
  
  // Instantiate Quick Add Sub Dialog Hook
  const quickAddSubDialog = useQuickAddSubcontractorDialog({
    onSubmitSuccess: (newSub) => {
        showNotification(`Subcontractor ${newSub.name} added!`, 'success');
        // Optionally refresh subcontractor list if needed elsewhere (e.g., in BidFormDialog)
    }
  });

  // Combine ALL relevant loading states
  const isProcessing = loading || isUpdatingPhase || isBidOperating || isExpenseOperating || isProjectOperating || quickAddSubDialog.isSavingSub;

  // == Placeholder Status Helpers ==
  const getStatusColor = useCallback((status: string): string => {
    // Simple placeholder logic
    if (status?.includes('complete')) return theme.palette.success.main;
    if (status?.includes('progress')) return theme.palette.info.main;
    if (status?.includes('delayed') || status?.includes('hold')) return theme.palette.warning.main;
    if (status?.includes('reject') || status?.includes('cancel')) return theme.palette.error.main;
    return theme.palette.grey[500]; // Default
  }, [theme]);

  const getStatusIcon = useCallback((status: string): JSX.Element => {
    // Simple placeholder logic
    if (status?.includes('complete')) return <CheckCircle fontSize="small" />;
    if (status?.includes('progress')) return <PlayCircleOutline fontSize="small" />;
    if (status?.includes('planning')) return <Schedule fontSize="small" />;
    if (status?.includes('delayed') || status?.includes('hold')) return <Block fontSize="small" />;
    if (status?.includes('reject') || status?.includes('cancel')) return <ErrorOutline fontSize="small" />;
    return <HelpOutline fontSize="small" />; // Default
  }, []);  
  
  // == Memoized Calculations ==
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
    const defaultTimeline: TimelineData = {
      startDate: new Date(0), endDate: new Date(0), elapsedDays: 0, totalDays: 0, percentComplete: 0
    };
    if (!project || !project.startDate) return defaultTimeline;
    try { return calculateTimelineData(project) || defaultTimeline; } catch (error) { return defaultTimeline; }
  }, [project]);

  // Calculate derived data needed for TabContent
  const recentBids: Bid[] = useMemo(() => (bids || []).slice(0, 5), [bids]);

  const expensesChartData: ExpenseChartData[] = useMemo(() => calculateExpensesChartData(expenses || []), [expenses]);

  const combinedExpensesData: CombinedExpenseData[] = useMemo(() => calculateCombinedExpenses(expenses || []), [expenses]);

  const phaseProposedCosts: Record<string, number> = useMemo(() => calculatePhaseProposedCosts(phases || [], bids || []), [phases, bids]);

  const phaseActualCosts: Record<string, number> = useMemo(() => calculatePhaseActualCosts(phases || [], expenses || []), [phases, expenses]);

  // == Event Handlers ==
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // Removed handlers for old menu
  // const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
  //   setAnchorEl(event.currentTarget);
  // }, []);
  // const handleMenuClose = useCallback(() => {
  //   setAnchorEl(null);
  // }, []);

  // --- Phase Status Update (Using Hook) ---
  const handleUpdatePhaseStatus = useCallback(async (phaseId: string, status: Phase['status']) => {
    if (!status || !['not_started', 'in_progress', 'completed', 'on_hold'].includes(status)) {
      console.error('Invalid status passed to handleUpdatePhaseStatus:', status);
      showNotification(`Invalid phase status: ${status}`, 'error');
      return; 
    }
    await updatePhaseStatus(phaseId, status as 'not_started' | 'in_progress' | 'completed' | 'on_hold'); 
  }, [updatePhaseStatus, showNotification]);

  // --- Quick Expense Addition (Using Hook) ---
  const handleAddQuickExpense = useCallback(async (description: string, amount: number, category: string, phaseId?: string) => {
    const newExpenseData: Partial<Expense> = {
        description,
        amount,
        category: category as ExpenseCategory,
        status: 'pending',
        date: format(new Date(), 'yyyy-MM-dd'),
        phaseId: phaseId || undefined,
    };
    await addExpense(newExpenseData);
  }, [addExpense]);

  // --- Placeholder Handlers ---
  const handleAddPhase = useCallback(() => {
      console.warn('handleAddPhase functionality not implemented yet.');
      showNotification('Add Phase action is not yet available.', 'info');
      // TODO: Implement using a dialog and PhaseService.createPhase
  }, [showNotification]);

  // --- Bid Actions (Using Hooks & Accepting ID) ---
  const handleAddBid = useCallback(() => {
    bidFormDialog.openNewBidDialog(projectId); // Use dialog hook to open for new bid
  }, [bidFormDialog, projectId]);
  
  const handleEditBid = useCallback((bidId: string) => {
    const bidSummary = bids.find(b => b.id === bidId);
    if (bidSummary) {
      console.log('Opening bid form for editing bid ID:', bidId);
      bidFormDialog.openEditBidDialog(bidSummary);
    } else {
      console.error('Bid not found for editing:', bidId);
      showNotification('Could not find bid to edit.', 'error');
    }
  }, [bids, bidFormDialog, showNotification]);

  const handleDeleteBid = useCallback((bidId: string) => {
    const bidSummary = bids.find(b => b.id === bidId);
    if (bidSummary) {
      // Revert cast to any, try casting to Bid
      requestDeleteBid(bidSummary as Bid);
    } else {
      console.error('Bid not found for deletion request:', bidId);
      showNotification('Could not find bid to delete.', 'error');
    }
  }, [bids, requestDeleteBid, showNotification]);

  // --- Project Action Handlers (for ProjectActionsMenu) ---
  const handleEditProject = useCallback((id: string) => {
    // TODO: Implement Edit Project Logic
    console.log("Edit project requested:", id);
    showNotification('Edit project functionality not yet implemented.', 'info');
  }, [showNotification]);

  const handleArchiveProject = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to archive (delete) this project?')) {
      try {
        await deleteProject(id);
        // On success, the hook likely handles navigation.
        // If not, you might need to navigate here.
      } catch (error: any) {
        // Show notification on error
        console.error("Failed to archive project:", error);
        showNotification(`Failed to archive project: ${error?.message || 'Unknown error'}`, 'error');
      }
    }
  }, [deleteProject, showNotification]);

  // == Conditional Returns ==
  // Show loading indicator only on initial load when project data isn't available yet
  if (loading && !project) {
    return (
        // Use imported Box
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
                </Box>
    );
  }

  // Show error message if fetching failed
  if (error && !project) { // Only show full page error if project load failed
    return <Container><Alert severity="error">Error loading project data: {error}</Alert></Container>;
  }

  // Handle case where loading finished but project is still null (e.g., not found, permissions)
  if (!project) {
    return <Container><Alert severity="warning">Project not found or you may not have access.</Alert></Container>;
  }

  // == Render Project Details Page ==
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <ProjectDetailHeader 
        project={project} 
        onEdit={handleEditProject} 
        onArchive={handleArchiveProject} 
      />
        
      {isProcessing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Render the NotificationComponent provided by the hook */}
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
      getStatusColor={getStatusColor}
      getStatusIcon={getStatusIcon}
    />

    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Project Details Tabs">
        <Tab label="Overview" />
        <Tab label="Phases" />
        <Tab label="Bids" />
        <Tab label="Expenses" />
        <Tab label="Documents" />
        <Tab label="Tasks" />
      </Tabs>
    </Box>

    <TabContent
      tabValue={tabValue}
      project={project}
      phases={phases}
      bids={bids}
    expenses={expenses}
    theme={theme}
      recentBids={recentBids}
    expensesData={expensesChartData}
    combinedExpenses={combinedExpensesData}
      budgetData={budgetData}
      phaseProposedCosts={phaseProposedCosts}
      phaseActualCosts={phaseActualCosts}
      userId={user?.uid || ''}
      getStatusColor={getStatusColor}
      handleAddPhase={handleAddPhase}
      handleEditBid={handleEditBid}
      handleDeleteBid={handleDeleteBid}
      onUpdatePhaseStatus={handleUpdatePhaseStatus}
      handleAddBid={handleAddBid}
      isLoading={isSaving || (loading && !phases.length && !bids.length)}
      error={actionError || (tabValue > 0 ? error : null)}
      onRefreshData={refreshAllProjectData}
    />

    {bidFormDialog.isModalOpen && (
      <BidFormDialog
        open={bidFormDialog.isModalOpen}
        onClose={bidFormDialog.closeBidDialog}
        onSubmitSuccess={bidFormDialog.handleBidSubmitSuccess}
        initialBidData={bidFormDialog.initialBidData || undefined}
        editingBidId={bidFormDialog.editingBidId}
        projectId={projectId} 
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

    </Container>
  );
};

export default ProjectDetailPage;