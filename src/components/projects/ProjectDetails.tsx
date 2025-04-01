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
} from '@mui/icons-material';
import { ProjectService } from '../../services/project';
import { Project, LineItem, Task } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LineItemManager from './LineItemManager';
import BidManager from './BidManager';
import ProjectTaskManager from './ProjectTaskManager';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  
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
          setProject(projectData);
          console.log('Loaded project data for user:', user.uid, projectData);
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

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    // Maybe add a notification/snackbar here to confirm update
  };

  // Calculate overview data
  const overviewData = useMemo(() => calculateOverviewData(project), [project]);
  const budgetTotal = typeof project?.budget === 'object' ? project.budget.total : (project?.budget || 0);
  const budgetProgress = budgetTotal > 0 ? (overviewData.totalEstimate / budgetTotal) * 100 : 0;

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
                {/* --- Left Column (Main Details & Finance) --- */} 
                <Grid item xs={12} md={8}>
                  {/* Project Description Card */} 
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            width: 36,
                            height: 36, 
                          }}
                        >
                          <OverviewIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={500}>Description</Typography>
                      </Stack>
                      <Typography variant="body1" sx={{ pl: 1 }}>
                        {project.description || 'No description provided.'}
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  {/* Financial Summary Card */} 
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
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
                          <FinanceIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={500}>Financial Summary</Typography>
                      </Stack>
                      <Box sx={{ px: 1 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>Budget</Typography>
                              <Typography variant="h5" color="text.primary" fontWeight={600}>
                                {formatCurrency(typeof project.budget === 'object' ? project.budget.total : project.budget)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>Total Estimated Cost</Typography>
                              <Typography 
                                variant="h5" 
                                color={budgetProgress > 100 ? "error.main" : "text.primary"}
                                fontWeight={600}
                              >
                                {formatCurrency(overviewData.totalEstimate)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
                              Budget Usage (Estimate vs Budget)
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(budgetProgress, 100)} // Cap at 100%
                                color={budgetProgress > 100 ? 'error' : 'primary'}
                                sx={{ 
                                  flexGrow: 1, 
                                  height: 10, 
                                  borderRadius: 5,
                                  backgroundColor: alpha(
                                    budgetProgress > 100 ? theme.palette.error.main : theme.palette.primary.main, 
                                    0.1
                                  ),
                                }}
                              />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: budgetProgress > 100 ? theme.palette.error.main : 'inherit' 
                                }}
                              >
                                {formatPercentage(budgetProgress / 100)}
                              </Typography>
                            </Stack>
                            {budgetProgress > 100 && 
                              <Alert 
                                severity="warning" 
                                sx={{ 
                                  mt: 2, 
                                  borderRadius: 1.5, 
                                  '& .MuiAlert-icon': { alignItems: 'center' }
                                }}
                              >
                                Estimated cost exceeds budget by {formatCurrency(overviewData.totalEstimate - budgetTotal)}
                              </Alert>
                            }
                            {budgetTotal > 0 && overviewData.totalEstimate <= budgetTotal &&
                              <Box sx={{ 
                                mt: 1.5,
                                p: 1.5, 
                                borderRadius: 1.5, 
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}>
                                <CheckCircleOutlineIcon color="success" fontSize="small" />
                                <Typography variant="body2" color="success.main" fontWeight={500}>
                                  Remaining Budget: {formatCurrency(budgetTotal - overviewData.totalEstimate)}
                                </Typography>
                              </Box>
                            }
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* --- Right Column (Schedule, Team, Milestones) --- */}
                <Grid item xs={12} md={4}>
                  {/* Schedule Snapshot Card */} 
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
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
                      <Stack spacing={2} sx={{ px: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          p: 1.5, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.background.default, 0.5)
                        }}>
                          <Stack>
                            <Typography variant="body2" color="text.secondary">Start Date</Typography>
                            <Typography variant="body1" fontWeight={500}>{formatDate(project.startDate)}</Typography>
                          </Stack>
                          <Stack alignItems="flex-end">
                            <Typography variant="body2" color="text.secondary">Target End</Typography>
                            <Typography variant="body1" fontWeight={500}>{formatDate(project.endDate)}</Typography>
                          </Stack>
                        </Box>
                        
                        <Divider />
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                            Task Status
                          </Typography>
                          <Stack 
                            direction="row" 
                            justifyContent="space-around" 
                            sx={{ 
                              p: 1.5, 
                              borderRadius: 2, 
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                              textAlign: 'center',
                            }}
                          >
                            <Stack alignItems="center">
                              <Badge 
                                badgeContent={overviewData.tasksToDo} 
                                color="error"
                                max={99}
                                sx={{ 
                                  '& .MuiBadge-badge': { 
                                    fontSize: '0.8rem',
                                    minWidth: 20,
                                    height: 20,
                                  }
                                }}
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32,
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    color: theme.palette.error.main,
                                  }}
                                >
                                  <RadioButtonUncheckedIcon fontSize="small" />
                                </Avatar>
                              </Badge>
                              <Typography variant="caption" sx={{ mt: 0.5 }}>To Do</Typography>
                            </Stack>
                            
                            <Stack alignItems="center">
                              <Badge 
                                badgeContent={overviewData.tasksInProgress} 
                                color="warning"
                                max={99}
                                sx={{ 
                                  '& .MuiBadge-badge': { 
                                    fontSize: '0.8rem',
                                    minWidth: 20,
                                    height: 20,
                                  }
                                }}
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32,
                                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                                    color: theme.palette.warning.main,
                                  }}
                                >
                                  <TimeIcon fontSize="small" />
                                </Avatar>
                              </Badge>
                              <Typography variant="caption" sx={{ mt: 0.5 }}>In Progress</Typography>
                            </Stack>
                            
                            <Stack alignItems="center">
                              <Badge 
                                badgeContent={overviewData.tasksDone} 
                                color="success"
                                max={99}
                                sx={{ 
                                  '& .MuiBadge-badge': { 
                                    fontSize: '0.8rem',
                                    minWidth: 20,
                                    height: 20,
                                  }
                                }}
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.main,
                                  }}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </Avatar>
                              </Badge>
                              <Typography variant="caption" sx={{ mt: 0.5 }}>Done</Typography>
                            </Stack>
                          </Stack>
                        </Box>
                        
                        <Divider />
                        
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                            Next Milestone
                          </Typography>
                          {overviewData.nextMilestone ? (
                            <Stack direction="row" spacing={1.5}>
                              <EventIcon color="primary" />
                              <Stack>
                                <Typography variant="body1" fontWeight={500}>
                                  {overviewData.nextMilestone.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(overviewData.nextMilestone.dateObj)}
                                </Typography>
                              </Stack>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No upcoming milestones.
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
              
                  {/* Team Card */}
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
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
                          <TeamIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={500}>Team</Typography>
                      </Stack>
                      {project.team && project.team.length > 0 ? (
                        <Box sx={{ px: 1 }}>
                          <Box sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Badge 
                                badgeContent={project.team.length} 
                                color="primary"
                                max={99}
                                sx={{ 
                                  '& .MuiBadge-badge': { 
                                    fontSize: '0.8rem',
                                    minWidth: 20,
                                    height: 20,
                                  }
                                }}
                              >
                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                                  <BusinessIcon />
                                </Avatar>
                              </Badge>
                              <Typography variant="body1" fontWeight={500}>Team members</Typography>
                            </Stack>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              sx={{ 
                                borderRadius: 4, 
                                minWidth: 0, 
                                py: 0.5,
                                px: 1,
                              }}
                            >
                              View All
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Alert 
                          severity="info" 
                          icon={<TeamIcon color="info" />}
                          sx={{ 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            '& .MuiAlert-icon': { alignItems: 'center' }
                          }}
                        >
                          No team members assigned yet.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Milestones Card */}
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            width: 36,
                            height: 36, 
                          }}
                        >
                          <MilestonesIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={500}>Milestones</Typography>
                      </Stack>
                      {project.keyMilestones && project.keyMilestones.length > 0 ? (
                        <Box sx={{ px: 1 }}>
                          <List 
                            sx={{ 
                              p: 1.5, 
                              borderRadius: 2, 
                              bgcolor: alpha(theme.palette.background.default, 0.5),
                            }}
                          >
                            {project.keyMilestones.map((milestone: { name: string, date: string, description: string }, index: number) => (
                              <ListItem 
                                key={index} 
                                disableGutters 
                                sx={{ 
                                  py: 1,
                                  px: 0,
                                  borderBottom: index < project.keyMilestones!.length - 1 ? 
                                    `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <EventIcon color="primary" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={milestone.name}
                                  secondary={formatDate(new Date(milestone.date))}
                                  primaryTypographyProps={{ 
                                    variant: 'body2', 
                                    fontWeight: 500,
                                  }}
                                  secondaryTypographyProps={{ 
                                    variant: 'caption',
                                    color: 'text.secondary',
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ) : (
                        <Alert 
                          severity="info" 
                          icon={<MilestonesIcon color="info" />}
                          sx={{ 
                            borderRadius: 2, 
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            '& .MuiAlert-icon': { alignItems: 'center' }
                          }}
                        >
                          No milestones defined yet.
                        </Alert>
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

// Function to calculate overview data (can be memoized)
const calculateOverviewData = (project: Project | null) => {
    if (!project) return { totalEstimate: 0, tasksToDo: 0, tasksInProgress: 0, tasksDone: 0, nextMilestone: null };

    const totalEstimate = project.lineItems?.reduce((sum: number, item: LineItem) => sum + (item.totalCost || 0), 0) || 0;
    
    const tasks = project.tasks || [];
    const tasksToDo = tasks.filter((t: Task) => t.status === 'todo').length;
    const tasksInProgress = tasks.filter((t: Task) => t.status === 'in_progress').length;
    const tasksDone = tasks.filter((t: Task) => t.status === 'completed').length;
    
    // Find next milestone
    const now = new Date().getTime();
    const upcomingMilestones = project.keyMilestones
        ?.map((m: any) => ({ ...m, dateObj: new Date(m.date) }))
        .filter((m: any) => m.dateObj.getTime() >= now)
        .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
    const nextMilestone = upcomingMilestones?.[0] || null;

    return { totalEstimate, tasksToDo, tasksInProgress, tasksDone, nextMilestone };
};

export default ProjectDetails; 