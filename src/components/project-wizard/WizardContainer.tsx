import React from 'react';
import { 
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
  Paper
} from '@mui/material';
import { useProjectWizard, WizardStep } from '../../contexts/ProjectWizardContext';
import ProjectInfoStep from './ProjectInfoStep';
import ScheduleStep from './ScheduleStep';
import BudgetStep from './BudgetStep';
import TeamStep from './TeamStep';
import ReviewStep from './ReviewStep';

// Define steps configurations
const steps = [
  { label: 'Project Information', id: 'project_info' as WizardStep },
  { label: 'Schedule', id: 'schedule' as WizardStep },
  { label: 'Budget', id: 'budget' as WizardStep },
  { label: 'Team', id: 'team' as WizardStep },
  { label: 'Review', id: 'review' as WizardStep }
];

const WizardContainer: React.FC = () => {
  const { 
    state, 
    setCurrentStep,
    isStepComplete,
    canProceedToNextStep,
    submitProject
  } = useProjectWizard();
  
  const { currentStep, isSubmitting, isSubmitted } = state;
  
  // Handle next button click
  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  // Handle back button click
  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  // Get the current step content
  const getStepContent = (step: WizardStep) => {
    switch (step) {
      case 'project_info':
        return <ProjectInfoStep />;
      case 'schedule':
        return <ScheduleStep />;
      case 'budget':
        return <BudgetStep />;
      case 'team':
        return <TeamStep />;
      case 'review':
        return <ReviewStep />;
      default:
        return <div>Unknown step</div>;
    }
  };

  // Find the active step index
  const activeStepIndex = steps.findIndex(step => step.id === currentStep);

  if (isSubmitted) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom align="center">
            Project Created Successfully!
          </Typography>
          <Typography variant="body1" paragraph align="center">
            Your project has been created successfully. You can now view and manage it from the projects dashboard.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              href="/projects"
            >
              Go to Projects Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Create New Project
        </Typography>
        
        <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step) => (
            <Step key={step.id} completed={isStepComplete(step.id)}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4, mb: 4 }}>
          {getStepContent(currentStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            color="inherit"
            variant="outlined"
            disabled={activeStepIndex === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStepIndex === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={submitProject}
              disabled={!canProceedToNextStep() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Project'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default WizardContainer; 