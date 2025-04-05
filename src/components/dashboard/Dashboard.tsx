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
  Flag as FlagIcon,
  Error as ErrorIcon,
  Today as TodayIcon,
  AccessTime as AccessTimeIcon,
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

interface Task {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  priority?: 'high' | 'medium' | 'low';
  projectId?: string;
  projectName?: string;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  completed: boolean;
}

interface Material {
  id: string;
  name: string;
  status: string;
  quantity: number;
}

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  description: string;
  projectId?: string;
  projectName?: string;
}

type ExtendedProject = Project & {
  tasks?: ProjectTask[];
  keyMilestones?: Milestone[];
  materials?: Material[];
  payments?: Payment[];
};

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
        transition: 'all 0.2s ease',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}` : `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            '& .MuiAvatar-root': {
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }
          }}
        >
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              transition: 'all 0.2s ease',
            }}
          >
            {icon}
          </Avatar>
          <Typography 
            variant="h6" 
            fontWeight={500}
            sx={{ 
              fontSize: { xs: '0.95rem', sm: '1.1rem' }
            }}
          >
            {title}
          </Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {change && (
            <Stack 
              direction="row" 
              spacing={0.5} 
              alignItems="center"
              sx={{ 
                mt: 0.5,
                '& .MuiChip-root': {
                  height: { xs: 20, sm: 24 },
                  '& .MuiChip-label': {
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }
                }
              }}
            >
              <Chip
                label={change}
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  fontWeight: 500,
                  borderRadius: '4px',
                }}
              />
            </Stack>
          )}
        </Stack>
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const statusColors = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    completed: theme.palette.info.main,
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${statusColors[status]} 0%, ${alpha(statusColors[status], 0.6)} 100%)`,
        }}
      />
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          spacing={2}
          sx={{ mb: { xs: 1.5, sm: 2 } }}
        >
          <Stack spacing={0.5}>
            <Typography 
              variant="h6" 
              component="div" 
              fontWeight={600}
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
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
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                <BusinessIcon fontSize="small" />
                {location}
              </Typography>
            )}
          </Stack>
          <Chip
            label={status.replace('-', ' ')}
            size="small"
            sx={{
              backgroundColor: alpha(statusColors[status], 0.1),
              color: statusColors[status],
              fontWeight: 500,
              borderRadius: '4px',
              textTransform: 'capitalize',
              height: { xs: 20, sm: 24 },
              '& .MuiChip-label': {
                px: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }
            }}
          />
        </Stack>
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 500
              }}
            >
              Progress
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: progress > 75 ? theme.palette.success.main : theme.palette.text.secondary, 
                fontWeight: 500
              }}
            >
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: { xs: 6, sm: 8 },
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              },
            }}
          />
        </Box>
        <Stack 
          direction="row" 
          spacing={2} 
          sx={{ 
            '& .MuiAvatar-root': {
              width: { xs: 24, sm: 28 },
              height: { xs: 24, sm: 28 },
            },
            '& .MuiTypography-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <ScheduleIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: theme.palette.primary.main }} />
            </Avatar>
            <Typography variant="body2">
              Due: {dueDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
              <MoneyIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: theme.palette.success.main }} />
            </Avatar>
            <Typography variant="body2">
              {budget}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
              <GroupIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: theme.palette.warning.main }} />
            </Avatar>
            <Typography variant="body2">
              {team} members
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

interface RecentActivity {
  title: string;
  time: string;
  icon: React.ReactNode;
}

// Define a DashboardTask interface that matches our dashboard display needs
interface DashboardTask {
  id: string;
  title: string; // Changed from 'name'
  dueDate: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  projectName: string;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
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
        
        const projectsData = (await ProjectService.getProjects(user.uid)) as ExtendedProject[];
        setProjects(projectsData);
        
        // Calculate projects at risk
        const atRiskProjects = projectsData.filter(p => {
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
        
        const activeProjects = projectsData.filter(p => 
          p.status === 'in_progress' || p.status === 'planning' || p.status === 'active'
        ).length;
        
        const totalBudget = projectsData.reduce((sum, p) => {
            const budgetValue = typeof p.budget === 'object' && p.budget !== null ? p.budget.total : (p.budget || 0);
            return sum + (typeof budgetValue === 'number' ? budgetValue : 0);
        }, 0);
        
        const uniqueTeamMembers = new Set<string>();
        projectsData.forEach(p => {
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
        
        projectsData.forEach(p => {
          if (p.tasks && Array.isArray(p.tasks)) {
            p.tasks.forEach(t => {
              if (!t.dueDate) return;
              
              // Handle different date formats
              const dueDateObj = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
              
              if (dueDateObj >= today && dueDateObj <= nextWeek && t.status !== 'completed') {
                tasksDue++;
                tasksCollection.push({
                  id: t.id,
                  title: t.title || `Task ${t.id}`, // Use 'title' instead of 'name'
                  dueDate: formatDate(dueDateObj), // Format date as string
                  status: t.status,
                  priority: t.priority, // This handles 'urgent'
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
            return priorityValues[a.priority as keyof typeof priorityValues] - 
                   priorityValues[b.priority as keyof typeof priorityValues];
          }
          
          return dateA - dateB;
        });
        
        setUpcomingTasks(tasksCollection);
        
        // Find next project milestone
        let nextMilestone = { name: 'No upcoming milestones', date: '', projectId: '' };
        let earliestDate = new Date();
        earliestDate.setFullYear(earliestDate.getFullYear() + 1); // Set to a year from now
        
        projectsData.forEach(p => {
          // Try both keyMilestones and milestones
          const milestones = p.keyMilestones || (p as any).milestones || [];
          if (Array.isArray(milestones)) {
            milestones.forEach((m: Milestone) => {
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
        
        projectsData.forEach(p => {
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
          
          // Materials to order
          const materials = (p as any).materials;
          if (materials && Array.isArray(materials)) {
            materialsToOrder += materials.filter((m: Material) => 
              m.status === 'to_order' || m.status === 'backorder'
            ).length;
          }
        });
        
        // Check for overdue payments
        const overduePaymentsList: Payment[] = [];
        projectsData.forEach(p => {
          const payments = (p as any).payments;
          if (payments && Array.isArray(payments)) {
            payments.forEach((payment: Payment) => {
              if (payment.dueDate && payment.status !== 'paid') {
                const paymentDueDate = new Date(payment.dueDate);
                if (paymentDueDate < today) {
                  overduePaymentsList.push({
                    id: payment.id,
                    amount: payment.amount,
                    dueDate: payment.dueDate,
                    description: payment.description,
                    status: payment.status,
                    projectId: p.id,
                    projectName: p.name
                  });
                }
              }
            });
          }
        });
        
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
  }, [user]);
  
  const refreshData = () => {
    if (user?.uid) {
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const projectsData = (await ProjectService.getProjects(user.uid)) as ExtendedProject[];
          setProjects(projectsData);
          
          // Calculate projects at risk
          const atRiskProjects = projectsData.filter(p => {
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
          
          const activeProjects = projectsData.filter(p => 
            p.status === 'in_progress' || p.status === 'planning' || p.status === 'active'
          ).length;
          
          const totalBudget = projectsData.reduce((sum, p) => {
              const budgetValue = typeof p.budget === 'object' && p.budget !== null ? p.budget.total : (p.budget || 0);
              return sum + (typeof budgetValue === 'number' ? budgetValue : 0);
          }, 0);
          
          const uniqueTeamMembers = new Set<string>();
          projectsData.forEach(p => {
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
          
          projectsData.forEach(p => {
            if (p.tasks && Array.isArray(p.tasks)) {
              p.tasks.forEach(t => {
                if (!t.dueDate) return;
                
                // Handle different date formats
                const dueDateObj = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
                
                if (dueDateObj >= today && dueDateObj <= nextWeek && t.status !== 'completed') {
                  tasksDue++;
                  tasksCollection.push({
                    id: t.id,
                    title: t.title || `Task ${t.id}`, // Use 'title' instead of 'name'
                    dueDate: formatDate(dueDateObj), // Format date as string
                    status: t.status,
                    priority: t.priority, // This handles 'urgent'
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
              return priorityValues[a.priority as keyof typeof priorityValues] - 
                     priorityValues[b.priority as keyof typeof priorityValues];
            }
            
            return dateA - dateB;
          });
          
          setUpcomingTasks(tasksCollection);
          
          // Find next project milestone
          let nextMilestone = { name: 'No upcoming milestones', date: '', projectId: '' };
          let earliestDate = new Date();
          earliestDate.setFullYear(earliestDate.getFullYear() + 1); // Set to a year from now
          
          projectsData.forEach(p => {
            // Try both keyMilestones and milestones
            const milestones = p.keyMilestones || (p as any).milestones || [];
            if (Array.isArray(milestones)) {
              milestones.forEach((m: Milestone) => {
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
          
          projectsData.forEach(p => {
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
            
            // Materials to order
            const materials = (p as any).materials;
            if (materials && Array.isArray(materials)) {
              materialsToOrder += materials.filter((m: Material) => 
                m.status === 'to_order' || m.status === 'backorder'
              ).length;
            }
          });
          
          // Check for overdue payments
          const overduePaymentsList: Payment[] = [];
          projectsData.forEach(p => {
            const payments = (p as any).payments;
            if (payments && Array.isArray(payments)) {
              payments.forEach((payment: Payment) => {
                if (payment.dueDate && payment.status !== 'paid') {
                  const paymentDueDate = new Date(payment.dueDate);
                  if (paymentDueDate < today) {
                    overduePaymentsList.push({
                      id: payment.id,
                      amount: payment.amount,
                      dueDate: payment.dueDate,
                      description: payment.description,
                      status: payment.status,
                      projectId: p.id,
                      projectName: p.name
                    });
                  }
                }
              });
            }
          });
          
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
  const formatProjectForDisplay = (project: ExtendedProject) => {
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
      <Box sx={{ mb: 4 }}>
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

  // New function to render project insights  
  const renderProjectInsights = () => {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <InsertChartIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Project Insights
            </Typography>
          </Stack>
          
          <Tooltip title="Refresh Data">
            <IconButton size="small" onClick={refreshData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Projects"
              value={stats.activeProjects}
              icon={<HomeIcon />}
              color={theme.palette.primary.main}
              onClick={() => navigate('/projects?status=active')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Projects at Risk"
              value={stats.projectsAtRisk}
              icon={<WarningIcon />}
              color={theme.palette.error.main}
              onClick={() => navigate('/projects?status=at-risk')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Budget Variance"
              value={stats.budgetVariance > 0 
                ? formatCurrency(stats.budgetVariance) 
                : `(${formatCurrency(Math.abs(stats.budgetVariance))})`}
              icon={stats.budgetVariance > 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
              color={stats.budgetVariance > 0 ? theme.palette.error.main : theme.palette.success.main}
              onClick={() => navigate('/expenses')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Materials to Order"
              value={stats.materialsToOrder}
              icon={<BuildIcon />}
              color={theme.palette.warning.main}
              onClick={() => navigate('/materials')}
            />
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // New function to render upcoming deadlines
  const renderProjectDeadlines = () => {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <CalendarTodayIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Upcoming Deadlines
          </Typography>
        </Stack>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: stats.nextMilestone.projectId ? 'translateY(-4px)' : 'none',
                  boxShadow: stats.nextMilestone.projectId ? '0 6px 12px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                },
                cursor: stats.nextMilestone.projectId ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (stats.nextMilestone.projectId) {
                  navigate(`/projects/${stats.nextMilestone.projectId}`);
                }
              }}
            >
              <CardContent>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={1.5}
                  sx={{ mb: 1.5 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <FlagIcon />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Next Milestone
                  </Typography>
                </Stack>
                
                <Typography 
                  variant="body1" 
                  fontWeight={500}
                  sx={{ mb: 1 }}
                >
                  {stats.nextMilestone.name}
                </Typography>
                
                {stats.nextMilestone.date && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ScheduleIcon 
                      fontSize="small" 
                      sx={{ color: theme.palette.text.secondary }}
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                    >
                      {formatDate(stats.nextMilestone.date)}
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
                },
              }}
              onClick={() => navigate('/tasks')}
            >
              <CardContent>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={1.5}
                  sx={{ mb: 1.5 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <AlarmIcon />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Tasks Due Soon
                  </Typography>
                </Stack>
                
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AssignmentIcon 
                    fontSize="small" 
                    sx={{ color: theme.palette.text.secondary }}
                  />
                  <Typography variant="body1" fontWeight={500}>
                    {stats.tasksDue} tasks due in the next 7 days
                  </Typography>
                </Stack>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}
                >
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ fontWeight: 500, p: 0 }}
                  >
                    View all tasks
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // New function to render priority tasks
  const renderPriorityTasks = () => {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <PriorityHighIcon color="error" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Priority Items
            </Typography>
          </Stack>
          
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                py: 0
              }
            }}
          >
            <Tab label="Tasks" />
            <Tab label="Payments" />
          </Tabs>
        </Stack>
        
        {activeTab === 0 ? (
          upcomingTasks.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingTasks.slice(0, 5).map((task) => (
                    <TableRow 
                      key={task.id}
                      hover
                      onClick={() => navigate(`/projects/${task.projectId}/tasks`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.projectName}</TableCell>
                      <TableCell>{task.dueDate}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={task.priority}
                          sx={{
                            bgcolor: 
                              task.priority === 'urgent'
                                ? alpha(theme.palette.error.dark, 0.1)
                                : task.priority === 'high' 
                                ? alpha(theme.palette.error.main, 0.1)
                                : task.priority === 'medium'
                                ? alpha(theme.palette.warning.main, 0.1)
                                : alpha(theme.palette.success.main, 0.1),
                            color: 
                              task.priority === 'urgent'
                                ? theme.palette.error.dark
                                : task.priority === 'high' 
                                ? theme.palette.error.main
                                : task.priority === 'medium'
                                ? theme.palette.warning.main
                                : theme.palette.success.main,
                            textTransform: 'capitalize',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={task.status.replace('_', ' ')}
                          sx={{
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {upcomingTasks.length > 5 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    size="small" 
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/tasks')}
                  >
                    View all {upcomingTasks.length} tasks
                  </Button>
                </Box>
              )}
            </TableContainer>
          ) : (
            <Alert 
              severity="success"
              sx={{ borderRadius: 2 }}
            >
              No urgent tasks due soon
            </Alert>
          )
        ) : (
          // Payment tab content
          overduePayments.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overduePayments.map((payment) => (
                    <TableRow 
                      key={payment.id}
                      hover
                      onClick={() => navigate(`/projects/${payment.projectId}/finances`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{payment.projectName}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color="error.main" 
                          sx={{ fontWeight: 500 }}
                        >
                          {formatDate(payment.dueDate)} (Overdue)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert 
              severity="success"
              sx={{ borderRadius: 2 }}
            >
              No overdue payments
            </Alert>
          )
        )}
      </Paper>
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
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        {/* Page header */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight={600}
            sx={{ mb: 1, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's an overview of your construction projects.
          </Typography>
        </Box>
        
        {/* Quick Actions Section */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <ConstructionIcon 
              color="primary" 
              sx={{ fontSize: { xs: 24, sm: 28 } }} 
            />
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
            >
              Quick Actions
            </Typography>
          </Stack>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3} lg={2}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<HouseIcon />}
                onClick={() => navigate('/projects/new-residential')}
                sx={{
                  height: 46,
                  justifyContent: 'flex-start',
                  px: 2,
                  borderRadius: 1.5,
                }}
              >
                New Project
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/tasks/new')}
                sx={{
                  height: 46,
                  justifyContent: 'flex-start',
                  px: 2,
                  borderRadius: 1.5,
                  borderWidth: '1.5px',
                  borderColor: alpha(theme.palette.warning.main, 0.5),
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderWidth: '1.5px',
                    borderColor: theme.palette.warning.main,
                    backgroundColor: alpha(theme.palette.warning.main, 0.04),
                  },
                }}
              >
                Add Task
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate('/expenses/new')}
                sx={{
                  height: 46,
                  justifyContent: 'flex-start',
                  px: 2,
                  borderRadius: 1.5,
                  borderWidth: '1.5px',
                  borderColor: alpha(theme.palette.success.main, 0.5),
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderWidth: '1.5px',
                    borderColor: theme.palette.success.main,
                    backgroundColor: alpha(theme.palette.success.main, 0.04),
                  },
                }}
              >
                Log Expense
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3} lg={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => navigate('/team')}
                sx={{
                  height: 46,
                  justifyContent: 'flex-start',
                  px: 2,
                  borderRadius: 1.5,
                  borderWidth: '1.5px',
                  borderColor: alpha(theme.palette.info.main, 0.5),
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderWidth: '1.5px',
                    borderColor: theme.palette.info.main,
                    backgroundColor: alpha(theme.palette.info.main, 0.04),
                  },
                }}
              >
                Team
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Project Insights Section */}
        {renderProjectInsights()}
        
        {/* Upcoming Deadlines Section */}
        {renderProjectDeadlines()}
        
        {/* Priority Tasks Section */}
        {renderPriorityTasks()}

        {/* Recent Projects Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: theme.palette.background.paper,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <HomeIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Projects
              </Typography>
            </Stack>
            <Button
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/projects')}
              sx={{ color: theme.palette.primary.main }}
            >
              View All
            </Button>
          </Stack>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {projects.length === 0 ? (
              <Grid item xs={12}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 2, sm: 3 },
                    '& .MuiAlert-icon': { alignItems: 'center' }
                  }}
                >
                  No projects found. Create a new project to get started.
                </Alert>
              </Grid>
            ) : (
              projects
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 6)
                .map((project) => {
                  const displayProject = formatProjectForDisplay(project);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                      <ProjectCard
                        title={displayProject.title}
                        progress={displayProject.progress}
                        status={displayProject.status}
                        dueDate={displayProject.dueDate}
                        budget={displayProject.budget}
                        team={displayProject.team}
                        projectId={displayProject.projectId}
                        location={displayProject.location}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      />
                    </Grid>
                  );
                })
            )}
          </Grid>
        </Paper>

        {/* Project Templates Section */}
        {renderTemplatesSection()}
      </Container>
    </PageLayout>
  );
};

export default Dashboard; 