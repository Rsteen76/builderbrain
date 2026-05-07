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
    where: jest.fn(),
  };
});

import { collection, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { ExpenseService } from './expense.service';

const mockTimestamp = (date: Date) => new (Timestamp as any)(date);

describe('Api ExpenseService', () => {
  let service: ExpenseService;

  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockImplementation((_db, path) => `collection:${path}`);
    (doc as jest.Mock).mockImplementation((_collectionRef, id) => `doc:${id}`);
    (Timestamp.fromDate as jest.Mock).mockImplementation((date: Date) => mockTimestamp(date));
    (Timestamp.now as jest.Mock).mockImplementation(() => mockTimestamp(new Date('2024-01-01T00:00:00.000Z')));
    service = new ExpenseService();
  });

  test('updates only provided expense fields without full-document defaults', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await service.update('expense-1', {
      amount: 325,
      paymentDetails: null,
      notes: undefined,
    });

    expect(doc).toHaveBeenCalledWith('collection:expenses', 'expense-1');
    expect(updateDoc).toHaveBeenCalledTimes(1);

    const updatePayload = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(updatePayload).toEqual({
      amount: 325,
      paymentDetails: null,
      updatedAt: expect.any(Timestamp),
    });
    expect(updatePayload).not.toHaveProperty('userId');
    expect(updatePayload).not.toHaveProperty('projectId');
    expect(updatePayload).not.toHaveProperty('date');
    expect(updatePayload).not.toHaveProperty('createdAt');
    expect(updatePayload).not.toHaveProperty('notes');
    expect(result).toEqual({ status: 'success' });
  });

  test('converts provided expense patch dates without inventing omitted dates', async () => {
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    await service.update('expense-1', {
      date: new Date('2024-03-15T00:00:00.000Z'),
      dueDate: '2024-04-01T00:00:00.000Z',
    });

    const updatePayload = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(updatePayload.date.toDate()).toEqual(new Date('2024-03-15T00:00:00.000Z'));
    expect(updatePayload.dueDate.toDate()).toEqual(new Date('2024-04-01T00:00:00.000Z'));
    expect(updatePayload.updatedAt.toDate()).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(updatePayload).not.toHaveProperty('createdAt');
  });
});
