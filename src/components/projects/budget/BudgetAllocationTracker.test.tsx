import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BudgetAllocationTracker from './BudgetAllocationTracker';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategoryMappingsForProject } from '../../../services/category.service';
import { updateProjectBudget } from '../../../services/budget';
import { getProjectById, updateProject } from '../../../services/project';
import type { ProjectPhase } from '../../../types';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/category.service', () => ({
  getCategoryMappingsForProject: jest.fn(),
}));

jest.mock('../../../services/project', () => ({
  getProjectById: jest.fn(),
  updateProject: jest.fn(),
}));

jest.mock('../../../services/budget', () => ({
  createBudgetProjection: jest.fn(),
  normalizeBudgetProjection: jest.fn((projection) => projection),
  saveProjectProjections: jest.fn(),
  updateProjectBudget: jest.fn(),
}));

jest.mock('../../common/CategorySystemToggle', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div>Category system {value}</div>,
}));

jest.mock('../../../utils/categoryMappingUtils', () => ({
  getUserCategorySystemPreference: jest.fn(() => 'legacy'),
  saveUserCategorySystemPreference: jest.fn(),
  convertCategoryId: jest.fn((categoryId) => categoryId),
  getCategoriesBySystem: jest.fn(() => []),
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    log: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGetProjectById = getProjectById as jest.MockedFunction<typeof getProjectById>;
const mockedUpdateProject = updateProject as jest.MockedFunction<typeof updateProject>;
const mockedUpdateProjectBudget = updateProjectBudget as jest.MockedFunction<typeof updateProjectBudget>;
const mockedGetCategoryMappingsForProject = getCategoryMappingsForProject as jest.MockedFunction<typeof getCategoryMappingsForProject>;

const phases: ProjectPhase[] = [
  {
    id: 'phase-1',
    name: 'Foundation',
    status: 'planning',
    progress: 0,
    budget: 20000,
    actualCost: 0,
    order: 1,
  },
  {
    id: 'phase-2',
    name: 'Framing',
    status: 'planning',
    progress: 0,
    budget: 30000,
    actualCost: 0,
    order: 2,
  },
];

describe('BudgetAllocationTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: { uid: 'user-1' } } as ReturnType<typeof useAuth>);
    mockedGetCategoryMappingsForProject.mockResolvedValue({});
    mockedGetProjectById.mockResolvedValue({
      id: 'project-1',
      budget: { total: 100000, spent: 0, remaining: 100000 },
      projections: [],
    } as unknown as Awaited<ReturnType<typeof getProjectById>>);
    mockedUpdateProjectBudget.mockResolvedValue(undefined);
    mockedUpdateProject.mockResolvedValue({ id: 'project-1' } as unknown as Awaited<ReturnType<typeof updateProject>>);
  });

  test('lets users update the total project budget from the budget page', async () => {
    const onBudgetUpdated = jest.fn();

    render(
      <BudgetAllocationTracker
        projectId="project-1"
        phases={phases}
        onBudgetUpdated={onBudgetUpdated}
      />
    );

    await waitFor(() => expect(screen.getAllByText('$100,000.00').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: /edit budget/i }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '125000' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockedUpdateProjectBudget).toHaveBeenCalledWith('project-1', 125000));
    await waitFor(() => expect(onBudgetUpdated).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText('$125,000.00').length).toBeGreaterThan(0));
  });

  test('lets users update phase budget allocations from the budget page', async () => {
    const onBudgetUpdated = jest.fn();

    render(
      <BudgetAllocationTracker
        projectId="project-1"
        phases={phases}
        onBudgetUpdated={onBudgetUpdated}
      />
    );

    await screen.findByText('Foundation');

    fireEvent.click(screen.getByRole('button', { name: /edit phase budgets/i }));
    fireEvent.change(screen.getByDisplayValue('20000'), { target: { value: '25000' } });
    fireEvent.click(screen.getByRole('button', { name: /save phases/i }));

    await waitFor(() => expect(mockedUpdateProject).toHaveBeenCalledWith('project-1', {
      phases: [
        expect.objectContaining({ id: 'phase-1', budget: 25000 }),
        expect.objectContaining({ id: 'phase-2', budget: 30000 }),
      ],
    }));
    await waitFor(() => expect(onBudgetUpdated).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText('$25,000.00').length).toBeGreaterThan(0));
  });
});
