import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Stack,
  Container,
  Avatar,
  Badge,
  useMediaQuery,
  Skeleton,
  Tooltip,
  ListItemIcon,
  ListItemAvatar,
  ButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Group as TeamIcon,
  Assignment as TaskIcon,
  Description as OverviewIcon,
  Receipt as ExpenseIcon,
  Flag as StatusIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  Engineering as EngineeringIcon,
  ArrowBack as ArrowBackIcon,
  Calculate as EstimateIcon,
  Gavel as BidsIcon,
  ListAlt as MilestonesIcon,
  Assignment as TasksIcon,
  AccessAlarms as ScheduleIcon,
  MonetizationOn as FinanceIcon,
  StarBorder as StarBorderIcon,
  Business as BusinessIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Timeline as TimelineIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { ProjectService } from '../../services/project';
import { ExpenseService } from '../../services/expense';
import { Project, LineItem, Task, Bid } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LineItemManager from './LineItemManager';
import BidManager from './BidManager';
import ProjectTaskManager from './ProjectTaskManager';
import { formatCurrency, formatPercentage, formatDate } from '../../utils/formatters';
// @ts-ignore 
import Timeline, { GanttData } from 'react-gantt-timeline';

// Helper Function to calculate Project Duration
const calculateProjectDuration = (start?: Date | null, end?: Date | null): number => {
  if (!start || !end) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};

