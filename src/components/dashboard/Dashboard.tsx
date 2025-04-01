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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';

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
  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: alpha(color, 0.1),
              borderRadius: '50%',
              p: 1,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {change && (
          <Typography
            variant="body2"
            color={change.startsWith('+') ? 'success.main' : 'error.main'}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <TrendingUpIcon
              sx={{
                transform: change.startsWith('+') ? 'none' : 'rotate(180deg)',
                fontSize: 16,
              }}
            />
            {change}
          </Typography>
        )}
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
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  progress,
  status,
  dueDate,
  budget,
  team,
  projectId,
  onClick
}) => {
  const theme = useTheme();
  const statusColors = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    completed: theme.palette.info.main,
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Chip
            label={status.replace('-', ' ')}
            size="small"
            sx={{
              backgroundColor: alpha(statusColors[status], 0.1),
              color: statusColors[status],
            }}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
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
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {dueDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {budget}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {team} members
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalBudget: 0,
    teamMembers: 0,
    tasksDue: 0
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
            p.team.forEach((member: string) => uniqueTeamMembers.add(member));
          }
        });
        
        const tasksDue = Math.min(5, Math.floor(activeProjects * 1.5));
        
        setStats({
          activeProjects,
          totalBudget,
          teamMembers: uniqueTeamMembers.size,
          tasksDue
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
        fetchDashboardData();
    } else {
        setLoading(false); 
        setError('Waiting for user authentication...');
    }

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
                            p.team.forEach((member: string) => uniqueTeamMembers.add(member));
                        }
                    });
                    const tasksDue = Math.min(5, Math.floor(activeProjects * 1.5));
                    setStats({
                        activeProjects,
                        totalBudget,
                        teamMembers: uniqueTeamMembers.size,
                        tasksDue
                    });
                } catch (err) {
                    console.error('Error refreshing dashboard data:', err);
                    setError('Failed to refresh dashboard data');
                } finally {
                    setLoading(false);
                }
          };
          fetchDashboardData();
      } else {
          setError("Cannot refresh: User not authenticated.");
      }
  };

  const dashboardStats = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      change: stats.activeProjects > 0 ? `${stats.activeProjects} in progress` : 'No active projects',
      icon: <BuildIcon sx={{ color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
      onClick: () => navigate('/projects'),
    },
    {
      title: 'Total Budget',
      value: `$${stats.totalBudget.toLocaleString()}`,
      change: '+15% vs last month',
      icon: <MoneyIcon sx={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
      onClick: () => navigate('/finance'),
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      change: stats.teamMembers > 0 ? `${stats.teamMembers} members` : 'No team members',
      icon: <GroupIcon sx={{ color: theme.palette.info.main }} />,
      color: theme.palette.info.main,
      onClick: () => navigate('/team'),
    },
    {
      title: 'Tasks Due Soon',
      value: stats.tasksDue,
      change: stats.tasksDue > 0 ? `${Math.ceil(stats.tasksDue/2)} high priority` : 'No tasks due',
      icon: <ScheduleIcon sx={{ color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
      onClick: () => navigate('/tasks'),
    },
  ];

  const formatProjectForDisplay = (project: Project) => {
    let status: 'on-track' | 'at-risk' | 'completed' = 'on-track';
    if (project.status === 'completed') {
      status = 'completed';
    } else if (project.endDate && new Date(project.endDate) < new Date()) {
      status = 'at-risk';
    } else if (project.status === 'on_hold' || project.status === 'cancelled') {
        status = 'at-risk';
    }
    
    const progress = project.status === 'completed' ? 100 : Math.floor(Math.random() * 80) + 10;

    const budgetDisplay = typeof project.budget === 'object' && project.budget !== null 
                          ? formatCurrency(project.budget.total)
                          : formatCurrency(project.budget || 0);

    return {
      id: project.id,
      title: project.name,
      progress: progress,
      status: status,
      dueDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A',
      budget: budgetDisplay,
      team: project.team?.length || 0,
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your projects.
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={refreshData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton>
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {dashboardStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Active Projects</Typography>
              <Chip
                label="View All"
                onClick={() => navigate('/projects')}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : projects.length > 0 ? (
              <Grid container spacing={3}>
                {projects.slice(0, 3).map((project, index) => (
                  <Grid item xs={12} md={4} key={project.id || index}>
                    <ProjectCard 
                        {...formatProjectForDisplay(project)} 
                        onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No projects found. Create your first project to get started.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Recent Activity
            </Typography>
            {projects.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {projects.slice(0, 3).map((project, index) => (
                  <Box
                    key={project.id || index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Box
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                      }}
                    >
                      <CheckCircleIcon
                        sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        Project "{project.name}" {project.status === 'completed' ? 'completed' : 'updated'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(project.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No recent activity to display.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Upcoming Milestones
            </Typography>
            {projects.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {projects.slice(0, 3).map((project, index) => {
                  const milestone = project.keyMilestones && project.keyMilestones.length > 0 
                    ? project.keyMilestones[0] 
                    : { name: `${project.name} completion`, date: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '' };
                  
                  const daysUntil = milestone.date 
                    ? Math.ceil((new Date(milestone.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                    
                  return (
                    <Box
                      key={project.id || index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Box
                        sx={{
                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                          borderRadius: '50%',
                          p: 1,
                          display: 'flex',
                        }}
                      >
                        <WarningIcon
                          sx={{ color: theme.palette.warning.main, fontSize: 20 }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {milestone.name} - {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {daysUntil > 0 
                            ? `Due in ${daysUntil} days` 
                            : daysUntil === 0 
                              ? 'Due today' 
                              : `Overdue by ${Math.abs(daysUntil)} days`}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No upcoming milestones.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 