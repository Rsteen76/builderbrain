import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  useTheme,
  alpha,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  House as HouseIcon,
  Business as CommercialIcon,
  Construction as ConstructionIcon,
  Landscape as LandscapeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService } from '../services/project';
import PageLayout from '../components/layout/PageLayout';
import PhaseSetupStepper from '../components/projects/PhaseSetupStepper';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ProjectStatus, Phase } from '../types';

// Define the project data interface
interface ProjectData {
  name: string;
  description: string;
  projectType: string;
  startDate: Date;
  endDate: Date | null;
  budget: number;
  status: ProjectStatus;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Steps for the project creation wizard
const steps = [
  'Select Template',
  'Project Details',
  'Customize Phases',
  'Review & Create'
];

// Define project template types
const PROJECT_TEMPLATES = [
  {
    id: 'residential',
    name: 'Residential Construction',
    icon: <HouseIcon fontSize="large" />,
    description: 'Single-family homes, multi-family units, renovations, and additions.',
    phases: [
      'Pre-Construction',
      'Site Work & Foundation',
      'Framing',
      'Exterior Finishing',
      'Rough-In Mechanical Systems',
      'Insulation & Drywall',
      'Interior Finishing',
      'Mechanical Trim-Out',
      'Landscaping & Exterior Work',
      'Final Inspection & Closeout',
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Building',
    icon: <CommercialIcon fontSize="large" />,
    description: 'Office buildings, retail spaces, warehouses, and industrial facilities.',
    phases: [
      'Pre-Construction & Planning',
      'Site Preparation',
      'Foundation & Structural Frame',
      'Building Envelope',
      'Core & Shell Construction',
      'MEP Rough-Ins',
      'Interior Construction',
      'Building Systems Installation',
      'Interior Finishes',
      'Site Work & Landscaping',
      'Final Inspections & Commissioning',
    ]
  },
  {
    id: 'renovation',
    name: 'Renovation Project',
    icon: <ConstructionIcon fontSize="large" />,
    description: 'Remodeling existing structures, tenant improvements, and historic renovations.',
    phases: [
      'Project Planning & Design',
      'Demolition & Site Preparation',
      'Structural Modifications',
      'MEP Rough-Ins',
      'Drywall & Interior Framing',
      'Interior Finishes',
      'Fixture & Equipment Installation',
      'Final Finishes & Detailing',
      'Final Inspections & Closeout',
    ]
  },
  {
    id: 'landscaping',
    name: 'Landscaping Project',
    icon: <LandscapeIcon fontSize="large" />,
    description: 'Outdoor spaces, hardscaping, softscaping, and landscape construction.',
    phases: [
      'Site Analysis & Planning',
      'Demolition & Site Preparation',
      'Drainage & Irrigation',
      'Hardscape Installation',
      'Structural Elements',
      'Soil Preparation',
      'Plant Installation',
      'Lighting & Electrical',
      'Finishing Touches',
      'Final Inspection & Cleanup',
    ]
  },
  {
    id: 'custom',
    name: 'Custom Project',
    icon: <BusinessIcon fontSize="large" />,
    description: 'Create your own project structure with custom phases tailored to your specific needs.',
    phases: []
  }
];

const NewCustomProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [projectBasicData, setProjectBasicData] = useState<ProjectData>({
    name: '',
    description: '',
    projectType: '',
    startDate: new Date(),
    endDate: null,
    budget: 0,
    status: 'planning',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [customPhases, setCustomPhases] = useState<Phase[]>([]);
  
  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    
    if (template) {
      // Initialize phases from template
      const initialPhases: Phase[] = template.phases.map((phaseName, index) => ({
        id: `phase-${index}`,
        name: phaseName,
        description: `Description for ${phaseName}`,
        budget: 0,
        actualCost: 0,
        progress: 0,
        status: 'not_started' as const,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      }));
      
      setCustomPhases(initialPhases);
    }
    
    handleNext();
  };
  
  // Handle project basic data from ProjectForm
  const handleProjectDataSave = (data: ProjectData) => {
    setProjectBasicData(data);
    handleNext();
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Handle phase customization
  const handlePhaseChange = (updatedPhases: Phase[]) => {
    setCustomPhases(updatedPhases);
  };
  
  // Handle project creation
  const handleCreateProject = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure status is one of the allowed values
      const status = projectBasicData.status as ProjectStatus;
      
      // Convert phases to the format expected by the API
      const formattedPhases = customPhases.map(phase => {
        // Ensure phase status is one of the valid Phase status types
        const validStatus: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'delayed' = 
          (phase.status === 'not_started' || 
           phase.status === 'in_progress' || 
           phase.status === 'completed' || 
           phase.status === 'on_hold' || 
           phase.status === 'delayed') 
            ? phase.status 
            : 'not_started';
        
        // Create a proper Phase object with all required fields
        return {
          id: phase.id || `phase-${Math.random().toString(36).substring(2, 9)}`,
          name: phase.name,
          description: phase.description || '',
          budget: phase.budget || 0,
          actualCost: phase.actualCost || 0,
          progress: phase.progress || 0,
          status: validStatus,
          startDate: phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate),
          endDate: phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate),
        } as Phase;
      });
      
      // Combine project data with phases
      const projectData = {
        ...projectBasicData,
        phases: formattedPhases,
        projectTemplate: selectedTemplate || 'custom',
        status
      };
      
      // Create project
      const createdProject = await ProjectService.createProject(user.uid, projectData);
      
      // Navigate to the project detail page
      navigate(`/projects/${createdProject.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render template selection step
  const renderTemplateSelection = () => (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Select a Project Template
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a template that best fits your project type. You can customize the phases in the next steps.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {PROJECT_TEMPLATES.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.1)}`,
                },
              }}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  justifyContent: 'center',
                  color: theme.palette.primary.main
                }}>
                  {template.icon}
                </Box>
                <Typography variant="h6" component="div" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                
                {template.phases.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {template.phases.length} standard phases included
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
  
  // Render project details step
  const renderProjectDetails = () => (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Project Details
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Enter the basic information for your project. You can customize phases in the next step.
        </Typography>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectBasicData?.name || ''}
                onChange={(e) => setProjectBasicData((prev: ProjectData) => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Project Type"
                value={projectBasicData?.projectType || ''}
                onChange={(e) => setProjectBasicData((prev: ProjectData) => ({ ...prev, projectType: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Project Description"
                value={projectBasicData?.description || ''}
                onChange={(e) => setProjectBasicData((prev: ProjectData) => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={projectBasicData?.startDate || new Date()}
                  onChange={(date) => setProjectBasicData((prev: ProjectData) => ({ ...prev, startDate: date || new Date() }))}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date (Estimated)"
                  value={projectBasicData?.endDate || null}
                  onChange={(date) => setProjectBasicData((prev: ProjectData) => ({ ...prev, endDate: date }))}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={projectBasicData?.budget || ''}
                onChange={(e) => setProjectBasicData((prev: ProjectData) => ({ ...prev, budget: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={projectBasicData?.status || 'planning'}
                  label="Status"
                  onChange={(e) => setProjectBasicData((prev: ProjectData) => ({ ...prev, status: e.target.value as ProjectStatus }))}
                >
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="estimate">Estimate</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Initialize with default values if not set
                const formattedData: ProjectData = {
                  ...projectBasicData,
                  name: projectBasicData.name || 'Untitled Project',
                  description: projectBasicData.description || '',
                  projectType: projectBasicData.projectType || selectedTemplate || 'Custom Project',
                  startDate: projectBasicData.startDate || new Date(),
                  endDate: projectBasicData.endDate || null,
                  status: projectBasicData.status || 'planning',
                  budget: projectBasicData.budget || 0,
                  location: projectBasicData.location || { 
                    address: '', 
                    city: '', 
                    state: '', 
                    zipCode: '' 
                  },
                };
                
                setProjectBasicData(formattedData);
                handleNext();
              }}
            >
              Continue to Customize Phases
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
  
  // Render phase customization step
  const renderPhaseCustomization = () => (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Customize Project Phases
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review, modify, add or remove phases for your project. You can adjust budget allocations and timeline.
        </Typography>
      </Box>
      
      <PhaseSetupStepper
        phases={customPhases}
        onChange={handlePhaseChange}
        projectStartDate={projectBasicData?.startDate || new Date()}
        projectEndDate={projectBasicData?.endDate || null}
        projectBudget={projectBasicData?.budget || 0}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
        >
          Continue to Review
        </Button>
      </Box>
    </Container>
  );
  
  // Render review step
  const renderReview = () => (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Review Project Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review all information before creating your project.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Typography variant="subtitle2">Name:</Typography>
              <Typography variant="body1" gutterBottom>{projectBasicData?.name}</Typography>
              
              <Typography variant="subtitle2">Description:</Typography>
              <Typography variant="body1" gutterBottom>{projectBasicData?.description}</Typography>
              
              <Typography variant="subtitle2">Budget:</Typography>
              <Typography variant="body1" gutterBottom>
                ${projectBasicData?.budget?.toLocaleString() || '0'}
              </Typography>
              
              <Typography variant="subtitle2">Start Date:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectBasicData?.startDate?.toLocaleDateString() || 'Not set'}
              </Typography>
              
              <Typography variant="subtitle2">End Date:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectBasicData?.endDate?.toLocaleDateString() || 'Not set'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Phases ({customPhases.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {customPhases.map((phase, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < customPhases.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none' }}>
                  <Typography variant="subtitle2">{phase.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget: ${phase.budget?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateProject}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          Create Project
        </Button>
      </Box>
    </Container>
  );
  
  // Render content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderTemplateSelection();
      case 1:
        return renderProjectDetails();
      case 2:
        return renderPhaseCustomization();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };
  
  return (
    <PageLayout title="Create Custom Project" icon={BusinessIcon}>
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      {renderStepContent()}
      
      {activeStep > 0 && activeStep < 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, pl: 3 }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
        </Box>
      )}
    </PageLayout>
  );
};

export default NewCustomProjectPage; 