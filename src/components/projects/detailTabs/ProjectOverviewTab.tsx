import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
  CardHeader,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  BarChart as ChartIcon,
  AccountCircle as AccountCircleIcon,
  Info as InfoIcon,
  PieChart as PieChartIcon,
  Layers as LayersIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Flag as MilestoneIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate, safelyParseDate } from '../../../utils/formatters';
import { calculateBudgetData } from '../../../utils/projectMetrics';
import { 
  Project, 
  ProjectPhase,
  Bid, 
  Expense 
} from '../../../types';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { usePhaseOperations } from '../../../hooks/usePhaseOperations';
import { useNotification } from '../../../hooks/useNotification';

const ProjectOverviewTab: React.FC = () => {
  const {
    project, 
    phases, 
    bids = [], 
    expenses = [], 
    loading, 
    error, 
    showNotification
  } = useProjectDetail();
  
  const theme = useTheme();

  const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0), [expenses]);
  const budgetData = useMemo(() => { 
    if (!project) return { totalBudget: 0, totalActual: 0, difference: 0, percentUsed: 0 };
    return calculateBudgetData(project, expenses);
  }, [project, expenses]);
  const budgetVariance = useMemo(() => budgetData.totalBudget - budgetData.totalActual, [budgetData]);
  const projectProgress = useMemo(() => calculateProjectProgress(phases || []), [phases]);

  const budgetAllocationData = useMemo(() => (phases || []).map((phase, index) => {
    const colors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.info.main];
    return {
      name: phase.name,
      value: phase.budget || 0,
      color: colors[index % colors.length],
    };
  }), [phases, theme]);
  
  const expensesByCategory = useMemo(() => expenses.reduce((acc, exp) => {
    const category = exp.category || 'Uncategorized';
    if (!acc[category]) acc[category] = 0;
    acc[category] += exp.amount;
    return acc;
  }, {} as Record<string, number>), [expenses]);
  
  const expenseCategoryData = useMemo(() => Object.entries(expensesByCategory).map(([category, amount], index) => {
    const colors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.info.main];
    return {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: amount,
      color: colors[index % colors.length],
    };
  }), [expensesByCategory, theme]);
  
  const totalExpenses = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  const pendingExpenses = useMemo(() => expenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  const approvedExpenses = useMemo(() => expenses.filter(e => e.status === 'approved').reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  const paidExpenses = useMemo(() => expenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  
  const keyMilestones = useMemo(() => (phases || [])
    .filter(phase => (phase.progress ?? 0) < 100) 
    .sort((a, b) => (safelyParseDate(a.startDate)?.getTime() || 0) - (safelyParseDate(b.startDate)?.getTime() || 0))
    .slice(0, 3), [phases]);
  
  const acceptedBidsTotal = useMemo(() => bids
    .filter(bid => bid.status === 'accepted')
    .reduce((sum, bid) => sum + (bid.totalAmount || 0), 0), [bids]);
  
  const getBudgetStatus = () => {
    if (!project || budgetData.totalBudget <= 0) return { label: 'No Budget', color: theme.palette.warning.main, icon: <InfoIcon fontSize="small"/> };
    const percentUsed = (budgetData.totalActual / budgetData.totalBudget) * 100;
    if (percentUsed > 100) return { label: 'Over Budget', color: theme.palette.error.main, icon: <ArrowDownwardIcon fontSize="small" /> };
    if (percentUsed > 85) return { label: 'Near Budget', color: theme.palette.warning.main, icon: <MilestoneIcon fontSize="small" /> };
    return { label: 'Under Budget', color: theme.palette.success.main, icon: <ArrowUpwardIcon fontSize="small" /> };
  };
  
  const getProjectStatus = () => {
    if (!project) return { label: 'Unknown', color: theme.palette.grey[500] };
    const statusMap: Record<string, {label: string, color: string}> = {
      'draft': { label: 'Draft', color: theme.palette.info.main },
      'estimate': { label: 'Estimate', color: theme.palette.info.main },
      'planning': { label: 'Planning', color: theme.palette.primary.main },
      'in_progress': { label: 'In Progress', color: theme.palette.warning.main },
      'on_hold': { label: 'On Hold', color: theme.palette.error.main },
      'completed': { label: 'Completed', color: theme.palette.success.main },
      'cancelled': { label: 'Cancelled', color: theme.palette.error.main },
      'active': { label: 'Active', color: theme.palette.warning.main },
    };
    
    const status = project.status?.toLowerCase() || '';
    return statusMap[status] || { label: 'Unknown', color: theme.palette.grey[500] };
  };
  
  const getLocationDisplay = () => {
    if (!project?.location) return 'Not specified';
    
    if (typeof project.location === 'string') {
      return project.location;
    }
    
    if (typeof project.location === 'object' && project.location.address) {
      const loc = project.location;
      return `${loc.address}, ${loc.city || ''} ${loc.state || ''} ${loc.zipCode || ''}`.trim();
    }
    
    return 'Not specified';
  };
  
  const getClientName = () => {
    return project?.clientId || 'Not specified';
  };
  
  const budgetStatus = useMemo(getBudgetStatus, [project, budgetData, theme]);
  const projectStatus = useMemo(getProjectStatus, [project, theme]);
  
  const handleAddPhase = () => { 
    showNotification('Add Phase functionality not implemented on Overview Tab yet.', 'info');
  };
  const handleOpenTemplateAdjuster = () => { 
     showNotification('Adjust Template functionality not implemented on Overview Tab yet.', 'info');
  };

  if (loading) return <CircularProgress sx={{ /* styles */ }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="warning">Project data not available.</Alert>;

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            height: '100%',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Project Details
                </Typography>
              }
              action={
                <Tooltip title="View full project details">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <List disablePadding>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <BusinessIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Project Name" 
                    secondary={project.name}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LocationIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Location" 
                    secondary={getLocationDisplay()}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <PersonIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Client" 
                    secondary={getClientName()}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <CalendarIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Timeline" 
                    secondary={`${formatDate(project.startDate || new Date())} to ${formatDate(project.endDate || new Date())}`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <MoneyIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Budget Status" 
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{formatCurrency(budgetData.totalBudget)}</span>
                        <Chip 
                          label={budgetStatus.label}
                          size="small"
                          sx={{ 
                            backgroundColor: alpha(budgetStatus.color, 0.1),
                            color: budgetStatus.color,
                            fontWeight: 'medium',
                          }}
                        />
                      </Box>
                    }
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                  />
                </ListItem>
                
                <Divider component="li" variant="inset" />
                
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <AssignmentIcon sx={{ color: theme.palette.primary.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Current Status" 
                    secondary={
                      <Chip 
                        label={projectStatus.label}
                        size="small"
                        sx={{ 
                          backgroundColor: alpha(projectStatus.color, 0.1),
                          color: projectStatus.color,
                          fontWeight: 'medium',
                        }}
                      />
                    }
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                  />
                </ListItem>
                
                {project.description && (
                  <>
                    <Divider component="li" variant="inset" />
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemIcon>
                        <DescriptionIcon sx={{ color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Description" 
                        secondary={project.description}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body1', fontWeight: 'medium' }}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            height: '100%',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Financial Overview
                </Typography>
              }
              action={
                <Tooltip title="Refresh financial data">
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      background: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      height: '100%',
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">Total Budget</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, my: 1 }}>
                      {formatCurrency(budgetData.totalBudget)}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="subtitle2" color="text.secondary">Expected Cost</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                      {formatCurrency(acceptedBidsTotal || 0)}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      background: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      height: '100%',
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">Total Expenses</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, my: 1 }}>
                      {formatCurrency(totalExpenses)}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Paid</Typography>
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {formatCurrency(paidExpenses)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Approved</Typography>
                        <Typography variant="body2" fontWeight="medium" color="info.main">
                          {formatCurrency(approvedExpenses)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Pending</Typography>
                        <Typography variant="body2" fontWeight="medium" color="warning.main">
                          {formatCurrency(pendingExpenses)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Expense Distribution
                </Typography>
                
                {expenseCategoryData.length > 0 ? (
                  <Box sx={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={1}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {expenseCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 220, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                  }}>
                    <PieChartIcon sx={{ color: alpha(theme.palette.text.secondary, 0.3), fontSize: 40, mb: 1 }} />
                    <Typography color="text.secondary">No expense data available</Typography>
                    <Button 
                      startIcon={<AddIcon />} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mt: 1 }}
                    >
                      Add Expense
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Project Phases
                </Typography>
              }
              action={
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddPhase}
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                >
                  Add Phase
                </Button>
              }
            />
            <CardContent>
              {phases.length > 0 ? (
                <Box>
                  {phases.map((phase, index) => (
                    <Paper 
                      key={phase.id || index}
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        mb: 2,
                        borderRadius: 1.5, 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {phase.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${phase.progress}%`}
                          size="small"
                          sx={{ 
                            backgroundColor: alpha(
                              phase.progress === 100 
                                ? theme.palette.success.main 
                                : phase.progress > 0 
                                  ? theme.palette.primary.main 
                                  : theme.palette.grey[500]
                            , 0.1),
                            color: phase.progress === 100 
                              ? theme.palette.success.main 
                              : phase.progress > 0 
                                ? theme.palette.primary.main 
                                : theme.palette.grey[500],
                            fontWeight: 'medium',
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MoneyIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                          <Typography variant="body2" color="text.secondary">
                            Budget: {formatCurrency(phase.budget || 0)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MoneyIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                          <Typography variant="body2" color="text.secondary">
                            Actual: {formatCurrency(phase.actualCost || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  py: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                }}>
                  <LayersIcon sx={{ color: alpha(theme.palette.text.secondary, 0.3), fontSize: 40, mb: 1 }} />
                  <Typography color="text.secondary" sx={{ mb: 1 }}>No phases defined yet</Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleOpenTemplateAdjuster}
                    startIcon={<AddIcon />}
                  >
                    Add Project Phases
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming Milestones
                </Typography>
              }
              action={
                <Tooltip title="View all milestones">
                  <IconButton>
                    <TimelineIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              {keyMilestones.length > 0 ? (
                <List disablePadding>
                  {keyMilestones.map((milestone, index) => (
                    <React.Fragment key={milestone.id || index}>
                      <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                        <ListItemIcon>
                          <MilestoneIcon 
                            sx={{ 
                              color: milestone.progress > 0 
                                ? theme.palette.primary.main 
                                : theme.palette.grey[500] 
                            }} 
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2">{milestone.name}</Typography>
                              <Chip 
                                label={`${milestone.progress}%`}
                                size="small"
                                sx={{ 
                                  height: 20,
                                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main,
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(milestone.startDate)} - {formatDate(milestone.endDate)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  mt: 0.5 
                                }}
                              >
                                <MoneyIcon fontSize="small" />
                                Budget: {formatCurrency(milestone.budget || 0)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < keyMilestones.length - 1 && (
                        <Divider component="li" variant="inset" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  py: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                }}>
                  <TimelineIcon sx={{ color: alpha(theme.palette.text.secondary, 0.3), fontSize: 40, mb: 1 }} />
                  <Typography color="text.secondary" sx={{ mb: 1 }}>No upcoming milestones</Typography>
                  <Button 
                    variant="outlined" 
                    onClick={handleAddPhase}
                    startIcon={<AddIcon />}
                  >
                    Add Milestone
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const calculateProjectProgress = (phases: any[]): number => { 
  if (!phases || phases.length === 0) return 0;
  const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
  return totalProgress / phases.length;
};

export default ProjectOverviewTab; 