import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
  IconButton,
  Zoom,
  Stack,
  Tooltip,
  CardActions,
  Button,
  CardHeader,
  Avatar,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  Place as PlaceIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  DateRange as DateRangeIcon,
  DonutLarge as DonutLargeIcon,
  AccountBalance as AccountBalanceIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

// Project object interface that matches how it's used in Projects.tsx
interface Project {
  id?: string;
  name: string;
  status: string;
  dueDate?: string | Date;
  endDate?: Date | null;  // Add endDate as an alternative to dueDate
  budget?: number | { total: number; spent: number; remaining: number };
  teamMembers?: any[];
  location?: string | { address: string; city: string; state: string; zipCode?: string };
}

// Props with individual values
interface ProjectCardPropsWithValues {
  title: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed';
  dueDate: string;
  budget: string;
  team: number;
  projectId: string;
  location: string;
  onClick: () => void;
  index?: number;
  project?: never;
  onMenuClick?: never;
}

// Props with project object
interface ProjectCardPropsWithProject {
  project: Project;
  onClick?: () => void;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void;
  index?: number;
  title?: never;
  progress?: never;
  status?: never;
  dueDate?: never;
  budget?: never;
  team?: never;
  projectId?: never;
  location?: never;
}

// Combined props type
type ProjectCardProps = ProjectCardPropsWithValues | ProjectCardPropsWithProject;

