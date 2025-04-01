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
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';

// Define valid status and priority types
type ProjectStatus = 'on-track' | 'at-risk' | 'completed' | 'planning' | 'in_progress' | 'on_hold';
type ProjectPriority = 'high' | 'medium' | 'low';

// Define display status types (local is fine)
type DisplayProjectStatus = 'on-track' | 'at-risk' | 'completed' | 'planning' | 'in_progress' | 'on_hold';

const ProjectCard: React.FC<Project & { onClick?: () => void }> = (props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const {
    id,
    name,
    clientId,
    location,
    status,
    endDate,
    budget,
    team,
    onClick,
  } = props;

  // Status Mapping: Map Project['status'] to DisplayProjectStatus
  const statusMap: Partial<Record<Project['status'], DisplayProjectStatus>> = {
      estimate: 'planning',
      planning: 'planning',
      in_progress: 'on-track',
      active: 'on-track',
      completed: 'completed',
      on_hold: 'on_hold',
      cancelled: 'at-risk',
      draft: 'planning',
  };
  const displayStatus = statusMap[status] || 'planning'; // Default display status

  // Status Colors: Use DisplayProjectStatus for keys
  const statusColors: Record<DisplayProjectStatus, string> = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    'completed': theme.palette.info.main,
    'planning': theme.palette.primary.main,
    'in_progress': theme.palette.warning.main, // Or use a different color
    'on_hold': theme.palette.grey[600],
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const formatDate = (dateValue: Date | null | undefined) => {
    if (!dateValue) return 'TBD';
    return new Date(dateValue).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const formatBudget = (budgetValue: Project['budget']) => {
    const total = typeof budgetValue === 'object' && budgetValue !== null ? budgetValue.total : budgetValue;
    return `$${(total || 0).toLocaleString()}`;
  };

  const formatLocation = (locationValue: Project['location']) => {
      if (!locationValue) return 'No location set';
      if (typeof locationValue === 'string') return locationValue;
      return locationValue.address || `${locationValue.city}, ${locationValue.state}`; // Example format
  }

  const calculateProgress = () => {
      if (status === 'completed') return 100;
      // Add logic based on tasks, phases, dates, etc.
      return Math.floor(Math.random() * 80) + 10; // Placeholder
  }
  const displayProgress = calculateProgress();

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {clientId || 'No client specified'}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={displayStatus.replace('_', ' ').replace('-', ' ')}
            size="small"
            sx={{
              backgroundColor: alpha(statusColors[displayStatus] || theme.palette.grey[500], 0.1),
              color: statusColors[displayStatus] || theme.palette.grey[500],
              textTransform: 'capitalize',
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
                {formatDate(endDate)}
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
                {`${team?.length || 0} members`}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatLocation(location)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => {
          console.log('View Details clicked for project:', { id, name, title: name });
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async (currentUserId: string) => {
      try {
        setLoading(true);
        setError(null);
        
        let statusFilter: Project['status'] | undefined = undefined;
        if (selectedTab === 1) statusFilter = 'active';
        if (selectedTab === 2) statusFilter = 'planning';
        if (selectedTab === 3) statusFilter = 'completed';
        if (selectedTab === 4) statusFilter = 'on_hold';
        
        const projectsData = await ProjectService.getProjects(currentUserId, { status: statusFilter });
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
    
    if (user?.uid) {
      fetchProjects(user.uid);
    } else {
      console.error('User is not authenticated');
      setError('Failed to load projects. Please try again.');
    }
  }, [selectedTab, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const filteredProjects = projects.filter(project => {
    const search = searchQuery.toLowerCase();
    const locationString = typeof project.location === 'object' && project.location !== null 
                            ? `${project.location.address} ${project.location.city}`.toLowerCase()
                            : typeof project.location === 'string' ? project.location.toLowerCase() : '';
                            
    return project.name.toLowerCase().includes(search) ||
           project.description.toLowerCase().includes(search) ||
           locationString.includes(search) ||
           project.clientId?.toLowerCase().includes(search) ||
           project.status.toLowerCase().includes(search);
  });

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
                <ProjectCard {...project} onClick={() => navigate(`/projects/${project.id}`)} />
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