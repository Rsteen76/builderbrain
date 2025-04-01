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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageLayout from '../layout/PageLayout';

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

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalBudget: 0,
    teamMembers: 0,
    tasksDue: 0
  });

  // Sample recent activity data
  const recentActivity: RecentActivity[] = [
    {
      title: "New project created",
      time: "2 hours ago",
      icon: <BuildIcon />
    },
    {
      title: "Task completed",
      time: "4 hours ago",
      icon: <CheckCircleIcon />
    },
    {
      title: "Budget updated",
      time: "1 day ago",
      icon: <MoneyIcon />
    },
    {
      title: "Team member added",
      time: "2 days ago",
      icon: <GroupIcon />
    },
    {
      title: "Project status changed",
      time: "3 days ago",
      icon: <AssessmentIcon />
    }
  ];

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
        
        const projectsData: Project[] = await ProjectService.getProjects(user.uid);
        setProjects(projectsData);
        
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
        projectsData.forEach(p => {
          if (p.tasks && Array.isArray(p.tasks)) {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            tasksDue += p.tasks.filter(t => {
              if (!t.dueDate) return false;
              const dueDate = new Date(t.dueDate);
              return dueDate >= today && dueDate <= nextWeek && t.status !== 'completed';
            }).length;
          }
        });
        
        setStats({
          activeProjects,
          totalBudget,
          teamMembers: uniqueTeamMembers.size,
          tasksDue
        });
        
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
          
          const projectsData: Project[] = await ProjectService.getProjects(user.uid);
          setProjects(projectsData);
          
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
          projectsData.forEach(p => {
            if (p.tasks && Array.isArray(p.tasks)) {
              const today = new Date();
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);
              
              tasksDue += p.tasks.filter(t => {
                if (!t.dueDate) return false;
                const dueDate = new Date(t.dueDate);
                return dueDate >= today && dueDate <= nextWeek && t.status !== 'completed';
              }).length;
            }
          });
          
          setStats({
            activeProjects,
            totalBudget,
            teamMembers: uniqueTeamMembers.size,
            tasksDue
          });
          
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
  const formatProjectForDisplay = (project: Project) => {
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
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Stats Grid */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Active Projects"
                value={stats.activeProjects}
                icon={<HomeIcon />}
                color={theme.palette.primary.main}
                onClick={() => navigate('/projects')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Total Budget"
                value={formatCurrency(stats.totalBudget)}
                icon={<MoneyIcon />}
                color={theme.palette.success.main}
                onClick={() => navigate('/expenses')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Team Members"
                value={stats.teamMembers}
                icon={<GroupIcon />}
                color={theme.palette.warning.main}
                onClick={() => navigate('/settings/team')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Tasks Due Soon"
                value={stats.tasksDue}
                change={stats.tasksDue > 3 ? '+' + (stats.tasksDue - 3) : '0'}
                icon={<AssignmentIcon />}
                color={theme.palette.error.main}
                onClick={() => navigate('/tasks')}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: theme.palette.background.paper,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Activity
            </Typography>
            <List sx={{ p: 0 }}>
              {recentActivity.map((activity, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderBottom: index < recentActivity.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        width: 32,
                        height: 32,
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={activity.title}
                    secondary={activity.time}
                    primaryTypographyProps={{
                      sx: { fontSize: '0.875rem', fontWeight: 500 }
                    }}
                    secondaryTypographyProps={{
                      sx: { fontSize: '0.75rem', color: 'text.secondary' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Projects */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
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
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Projects
              </Typography>
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
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default Dashboard; 