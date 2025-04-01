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
  CardActionArea,
  CardActions,
  useMediaQuery,
  Container,
  Stack,
  Skeleton,
  Badge,
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
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

// Updated Project Card Component for mobile-first design
const ProjectCard: React.FC<Project & { onClick?: () => void }> = (props) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  // Status Mapping
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
  const displayStatus = statusMap[status] || 'planning';

  // Status Colors with enhanced accessibility
  const statusColors: Record<DisplayProjectStatus, string> = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    'completed': theme.palette.info.main,
    'planning': theme.palette.primary.main,
    'in_progress': theme.palette.warning.main,
    'on_hold': theme.palette.grey[600],
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
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
      return locationValue.address || `${locationValue.city}, ${locationValue.state}`;
  }

  const calculateProgress = () => {
      if (status === 'completed') return 100;
      // Add logic based on tasks, phases, dates, etc.
      return Math.floor(Math.random() * 80) + 10; // Placeholder
  }
  const displayProgress = calculateProgress();

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'visible',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            height: '8px',
            background: `linear-gradient(90deg, ${statusColors[displayStatus]} 0%, ${alpha(statusColors[displayStatus], 0.6)} 100%)`,
            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius,
          }}
        />
        
        <CardContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ maxWidth: '80%' }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  mb: 0.5, 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {name}
              </Typography>
              <Chip
                label={displayStatus.replace('_', ' ').replace('-', ' ')}
                size="small"
                sx={{
                  backgroundColor: alpha(statusColors[displayStatus], 0.1),
                  color: statusColors[displayStatus],
                  textTransform: 'capitalize',
                  fontWeight: 'medium',
                  borderRadius: '4px',
                  height: '22px',
                }}
              />
            </Box>
            <Badge 
              badgeContent={team?.length || 0} 
              color="primary"
              max={99}
              overlap="circular"
              sx={{ 
                '& .MuiBadge-badge': {
                  fontSize: '10px',
                  height: '18px',
                  minWidth: '18px',
                  padding: '0 5px',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <GroupIcon fontSize="small" />
              </Avatar>
            </Badge>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                Progress
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: displayProgress > 75 ? theme.palette.success.main : theme.palette.text.secondary,
                  fontWeight: 'medium'
                }}
              >
                {displayProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={displayProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                },
              }}
            />
          </Box>

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon 
                sx={{ 
                  fontSize: 18, 
                  color: theme.palette.primary.main,
                  opacity: 0.8
                }} 
              />
              <Typography variant="body2" color="text.secondary">
                Due: <span style={{ fontWeight: 500 }}>{formatDate(endDate)}</span>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon 
                sx={{ 
                  fontSize: 18, 
                  color: theme.palette.success.main,
                  opacity: 0.8
                }} 
              />
              <Typography variant="body2" color="text.secondary">
                Budget: <span style={{ fontWeight: 500 }}>{formatBudget(budget)}</span>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LocationIcon 
                sx={{ 
                  fontSize: 18, 
                  color: theme.palette.info.main,
                  opacity: 0.8,
                  mt: 0.3
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {formatLocation(location)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
      
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <IconButton 
          size="small" 
          onClick={handleMenuClick}
          sx={{ 
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
            }
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (id) {
              navigate(`/projects/${id}`);
            }
            handleMenuClose();
          }}
          sx={{ gap: 1.5 }}
        >
          <TimelineIcon fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" /> Edit Project
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5 }}>
          <AssessmentIcon fontSize="small" /> Generate Report
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5 }}>
          <CloudUploadIcon fontSize="small" /> Upload Documents
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: theme.palette.error.main, gap: 1.5 }}>
          <DeleteIcon fontSize="small" /> Delete Project
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Main Projects Component
const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
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
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Projects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track your construction projects
        </Typography>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: { xs: 2, sm: 3 },
            gap: 2
          }}
        >
          <TextField
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size={isMobile ? "small" : "medium"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flexGrow: { xs: 1, sm: 0 },
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                borderRadius: '8px',
                flex: { xs: 1, sm: 'initial' },
                minWidth: { xs: 0, sm: 100 }
              }}
            >
              Filter
            </Button>
            <Tooltip title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}>
              <Button
                variant="outlined"
                onClick={toggleViewMode}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  minWidth: 0, 
                  width: 40, 
                  height: isMobile ? 40 : 40, 
                  p: 0,
                  borderRadius: '8px',
                  color: theme.palette.text.secondary
                }}
              >
                {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/new')}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                borderRadius: '8px',
                flex: { xs: 1, sm: 'initial' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  boxShadow: `0 6px 15px ${alpha(theme.palette.primary.main, 0.35)}`,
                }
              }}
            >
              New Project
            </Button>
          </Box>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: 3,
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              minWidth: { xs: 'auto', sm: 100 },
              px: { xs: 1.5, sm: 3 },
            }
          }}
        >
          <Tab label="All Projects" />
          <Tab label="Active" />
          <Tab label="Planning" />
          <Tab label="Completed" />
          <Tab label="On Hold" />
        </Tabs>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                  <Skeleton 
                    variant="rectangular" 
                    height={250} 
                    sx={{ borderRadius: 2 }} 
                    animation="wave" 
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : filteredProjects.length > 0 ? (
          <Grid container spacing={3}>
            {filteredProjects.map((project) => (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'list' ? 12 : 6} 
                md={viewMode === 'list' ? 6 : 4} 
                lg={viewMode === 'list' ? 4 : 3} 
                key={project.id}
              >
                <ProjectCard 
                  {...project} 
                  onClick={() => navigate(`/projects/${project.id}`)} 
                />
              </Grid>
            ))}
          </Grid>
        ) : projects.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box 
              sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                mb: 2
              }}
            >
              <BuildIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
              Get started by creating your first construction project. Track progress, manage budgets, and collaborate with your team.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/new')}
              sx={{ 
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                px: 3
              }}
            >
              Create First Project
            </Button>
          </Box>
        ) : (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box 
              sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.warning.main, 0.08),
                color: theme.palette.warning.main,
                mb: 2
              }}
            >
              <SearchIcon sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
              No matching projects
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              Try adjusting your search or filter criteria.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            mt: 1
          }
        }}
      >
        <MenuItem onClick={handleFilterClose}>All Projects</MenuItem>
        <MenuItem onClick={handleFilterClose}>High Budget</MenuItem>
        <MenuItem onClick={handleFilterClose}>Recent Projects</MenuItem>
        <MenuItem onClick={handleFilterClose}>My Projects</MenuItem>
        <Divider />
        <MenuItem onClick={handleFilterClose}>Reset Filters</MenuItem>
      </Menu>
    </Container>
  );
};

export default Projects; 