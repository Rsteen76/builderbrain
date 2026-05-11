import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import { isDevAuthBypassEnabled } from '../config/devMode';
import { Project } from '../types';
import { formatDate } from '../utils/formatters';
import { ProjectService } from './project';
import { logger } from '../utils/logger';

export type DashboardPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface DashboardTaskSummary {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: DashboardPriority;
  projectId: string;
  projectName: string;
}

export interface DashboardProjectSummary {
  id: string;
  name: string;
  status: string;
  endDate: string;
  budget: number | { total: number; spent: number; remaining: number; planned?: number };
  team: string[];
  location: string | { address: string; city: string; state: string };
  updatedAt: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string;
    priority: DashboardPriority;
  }>;
  keyMilestones?: Array<{
    id: string;
    name: string;
    date: string;
    completed: boolean;
  }>;
  materials?: Array<{
    id: string;
    name: string;
    status: string;
    quantity: number;
  }>;
  payments?: DashboardPaymentSummary[];
}

export interface DashboardPaymentSummary {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: string;
  projectId: string;
  projectName: string;
}

export interface DashboardRecentActivity {
  title: string;
  time: string;
}

export interface DashboardStatsSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  teamMembers: number;
  tasksDue: number;
  projectsAtRisk: number;
  nextMilestone: { name: string; date: string; projectId: string };
  budgetVariance: number;
  materialsToOrder: number;
}

export interface DashboardSummaryData {
  userId: string;
  projects: DashboardProjectSummary[];
  upcomingTasks: DashboardTaskSummary[];
  overduePayments: DashboardPaymentSummary[];
  recentActivity: DashboardRecentActivity[];
  stats: DashboardStatsSummary;
  generatedAt: Date;
  source: 'summary' | 'derived';
}

interface DashboardSummaryDocument extends Omit<DashboardSummaryData, 'generatedAt' | 'source'> {
  generatedAt: Date | { toDate: () => Date } | string;
}

interface GetDashboardSummaryOptions {
  forceRefresh?: boolean;
  maxAgeMs?: number;
  now?: Date;
}

const DASHBOARD_SUMMARY_COLLECTION = 'dashboard_summaries';
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

const safeDateToString = (date: unknown): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate().toISOString();
  }
  return '';
};

const toDate = (value: DashboardSummaryDocument['generatedAt']): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return value.toDate();
};

export const convertToDashboardProject = (project: Project): DashboardProjectSummary => ({
  id: project.id || '',
  name: project.name,
  status: project.status || 'draft',
  endDate: safeDateToString(project.endDate),
  budget: project.budget || 0,
  team: project.team || [],
  location: project.location || '',
  updatedAt: safeDateToString(project.updatedAt),
  tasks: (project.tasks || []).map(task => ({
    id: task.id || '',
    title: task.title || 'Untitled Task',
    status: task.status || 'pending',
    dueDate: safeDateToString(task.dueDate),
    priority: task.priority || 'medium',
  })),
  keyMilestones: (project.keyMilestones || []).map((milestone, index) => ({
    id: `milestone-${project.id}-${index}`,
    name: milestone.name || 'Untitled Milestone',
    date: safeDateToString(milestone.date),
    completed: false,
  })),
  materials: [],
  payments: [],
});

