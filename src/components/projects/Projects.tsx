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
  Badge
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
  SortByAlpha as SortIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../layout/PageLayout';
import { formatCurrency, formatDate } from '../../utils/formatters';

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

// Enhanced ProjectCard with modern UI
const ProjectCard: React.FC<{
  project: Project;
  onClick?: () => void;
}> = ({ project, onClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    getStatusType, 
    getStatusColor, 
    getPriorityColor, 
    calculateProgress, 
    getPriorityIcon,
    formatLocation
  } = useProjectUtils();
  
  const progress = calculateProgress(project);
  const statusColor = getStatusColor(project.status);
  const statusText = getStatusType(project.status);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(null);
  };
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        '&:hover': {
          borderColor: alpha(statusColor, 0.5),
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.08)}`,
          '& .project-card-action': {
            opacity: 1,
          }
        }
      }}
      onClick={onClick}
    >
      {/* Top status bar with gradient */}
      <Box 
        sx={{ 
          height: 5, 
          width: '100%', 
          background: `linear-gradient(90deg, ${statusColor} 0%, ${alpha(statusColor, 0.7)} 100%)` 
        }}
      />
      
      <CardContent sx={{ 
        p: { xs: 2.5, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with status and menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Chip 
            size="small" 
            label={statusText}
            sx={{ 
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              fontWeight: 600,
              height: 22,
              backgroundColor: alpha(statusColor, 0.12),
              color: statusColor,
              borderRadius: '6px',
            }} 
          />
          
          <Box>
            <IconButton 
              size="small" 
              sx={{ 
                width: 28, 
                height: 28, 
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
              }}
              onClick={handleMenuOpen}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              TransitionComponent={Fade}
              elevation={1}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                }
              }}
            >
              <MenuItem onClick={handleMenuClose} dense>Edit Project</MenuItem>
              <MenuItem onClick={handleMenuClose} dense>View Tasks</MenuItem>
              <MenuItem onClick={handleMenuClose} dense>Generate Report</MenuItem>
              <Divider />
              <MenuItem onClick={handleMenuClose} sx={{ color: theme.palette.error.main }} dense>Archive Project</MenuItem>
            </Menu>
          </Box>
        </Box>
        
        {/* Title with priority indicator */}
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 2 }}>
          <Avatar
            sx={{
              width: { xs: 32, sm: 38 },
              height: { xs: 32, sm: 38 },
              bgcolor: alpha(project.priority ? getPriorityColor(project.priority) : theme.palette.primary.main, 0.12),
              color: project.priority ? getPriorityColor(project.priority) : theme.palette.primary.main,
              mt: 0.3,
            }}
          >
            {getPriorityIcon(project.priority)}
          </Avatar>
          
          <Typography 
            variant="h6" 
            fontWeight={600} 
            sx={{ 
              lineHeight: 1.3,
              fontSize: { xs: '1.05rem', sm: '1.15rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {project.name}
          </Typography>
        </Box>
        
        {/* Location */}
        {project.location && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            mb: 2.5,
            overflow: 'hidden'
          }}>
            <LocationIcon sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' }, color: theme.palette.text.secondary, opacity: 0.7 }} />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {formatLocation(project.location)}
            </Typography>
          </Box>
        )}
        
        {/* Progress section */}
        <Box sx={{ mt: 'auto', mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
              Completion
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600} 
              sx={{ 
                fontSize: '0.85rem',
                color: progress >= 80 ? theme.palette.success.main : 
                       progress >= 40 ? theme.palette.primary.main : 
                       theme.palette.text.secondary
              }}
            >
              {progress}%
            </Typography>
          </Box>
          
          <Box sx={{ position: 'relative', height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.common.black, 0.05) }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                height: '100%', 
                width: `${progress}%`,
                borderRadius: 4,
                background: progress >= 80 
                  ? `linear-gradient(90deg, ${theme.palette.success.main}, ${alpha(theme.palette.success.light, 0.8)})`
                  : `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.8)})`,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2, opacity: 0.6 }} />
        
        {/* Info grid */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Tooltip title="Due Date" arrow placement="top">
              <Box sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mx: 'auto',
                    mb: 0.5
                  }}
                >
                  <CalendarIcon sx={{ fontSize: '1.1rem' }} />
                </Avatar>
                <Typography 
                  variant="caption" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    color: theme.palette.text.secondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {project.endDate ? formatDate(project.endDate) : 'No date'}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          
          <Grid item xs={4}>
            <Tooltip title="Budget" arrow placement="top">
              <Box sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    mx: 'auto',
                    mb: 0.5
                  }}
                >
                  <MoneyIcon sx={{ fontSize: '1.1rem' }} />
                </Avatar>
                <Typography 
                  variant="caption" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    color: theme.palette.text.secondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  ${typeof project.budget === 'number' 
                    ? project.budget.toLocaleString() 
                    : (project.budget?.total || 0).toLocaleString()}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          
          <Grid item xs={4}>
            <Tooltip title="Team Members" arrow placement="top">
              <Box sx={{ textAlign: 'center' }}>
                <Badge 
                  badgeContent={project.team?.length || 0} 
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 7,
                      top: 7,
                      fontSize: '0.65rem',
                      height: 14,
                      minWidth: 14,
                      padding: '0 4px'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      mx: 'auto',
                      mb: 0.5
                    }}
                  >
                    <GroupIcon sx={{ fontSize: '1.1rem' }} />
                  </Avatar>
                </Badge>
                <Typography 
                  variant="caption" 
                  component="div"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    color: theme.palette.text.secondary
                  }}
                >
                  Team
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
        
        {/* Hover action indicator */}
        <Box 
          className="project-card-action"
          sx={{ 
            position: 'absolute',
            right: 16,
            bottom: 16,
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconButton 
            size="small" 
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.common.white,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              width: 32,
              height: 32,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

// Project ListView component - elegant alternative to grid display
const ProjectListItem: React.FC<{
  project: Project;
  onClick?: () => void;
}> = ({ project, onClick }) => {
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
  const { calculateProgress } = useProjectUtils();
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

  return (
    <PageLayout
      title="Projects"
      subtitle={`Manage your construction projects (${projects.length})`}
      icon={BusinessIcon}
      actions={
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon fontSize="small" />}
            size="small"
            onClick={handleFilterMenuOpen}
            sx={{ 
              borderRadius: 8, 
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 0.75 },
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: theme.palette.primary.main,
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              textTransform: 'none',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {!isMobile && "Filter & Sort"}
            {isMobile && <FilterIcon fontSize="small" />}
          </Button>
          
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={handleFilterMenuClose}
            TransitionComponent={Fade}
            elevation={3}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 2,
                minWidth: 220,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                overflow: 'visible',
                mt: 1.5,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 20,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}>
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
          
          <IconButton 
            onClick={toggleViewMode}
            size="small"
            sx={{ 
              borderRadius: '50%', 
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              color: theme.palette.primary.main,
              p: { xs: 0.75, sm: 1 },
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            {viewMode === 'grid' ? <ViewListIcon fontSize="small" /> : <ViewModuleIcon fontSize="small" />}
          </IconButton>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
            sx={{ 
              borderRadius: 8,
              px: { xs: 1.5, sm: 2 }, 
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.85)})`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
              }
            }}
          >
            {!isMobile && "New Project"}
            {isMobile && <AddIcon fontSize="small" />}
          </Button>
        </Stack>
      }
      sx={{ 
        px: { xs: 1.5, sm: 2, md: 3 }, 
        py: { xs: 1.5, sm: 2, md: 3 } 
      }}
    >
      {/* Search Box with Drop Shadow */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1.5, sm: 2.5 },
          mb: { xs: 2, sm: 3 },
          borderRadius: 3, 
          border: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: '#ffffff',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          overflowX: 'hidden'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search projects by name, description, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            mb: { xs: 1.5, sm: 2.5 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: alpha(theme.palette.common.black, 0.02),
              transition: 'all 0.2s',
              '&:hover, &.Mui-focused': {
                backgroundColor: alpha(theme.palette.common.black, 0.03),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                }
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: alpha(theme.palette.text.primary, 0.5), fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
              </InputAdornment>
            ),
          }}
        />
        
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="project tabs"
          sx={{
            '& .MuiTabs-scrollButtons': {
              color: theme.palette.primary.main
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: theme.palette.primary.main,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: { xs: 38, sm: 42 },
              minWidth: { xs: 'auto', sm: 100 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
                <span>All Projects</span>
                <Chip 
                  label={tabCounts.all} 
                  size="small" 
                  sx={{ 
                    height: { xs: 18, sm: 20 },
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 }
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
                    height: { xs: 18, sm: 20 },
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 }
                    }
                  }} 
                />
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>Planning</span>
                <Chip 
                  label={tabCounts.planning} 
                  size="small" 
                  sx={{ 
                    height: { xs: 18, sm: 20 },
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 }
                    }
                  }} 
                />
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>Completed</span>
                <Chip 
                  label={tabCounts.completed} 
                  size="small" 
                  sx={{ 
                    height: { xs: 18, sm: 20 },
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 }
                    }
                  }} 
                />
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>On Hold</span>
                <Chip 
                  label={tabCounts.onHold} 
                  size="small" 
                  sx={{ 
                    height: { xs: 18, sm: 20 },
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-label': {
                      px: { xs: 0.75, sm: 1 }
                    }
                  }} 
                />
              </Stack>
            } 
          />
        </Tabs>
      </Paper>

      {/* Loading state with skeletons */}
      {loading ? (
        <Box sx={{ width: '100%' }}>
          {viewMode === 'grid' ? (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Skeleton 
                    variant="rectangular" 
                    height={isMobile ? 200 : 240} 
                    sx={{ borderRadius: 3 }} 
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Stack spacing={2}>
              {[...Array(5)].map((_, index) => (
                <Skeleton 
                  key={index}
                  variant="rectangular" 
                  height={isMobile ? 140 : 84} 
                  sx={{ borderRadius: 3 }} 
                />
              ))}
            </Stack>
          )}
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 4, sm: 5 },
            textAlign: 'center', 
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            backgroundColor: '#ffffff',
            width: '100%',
            boxShadow: '0 4px 30px rgba(0,0,0,0.07)'
          }}
        >
          <Avatar 
            sx={{ 
              width: { xs: 60, sm: 72 }, 
              height: { xs: 60, sm: 72 }, 
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
              mx: 'auto',
              mb: 2.5
            }}
          >
            <BusinessIcon sx={{ fontSize: { xs: 30, sm: 36 } }} />
          </Avatar>
          
          <Typography 
            variant="h5" 
            fontWeight={600} 
            gutterBottom 
            sx={{ 
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem'} 
            }}
          >
            No Projects Found
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 3, 
              maxWidth: 400,
              mx: 'auto',
              fontSize: { xs: '0.875rem', sm: '1rem' } 
            }}
          >
            {searchQuery 
              ? "We couldn't find any projects matching your search criteria. Try adjusting your filters or search terms."
              : "Get started by creating your first project. You can track timelines, budgets, and team members all in one place."}
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
            size="large"
            sx={{ 
              mt: 1, 
              borderRadius: 4,
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            }}
          >
            Create New Project
          </Button>
        </Paper>
      ) : (
        viewMode === 'grid' ? (
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3 }}
            sx={{ mt: 0.5 }}
          >
            {filteredProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={4} key={project.id}>
                <ProjectCard
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {filteredProjects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </Stack>
        )
      )}
    </PageLayout>
  );
};

export default Projects; 