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
  Tooltip,
  Chip,
  useTheme,
  alpha,
  Avatar,
  Rating,
  Divider,
  CircularProgress,
  Alert,
  Container,
  Stack,
  Badge,
  useMediaQuery,
  Skeleton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ButtonGroup,
  CardMedia,
  CardActionArea,
  CardActions,
  Tab,
  Tabs,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  Build as BuildIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Speed as SpeedIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  LocalAtm as LocalAtmIcon,
  ArrowForward as ArrowForwardIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  House as HouseIcon,
  Construction as ConstructionIcon,
  Landscape as LandscapeIcon,
  ClearAll as ClearAllIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  ArrowUpward as ArrowUpwardIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Place as PlaceIcon,
  Flag as FlagIcon,
  Error as ErrorIcon,
  Today as TodayIcon,
  CalendarToday as CalendarTodayIcon,
  Alarm as AlarmIcon,
  PriorityHigh as PriorityHighIcon,
  Timeline as TimelineIcon,
  InsertChart as InsertChartIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  DashboardPaymentSummary,
  DashboardProjectSummary,
  DashboardRecentActivity,
  DashboardSummaryService,
  DashboardTaskSummary,
} from '../../services/dashboard-summary';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageLayout from '../layout/PageLayout';
import QuickActions from './QuickActions';
import ProjectInsights from './ProjectInsights';
import UpcomingDeadlines from './UpcomingDeadlines';
import PriorityItems from './PriorityItems';
import RecentProjects from './RecentProjects';
import ProjectCard from '../projects/ProjectCard';
import { PROJECT_WIZARD_ROUTE } from '../../constants/projectRoutes';

type DashboardTask = DashboardTaskSummary;
type DashboardProject = DashboardProjectSummary;
type Payment = DashboardPaymentSummary;

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  onClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        border: 'none',
        background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.03)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? theme.shadows[4] : 'none',
        },
        '&:before': {
          content: '""',
          position: 'absolute',
          width: '140px',
          height: '140px',
          background: `radial-gradient(circle, ${alpha(color, 0.2)} 0%, transparent 70%)`,
          borderRadius: '50%',
          top: '-80px',
          right: '-50px',
          zIndex: 0,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}
        >
          <Avatar
            sx={{
              bgcolor: color,
              color: '#fff',
              width: 40,
              height: 40,
              boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
            }}
          >
            {icon}
          </Avatar>
          
          {change && (
            <Chip
              icon={<ArrowUpwardIcon fontSize="small" />}
              label={change}
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.dark,
                fontWeight: 600,
                borderRadius: '6px',
                py: 0.5,
                height: 'auto',
                '& .MuiChip-icon': {
                  fontSize: '0.75rem',
                  ml: 0.5,
                  mr: -0.25,
                }
              }}
            />
          )}
        </Box>
        
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            mb: 0.5,
            color: theme.palette.text.primary,
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

