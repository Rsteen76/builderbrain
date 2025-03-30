import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Fade,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProjectService, Project } from '../../services/project';

interface ProjectCardProps {
  title: string;
  client: string;
  location: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed' | 'planning' | 'in_progress' | 'on_hold';
  dueDate: string;
  budget: string;
  team: number;
  priority: 'high' | 'medium' | 'low';
  tasks: {
    total: number;
    completed: number;
    overdue: number;
  };
  documents: number;
  photos: number;
  timeline: {
    currentPhase: string;
    nextMilestone: string;
    daysUntilMilestone: number;
  };
}

// Define valid status and priority types
type ProjectStatus = 'on-track' | 'at-risk' | 'completed' | 'planning' | 'in_progress' | 'on_hold';
type ProjectPriority = 'high' | 'medium' | 'low';

const ProjectCard: React.FC<any> = (props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const {
    id,
    title,
    name = title,
    client,
    clientId,
    location,
    progress = 0,
    status,
    dueDate,
    endDate,
    budget,
    team,
    priority = 'medium',
    tasks = { total: 0, completed: 0, overdue: 0 },
    documents = 0,
    photos = 0,
    timeline = { currentPhase: '', nextMilestone: '', daysUntilMilestone: 0 },
  } = props;

  const statusColors: Record<ProjectStatus, string> = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    'completed': theme.palette.info.main,
    'planning': theme.palette.primary.main,
    'in_progress': theme.palette.warning.main,
    'on_hold': theme.palette.error.main,
  };

  const priorityColors: Record<ProjectPriority, string> = {
    'high': theme.palette.error.main,
    'medium': theme.palette.warning.main,
    'low': theme.palette.success.main,
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const formatDate = (date: string | Date) => {
    if (!date) return 'TBD';
    if (typeof date === 'string') return date;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const displayProgress = progress || Math.floor(Math.random() * 100);
  
  const formatBudget = (budgetValue: string | number) => {
    if (typeof budgetValue === 'string') return budgetValue;
    return `$${(budgetValue || 0).toLocaleString()}`;
  };

  // Convert status to a valid status value or default to 'planning'
  const displayStatus = (status?.replace('_', '-') || 'planning') as ProjectStatus;
  // Ensure priority is one of the valid priority values
  const displayPriority = (priority || 'medium') as ProjectPriority;

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client || clientId || 'No client specified'}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={displayStatus}
            size="small"
            sx={{
              backgroundColor: alpha(statusColors[displayStatus] || theme.palette.primary.main, 0.1),
              color: statusColors[displayStatus] || theme.palette.primary.main,
            }}
          />
          <Chip
            label={displayPriority}
            size="small"
            sx={{
              backgroundColor: alpha(priorityColors[displayPriority], 0.1),
              color: priorityColors[displayPriority],
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={displayProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatDate(dueDate || endDate)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatBudget(budget)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {typeof team === 'number' ? `${team} members` : `${team?.length || 0} members`}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {location || 'No location set'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div">
                {tasks.completed}/{tasks.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tasks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div">
                {documents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Documents
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div">
                {photos}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Photos
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {timeline.currentPhase && (
          <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Phase: {timeline.currentPhase}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Next Milestone: {timeline.nextMilestone} ({timeline.daysUntilMilestone} days)
            </Typography>
          </Box>
        )}
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => {
          console.log('View Details clicked for project:', { id, name, title });
          if (id) {
            navigate(`/projects/${id}`);
          } else {
            console.error('Project ID is missing');
            // Fallback to using name if available
            if (name) {
              navigate(`/projects/${name}`);
            }
          }
        }}>
          <TimelineIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <AssessmentIcon sx={{ mr: 1 }} /> Generate Report
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CloudUploadIcon sx={{ mr: 1 }} /> Upload Documents
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PhotoCameraIcon sx={{ mr: 1 }} /> Add Photos
        </MenuItem>
      </Menu>
    </Card>
  );
};

const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let filters: any = {};
        if (selectedTab === 1) filters.status = 'in_progress';
        if (selectedTab === 2) filters.status = 'planning';
        if (selectedTab === 3) filters.status = 'completed';
        if (selectedTab === 4) filters.status = 'on_hold';
        
        const projectsData = await ProjectService.getProjects(filters);
        console.log('Fetched projects from Firestore:', projectsData);
        
        // Check if projects have valid IDs
        const validProjects = projectsData.filter(project => {
          if (!project.id) {
            console.warn('Project missing ID:', project);
            return false;
          }
          return true;
        });
        
        setProjects(validProjects);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [selectedTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clientId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Projects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track your construction projects
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/new')}
            >
              New Project
            </Button>
          </Box>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="All Projects" />
          <Tab label="Active" />
          <Tab label="Planning" />
          <Tab label="Completed" />
          <Tab label="On Hold" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredProjects.length > 0 ? (
          <Grid container spacing={3}>
            {filteredProjects.map((project) => (
              <Grid item xs={12} md={4} key={project.id}>
                <ProjectCard {...project} />
              </Grid>
            ))}
          </Grid>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first project by clicking the "New Project" button.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No matching projects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filter criteria.
            </Typography>
          </Box>
        )}
      </Paper>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>Status: All</MenuItem>
        <MenuItem onClick={handleFilterClose}>Status: Active</MenuItem>
        <MenuItem onClick={handleFilterClose}>Status: Completed</MenuItem>
        <MenuItem onClick={handleFilterClose}>Status: On Hold</MenuItem>
        <Divider />
        <MenuItem onClick={handleFilterClose}>Priority: High</MenuItem>
        <MenuItem onClick={handleFilterClose}>Priority: Medium</MenuItem>
        <MenuItem onClick={handleFilterClose}>Priority: Low</MenuItem>
        <Divider />
        <MenuItem onClick={handleFilterClose}>Budget: High to Low</MenuItem>
        <MenuItem onClick={handleFilterClose}>Budget: Low to High</MenuItem>
        <MenuItem onClick={handleFilterClose}>Due Date: Soonest</MenuItem>
        <MenuItem onClick={handleFilterClose}>Due Date: Latest</MenuItem>
      </Menu>
    </Box>
  );
};

export default Projects; 