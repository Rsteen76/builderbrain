import React, { useState, useCallback } from 'react';
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
  ListItemText
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

// Available phase statuses
const PHASE_STATUSES: ProjectPhase['status'][] = [
  'not_started',
  'planning',
  'in_progress',
  'completed',
  'on_hold',
  'delayed'
];

interface ProjectPhasesTabProps {
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  phaseProposedCosts: Record<string, number>;
  phaseActualCosts: Record<string, number>;
  theme: Theme;
  handleAddPhase: () => void;
  onUpdatePhaseStatus: (phaseId: string, status: ProjectPhase['status']) => void;
  handleDeletePhase: (phaseId: string) => void;
  handleOpenQuickBidDialog: (phaseId: string) => void;
  handleOpenQuickExpenseDialog: (phaseId: string) => void;
  handleOpenTemplateAdjuster: (phaseId?: string) => void;
  handleViewPhaseDetails: (phaseId: string) => void;
  getStatusColor: (status: string) => string;
  formatCurrency: (value: number) => string;
}

const ProjectPhasesTab: React.FC<ProjectPhasesTabProps> = ({
  phases,
  bids,
  expenses,
  phaseProposedCosts,
  phaseActualCosts,
  theme,
  handleAddPhase,
  onUpdatePhaseStatus,
  handleDeletePhase,
  handleOpenQuickBidDialog,
  handleOpenQuickExpenseDialog,
  handleOpenTemplateAdjuster,
  handleViewPhaseDetails,
  getStatusColor,
  formatCurrency,
}) => {
  // Get breakpoint for responsive design
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  
  // Use the custom hook for expansion state
  const { expandedPhases, handleToggleExpand } = usePhaseExpandState();

  // Use custom hooks for UI state
  const {
    actionAnchorEl,
    actionMenuPhaseId,
    handleActionMenuOpen,
    handleActionMenuClose,
    isActionMenuOpen,
    statusAnchorEl,
    statusMenuPhaseId,
    handleStatusMenuOpen,
    handleStatusMenuClose,
    isStatusMenuOpen,
  } = usePhaseMenuState();

  const appTheme = useTheme();
  
  // Status selection handler - uses hook state
  const handleStatusSelect = useCallback((status: ProjectPhase['status']) => {
    if (statusMenuPhaseId) {
      onUpdatePhaseStatus(statusMenuPhaseId, status);
    }
    handleStatusMenuClose();
  }, [statusMenuPhaseId, onUpdatePhaseStatus, handleStatusMenuClose]);

  // Re-add getPhaseStatusIcon definition here
  const getPhaseStatusIcon = useCallback((status: string): React.ReactElement => {
    switch (status?.toLowerCase()) { 
      case 'completed':
        return <DoneIcon />;
      case 'in_progress':
        return <PendingIcon />; 
      case 'not_started':
        return <PendingIcon />;
      case 'planning': 
          return <PendingIcon />; 
      case 'on_hold': 
          return <PendingIcon />; 
      case 'delayed': 
          return <PendingIcon />; 
      default:
        return <InfoIcon />;
    }
  }, []); // Added useCallback with empty dependency array

  return (
    <Box>
      {/* Header with title and actions */}
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
            background: `linear-gradient(90deg, ${alpha(appTheme.palette.primary.main, 0.7)} 0%, ${alpha(appTheme.palette.secondary.main, 0.5)} 100%)`,
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
            onClick={() => handleOpenTemplateAdjuster()}
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
            onClick={handleAddPhase}
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
      
      {/* Project Timeline Visualization - Replaced with component */}
      <PhaseTimelineChart phases={phases} />
      
      {/* Phase Cards */}
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
                  onStatusMenuOpen={handleStatusMenuOpen}
                  onPhaseMenuOpen={handleActionMenuOpen}
                  onOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
                  onOpenQuickBidDialog={handleOpenQuickBidDialog}
                  onViewPhaseDetails={handleViewPhaseDetails}
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
            onClick={handleAddPhase}
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
      
      {/* Phase Action Menu - Uses hook state/handlers */}
      <Menu
        anchorEl={actionAnchorEl}
        open={isActionMenuOpen}
        onClose={handleActionMenuClose}
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
          onClick={() => {
            if (actionMenuPhaseId) {
              handleViewPhaseDetails(actionMenuPhaseId);
              handleActionMenuClose();
            }
          }}
          sx={{ borderRadius: 1, py: 1 }}
        >
          <ListItemIcon>
            <ChevronRightIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem 
          onClick={() => {
            if (actionMenuPhaseId) {
              handleDeletePhase(actionMenuPhaseId);
              handleActionMenuClose();
            }
          }}
          sx={{ borderRadius: 1, py: 1, color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Phase</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Status Update Menu - Uses hook state/handlers */}
      <Menu
        anchorEl={statusAnchorEl}
        open={isStatusMenuOpen}
        onClose={handleStatusMenuClose}
      >
        {PHASE_STATUSES.map((status) => (
          <MenuItem key={status} onClick={() => handleStatusSelect(status)}>
            <ListItemIcon>{getPhaseStatusIcon(status)}</ListItemIcon>
            <ListItemText primary={status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ProjectPhasesTab;