// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, CircularProgress, Alert, Tab, Tabs, Box,
  Button, Menu, MenuItem, Snackbar
} from '@mui/material';
import { AlertColor } from '@mui/material/Alert';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { CheckCircle, ErrorOutline, Schedule, PlayCircleOutline, Block, HelpOutline } from '@mui/icons-material';

// Context
import { ProjectDetailProvider, useProjectDetail } from '../contexts/ProjectDetailContext';

// Components
// import PageHeader from '../components/layout/PageHeader'; // Commented out - Path not found
import ProjectMetricCards from '../components/projects/ProjectMetricCards';
import TabContent from '../components/projects/detailTabs/TabContent';
import BidFormDialog from '../components/dialogs/BidFormDialog';
// import BidDeletePortal from '../components/dialogs/BidDeletePortal'; // TODO: Implement/Uncomment
import QuickAddSubcontractorDialog from '../components/dialogs/QuickAddSubcontractorDialog';

// Hooks & Services
import { useAuth } from '../hooks/useAuth';
import { BidService } from '../services/bid';
import { ExpenseService } from '../services/expense';

// Types & Utils
import { ProjectPhase, Bid, Expense, Subcontractor, Project, Phase, ExpenseCategory } from '../types';
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
    refreshAllProjectData, setPhases,
    projectId
  } = useProjectDetail();
  const { user } = useAuth();
  const theme = useTheme();

  // == Local UI State ==
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For Actions Menu
  const [showBidForm, setShowBidForm] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [showQuickAddSubcontractor, setShowQuickAddSubcontractor] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // For specific actions like updates/submits
  const [actionError, setActionError] = useState<string | null>(null); // For errors from specific actions
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as AlertColor });

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

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // --- Snackbar Notification ---
  const showNotification = useCallback((message: string, severity: AlertColor = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // --- Phase Status Update ---
  const handleUpdatePhaseStatus = useCallback(async (phaseId: string, status: Phase['status']) => {
    if (!user || !projectId) {
        setActionError("Cannot update phase: Missing user or project ID.");
        showNotification("Cannot update phase: Missing user or project ID.", "error");
        return;
    }

    const originalPhases = [...phases];
    const updatedPhases = phases.map(p => p.id === phaseId ? { ...p, status } : p);
    if (updatedPhases.some(p => p.id === phaseId && p.status === status)) {
        setPhases(updatedPhases);
    } else {
        console.error("Optimistic update failed to apply correctly.");
    }

    setIsSaving(true);
    setActionError(null);
    try {
      // TODO: Find/implement actual phase status update service call
      // await updatePhaseStatus(projectId, phaseId, status); // Call commented out
      console.warn('Phase status update API call is not implemented yet.');
      // Simulate API delay for optimistic UI
      await new Promise(resolve => setTimeout(resolve, 500));
      showNotification('Phase status updated (optimistically)!', 'success');
    } catch (error: any) {
      console.error("Error updating phase status (API call placeholder):", error);
      const errorMsg = `Failed to update phase: ${error.message || 'API call not implemented'}`;
      setActionError(errorMsg);
      showNotification(errorMsg, "error");
      setPhases(originalPhases); // Rollback
    } finally {
      setIsSaving(false);
    }
  }, [phases, setPhases, user?.uid, projectId, showNotification]);

  // --- Bid Submission (Triggered by Dialog Success) ---
  const handleSubmitBidSuccess = useCallback((savedBid: Bid) => {
     console.log('Bid saved successfully (via Dialog): ', savedBid.id);
     // Refresh data and show notification after successful save
     refreshAllProjectData();
     showNotification(editingBidId ? 'Bid updated successfully!' : 'Bid added successfully!', 'success');
     // Reset editing state if needed (Dialog might handle this on close)
     // setEditingBidId(null);
  }, [refreshAllProjectData, showNotification, editingBidId]);

  // --- Quick Expense Addition ---
  const handleAddQuickExpense = useCallback(async (description: string, amount: number, category: string, phaseId?: string) => {
    if (!user || !projectId) {
        const errorMsg = "Cannot add expense: Missing user or project ID.";
        setActionError(errorMsg);
        showNotification(errorMsg, "error");
        return;
    }

    const newExpense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'createdBy'> = {
        projectId,
        description,
        amount,
        category: category as ExpenseCategory,
        status: 'pending',
        date: format(new Date(), 'yyyy-MM-dd'),
        phaseId: phaseId || undefined,
    };

    setIsSaving(true);
    setActionError(null);
    try {
      await ExpenseService.createExpense(user.uid, newExpense as any);
      await refreshAllProjectData();
      showNotification('Expense added successfully', 'success');
    } catch (error: any) {
      console.error("Error adding quick expense:", error);
      const errorMsg = `Failed to add expense: ${error.message || 'Unknown error'}`;
      setActionError(errorMsg);
      showNotification(errorMsg, "error");
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, projectId, refreshAllProjectData, showNotification]);

  // --- Placeholder Handlers (To be replaced by dedicated hooks/logic later) ---
  const handleAddPhase = useCallback(() => {
      console.warn('handleAddPhase functionality not implemented yet.');
      showNotification('Add Phase action is not yet available.', 'info');
      // TODO: Implement using a dialog and PhaseService.createPhase
  }, [showNotification]);

  const handleEditBid = useCallback((bidId: string) => {
      console.log('Opening bid form for editing bid ID:', bidId);
      setEditingBidId(bidId);
      setShowBidForm(true);
  }, []);

  const handleDeleteBid = useCallback((bidId: string) => {
      console.warn('handleDeleteBid functionality not implemented yet.', bidId);
      showNotification('Delete Bid action is not yet available.', 'info');
      // TODO: Implement using useBidDeleteDialog hook and BidService.deleteBid
      // Example: openBidDeleteDialog(bidId);
  }, [showNotification]);

  const handleAddBid = useCallback(() => {
      console.log('Opening bid form for adding a new bid.');
      setEditingBidId(null); // Ensure we are adding
      setShowBidForm(true);
  }, []);

  const handleEditExpense = useCallback((expense: Expense) => {
      console.warn('handleEditExpense functionality not implemented yet.', expense.id);
      showNotification('Edit Expense action is not yet available.', 'info');
      // TODO: Open Expense Form Dialog with expense data
  }, [showNotification]);

  const handleDeleteExpense = useCallback((expenseId: string) => {
      console.warn('handleDeleteExpense functionality not implemented yet.', expenseId);
      showNotification('Delete Expense action is not yet available.', 'info');
      // TODO: Implement confirmation dialog and ExpenseService.deleteExpense
  }, [showNotification]);

  // --- Add Placeholders for missing TabContent handlers ---
  const handleDeletePhase = useCallback((phaseId: string) => {
    console.warn('handleDeletePhase not implemented', phaseId);
    showNotification('Delete Phase not implemented.', 'info');
  }, [showNotification]);

  const handleAddExpense = useCallback(() => {
    console.warn('handleAddExpense not implemented');
    showNotification('Add Expense not implemented.', 'info');
    // TODO: Likely open an Expense Form Dialog
  }, [showNotification]);

  const handleOpenQuickBidDialog = useCallback((phaseId?: string) => {
    console.warn('handleOpenQuickBidDialog not implemented', phaseId);
    showNotification('Quick Add Bid not implemented.', 'info');
    // TODO: Open a simplified Bid Dialog, potentially pre-filled with phaseId
  }, [showNotification]);

  const handleOpenQuickExpenseDialog = useCallback((phaseId?: string) => {
    console.warn('handleOpenQuickExpenseDialog not implemented', phaseId);
    showNotification('Quick Add Expense not implemented.', 'info');
    // TODO: Trigger Quick Expense Add, maybe using a simpler form/dialog
  }, [showNotification]);

  const handleOpenTemplateAdjuster = useCallback(() => {
      console.warn('handleOpenTemplateAdjuster not implemented');
      showNotification('Template Adjuster not implemented.', 'info');
  }, [showNotification]);

  const handleProjectUpdate = useCallback((updatedProject: Project) => {
      console.warn('handleProjectUpdate not implemented', updatedProject);
      showNotification('Project Update not implemented.', 'info');
  }, [showNotification]);

  const handleViewPhaseDetails = useCallback((phaseId: string) => {
      console.warn('handleViewPhaseDetails not implemented', phaseId);
      showNotification('View Phase Details not implemented.', 'info');
  }, [showNotification]);

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
    // Use imported Container
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* PageHeader usage commented out */}
      {/* <PageHeader
        title={project.name}
        breadcrumbs={[{ label: 'Projects', path: '/projects' }, { label: project.name }]}
      >
        <Button
          aria-controls="project-actions-menu"
          aria-haspopup="true"
          onClick={handleMenuOpen}
          variant="outlined"
          endIcon={<MoreVertIcon />}
        >
          Actions
        </Button>
        <Menu
          id="project-actions-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { handleAddBid(); handleMenuClose(); }}>Add New Bid</MenuItem>
          <MenuItem onClick={() => { handleAddPhase(); handleMenuClose(); }}>Add New Phase</MenuItem>
        </Menu>
      </PageHeader> */}

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

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        {/* Use imported Tabs and Tab */}
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Project Details Tabs">
          <Tab label="Overview" />
          <Tab label="Phases" />
          <Tab label="Bids" />
          <Tab label="Expenses" />
          <Tab label="Documents" />
          <Tab label="Tasks" />
          {/* Potential future tabs */}
        </Tabs>
      </Box>

      {/* Pass all required props to TabContent */}
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
        onUpdatePhaseStatus={handleUpdatePhaseStatus}
        handleDeletePhase={handleDeletePhase}
        handleAddBid={handleAddBid}
        handleEditBid={handleEditBid}
        handleDeleteBid={handleDeleteBid}
        handleAddExpense={handleAddExpense}
        handleEditExpense={handleEditExpense}
        handleDeleteExpense={handleDeleteExpense}
        handleOpenQuickBidDialog={handleOpenQuickBidDialog}
        handleOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
        handleOpenTemplateAdjuster={handleOpenTemplateAdjuster}
        handleProjectUpdate={handleProjectUpdate}
        handleViewPhaseDetails={handleViewPhaseDetails}
        isLoading={isSaving || (loading && !phases.length && !bids.length)}
        error={actionError || (tabValue > 0 ? error : null)}
        onRefreshData={refreshAllProjectData}
      />

      {/* Dialogs & Portals Section */}

      {/* Bid Form Dialog */}
      {showBidForm && (
            <BidFormDialog
              open={showBidForm}
              onClose={() => {
                setShowBidForm(false);
                setEditingBidId(null);
              }}
              onSubmitSuccess={handleSubmitBidSuccess}
              projectId={project.id}
              phases={phases}
              initialBidData={editingBidId ? bids.find(b => b.id === editingBidId) as any : undefined}
              editingBidId={editingBidId}
              onAddSubcontractor={() => setShowQuickAddSubcontractor(true)}
            />
      )}

      {/* Quick Add Subcontractor Dialog */}
       {showQuickAddSubcontractor && (
          <QuickAddSubcontractorDialog
            open={showQuickAddSubcontractor}
            onClose={() => setShowQuickAddSubcontractor(false)}
            onSubmit={async (newSubData) => {
                console.log("Subcontractor add requested (action pending):", newSubData);
                setIsSaving(true);
                try {
                  // TODO: Replace with actual SubcontractorService.createSubcontractor call
                  await new Promise(res => setTimeout(res, 500)); // Simulate API Call
                  showNotification('Subcontractor added (placeholder).', 'info');
                  // Optionally refresh data if needed (e.g., refreshAllProjectData or specific subcontractor list)
                } catch(err) {
                  showNotification('Failed to add subcontractor (placeholder).', 'error');
                } finally {
                  setIsSaving(false);
                  setShowQuickAddSubcontractor(false);
                }
            }}
            isSaving={isSaving}
          />
      )}

      {/* Bid Delete Portal (Placeholder Comment) */}
      {/* TODO: Implement BidDeletePortal & related state/hook */}
      {/* <BidDeletePortal ... /> */}

      {/* Snackbar for Notifications */}
      {/* Use imported Snackbar */}
      <Snackbar
         open={snackbar.open}
         autoHideDuration={6000}
         onClose={handleCloseSnackbar}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
           {/* Ensure Alert is used inside Snackbar for proper styling */}
           {/* Use imported Alert */}
           <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
               {snackbar.message}
           </Alert>
      </Snackbar>

    </Container>
  );
};

export default ProjectDetailPage;