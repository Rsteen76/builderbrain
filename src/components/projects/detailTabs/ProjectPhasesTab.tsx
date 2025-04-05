import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Assignment as AssignmentIcon,
  AccessTime as ClockIcon,
  AttachMoney as AttachMoneyIcon,
  AddTask as AddTaskIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Phase, ProjectPhase, Bid, Expense } from '../../../types';

// Extend Phase to include the order property
interface ExtendedPhase extends Phase {
  order?: number;
}

interface ProjectPhasesTabProps {
  phases: Phase[];
  phaseProposedCosts: Record<string, number>;
  phaseActualCosts: Record<string, number>;
  theme: any;
  handleAddPhase: () => void;
  handleUpdatePhase: (phaseId: string) => void;
  handleDeletePhase: (phaseId: string) => void;
  handleOpenQuickBidDialog: (phaseId: string) => void;
  handleOpenQuickExpenseDialog: (phaseId: string) => void;
  handleViewPhaseDetails: (phaseId: string) => void;
  bids: Bid[];
  expenses: Expense[];
}

const getStatusIcon = (status?: string) => {
  if (!status) return <ScheduleIcon />;
  
  switch (status) {
    case 'completed':
      return <CheckCircleIcon />;
    case 'in_progress':
      return <PlayArrowIcon />;
    case 'on_hold':
      return <PauseIcon />;
    case 'not_started':
    default:
      return <ScheduleIcon />;
  }
};

const getStatusColor = (status?: string, theme?: any) => {
  if (!status || !theme) return theme?.palette.grey[500];
  
  switch (status) {
    case 'completed':
      return theme.palette.success.main;
    case 'in_progress':
      return theme.palette.primary.main;
    case 'on_hold':
      return theme.palette.warning.main;
    case 'not_started':
    default:
      return theme.palette.grey[500];
  }
};

