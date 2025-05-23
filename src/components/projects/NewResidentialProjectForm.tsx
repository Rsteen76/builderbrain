import React, { useState } from 'react';
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
  Chip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  House as HouseIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Construction as ConstructionIcon,
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
        progress: 0,
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
                        },
                      },
                    }}
                  />
                </Stack>
              </LocalizationProvider>
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
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ConstructionIcon />}
                fullWidth
              >
                {loading ? 'Creating Project...' : 'Create Residential Project'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewResidentialProjectForm; 