// Helper Function to calculate Days Passed
const calculateDaysPassed = (start?: Date | null): number => {
  if (!start) return 0;
  const now = new Date();
  if (start > now) return 0;
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [expenseBreakdown, setExpenseBreakdown] = useState({
    approved: 0,
    pending: 0,
    paid: 0,
    rejected: 0,
    total: 0
  });
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  console.log('ProjectDetails component rendered with ID:', id);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) {
        setError('Project ID is missing from URL');
        setLoading(false);
        return;
      }
      if (!user?.uid) {
        setError('User not authenticated. Cannot load project.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const projectData = await ProjectService.getProject(user.uid, id);
        
        if (!projectData) {
          setError(`Project with ID "${id}" not found or you don't have permission to view it.`);
        } else {
          // Ensure date fields are Date objects
           const processedProject = {
            ...projectData,
            startDate: projectData.startDate ? new Date(projectData.startDate) : new Date(), // Provide default if null
            endDate: projectData.endDate ? new Date(projectData.endDate) : null,
            createdAt: projectData.createdAt ? new Date(projectData.createdAt) : new Date(),
            updatedAt: projectData.updatedAt ? new Date(projectData.updatedAt) : new Date(),
            tasks: (projectData.tasks || []).map(task => ({
              ...task,
              createdAt: task.createdAt ? new Date(task.createdAt) : new Date(), // Provide default
              updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
            })),
             // Ensure milestone dates are Date objects or null
            keyMilestones: (projectData.keyMilestones || []).map(ms => {
              let dateObj: Date | null = null;
              if (ms.date) {
                  try {
                      const parsedDate = new Date(ms.date);
                      if (!isNaN(parsedDate.getTime())) {
                          dateObj = parsedDate;
                      }
                  } catch (e) { /* ignore parse errors */ }
              }
              return { ...ms, date: dateObj }; // Store as Date or null
            })
          };
          setProject(processedProject);
          console.log('Loaded project data for user:', user.uid, processedProject);
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(`Failed to load project details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    if (id && user?.uid) {
       fetchProjectDetails();
    } else {
        setLoading(false);
        if (!id) setError('Project ID is missing from URL');
        else if (!user) setError('Authenticating...');
    }
  }, [id, user]);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user?.uid || !project?.id) return;
      
      try {
        // Get all expenses for this project, regardless of status
        const expenses = await ExpenseService.getExpenses(user.uid, {
          projectId: project.id
        });
        
        console.log(`Found ${expenses.length} expenses for project ${project.id}`);
        
        // Calculate totals by status
        const breakdown = {
          approved: 0,
          pending: 0, 
          paid: 0,
          rejected: 0,
          total: 0
        };
        
        expenses.forEach(expense => {
          // Ensure we have a valid numeric amount
          const amount = typeof expense.amount === 'number' ? expense.amount : 0;
          console.log(`Expense: ${expense.description}, Amount: ${amount}, Status: ${expense.status}`);
          
          // Add to total
          breakdown.total += amount;
          
          // Add to appropriate status bucket
          if (expense.status === 'approved') {
            breakdown.approved += amount;
          } else if (expense.status === 'pending') {
            breakdown.pending += amount;
          } else if (expense.status === 'paid') {
            breakdown.paid += amount;
          } else if (expense.status === 'rejected') {
            breakdown.rejected += amount;
          }
        });
        
        console.log('Expense breakdown:', breakdown);
        setExpenseBreakdown(breakdown);
        setTotalExpenses(breakdown.total);
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }
    };

    fetchExpenses();
  }, [user?.uid, project?.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDelete = async () => {
    if (!id || !user?.uid || !window.confirm('Are you sure you want to delete this project?')) {
      if (!user?.uid) setError('Cannot delete: User not authenticated.');
      if (!id) setError('Cannot delete: Project ID missing.');
      return;
    }

    try {
      setLoading(true);
      await ProjectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? `Failed to delete project: ${err.message}` : 'Failed to delete project');
      setLoading(false);
    }
  };

  const formatNullableDate = (date: Date | null | undefined): string => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return 'Invalid Date';
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    // Maybe add a notification/snackbar here to confirm update
  };

  // Calculate overview data, including Gantt data
  const { overviewData, ganttData } = useMemo(() => {
    const calculatedOverview = calculateOverviewData(project);
    
    // --- Transform data for Gantt directly inside useMemo ---
    const transformData = (proj: Project | null, currentTheme: any): GanttData[] => {
        if (!proj) return [];
        const ganttItems: GanttData[] = [];

        (proj.tasks || []).forEach(task => {
          const startDate = task.createdAt; 
          let endDate = task.dueDate; 
          if (!endDate && startDate) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
          }

          if (startDate && endDate) {
            let color = currentTheme.palette.primary.main;
            let style: 'primary' | 'secondary' | 'milestone' = 'primary';
            if (task.status === 'completed') {
              color = currentTheme.palette.success.main;
              style = 'secondary';
            } else if (task.status === 'in_progress') {
              color = currentTheme.palette.warning.main;
            }

            ganttItems.push({
              id: `task-${task.id}`,
              name: task.title,
              start: startDate,
              end: endDate,
              color: color, 
              style: style, 
            });
          }
        });

        (proj.keyMilestones || []).forEach((milestone, index) => {
          // The date should already be a Date object or null due to processing in useEffect
          const milestoneDate = milestone.date; 
          if (milestoneDate && !isNaN(milestoneDate.getTime())) {
            ganttItems.push({
              id: `milestone-${index}`,
              name: `Milestone: ${milestone.name}`,
              start: milestoneDate,
              end: milestoneDate,
              color: currentTheme.palette.secondary.main,
              style: 'milestone',
            });
          }
        });

        const validGanttItems = ganttItems.filter(item => item.start && !isNaN(item.start.getTime()));
        validGanttItems.sort((a, b) => a.start.getTime() - b.start.getTime());
        return validGanttItems;
    };
    // --- End transformation logic ---

    const calculatedGanttData = transformData(project, theme); // Use theme directly here
    return { overviewData: calculatedOverview, ganttData: calculatedGanttData };
  }, [project, theme]); // Add theme dependency
  
  const budgetTotal = typeof project?.budget === 'object' ? project.budget.total : (project?.budget || 0);
  const budgetSpent = typeof project?.budget === 'object' ? project.budget.spent : 0; // Assuming spent is tracked
  const budgetProgress = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0; // Use spent for progress
  const estimatedCost = overviewData.totalEstimate; // Use calculated estimate
  const estimateVsBudgetProgress = budgetTotal > 0 ? (estimatedCost / budgetTotal) * 100 : 0;
  const projectDuration = calculateProjectDuration(project?.startDate, project?.endDate);
  const daysPassed = calculateDaysPassed(project?.startDate);
  const scheduleProgress = projectDuration > 0 ? Math.min((daysPassed / projectDuration) * 100, 100) : 0;

  // Status mapping for visual display  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
      case 'in_progress': return theme.palette.success.main;
      case 'planning': 
      case 'estimate': return theme.palette.primary.main;
      case 'completed': return theme.palette.info.main;
      case 'on_hold': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={60} />
          <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 1 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={150} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={250} sx={{ mb: 3, borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!project?.id) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert 
          severity="error"
          sx={{
            py: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Project data could not be loaded. {error}
        </Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/projects')}
            sx={{ mt: 2 }}
          >
            Back to Projects
          </Button>
        </Box>
      </Container>
    );
  }

  const statusText = project.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 } }}>
      <Box
        component={Paper}
        elevation={0}
        sx={{
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(to right, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '5px',
            backgroundColor: getStatusColor(project.status),
          }}
        />
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
          sx={{ pl: 1 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(getStatusColor(project.status), 0.1),
                  color: getStatusColor(project.status),
                  width: 44,
                  height: 44,
                }}
              >
                <EngineeringIcon />
              </Avatar>
              <Box>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="h1" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.5
                  }}
                >
                  {project.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={statusText}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getStatusColor(project.status), 0.1),
                      color: getStatusColor(project.status),
                      fontWeight: 500,
                      borderRadius: '4px',
                    }}
                  />
                  {project.location && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon fontSize="small" />
                      {typeof project.location === 'string' 
                        ? project.location
                        : project.location.address || `${project.location.city || ''}, ${project.location.state || ''}`
                      }
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
          <ButtonGroup variant="outlined" size={isMobile ? "small" : "medium"}>
            <Button
              startIcon={<EditIcon />}
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </ButtonGroup>
        </Stack>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="Project details tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              minHeight: 56,
              py: 1,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <Tab 
            icon={<OverviewIcon />} 
            iconPosition="start" 
            label="Overview" 
            id="tab-overview" 
            aria-controls="tabpanel-overview"
          />
          <Tab 
            icon={<EstimateIcon />} 
            iconPosition="start" 
            label="Estimate / Costs" 
            id="tab-estimate" 
            aria-controls="tabpanel-estimate"
          />
          <Tab 
            icon={<BidsIcon />} 
            iconPosition="start" 
            label="Bids" 
            id="tab-bids" 
            aria-controls="tabpanel-bids"
          />
          <Tab 
            icon={<TasksIcon />} 
            iconPosition="start" 
            label="Tasks" 
            id="tab-tasks" 
            aria-controls="tabpanel-tasks"
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-overview" aria-labelledby="tab-overview">
            {activeTab === 0 && project && (
              <Grid container spacing={3}>
                {/* --- Key Metrics Row --- */} 
                <Grid item xs={12}>
                  <Grid container spacing={3}>
                    {/* Budget Card */}
                    <Grid item xs={12} sm={4}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
                          height: '100%'
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                                width: 36,
                                height: 36, 
                              }}
                            >
                              <BudgetIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight={500}>Budget</Typography>
                          </Stack>
                          <Typography variant="h4" fontWeight={600}>{formatCurrency(budgetTotal)}</Typography>
                          
                          <Box sx={{ mt: 2, mb: 1 }}>
                            <Grid container spacing={1}>
                              <Grid item xs={8}>
                                <Typography variant="body2" color="text.secondary">
                                  Total Expenses:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" fontWeight={600} align="right">
                                  {formatCurrency(expenseBreakdown.total)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2" color="text.secondary">
                                  Paid:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" fontWeight={500} align="right" color="success.main">
                                  {formatCurrency(expenseBreakdown.paid)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2" color="text.secondary">
                                  Approved:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" fontWeight={500} align="right" color="info.main">
                                  {formatCurrency(expenseBreakdown.approved)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2" color="text.secondary">
                                  Pending:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" fontWeight={500} align="right" color="warning.main">
                                  {formatCurrency(expenseBreakdown.pending)}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                          
                          <Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min((expenseBreakdown.total / budgetTotal) * 100, 100)}
                              color={(expenseBreakdown.total / budgetTotal) * 100 > 100 ? 'error' : 'success'}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: alpha(
                                  (expenseBreakdown.total / budgetTotal) * 100 > 100 ? theme.palette.error.main : theme.palette.success.main, 
                                  0.1
                                ),
                                mb: 0.5
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: (expenseBreakdown.total / budgetTotal) * 100 > 100 ? theme.palette.error.main : theme.palette.success.dark 
                              }}
                            >
                              {formatPercentage(expenseBreakdown.total / budgetTotal)} Used
                              {(expenseBreakdown.total / budgetTotal) * 100 > 100 && ` (${formatCurrency(expenseBreakdown.total - budgetTotal)} Over)`}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Schedule Card */}
                    <Grid item xs={12} sm={4}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
                          height: '100%'
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                width: 36,
                                height: 36, 
                              }}
                            >
                              <ScheduleIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight={500}>Schedule</Typography>
                          </Stack>
                          <Typography variant="h4" fontWeight={600}>
                            {projectDuration} <Typography variant="h6" component="span" fontWeight={400}>days</Typography>
                          </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {formatNullableDate(project.startDate)} - {formatNullableDate(project.endDate)}
                          </Typography>
                          <Tooltip title={`${daysPassed} of ${projectDuration} days passed`}>
                            <Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={scheduleProgress}
                                color="primary"
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  mb: 0.5
                                }}
                              />
                              <Typography variant="caption" fontWeight="bold" color="primary.dark">
                                {formatPercentage(scheduleProgress / 100)} Complete
                              </Typography>
                            </Box>
                          </Tooltip>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Tasks Card */}
                    <Grid item xs={12} sm={4}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
                          height: '100%'
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                                width: 36,
                                height: 36, 
                              }}
                            >
                              <AccountTreeIcon />
                            </Avatar>
                            <Typography variant="h6" fontWeight={500}>Tasks</Typography>
                          </Stack>
                           <Typography variant="h4" fontWeight={600}>{(project.tasks || []).length} <Typography variant="h6" component="span" fontWeight={400}>total</Typography></Typography>
                          <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'space-around' }}>
                            <Stack alignItems="center">
                              <Typography variant="h6" color="error.main" fontWeight={500}>{overviewData.tasksToDo}</Typography>
                              <Typography variant="caption" color="text.secondary">To Do</Typography>
                            </Stack>
                            <Stack alignItems="center">
                              <Typography variant="h6" color="warning.main" fontWeight={500}>{overviewData.tasksInProgress}</Typography>
                              <Typography variant="caption" color="text.secondary">In Progress</Typography>
                            </Stack>
                            <Stack alignItems="center">
                              <Typography variant="h6" color="success.main" fontWeight={500}>{overviewData.tasksDone}</Typography>
                              <Typography variant="caption" color="text.secondary">Completed</Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* --- Project Timeline --- */}
                <Grid item xs={12}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            width: 36,
                            height: 36, 
                          }}
                        >
                          <TimelineIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={500}>Project Timeline</Typography>
                      </Stack>
                      {ganttData.length > 0 && project.startDate ? (
                        <Box sx={{ 
                          "& .rt-timeline__item--primary": { backgroundColor: alpha(theme.palette.primary.main, 0.8) },
                          "& .rt-timeline__item--secondary": { backgroundColor: alpha(theme.palette.success.main, 0.8) },
                          "& .rt-timeline__item--milestone": { backgroundColor: alpha(theme.palette.secondary.main, 0.8), height: '8px !important' }, // Make milestones thinner
                          "& .rt-timeline__time": { fontSize: '0.75rem' },
                          "& .rt-timeline__header-row:first-of-type .rt-timeline__header-col:not(:first-child)": { fontSize: '0.8rem' },
                          "& .rt-timeline__row-text": { fontSize: '0.85rem' },
                        }}>
                          <Timeline 
                            data={ganttData} 
                            links={[]} // Add links later if needed for dependencies
                            scale={{ start: project.startDate, end: project.endDate || new Date(project.startDate.getTime() + 30 * 24 * 60 * 60 * 1000) }} // Fallback to 30 days if no end date
                            />
                        </Box>
                      ) : (
                        <Alert severity="info">No tasks or milestones with dates to display timeline.</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

              </Grid>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-estimate" aria-labelledby="tab-estimate">
            {activeTab === 1 && project && user?.uid && (
              <LineItemManager project={project} onProjectUpdate={handleProjectUpdate} userId={user.uid} />
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-bids" aria-labelledby="tab-bids">
            {activeTab === 2 && project && user?.uid && (
              <BidManager project={project} onProjectUpdate={handleProjectUpdate} userId={user.uid} />
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 3} id="tabpanel-tasks" aria-labelledby="tab-tasks">
            {activeTab === 3 && project && user?.uid && (
              <ProjectTaskManager project={project} onProjectUpdate={handleProjectUpdate} userId={user.uid} />
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// Function to calculate overview data (simple version)
const calculateOverviewData = (project: Project | null) => {
    if (!project) return { totalEstimate: 0, totalExpenses: 0, tasksToDo: 0, tasksInProgress: 0, tasksDone: 0, nextMilestone: null };

    // Use line items for estimate
    const totalEstimate = project.lineItems?.reduce((sum: number, item: LineItem) => sum + (item.totalCost || 0), 0) || 0;
    
    const tasks = project.tasks || [];
    const tasksToDo = tasks.filter((t: Task) => t.status === 'todo').length;
    const tasksInProgress = tasks.filter((t: Task) => t.status === 'in_progress').length;
    const tasksDone = tasks.filter((t: Task) => t.status === 'completed').length;
    
    // Find next milestone
    const now = new Date().getTime();
    const upcomingMilestones = project.keyMilestones
        ?.map((m: any) => ({ ...m, dateObj: new Date(m.date) }))
        .filter((m: any) => m.dateObj && m.dateObj.getTime() >= now)
        .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
    const nextMilestone = upcomingMilestones?.[0] || null;

    return { totalEstimate, totalExpenses: 0, tasksToDo, tasksInProgress, tasksDone, nextMilestone };
};

export default ProjectDetails;