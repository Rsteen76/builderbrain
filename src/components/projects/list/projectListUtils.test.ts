import type { Project } from '../../../types';
import {
  calculateProjectProgress,
  defaultProjectListFilterOptions,
  filterAndSortProjects,
  formatProjectLocation,
  getProjectBudgetTotal,
  getProjectTabCounts,
  getStatusType,
} from './projectListUtils';

const makeProject = (overrides: Partial<Project>): Project => ({
  id: 'project-a',
  userId: 'user-1',
  name: 'Alpha Project',
  description: 'Residential build',
  status: 'active',
  priority: 'medium',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-01'),
  budget: 1000,
  location: 'Austin, TX',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  phases: [],
  progress: 0,
  ...overrides,
});

describe('projectListUtils', () => {
  it('maps raw project statuses to display statuses', () => {
    expect(getStatusType('estimate')).toBe('Planning');
    expect(getStatusType('in_progress')).toBe('Active');
    expect(getStatusType('completed')).toBe('Completed');
    expect(getStatusType('on_hold')).toBe('On Hold');
    expect(getStatusType('cancelled')).toBe('Cancelled');
    expect(getStatusType('unknown')).toBe('Planning');
  });

  it('calculates deterministic progress and treats completed projects as complete', () => {
    expect(calculateProjectProgress(makeProject({ id: 'abc' }))).toBe(94);
    expect(calculateProjectProgress(makeProject({ status: 'completed' }))).toBe(100);
  });

  it('formats string and structured locations like the list item expects', () => {
    expect(formatProjectLocation('Seattle, WA')).toBe('Seattle, WA');
    expect(formatProjectLocation({
      address: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
    })).toBe('123 Main St, Seattle');
  });

  it('reads numeric and object budgets', () => {
    expect(getProjectBudgetTotal(makeProject({ budget: 2500 }))).toBe(2500);
    expect(getProjectBudgetTotal(makeProject({
      budget: { total: 5000, spent: 1000, remaining: 4000 },
    }))).toBe(5000);
  });

  it('counts tab buckets using existing status groupings', () => {
    const counts = getProjectTabCounts([
      makeProject({ id: '1', status: 'active' }),
      makeProject({ id: '2', status: 'in_progress' }),
      makeProject({ id: '3', status: 'planning' }),
      makeProject({ id: '4', status: 'estimate' }),
      makeProject({ id: '5', status: 'draft' }),
      makeProject({ id: '6', status: 'completed' }),
      makeProject({ id: '7', status: 'on_hold' }),
    ]);

    expect(counts).toEqual({
      all: 7,
      active: 2,
      planning: 3,
      completed: 1,
      onHold: 1,
    });
  });

  it('filters by search, status, priority, and sorts by the requested field', () => {
    const projects = [
      makeProject({
        id: '1',
        name: 'Zeta Build',
        description: 'Commercial shell',
        status: 'planning',
        priority: 'high',
        budget: 3000,
      }),
      makeProject({
        id: '2',
        name: 'Alpha Renovation',
        description: 'Kitchen update',
        status: 'active',
        priority: 'low',
        budget: 1000,
      }),
      makeProject({
        id: '3',
        name: 'Beta Build',
        description: 'Commercial tenant improvement',
        status: 'active',
        priority: 'high',
        budget: 2000,
      }),
    ];

    const result = filterAndSortProjects(projects, 'commercial', {
      ...defaultProjectListFilterOptions,
      status: ['active'],
      priority: ['high'],
      sortBy: 'budget',
      sortDirection: 'desc',
    });

    expect(result.map(project => project.id)).toEqual(['3']);
  });
});
