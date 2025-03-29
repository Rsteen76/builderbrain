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
interface Project {
  id?: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: Date | null;
  endDate: Date | null;
  budget: number;
  clientId: string;
  team: string[];
}

interface FormErrors {
  name?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  clientId?: string;
}

// Mock data - replace with API calls later
const mockClients = [
  { id: 'client1', name: 'Acme Corp' },
  { id: 'client2', name: 'TechStart Inc' },
  { id: 'client3', name: 'BuildWell Ltd' },
];

const mockTeamMembers = [
  { id: 'user1', name: 'John Doe' },
  { id: 'user2', name: 'Jane Smith' },
  { id: 'user3', name: 'Bob Johnson' },
  { id: 'user4', name: 'Alice Brown' },
];

const initialProject: Project = {
  name: '',
  description: '',
  status: 'planning',
  startDate: null,
  endDate: null,
  budget: 0,
  clientId: '',
  team: [],
};

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project>(initialProject);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Load project data if editing
      // Replace with actual API call
      setProject({
        id: '1',
        name: 'Office Renovation',
        description: 'Complete renovation of main office space',
        status: 'in_progress',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        budget: 150000,
        clientId: 'client1',
        team: ['user1', 'user2'],
      });
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!project.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!project.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!project.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!project.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (project.startDate && project.endDate && project.startDate > project.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (project.budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    if (!project.clientId) {
      newErrors.clientId = 'Client is required';
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
      navigate('/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      // Handle error (show error message)
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Project' : 'New Project'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
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
                    value={project.status}
                    label="Status"
                    onChange={(e) => setProject({ ...project, status: e.target.value as Project['status'] })}
                  >
                    <MenuItem value="planning">Planning</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.clientId}>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={project.clientId}
                    label="Client"
                    onChange={(e) => setProject({ ...project, clientId: e.target.value })}
                    required
                  >
                    {mockClients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.clientId && <FormHelperText>{errors.clientId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={project.startDate}
                    onChange={(date) => setProject({ ...project, startDate: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={project.endDate}
                    onChange={(date) => setProject({ ...project, endDate: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={project.budget}
                  onChange={(e) => setProject({ ...project, budget: Number(e.target.value) })}
                  error={!!errors.budget}
                  helperText={errors.budget}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={mockTeamMembers}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={mockTeamMembers.filter((member) => project.team.includes(member.id))}
                  onChange={(_, newValue) => {
                    setProject({
                      ...project,
                      team: newValue.map((item) => typeof item === 'string' ? item : item.id),
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Team Members"
                      placeholder="Add team members"
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
            {loading ? 'Saving...' : (id ? 'Update Project' : 'Create Project')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ProjectForm; 