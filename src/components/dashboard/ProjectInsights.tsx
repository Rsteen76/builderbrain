import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Stack,
  Zoom,
  Fade,
  Chip,
  Paper,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

interface ProjectInsightsProps {
  stats: {
    activeProjects: number;
    totalBudget: number;
    teamMembers: number;
    tasksDue: number;
    projectsAtRisk: number;
    nextMilestone: { name: string; date: string; projectId: string };
    budgetVariance: number;
    materialsToOrder: number;
  };
  onRefresh?: () => void | Promise<void>;
}

interface InsightCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  positiveChangeIsGood?: boolean;
  suffix?: string;
  index: number;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  onClick,
  positiveChangeIsGood = true,
  suffix,
  index
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  const isPositiveChange = change && change > 0;
  const isChangeGood = isPositiveChange ? positiveChangeIsGood : !positiveChangeIsGood;
  const changeColor = isChangeGood ? theme.palette.success.main : theme.palette.error.main;
  
  const formattedChange = change 
    ? `${isPositiveChange ? '+' : ''}${change}${suffix || '%'}`
    : undefined;
  const displayValue = String(value);
  const valueFontSize =
    displayValue.length > 14
      ? '0.7rem'
      : displayValue.length > 11
        ? '0.78rem'
        : displayValue.length > 8
          ? '1.05rem'
          : '1.45rem';
    
  return (
    <Zoom in={true} style={{ transformOrigin: '0 0 0' }} timeout={500 + index * 100}>
      <Card
        elevation={isHovered ? 2 : 0}
        sx={{
          p: 1.25,
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: isHovered 
            ? alpha(color, 0.5) 
            : alpha(theme.palette.divider, 0.08),
          background: isHovered
            ? `linear-gradient(135deg, ${alpha(color, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
            : theme.palette.background.paper,
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-4px)' : 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isHovered ? '3px' : '0',
            background: color,
            transition: 'height 0.2s ease',
          },
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.25
          }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: alpha(color, 0.12),
                color: color,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 18 } })}
            </Box>
            
            {formattedChange && (
              <Chip
                icon={isPositiveChange 
                  ? <ArrowUpwardIcon fontSize="small" /> 
                  : <ArrowDownwardIcon fontSize="small" />
                }
                label={formattedChange}
                size="small"
                sx={{
                  backgroundColor: alpha(changeColor, 0.15),
                  color: changeColor,
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  height: 20,
                  maxWidth: 54,
                  '.MuiChip-icon': {
                    fontSize: '0.65rem',
                    color: 'inherit',
                  }
                }}
              />
            )}
          </Box>
          
          <Typography 
            variant="h4" 
            component="div" 
            sx={{
              fontSize: valueFontSize,
              fontWeight: 700,
              mb: 0.25,
              color: isHovered ? color : theme.palette.text.primary,
              transition: 'color 0.2s ease',
              lineHeight: 1.1,
              maxWidth: '100%',
              minWidth: 0,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          
          {isHovered && onClick && (
            <Fade in timeout={200}>
              <Box 
                sx={{ 
                  position: 'absolute',
                  right: -8,
                  bottom: -8,
                  opacity: 0.15,
                  transform: 'rotate(-15deg)',
                }}
              >
                {icon && React.cloneElement(icon as React.ReactElement, {
                  sx: { fontSize: 52 }
                })}
              </Box>
            </Fade>
          )}
        </Box>
      </Card>
    </Zoom>
  );
};

const ProjectInsights: React.FC<ProjectInsightsProps> = ({ stats, onRefresh }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const insights = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: <AssessmentIcon />,
      color: theme.palette.primary.main,
      onClick: () => navigate('/projects?status=active'),
    },
    {
      title: 'Total Budget',
      value: formatCurrency(stats.totalBudget),
      icon: <MoneyIcon />,
      color: theme.palette.success.main,
      onClick: () => navigate('/expenses'),
    },
    {
      title: 'Tasks Due Soon',
      value: stats.tasksDue,
      icon: <AssignmentIcon />,
      color: stats.tasksDue > 10 ? theme.palette.warning.main : theme.palette.secondary.main,
      onClick: () => navigate('/tasks?filter=upcoming'),
    },
    {
      title: 'Next Milestone',
      value: stats.nextMilestone?.date 
        ? new Date(stats.nextMilestone.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'None',
      icon: <ScheduleIcon />,
      color: theme.palette.secondary.main,
      onClick: stats.nextMilestone?.projectId 
        ? () => navigate(`/projects/${stats.nextMilestone.projectId}`)
        : undefined,
    },
    {
      title: 'Budget Variance',
      value: formatCurrency(Math.abs(stats.budgetVariance)),
      icon: stats.budgetVariance >= 0 ? <TrendingUpIcon /> : <ArrowDownwardIcon />,
      color: stats.budgetVariance >= 0 ? theme.palette.success.main : theme.palette.error.main,
      onClick: () => navigate('/expenses'),
    },
    {
      title: 'Materials to Order',
      value: stats.materialsToOrder || 0,
      icon: <ShippingIcon />,
      color: stats.materialsToOrder > 10 ? theme.palette.warning.main : theme.palette.info.main,
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 1.75 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            px: 0.5,
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                }}
              >
                <AssessmentIcon 
                  color="secondary" 
                  sx={{ fontSize: 20 }} 
                />
              </Box>
              
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ fontSize: '1rem' }}
              >
                Project Insights
              </Typography>
            </Stack>
            
            <Tooltip title="Refresh data" arrow>
              <IconButton 
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'rotate(30deg)' },
                }}
              >
                <RefreshIcon 
                  fontSize="small" 
                  sx={{ 
                    fontSize: 18,
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    }
                  }} 
                />
              </IconButton>
            </Tooltip>
          </Box>

          {isRefreshing && (
            <Box sx={{ width: '100%', mb: 1.5 }}>
              <LinearProgress sx={{ height: 3, borderRadius: 1.5 }} />
            </Box>
          )}

          <Grid container spacing={1.5}>
            {insights.map((insight, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                <InsightCard {...insight} index={index} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectInsights;
