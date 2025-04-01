import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Divider,
  Stack,
  useTheme,
  alpha,
  Card,
  CardContent,
  Tooltip,
  Alert,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccessTime as TimelineIcon,
  AttachMoney as ExpensesIcon,
  Assignment as TasksIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Engineering as EngineeringIcon,
  FileDownload as DownloadIcon,
  Share as ShareIcon,
  Description as DocumentIcon,
  BarChart as ChartIcon,
  Numbers as BudgetIcon,
  LocationOn as LocationIcon,
  Gavel as BidsIcon,
  Update as UpdateIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService } from '../services/project';
import { formatCurrency, formatDate } from '../utils/formatters';
import PageLayout from '../components/layout/PageLayout';
import ProjectTaskManager from '../components/projects/ProjectTaskManager';
import { Project, Task, Phase, Expense, Bid } from '../types';

// Import recharts components
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

// Type definitions for phases and progress tracking
interface ProjectPhase extends Phase {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  budget: number;
  actualCost: number;
  tasks: Task[];
}

// Enhanced status indicators
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'planning': '#3f51b5',       // Indigo
    'in_progress': '#ff9800',    // Orange
    'completed': '#4caf50',      // Green
    'on_hold': '#f44336',        // Red
    'not_started': '#9e9e9e',    // Grey
    'delayed': '#d32f2f',        // Dark Red
  };
  
  return statusColors[status.toLowerCase()] || '#9e9e9e';
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return <CheckCircleIcon fontSize="small" />;
    case 'in_progress': return <TimelineIcon fontSize="small" />;
    case 'planning': return <ScheduleIcon fontSize="small" />;
    case 'on_hold': return <FlagIcon fontSize="small" />;
    case 'delayed': return <FlagIcon fontSize="small" color="error" />;
    default: return <ScheduleIcon fontSize="small" />;
  }
};

