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
  ClearAll as ClearAllIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Business as CommercialIcon,
  Landscape as LandscapeIcon,
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
import { Project, Task as ProjectTask } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageLayout from '../layout/PageLayout';
import QuickActions from './QuickActions';
import ProjectInsights from './ProjectInsights';
import UpcomingDeadlines from './UpcomingDeadlines';
import PriorityItems from './PriorityItems';
import RecentProjects from './RecentProjects';

// Define interfaces for our dashboard-specific types
interface DashboardTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  projectId: string;
  projectName: string;
}

interface DashboardProject {
  id: string;
  name: string;
  status: string;
  endDate: string;
  budget: number | { total: number; spent: number; remaining: number };
  team: string[];
  location: string | { address: string; city: string; state: string };
  updatedAt: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
  }>;
  keyMilestones?: Array<{
    id: string;
    name: string;
    date: string;
    completed: boolean;
  }>;
  materials?: Array<{
    id: string;
    name: string;
    status: string;
    quantity: number;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    dueDate: string;
    description: string;
    status: string;
    projectId: string;
    projectName: string;
  }>;
}

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: string;
  projectId: string;
  projectName: string;
}

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

interface ProjectCardProps {
  title: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed';
  dueDate: string;
  budget: string;
  team: number;
  projectId?: string;
  onClick?: () => void;
  location?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  progress,
  status,
  dueDate,
  budget,
  team,
  projectId,
  onClick,
  location
}) => {
  const theme = useTheme();
  
  const statusColors = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    completed: theme.palette.info.main,
  };

  const statusBg = {
    'on-track': alpha(theme.palette.success.main, 0.12),
    'at-risk': alpha(theme.palette.warning.main, 0.12),
    completed: alpha(theme.palette.info.main, 0.12),
  };

  const getProgressColor = () => {
    if (progress > 75) return theme.palette.success.main;
    if (progress > 40) return theme.palette.info.main;
    return theme.palette.warning.main;
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
        },
      }}
      onClick={onClick}
    >
      <Box 
        sx={{ 
          p: 2,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            position: 'absolute',
            top: 10,
            right: 16,
            borderRadius: 1.5,
            py: 0.5,
            px: 1,
            backgroundColor: statusBg[status],
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: statusColors[status],
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {status === 'on-track' && <CheckCircleIcon sx={{ fontSize: '0.875rem' }} />}
            {status === 'at-risk' && <WarningIcon sx={{ fontSize: '0.875rem' }} />}
            {status === 'completed' && <StarIcon sx={{ fontSize: '0.875rem' }} />}
            {status.replace('-', ' ')}
          </Typography>
        </Box>
        
        <Typography 
          variant="subtitle1" 
          component="div" 
          fontWeight={600}
          sx={{ 
            mr: 7,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        
        {location && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              mb: 1,
              fontSize: '0.75rem'
            }}
          >
            <PlaceIcon fontSize="inherit" />
            {location}
          </Typography>
        )}
        
        <Box sx={{ my: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography 
              variant="body2" 
              color="text.primary" 
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            >
              Progress
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getProgressColor(),
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {progress}%
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.divider, 0.1) }}>
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                borderRadius: 3,
                width: `${progress}%`,
                background: getProgressColor(),
                transition: 'width 1s ease-in-out',
              }}
            />
          </Box>
        </Box>

        <Box 
          sx={{
            mt: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'flex-start'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary }} />
            <Typography 
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ fontSize: '0.75rem' }}
            >
              {dueDate}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon sx={{ fontSize: '0.875rem', color: theme.palette.success.main }} />
            <Typography 
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ fontSize: '0.75rem' }}
            >
              {budget}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon sx={{ fontSize: '0.875rem', color: theme.palette.warning.main }} />
            <Typography 
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ fontSize: '0.75rem' }}
            >
              {team} members
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

interface RecentActivity {
  title: string;
  time: string;
  icon: React.ReactNode;
}

