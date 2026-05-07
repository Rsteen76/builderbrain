// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, CircularProgress, Alert, Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle, ErrorOutline, Schedule, PlayCircleOutline, Block, HelpOutline } from '@mui/icons-material';

import { ProjectDetailProvider, useProjectDetail } from '../contexts/ProjectDetailContext';

import ProjectDetailHeader from '../components/projects/ProjectDetailHeader';
import ProjectMetricCards from '../components/projects/ProjectMetricCards';
import TabNavigation from '../components/projects/detailTabs/TabNavigation';
import TabContent from '../components/projects/detailTabs/TabContent';
import BidFormDialog from '../components/dialogs/BidFormDialog';
import QuickAddSubcontractorDialog from '../components/dialogs/QuickAddSubcontractorDialog';

import { 
  useProjectOperations, 
  useQuickAddSubcontractorDialog,
} from '../hooks';

import { ExpenseBreakdown } from '../types';
import { calculateBudgetData } from '../utils/projectMetrics';
import { calculateExpenseBreakdown } from '../utils/expenseAnalytics';
import { calculateProjectProgress } from '../utils/phaseCalculations';
import { calculateTimelineData, TimelineData } from '../utils/timelineUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const ProjectDetailContent: React.FC = () => {
  const {
    project, phases, expenses, subcontractors, loading, error, projectId,
    refreshAllProjectData, showNotification, NotificationComponent, setSubcontractors,
    isBidModalOpen, bidInitialData, editingBidId, 
    closeBidDialog, handleBidSubmitSuccess,
  } = useProjectDetail();
  
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const { updateProjectDetails } = useProjectOperations({
    onProjectUpdate: () => refreshAllProjectData(),
  });

  const quickAddSubDialog = useQuickAddSubcontractorDialog({
    onSubmitSuccess: (newSub) => {
      setSubcontractors(prev => [...prev, newSub]);
    }
  });

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

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleEditProject = useCallback((id: string) => {
    navigate(`/projects/${id}/edit`);
  }, [navigate]);

  const handleArchiveProject = useCallback(async (id: string) => {
    if (!window.confirm('Move this project to On Hold? It will stay available in your project list.')) {
      return;
    }

    await updateProjectDetails(id, { status: 'on_hold' });
    showNotification('Project moved to On Hold.', 'success');
  }, [showNotification, updateProjectDetails]);

  if (loading && !project) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  if (error && !project) return <Container><Alert severity="error">Error loading project data: {error}</Alert></Container>;
  if (!project) return <Container><Alert severity="warning">Project not found or you may not have access.</Alert></Container>;

  return (
    <Box sx={{ mt: 4, mb: 4 }}> 
      <ProjectDetailHeader project={project} onEdit={handleEditProject} onArchive={handleArchiveProject} />
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
