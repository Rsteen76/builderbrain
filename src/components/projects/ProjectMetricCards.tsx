import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Divider,
  Chip,
  Stack,
  useTheme,
  alpha,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarTodayIcon,
  Engineering as EngineeringIcon,
  Assignment as AssignmentIcon,
  AttachMoney as ExpensesIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as PriorityHighIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Project } from '../../types';

// Import the card components
import StatusCard from './cards/StatusCard';
import BudgetCard from './cards/BudgetCard';
import TimelineCard from './cards/TimelineCard';
import TeamCard from './cards/TeamCard';

interface ProjectMetricCardsProps {
  project: Project | null;
  projectProgress: number;
  budgetData: {
    totalBudget: number;
    totalActual: number;
    difference: number;
    percentUsed: number;
  };
  expenseBreakdown: {
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    elapsedDays: number;
    totalDays: number;
    percentComplete: number;
  };
  theme: any;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

const ProjectMetricCards: React.FC<ProjectMetricCardsProps> = ({
  project,
  projectProgress,
  budgetData,
  expenseBreakdown,
  timeline,
  theme,
  getStatusIcon,
  getStatusColor,
  formatCurrency,
  formatPercentage,
}) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Determine budget status indicator
  const budgetStatus = budgetData.difference >= 0 
    ? { icon: <TrendingUpIcon sx={{ color: 'success.main' }} />, label: 'Under Budget', color: 'success.main' }
    : { icon: <TrendingDownIcon sx={{ color: 'error.main' }} />, label: 'Over Budget', color: 'error.main' };
    
  // Project health calculation based on budget and timeline
  const calculateProjectHealth = () => {
    const budgetRatio = budgetData.totalActual / budgetData.totalBudget;
    const timeRatio = timeline.elapsedDays / timeline.totalDays;
    
    // Over budget and behind schedule
    if (budgetRatio > 1 && timeRatio > timeline.percentComplete / 100) {
      return { status: 'At Risk', color: theme.palette.error.main, icon: <PriorityHighIcon /> };
    }
    // Under budget and ahead of schedule
    else if (budgetRatio < 0.9 && timeRatio < timeline.percentComplete / 100) {
      return { status: 'Excellent', color: theme.palette.success.dark, icon: <CheckCircleIcon /> };
    }
    // Slightly over budget or slightly behind schedule
    else if (budgetRatio <= 1.1 && timeRatio <= 1.1) {
      return { status: 'Good', color: theme.palette.success.main, icon: <CheckCircleIcon /> };
    }
    // Other cases
    else {
      return { status: 'Fair', color: theme.palette.warning.main, icon: <FlagIcon /> };
    }
  };
  
  const projectHealth = calculateProjectHealth();

  if (!project) {
    // Optionally return null or a placeholder if project data is essential
    return null; 
  }

  return (
    <Box sx={{ mb: 4, mt: 2 }}>
      {/* Project Status Banner */}
      <Paper 
        elevation={0}
        sx={{
          p: 2,
          mb: 3, 
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.4)} 100%)`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          overflow: 'hidden',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '30%',
            height: '100%',
            background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
            zIndex: 0,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
          <SpeedIcon fontSize="large" sx={{ color: projectHealth.color }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Project Health: <span style={{ color: projectHealth.color }}>{projectHealth.status}</span></Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {projectProgress}% complete • {formatCurrency(budgetData.totalActual)} spent • {timeline.elapsedDays} days elapsed
            </Typography>
          </Box>
        </Box>
        
        <Chip 
          label={project.status.replace('_', ' ').toUpperCase()}
          icon={getStatusIcon(project.status)}
          sx={{ 
            backgroundColor: alpha(getStatusColor(project.status), 0.1),
            color: getStatusColor(project.status),
            fontWeight: 'bold',
            borderColor: alpha(getStatusColor(project.status), 0.3),
            border: '1px solid',
            zIndex: 1,
          }}
        />
      </Paper>
      
      <Grid container spacing={3}>
        {/* Progress Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ 
            height: '100%', 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
            }
          }}>
            <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Progress</Typography>
                </Box>
                <Tooltip title="Project completion based on phase progress">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {projectProgress}%
              </Typography>
              
              <Box sx={{ mt: 2, mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={projectProgress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    }
                  }} 
                />
              </Box>
              
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                {timeline.elapsedDays} of {timeline.totalDays} days elapsed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Budget Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ 
            height: '100%', 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
            }
          }}>
            <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon sx={{ color: budgetStatus.color, mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Budget</Typography>
                </Box>
                {budgetStatus.icon}
              </Box>
              
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {formatCurrency(budgetData.totalBudget)}
              </Typography>
              
              <Box sx={{ mt: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Spent:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(budgetData.totalActual)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Remaining:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: budgetData.difference >= 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    {formatCurrency(budgetData.difference)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(budgetData.percentUsed, 100)} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: budgetData.percentUsed > 100 
                        ? `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                        : budgetData.percentUsed > 85
                          ? `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
                          : `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                    }
                  }} 
                />
              </Box>
              
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                {formatPercentage(budgetData.percentUsed)} of budget used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Timeline Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ 
            height: '100%', 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
            }
          }}>
            <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Timeline</Typography>
                </Box>
                <Tooltip title="Project timeline and schedule">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {timeline.totalDays} days
              </Typography>
              
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Start:</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {timeline.startDate.toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>End:</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {timeline.endDate.toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={timeline.percentComplete} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    }
                  }} 
                />
              </Box>
              
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                {timeline.elapsedDays} days elapsed ({formatPercentage(timeline.percentComplete)})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Expenses Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={0} sx={{ 
            height: '100%', 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.12)}`,
            }
          }}>
            <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ExpensesIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Expenses</Typography>
                </Box>
                <Tooltip title="Expense status breakdown">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {formatCurrency(expenseBreakdown.paid + expenseBreakdown.approved + expenseBreakdown.pending)}
              </Typography>
              
              <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Chip 
                    label="Paid" 
                    size="small" 
                    sx={{ 
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      fontWeight: 'medium',
                      minWidth: 80,
                    }} 
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(expenseBreakdown.paid)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Chip 
                    label="Approved" 
                    size="small" 
                    sx={{ 
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      fontWeight: 'medium',
                      minWidth: 80,
                    }} 
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(expenseBreakdown.approved)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Chip 
                    label="Pending" 
                    size="small" 
                    sx={{ 
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main,
                      fontWeight: 'medium',
                      minWidth: 80,
                    }} 
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(expenseBreakdown.pending)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectMetricCards; 