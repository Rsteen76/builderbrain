import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Chip,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  InsertInvitation as CalendarIcon,
  AttachMoney as PaymentIcon,
  LocalShipping as ShippingIcon,
  FilterList as FilterIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';

// Interfaces for the timeline data
interface TimelineEvent {
  id: string;
  type: 'milestone' | 'task' | 'payment' | 'delivery' | 'meeting' | 'note';
  date: string;
  title: string;
  description?: string;
  status?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  amount?: number;
  projectId: string;
  projectName: string;
  completed?: boolean;
  createdBy?: string;
  createdAt: string;
  category?: string;
}

interface TimelineFilter {
  startDate: Date | null;
  endDate: Date | null;
  eventTypes: string[];
  projectIds: string[];
  searchQuery: string;
}

// Helper function to get the appropriate icon for an event type
const getEventIcon = (type: string, theme: any) => {
  switch (type) {
    case 'milestone':
      return <FlagIcon sx={{ color: theme.palette.primary.main }} />;
    case 'task':
      return <AssignmentIcon sx={{ color: theme.palette.info.main }} />;
    case 'payment':
      return <PaymentIcon sx={{ color: theme.palette.success.main }} />;
    case 'delivery':
      return <ShippingIcon sx={{ color: theme.palette.warning.main }} />;
    case 'meeting':
      return <CalendarIcon sx={{ color: theme.palette.secondary.main }} />;
    case 'note':
      return <EventIcon sx={{ color: theme.palette.grey[600] }} />;
    default:
      return <ScheduleIcon sx={{ color: theme.palette.primary.main }} />;
  }
};

// Helper function to calculate days between dates
const getDaysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

// Helper function to get timeline status based on days remaining
const getTimelineStatus = (daysRemaining: number) => {
  if (daysRemaining <= 0) return { color: 'error.main', label: 'Overdue' };
  if (daysRemaining <= 2) return { color: 'error.main', label: 'Critical' };
  if (daysRemaining <= 7) return { color: 'warning.main', label: 'Urgent' };
  if (daysRemaining <= 14) return { color: 'info.main', label: 'Upcoming' };
  return { color: 'success.main', label: 'Scheduled' };
};

// Component for individual timeline items
const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const today = new Date();
  const eventDate = new Date(event.date);
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate days remaining
  let daysRemaining: number | undefined;
  if (eventDate > today) {
    daysRemaining = getDaysBetween(today, eventDate);
  } else if (eventDate < today && !event.completed) {
    daysRemaining = -getDaysBetween(today, eventDate);
  }

  const status = daysRemaining !== undefined ? getTimelineStatus(daysRemaining) : undefined;
  
  // Get the appropriate color for the status
  const getStatusColor = () => {
    if (!status) return theme.palette.grey[500];
    
    switch (status.color) {
      case 'error.main': return theme.palette.error.main;
      case 'warning.main': return theme.palette.warning.main;
      case 'info.main': return theme.palette.info.main;
      case 'success.main': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };
  
  const statusColor = getStatusColor();
  
  // Determine navigation based on event type
  const handleClick = () => {
    switch (event.type) {
      case 'milestone':
        navigate(`/projects/${event.projectId}/milestones`);
        break;
      case 'task':
        navigate(`/tasks/${event.id}`);
        break;
      case 'payment':
        navigate(`/finance/payments/${event.id}`);
        break;
      case 'delivery':
        navigate(`/materials/deliveries/${event.id}`);
        break;
      case 'meeting':
        navigate(`/calendar?event=${event.id}`);
        break;
      default:
        navigate(`/projects/${event.projectId}`);
    }
  };
  
  return (
    <Paper
      elevation={isHovered ? 2 : 0}
      sx={{
        p: 2,
        my: 2,
        position: 'relative',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isHovered 
          ? alpha(statusColor, 0.3)
          : alpha(theme.palette.divider, 0.08),
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        overflow: 'hidden',
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left border indicator */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: isHovered ? '6px' : '4px',
          backgroundColor: statusColor,
          transition: 'all 0.2s ease',
        }}
      />
      
      <Box sx={{ pl: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip
                icon={getEventIcon(event.type, theme)}
                label={event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                size="small"
                sx={{
                  mr: 1,
                  textTransform: 'capitalize',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                }}
              />
              
              {status && (
                <Chip
                  label={status.label}
                  size="small"
                  sx={{
                    backgroundColor: alpha(statusColor, 0.1),
                    color: statusColor,
                    fontWeight: 600,
                    fontSize: '0.6875rem',
                  }}
                />
              )}
            </Box>
            
            <Typography
              variant="h6"
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                mb: 0.5,
                color: isHovered ? statusColor : theme.palette.text.primary,
                transition: 'color 0.2s ease',
              }}
            >
              {event.title}
            </Typography>
            
            {event.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {event.description}
              </Typography>
            )}
            
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {event.projectName}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography
                variant="caption"
                sx={{
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.text.secondary,
                  gap: 0.5,
                }}
              >
                <TimeIcon sx={{ fontSize: '0.875rem' }} />
                {formatDate(event.date)}
              </Typography>
              
              {daysRemaining !== undefined && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: statusColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {daysRemaining === 0
                    ? 'Today'
                    : daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : `In ${daysRemaining} days`}
                </Typography>
              )}
              
              {event.amount && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.success.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 1,
                  }}
                >
                  <PaymentIcon sx={{ fontSize: '1rem' }} />
                  ${event.amount.toLocaleString()}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

