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
  AlertTitle,
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
    // Update the field directly
    setProjectData(prev => ({ ...prev, [field]: value }));
    
    // If estimatedDuration or startDate changed, also update the endDate
    if (field === 'estimatedDuration' || field === 'startDate') {
      setProjectData(prev => {
        // Get the current values
        const duration = field === 'estimatedDuration' ? value : prev.estimatedDuration;
        const start = field === 'startDate' ? value : prev.startDate;
        
        // Only proceed if we have both values
        if (!duration || !start) return prev;
        
        // Parse the duration to a number
        const durationMonths = parseFloat(duration);
        if (isNaN(durationMonths)) return prev;
        
        // Calculate the end date
        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + durationMonths);
        
        console.log('Auto-calculated end date:', {
          startDate: start,
          durationMonths,
          calculatedEndDate: endDate
        });
        
        return { ...prev, endDate };
      });
    }
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
    console.log('Adding phase with project data:', {
      projectStartDate: projectData.startDate,
      projectEndDate: projectData.endDate,
      estimatedDuration: projectData.estimatedDuration,
      existingPhases: projectData.phases?.length
    });

    // Calculate project duration in days based on estimatedDuration field
    let projectDurationDays = 30; // Default to 30 days
    
    // If we have both start and end dates, use those to calculate duration
    if (projectData.startDate && projectData.endDate) {
      const startTime = new Date(projectData.startDate).getTime();
      const endTime = new Date(projectData.endDate).getTime();
      if (!isNaN(startTime) && !isNaN(endTime) && endTime > startTime) {
        projectDurationDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
        console.log(`Using project start/end dates to calculate duration: ${projectDurationDays} days`);
      }
    } 
    // Otherwise fall back to estimatedDuration field
    else if (projectData.estimatedDuration) {
      // Convert months to days (approximately)
      const durationMonths = parseFloat(projectData.estimatedDuration);
      if (!isNaN(durationMonths)) {
        projectDurationDays = Math.ceil(durationMonths * 30); // Approximate days in a month
        console.log(`Using estimatedDuration to calculate: ${projectDurationDays} days`);
      }
    }
    
    // Get project start date
    const projectStartDate = projectData.startDate || new Date();
    console.log(`Using project start date: ${projectStartDate.toISOString()}`);
    
    // Determine phase position based on existing phases
    const existingPhases = projectData.phases || [];
    let phaseStartDate, phaseEndDate;
    
    if (existingPhases.length === 0) {
      // First phase starts at project start date
      phaseStartDate = new Date(projectStartDate);
      phaseEndDate = new Date(projectStartDate);
      // First phase takes up to 1/4 of the project time
      phaseEndDate.setDate(phaseStartDate.getDate() + Math.ceil(projectDurationDays / 4));
      console.log(`First phase: start=${phaseStartDate.toISOString()}, end=${phaseEndDate.toISOString()}`);
    } else {
      // Find the latest end date of existing phases
      const existingPhasesEndDates = existingPhases
        .map(phase => phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate || ''))
        .filter(date => !isNaN(date.getTime()));
      
      if (existingPhasesEndDates.length > 0) {
        // Find the latest end date
        const latestEndDate = new Date(Math.max(...existingPhasesEndDates.map(date => date.getTime())));
        
        // New phase starts after the last phase ends
        phaseStartDate = new Date(latestEndDate);
        phaseStartDate.setDate(phaseStartDate.getDate() + 1);
        
        // Calculate phase duration - try to distribute remaining time
        const remainingPhases = 5 - existingPhases.length; // Assuming approx 5 phases in a project
        const phaseDuration = Math.max(14, Math.ceil(projectDurationDays / Math.max(remainingPhases, 1)));
        
        phaseEndDate = new Date(phaseStartDate);
        phaseEndDate.setDate(phaseStartDate.getDate() + phaseDuration);
        console.log(`Subsequent phase: start=${phaseStartDate.toISOString()}, end=${phaseEndDate.toISOString()}`);
      } else {
        // Fallback if no valid end dates
        phaseStartDate = new Date(projectStartDate);
        phaseStartDate.setDate(projectStartDate.getDate() + existingPhases.length * 14);
        
        phaseEndDate = new Date(phaseStartDate);
        phaseEndDate.setDate(phaseStartDate.getDate() + 14); // Two weeks default
        console.log(`Fallback phase: start=${phaseStartDate.toISOString()}, end=${phaseEndDate.toISOString()}`);
      }
    }
    
    // Ensure the dates are valid
    if (isNaN(phaseStartDate.getTime())) phaseStartDate = new Date();
    if (isNaN(phaseEndDate.getTime())) {
      phaseEndDate = new Date(phaseStartDate);
      phaseEndDate.setDate(phaseStartDate.getDate() + 14);
    }
    
    const defaultPhase: Phase = {
      name: '',
      startDate: phaseStartDate,
      endDate: phaseEndDate,
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

    // Validate timeline before proceeding
    const validation = validateProjectTimeline(projectData);
    const hasErrors = validation.issues.some(issue => issue.severity === 'error');
    const hasWarnings = validation.issues.some(issue => issue.severity === 'warning');
    
    // Don't allow project creation if there are critical errors
    if (hasErrors) {
      setError('Please fix the critical timeline issues before creating the project');
      setActiveStep(3); // Ensure we stay on the review step
      return;
    }
    
    // If there are warnings but no errors, ask for confirmation
    if (hasWarnings) {
      const proceed = window.confirm(
        'Your project has some timeline warnings that may affect project management. Proceed anyway?'
      );
      
      if (!proceed) {
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Debug log for project dates before any adjustments
      console.log('Project dates before adjustment:', {
        startDate: projectData.startDate,
        endDate: projectData.endDate
      });
      
      // Ensure phase dates align with project start date
      const projectStartDate = projectData.startDate || new Date();
      let adjustedPhases = [...(projectData.phases || [])];
      
      if (adjustedPhases.length > 0) {
        // Find the earliest phase start date in the current phases
        const earliestPhaseDate = adjustedPhases.reduce((earliest, phase) => {
          const phaseStart = phase.startDate instanceof Date ? 
            phase.startDate : new Date(phase.startDate || new Date());
          return phaseStart < earliest ? phaseStart : earliest;
        }, new Date(8640000000000000)); // Max date value
        
        // Calculate the offset between project start date and earliest phase date
        const timeOffset = projectStartDate.getTime() - earliestPhaseDate.getTime();
        
        // Only adjust if the offset is significant (more than a day)
        if (Math.abs(timeOffset) > 86400000) {
          // Adjust all phase dates by this offset
          adjustedPhases = adjustedPhases.map(phase => {
            const phaseStartDate = phase.startDate instanceof Date ? 
              phase.startDate : new Date(phase.startDate || new Date());
            const phaseEndDate = phase.endDate instanceof Date ? 
              phase.endDate : new Date(phase.endDate || new Date());
            
            // Apply offset to both start and end dates
            const adjustedStartDate = new Date(phaseStartDate.getTime() + timeOffset);
            const adjustedEndDate = new Date(phaseEndDate.getTime() + timeOffset);
            
            return {
              ...phase,
              startDate: adjustedStartDate,
              endDate: adjustedEndDate
            };
          });
          
          console.log('Adjusted phase dates to align with project start date:', {
            projectStartDate,
            earliestPhaseDate,
            timeOffset: `${timeOffset / (1000 * 60 * 60 * 24)} days`,
            adjustedPhases: adjustedPhases.map(p => ({
              name: p.name,
              startDate: p.startDate,
              endDate: p.endDate
            }))
          });
        }
      }

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
        phases: adjustedPhases,
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

      // Debug log final project payload including dates
      console.log('Final project payload:', {
        startDate: payload.startDate,
        endDate: payload.endDate,
        phases: payload.phases?.map(p => ({
          name: p.name,
          startDate: p.startDate instanceof Date ? p.startDate.toISOString() : p.startDate,
          endDate: p.endDate instanceof Date ? p.endDate.toISOString() : p.endDate
        })) || []
      });

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
                  type="date"
                  label="End Date"
                  value={projectData.endDate ? projectData.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleBasicInfoChange('endDate', new Date(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                  helperText="Expected project completion date"
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
            <Typography variant="h6" gutterBottom>
              Project Review Summary
            </Typography>
            
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Project Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Project Name" 
                          secondary={projectData.name || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Project Type" 
                          secondary={projectData.projectType || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Timeline" 
                          secondary={`${projectData.startDate ? new Date(projectData.startDate).toLocaleDateString() : 'Not set'} - ${projectData.endDate ? new Date(projectData.endDate).toLocaleDateString() : 'Not set'}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Budget" 
                          secondary={`$${typeof projectData.budget === 'object' ? projectData.budget.total.toLocaleString() : (projectData.budget || 0).toLocaleString()}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Project Statistics
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Number of Phases" 
                          secondary={projectData.phases?.length || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Number of Milestones" 
                          secondary={projectData.keyMilestones?.length || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Required Permits" 
                          secondary={projectData.requirements?.permits?.length || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Required Inspections" 
                          secondary={projectData.requirements?.inspections?.length || 0}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <TimelineReviewSection projectData={projectData} />
            
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
              disabled={loading || validateProjectTimeline(projectData).issues.some(issue => issue.severity === 'error')}
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

// Timeline analysis component to check if the project timeline is realistic
interface TimelineValidationResult {
  valid: boolean;
  issues: {
    severity: 'warning' | 'error' | 'info';
    message: string;
    recommendation?: string;
  }[];
}

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

const validateProjectTimeline = (projectData: Partial<Project>): TimelineValidationResult => {
  const issues: TimelineValidationResult['issues'] = [];
  
  // Check if start and end dates are defined
  if (!projectData.startDate || !projectData.endDate) {
    issues.push({
      severity: 'error',
      message: 'Project is missing start or end date',
      recommendation: 'Please set both start and end dates for your project'
    });
    return { valid: false, issues };
  }
  
  // Calculate project duration
  const startDate = new Date(projectData.startDate);
  const endDate = new Date(projectData.endDate);
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
  
  // Check phases
  const phases = projectData.phases || [];
  
  // Warning if no phases
  if (phases.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'Project has no phases defined',
      recommendation: 'Consider adding phases to better organize your project timeline'
    });
  } else {
    // Check if too many phases
    if (phases.length > MAX_PHASE_COUNT) {
      issues.push({
        severity: 'info',
        message: `Project has ${phases.length} phases, which is more than typical (${MAX_PHASE_COUNT})`,
        recommendation: 'Consider consolidating some phases for easier management'
      });
    }
    
    // Check phase duration against industry standards
    phases.forEach(phase => {
      if (!phase.startDate || !phase.endDate) {
        issues.push({
          severity: 'warning',
          message: `Phase "${phase.name}" is missing start or end date`,
          recommendation: 'Please set both start and end dates for all phases'
        });
        return;
      }
      
      const phaseStartDate = new Date(phase.startDate);
      const phaseEndDate = new Date(phase.endDate);
      const phaseDurationDays = Math.ceil((phaseEndDate.getTime() - phaseStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get minimum recommended duration for this phase
      const minDuration = MIN_PHASE_DURATIONS[phase.name] || MIN_PHASE_DURATIONS['default'];
      
      if (phaseDurationDays < minDuration) {
        issues.push({
          severity: 'warning',
          message: `Phase "${phase.name}" duration (${phaseDurationDays} days) is shorter than industry standard minimum (${minDuration} days)`,
          recommendation: 'Consider extending this phase duration for a more realistic timeline'
        });
      }
      
      // Check if phase is outside project timeline
      if (phaseStartDate < startDate) {
        issues.push({
          severity: 'error',
          message: `Phase "${phase.name}" starts before project start date`,
          recommendation: 'Adjust phase start date to be within project timeline'
        });
      }
      
      if (phaseEndDate > endDate) {
        issues.push({
          severity: 'error',
          message: `Phase "${phase.name}" ends after project end date`,
          recommendation: 'Adjust phase end date to be within project timeline'
        });
      }
    });
    
    // Check for phase overlaps (which could be intentional but worth noting)
    for (let i = 0; i < phases.length; i++) {
      for (let j = i + 1; j < phases.length; j++) {
        const phase1 = phases[i];
        const phase2 = phases[j];
        
        if (!phase1.startDate || !phase1.endDate || !phase2.startDate || !phase2.endDate) continue;
        
        const phase1Start = new Date(phase1.startDate);
        const phase1End = new Date(phase1.endDate);
        const phase2Start = new Date(phase2.startDate);
        const phase2End = new Date(phase2.endDate);
        
        // Check for overlap
        if ((phase1Start <= phase2End) && (phase1End >= phase2Start)) {
          issues.push({
            severity: 'info',
            message: `Phases "${phase1.name}" and "${phase2.name}" overlap`,
            recommendation: 'This may be intentional, but verify your phase scheduling'
          });
        }
      }
    }
  }
  
  return {
    valid: !issues.some(issue => issue.severity === 'error'),
    issues
  };
};

interface TimelineReviewSectionProps {
  projectData: Partial<Project>;
}

const TimelineReviewSection: React.FC<TimelineReviewSectionProps> = ({ projectData }) => {
  const validation = validateProjectTimeline(projectData);
  
  // Group issues by severity
  const errorIssues = validation.issues.filter(issue => issue.severity === 'error');
  const warningIssues = validation.issues.filter(issue => issue.severity === 'warning');
  const infoIssues = validation.issues.filter(issue => issue.severity === 'info');
  
  return (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>
        Timeline Analysis
      </Typography>
      
      {validation.issues.length === 0 ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your project timeline looks good! No issues detected.
        </Alert>
      ) : (
        <>
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
        </>
      )}
      
      <Box mt={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Based on industry standards for construction projects, we've analyzed your timeline and budget.
          {validation.valid 
            ? ' Your project setup meets all critical requirements.'
            : ' Please address the critical issues before creating your project.'}
        </Typography>
      </Box>
    </Box>
  );
};