// Helper function to convert Project to DashboardProject
const convertToDashboardProject = (project: Project): DashboardProject => {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    endDate: project.endDate instanceof Date ? project.endDate.toISOString() : 
             typeof project.endDate === 'string' ? project.endDate : '',
    budget: project.budget,
    team: project.team || [],
    location: project.location,
    updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : 
               typeof project.updatedAt === 'string' ? project.updatedAt : new Date().toISOString(),
    tasks: project.tasks?.map(task => ({
      id: task.id,
      title: task.title || `Task ${task.id}`,
      status: task.status,
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : 
               typeof task.dueDate === 'string' ? task.dueDate : '',
      priority: task.priority || 'medium'
    })) || [],
    keyMilestones: project.keyMilestones?.map(milestone => ({
      id: `milestone-${milestone.name}`, // Generate an ID since it doesn't exist in the original type
      name: milestone.name,
      date: milestone.date instanceof Date ? milestone.date.toISOString() : 
            typeof milestone.date === 'string' ? milestone.date : '',
      completed: false // Default to false since it doesn't exist in the original type
    })),
    // Initialize with empty arrays since these don't exist in the Project type
    materials: [],
    payments: []
  };
};

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
    activeProjects: 0,
    totalBudget: 0,
    teamMembers: 0,
    tasksDue: 0,
    projectsAtRisk: 0,
    nextMilestone: { name: '', date: '', projectId: '' },
    budgetVariance: 0,
    materialsToOrder: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) {
        setError("User not authenticated. Cannot load dashboard data.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        const projectsData = await ProjectService.getProjects(user.uid);
        const dashboardProjects = projectsData.map(convertToDashboardProject);
        setProjects(dashboardProjects);
        
        // Calculate projects at risk
        const atRiskProjects = dashboardProjects.filter(p => {
          if (p.status === 'on_hold' || p.status === 'cancelled') return true;
          
          if (p.endDate) {
            const endDate = new Date(p.endDate);
            const today = new Date();
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(today.getDate() + 7);
            
            if (endDate < today) return true; // Past due date
            if (endDate <= oneWeekFromNow) return true; // Due soon
          }
          
          // Check if budget is at risk - safely handle budget types
          if (p.budget && typeof p.budget === 'object') {
            const totalBudget = p.budget.total || 0;
            const spentBudget = p.budget.spent || 0;
            if (spentBudget > totalBudget * 0.9) {
              return true;
            }
          }
          
          return false;
        }).length;
        
        const activeProjects = dashboardProjects.filter(p => 
          p.status === 'in_progress' || p.status === 'planning' || p.status === 'active'
        ).length;
        
        const totalBudget = dashboardProjects.reduce((sum, p) => {
            const budgetValue = typeof p.budget === 'object' && p.budget !== null ? p.budget.total : (p.budget || 0);
            return sum + (typeof budgetValue === 'number' ? budgetValue : 0);
        }, 0);
        
        const uniqueTeamMembers = new Set<string>();
        dashboardProjects.forEach(p => {
          if (p.team && Array.isArray(p.team)) {
            p.team.forEach(member => uniqueTeamMembers.add(member));
          }
        });
        
        // Calculate tasks due in the next week
        let tasksDue = 0;
        const tasksCollection: DashboardTask[] = [];
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        dashboardProjects.forEach(p => {
          if (p.tasks && Array.isArray(p.tasks)) {
            p.tasks.forEach(t => {
              if (!t.dueDate) return;
              
              const dueDateObj = new Date(t.dueDate);
              
              if (dueDateObj >= today && dueDateObj <= nextWeek && t.status !== 'completed') {
                tasksDue++;
                tasksCollection.push({
                  id: t.id,
                  title: t.title,
                  dueDate: formatDate(dueDateObj),
                  status: t.status,
                  priority: t.priority,
                  projectId: p.id,
                  projectName: p.name
                });
              }
            });
          }
        });
        
        // Sort upcoming tasks by date and priority
        tasksCollection.sort((a, b) => {
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          
          if (dateA === dateB) {
            const priorityValues = { urgent: 0, high: 1, medium: 2, low: 3 };
            return priorityValues[a.priority] - priorityValues[b.priority];
          }
          
          return dateA - dateB;
        });
        
        setUpcomingTasks(tasksCollection);
        
        // Find next project milestone
        let nextMilestone = { name: 'No upcoming milestones', date: '', projectId: '' };
        let earliestDate = new Date();
        earliestDate.setFullYear(earliestDate.getFullYear() + 1); // Set to a year from now
        
        dashboardProjects.forEach(p => {
          // Try both keyMilestones and milestones
          const milestones = p.keyMilestones || [];
          if (Array.isArray(milestones)) {
            milestones.forEach(m => {
              if (!m.completed && m.date) {
                const milestoneDate = new Date(m.date);
                if (milestoneDate >= today && milestoneDate < earliestDate) {
                  earliestDate = milestoneDate;
                  nextMilestone = {
                    name: m.name,
                    date: m.date,
                    projectId: p.id
                  };
                }
              }
            });
          }
        });
        
        // Calculate budget variance and materials to order
        let totalBudgetVariance = 0;
        let materialsToOrder = 0;
        
        dashboardProjects.forEach(p => {
          // Budget variance - safely handle different budget types
          if (p.budget && typeof p.budget === 'object') {
            const actual = p.budget.spent || 0;
            // Calculate planned as total - remaining if planned is not available
            let planned = 0;
            if ('planned' in p.budget) {
              planned = (p.budget as any).planned || 0;
            } else {
              planned = p.budget.total - (p.budget.remaining || 0);
            }
            totalBudgetVariance += (actual - planned);
          }
          
          // Materials to order - since we don't have real materials data, set to 0
          materialsToOrder = 0;
        });
        
        // Check for overdue payments - since we don't have real payments data, set to empty array
        const overduePaymentsList: Payment[] = [];
        
        setOverduePayments(overduePaymentsList);
        
        setStats({
          activeProjects,
          totalBudget,
          teamMembers: uniqueTeamMembers.size,
          tasksDue,
          projectsAtRisk: atRiskProjects,
          nextMilestone,
          budgetVariance: totalBudgetVariance,
          materialsToOrder
        });
        
        // This part remains unchanged - activity data
        try {
          setRecentActivity([]);
        } catch (activityErr) {
          console.log('No activity data found:', activityErr);
          setRecentActivity([]);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.uid]);
  
  const refreshData = () => {
    if (user?.uid) {
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const projectsData = await ProjectService.getProjects(user.uid);
          const dashboardProjects = projectsData.map(convertToDashboardProject);
          setProjects(dashboardProjects);
          
          // Calculate projects at risk
          const atRiskProjects = dashboardProjects.filter(p => {
            if (p.status === 'on_hold' || p.status === 'cancelled') return true;
            
            if (p.endDate) {
              const endDate = new Date(p.endDate);
              const today = new Date();
              const oneWeekFromNow = new Date();
              oneWeekFromNow.setDate(today.getDate() + 7);
              
              if (endDate < today) return true; // Past due date
              if (endDate <= oneWeekFromNow) return true; // Due soon
            }
            
            // Check if budget is at risk - safely handle budget types
            if (p.budget && typeof p.budget === 'object') {
              const totalBudget = p.budget.total || 0;
              const spentBudget = p.budget.spent || 0;
              if (spentBudget > totalBudget * 0.9) {
                return true;
              }
            }
            
            return false;
          }).length;
          
          const activeProjects = dashboardProjects.filter(p => 
            p.status === 'in_progress' || p.status === 'planning' || p.status === 'active'
          ).length;
          
          const totalBudget = dashboardProjects.reduce((sum, p) => {
              const budgetValue = typeof p.budget === 'object' && p.budget !== null ? p.budget.total : (p.budget || 0);
              return sum + (typeof budgetValue === 'number' ? budgetValue : 0);
          }, 0);
          
          const uniqueTeamMembers = new Set<string>();
          dashboardProjects.forEach(p => {
            if (p.team && Array.isArray(p.team)) {
              p.team.forEach(member => uniqueTeamMembers.add(member));
            }
          });
          
          // Calculate tasks due in the next week
          let tasksDue = 0;
          const tasksCollection: DashboardTask[] = [];
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          
          dashboardProjects.forEach(p => {
            if (p.tasks && Array.isArray(p.tasks)) {
              p.tasks.forEach(t => {
                if (!t.dueDate) return;
                
                const dueDateObj = new Date(t.dueDate);
                
                if (dueDateObj >= today && dueDateObj <= nextWeek && t.status !== 'completed') {
                  tasksDue++;
                  tasksCollection.push({
                    id: t.id,
                    title: t.title,
                    dueDate: formatDate(dueDateObj),
                    status: t.status,
                    priority: t.priority,
                    projectId: p.id,
                    projectName: p.name
                  });
                }
              });
            }
          });
          
          // Sort upcoming tasks by date and priority
          tasksCollection.sort((a, b) => {
            const dateA = new Date(a.dueDate).getTime();
            const dateB = new Date(b.dueDate).getTime();
            
            if (dateA === dateB) {
              const priorityValues = { urgent: 0, high: 1, medium: 2, low: 3 };
              return priorityValues[a.priority] - priorityValues[b.priority];
            }
            
            return dateA - dateB;
          });
          
          setUpcomingTasks(tasksCollection);
          
          // Find next project milestone
          let nextMilestone = { name: 'No upcoming milestones', date: '', projectId: '' };
          let earliestDate = new Date();
          earliestDate.setFullYear(earliestDate.getFullYear() + 1); // Set to a year from now
          
          dashboardProjects.forEach(p => {
            // Try both keyMilestones and milestones
            const milestones = p.keyMilestones || [];
            if (Array.isArray(milestones)) {
              milestones.forEach(m => {
                if (!m.completed && m.date) {
                  const milestoneDate = new Date(m.date);
                  if (milestoneDate >= today && milestoneDate < earliestDate) {
                    earliestDate = milestoneDate;
                    nextMilestone = {
                      name: m.name,
                      date: m.date,
                      projectId: p.id
                    };
                  }
                }
              });
            }
          });
          
          // Calculate budget variance and materials to order
          let totalBudgetVariance = 0;
          let materialsToOrder = 0;
          
          dashboardProjects.forEach(p => {
            // Budget variance - safely handle different budget types
            if (p.budget && typeof p.budget === 'object') {
              const actual = p.budget.spent || 0;
              // Calculate planned as total - remaining if planned is not available
              let planned = 0;
              if ('planned' in p.budget) {
                planned = (p.budget as any).planned || 0;
              } else {
                planned = p.budget.total - (p.budget.remaining || 0);
              }
              totalBudgetVariance += (actual - planned);
            }
            
            // Materials to order - since we don't have real materials data, set to 0
            materialsToOrder = 0;
          });
          
          // Check for overdue payments - since we don't have real payments data, set to empty array
          const overduePaymentsList: Payment[] = [];
          
          setOverduePayments(overduePaymentsList);
          
          setStats({
            activeProjects,
            totalBudget,
            teamMembers: uniqueTeamMembers.size,
            tasksDue,
            projectsAtRisk: atRiskProjects,
            nextMilestone,
            budgetVariance: totalBudgetVariance,
            materialsToOrder
          });
          
          // Reset activity data to empty
          setRecentActivity([]);
          
        } catch (err) {
          console.error('Error refreshing dashboard data:', err);
          setError('Failed to refresh dashboard data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchDashboardData();
    }
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

  // Add a templates section to the dashboard
  const renderTemplatesSection = () => {
    const templates = [
      {
        id: 'residential',
        name: 'Residential Construction',
        icon: <HouseIcon fontSize="large" />,
        description: 'Single-family homes, multi-family units, renovations, and additions.',
        route: '/projects/new-residential',
        color: theme.palette.primary.main,
      },
      {
        id: 'commercial',
        name: 'Commercial Building',
        icon: <CommercialIcon fontSize="large" />,
        description: 'Office buildings, retail spaces, warehouses, and industrial facilities.',
        route: '/projects/new-custom',
        params: { template: 'commercial' },
        color: theme.palette.secondary.main,
      },
      {
        id: 'renovation',
        name: 'Renovation Project',
        icon: <ConstructionIcon fontSize="large" />,
        description: 'Remodeling existing structures, tenant improvements, and historic renovations.',
        route: '/projects/new-custom',
        params: { template: 'renovation' },
        color: '#ff9800', // Orange
      },
      {
        id: 'landscaping',
        name: 'Landscaping Project',
        icon: <LandscapeIcon fontSize="large" />,
        description: 'Outdoor spaces, hardscaping, softscaping, and landscape construction.',
        route: '/projects/new-custom',
        params: { template: 'landscaping' },
        color: '#4caf50', // Green
      },
      {
        id: 'custom',
        name: 'Custom Project',
        icon: <BusinessIcon fontSize="large" />,
        description: 'Create your own project structure with custom phases tailored to your specific needs.',
        route: '/projects/new-custom',
        color: '#9c27b0', // Purple
      },
    ];

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Project Templates
          </Typography>
          <Button 
            component={Link} 
            to="/projects/new-custom"
            variant="outlined" 
            startIcon={<AddCircleOutlineIcon />}
          >
            New Custom Project
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (template.params) {
                    navigate(template.route, { state: template.params });
                  } else {
                    navigate(template.route);
                  }
                }}
              >
                <Box 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    color: 'white',
                    bgcolor: template.color,
                  }}
                >
                  {template.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" fullWidth>
                    Start Project
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
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
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Project Insights Section */}
        <ProjectInsights 
          stats={stats}
          onRefresh={() => {
            // Trigger a refresh of the dashboard data
            if (user?.uid) {
              const fetchDashboardData = async () => {
                try {
                  setLoading(true);
                  setError(null);
                  
                  const projectsData = await ProjectService.getProjects(user.uid);
                  const dashboardProjects = projectsData.map(convertToDashboardProject);
                  setProjects(dashboardProjects);
                  
                  // Recalculate all stats...
                  // (Same calculation logic as in useEffect)
                  
                } catch (err) {
                  console.error('Error refreshing dashboard data:', err);
                  setError('Failed to refresh dashboard data. Please try again.');
                } finally {
                  setLoading(false);
                }
              };
              
              fetchDashboardData();
            }
          }}
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

        {/* Project Templates Section */}
        {renderTemplatesSection()}
      </Container>
    </PageLayout>
  );
};

export default Dashboard;