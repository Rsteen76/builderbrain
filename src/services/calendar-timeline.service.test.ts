jest.mock('../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => {
  class MockTimestamp {
    private readonly date: Date;

    constructor(date: Date) {
      this.date = date;
    }

    toDate() {
      return this.date;
    }

    static fromDate = jest.fn((date: Date) => new MockTimestamp(date));
  }

  return {
    collection: jest.fn((_db, path) => path),
    getDocs: jest.fn(),
    orderBy: jest.fn((field, direction) => ({ field, direction, type: 'orderBy' })),
    query: jest.fn((base, ...constraints) => ({ base, constraints })),
    Timestamp: MockTimestamp,
    where: jest.fn((field, op, value) => ({ field, op, value, type: 'where' })),
  };
});

import { getDocs, Timestamp } from 'firebase/firestore';
import {
  buildProjectNameMap,
  CalendarTimelineService,
  resolveProjectName,
  scheduleDateToDate,
} from './calendar-timeline';

const timestamp = (date: string) => new (Timestamp as any)(new Date(date));

const snapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map(doc => ({
    id: doc.id,
    data: () => doc.data,
  })),
});

describe('CalendarTimelineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves project names from the projects query map with stable fallbacks', () => {
    const projectNames = buildProjectNameMap([
      { id: 'project-1', name: 'Lake House' },
      { id: 'project-2', name: '' },
    ]);

    expect(resolveProjectName('project-1', projectNames)).toBe('Lake House');
    expect(resolveProjectName('project-2', projectNames)).toBe('Unnamed Project');
    expect(resolveProjectName('missing-project', projectNames)).toBe('Unknown Project');
    expect(resolveProjectName('', projectNames, 'General')).toBe('General');
  });

  test('maps timeline events using the project snapshot without per-event project fetches', async () => {
    (getDocs as jest.Mock).mockImplementation(async (queryArg) => {
      switch (queryArg.base) {
        case 'projects':
          return snapshot([
            {
              id: 'project-1',
              data: {
                name: 'Lake House',
                createdAt: timestamp('2026-05-01T00:00:00.000Z'),
                keyMilestones: [{
                  name: 'Framing',
                  description: 'Frame complete',
                  date: timestamp('2026-05-10T00:00:00.000Z'),
                }],
              },
            },
            {
              id: 'project-2',
              data: {
                name: '',
                createdAt: timestamp('2026-05-02T00:00:00.000Z'),
                keyMilestones: [],
              },
            },
          ]);
        case 'tasks':
          return snapshot([
            {
              id: 'task-1',
              data: {
                title: 'Pour slab',
                projectId: 'project-1',
                dueDate: timestamp('2026-05-08T00:00:00.000Z'),
                createdAt: timestamp('2026-05-03T00:00:00.000Z'),
                status: 'open',
              },
            },
          ]);
        case 'payments':
          return snapshot([
            {
              id: 'payment-1',
              data: {
                amount: 1200,
                projectId: 'missing-project',
                dueDate: timestamp('2026-05-09T00:00:00.000Z'),
                createdAt: timestamp('2026-05-04T00:00:00.000Z'),
                status: 'pending',
              },
            },
          ]);
        case 'deliveries':
          return snapshot([
            {
              id: 'delivery-1',
              data: {
                projectId: 'project-2',
                expectedDate: timestamp('2026-05-11T00:00:00.000Z'),
                createdAt: timestamp('2026-05-05T00:00:00.000Z'),
              },
            },
          ]);
        case 'events':
          return snapshot([
            {
              id: 'event-1',
              data: {
                title: 'Owner meeting',
                startDate: timestamp('2026-05-12T00:00:00.000Z'),
                createdAt: timestamp('2026-05-06T00:00:00.000Z'),
              },
            },
          ]);
        default:
          return snapshot([]);
      }
    });

    const data = await CalendarTimelineService.getTimelineData('user-1');

    expect(data.projects).toEqual([
      { id: 'project-1', name: 'Lake House' },
      { id: 'project-2', name: 'Unnamed Project' },
    ]);
    expect(data.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'task-1', projectName: 'Lake House' }),
      expect.objectContaining({ id: 'payment-1', projectName: 'Unknown Project' }),
      expect.objectContaining({ id: 'delivery-1', projectName: 'Unnamed Project' }),
      expect.objectContaining({ id: 'event-1', projectName: 'General' }),
      expect.objectContaining({ id: 'milestone-project-1-Framing', projectName: 'Lake House' }),
    ]));
    expect((getDocs as jest.Mock).mock.calls.filter(([queryArg]) => queryArg.base === 'projects')).toHaveLength(1);
  });

  test('normalizes Firestore timestamps, Date instances, and invalid date fallbacks', () => {
    const fallback = new Date('2026-05-01T00:00:00.000Z');

    expect(scheduleDateToDate(timestamp('2026-05-08T00:00:00.000Z')).toISOString()).toBe('2026-05-08T00:00:00.000Z');
    expect(scheduleDateToDate(new Date('2026-05-09T00:00:00.000Z')).toISOString()).toBe('2026-05-09T00:00:00.000Z');
    expect(scheduleDateToDate('not-a-date', fallback)).toBe(fallback);
  });
});
