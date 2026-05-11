import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '../../utils/logger';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Alert,
  Stack,
  Container,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Checkbox,
  ListItemText,
  Avatar,
  Skeleton,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon,
  Person as PersonIcon,
  AssignmentOutlined as TaskIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { Task, Project } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { TaskService } from '../../services/task';
import TaskFormModal from './TaskFormModal';

// Extend Task with assignee field for compatibility
interface ExtendedTask extends Task {
  name?: string;
  assignee?: string;
}

interface TaskItemProps {
  task: ExtendedTask;
  onEdit: (task: ExtendedTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions = [
  { value: 'all', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// Map to translate Task status to more human readable form and assign colors
const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
  todo: { label: 'Pending', color: 'warning.main', bgColor: 'warning.light' },
  pending: { label: 'Pending', color: 'warning.main', bgColor: 'warning.light' },
  in_progress: { label: 'In Progress', color: 'info.main', bgColor: 'info.light' },
  review: { label: 'In Review', color: 'info.main', bgColor: 'info.light' },
  completed: { label: 'Completed', color: 'success.main', bgColor: 'success.light' },
};

// Map to translate priority to chip colors
const priorityMap: Record<string, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High', color: 'error.main', bgColor: 'error.light' },
  medium: { label: 'Medium', color: 'warning.main', bgColor: 'warning.light' },
  low: { label: 'Low', color: 'success.main', bgColor: 'success.light' },
  urgent: { label: 'Urgent', color: 'error.main', bgColor: 'error.light' },
};

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  // Use title if name is not available (backward compatibility)
  const taskName = task.name || task.title || 'Untitled Task';
  const taskStatus = statusMap[task.status] || statusMap.todo;
  const taskPriority = task.priority ? (priorityMap[task.priority] || priorityMap.medium) : priorityMap.medium;

  // Get the palette color safely
  const getStatusBgColor = () => {
    const colorKey = taskStatus.color.split('.')[0]; // 'warning', 'info', 'success', etc
    if (colorKey === 'warning') return alpha(theme.palette.warning.main, 0.1);
    if (colorKey === 'info') return alpha(theme.palette.info.main, 0.1);
    if (colorKey === 'success') return alpha(theme.palette.success.main, 0.1);
    if (colorKey === 'error') return alpha(theme.palette.error.main, 0.1);
    if (colorKey === 'primary') return alpha(theme.palette.primary.main, 0.1);
    if (colorKey === 'secondary') return alpha(theme.palette.secondary.main, 0.1);
    return alpha(theme.palette.primary.main, 0.1); // default fallback
  };

  // Get the priority color safely
  const getPriorityBgColor = () => {
    const colorKey = taskPriority.color.split('.')[0]; // 'error', 'warning', 'success', etc
    if (colorKey === 'warning') return alpha(theme.palette.warning.main, 0.1);
    if (colorKey === 'info') return alpha(theme.palette.info.main, 0.1);
    if (colorKey === 'success') return alpha(theme.palette.success.main, 0.1);
    if (colorKey === 'error') return alpha(theme.palette.error.main, 0.1);
    if (colorKey === 'primary') return alpha(theme.palette.primary.main, 0.1);
    if (colorKey === 'secondary') return alpha(theme.palette.secondary.main, 0.1);
    return alpha(theme.palette.warning.main, 0.1); // default fallback
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleStatusChange = (newStatus: 'pending' | 'in_progress' | 'completed') => {
    onStatusChange(task.id, newStatus);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit(task);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    handleMenuClose();
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        '&:hover': {
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
            <Checkbox
              checked={task.status === 'completed'}
              onChange={() => onStatusChange(
                task.id,
                task.status === 'completed' ? 'pending' : 'completed'
              )}
              sx={{
                mt: -0.5,
                color: theme.palette.text.secondary,
                '&.Mui-checked': {
                  color: theme.palette.success.main,
                },
              }}
            />
            
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  color: task.status === 'completed' ? theme.palette.text.secondary : theme.palette.text.primary,
                }}
              >
                {taskName}
              </Typography>
              
              {task.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  }}
                >
                  {task.description.length > 120 
                    ? `${task.description.substring(0, 120)}...` 
                    : task.description}
                </Typography>
              )}
              
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={isMobile ? 1 : 2}
                alignItems={isMobile ? "flex-start" : "center"}
                sx={{ mt: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: getStatusBgColor(),
                      color: taskStatus.color,
                    }}
                  >
                    <ScheduleIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {taskStatus.label}
                  </Typography>
                </Box>
                
                {task.priority && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: getPriorityBgColor(),
                        color: taskPriority.color,
                      }}
                    >
                      <PriorityHighIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {taskPriority.label} Priority
                    </Typography>
                  </Box>
                )}
                
                {task.dueDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <DateRangeIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Due: {formatDate(task.dueDate)}
                    </Typography>
                  </Box>
                )}
                
                {(task.assignee || task.assigneeId) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {task.assignee || task.assigneeId}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
          
          <Box>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 2,
                sx: {
                  width: 200,
                  borderRadius: 2,
                  overflow: 'visible',
                  boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.1)}`,
                },
              }}
            >
              <MenuItem onClick={() => handleStatusChange('pending')}>
                <ListItemText>
                  Mark as Pending
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange('in_progress')}>
                <ListItemText>
                  Mark as In Progress
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleStatusChange('completed')}>
                <ListItemText>
                  Mark as Completed
                </ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleEdit}>
                <ListItemText>
                  Edit
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
                <ListItemText>
                  Delete
                </ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const TasksList: React.FC = () => {
  const theme = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [taskFormOpen, setTaskFormOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const filterMenuOpen = Boolean(filterMenuAnchorEl);

  useEffect(() => {
    if (!user?.uid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        if (projectId) {
          // If projectId is provided, fetch tasks for that specific project
          const projectData = await ProjectService.getProject(projectId, user.uid);
          if (!projectData) {
            setError('Project not found');
            setLoading(false);
            return;
          }
          
          setProject(projectData);
          if (projectData.tasks) {
            // Add name property for compatibility
            const tasksWithNames = projectData.tasks.map((task: Task) => ({
              ...task,
              name: task.title
            }));
            setTasks(tasksWithNames);
          } else {
            setTasks([]);
          }
        } else {
          // Otherwise, fetch all tasks for the user
          const tasksData = await TaskService.getTasks(user.uid);
          const tasksWithNames = (tasksData || []).map(task => ({
            ...task,
            name: task.title
          }));
          setTasks(tasksWithNames);
        }
      } catch (err) {
        logger.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, projectId]);

  const handleOpenTaskForm = () => {
    setSelectedTask(null);
    setTaskFormOpen(true);
  };

  const handleEditTask = (task: ExtendedTask) => {
    setSelectedTask(task);
    setTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setTaskFormOpen(false);
    setSelectedTask(null);
  };

  const handleSubmitSuccess = (task: Task) => {
    if (task.id) {
      // Update existing task in the list
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? { ...task, name: task.title } : t)
      );
    } else {
      // Add new task to the list
      setTasks(prevTasks => [...prevTasks, { ...task, name: task.title }]);
    }
    setTaskFormOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.uid) return;

    try {
      setError(null);
      await TaskService.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      logger.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      setError(null);
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate) return;

      // Map the new status to the task's expected status values
      let taskStatus: Task['status'];
      if (newStatus === 'pending') taskStatus = 'todo';
      else if (newStatus === 'in_progress') taskStatus = 'in_progress';
      else taskStatus = 'completed';

      // Update the task in the service
      await TaskService.updateTask(taskId, { status: taskStatus });

      // Update the local state
      setTasks(tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: taskStatus };
        }
        return t;
      }));
    } catch (err) {
      logger.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  };

  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setFilterMenuAnchorEl(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Safely check if a task status is "pending" or "todo" (they're considered equivalent in the UI)
  const isPendingStatus = (status: string) => {
    return status === 'todo' || status === 'pending';
  };

  // Filtered tasks based on search query, status filter, priority filter and active tab
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskTitle = task.name || task.title || '';
      const matchesSearch = taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        
      // Map statusFilter to task.status values
      let matchesStatus = statusFilter === 'all';
      if (statusFilter === 'pending' && isPendingStatus(task.status)) {
        matchesStatus = true;
      } else if (statusFilter === 'in_progress' && task.status === 'in_progress') {
        matchesStatus = true;
      } else if (statusFilter === 'completed' && task.status === 'completed') {
        matchesStatus = true;
      }
      
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      const matchesTab = activeTab === 'all' || (
        (activeTab === 'today' && task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()) ||
        (activeTab === 'upcoming' && task.dueDate && new Date(task.dueDate) > new Date() && 
          new Date(task.dueDate).toDateString() !== new Date().toDateString()) ||
        (activeTab === 'overdue' && task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date()) ||
        (activeTab === 'completed' && task.status === 'completed')
      );

      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, activeTab]);

  const getTaskCountByStatus = (status: string) => {
    if (status === 'completed') {
      return tasks.filter(task => task.status === 'completed').length;
    } else if (status === 'pending') {
      return tasks.filter(task => isPendingStatus(task.status)).length;
    } else if (status === 'in_progress') {
      return tasks.filter(task => task.status === 'in_progress').length;
    }
    return 0;
  };

  const getTodayTasksCount = () => {
    return tasks.filter(task => 
      task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
    ).length;
  };

  const getUpcomingTasksCount = () => {
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) > new Date() && 
      new Date(task.dueDate).toDateString() !== new Date().toDateString()
    ).length;
  };

  const getOverdueTasksCount = () => {
    return tasks.filter(task => 
      task.status !== 'completed' && 
      task.dueDate && 
      new Date(task.dueDate) < new Date()
    ).length;
  };

  if (loading && tasks.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Skeleton variant="text" width={300} height={60} />
              <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>
        
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 3 }} />
        
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
        ))}
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 }, pb: 4 }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 44,
                height: 44,
              }}
            >
              <TaskIcon />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight={600}>
                {project ? `${project.name} - Tasks` : 'All Tasks'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredTasks.length} tasks {statusFilter !== 'all' && `with status ${statusFilter}`}
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenTaskForm}
          sx={{ borderRadius: 2 }}
        >
          {isMobile ? 'Add' : 'Add Task'}
        </Button>
      </Stack>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 3 }}
      >
        <TextField
          placeholder="Search tasks..."
          variant="outlined"
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.2),
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilterMenu}
          sx={{
            minWidth: isMobile ? '100%' : 120,
            borderRadius: 2,
            borderColor: alpha(theme.palette.divider, 0.2),
          }}
        >
          Filter
        </Button>

        <Menu
          anchorEl={filterMenuAnchorEl}
          open={filterMenuOpen}
          onClose={handleCloseFilterMenu}
          PaperProps={{
            elevation: 3,
            sx: {
              p: 2,
              width: 280,
              borderRadius: 2,
              overflow: 'visible',
              boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.1)}`,
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, px: 1.5, fontWeight: 600 }}>
            Status
          </Typography>
          {statusOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => {
                setStatusFilter(option.value);
                handleCloseFilterMenu();
              }}
              selected={statusFilter === option.value}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                  },
                },
              }}
            >
              <ListItemText>
                {option.label}
              </ListItemText>
            </MenuItem>
          ))}
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1.5, px: 1.5, fontWeight: 600 }}>
            Priority
          </Typography>
          {priorityOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => {
                setPriorityFilter(option.value);
                handleCloseFilterMenu();
              }}
              selected={priorityFilter === option.value}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                  },
                },
              }}
            >
              <ListItemText>
                {option.label}
              </ListItemText>
            </MenuItem>
          ))}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                handleCloseFilterMenu();
              }}
              sx={{ borderRadius: 1 }}
            >
              Reset
            </Button>
            <Button 
              variant="contained" 
              size="small"
              onClick={handleCloseFilterMenu}
              sx={{ borderRadius: 1 }}
            >
              Apply
            </Button>
          </Box>
        </Menu>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons={isMobile ? "auto" : undefined}
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Tab 
          value="all" 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>All</span>
              <Chip 
                label={tasks.length} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.75rem',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }} 
              />
            </Box>
          }
        />
        <Tab 
          value="today" 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Today</span>
              <Chip 
                label={getTodayTasksCount()} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.75rem',
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main
                }} 
              />
            </Box>
          }
        />
        <Tab 
          value="upcoming" 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Upcoming</span>
              <Chip 
                label={getUpcomingTasksCount()} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.75rem',
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main
                }} 
              />
            </Box>
          }
        />
        <Tab 
          value="overdue" 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Overdue</span>
              <Chip 
                label={getOverdueTasksCount()} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.75rem',
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main
                }} 
              />
            </Box>
          }
        />
        <Tab 
          value="completed" 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Completed</span>
              <Chip 
                label={getTaskCountByStatus('completed')} 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.75rem',
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main
                }} 
              />
            </Box>
          }
        />
      </Tabs>

      <Box>
        {filteredTasks.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: 'center',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
            }}
          >
            <TaskIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenTaskForm}
              sx={{ borderRadius: 2 }}
            >
              Add Task
            </Button>
          </Card>
        ) : (
          <Box>
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </Box>
        )}
      </Box>

      <TaskFormModal
        open={taskFormOpen}
        onClose={handleCloseTaskForm}
        onSubmitSuccess={handleSubmitSuccess}
        initialData={selectedTask}
        projectId={projectId || ''}
        userId={user?.uid || ''}
      />
    </Container>
  );
};

export default TasksList; 
