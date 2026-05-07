jest.mock('../config/firebase', () => ({
  db: {},
}));

jest.mock('../config/devMode', () => ({
  isDevAuthBypassEnabled: false,
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, collectionName, id) => `doc:${collectionName}:${id}`),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('./project', () => ({
  ProjectService: {
    getProjects: jest.fn(),
  },
}));

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Project } from '../types';
import {
  DashboardSummaryService,
  deriveDashboardSummary,
} from './dashboard-summary';
import { ProjectService } from './project';

const now = new Date('2026-05-07T12:00:00.000Z');

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  userId: 'user-1',
  name: 'Hillside Remodel',
  description: 'Kitchen and bath',
  status: 'active',
  startDate: new Date('2026-05-01T12:00:00.000Z'),
  endDate: new Date('2026-05-12T12:00:00.000Z'),
  budget: { total: 100000, spent: 95000, remaining: 5000 },
  location: '123 Main St',
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-02T12:00:00.000Z'),
  team: ['lead', 'pm'],
  phases: [],
  keyMilestones: [{ name: 'Rough Inspection', date: new Date('2026-05-10T12:00:00.000Z'), description: 'City inspection' }],
  tasks: [{
    id: 'task-1',
    userId: 'user-1',
    projectId: 'project-1',
    title: 'Schedule inspection',
    status: 'todo',
    priority: 'high',
    dueDate: new Date('2026-05-09T12:00:00.000Z'),
    createdAt: new Date('2026-05-01T12:00:00.000Z'),
    updatedAt: new Date('2026-05-01T12:00:00.000Z'),
  }],
  progress: 25,
  ...overrides,
});

describe('DashboardSummaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (ProjectService.getProjects as jest.Mock).mockResolvedValue([]);
  });

  test('returns a fresh summary document without scanning all projects', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'user-1',
        projects: [],
        upcomingTasks: [],
        overduePayments: [],
        recentActivity: [],
        stats: {
          totalProjects: 1,
          activeProjects: 1,
          completedProjects: 0,
          totalBudget: 100000,
          teamMembers: 2,
          tasksDue: 0,
          projectsAtRisk: 0,
          nextMilestone: { name: '', date: '', projectId: '' },
          budgetVariance: 0,
          materialsToOrder: 0,
        },
        generatedAt: new Date('2026-05-07T11:58:00.000Z'),
      }),
    });

    const summary = await DashboardSummaryService.getDashboardData('user-1', { now });

    expect(summary.source).toBe('summary');
    expect(summary.stats.totalProjects).toBe(1);
    expect(ProjectService.getProjects).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('derives and writes a summary document when no cached summary exists', async () => {
    (ProjectService.getProjects as jest.Mock).mockResolvedValue([project()]);

    const summary = await DashboardSummaryService.getDashboardData('user-1', { now });

    expect(doc).toHaveBeenCalledWith({}, 'dashboard_summaries', 'user-1');
    expect(ProjectService.getProjects).toHaveBeenCalledWith('user-1');
    expect(summary.source).toBe('derived');
    expect(summary.stats).toMatchObject({
      totalProjects: 1,
      activeProjects: 1,
      teamMembers: 2,
      tasksDue: 1,
      projectsAtRisk: 1,
      totalBudget: 100000,
    });
    expect(summary.upcomingTasks[0]).toMatchObject({
      id: 'task-1',
      projectId: 'project-1',
      priority: 'high',
    });
    expect(setDoc).toHaveBeenCalledWith(
      'doc:dashboard_summaries:user-1',
      expect.not.objectContaining({ source: expect.anything() }),
      { merge: true }
    );
  });

  test('forceRefresh bypasses a fresh summary document', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'user-1',
        projects: [],
        upcomingTasks: [],
        overduePayments: [],
        recentActivity: [],
        stats: { totalProjects: 99 },
        generatedAt: now,
      }),
    });
    (ProjectService.getProjects as jest.Mock).mockResolvedValue([project({ id: 'project-2' })]);

    const summary = await DashboardSummaryService.getDashboardData('user-1', { forceRefresh: true, now });

    expect(getDoc).not.toHaveBeenCalled();
    expect(ProjectService.getProjects).toHaveBeenCalledWith('user-1');
    expect(summary.source).toBe('derived');
    expect(summary.projects[0].id).toBe('project-2');
  });

  test('stale summaries are recalculated from project data', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        userId: 'user-1',
        projects: [],
        upcomingTasks: [],
        overduePayments: [],
        recentActivity: [],
        stats: { totalProjects: 99 },
        generatedAt: new Date('2026-05-07T11:00:00.000Z'),
      }),
    });
    (ProjectService.getProjects as jest.Mock).mockResolvedValue([project({ status: 'completed' })]);

    const summary = await DashboardSummaryService.getDashboardData('user-1', { now });

    expect(ProjectService.getProjects).toHaveBeenCalledWith('user-1');
    expect(summary.stats.totalProjects).toBe(1);
    expect(summary.stats.completedProjects).toBe(1);
  });

  test('summary read failures fall back to project aggregation', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDoc as jest.Mock).mockRejectedValue(new Error('permission-denied'));
    (ProjectService.getProjects as jest.Mock).mockResolvedValue([project()]);

    const summary = await DashboardSummaryService.getDashboardData('user-1', { now });

    expect(ProjectService.getProjects).toHaveBeenCalledWith('user-1');
    expect(summary.source).toBe('derived');
    expect(summary.stats.totalProjects).toBe(1);
  });
});

describe('deriveDashboardSummary', () => {
  test('keeps project metric behavior centralized and deterministic', () => {
    const summary = deriveDashboardSummary('user-1', [
      project(),
      project({
        id: 'project-2',
        name: 'Closed Project',
        status: 'completed',
        budget: 20000,
        team: ['lead'],
        tasks: [],
        endDate: new Date('2026-07-01T12:00:00.000Z'),
      }),
    ], now);

    expect(summary.stats).toMatchObject({
      totalProjects: 2,
      activeProjects: 1,
      completedProjects: 1,
      totalBudget: 120000,
      teamMembers: 2,
      tasksDue: 1,
      projectsAtRisk: 1,
    });
    expect(summary.stats.nextMilestone.name).toBe('Rough Inspection');
  });
});
