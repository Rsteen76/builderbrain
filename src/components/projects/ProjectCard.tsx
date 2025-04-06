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
} from '@mui/icons-material';

// Project object interface that matches how it's used in Projects.tsx
interface Project {
  id?: string;
  name: string;
  status: string;
  dueDate?: string | Date;
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
    ? (props.project.dueDate ? formatDate(props.project.dueDate) : 'No due date') 
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

  // Generate a themed gradient background
  const generateBackground = () => {
    const colors = [
      [theme.palette.primary.main, theme.palette.secondary.main],
      [theme.palette.success.main, theme.palette.info.main],
      [theme.palette.warning.main, theme.palette.error.main],
      [theme.palette.secondary.main, theme.palette.info.main],
      [theme.palette.info.main, theme.palette.success.main],
    ];
    const colorSet = colors[index % colors.length];
    return `linear-gradient(135deg, ${alpha(colorSet[0], 0.8)} 0%, ${alpha(colorSet[1], 0.8)} 100%)`;
  };

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
    return `${location.address}, ${location.city}`;
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
        elevation={isHovered ? 4 : 1}
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 3,
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-4px)' : 'none',
          boxShadow: isHovered 
            ? `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`
            : `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Project header/banner */}
        <Box
          sx={{
            height: 90,
            position: 'relative',
            background: generateBackground(),
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Chip
              label={status.replace('-', ' ')}
              size="small"
              icon={getStatusIcon()}
              sx={{
                backgroundColor: alpha(statusColor, 0.9),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.6875rem',
                textTransform: 'capitalize',
                backdropFilter: 'blur(4px)',
                '& .MuiChip-icon': {
                  color: 'inherit',
                  fontSize: '0.75rem',
                },
              }}
            />
            
            {onMenuClick && (
              <IconButton 
                size="small" 
                sx={{ 
                  color: '#fff',
                  bgcolor: alpha('#000', 0.2),
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    bgcolor: alpha('#000', 0.3),
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick(e);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          <Typography
            variant="h6"
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              color: '#fff',
              fontWeight: 700,
              zIndex: 2,
              textShadow: '0px 1px 2px rgba(0,0,0,0.3)',
              width: '80%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
        </Box>

        <CardContent sx={{ pt: 2 }}>
          {/* Location */}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.75rem',
            }}
          >
            <PlaceIcon sx={{ fontSize: '1rem' }} />
            {location}
          </Typography>
          
          {/* Progress section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 0.5 
            }}>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ fontSize: '0.75rem' }}
              >
                Progress
              </Typography>
              
              <Typography 
                variant="body2"
                fontWeight={600}
                sx={{ 
                  fontSize: '0.75rem',
                  color: progressColor,
                }}
              >
                {progress}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(progressColor, 0.15),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: progressColor,
                },
              }}
            />
          </Box>

          {/* Project Details */}
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon 
                fontSize="small" 
                sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.8125rem' }}
              >
                Due: {dueDate}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon 
                fontSize="small" 
                sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.8125rem' }}
              >
                Budget: {budget}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon 
                fontSize="small" 
                sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.8125rem' }}
              >
                Team: {team} members
              </Typography>
            </Box>
          </Stack>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
          <Tooltip title="View Project">
            <IconButton 
              size="small"
              color="primary"
              sx={{ 
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.2s ease',
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    </Zoom>
  );
};

export default ProjectCard; 