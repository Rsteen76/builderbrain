import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { Project, Phase } from '../../types';

// Predefined options for various fields
const projectTypes = [
  'Residential New Construction',
  'Commercial New Construction',
  'Residential Renovation',
  'Commercial Renovation',
  'Infrastructure Project',
  'Landscape Project',
];

const commonPhases = [
  { name: 'Site Preparation', duration: '2-4', description: 'Clearing, grading, and utility setup', dependencies: [] },
  { name: 'Foundation', duration: '3-6', description: 'Excavation, footings, and foundation work', dependencies: ['Site Preparation'] },
  { name: 'Framing', duration: '4-8', description: 'Structural framework and roof', dependencies: ['Foundation'] },
  { name: 'Interior', duration: '6-12', description: 'Plumbing, electrical, HVAC, and finishes', dependencies: ['Framing'] },
  { name: 'Exterior', duration: '2-4', description: 'Siding, windows, and landscaping', dependencies: ['Framing'] },
];

const commonMilestones = [
  { name: 'Permit Approval', date: null, description: 'All required permits obtained' },
  { name: 'Foundation Complete', date: null, description: 'Foundation work inspected and approved' },
  { name: 'Framing Complete', date: null, description: 'Structural framework inspected and approved' },
  { name: 'Rough-in Complete', date: null, description: 'All mechanical systems installed and inspected' },
  { name: 'Final Inspection', date: null, description: 'Project ready for occupancy' },
];

const commonPermits = [
  'Building Permit',
  'Electrical Permit',
  'Plumbing Permit',
  'HVAC Permit',
  'Demolition Permit',
  'Zoning Permit',
  'Environmental Permit',
];

const commonInspections = [
  'Foundation Inspection',
  'Framing Inspection',
  'Electrical Rough-in',
  'Plumbing Rough-in',
  'HVAC Installation',
  'Final Building',
  'Fire Safety',
  'Occupancy',
];

const commonDocuments = [
  'Architectural Drawings',
  'Structural Calculations',
  'Material Specifications',
  'Safety Plan',
  'Environmental Assessment',
  'Insurance Certificates',
  'Contractor Licenses',
  'Warranty Documents',
];

// Define budget interface directly instead of extending Project['budget']
interface EnhancedBudget {
  total: number;
  spent: number;
  remaining: number;
  contingency?: number;
}

const ProjectSetupWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'planning',
    startDate: new Date(),
    endDate: null,
    budget: { total: 0, spent: 0, remaining: 0 },
    location: { address: '', city: '', state: '', zipCode: '' },
    clientId: '',
    projectType: '',
    estimatedDuration: '',
    phases: [],
    keyMilestones: [],
    requirements: {
      permits: [],
      inspections: [],
      documents: []
    },
    team: [],
    lineItems: [],
    bids: [],
    tasks: [],
  });

  const steps = [
    'Project Overview',
    'Budget & Requirements',
    'Timeline & Details',
    'Review & Create',
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBasicInfoChange = (field: keyof Project, value: any) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const handleBudgetChange = (field: keyof EnhancedBudget, value: number) => {
    setProjectData(prev => {
      // Create a normalized budget object that includes both standard budget fields and contingency
      const currentBudget = typeof prev.budget === 'object' 
        ? { ...prev.budget, contingency: (prev.budget as any).contingency || 0 }
        : { total: prev.budget || 0, spent: 0, remaining: prev.budget || 0, contingency: 0 };
      
      // Create a new budget with the updated field
      const newBudget = {
        ...currentBudget,
        [field]: value
      };
      
      // For the Project type, we need to return only the standard budget fields
      const resultBudget = field === 'contingency' 
        ? { total: newBudget.total, spent: newBudget.spent, remaining: newBudget.remaining, contingency: value }
        : { total: newBudget.total, spent: newBudget.spent, remaining: newBudget.remaining };
      
      return {
        ...prev,
        budget: resultBudget
      };
    });
  };

  const handleLocationChange = (field: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      location: {
        ...(typeof prev.location === 'object' ? prev.location : { address: '', city: '', state: '', zipCode: '' }),
        [field]: value,
      }
    }));
  };

  // Fix the addPhase function to include all required fields
  const addPhase = (phaseData?: Partial<Phase>) => {
    const defaultPhase: Phase = {
      name: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 'not_started',
      progress: 0,
      budget: 0,
      actualCost: 0,
      description: '',
      tasks: []
    };

    setProjectData(prev => ({
      ...prev,
      phases: [
        ...(prev.phases || []),
        { ...defaultPhase, ...(phaseData || {}) }
      ],
    }));
  };

  const addMilestone = (milestone?: Required<Project>['keyMilestones'][0]) => {
    setProjectData(prev => ({
      ...prev,
      keyMilestones: [
        ...(prev.keyMilestones || []),
        milestone ? 
          {
            ...milestone,
            // Convert string date to Date object or null if empty
            date: milestone.date ? 
              (typeof milestone.date === 'string' && milestone.date !== '' ? 
                new Date(milestone.date) : milestone.date) 
              : null
          } 
          : { name: '', date: null, description: '' },
      ],
    }));
  };

  const addRequirement = (type: keyof Required<Project>['requirements'], value: string) => {
    setProjectData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [type]: [
          ...(prev.requirements?.[type] || []),
          value
        ],
      } as Required<Project>['requirements'],
    }));
  };

  const handleFinish = async () => {
    if (!user?.uid) {
      setError('You must be logged in to create a project');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: projectData.name || '',
        description: projectData.description || '',
        status: projectData.status || 'planning',
        startDate: projectData.startDate || new Date(),
        endDate: projectData.endDate,
        budget: typeof projectData.budget === 'number'
                ? { total: projectData.budget, spent: 0, remaining: projectData.budget }
                : projectData.budget || { total: 0, spent: 0, remaining: 0 },
        location: typeof projectData.location === 'string'
                ? { address: projectData.location, city: '', state: '', zipCode: '' }
                : projectData.location || { address: '', city: '', state: '', zipCode: '' },
        clientId: projectData.clientId || '',
        projectType: projectData.projectType || '',
        estimatedDuration: projectData.estimatedDuration || '',
        phases: projectData.phases || [],
        keyMilestones: (projectData.keyMilestones || []).map(milestone => ({
          ...milestone,
          // Ensure date is a Date object or null
          date: milestone.date instanceof Date ? milestone.date : 
                (typeof milestone.date === 'string' && milestone.date !== '' ? new Date(milestone.date) : null)
        })),
        requirements: projectData.requirements || { permits: [], inspections: [], documents: [] },
        team: projectData.team || [],
        lineItems: projectData.lineItems || [],
        bids: projectData.bids || [],
        tasks: projectData.tasks || [],
      };

      const savedProject = await ProjectService.createProject(user.uid, payload);
      navigate(`/projects/${savedProject.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={projectData.name || ''}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  helperText="Enter a clear, descriptive name for your project"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Project Type</InputLabel>
                  <Select
                    value={projectData.projectType || ''}
                    label="Project Type"
                    onChange={(e) => handleBasicInfoChange('projectType', e.target.value)}
                  >
                    {projectTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Project Description"
                  value={projectData.description || ''}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  helperText="Describe the scope of work, key features, and any special requirements"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location Address"
                  value={typeof projectData.location === 'object' ? projectData.location?.address || '' : projectData.location || ''}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  helperText="Full address or site location"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={projectData.clientId || ''}
                  onChange={(e) => handleBasicInfoChange('clientId', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={projectData.startDate ? projectData.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleBasicInfoChange('startDate', new Date(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration (months)"
                  value={projectData.estimatedDuration || ''}
                  onChange={(e) => handleBasicInfoChange('estimatedDuration', e.target.value)}
                  helperText="Expected total project duration"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Budget"
                  value={typeof projectData.budget === 'object' ? projectData.budget?.total || 0 : projectData.budget || 0}
                  onChange={(e) => handleBudgetChange('total', Number(e.target.value))}
                  InputProps={{
                    startAdornment: '$',
                  }}
                  helperText="Total project budget including contingency"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Contingency (%)"
                  value={typeof projectData.budget === 'object' ? 
                    ((projectData.budget as EnhancedBudget)?.contingency || 0) : 
                    (projectData.budget || 0)}
                  onChange={(e) => handleBudgetChange('contingency', Number(e.target.value))}
                  InputProps={{
                    endAdornment: '%',
                  }}
                  helperText="Recommended: 10-15% for new construction, 15-20% for renovations"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Budget Categories
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(typeof projectData.budget === 'object' ? projectData.budget : {}).map(([category, amount]) => (
                    <Grid item xs={12} md={6} key={category}>
                      <TextField
                        fullWidth
                        type="number"
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                        value={amount}
                        onChange={(e) => handleBudgetChange(category as 'total' | 'spent' | 'remaining', Number(e.target.value))}
                        InputProps={{
                          startAdornment: '$',
                        }}
                        helperText={`Estimated ${category} costs`}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Common Project Phases
              </Typography>
              <Grid container spacing={1}>
                {commonPhases.map((phase, idx) => (
                  <Grid item key={idx}>
                    <Chip
                      label={phase.name}
                      onClick={() => addPhase({
                        name: phase.name,
                        description: phase.description,
                        startDate: new Date(),
                        endDate: new Date(),
                        status: 'not_started',
                        progress: 0,
                        budget: 0,
                        actualCost: 0
                      })}
                      sx={{ m: 0.5 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Project Phases
            </Typography>
            {projectData.phases?.map((phase, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phase Name"
                        value={phase.name || ''}
                        onChange={(e) => {
                          const newPhases = [...(projectData.phases || [])];
                          newPhases[index] = { ...newPhases[index], name: e.target.value };
                          setProjectData((prev) => ({
                            ...prev,
                            phases: newPhases,
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Duration (weeks)"
                        value={phase.description || ''}
                        onChange={(e) => {
                          const newPhases = [...(projectData.phases || [])];
                          newPhases[index] = { 
                            ...newPhases[index], 
                            description: e.target.value 
                          };
                          setProjectData((prev) => ({
                            ...prev,
                            phases: newPhases,
                          }));
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description"
                        value={phase.description || ''}
                        onChange={(e) => {
                          const newPhases = [...(projectData.phases || [])];
                          newPhases[index] = { ...newPhases[index], description: e.target.value };
                          setProjectData((prev) => ({
                            ...prev,
                            phases: newPhases,
                          }));
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Key Milestones
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {commonMilestones.map((milestone) => (
                  <Grid item key={milestone.name}>
                    <Chip
                      label={milestone.name}
                      onClick={() => addMilestone(milestone)}
                      sx={{ m: 0.5 }}
                    />
                  </Grid>
                ))}
              </Grid>

              {projectData.keyMilestones?.map((milestone, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Milestone Name"
                          value={milestone.name || ''}
                          onChange={(e) => {
                            const newMilestones = [...(projectData.keyMilestones || [])];
                            newMilestones[index] = { ...newMilestones[index], name: e.target.value };
                            setProjectData((prev) => ({
                              ...prev,
                              keyMilestones: newMilestones,
                            }));
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Target Date"
                          value={milestone.date instanceof Date ? milestone.date.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const newMilestones = [...(projectData.keyMilestones || [])];
                            // Convert the string date to a Date object or null if empty
                            const dateValue = e.target.value ? new Date(e.target.value) : null;
                            newMilestones[index] = { ...newMilestones[index], date: dateValue };
                            setProjectData((prev) => ({
                              ...prev,
                              keyMilestones: newMilestones,
                            }));
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Description"
                          value={milestone.description || ''}
                          onChange={(e) => {
                            const newMilestones = [...(projectData.keyMilestones || [])];
                            newMilestones[index] = { ...newMilestones[index], description: e.target.value };
                            setProjectData((prev) => ({
                              ...prev,
                              keyMilestones: newMilestones,
                            }));
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Required Permits
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {commonPermits.map((permit) => (
                    <Grid item key={permit}>
                      <Chip
                        label={permit}
                        onClick={() => addRequirement('permits', permit)}
                        sx={{ m: 0.5 }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <List>
                  {projectData.requirements?.permits?.map((permit, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newPermits = projectData.requirements?.permits?.filter((_, i) => i !== index) || [];
                            setProjectData((prev) => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                permits: newPermits,
                                inspections: prev.requirements?.inspections || [],
                                documents: prev.requirements?.documents || []
                              },
                            }));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={permit} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Required Inspections
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {commonInspections.map((inspection) => (
                    <Grid item key={inspection}>
                      <Chip
                        label={inspection}
                        onClick={() => addRequirement('inspections', inspection)}
                        sx={{ m: 0.5 }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <List>
                  {projectData.requirements?.inspections?.map((inspection, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newInspections = projectData.requirements?.inspections?.filter((_, i) => i !== index) || [];
                            setProjectData((prev) => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                permits: prev.requirements?.permits || [],
                                inspections: newInspections,
                                documents: prev.requirements?.documents || []
                              },
                            }));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={inspection} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Required Documents
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {commonDocuments.map((document) => (
                    <Grid item key={document}>
                      <Chip
                        label={document}
                        onClick={() => addRequirement('documents', document)}
                        sx={{ m: 0.5 }}
                      />
                    </Grid>
                  ))}
                </Grid>
                <List>
                  {projectData.requirements?.documents?.map((document, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newDocuments = projectData.requirements?.documents?.filter((_, i) => i !== index) || [];
                            setProjectData((prev) => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                permits: prev.requirements?.permits || [],
                                inspections: prev.requirements?.inspections || [],
                                documents: newDocuments
                              },
                            }));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={document} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleFinish}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Create Project
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectSetupWizard;