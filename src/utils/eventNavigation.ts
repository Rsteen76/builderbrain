export interface NavigableEvent {
  id: string;
  projectId?: string;
  type: string;
}

const projectRoute = (projectId?: string) => (
  projectId ? `/projects/${projectId}` : '/projects'
);

export const getEventNavigationPath = (event: NavigableEvent): string => {
  switch (event.type) {
    case 'meeting':
      return `/calendar?event=${encodeURIComponent(event.id)}`;
    case 'task':
      return '/tasks';
    case 'payment':
      return '/payments';
    case 'milestone':
    case 'delivery':
    default:
      return projectRoute(event.projectId);
  }
};