// Project detail page with phases, progress tracking, and expense breakdowns
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [expensesData, setExpensesData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [quickUpdateMode, setQuickUpdateMode] = useState(false);
  const [phasesBeingUpdated, setPhasesBeingUpdated] = useState<{ [id: string]: ProjectPhase }>({});
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching project with ID: ${projectId} for user ${user.uid}`);
        const projectData = await ProjectService.getProject(projectId, user.uid);
        
        if (!projectData) {
          console.error(`Project not found with ID: ${projectId}`);
          setError(`Project with ID ${projectId} not found. Please check the URL and try again.`);
          return;
        }
        
        console.log('Project data retrieved:', projectData.name);
        console.log('Project phases from API:', projectData.phases?.length || 0);
        
        setProject(projectData);
        
        // Initialize phases from project data if available
        if (projectData.phases && projectData.phases.length > 0) {
          console.log('Setting phases from project data:', projectData.phases);
          setPhases(projectData.phases as ProjectPhase[]);
          
          // Also initialize the phases being updated
          const phasesMap: { [id: string]: ProjectPhase } = {};
          projectData.phases.forEach(phase => {
            if (phase.id) {
              phasesMap[phase.id] = phase as ProjectPhase;
            }
          });
          setPhasesBeingUpdated(phasesMap);
        } else {
          console.log('No phases found in project data');
          setPhases([]);
        }
        
        // In a real implementation, these would be API calls
        // fetchPhases(projectId);
        // fetchBids(projectId);
        // fetchExpenses(projectId);
        
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(`Failed to load project details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Additional fetch functions that would make API calls in a real implementation
    const fetchPhases = async (projectId: string) => {
      try {
        // const phaseData = await PhaseService.getPhasesByProject(projectId);
        // setPhases(phaseData);
      } catch (err) {
        console.error('Error fetching phases:', err);
      }
    };
    
    const fetchBids = async (projectId: string) => {
      try {
        // const bidData = await BidService.getBidsByProject(projectId);
        // setBids(bidData);
      } catch (err) {
        console.error('Error fetching bids:', err);
      }
    };
    
    const fetchExpenses = async (projectId: string) => {
      try {
        // const expenseData = await ExpenseService.getExpensesByProject(projectId);
        // Process expense data for charts
        // setExpensesData(processExpensesForCharts(expenseData));
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }
    };
    
    fetchProject();
  }, [projectId, user?.uid]);

  // Handle project update
  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };
  
  // Calculate overall project progress based on phases
  const projectProgress = useMemo(() => {
    if (!phases.length) return 0;
    
    const totalWeight = phases.reduce((sum, phase) => sum + phase.budget, 0);
    if (totalWeight === 0) return 0;
    
    const weightedProgress = phases.reduce((sum, phase) => {
      const weight = phase.budget / totalWeight;
      return sum + (phase.progress * weight);
    }, 0);
    
    return Math.round(weightedProgress);
  }, [phases]);
  
  // Calculate budget vs actual costs
  const budgetData = useMemo(() => {
    const totalBudget = phases.reduce((sum, phase) => sum + phase.budget, 0);
    const totalActual = phases.reduce((sum, phase) => sum + phase.actualCost, 0);
    
    return {
      totalBudget,
      totalActual,
      difference: totalBudget - totalActual,
      percentUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    };
  }, [phases]);

  // Generate combined expenses for charts
  const combinedExpenses = useMemo(() => {
    return phases.map(phase => ({
      name: phase.name,
      budget: phase.budget,
      actual: phase.actualCost,
    }));
  }, [phases]);

  // Calculate timeline and progress
  const timeline = useMemo(() => {
    if (!phases.length) return { 
      startDate: new Date(), 
      endDate: new Date(), 
      elapsedDays: 0, 
      totalDays: 0, 
      percentComplete: 0 
    };
    
    const startDates = phases.map(p => new Date(p.startDate).getTime());
    const endDates = phases.map(p => new Date(p.endDate).getTime());
    
    const projectStartDate = new Date(Math.min(...startDates));
    const projectEndDate = new Date(Math.max(...endDates));
    const today = new Date();
    
    const totalDuration = projectEndDate.getTime() - projectStartDate.getTime();
    const elapsedDuration = today.getTime() - projectStartDate.getTime();
    
    let percentComplete = 0;
    if (totalDuration > 0) {
      percentComplete = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
    }
    
    return {
      startDate: projectStartDate,
      endDate: projectEndDate,
      elapsedDays: Math.floor(elapsedDuration / (1000 * 60 * 60 * 24)),
      totalDays: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
      percentComplete: Math.round(percentComplete),
    };
  }, [phases]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleEdit = () => {
    if (projectId) navigate(`/projects/${projectId}/edit`);
    handleMenuClose();
  };
  
  const handleDelete = async () => {
    if (!projectId || !window.confirm('Are you sure you want to delete this project?')) {
      handleMenuClose();
      return;
    }
    
    try {
      await ProjectService.deleteProject(projectId);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
    
    handleMenuClose();
  };
  
  const handleAddPhase = () => {
    // Navigate to phase creation or open modal
    handleMenuClose();
  };
  
  const handleUpdatePhase = (phaseId: string) => {
    // Navigate to phase edit or open modal
    console.log(`Edit phase: ${phaseId}`);
  };
  
  const handleDeletePhase = (phaseId: string) => {
    // Delete phase
    if (window.confirm('Are you sure you want to delete this phase?')) {
      setPhases(phases.filter(p => p.id !== phaseId));
    }
  };

  const handleAddBid = () => {
    // Navigate to bid creation or open modal
    handleMenuClose();
  };
  
  const handleEditBid = (bidId: string) => {
    // Navigate to bid edit or open modal
    console.log(`Edit bid: ${bidId}`);
  };
  
  const handleDeleteBid = (bidId: string) => {
    // Delete bid
    if (window.confirm('Are you sure you want to delete this bid?')) {
      setBids(bids.filter(b => b.id !== bidId));
    }
  };

  // Initialize phases for quick update
  const handleEnterQuickUpdateMode = () => {
    const phaseUpdates = phases.reduce((acc, phase) => {
      acc[phase.id] = { ...phase };
      return acc;
    }, {} as { [id: string]: ProjectPhase });
    
    setPhasesBeingUpdated(phaseUpdates);
    setQuickUpdateMode(true);
  };

  // Save all phase updates at once
  const handleSaveQuickUpdates = () => {
    // Convert back to array format
    const updatedPhases = Object.values(phasesBeingUpdated);
    setPhases(updatedPhases);
    setQuickUpdateMode(false);
    
    // Here you would normally save to backend
    // ProjectService.updateProjectPhases(projectId, updatedPhases);
  };

  // Cancel quick updates
  const handleCancelQuickUpdates = () => {
    setQuickUpdateMode(false);
    setPhasesBeingUpdated({});
  };

  // Update a specific phase in the quick update mode
  const handleQuickUpdatePhase = (phaseId: string, field: string, value: any) => {
    setPhasesBeingUpdated(prev => ({
      ...prev,
      [phaseId]: {
        ...prev[phaseId],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <PageLayout title="Loading Project" icon={BusinessIcon}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout title="Project Not Found" icon={BusinessIcon}>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={project.name}
      subtitle={`Project #${project.id?.substr(-6) || ''}`}
      icon={BusinessIcon}
      actions={
        <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
          {!quickUpdateMode && (
            <>
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                startIcon={!isSmall && <UpdateIcon />}
                onClick={handleEnterQuickUpdateMode}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  borderRadius: 1.5,
                }}
              >
                {isSmall ? <UpdateIcon /> : "Quick Update"}
              </Button>
              
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                startIcon={!isSmall && <DownloadIcon />}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  borderRadius: 1.5,
                }}
              >
                {isSmall ? <DownloadIcon /> : "Export"}
              </Button>
              
              <Button
                variant="contained"
                size={isMobile ? "small" : "medium"}
                startIcon={!isSmall && <EditIcon />}
                onClick={handleEdit}
                sx={{ 
                  borderRadius: 1.5,
                  minWidth: isSmall ? 40 : undefined
                }}
              >
                {isSmall ? <EditIcon /> : "Edit Project"}
              </Button>
              
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderRadius: 1.5,
                  p: '6px',
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </>
          )}
          
          {quickUpdateMode && (
            <>
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                startIcon={<CloseIcon />}
                onClick={handleCancelQuickUpdates}
                sx={{ 
                  borderRadius: 1.5,
                }}
              >
                Cancel
              </Button>
              
              <Button
                variant="contained"
                size={isMobile ? "small" : "medium"}
                startIcon={<SaveIcon />}
                onClick={handleSaveQuickUpdates}
                sx={{ 
                  borderRadius: 1.5,
                }}
              >
                Save Updates
              </Button>
            </>
          )}
          
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 2,
              sx: {
                minWidth: 200,
                borderRadius: 1.5,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
          >
            <MenuItem onClick={handleEdit}>
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              Edit Project
            </MenuItem>
            <MenuItem onClick={handleAddPhase}>
              <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
              Add Phase
            </MenuItem>
            <MenuItem onClick={handleAddBid}>
              <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
              Add Bid
            </MenuItem>
            <MenuItem onClick={handleEnterQuickUpdateMode}>
              <ListItemIcon><UpdateIcon fontSize="small" /></ListItemIcon>
              Quick Update Mode
            </MenuItem>
            <MenuItem onClick={() => console.log('Share project')}>
              <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
              Share Project
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
              Delete Project
            </MenuItem>
          </Menu>
        </Stack>
      }
    >
      {/* Quick Update Interface */}
      {quickUpdateMode && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.05)
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={600} color="primary">Quick Update Mode</Typography>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            Make multiple updates across phases to catch up on project progress quickly. Update status, progress, and actual costs for each phase.
          </Typography>
          
          <Grid container spacing={3}>
            {Object.values(phasesBeingUpdated).map((phase) => (
              <Grid item xs={12} md={6} key={phase.id}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>{phase.name}</Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Status</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {['not_started', 'in_progress', 'completed', 'delayed'].map((status) => (
                        <Chip
                          key={status}
                          label={status.replace('_', ' ').toUpperCase()}
                          clickable
                          size="small"
                          onClick={() => handleQuickUpdatePhase(phase.id, 'status', status)}
                          sx={{
                            fontWeight: 600,
                            bgcolor: phase.status === status 
                              ? alpha(getStatusColor(status), 0.2)
                              : 'transparent',
                            color: phase.status === status 
                              ? getStatusColor(status)
                              : 'text.secondary',
                            borderRadius: 1,
                            border: `1px solid ${alpha(getStatusColor(status), phase.status === status ? 0.5 : 0.1)}`,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Progress: {phasesBeingUpdated[phase.id].progress}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={phasesBeingUpdated[phase.id].progress} 
                        onChange={(e) => handleQuickUpdatePhase(phase.id, 'progress', parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1 
                      }}>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const currentProgress = phasesBeingUpdated[phase.id].progress;
                            if (currentProgress >= 5) {
                              handleQuickUpdatePhase(phase.id, 'progress', currentProgress - 5);
                            }
                          }}
                          sx={{ border: `1px solid ${theme.palette.divider}` }}
                        >
                          -
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const currentProgress = phasesBeingUpdated[phase.id].progress;
                            if (currentProgress <= 95) {
                              handleQuickUpdatePhase(phase.id, 'progress', currentProgress + 5);
                            }
                          }}
                          sx={{ border: `1px solid ${theme.palette.divider}` }}
                        >
                          +
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Actual Cost: {formatCurrency(phasesBeingUpdated[phase.id].actualCost)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <input 
                        type="number"
                        value={phasesBeingUpdated[phase.id].actualCost}
                        onChange={(e) => handleQuickUpdatePhase(phase.id, 'actualCost', parseFloat(e.target.value) || 0)}
                        style={{ 
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: `1px solid ${theme.palette.divider}`
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Budget: {formatCurrency(phase.budget)}
                      {phasesBeingUpdated[phase.id].actualCost > phase.budget && (
                        <Chip 
                          label="Over Budget" 
                          size="small" 
                          color="error" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Project Overview and Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Project Status Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip
                  label={project.status.replace('_', ' ').toUpperCase()}
                  icon={getStatusIcon(project.status)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: alpha(getStatusColor(project.status), 0.1),
                    color: getStatusColor(project.status),
                    borderRadius: 1,
                  }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Overall Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={projectProgress} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }} 
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" fontWeight="bold" color="text.primary">
                    {projectProgress}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Budget Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Budget
              </Typography>
              <Typography variant="h6" component="div" fontWeight="bold">
                {formatCurrency(budgetData.totalBudget)}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Spent
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(budgetData.totalActual)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" align="right" display="block">
                    Remaining
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    color={budgetData.difference < 0 ? 'error' : 'success.main'}
                  >
                    {formatCurrency(budgetData.difference)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={budgetData.percentUsed} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: budgetData.percentUsed > 100 
                        ? theme.palette.error.main 
                        : budgetData.percentUsed > 90 
                        ? theme.palette.warning.main 
                        : theme.palette.success.main
                    }
                  }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {budgetData.percentUsed.toFixed(0)}% of budget used
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Timeline Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Timeline
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h6" component="div" fontWeight="bold" sx={{ mr: 1 }}>
                  {timeline.elapsedDays} <Typography variant="body2" component="span">days elapsed</Typography>
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Start
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {timeline.startDate?.toLocaleDateString() || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    End
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {timeline.endDate?.toLocaleDateString() || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {timeline.totalDays} days
                  </Typography>
                </Box>
              </Stack>
              
              <Box>
                <LinearProgress 
                  variant="determinate" 
                  value={timeline.percentComplete} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                  }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {timeline.percentComplete}% of timeline elapsed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Team Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Team
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" component="div" fontWeight="bold">
                  {project.team?.length || 0} Members
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={-1} sx={{ mb: 2 }}>
                {(project.team || []).slice(0, 5).map((member, index) => {
                  // Handle team member display - project.team can be array of strings or objects
                  const memberName = typeof member === 'string' ? member : (member as any)?.name || '';
                  
                  return (
                    <Tooltip key={index} title={memberName || `Team Member ${index + 1}`}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: theme.palette.primary.main,
                          border: `2px solid ${theme.palette.background.paper}`
                        }}
                      >
                        {(memberName || 'U').charAt(0)}
                      </Avatar>
                    </Tooltip>
                  );
                })}
                
                {(project.team?.length || 0) > 5 && (
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.grey[300],
                    border: `2px solid ${theme.palette.background.paper}`
                  }}>
                    <Typography variant="caption">+{project.team!.length - 5}</Typography>
                  </Avatar>
                )}
              </Stack>
              
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<PersonIcon />} 
                sx={{ borderRadius: 1.5 }}
              >
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Project Detail Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
              fontSize: '0.9rem',
            }
          }}
        >
          <Tab label="Overview" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Phases" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Bids" icon={<BidsIcon />} iconPosition="start" />
          <Tab label="Expenses" icon={<ExpensesIcon />} iconPosition="start" />
          <Tab label="Tasks" icon={<TasksIcon />} iconPosition="start" />
          <Tab label="Documents" icon={<DocumentIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Project Summary */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ mr: 1 }} /> Project Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Project Type
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {project.projectType || 'Not specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Client
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {project.clientId ? 'Client ID: ' + project.clientId : 'Not assigned'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }} />
                      {typeof project.location === 'string' 
                        ? project.location 
                        : project.location
                          ? `${project.location?.address || ''}, ${project.location?.city || ''}, ${project.location?.state || ''}`
                          : 'No location specified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {project.description || 'No description provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Progress Chart */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ChartIcon sx={{ mr: 1 }} /> Progress Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {phases.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={phases}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80} 
                          style={{ fontSize: '0.75rem' }}
                        />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [`${value}%`, name]} 
                          labelFormatter={(label: string) => `Phase: ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="progress" 
                          name="Progress" 
                          fill={theme.palette.primary.main}
                          barSize={15}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}>
                    <TimelineIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" align="center">
                      No phases available to show progress
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      startIcon={<AddIcon />} 
                      onClick={handleAddPhase}
                      sx={{ mt: 1 }}
                    >
                      Add Project Phases
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Budget & Expenses */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BudgetIcon sx={{ mr: 1 }} /> Budget vs Actuals
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {combinedExpenses.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={combinedExpenses}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar 
                          dataKey="budget" 
                          name="Budget" 
                          fill={theme.palette.primary.main}
                          opacity={0.8}
                          barSize={20} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="actual" 
                          name="Actual" 
                          fill={theme.palette.success.main}
                          opacity={0.8} 
                          barSize={20}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}>
                    <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" align="center">
                      No budget data available
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      startIcon={<AddIcon />} 
                      onClick={handleAddPhase}
                      sx={{ mt: 1 }}
                    >
                      Add Project Phases
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Expense Categories */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ExpensesIcon sx={{ mr: 1 }} /> Expense Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {expensesData.length > 0 ? (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          innerRadius={40}
                          dataKey="value"
                          nameKey="name"
                          label={(entry: any) => `${entry.name}: ${((entry.value / expensesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                        >
                          {expensesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 300, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center'
                  }}>
                    <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" align="center">
                      No expense data available
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      startIcon={<AddIcon />}
                      sx={{ mt: 1 }}
                    >
                      Add Expenses
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Phases Tab */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Project Phases ({phases.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                onClick={handleAddPhase}
                sx={{ borderRadius: 1.5 }}
              >
                Add Phase
              </Button>
            </Box>
            
            {/* Phase List */}
            {phases.length > 0 ? (
              <Stack spacing={2}>
                {phases.map((phase, index) => (
                  <Paper 
                    key={phase.id} 
                    elevation={0}
                    sx={{ 
                      p: 0, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      p: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexGrow: 1,
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(getStatusColor(phase.status), 0.1),
                              color: getStatusColor(phase.status),
                              width: 28,
                              height: 28,
                              mr: 1.5,
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          
                          <Box>
                            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                              {phase.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: { xs: 'flex', sm: 'none' }, mt: { xs: 1, sm: 0 } }}>
                          <Chip
                            label={phase.status.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha(getStatusColor(phase.status), 0.1),
                              color: getStatusColor(phase.status),
                              borderRadius: 1
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        mt: { xs: 2, sm: 0 },
                        gap: 2,
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'space-between', sm: 'flex-end' }
                      }}>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                          <Chip
                            label={phase.status.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha(getStatusColor(phase.status), 0.1),
                              color: getStatusColor(phase.status),
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                        
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdatePhase(phase.id)}
                            sx={{ 
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              borderRadius: 1,
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeletePhase(phase.id)}
                            sx={{ 
                              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                              color: theme.palette.error.main,
                              borderRadius: 1,
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Box>
                    
                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={8}>
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Progress ({phase.progress}%)
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={phase.progress} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                mb: 1,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                              }} 
                            />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Tasks</Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {phase.tasks?.length || 0} tasks
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="body2" color="text.secondary" align="right">Budget</Typography>
                                <Typography variant="body1" fontWeight="medium" align="right">
                                  {formatCurrency(phase.budget)}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="body2" color="text.secondary" align="right">Actual Cost</Typography>
                                <Typography 
                                  variant="body1" 
                                  fontWeight="medium" 
                                  align="right"
                                  color={phase.actualCost > phase.budget ? 'error' : 'inherit'}
                                >
                                  {formatCurrency(phase.actualCost)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ 
                            height: { xs: 100, sm: '100%' },
                            minHeight: { sm: 100 },
                            width: '100%'
                          }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                                    { name: 'Actual', value: phase.actualCost, color: theme.palette.success.main }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={40}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {[
                                    { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                                    { name: 'Actual', value: phase.actualCost, color: theme.palette.success.main }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          sx={{ borderRadius: 1.5 }}
                        >
                          View Phase Details
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 6 
              }}>
                <TimelineIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No phases defined</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start by adding project phases to track progress
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddPhase}
                  sx={{ borderRadius: 1.5 }}
                >
                  Add Phase
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* Bids Tab */}
        {tabValue === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600}>Project Bids</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddBid}
                sx={{ borderRadius: 1.5 }}
              >
                Add New Bid
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {bids.map((bid) => (
                <Grid item xs={12} md={6} lg={4} key={bid.id}>
                  <Card elevation={0} sx={{ 
                    borderRadius: 2, 
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      borderColor: 'transparent',
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>{bid.title}</Typography>
                        <Chip
                          label={bid.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: alpha(
                              bid.status === 'accepted' ? theme.palette.success.main : 
                              bid.status === 'rejected' ? theme.palette.error.main : 
                              bid.status === 'draft' ? theme.palette.grey[500] :
                              bid.status === 'submitted' ? theme.palette.info.main : 
                              theme.palette.warning.main, 0.1
                            ),
                            color: bid.status === 'accepted' ? theme.palette.success.main : 
                                   bid.status === 'rejected' ? theme.palette.error.main : 
                                   bid.status === 'draft' ? theme.palette.grey[700] :
                                   bid.status === 'submitted' ? theme.palette.info.main : 
                                   theme.palette.warning.main,
                            borderRadius: 1,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Contractor</Typography>
                        <Typography variant="body1">{bid.subcontractorName || 'Not assigned'}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Bid Amount</Typography>
                        <Typography variant="body1" fontWeight={600}>{formatCurrency(bid.totalAmount)}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Submission Date</Typography>
                        <Typography variant="body1">{formatDate(bid.createdAt)}</Typography>
                      </Box>
                      
                      {bid.notes && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Notes</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{bid.notes}</Typography>
                        </Box>
                      )}
                      
                      {bid.attachments && bid.attachments.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Documents</Typography>
                          {bid.attachments.map((doc, index) => {
                            const docName = typeof doc === 'string' ? doc : doc.name;
                            const docUrl = typeof doc === 'string' ? '#' : doc.url;
                            
                            return (
                              <Chip
                                key={index}
                                label={docName}
                                size="small"
                                icon={<DocumentIcon fontSize="small" />}
                                clickable
                                onClick={() => window.open(docUrl, '_blank')}
                                sx={{ mr: 0.5, mb: 0.5, borderRadius: 1 }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    </CardContent>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                      <Tooltip title="Edit Bid">
                        <IconButton size="small" onClick={() => handleEditBid(bid.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Bid">
                        <IconButton size="small" onClick={() => handleDeleteBid(bid.id)} sx={{ color: 'error.main' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {bids.length === 0 && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 6 
              }}>
                <BidsIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No bids available</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Start by adding a new bid for this project</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddBid}
                  sx={{ borderRadius: 1.5 }}
                >
                  Add New Bid
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* Expenses Tab */}
        {tabValue === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6">Project Expenses</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                sx={{ borderRadius: 1.5 }}
              >
                Add Expense
              </Button>
            </Box>
            
            {expensesData.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Expense Categories
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={(entry: any) => `${entry.name}: ${((entry.value / expensesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                          >
                            {expensesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Monthly Expenses
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ height: 300 }}>
                      {expensesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                            <Area 
                              type="monotone" 
                              dataKey="expenses" 
                              stroke={theme.palette.primary.main}
                              fill={alpha(theme.palette.primary.main, 0.2)} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          alignItems: 'center'
                        }}>
                          <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                          <Typography variant="body1" color="text.secondary" align="center">
                            No monthly expense data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Phase Budget vs Actual
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {phases.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={phases.map(p => ({
                              name: p.name,
                              budget: p.budget,
                              actual: p.actualCost,
                              variance: p.budget - p.actualCost
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar 
                              dataKey="budget" 
                              name="Budget" 
                              stackId="a" 
                              fill={theme.palette.primary.main}
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              dataKey="actual" 
                              name="Actual" 
                              stackId="b" 
                              fill={theme.palette.success.main}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center'
                      }}>
                        <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" align="center">
                          No phase budget data available
                        </Typography>
                        <Button 
                          variant="text" 
                          size="small" 
                          startIcon={<AddIcon />} 
                          onClick={handleAddPhase}
                          sx={{ mt: 1 }}
                        >
                          Add Project Phases
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 6 
              }}>
                <ExpensesIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No expenses recorded</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start by adding expenses to track your project costs
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  Add Expense
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* Tasks Tab */}
        {tabValue === 4 && (
          <ProjectTaskManager 
            project={project} 
            onProjectUpdate={handleProjectUpdate}
            userId={user?.uid || ''}
          />
        )}
        
        {/* Documents Tab */}
        {tabValue === 5 && (
          <Box>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Project Documents</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{ borderRadius: 1.5 }}
                >
                  Upload Document
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                This section will allow you to manage project documents and files.
              </Alert>
            </Paper>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default ProjectDetailPage;