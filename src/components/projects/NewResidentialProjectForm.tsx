import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  House as HouseIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Construction as ConstructionIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';

const RESIDENTIAL_PROJECT_TYPES = [
  'New Construction - Single Family',
  'New Construction - Multi Family',
  'Addition',
  'Renovation',
  'Custom Home',
  'Spec Home',
];

// Industry standard minimum phase durations in days
const MIN_PHASE_DURATIONS: Record<string, number> = {
  'Pre-Construction': 14,
  'Site Work & Foundation': 14,
  'Framing': 14,
  'Exterior Finishing': 10,
  'Rough-In Mechanical Systems': 10,
  'Insulation & Drywall': 7,
  'Interior Finishing': 14,
  'Mechanical Trim-Out': 7,
  'Landscaping & Exterior Work': 5,
  'Final Inspection & Closeout': 3,
  // Default for any other phase
  'default': 7
};

const MIN_PROJECT_DURATION_DAYS = 90; // ~3 months minimum for a realistic residential project
const MAX_PHASE_COUNT = 10; // Most residential projects have up to 10 major phases

// Timeline validation interfaces
interface TimelineValidationIssue {
  severity: 'warning' | 'error' | 'info';
  message: string;
  recommendation?: string;
}

interface TimelineValidationResult {
  valid: boolean;
  issues: TimelineValidationIssue[];
}

const NewResidentialProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    residentialType: 'New Construction - Single Family',
    clientId: '',
    status: 'planning',
    startDate: new Date(),
    endDate: null as Date | null,
    budget: '' as string | number,
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
    squareFeet: '' as string | number,
    stories: '1',
    bedrooms: '3',
    bathrooms: '2',
  });

  // Add state for timeline validation
  const [timelineValidation, setTimelineValidation] = useState<TimelineValidationResult>({
    valid: true,
    issues: []
  });
  
  // Add state for showing/hiding the validation panel
  const [showValidation, setShowValidation] = useState(false);
  
  // Function to validate timeline
  const validateTimeline = (): TimelineValidationResult => {
    const issues: TimelineValidationIssue[] = [];
    
    // Check if start and end dates are defined
    if (!formData.startDate || !formData.endDate) {
      issues.push({
        severity: 'warning',
        message: 'End date is not set',
        recommendation: 'Setting an end date helps with better project planning'
      });
      return { valid: true, issues }; // Not critical at form stage
    }
    
    // Calculate project duration
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const projectDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if project duration is negative (end before start)
    if (projectDurationDays <= 0) {
      issues.push({
        severity: 'error',
        message: 'Project end date is before or same as start date',
        recommendation: 'Please set an end date that is after the start date'
      });
      return { valid: false, issues };
    }
    
    // Check if project is too short
    if (projectDurationDays < MIN_PROJECT_DURATION_DAYS) {
      issues.push({
        severity: 'warning',
        message: `Project duration (${projectDurationDays} days) is shorter than recommended minimum (${MIN_PROJECT_DURATION_DAYS} days)`,
        recommendation: 'Consider extending your project timeline for a more realistic schedule'
      });
    }
    
    // Add building type specific suggestions
    const squareFeet = parseFloat(formData.squareFeet as string) || 0;
    if (squareFeet > 3000 && projectDurationDays < 180) {
      issues.push({
        severity: 'warning',
        message: `Large homes (${squareFeet} sq ft) typically need more than ${projectDurationDays} days to complete`,
        recommendation: 'Consider extending your timeline for this size of home'
      });
    }
    
    // Analyze based on project type
    if (formData.residentialType.includes('New Construction') && projectDurationDays < 120) {
      issues.push({
        severity: 'info',
        message: 'New construction typically takes 4+ months to complete',
        recommendation: 'Your timeline is ambitious for new construction'
      });
    }
    
    return {
      valid: !issues.some(issue => issue.severity === 'error'),
      issues
    };
  };
  
  // Use effect to validate timeline whenever relevant form data changes
  useEffect(() => {
    const validation = validateTimeline();
    setTimelineValidation(validation);
    
    // Auto-show validation panel if there are errors
    if (validation.issues.some(issue => issue.severity === 'error')) {
      setShowValidation(true);
    }
  }, [formData.startDate, formData.endDate, formData.residentialType, formData.squareFeet]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        [name]: value,
      },
    });
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        startDate: date,
      });
    }
  };
  
  const handleEndDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      endDate: date,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('You must be logged in to create a project');
      return;
    }
    
    // Check for critical timeline issues
    const validation = validateTimeline();
    if (!validation.valid) {
      setError('Please fix the timeline issues before creating the project');
      setShowValidation(true);
      return;
    }
    
    // If there are warnings but no errors, ask for confirmation
    const hasWarnings = validation.issues.some(issue => issue.severity === 'warning');
    if (hasWarnings) {
      const proceed = window.confirm(
        'Your project has some timeline warnings that may affect project management. Proceed anyway?'
      );
      
      if (!proceed) {
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Parse numeric values
      const budget = parseFloat(formData.budget as string) || 0;
      const squareFeet = parseFloat(formData.squareFeet as string) || 0;
      
      // Create a description if none was provided
      const description = formData.description || 
        `${formData.residentialType} project with ${formData.bedrooms} bedrooms, ${formData.bathrooms} bathrooms, and ${squareFeet} square feet.`;
      
      // Create the project data
      const projectData = {
        name: formData.name,
        description,
        status: formData.status as 'planning',
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: {
          total: budget,
          spent: 0,
          remaining: budget,
        },
        location: formData.location,
        projectType: formData.residentialType,
        // Additional metadata for the project
        metadata: {
          squareFeet,
          stories: formData.stories,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
        },
      };
      
      console.log("Creating residential project with data:", projectData);
      
      // Call the residential project template
      const newProject = await ProjectService.createResidentialProject(user.uid, projectData);
      
      console.log("Residential project created:", newProject);
      console.log("Project phases:", newProject.phases?.length || 0);
      console.log("Project tasks:", newProject.tasks?.length || 0);
      
      // Navigate to the new project
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(`Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Timeline validation component
  const TimelineValidationPanel = () => {
    // Group issues by severity
    const errorIssues = timelineValidation.issues.filter(issue => issue.severity === 'error');
    const warningIssues = timelineValidation.issues.filter(issue => issue.severity === 'warning');
    const infoIssues = timelineValidation.issues.filter(issue => issue.severity === 'info');
    
    if (timelineValidation.issues.length === 0) {
      return (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          <AlertTitle>Timeline Looks Good</AlertTitle>
          Your project timeline meets all best practices for construction projects.
        </Alert>
      );
    }
    
    return (
      <Paper sx={{ mt: 2, mb: 2, p: 2, bgcolor: alpha(theme.palette.background.default, 0.7) }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            mb: 1
          }}
          onClick={() => setShowValidation(!showValidation)}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: errorIssues.length > 0 ? 'error.main' : 'warning.main' }} />
            Timeline Analysis
          </Typography>
          {showValidation ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        
        <Collapse in={showValidation}>
          {errorIssues.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Critical Issues</AlertTitle>
              <List dense>
                {errorIssues.map((issue, index) => (
                  <ListItem key={`error-${index}`}>
                    <ListItemText 
                      primary={issue.message} 
                      secondary={issue.recommendation} 
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          
          {warningIssues.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Warnings</AlertTitle>
              <List dense>
                {warningIssues.map((issue, index) => (
                  <ListItem key={`warning-${index}`}>
                    <ListItemText 
                      primary={issue.message} 
                      secondary={issue.recommendation} 
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          
          {infoIssues.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Recommendations</AlertTitle>
              <List dense>
                {infoIssues.map((issue, index) => (
                  <ListItem key={`info-${index}`}>
                    <ListItemText 
                      primary={issue.message} 
                      secondary={issue.recommendation} 
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Based on industry standards for construction projects, we've analyzed your timeline.
            {timelineValidation.valid 
              ? ' You can proceed with project creation.'
              : ' Please address the critical issues before creating your project.'}
          </Typography>
        </Collapse>
      </Paper>
    );
  };
  
  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ConstructionIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h5" fontWeight={600}>New Residential Project</Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Project Name & Type */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleTextChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="residentialType-label">Project Type</InputLabel>
                <Select
                  labelId="residentialType-label"
                  name="residentialType"
                  value={formData.residentialType}
                  onChange={handleSelectChange}
                  label="Project Type"
                  startAdornment={
                    <InputAdornment position="start">
                      <HouseIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {RESIDENTIAL_PROJECT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Project Details */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Project Description"
                name="description"
                value={formData.description}
                onChange={handleTextChange}
                variant="outlined"
                placeholder="Enter project description or leave blank for auto-generation"
                helperText="Optional - will be auto-generated if left blank"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Project Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {/* Budget */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Total Budget"
                name="budget"
                value={formData.budget}
                onChange={handleTextChange}
                variant="outlined"
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormHelperText>
                This budget will be distributed across all construction phases
              </FormHelperText>
            </Grid>
            
            {/* Timeline */}
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: 'outlined',
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                  <DatePicker
                    label="End Date (Estimated)"
                    value={formData.endDate}
                    onChange={handleEndDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: timelineValidation.issues.some(issue => issue.severity === 'error') ? (
                            <InputAdornment position="end">
                              <Tooltip title="Timeline issue detected">
                                <ErrorIcon color="error" fontSize="small" />
                              </Tooltip>
                            </InputAdornment>
                          ) : timelineValidation.issues.some(issue => issue.severity === 'warning') ? (
                            <InputAdornment position="end">
                              <Tooltip title="Timeline warning">
                                <WarningIcon color="warning" fontSize="small" />
                              </Tooltip>
                            </InputAdornment>
                          ) : null,
                        },
                        error: timelineValidation.issues.some(issue => issue.severity === 'error'),
                      },
                    }}
                  />
                </Stack>
              </LocalizationProvider>
              
              {/* Add timeline validation messages */}
              {(formData.startDate && formData.endDate) && (
                <TimelineValidationPanel />
              )}
            </Grid>
            
            {/* Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Property Location
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Street Address"
                name="address"
                value={formData.location.address}
                onChange={handleLocationChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="City"
                name="city"
                value={formData.location.city}
                onChange={handleLocationChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="State"
                name="state"
                value={formData.location.state}
                onChange={handleLocationChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Zip Code"
                name="zipCode"
                value={formData.location.zipCode}
                onChange={handleLocationChange}
                variant="outlined"
              />
            </Grid>
            
            {/* House Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                House Specifications
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                label="Square Feet"
                name="squareFeet"
                value={formData.squareFeet}
                onChange={handleTextChange}
                variant="outlined"
                type="number"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel id="stories-label">Stories</InputLabel>
                <Select
                  labelId="stories-label"
                  name="stories"
                  value={formData.stories}
                  onChange={handleSelectChange}
                  label="Stories"
                >
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4+">4+</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel id="bedrooms-label">Bedrooms</InputLabel>
                <Select
                  labelId="bedrooms-label"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleSelectChange}
                  label="Bedrooms"
                >
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4">4</MenuItem>
                  <MenuItem value="5">5</MenuItem>
                  <MenuItem value="6+">6+</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth required>
                <InputLabel id="bathrooms-label">Bathrooms</InputLabel>
                <Select
                  labelId="bathrooms-label"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleSelectChange}
                  label="Bathrooms"
                >
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="1.5">1.5</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="2.5">2.5</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="3.5">3.5</MenuItem>
                  <MenuItem value="4+">4+</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Template Information */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Alert severity="info" icon={<ConstructionIcon />}>
                <Typography variant="subtitle2">Project Template Features:</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label="10 Construction Phases" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip 
                    label="Predefined Tasks" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label="Timeline Planning" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label="Budget Allocation" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label="17 Subcontractor Types" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                </Box>
              </Alert>
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !timelineValidation.valid}
                startIcon={loading ? <CircularProgress size={20} /> : <ConstructionIcon />}
                fullWidth
              >
                {loading ? 'Creating Project...' : 'Create Residential Project'}
              </Button>
              
              {!timelineValidation.valid && (
                <FormHelperText error sx={{ textAlign: 'center', mt: 1 }}>
                  Please fix timeline issues before creating the project
                </FormHelperText>
              )}
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewResidentialProjectForm; 