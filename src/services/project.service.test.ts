jest.mock('../config/firebase', () => ({
  db: {},
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
    where: jest.fn((field, op, value) => ({ field, op, value })),
  };
});

import { getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ProjectService } from './project';

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
    (Timestamp.fromDate as jest.Mock).mockImplementation((date: Date) => new (Timestamp as any)(date));
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      id: 'project-1',
      data: () => firestoreProject(),
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
});