const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // Type guard function to check if we have a project object
  const isProjectProps = (props: ProjectCardProps): props is ProjectCardPropsWithProject => {
    return 'project' in props && props.project !== undefined;
  };

  // Determine if we're using individual props or project object
  const hasProjectObject = isProjectProps(props);

  // Get values from either props approach
  const title = hasProjectObject ? props.project.name : props.title;
  const status = hasProjectObject 
    ? getProjectStatusFromRaw(props.project.status) 
    : props.status;
  const dueDate = hasProjectObject 
    ? (props.project.dueDate ? formatDate(props.project.dueDate) 
      : props.project.endDate ? formatDate(props.project.endDate) 
      : 'No due date') 
    : props.dueDate;
  const budget = hasProjectObject 
    ? (props.project.budget ? formatCurrency(props.project.budget) : 'Not set') 
    : props.budget;
  const team = hasProjectObject 
    ? (props.project.teamMembers?.length || 0) 
    : props.team;
  const location = hasProjectObject 
    ? formatLocation(props.project.location || 'No location') 
    : props.location;
  const index = props.index || 0;
  const progress = hasProjectObject 
    ? calculateProgress(props.project) 
    : props.progress;
  const onClick = hasProjectObject 
    ? props.onClick || (() => {}) 
    : props.onClick;
  const onMenuClick = hasProjectObject ? props.onMenuClick : undefined;

  // Get project initials for avatar
  const getProjectInitials = () => {
    if (!title) return '?';
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'on-track':
        return theme.palette.success.main;
      case 'at-risk':
        return theme.palette.warning.main;
      case 'completed':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getProgressColor = () => {
    if (progress > 75) return theme.palette.success.main;
    if (progress > 40) return theme.palette.primary.main;
    return theme.palette.warning.main;
  };

  const statusColor = getStatusColor();
  const progressColor = getProgressColor();
  const budgetText = String(budget);
  const budgetFontSize =
    budgetText.length > 14
      ? '0.72rem'
      : budgetText.length > 11
        ? '0.8rem'
        : '0.9rem';

  const getStatusIcon = () => {
    switch (status) {
      case 'on-track':
        return <CheckCircleIcon fontSize="small" />;
      case 'at-risk':
        return <WarningIcon fontSize="small" />;
      case 'completed':
        return <StarIcon fontSize="small" />;
      default:
        return <CheckCircleIcon fontSize="small" />;
    }
  };

  // Helper functions for project object format
  function getProjectStatusFromRaw(rawStatus: string): 'on-track' | 'at-risk' | 'completed' {
    const statusMap: Record<string, 'on-track' | 'at-risk' | 'completed'> = {
      'planning': 'on-track',
      'estimate': 'on-track',
      'draft': 'on-track',
      'active': 'on-track',
      'in_progress': 'on-track',
      'on_hold': 'at-risk',
      'cancelled': 'at-risk',
      'completed': 'completed',
    };
    return statusMap[rawStatus.toLowerCase()] || 'on-track';
  }

  function formatDate(date: string | Date): string {
    if (!date) return 'No date';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  function formatCurrency(amount: number | { total: number; spent: number; remaining: number }): string {
    const value = typeof amount === 'number' ? amount : amount.total;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatLocation(location: string | { address: string; city: string; state: string; zipCode?: string }): string {
    if (typeof location === 'string') return location;
    return `${location.city}, ${location.state}`;
  }

  function calculateProgress(project: Project): number {
    if (project.status === 'completed') return 100;
    
    // In a real app, this would be calculated from tasks or milestones
    // For demo purposes, we'll use a deterministic random value based on the project name
    const hash = project.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Math.max(10, Math.min(95, hash % 100));
  }

  return (
    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
      <Card
        elevation={2}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: 5
          },
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader
          avatar={
            <Avatar 
              sx={{ 
                width: 38, 
                height: 38, 
                bgcolor: getStatusColor() 
              }}
            >
              {getProjectInitials()}
            </Avatar>
          }
          action={
            <Box>
              <Chip 
                label={status.replace('-', ' ')} 
                size="small"
                icon={getStatusIcon()}
                sx={{ 
                  backgroundColor: alpha(getStatusColor(), 0.1),
                  color: getStatusColor(),
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  mr: 1,
                  textTransform: 'capitalize'
                }} 
              />
              {onMenuClick && (
                <IconButton 
                  aria-label="more options" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuClick(e);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          }
          title={
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem',
                mb: 0,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Typography>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
              <Tooltip title="Location">
                <PlaceIcon 
                  fontSize="small" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.9rem',
                    mr: 0.5
                  }} 
                />
              </Tooltip>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {location}
              </Typography>
            </Box>
          }
          sx={{ 
            p: 1.5,
            pb: 0.5,
            '.MuiCardHeader-content': { minWidth: 0 } 
          }}
        />
        
        <CardContent 
          sx={{ 
            p: 1.5, 
            pt: 0.5,
            pb: '8px !important',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Project Stats - Compact row of key metrics */}
          <Grid 
            container 
            spacing={1} 
            sx={{ 
              mb: 1.5,
              mt: 0.5
            }}
          >
            {/* Due Date */}
            <Grid item xs={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 0.75, 
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <DateRangeIcon 
                  sx={{ 
                    color: theme.palette.info.main,
                    fontSize: '1.2rem',
                    mb: 0.3
                  }} 
                />
                <Typography 
                  variant="h6" 
                  color="text.primary" 
                  sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}
                >
                  {dueDate.split(',')[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Due Date</Typography>
              </Paper>
            </Grid>
            
            {/* Budget */}
            <Grid item xs={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 0.75, 
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <AccountBalanceIcon 
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontSize: '1.2rem',
                    mb: 0.3
                  }} 
                />
                <Typography 
                  variant="h6" 
                  color="text.primary" 
                  sx={{
                    fontSize: budgetFontSize,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    maxWidth: '100%',
                    minWidth: 0,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {budget}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Budget</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Progress indicator */}
          <Box 
            sx={{ 
              width: '100%', 
              mt: 1,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ flexGrow: 1, mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(progressColor, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: progressColor,
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              fontWeight="bold"
              color={progressColor}
              sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              {progress}%
            </Typography>
          </Box>

          {/* Project metrics visualization */}
          <Stack spacing={1.5} sx={{ mt: 1, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DonutLargeIcon 
                fontSize="small" 
                sx={{ 
                  color: alpha(theme.palette.primary.main, 0.7), 
                  fontSize: '1rem' 
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%'
                }}
              >
                <span>Project Status</span>
                <span style={{ 
                  color: getStatusColor(), 
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {status.replace('-', ' ')}
                </span>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon 
                fontSize="small" 
                sx={{ 
                  color: alpha(theme.palette.secondary.main, 0.7),
                  fontSize: '1rem'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%'
                }}
              >
                <span>Team Members</span>
                <span style={{ fontWeight: 600 }}>{team}</span>
              </Typography>
            </Box>
          </Stack>

          {/* Footer actions */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 'auto',
              pt: 1,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
            }}
          >
            <Button
              size="small"
              endIcon={<ChevronRightIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.3,
                px: 0.8
              }}
            >
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );
};

export default ProjectCard;
