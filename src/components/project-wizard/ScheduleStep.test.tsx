import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ScheduleStep from './ScheduleStep';
import { useProjectWizard } from '../../contexts/ProjectWizardContext';

jest.mock('../../contexts/ProjectWizardContext', () => ({
  useProjectWizard: jest.fn(),
}));

const mockedUseProjectWizard = useProjectWizard as jest.MockedFunction<typeof useProjectWizard>;

const makeWizardContext = (overrides: Partial<ReturnType<typeof useProjectWizard>> = {}) => {
  const context = {
    state: {
      projectInfo: {
        name: 'Project One',
        description: 'Residential project',
        location: 'Denver, CO',
        projectType: 'Residential Construction',
        size: 'Medium ($50,000 - $250,000)',
        totalBudget: 100000,
        currency: '$',
        startDate: new Date('2026-01-01T00:00:00'),
        estimatedStartDate: new Date('2026-01-01T00:00:00'),
        estimatedEndDate: new Date('2026-06-01T00:00:00'),
      },
      selectedTemplateId: 'residential',
      phases: [
        {
          id: 'phase-1',
          name: 'Pre-Construction & Permits',
          description: 'Scope, selections, estimates, and permits.',
          startDate: new Date('2026-01-01T00:00:00'),
          endDate: new Date('2026-01-15T00:00:00'),
          status: 'not_started',
          progress: 0,
          budget: 5000,
          actualCost: 0,
          budgetPercentage: 5,
          tasks: [
            {
              id: 'task-1',
              title: 'Submit permits',
              status: 'todo',
              priority: 'high',
            },
          ],
        },
      ],
      hasCustomizedPhases: false,
      schedule: {
        milestones: [],
      },
      budget: [],
      team: {
        members: [],
      },
      currentStep: 'schedule',
      completedSteps: new Set(),
      isSubmitting: false,
      isSubmitted: false,
      createdProjectId: null,
      error: null,
    },
    dispatch: jest.fn(),
    updateProjectInfo: jest.fn(),
    addMilestone: jest.fn(),
    updateMilestone: jest.fn(),
    removeMilestone: jest.fn(),
    applyTemplate: jest.fn(),
    addPhase: jest.fn(),
    updatePhase: jest.fn(),
    removePhase: jest.fn(),
    addBudgetItem: jest.fn(),
    updateBudgetItem: jest.fn(),
    removeBudgetItem: jest.fn(),
    addTeamMember: jest.fn(),
    updateTeamMember: jest.fn(),
    removeTeamMember: jest.fn(),
    setCurrentStep: jest.fn(),
    markStepComplete: jest.fn(),
    markStepIncomplete: jest.fn(),
    validateStep: jest.fn(),
    resetWizard: jest.fn(),
    submitProject: jest.fn(),
    isStepComplete: jest.fn(),
    canProceedToNextStep: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useProjectWizard>;

  mockedUseProjectWizard.mockReturnValue(context);
  return context;
};

describe('ScheduleStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lets builders adjust suggested phase names, dates, budgets, and phase count', () => {
    const context = makeWizardContext();

    render(<ScheduleStep />);

    expect(screen.getByText(/Suggested builder phases were added/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pre-Construction & Permits')).toBeInTheDocument();
    expect(screen.getByText('1 starter tasks')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Phase name'), {
      target: { value: 'Permits and Owner Decisions' },
    });
    expect(context.updatePhase).toHaveBeenCalledWith('phase-1', {
      name: 'Permits and Owner Decisions',
    });

    fireEvent.change(screen.getByDisplayValue('2026-01-01'), {
      target: { value: '2026-01-05' },
    });
    expect(context.updatePhase).toHaveBeenCalledWith('phase-1', {
      startDate: new Date('2026-01-05T00:00:00'),
    });

    fireEvent.change(screen.getByDisplayValue('5000'), {
      target: { value: '20000' },
    });
    expect(context.updatePhase).toHaveBeenCalledWith('phase-1', {
      budget: 20000,
      budgetPercentage: 20,
    });

    fireEvent.click(screen.getByRole('button', { name: /add phase/i }));
    expect(context.addPhase).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /delete phase pre-construction & permits/i }));
    expect(context.removePhase).toHaveBeenCalledWith('phase-1');
  });

  test('validates that at least one phase or milestone exists', () => {
    const context = makeWizardContext({
      state: {
        ...makeWizardContext().state,
        selectedTemplateId: undefined,
        phases: [],
        schedule: {
          milestones: [],
        },
      },
    });

    render(<ScheduleStep />);

    expect(context.validateStep).toHaveBeenCalledWith('schedule');
    expect(screen.getByText('No phases added yet. Add a phase to continue.')).toBeInTheDocument();
    expect(screen.getByText('Add at least one phase or milestone to continue to the next step')).toBeInTheDocument();
  });
});