const ProjectPhasesTab: React.FC<ProjectPhasesTabProps> = ({
  phases,
  phaseProposedCosts,
  phaseActualCosts,
  theme,
  handleAddPhase,
  handleUpdatePhase,
  handleDeletePhase,
  handleOpenQuickBidDialog,
  handleOpenQuickExpenseDialog,
  handleViewPhaseDetails,
  bids,
  expenses,
}) => {
  const [anchorElMap, setAnchorElMap] = useState<{ [phaseId: string]: HTMLElement | null }>({});
  
  // Functions to handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, phaseId: string) => {
    event.stopPropagation();
    setAnchorElMap({
      ...anchorElMap,
      [phaseId]: event.currentTarget,
    });
  };

  const handleMenuClose = (phaseId: string) => {
    setAnchorElMap({
      ...anchorElMap,
      [phaseId]: null,
    });
  };

  // Calculate timeline details
  const getTimelineInfo = (phase: Phase) => {
    if (!phase.startDate || !phase.endDate) {
      return { daysTotal: 0, daysElapsed: 0, isOverdue: false };
    }
    
    const start = new Date(phase.startDate);
    const end = new Date(phase.endDate);
    const today = new Date();
    
    const daysTotal = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((Math.min(today.getTime(), end.getTime()) - start.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = today > end && phase.progress !== 100;
    
    return { daysTotal, daysElapsed, isOverdue };
  };
  
  // Calculate budget vs actual cost percentage for visual indicator
  const getBudgetIndicator = (phase: Phase) => {
    const budget = phase.budget || 0;
    const actual = phase.actualCost || 0;
    
    if (budget === 0) return { percent: 0, status: 'neutral' };
    
    const percentage = (actual / budget) * 100;
    
    if (percentage > 100) return { percent: 100, status: 'over' };
    if (percentage > 90) return { percent: percentage, status: 'warning' };
    return { percent: percentage, status: 'good' };
  };
  
  // Get CSS class based on phase position (to create connections between cards)
  const getPhasePositionClass = (index: number, total: number) => {
    if (total <= 1) return '';
    if (index === 0) return 'first-phase';
    if (index === total - 1) return 'last-phase';
    return 'middle-phase';
  };
  
  // Sort phases by order if available, otherwise by start date
  const sortedPhases = [...phases].sort((a, b) => {
    // Cast to ExtendedPhase to access potential order property
    const phaseA = a as ExtendedPhase;
    const phaseB = b as ExtendedPhase;
    
    // Sort by order field if both have it
    if (phaseA.order !== undefined && phaseB.order !== undefined) {
      return phaseA.order - phaseB.order;
    }
    
    // Sort by start date if order is not available
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateA - dateB;
  });
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Control Bar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Project Timeline & Phases
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            size="small"
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddPhase}
          >
            Add Phase
          </Button>
        </Box>
      </Box>
      
      {phases.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
          }}
        >
          <TimelineIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No Phases Defined Yet</Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', maxWidth: 500, mx: 'auto' }}>
            Break down your project into phases to track progress, budget, and timeline more effectively.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddPhase}
          >
            Create First Phase
          </Button>
        </Paper>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {/* Timeline connector - visual element connecting phase cards */}
          <Box 
            sx={{ 
              position: 'absolute', 
              left: { xs: '30px', md: '48px' }, 
              top: '75px', 
              bottom: '75px', 
              width: '4px', 
              background: alpha(theme.palette.primary.main, 0.2),
              zIndex: 0,
              display: { xs: 'none', md: 'block' }
            }} 
          />
          
          {/* Phase cards with connections */}
          <Grid container spacing={3}>
            {sortedPhases.map((phase, index) => {
              // Ensure phase.id exists to avoid TypeScript errors
              if (!phase.id) return null;
              
              const timelineInfo = getTimelineInfo(phase);
              const budgetIndicator = getBudgetIndicator(phase);
              const positionClass = getPhasePositionClass(index, sortedPhases.length);
              const statusColor = getStatusColor(phase.status, theme);
              
              // Calculate progress percentage for the phase 
              const progress = phase.progress || 0;
              const proposedCost = phase.id ? phaseProposedCosts[phase.id] || 0 : 0;
              const actualCost = phase.id ? phaseActualCosts[phase.id] || 0 : 0;
              
              return (
                <Grid item xs={12} key={phase.id}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.05)}`,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                      ...(timelineInfo.isOverdue && {
                        borderLeft: `4px solid ${theme.palette.error.main}`,
                      }),
                    }}
                    onClick={() => handleViewPhaseDetails(phase.id as string)}
                  >
                    {/* Phase dot marker for timeline (visible on md and larger screens) */}
                    <Box 
                      sx={{ 
                        display: { xs: 'none', md: 'flex' },
                        position: 'absolute', 
                        left: '-14px', 
                        top: '40px', 
                        zIndex: 1,
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        border: `2px solid ${statusColor}`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: statusColor,
                        '& svg': {
                          fontSize: '0.9rem'
                        }
                      }}
                    >
                      {getStatusIcon(phase.status)}
                    </Box>
                    
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={2}>
                        {/* Phase Header Section */}
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {/* Phase title and status */}
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {phase.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <Chip 
                                  size="small"
                                  icon={getStatusIcon(phase.status)}
                                  label={phase.status?.replace('_', ' ') || 'Not Started'}
                                  sx={{ 
                                    bgcolor: alpha(statusColor, 0.1),
                                    color: statusColor,
                                    borderRadius: 1,
                                    fontWeight: 500,
                                  }}
                                />
                                
                                {timelineInfo.isOverdue && (
                                  <Chip 
                                    size="small"
                                    label="Overdue"
                                    color="error"
                                    variant="outlined"
                                    sx={{ borderRadius: 1 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            {/* Progress indicator */}
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {progress}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Complete
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        
                        {/* Progress bar */}
                        <Grid item xs={12}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ 
                              height: 8, 
                              mt: 1, 
                              mb: 2,
                              borderRadius: 4,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: progress === 100 
                                  ? `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                                  : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                              }
                            }} 
                          />
                        </Grid>
                        
                        {/* Details Grid */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Timeline */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 36, 
                                  height: 36, 
                                  mr: 1.5, 
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main
                                }}
                              >
                                <ClockIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Timeline</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {phase.startDate && phase.endDate 
                                    ? `${formatDate(phase.startDate)} - ${formatDate(phase.endDate)}`
                                    : 'Dates not set'}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Duration */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 36, 
                                  height: 36, 
                                  mr: 1.5, 
                                  bgcolor: alpha(theme.palette.warning.main, 0.1), 
                                  color: theme.palette.warning.main 
                                }}
                              >
                                <EventIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Duration</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {timelineInfo.daysTotal > 0 
                                    ? `${timelineInfo.daysElapsed} of ${timelineInfo.daysTotal} days (${Math.round((timelineInfo.daysElapsed / timelineInfo.daysTotal) * 100)}%)`
                                    : 'Not specified'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Budget */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 36, 
                                  height: 36, 
                                  mr: 1.5, 
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main 
                                }}
                              >
                                <AttachMoneyIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Budget</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(phase.budget || 0)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Actual Cost */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 36, 
                                  height: 36, 
                                  mr: 1.5, 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                  color: theme.palette.primary.main 
                                }}
                              >
                                <AttachMoneyIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Actual Cost</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {formatCurrency(phase.actualCost || 0)}
                                  </Typography>
                                  
                                  {phase.budget > 0 && (
                                    <Chip 
                                      size="small" 
                                      label={
                                        budgetIndicator.status === 'over' 
                                          ? 'Over Budget' 
                                          : budgetIndicator.status === 'warning'
                                            ? 'Near Budget'
                                            : 'Under Budget'
                                      }
                                      sx={{ 
                                        height: 20, 
                                        fontWeight: 500,
                                        backgroundColor: alpha(
                                          budgetIndicator.status === 'over' 
                                            ? theme.palette.error.main 
                                            : budgetIndicator.status === 'warning'
                                              ? theme.palette.warning.main
                                              : theme.palette.success.main,
                                          0.1
                                        ),
                                        color: budgetIndicator.status === 'over' 
                                          ? theme.palette.error.main 
                                          : budgetIndicator.status === 'warning'
                                            ? theme.palette.warning.main
                                            : theme.palette.success.main,
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Expected costs */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 36, 
                                  height: 36, 
                                  mr: 1.5, 
                                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                  color: theme.palette.secondary.main
                                }}
                              >
                                <AssignmentIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Expected Cost</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(proposedCost || 0)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Description - truncated */}
                            {phase.description && (
                              <Box sx={{ pl: 6.5 }}>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {phase.description?.length > 60 
                                    ? `${phase.description.slice(0, 60)}...` 
                                    : phase.description}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 1.5, justifyContent: 'space-between' }}>
                      <Box>
                        <Tooltip title="View Phase Details">
                          <Button
                            size="small"
                            startIcon={<ArrowForwardIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPhaseDetails(phase.id as string);
                            }}
                          >
                            Details
                          </Button>
                        </Tooltip>
                      </Box>
                      
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Add Expense">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenQuickExpenseDialog(phase.id as string);
                            }}
                            sx={{ color: theme.palette.warning.main }}
                          >
                            <AttachMoneyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Add Bid">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenQuickBidDialog(phase.id as string);
                            }}
                            sx={{ color: theme.palette.info.main }}
                          >
                            <AddTaskIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, phase.id as string)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Menu
                          anchorEl={anchorElMap[phase.id]}
                          open={Boolean(anchorElMap[phase.id])}
                          onClose={() => handleMenuClose(phase.id as string)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MenuItem 
                            onClick={() => {
                              handleUpdatePhase(phase.id as string);
                              handleMenuClose(phase.id as string);
                            }}
                          >
                            <ListItemIcon>
                              <EditIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Edit Phase</ListItemText>
                          </MenuItem>
                          <MenuItem 
                            onClick={() => {
                              handleOpenQuickBidDialog(phase.id as string);
                              handleMenuClose(phase.id as string);
                            }}
                          >
                            <ListItemIcon>
                              <AddTaskIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Add Bid</ListItemText>
                          </MenuItem>
                          <MenuItem 
                            onClick={() => {
                              handleOpenQuickExpenseDialog(phase.id as string);
                              handleMenuClose(phase.id as string);
                            }}
                          >
                            <ListItemIcon>
                              <AttachMoneyIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Add Expense</ListItemText>
                          </MenuItem>
                          <Divider />
                          <MenuItem 
                            onClick={() => {
                              handleDeletePhase(phase.id as string);
                              handleMenuClose(phase.id as string);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <ListItemIcon>
                              <DeleteIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText>Delete Phase</ListItemText>
                          </MenuItem>
                        </Menu>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ProjectPhasesTab;