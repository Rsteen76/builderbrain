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

  if (loading || !project?.id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        {loading ? <CircularProgress /> : <Alert severity="error">Project data could not be loaded.</Alert>}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: { xs: 1, sm: 0 } }}>
          {project.name}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/projects/${id}/edit`)}
            size="small"
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            size="small"
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="Project details tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<OverviewIcon />} iconPosition="start" label="Overview" id="tab-overview" aria-controls="tabpanel-overview" sx={{ minHeight: 48 }}/>
          <Tab icon={<EstimateIcon />} iconPosition="start" label="Estimate / Costs" id="tab-estimate" aria-controls="tabpanel-estimate" sx={{ minHeight: 48 }}/>
          <Tab icon={<BidsIcon />} iconPosition="start" label="Bids" id="tab-bids" aria-controls="tabpanel-bids" sx={{ minHeight: 48 }}/>
          <Tab icon={<TasksIcon />} iconPosition="start" label="Tasks" id="tab-tasks" aria-controls="tabpanel-tasks" sx={{ minHeight: 48 }}/>
        </Tabs>
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-overview" aria-labelledby="tab-overview">
        {activeTab === 0 && project && (
          <Grid container spacing={3}>

            {/* --- Left Column (Main Details & Finance) --- */} 
            <Grid item xs={12} md={8}>
              {/* Project Description Card */} 
              <Card variant="outlined" sx={{ mb: 3 }}>
                 <CardContent>
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Typography variant="body2" color="text.secondary">
                       {project.description || 'No description provided.'}
                    </Typography>
                 </CardContent>
              </Card>
              
              {/* Financial Summary Card */} 
              <Card variant="outlined" sx={{ mb: 3 }}>
                 <CardContent>
                     <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                       <FinanceIcon />
                       <Typography variant="h6">Financial Summary</Typography>
                     </Stack>
                     <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                             <Typography variant="body2" color="text.secondary">Budget</Typography>
                             <Typography variant="h5" gutterBottom>
                               {formatCurrency(typeof project.budget === 'object' ? project.budget.total : project.budget)}
                             </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Total Estimated Cost</Typography>
                            <Typography variant="h5" gutterBottom>{formatCurrency(overviewData.totalEstimate)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                             <Typography variant="body2" color="text.secondary" gutterBottom>Budget Usage (Estimate vs Budget)</Typography>
                             <Stack direction="row" spacing={2} alignItems="center">
                               <LinearProgress 
                                 variant="determinate" 
                                 value={Math.min(budgetProgress, 100)} // Cap at 100%
                                 color={budgetProgress > 100 ? 'error' : 'primary'}
                                 sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                />
                               <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                 {formatPercentage(budgetProgress / 100)}
                               </Typography>
                             </Stack>
                              {budgetProgress > 100 && 
                                <Typography variant="caption" color="error" sx={{ display:'block', mt: 0.5 }}>
                                    Estimated cost exceeds budget!
                                </Typography>}
                             {budgetTotal > 0 && overviewData.totalEstimate <= budgetTotal &&
                                <Typography variant="caption" color="text.secondary" sx={{ display:'block', mt: 0.5 }}>
                                    Remaining Budget: {formatCurrency(budgetTotal - overviewData.totalEstimate)}
                                </Typography>}
                        </Grid>
                     </Grid>
                 </CardContent>
              </Card>
              
               {/* Core Details Card (Optional - could merge elsewhere) */} 
               {/* <Card variant="outlined" sx={{ mb: 3 }}>
                 <CardContent>
                     <Typography variant="h6" gutterBottom>Core Details</Typography>
                     <Stack spacing={1}>
                        <Stack direction="row" spacing={1}><LocationIcon fontSize="small" color="action"/><Typography variant="body2">{project.location || 'Not specified'}</Typography></Stack>
                        <Stack direction="row" spacing={1}><CategoryIcon fontSize="small" color="action"/><Typography variant="body2">{project.projectType || 'Not specified'}</Typography></Stack>
                     </Stack>
                 </CardContent>
               </Card> */} 
            </Grid>

            {/* --- Right Column (Schedule, Team, Milestones) --- */}
            <Grid item xs={12} md={4}>
                {/* Schedule Snapshot Card */} 
                <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                           <ScheduleIcon />
                           <Typography variant="h6">Schedule</Typography>
                         </Stack>
                         <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Start Date:</Typography>
                                <Typography variant="body2">{formatDate(project.startDate)}</Typography>
                            </Stack>
                             <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Target End:</Typography>
                                <Typography variant="body2">{formatDate(project.endDate)}</Typography>
                            </Stack>
                            <Divider />
                             <Typography variant="body2" color="text.secondary">Task Status:</Typography>
                             <Stack direction="row" justifyContent="space-around" sx={{ textAlign: 'center' }}>
                                <Box><Typography variant="h6">{overviewData.tasksToDo}</Typography><Typography variant="caption">To Do</Typography></Box>
                                <Box><Typography variant="h6">{overviewData.tasksInProgress}</Typography><Typography variant="caption">In Progress</Typography></Box>
                                <Box><Typography variant="h6">{overviewData.tasksDone}</Typography><Typography variant="caption">Done</Typography></Box>
                            </Stack>
                             <Divider />
                            {overviewData.nextMilestone ? (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Next Milestone:</Typography>
                                    <Typography variant="body1">{overviewData.nextMilestone.name} ({formatDate(overviewData.nextMilestone.dateObj)})</Typography>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No upcoming milestones.</Typography>
                            )}
                         </Stack>
                    </CardContent>
                </Card>
            
                 {/* Team Card - Keep simple for now */}
                 <Card variant="outlined" sx={{ mb: 3 }}>
                   <CardContent>
                     <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                         <TeamIcon />
                         <Typography variant="h6">Team</Typography>
                     </Stack>
                     {project.team && project.team.length > 0 ? (
                       <Typography variant="body2" color="text.secondary">{project.team.length} members assigned (Details TBD)</Typography>
                     ) : <Typography variant="body2" color="text.secondary">No team members assigned.</Typography>}
                   </CardContent>
                 </Card>
                 
                 {/* Key Milestones Card - Keep simple */} 
                 <Card variant="outlined">
                   <CardContent>
                     <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                       <MilestonesIcon />
                       <Typography variant="h6">All Milestones</Typography>
                     </Stack>
                     {project.keyMilestones && project.keyMilestones.length > 0 ? (
                       <List dense disablePadding>
                         {project.keyMilestones.map((milestone: { name: string, date: string, description: string }, index: number) => (
                           <ListItem key={index} disableGutters dense sx={{ pl: 1 }}>
                             <ListItemText 
                               primary={milestone.name}
                               secondary={formatDate(new Date(milestone.date))}
                               primaryTypographyProps={{ variant: 'body2' }}
                               secondaryTypographyProps={{ variant: 'caption' }}
                             />
                           </ListItem>
                         ))}
                       </List>
                     ) : (
                       <Typography variant="body2" color="text.secondary">
                         No milestones defined yet.
                       </Typography>
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