import type { Project } from '../../../types';

export type DisplayStatus = 'Planning' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled';

export interface ProjectListFilterOptions {
  status: string[];
  priority: string[];
  sortBy: 'name' | 'dueDate' | 'budget' | 'progress';
  sortDirection: 'asc' | 'desc';
}

export interface ProjectTabCounts {
  all: number;
  active: number;
  planning: number;
  completed: number;
  onHold: number;
}

export const defaultProjectListFilterOptions: ProjectListFilterOptions = {
  status: [],
  priority: [],
  sortBy: 'name',
  sortDirection: 'asc',
};

export const getStatusType = (status: string): DisplayStatus => {
  const statusMap: Record<string, DisplayStatus> = {
    estimate: 'Planning',
    planning: 'Planning',
    in_progress: 'Active',
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
    draft: 'Planning',
  };

  return statusMap[status.toLowerCase()] || 'Planning';
};

export const calculateProjectProgress = (project: Project): number => {
  if (project.status === 'completed') return 100;

  const id = project.id || '';
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.max(10, Math.min(95, hash % 100));
};

export const formatProjectLocation = (
  location: string | { address: string; city: string; state: string; zipCode: string }
): string => {
  if (typeof location === 'string') {
    return location;
  }

  return `${location.address}, ${location.city}`;
};

export const getProjectBudgetTotal = (project: Project): number => (
  typeof project.budget === 'number' ? project.budget : project.budget?.total || 0
);

export const getProjectTabCounts = (projects: Project[]): ProjectTabCounts => ({
  all: projects.length,
  active: projects.filter(project => project.status === 'active' || project.status === 'in_progress').length,
  planning: projects.filter(project => (
    project.status === 'planning' ||
    project.status === 'estimate' ||
    project.status === 'draft'
  )).length,
  completed: projects.filter(project => project.status === 'completed').length,
  onHold: projects.filter(project => project.status === 'on_hold').length,
});

export const filterAndSortProjects = (
  projects: Project[],
  searchQuery: string,
  filterOptions: ProjectListFilterOptions
): Project[] => {
  let filtered = [...projects];
  const search = searchQuery.toLowerCase();

  if (search) {
    filtered = filtered.filter(project =>
      project.name.toLowerCase().includes(search) ||
      project.description.toLowerCase().includes(search) ||
      (typeof project.location === 'string' && project.location.toLowerCase().includes(search)) ||
      project.status.toLowerCase().includes(search)
    );
  }

  if (filterOptions.status.length > 0) {
    filtered = filtered.filter(project =>
      filterOptions.status.includes(project.status.toLowerCase())
    );
  }

  if (filterOptions.priority.length > 0) {
    filtered = filtered.filter(project =>
      project.priority && filterOptions.priority.includes(project.priority.toLowerCase())
    );
  }

  filtered.sort((a, b) => {
    const direction = filterOptions.sortDirection === 'asc' ? 1 : -1;

    switch (filterOptions.sortBy) {
      case 'name':
        return direction * a.name.localeCompare(b.name);

      case 'dueDate':
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return direction;
        if (!b.endDate) return -direction;
        return direction * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

      case 'budget':
        return direction * (getProjectBudgetTotal(a) - getProjectBudgetTotal(b));

      case 'progress':
        return direction * (calculateProjectProgress(a) - calculateProjectProgress(b));

      default:
        return 0;
    }
  });

  return filtered;
};
