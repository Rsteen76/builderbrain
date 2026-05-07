import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  alpha,
  Divider,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  DonutLarge as DonutLargeIcon,
  Pending as PendingIcon,
  Done as DoneIcon,
  Info as InfoIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/formatters';
import PhaseTimelineChart from '../charts/PhaseTimelineChart';
import PhaseCard from './PhaseCard';
import { ProjectPhase } from '../../../types';
import { usePhaseMenuState } from '../../../hooks/usePhaseMenuState';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { usePhaseDetailsDialog } from '../../../hooks/usePhaseDetailsDialog';
import { useNotification } from '../../../hooks/useNotification';
import { 
  calculatePhaseProposedCosts, 
  calculatePhaseActualCosts 
} from '../../../utils/phaseCalculations';
import PhaseDetailsDialog from '../dialogs/PhaseDetailsDialog';
import TemplateAdjuster from '../TemplateAdjuster';
import { v4 as uuidv4 } from 'uuid';

// Original broader status list (used for menu population)
const ALL_PHASE_STATUSES: ProjectPhase['status'][] = [
  'not_started',
  'planning',
  'in_progress',
  'completed',
  'on_hold',
  'delayed'
];

const ProjectPhasesTab: React.FC = () => {
  const theme = useTheme();
  const {
    project,
    phases,
    bids = [],
    expenses = [],
    loading,
    error,
    openNewBidDialog,
    openNewExpenseDialog,
    refreshAllProjectData,
    setPhases,
    isUpdatingPhase,
    updatePhaseStatus,
    addPhase,
    deletePhase,
  } = useProjectDetail();

  const phaseMenu = usePhaseMenuState();
  const {
    actionMenuPhaseId,
    statusMenuPhaseId,
    handleActionMenuClose,
    handleStatusMenuClose,
  } = phaseMenu;
  const { showNotification } = useNotification();
  const phaseDetailsDialog = usePhaseDetailsDialog();
  const [isTemplateAdjusterOpen, setIsTemplateAdjusterOpen] = useState(false);

  const phaseProposedCosts = useMemo(() => calculatePhaseProposedCosts(phases || [], bids || []), [phases, bids]);
  const phaseActualCosts = useMemo(() => calculatePhaseActualCosts(phases || [], expenses || []), [phases, expenses]);

  const handleStatusSelect = useCallback(async (status: ProjectPhase['status']) => {
    if (statusMenuPhaseId) {
      await updatePhaseStatus(statusMenuPhaseId, status);
    }
    handleStatusMenuClose();
  }, [handleStatusMenuClose, statusMenuPhaseId, updatePhaseStatus]);

  const createDefaultPhase = useCallback((name: string): ProjectPhase => {
    const projectStartDate = project?.startDate ? new Date(project.startDate) : new Date();
    const sortedPhases = [...phases].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const lastPhase = sortedPhases[sortedPhases.length - 1];
    const startDate = lastPhase?.endDate ? new Date(lastPhase.endDate as Date) : projectStartDate;
    if (lastPhase?.endDate) {
      startDate.setDate(startDate.getDate() + 1);
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return {
      id: uuidv4(),
      projectId: project?.id,
      name,
      description: '',
      startDate,
      endDate,
      status: 'not_started',
      progress: 0,
      order: phases.length,
      tasks: [],
      budget: 0,
      actualCost: 0,
    };
  }, [phases, project?.id, project?.startDate]);

  const handleAddPhaseClick = useCallback(async () => {
    const nextNumber = phases.length + 1;
    const enteredName = window.prompt('Phase name', `Phase ${nextNumber}`);
    const phaseName = enteredName?.trim();
    if (!phaseName) return;

    await addPhase(createDefaultPhase(phaseName));
  }, [addPhase, createDefaultPhase, phases.length]);

  const handleOpenTemplateAdjusterClick = () => {
    if (!project) {
      showNotification('Project details are still loading.', 'info');
      return;
    }
    setIsTemplateAdjusterOpen(true);
  };

  const handleDeletePhaseClick = useCallback(async () => {
    const phaseId = actionMenuPhaseId;
    const phase = phases.find((item) => item.id === phaseId);
    handleActionMenuClose();
    if (!phaseId || !phase) {
      showNotification('Could not find phase to delete.', 'error');
      return;
    }

    const shouldDelete = window.confirm(`Delete phase "${phase.name}"? This will remove it from the project schedule.`);
    if (!shouldDelete) return;

    await deletePhase(phaseId);
  }, [actionMenuPhaseId, deletePhase, handleActionMenuClose, phases, showNotification]);

  const handleViewDetailsClick = useCallback(() => {
    if (actionMenuPhaseId) {
      const phaseToView = phases.find(p => p.id === actionMenuPhaseId);
      if (phaseToView) {
        phaseDetailsDialog.openPhaseDetailsDialog(phaseToView as ProjectPhase);
      } else {
        showNotification('Could not find phase details.', 'error');
      }
    }
    handleActionMenuClose();
  }, [actionMenuPhaseId, phases, phaseDetailsDialog, handleActionMenuClose, showNotification]);

  const getStatusColor = useCallback((status: string): string => {
    if (status?.includes('complete')) return theme.palette.success.main;
    if (status?.includes('progress')) return theme.palette.info.main;
    if (status?.includes('planning')) return theme.palette.secondary.main;
    if (status?.includes('delayed') || status?.includes('hold')) return theme.palette.warning.main;
    return theme.palette.grey[500];
  }, [theme]);

  const getPhaseStatusIcon = useCallback((status: string): React.ReactElement => {
    switch (status?.toLowerCase()) { 
      case 'completed': return <DoneIcon />;
      case 'in_progress': return <PendingIcon />;
      case 'not_started': return <PendingIcon />;
      case 'planning': return <PendingIcon />;
      case 'on_hold': return <PendingIcon />;
      case 'delayed': return <PendingIcon />;
      default: return <InfoIcon />;
    }
  }, []);

  const handleOpenQuickBidDialog = useCallback((phaseId: string) => {
    openNewBidDialog({ phaseId: phaseId, projectId: project?.id });
  }, [openNewBidDialog, project?.id]);

  const handleOpenQuickExpenseDialog = useCallback((phaseId: string) => {
    openNewExpenseDialog({ phaseId: phaseId, projectId: project?.id });
  }, [openNewExpenseDialog, project?.id]);

  const handleOpenPhaseDetails = useCallback((phaseId: string) => {
    console.log("Open details for phase ID:", phaseId);
    const phase = phases.find(p => p.id === phaseId);
    if (phase) {
      phaseDetailsDialog.openPhaseDetailsDialog(phase as ProjectPhase);
    } else {
      showNotification("Could not find phase details to open.", "error");
    }
  }, [phases, phaseDetailsDialog, showNotification]);

  const handleUpdatePhase = useCallback((phaseId: string) => {
    phaseDetailsDialog.closePhaseDetailsDialog();
    setIsTemplateAdjusterOpen(true);
  }, [phaseDetailsDialog]);

  const handleTemplateProjectUpdate = useCallback(async (updatedProject: NonNullable<typeof project>) => {
    setPhases(updatedProject.phases || []);
    await refreshAllProjectData();
  }, [refreshAllProjectData, setPhases]);

  if (loading) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />;
  if (error) return <Alert severity="error">Error loading phases: {error}</Alert>;
  if (!phases) return <Alert severity="warning">No phases found for this project.</Alert>;

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          position: 'relative',
          pb: 2,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.7)} 0%, ${alpha(theme.palette.secondary.main, 0.5)} 100%)`,
            borderRadius: '3px'
          }
        }}
      >
        <Box display="flex" alignItems="center">
          <DonutLargeIcon sx={{ 
            fontSize: 38, 
            color: theme.palette.primary.main,
            mr: 2,
            filter: `drop-shadow(0 2px 3px ${alpha(theme.palette.primary.main, 0.3)})`
          }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>Project Phases</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track project milestones and phase completion
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            size="medium"
            color="secondary"
            onClick={handleOpenTemplateAdjusterClick}
            disabled={!project || isUpdatingPhase}
            sx={{ 
              borderRadius: 2,
              boxShadow: `0 2px 5px ${alpha(theme.palette.secondary.main, 0.2)}`,
              fontWeight: 500,
              '&:hover': {
                boxShadow: `0 4px 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
              }
            }}
          >
            Adjust Template
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="medium"
            onClick={handleAddPhaseClick}
            disabled={!project || isUpdatingPhase}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
              boxShadow: `0 3px 6px ${alpha(theme.palette.primary.main, 0.25)}`,
              fontWeight: 500,
              '&:hover': {
                boxShadow: `0 5px 10px ${alpha(theme.palette.primary.main, 0.35)}`,
              }
            }}
          >
            Add Phase
          </Button>
        </Box>
      </Box>
      
      <PhaseTimelineChart phases={phases} />
      
      {phases.length > 0 ? (
        <Grid container spacing={3}>
          {phases.map((phase) => {
            const proposedCost = phaseProposedCosts[phase.id] || 0;
            const actualCost = phaseActualCosts[phase.id] || 0;

            return (
              <Grid item xs={12} md={6} lg={4} key={phase.id}>
                <PhaseCard 
                  phase={phase}
                  proposedCost={proposedCost}
                  actualCost={actualCost}
                  onStatusMenuOpen={phaseMenu.handleStatusMenuOpen}
                  onPhaseMenuOpen={phaseMenu.handleActionMenuOpen}
                  onOpenQuickBidDialog={handleOpenQuickBidDialog}
                  onOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
                  onViewPhaseDetails={handleOpenPhaseDetails}
                  getStatusColor={getStatusColor}
                  formatCurrency={formatCurrency}
                />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 8,
          borderRadius: 3,
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
          bgcolor: alpha(theme.palette.background.default, 0.5),
        }}>
          <TimelineIcon sx={{ 
            fontSize: 70, 
            color: alpha(theme.palette.primary.main, 0.5),
            mb: 2,
            filter: `drop-shadow(0 2px 5px ${alpha(theme.palette.primary.main, 0.2)})`
          }} />
          <Typography variant="h5" color="text.primary" sx={{ fontWeight: 600 }}>No phases defined</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, mt: 1, textAlign: 'center', maxWidth: 400 }}>
            Start by adding project phases to track progress, manage tasks, and monitor expenses.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="large"
            onClick={handleAddPhaseClick}
            disabled={!project || isUpdatingPhase}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
              boxShadow: `0 3px 6px ${alpha(theme.palette.primary.main, 0.3)}`,
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                boxShadow: `0 5px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Add First Phase
          </Button>
        </Box>
      )}
      
      <Menu
        anchorEl={phaseMenu.actionAnchorEl}
        open={phaseMenu.isActionMenuOpen}
        onClose={phaseMenu.handleActionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            p: 0.5,
          }
        }}
      >
        <MenuItem 
          onClick={handleViewDetailsClick}
          sx={{ borderRadius: 1, py: 1 }}
        >
          <ListItemIcon>
            <ChevronRightIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem 
          onClick={handleDeletePhaseClick}
          disabled={isUpdatingPhase}
          sx={{ borderRadius: 1, py: 1, color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Phase</ListItemText>
        </MenuItem>
      </Menu>
      
      <Menu
        anchorEl={phaseMenu.statusAnchorEl}
        open={phaseMenu.isStatusMenuOpen}
        onClose={phaseMenu.handleStatusMenuClose}
      >
        {ALL_PHASE_STATUSES.map((status) => (
          <MenuItem key={status} onClick={() => handleStatusSelect(status)}>
            <ListItemIcon>{getPhaseStatusIcon(status)}</ListItemIcon>
            <ListItemText primary={status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
          </MenuItem>
        ))}
      </Menu>
      
      {phaseDetailsDialog.isPhaseDetailsOpen && (
        <PhaseDetailsDialog 
          open={phaseDetailsDialog.isPhaseDetailsOpen} 
          onClose={phaseDetailsDialog.closePhaseDetailsDialog}
          selectedPhaseId={phaseDetailsDialog.selectedPhase?.id || null}
          phases={phases}
          bids={bids || []}
          expenses={expenses || []}
          theme={theme}
          getStatusColor={getStatusColor}
          handleUpdatePhase={handleUpdatePhase} 
        />
      )}

      {project && (
        <TemplateAdjuster
          open={isTemplateAdjusterOpen}
          onClose={() => setIsTemplateAdjusterOpen(false)}
          project={{ ...project, phases }}
          onUpdateProject={handleTemplateProjectUpdate}
        />
      )}
    </Box>
  );
};

export default ProjectPhasesTab;
