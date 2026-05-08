import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  alpha,
  IconButton,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  Assignment as TaskIcon,
  AttachMoney as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendarEvents } from '../../hooks/use-calendar-timeline';
import { useNavigate } from 'react-router-dom';

const Calendar: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const { events, loading } = useCalendarEvents(user?.uid, currentDate);
  
  // Get current month name and year
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  // Navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get days in month for the current date
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Helper to get events for a specific day
  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Color mapping for event types
  const getEventColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return theme.palette.primary.main;
      case 'task':
        return theme.palette.info.main;
      case 'payment':
        return theme.palette.success.main;
      case 'meeting':
        return theme.palette.secondary.main;
      case 'delivery':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  // Icon mapping for event types
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <FlagIcon fontSize="small" />;
      case 'task':
        return <TaskIcon fontSize="small" />;
      case 'payment':
        return <PaymentIcon fontSize="small" />;
      case 'meeting':
        return <EventIcon fontSize="small" />;
      case 'delivery':
        return <DeliveryIcon fontSize="small" />;
      default:
        return <EventIcon fontSize="small" />;
    }
  };
  
  // Render calendar grid
  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    const today = new Date();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <Box 
          key={`empty-${i}`} 
          sx={{ 
            height: 110, 
            p: 1, 
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }} 
        />
      );
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = 
        today.getDate() === day && 
        today.getMonth() === month && 
        today.getFullYear() === year;
      
      const dayEvents = getEventsForDay(day);
      
      days.push(
        <Box 
          key={`day-${day}`} 
          sx={{ 
            height: 110, 
            p: 1, 
            position: 'relative', 
            bgcolor: isToday ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper,
            border: `1px solid ${isToday ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
            '&:hover': {
              bgcolor: alpha(theme.palette.action.hover, 0.1),
            },
          }} 
        >
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Typography 
              variant="body2" 
              fontWeight={isToday ? 700 : 400}
              sx={{ 
                color: isToday ? theme.palette.primary.main : theme.palette.text.primary,
              }}
            >
              {day}
            </Typography>
            
            {dayEvents.length > 0 && (
              <Chip 
                size="small" 
                label={dayEvents.length} 
                sx={{ 
                  height: 18, 
                  fontSize: '0.625rem',
                  '& .MuiChip-label': { px: 0.75 },
                }} 
              />
            )}
          </Box>
          
          <Box sx={{ maxHeight: 70, overflowY: 'auto' }}>
            {dayEvents.slice(0, 3).map((event, index) => (
              <Tooltip key={event.id} title={event.title} arrow>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    p: 0.5,
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: alpha(getEventColor(event.type), 0.1),
                    color: getEventColor(event.type),
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(getEventColor(event.type), 0.2),
                    },
                  }}
                  onClick={() => {
                    // Navigate based on event type
                    switch (event.type) {
                      case 'milestone':
                        navigate(`/projects/${event.projectId}/milestones`);
                        break;
                      case 'task':
                        navigate(`/tasks/${event.id}`);
                        break;
                      case 'payment':
                        navigate(`/payments/${event.id}`);
                        break;
                      case 'meeting':
                        navigate(`/calendar?event=${event.id}`);
                        break;
                      case 'delivery':
                        navigate(`/materials/deliveries/${event.id}`);
                        break;
                      default:
                        navigate(`/projects/${event.projectId}`);
                    }
                  }}
                >
                  {getEventIcon(event.type)}
                  <Typography 
                    variant="caption" 
                    noWrap 
                    sx={{ 
                      fontWeight: 500, 
                      textDecoration: event.completed ? 'line-through' : 'none' 
                    }}
                  >
                    {event.title}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
            
            {dayEvents.length > 3 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  color: theme.palette.text.secondary 
                }}
              >
                + {dayEvents.length - 3} more
              </Typography>
            )}
          </Box>
        </Box>
      );
    }
    
    // Calculate remaining cells to complete the grid
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    const remainingCells = totalCells - (daysInMonth + firstDayOfMonth);
    
    // Add empty cells for days after the end of the month
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <Box 
          key={`empty-end-${i}`} 
          sx={{ 
            height: 110, 
            p: 1, 
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }} 
        />
      );
    }
    
    return days;
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Calendar
        </Typography>
      </Box>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {/* Calendar Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {currentMonth} {currentYear}
            </Typography>
            
            {loading && (
              <CircularProgress size={20} sx={{ ml: 2 }} />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={goToToday}
            >
              Today
            </Button>
            
            <IconButton onClick={goToPreviousMonth}>
              <ArrowBackIcon />
            </IconButton>
            
            <IconButton onClick={goToNextMonth}>
              <ArrowForwardIcon />
            </IconButton>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/events/new')}
              sx={{ ml: 1 }}
            >
              Add Event
            </Button>
          </Box>
        </Box>
        
        {/* Calendar View Mode Selector */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            label="Month" 
            onClick={() => setViewMode('month')} 
            color={viewMode === 'month' ? 'primary' : 'default'}
            variant={viewMode === 'month' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Week" 
            onClick={() => setViewMode('week')} 
            color={viewMode === 'week' ? 'primary' : 'default'}
            variant={viewMode === 'week' ? 'filled' : 'outlined'}
          />
          <Chip 
            label="Day" 
            onClick={() => setViewMode('day')} 
            color={viewMode === 'day' ? 'primary' : 'default'}
            variant={viewMode === 'day' ? 'filled' : 'outlined'}
          />
        </Box>
        
        {/* Day Headers */}
        <Grid container sx={{ mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Grid key={index} item xs={12/7}>
              <Typography 
                variant="subtitle2" 
                align="center" 
                sx={{ 
                  fontWeight: 600,
                  color: index === 0 || index === 6 
                    ? alpha(theme.palette.error.main, 0.8)
                    : theme.palette.text.primary
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>
        
        {/* Calendar Grid */}
        <Grid container>
          {renderCalendarGrid().map((day, index) => (
            <Grid key={index} item xs={12/7}>
              {day}
            </Grid>
          ))}
        </Grid>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: theme.palette.primary.main 
              }} 
            />
            <Typography variant="caption">Milestone</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: theme.palette.info.main 
              }} 
            />
            <Typography variant="caption">Task</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: theme.palette.success.main 
              }} 
            />
            <Typography variant="caption">Payment</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: theme.palette.secondary.main 
              }} 
            />
            <Typography variant="caption">Meeting</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: theme.palette.warning.main 
              }} 
            />
            <Typography variant="caption">Delivery</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Calendar;
