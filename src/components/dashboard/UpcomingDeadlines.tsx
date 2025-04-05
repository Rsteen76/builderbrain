import React from 'react';
import {
  Box,
  Typography,
  Card,
  useTheme,
  alpha,
  Stack,
  Chip,
  Button,
  Divider,
  Tooltip,
  Paper,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  Today as TodayIcon,
  Timeline as TimelineIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

interface UpcomingDeadlinesProps {
  nextMilestone: {
    name: string;
    date: string;
    projectId: string;
  };
  tasksDue: number;
}

// Helper function to calculate days between dates
const getDaysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

// Helper function to create timeline status
const getTimelineStatus = (daysRemaining: number) => {
  if (daysRemaining <= 0) return { color: 'error.main', label: 'Overdue' };
  if (daysRemaining <= 2) return { color: 'error.main', label: 'Critical' };
  if (daysRemaining <= 7) return { color: 'warning.main', label: 'Urgent' };
  if (daysRemaining <= 14) return { color: 'info.main', label: 'Upcoming' };
  return { color: 'success.main', label: 'Scheduled' };
};

interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  daysRemaining?: number;
}

const TimelineItem = ({ date, title, description, daysRemaining }: TimelineItemProps) => {
  const theme = useTheme();
  const status = getTimelineStatus(daysRemaining || 0);
  
  // Fix the palette indexing issue
  const statusColor = status.color === 'success.main' 
    ? theme.palette.success.main 
    : status.color === 'warning.main' 
      ? theme.palette.warning.main 
      : theme.palette.error.main;
  
  return (
    <Box sx={{ position: 'relative', pl: 4.5, pb: daysRemaining !== undefined ? 3.5 : 0 }}>
      {/* Vertical line */}
      {daysRemaining !== undefined && (
        <Box 
          sx={{ 
            position: 'absolute',
            left: 18,
            top: 24,
            bottom: 0,
            width: 2,
            backgroundColor: alpha(statusColor, 0.2),
            zIndex: 0
          }}
        />
      )}
      
      {/* Circle indicator */}
      <Box 
        sx={{ 
          position: 'absolute',
          left: 12,
          top: 12,
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: statusColor,
          border: `3px solid ${alpha(statusColor, 0.2)}`,
          zIndex: 1,
        }}
      />
      
      <Box sx={{ mb: 0.75 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: '0.875rem' }} />
          {date}
        </Typography>
      </Box>
      
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 600,
          mb: 0.5
        }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 1,
          }}
        >
          {description}
        </Typography>
      )}

      {daysRemaining !== undefined && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Chip 
              label={status.label}
              size="small"
              sx={{
                backgroundColor: alpha(statusColor, 0.12),
                color: statusColor,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
            
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600,
                color: statusColor,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: '0.875rem' }} />
              {daysRemaining === 0 ? 'Today' : 
                daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
                `${daysRemaining} days remaining`}
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <LinearProgress 
              variant="determinate"
              value={Math.max(0, Math.min(100, (14 - Math.max(-7, Math.min(daysRemaining, 14))) * 100 / 21))}
              sx={{ 
                height: 5, 
                borderRadius: 2,
                backgroundColor: alpha(statusColor, 0.15),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: statusColor,
                }
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  daysRemaining?: number;
  icon?: React.ReactNode;
  color?: string;
}

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ nextMilestone, tasksDue }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const today = new Date();
  
  let upcomingMilestone = null;
  let daysUntilMilestone = undefined;
  
  if (nextMilestone && nextMilestone.date) {
    try {
      const milestoneDate = new Date(nextMilestone.date);
      upcomingMilestone = {
        title: nextMilestone.name,
        date: formatDate(milestoneDate),
      };
      
      daysUntilMilestone = getDaysBetween(today, milestoneDate);
      // If milestone is in the past, show negative days
      if (milestoneDate < today) {
        daysUntilMilestone = -daysUntilMilestone;
      }
    } catch (error) {
      console.error('Error parsing milestone date:', error);
    }
  }
  
  // Create events array with only real data
  const events: (TimelineEvent | null)[] = [
    upcomingMilestone ? {
      date: upcomingMilestone.date,
      title: upcomingMilestone.title,
      description: 'Project milestone',
      daysRemaining: daysUntilMilestone,
      icon: <FlagIcon />,
      color: theme.palette.primary.main,
    } : null,
    tasksDue > 0 ? {
      date: 'Within 7 days',
      title: `${tasksDue} task${tasksDue !== 1 ? 's' : ''} due soon`,
      description: 'Tasks requiring attention',
      icon: <AssignmentIcon />,
      color: theme.palette.info.main,
    } : null,
  ].filter(Boolean);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2.5,
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
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.warning.main, 0.08),
            }}
          >
            <ScheduleIcon 
              sx={{ fontSize: 20, color: theme.palette.warning.main }} 
            />
          </Box>
          
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: '1.125rem' }}
          >
            Upcoming Deadlines
          </Typography>
        </Stack>
        
        <Button
          variant="text"
          size="small"
          endIcon={<ArrowForwardIcon fontSize="small" />}
          onClick={() => navigate('/calendar')}
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: theme.palette.text.secondary,
            '&:hover': {
              bgcolor: 'transparent',
              color: theme.palette.primary.main,
            }
          }}
        >
          View Calendar
        </Button>
      </Box>
      
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography 
                variant="subtitle1" 
                fontWeight={600}
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <TodayIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                Timeline
              </Typography>

              <Box sx={{ p: 0.5 }}>
                {events.map((event, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider sx={{ my: 1 }} />}
                    {event && (
                      <TimelineItem
                        date={event.date}
                        title={event.title}
                        description={event.description}
                        daysRemaining={event.daysRemaining}
                      />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600}
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AssignmentIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                  Deadline Summary
                </Typography>

                <Box 
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Next Key Milestone
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {upcomingMilestone 
                          ? `${upcomingMilestone.title} on ${upcomingMilestone.date}`
                          : "No upcoming milestones"
                        }
                      </Typography>
                      
                      {upcomingMilestone && nextMilestone?.projectId && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => navigate(`/projects/${nextMilestone.projectId}/milestones`)}
                          sx={{ mt: 1, fontSize: '0.75rem' }}
                        >
                          View Details
                        </Button>
                      )}
                    </Box>
                    
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Tasks Due Soon
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {tasksDue > 0
                          ? `You have ${tasksDue} task${tasksDue !== 1 ? 's' : ''} due within the next 7 days`
                          : "No tasks due in the next 7 days"
                        }
                      </Typography>
                      
                      {tasksDue > 0 && (
                        <Button 
                          variant="outlined" 
                          color="warning"
                          size="small" 
                          onClick={() => navigate('/tasks?filter=upcoming')}
                          sx={{ mt: 1, fontSize: '0.75rem' }}
                        >
                          View Tasks
                        </Button>
                      )}
                    </Box>
                  </Stack>
                  
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      disableElevation
                      fullWidth
                      onClick={() => navigate('/calendar')}
                      startIcon={<CalendarTodayIcon />}
                    >
                      Open Full Calendar
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default UpcomingDeadlines;