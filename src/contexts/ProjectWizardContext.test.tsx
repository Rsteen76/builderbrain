import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
  ProjectWizardProvider,
  useProjectWizard,
  type WizardProjectPhase,
} from './ProjectWizardContext';
import { useAuth } from './AuthContext';
import { ProjectService } from '../services/project';

jest.mock('./AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/project', () => ({
  ProjectService: {
    createProject: jest.fn(),
    updateProject: jest.fn(),
  },
}));

let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    mockUuidCounter += 1;
    return `uuid-${mockUuidCounter}`;
  }),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedProjectService = ProjectService as jest.Mocked<typeof ProjectService>;

type WizardContextValue = ReturnType<typeof useProjectWizard>;

const expectLocalDate = (date: Date, year: number, month: number, day: number) => {
  expect(date.getFullYear()).toBe(year);
  expect(date.getMonth()).toBe(month - 1);
  expect(date.getDate()).toBe(day);
};

const renderWizard = (initialTemplateId?: React.ComponentProps<typeof ProjectWizardProvider>['initialTemplateId']) => {
  let context: WizardContextValue | undefined;

  const Probe = () => {
    context = useProjectWizard();
    return (
      <div data-testid="wizard-state">
        {context.state.selectedTemplateId || 'no-template'}
      </div>
    );
  };

  render(
    <ProjectWizardProvider initialTemplateId={initialTemplateId}>
      <Probe />
    </ProjectWizardProvider>
  );

  return {
    get context() {
      if (!context) {
        throw new Error('Project wizard context was not rendered');
      }
      return context;
    },
  };
};

