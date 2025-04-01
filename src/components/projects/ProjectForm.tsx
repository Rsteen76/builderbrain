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
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';

// Types
interface FormErrors {
  name?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  clientId?: string;
  location?: string;
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

// Define initial project based on imported Project type
const initialProject: Partial<Project> = {
  name: '',
  description: '',
  // Ensure status is a valid value from the Project type's status union
  status: 'estimate', 
  startDate: new Date(),
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
  // Initialize budget/location according to the Project type structure
  budget: { total: 0, spent: 0, remaining: 0 }, 
  location: { address: '', city: '', state: '', zipCode: '' },
  clientId: '',
  team: [],
  // Initialize other fields from Project type
  projectType: '',
  estimatedDuration: '',
  phases: [],
  keyMilestones: [],
  requirements: {
    permits: [],
    inspections: [],
    documents: [],
  },
  lineItems: [],
  bids: [],
  tasks: [],
};

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user
  // Use imported Project type for state
  const [project, setProject] = useState<Partial<Project>>(initialProject);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || !user?.uid) { // Check for user ID too
          if (!id) { /* Handle no ID case if needed */ }
          else { setError('User not authenticated.'); }
          setFetchLoading(false);
          return;
      }
      
      setFetchLoading(true);
      setError(null);
      
      try {
        // Pass userId to getProject
        const projectData = await ProjectService.getProject(user.uid, id);
        if (projectData) {
          // Ensure the fetched data type matches the state type
          setProject(projectData);
        } else {
          setError(`Project with ID ${id} not found or not accessible`);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project data. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    
    // Fetch only if id and user are present
    if (id && user?.uid) {
    fetchProject();
    } else if (!id) {
        // If creating new, ensure defaults are set (already done by useState)
        setProject(initialProject);
        setFetchLoading(false);
    } else {
        // Waiting for user
        setError('Authenticating...');
        setFetchLoading(false);
    }
  }, [id, user]); // Depend on user

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!project.name?.trim()) newErrors.name = 'Project name is required';
    if (!project.description?.trim()) newErrors.description = 'Description is required';
    if (!project.startDate) newErrors.startDate = 'Start date is required';
    if (!project.endDate) newErrors.endDate = 'End date is required';
    if (project.startDate && project.endDate && new Date(project.startDate) > new Date(project.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    // Validate budget based on its type
    const budgetValue = typeof project.budget === 'object' && project.budget !== null ? project.budget.total : project.budget;
    if (budgetValue === undefined || budgetValue === null || budgetValue <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }
    if (!project.clientId) newErrors.clientId = 'Client is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure user is authenticated
    if (!user?.uid) {
        setError("User authentication error. Cannot save project.");
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Prepare data, ensuring it matches the service expectations
    const projectPayload = { ...project }; 
    // Remove fields not needed or handled by service (like id, userId, createdAt, updatedAt)
    delete projectPayload.id;
    delete projectPayload.userId;
    delete projectPayload.createdAt;
    delete projectPayload.updatedAt;
    
    try {
      if (id) {
        // Update existing project - payload needs to match Partial<Omit<Project, 'id' | 'userId'>>
        // Ensure projectPayload conforms to this
        await ProjectService.updateProject(id, projectPayload as Partial<Omit<Project, 'id' | 'userId'>>);
        setSuccessMessage('Project updated successfully');
      } else {
        // Create new project - payload needs to match Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
        // Ensure projectPayload conforms to this (already handled by deleting fields above)
        await ProjectService.createProject(user.uid, projectPayload as Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
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
                    value={project.status || 'estimate'}
                    label="Status"
                    onChange={(e) => setProject({ ...project, status: e.target.value as Project['status'] })}
                  >
                    <MenuItem value="estimate">Estimate</MenuItem>
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
                  value={typeof project.budget === 'object' && project.budget !== null ? project.budget.total : project.budget || ''}
                  onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setProject({ 
                          ...project, 
                          budget: { // Store as object
                              total: value, 
                              spent: typeof project.budget === 'object' ? project.budget.spent : 0, 
                              remaining: typeof project.budget === 'object' ? value - project.budget.spent : value 
                          }
                      });
                  }}
                  error={!!errors.budget}
                  helperText={errors.budget}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location (Address)"
                  value={typeof project.location === 'object' && project.location !== null ? project.location.address : project.location || ''}
                  onChange={(e) => {
                      const value = e.target.value;
                      setProject({ 
                          ...project, 
                          location: { // Store as object
                              address: value, 
                              city: typeof project.location === 'object' ? project.location.city : '', 
                              state: typeof project.location === 'object' ? project.location.state : '', 
                              zipCode: typeof project.location === 'object' ? project.location.zipCode : '' 
                          }
                      });
                  }}
                  error={!!errors.location}
                  helperText={errors.location}
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