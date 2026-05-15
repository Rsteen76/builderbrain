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
    static now = jest.fn(() => new MockTimestamp(new Date('2024-01-01T00:00:00.000Z')));
  }

  return {
    addDoc: jest.fn(),
    collection: jest.fn((_db, path) => `collection:${path}`),
    deleteDoc: jest.fn(),
    doc: jest.fn((_collectionRef, id) => `doc:${id}`),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn((base, ...constraints) => ({ base, constraints })),
    startAfter: jest.fn(),
    Timestamp: MockTimestamp,
    updateDoc: jest.fn(),
    where: jest.fn((field, op, value) => ({ field, op, value })),
  };
});

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ProjectService } from './project.service';
import { Project } from '../types';

const mockTimestamp = (date: Date) => new (Timestamp as any)(date);

const createProject = (overrides: Partial<Omit<Project, 'id'>> = {}): Omit<Project, 'id'> => {
  const project: Omit<Project, 'id'> = {
    userId: 'user-1',
    name: 'Kitchen Remodel',
    description: 'Cabinets and counters',
    status: 'active',
    priority: 'high',
    clientId: 'client-1',
    contractorId: 'contractor-1',
    startDate: new Date('2024-02-01T00:00:00.000Z'),
    endDate: new Date('2024-03-01T00:00:00.000Z'),
    budget: {
      total: 50000,
      spent: 12000,
      remaining: 38000,
    },
    actualCost: 12000,
    location: {
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
    },
    createdAt: new Date('2024-01-15T00:00:00.000Z'),
    updatedAt: new Date('2024-01-20T00:00:00.000Z'),
    team: ['lead-1'],
    projectType: 'residential',
    estimatedDuration: '4 weeks',
    progress: 0,
    phases: [
      {
        id: 'phase-1',
        projectId: 'project-1',
        name: 'Demo',
        status: 'not_started',
        progress: 0,
        budget: 5000,
        actualCost: 0,
        startDate: new Date('2024-02-01T00:00:00.000Z'),
        endDate: '2024-02-07T00:00:00.000Z' as unknown as Date,
        tasks: [
          {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Remove cabinets',
            description: 'Demo existing cabinets',
            status: 'todo',
            priority: 'medium',
            dueDate: new Date('2024-02-03T00:00:00.000Z'),
            createdAt: new Date('2024-01-15T00:00:00.000Z'),
            updatedAt: new Date('2024-01-16T00:00:00.000Z'),
            userId: 'user-1',
            assigneeId: 'lead-1',
            createdBy: 'user-1',
          },
        ],
      },
    ],
    keyMilestones: [
      {
        name: 'Rough inspection',
        date: '2024-02-15T00:00:00.000Z' as unknown as Date,
        description: 'City inspection',
      },
    ],
    requirements: {
      permits: ['building'],
      inspections: ['rough'],
      documents: ['contract'],
    },
  };

  return { ...project, ...overrides };
};

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockImplementation((_db, path) => `collection:${path}`);
    (doc as jest.Mock).mockImplementation((_collectionRef, id) => `doc:${id}`);
    (Timestamp.fromDate as jest.Mock).mockImplementation((date: Date) => mockTimestamp(date));
    (Timestamp.now as jest.Mock).mockImplementation(() => mockTimestamp(new Date('2024-01-01T00:00:00.000Z')));
    service = new ProjectService();
  });

  test('creates projects with Firestore-safe budget, location, and date values', async () => {
    (addDoc as jest.Mock).mockResolvedValue({ id: 'project-1' });

    const input = createProject({
      clientId: undefined,
      contractorId: undefined,
    });
    const result = await service.create(input);

    expect(addDoc).toHaveBeenCalledWith('collection:projects', expect.objectContaining({
      userId: 'user-1',
      name: 'Kitchen Remodel',
      budget: 50000,
      location: '123 Main St, Austin, TX 78701',
    }));

    const firestoreProject = (addDoc as jest.Mock).mock.calls[0][1];
    expect(firestoreProject.startDate.toDate()).toEqual(input.startDate);
    expect(firestoreProject.endDate.toDate()).toEqual(input.endDate);
    expect(firestoreProject.createdAt.toDate()).toEqual(input.createdAt);
    expect(firestoreProject.updatedAt.toDate()).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(firestoreProject.phases[0].startDate.toDate()).toEqual(input.phases?.[0].startDate);
    expect(firestoreProject.phases[0].endDate.toDate()).toEqual(new Date('2024-02-07T00:00:00.000Z'));
    expect(firestoreProject.keyMilestones[0].date.toDate()).toEqual(new Date('2024-02-15T00:00:00.000Z'));
    expect(firestoreProject).not.toHaveProperty('clientId');
    expect(firestoreProject).not.toHaveProperty('contractorId');

    expect(result).toEqual({
      data: expect.objectContaining({ id: 'project-1', name: 'Kitchen Remodel' }),
      status: 'success',
    });
  });

  test('reads a project by id and converts Firestore timestamps back to Dates', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      id: 'project-1',
      exists: () => true,
      data: () => ({
        userId: 'user-1',
        name: 'Kitchen Remodel',
        description: 'Cabinets and counters',
        status: 'active',
        priority: 'high',
        startDate: mockTimestamp(new Date('2024-02-01T00:00:00.000Z')),
        endDate: mockTimestamp(new Date('2024-03-01T00:00:00.000Z')),
        createdAt: mockTimestamp(new Date('2024-01-15T00:00:00.000Z')),
        updatedAt: mockTimestamp(new Date('2024-01-20T00:00:00.000Z')),
        budget: 50000,
        actualCost: 12000,
        location: '123 Main St, Austin, TX 78701',
        phases: [
          {
            id: 'phase-1',
            name: 'Demo',
            startDate: mockTimestamp(new Date('2024-02-01T00:00:00.000Z')),
            endDate: mockTimestamp(new Date('2024-02-07T00:00:00.000Z')),
            tasks: [
              {
                id: 'task-1',
                title: 'Remove cabinets',
                dueDate: mockTimestamp(new Date('2024-02-03T00:00:00.000Z')),
                createdAt: mockTimestamp(new Date('2024-01-15T00:00:00.000Z')),
                updatedAt: mockTimestamp(new Date('2024-01-16T00:00:00.000Z')),
              },
            ],
          },
        ],
        keyMilestones: [
          {
            name: 'Rough inspection',
            date: mockTimestamp(new Date('2024-02-15T00:00:00.000Z')),
            description: 'City inspection',
          },
        ],
      }),
    });

    const result = await service.getById('project-1');

    expect(doc).toHaveBeenCalledWith('collection:projects', 'project-1');
    expect(result.status).toBe('success');
    expect(result.data).toEqual(expect.objectContaining({
      id: 'project-1',
      budget: { total: 50000, spent: 12000, remaining: 38000 },
      location: {
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
      },
      startDate: new Date('2024-02-01T00:00:00.000Z'),
      endDate: new Date('2024-03-01T00:00:00.000Z'),
    }));
    expect(result.data?.phases?.[0].startDate).toEqual(new Date('2024-02-01T00:00:00.000Z'));
    expect(result.data?.phases?.[0].tasks?.[0].dueDate).toEqual(new Date('2024-02-03T00:00:00.000Z'));
    expect(result.data?.keyMilestones?.[0].date).toEqual(new Date('2024-02-15T00:00:00.000Z'));
  });

  test('updates projects through the converter and document reference', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await service.update('project-1', {
      name: 'Updated Kitchen',
      startDate: new Date('2024-04-01T00:00:00.000Z'),
      budget: 65000,
      location: '456 Oak Ave',
    });

    expect(doc).toHaveBeenCalledWith('collection:projects', 'project-1');
    expect(updateDoc).toHaveBeenCalledWith('doc:project-1', expect.objectContaining({
      name: 'Updated Kitchen',
      budget: 65000,
      location: '456 Oak Ave',
    }));
    expect((updateDoc as jest.Mock).mock.calls[0][1].startDate.toDate()).toEqual(new Date('2024-04-01T00:00:00.000Z'));
    expect(result).toEqual({ status: 'success' });
  });

  test('deletes projects by id', async () => {
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await expect(service.delete('project-1')).resolves.toEqual({
      data: true,
      status: 'success',
    });
    expect(deleteDoc).toHaveBeenCalledWith('doc:project-1');
  });

  test('queries projects by user and optional filters', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (callback: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
        callback({
          id: 'project-1',
          data: () => ({
            userId: 'user-1',
            name: 'Kitchen Remodel',
            description: 'Cabinets and counters',
            status: 'active',
            startDate: mockTimestamp(new Date('2024-02-01T00:00:00.000Z')),
            createdAt: mockTimestamp(new Date('2024-01-15T00:00:00.000Z')),
            updatedAt: mockTimestamp(new Date('2024-01-20T00:00:00.000Z')),
            budget: 50000,
            location: '123 Main St, Austin, TX 78701',
          }),
        });
      },
    });

    const result = await service.getProjectsByUser('user-1', {
      status: 'active',
      clientId: 'client-1',
    });

    expect(where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(where).toHaveBeenCalledWith('status', '==', 'active');
    expect(where).toHaveBeenCalledWith('clientId', '==', 'client-1');
    expect(result).toEqual({
      data: [expect.objectContaining({ id: 'project-1', name: 'Kitchen Remodel' })],
      status: 'success',
    });
  });
});