describe('ProjectWizardProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUuidCounter = 0;
    mockedUseAuth.mockReturnValue({
      user: { uid: 'user-1' } as ReturnType<typeof useAuth>['user'],
    } as ReturnType<typeof useAuth>);
    mockedProjectService.createProject.mockResolvedValue({
      id: 'project-1',
    } as Awaited<ReturnType<typeof ProjectService.createProject>>);
    mockedProjectService.updateProject.mockResolvedValue({
      id: 'project-1',
    } as Awaited<ReturnType<typeof ProjectService.updateProject>>);
  });

  test('applies a template with editable phases, milestones, and phase budget items', async () => {
    const wizard = renderWizard('residential');

    await waitFor(() => expect(wizard.context.state.selectedTemplateId).toBe('residential'));

    expect(wizard.context.state.phases).toHaveLength(10);
    expect(wizard.context.state.phases[0]).toMatchObject({
      name: 'Pre-Construction & Permits',
      budgetPercentage: 5,
      status: 'not_started',
    });
    expect(wizard.context.state.phases[0].tasks.length).toBeGreaterThan(0);
    expect(wizard.context.state.schedule.milestones.map(milestone => milestone.title)).toContain(
      'Dry-in complete'
    );
    expect(wizard.context.state.budget[0]).toMatchObject({
      category: 'Phase Budget',
      description: 'Pre-Construction & Permits',
    });
    expect(wizard.context.isStepComplete('schedule')).toBe(true);
    expect(wizard.context.isStepComplete('budget')).toBe(true);
  });

  test('refreshes generated phase dates and budgets while the phase list is still untouched', async () => {
    const wizard = renderWizard('residential');

    await waitFor(() => expect(wizard.context.state.phases).toHaveLength(10));

    act(() => {
      wizard.context.updateProjectInfo({
        estimatedStartDate: new Date('2026-01-15T00:00:00'),
        estimatedEndDate: new Date('2026-11-15T00:00:00'),
        totalBudget: 800000,
      });
    });

    await waitFor(() => expectLocalDate(wizard.context.state.phases[0].startDate, 2026, 1, 15));
    expect(wizard.context.state.phases[0].budget).toBe(40000);
    expect(wizard.context.state.budget[0]).toMatchObject({
      description: 'Pre-Construction & Permits',
      estimatedCost: 40000,
    });
  });

  test('keeps builder edits when project dates change after phase customization', async () => {
    const wizard = renderWizard('residential');

    await waitFor(() => expect(wizard.context.state.phases).toHaveLength(10));

    const firstPhaseId = wizard.context.state.phases[0].id;
    act(() => {
      wizard.context.updatePhase(firstPhaseId, {
        name: 'Permits and Owner Decisions',
        startDate: new Date('2026-02-01T00:00:00'),
        budget: 50000,
      });
    });
    act(() => {
      wizard.context.updateProjectInfo({
        estimatedStartDate: new Date('2026-03-01T00:00:00'),
        totalBudget: 900000,
      });
    });

    expect(wizard.context.state.hasCustomizedPhases).toBe(true);
    expect(wizard.context.state.phases[0]).toMatchObject({
      name: 'Permits and Owner Decisions',
      budget: 50000,
    });
    expectLocalDate(wizard.context.state.phases[0].startDate, 2026, 2, 1);
  });

  test('submits a real project with generated phases, starter tasks, milestones, and team names', async () => {
    const wizard = renderWizard('residential');

    await waitFor(() => expect(wizard.context.state.phases).toHaveLength(10));

    act(() => {
      wizard.context.updateProjectInfo({
        name: 'Hillside Build',
        description: 'Custom hillside residence.',
        location: 'Denver, CO',
        projectType: 'Residential Construction',
        size: 'Large ($250,000 - $1,000,000)',
        totalBudget: 800000,
        estimatedStartDate: new Date('2026-01-15T00:00:00'),
        estimatedEndDate: new Date('2026-11-15T00:00:00'),
        client: 'Owner One',
      });
      wizard.context.addMilestone({
        id: 'milestone-extra',
        title: 'Owner move-in',
        description: 'Final handoff target.',
        dueDate: new Date('2026-11-20T00:00:00'),
      });
      wizard.context.addTeamMember({
        id: 'team-1',
        name: 'Avery Builder',
        role: 'Project Manager',
      });
    });

    await act(async () => {
      await wizard.context.submitProject();
    });

    expect(mockedProjectService.createProject).toHaveBeenCalledWith('user-1', expect.objectContaining({
      name: 'Hillside Build',
      description: 'Custom hillside residence.',
      location: 'Denver, CO',
      projectType: 'Residential Construction',
      clientId: 'Owner One',
      team: ['Avery Builder'],
      budget: {
        total: 800000,
        spent: 0,
        remaining: 800000,
      },
      keyMilestones: expect.arrayContaining([
        expect.objectContaining({ name: 'Owner move-in' }),
      ]),
    }));
    expect(mockedProjectService.updateProject).toHaveBeenCalledWith('project-1', expect.objectContaining({
      phases: expect.arrayContaining([
        expect.objectContaining({
          projectId: 'project-1',
          name: 'Pre-Construction & Permits',
          order: 1,
          budget: 40000,
          tasks: expect.arrayContaining([
            expect.objectContaining({
              userId: 'user-1',
              projectId: 'project-1',
              phaseName: 'Pre-Construction & Permits',
              title: 'Confirm approved drawings and specifications',
              status: 'todo',
            }),
          ]),
        }),
      ]),
      tasks: expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          projectId: 'project-1',
          title: 'Confirm approved drawings and specifications',
        }),
      ]),
    }));
    expect(wizard.context.state.isSubmitted).toBe(true);
    expect(wizard.context.state.createdProjectId).toBe('project-1');
  });

  test('does not create a project when no authenticated user is available', async () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    const wizard = renderWizard();

    act(() => {
      wizard.context.addPhase({
        name: 'Planning',
      } as Partial<WizardProjectPhase>);
    });

    await act(async () => {
      await wizard.context.submitProject();
    });

    expect(mockedProjectService.createProject).not.toHaveBeenCalled();
    expect(mockedProjectService.updateProject).not.toHaveBeenCalled();
    expect(wizard.context.state.isSubmitted).toBe(false);
    expect(wizard.context.state.error).toBe('You must be signed in to create a project');
  });
});
