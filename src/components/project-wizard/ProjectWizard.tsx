import React from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepButton,
  Button,
  Typography,
  Container
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ProjectWizardProvider,
  useProjectWizard,
  WizardStep
} from '../../contexts/ProjectWizardContext';
import type { ProjectTemplateId } from '../../data/projectWizardTemplates';
import ProjectInfoStep from './ProjectInfoStep';
import ScheduleStep from './ScheduleStep';
import BudgetStep from './BudgetStep';
import TeamStep from './TeamStep';
import ReviewStep from './ReviewStep';

// Define the steps shown in the stepper
const steps = [
  { label: 'Project Information', value: 'project_info' as WizardStep },
  { label: 'Schedule', value: 'schedule' as WizardStep },
  { label: 'Budget', value: 'budget' as WizardStep },
  { label: 'Team', value: 'team' as WizardStep },
  { label: 'Review', value: 'review' as WizardStep },
];

// Wrapper component to provide context
export const ProjectWizard: React.FC = () => {
  const location = useLocation();
  const initialTemplateId = (location.state as { template?: ProjectTemplateId } | null)?.template;
  const wizardInstanceKey = `${location.pathname}:${location.search}:${initialTemplateId || 'blank'}`;

  return (
    <ProjectWizardProvider key={wizardInstanceKey} initialTemplateId={initialTemplateId}>
      <ProjectWizardContent />
    </ProjectWizardProvider>
  );
};

// Main component content
const ProjectWizardContent: React.FC = () => {
  const {
    state,
    setCurrentStep,
    resetWizard,
    isStepComplete,
    canProceedToNextStep,
    submitProject
  } = useProjectWizard();
  const navigate = useNavigate();

  const { currentStep, isSubmitting, isSubmitted, error } = state;

  // Handle next button click
  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.value === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].value);
    }
  };

  // Handle back button click
  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.value === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].value);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    await submitProject();
  };

  const handleCancel = () => {
    resetWizard();
    navigate('/projects', { replace: true });
  };

  const handleStartOver = () => {
    resetWizard();
  };

  // Determine the active step index
  const activeStepIndex = steps.findIndex(step => step.value === currentStep);

  const canOpenStep = (step: WizardStep, index: number) =>
    index <= activeStepIndex || isStepComplete(step);

  const handleStepClick = (step: WizardStep, index: number) => {
    if (canOpenStep(step, index)) {
      setCurrentStep(step);
    }
  };

  // Render the current step content
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
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create New Project
        </Typography>

        <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ mb: 4, mt: 2 }}>
          {steps.map((step, index) => (
            <Step key={step.value} completed={isStepComplete(step.value)}>
              <StepButton
                onClick={() => handleStepClick(step.value, index)}
                disabled={!canOpenStep(step.value, index)}
              >
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2, mb: 2 }}>
          {getStepContent(currentStep)}
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
            Error: {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={activeStepIndex === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            {activeStepIndex > 0 && (
              <Button
                variant="text"
                color="primary"
                onClick={handleStartOver}
              >
                Start Over
              </Button>
            )}
          </Box>

          <Box>
            {activeStepIndex === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
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
        </Box>
      </Paper>
    </Container>
  );
};

export default ProjectWizard;
