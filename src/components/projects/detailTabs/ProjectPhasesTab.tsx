import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Grid,
  Chip,
  Avatar,
  alpha,
  Theme,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Collapse,
  Badge,
  Fade,
  useTheme,
  useMediaQuery,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  DonutLarge as DonutLargeIcon,
  AttachMoney as AttachMoneyIcon,
  Pending as PendingIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  ReceiptLong as ReceiptLongIcon,
  Handshake as HandshakeIcon,
  Assignment as AssignmentIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate, truncateText, safelyParseDate } from '../../../utils/formatters';
import { getPhaseBids, getPhaseExpenses } from '../../../utils/phaseCalculations';
import PhaseTimelineChart from '../charts/PhaseTimelineChart';
import PhaseCard from './PhaseCard';
import { ProjectPhase, Bid, Expense } from '../../../types';
import { usePhaseExpandState } from '../../../hooks/usePhaseExpandState';
import { usePhaseMenuState } from '../../../hooks/usePhaseMenuState';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { usePhaseOperations } from '../../../hooks/usePhaseOperations';
import { usePhaseDetailsDialog } from '../../../hooks/usePhaseDetailsDialog';
import { useBidFormDialog } from '../../../hooks/useBidFormDialog';
import { useExpenseFormDialog } from '../../../hooks/useExpenseFormDialog';
import { useNotification } from '../../../hooks/useNotification';
import { 
  calculatePhaseProposedCosts, 
  calculatePhaseActualCosts 
} from '../../../utils/phaseCalculations';
import { useAuth } from '../../../hooks/useAuth';
import PhaseDetailsDialog from '../../../dialogs/PhaseDetailsDialog';

// Define the subset of statuses the hook currently supports
type PhaseStatusType = 'not_started' | 'in_progress' | 'completed' | 'on_hold';

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
  } = useProjectDetail();

  const { 
    expandedPhases, 
    handleToggleExpand 
  } = usePhaseExpandState();
  
  const phaseMenu = usePhaseMenuState();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { isUpdatingPhase, updatePhaseStatus } = usePhaseOperations({
    projectId: project?.id ?? '',
  });
  const phaseDetailsDialog = usePhaseDetailsDialog();

  const phaseProposedCosts = useMemo(() => calculatePhaseProposedCosts(phases || [], bids || []), [phases, bids]);
  const phaseActualCosts = useMemo(() => calculatePhaseActualCosts(phases || [], expenses || []), [phases, expenses]);

  const handleStatusSelect = useCallback((status: ProjectPhase['status']) => {
    const validStatus = status as PhaseStatusType;
    if (phaseMenu.statusMenuPhaseId && ['not_started', 'in_progress', 'completed', 'on_hold'].includes(validStatus)) {
      updatePhaseStatus(phaseMenu.statusMenuPhaseId, validStatus);
    } else if (phaseMenu.statusMenuPhaseId) {
      showNotification(`Status update to '${status}' not currently supported.`, 'warning');
      console.warn(`Attempted to update phase ${phaseMenu.statusMenuPhaseId} to unsupported status ${status}`);
    }
    phaseMenu.handleStatusMenuClose();
  }, [phaseMenu.statusMenuPhaseId, updatePhaseStatus, phaseMenu.handleStatusMenuClose, showNotification]);

  const handleAddPhaseClick = () => {
    console.warn('Add phase button clicked, but hook doesn\'t provide addPhase.');
    showNotification('Add Phase functionality not available.', 'info');
  };

  const handleOpenTemplateAdjusterClick = () => {
    console.warn('Adjust template button clicked, but not implemented yet.');
    showNotification('Adjust Template functionality not yet implemented.', 'info');
  };

  const handleDeletePhaseClick = useCallback(() => {
    showNotification('Delete Phase functionality not available.', 'warning');
    phaseMenu.handleActionMenuClose();
  }, [phaseMenu.handleActionMenuClose, showNotification]);

  const handleViewDetailsClick = useCallback(() => {
    if (phaseMenu.actionMenuPhaseId) {
      const phaseToView = phases.find(p => p.id === phaseMenu.actionMenuPhaseId);
      if (phaseToView) {
        phaseDetailsDialog.openPhaseDetailsDialog(phaseToView as ProjectPhase);
      } else {
        showNotification('Could not find phase details.', 'error');
      }
    }
    phaseMenu.handleActionMenuClose();
  }, [phaseMenu.actionMenuPhaseId, phases, phaseDetailsDialog, phaseMenu.handleActionMenuClose, showNotification]);

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
            const isExpanded = expandedPhases[phase.id] || false;

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
          phase={phaseDetailsDialog.selectedPhase} 
        />
      )}
    </Box>
  );
};

export default ProjectPhasesTab;