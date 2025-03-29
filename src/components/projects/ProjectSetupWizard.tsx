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
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  Autocomplete,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
  { name: 'Permit Approval', date: '', description: 'All required permits obtained' },
  { name: 'Foundation Complete', date: '', description: 'Foundation work inspected and approved' },
  { name: 'Framing Complete', date: '', description: 'Structural framework inspected and approved' },
  { name: 'Rough-in Complete', date: '', description: 'All mechanical systems installed and inspected' },
  { name: 'Final Inspection', date: '', description: 'Project ready for occupancy' },
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

interface ProjectSetupData {
  basicInfo: {
    name: string;
    description: string;
    location: string;
    startDate: string;
    estimatedDuration: string;
    clientName: string;
    projectType: string;
  };
  budget: {
    totalBudget: number;
    contingency: number;
    categories: {
      materials: number;
      labor: number;
      equipment: number;
      permits: number;
      other: number;
    };
  };
  phases: {
    name: string;
    duration: string;
    description: string;
    dependencies: string[];
  }[];
  keyMilestones: {
    name: string;
    date: string;
    description: string;
  }[];
  requirements: {
    permits: string[];
    inspections: string[];
    documents: string[];
  };
}

const ProjectSetupWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectSetupData>({
    basicInfo: {
      name: '',
      description: '',
      location: '',
      startDate: '',
      estimatedDuration: '',
      clientName: '',
      projectType: '',
    },
    budget: {
      totalBudget: 0,
      contingency: 0,
      categories: {
        materials: 0,
        labor: 0,
        equipment: 0,
        permits: 0,
        other: 0,
      },
    },
    phases: [],
    keyMilestones: [],
    requirements: {
      permits: [],
      inspections: [],
      documents: [],
    },
  });

  const steps = [
    'Project Overview',
    'Budget Planning',
    'Timeline & Phases',
    'Requirements',
  ];

  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBasicInfoChange = (field: keyof ProjectSetupData['basicInfo'], value: string) => {
    setProjectData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value,
      },
    }));
  };

  const handleBudgetChange = (field: keyof ProjectSetupData['budget']['categories'], value: number) => {
    setProjectData((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        categories: {
          ...prev.budget.categories,
          [field]: value,
        },
      },
    }));
  };

  const addPhase = (phase?: typeof commonPhases[0]) => {
    setProjectData((prev) => ({
      ...prev,
      phases: [
        ...prev.phases,
        phase || {
          name: '',
          duration: '',
          description: '',
          dependencies: [],
        },
      ],
    }));
  };

  const addMilestone = (milestone?: typeof commonMilestones[0]) => {
    setProjectData((prev) => ({
      ...prev,
      keyMilestones: [
        ...prev.keyMilestones,
        milestone || {
          name: '',
          date: '',
          description: '',
        },
      ],
    }));
  };

  const addRequirement = (type: keyof ProjectSetupData['requirements'], value: string) => {
    setProjectData((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [type]: [...prev.requirements[type], value],
      },
    }));
  };

  const handleFinish = () => {
    console.log('Project data:', projectData);
    navigate('/projects');
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
                  value={projectData.basicInfo.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  helperText="Enter a clear, descriptive name for your project"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Project Type</InputLabel>
                  <Select
                    value={projectData.basicInfo.projectType}
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
                  value={projectData.basicInfo.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  helperText="Describe the scope of work, key features, and any special requirements"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={projectData.basicInfo.location}
                  onChange={(e) => handleBasicInfoChange('location', e.target.value)}
                  helperText="Full address or site location"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  value={projectData.basicInfo.clientName}
                  onChange={(e) => handleBasicInfoChange('clientName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={projectData.basicInfo.startDate}
                  onChange={(e) => handleBasicInfoChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration (months)"
                  value={projectData.basicInfo.estimatedDuration}
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
                  value={projectData.budget.totalBudget}
                  onChange={(e) => setProjectData((prev) => ({
                    ...prev,
                    budget: {
                      ...prev.budget,
                      totalBudget: Number(e.target.value),
                    },
                  }))}
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
                  value={projectData.budget.contingency}
                  onChange={(e) => setProjectData((prev) => ({
                    ...prev,
                    budget: {
                      ...prev.budget,
                      contingency: Number(e.target.value),
                    },
                  }))}
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
                  {Object.entries(projectData.budget.categories).map(([category, amount]) => (
                    <Grid item xs={12} md={6} key={category}>
                      <TextField
                        fullWidth
                        type="number"
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                        value={amount}
                        onChange={(e) => handleBudgetChange(category as keyof ProjectSetupData['budget']['categories'], Number(e.target.value))}
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
                {commonPhases.map((phase) => (
                  <Grid item key={phase.name}>
                    <Chip
                      label={phase.name}
                      onClick={() => addPhase(phase)}
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
            {projectData.phases.map((phase, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phase Name"
                        value={phase.name}
                        onChange={(e) => {
                          const newPhases = [...projectData.phases];
                          newPhases[index].name = e.target.value;
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
                        value={phase.duration}
                        onChange={(e) => {
                          const newPhases = [...projectData.phases];
                          newPhases[index].duration = e.target.value;
                          setProjectData((prev) => ({
                            ...prev,
                            phases: newPhases,
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description"
                        value={phase.description}
                        onChange={(e) => {
                          const newPhases = [...projectData.phases];
                          newPhases[index].description = e.target.value;
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

              {projectData.keyMilestones.map((milestone, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Milestone Name"
                          value={milestone.name}
                          onChange={(e) => {
                            const newMilestones = [...projectData.keyMilestones];
                            newMilestones[index].name = e.target.value;
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
                          value={milestone.date}
                          onChange={(e) => {
                            const newMilestones = [...projectData.keyMilestones];
                            newMilestones[index].date = e.target.value;
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
                          value={milestone.description}
                          onChange={(e) => {
                            const newMilestones = [...projectData.keyMilestones];
                            newMilestones[index].description = e.target.value;
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
                  {projectData.requirements.permits.map((permit, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newPermits = projectData.requirements.permits.filter((_, i) => i !== index);
                            setProjectData((prev) => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                permits: newPermits,
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
                  {projectData.requirements.inspections.map((inspection, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newInspections = projectData.requirements.inspections.filter((_, i) => i !== index);
                            setProjectData((prev) => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                inspections: newInspections,
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
                  {projectData.requirements.documents.map((document, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newDocuments = projectData.requirements.documents.filter((_, i) => i !== index);
                            setProjectData((prev) => ({
                              ...prev,
                              requirements: {
                                ...prev.requirements,
                                documents: newDocuments,
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

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleFinish}
            >
              Finish
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectSetupWizard; 