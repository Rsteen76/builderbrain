import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  assignedTo: string[];
  projectId: string;
}

// Mock data - replace with actual API calls later
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Install Windows',
    description: 'Install and seal all windows in the main building',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date('2024-04-15'),
    assignedTo: ['John Doe', 'Jane Smith'],
    projectId: '1',
  },
  {
    id: '2',
    title: 'Paint Interior',
    description: 'Paint all interior walls with approved colors',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-04-20'),
    assignedTo: ['Bob Johnson'],
    projectId: '1',
  },
];

const TasksList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  // Task actions
  const handleCreateTask = () => {
    navigate('/tasks/new');
  };

  const handleEditTask = (taskId: string) => {
    navigate(`/tasks/${taskId}/edit`);
    handleMenuClose();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    handleMenuClose();
  };

  const handleViewTask = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  // Status chip color mapping
  const getStatusColor = (status: Task['status']) => {
    const colors = {
      todo: 'default',
      in_progress: 'warning',
      review: 'info',
      completed: 'success',
    };
    return colors[status];
  };

  // Priority chip color mapping
  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
    };
    return colors[priority];
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
        >
          New Task
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} key={task.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {task.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        label={task.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(task.status) as any}
                        size="small"
                      />
                      <Chip
                        label={task.priority.toUpperCase()}
                        color={getPriorityColor(task.priority) as any}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Due: {formatDate(task.dueDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigned to: {task.assignedTo.join(', ')}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, task.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedTask && handleViewTask(selectedTask)}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedTask && handleEditTask(selectedTask)}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedTask && handleDeleteTask(selectedTask)}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TasksList; 