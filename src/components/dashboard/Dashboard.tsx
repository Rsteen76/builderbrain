import React from 'react';
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
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  progress,
  status,
  dueDate,
  budget,
  team,
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
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
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

  const stats = [
    {
      title: 'Active Projects',
      value: 12,
      change: '+2 this month',
      icon: <BuildIcon sx={{ color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
      onClick: () => navigate('/projects'),
    },
    {
      title: 'Total Revenue',
      value: '$2.4M',
      change: '+15% vs last month',
      icon: <MoneyIcon sx={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
      onClick: () => navigate('/finance'),
    },
    {
      title: 'Team Members',
      value: 48,
      change: '+3 new hires',
      icon: <GroupIcon sx={{ color: theme.palette.info.main }} />,
      color: theme.palette.info.main,
      onClick: () => navigate('/team'),
    },
    {
      title: 'Tasks Due Today',
      value: 8,
      change: '3 high priority',
      icon: <ScheduleIcon sx={{ color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
      onClick: () => navigate('/tasks'),
    },
  ];

  const projects = [
    {
      title: 'Office Building Renovation',
      progress: 75,
      status: 'on-track' as const,
      dueDate: 'Dec 15, 2024',
      budget: '$1.2M',
      team: 12,
    },
    {
      title: 'Residential Complex',
      progress: 45,
      status: 'at-risk' as const,
      dueDate: 'Mar 30, 2025',
      budget: '$2.8M',
      team: 18,
    },
    {
      title: 'Shopping Mall Extension',
      progress: 90,
      status: 'completed' as const,
      dueDate: 'Nov 30, 2024',
      budget: '$1.5M',
      team: 15,
    },
  ];

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
            <IconButton>
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

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
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
            <Grid container spacing={3}>
              {projects.map((project, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <ProjectCard {...project} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
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
                      Task "Install HVAC System" completed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      2 hours ago
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Upcoming Milestones
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
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
                      Foundation Pour - Office Building
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due in 3 days
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 