interface RecentActivity extends DashboardRecentActivity {
  icon: React.ReactNode;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<DashboardTask[]>([]);
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    teamMembers: 0,
    tasksDue: 0,
    projectsAtRisk: 0,
    nextMilestone: { name: '', date: '', projectId: '' },
    budgetVariance: 0,
    materialsToOrder: 0
  });

  // State for the New Project dropdown menu
  const [newProjectMenuAnchor, setNewProjectMenuAnchor] = useState<null | HTMLElement>(null);

  const applyDashboardData = (data: Awaited<ReturnType<typeof DashboardSummaryService.getDashboardData>>) => {
    setProjects(data.projects);
    setUpcomingTasks(data.upcomingTasks);
    setOverduePayments(data.overduePayments);
    setStats(data.stats);
    setRecentActivity(data.recentActivity.map(activity => ({
      ...activity,
      icon: <NotificationsIcon color="primary" />,
    })));
  };

  const loadDashboardData = async (forceRefresh = false) => {
    if (!user?.uid) {
      setError("User not authenticated. Cannot load dashboard data.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dashboardData = await DashboardSummaryService.getDashboardData(user.uid, { forceRefresh });
      applyDashboardData(dashboardData);
    } catch (err) {
      console.error(forceRefresh ? 'Error refreshing dashboard data:' : 'Error fetching dashboard data:', err);
      setError(forceRefresh
        ? 'Failed to refresh dashboard data. Please try again.'
        : 'Failed to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.uid]);

  const refreshData = () => {
    loadDashboardData(true);
  };
  
  // Format project data for display
  const formatProjectForDisplay = (project: DashboardProject) => {
    // Determine project status
    let status: 'on-track' | 'at-risk' | 'completed' = 'on-track';
    
    if (project.status === 'completed') {
      status = 'completed';
    } else if (project.status === 'on_hold' || project.status === 'cancelled') {
      status = 'at-risk';
    } else {
      // Check if project is at risk based on end date
      if (project.endDate) {
        const endDate = new Date(project.endDate);
        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        
        if (endDate < today) {
          status = 'at-risk'; // Past due date
        } else if (endDate <= oneWeekFromNow) {
          status = 'at-risk'; // Due within a week
        }
      }
    }
    
    // Calculate progress as percentage of completed tasks
    let progress = 0;
    if (project.tasks && project.tasks.length > 0) {
      const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
      progress = Math.round((completedTasks / project.tasks.length) * 100);
    }
    
    return {
      title: project.name,
      progress,
      status,
      dueDate: project.endDate ? formatDate(project.endDate) : 'No due date',
      budget: formatCurrency(typeof project.budget === 'object' ? project.budget.total : (project.budget || 0)),
      team: project.team?.length || 0,
      projectId: project.id,
      location: typeof project.location === 'string' 
                ? project.location 
                : project.location?.address || `${project.location?.city || ''}, ${project.location?.state || ''}` || 'No location'
    };
  };

  // Define templates for the New Project dropdown
  const templates = useMemo(() => [
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
      name: 'Kitchen Remodel',
      icon: <HomeIcon fontSize="small" />,
      description: 'Specialized kitchen renovation with industry-standard phases and timelines.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'kitchen-remodel' },
      color: '#e91e63',
    },
    {
      id: 'landscaping',
      name: 'Landscaping Project',
      icon: <LandscapeIcon fontSize="small" />,
      description: 'Outdoor spaces, hardscaping, softscaping, and landscape construction.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'landscaping' },
      color: '#4caf50',
    },
    {
      id: 'custom',
      name: 'Custom Project',
      icon: <AddCircleOutlineIcon fontSize="small" />,
      description: 'Create your own project structure with custom phases tailored to your specific needs.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'custom' },
      color: '#9c27b0',
    },
  ], [theme]);

  // New project dropdown handlers (copied/adapted from Projects.tsx)
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

  if (loading && projects.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Skeleton variant="text" width={300} height={60} />
              <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <PageLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.displayName || 'User'}`}
      icon={DashboardIcon}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2 } }}>
        {/* Pass the handler to QuickActions */}
        <QuickActions onNewProjectClick={handleNewProjectClick} />

        {/* Add the New Project Templates Menu here */}
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
              mt: 1,
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

        {/* Project Insights Section */}
        <ProjectInsights
          stats={stats}
          onRefresh={refreshData}
        />

        {/* Upcoming Deadlines Section */}
        <UpcomingDeadlines 
          nextMilestone={stats.nextMilestone}
          tasksDue={stats.tasksDue}
        />
        
        {/* Priority Items Section */}
        <PriorityItems 
          upcomingTasks={upcomingTasks}
          overduePayments={overduePayments}
        />
        
        {/* Recent Projects Section */}
        <RecentProjects projects={projects} />
      </Container>
    </PageLayout>
  );
};

export default Dashboard;
