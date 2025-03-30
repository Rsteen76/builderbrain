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
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ProjectService, Project as ProjectType } from '../../services/project';

// Types
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

const initialProject: Partial<ProjectType> = {
  name: '',
  description: '',
  status: 'planning',
  startDate: new Date(),
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months in the future
  budget: 0,
  clientId: '',
  team: [],
  location: '',
  projectType: '',
  estimatedDuration: '',
  phases: [],
  keyMilestones: [],
  requirements: {
    permits: [],
    inspections: [],
    documents: [],
  },
};

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Partial<ProjectType>>(initialProject);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      setFetchLoading(true);
      setError(null);
      
      try {
        const projectData = await ProjectService.getProject(id);
        if (projectData) {
          setProject(projectData);
        } else {
          setError(`Project with ID ${id} not found`);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project data. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchProject();
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!project.name?.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!project.description?.trim()) {
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

    if (!project.budget || project.budget <= 0) {
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
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (id) {
        // Update existing project
        await ProjectService.updateProject(id, project);
        setSuccessMessage('Project updated successfully');
      } else {
        // Create new project
        await ProjectService.createProject(project as Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt'>);
        setSuccessMessage('Project created successfully');
      }
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Project' : 'New Project'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={project.name || ''}
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
                  value={project.description || ''}
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
                    value={project.status || 'planning'}
                    label="Status"
                    onChange={(e) => setProject({ ...project, status: e.target.value as ProjectType['status'] })}
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
                    value={project.clientId || ''}
                    label="Client"
                    onChange={(e) => setProject({ ...project, clientId: e.target.value })}
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
                    onChange={(date) => setProject({ 
                      ...project, 
                      startDate: date || undefined 
                    })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
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
                    onChange={(date) => setProject({ 
                      ...project, 
                      endDate: date || undefined 
                    })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
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
                  value={project.budget || ''}
                  onChange={(e) => setProject({ ...project, budget: parseFloat(e.target.value) })}
                  error={!!errors.budget}
                  helperText={errors.budget}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={project.location || ''}
                  onChange={(e) => setProject({ ...project, location: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={mockTeamMembers}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={project.team?.map(memberId => 
                    mockTeamMembers.find(m => m.id === memberId) || { id: memberId, name: memberId }
                  ) || []}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => 
                    setProject({ ...project, team: newValue.map(v => typeof v === 'string' ? v : v.id) })
                  }
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
          <Button variant="outlined" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {id ? 'Update Project' : 'Create Project'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ProjectForm; 