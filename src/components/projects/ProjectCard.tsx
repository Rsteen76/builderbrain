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
import { getProjectProgress } from '../../utils/phaseCalculations';
import { getStatusType } from './list/projectListUtils';
import { useProjectListThemeUtils } from './list/useProjectListThemeUtils';

// Project object interface that matches how it's used in Projects.tsx
interface Project {
  id?: string;
  name: string;
  status: string;
  dueDate?: string | Date;
  endDate?: Date | null;  // Add endDate as an alternative to dueDate
  budget?: number | { total: number; spent: number; remaining: number };
  team?: string[];
  /** Only each phase's status is read, to work out progress. */
  phases?: Array<{ status: string }>;
  location?: string | { address: string; city: string; state: string; zipCode?: string };
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void;
  index?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick: onCardClick, onMenuClick, index = 0 }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const { getStatusColor: getRawStatusColor, getStatusIcon: getRawStatusIcon } = useProjectListThemeUtils();

  const title = project.name;
  // The chip shows the project's own status, mapped once by getStatusType.
  const status = getStatusType(project.status);
  const dueDate = project.dueDate ? formatDate(project.dueDate)
    : project.endDate ? formatDate(project.endDate)
    : 'No due date';
  const budget = project.budget ? formatCurrency(project.budget) : 'Not set';
  const team = project.team?.length || 0;
  const location = formatLocation(project.location || 'No location');
  // Undefined when the project has no phase list to work from; the bar is then left out.
  const progress = getProjectProgress(project);
  const onClick = onCardClick || (() => {});

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

  const getStatusColor = () => getRawStatusColor(project.status);

  const getProgressColor = () => {
    if (progress === undefined) return theme.palette.grey[500];
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

  const getStatusIcon = () => getRawStatusIcon(project.status);

  // Helper functions for project object format
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
                label={status} 
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
                overflowWrap: 'anywhere',
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
          {progress !== undefined && (
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
          )}

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
                  {status}
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
