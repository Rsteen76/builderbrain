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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Group as TeamIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  Receipt as ExpenseIcon,
  Flag as PriorityIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  Engineering as EngineeringIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { ProjectService, Project } from '../../services/project';

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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
            onClick={() => navigate(`/projects/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Overview
            </Typography>
            <Typography variant="body1" paragraph>
              {project.description}
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(project.startDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(project.endDate)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BudgetIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="body1">
                      ${project.budget?.toLocaleString() || 'Not set'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {project.location || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Project Type
                    </Typography>
                    <Typography variant="body1">
                      {project.projectType || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {project.estimatedDuration || 'Not specified'} months
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Phases" />
              <Tab label="Milestones" />
              <Tab label="Requirements" />
            </Tabs>

            {activeTab === 0 && (
              <div>
                <Typography variant="subtitle1" gutterBottom>
                  Project Phases
                </Typography>
                {project.phases && project.phases.length > 0 ? (
                  <List>
                    {project.phases.map((phase, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6">{phase.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <TimeIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Duration: {phase.duration} weeks
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {phase.description}
                          </Typography>
                          {phase.dependencies.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Dependencies:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                {phase.dependencies.map((dep, i) => (
                                  <Chip key={i} label={dep} size="small" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No phases defined for this project.
                  </Typography>
                )}
              </div>
            )}

            {activeTab === 1 && (
              <div>
                <Typography variant="subtitle1" gutterBottom>
                  Key Milestones
                </Typography>
                {project.keyMilestones && project.keyMilestones.length > 0 ? (
                  <List>
                    {project.keyMilestones.map((milestone, index) => (
                      <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6">{milestone.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <EventIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Target Date: {milestone.date || 'Not set'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {milestone.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No milestones defined for this project.
                  </Typography>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Required Permits
                    </Typography>
                    {project.requirements?.permits && project.requirements.permits.length > 0 ? (
                      <List>
                        {project.requirements.permits.map((permit, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={permit} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No permits listed.
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Required Inspections
                    </Typography>
                    {project.requirements?.inspections && project.requirements.inspections.length > 0 ? (
                      <List>
                        {project.requirements.inspections.map((inspection, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={inspection} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No inspections listed.
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Required Documents
                    </Typography>
                    {project.requirements?.documents && project.requirements.documents.length > 0 ? (
                      <List>
                        {project.requirements.documents.map((document, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={document} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No documents listed.
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </div>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label={project.status.replace('_', ' ')} 
                color={
                  project.status === 'completed' ? 'success' :
                  project.status === 'in_progress' ? 'warning' :
                  project.status === 'planning' ? 'primary' : 'error'
                }
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Project Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team
            </Typography>
            {project.team && project.team.length > 0 ? (
              <List>
                {project.team.map((member, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={member} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No team members assigned yet.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Client
            </Typography>
            <Typography variant="body1">
              {project.clientId || 'No client specified'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetails; 