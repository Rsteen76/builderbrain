import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Box,
} from '@mui/material';
import {
  InsertChart as InsertChartIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        cursor: 'pointer',
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
        },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: alpha(color, 0.1),
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={600}>
          {value}
        </Typography>
      </Stack>
    </Paper>
  );
};

interface ProjectInsightsProps {
  stats: {
    activeProjects: number;
    projectsAtRisk: number;
    budgetVariance: number;
    materialsToOrder: number;
  };
  onRefresh: () => void;
}

const ProjectInsights: React.FC<ProjectInsightsProps> = ({ stats, onRefresh }) => {
  const theme = useTheme();
  const navigate = useNavigate();

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
          <IconButton size="small" onClick={onRefresh} color="primary">
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
              ? `$${stats.budgetVariance.toLocaleString()}` 
              : `($${Math.abs(stats.budgetVariance).toLocaleString()})`}
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

export default ProjectInsights; 