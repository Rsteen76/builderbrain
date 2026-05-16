jest.mock('../config/firebase', () => ({
  db: {},
  storage: {},
}));

jest.mock('../config/devMode', () => ({
  isDevAuthBypassEnabled: false,
}));

jest.mock('./devDataStore', () => ({
  createDevProject: jest.fn(),
  deleteDevProject: jest.fn(),
  getDevProjectById: jest.fn(),
  listDevProjects: jest.fn(),
  updateDevProject: jest.fn(),
}));

jest.mock('./storage', () => ({
  StorageService: {
    deleteProjectFiles: jest.fn(),
  },
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
    addDoc: jest.fn(),
    collection: jest.fn((_db, path) => `collection:${path}`),
    deleteDoc: jest.fn(),
    doc: jest.fn((_collectionRef, id) => `doc:${id}`),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn((base, ...constraints) => ({ base, constraints })),
    Timestamp: MockTimestamp,
    updateDoc: jest.fn(),
    writeBatch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn(),
    })),
    where: jest.fn((field, op, value) => ({ field, op, value })),
  };
});

import { addDoc, collection, doc, getDoc, getDocs, query, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { ProjectService } from './project';
import { StorageService } from './storage';

const timestamp = (date: string) => new (Timestamp as any)(new Date(date));

const firestoreProject = (userId = 'user-1') => ({
  userId,
  name: 'Kitchen Remodel',
  description: 'Cabinets',
  status: 'active',
  budget: { total: 1000, spent: 100, remaining: 900 },
  location: { address: '123 Main', city: 'Austin', state: 'TX', zipCode: '78701' },
  startDate: timestamp('2024-01-01T00:00:00.000Z'),
  endDate: timestamp('2024-02-01T00:00:00.000Z'),
  createdAt: timestamp('2024-01-01T00:00:00.000Z'),
  updatedAt: timestamp('2024-01-02T00:00:00.000Z'),
  lineItems: [{ id: 'line-1', description: 'Demo', quantity: 1, unit: 'ea', unitPrice: 500, total: 500 }],
  bids: [{ id: 'bid-1' }],
  tasks: [{ id: 'task-1', title: 'Demo' }],
  team: ['lead-1'],
  keyMilestones: [{ name: 'Start', date: new Date('2024-01-01T00:00:00.000Z'), description: 'Kickoff' }],
  projections: [{ id: 'projection-1', amount: 250 }],
  phases: [{ id: 'phase-1', name: 'Demo', startDate: timestamp('2024-01-01T00:00:00.000Z'), endDate: timestamp('2024-01-07T00:00:00.000Z') }],
  progress: 40,
});

describe('legacy ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockImplementation((_db, path) => `collection:${path}`);
    (doc as jest.Mock).mockImplementation((_collectionRef, id) => `doc:${id}`);
    (query as jest.Mock).mockImplementation((base, ...constraints) => ({ base, constraints }));
    (where as jest.Mock).mockImplementation((field, op, value) => ({ field, op, value }));
    (Timestamp.fromDate as jest.Mock).mockImplementation((date: Date) => new (Timestamp as any)(date));
    (writeBatch as jest.Mock).mockImplementation(() => ({
      delete: jest.fn(),
      commit: jest.fn(),
    }));
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: 'project-1',
      data: () => firestoreProject(),
    });
    (addDoc as jest.Mock).mockResolvedValue({ id: 'project-1' });
  });

  test('createProject strips undefined optional fields before writing to Firestore', async () => {
    await ProjectService.createProject('user-1', {
      name: 'Kitchen Remodel',
      clientId: undefined,
      endDate: undefined,
      location: {
        address: '123 Main',
        city: undefined as unknown as string,
        state: 'TX',
        zipCode: '78701',
      },
    });

    expect(addDoc).toHaveBeenCalledTimes(1);
    const createPayload = (addDoc as jest.Mock).mock.calls[0][1];

    expect(createPayload).not.toHaveProperty('clientId');
    expect(createPayload).not.toHaveProperty('endDate');
    expect(createPayload.location).toEqual({
      address: '123 Main',
      state: 'TX',
      zipCode: '78701',
    });
  });

  test('partial project updates do not overwrite arrays, status, or progress with defaults', async () => {
    await ProjectService.updateProject('project-1', { name: 'Updated Name' });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updatePayload = (updateDoc as jest.Mock).mock.calls[0][1];

    expect(updatePayload).toMatchObject({ name: 'Updated Name' });
    expect(updatePayload.updatedAt).toBeInstanceOf(Timestamp);
    expect(updatePayload).not.toHaveProperty('lineItems');
    expect(updatePayload).not.toHaveProperty('bids');
    expect(updatePayload).not.toHaveProperty('tasks');
    expect(updatePayload).not.toHaveProperty('team');
    expect(updatePayload).not.toHaveProperty('keyMilestones');
    expect(updatePayload).not.toHaveProperty('projections');
    expect(updatePayload).not.toHaveProperty('phases');
    expect(updatePayload).not.toHaveProperty('status');
    expect(updatePayload).not.toHaveProperty('progress');
  });

  test('getProject returns null when the fetched project belongs to a different user', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: 'project-1',
      data: () => firestoreProject('user-2'),
    });

    await expect(ProjectService.getProject('project-1', 'user-1')).resolves.toBeNull();
  });

  test('deleteProject removes owned related docs and project files before project doc', async () => {
    (getDocs as jest.Mock).mockResolvedValue({ docs: [{ ref: 'expense-ref' }, { ref: 'task-ref' }] });

    await ProjectService.deleteProject('project-1');

    expect(StorageService.deleteProjectFiles).toHaveBeenCalledWith('project-1');
    expect(getDocs).toHaveBeenCalledTimes(5);

    const batch = (writeBatch as jest.Mock).mock.results[0].value;
    expect(batch.delete).toHaveBeenCalledWith('expense-ref');
    expect(batch.delete).toHaveBeenCalledWith('task-ref');
    expect(batch.delete.mock.calls[batch.delete.mock.calls.length - 1][0]).toBe('doc:project-1');
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });
});
