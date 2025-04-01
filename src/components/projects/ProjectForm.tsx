import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  FormHelperText,
  InputAdornment,
  IconButton,
  SelectChangeEvent,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { ProjectService } from '../../services/project';
import { Project } from '../../types';
import PageLayout from '../layout/PageLayout';

// Predefined project types for select input
const PROJECT_TYPES = [
  'Residential New Construction',
  'Commercial New Construction', 
  'Residential Renovation',
  'Commercial Renovation',
  'Landscaping',
  'Infrastructure',
  'Interior Design',
  'Other'
];

// Project statuses for select input
const PROJECT_STATUSES = [
  { value: 'estimate', label: 'Estimate' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Project priorities for select input
const PROJECT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface FormErrors {
  name?: string;
  budget?: string;
  startDate?: string;
  [key: string]: string | undefined;
}

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme(); // Add theme hook
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [project, setProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: new Date(),
    endDate: null,
    budget: { total: 0, spent: 0, remaining: 0 },
    location: { address: '', city: '', state: '', zipCode: '' },
    projectType: '',
    clientId: '',
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || !user?.uid) return;

      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching project ${id} for editing by user ${user.uid}`);
        
        // Ensure we're passing parameters in the correct order (projectId, userId)
        const projectData = await ProjectService.getProject(id, user.uid);
        
        if (!projectData) {
          console.error(`Project with ID ${id} not found`);
          setError(`Project with ID ${id} not found or not accessible. Please check the project ID and try again.`);
          return;
        }
        
        console.log('Project data loaded successfully:', projectData.name);
        setProject(projectData);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(`Failed to load project: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, user?.uid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setProject(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    if (name) {
      setProject(prev => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    }
  };

  const handleDateChange = (date: Date | null, fieldName: string) => {
    setProject(prev => ({
      ...prev,
      [fieldName]: date
    }));

    // Clear error for this field if it exists
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setProject(prev => ({
      ...prev,
      location: {
        ...(typeof prev.location === 'object' ? prev.location : { address: '', city: '', state: '', zipCode: '' }),
        [name.replace('location_', '')]: value
      }
    }));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setProject(prev => {
      const currentBudget = typeof prev.budget === 'object' 
        ? prev.budget 
        : { total: prev.budget || 0, spent: 0, remaining: (prev.budget || 0) };
      
      return {
        ...prev,
        budget: {
          ...currentBudget,
          [name.replace('budget_', '')]: numValue,
          // Update remaining automatically
          remaining: name === 'budget_total' 
            ? numValue - (currentBudget?.spent || 0)
            : (currentBudget?.total || 0) - numValue
        }
      };
    });

    // Clear budget error if it exists
    if (formErrors.budget) {
      setFormErrors(prev => ({
        ...prev,
        budget: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!project.name?.trim()) {
      errors.name = 'Project name is required';
    }
    
    if (!project.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (typeof project.budget === 'object' && (project.budget?.total || 0) <= 0) {
      errors.budget = 'Budget must be greater than zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.uid) {
      setError('You must be logged in to save a project');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (isEditMode && id) {
        // Update existing project
        console.log('Updating project:', project);
        await ProjectService.updateProject(id, project);
        setSuccess('Project updated successfully');
        setTimeout(() => navigate(`/projects/${id}`), 1500);
      } else {
        // Create new project
        console.log('Creating new project:', project);
        const newProject = await ProjectService.createProject(user.uid, project as Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
        setSuccess('Project created successfully');
        setTimeout(() => navigate(`/projects/${newProject.id}`), 1500);
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout 
      title={isEditMode ? 'Edit Project' : 'Create Project'} 
      icon={BusinessIcon}
      breadcrumbs={[
        { label: 'Projects', path: '/projects' },
        { label: isEditMode ? 'Edit Project' : 'Create Project', path: '#' }
      ]}
    >
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ mr: 1 }} /> Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Name"
                  name="name"
                  value={project.name || ''}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Project Type</InputLabel>
                  <Select
                    name="projectType"
                    value={project.projectType || ''}
                    label="Project Type"
                    onChange={handleSelectChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <CategoryIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {PROJECT_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Project Description"
                  name="description"
                  value={project.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter a detailed description of the project..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon color="action" sx={{ alignSelf: 'flex-start', mt: 1 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Status and Priority Section */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Project Status</InputLabel>
                  <Select
                    name="status"
                    value={project.status || 'planning'}
                    label="Project Status"
                    onChange={handleSelectChange}
                  >
                    {PROJECT_STATUSES.map(status => (
                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={project.priority || 'medium'}
                    label="Priority"
                    onChange={handleSelectChange}
                  >
                    {PROJECT_PRIORITIES.map(priority => (
                      <MenuItem key={priority.value} value={priority.value}>{priority.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Schedule Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1 }} /> Schedule
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={project.startDate}
                    onChange={(date) => handleDateChange(date, 'startDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!formErrors.startDate,
                        helperText: formErrors.startDate,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon color="action" />
                            </InputAdornment>
                          ),
                        },
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date (Optional)"
                    value={project.endDate}
                    onChange={(date) => handleDateChange(date, 'endDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: project.endDate && (
                            <InputAdornment position="end">
                              <IconButton 
                                onClick={() => handleDateChange(null, 'endDate')}
                                edge="end"
                                size="small"
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Budget Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 1 }} /> Budget
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Budget"
                  name="budget_total"
                  type="number"
                  value={typeof project.budget === 'object' ? project.budget?.total || 0 : project.budget || 0}
                  onChange={handleBudgetChange}
                  error={!!formErrors.budget}
                  helperText={formErrors.budget}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Spent"
                  name="budget_spent"
                  type="number"
                  value={typeof project.budget === 'object' ? project.budget?.spent || 0 : 0}
                  onChange={handleBudgetChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Remaining"
                  name="budget_remaining"
                  type="number"
                  value={typeof project.budget === 'object' ? project.budget?.remaining || 0 : project.budget || 0}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Location Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1 }} /> Location
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="location_address"
                  value={typeof project.location === 'object' ? project.location.address || '' : project.location || ''}
                  onChange={handleLocationChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  name="location_city"
                  value={typeof project.location === 'object' ? project.location.city || '' : ''}
                  onChange={handleLocationChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  name="location_state"
                  value={typeof project.location === 'object' ? project.location.state || '' : ''}
                  onChange={handleLocationChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="location_zipCode"
                  value={typeof project.location === 'object' ? project.location.zipCode || '' : ''}
                  onChange={handleLocationChange}
                />
              </Grid>
              
              {/* Client Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} /> Client Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  name="clientId"
                  value={project.clientId || ''}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Form Actions */}
              <Grid item xs={12}>
                <Divider sx={{ mt: 2, mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate('/projects')}
                    startIcon={<CancelIcon />}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={submitting}
                    sx={{ 
                      backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      '&:hover': {
                        boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    {isEditMode ? 'Save Changes' : 'Create Project'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}
    </PageLayout>
  );
};

export default ProjectForm;