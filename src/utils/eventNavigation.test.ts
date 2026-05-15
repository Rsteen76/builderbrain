import { getEventNavigationPath } from './eventNavigation';

describe('getEventNavigationPath', () => {
  it('routes timeline and calendar events only to existing app routes', () => {
    expect(getEventNavigationPath({ id: 'milestone-1', projectId: 'project-1', type: 'milestone' }))
      .toBe('/projects/project-1');
    expect(getEventNavigationPath({ id: 'task-1', projectId: 'project-1', type: 'task' }))
      .toBe('/tasks');
    expect(getEventNavigationPath({ id: 'payment-1', projectId: 'project-1', type: 'payment' }))
      .toBe('/payments');
    expect(getEventNavigationPath({ id: 'delivery-1', projectId: 'project-1', type: 'delivery' }))
      .toBe('/projects/project-1');
    expect(getEventNavigationPath({ id: 'meeting 1', projectId: 'project-1', type: 'meeting' }))
      .toBe('/calendar?event=meeting%201');
  });

  it('falls back to the projects list when an event has no project id', () => {
    expect(getEventNavigationPath({ id: 'unknown-1', type: 'unknown' })).toBe('/projects');
  });
});
