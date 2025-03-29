import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Assignment as ProjectIcon,
  Group as TeamIcon,
  Flag as PriorityIcon,
} from '@mui/icons-material';

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
  projectName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data - replace with actual API calls later
const mockTask: Task = {
  id: '1',
  title: 'Install Windows',
  description: 'Install and seal all windows in the main building. Follow manufacturer specifications and ensure proper insulation.',
  status: 'in_progress',
  priority: 'high',
  dueDate: new Date('2024-04-15'),
  assignedTo: ['John Doe', 'Jane Smith'],
  projectId: '1',
  projectName: 'Office Renovation',
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-15'),
};

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task>(mockTask);

  // Task actions
  const handleEdit = () => {
    navigate(`/tasks/${id}/edit`);
  };

  const handleDelete = () => {
    // Add confirmation dialog and delete logic
    navigate('/tasks');
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={task.status.replace('_', ' ').toUpperCase()}
              color={getStatusColor(task.status) as any}
            />
            <Chip
              label={task.priority.toUpperCase()}
              color={getPriorityColor(task.priority) as any}
              icon={<PriorityIcon />}
            />
          </Box>
        </Box>
        <Box>
          <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={handleDelete} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {task.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={task.status === 'completed' ? 100 : 50}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {task.status === 'completed' ? '100%' : '50%'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ProjectIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Project"
                    secondary={task.projectName}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Due Date"
                    secondary={formatDate(task.dueDate)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <TeamIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assigned To"
                    secondary={task.assignedTo.join(', ')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={formatDate(task.createdAt)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(task.updatedAt)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskDetails; 