// Main Timeline Component
const Timeline: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<TimelineFilter>({
    startDate: null,
    endDate: null,
    eventTypes: [],
    projectIds: [],
    searchQuery: '',
  });
  
  // Fetch timeline data
  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch projects for the filter dropdown
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(
          projectsRef,
          where('userId', '==', user.uid),
          orderBy('name', 'asc')
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Project',
        }));
        setProjects(projectsList);
        
        // Create array to hold all timeline events
        const timelineEvents: TimelineEvent[] = [];
        
        // 1. Fetch tasks
        const tasksRef = collection(db, 'tasks');
        const tasksQuery = query(
          tasksRef,
          where('userId', '==', user.uid),
          orderBy('dueDate', 'asc')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        
        // Process tasks into timeline events
        for (const taskDoc of tasksSnapshot.docs) {
          const taskData = taskDoc.data();
          // Get project name for each task
          let projectName = 'Unknown Project';
          if (taskData.projectId) {
            const projectRef = doc(db, 'projects', taskData.projectId);
            const projectDoc = await getDoc(projectRef);
            if (projectDoc.exists()) {
              projectName = projectDoc.data().name || 'Unnamed Project';
            }
          }
          
          // Convert task to timeline event
          if (taskData.dueDate) {
            timelineEvents.push({
              id: taskDoc.id,
              type: 'task',
              date: taskData.dueDate.toDate().toISOString(),
              title: taskData.title || 'Untitled Task',
              description: taskData.description || '',
              status: taskData.status,
              priority: taskData.priority,
              projectId: taskData.projectId || '',
              projectName,
              completed: taskData.status === 'completed',
              createdBy: taskData.createdBy,
              createdAt: taskData.createdAt.toDate().toISOString(),
            });
          }
        }
        
        // 2. Fetch milestones from projects
        for (const project of projectsList) {
          const projectRef = doc(db, 'projects', project.id);
          const projectDoc = await getDoc(projectRef);
          
          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            
            // Process milestones
            if (projectData.keyMilestones && Array.isArray(projectData.keyMilestones)) {
              projectData.keyMilestones.forEach((milestone: any) => {
                if (milestone.date) {
                  const milestoneDate = milestone.date instanceof Timestamp 
                    ? milestone.date.toDate() 
                    : new Date(milestone.date);
                    
                  timelineEvents.push({
                    id: `milestone-${project.id}-${milestone.name}`,
                    type: 'milestone',
                    date: milestoneDate.toISOString(),
                    title: milestone.name,
                    description: milestone.description || '',
                    projectId: project.id,
                    projectName: project.name,
                    createdAt: projectData.createdAt instanceof Timestamp 
                      ? projectData.createdAt.toDate().toISOString()
                      : new Date(projectData.createdAt).toISOString(),
                  });
                }
              });
            }
          }
        }
        
        // 3. Fetch payments
        const paymentsRef = collection(db, 'payments');
        const paymentsQuery = query(
          paymentsRef,
          where('userId', '==', user.uid),
          orderBy('dueDate', 'asc')
        );
        
        try {
          const paymentsSnapshot = await getDocs(paymentsQuery);
          
          // Process payments into timeline events
          for (const paymentDoc of paymentsSnapshot.docs) {
            const paymentData = paymentDoc.data();
            // Get project name for each payment
            let projectName = 'Unknown Project';
            if (paymentData.projectId) {
              const projectRef = doc(db, 'projects', paymentData.projectId);
              const projectDoc = await getDoc(projectRef);
              if (projectDoc.exists()) {
                projectName = projectDoc.data().name || 'Unnamed Project';
              }
            }
            
            // Convert payment to timeline event
            if (paymentData.dueDate) {
              timelineEvents.push({
                id: paymentDoc.id,
                type: 'payment',
                date: paymentData.dueDate.toDate().toISOString(),
                title: paymentData.description || `Payment of $${paymentData.amount}`,
                description: `${paymentData.paymentType || 'Payment'} - ${paymentData.status}`,
                amount: paymentData.amount,
                status: paymentData.status,
                projectId: paymentData.projectId || '',
                projectName,
                completed: paymentData.status === 'paid',
                createdAt: paymentData.createdAt.toDate().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error("Error fetching payments:", error);
          // Continue with other data if payments collection doesn't exist
        }
        
        // 4. Fetch material deliveries
        const deliveriesRef = collection(db, 'deliveries');
        try {
          const deliveriesQuery = query(
            deliveriesRef,
            where('userId', '==', user.uid),
            orderBy('expectedDate', 'asc')
          );
          
          const deliveriesSnapshot = await getDocs(deliveriesQuery);
          
          // Process deliveries into timeline events
          for (const deliveryDoc of deliveriesSnapshot.docs) {
            const deliveryData = deliveryDoc.data();
            // Get project name for each delivery
            let projectName = 'Unknown Project';
            if (deliveryData.projectId) {
              const projectRef = doc(db, 'projects', deliveryData.projectId);
              const projectDoc = await getDoc(projectRef);
              if (projectDoc.exists()) {
                projectName = projectDoc.data().name || 'Unnamed Project';
              }
            }
            
            // Convert delivery to timeline event
            if (deliveryData.expectedDate) {
              timelineEvents.push({
                id: deliveryDoc.id,
                type: 'delivery',
                date: deliveryData.expectedDate.toDate().toISOString(),
                title: `Delivery: ${deliveryData.materialName || 'Materials'}`,
                description: deliveryData.notes || `Quantity: ${deliveryData.quantity || 'Unknown'}`,
                status: deliveryData.status,
                projectId: deliveryData.projectId || '',
                projectName,
                completed: deliveryData.status === 'delivered',
                createdAt: deliveryData.createdAt.toDate().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error("Error fetching deliveries:", error);
          // Continue with other data if deliveries collection doesn't exist
        }
        
        // 5. Fetch meetings and events
        const eventsRef = collection(db, 'events');
        try {
          const eventsQuery = query(
            eventsRef,
            where('userId', '==', user.uid),
            orderBy('startDate', 'asc')
          );
          
          const eventsSnapshot = await getDocs(eventsQuery);
          
          // Process events into timeline events
          for (const eventDoc of eventsSnapshot.docs) {
            const eventData = eventDoc.data();
            // Get project name for each event if associated with a project
            let projectName = eventData.projectName || 'General';
            let projectId = eventData.projectId || '';
            
            if (projectId && !projectName) {
              const projectRef = doc(db, 'projects', projectId);
              const projectDoc = await getDoc(projectRef);
              if (projectDoc.exists()) {
                projectName = projectDoc.data().name || 'Unnamed Project';
              }
            }
            
            // Convert event to timeline event
            if (eventData.startDate) {
              timelineEvents.push({
                id: eventDoc.id,
                type: 'meeting',
                date: eventData.startDate.toDate().toISOString(),
                title: eventData.title || 'Untitled Event',
                description: eventData.description || '',
                projectId,
                projectName,
                completed: new Date() > eventData.startDate.toDate(),
                createdAt: eventData.createdAt?.toDate().toISOString() || new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error("Error fetching events:", error);
          // Continue with other data if events collection doesn't exist
        }
        
        // Sort all events by date
        timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setEvents(timelineEvents);
        setFilteredEvents(timelineEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        setLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [user]);
  
  // Apply filters when they change
  useEffect(() => {
    let result = [...events];
    
    // Filter by date range
    if (filters.startDate) {
      result = result.filter(event => new Date(event.date) >= filters.startDate!);
    }
    
    if (filters.endDate) {
      result = result.filter(event => new Date(event.date) <= filters.endDate!);
    }
    
    // Filter by event type
    if (filters.eventTypes.length > 0) {
      result = result.filter(event => filters.eventTypes.includes(event.type));
    }
    
    // Filter by project
    if (filters.projectIds.length > 0) {
      result = result.filter(event => filters.projectIds.includes(event.projectId));
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        event =>
          event.title.toLowerCase().includes(query) ||
          (event.description || '').toLowerCase().includes(query) ||
          event.projectName.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (most recent first)
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setFilteredEvents(result);
  }, [filters, events]);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof TimelineFilter, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      eventTypes: [],
      projectIds: [],
      searchQuery: '',
    });
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Project Timeline
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="medium"
            startIcon={<CalendarIcon />}
            onClick={() => navigate('/calendar')}
          >
            View Calendar
          </Button>
          <Tooltip title="Filter Timeline">
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {showFilters && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  multiple
                  value={filters.eventTypes}
                  onChange={(e) => handleFilterChange('eventTypes', e.target.value)}
                  label="Event Type"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip
                          key={value}
                          label={value.charAt(0).toUpperCase() + value.slice(1)}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {['milestone', 'task', 'payment', 'delivery', 'meeting', 'note'].map(
                    (type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select
                  multiple
                  value={filters.projectIds}
                  onChange={(e) => handleFilterChange('projectIds', e.target.value)}
                  label="Project"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const project = projects.find((p) => p.id === value);
                        return (
                          <Chip
                            key={value}
                            label={project?.name || value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400,
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredEvents.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <EventIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.3) }} />
          </Box>
          <Typography variant="h5" gutterBottom color="text.secondary">
            No timeline events found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mx: 'auto', maxWidth: 500 }}>
            {filters.startDate || filters.endDate || filters.eventTypes.length > 0 || filters.projectIds.length > 0 || filters.searchQuery
              ? 'Try adjusting your filters to see more results.'
              : 'There are no events in your timeline yet. Events will appear here as you create milestones, tasks, and other project activities.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/projects')}>
            Go to Projects
          </Button>
        </Paper>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {filteredEvents.length} Events
            </Typography>
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            {/* Timeline vertical line */}
            <Box
              sx={{
                position: 'absolute',
                left: 20,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                zIndex: 0,
              }}
            />
            
            {filteredEvents.map((event, index) => (
              <Box key={event.id} sx={{ position: 'relative', ml: 5 }}>
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: -38,
                    top: 30,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    zIndex: 1,
                  }}
                />
                
                {/* Timeline date indicator */}
                {(index === 0 ||
                  new Date(event.date).toDateString() !==
                    new Date(filteredEvents[index - 1].date).toDateString()) && (
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{
                      position: 'absolute',
                      left: -150,
                      top: 27,
                      width: 100,
                      textAlign: 'right',
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {new Date(event.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                )}
                
                <TimelineItem event={event} />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Timeline; 
