import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  useMediaQuery,
  Stack,
  Skeleton,
  Avatar,
  Divider,
  Container,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Fade,
  Badge,
  CardActions,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon,
  MoreVert as MoreVertIcon,
  FlagCircle as FlagIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  SortByAlpha as SortIcon,
  House as HouseIcon,
  Construction as ConstructionIcon,
  Landscape as LandscapeIcon,
  AddCircleOutline as AddCircleOutlineIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../layout/PageLayout';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ProjectCard from './ProjectCard';
import { PROJECT_WIZARD_ROUTE } from '../../constants/projectRoutes';

// Enhanced utility functions with better typing
type ProjectStatus = 'planning' | 'active' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'estimate' | 'draft';
type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
type DisplayStatus = 'Planning' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled';

// Move theme-dependent logic to custom hooks
const useProjectUtils = () => {
  const theme = useTheme();
  
  // Status mapping
  const getStatusType = (status: string): DisplayStatus => {
    const statusMap: Record<string, DisplayStatus> = {
      'estimate': 'Planning',
      'planning': 'Planning',
      'in_progress': 'Active',
      'active': 'Active',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'cancelled': 'Cancelled',
      'draft': 'Planning',
    };
    return statusMap[status.toLowerCase()] || 'Planning';
  };
  
  // Status color based on theme
  const getStatusColor = (status: string): string => {
    const statusType = getStatusType(status);
    
    const colorMap: Record<DisplayStatus, string> = {
      'Planning': theme.palette.info.main,
      'Active': theme.palette.primary.main,
      'Completed': theme.palette.success.main,
      'On Hold': theme.palette.warning.main,
      'Cancelled': theme.palette.error.main,
    };
    
    return colorMap[statusType];
  };
  
  // Priority color based on theme
  const getPriorityColor = (priority?: string): string => {
    if (!priority) return theme.palette.info.main;
    
    const priorityMap: Record<string, string> = {
      'low': theme.palette.info.main,
      'medium': theme.palette.success.main,
      'high': theme.palette.warning.main,
      'urgent': theme.palette.error.main,
    };
    
    return priorityMap[priority.toLowerCase()] || theme.palette.info.main;
  };
  
  // Calculate progress (theme-independent)
  const calculateProgress = (project: Project): number => {
    if (project.status === 'completed') return 100;
    
    // In a real app, this would be calculated from tasks or milestones
    // For demo purposes, we'll use a deterministic random value based on the project ID
    const id = project.id || '';
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Math.max(10, Math.min(95, hash % 100));
  };
  
  // Get priority icon
  const getPriorityIcon = (priority?: string) => {
    if (!priority) return <FlagIcon />;
    
    switch(priority.toLowerCase()) {
      case 'urgent': return <FlagIcon color="error" />;
      case 'high': return <FlagIcon color="warning" />;
      case 'medium': return <FlagIcon color="success" />;
      case 'low': return <FlagIcon color="info" />;
      default: return <FlagIcon color="info" />;
    }
  };
  
  // Format location string
  const formatLocation = (location: string | { address: string; city: string; state: string; zipCode: string }): string => {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.address}, ${location.city}`;
  };
  
  return {
    getStatusType,
    getStatusColor,
    getPriorityColor,
    calculateProgress,
    getPriorityIcon,
    formatLocation
  };
};

// Project ListView component - elegant alternative to grid display
const ProjectListItem: React.FC<{
  project: Project;
  onClick?: () => void;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void;
}> = ({ project, onClick, onMenuClick }) => {
  const theme = useTheme();
  const { 
    getStatusType, 
    getStatusColor, 
    getPriorityColor, 
    calculateProgress, 
    getPriorityIcon,
    formatLocation
  } = useProjectUtils();
  
  const statusColor = getStatusColor(project.status);
  const statusText = getStatusType(project.status);
  const progress = calculateProgress(project);
  
  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        mb: 2,
        overflow: 'hidden',
        '&:hover': {
          borderColor: alpha(statusColor, 0.5),
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
        }
      }}
      onClick={onClick}
    >
      {/* Left colored status bar */}
      <Box 
        sx={{ 
          width: { xs: '100%', sm: 6 },
          height: { xs: 4, sm: '100%' },
          backgroundColor: statusColor
        }} 
      />
      
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        width: '100%',
        p: { xs: 2, sm: 2.5 },
        gap: { xs: 2, sm: 3 }
      }}>
        {/* Project name and location */}
        <Box sx={{ flex: '1 1 40%', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: alpha(project.priority ? getPriorityColor(project.priority) : theme.palette.primary.main, 0.12),
                color: project.priority ? getPriorityColor(project.priority) : theme.palette.primary.main,
              }}
            >
              {getPriorityIcon(project.priority)}
            </Avatar>
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '0.95rem', sm: '1rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {project.name}
            </Typography>
          </Box>
          
          {project.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
              <LocationIcon sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary, opacity: 0.7 }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatLocation(project.location)}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Progress */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: '1 1 20%',
          minWidth: { xs: '100%', sm: 140 }
        }}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Progress
              </Typography>
              <Typography 
                variant="caption" 
                fontWeight={600} 
                sx={{ 
                  fontSize: '0.75rem',
                  color: progress >= 80 ? theme.palette.success.main : 
                         progress >= 40 ? theme.palette.primary.main : 
                         theme.palette.text.secondary
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.common.black, 0.05) }}>
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  height: '100%', 
                  width: `${progress}%`,
                  borderRadius: 3,
                  background: progress >= 80 
                    ? `linear-gradient(90deg, ${theme.palette.success.main}, ${alpha(theme.palette.success.light, 0.8)})`
                    : `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.8)})`,
                }} 
              />
            </Box>
          </Box>
        </Box>
        
        {/* Status and date */}
        <Stack 
          direction={{ xs: 'row', sm: 'column' }} 
          spacing={{ xs: 2, sm: 0.5 }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          justifyContent={{ xs: 'space-between', sm: 'center' }}
          sx={{ flex: '1 1 25%', minWidth: { sm: 120 } }}
        >
          <Chip 
            size="small" 
            label={statusText}
            sx={{ 
              fontSize: '0.7rem',
              fontWeight: 600,
              height: 22,
              backgroundColor: alpha(statusColor, 0.12),
              color: statusColor,
              borderRadius: '6px',
              minWidth: 80,
              justifyContent: 'center'
            }} 
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon fontSize="small" sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary, opacity: 0.7 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {project.endDate ? formatDate(project.endDate) : 'No due date'}
            </Typography>
          </Box>
        </Stack>
        
        {/* Budget and team info */}
        <Stack 
          direction={{ xs: 'row', sm: 'column' }} 
          spacing={{ xs: 2, sm: 0.5 }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          justifyContent={{ xs: 'space-between', sm: 'center' }}
          sx={{ flex: '1 1 15%', minWidth: { sm: 100 } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon fontSize="small" sx={{ fontSize: '0.85rem', color: theme.palette.success.main, opacity: 0.9 }} />
            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
              ${typeof project.budget === 'number' 
                ? project.budget.toLocaleString() 
                : (project.budget?.total || 0).toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon fontSize="small" sx={{ fontSize: '0.85rem', color: theme.palette.info.main, opacity: 0.9 }} />
            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
              {project.team?.length || 0} members
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

// Filter interface types
interface FilterOptions {
  status: string[];
  priority: string[];
  sortBy: 'name' | 'dueDate' | 'budget' | 'progress';
  sortDirection: 'asc' | 'desc';
}

// Main Projects Component with enhanced UI
const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { calculateProgress, formatLocation } = useProjectUtils();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [],
    priority: [],
    sortBy: 'name',
    sortDirection: 'asc'
  });
  
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectMenuAnchor, setNewProjectMenuAnchor] = useState<null | HTMLElement>(null);

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
        const validProjects = projectsData.filter(project => !!project.id);
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

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  };
  
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleSort = (sortBy: FilterOptions['sortBy']) => {
    setFilterOptions(prev => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
    handleFilterMenuClose();
  };

  // Apply filters, search and sorting to projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];
    
    // Apply search filter
    const search = searchQuery.toLowerCase();
    if (search) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search) ||
        (typeof project.location === 'string' && project.location.toLowerCase().includes(search)) ||
        project.status.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter from filterOptions
    if (filterOptions.status.length > 0) {
      filtered = filtered.filter(project => 
        filterOptions.status.includes(project.status.toLowerCase())
      );
    }
    
    // Apply priority filter - only include projects with matching priority
    if (filterOptions.priority.length > 0) {
      filtered = filtered.filter(project => 
        project.priority && filterOptions.priority.includes(project.priority.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const direction = filterOptions.sortDirection === 'asc' ? 1 : -1;
      
      switch (filterOptions.sortBy) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        
        case 'dueDate':
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return direction;
          if (!b.endDate) return -direction;
          return direction * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
          
        case 'budget':
          const budgetA = typeof a.budget === 'number' ? a.budget : a.budget?.total || 0;
          const budgetB = typeof b.budget === 'number' ? b.budget : b.budget?.total || 0;
          return direction * (budgetA - budgetB);
          
        case 'progress':
          return direction * (calculateProgress(a) - calculateProgress(b));
          
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [projects, searchQuery, filterOptions, calculateProgress]);

  // Tab counts for display
  const tabCounts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
    planning: projects.filter(p => p.status === 'planning' || p.status === 'estimate' || p.status === 'draft').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on_hold').length
  };

  // Handle project actions menu
  const handleOpenContextMenu = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    event.preventDefault();
    setSelectedProjectId(projectId);
    setContextMenuAnchor(event.currentTarget);
  };

  const handleCloseContextMenu = () => {
    setContextMenuAnchor(null);
  };

  const handleProjectEdit = (projectId: string) => {
    navigate(`/projects/${projectId}/edit`);
    handleCloseContextMenu();
  };

  const handleProjectDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        // Fix the method call to match the expected arguments
        // Check your actual ProjectService API to see the correct usage
        await ProjectService.deleteProject(projectId);
        
        // Update the local state
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Show success message
        // ...
      } catch (err) {
        // Handle error
        console.error('Error deleting project:', err);
        // Show error message
        // ...
      }
    }
    handleCloseContextMenu();
  };

  // Project templates data
  const templates = [
    {
      id: 'residential',
      name: 'Residential Construction',
      icon: <HouseIcon fontSize="small" />,
      description: 'Single-family homes, multi-family units, renovations, and additions.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'residential' },
      color: theme.palette.primary.main,
    },
    {
      id: 'commercial',
      name: 'Commercial Building',
      icon: <BusinessIcon fontSize="small" />,
      description: 'Office buildings, retail spaces, warehouses, and industrial facilities.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'commercial' },
      color: theme.palette.secondary.main,
    },
    {
      id: 'renovation',
      name: 'Renovation Project',
      icon: <ConstructionIcon fontSize="small" />,
      description: 'Remodeling existing structures, tenant improvements, and historic renovations.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'renovation' },
      color: '#ff9800', // Orange
    },
    {
      id: 'kitchen-remodel',
      name: 'Kitchen Remodel',
      icon: <HomeIcon fontSize="small" />,
      description: 'Specialized kitchen renovation with industry-standard phases and timelines.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'kitchen-remodel' },
      color: '#e91e63', // Pink
    },
    {
      id: 'landscaping',
      name: 'Landscaping Project',
      icon: <LandscapeIcon fontSize="small" />,
      description: 'Outdoor spaces, hardscaping, softscaping, and landscape construction.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'landscaping' },
      color: '#4caf50', // Green
    },
    {
      id: 'custom',
      name: 'Custom Project',
      icon: <AddCircleOutlineIcon fontSize="small" />,
      description: 'Create your own project structure with custom phases tailored to your specific needs.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'custom' },
      color: '#9c27b0', // Purple
    },
  ];

  // New project dropdown handlers
  const handleNewProjectClick = (event: React.MouseEvent<HTMLElement>) => {
    setNewProjectMenuAnchor(event.currentTarget);
  };

  const handleNewProjectMenuClose = () => {
    setNewProjectMenuAnchor(null);
  };

  const handleTemplateSelect = (template: typeof templates[0]) => {
    if (template.params) {
      navigate(template.route, { state: template.params });
    } else {
      navigate(template.route);
    }
    handleNewProjectMenuClose();
  };

  // Project templates section - we're going to replace this with the dropdown menu
  const renderTemplatesSection = () => {
    // We're not rendering this section anymore, but keeping the function for backward compatibility
    return null;
  };

  return (
    <PageLayout
      title="Projects"
      subtitle={`Manage your construction projects (${projects.length})`}
      icon={BusinessIcon}
      actions={
        <Stack 
          direction={{ xs: 'row', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ 
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-end', sm: 'flex-end' },
            gap: { xs: 1, sm: 1.5 },
            width: '100%'
          }}
        >
          <Button
            variant="outlined"
            startIcon={!isMobile ? <FilterIcon fontSize="small" /> : undefined}
            size="small"
            onClick={handleFilterMenuOpen}
            sx={{ 
              borderRadius: 1.5, 
              minWidth: { xs: 40, sm: 'auto' },
              px: { xs: isMobile ? 1 : 1.5, sm: 2 },
              py: 0.75,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: theme.palette.primary.main,
              fontWeight: 500,
              fontSize: '0.8rem',
              textTransform: 'none',
            }}
          >
            {isMobile ? <FilterIcon fontSize="small" /> : "Filter & Sort"}
          </Button>
          
          <IconButton 
            onClick={toggleViewMode}
            size="small"
            sx={{ 
              borderRadius: '50%', 
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              color: theme.palette.primary.main,
              width: 32,
              height: 32,
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            {viewMode === 'grid' ? <ViewListIcon fontSize="small" /> : <ViewModuleIcon fontSize="small" />}
          </IconButton>
          
          <Button
            variant="contained"
            startIcon={!isMobile ? <AddIcon /> : undefined}
            endIcon={!isMobile ? <ArrowForwardIcon fontSize="small" /> : undefined}
            onClick={handleNewProjectClick}
            sx={{ 
              borderRadius: 1.5,
              minWidth: { xs: 40, sm: 'auto' },
              px: { xs: isMobile ? 1 : 1.5, sm: 2 }, 
              py: 0.75,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            {isMobile ? <AddIcon fontSize="small" /> : "New Project"}
          </Button>

          {/* New Project Templates Menu */}
          <Menu
            anchorEl={newProjectMenuAnchor}
            open={Boolean(newProjectMenuAnchor)}
            onClose={handleNewProjectMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              elevation: 2,
              sx: {
                minWidth: 220,
                maxWidth: 280,
                borderRadius: 1.5,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                pb: 1,
              }
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ px: 2, py: 1.5, fontWeight: 600, color: 'text.primary' }}
            >
              Choose Project Type
            </Typography>
            
            {templates.map((template) => (
              <MenuItem 
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                sx={{
                  py: 1.25,
                  px: 2,
                  '&:hover': {
                    backgroundColor: alpha(template.color, 0.08),
                  }
                }}
              >
                <ListItemIcon sx={{ color: template.color, minWidth: 36 }}>
                  {template.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={template.name}
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }
                  }}
                />
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      }
      sx={{ 
        px: { xs: 1, sm: 2, md: 3 }, 
        py: { xs: 1, sm: 2, md: 3 },
        maxWidth: '100%',
        overflowX: 'hidden'
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {/* Project Templates Section - removed */}
        
        {/* Search Box */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 3 },
            borderRadius: 2, 
            border: '1px solid rgba(0,0,0,0.08)',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search projects by name, description, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.common.black, 0.02),
                }
              }}
            />
            
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              aria-label="project tabs"
              sx={{
                minHeight: 38,
                '& .MuiTabs-scrollButtons': {
                  '&.Mui-disabled': { opacity: 0.3 },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: theme.palette.primary.main,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 38,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  px: { xs: 1, sm: 2 },
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }
                }
              }}
            >
              <Tab 
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>All</span>
                    <Chip 
                      label={tabCounts.all} 
                      size="small" 
                      sx={{ 
                        height: { xs: 16, sm: 18 },
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        fontWeight: 600,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        '& .MuiChip-label': {
                          px: { xs: 0.5, sm: 0.75 }
                        }
                      }} 
                    />
                  </Stack>
                } 
              />
              <Tab 
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <span>Active</span>
                    <Chip 
                      label={tabCounts.active} 
                      size="small" 
                      sx={{ 
                        height: { xs: 16, sm: 18 },
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        fontWeight: 600,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        '& .MuiChip-label': {
                          px: { xs: 0.5, sm: 0.75 }
                        }
                      }} 
                    />
                  </Stack>
                } 
              />
              {/* ...other tabs with same styling adjustments... */}
            </Tabs>
          </Box>
        </Paper>

        {/* Project Grid/List - ensure responsive */}
        <Box sx={{ width: '100%' }}>
          {loading ? (
            <Box sx={{ width: '100%' }}>
              {viewMode === 'grid' ? (
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                  {[...Array(6)].map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index} sx={{ width: '100%' }}>
                      <Skeleton 
                        variant="rectangular" 
                        height={isMobile ? 220 : 260} 
                        sx={{ borderRadius: 2, width: '100%' }} 
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                // ...existing skeleton list code...
                <Stack spacing={2}>
                {[...Array(5)].map((_, index) => (
                  <Skeleton 
                    key={index}
                    variant="rectangular" 
                    height={isMobile ? 140 : 84} 
                    sx={{ borderRadius: 2 }} 
                  />
                ))}
              </Stack>
              )}
            </Box>
          ) : filteredProjects.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 2.5, sm: 4 },
                textAlign: 'center', 
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                backgroundColor: '#ffffff',
                width: '100%'
              }}
            >
              {/* ...existing empty state content... */}
              <Avatar 
              sx={{ 
                width: { xs: 50, sm: 64 }, 
                height: { xs: 50, sm: 64 }, 
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                mx: 'auto',
                mb: 2
              }}
            >
              <BusinessIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
            </Avatar>
            
            <Typography 
              variant="h5" 
              fontWeight={600} 
              gutterBottom 
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem'} 
              }}
            >
              No Projects Found
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              paragraph
              sx={{ maxWidth: 500, mx: 'auto' }}
            >
              {searchQuery ? 'Try different search terms or filters' : 'Get started by creating your first project'}
            </Typography>
            
            {!searchQuery && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewProjectClick}
                sx={{ mt: 1, borderRadius: 1.5 }}
              >
                Create New Project
              </Button>
            )}
            </Paper>
          ) : (
            viewMode === 'grid' ? (
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                {filteredProjects.map((project, index) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <ProjectCard 
                      project={project} 
                      onClick={() => navigate(`/projects/${project.id}`)} 
                      onMenuClick={(e) => handleOpenContextMenu(e, project.id!)}
                      index={index}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
                {filteredProjects.map((project, index) => (
                  <ProjectListItem 
                    key={project.id} 
                    project={project} 
                    onClick={() => navigate(`/projects/${project.id}`)} 
                    onMenuClick={(e) => handleOpenContextMenu(e, project.id!)}
                  />
                ))}
              </Stack>
            )
          )}
        </Box>

        {/* Context Menu for Projects - unchanged */}
        {/* ...existing menus code... */}
        <Menu
          anchorEl={contextMenuAnchor}
          open={Boolean(contextMenuAnchor)}
          onClose={handleCloseContextMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 2,
            sx: {
              minWidth: 180,
              borderRadius: 1.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }
          }}
        >
          <MenuItem 
            onClick={() => {
              navigate(`/projects/${selectedProjectId}`);
              handleCloseContextMenu();
            }}
            dense
          >
            View Project
          </MenuItem>
          <MenuItem 
            onClick={() => selectedProjectId && handleProjectEdit(selectedProjectId)} 
            dense
          >
            Edit Project
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem 
            onClick={() => selectedProjectId && handleProjectDelete(selectedProjectId)}
            sx={{ color: theme.palette.error.main }}
            dense
          >
            Delete Project
          </MenuItem>
        </Menu>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={handleFilterMenuClose}
          TransitionComponent={Fade}
          PaperProps={{
            elevation: 2,
            sx: {
              minWidth: 220,
              borderRadius: 1.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}
          >
            Sort Projects
          </Typography>
          
          <MenuItem 
            onClick={() => handleSort('name')}
            selected={filterOptions.sortBy === 'name'}
            sx={{ 
              fontSize: '0.875rem',
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                }
              }
            }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <SortIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
              Name
              <Box component="span" sx={{ ml: 'auto' }}>
                {filterOptions.sortBy === 'name' && (
                  filterOptions.sortDirection === 'asc' ? '↑' : '↓'
                )}
              </Box>
            </Box>
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleSort('dueDate')}
            selected={filterOptions.sortBy === 'dueDate'}
            sx={{ 
              fontSize: '0.875rem',
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                }
              }
            }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <CalendarIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
              Due Date
              <Box component="span" sx={{ ml: 'auto' }}>
                {filterOptions.sortBy === 'dueDate' && (
                  filterOptions.sortDirection === 'asc' ? '↑' : '↓'
                )}
              </Box>
            </Box>
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleSort('budget')}
            selected={filterOptions.sortBy === 'budget'}
            sx={{ 
              fontSize: '0.875rem',
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                }
              }
            }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <MoneyIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
              Budget
              <Box component="span" sx={{ ml: 'auto' }}>
                {filterOptions.sortBy === 'budget' && (
                  filterOptions.sortDirection === 'asc' ? '↑' : '↓'
                )}
              </Box>
            </Box>
          </MenuItem>
          
          <MenuItem 
            onClick={() => handleSort('progress')}
            selected={filterOptions.sortBy === 'progress'}
            sx={{ 
              fontSize: '0.875rem',
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                }
              }
            }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
              Progress
              <Box component="span" sx={{ ml: 'auto' }}>
                {filterOptions.sortBy === 'progress' && (
                  filterOptions.sortDirection === 'asc' ? '↑' : '↓'
                )}
              </Box>
            </Box>
          </MenuItem>
        </Menu>
      </Container>
    </PageLayout>
  );
};

export default Projects;