export const deriveDashboardSummary = (
  userId: string,
  projects: Project[],
  now = new Date()
): DashboardSummaryData => {
  const dashboardProjects = projects.map(convertToDashboardProject);
  const today = new Date(now);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const projectsAtRisk = dashboardProjects.filter(project => {
    if (project.status === 'on_hold' || project.status === 'cancelled') return true;

    if (project.endDate) {
      const endDate = new Date(project.endDate);
      if (endDate < today || endDate <= nextWeek) return true;
    }

    if (project.budget && typeof project.budget === 'object') {
      const totalBudget = project.budget.total || 0;
      const spentBudget = project.budget.spent || 0;
      return spentBudget > totalBudget * 0.9;
    }

    return false;
  }).length;

  const uniqueTeamMembers = new Set<string>();
  const upcomingTasks: DashboardTaskSummary[] = [];
  let tasksDue = 0;
  let nextMilestone = { name: 'No upcoming milestones', date: '', projectId: '' };
  let earliestMilestoneDate = new Date(today);
  earliestMilestoneDate.setFullYear(earliestMilestoneDate.getFullYear() + 1);
  let budgetVariance = 0;

  dashboardProjects.forEach(project => {
    project.team.forEach(member => uniqueTeamMembers.add(member));

    project.tasks.forEach(task => {
      if (!task.dueDate || task.status === 'completed') return;

      const dueDate = new Date(task.dueDate);
      if (dueDate >= today && dueDate <= nextWeek) {
        tasksDue += 1;
        upcomingTasks.push({
          id: task.id,
          title: task.title,
          dueDate: formatDate(dueDate),
          status: task.status,
          priority: task.priority,
          projectId: project.id,
          projectName: project.name,
        });
      }
    });

    (project.keyMilestones || []).forEach(milestone => {
      if (milestone.completed || !milestone.date) return;

      const milestoneDate = new Date(milestone.date);
      if (milestoneDate >= today && milestoneDate < earliestMilestoneDate) {
        earliestMilestoneDate = milestoneDate;
        nextMilestone = {
          name: milestone.name,
          date: milestone.date,
          projectId: project.id,
        };
      }
    });

    if (project.budget && typeof project.budget === 'object') {
      const actual = project.budget.spent || 0;
      const planned = project.budget.planned ?? project.budget.total - (project.budget.remaining || 0);
      budgetVariance += actual - planned;
    }
  });

  upcomingTasks.sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();

    if (dateA === dateB) {
      const priorityValues: Record<DashboardPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityValues[a.priority] - priorityValues[b.priority];
    }

    return dateA - dateB;
  });

  const totalBudget = dashboardProjects.reduce((sum, project) => {
    const budgetValue = typeof project.budget === 'object' && project.budget !== null
      ? project.budget.total
      : project.budget || 0;
    return sum + (typeof budgetValue === 'number' ? budgetValue : 0);
  }, 0);

  return {
    userId,
    projects: dashboardProjects,
    upcomingTasks,
    overduePayments: [],
    recentActivity: [],
    stats: {
      totalProjects: dashboardProjects.length,
      activeProjects: dashboardProjects.filter(project =>
        project.status === 'in_progress' || project.status === 'planning' || project.status === 'active'
      ).length,
      completedProjects: dashboardProjects.filter(project => project.status === 'completed').length,
      totalBudget,
      teamMembers: uniqueTeamMembers.size,
      tasksDue,
      projectsAtRisk,
      nextMilestone,
      budgetVariance,
      materialsToOrder: 0,
    },
    generatedAt: now,
    source: 'derived',
  };
};

export class DashboardSummaryService {
  static async getDashboardData(
    userId: string,
    options: GetDashboardSummaryOptions = {}
  ): Promise<DashboardSummaryData> {
    const now = options.now || new Date();
    const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    const summaryRef = doc(db, DASHBOARD_SUMMARY_COLLECTION, userId);

    if (!options.forceRefresh && !isDevAuthBypassEnabled) {
      try {
        const snapshot = await getDoc(summaryRef);
        if (snapshot.exists()) {
          const summary = snapshot.data() as DashboardSummaryDocument;
          const generatedAt = toDate(summary.generatedAt);
          if (now.getTime() - generatedAt.getTime() <= maxAgeMs) {
            return { ...summary, generatedAt, source: 'summary' };
          }
        }
      } catch (error) {
        logger.error('Failed to read dashboard summary; falling back to project aggregation:', error);
      }
    }

    const projects = await ProjectService.getProjects(userId);
    const derivedSummary = deriveDashboardSummary(userId, projects, now);

    if (!isDevAuthBypassEnabled) {
      try {
        const { source: _source, ...summaryDocument } = derivedSummary;
        await setDoc(summaryRef, summaryDocument, { merge: true });
      } catch (error) {
        logger.error('Failed to update dashboard summary:', error);
      }
    }

    return derivedSummary;
  }
}
