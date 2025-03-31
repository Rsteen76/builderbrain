import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { ProjectService, Project } from '../../services/project';
import LineItemManager from './LineItemManager';
import BidManager from './BidManager';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  console.log('ProjectDetails component rendered with ID:', id);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) {
        setError('Project ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const projectData = await ProjectService.getProject(id);
        
        if (!projectData) {
          setError(`Project with ID "${id}" not found. The project may have been deleted or you may have used an invalid URL.`);
        } else {
          setProject(projectData);
          console.log('Loaded project data:', projectData);
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(`Failed to load project details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setLoading(true);
      await ProjectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
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
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Project
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Project not found'}
          </Alert>
          <Typography variant="body1" paragraph>
            The project you're looking for could not be loaded. This may be because:
          </Typography>
          <ul>
            <li>The project ID in the URL is incorrect</li>
            <li>The project has been deleted</li>
            <li>You don't have permission to view this project</li>
            <li>There was a network or database error</li>
          </ul>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/projects')}
              startIcon={<ArrowBackIcon />}
            >
              Back to Projects List
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Calculate progress (mock for now)
  const progress = Math.floor(Math.random() * 100);

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
        </Tabs>
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-overview" aria-labelledby="tab-overview">
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Details
                  </Typography>
                  <Typography variant="body1" paragraph color="text.secondary" sx={{ mb: 3 }}>
                    {project.description}
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StatusIcon color="action"/>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip label={project.status.replace('_', ' ')} color={
                            project.status === 'completed' ? 'success' :
                            project.status === 'in_progress' ? 'warning' :
                            project.status === 'planning' ? 'primary' : 'error'
                          } size="small" />
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <Stack direction="row" spacing={1} alignItems="center">
                         <CalendarIcon color="action" />
                         <Box>
                           <Typography variant="body2" color="text.secondary">Start Date</Typography>
                           <Typography variant="body1">{formatDate(project.startDate)}</Typography>
                         </Box>
                       </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <Stack direction="row" spacing={1} alignItems="center">
                         <CalendarIcon color="action" />
                         <Box>
                           <Typography variant="body2" color="text.secondary">End Date</Typography>
                           <Typography variant="body1">{formatDate(project.endDate)}</Typography>
                         </Box>
                       </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <Stack direction="row" spacing={1} alignItems="center">
                         <BudgetIcon color="action" />
                         <Box>
                           <Typography variant="body2" color="text.secondary">Budget</Typography>
                           <Typography variant="body1">${project.budget?.toLocaleString() || 'Not set'}</Typography>
                         </Box>
                       </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <Stack direction="row" spacing={1} alignItems="center">
                         <LocationIcon color="action" />
                         <Box>
                           <Typography variant="body2" color="text.secondary">Location</Typography>
                           <Typography variant="body1">{project.location || 'Not specified'}</Typography>
                         </Box>
                       </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <Stack direction="row" spacing={1} alignItems="center">
                         <CategoryIcon color="action" />
                         <Box>
                           <Typography variant="body2" color="text.secondary">Project Type</Typography>
                           <Typography variant="body1">{project.projectType || 'Not specified'}</Typography>
                         </Box>
                       </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <TeamIcon />
                      <Typography variant="h6">Team</Typography>
                  </Stack>
                  {project.team && project.team.length > 0 ? (
                    <List dense disablePadding>
                      {project.team.map((memberId, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemText primary={memberId} secondary="Role Placeholder"/>
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="text.secondary">No team members assigned.</Typography>}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                   <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                     <MilestonesIcon />
                     <Typography variant="h6">Key Milestones</Typography>
                   </Stack>
                   {project.keyMilestones && project.keyMilestones.length > 0 ? (
                    <List dense disablePadding>
                      {project.keyMilestones.map((milestone, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemText 
                            primary={milestone.name}
                            secondary={`${formatDate(new Date(milestone.date))}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="text.secondary">No key milestones defined.</Typography>}
                 </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-estimate" aria-labelledby="tab-estimate">
        {activeTab === 1 && project && (
          <LineItemManager project={project} onProjectUpdate={handleProjectUpdate} />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-bids" aria-labelledby="tab-bids">
        {activeTab === 2 && project && (
          <BidManager project={project} onProjectUpdate={handleProjectUpdate} />
        )}
      </Box>
    </Box>
  );
};

export default ProjectDetails; 