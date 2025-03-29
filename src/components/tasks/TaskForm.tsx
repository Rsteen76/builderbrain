import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Types
interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  assignedTo: string[];
  projectId: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  projectId?: string;
}

// Mock data - replace with API calls later
const mockProjects = [
  { id: '1', name: 'Office Renovation' },
  { id: '2', name: 'Residential Complex' },
];

const mockTeamMembers = [
  { id: 'user1', name: 'John Doe' },
  { id: 'user2', name: 'Jane Smith' },
  { id: 'user3', name: 'Bob Johnson' },
  { id: 'user4', name: 'Alice Brown' },
];

const initialTask: Task = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  assignedTo: [],
  projectId: '',
};

const TaskForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task>(initialTask);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Load task data if editing
      // Replace with actual API call
      setTask({
        id: '1',
        title: 'Install Windows',
        description: 'Install and seal all windows in the main building',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-04-15'),
        assignedTo: ['user1', 'user2'],
        projectId: '1',
      });
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!task.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!task.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!task.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!task.projectId) {
      newErrors.projectId = 'Project is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/tasks');
    } catch (error) {
      console.error('Error saving task:', error);
      // Handle error (show error message)
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tasks');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Task' : 'New Task'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={task.title}
                  onChange={(e) => setTask({ ...task, title: e.target.value })}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={task.description}
                  onChange={(e) => setTask({ ...task, description: e.target.value })}
                  error={!!errors.description}
                  helperText={errors.description}
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={task.status}
                    label="Status"
                    onChange={(e) => setTask({ ...task, status: e.target.value as Task['status'] })}
                  >
                    <MenuItem value="todo">To Do</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="review">Review</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={task.priority}
                    label="Priority"
                    onChange={(e) => setTask({ ...task, priority: e.target.value as Task['priority'] })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                  {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.projectId}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={task.projectId}
                    label="Project"
                    onChange={(e) => setTask({ ...task, projectId: e.target.value })}
                    required
                  >
                    {mockProjects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.projectId && <FormHelperText>{errors.projectId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Due Date"
                    value={task.dueDate}
                    onChange={(date) => setTask({ ...task, dueDate: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.dueDate,
                        helperText: errors.dueDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={mockTeamMembers}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={mockTeamMembers.filter((member) => task.assignedTo.includes(member.id))}
                  onChange={(_, newValue) => {
                    setTask({
                      ...task,
                      assignedTo: newValue.map((item) => typeof item === 'string' ? item : item.id),
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assigned To"
                      placeholder="Select team members"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : (id ? 'Update Task' : 'Create Task')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default TaskForm; 