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
    static now = jest.fn(() => new MockTimestamp(new Date('2026-05-08T12:00:00.000Z')));
  }

  return {
    doc: jest.fn((_db, collectionName, id) => `doc:${collectionName}:${id}`),
    Timestamp: MockTimestamp,
    updateDoc: jest.fn(),
  };
});

import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import {
  addProjectProjection,
  createBudgetProjection,
  createBudgetProjectionId,
  normalizeBudgetProjection,
  saveProjectProjections,
  serializeBudgetProjection,
  updateProjectBudget,
} from './budget';
import { BudgetProjection } from '../types';

const timestamp = (date: string) => new (Timestamp as any)(new Date(date));

describe('BudgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (doc as jest.Mock).mockImplementation((_db, collectionName, id) => `doc:${collectionName}:${id}`);
    (Timestamp.fromDate as jest.Mock).mockImplementation((date: Date) => new (Timestamp as any)(date));
    (Timestamp.now as jest.Mock).mockImplementation(() => new (Timestamp as any)(new Date('2026-05-08T12:00:00.000Z')));
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  test('creates deterministic projection IDs when clock and random are provided', () => {
    expect(createBudgetProjectionId({ now: () => 12345, random: () => 0.5 })).toBe('projection-12345-i');
  });

  test('creates a projection with centralized defaults', () => {
    const createdAt = new Date('2026-05-08T10:00:00.000Z');

    const projection = createBudgetProjection(
      {
        categoryId: 'framing',
        amount: 5000,
        notes: '',
        userId: 'user-1',
        projectId: 'project-1',
      },
      { now: () => 100, random: () => 0.75, createdAt },
    );

    expect(projection).toEqual({
      id: 'projection-100-r',
      categoryId: 'framing',
      amount: 5000,
      notes: null,
      userId: 'user-1',
      projectId: 'project-1',
      createdAt,
    });
  });

  test('serializes projection createdAt values to Firestore timestamps', () => {
    const date = new Date('2026-05-08T09:30:00.000Z');

    const serialized = serializeBudgetProjection({
      id: 'projection-1',
      categoryId: 'concrete',
      amount: 2500,
      notes: null,
      userId: 'user-1',
      projectId: 'project-1',
      createdAt: date,
    });

    expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    expect(serialized.createdAt).toBeInstanceOf(Timestamp);
  });

  test('keeps existing Firestore timestamps and normalizes them for UI use', () => {
    const createdAt = timestamp('2026-05-08T08:00:00.000Z');
    const projection: BudgetProjection = {
      id: 'projection-1',
      categoryId: 'mep',
      amount: 7000,
      notes: '',
      userId: 'user-1',
      projectId: 'project-1',
      createdAt,
    };

    expect(serializeBudgetProjection(projection).createdAt).toBe(createdAt);
    expect(normalizeBudgetProjection(projection)).toMatchObject({
      id: 'projection-1',
      notes: null,
      createdAt: new Date('2026-05-08T08:00:00.000Z'),
    });
  });

  test('saves project projections through a single update payload', async () => {
    await saveProjectProjections('project-1', [
      {
        id: 'projection-1',
        categoryId: 'framing',
        amount: 1000,
        notes: 'carry forward',
        userId: 'user-1',
        projectId: 'project-1',
        createdAt: new Date('2026-05-08T07:00:00.000Z'),
      },
    ]);

    expect(updateDoc).toHaveBeenCalledWith('doc:projects:project-1', {
      projections: [
        expect.objectContaining({
          id: 'projection-1',
          categoryId: 'framing',
          amount: 1000,
          notes: 'carry forward',
          createdAt: expect.any(Timestamp),
        }),
      ],
    });
  });

  test('adds a project projection and returns the created UI projection', async () => {
    const createdAt = new Date('2026-05-08T06:00:00.000Z');

    const projection = await addProjectProjection(
      'project-1',
      [],
      {
        categoryId: 'finishes',
        amount: 4200,
        notes: null,
        userId: 'user-1',
        projectId: 'project-1',
      },
      { now: () => 200, random: () => 0.25, createdAt },
    );

    expect(projection.id).toBe('projection-200-9');
    expect(projection.createdAt).toBe(createdAt);
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });

  test('updates project budget with updatedAt timestamp', async () => {
    await updateProjectBudget('project-1', 125000);

    expect(updateDoc).toHaveBeenCalledWith('doc:projects:project-1', {
      budget: 125000,
      updatedAt: expect.any(Timestamp),
    });
  });
});
